import { stripInvisible } from "@/lib/untrusted";

export type AttachmentRules = {
  /** Allowed MIME types ("image/png", "image/*") or extensions (".csv"). Anything else is refused. */
  accept: string[];
  /** Largest file accepted, in bytes. */
  maxBytes: number;
};

export type AttachmentProblem = "type" | "size" | "empty";

const CONTROL = /[\u0000-\u001F\u007F]/g;

/**
 * A file name safe to show: bidi controls and zero-width characters removed (an RLO turns "invoice\u202Efdp.exe"
 * into what reads as "invoiceexe.pdf", MITRE T1036.002), control characters removed, length bounded.
 */
export function safeFileName(name: string, max = 120): string {
  const clean = stripInvisible(name).replace(CONTROL, "").trim() || "file";
  if (clean.length <= max) return clean;
  const dot = clean.lastIndexOf(".");
  const ext = dot > 0 && clean.length - dot <= 10 ? clean.slice(dot) : "";
  return `${clean.slice(0, max - ext.length - 1)}…${ext}`;
}

const extension = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot).toLowerCase() : "";
};

/**
 * Checks a file against the allow-list and the size limit. The browser guesses `file.type` from the name, so the
 * server must check the content again; this only keeps obvious mistakes and abuse from being uploaded.
 */
export function checkAttachment(file: Pick<File, "name" | "size" | "type">, { accept, maxBytes }: AttachmentRules): AttachmentProblem | null {
  if (file.size === 0) return "empty";
  if (file.size > maxBytes) return "size";
  const type = file.type.toLowerCase();
  const ext = extension(safeFileName(file.name));
  const allowed = accept.some((rule) => {
    const r = rule.trim().toLowerCase();
    if (r.startsWith(".")) return ext === r;
    if (r.endsWith("/*")) return type.startsWith(r.slice(0, -1)) && type !== "image/svg+xml";
    return type === r;
  });
  return allowed ? null : "type";
}

export type UploadOptions = {
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
  timeoutMs?: number;
};

/**
 * Uploads one file to a same-origin path under `api()`'s rules (relative path, custom header, JSON answer) with
 * progress, which fetch cannot report. Resolves with the server's `{ id }`.
 */
export function uploadAttachment(path: string, file: File, { onProgress, signal, timeoutMs = 120_000 }: UploadOptions = {}): Promise<{ id: string }> {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return Promise.reject(new Error("uploadAttachment(): path must be relative to this origin, e.g. /api/attachments"));
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", path);
    xhr.timeout = timeoutMs;
    xhr.responseType = "json";
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      const id = (xhr.response as { id?: unknown } | null)?.id;
      // responseURL differs from the path when the server redirected: refuse, like api() does.
      const redirected = xhr.responseURL && new URL(xhr.responseURL).pathname !== new URL(path, xhr.responseURL).pathname;
      if (xhr.status >= 200 && xhr.status < 300 && typeof id === "string" && !redirected) resolve({ id });
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = xhr.ontimeout = () => reject(new Error("Upload failed"));
    xhr.onabort = () => reject(new DOMException("Upload aborted", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    const body = new FormData();
    body.append("file", file, safeFileName(file.name));
    xhr.send(body);
  });
}
