// Guards the WCAG pairs from docs/gold-standard/OTTO_GAP_AUDIT.md: text ≥ 4.5:1,
// meaningful non-text marks ≥ 3:1. Retune a token and this tells you what broke.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colors as c } from './tokens.ts';

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const text = [
  ['ink', 'cream'], ['ink', 'white'], ['ink', 'creamDeep'],
  ['inkSoft', 'cream'], ['inkSoft', 'white'], ['inkSoft', 'creamDeep'], ['inkSoft', 'accentSoft'],
  ['terracotta', 'cream'], ['terracotta', 'creamDeep'], ['terracotta', 'white'], ['white', 'terracotta'],
  ['danger', 'cream'], ['white', 'danger'], ['white', 'success'], ['secondary', 'cream'], ['white', 'ink'],
];
const nonText = [['grayStrong', 'white'], ['grayStrong', 'cream'], ['terracotta', 'accentSoft']];

for (const [fg, bg] of text) {
  test(`text ${fg} on ${bg} ≥ 4.5`, () => assert.ok(ratio(c[fg], c[bg]) >= 4.5, ratio(c[fg], c[bg]).toFixed(2)));
}
for (const [fg, bg] of nonText) {
  test(`mark ${fg} on ${bg} ≥ 3`, () => assert.ok(ratio(c[fg], c[bg]) >= 3, ratio(c[fg], c[bg]).toFixed(2)));
}
