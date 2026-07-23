// L3 journey — import (the ＋ flow: paste a link OR write your own).
//
// AUTHORED in M3; EXECUTES at SG5 when routes + providers boot the Expo web app
// on :8081 (routes don't exist in M3). The concrete page driver + auth/seed
// harness are the integration builder's (SG5); this file targets a minimal
// structural `JourneyPage` so the harness can bind Playwright or the Chrome-MCP
// driver to it.
//
// Rules honored (docs/contracts/testing.md): assert RECORDED fixture copy (never
// element presence alone); ANY console error fails; screenshots ride in the
// report-back. The write-it-myself half is anon-observable (blank editor renders
// without a session). The real URL-import→review→save half is AUTHED and
// terminal-only — its fixture block is null until recorded at SG5, and skipped
// while null (no silent-cap: the skip is reported in `gaps`).
import fixture from '../fixtures/import.json';

export interface JourneyPage {
  goto(path: string): Promise<void>;
  // resolves once visible text matching `text` exists; rejects on timeout.
  expectText(text: string): Promise<void>;
  // type `value` into the field with the given accessibility label.
  fill(label: string, value: string): Promise<void>;
  // press the control (button/link) with the given accessible name.
  press(name: string): Promise<void>;
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
    throw new Error(`import journey: ${msg}`);
  };

  // 1) The ＋ sheet offers both live modes.
  await page.goto(fixture.addSheet.route);
  await page.expectText(fixture.addSheet.title);
  await page.expectText(fixture.addSheet.importCta);
  await page.expectText(fixture.addSheet.writeCta);
  screenshots.push(await page.screenshot('import-add-sheet'));

  // 2) "Write it myself" opens the blank editor with all its sections (no
  //    network, no session needed to render the form).
  await page.press(fixture.addSheet.writeCta);
  await page.expectText(fixture.editor.newHeading);
  await page.expectText(fixture.editor.ottoPanelTitle);
  for (const label of fixture.editor.labels) await page.expectText(label);
  await page.expectText(fixture.editor.saveCta);
  screenshots.push(await page.screenshot('import-blank-editor'));

  // 3) Authed: paste a real link → deterministic import → review editor shows
  //    the RECORDED title + an ingredient the parser pulled (the user reviews
  //    before any save — no silent AI). Skipped until recorded at SG5.
  const authed = fixture.authed;
  if (authed.importUrl) {
    await page.goto(fixture.addSheet.route);
    await page.fill('Recipe link', authed.importUrl);
    await page.press(fixture.addSheet.importCta);
    await page.expectText(authed.reviewHeading as string);
    await page.expectText(authed.expectedTitle as string);
    await page.expectText(authed.expectedIngredient as string);
    screenshots.push(await page.screenshot('import-review'));

    await page.press(fixture.editor.saveCta);
    await page.expectText(authed.savedRedirect as string);
    screenshots.push(await page.screenshot('import-saved'));
  }

  // 4) No console error may have fired anywhere in the run.
  const console_errors = page.consoleErrors();
  if (console_errors.length > 0) fail(`console errors: ${console_errors.join(' | ')}`);

  return { script: 'e2e/journeys/import.ts', console_errors, screenshots };
}
