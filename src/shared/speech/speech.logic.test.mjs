// Colocated unit tests for speech pure logic (node --test, native TS strip).
// Run: node --test src/features/chat/speech.logic.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { joinTranscript, mapSpeechError } from './speech.logic.ts';

test('mapSpeechError: user stop and system interruption stay silent', () => {
  assert.equal(mapSpeechError('aborted'), null);
  assert.equal(mapSpeechError('interrupted'), null);
});

test('mapSpeechError: permission refusal → denied', () => {
  assert.equal(mapSpeechError('not-allowed'), 'denied');
});

test('mapSpeechError: silence → no-speech (both platform codes)', () => {
  assert.equal(mapSpeechError('no-speech'), 'no-speech');
  assert.equal(mapSpeechError('speech-timeout'), 'no-speech');
});

test('mapSpeechError: everything else → generic error', () => {
  assert.equal(mapSpeechError('network'), 'error');
  assert.equal(mapSpeechError('busy'), 'error');
  assert.equal(mapSpeechError('unknown'), 'error');
});

test('joinTranscript: typed prefix survives dictation', () => {
  assert.equal(
    joinTranscript('no cilantro, and ', 'use lime instead'),
    'no cilantro, and use lime instead',
  );
});

test('joinTranscript: empty or whitespace prefix → bare transcript', () => {
  assert.equal(joinTranscript('', 'use lime instead'), 'use lime instead');
  assert.equal(joinTranscript('   ', 'use lime instead'), 'use lime instead');
});
