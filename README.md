# Aedis UI

Secure-by-default React components for building AI platforms: agent chat, approvals, hand raises, usage ceilings, workflow editors and the app shell around them.

Components are not a dependency you install: they are source code you add to your app and own, after the CLI verifies the signed release they come from.

> Status: early preview. The registry, docs site and first components are being proposed through pull requests.

## Usage

Install with the Aedis CLI, pinned to a version. It verifies the signed registry release (Sigstore, built from
this repository's release workflow by the Aedis platform) before writing any file, installs npm dependencies at exact versions that are at
least 7 days old, and runs no install scripts:

```bash
npx @aedis/cli@0.1.0 init
npx @aedis/cli@0.1.0 add button approval-card
```

The same with other package managers: `pnpm dlx @aedis/cli@0.1.0 add button`, `yarn dlx @aedis/cli@0.1.0 add button`
(Yarn 2+; on Yarn 1 use `npx`), `bunx @aedis/cli@0.1.0 add button`.

> Never run `npx aedis`: the unscoped `aedis` package on npm belongs to someone else. The CLI is `@aedis/cli`.
> The unscoped `aedis-cli` and `aedis-ui` packages are ours and run the same command, pinned to the exact `@aedis/cli`
> version released with them, and `npm create aedis` (`create-aedis`) runs `init`; prefer `@aedis/cli` itself.

`init` writes `aedis.json` (the pinned release and where files go), the theme, `cn` and the security primitives
(`untrusted`, `api`, `security-headers`). Import the theme once in your global CSS, after Tailwind:

```css
@import "tailwindcss";
@import "./styles/aedis-theme.css";
```

`npx @aedis/cli@0.1.0 diff` shows where your copies differ from the registry, and `theme import <file.json>` turns a
theme made in the editor on the [Themes](https://ui.aedis.build/themes) page into CSS after validating it.

For coding agents, the site serves [llms.txt](https://ui.aedis.build/llms.txt) and
[llms-full.txt](https://ui.aedis.build/llms-full.txt), and `npx @aedis/cli@0.1.0 mcp` is a read-only docs server over
the Model Context Protocol (stdio): list and search items, read one with its API and security rules, get its install
command.

The registry stays compatible with the shadcn CLI (`"@aedis": "https://ui.aedis.build/r/{name}.json"`
in `components.json`), but that path verifies nothing: prefer `@aedis/cli`.

Aedis items depend only on other Aedis items (including its own `@aedis/utils`), so an install never pulls a package that Aedis did not choose.

### Verified offline install

Every `cli-vX.Y.Z` [release](https://github.com/aedis-build/aedis-ui/releases) carries the four npm tarballs
(`@aedis/cli`, `aedis-cli`, `aedis-ui`, `create-aedis`) exactly as npm received them, each with its Sigstore
attestation bundle (`.tgz.sigstore`) and `integrity`. The scoped one is named `aedis__cli-X.Y.Z.tgz` there (npm
would call it `aedis-cli-X.Y.Z.tgz`, the name the unscoped `aedis-cli` takes). Where npm is out of reach, or to
audit what npm serves:

```bash
gh release download cli-v0.1.0 -R aedis-build/aedis-ui -p 'aedis__cli-0.1.0.tgz*'
gh attestation verify aedis__cli-0.1.0.tgz --owner aedis-build
npm install ./aedis__cli-0.1.0.tgz
```

The `integrity` in the release notes is the same `sha512-…` that `npm view @aedis/cli dist.integrity` shows.

## Security

Every component defends its own sink: agent and user text is rendered as data, text fields are bounded by default, the backend is reached only same-origin, and hidden code points never travel between a person and an agent. The repository meets level L3 of the Aedis Platform conformance levels. How each attack is treated, what the UI leaves to the backend, and the checklist for an app built with these components are in [docs/SECURITY-BY-CONSTRUCTION.md](docs/SECURITY-BY-CONSTRUCTION.md).

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache-2.0](LICENSE), like the rest of [Aedis](https://github.com/aedis-build/aedis).
