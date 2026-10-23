/** The shell/remotes diagram: one shell, a framed remote, an element and a zone. Text in the SVG is text. */
export function ShellDiagram() {
  const box = { fill: "var(--surface)", stroke: "var(--border)" };
  return (
    <svg viewBox="0 0 460 200" role="img" aria-label="A shell holding a framed billing app, an agents element and a docs zone" className="w-full">
      <rect x="1" y="1" width="458" height="198" rx="16" fill="var(--background)" stroke="var(--border)" />
      <rect x="1" y="1" width="458" height="34" rx="16" {...box} />
      <text x="16" y="23" fontSize="12" fontWeight="700" fill="var(--foreground)">Shell · session, header, CSP</text>
      <text x="444" y="23" fontSize="11" fill="var(--muted-foreground)" textAnchor="end">app.example</text>
      <rect x="16" y="50" width="206" height="132" rx="12" fill="var(--surface)" stroke="var(--primary)" strokeDasharray="4 3" />
      <text x="28" y="72" fontSize="12" fontWeight="600" fill="var(--foreground)">Billing · mf-frame</text>
      <text x="28" y="90" fontSize="11" fill="var(--muted-foreground)">billing.example, sandboxed</text>
      <rect x="28" y="104" width="182" height="8" rx="4" fill="var(--muted)" />
      <rect x="28" y="120" width="103" height="8" rx="4" fill="var(--muted)" />
      <text x="28" y="168" fontSize="10" fill="var(--link)">⇄ mf-bridge: typed, origin-checked</text>
      <rect x="238" y="50" width="206" height="60" rx="12" {...box} />
      <text x="250" y="74" fontSize="12" fontWeight="600" fill="var(--foreground)">Agents · mf-element</text>
      <text x="250" y="92" fontSize="11" fill="var(--muted-foreground)">same origin, Shadow DOM</text>
      <rect x="238" y="122" width="206" height="60" rx="12" {...box} />
      <text x="250" y="146" fontSize="12" fontWeight="600" fill="var(--foreground)">/docs · Multi-Zone</text>
      <text x="250" y="164" fontSize="11" fill="var(--muted-foreground)">own app, own CSP, one origin</text>
    </svg>
  );
}
