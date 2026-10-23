## What and why

<!-- The change, and the issue it closes or advances (Closes #N only when it fully delivers it). -->

## Checks

- [ ] `pnpm install --frozen-lockfile`, `pnpm site:build`, `pnpm typecheck` and `pnpm test:coverage` pass
- [ ] `pnpm -C apps/www test:visual --project=layout` passes for every component or page this touches
- [ ] Changed baselines under `apps/www/visual/__screenshots__` were looked at, not only regenerated (a maintainer approves them)

## Page screenshots

<!--
For every page this changes: light and dark, at 1440 px and 390 px, to compare with its canvas board.
Generate them with `pnpm -C apps/www build && pnpm -C apps/www capture /path …` (files land in apps/www/visual/captures).
Write "No page changes" if none.
-->

| Page | Light 1440 | Dark 1440 | Light 390 | Dark 390 |
|---|---|---|---|---|
| | | | | |
