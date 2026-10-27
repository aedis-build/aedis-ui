import { spawnSync } from "node:child_process";

// No cmd.exe metacharacters (& | < > ^ % " ( ) space): what is concatenated onto the command line is exactly what was passed.
const PLAIN = /^[\w@./:=~-]+$/;

/**
 * Runs a package manager without `shell: true` (Node's DEP0190). On Windows npm, pnpm and yarn are .cmd shims that
 * only cmd.exe can start (Node refuses to spawn a .cmd directly), so cmd.exe is spawned explicitly, and only with
 * arguments that hold no metacharacter; elsewhere the command is spawned directly.
 */
export function runPackageManager(
  command: string,
  args: string[],
  { cwd, env }: { cwd: string; env: Record<string, string> },
  spawn: typeof spawnSync = spawnSync,
  platform: NodeJS.Platform = process.platform,
): number {
  let file = command;
  let argv = args;
  if (platform === "win32") {
    for (const arg of [command, ...args]) if (!PLAIN.test(arg)) throw new Error(`refusing to pass ${JSON.stringify(arg)} to cmd.exe`);
    file = process.env.ComSpec ?? "cmd.exe";
    argv = ["/d", "/c", command, ...args];
  }
  return spawn(file, argv, { cwd, env: { ...process.env, ...env }, stdio: "inherit", windowsHide: true }).status ?? 1;
}
