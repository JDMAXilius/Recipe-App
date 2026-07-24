// Pins for the chat-streaming parsers (node --test, native TS strip).
// The branches worth pinning: escape handling at chunk boundaries in
// extractMessagePrefix, and line/event reassembly in parseSseLines.
import test from 'node:test';
import assert from 'node:assert/strict';
import { extractMessagePrefix, parseSseLines } from './streamParse.ts';

// ---- extractMessagePrefix --------------------------------------------------

test('message key absent → empty string', () => {
  assert.equal(extractMessagePrefix(''), '');
  assert.equal(extractMessagePrefix('{"mode":"cla'), '');
  assert.equal(extractMessagePrefix('{"mode":"clarify","mess'), '');
});

test('key present but value not started yet → empty string', () => {
  assert.equal(extractMessagePrefix('{"mode":"recipe","message"'), '');
  assert.equal(extractMessagePrefix('{"mode":"recipe","message":'), '');
  assert.equal(extractMessagePrefix('{"mode":"recipe","message": '), '');
});

test('plain prefix grows monotonically as the buffer grows', () => {
  const full = '{"mode":"clarify","message":"What kind of pasta?"';
  let prev = '';
  for (let n = 0; n <= full.length; n++) {
    const cur = extractMessagePrefix(full.slice(0, n));
    assert.ok(cur.startsWith(prev), `shrank at ${n}`);
    prev = cur;
  }
  assert.equal(prev, 'What kind of pasta?');
});

test('escaped quotes inside message decode and do not terminate the value', () => {
  const buf = '{"mode":"recipe","message":"He said \\"hi\\" to me';
  assert.equal(extractMessagePrefix(buf), 'He said "hi" to me');
});

test('closing unescaped quote stops the value; later text is ignored', () => {
  const buf = '{"mode":"clarify","message":"Pick one","options":["A","B"]}';
  assert.equal(extractMessagePrefix(buf), 'Pick one');
});

test('chunk split mid-escape: trailing backslash is held back, then completes', () => {
  assert.equal(extractMessagePrefix('{"message":"line one\\'), 'line one');
  assert.equal(extractMessagePrefix('{"message":"line one\\n'), 'line one\n');
});

test('chunk split mid \\uXXXX: held back until all four hex digits arrive', () => {
  assert.equal(extractMessagePrefix('{"message":"caf\\u00'), 'caf');
  assert.equal(extractMessagePrefix('{"message":"caf\\u00e9!"'), 'café!');
});

test('common escapes decode; unknown escapes pass the char through', () => {
  assert.equal(
    extractMessagePrefix('{"message":"a\\tb\\\\c\\/d\\xz"'),
    'a\tb\\c/dxz',
  );
});

// ---- parseSseLines -----------------------------------------------------------

test('multi-event chunk yields every data payload', () => {
  const chunk =
    'event: content_block_delta\ndata: {"a":1}\n\nevent: content_block_delta\ndata: {"b":2}\n\n';
  const r = parseSseLines(chunk, '');
  assert.deepEqual(r.events, ['{"a":1}', '{"b":2}']);
  assert.equal(r.carry, '');
});

test('carry across chunks: a data line split mid-JSON reassembles', () => {
  const r1 = parseSseLines('event: x\ndata: {"delta":{"te', '');
  assert.deepEqual(r1.events, []);
  const r2 = parseSseLines('xt":"hi"}}\n\ndata: {"c":3}\n\n', r1.carry);
  assert.deepEqual(r2.events, ['{"delta":{"text":"hi"}}', '{"c":3}']);
  assert.equal(r2.carry, '');
});

test('event: lines, blanks, and non-JSON data like [DONE] are ignored', () => {
  const r = parseSseLines('event: ping\ndata: [DONE]\n\ndata: {"ok":true}\n\n', '');
  assert.deepEqual(r.events, ['{"ok":true}']);
});

test('CRLF line endings are tolerated', () => {
  const r = parseSseLines('data: {"a":1}\r\n\r\ndata: {"b":2}\r\n', '');
  assert.deepEqual(r.events, ['{"a":1}', '{"b":2}']);
  assert.equal(r.carry, '');
});
