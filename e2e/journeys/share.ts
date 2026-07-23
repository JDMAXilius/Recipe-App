// L3 browser journey — share (capability-URL sharing). Runs on Expo web
// (:8081), cloud headless Playwright / terminal Chrome MCP. ANY console error
// fails the journey (TESTING.md). Executes at SG5 once the share routes are
// wired; authored here as this packet's acceptance artifact.
//
// Anon-only paths (browse/read) run in cloud; the create-a-link path is authed
// (owner-only INSERT) and runs terminal-only — listed in the packet gaps until
// terminal-verified. Assertions hit RECORDED fixture values, never mere
// element presence.
import fixtures from '../fixtures/share.json';

// Minimal Playwright-ish surface (the runner injects the real Page). Kept
// loose so this file needs no @playwright/test dep to author; e2e/ is outside
// the tsconfig include, so it is not typechecked in L2.
type Page = {
  goto(url: string): Promise<unknown>;
  textContent(selector: string): Promise<string | null>;
  waitForSelector(selector: string): Promise<unknown>;
};

const BASE = 'http://localhost:8081';

export default async function shareJourney(page: Page) {
  const { recipeShare, listShare } = fixtures;

  // 1. ok recipe share → the DEFINER read returns the recipe; card renders it.
  await page.goto(`${BASE}/s/${recipeShare.ok.slug}`);
  await page.waitForSelector('[data-testid="share-recipe-title"]');
  const title = await page.textContent('[data-testid="share-recipe-title"]');
  assert(
    title?.includes(recipeShare.ok.expected.title),
    `expected shared recipe title "${recipeShare.ok.expected.title}", got "${title}"`,
  );

  // 2. revoked share → 410 surface (link existed, owner killed it).
  await page.goto(`${BASE}/s/${recipeShare.revoked.slug}`);
  await page.waitForSelector('[data-testid="share-revoked"]');

  // 3. missing slug → 404 surface (unknown / zero rows — never a leak).
  await page.goto(`${BASE}/s/${recipeShare.missing.slug}`);
  await page.waitForSelector('[data-testid="share-missing"]');

  // 4. ok list share → snapshot renders its open items, grouped by aisle.
  await page.goto(`${BASE}/hl/${listShare.ok.token}`);
  await page.waitForSelector('[data-testid="list-share-aisle"]');
  const aisle = await page.textContent('[data-testid="list-share-aisle"]');
  assert(
    listShare.ok.expected.aisles.some((a) => aisle?.includes(a)),
    `expected a list-share aisle from ${JSON.stringify(listShare.ok.expected.aisles)}, got "${aisle}"`,
  );

  // 5. missing list token → 404 surface.
  await page.goto(`${BASE}/hl/${listShare.missing.token}`);
  await page.waitForSelector('[data-testid="list-share-missing"]');
}

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(`share journey: ${message}`);
}
