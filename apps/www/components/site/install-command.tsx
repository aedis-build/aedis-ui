const pre = "overflow-x-auto rounded-md border border-hairline bg-muted px-4 py-3 font-mono text-code";

const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL ?? "https://aedis-build.github.io/aedis-ui/r";

/** One-time setup: the @aedis namespace in the app's components.json. */
export function RegistrySetup() {
  return (
    <pre className={pre}>
      <code>{`{
  "registries": {
    "@aedis": "${registryUrl}/{name}.json"
  }
}`}</code>
    </pre>
  );
}

/** One-time setup: the theme the shadcn CLI copies with the first component. */
export function ThemeImport() {
  return (
    <pre className={pre}>
      <code>{`@import "tailwindcss";
@import "./styles/aedis-theme.css";`}</code>
    </pre>
  );
}

/** Install command for a registry item, shown on every component page. */
export function InstallCommand({ name }: { name: string }) {
  return (
    <pre className={pre}>
      <code>{`npx shadcn@latest add @aedis/${name}`}</code>
    </pre>
  );
}
