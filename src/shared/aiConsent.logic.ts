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
  title: 'Otto uses AI for this',
  body: [
    'To write recipes, read what you paste or photograph, answer your questions and match ingredients to nutrition data, Otto sends that content through our server to Anthropic, the company that makes the Claude AI model.',
    'Only what you give the feature goes: the words you type, the link, text or photo you share, and the ingredient names in your recipes. Your email and the rest of your account stay with us.',
    'Change this anytime in Account › Otto and AI. Your cookbook, cook mode, plan and shopping list work either way.',
  ],
  allow: 'Allow',
  decline: 'Not now',
  settingsLabel: 'Otto and AI',
  settingsCaption: 'Ask Otto, imports and nutrition matching use Anthropic’s Claude.',
  offToast: 'Otto’s AI is off. Turn it on in Account › Otto and AI.',
} as const;
