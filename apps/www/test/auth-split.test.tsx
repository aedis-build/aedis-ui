import { fireEvent, render, screen, within } from "@testing-library/react";

import AuthSplitDemo from "@/examples/blocks/auth-split";
import { AuthSplit, AuthSplitDivider } from "@/registry/aedis/blocks/auth-split";
import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { violations } from "./a11y";

describe("auth-split (#283)", () => {
  it("names the form by its h1, numbers the facts as a list, and posts the form", async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const { container } = render(
      <AuthSplit
        mark={<span>Mark</span>}
        statement="A long statement for wide screens."
        shortStatement="Short."
        facts={[{ title: "One", detail: "First." }, { title: "Two" }]}
        title="Sign in"
        onSubmit={onSubmit}
        footer={<a href="/sign-up">Create an account</a>}
      >
        <label htmlFor="e">Email</label>
        <input id="e" type="email" autoComplete="username webauthn" />
      </AuthSplit>,
    );
    const form = screen.getByRole("form", { name: "Sign in" });
    expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["01OneFirst.", "02Two"]);
    expect(items[0]!.querySelector("[aria-hidden=true]")).toHaveTextContent("01");
    // On a phone the long statement and the facts give way to the short line; on a wide screen the reverse.
    expect(screen.getByText("A long statement for wide screens.")).toHaveClass("hidden", "lg:block");
    expect(screen.getByText("Short.")).toHaveClass("lg:hidden");
    expect(container.querySelector("[data-slot=auth-split-facts]")).toHaveClass("hidden", "lg:grid");
    expect(screen.getByRole("link", { name: "Create an account" }).parentElement!.className).toContain("[&_a]:min-h-11");
    expect(form).toHaveAttribute("method", "post");
    fireEvent.submit(within(form).getByLabelText("Email"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(await violations(container)).toEqual([]);
  });

  it("leaves out what it is not given, and shows the statement everywhere without a short one", () => {
    const { container } = render(<AuthSplit statement="Only this." title="Sign up" />);
    expect(screen.getByText("Only this.")).not.toHaveClass("hidden");
    expect(container.querySelector("[data-slot=auth-split-mark]")).toBeNull();
    expect(container.querySelector("[data-slot=auth-split-facts]")).toBeNull();
    expect(container.querySelector("[data-slot=auth-split-footer]")).toBeNull();
  });

  it("says or from the dictionary, overridable by labels", () => {
    const { rerender } = render(<AuthSplitDivider />);
    expect(screen.getByText("or")).toBeInTheDocument();
    rerender(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <AuthSplitDivider />
      </LocaleProvider>,
    );
    expect(screen.getByText("ou")).toBeInTheDocument();
    rerender(<AuthSplitDivider labels={{ or: "or else" }} />);
    expect(screen.getByText("or else")).toBeInTheDocument();
  });

  it("demo: switches between sign in and sign up, and says the backend is simulated", async () => {
    const { container } = render(<AuthSplitDemo />);
    expect(screen.getByRole("textbox", { name: "Work email" })).toHaveAttribute("autocomplete", "username webauthn");
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(screen.getByRole("status")).toHaveTextContent("Simulated: you would continue to Google. Nothing was sent.");
    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
    expect(screen.getByRole("heading", { level: 1, name: "Create your Aedis account" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("");
    fireEvent.submit(screen.getByRole("form", { name: "Create your Aedis account" }));
    expect(screen.getByRole("status")).toHaveTextContent("an account would be created");
    fireEvent.click(screen.getByRole("button", { name: "Sign up with a passkey" }));
    expect(screen.getByRole("status")).toHaveTextContent("passkey");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    fireEvent.submit(screen.getByRole("form", { name: "Sign in to Aedis" }));
    expect(screen.getByRole("status")).toHaveTextContent("a sign-in link would go");
    expect(await violations(container)).toEqual([]);
  });
});
