import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";

import { verify } from "sigstore";

import { run } from "./cli";

const code = await run(process.argv.slice(2), {
  cwd: process.cwd(),
  fetcher: fetch,
  check: (bundle, options) => verify(bundle as Parameters<typeof verify>[0], options),
  spawn: (command, args, { cwd, env }) =>
    // Windows resolves npm/pnpm/yarn through .cmd shims, which need a shell; the arguments are validated specs.
    spawnSync(command, args, { cwd, env: { ...process.env, ...env }, stdio: "inherit", shell: process.platform === "win32" }).status ?? 1,
  confirm: async (question) => {
    if (!process.stdin.isTTY) return false;
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`${question} [y/N] `);
    rl.close();
    return /^y(es)?$/i.test(answer.trim());
  },
  log: (line) => console.log(line),
  stdin: () => createInterface({ input: process.stdin, crlfDelay: Infinity }),
  stdout: (text) => process.stdout.write(text),
});
// Not process.exit(): on Windows it can abort inside libuv while a fetch socket is still closing; the loop drains on its own.
process.exitCode = code;
