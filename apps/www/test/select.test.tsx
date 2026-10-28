import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";

import { Combobox } from "@/registry/aedis/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/registry/aedis/ui/field";
import { Select } from "@/registry/aedis/ui/select";
import { violations } from "./a11y";

const proposals = [
  { label: "Open", options: [{ value: "p-12", label: "Ceramics studio identity" }, { value: "p-14", label: "Bakery website" }] },
  { label: "Closed", options: [{ value: "p-03", label: "Gallery catalogue", disabled: true }] },
];

describe("select (#196)", () => {
  it("is named by its FieldLabel, shows the placeholder, and picks an option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <Field name="proposal">
        <FieldLabel>Proposal</FieldLabel>
        <Select options={proposals} placeholder="Choose a proposal" onValueChange={onValueChange} />
      </Field>,
    );
    const trigger = screen.getByRole("combobox", { name: "Proposal" });
    expect(trigger).toHaveTextContent("Choose a proposal");
    expect(await violations(container)).toEqual([]);
    await user.click(trigger);
    expect(await screen.findByRole("group", { name: "Open" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Gallery catalogue" })).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("option", { name: "Bakery website" }));
    expect(onValueChange).toHaveBeenCalledWith("p-14", expect.anything());
    await waitFor(() => expect(trigger).toHaveTextContent("Bakery website"));
  });

  it("is marked invalid by the field's errors", () => {
    render(
      <Field name="proposal" errors={["proposal"]}>
        <FieldLabel>Proposal</FieldLabel>
        <Select options={proposals} />
        <FieldError>Choose the proposal this portfolio belongs to.</FieldError>
      </Field>,
    );
    expect(screen.getByRole("combobox", { name: "Proposal" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Choose the proposal this portfolio belongs to.")).toBeVisible();
  });

  it("renders any label as text, never as markup (property)", () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.constantFrom("<img src=x onerror=alert(1)>", "<b>bold</b>", "&lt;i&gt;")), (label) => {
        cleanup();
        render(<Select aria-label="Pick" defaultValue="a" options={[{ value: "a", label }]} />);
        const trigger = screen.getByRole("combobox", { name: "Pick" });
        expect(trigger.querySelector("img, b, i, script")).toBeNull();
        expect(trigger.textContent).toBe(label);
      }),
    );
  });

  it("shows a label with markup as text in the open list too", async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Pick" options={[{ value: "a", label: "<img src=x onerror=alert(1)>" }]} />);
    await user.click(screen.getByRole("combobox", { name: "Pick" }));
    const option = await screen.findByRole("option");
    expect(option.querySelector("img")).toBeNull();
    expect(option).toHaveTextContent("<img src=x onerror=alert(1)>");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  });
});

const sectors = ["Architecture", "Bakery", "Ceramics", "Fashion", "Furniture", "Restaurant"].map((label) => ({ value: label.toLowerCase(), label }));

describe("combobox (#196)", () => {
  it("filters as you type, says when nothing matches, and sends the chosen value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <form>
        <Field name="sector">
          <FieldLabel>Sector</FieldLabel>
          <Combobox name="sector" options={sectors} onValueChange={onValueChange} />
        </Field>
      </form>,
    );
    const input = screen.getByRole("combobox", { name: "Sector" });
    expect(input).toHaveAttribute("maxlength", "256");
    // In a Field, the trigger keeps its own name instead of taking the field's label.
    expect(screen.getByRole("button", { name: "Show options" })).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
    await user.type(input, "fu");
    await waitFor(() => expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Furniture"]));
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("furniture");
    expect(input).toHaveValue("Furniture");
    expect(new FormData(container.querySelector("form")!).get("sector")).toBe("furniture");

    await user.clear(input);
    await user.type(input, "zzz");
    expect(await screen.findByText("No results.")).toBeVisible();
  });

  it("opens from its button, which has a name", async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Sector" options={sectors} />);
    await user.click(screen.getByRole("button", { name: "Show options" }));
    expect(await screen.findAllByRole("option")).toHaveLength(sectors.length);
  });
});
