import { REPOSITORY } from "./config";
import { readTarGz } from "./tar";
import { verifyRelease, type SignatureCheck } from "./verify";

export type RegistryFile = { path: string; type: string; target?: string; content: string };
export type RegistryItem = { name: string; type: string; dependencies: string[]; registryDependencies: string[]; files: RegistryFile[] };

const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_ITEM_BYTES = 2 * 1024 * 1024;

/** Checks the shape of a registry item; anything unexpected is an error, never a guess. */
export function parseItem(json: unknown, expected: string): RegistryItem {
  const item = json as Partial<RegistryItem> & { files?: Partial<RegistryFile>[] };
  if (!item || typeof item !== "object" || item.name !== expected) throw new Error(`registry: item ${expected} is missing or misnamed`);
  const strings = (v: unknown, field: string) => {
    if (v === undefined) return [];
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) throw new Error(`registry: ${expected}.${field} must be a list of strings`);
    return v as string[];
  };
  if (!Array.isArray(item.files) || item.files.length === 0) throw new Error(`registry: ${expected} has no files`);
  const files = item.files.map((f) => {
    if (typeof f.path !== "string" || typeof f.type !== "string" || typeof f.content !== "string") throw new Error(`registry: ${expected} has a malformed file`);
    if (f.target !== undefined && typeof f.target !== "string") throw new Error(`registry: ${expected} has a malformed target`);
    return { path: f.path, type: f.type, target: f.target, content: f.content };
  });
  return { name: item.name, type: String(item.type), dependencies: strings(item.dependencies, "dependencies"), registryDependencies: strings(item.registryDependencies, "registryDependencies"), files };
}

/** Where items come from. `namespace` is the prefix of the registry dependencies it may resolve, e.g. "@aedis". */
export type ItemSource = { get: (name: string) => Promise<RegistryItem>; verified: boolean; label: string; namespace: string };

/** The release asset of a registry: <repository name>-registry-<tag>.tgz, as aedis-ui's release workflow names it. */
export const assetName = (release: string, repository = REPOSITORY) => `${repository.split("/")[1]}-registry-${release}.tgz`;
const assetUrl = (repository: string, release: string, file: string) => `https://github.com/${repository}/releases/download/${release}/${file}`;

const GITHUB = /^github:([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100})@(v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

/** A third-party registry given as github:<owner>/<repo>@<tag>; null for anything else. Its namespace is @<owner>. */
export function githubRegistry(value: string) {
  const m = GITHUB.exec(value);
  return m ? { repository: `${m[1]}/${m[2]}`, release: m[3], namespace: `@${m[1].toLowerCase()}` } : null;
}

async function download(fetcher: typeof fetch, url: string, limit: number) {
  const response = await fetcher(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`download failed (${response.status}): ${url}`);
  const body = new Uint8Array(await response.arrayBuffer());
  if (body.byteLength > limit) throw new Error(`download too large: ${url}`);
  return body;
}

/** A signed release: the archive and its attestation are downloaded and verified before any item is read. */
export async function releaseSource(
  release: string,
  { fetcher = fetch, check, repository = REPOSITORY, namespace = "@aedis" }: { fetcher?: typeof fetch; check: SignatureCheck; repository?: string; namespace?: string },
): Promise<ItemSource> {
  const name = assetName(release, repository);
  const archive = await download(fetcher, assetUrl(repository, release, name), 32 * 1024 * 1024);
  let bundle: unknown;
  try {
    bundle = JSON.parse(new TextDecoder().decode(await download(fetcher, assetUrl(repository, release, `${name}.sigstore`), 1024 * 1024)));
  } catch (error) {
    throw new Error(`provenance: missing attestation for ${release} (${(error as Error).message})`);
  }
  await verifyRelease({ archive, bundle, release, assetName: name, check, repository });
  const files = readTarGz(archive);
  return {
    verified: true,
    namespace,
    label: `${repository} ${release} (verified)`,
    async get(item) {
      if (!NAME.test(item)) throw new Error(`registry: invalid item name ${JSON.stringify(item)}`);
      const raw = files.get(`r/${item}.json`);
      if (!raw) throw new Error(`registry: ${item} is not in ${release}`);
      return parseItem(JSON.parse(raw.toString("utf8")), item);
    },
  };
}

/** Another registry (e.g. a branch running locally). Not verified; the CLI says so before writing. */
export function urlSource(base: string, { fetcher = fetch }: { fetcher?: typeof fetch } = {}): ItemSource {
  const url = new URL(base.endsWith("/") ? base : `${base}/`);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("--registry must be an http(s) URL");
  return {
    verified: false,
    namespace: "@aedis",
    label: `${url.href} (NOT verified)`,
    async get(item) {
      if (!NAME.test(item)) throw new Error(`registry: invalid item name ${JSON.stringify(item)}`);
      const body = await download(fetcher, new URL(`${item}.json`, url).href, MAX_ITEM_BYTES);
      return parseItem(JSON.parse(new TextDecoder().decode(body)), item);
    },
  };
}

/** The items and everything they depend on, dependencies first, each once. Only the source's own namespace is followed. */
export async function resolveItems(names: string[], source: ItemSource): Promise<RegistryItem[]> {
  const done = new Map<string, RegistryItem>();
  const visiting = new Set<string>();
  const visit = async (name: string) => {
    if (done.has(name) || visiting.has(name)) return;
    visiting.add(name);
    const item = await source.get(name);
    for (const dep of item.registryDependencies) {
      if (!dep.startsWith(`${source.namespace}/`)) throw new Error(`registry: ${name} depends on ${dep}, outside ${source.namespace}`);
      await visit(dep.slice(source.namespace.length + 1));
    }
    visiting.delete(name);
    done.set(name, item);
  };
  for (const name of names) await visit(name.startsWith(`${source.namespace}/`) ? name.slice(source.namespace.length + 1) : name);
  return [...done.values()];
}
