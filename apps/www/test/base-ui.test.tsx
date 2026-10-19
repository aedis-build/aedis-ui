import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/registry/aedis/ui/alert-dialog";
import { Button } from "@/registry/aedis/ui/button";
import { Checkbox } from "@/registry/aedis/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/registry/aedis/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/registry/aedis/ui/radio-group";
import { Separator } from "@/registry/aedis/ui/separator";
import { Switch } from "@/registry/aedis/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/aedis/ui/tooltip";

describe("Base UI primitives", () => {
  it("alert dialog starts on Cancel even when the footer puts it last", async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger render={<Button />}>Send</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Send?</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogAction>Send now</AlertDialogAction>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-labelledby");
  });

  it("alert dialog action confirms and closes; Escape closes without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <AlertDialog>
        <AlertDialogTrigger render={<Button />}>Delete</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete?</AlertDialogTitle>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("dialog returns focus to its trigger on close and animates only opacity and scale", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger render={<Button />}>Invite</DialogTrigger>
        <DialogContent>
          <DialogTitle>Invite a person</DialogTitle>
          <DialogClose render={<Button />}>Done</DialogClose>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Invite" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Invite a person" });
    expect(dialog.className).toContain("transition-[opacity,scale]");
    expect(dialog.className).toContain("motion-reduce:transition-none");
    await user.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("tabs move with the arrow keys and mark the active tab", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Agents</TabsTrigger>
          <TabsTrigger value="b">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Agents panel</TabsContent>
        <TabsContent value="b">Billing panel</TabsContent>
      </Tabs>,
    );
    await user.tab();
    expect(screen.getByRole("tab", { name: "Agents" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Billing" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("tab", { name: "Billing" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Billing" })).toHaveAttribute("data-active");
  });

  it("checkbox, switch and radio toggle from the keyboard", async () => {
    const user = userEvent.setup();
    const onChecked = vi.fn();
    render(
      <>
        <Checkbox aria-label="Notify" onCheckedChange={onChecked} />
        <Switch aria-label="Autopilot" />
        <RadioGroup aria-label="Plan" defaultValue="free">
          <RadioGroupItem value="free" aria-label="Free" />
          <RadioGroupItem value="pro" aria-label="Pro" />
        </RadioGroup>
      </>,
    );
    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByRole("checkbox", { name: "Notify" })).toHaveAttribute("aria-checked", "true");
    expect(onChecked).toHaveBeenCalledWith(true, expect.anything());

    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByRole("switch", { name: "Autopilot" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("switch", { name: "Autopilot" })).toHaveAttribute("data-checked");

    await user.tab();
    expect(screen.getByRole("radio", { name: "Free" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Pro" })).toHaveAttribute("aria-checked", "true");
  });

  it("tooltip opens on keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger render={<Button />}>Ceiling</TooltipTrigger>
        <TooltipContent>Most this agent can cost per day.</TooltipContent>
      </Tooltip>,
    );
    await user.tab();
    expect(await screen.findByText("Most this agent can cost per day.")).toBeInTheDocument();
  });

  it("separator is decorative by default and semantic on request", () => {
    render(
      <>
        <Separator data-testid="decorative" />
        <Separator decorative={false} orientation="vertical" />
      </>,
    );
    expect(screen.getByTestId("decorative")).toHaveAttribute("role", "none");
    expect(screen.getByTestId("decorative")).not.toHaveAttribute("aria-orientation");
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("button keeps the role of the element it renders and submits only when asked", () => {
    render(
      <>
        <Button render={<a href="/docs" />} variant="outline">Docs</Button>
        <Button disabled>Off</Button>
      </>,
    );
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
    expect(screen.getByRole("button", { name: "Off" })).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "Off" })).toBeDisabled();
  });
});
