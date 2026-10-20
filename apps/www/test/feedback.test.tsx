import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { Feedback } from "@/registry/aedis/ui/feedback";
import { violations } from "./a11y";

function stubApi(status = 204) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(null, { status });
    }),
  );
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("Feedback", () => {
  it("sends a thumbs up right away through api(), with the message id from the app", async () => {
    const user = userEvent.setup();
    const calls = stubApi();
    render(<Feedback messageId="msg-42" endpoint="/api/feedback" />);
    await user.click(screen.getByRole("button", { name: "Good answer" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Thanks for the feedback.");
    expect(calls[0].url).toBe("/api/feedback");
    expect(calls[0].init).toMatchObject({ method: "POST", credentials: "same-origin", redirect: "error" });
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ messageId: "msg-42", rating: "positive" });
    expect(screen.getByRole("button", { name: "Good answer" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Good answer" })).toBeDisabled();
  });

  it("asks what went wrong after a thumbs down, bounded and without hidden characters", async () => {
    const user = userEvent.setup();
    const calls = stubApi();
    render(<Feedback messageId="msg-7" endpoint="/api/feedback" maxLength={20} />);
    await user.click(screen.getByRole("button", { name: "Bad answer" }));
    const box = screen.getByRole("textbox", { name: "What went wrong? (optional)" });
    expect(box).toHaveAttribute("maxlength", "20");
    await user.type(box, "  Wrong\u200B budget  ");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Thanks for the feedback.");
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ messageId: "msg-7", rating: "negative", comment: "Wrong budget" });
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("can skip the comment", async () => {
    const user = userEvent.setup();
    const calls = stubApi();
    render(<Feedback messageId="m" endpoint="/api/feedback" />);
    await user.click(screen.getByRole("button", { name: "Bad answer" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ messageId: "m", rating: "negative" });
  });

  it("says when sending failed and lets the person try again", async () => {
    const user = userEvent.setup();
    stubApi(500);
    render(<Feedback messageId="m" endpoint="/api/feedback" />);
    await user.click(screen.getByRole("button", { name: "Good answer" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Feedback could not be sent. Try again.");
    expect(screen.getByRole("button", { name: "Good answer" })).toBeEnabled();
  });

  it("is a labelled group in the reader's language, with a confirmation that does not move under reduced motion", async () => {
    const user = userEvent.setup();
    stubApi();
    const { container } = render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <Feedback messageId="m" endpoint="/api/feedback" />
      </LocaleProvider>,
    );
    expect(screen.getByRole("group", { name: "Avalie esta resposta" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Resposta boa" }));
    const status = await screen.findByText("Obrigado pelo retorno.");
    expect(status.className).toContain("motion-reduce:transition-none");
    expect(await violations(container)).toEqual([]);
  });
});
