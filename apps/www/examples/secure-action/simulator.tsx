import { secureAction, type StandardSchemaV1 } from "@/registry/aedis/lib/secure-action";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

// A small Standard Schema, so the demo needs no validation library: a name of 1 to 40 characters.
const schema: StandardSchemaV1<unknown, { name: string }> = {
  "~standard": {
    version: 1,
    vendor: "demo",
    validate: (v) => {
      const name = (v as { name?: unknown })?.name;
      return typeof name === "string" && name.trim().length > 0 && name.length <= 40 ? { value: { name } } : { issues: [{ message: "1–40 characters", path: ["name"] }] };
    },
  },
};

const action = (signedIn: boolean) =>
  secureAction({
    authorize: () => (signedIn ? { user: "ana" } : null),
    schema,
    maxInputBytes: 1024,
    handler: ({ name }, { user }) => ({ renamedTo: name, by: user }),
  });

const cases = [
  { label: "Signed out", signedIn: false, input: { name: "Sales agent" } },
  { label: "Invalid name", signedIn: true, input: { name: "" } },
  { label: "Too large", signedIn: true, input: { name: "x".repeat(5000) } },
  { label: "Valid", signedIn: true, input: { name: "Sales agent" } },
];

/** secureAction run on the server when this page was built: each call, and exactly what the caller got back. */
export default async function SecureActionSimulator() {
  const results = await Promise.all(cases.map((c) => action(c.signedIn)(c.input)));
  return (
    <Tabs defaultValue="Signed out" className="w-full max-w-xl">
      <TabsList aria-label="Calls">
        {cases.map((c) => (
          <TabsTrigger key={c.label} value={c.label}>
            {c.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {cases.map((c, i) => (
        <TabsContent key={c.label} value={c.label} className="grid gap-2 pt-3 text-callout">
          <p>
            {c.signedIn ? "Signed in as ana" : "No session"}, input: <code className="font-mono text-footnote">{JSON.stringify(c.input).slice(0, 48)}</code>
          </p>
          <pre aria-label="Result" className="rounded-sm border border-hairline bg-surface p-3 font-mono text-footnote whitespace-pre-wrap">
            {JSON.stringify(results[i])}
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  );
}
