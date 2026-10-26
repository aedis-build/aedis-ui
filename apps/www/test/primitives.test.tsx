import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { components } from "@/content/components";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/aedis/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/registry/aedis/ui/avatar";
import { Button } from "@/registry/aedis/ui/button";
import { Input } from "@/registry/aedis/ui/input";
import { Progress } from "@/registry/aedis/ui/progress";
import { Textarea } from "@/registry/aedis/ui/textarea";
import { violations } from "./a11y";

describe("primitives", () => {
  it("text fields drop hidden code points as they are typed, so they show what is sent (#161)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea aria-label="Reason" onChange={(e) => onChange(e.target.value)} />);
    const box = screen.getByRole("textbox", { name: "Reason" });
    await user.type(box, "pay\u202Eyap");
    expect(box).toHaveValue("payyap");
    expect(onChange).toHaveBeenLastCalledWith("payyap");
  });

  it("text fields keep hidden code points when asked, and say when a paste was cut", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Input aria-label="Raw" allowInvisible />
        <Input aria-label="Code" maxLength={4} />
      </>,
    );
    await user.type(screen.getByRole("textbox", { name: "Raw" }), "a\u200Bb");
    expect(screen.getByRole("textbox", { name: "Raw" })).toHaveValue("a\u200Bb");
    const code = screen.getByRole("textbox", { name: "Code" });
    await user.click(code);
    await user.paste("123456");
    expect(code).toHaveValue("1234");
    expect((code as HTMLInputElement).validationMessage).toBe("Only the first 4 characters fit. The rest of the paste was cut.");
    await user.type(code, "{Backspace}");
    expect((code as HTMLInputElement).validationMessage).toBe("");
  });

  it("an avatar fallback shows two characters, which fit, and keeps the rest for screen readers (#159)", () => {
    render(
      <Avatar>
        <AvatarFallback>Ops team</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("Op")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Ops team")).toHaveClass("sr-only");
  });

  const examples = components.flatMap((c) => (c.examples ?? []).map((e) => [e.file, <e.component key={e.file} />] as const));

  it.each(examples)("%s example has no accessibility violations", async (_name, example) => {
    const { container } = render(<>{example}</>);
    expect(await violations(container)).toEqual([]);
  });

  it("alert dialog starts on Cancel, so Enter does not confirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <AlertDialog>
        <AlertDialogTrigger render={<Button />}>Delete</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete the automation?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    // Base UI moves focus a tick after opening; until then it is on the trigger, never on the action.
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("text fields are bounded by default and the limit can be changed, not removed", () => {
    render(
      <>
        <Input aria-label="name" />
        <Input aria-label="email" type="email" />
        <Input aria-label="age" type="number" />
        <Input aria-label="code" maxLength={6} />
        <Textarea aria-label="notes" />
        <Textarea aria-label="essay" maxLength={20000} />
      </>,
    );
    expect(screen.getByLabelText("name")).toHaveAttribute("maxlength", "256");
    expect(screen.getByLabelText("email")).toHaveAttribute("maxlength", "256");
    expect(screen.getByLabelText("age")).not.toHaveAttribute("maxlength");
    expect(screen.getByLabelText("code")).toHaveAttribute("maxlength", "6");
    expect(screen.getByLabelText("notes")).toHaveAttribute("maxlength", "4000");
    expect(screen.getByLabelText("essay")).toHaveAttribute("maxlength", "20000");
  });

  it("progress clamps values outside 0-100", () => {
    render(<Progress value={180} aria-label="Ceiling used" />);
    const bar = screen.getByRole("progressbar", { name: "Ceiling used" });
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(bar.querySelector("[data-slot=progress-indicator]")).toHaveStyle({ transform: "translateX(-0%)" });
  });
});
