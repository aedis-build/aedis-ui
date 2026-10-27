import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Chat, type ChatMessage } from "@/registry/aedis/ui/chat";

// Counts markdown parses: with 150 messages, every keystroke used to parse all of them again (#155).
const parses = vi.hoisted(() => ({ count: 0 }));
vi.mock("react-markdown", async (actual) => {
  const real = (await actual<typeof import("react-markdown")>()).default;
  return {
    default: (props: Parameters<typeof real>[0]) => {
      parses.count++;
      return real(props);
    },
  };
});

const history: ChatMessage[] = Array.from({ length: 150 }, (_, i) => ({ id: i, author: "Rafael", role: "agent", content: `Answer **${i}**` }));

describe("Chat with a long history", () => {
  it("does not parse any message again while the person types, or when one message is added", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Chat messages={history} onSend={vi.fn()} />);
    expect(parses.count).toBe(150);
    await user.type(screen.getByRole("textbox", { name: "Message" }), "a long question");
    expect(parses.count).toBe(150);
    rerender(<Chat messages={[...history, { id: 150, author: "Rafael", role: "agent", content: "New" }]} onSend={vi.fn()} />);
    expect(parses.count).toBe(151);
  });
});
