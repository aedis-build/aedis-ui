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

## Commits and pull requests

[Conventional Commits](https://www.conventionalcommits.org/), signed off (`git commit -s`), one purpose per PR, linked to an issue that explains the need. Changes under `.github/`, `docs/`, `apps/www/lib/` and the Markdown component always need a human review (see `.github/aedis-merge-policy.yaml`). The gates (coverage, SAST rules, DAST, merge gate) are the shared ones of [aedis-platform](https://github.com/aedis-build/aedis-platform); this repository carries no glue of its own.
