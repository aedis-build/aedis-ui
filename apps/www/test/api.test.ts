import { api, ApiError } from "@/lib/api";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json; charset=utf-8" }, ...init });
}

describe("api", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sends same-origin JSON with the CSRF header and refuses redirects", async () => {
    document.cookie = "XSRF-TOKEN=abc123";
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await expect(api("/api/approvals/1/approve", { body: { reason: "x" }, csrfCookie: "XSRF-TOKEN" })).resolves.toEqual({ ok: true });

    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/approvals/1/approve");
    expect(init).toMatchObject({ method: "POST", credentials: "same-origin", redirect: "error", referrerPolicy: "same-origin", body: '{"reason":"x"}' });
    expect(init?.headers).toMatchObject({
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRF-Token": "abc123",
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("defaults to GET without a body and returns undefined on 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(api("/api/session")).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET" });
    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty("Content-Type");
  });

  it.each(["https://evil.example/api", "//evil.example/api", "/\\evil.example", "api/relative", ""])("refuses %j before any request", async (path) => {
    await expect(api(path)).rejects.toThrow("relative to this origin");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("turns 401 into an ApiError the app can act on", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 401 }));
    const error = await api("/api/me").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
  });

  it("refuses a 200 that is not JSON instead of interpreting it", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 200, headers: { "content-type": "text/html" } }));
    await expect(api("/api/me")).rejects.toThrow("Expected JSON, got text/html");
  });

  it("passes a caller's signal through instead of its own timeout", async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValue(jsonResponse({}));
    await api("/api/me", { signal: controller.signal, timeoutMs: 1 });
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
  });
});
