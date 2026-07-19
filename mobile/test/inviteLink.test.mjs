import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInviteToken } from "../lib/inviteLink.mjs";

const TOKEN = "aB3-x_9zQ2";

test("accepts a plain invite URL", () => {
  assert.equal(parseInviteToken(`https://getotto.app/hl/${TOKEN}`), TOKEN);
});

test("accepts the shapes messaging apps actually produce", () => {
  assert.equal(parseInviteToken(`https://getotto.app/hl/${TOKEN}/`), TOKEN);
  assert.equal(parseInviteToken(`https://getotto.app/hl/${TOKEN}?utm_source=whatsapp`), TOKEN);
  assert.equal(parseInviteToken(`Join our list https://getotto.app/hl/${TOKEN} — I'll grab milk`), TOKEN);
});

test("accepts a bare token pasted on its own", () => {
  assert.equal(parseInviteToken(`  ${TOKEN}  `), TOKEN);
});

test("refuses prose and unrelated links instead of inventing a token", () => {
  assert.equal(parseInviteToken("https://example.com/somepage"), null);
  assert.equal(parseInviteToken("no link here at all"), null);
  assert.equal(parseInviteToken(""), null);
});
