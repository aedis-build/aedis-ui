import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Field, FieldControl, FieldDescription, FieldError, FieldLabel, Honeypot } from "@/registry/aedis/ui/field";
import { Fieldset, FieldsetLegend } from "@/registry/aedis/ui/fieldset";
import { Checkbox } from "@/registry/aedis/ui/checkbox";
import { violations } from "./a11y";

function Email({ errors }: { errors?: string[] }) {
  return (
    <form>
      <Field name="email" errors={errors}>
        <FieldLabel>Email</FieldLabel>
        <FieldControl type="email" required />
        <FieldDescription>We reply within a day.</FieldDescription>
        <FieldError>Enter an email like name@company.com.</FieldError>
      </Field>
      <Honeypot />
      <button type="submit">Send</button>
    </form>
  );
}

describe("field (#197)", () => {
  it("names the control by its label and describes it by its hint", async () => {
    const { container } = render(<Email />);
    const box = screen.getByRole("textbox", { name: "Email" });
    expect(box).toHaveAccessibleDescription("We reply within a day.");
    expect(box).not.toHaveAttribute("aria-invalid");
    expect(await violations(container)).toEqual([]);
  });

  it("validates when the control loses focus, and the error joins the description in a live region", async () => {
    const user = userEvent.setup();
    const { container } = render(<Email />);
    const box = screen.getByRole("textbox", { name: "Email" });
    await user.type(box, "not-an-email");
    await user.tab();
    await waitFor(() => expect(box).toHaveAttribute("aria-invalid", "true"));
    const error = screen.getByText("Enter an email like name@company.com.");
    expect(error.closest("[aria-live=polite]")).not.toBeNull();
    expect(box.getAttribute("aria-describedby")).toContain(error.id);
    expect(await violations(container)).toEqual([]);

    await user.clear(box);
    await user.type(box, "ana@studio.com");
    await user.tab();
    await waitFor(() => expect(box).not.toHaveAttribute("aria-invalid"));
  });

  it("shows the error of a field a secureAction result names in its fields", () => {
    render(<Email errors={["email"]} />);
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter an email like name@company.com.")).toBeVisible();
  });

  it("keeps the honeypot away from people: hidden from assistive tech, out of the tab order, sent empty", async () => {
    const user = userEvent.setup();
    const { container } = render(<Email />);
    const trap = container.querySelector<HTMLInputElement>("input[name=website]")!;
    expect(trap.closest("[aria-hidden=true]")).not.toBeNull();
    expect(trap.tabIndex).toBe(-1);
    expect(trap).toHaveAttribute("autocomplete", "off");
    expect(screen.queryByRole("textbox", { name: /empty/i })).toBeNull();
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Send" }));
    expect(new FormData(container.querySelector("form")!).get("website")).toBe("");
  });
});

describe("fieldset (#197)", () => {
  it("names the group by its legend and disables every choice in it", async () => {
    const { container } = render(
      <Fieldset disabled>
        <FieldsetLegend>Services</FieldsetLegend>
        <Field>
          <FieldLabel>
            <Checkbox /> Branding
          </FieldLabel>
        </Field>
      </Fieldset>,
    );
    expect(screen.getByRole("group", { name: "Services" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Branding" })).toHaveAttribute("aria-disabled", "true");
    expect(await violations(container)).toEqual([]);
  });
});
