// Pure speech-input logic — zero framework imports so node --test can
// strip-type it directly (speech.logic.test.mjs), same pattern as chat.logic.ts.

// What the screen should toast for a recognition error. null = stay quiet:
// 'aborted' is the user tapping stop, 'interrupted' is a call/Siri/alarm —
// toasting either would read like a bug.
export type SpeechInputError = 'denied' | 'no-speech' | 'error';

export function mapSpeechError(code: string): SpeechInputError | null {
  if (code === 'aborted' || code === 'interrupted') return null;
  if (code === 'not-allowed') return 'denied';
  if (code === 'no-speech' || code === 'speech-timeout') return 'no-speech';
  return 'error';
}

// Joins whatever was typed before the mic started with the session transcript,
// so dictation appends instead of destroying the draft. Empty/whitespace-only
// prefix collapses to the bare transcript.
export function joinTranscript(prefix: string, transcript: string): string {
  const typed = prefix.trimEnd();
  return typed ? typed + ' ' + transcript : transcript;
}
