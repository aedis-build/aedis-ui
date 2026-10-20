import path from "node:path";

/**
 * Resolves a path from a registry item against the project root and refuses anything that would land outside it:
 * absolute paths, drive letters, "..", NUL bytes, backslash tricks and empty names.
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
  return full;
}
