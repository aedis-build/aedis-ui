import { randomBytes } from "node:crypto";
import { lstatSync, mkdirSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Resolves a path from a registry item against the project root and refuses anything that would land outside it:
 * absolute paths, drive letters, "..", NUL bytes, backslash tricks, empty names and symlinks that lead out.
 */
export function insideProject(root: string, relative: string): string {
  if (typeof relative !== "string" || relative.length === 0 || relative.length > 400) throw new Error("refused path: empty or too long");
  if (/[\u0000-\u001F]/.test(relative)) throw new Error(`refused path: control character in ${JSON.stringify(relative)}`);
  const normalized = relative.replace(/\\/g, "/");
  if (normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized) || normalized.startsWith("~")) throw new Error(`refused path: ${relative} is absolute`);
  if (normalized.split("/").some((part) => part === "..")) throw new Error(`refused path: ${relative} leaves the project`);
  const base = path.resolve(root);
  const full = path.resolve(base, normalized);
  if (full !== base && !full.startsWith(base + path.sep)) throw new Error(`refused path: ${relative} leaves the project`);
  if (full === base) throw new Error("refused path: the project root itself");
  // Whatever already exists on the way (the file or a parent folder) must resolve inside the project too.
  let existing = full;
  while (existing !== base && !lstatSync(existing, { throwIfNoEntry: false })) existing = path.dirname(existing);
  if (existing !== base) {
    let real: string;
    try {
      real = realpathSync(existing);
    } catch {
      throw new Error(`refused path: ${relative} goes through a broken symlink`);
    }
    const realBase = realpathSync(base);
    if (real !== realBase && !real.startsWith(realBase + path.sep)) throw new Error(`refused path: ${relative} leaves the project through a symlink`);
  }
  return full;
}

/** Refuses a file that is itself a symlink: writing to it would land wherever it points, even inside the project. */
export function notSymlink(absolute: string, relative: string): string {
  if (lstatSync(absolute, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error(`refused path: ${relative} is a symlink`);
  return absolute;
}

/** Writes through a new temporary file in the same folder and a rename, which replaces a symlink instead of following it. */
export function replaceFile(absolute: string, content: string) {
  mkdirSync(path.dirname(absolute), { recursive: true });
  const temporary = `${absolute}.${randomBytes(6).toString("hex")}.tmp`;
  writeFileSync(temporary, content, { flag: "wx" });
  renameSync(temporary, absolute);
}

/** Creates a file that must not exist yet (O_EXCL, which never follows a symlink); false when something is already there. */
export function createFile(absolute: string, content: string): boolean {
  mkdirSync(path.dirname(absolute), { recursive: true });
  try {
    writeFileSync(absolute, content, { flag: "wx" });
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw error;
  }
}
