// Voice into the composer (SPEAK_TO_OTTO.md Phase 1). On-device STT via
// expo-speech-recognition: interim transcripts stream to onTranscript, the
// caller owns the TextInput state and every toast — this hook is UI-free.
import { useCallback, useEffect, useRef, useState } from 'react';
import { joinTranscript, mapSpeechError, type SpeechInputError } from './speech.logic';

type SpeechModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

// Loaded lazily: requireNativeModule throws on builds without the compiled
// module (build ≤31, Expo Go), and a static import would take the whole chat
// tab down with it. Catch → available:false → the coming-soon toast survives.
let speech: SpeechModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  speech = (require('expo-speech-recognition') as { ExpoSpeechRecognitionModule: SpeechModule })
    .ExpoSpeechRecognitionModule;
} catch {
  speech = null;
}

function checkAvailable(): boolean {
  if (!speech) return false;
  try {
    return speech.isRecognitionAvailable(); // false on web without Web Speech API
  } catch {
    return false;
  }
}

export function useSpeechInput(
  onTranscript: (text: string) => void,
  onError?: (kind: SpeechInputError) => void,
) {
  const [listening, setListening] = useState(false);
  const [available] = useState(checkAvailable);
  // Listeners register once; refs keep them pointed at the latest callbacks.
  const callbacks = useRef({ onTranscript, onError });
  callbacks.current = { onTranscript, onError };
  // What was typed before the mic started; every result re-joins onto it.
  const prefixRef = useRef('');
  // True while requestPermissionsAsync is in flight: makes toggle/start a
  // no-op so two quick taps can't open two sessions.
  const startingRef = useRef(false);
  // Once stop() is requested, trailing result events (the recognizer's final
  // flush) are dropped until the next start, so a sent draft stays sent.
  const ignoreResultsRef = useRef(false);

  useEffect(() => {
    if (!speech) return;
    const subs = [
      // Both interim and final results carry the session's full transcript,
      // so the latest one replaces the spoken part; the typed prefix survives.
      speech.addListener('result', (ev) => {
        if (ignoreResultsRef.current) return;
        const text = ev.results[0]?.transcript;
        if (text) callbacks.current.onTranscript(joinTranscript(prefixRef.current, text));
      }),
      speech.addListener('end', () => setListening(false)),
      speech.addListener('error', (ev) => {
        setListening(false);
        const kind = mapSpeechError(ev.error);
        if (kind) callbacks.current.onError?.(kind);
      }),
    ];
    return () => {
      subs.forEach((s) => s.remove());
      // Unmount mid-dictation (e.g. sign-out) must not leave the OS mic
      // session hot; abort is safe to call when no session is active.
      try {
        speech?.abort();
      } catch {
        // native module gone or no session: nothing to release
      }
    };
  }, []);

  // start(prefix): the caller's live draft at the moment the mic opens.
  const start = useCallback(async (prefix = '') => {
    if (!speech || startingRef.current) return;
    startingRef.current = true;
    try {
      const perm = await speech.requestPermissionsAsync();
      if (!perm.granted) {
        callbacks.current.onError?.('denied'); // available stays true — retry allowed
        return;
      }
      prefixRef.current = prefix;
      ignoreResultsRef.current = false;
      setListening(true);
      speech.start({ lang: 'en-US', interimResults: true });
    } finally {
      startingRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    ignoreResultsRef.current = true; // drop the recognizer's trailing flush
    speech?.stop(); // final result + "end" event follow; "end" flips listening
  }, []);

  const toggle = useCallback(
    (prefix = '') => {
      if (listening) stop();
      else void start(prefix);
    },
    [listening, start, stop],
  );

  return { listening, available, start, stop, toggle };
}
