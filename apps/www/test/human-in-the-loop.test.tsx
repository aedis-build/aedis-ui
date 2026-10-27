import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApprovalCard } from "@/registry/aedis/ui/approval-card";
import { HandRaise } from "@/registry/aedis/ui/hand-raise";

describe("ApprovalCard", () => {
  const setup = (overrides: Partial<React.ComponentProps<typeof ApprovalCard>> = {}) => {
    const onApprove = vi.fn().mockResolvedValue(null);
    const onRequestChanges = vi.fn().mockResolvedValue(null);
    render(<ApprovalCard requester="Rafael" content="**Proposal**" onApprove={onApprove} onRequestChanges={onRequestChanges} {...overrides} />);
    return { onApprove, onRequestChanges, user: userEvent.setup() };
  };

  it("approves only after confirming", async () => {
    const { onApprove, user } = setup();
    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(onApprove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onApprove).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(screen.getByRole("alertdialog").querySelector("[data-slot=alert-dialog-action]")!);
    expect(onApprove).toHaveBeenCalledOnce();
  });

  it("approves exactly once on a double-click, then shows the outcome with the focus on it (#156)", async () => {
    let resolve = (_v: string | null) => {};
    const onApprove = vi.fn(() => new Promise<string | null>((r) => (resolve = r)));
    const { user } = setup({ onApprove });
    await user.click(screen.getByRole("button", { name: "Approve" }));
    const confirm = screen.getByRole("alertdialog").querySelector<HTMLElement>("[data-slot=alert-dialog-action]")!;
    await user.dblClick(confirm);
    expect(onApprove).toHaveBeenCalledOnce();
    // While it runs, the trigger says so and cannot open the dialog again.
    const trigger = screen.getByRole("button", { name: "Approve" });
    expect(trigger).toHaveAttribute("aria-busy", "true");
    await user.click(trigger);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await act(async () => resolve(null));
    expect(screen.getByRole("status")).toHaveTextContent("Approved by you");
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    await waitFor(() => expect(screen.getByRole("status")).toHaveFocus());
  });

  it("keeps the actions after a failed approval, so it can be tried again", async () => {
    const onApprove = vi.fn().mockResolvedValue("Already decided.");
    const { user } = setup({ onApprove });
    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(screen.getByRole("alertdialog").querySelector("[data-slot=alert-dialog-action]")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("Already decided.");
    expect(onApprove).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
  });

  it("moves the focus to the reason, back to the button, and to the outcome", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Request changes" }));
    expect(screen.getByRole("textbox", { name: "What should change" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("button", { name: "Request changes" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Request changes" }));
    await user.keyboard("Add the annual option");
    await user.click(screen.getByRole("button", { name: "Request changes" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Changes requested by you:Add the annual option");
    expect(screen.getByRole("status")).toHaveFocus();
  });

  it("requires a reason to request changes", async () => {
    const { onRequestChanges, user } = setup();
    await user.click(screen.getByRole("button", { name: "Request changes" }));
    const send = screen.getByRole("button", { name: "Request changes" });
    expect(send).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "What should change" }), "  add the annual option ");
    await user.click(send);
    expect(onRequestChanges).toHaveBeenCalledWith("add the annual option");
  });

  it("announces the error returned by the handler", async () => {
    const { user } = setup({ onRequestChanges: vi.fn().mockResolvedValue("Already decided.") });
    await user.click(screen.getByRole("button", { name: "Request changes" }));
    await user.type(screen.getByRole("textbox"), "x");
    await user.click(screen.getByRole("button", { name: "Request changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Already decided.");
  });

  it("renders the content as safe markdown", () => {
    const { container } = render(
      <ApprovalCard requester="R" content={"<img src=x onerror=alert(1)> **ok**"} onApprove={vi.fn()} onRequestChanges={vi.fn()} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("ok").tagName).toBe("STRONG");
  });
});

describe("HandRaise", () => {
  it("answers just this case by default and always when chosen", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn().mockResolvedValue(null);
    render(<HandRaise agent="Otto" question="Competitors?" tried="Read the policy" onAnswer={onAnswer} />);

    const submit = screen.getByRole("button", { name: "Answer" });
    expect(submit).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Your answer" }), "No, wait 12 months");
    await user.click(screen.getByRole("radio", { name: "Always" }));
    expect(screen.getByText(/lasting rule/)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Just this case" }));
    await user.click(submit);
    expect(onAnswer).toHaveBeenLastCalledWith("No, wait 12 months", "once");
  });

  it("answers once, then shows what was sent with the focus on it (#156)", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn().mockResolvedValue(null);
    render(<HandRaise agent="Otto" question="Competitors?" onAnswer={onAnswer} />);
    await user.type(screen.getByRole("textbox", { name: "Your answer" }), "No");
    await user.click(screen.getByRole("radio", { name: "Always" }));
    await user.dblClick(screen.getByRole("button", { name: "Answer" }));
    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onAnswer).toHaveBeenLastCalledWith("No", "always");
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Answered by you (Always)No");
    expect(screen.queryByRole("button", { name: "Answer" })).toBeNull();
    await waitFor(() => expect(status).toHaveFocus());
  });

  it("renders the question as plain text", () => {
    render(<HandRaise agent="Otto" question="**not markdown**" onAnswer={vi.fn()} />);
    expect(screen.getByText("**not markdown**")).toBeInTheDocument();
  });
});
