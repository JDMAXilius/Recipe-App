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
  const og = [
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    description ? `<meta property="og:description" content="${escapeHtml(description)}">` : "",
    image ? `<meta property="og:image" content="${escapeHtml(image)}">` : "",
    url ? `<meta property="og:url" content="${escapeHtml(url)}">` : "",
    `<meta property="og:type" content="article">`,
    image ? `<meta name="twitter:card" content="summary_large_image">` : "",
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
  // and all, on every shared artifact.
  const attribution =
    row.source === "imported" && row.sourceUrl
      ? `<p class="attr">From <a href="${escapeHtml(row.sourceUrl)}" rel="noopener nofollow">${escapeHtml(row.sourceName || row.sourceUrl)}</a> — imported into Otto with the credit attached.</p>`
      : "";

  const body = `
    ${row.image ? `<img class="hero" src="${escapeHtml(row.image)}" alt="">` : ""}
    <h1>${escapeHtml(row.title)}</h1>
    <p class="meta">${escapeHtml(description)}</p>
    <h2>Ingredients</h2>
    <ul>${ingredientsHtml}</ul>
    ${steps.length ? `<h2>Method</h2><ol>${stepsHtml}</ol>` : ""}
    ${attribution}`;

  return page({ title: row.title, description, image: row.image, url, body });
}

// The list page is a hand-painted torn notepad sheet (shopping list v2 —
// same paper as the app screen; texture served at /share-assets/…). The
// paper is texture only: every word on it comes from the sender's payload.
const LIST_STYLE = `
  body{margin:0;font-family:Georgia,'Times New Roman',serif;color:#2B2118;line-height:1.5;
    /* painterly warm wood table behind the sheet */
    background:#A9763F;
    background-image:
      repeating-linear-gradient(178deg, rgba(58,36,16,.10) 0 2px, rgba(0,0,0,0) 2px 9px),
      repeating-linear-gradient(2deg, rgba(255,224,178,.07) 0 3px, rgba(0,0,0,0) 3px 14px),
      radial-gradient(120% 90% at 50% 40%, rgba(0,0,0,0) 55%, rgba(58,36,16,.35) 100%)}
  /* the sheet IS the painting: torn top, creases, curled corner and its own
     cast shadow live in the alpha-cutout artwork; stretching keeps every
     painted edge attached no matter how long the list runs */
  .sheet{max-width:560px;margin:18px auto 10px;padding:70px 40px 84px 52px;
    background:url('/share-assets/paper-note.png') center/100% 100% no-repeat;
    position:relative}
  /* classic notepad margin line, terracotta and quiet */
  .sheet::before{content:"";position:absolute;top:76px;bottom:92px;left:38px;
    border-left:1.5px solid rgba(196,86,46,.28)}
  h1{font-size:1.9rem;line-height:1.15;margin:0 0 2px}
  .meta{color:#8A7A66;font-size:.95rem;margin:0}
  h2{font-style:italic;font-weight:600;font-size:1.06rem;color:#C4562E;margin:26px 0 2px}
  .rule{width:92px;border-bottom:1px solid rgba(196,86,46,.45);margin-bottom:6px}
  ul{list-style:none;padding:0;margin:0}
  li{display:flex;gap:12px;align-items:baseline;padding:9px 0;border-bottom:1px solid #E6D9C2}
  .box{width:15px;height:15px;border:2px solid #8A5A33;border-radius:50%;flex:none;align-self:center}
  .qty{color:#C4562E;font-weight:bold}
  .src{color:#8A7A66;font-size:.85rem}
  .sign{margin-top:30px;color:#8A7A66;font-size:.85rem;font-style:italic}
`;

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
            `<li><span class="box"></span><span>${
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
  ${url ? `<meta property="og:url" content="${escapeHtml(url)}">` : ""}
  <meta property="og:type" content="article">
  <style>${LIST_STYLE}</style>
</head>
<body>
  <main class="sheet">
    <h1>Shopping list</h1>
    <p class="meta">${escapeHtml(description)}</p>
    ${sections}
    <p class="sign">Shared from Otto, the quieter kind of cookbook.</p>
  </main>
</body>
</html>`;
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
