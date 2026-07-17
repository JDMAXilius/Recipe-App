// I1a — social import. Network is stubbed: these pin platform detection,
// caption parsing, the blog-URL chase, and the honest failure modes — not
// TikTok's or Meta's uptime. The LLM seam stays dormant in tests (no key).
import test from "node:test";
import assert from "node:assert/strict";

process.env.ANTHROPIC_API_KEY = ""; // extraction must be dormant here

const {
  detectSocialPlatform,
  firstExternalUrl,
  instagramShortcode,
  parseEmbedCaption,
  importFromSocialUrl,
  SocialImportError,
} = await import("../src/lib/import/social.js");

test("detects platforms from hosts, not paths", () => {
  assert.equal(detectSocialPlatform("https://www.tiktok.com/@chef/video/123"), "tiktok");
  assert.equal(detectSocialPlatform("https://vm.tiktok.com/ZM123abc/"), "tiktok");
  assert.equal(detectSocialPlatform("https://www.instagram.com/reel/Cabc123/"), "instagram");
  assert.equal(detectSocialPlatform("https://instagr.am/p/Cabc123/"), "instagram");
  assert.equal(detectSocialPlatform("https://example.com/tiktok.com/fake"), null);
  assert.equal(detectSocialPlatform("https://mytiktok.company.com/x"), null);
  assert.equal(detectSocialPlatform("not a url"), null);
});

test("firstExternalUrl skips socials and link hubs, keeps real sites", () => {
  assert.equal(
    firstExternalUrl("Full recipe: https://myblog.com/lasagna! Follow https://instagram.com/me"),
    "https://myblog.com/lasagna"
  );
  assert.equal(firstExternalUrl("links https://linktr.ee/chef and https://youtu.be/x"), null);
  assert.equal(firstExternalUrl("no links here #recipe #fyp"), null);
  // trailing punctuation is stripped, IP hosts allowed
  assert.equal(firstExternalUrl("see https://198.51.100.7/pie."), "https://198.51.100.7/pie");
});

test("instagram shortcode extraction covers p/reel/reels/tv", () => {
  assert.equal(instagramShortcode("https://www.instagram.com/p/Cab_12-xyz/"), "Cab_12-xyz");
  assert.equal(instagramShortcode("https://www.instagram.com/reel/XYZ789/?igsh=1"), "XYZ789");
  assert.equal(instagramShortcode("https://www.instagram.com/chefotto/"), null);
});

test("parseEmbedCaption strips tags and keeps line breaks honest", () => {
  const html = `<div class="Content"><div class="Caption"><a>chefotto</a> Lasagna night!<br>2 cups flour<br/><span>4 eggs</span></div></div>`;
  assert.equal(parseEmbedCaption(html), "chefotto Lasagna night!\n2 cups flour\n 4 eggs");
  assert.equal(parseEmbedCaption("<div>no caption div</div>"), null);
});

// --- pipeline tests with stubbed fetch --------------------------------

const JSONLD_PAGE = `<html><head><script type="application/ld+json">
  {"@type":"Recipe","name":"World-Famous Lasagna","recipeIngredient":["2 cups flour","4 eggs"],
   "recipeInstructions":"Mix. Bake.","recipeYield":"6",
   "author":{"name":"My Blog"}}
</script></head><body></body></html>`;

function stubFetch(routes) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    for (const [needle, respond] of routes) {
      if (url.includes(needle)) return respond(url);
    }
    throw new Error(`unexpected fetch in test: ${url}`);
  };
  return () => {
    globalThis.fetch = realFetch;
  };
}

const json = (body) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
const html = (body) =>
  new Response(body, { status: 200, headers: { "content-type": "text/html" } });

test("tiktok caption with a blog link chases into the JSON-LD importer", async () => {
  const restore = stubFetch([
    [
      "tiktok.com/oembed",
      () => json({ title: "LASAGNA 🔥 full recipe: https://198.51.100.7/lasagna", author_name: "chefotto" }),
    ],
    ["198.51.100.7/lasagna", () => html(JSONLD_PAGE)],
  ]);
  try {
    const draft = await importFromSocialUrl("https://www.tiktok.com/@chefotto/video/123");
    assert.equal(draft.title, "World-Famous Lasagna");
    assert.equal(draft.servings, 6);
    assert.equal(draft.ingredients.length, 2);
    // blog attribution wins — it's the original source
    assert.equal(draft.sourceName, "My Blog");
  } finally {
    restore();
  }
});

test("caption-only post is honest about the dormant extraction seam", async () => {
  const restore = stubFetch([
    [
      "tiktok.com/oembed",
      () => json({ title: "2 cups flour, 4 eggs. Mix and bake!", author_name: "chefotto" }),
    ],
  ]);
  try {
    await assert.rejects(
      importFromSocialUrl("https://www.tiktok.com/@chefotto/video/123"),
      (error) => error instanceof SocialImportError && error.code === "extraction-dormant"
    );
  } finally {
    restore();
  }
});

test("empty caption fails as no-caption, unreachable post as unreachable", async () => {
  let restore = stubFetch([
    ["tiktok.com/oembed", () => json({ title: "", author_name: "chefotto" })],
  ]);
  try {
    await assert.rejects(
      importFromSocialUrl("https://www.tiktok.com/@chefotto/video/123"),
      (error) => error.code === "no-caption"
    );
  } finally {
    restore();
  }

  restore = stubFetch([["tiktok.com/oembed", () => new Response("nope", { status: 404 })]]);
  try {
    await assert.rejects(
      importFromSocialUrl("https://www.tiktok.com/@chefotto/video/999"),
      (error) => error.code === "unreachable"
    );
  } finally {
    restore();
  }
});

test("instagram falls back to the captioned embed page when oEmbed is silent", async () => {
  const restore = stubFetch([
    ["graph.facebook.com", () => new Response("denied", { status: 400 })],
    [
      "instagram.com/p/Cabc123/embed/captioned",
      () =>
        html(
          `<div class="Caption">Full recipe here: https://198.51.100.7/lasagna</div>`
        ),
    ],
    ["198.51.100.7/lasagna", () => html(JSONLD_PAGE)],
  ]);
  try {
    const draft = await importFromSocialUrl("https://www.instagram.com/p/Cabc123/");
    assert.equal(draft.title, "World-Famous Lasagna");
  } finally {
    restore();
  }
});
