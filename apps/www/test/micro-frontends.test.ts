import { checkEvidence } from "@/components/site/security-panel";
import { approaches, defends, verdicts } from "@/content/micro-frontends";

describe("micro-frontends page", () => {
  it("points every claim about the kit to a test that exists", () => {
    const security = { sinks: ["Transport" as const], defenses: defends.map((d) => ({ title: d.title, text: d.text, evidence: [d.proof] as [[string, string]], ids: [] })) };
    expect(() => checkEvidence("micro-frontends", security)).not.toThrow();
  });

  it("gives every approach a verdict", () => {
    expect(verdicts).toHaveLength(approaches.length);
  });
});
