# Contributing to Aedis UI

The organization-wide guide is in [aedis-build/aedis](https://github.com/aedis-build/aedis/blob/main/CONTRIBUTING.md). This file covers what is specific to this repository.

## Setup

Requirements: Node.js 22+ and pnpm 10.

```bash
pnpm install
pnpm dev            # docs site at http://localhost:3000
pnpm test           # unit, property-based and accessibility tests
pnpm test:coverage  # the same with the coverage gate (95 % lines, 85 % branches)
pnpm registry:build # writes the registry JSON to apps/www/public/r
pnpm build          # registry + static site in apps/www/out
```

## Adding a component

1. Put the source in `apps/www/registry/aedis/ui/<name>.tsx`. It must be self-contained apart from npm dependencies and other registry items.
2. Register it in `apps/www/registry.json`, listing `dependencies` (npm) and `registryDependencies` (other items).
3. If it shows text, add its strings to `Messages` and to the three dictionaries.
4. Add its docs entry in `apps/www/content/components.tsx`: description, example, props and security notes.
5. Add a test in `apps/www/test/` covering behavior and accessibility (axe). Parsers and anything that handles untrusted text also get a property-based test with fast-check.
6. Add a **live demo** on the site and a **Playwright spec** that proves it works. See the next section.

## Every feature ships with a live demo and a Playwright test

This applies to every item in the registry: components, blocks, hooks and libraries.

- **The demo lives on the site.** It is an example in `apps/www/examples/` that people can use, shown on the item's
  docs page (`/docs/<name>`) or, for a block, at `/blocks/<name>`.
  - For a hook or a library, the demo shows it working in the browser: an inspector, a builder or a simulator with
    real inputs and outputs. Text is not enough.
  - If the item needs a backend, the demo simulates one in the browser and says so.
- **A Playwright spec opens that page and uses the demo the way a person would.** It lives in `apps/www/visual/`, is
  named `*.behaviour.spec.ts`, and runs in CI against the built site with the real `_headers`. It drives the mouse
  and keyboard, and checks focus, results, a 390 px viewport and reduced motion where they matter. A screenshot alone
  is not a test.
- **The pull request carries the evidence:**
  - the new or changed spec, passing in CI;
  - light and dark screenshots at 1440 and 390 px;
  - for anything that moves or talks to something (motion, chat, streaming, frames), a short recording.
- `apps/www/test/demo-rule.test.ts` fails the build when an item has no demo or no spec. Items older than the rule
  are listed there, and that list only shrinks: remove a name when its demo or spec lands, and never add one.

## Rules for components

The reasoning behind each rule is in [docs/SECURITY-BY-CONSTRUCTION.md](docs/SECURITY-BY-CONSTRUCTION.md).

- **No fixed strings.** Every user-facing string lives in the Locale dictionary (`registry/aedis/lib/locale.tsx`) and the component reads it with `useMessages`, keeping a `labels` prop for overrides. A pull request that adds or changes a string updates `en`, `pt-BR` and `es` together; the locale test fails when keys differ. No product copy inside a component.
- **Agent output is data.** Render it as text, or as markdown through the sanitizing renderer. Never use `dangerouslySetInnerHTML` on content an agent or a user produced; SAST fails the build on it.
- **Untrusted text is shown and sent without hidden code points.** Use `stripInvisible` from `@aedis/untrusted` on anything a person or an agent wrote, both when rendering it and before handing it to an agent.
- **Every text field has a limit.** Use `Input` and `Textarea`, which are bounded by default; a raw `<input>` or `<textarea>` is flagged by SAST. Change the limit when the domain needs it, never remove it.
- **The backend is called through `api()`.** Same-origin paths only, never a token in script, storage or a URL.
- **Actions that leave the company need confirmation.** Sending, approving and deleting go through an explicit confirm step that the app can label but not remove.
- **External links** get `rel="noopener noreferrer"`.
- **Accessible by default:** keyboard reachable, labelled, and passing axe in the tests.

## Releases

Releases follow the commits. On every merge to `main`, `release-cut.yml` derives the next version from the Conventional
Commits since the last tag (breaking → major, `feat` → minor, `fix`/`perf`/`refactor`/`revert`/dependency bumps →
patch, anything else → nothing) and opens or updates a release pull request, `chore(release): vX.Y.Z`, that bumps
`package.json` (the registry), `packages/cli/package.json`, `packages/cli/src/cli.ts` and the `@aedis/cli@X.Y.Z` pins
in the docs. Merging it tags `vX.Y.Z` and `cli-vX.Y.Z`; `release.yml` then publishes the signed registry release and
`cli-release.yml` publishes `@aedis/cli`, then the thin `aedis-cli`, `aedis-ui` and `create-aedis` (a bin over the exact
`@aedis/cli` version, released together), to npm with Trusted Publishing and provenance, both through the aedis-platform
reusables. The first release is cut on purpose: run `release-cut` by hand with an explicit bump.

`pnpm smoke` (after `pnpm build`) proves the path without publishing: it packs the CLI as npm would, installs the
tarball in a scratch project and runs `init`, `add` and `diff` against the registry built from the checkout. CI runs
it on every pull request.

## Commits and pull requests

[Conventional Commits](https://www.conventionalcommits.org/), signed off (`git commit -s`), one purpose per PR, linked to an issue that explains the need. Changes under `.github/`, `docs/`, `apps/www/lib/` and the Markdown component always need a human review (see `.github/aedis-merge-policy.yaml`). The gates (coverage, SAST rules, DAST, merge gate), the releases (registry, `@aedis/cli`) and the visual regression are the shared reusable workflows of [aedis-platform](https://github.com/aedis-build/aedis-platform); this repository carries no glue of its own.
