# create-aedis

`npm create aedis` (or `pnpm create aedis`, `yarn create aedis`, `bun create aedis`) runs `aedis init` from [`@aedis/cli`](https://www.npmjs.com/package/@aedis/cli): config, theme, `cn` and the security primitives of [Aedis UI](https://ui.aedis.build), with the registry release verified (Sigstore, SLSA provenance) before any file is written. Any option goes through, e.g. `npm create aedis -- --preset <id>`.

This package depends on the exact `@aedis/cli` version it was released with and runs nothing else. Never run `npx aedis`: the unscoped `aedis` package on npm is not ours.

Source and security policy: [github.com/aedis-build/aedis-ui](https://github.com/aedis-build/aedis-ui). Apache-2.0.
