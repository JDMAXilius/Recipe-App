// L3 browser journey — recipes (Discover + recipe detail). Drives Expo web
// (:8081) with Playwright (cloud headless / terminal Chrome MCP). Any console
// error fails the journey; assertions check RECORDED fixture values, never
// element presence alone. Executes at SG5 integration (docs/contracts/testing.md).
//
// Two parts:
//   1. Anon browse (browser) — Discover renders its stable chrome. Cloud/CI
//      scope = this anon path (no auth, no recorded catalogue values: the seed
//      grid is live TheMealDB, so only the deterministic chrome is asserted).
//   2. Detail nutrition (recorded engine) — the number the merged NutritionCard
//      renders IS computeNutrition's output; asserted here against the RECORDED
//      fixture, macro split included, with carbs held to a trace (the phantom-20g
//      regression). Wire the on-screen pixel read when a seeded detail route
//      exists (same TODO shape as nutrition.ts).
import { chromium, type Browser, type ConsoleMessage, type Page } from 'playwright';
import { computeNutrition } from '../../src/features/nutrition/engine/compute';
import fixture from '../fixtures/recipes.json' with { type: 'json' };

type JourneyResult = {
  script: string;
  console_errors: string[];
  failed_assertions: string[];
  screenshots: string[];
};

function check(cond: unknown, msg: string, sink: string[]) {
  if (!cond) sink.push(msg);
}

async function textPresent(page: Page, needle: string): Promise<boolean> {
  return page.getByText(needle, { exact: false }).first().isVisible().catch(() => false);
}

async function placeholderPresent(page: Page, text: string): Promise<boolean> {
  return page.getByPlaceholder(text).first().isVisible().catch(() => false);
}

export async function runRecipesJourney(
  baseUrl = 'http://localhost:8081',
): Promise<JourneyResult> {
  const console_errors: string[] = [];
  const failed_assertions: string[] = [];
  const screenshots: string[] = [];

  // ── Part 2 (no browser): the recorded-engine nutrition assertion. Runs first
  // so a broken engine fails fast even without a dev server. ──────────────────
  const { input, expected } = fixture.detail['garlic-butter-chicken'];
  const out = computeNutrition({ ingredients: input.ingredients, servings: input.servings });
  check(out, 'garlic butter chicken must compute — never the category template', failed_assertions);
  if (out) {
    check(out.kcal === expected.kcal, `kcal ${out.kcal} != ${expected.kcal}`, failed_assertions);
    check(out.protein_g === expected.protein_g, `protein ${out.protein_g} != ${expected.protein_g}`, failed_assertions);
    check(out.carbs_g === expected.carbs_g, `carbs ${out.carbs_g} != ${expected.carbs_g}`, failed_assertions);
    check(out.fat_g === expected.fat_g, `fat ${out.fat_g} != ${expected.fat_g}`, failed_assertions);
    check(out.carbs_g <= 5, `phantom carbs are back: ${out.carbs_g}g`, failed_assertions);
    check(out.kcal >= 320 && out.kcal <= 500, `kcal ${out.kcal} outside golden range`, failed_assertions);
  }

  // ── Part 1: anon browse ─────────────────────────────────────────────────────
  const browser: Browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() === 'error') console_errors.push(m.text());
  });

  try {
    await page.goto(`${baseUrl}${fixture.discover.route}`, { waitUntil: 'networkidle' });

    check(
      await placeholderPresent(page, fixture.discover.searchPlaceholder),
      `Discover search pill missing (want placeholder "${fixture.discover.searchPlaceholder}")`,
      failed_assertions,
    );

    const shot = 'e2e/screenshots/recipes-discover-anon.png';
    await page.screenshot({ path: shot, fullPage: true });
    screenshots.push(shot);
  } finally {
    await browser.close();
  }

  return {
    script: 'e2e/journeys/recipes.ts',
    console_errors,
    failed_assertions,
    screenshots,
  };
}

// TODO(recipes-detail render): once a seeded detail route resolves at :8081,
// open it, read the on-screen Protein/Carbs/Fat, and assert they equal the
// recorded `expected` — the pixel-level guard the engine assert stands in for.
if (import.meta.url === `file://${process.argv[1]}`) {
  runRecipesJourney().then((r) => {
    console.log(JSON.stringify(r, null, 2));
    const failed = r.console_errors.length > 0 || r.failed_assertions.length > 0;
    process.exit(failed ? 1 : 0);
  });
}
