# @aedis/cli

Adds [Aedis UI](https://ui.aedis.build) components to your app with verified provenance: the registry release is
checked (Sigstore signature and SLSA provenance of the repository's release workflow, built by the Aedis platform)
before any file is written, npm dependencies are pinned to exact versions at least 7 days old, and no install
script runs.

```bash
npx @aedis/cli@0.5.0 init
npx @aedis/cli@0.5.0 add button approval-card
npx @aedis/cli@0.5.0 diff
```

Always pin the version, as above. Never run `npx aedis`: the unscoped `aedis` package on npm is not this one.

Commands: `init` (config, theme, `cn` and the security primitives; `--preset <id>` from ui.aedis.build/create),
`add <item...>`, `diff [item...]`, `theme import <file.json>`, `lint [registry.json]`, `mcp` (read-only docs server
for coding agents). `--registry github:<owner>/<repo>@<tag>` installs a third-party registry under the same checks.

Source, issues and the security policy: [github.com/aedis-build/aedis-ui](https://github.com/aedis-build/aedis-ui).
Apache-2.0.
