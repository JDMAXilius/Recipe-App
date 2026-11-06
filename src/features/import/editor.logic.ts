// Editor list moves (R6.7). Pure; `node --test` loads it. Each returns a new
// array and never loses or duplicates a row.

/** Put `item` right after `index` (inline add: return on a row adds the next). */
export function insertAfter<T>(list: readonly T[], index: number, item: T): T[] {
  const at = Math.min(Math.max(index + 1, 0), list.length);
  return [...list.slice(0, at), item, ...list.slice(at)];
}

/** Move one row by `by` places (-1 up, +1 down); out of range = unchanged copy. */
export function moveBy<T>(list: readonly T[], index: number, by: number): T[] {
  const to = index + by;
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return [...list];
  const next = [...list];
  const [row] = next.splice(index, 1);
  next.splice(to, 0, row);
  return next;
}
