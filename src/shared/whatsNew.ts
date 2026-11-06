// "What's new" once per release (R8.4). Pure; `node --test` loads it.
// A release is major.minor: 1.1.0 and 1.1.3 are the same release; a patch
// never shows the sheet again.

export function releaseOf(version: string | null | undefined): string | null {
  const m = /^(\d+)\.(\d+)/.exec(version ?? '');
  return m ? `${Number(m[1])}.${Number(m[2])}` : null;
}

function newer(a: string, b: string): boolean {
  const [am, an] = a.split('.').map(Number);
  const [bm, bn] = b.split('.').map(Number);
  return am !== bm ? am > bm : an > bn;
}

/** Show when this release has notes and the person last saw an older one.
 *  Never seen (null) = someone who used Otto before this tracked anything:
 *  show it. A new install marks the release seen on Welcome instead. */
export function shouldShowWhatsNew(lastSeen: unknown, current: string | null, hasNotes: boolean): boolean {
  const now = releaseOf(current);
  if (!now || !hasNotes) return false;
  const seen = typeof lastSeen === 'string' ? releaseOf(lastSeen) : null;
  return seen === null || newer(now, seen);
}
