import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AgentConsole, type ConsoleTurn } from "@/registry/aedis/blocks/agent-console";
import { ApprovalInbox } from "@/registry/aedis/blocks/approval-inbox";
import { SecureShell } from "@/registry/aedis/blocks/secure-shell";
import { UsageLimits } from "@/registry/aedis/blocks/usage-limits";
import { violations } from "./a11y";

const turns: ConsoleTurn[] = [
  { id: "1", role: "person", text: "<b>Find</b> Ana's plan" },
  {
    id: "2",
    role: "agent",
    text: "Ana is on **Pro**. <img src=x onerror=alert(1)> [docs](javascript:alert(1))",
    tools: [{ id: "t1", name: "crm.lookup", status: "done", args: { email: "ana@acme.com", apiKey: "sk_live_123" }, result: { plan: "Pro" }, defaultOpen: true }],
    sources: [{ title: "CRM record", url: "https://crm.example.com/ana" }],
  },
];

describe("AgentConsole", () => {
  it("shows people's text as text, the agent's answer as safe markdown, redacted tools and real domains", async () => {
    const { container } = render(<AgentConsole title="Sales agent" turns={turns} onSend={async () => {}} />);
    const log = screen.getByRole("log", { name: "Sales agent" });
    expect(within(log).getByText("<b>Find</b> Ana's plan")).toBeInTheDocument();
    expect(within(log).getByText("Pro").tagName).toBe("STRONG");
    expect(container.querySelector("img, a[href^='javascript']")).toBeNull();
    expect(log.textContent).not.toContain("sk_live_123");
    expect(within(log).getByText("crm.example.com")).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });

  it("sends from the prompt input", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn(async () => {});
    render(<AgentConsole title="Sales agent" turns={[]} onSend={onSend} />);
    await user.type(screen.getByRole("textbox"), "Draft the proposal{Enter}");
    expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ text: "Draft the proposal" }), expect.anything());
  });
});

describe("ApprovalInbox", () => {
  const approvals = [
    { id: "a1", requester: "Rafael", requestedAt: "2 min ago", summary: "Proposal for Acme", content: "**4 shoot days** a month." },
    { id: "a2", requester: "Otto", requestedAt: "1 h ago", summary: "Refund for Bistro", content: "Refund $120." },
  ];
  const hands = [{ id: "h1", agent: "Otto", question: "Can we prospect competitors of clients?", tried: null }];

  it("opens the first approval, approves the selected one only after confirming, and answers hands", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn(async () => null);
    const onAnswer = vi.fn(async () => null);
    const { container } = render(<ApprovalInbox approvals={approvals} hands={hands} onApprove={onApprove} onRequestChanges={async () => null} onAnswer={onAnswer} />);
    expect(screen.getByText("4 shoot days").tagName).toBe("STRONG");
    expect(await violations(container)).toEqual([]);

    await user.click(screen.getByRole("button", { name: /Refund for Bistro/ }));
    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(onApprove).not.toHaveBeenCalled();
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(onApprove).toHaveBeenCalledWith("a2"));

    await user.click(screen.getByRole("tab", { name: /Raised hands/ }));
    await user.click(screen.getByRole("button", { name: /Otto/ }));
    await user.type(screen.getByLabelText("Your answer"), "No, never");
    await user.click(screen.getByRole("button", { name: "Answer" }));
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith("h1", "No, never", "once"));
  });

  it("says when nothing is waiting", () => {
    render(<ApprovalInbox approvals={[]} hands={[]} onApprove={async () => null} onRequestChanges={async () => null} onAnswer={async () => null} />);
    expect(screen.getByText("Nothing waiting")).toBeInTheDocument();
  });
});

describe("UsageLimits", () => {
  it("warns near the ceiling, interrupts once paused, and treats a zero ceiling as paused", async () => {
    const { container } = render(
      <UsageLimits
        currency="USD"
        period="Today"
        agents={[
          { id: "1", name: "Sales", spent: 12, ceiling: 40 },
          { id: "2", name: "Support", spent: 34, ceiling: 40 },
          { id: "3", name: "Research", spent: 41, ceiling: 40 },
          { id: "4", name: "Ops", spent: 0, ceiling: 0 },
        ]}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Paused at the ceiling: Research, Ops");
    expect(screen.getByRole("status")).toHaveTextContent("Near the ceiling: Support");
    expect(screen.getByText("Today: $12.00 of $40.00")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Research: share of the ceiling used" })).toHaveAttribute("aria-valuenow", "100");
    expect(await violations(container)).toEqual([]);
  });

  it("shows no alert while every agent is under the warning", () => {
    render(<UsageLimits currency="EUR" period="October" agents={[{ id: "1", name: "Sales", spent: 1, ceiling: 40 }]} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("SecureShell", () => {
  const shell = (session: "active" | "idle" | "expired", onIdle = () => {}) => (
    <SecureShell title="Approvals" sidebar={<nav aria-label="Main">x</nav>} session={session} idleMinutes={15} onIdle={onIdle} signInHref="/sign-in">
      <p>Private numbers</p>
    </SecureShell>
  );

  it("signs out after the idle time and removes the content once the session ends", async () => {
    vi.useFakeTimers();
    try {
      const onIdle = vi.fn();
      const { rerender } = render(shell("active", onIdle));
      expect(screen.getByText("Private numbers")).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(15 * 60_000 + 1000));
      expect(onIdle).toHaveBeenCalledTimes(1);
      rerender(shell("idle", onIdle));
      expect(screen.queryByText("Private numbers")).not.toBeInTheDocument();
      expect(screen.getByText("Signed out for inactivity")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("says when the server ended the session and links to sign in", async () => {
    const { container } = render(shell("expired"));
    expect(screen.getByText("Your session ended")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
    expect(await violations(container)).toEqual([]);
  });
});
