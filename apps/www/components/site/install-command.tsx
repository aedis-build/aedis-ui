import { CodeBlock } from "@/registry/aedis/ui/code-block";

const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL ?? "https://aedis-build.github.io/aedis-ui/r";

/** One-time setup: the @aedis namespace in the app's components.json. */
export function RegistrySetup() {
  return <CodeBlock lang="json" title="components.json" code={`{\n  "registries": {\n    "@aedis": "${registryUrl}/{name}.json"\n  }\n}`} />;
}

/** One-time setup: the theme the shadcn CLI copies with the first component. */
export function ThemeImport() {
  return <CodeBlock lang="css" title="app/globals.css" code={'@import "tailwindcss";\n@import "./styles/aedis-theme.css";'} />;
}

/** Install command for a registry item, shown on every component page. */
export function InstallCommand({ name }: { name: string }) {
  return <CodeBlock lang="bash" code={`npx shadcn@latest add @aedis/${name}`} />;
}
