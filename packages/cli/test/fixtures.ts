import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";

import { VERSION, type Io } from "../src/cli";
import type { SignatureCheck } from "../src/verify";

/** A minimal ustar archive, enough for readTarGz. */
export function tarGz(entries: Record<string, string | Buffer>, { type = "0" } = {}) {
  const blocks: Buffer[] = [];
  for (const [name, content] of Object.entries(entries)) {
    const body = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const header = Buffer.alloc(512);
    header.write(name.slice(0, 100), 0);
    header.write("0000644\0", 100);
    header.write(body.length.toString(8).padStart(11, "0") + "\0", 124);
    header.write(type, 156);
    header.write("ustar\0", 257);
    blocks.push(header, body, Buffer.alloc((512 - (body.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}

export const REPO = "https://github.com/aedis-build/aedis-ui";

export function bundleFor(archive: Buffer, release: string, overrides: { name?: string; repository?: string; path?: string; ref?: string; digest?: string } = {}) {
  const statement = {
    _type: "https://in-toto.io/Statement/v1",
    subject: [{ name: overrides.name ?? `aedis-ui-registry-${release}.tgz`, digest: { sha256: overrides.digest ?? createHash("sha256").update(archive).digest("hex") } }],
    predicateType: "https://slsa.dev/provenance/v1",
    predicate: { buildDefinition: { externalParameters: { workflow: { repository: overrides.repository ?? REPO, path: overrides.path ?? ".github/workflows/release.yml", ref: overrides.ref ?? `refs/tags/${release}` } } } },
  };
  return { mediaType: "application/vnd.dev.sigstore.bundle.v0.3+json", dsseEnvelope: { payloadType: "application/vnd.in-toto+json", payload: Buffer.from(JSON.stringify(statement)).toString("base64"), signatures: [{ sig: "x" }] } };
}

export const PLATFORM = "https://github.com/aedis-build/aedis-platform/.github/workflows/release-registry-js.yml@3a42caac428d5581312a4a83cf1d7a6487a181f0";

/**
 * Accepts only bundles "signed" by the expected identity, matching the pattern against the signer like sigstore
 * would. The signer is the repository's release workflow at `signedFor`, or `signer` when given.
 */
export const fakeCheck =
  (signedFor: string, repo = REPO, signer = `${repo}/.github/workflows/release.yml@refs/tags/${signedFor}`): SignatureCheck =>
  async (_bundle, { certificateIdentityURI, certificateIssuer }) => {
    if (certificateIssuer !== "https://token.actions.githubusercontent.com") throw new Error("wrong issuer");
    if (!new RegExp(certificateIdentityURI).test(signer)) throw new Error("certificate identity mismatch");
    return {};
  };

export const item = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  type: "registry:ui",
  files: [{ path: `registry/aedis/ui/${name}.tsx`, type: "registry:ui", content: `import { cn } from "@/lib/utils";\nimport { X } from "@/registry/aedis/ui/x";\nexport const ${name.replace(/-/g, "_")} = 1;\n` }],
  ...extra,
});

export const ITEMS = {
  theme: { name: "theme", type: "registry:file", files: [{ path: "registry/aedis/styles/theme.css", type: "registry:file", target: "styles/aedis-theme.css", content: ":root{}\n" }] },
  utils: { name: "utils", type: "registry:lib", dependencies: ["clsx", "tailwind-merge"], files: [{ path: "lib/utils.ts", type: "registry:lib", content: "export const cn = 1;\n" }] },
  untrusted: { name: "untrusted", type: "registry:lib", files: [{ path: "lib/untrusted.ts", type: "registry:lib", content: "export {};\n" }] },
  api: { name: "api", type: "registry:lib", files: [{ path: "lib/api.ts", type: "registry:lib", content: "export {};\n" }] },
  "security-headers": { name: "security-headers", type: "registry:lib", registryDependencies: ["@aedis/untrusted"], files: [{ path: "lib/security-headers.ts", type: "registry:lib", content: "export {};\n" }] },
  button: item("button", { dependencies: ["@base-ui/react@1.9.0", "class-variance-authority"], registryDependencies: ["@aedis/utils", "@aedis/theme"] }),
  "use-thing": { name: "use-thing", type: "registry:hook", files: [{ path: "registry/aedis/hooks/use-thing.ts", type: "registry:hook", content: 'import { a } from "@/registry/aedis/lib/a";\n' }] },
};

export function releaseArchive(items: Record<string, unknown> = ITEMS) {
  return tarGz(Object.fromEntries(Object.entries(items).map(([k, v]) => [`r/${k}.json`, JSON.stringify(v)])));
}

const DAY = 86_400_000;
export const NOW = Date.parse("2026-10-19T00:00:00Z");

/** npm registry documents: versions with publish dates relative to NOW (days ago). */
export const NPM: Record<string, Record<string, number>> = {
  "@base-ui/react": { "1.8.0": 45, "1.9.0": 10 },
  "class-variance-authority": { "0.7.0": 400, "0.7.1": 300, "0.8.0-beta.1": 30 },
  clsx: { "2.1.1": 500 },
  "tailwind-merge": { "3.6.0": 40, "3.7.0": 3 },
  "brand-new": { "1.0.0": 2 },
};

export function fakeFetch(routes: Record<string, () => Response>) {
  const calls: string[] = [];
  const fetcher = (async (input: string | URL) => {
    const url = String(input);
    calls.push(url);
    const route = routes[url];
    if (route) return route();
    const npm = /^https:\/\/registry\.npmjs\.org\/(.+)$/.exec(url);
    if (npm) {
      const name = decodeURIComponent(npm[1]);
      const versions = NPM[name];
      if (!versions) return new Response("not found", { status: 404 });
      return Response.json({
        versions: Object.fromEntries(Object.keys(versions).map((v) => [v, {}])),
        time: Object.fromEntries(Object.entries(versions).map(([v, days]) => [v, new Date(NOW - days * DAY).toISOString()])),
      });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
  return { fetcher, calls };
}

export function releaseRoutes(release: string, archive = releaseArchive(), bundle: unknown = bundleFor(archive, release), repo = REPO) {
  const base = `${repo}/releases/download/${release}/${repo.split("/").at(-1)}-registry-${release}.tgz`;
  return {
    [base]: () => new Response(archive),
    [`${base}.sigstore`]: () => (bundle === null ? new Response("nope", { status: 404 }) : Response.json(bundle)),
  };
}

export function project(files: Record<string, string> = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "aedis-cli-"));
  // A repository boundary, so package-manager detection never looks above the fixture.
  mkdirSync(path.join(root, ".git"));
  writeFileSync(path.join(root, "package.json"), "{}");
  for (const [f, c] of Object.entries(files)) writeFileSync(path.join(root, f), c);
  return root;
}

export function io(root: string, routes: Record<string, () => Response>, extra: Partial<Io> = {}) {
  const lines: string[] = [];
  const spawned: { command: string; args: string[]; env: Record<string, string> }[] = [];
  const { fetcher, calls } = fakeFetch(routes);
  const value: Io = {
    cwd: root,
    fetcher,
    // The fake signer signs the release this CLI version pins, so a version bump never breaks these tests.
    check: fakeCheck(`v${VERSION}`),
    spawn: (command, args, { env }) => (spawned.push({ command, args, env }), 0),
    confirm: async () => true,
    log: (l) => lines.push(l),
    now: NOW,
    ...extra,
  };
  return { io: value, lines, spawned, calls };
}
