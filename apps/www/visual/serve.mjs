// Serves the static export (out/) for the visual tests: /docs/button → out/docs/button.html. Local only, read only.
// It sends the headers of out/_headers as Cloudflare does, so the tests run under the real CSP.
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../out/", import.meta.url));
// _headers rules in order: a path pattern (* matches anything), then "  Name: value" or "  ! Name" (detach) lines.
const rules = [];
for (const line of readFileSync(path.join(root, "_headers"), "utf8").split("\n")) {
  // The site's paths hold only letters, digits, "-", "_", "/", "." and "*".
  if (line.startsWith("/")) rules.push({ pattern: new RegExp(`^${line.trim().replaceAll(".", "\\.").replaceAll("*", ".*")}$`), lines: [] });
  else if (line.trim()) rules.at(-1).lines.push(line.trim());
}
/** A header set by two matching rules is comma-joined, as on Cloudflare; a detach drops what earlier rules set. */
function headersFor(pathname) {
  const headers = new Map();
  for (const { pattern, lines } of rules.filter((r) => r.pattern.test(pathname)))
    for (const line of lines) {
      if (line.startsWith("!")) headers.delete(line.slice(1).trim().toLowerCase());
      else {
        const [name, value] = [line.slice(0, line.indexOf(":")).trim().toLowerCase(), line.slice(line.indexOf(":") + 1).trim()];
        headers.set(name, headers.has(name) ? `${headers.get(name)}, ${value}` : value);
      }
    }
  return Object.fromEntries(headers);
}

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain" };

createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  const candidates = [pathname, `${pathname}.html`, path.posix.join(pathname, "index.html")];
  for (const candidate of candidates) {
    const file = path.join(root, candidate);
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) continue;
    res.writeHead(200, { ...headersFor(pathname), "Content-Type": types[path.extname(file)] ?? "application/octet-stream" });
    return void createReadStream(file).pipe(res);
  }
  // Pages only: with no-store, Chromium never settles the 404 prefetches and "networkidle" never comes.
  res.writeHead(404).end("not found");
}).listen(4173, "127.0.0.1");
