// Pure caption/entity helpers for import-recipe — no imports, so both Deno
// (the edge fn) and `node --test` (caption.test.mjs) can load them.

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => codePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => codePoint(Number(n)));
}

// fromCodePoint throws past U+10FFFF; a malformed entity must not fail an import.
function codePoint(n: number): string {
  return n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
}

function metaContent(html: string, key: string): string | null {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m =
    html.match(new RegExp(`<meta\\b[^>]*?(?:property|name)=["']${k}["'][^>]*?content="([^"]*)"`, "i")) ||
    html.match(new RegExp(`<meta\\b[^>]*?content="([^"]*)"[^>]*?(?:property|name)=["']${k}["']`, "i"));
  return m ? decodeEntities(m[1]).trim() : null;
}

export function captionFromHtml(html: string): { text: string; author: string | null } | null {
  const text = metaContent(html, "og:description") || metaContent(html, "description");
  if (!text) return null;
  // Instagram prefixes "N likes, M comments - handle on Date: " — the handle is
  // the credit, the rest is noise.
  const ig = text.match(/^[\d,.]+[KMk]? likes?, [\d,.]+[KMk]? comments? - ([\w.]+) on [^:]+: ?([\s\S]*)$/);
  if (ig) return { text: ig[2].replace(/^"|"\.?$/g, "").trim(), author: ig[1] };
  return { text, author: null };
}

