# @aedis/cli

Adds [Aedis UI](https://ui.aedis.build) components to your app with verified provenance: the registry release is
checked (Sigstore signature and SLSA provenance of the repository's release workflow, built by the Aedis platform)
before any file is written, npm dependencies are pinned to exact versions at least 7 days old, and no install
script runs.

```bash
npx @aedis/cli@0.12.0 init
npx @aedis/cli@0.12.0 add button approval-card
npx @aedis/cli@0.12.0 diff
```

Always pin the version, as above. Never run `npx aedis`: the unscoped `aedis` package on npm is not this one.

Commands: `init` (config, theme, `cn` and the security primitives; `--preset <id>` from ui.aedis.build/create),
`add <item...>`, `diff [item...]`, `theme import <file.json>`, `lint [registry.json]`, `mcp` (read-only docs server
for coding agents). `--registry github:<owner>/<repo>@<tag>` installs a third-party registry under the same checks.

`aedis.json` keeps a receipt for every file the CLI writes (`files`: path, sha256 of the bytes written, item,
release). Adding again never replaces a file edited since: the new version goes next to it as `<file>.aedis-new` and
the command exits non-zero. The CLI never deletes `.aedis-new`. To settle the conflict, make the file the version you
want: to take the new one, copy `<file>.aedis-new` over `<file>` (merging your edit by hand if you keep it), run `add`
again (it sees the file unchanged and records a new receipt), then delete `<file>.aedis-new`. Each file is checked
again right before it is written, so an edit made while the prompt is open is kept the same way. Files that are
symlinks are refused. With `--registry <url> --allow-unverified`, replacing any existing file needs `--overwrite`.
The receipt is a local, editable file: it detects drift, it does not authenticate anything.

Source, issues and the security policy: [github.com/aedis-build/aedis-ui](https://github.com/aedis-build/aedis-ui).
Apache-2.0.
