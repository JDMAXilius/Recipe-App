// Client-minted capability-URL tokens. Per the security contract, token
// entropy is now the client's job — the slug/token IS the secret, so it must
// come from a CSPRNG, never Math.random. 9 random bytes → 12 base64url chars
// (no padding), which lands inside the /hl/<token> [A-Za-z0-9_-]{8,24} shape.
//
// ponytail: uses Web Crypto (globalThis.crypto.getRandomValues) — native
// platform feature, present on Expo web + the Node test runner. React Native
// (Hermes) has no global crypto until expo-crypto polyfills it; see the
// expo-crypto contract_gap in this packet's report-back. Swap the source line
// for expo-crypto's getRandomValues once that dep lands — signature-identical.

const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function mintToken(bytes = 9): string {
  const buf = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(buf);

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
