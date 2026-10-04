// AI consent — pure state + copy (App Store Guideline 5.1.2(i)). No I/O here,
// so node --test can pin it; the store, the hook and the sheet live in
// aiConsent.ts and ui/AiConsentHost.tsx.
//
// The rule: before anything a person typed, pasted, photographed, or wrote as
// an ingredient leaves for a third-party AI (Anthropic), they have said yes in
// the app — not in a policy they never opened. "Not now" switches Otto's AI
// off and everything else keeps working. The choice is revocable in Account.

export type AiConsentState = 'granted' | 'declined' | 'unknown';

/** A stored blob is trusted only if it is one of the two real answers. */
export function parseAiConsent(raw: unknown): AiConsentState {
  return raw === 'granted' || raw === 'declined' ? raw : 'unknown';
}

/** Only an explicit yes lets data leave. Unknown and declined both mean no. */
export function mayUseAi(state: AiConsentState): boolean {
  return state === 'granted';
}

// One home for the words, so the sheet, the Account row and the FAQ cannot
// drift apart — and so the website copy (TERMINAL_TICKET_WEBSITE_REVIEW_2_1 W5)
// has a single source to match. Name the company, name the data, say what
// happens if you decline. Said once, plainly.
export const AI_CONSENT_COPY = {
  title: 'Otto uses Claude AI',
  lead: 'Imports, Ask Otto and nutrition matching run on Claude, made by Anthropic. Otto sends only what you give the feature:',
  bullets: ['Text, links and photos you share', 'Your questions', 'Ingredient names in your recipes'],
  caption: 'Not used to train AI. Your account stays with Otto. Change anytime in Account › AI features.',
  allow: 'Allow',
  decline: 'Not now',
  settingsLabel: 'AI features',
  settingsCaption: 'Powered by Claude. Details in Privacy Policy.',
  // Runna, Liven, Starling, Structured: every consent card that passed links
  // the policy behind it.
  privacyLead: 'More in our',
  privacyLink: 'Privacy Policy',
  privacyUrl: 'https://ottosapp.com/privacy',
  offToast: 'AI features are off. Turn them on in Account › AI features.',
} as const;
