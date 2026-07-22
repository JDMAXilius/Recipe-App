// Client-minted capability-URL tokens. Per the security contract, token
// entropy is now the client's job — the slug/token IS the secret, so it must
// come from a CSPRNG, never Math.random. 9 random bytes → 12 base64url chars
// (no padding), which lands inside the /hl/<token> [A-Za-z0-9_-]{8,24} shape.
//
// CSPRNG token via globalThis.crypto.getRandomValues — present on web and the
// Node test runner. React Native (Hermes) has no global crypto until a polyfill
// installs it; the app entry (app/_layout) imports 'react-native-get-random-
// values' at the native-deps wiring stage so this works on device too. Until
// then we throw a CLEAR error rather than the cryptic TypeError the review
// flagged as a native share crash.
const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function mintToken(bytes = 9): string {
  const source = globalThis.crypto;
  if (!source?.getRandomValues) {
    throw new Error(
      'Secure token generation needs crypto.getRandomValues — install the native polyfill (react-native-get-random-values) before creating share links on device.',
    );
  }
  const buf = new Uint8Array(bytes);
  source.getRandomValues(buf);

  let out = '';
  for (let i = 0; i < buf.length; i += 3) {
    const b0 = buf[i];
    const b1 = i + 1 < buf.length ? buf[i + 1] : 0;
    const b2 = i + 2 < buf.length ? buf[i + 2] : 0;
    out += ALPHABET[b0 >> 2];
    out += ALPHABET[((b0 & 3) << 4) | (b1 >> 4)];
    if (i + 1 < buf.length) out += ALPHABET[((b1 & 15) << 2) | (b2 >> 6)];
    if (i + 2 < buf.length) out += ALPHABET[b2 & 63];
  }
  return out;
}
