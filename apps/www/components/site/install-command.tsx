import { CodeBlock } from "@/registry/aedis/ui/code-block";

/** The CLI version the docs pin; bump with packages/cli. Never document the unscoped `aedis` package. */
export const CLI = "@aedis/cli@0.5.2";

/** One-time setup: aedis.json, the theme, cn and the security primitives, from a verified release. */
export function RegistrySetup() {
  return <CodeBlock lang="bash" code={`npx ${CLI} init`} />;
}

/** One-time setup: importing the theme that init copies. */
export function ThemeImport() {
  return <CodeBlock lang="css" title="app/globals.css" code={'@import "tailwindcss";\n@import "./styles/aedis-theme.css";'} />;
}

/** Install command for a registry item, shown on every component page. */
export function InstallCommand({ name }: { name: string }) {
  return <CodeBlock lang="bash" code={`npx ${CLI} add ${name}\n# pnpm dlx ${CLI} add ${name} · yarn dlx ${CLI} add ${name} · bunx ${CLI} add ${name}`} />;
}
