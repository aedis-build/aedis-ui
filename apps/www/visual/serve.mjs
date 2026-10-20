// Serves the static export (out/) for the visual tests: /docs/button → out/docs/button.html. Local only, read only.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../out/", import.meta.url));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain" };

createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  const candidates = [pathname, `${pathname}.html`, path.posix.join(pathname, "index.html")];
  for (const candidate of candidates) {
    const file = path.join(root, candidate);
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) continue;
    res.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" });
    return void createReadStream(file).pipe(res);
  }
  res.writeHead(404).end("not found");
}).listen(4173, "127.0.0.1");
