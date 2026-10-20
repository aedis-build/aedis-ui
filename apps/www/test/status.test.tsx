import { render, screen } from "@testing-library/react";

import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { es } from "@/registry/aedis/lib/locales/es";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/registry/aedis/ui/alert";
import { Button } from "@/registry/aedis/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/registry/aedis/ui/empty";
import { Kbd, KbdGroup } from "@/registry/aedis/ui/kbd";
import { Spinner } from "@/registry/aedis/ui/spinner";
import { violations } from "./a11y";

describe("Alert", () => {
  it("interrupts only for errors; everything else is a polite status", () => {
    render(
      <>
        <Alert variant="destructive">
          <AlertTitle>Could not send</AlertTitle>
          <AlertDescription>Try again in a minute.</AlertDescription>
        </Alert>
        <Alert variant="success">
          <AlertTitle>Saved</AlertTitle>
        </Alert>
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertAction>
            <Button size="sm">Undo</Button>
          </AlertAction>
        </Alert>
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Could not send");
    expect(screen.getAllByRole("status").map((s) => s.textContent)).toEqual(["Saved", "Heads upUndo"]);
  });

  it("renders text as text and has no accessibility violations", async () => {
    const { container } = render(
      <Alert variant="warning">
        <AlertTitle>{"<img src=x onerror=alert(1)>"}</AlertTitle>
      </Alert>,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(await violations(container)).toEqual([]);
  });
});

describe("Spinner", () => {
  it("is announced with its label and keeps the label for reduced motion", () => {
    const { container } = render(<Spinner />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    const label = screen.getByText("Loading");
    expect(label.className).toContain("motion-reduce:not-sr-only");
    expect(container.querySelector("svg")!.getAttribute("class")).toContain("motion-reduce:animate-none");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("reads its label from the locale or labels", () => {
    render(
      <LocaleProvider locale="es" messages={es}>
        <Spinner />
        <Spinner labels={{ label: "Enviando" }} />
      </LocaleProvider>,
    );
    expect(screen.getAllByRole("status").map((s) => s.textContent)).toEqual(["Cargando", "Enviando"]);
  });
});

describe("Empty and Kbd", () => {
  it("compose without accessibility violations", async () => {
    const { container } = render(
      <>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <svg viewBox="0 0 16 16" />
            </EmptyMedia>
            <EmptyTitle>No agents yet</EmptyTitle>
            <EmptyDescription>Hire your first agent to get started.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>Hire an agent</Button>
          </EmptyContent>
        </Empty>
        <p>
          Press{" "}
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </p>
      </>,
    );
    expect(container.querySelector("[data-slot=empty-media]")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("kbd kbd")).toHaveLength(2);
    expect(await violations(container)).toEqual([]);
  });
});
