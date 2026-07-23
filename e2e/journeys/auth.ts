// L3 journey — auth happy path: sign-up → sign-in → sign-out (testing.md).
// AUTHORED NOW, EXECUTES AT SG5 against Expo web :8081 under the integration
// harness. It is deliberately harness-agnostic: it drives a minimal JourneyPage
// the SG5 runner supplies (Chrome MCP in terminal / headless in cloud) and
// asserts RECORDED fixture values, not mere element presence.
//
// Auth note per testing.md cloud/CI split: sign-up + sign-in + sign-out all
// mutate auth state, so this is an AUTHED journey — it runs at the terminal
// checkpoints, not in cloud. The anon portion (rendering the sign-in screen,
// its console staying clean) is the cloud-verifiable slice.
import fixture from '../fixtures/auth.json';
import { displayNameFor } from '../../src/features/auth/username';

// Minimal driver the SG5 runner implements over its browser of choice.
export interface JourneyPage {
  goto(path: string): Promise<void>;
  fillByLabel(label: string, value: string): Promise<void>;
  tapByLabel(label: string): Promise<void>;
  // visible text of the current screen (for title / greeting assertions)
  visibleText(): Promise<string>;
  // any console error seen so far — ANY entry fails the journey (testing.md)
  consoleErrors(): string[];
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`auth journey: ${msg}`);
}

export async function run(page: JourneyPage): Promise<void> {
  const { signup, screens } = fixture;
  // Unique email per run; derived display name is invariant (see fixture note).
  const email = `${signup.emailLocal}-${Date.now()}@${signup.emailDomain}`;
  const expectedName = signup.expectedDisplayName;

  // The fixture's expected name is not invented — it is exactly what the real
  // name logic derives from this email. Pin that invariant here.
  assert(
    displayNameFor({ email }) === expectedName,
    `fixture expectedDisplayName '${expectedName}' must equal displayNameFor('${email}') = '${displayNameFor({ email })}'`,
  );

  // 1) SIGN UP -------------------------------------------------------------
  await page.goto('/(auth)/sign-up');
  assert((await page.visibleText()).includes(screens.signUpTitle), 'sign-up screen did not render');
  await page.fillByLabel('Email', email);
  await page.fillByLabel('Password', signup.password);
  await page.tapByLabel("Join Otto's kitchen");
  // auto-confirm on → session starts, route guard leaves the auth stack
  assert(
    !(await page.visibleText()).includes(screens.signUpTitle),
    'still on sign-up screen after joining — sign-up did not establish a session',
  );

  // 2) SIGN OUT then SIGN IN with the same credentials ---------------------
  await page.goto('/(auth)/sign-in');
  assert((await page.visibleText()).includes(screens.signInTitle), 'sign-in screen did not render');
  await page.fillByLabel('Email', email);
  await page.fillByLabel('Password', signup.password);
  await page.tapByLabel('Sign in');
  assert(
    !(await page.visibleText()).includes(screens.signInTitle),
    'still on sign-in screen after signing in — credentials from sign-up did not authenticate',
  );

  // Signed-in surfaces greet the user by their derived name — assert the
  // RECORDED value, not just "some text".
  assert(
    (await page.visibleText()).includes(expectedName),
    `signed-in screen should greet '${expectedName}'`,
  );

  // 3) SIGN OUT ------------------------------------------------------------
  await page.tapByLabel('Sign out');
  await page.goto('/(auth)/sign-in');
  assert(
    (await page.visibleText()).includes(screens.signInTitle),
    'sign-out did not return to the sign-in screen',
  );

  // ANY console error fails the journey (testing.md).
  assert(page.consoleErrors().length === 0, `console errors: ${page.consoleErrors().join('; ')}`);
}
