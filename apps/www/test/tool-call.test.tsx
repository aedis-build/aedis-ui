import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";

import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { REDACTED, redact, redactText } from "@/registry/aedis/lib/redact";
import { Reasoning } from "@/registry/aedis/ui/reasoning";
import { ToolCall } from "@/registry/aedis/ui/tool-call";
import { violations } from "./a11y";

const SECRET = fc.stringMatching(/^[A-Za-z0-9]{16,24}$/);
const secretKey = fc.constantFrom("password", "apiKey", "api_key", "Authorization", "accessToken", "client-secret", "Cookie", "sessionId", "PRIVATE_KEY");

describe("redact", () => {
  it("hides values under secret keys, at any depth, without touching the input", () => {
    const input = { user: "ana", auth: { password: "hunter2", nested: [{ apiKey: "k-123" }] }, author: "kept" };
    expect(redact(input)).toEqual({ user: "ana", auth: { password: REDACTED, nested: [{ apiKey: REDACTED }] }, author: "kept" });
    expect(input.auth.password).toBe("hunter2");
  });

  it("never lets a secret under a secret key through (property)", () => {
    fc.assert(
      fc.property(fc.jsonValue({ maxDepth: 3 }), secretKey, SECRET, fc.nat({ max: 5 }), (noise, key, secret, depth) => {
        let planted: unknown = { [key]: secret };
        for (let i = 0; i < depth; i++) planted = { level: planted, noise };
        expect(JSON.stringify(redact({ noise, planted }))).not.toContain(secret);
      }),
    );
  });

  it("finds secrets inside text: bearer tokens, JWTs and key=value pairs (property)", () => {
    fc.assert(
      fc.property(SECRET, fc.constantFrom("Bearer ", "token=", "password: ", "api_key=\"", "Authorization: Basic "), fc.string(), (secret, prefix, around) => {
        const text = `${around.replace(/[A-Za-z0-9]/g, "")} ${prefix}${secret} ${around.replace(/[A-Za-z0-9]/g, "")}`;
        expect(redactText(text)).not.toContain(secret);
      }),
    );
    expect(redactText("jwt eyJhbGciOiJIUzI1.eyJzdWIiOiIxMjM0.SflKxwRJSMeKKF2QT4f done")).toBe("jwt [redacted] done");
    expect(redactText("plain text stays")).toBe("plain text stays");
  });

  it("bounds strings, arrays, objects, depth and cycles", () => {
    const cyclic: Record<string, unknown> = { a: 1 };
    cyclic.self = cyclic;
    expect(redact(cyclic)).toEqual({ a: 1, self: "[circular]" });
    expect(redact("x".repeat(30), { maxString: 10 })).toBe("xxxxxxxxxx… (20 more)");
    expect(redact([1, 2, 3, 4], { maxItems: 2 })).toEqual([1, 2, "… 2 more"]);
    expect(redact({ a: 1, b: 2, c: 3 }, { maxItems: 2 })).toEqual({ a: 1, b: 2, "…": "1 more" });
    expect(redact({ a: { b: { c: 1 } } }, { maxDepth: 2 })).toEqual({ a: { b: "[…]" } });
    expect(redact({ when: new Date(0), big: 10n, fn: () => 1 })).toEqual({ when: "1970-01-01T00:00:00.000Z", big: "10n", fn: "[function]" });
    expect(redact({ custom: "x", other: "y" }, { keys: ["custom"] })).toEqual({ custom: REDACTED, other: "y" });
  });
});

describe("ToolCall", () => {
  it("shows name, status and redacted arguments and result as text", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ToolCall name="crm.lookup" status="done" args={{ email: "a@b.com", token: "tok_live_123456789" }} result={{ html: "<img src=x onerror=alert(1)>", note: "Bearer abcdefghijklmnop" }} />,
    );
    expect(screen.getByText("crm.lookup")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /crm\.lookup/ }));
    await waitFor(() => expect(container.textContent).toContain("Arguments"));
    expect(container.textContent).not.toContain("tok_live_123456789");
    expect(container.textContent).not.toContain("abcdefghijklmnop");
    expect(container.textContent).toContain(REDACTED);
    expect(container.querySelector("img")).toBeNull();
  });

  it("shows a running spinner and errors", () => {
    const { rerender } = render(<ToolCall name="search" status="running" />);
    expect(screen.getByRole("status")).toHaveTextContent("Running");
    rerender(<ToolCall name="search" status="error" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("sends an external tool through an ApprovalCard while it waits", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn().mockResolvedValue(null);
    render(
      <ToolCall
        name="email.send"
        status="awaiting-approval"
        external
        args={{ to: "client@acme.com", body: "``` break out", password: "x" }}
        approval={{ requester: "Avalo", onApprove, onRequestChanges: vi.fn() }}
      />,
    );
    expect(screen.getByText("acts outside")).toBeInTheDocument();
    const card = document.querySelector("[data-slot=approval-card]")!;
    expect(card).toHaveTextContent("email.send wants to run with these arguments.");
    expect(card.textContent).toContain('"to": "client@acme.com"');
    expect(card.textContent).not.toContain('"password": "x"');
    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(await screen.findByRole("button", { name: "Approve" }));
    await waitFor(() => expect(onApprove).toHaveBeenCalledOnce());
  });

  it("says it is waiting when no approval handler is wired, and reads labels from the locale", async () => {
    const { container } = render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <ToolCall name="pay" status="awaiting-approval" external />
      </LocaleProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Aguardando uma pessoa aprovar.");
    expect(screen.getByText("Aguardando aprovação")).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });
});

describe("Reasoning", () => {
  it("starts collapsed, redacts and expands on request", async () => {
    const user = userEvent.setup();
    render(<Reasoning durationMs={4200}>{"I will call the API with api_key=sk_live_abcdefghijk and summarize."}</Reasoning>);
    const trigger = screen.getByRole("button", { name: /Thought for 4 s/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(document.body.textContent).not.toContain("sk_live_abcdefghijk");
    expect(document.body.textContent).toContain(REDACTED);
  });

  it("pulses while thinking, statically under reduced motion", () => {
    const { rerender } = render(<Reasoning streaming>{"…"}</Reasoning>);
    const label = screen.getByText("Thinking…");
    expect(label.className).toContain("animate-pulse");
    expect(label.className).toContain("motion-reduce:animate-none");
    rerender(<Reasoning>{"done"}</Reasoning>);
    expect(screen.getByText("Reasoning")).toBeInTheDocument();
  });
});
