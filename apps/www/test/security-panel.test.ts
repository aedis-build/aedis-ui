import { checkEvidence } from "@/components/site/security-panel";
import { components } from "@/content/components";

describe("security panel", () => {
  it.each(components.map((c) => [c.name, c.security] as const))("%s cites only tests that exist", (name, security) => {
    expect(() => checkEvidence(name, security)).not.toThrow();
  });

  it("fails the build for a missing file, a missing test or a sink without a defense", () => {
    const defense = (file: string, test: string) => ({ title: "t", text: "", evidence: [[file, test]] as [[string, string]], ids: [] });
    expect(() => checkEvidence("x", { sinks: ["DOM"], defenses: [defense("nope.test.ts", "a")] })).toThrow("test/nope.test.ts, which does not exist");
    expect(() => checkEvidence("x", { sinks: ["DOM"], defenses: [defense("api.test.ts", "a test nobody wrote")] })).toThrow("which is not in test/api.test.ts");
    expect(() => checkEvidence("x", { sinks: ["Input"] })).toThrow("touches Input but lists no defense");
    expect(() => checkEvidence("x", { sinks: [] })).not.toThrow();
  });
});
