// S2 — public share pages (IMPORT_SHARE_RESEARCH.md §3.3). Crawlers
// (WhatsApp, iMessage, Slack) run no JavaScript, so rich link previews
// require server-rendered OG meta — these tiny pages are that, plus a
// human-readable rendering and an honest "made with Otto" footer.
// Everything user-authored is HTML-escaped; attribution always travels.
import crypto from "node:crypto";

// ~72 bits of CSPRNG — unguessable, collision-safe at any realistic scale.
export const makeShareToken = () => crypto.randomBytes(9).toString("base64url");

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Escaping stops tag injection but NOT a `javascript:` (or `data:`) scheme
// sitting inside href/src — an imported recipe carrying sourceUrl:"javascript:…"
// would be a live XSS on the public /r/:slug page. So every user-supplied URL
// gets parsed (not regexed — the URL parser is what browsers agree with on
// tab/newline/case tricks) and only http/https survives. "" means "don't
// render this attribute at all", which every call site below handles.
export function safeUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const { protocol } = new URL(raw);
    return protocol === "http:" || protocol === "https:" ? raw : "";
  } catch {
    return ""; // relative or malformed — nothing user-supplied should be either
  }
}

// Palette mirrors mobile/constants (terracotta on cream) — one glance says Otto.
const PAGE_STYLE = `
  body{margin:0;font-family:Georgia,'Times New Roman',serif;background:#FAF4EA;color:#2B2118;line-height:1.55}
  main{max-width:640px;margin:0 auto;padding:32px 20px 56px}
  h1{font-size:2rem;line-height:1.2;margin:0 0 4px}
  .meta{color:#8A7A66;font-size:.95rem;margin:0 0 24px}
  h2{font-size:.85rem;letter-spacing:.12em;text-transform:uppercase;color:#C4562E;margin:32px 0 8px}
  ul,ol{padding-left:22px;margin:0}
  li{margin:6px 0}
  img.hero{width:100%;border-radius:14px;margin:0 0 20px;display:block}
  .qty{color:#C4562E}
  .attr{margin-top:28px;padding-top:14px;border-top:1px solid #E8DCC8;font-size:.95rem}
  .attr a{color:#C4562E}
  footer{max-width:640px;margin:0 auto;padding:0 20px 40px;color:#8A7A66;font-size:.85rem}
  .aisle{margin-top:20px}
  .src{color:#8A7A66;font-size:.85rem}
`;

function page({ title, description, image, url, body }) {
  const ogImage = safeUrl(image);
  const ogUrl = safeUrl(url);
  const og = [
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    description ? `<meta property="og:description" content="${escapeHtml(description)}">` : "",
    ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : "",
    ogUrl ? `<meta property="og:url" content="${escapeHtml(ogUrl)}">` : "",
    `<meta property="og:type" content="article">`,
    ogImage ? `<meta name="twitter:card" content="summary_large_image">` : "",
  ]
    .filter(Boolean)
    .join("\n  ");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  ${og}
  <style>${PAGE_STYLE}</style>
</head>
<body>
  <main>${body}</main>
  <footer>Shared from Otto, the quieter kind of cookbook.</footer>
</body>
</html>`;
}

// row: recipes table row (user recipe). url: this page's absolute URL.
export function renderRecipePage(row, url) {
  const pairs = Array.isArray(row.ingredients) ? row.ingredients : [];
  const steps = Array.isArray(row.steps) ? row.steps : [];
  const description = `${pairs.length} ingredients · ${steps.length} steps${row.servings ? ` · serves ${row.servings}` : ""}`;

  const ingredientsHtml = pairs
    .map(
      (pair) =>
        `<li>${pair.measure ? `<span class="qty">${escapeHtml(pair.measure)}</span> ` : ""}${escapeHtml(pair.name)}</li>`
    )
    .join("");
  const stepsHtml = steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");

  // Attribution is immutable — imported recipes keep the source, live link
  // and all, on every shared artifact. A non-http(s) sourceUrl loses the link
  // but NOT the credit: the name still shows, as plain text.
  const href = safeUrl(row.sourceUrl);
  const credit = escapeHtml(row.sourceName || row.sourceUrl);
  const attribution =
    row.source === "imported" && row.sourceUrl
      ? `<p class="attr">From ${
          href ? `<a href="${escapeHtml(href)}" rel="noopener nofollow">${credit}</a>` : credit
        } — imported into Otto with the credit attached.</p>`
      : "";

  const heroSrc = safeUrl(row.image);
  const body = `
    ${heroSrc ? `<img class="hero" src="${escapeHtml(heroSrc)}" alt="">` : ""}
    <h1>${escapeHtml(row.title)}</h1>
    <p class="meta">${escapeHtml(description)}</p>
    <h2>Ingredients</h2>
    <ul>${ingredientsHtml}</ul>
    ${steps.length ? `<h2>Method</h2><ol>${stepsHtml}</ol>` : ""}
    ${attribution}`;

  return page({ title: row.title, description, image: row.image, url, body });
}

// The list page is a printed stationery pad (generated cutout served at
// /share-assets/…; regenerate with ../assets/make-paper-note.mjs). The
// paper is texture only: every word on it comes from the sender's payload.
const LIST_STYLE = `
  body{margin:0;font-family:Georgia,'Times New Roman',serif;color:#2B2118;line-height:1.5;
    background:#FAF4EA} /* the app's cream — the pad is the object on it */
  /* the pad: generated printed-sheet cutout (frame, stacked edge and cast
     shadow live in the artwork); stretched so the printed frame follows the
     content no matter how long the list runs */
  .sheet{position:relative;max-width:560px;margin:22px auto 14px;padding:38px 44px 64px;
    background:url('/share-assets/paper-note.png') center/100% 100% no-repeat}
  /* Otto's paw trail — printed motif walking onto the pad from the top-left
     corner, toward the list (classic stationery convention: prints alternate
     across the travel line, toes pointing where he's headed). Drawn in the
     page, not the paper texture, so the prints keep their shape however far
     the pad stretches; sits before the banner in the DOM so on narrow
     screens any overlap tucks behind the flag. */
  .paws{position:absolute;left:7.5%;top:5.6%;width:52px;pointer-events:none}
  /* printed banner flag, like the "things to do:" pad */
  .flag{width:230px;margin:0 auto 4px;text-align:center;background:#2B2118;color:#FAF4EA;
    font-size:15px;font-weight:700;letter-spacing:3px;padding:10px 0 16px;
    clip-path:polygon(0 0,100% 0,100% 100%,50% calc(100% - 9px),0 100%)}
  .meta{color:#8A7A66;font-size:.8rem;letter-spacing:2px;text-transform:uppercase;
    text-align:center;margin:6px 0 4px}
  h2{font-size:.85rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;
    color:#2B2118;margin:24px 0 4px}
  .rule{border-top:1.5px solid rgba(196,86,46,.5);height:0;margin-bottom:6px}
  ul{list-style:none;padding:0;margin:0}
  li{display:flex;gap:12px;align-items:baseline;padding:9px 0;
    border-bottom:1.5px dotted #B9A98C}
  /* printed bullet — the page is a plain list, nothing pretends to be tappable */
  .dot{width:7px;height:7px;border-radius:50%;background:#8A5A33;opacity:.6;flex:none;align-self:center}
  .qty{color:#C4562E;font-weight:bold}
  .src{color:#8A7A66;font-size:.85rem}
  .sign{margin-top:30px;color:#8A7A66;font-size:.85rem;font-style:italic;text-align:center}
`;

// Otto's paw prints: one reusable paw (big pad + four toes), stamped three
// times along a diagonal gait toward the corner. Decoration only.
const PAW_TRAIL = `<svg class="paws" viewBox="0 0 60 130" aria-hidden="true">
  <defs><g id="paw" fill="#C4562E" opacity=".30">
    <ellipse cx="0" cy="6.5" rx="10.5" ry="8.5"/>
    <ellipse cx="-10.5" cy="-6.5" rx="4.2" ry="5.4" transform="rotate(-22 -10.5 -6.5)"/>
    <ellipse cx="-3.6" cy="-11" rx="4" ry="5.2" transform="rotate(-7 -3.6 -11)"/>
    <ellipse cx="3.6" cy="-11" rx="4" ry="5.2" transform="rotate(7 3.6 -11)"/>
    <ellipse cx="10.5" cy="-6.5" rx="4.2" ry="5.4" transform="rotate(22 10.5 -6.5)"/>
  </g></defs>
  <use href="#paw" transform="translate(19 18) rotate(174) scale(.78)"/>
  <use href="#paw" transform="translate(40 56) rotate(158) scale(.84)"/>
  <use href="#paw" transform="translate(25 98) rotate(170) scale(.9)"/>
</svg>`;

// payload: {items: [{name, amount, aisle, sources[]}]} — the sender's snapshot.
export function renderListPage(payload, url) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const description = `${items.length} things to pick up`;

  const byAisle = new Map();
  for (const item of items) {
    const aisle = item.aisle || "Everything else";
    if (!byAisle.has(aisle)) byAisle.set(aisle, []);
    byAisle.get(aisle).push(item);
  }
  const sections = [...byAisle.entries()]
    .map(
      ([aisle, rows]) => `
      <h2>${escapeHtml(aisle)}</h2><div class="rule"></div><ul>${rows
        .map(
          (item) =>
            `<li><span class="dot"></span><span>${
              item.amount ? `<span class="qty">${escapeHtml(item.amount)}</span> ` : ""
            }${escapeHtml(item.name)}${
              item.sources?.length ? ` <span class="src">— for ${escapeHtml(item.sources.join(", "))}</span>` : ""
            }</span></li>`
        )
        .join("")}</ul>`
    )
    .join("");

  // the paper itself makes a warm link preview
  let paperImage = null;
  try {
    paperImage = new URL("/share-assets/paper-note.png", url).href;
  } catch {
    // relative page render (tests) — preview image is optional
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Shopping list — Otto</title>
  <meta property="og:title" content="Shopping list — Otto">
  <meta property="og:description" content="${escapeHtml(description)}">
  ${paperImage ? `<meta property="og:image" content="${escapeHtml(paperImage)}">` : ""}
  ${safeUrl(url) ? `<meta property="og:url" content="${escapeHtml(safeUrl(url))}">` : ""}
  <meta property="og:type" content="article">
  <style>${LIST_STYLE}</style>
</head>
<body>
  <main class="sheet">
    ${PAW_TRAIL}
    <h1 class="flag">SHOPPING LIST</h1>
    <p class="meta">${escapeHtml(description)}</p>
    ${sections}
    <p class="sign">Shared from Otto, the quieter kind of cookbook.</p>
  </main>
</body>
</html>`;
}

// Landing page for a collaborative-list link opened in a browser: the list
// itself lives in the app, so this page explains how to join. It never
// shows the items — the browser visitor hasn't joined anything yet.
export function renderJoinPage(itemCount, url) {
  const description =
    itemCount === 1 ? "1 thing on it so far" : `${itemCount} things on it so far`;
  return page({
    title: "You're invited to a shared list",
    description,
    image: null,
    url,
    body: `
    <h1>You're invited to a shared list</h1>
    <p class="meta">${escapeHtml(description)}</p>
    <p>Someone wants to share their Otto shopping list with you — add things,
    check things off, everyone sees the same list.</p>
    <h2>How to join</h2>
    <ol>
      <li>Open <strong>Otto</strong> and go to your shopping list</li>
      <li>Tap the <strong>shared list</strong> (people) icon</li>
      <li>Paste this link when it asks for one</li>
    </ol>`,
  });
}

export function renderNotFoundPage() {
  return page({
    title: "Nothing simmering here",
    description: "",
    image: null,
    url: null,
    body: `<h1>Nothing simmering here</h1><p class="meta">Otto couldn't find that page — the link may be mistyped or very old.</p>`,
  });
}

export function renderGonePage() {
  return page({
    title: "This link has been put away",
    description: "",
    image: null,
    url: null,
    body: `<h1>This link has been put away</h1><p class="meta">Whoever shared it turned it off — nothing to see here anymore.</p>`,
  });
}
