import { render, screen } from "@testing-library/react";
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
import { Button } from "@/registry/aedis/ui/button";
import { Progress } from "@/registry/aedis/ui/progress";
import { violations } from "./a11y";

describe("primitives", () => {
  it.each(components.map((c) => [c.name, c.example] as const))("%s example has no accessibility violations", async (_name, example) => {
    const { container } = render(<>{example}</>);
    expect(await violations(container)).toEqual([]);
  });

  it("alert dialog starts on Cancel, so Enter does not confirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>Delete</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete the automation?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("progress clamps values outside 0-100", () => {
    render(<Progress value={180} aria-label="Ceiling used" />);
    expect(screen.getByRole("progressbar", { name: "Ceiling used" }).firstElementChild).toHaveStyle({ transform: "translateX(-0%)" });
  });
});
