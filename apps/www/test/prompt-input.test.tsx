import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";

import { hasInvisible } from "@/lib/untrusted";
import { checkAttachment, safeFileName, uploadAttachment } from "@/registry/aedis/lib/attachment";
import { PromptInput } from "@/registry/aedis/ui/prompt-input";
import { violations } from "./a11y";

class FakeXhr {
  static last: FakeXhr[] = [];
  method = "";
  url = "";
  headers: Record<string, string> = {};
  status = 0;
  response: unknown = null;
  responseURL = "";
  responseType = "";
  timeout = 0;
  body: FormData | null = null;
  upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  constructor() {
    FakeXhr.last.push(this);
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(k: string, v: string) {
    this.headers[k] = v;
  }
  send(body: FormData) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
  }
  progress(loaded: number, total: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total });
  }
  respond(status: number, response: unknown, path = this.url) {
    this.status = status;
    this.response = response;
    this.responseURL = `http://localhost:3000${path}`;
    this.onload?.();
  }
}

beforeEach(() => {
  FakeXhr.last = [];
  vi.stubGlobal("XMLHttpRequest", FakeXhr);
});
afterEach(() => vi.unstubAllGlobals());

const rules = { accept: ["image/png", ".csv", "application/pdf"], maxBytes: 1000 };
const file = (name: string, size: number, type: string) => new File(["x".repeat(size)], name, { type });

describe("attachment", () => {
  it("allows only listed types and sizes, never SVG through a wildcard", () => {
    expect(checkAttachment(file("a.png", 10, "image/png"), rules)).toBeNull();
    expect(checkAttachment(file("a.csv", 10, "text/plain"), rules)).toBeNull();
    expect(checkAttachment(file("a.exe", 10, "application/x-msdownload"), rules)).toBe("type");
    expect(checkAttachment(file("a.png", 2000, "image/png"), rules)).toBe("size");
    expect(checkAttachment(file("a.png", 0, "image/png"), rules)).toBe("empty");
    expect(checkAttachment(file("a.svg", 10, "image/svg+xml"), { accept: ["image/*"], maxBytes: 100 })).toBe("type");
    expect(checkAttachment(file("a.jpg", 10, "image/jpeg"), { accept: ["image/*"], maxBytes: 100 })).toBeNull();
  });

  it("cleans file names of bidi tricks and control characters (property)", () => {
    expect(safeFileName("invoice\u202Efdp.exe")).toBe("invoicefdp.exe");
    expect(safeFileName("\u0000\u0007")).toBe("file");
    expect(safeFileName(`${"a".repeat(200)}.pdf`, 20)).toBe(`${"a".repeat(15)}….pdf`);
    fc.assert(fc.property(fc.string({ unit: "binary" }), (name) => {
      const safe = safeFileName(name);
      expect(hasInvisible(safe)).toBe(false);
      expect(/[\u0000-\u001F\u007F]/.test(safe)).toBe(false);
      expect(safe.length).toBeLessThanOrEqual(120);
    }));
  });

  it("uploads same-origin with the custom header, reports progress and refuses redirects", async () => {
    const onProgress = vi.fn();
    const done = uploadAttachment("/api/files", file("a.png", 5, "image/png"), { onProgress });
    const xhr = FakeXhr.last[0];
    expect(xhr.method).toBe("POST");
    expect(xhr.headers["X-Requested-With"]).toBe("XMLHttpRequest");
    xhr.progress(5, 10);
    expect(onProgress).toHaveBeenCalledWith(0.5);
    xhr.respond(201, { id: "f1" });
    await expect(done).resolves.toEqual({ id: "f1" });

    const redirected = uploadAttachment("/api/files", file("a.png", 5, "image/png"));
    FakeXhr.last[1].respond(200, { id: "x" }, "/login");
    await expect(redirected).rejects.toThrow(/status 200/);
    await expect(uploadAttachment("https://evil.example/u", file("a.png", 5, "image/png"))).rejects.toThrow(/relative/);
    const failed = uploadAttachment("/api/files", file("a.png", 5, "image/png"));
    FakeXhr.last[2].onerror?.();
    await expect(failed).rejects.toThrow(/Upload failed/);
  });
});

describe("PromptInput", () => {
  it("sends trimmed text without hidden characters on Enter, keeps Shift+Enter for new lines", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<PromptInput onSend={onSend} />);
    const box = screen.getByRole("textbox", { name: "Message" });
    expect(box).toHaveAttribute("maxlength", "8000");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await user.type(box, "  Hi\u200B there{Shift>}{Enter}{/Shift}line two  ");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(onSend).toHaveBeenCalledOnce());
    expect(onSend.mock.calls[0][0]).toEqual({ text: "Hi there\nline two", attachments: [], model: undefined });
    expect(box).toHaveValue("");
  });

  it("turns send into stop while the answer streams, and stop aborts", async () => {
    const user = userEvent.setup();
    let signal: AbortSignal | undefined;
    const onSend = vi.fn((_m, ctx: { signal: AbortSignal }) => new Promise<void>((resolve) => {
      signal = ctx.signal;
      ctx.signal.addEventListener("abort", () => resolve());
    }));
    render(<PromptInput onSend={onSend} />);
    await user.type(screen.getByRole("textbox"), "Draft the proposal");
    await user.click(screen.getByRole("button", { name: "Send" }));
    const stop = await screen.findByRole("button", { name: "Stop" });
    expect(stop.className).toContain("motion-reduce:transition-none");
    await user.click(stop);
    expect(signal?.aborted).toBe(true);
    expect(await screen.findByRole("button", { name: "Send" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the draft and says so when sending fails", async () => {
    const user = userEvent.setup();
    render(<PromptInput onSend={vi.fn().mockRejectedValue(new Error("500: stack trace"))} />);
    await user.type(screen.getByRole("textbox"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The message could not be sent. Try again.");
    expect(screen.getByRole("alert").textContent).not.toContain("stack");
    expect(screen.getByRole("textbox")).toHaveValue("Hello");
  });

  it("checks attachments, shows clean names and progress, and sends their ids", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<PromptInput onSend={onSend} attachments={{ ...rules, uploadPath: "/api/files", maxFiles: 2 }} />);
    const picker = container.querySelector<HTMLInputElement>("[data-slot=prompt-input-file]")!;
    expect(picker).toHaveAttribute("accept", "image/png,.csv,application/pdf");

    fireEvent.change(picker, { target: { files: [file("virus.exe", 10, "application/x-msdownload")] } });
    expect(screen.getByRole("alert")).toHaveTextContent("virus.exe: this type of file is not allowed.");
    fireEvent.change(picker, { target: { files: [file("big.png", 5000, "image/png")] } });
    expect(screen.getByRole("alert")).toHaveTextContent("big.png is larger than");

    fireEvent.change(picker, { target: { files: [file("report\u202Efdp.png", 10, "image/png")] } });
    expect(screen.getByText("reportfdp.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    act(() => FakeXhr.last[0].progress(5, 10));
    expect(screen.getByRole("progressbar", { name: "Uploading reportfdp.png" })).toHaveAttribute("aria-valuenow", "50");
    act(() => FakeXhr.last[0].respond(201, { id: "file-1" }));
    await user.click(await screen.findByRole("button", { name: "Send" }));
    await waitFor(() => expect(onSend).toHaveBeenCalledOnce());
    expect(onSend.mock.calls[0][0].attachments).toEqual([{ id: "file-1", name: "reportfdp.png" }]);

    fireEvent.change(picker, { target: { files: [file("a.png", 1, "image/png"), file("b.png", 1, "image/png"), file("c.png", 1, "image/png")] } });
    expect(screen.getByRole("alert")).toHaveTextContent("Attach at most 2 files.");
    await user.click(screen.getByRole("button", { name: "Remove a.png" }));
    expect(screen.queryByText("a.png")).toBeNull();
  });

  it("reports a failed upload and offers a model picker, without accessibility violations", async () => {
    const onModelChange = vi.fn();
    const { container } = render(
      <PromptInput
        onSend={vi.fn()}
        attachments={{ ...rules, uploadPath: "/api/files" }}
        models={[{ value: "fast", label: "Fast" }, { value: "deep", label: "Deep" }]}
        model="fast"
        onModelChange={onModelChange}
      />,
    );
    fireEvent.change(container.querySelector("[data-slot=prompt-input-file]")!, { target: { files: [file("a.png", 1, "image/png")] } });
    act(() => FakeXhr.last[0].respond(500, null));
    expect(await screen.findByRole("alert")).toHaveTextContent("a.png could not be uploaded. Try again.");
    fireEvent.change(screen.getByRole("combobox", { name: "Model" }), { target: { value: "deep" } });
    expect(onModelChange).toHaveBeenCalledWith("deep");
    expect(await violations(container)).toEqual([]);
  });
});
