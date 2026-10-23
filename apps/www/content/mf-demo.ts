import { hostMessages, childMessages } from "@/registry/aedis/lib/mf-context";
import type { MessageSpec } from "@/registry/aedis/lib/mf-bridge";

/** The live demo on /micro-frontends: what the shell and the billing remote say to each other, each type validated. */
export type Invoice = { id: string; amount: number };
type Empty = Record<string, never>;

const isEmpty = (p: unknown): p is Empty => typeof p === "object" && p !== null && !Array.isArray(p) && Object.keys(p).length === 0;
const isInvoice = (p: unknown): p is Invoice =>
  typeof p === "object" && p !== null && /^INV-\d{4}$/.test(String((p as Invoice).id)) && Number.isFinite((p as Invoice).amount) && (p as Invoice).amount >= 0;

/** The remote's path, served by this site and framed by the shell. */
export const REMOTE_PATH = "/demo/remote/billing";

/** What the shell accepts from the remote: the context messages, plus "invoice selected". */
export const shellMessages = { ...hostMessages, "billing:invoice": { validate: isInvoice } as MessageSpec<Invoice> };

/** What the remote accepts from the shell: theme, locale, session end, a status request and the demo's "hang". */
export const remoteMessages = {
  ...childMessages(["en"]),
  "billing:status": { validate: isEmpty } as MessageSpec<Empty>,
  "demo:hang": { validate: isEmpty } as MessageSpec<Empty>,
};

export const invoices: Invoice[] = [
  { id: "INV-4821", amount: 48.2 },
  { id: "INV-4822", amount: 1260 },
  { id: "INV-4830", amount: 312.5 },
];
