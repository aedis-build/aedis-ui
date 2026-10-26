import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Chat } from "@/registry/aedis/ui/chat";
import { Markdown, safeUrl } from "@/registry/aedis/ui/markdown";

describe("Markdown", () => {
  it("drops raw HTML and unsafe links", () => {
    const { container } = render(
      <Markdown>{"<img src=x onerror=alert(1)><script>alert(1)</script> [bad](javascript:alert(1)) [ok](https://example.com)"}</Markdown>,
    );
    expect(container.querySelector("img, script")).toBeNull();
    expect(screen.queryByRole("link", { name: "bad" })).toBeNull();
    expect(screen.getByText("bad")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ok" })).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows a fence as a code block with a copy button, inside its own scroller", () => {
    const { container } = render(<Markdown>{"Run:\n\n```bash\ncurl https://example.com/a/very/long/path\n```"}</Markdown>);
    const block = container.querySelector("[data-slot=code-block]")!;
    expect(block).toHaveTextContent("curl https://example.com/a/very/long/path");
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
    expect(block.querySelector("pre")!.className).toContain("overflow-x-auto");
  });

  it("blocks images unless allowed", () => {
    const { container, rerender } = render(<Markdown>{"![chart](https://example.com/c.png)"}</Markdown>);
    expect(container.querySelector("img")).toBeNull();
    rerender(<Markdown allowImages>{"![chart](https://example.com/c.png)"}</Markdown>);
    expect(container.querySelector("img")).not.toBeNull();
  });

  it.each([
    ["https://a.com/x", "https://a.com/x"],
    ["mailto:a@b.com", "mailto:a@b.com"],
    ["/relative", "/relative"],
    ["javascript:alert(1)", ""],
    [" JAVASCRIPT:alert(1)", ""],
    ["data:text/html,<b>", ""],
  ])("safeUrl(%s)", (input, expected) => expect(safeUrl(input)).toBe(expected));
});

describe("Chat", () => {
  it("sends with Enter, keeps the draft and announces when sending fails", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
    render(<Chat messages={[]} onSend={onSend} />);
    const box = screen.getByRole("textbox", { name: "Message" });

    await user.type(box, "hello{Enter}");
    expect(onSend).toHaveBeenCalledWith("hello");
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be sent");
    expect(box).toHaveValue("hello");

    await user.type(box, "{Enter}");
    expect(box).toHaveValue("");
  });

  it("clears on send, keeps what is typed meanwhile, and puts the text back ahead of it on failure (#155)", async () => {
    const user = userEvent.setup();
    let fail = (_e: Error) => {};
    render(<Chat messages={[]} onSend={() => new Promise<void>((_r, reject) => (fail = reject))} />);
    const box = screen.getByRole("textbox", { name: "Message" });
    await user.type(box, "first");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(box).toHaveValue("");
    // The Send button disables once the draft is empty: the focus goes to the input, not to the page.
    expect(box).toHaveFocus();
    await user.type(box, "second");
    await act(async () => fail(new Error("offline")));
    expect(box).toHaveValue("first\nsecond");
    expect(screen.getByRole("alert")).toHaveTextContent("could not be sent");
  });

  it("says when a paste was cut to the limit, and counts near it", async () => {
    const user = userEvent.setup();
    render(<Chat messages={[]} maxLength={10} onSend={vi.fn()} />);
    await user.click(screen.getByRole("textbox", { name: "Message" }));
    await user.paste("0123456789abc");
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("0123456789");
    expect(screen.getByRole("status")).toHaveTextContent("Only the first 10 characters fit");
    expect(screen.getByText("10/10")).toBeVisible();
  });

  it("strips hidden code points from what is sent and from what is shown", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<Chat messages={[{ id: 1, author: "Jordan", role: "person", content: "see\u200B\u{E0041}n" }]} onSend={onSend} />);
    expect(screen.getByText("seen")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Message" }), "hi\u202E there{Enter}");
    expect(onSend).toHaveBeenCalledWith("hi there");
  });

  it("renders agent messages as markdown and people's messages as plain text", () => {
    render(
      <Chat
        onSend={vi.fn()}
        messages={[
          { id: 1, author: "Jordan", role: "person", content: "**not bold**" },
          { id: 2, author: "Rafael", role: "agent", content: "**bold**" },
        ]}
      />,
    );
    expect(screen.getByText("**not bold**")).toBeInTheDocument();
    expect(screen.getByText("bold").tagName).toBe("STRONG");
  });
});
