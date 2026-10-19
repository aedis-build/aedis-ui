import { render, screen } from "@testing-library/react";
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
    await user.click(submit);
    expect(onAnswer).toHaveBeenLastCalledWith("No, wait 12 months", "once");

    await user.click(screen.getByRole("radio", { name: "Always" }));
    expect(screen.getByText(/lasting rule/)).toBeInTheDocument();
    await user.click(submit);
    expect(onAnswer).toHaveBeenLastCalledWith("No, wait 12 months", "always");
  });

  it("renders the question as plain text", () => {
    render(<HandRaise agent="Otto" question="**not markdown**" onAnswer={vi.fn()} />);
    expect(screen.getByText("**not markdown**")).toBeInTheDocument();
  });
});
