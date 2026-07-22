// L3 journey — profile ("You" tab + settings sub-screens).
//
// AUTHORED in M3; EXECUTES at SG5 when routes + providers boot the Expo web
// app on :8081 (testing.md: routes don't exist yet in M3). The concrete page
// driver + auth/seed harness are the integration builder's (SG5) — this file
// targets the minimal structural `JourneyPage` so the harness can bind either
// Playwright or the Chrome-MCP driver to it.
//
// Rules honored (docs/contracts/testing.md): assert RECORDED/authored fixture
// values (never element presence alone); ANY console error fails; screenshots
// ride in the report-back. This is an AUTHED journey (the "You" tab needs a
// signed-in user) → terminal-only until the founder revisits the cloud/CI split.
import fixture from '../fixtures/profile.json';

export interface JourneyPage {
  goto(path: string): Promise<void>;
  // resolves once visible text matching `text` exists; rejects on timeout.
  expectText(text: string): Promise<void>;
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
    throw new Error(`profile journey: ${msg}`);
  };

  // 1) The "You" tab renders the earned-stat doors, the units segments, and
  //    the honest exits (quiet sign-out + visible account deletion).
  await page.goto('/profile');
  for (const label of fixture.statDoors) await page.expectText(label);
  for (const seg of fixture.unitSegments) await page.expectText(seg);
  for (const section of fixture.sections) await page.expectText(section);
  for (const exit of fixture.exits) await page.expectText(exit);
  screenshots.push(await page.screenshot('profile-you'));

  // 2) Each settings sub-screen mounts and renders its anchor copy.
  for (const key of Object.keys(fixture.subScreens) as (keyof typeof fixture.subScreens)[]) {
    const sub = fixture.subScreens[key];
    await page.goto(sub.path);
    await page.expectText(sub.title);
    await page.expectText(sub.expect);
    screenshots.push(await page.screenshot(`profile-${key}`));
  }

  // 3) No console error may have fired anywhere in the run.
  const console_errors = page.consoleErrors();
  if (console_errors.length > 0) fail(`console errors: ${console_errors.join(' | ')}`);

  return { script: 'e2e/journeys/profile.ts', console_errors, screenshots };
}
