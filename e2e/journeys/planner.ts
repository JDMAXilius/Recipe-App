// L3 journey — planner (Otto's week + shopping list).
//
// AUTHORED in M3; EXECUTES at SG5 when routes + providers boot the Expo web
// app on :8081 (testing.md: routes don't exist yet in M3). The concrete page
// driver + auth/seed harness are the integration builder's (SG5) — this file
// targets a minimal structural `JourneyPage` so the harness can bind either
// Playwright or the Chrome-MCP driver to it. See the packet gaps.
//
// Rules honored (docs/contracts/testing.md): assert RECORDED fixture values
// (never element presence alone); ANY console error fails; screenshots ride in
// the report-back. This is an AUTHED journey (plan/shop need a signed-in user)
// → terminal-only until the founder revisits (testing.md cloud/CI split).
import fixture from '../fixtures/planner.json';

export interface JourneyPage {
  goto(path: string): Promise<void>;
  // resolves once visible text matching `text` exists; rejects on timeout.
  expectText(text: string): Promise<void>;
  // ordered list of the aisle section headings currently rendered.
  aisleHeadings(): Promise<string[]>;
  screenshot(name: string): Promise<string>;
  consoleErrors(): string[];
}

export interface JourneyResult {
  script: string;
  console_errors: string[];
  screenshots: string[];
}

export async function run(page: JourneyPage): Promise<JourneyResult> {
  const screenshots: string[] = [];
  const fail = (msg: string): never => {
    throw new Error(`planner journey: ${msg}`);
  };

  // 1) Otto's week renders the rolling 7 days + the planned dishes.
  await page.goto('/plan');
  for (const label of fixture.week.expectedLabels) await page.expectText(label);
  for (const entry of fixture.planEntries) await page.expectText(entry.title);
  screenshots.push(await page.screenshot('planner-week'));

  // 2) Build the list; every RECORDED ingredient row renders with its exact
  //    summed amount + name (e.g. "900 g" "Chicken Breast" — chicken summed
  //    across both dishes; the phantom-partial-sum regression shows here).
  await page.goto('/shopping');
  for (const item of fixture.expectedShoppingList) {
    await page.expectText(item.amount);
    await page.expectText(item.name);
  }

  // 3) Aisle sections appear in canonical order (grouping is deterministic).
  const headings = await page.aisleHeadings();
  const order = fixture.expectedAisleOrder;
  const filtered = headings.filter((h) => order.includes(h));
  if (JSON.stringify(filtered) !== JSON.stringify(order)) {
    fail(`aisle order ${JSON.stringify(filtered)} !== expected ${JSON.stringify(order)}`);
  }
  screenshots.push(await page.screenshot('planner-shopping-list'));

  // 4) No console error may have fired anywhere in the run.
  const console_errors = page.consoleErrors();
  if (console_errors.length > 0) fail(`console errors: ${console_errors.join(' | ')}`);

  return { script: 'e2e/journeys/planner.ts', console_errors, screenshots };
}
