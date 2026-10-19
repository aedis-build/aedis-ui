/** Error for a response the app must handle: the status tells whether the session is gone (401) or forbidden (403). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message = `Request failed with status ${status}`,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiOptions = Omit<RequestInit, "body" | "credentials" | "redirect" | "mode"> & {
  /** JSON body; sets the content type and defaults the method to POST. */
  body?: unknown;
  /** Abort after this many milliseconds. */
  timeoutMs?: number;
  /** Name of a readable cookie whose value is echoed in X-CSRF-Token (double-submit). */
  csrfCookie?: string;
};

function cookie(name: string): string | undefined {
  const prefix = `${name}=`;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(prefix))
    ?.slice(prefix.length);
}

/**
 * Calls the app's own backend as JSON. The path must be same-origin and relative, so the session cookie never
 * travels to another host; redirects are refused for the same reason. Every request carries a custom header,
 * which a cross-site form cannot send, so a backend that requires it is safe from CSRF with SameSite cookies.
 * Responses that are not JSON are refused, never interpreted; 4xx/5xx become an ApiError.
 */
export async function api<T>(path: string, { body, timeoutMs = 30_000, csrfCookie, headers, signal, ...init }: ApiOptions = {}): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    throw new Error("api(): path must be relative to this origin, e.g. /api/approvals");
  }
  const csrf = csrfCookie ? cookie(csrfCookie) : undefined;
  const response = await fetch(path, {
    ...init,
    method: init.method ?? (body === undefined ? "GET" : "POST"),
    credentials: "same-origin",
    redirect: "error",
    referrerPolicy: "same-origin",
    signal: signal ?? AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new ApiError(response.status);
  if (response.status === 204) return undefined as T;
  const type = response.headers.get("content-type") ?? "";
  if (!/^application\/json\b/i.test(type)) throw new ApiError(response.status, `Expected JSON, got ${type || "no content type"}`);
  return (await response.json()) as T;
}
