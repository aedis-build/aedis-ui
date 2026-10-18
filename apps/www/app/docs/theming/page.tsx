import type { Metadata } from "next";

export const metadata: Metadata = { title: "Theming", description: "Apply your brand by overriding the semantic CSS variables." };

const tokens: [string, string][] = [
  ["--background / --foreground", "Page background and text."],
  ["--muted / --muted-foreground", "Subtle surfaces and secondary text."],
  ["--border", "Borders and dividers."],
  ["--ring", "Focus ring."],
  ["--primary / --primary-foreground", "Main actions and selected states."],
  ["--secondary / --secondary-foreground", "Secondary actions."],
  ["--accent / --accent-foreground", "Attention: pending approvals, raised hands, counters."],
  ["--destructive / --destructive-foreground", "Destructive actions and errors."],
  ["--radius", "Corner radius."],
];

export default function Theming() {
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Theming</h1>
        <p className="text-muted-foreground">
          Components use semantic Tailwind colors backed by CSS variables. Apply your brand by overriding the variables in your
          global CSS, for light and dark. Never edit a component to change its colors.
        </p>
      </header>
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground">
          <tr><th className="py-2 pr-4">Variable</th><th className="py-2">Used for</th></tr>
        </thead>
        <tbody>
          {tokens.map(([name, use]) => (
            <tr key={name} className="border-t border-border"><td className="py-2 pr-4 font-mono text-xs">{name}</td><td className="py-2">{use}</td></tr>
          ))}
        </tbody>
      </table>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted px-4 py-3 text-sm">
        <code>{`:root {
  --primary: oklch(0.33 0.05 155);   /* your brand green */
  --accent: oklch(0.7 0.19 45);      /* your brand orange */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --primary: oklch(0.85 0.08 155);
  }
}`}</code>
      </pre>
    </article>
  );
}
