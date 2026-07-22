// L3 journey — cook (mise-en-place → step-by-step cook mode).
//
// AUTHORED in M3; the browser portion EXECUTES at SG5 when routes + providers
// boot the Expo web app on :8081 (the recipes-detail → cook route lands then).
// Until then this asserts the cook contract at its source: the deterministic
// step-prep the CookScreen renders (splitSteps / segmentStep / detectStepAction
// / matchStepIngredients) must equal the RECORDED fixture (never invented).
//
// This is an AUTHED journey (finish flips plan_entries.cooked via usePlan) →
// terminal-only until the founder revisits (testing.md cloud/CI split). The
// anon portion below — pure step-prep + the mise/step render — runs anywhere.
//
// tsconfig excludes e2e/**, so this is an L3 artifact run by the journey
// harness, not by tsc/eslint/`npm test`.
import assert from 'node:assert/strict';
import { splitSteps, matchStepIngredients } from '../../src/features/cook/session';
import { segmentStep } from '../../src/features/cook/stepEnrich';
import { detectStepAction, stepActionArt } from '../../src/features/cook/stepAction';
import fixture from '../fixtures/cook.json' with { type: 'json' };

// Minimal structural page contract (mirrors planner.ts) the SG5 harness binds
// Playwright or the Chrome-MCP driver to.
export interface JourneyPage {
  goto(path: string): Promise<void>;
  expectText(text: string): Promise<void>;
  tapText(text: string): Promise<void>;
  screenshot(name: string): Promise<string>;
  consoleErrors(): string[];
}

export interface JourneyResult {
  script: string;
  console_errors: string[];
  screenshots: string[];
}

// --- source-of-truth assertions (run now, no browser) -----------------------
export function assertCookLogic(): void {
  const { input, expected } = fixture['garlic-butter-chicken'];

  // 1) Step splitting is deterministic and lossless.
  const steps = splitSteps(input.rawSteps);
  assert.equal(steps.length, expected.stepCount, `step count ${steps.length} != ${expected.stepCount}`);
  assert.deepEqual(steps, expected.steps, 'split steps must equal the recorded steps');

  // 2) Tappable durations parse to the recorded minutes (upper bound of a range).
  const durations: { step: number; text: string; minutes: number }[] = [];
  steps.forEach((t, i) =>
    segmentStep(t).forEach((s) => {
      if (s.type === 'duration') durations.push({ step: i, text: s.text, minutes: s.minutes });
    }),
  );
  assert.deepEqual(durations, expected.durations, 'parsed durations must equal the recorded set');

  // 3) Otto's per-step action art is the recorded deterministic pick.
  const actions = steps.map((t, i) => ({ step: i, action: detectStepAction(t), art: stepActionArt(t) }));
  assert.deepEqual(actions, expected.actions, 'step actions/art must equal the recorded set');

  // 4) The "You'll need" chips match the recorded ingredient matches per step
  //    (every-significant-word rule: no soy/sauce bleed, plural tolerant).
  const perStep = steps.map((t, i) => ({
    step: i,
    names: matchStepIngredients(t, input.ingredientPairs).map((p) => p.name),
  }));
  assert.deepEqual(perStep, expected.stepIngredients, 'step ingredient matches must equal recorded');
}

// --- browser journey (SG5) --------------------------------------------------
export async function run(page: JourneyPage): Promise<JourneyResult> {
  const screenshots: string[] = [];
  const fail = (msg: string): never => {
    throw new Error(`cook journey: ${msg}`);
  };

  // Guard the rendered pixels with the recorded truth before driving the UI.
  assertCookLogic();
  const { expected } = fixture['garlic-butter-chicken'];

  // 1) Mise-en-place lists the ingredients before the heat goes on.
  await page.goto('/recipe/garlic-butter-chicken/cook');
  await page.expectText('Mise en place');
  await page.tapText('Start cooking');

  // 2) Step screens render the recorded step text + tappable durations.
  await page.expectText('Step 1 of ' + expected.stepCount);
  for (const step of expected.steps) await page.expectText(step.slice(0, 40));
  screenshots.push(await page.screenshot('cook-step-1'));

  // 3) Tapping a duration starts a named timer that surfaces in the hub.
  await page.tapText(expected.durations[0].text);
  await page.expectText('Otto’s timers');
  screenshots.push(await page.screenshot('cook-timer'));

  // 4) Finish arc — Proud Otto.
  await page.goto('/recipe/garlic-butter-chicken/cook?step=' + (expected.stepCount - 1));
  await page.tapText('Finish');
  await page.expectText('Dinner, done.');
  screenshots.push(await page.screenshot('cook-finish'));

  // 5) No console error may have fired anywhere in the run.
  const console_errors = page.consoleErrors();
  if (console_errors.length > 0) fail(`console errors: ${console_errors.join(' | ')}`);

  return { script: 'e2e/journeys/cook.ts', console_errors, screenshots };
}
