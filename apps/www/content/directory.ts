import registry from "@/registry.json";

/** A registry the Directory lists. Each check is what @aedis/cli verifies (Signed, Provenance) or what `aedis lint` passes. */
export type DirectoryEntry = {
  namespace: string;
  title: string;
  /** owner/repo on GitHub: whose release workflow must have signed and built the registry. */
  repository: string;
  kind: "Official" | "Community";
  items: number;
  signed: boolean;
  provenance: boolean;
  lint: boolean;
  /** An item to show in the install command. */
  example: string;
};

/** Only registries the CLI can verify. Community registries join by pull request, once they meet "List your registry". */
export const directory: DirectoryEntry[] = [
  {
    namespace: "@aedis",
    title: "Aedis UI",
    repository: "aedis-build/aedis-ui",
    kind: "Official",
    items: registry.items.length,
    signed: true,
    provenance: true,
    lint: true,
    example: "button",
  },
];

/** Installable when the CLI can verify it: signed, with provenance, and passing the lint. */
export const installable = (e: DirectoryEntry) => e.signed && e.provenance && e.lint;
