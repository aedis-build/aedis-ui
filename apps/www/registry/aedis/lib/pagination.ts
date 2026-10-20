/** Largest page count accepted, so a forged total cannot make the list explode. */
export const MAX_PAGES = 100_000;

/**
 * A page number from an untrusted source (URL, form, API): an integer from 1 to `total`. Anything else (NaN, "2e3",
 * "-1", "1.5", huge numbers) falls back to 1 or clamps to the bounds.
 */
export function parsePage(value: unknown, total: number): number {
  const last = pageCount(total);
  const n = typeof value === "number" ? value : typeof value === "string" && /^\s*\d{1,9}\s*$/.test(value) ? Number(value) : NaN;
  return Number.isInteger(n) ? Math.min(last, Math.max(1, n)) : 1;
}

function pageCount(total: number) {
  return Number.isInteger(total) && total > 0 ? Math.min(total, MAX_PAGES) : 1;
}

/** Pages to show around the current one, with "ellipsis" where pages are skipped: [1, "ellipsis", 4, 5, 6, "ellipsis", 20]. */
export function paginationRange(page: unknown, total: number, siblings = 1): (number | "ellipsis")[] {
  const last = pageCount(total);
  const current = parsePage(page, last);
  const s = Number.isInteger(siblings) ? Math.min(Math.max(siblings, 0), 5) : 1;
  const start = Math.max(2, current - s);
  const end = Math.min(last - 1, current + s);
  const out: (number | "ellipsis")[] = [1];
  if (start > 2) out.push(start === 3 ? 2 : "ellipsis");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < last - 1) out.push(end === last - 2 ? last - 1 : "ellipsis");
  if (last > 1) out.push(last);
  return out;
}
