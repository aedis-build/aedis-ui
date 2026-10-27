import type { spawnSync } from "node:child_process";

import { installCommand } from "../src/deps";
import { runPackageManager } from "../src/spawn";

type Call = { file: string; args: readonly string[]; options: Record<string, unknown> };

function fake(status: number | null = 0) {
  const calls: Call[] = [];
  const spawn = ((file: string, args: readonly string[], options: Record<string, unknown>) => {
    calls.push({ file, args, options });
    return { status };
  }) as unknown as typeof spawnSync;
  return { calls, spawn };
}

const { command, args, env } = installCommand("npm", ["@base-ui/react@1.0.0", "clsx@2.1.1"]);

describe("runPackageManager (#174)", () => {
  it("spawns npm directly with an args array and no shell", () => {
    const { calls, spawn } = fake();
    expect(runPackageManager(command, args, { cwd: "/app", env }, spawn, "linux")).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0].file).toBe("npm");
    expect(calls[0].args).toEqual(["install", "--save-exact", "--ignore-scripts", "@base-ui/react@1.0.0", "clsx@2.1.1"]);
    expect(calls[0].options.shell).toBeUndefined();
    expect(calls[0].options.cwd).toBe("/app");
  });

  it("starts the .cmd shim through cmd.exe on Windows, still with no shell option", () => {
    const { calls, spawn } = fake(3);
    expect(runPackageManager(command, args, { cwd: "C:\app", env }, spawn, "win32")).toBe(3);
    expect(calls[0].file).toMatch(/cmd\.exe$/i);
    expect(calls[0].args).toEqual(["/d", "/c", "npm", ...args]);
    expect(calls[0].options.shell).toBeUndefined();
  });

  it("passes the package manager's env and maps a missing status to failure", () => {
    const { calls, spawn } = fake(null);
    expect(runPackageManager("yarn", ["add"], { cwd: "/app", env: { YARN_ENABLE_SCRIPTS: "false" } }, spawn, "linux")).toBe(1);
    expect((calls[0].options.env as Record<string, string>).YARN_ENABLE_SCRIPTS).toBe("false");
  });

  it("refuses cmd.exe metacharacters on Windows before spawning anything", () => {
    for (const bad of ["a&calc", "x|y", "%PATH%", "a b", 'a"b', "a^b", "(a)", "a>b", ""]) {
      const { calls, spawn } = fake();
      expect(() => runPackageManager("npm", ["install", bad], { cwd: "C:\app", env: {} }, spawn, "win32"), bad).toThrow(/refusing/);
      expect(calls).toHaveLength(0);
    }
  });
});
