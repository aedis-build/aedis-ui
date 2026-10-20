import { act, waitFor } from "@testing-library/react";
import fc from "fast-check";

import { defineMfElement, type MfElementProps } from "@/registry/aedis/lib/mf-element";

type PanelProps = { agentName?: string; count?: number; compact?: boolean; config?: { tone: string }; onPick?: (x: string) => void };

function Panel({ agentName, count, compact, config, emit }: PanelProps & MfElementProps) {
  return (
    <div>
      <p data-testid="name">{agentName ?? "none"}</p>
      <p data-testid="count">{String(count)}</p>
      <p data-testid="compact">{String(compact)}</p>
      <p data-testid="tone">{config?.tone ?? "default"}</p>
      <button type="button" onClick={() => emit("approve", { id: 7 })}>Approve</button>
      <button type="button" onClick={() => emit("delete-everything")}>Rogue</button>
    </div>
  );
}

defineMfElement<PanelProps>("agent-panel", Panel, {
  attributes: { "agent-name": "string", count: "number", compact: "boolean", config: "json" },
  events: ["approve"],
  css: ":host { display: block }",
  maxJsonBytes: 64,
});

async function mount(html: string) {
  const host = document.createElement("div");
  host.innerHTML = html;
  await act(async () => void document.body.append(host));
  const el = host.firstElementChild as HTMLElement & PanelProps & { props: Partial<PanelProps> };
  const q = (id: string) => el.shadowRoot!.querySelector(`[data-testid=${id}]`)?.textContent;
  return { el, q, host };
}

afterEach(() => (document.body.innerHTML = ""));

describe("defineMfElement", () => {
  it("renders into a shadow root with its own styles and maps typed attributes to props", async () => {
    const { el, q } = await mount(`<agent-panel agent-name="Avalo" count="3" compact config='{"tone":"warm"}'></agent-panel>`);
    await waitFor(() => expect(q("name")).toBe("Avalo"));
    expect(el.shadowRoot!.querySelector("style")!.textContent).toBe(":host { display: block }");
    expect(document.body.querySelector("[data-testid=name]")).toBeNull();
    expect([q("count"), q("compact"), q("tone")]).toEqual(["3", "true", "warm"]);
  });

  it("keeps bad attribute values out: not-a-number, broken or oversized JSON", async () => {
    const { el, q } = await mount(`<agent-panel count="12px" config='{"tone":'></agent-panel>`);
    await waitFor(() => expect(q("count")).toBe("undefined"));
    expect(q("tone")).toBe("default");
    await act(async () => el.setAttribute("config", JSON.stringify({ tone: "x".repeat(100) })));
    expect(q("tone")).toBe("default");
    await act(async () => el.setAttribute("count", " "));
    expect(q("count")).toBe("undefined");
    await act(async () => el.removeAttribute("compact"));
    expect(q("compact")).toBe("false");
  });

  it("never throws on any attribute value (property)", async () => {
    const { el, q } = await mount(`<agent-panel></agent-panel>`);
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.string(), async (count, config) => {
        await act(async () => {
          el.setAttribute("count", count);
          el.setAttribute("config", config);
        });
        expect(q("count")).not.toBeNull();
      }),
      { numRuns: 40 },
    );
  });

  it("takes richer values as properties and reflects attribute changes", async () => {
    const { el, q } = await mount(`<agent-panel agent-name="A"></agent-panel>`);
    await act(async () => void (el.agentName = "Talbot"));
    expect(q("name")).toBe("Talbot");
    expect(el.agentName).toBe("Talbot");
    await act(async () => void (el.props = { config: { tone: "calm" } }));
    expect(q("tone")).toBe("calm");
    await act(async () => el.setAttribute("agent-name", "Avalo"));
    expect(q("name")).toBe("Avalo");
  });

  it("emits declared events as composed CustomEvents and refuses undeclared ones", async () => {
    const { el } = await mount(`<agent-panel></agent-panel>`);
    const onApprove = vi.fn();
    document.body.addEventListener("approve", (e) => onApprove((e as CustomEvent).detail));
    const approve = await waitFor(() => el.shadowRoot!.querySelector("button")!);
    await act(async () => approve.click());
    expect(onApprove).toHaveBeenCalledWith({ id: 7 });
    const rogue = el.shadowRoot!.querySelectorAll("button")[1];
    const errors: unknown[] = [];
    const swallow = (e: ErrorEvent) => (errors.push(e.message), e.preventDefault());
    window.addEventListener("error", swallow);
    await act(async () => rogue.click());
    window.removeEventListener("error", swallow);
    expect(String(errors[0])).toMatch(/"delete-everything" is not declared/);
  });

  it("unmounts when removed but survives a move, and refuses invalid tag names", async () => {
    const { el, host, q } = await mount(`<agent-panel agent-name="Moved"></agent-panel>`);
    const other = document.createElement("section");
    document.body.append(other);
    await act(async () => other.append(el));
    expect(q("name")).toBe("Moved");
    await act(async () => el.remove());
    await act(async () => host.append(el));
    await waitFor(() => expect(q("name")).toBe("Moved"));
    expect(() => defineMfElement("nodash", Panel)).toThrow(/not a valid custom element name/);
    expect(() => defineMfElement("agent-panel", Panel)).not.toThrow();
  });
});
