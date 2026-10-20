import "server-only";

import * as React from "react";

/** The Standard Schema v1 interface (standardschema.dev), copied as the spec recommends: zod, valibot, arktype and others implement it. */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) => StandardResult<Output> | Promise<StandardResult<Output>>;
    readonly types?: { readonly input: Input; readonly output: Output } | undefined;
  };
}
type StandardResult<Output> =
  | { readonly value: Output; readonly issues?: undefined }
  | { readonly issues: ReadonlyArray<{ readonly message: string; readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined }> };
type Output<S> = S extends StandardSchemaV1<unknown, infer O> ? O : never;

export type ActionErrorCode = "unauthorized" | "forbidden" | "invalid" | "too-large" | "rate-limited" | "not-found" | "conflict" | "failed";

/** What the client gets: data, or a code it can map to its own message. Never the server's error text. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: ActionErrorCode; fields?: string[] };

/** Throw from `authorize` or the handler to answer with a specific code. */
export class ActionError extends Error {
  constructor(public readonly code: Exclude<ActionErrorCode, "invalid" | "too-large">) {
    super(code);
    this.name = "ActionError";
  }
}

export type SecureActionOptions<S extends StandardSchemaV1, T, Ctx> = {
  /**
   * Required. Who may run this action, checked inside the action on every call: every Server Action is a public POST
   * endpoint, even one no screen calls anymore. Return the caller (e.g. the user) or null to refuse with "unauthorized";
   * throw `new ActionError("forbidden")` for an authenticated caller without the right.
   */
  authorize: () => Promise<Ctx | null> | Ctx | null;
  /** Validates the input; the handler only ever sees the schema's output. */
  schema: S;
  /** Input larger than this (serialized, files included) is refused before validation. */
  maxInputBytes?: number;
  /** Return false to refuse with "rate-limited", e.g. a counter per user in your store. */
  rateLimit?: (ctx: Ctx) => Promise<boolean> | boolean;
  handler: (input: Output<S>, ctx: Ctx) => Promise<T> | T;
  /** Where unexpected errors go: the server log, never the client. */
  log?: (message: string, error: unknown) => void;
};

function inputSize(input: unknown): number {
  if (typeof FormData !== "undefined" && input instanceof FormData) {
    let n = 0;
    for (const [key, value] of input) n += key.length + (typeof value === "string" ? new TextEncoder().encode(value).length : value.size);
    return n;
  }
  const json = JSON.stringify(input);
  return json === undefined ? 0 : new TextEncoder().encode(json).length;
}

function formToObject(input: unknown) {
  if (typeof FormData === "undefined" || !(input instanceof FormData)) return input;
  const out: Record<string, unknown> = {};
  for (const key of new Set(input.keys())) {
    // Next adds $ACTION_* fields to forms; they are not the caller's input.
    if (key.startsWith("$ACTION")) continue;
    const all = input.getAll(key);
    out[key] = all.length === 1 ? all[0] : all;
  }
  return out;
}

const fieldPath = (path: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined) =>
  (path ?? []).map((p) => String(typeof p === "object" ? p.key : p)).join(".");

/**
 * Wraps a Server Action: authorization (required), rate limit, size limit and schema validation run inside it, in
 * that order, and the result is typed. Errors become a code; their message stays in the server log.
 *
 *   export const rename = secureAction({ authorize: currentUser, schema: z.object({ id: z.string(), name: z.string().max(80) }),
 *     handler: ({ id, name }, user) => db.agents.rename(user, id, name) });
 */
export function secureAction<S extends StandardSchemaV1, T, Ctx>({
  authorize,
  schema,
  maxInputBytes = 64 * 1024,
  rateLimit,
  handler,
  log = console.error,
}: SecureActionOptions<S, T, Ctx>) {
  if (typeof authorize !== "function") throw new Error("secureAction: authorize is required");
  if (!schema?.["~standard"] || typeof schema["~standard"].validate !== "function") throw new Error("secureAction: schema must implement Standard Schema");

  return async function action(input: unknown): Promise<ActionResult<T>> {
    try {
      const ctx = await authorize();
      if (ctx === null || ctx === undefined) return { ok: false, code: "unauthorized" };
      if (rateLimit && !(await rateLimit(ctx))) return { ok: false, code: "rate-limited" };
      let size: number;
      try {
        size = inputSize(input);
      } catch {
        return { ok: false, code: "invalid" };
      }
      if (size > maxInputBytes) return { ok: false, code: "too-large" };
      const result = await schema["~standard"].validate(formToObject(input));
      if (result.issues) return { ok: false, code: "invalid", fields: [...new Set(result.issues.map((i) => fieldPath(i.path)).filter(Boolean))] };
      return { ok: true, data: await handler(result.value as Output<S>, ctx) };
    } catch (error) {
      if (error instanceof ActionError) return { ok: false, code: error.code };
      log("secureAction: action failed", error);
      return { ok: false, code: "failed" };
    }
  };
}

type Taint = (message: string, lifetime: object, value: string | bigint | ArrayBufferView) => void;

/**
 * Marks a secret (token, key) so React refuses to pass it to a Client Component while `lifetime` is alive. Needs
 * `experimental: { taint: true }` in next.config; returns false when the API is not available, so callers can log it.
 */
export function taintSecret(message: string, lifetime: object, value: string) {
  const taint = (React as unknown as { experimental_taintUniquePrincipal?: Taint }).experimental_taintUniquePrincipal;
  if (!taint) return false;
  taint(message, lifetime, value);
  return true;
}
