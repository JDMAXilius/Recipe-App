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
      <div class="aisle"><h2>${escapeHtml(aisle)}</h2><ul>${rows
        .map(
          (item) =>
            `<li>${item.amount ? `<span class="qty">${escapeHtml(item.amount)}</span> ` : ""}${escapeHtml(item.name)}${
              item.sources?.length ? ` <span class="src">— for ${escapeHtml(item.sources.join(", "))}</span>` : ""
            }</li>`
        )
        .join("")}</ul></div>`
    )
    .join("");

  const body = `
    <h1>Shopping list</h1>
    <p class="meta">${escapeHtml(description)}</p>
    ${sections}`;

  return page({ title: "Shopping list — Otto", description, image: null, url, body });
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
