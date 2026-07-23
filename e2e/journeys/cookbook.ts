// L3 browser journey — cookbook. Drives Expo web (:8081) with Playwright
// (cloud headless / terminal Chrome MCP). Any console error fails the journey;
// assertions check RECORDED fixture values, not element presence alone.
// Executes at SG5 integration (docs/contracts/testing.md).
//
// Cloud/CI scope = ANON portion (browse/render/empty states). The authed
// save/unsave portion is terminal-only and runs only once cookbook.json's
// `authed` values are recorded against the otto-e2e user.
//
// NOTE: the /cookbook route is wired by the app/ owner at integration, not by
// this feature packet. This script assumes it resolves at run time.

import { chromium, type Browser, type ConsoleMessage, type Page } from 'playwright';
import fixture from '../fixtures/cookbook.json';

type JourneyResult = {
  script: string;
  console_errors: string[];
  failed_assertions: string[];
  screenshots: string[];
};

function assert(cond: unknown, msg: string, sink: string[]) {
  if (!cond) sink.push(msg);
}

async function textPresent(page: Page, needle: string): Promise<boolean> {
  return page.getByText(needle, { exact: false }).first().isVisible().catch(() => false);
}

export async function runCookbookJourney(
  baseUrl = 'http://localhost:8081',
): Promise<JourneyResult> {
  const console_errors: string[] = [];
  const failed_assertions: string[] = [];
  const screenshots: string[] = [];

  const browser: Browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() === 'error') console_errors.push(m.text());
  });

  try {
    await page.goto(`${baseUrl}${fixture.route}`, { waitUntil: 'networkidle' });

    // Header + segments render.
    assert(await textPresent(page, fixture.header), 'header "Cookbook" missing', failed_assertions);
    for (const label of fixture.segments) {
      assert(await textPresent(page, label), `segment "${label}" missing`, failed_assertions);
    }
    assert(await textPresent(page, fixture.cookedChip), 'Cooked chip missing', failed_assertions);

    // Anon: Saved segment shows the paw-teaching empty state (verbatim copy).
    await page.getByText('Saved', { exact: true }).first().click();
    assert(
      await textPresent(page, fixture.anon.savedEmptyTitle),
      `saved empty title mismatch (want "${fixture.anon.savedEmptyTitle}")`,
      failed_assertions,
    );
    assert(
      await textPresent(page, fixture.anon.savedEmptyBody),
      'saved empty body mismatch',
      failed_assertions,
    );

    // Anon: My recipes empty state.
    await page.getByText('My recipes', { exact: true }).first().click();
    assert(
      await textPresent(page, fixture.anon.mineEmptyTitle),
      `mine empty title mismatch (want "${fixture.anon.mineEmptyTitle}")`,
      failed_assertions,
    );

    // Anon: Cooked filter empty state.
    await page.getByText(fixture.cookedChip, { exact: true }).first().click();
    assert(
      await textPresent(page, fixture.anon.cookedEmptyTitle),
      `cooked empty title mismatch (want "${fixture.anon.cookedEmptyTitle}")`,
      failed_assertions,
    );

    const shot = 'e2e/screenshots/cookbook-anon.png';
    await page.screenshot({ path: shot, fullPage: true });
    screenshots.push(shot);

    // Authed save/unsave — terminal-only, and only when recorded (else skipped,
    // never silently passed; the skip is reported in the packet gaps).
    if (fixture.authed.savedCount != null) {
      failed_assertions.push('authed portion recorded but not implemented in this packet — record at SG5');
    }
  } finally {
    await browser.close();
  }

  return {
    script: 'e2e/journeys/cookbook.ts',
    console_errors,
    failed_assertions,
    screenshots,
  };
}

// Allow `node --import tsx e2e/journeys/cookbook.ts` style direct runs at SG5.
if (import.meta.url === `file://${process.argv[1]}`) {
  runCookbookJourney().then((r) => {
    console.log(JSON.stringify(r, null, 2));
    const failed = r.console_errors.length > 0 || r.failed_assertions.length > 0;
    process.exit(failed ? 1 : 0);
  });
}
