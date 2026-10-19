const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL ?? "https://aedis-build.github.io/aedis-ui/r";

/** One-time setup: the @aedis namespace in the app's components.json. */
export function RegistrySetup() {
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted px-4 py-3 text-sm">
      <code>{`{
  "registries": {
    "@aedis": "${registryUrl}/{name}.json"
  }
}`}</code>
    </pre>
  );
}

/** Install command for a registry item, shown on every component page. */
export function InstallCommand({ name }: { name: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted px-4 py-3 text-sm">
      <code>{`npx shadcn@latest add @aedis/${name}`}</code>
    </pre>
  );
}
