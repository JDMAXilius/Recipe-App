// Caption fallback parsing (node --test, native TS strip). Pins the Instagram
// description shape the import relies on for creator credit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { captionFromHtml, decodeEntities } from './caption.ts';

const ig = `<meta name="description" content="11 likes, 2 comments - paradisekitchenn on June 17, 2024: &quot;Orange Cookies
Ingredients:
- 550 g flour&quot;. " />`;

test('captionFromHtml: Instagram description → caption + handle', () => {
  const c = captionFromHtml(ig);
  assert.equal(c.author, 'paradisekitchenn');
  assert.equal(c.text, 'Orange Cookies\nIngredients:\n- 550 g flour');
});

test('captionFromHtml: plain og:description, either attribute order', () => {
  assert.deepEqual(captionFromHtml('<meta content="Mix and bake." property="og:description">'), {
    text: 'Mix and bake.',
    author: null,
  });
  assert.equal(captionFromHtml('<html></html>'), null);
});

test('decodeEntities: hex emoji, and a malformed entity never throws', () => {
  assert.equal(decodeEntities('pasta &#x1f35d;'), 'pasta 🍝');
  assert.equal(decodeEntities('bad &#99999999;'), 'bad ');
});
