// Search results narrowed by kind (R3.3). Pure; `node --test` loads it.
type Hit = { category: string | null };

/** The kinds present in the results, most common first (ties by name). */
export function kindsIn(hits: readonly Hit[]): string[] {
  const n = new Map<string, number>();
  for (const h of hits) if (h.category) n.set(h.category, (n.get(h.category) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k);
}

/** Only that kind, or everything when none is chosen. */
export function narrowByKind<T extends Hit>(hits: readonly T[], kind: string | null): T[] {
  return kind ? hits.filter((h) => h.category === kind) : [...hits];
}
