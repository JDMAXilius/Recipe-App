// S2 — share pages. Pure renderers: these pin escaping (user-authored
// content is hostile input), OG meta for crawlers, and attribution.
import test from "node:test";
import assert from "node:assert/strict";
import {
  makeShareToken,
  escapeHtml,
  renderRecipePage,
  renderListPage,
  renderGonePage,
  renderNotFoundPage,
} from "../src/lib/sharePages.js";

test("share tokens are url-safe, long enough, and non-repeating", () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const token = makeShareToken();
    assert.match(token, /^[A-Za-z0-9_-]{12}$/);
    assert.ok(!seen.has(token));
    seen.add(token);
  }
});

test("escapeHtml neutralizes markup in user content", () => {
  assert.equal(
    escapeHtml(`<script>alert("x")</script>'`),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&#39;"
  );
});

const RECIPE_ROW = {
  title: `Nana's "Best" Pie <3`,
  image: "https://cdn.example.com/pie.jpg",
  servings: 6,
  source: "imported",
  sourceUrl: "https://blog.example.com/pie",
  sourceName: "Nana's Blog",
  ingredients: [
    { measure: "2 cups", name: "flour" },
    { measure: "", name: "a pinch of <love>" },
  ],
  steps: ["Mix it all.", "Bake <hot>."],
};

test("recipe page carries OG meta, escaped content, and attribution", () => {
  const html = renderRecipePage(RECIPE_ROW, "https://otto.app/r/abc123def456");
  // crawlers read these without running JS
  assert.match(html, /<meta property="og:title" content="Nana&#39;s &quot;Best&quot; Pie &lt;3">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/cdn\.example\.com\/pie\.jpg">/);
  assert.match(html, /2 ingredients · 2 steps · serves 6/);
  // hostile content never lands unescaped
  assert.ok(!html.includes("<love>"));
  assert.ok(!html.includes("Bake <hot>"));
  // attribution is immutable — it travels on the shared page
  assert.match(html, /href="https:\/\/blog\.example\.com\/pie"/);
  assert.match(html, /Nana&#39;s Blog/);
});

test("list page groups by aisle and keeps provenance", () => {
  const html = renderListPage(
    {
      items: [
        { name: "tomatoes", amount: "4", aisle: "Produce", sources: ["World's Best Lasagna"] },
        { name: "flour", amount: "2 cups", aisle: "Pantry", sources: [] },
        { name: "batteries", amount: "", aisle: "", sources: [] },
      ],
    },
    "https://otto.app/l/tok"
  );
  assert.match(html, /Produce/);
  assert.match(html, /for World&#39;s Best Lasagna/);
  assert.match(html, /Everything else/); // aisle-less items still land somewhere
  assert.match(html, /3 things to pick up/);
});

test("gone and not-found pages exist and say so honestly", () => {
  assert.match(renderGonePage(), /put away/i);
  assert.match(renderNotFoundPage(), /couldn&#39;t find that page|couldn't find that page/i);
});
