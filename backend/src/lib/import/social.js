// I1a — import from social links (TikTok / Instagram), per
// docs/IMPORT_SHARE_RESEARCH.md §2. Deterministic-first: the caption comes
// from the platforms' public oEmbed endpoints (TikTok's is keyless; Meta
// dropped the Instagram token requirement June 2026), and when the caption
// links a recipe page we chase it into the existing schema.org importer —
// the highest-quality outcome, zero LLM cost. Caption-only posts fall back
// to the LLM extraction seam (extractRecipe.js), which stays dormant until
// ANTHROPIC_API_KEY lands (C21 pattern: built, wired, honestly gated).
//
// Legal posture (research §2, hiQ / Meta v. Bright Data): user-initiated,
// logged-out, single-post, text-only derivation with immutable attribution.
// The media itself is never fetched or stored. We also don't store oEmbed
// thumbnail URLs as the recipe image — those CDN links are signed and
// expire, and a recipe card that rots into a broken image is a dead end.
import net from "node:net";
import { importRecipeFromUrl, fetchPublicHtml } from "../importRecipe.js";
import { extractionActive, extractRecipeFromText } from "./extractRecipe.js";
import { ENV } from "../../config/env.js";

// Honest, user-facing failures — the client shows these verbatim.
export class SocialImportError extends Error {
  constructor(code, platform) {
    super(SOCIAL_ERROR_COPY[code] || SOCIAL_ERROR_COPY.unreachable);
    this.name = "SocialImportError";
    this.code = code;
    this.platform = platform || null;
  }
}

const SOCIAL_ERROR_COPY = {
  unreachable:
    "Otto couldn't reach that post — it may be private, deleted, or the app is being shy.",
  "no-caption":
    "Otto opened the post but there's no written recipe in the caption. If the creator links the full recipe, paste that link instead.",
  "no-recipe":
    "Otto read the caption but couldn't find a recipe written in it — some creators keep the recipe in the video only, and Otto can't watch those yet.",
  "extraction-dormant":
    "Otto found the caption but can't turn captions into recipes just yet — that part of the kitchen opens soon. If the caption links a recipe page, paste that link instead.",
};

export function detectSocialPlatform(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
  if (host === "instagram.com" || host.endsWith(".instagram.com") || host === "instagr.am")
    return "instagram";
  return null;
}

// Creators very often put the real recipe on their blog and link it in the
// caption — chasing that link beats parsing prose. Skip hosts that never
// carry recipe JSON-LD (other socials, link hubs, shop links).
const NEVER_RECIPE_HOSTS = [
  "instagram.com",
  "tiktok.com",
  "facebook.com",
  "fb.com",
  "youtube.com",
  "youtu.be",
  "twitter.com",
  "x.com",
  "linktr.ee",
  "beacons.ai",
  "amzn.to",
  "amazon.com",
];

export function firstExternalUrl(text) {
  for (const match of String(text || "").matchAll(/https?:\/\/[^\s"'<>()[\]]+/gi)) {
    const candidate = match[0].replace(/[.,;:!?]+$/, "");
    try {
      const host = new URL(candidate).hostname.toLowerCase().replace(/^www\./, "");
      const excluded =
        !net.isIP(host) &&
        NEVER_RECIPE_HOSTS.some((bad) => host === bad || host.endsWith(`.${bad}`));
      if (!excluded) return candidate;
    } catch {
      // malformed candidate — keep scanning
    }
  }
  return null;
}

const OEMBED_TIMEOUT_MS = 10000;

async function fetchOembedJson(endpoint) {
  const response = await fetch(endpoint, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(OEMBED_TIMEOUT_MS),
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

// TikTok oEmbed is public and keyless; `title` carries the caption.
async function fetchTikTokPost(url) {
  const data = await fetchOembedJson(
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
  );
  if (!data) throw new SocialImportError("unreachable", "tiktok");
  return {
    caption: String(data.title || "").trim(),
    authorName: data.author_name ? String(data.author_name) : null,
  };
}

export function instagramShortcode(rawUrl) {
  try {
    const match = new URL(rawUrl).pathname.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// The public /embed/captioned page carries the caption in a Caption div —
// the logged-out fallback when oEmbed doesn't include it.
export function parseEmbedCaption(html) {
  const match = String(html || "").match(
    /<div[^>]*class="[^"]*Caption[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );
  if (!match) return null;
  const text = match[1]
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
  return text || null;
}

// Meta's oEmbed is tokenless since 2026-06; an optional app token
// (META_OEMBED_TOKEN, "appid|appsecret") raises the rate limits.
async function fetchInstagramPost(url) {
  let authorName = null;
  const token = ENV.META_OEMBED_TOKEN
    ? `&access_token=${encodeURIComponent(ENV.META_OEMBED_TOKEN)}`
    : "";
  const data = await fetchOembedJson(
    `https://graph.facebook.com/v23.0/instagram_oembed?url=${encodeURIComponent(url)}&omitscript=true${token}`
  ).catch(() => null);
  if (data) {
    authorName = data.author_name ? String(data.author_name) : null;
    // Captions in IG oEmbed are not guaranteed — title first, then any text
    // salvageable from the embed html blockquote.
    const caption = String(data.title || "").trim() || parseEmbedCaption(data.html) || "";
    if (caption) return { caption, authorName };
  }

  const shortcode = instagramShortcode(url);
  if (!shortcode) throw new SocialImportError("unreachable", "instagram");
  let html;
  try {
    ({ html } = await fetchPublicHtml(
      new URL(`https://www.instagram.com/p/${shortcode}/embed/captioned/`)
    ));
  } catch {
    throw new SocialImportError("unreachable", "instagram");
  }
  const caption = parseEmbedCaption(html);
  if (!caption) throw new SocialImportError("no-caption", "instagram");
  return { caption, authorName };
}

const PLATFORM_LABEL = { tiktok: "TikTok", instagram: "Instagram" };

export async function importFromSocialUrl(rawUrl) {
  const platform = detectSocialPlatform(rawUrl);
  const post =
    platform === "tiktok" ? await fetchTikTokPost(rawUrl) : await fetchInstagramPost(rawUrl);

  // Best path: the caption links the real recipe page — deterministic import.
  const linked = firstExternalUrl(post.caption);
  if (linked) {
    try {
      const draft = await importRecipeFromUrl(linked);
      if (draft) return draft; // blog attribution is the honest one — keep it
    } catch {
      // linked page unreadable — fall back to the caption itself
    }
  }

  if (!post.caption) throw new SocialImportError("no-caption", platform);
  if (!extractionActive()) throw new SocialImportError("extraction-dormant", platform);

  const extracted = await extractRecipeFromText({
    text: post.caption,
    platform,
    authorName: post.authorName,
  });
  if (!extracted) throw new SocialImportError("no-recipe", platform);

  return {
    ...extracted,
    image: null, // oEmbed thumbnails expire — never store a rotting link
    sourceUrl: String(rawUrl).slice(0, 2000),
    sourceName: (post.authorName
      ? `${post.authorName} on ${PLATFORM_LABEL[platform]}`
      : PLATFORM_LABEL[platform]
    ).slice(0, 200),
  };
}
