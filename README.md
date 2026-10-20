# Aedis UI

Secure-by-default React components for building AI platforms: agent chat, approvals, hand raises, usage ceilings, workflow editors and the app shell around them.

Aedis UI follows the [shadcn/ui](https://ui.shadcn.com) model: components are not a dependency you install, they are source code you add to your app and own. The registry is compatible with the shadcn CLI.

> Status: early preview. The registry, docs site and first components are being proposed through pull requests.

## Usage

Install with the Aedis CLI, pinned to a version. It verifies the signed registry release (Sigstore, built by this
repository's release workflow) before writing any file, installs npm dependencies at exact versions that are at
least 7 days old, and runs no install scripts:

```bash
npx @aedis/cli@0.1.0 init
npx @aedis/cli@0.1.0 add button approval-card
```

The same with other package managers: `pnpm dlx @aedis/cli@0.1.0 add button`, `yarn dlx @aedis/cli@0.1.0 add button`
(Yarn 2+; on Yarn 1 use `npx`), `bunx @aedis/cli@0.1.0 add button`.

> Never run `npx aedis`: the unscoped `aedis` package on npm belongs to someone else. The CLI is `@aedis/cli`.

`init` writes `aedis.json` (the pinned release and where files go), the theme, `cn` and the security primitives
(`untrusted`, `api`, `security-headers`). Import the theme once in your global CSS, after Tailwind:

```css
@import "tailwindcss";
@import "./styles/aedis-theme.css";
```

`npx @aedis/cli@0.1.0 diff` shows where your copies differ from the registry, and `theme import <file.json>` turns a
theme made in the theming page's editor into CSS after validating it.

The registry stays compatible with the shadcn CLI (`"@aedis": "https://aedis-build.github.io/aedis-ui/r/{name}.json"`
in `components.json`), but that path verifies nothing: prefer `@aedis/cli`.

Aedis items depend only on other Aedis items (including its own `@aedis/utils`), so an install never pulls a package that Aedis did not choose.

## Security

Every component defends its own sink: agent and user text is rendered as data, text fields are bounded by default, the backend is reached only same-origin, and hidden code points never travel between a person and an agent. The repository meets level L3 of the Aedis Platform conformance levels. How each attack is treated, what the UI leaves to the backend, and the checklist for an app built with these components are in [docs/SECURITY-BY-CONSTRUCTION.md](docs/SECURITY-BY-CONSTRUCTION.md).

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache-2.0](LICENSE), like the rest of [Aedis](https://github.com/aedis-build/aedis).
