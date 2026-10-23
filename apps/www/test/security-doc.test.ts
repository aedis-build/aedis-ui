import { securityDoc } from "@/components/site/security-doc";

describe("security page source", () => {
  it("reads every part of docs/SECURITY-BY-CONSTRUCTION.md", () => {
    const doc = securityDoc();
    expect(doc.sinks.map((s) => s.sink.match(/\*\*(\w+)\*\*/)?.[1])).toEqual(["DOM", "Transport", "Session", "Input"]);
    expect(doc.attacks.length).toBeGreaterThanOrEqual(12);
    expect(doc.attacks.find((a) => a.attack.includes("Prompt injection, visible"))).toMatchObject({ status: "boundary", note: "agent for the rest" });
    expect(doc.mitre.length).toBeGreaterThanOrEqual(8);
    expect(doc.l3.length).toBeGreaterThanOrEqual(5);
    expect(doc.checklist.length).toBeGreaterThanOrEqual(6);
    expect(doc.cannot.join(" ")).toContain("The browser is the attacker's machine");
  });

  it("fails instead of guessing when the document changes shape", () => {
    expect(() => securityDoc("# Security by construction\n\nNothing here.\n")).toThrow('no "## Principle');
    const md = [
      "# T",
      "",
      "## Principle: defense at the sink, never a string filter",
      "",
      "P.",
      "",
      "## How each attack is treated",
      "",
      "| Attack | At | How | Status |",
      "|---|---|---|---|",
      "| XSS | DOM | escaping | maybe |",
      "",
    ].join("\n");
    expect(() => securityDoc(md)).toThrow('unknown status "maybe" for XSS');
  });
});
