import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useFormat } from "@/registry/aedis/hooks/use-format";
import { en, LocaleProvider, type Messages } from "@/registry/aedis/lib/locale";
import { es } from "@/registry/aedis/lib/locales/es";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { AppShell } from "@/registry/aedis/ui/app-shell";
import { ApprovalCard } from "@/registry/aedis/ui/approval-card";
import { Chat } from "@/registry/aedis/ui/chat";
import { HandRaise } from "@/registry/aedis/ui/hand-raise";
import { LocaleSwitcher } from "@/registry/aedis/ui/locale-switcher";

import { violations } from "./a11y";

const keysOf = (m: Messages) =>
  Object.entries(m)
    .flatMap(([component, strings]) => Object.keys(strings).map((k) => `${component}.${k}`))
    .sort();

const card = () => <ApprovalCard requester="Rafael" content="Proposal" onApprove={vi.fn()} onRequestChanges={vi.fn()} />;

describe("dictionaries", () => {
  it.each([
    ["pt-BR", ptBR],
    ["es", es],
  ])("%s has exactly the English keys, none empty", (_, messages) => {
    expect(keysOf(messages)).toEqual(keysOf(en));
    const empty = Object.values(messages).flatMap((strings) => Object.values(strings)).filter((s) => !String(s).trim());
    expect(empty).toEqual([]);
  });
});

describe("LocaleProvider", () => {
  it("keeps English without a provider", () => {
    render(card());
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("renders components in the provider language", () => {
    render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        {card()}
        <HandRaise agent="Otto" question="?" onAnswer={vi.fn()} />
        <Chat messages={[]} onSend={vi.fn()} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Aprovar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Responder" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Mensagem" })).toBeInTheDocument();
  });

  it("lets the labels prop override single strings from the provider", () => {
    render(
      <LocaleProvider locale="es" messages={es}>
        <ApprovalCard requester="R" content="x" onApprove={vi.fn()} onRequestChanges={vi.fn()} labels={{ approve: "Dar el visto bueno" }} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Dar el visto bueno" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pedir cambios" })).toBeInTheDocument();
  });

  it("shows the generic error in the provider language", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <HandRaise agent="Otto" question="?" onAnswer={vi.fn().mockRejectedValue(new Error("boom"))} />
      </LocaleProvider>,
    );
    await user.type(screen.getByRole("textbox"), "sim");
    await user.click(screen.getByRole("button", { name: "Responder" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Algo deu errado. Tente de novo.");
  });

  it("names the app shell menu from the dictionary unless the prop is set", () => {
    const { rerender } = render(
      <LocaleProvider locale="es" messages={es}>
        <AppShell sidebar={null}>x</AppShell>
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Menú" })).toBeInTheDocument();
    rerender(
      <LocaleProvider locale="es" messages={es}>
        <AppShell sidebar={null} menuLabel="Abrir">
          x
        </AppShell>
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Abrir" })).toBeInTheDocument();
  });
});

describe("useFormat", () => {
  const formatIn = (locale: string) =>
    renderHook(() => useFormat(), { wrapper: ({ children }) => <LocaleProvider locale={locale}>{children}</LocaleProvider> }).result.current;

  it("formats currency for the locale", () => {
    expect(formatIn("pt-BR").currency(449, "BRL")).toMatch(/^R\$\s449,00$/);
    expect(formatIn("en").currency(1234.5, "USD")).toBe("$1,234.50");
  });

  it("formats numbers and dates for the locale", () => {
    expect(formatIn("pt-BR").number(250000)).toBe("250.000");
    expect(formatIn("en").date("2026-10-18T12:00:00Z", { dateStyle: "short", timeZone: "UTC" })).toBe("10/18/26");
  });

  it("picks the largest unit for relative time", () => {
    const now = new Date("2026-10-18T12:00:00Z");
    const pt = formatIn("pt-BR");
    expect(pt.relative(new Date(now.getTime() - 4 * 60_000), now)).toBe("há 4 minutos");
    expect(pt.relative(new Date(now.getTime() - 86_400_000), now)).toBe("ontem");
    expect(formatIn("es").relative(new Date(now.getTime() + 3 * 3_600_000), now)).toBe("dentro de 3 horas");
    expect(formatIn("en").relative(now, now)).toBe("now");
  });
});

describe("LocaleSwitcher", () => {
  const locales = [
    { code: "en", label: "English" },
    { code: "pt-BR", label: "Português" },
    { code: "es", label: "Español" },
  ];

  it("starts on the provider locale and reports the choice", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <LocaleSwitcher locales={locales} onChange={onChange} />
      </LocaleProvider>,
    );
    const select = screen.getByRole("combobox", { name: "Idioma" });
    expect(select).toHaveValue("pt-BR");
    await user.selectOptions(select, "es");
    expect(onChange).toHaveBeenCalledWith("es");
  });

  it("marks each option with its own language and passes axe", async () => {
    const { container } = render(<LocaleSwitcher locales={locales} onChange={vi.fn()} />);
    expect(screen.getByRole("option", { name: "Español" })).toHaveAttribute("lang", "es");
    expect(await violations(container)).toEqual([]);
  });
});
