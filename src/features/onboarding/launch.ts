// Where the app opens (R0.1): one pure decision, replacing gate.ts. React-free
// so every branch is tested (launch.test.mjs); app/index.tsx maps the state
// to a route with LAUNCH_HREF and app/_layout guards routes with canUseApp.
//
// The order (ADR-0005, ADR-0013): a new person answers the questions and sees
// a week before any account; "Save your plan" makes the account; then Otto
// Club; then the app. Nobody uses the app without an account AND the club.
// Unknown is never "yes": while anything is still loading the answer is
// `loading` (the launch screen), and an offline fresh install fails closed
// onto the paywall, which has Try again and Restore.

export type Launch =
  | 'loading' // still finding out: keep the launch screen up
  | 'welcome' // first launch on this phone
  | 'resumeDraft' // signed out with answers and a week waiting: back to Save your plan
  | 'signIn' // this phone has been used before
  | 'needsPlan' // signed in, this account never answered the questions
  | 'paywall' // signed in, never a member
  | 'pending' // a purchase waits for approval (Ask to Buy)
  | 'ended' // was a member, isn't now
  | 'app';

/** Otto Club, from RevenueCat (club.logic membershipState). */
export type Membership = 'unknown' | 'member' | 'ended' | 'none';

export interface LaunchInput {
  authReady: boolean;
  signedIn: boolean;
  /** Signed in: this account has answered the questions (or holds a draft
   *  being claimed). Signed out: this phone has been used. null = loading. */
  onboarded: boolean | null;
  /** Answers + a week saved on the phone before the account (R0.3). null = loading. */
  hasDraft: boolean | null;
  membership: Membership;
  /** A purchase returned "pending" and hasn't resolved (R2.2). */
  purchasePending: boolean;
}

export function resolveLaunch(i: LaunchInput): Launch {
  if (!i.authReady || i.onboarded === null || i.hasDraft === null) return 'loading';
  if (!i.signedIn) return i.hasDraft ? 'resumeDraft' : i.onboarded ? 'signIn' : 'welcome';
  // A draft on a signed-in phone is being claimed (AuthProvider): the answers
  // exist, so the person goes on to the club, not back to the questions.
  if (!i.onboarded && !i.hasDraft) return 'needsPlan';
  switch (i.membership) {
    case 'unknown':
      return 'loading';
    case 'member':
      return 'app';
    case 'ended':
      return 'ended';
    case 'none':
      return i.purchasePending ? 'pending' : 'paywall';
  }
}

// Where each state opens. One table: when a new screen lands (Welcome R1.2,
// first week R1.4, club outcomes R2.2/R2.6) only its row changes. Until then
// a state opens the closest screen that exists today.
export const LAUNCH_HREF: Record<Exclude<Launch, 'loading'>, string> = {
  welcome: '/(auth)/sign-up', // flowV2: '/welcome' (R1.2)
  resumeDraft: '/(auth)/sign-up', // → Save your plan (R1.5)
  signIn: '/(auth)/sign-in',
  needsPlan: '/onboarding', // flowV2: '/about/1' (R1.3)
  paywall: '/otto-club',
  pending: '/otto-club', // → '/club/pending' (R2.2)
  ended: '/otto-club', // → '/club/ended' (R2.6)
  app: '/(tabs)',
};

// The rework's screens (flags.flowV2): the first-run questions and week
// replace sign-up-first. Same rule: one row per state.
export const LAUNCH_HREF_V2: Partial<typeof LAUNCH_HREF> = {
  welcome: '/welcome',
  needsPlan: '/about/1',
  pending: '/club/pending',
  ended: '/club/ended',
};

export function launchHref(state: Exclude<Launch, 'loading'>, flowV2: boolean): string {
  return (flowV2 && LAUNCH_HREF_V2[state]) || LAUNCH_HREF[state];
}

/** The route guard: only a signed-in member uses the app. */
export function canUseApp(signedIn: boolean, membership: Membership): boolean {
  return signedIn && membership === 'member';
}

// What `onboarded` means, from the stored value (useOnboarded): signed in →
// has THIS account finished on this phone; signed out → has this phone been
// used. Stored is the list of finished user ids; a legacy `true` (the old
// per-device flag) = used, no ids.
export function onboardedFor(stored: boolean | string[], uid: string | undefined): boolean {
  const ids = Array.isArray(stored) ? stored : [];
  return uid ? ids.includes(uid) : Array.isArray(stored) ? ids.length > 0 : stored;
}
