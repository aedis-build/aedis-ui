import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";

import StepsDemo from "@/examples/steps/demo";
import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { Step, Steps, type StepStatus } from "@/registry/aedis/ui/steps";
import { violations } from "./a11y";

function Wizard({ at, labels }: { at: number; labels?: { done?: string } }) {
  const status = (i: number): StepStatus => (i < at ? "done" : i === at ? "current" : "upcoming");
  return (
    <Steps>
      <Step status={status(0)} title="Create" summary="Aedis Console" action={<button type="button">Change</button>} labels={labels}>
        <p>form 1</p>
      </Step>
      <Step status={status(1)} title="Redirect" summary="https://a.example">
        <p>form 2</p>
      </Step>
      <Step status={status(2)} title="Test">
        <p>form 3</p>
      </Step>
    </Steps>
  );
}

describe("Steps", () => {
  it("is an ordered list with one current step and the others stated in text", () => {
    render(<Wizard at={1} />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((li) => li.getAttribute("data-status"))).toEqual(["done", "current", "upcoming"]);
    expect(items.map((li) => li.getAttribute("aria-current"))).toEqual([null, "step", null]);
    expect(screen.getByRole("heading", { name: "Create (done)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Redirect" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Test (not started)" })).toBeInTheDocument();
  });

  it("folds a done step to its summary and action, opens only the current one", () => {
    render(<Wizard at={1} />);
    expect(screen.getByText("Aedis Console")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();
    expect(screen.queryByText("form 1")).toBeNull();
    expect(screen.getByText("form 2")).toBeInTheDocument();
    expect(screen.queryByText("https://a.example")).toBeNull();
    expect(screen.queryByText("form 3")).toBeNull();
  });

  it("hides the big number from assistive tech", () => {
    const { container } = render(<Wizard at={0} />);
    for (const n of container.querySelectorAll("[data-slot=step-number]")) expect(n).toHaveAttribute("aria-hidden", "true");
  });

  it("moves focus to the heading of a step that becomes current, never on first render", () => {
    const { rerender } = render(<Wizard at={0} />);
    expect(document.body).toHaveFocus();
    rerender(<Wizard at={1} />);
    expect(screen.getByRole("heading", { name: "Redirect" })).toHaveFocus();
    rerender(<Wizard at={0} />);
    expect(screen.getByRole("heading", { name: "Create" })).toHaveFocus();
  });

  it("reads its words from the dictionary, with labels overriding", () => {
    render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <Wizard at={1} labels={{ done: "(feito)" }} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("heading", { name: "Create (feito)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: `Test ${ptBR.steps.upcoming}` })).toBeInTheDocument();
  });

  it("shows any summary as text, never as markup", () => {
    fc.assert(
      fc.property(fc.string(), (summary) => {
        const { container, unmount } = render(
          <Steps>
            <Step status="done" title="Create" summary={summary || "x"} />
          </Steps>,
        );
        expect(container.querySelector("p")?.textContent).toBe(summary || "x");
        expect(container.querySelector("p")?.children).toHaveLength(0);
        unmount();
      }),
      { numRuns: 50 },
    );
  });

  it("passes axe in every status", async () => {
    const { container } = render(<Wizard at={1} />);
    expect(await violations(container)).toEqual([]);
  });
});

describe("Steps demo", () => {
  it("walks the Identity wizard with focus on each new step, and reopens a done one", async () => {
    const user = userEvent.setup();
    const { container } = render(<StepsDemo />);
    expect(await violations(container)).toEqual([]);

    await user.type(screen.getByLabelText("Redirect URI"), "https://app.example.com/callback");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Add the JWKS credential" })).toHaveFocus();
    expect(screen.getByText("https://app.example.com/callback")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Change Create the application" }));
    expect(screen.getByRole("heading", { name: "Create the application" })).toHaveFocus();
    expect(screen.getByLabelText("Application name")).toHaveValue("Aedis Console");
    expect(screen.getByRole("heading", { name: "Add the JWKS credential (not started)" })).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });

  it("ends with every step done and focus on the closing message", async () => {
    const user = userEvent.setup();
    render(<StepsDemo />);
    const answers = ["https://app.example.com/callback", "https://app.example.com/.well-known/jwks.json", "ana@example.com"];
    for (const [i, field] of ["Redirect URI", "JWKS URL", "Test user email"].entries()) {
      await user.type(screen.getByLabelText(field), answers[i]!);
      await user.click(screen.getByRole("button", { name: i === 2 ? "Finish" : "Continue" }));
    }
    expect(screen.getAllByRole("listitem").map((li) => li.getAttribute("data-status"))).toEqual(["done", "done", "done", "done"]);
    expect(screen.getByRole("status")).toHaveTextContent("All four steps are done.");
    expect(screen.getByRole("status")).toHaveFocus();
  });
});
