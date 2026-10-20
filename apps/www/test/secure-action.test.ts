// @vitest-environment node
import fc from "fast-check";

import { ActionError, secureAction, taintSecret, type StandardSchemaV1 } from "@/registry/aedis/lib/secure-action";

/** A minimal Standard Schema: { name: string up to 80 characters, tags?: string[] }. */
const rename: StandardSchemaV1<unknown, { name: string; tags?: string[] }> = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: vi.fn((value: unknown) => {
      const v = value as Record<string, unknown>;
      if (typeof v !== "object" || v === null || typeof v.name !== "string" || v.name.length > 80) return { issues: [{ message: "bad name", path: [{ key: "name" }] }] };
      return { value: { name: v.name } };
    }),
  },
};

const user = { id: "u1" };

describe("secureAction", () => {
  it("runs the handler with the validated input and the authorized caller", async () => {
    const handler = vi.fn((input: { name: string }, ctx: typeof user) => `${ctx.id}:${input.name}`);
    const action = secureAction({ authorize: () => user, schema: rename, handler });
    expect(await action({ name: "Avalo", extra: "dropped by the schema" })).toEqual({ ok: true, data: "u1:Avalo" });
    expect(handler).toHaveBeenCalledWith({ name: "Avalo" }, user);
  });

  it("checks authorization first, so an anonymous call is never validated or run", async () => {
    const validate = vi.spyOn(rename["~standard"], "validate");
    validate.mockClear();
    const handler = vi.fn();
    expect(await secureAction({ authorize: async () => null, schema: rename, handler })({ name: "x" })).toEqual({ ok: false, code: "unauthorized" });
    expect(validate).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it("answers with codes from ActionError, the rate limit, the size limit and the schema", async () => {
    const forbidden = secureAction({ authorize: () => { throw new ActionError("forbidden"); }, schema: rename, handler: () => 1 });
    expect(await forbidden({ name: "x" })).toEqual({ ok: false, code: "forbidden" });
    const limited = secureAction({ authorize: () => user, rateLimit: async () => false, schema: rename, handler: () => 1 });
    expect(await limited({ name: "x" })).toEqual({ ok: false, code: "rate-limited" });
    const small = secureAction({ authorize: () => user, schema: rename, handler: () => 1, maxInputBytes: 20 });
    expect(await small({ name: "x".repeat(30) })).toEqual({ ok: false, code: "too-large" });
    const any = secureAction({ authorize: () => user, schema: rename, handler: () => { throw new ActionError("conflict"); } });
    expect(await any({ name: "x" })).toEqual({ ok: false, code: "conflict" });
    expect(await any({ name: 42 })).toEqual({ ok: false, code: "invalid", fields: ["name"] });
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(await any(cyclic)).toEqual({ ok: false, code: "invalid" });
  });

  it("reads forms, counts files towards the size limit and ignores Next's $ACTION fields", async () => {
    const handler = vi.fn((input: { name: string }) => input.name);
    const action = secureAction({ authorize: () => user, schema: rename, handler, maxInputBytes: 1000 });
    const form = new FormData();
    form.set("$ACTION_ID_abc", "");
    form.set("name", "Talbot");
    expect(await action(form)).toEqual({ ok: true, data: "Talbot" });
    form.set("upload", new File(["x".repeat(2000)], "big.bin"));
    expect(await action(form)).toEqual({ ok: false, code: "too-large" });
  });

  it("never returns the error message, whatever the handler throws (property)", async () => {
    const log = vi.fn();
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (secret) => {
        const action = secureAction({ authorize: () => user, schema: rename, log, handler: () => { throw new Error(`db password=${secret}`); } });
        const result = await action({ name: "x" });
        expect(result).toEqual({ ok: false, code: "failed" });
        expect(JSON.stringify(result)).not.toContain(secret.length > 3 ? secret : "password=");
      }),
      { numRuns: 50 },
    );
    expect(log).toHaveBeenCalled();
  });

  it("refuses to build without authorize or a Standard Schema", () => {
    expect(() => secureAction({ authorize: undefined as never, schema: rename, handler: () => 1 })).toThrow(/authorize is required/);
    expect(() => secureAction({ authorize: () => user, schema: {} as never, handler: () => 1 })).toThrow(/Standard Schema/);
  });

  it("logs unexpected errors and returns failed", async () => {
    const log = vi.fn();
    const action = secureAction({ authorize: () => Promise.reject(new Error("session store down")), schema: rename, handler: () => 1, log });
    expect(await action({ name: "x" })).toEqual({ ok: false, code: "failed" });
    expect(log).toHaveBeenCalledWith("secureAction: action failed", expect.any(Error));
  });
});

describe("taintSecret", () => {
  it("reports when the taint API is not available (stable React without experimental.taint)", () => {
    expect(taintSecret("Do not pass the access token to the client", {}, "token")).toBe(false);
  });
});
