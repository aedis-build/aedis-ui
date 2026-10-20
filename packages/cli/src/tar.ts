import { gunzipSync } from "node:zlib";

/**
 * Reads the regular files of a gzipped ustar archive into memory (the registry release). Nothing touches the disk;
 * links, devices and oversized archives are refused.
 */
export function readTarGz(archive: Uint8Array, { maxBytes = 64 * 1024 * 1024 } = {}): Map<string, Buffer> {
  const tar = gunzipSync(archive, { maxOutputLength: maxBytes });
  const files = new Map<string, Buffer>();
  let offset = 0;
  let longName: string | null = null;
  const text = (start: number, length: number) => tar.subarray(start, start + length).toString("utf8").replace(/\0.*$/s, "");

  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const size = parseInt(text(offset + 124, 12).trim() || "0", 8);
    if (!Number.isFinite(size) || size < 0) throw new Error("archive: bad entry size");
    const type = String.fromCharCode(header[156] || 48);
    const prefix = text(offset + 345, 155);
    let name = longName ?? (prefix ? `${prefix}/${text(offset, 100)}` : text(offset, 100));
    longName = null;
    const body = tar.subarray(offset + 512, offset + 512 + size);
    if (type === "L") longName = body.toString("utf8").replace(/\0.*$/s, "");
    else if (type === "0" || type === "\0") {
      name = name.replace(/^\.\//, "");
      files.set(name, Buffer.from(body));
    } else if (type === "1" || type === "2" || type === "3" || type === "4" || type === "6") {
      throw new Error(`archive: refused entry type ${type} for ${name}`);
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}
