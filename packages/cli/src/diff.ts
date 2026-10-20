/** A line diff of two texts ("-" local only, "+" registry only) with a little context; null when they are equal. */
export function lineDiff(local: string, registry: string, context = 2): string | null {
  if (local === registry) return null;
  const a = local.split("\n");
  const b = registry.split("\n");
  if (a.length * b.length > 4_000_000) return `files differ (${a.length} vs ${b.length} lines)`;
  // Longest common subsequence table, from the end.
  const lcs = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const ops: [" " | "-" | "+", string][] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) ops.push([" ", a[i++]]), j++;
    else if (i < a.length && (j === b.length || lcs[i + 1][j] >= lcs[i][j + 1])) ops.push(["-", a[i++]]);
    else ops.push(["+", b[j++]]);
  }
  const keep = ops.map((op, k) => op[0] !== " " || ops.slice(Math.max(0, k - context), k + context + 1).some((o) => o[0] !== " "));
  const lines: string[] = [];
  ops.forEach((op, k) => {
    if (keep[k]) lines.push(`${op[0]} ${op[1]}`);
    else if (k === 0 || keep[k - 1]) lines.push("  …");
  });
  return lines.join("\n");
}
