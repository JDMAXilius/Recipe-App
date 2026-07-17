// Generates paper-note.png — the printed notepad pad behind the /l/:token
// shopping-list share page (founder references: "things to do:" pad +
// printed SHOPPING LIST grocery pad). A clean stationery sheet: warm white
// paper, printed terracotta double-rule frame, stacked-pad bottom edge,
// soft cast shadow, subtle grain. Alpha cutout, stretched 100%/100% by the
// share page's .sheet — frame lines are axis-aligned so they stay crisp
// under stretch. The page body behind it stays Otto's cream.
// Run: node make-paper-note.mjs  (needs playwright; CHROME env can point at
// a pre-installed browser). Copy /tmp/pad-cut.png over paper-note.png.
import { writeFileSync } from "node:fs";
// playwright is a run-on-demand dev tool (`npx -y playwright`), not an app dep
// eslint-disable-next-line import/no-unresolved
import { chromium } from "playwright";

const W = 720, H = 1280;
const PAD = 26;              // transparent margin for the cast shadow
const L = PAD, R = W - PAD, TOP = PAD, BOT = H - PAD - 14; // sheet bounds
const FR = 26;               // printed frame inset from sheet edge

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.78  0 0 0 0 0.70  0 0 0 0 0.58  0 0 0 0.06 0"/></filter>
    <filter id="wash"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.006" numOctaves="4" seed="11"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.90  0 0 0 0 0.84  0 0 0 0 0.72  0 0 0 0.22 0"/></filter>
    <filter id="blur10"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.5"/>
      <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="1" stop-color="#C9B18A" stop-opacity="0.14"/>
    </linearGradient>
  </defs>

  <!-- cast shadow, heavier toward the bottom-right like a pad on a desk -->
  <rect x="${L + 8}" y="${TOP + 12}" width="${R - L}" height="${BOT - TOP + 10}" rx="8"
        fill="#5C4630" opacity="0.30" filter="url(#blur10)"/>

  <!-- stacked pad: two sheets peeking out underneath -->
  <rect x="${L + 6}" y="${BOT - 4}" width="${R - L - 12}" height="10" rx="3" fill="#EFE6D4"/>
  <rect x="${L + 3}" y="${BOT + 2}" width="${R - L - 6}" height="9" rx="3" fill="#F6EEDE"/>

  <!-- the sheet -->
  <rect x="${L}" y="${TOP}" width="${R - L}" height="${BOT - TOP}" rx="6" fill="#FEFBF4"/>
  <rect x="${L}" y="${TOP}" width="${R - L}" height="${BOT - TOP}" rx="6" filter="url(#wash)"/>
  <rect x="${L}" y="${TOP}" width="${R - L}" height="${BOT - TOP}" rx="6" filter="url(#grain)"/>
  <rect x="${L}" y="${TOP}" width="${R - L}" height="${BOT - TOP}" rx="6" fill="url(#sheen)"/>
  <rect x="${L}" y="${TOP}" width="${R - L}" height="${BOT - TOP}" rx="6"
        fill="none" stroke="#D9CBAF" stroke-width="1.5"/>

  <!-- printed terracotta double-rule frame (reference: the red table rules) -->
  <rect x="${L + FR}" y="${TOP + FR}" width="${R - L - FR * 2}" height="${BOT - TOP - FR * 2}"
        fill="none" stroke="#C4562E" stroke-width="2" opacity="0.5"/>
  <rect x="${L + FR + 7}" y="${TOP + FR + 7}" width="${R - L - FR * 2 - 14}" height="${BOT - TOP - FR * 2 - 14}"
        fill="none" stroke="#C4562E" stroke-width="1" opacity="0.42"/>

  <!-- one quiet imperfection: faint coffee ring kissing the frame -->
  <circle cx="${L + 96}" cy="${BOT - 96}" r="34" fill="none" stroke="#8A5A33" stroke-width="7"
          opacity="0.06" filter="url(#blur3)"/>
</svg>`;

writeFileSync("/tmp/pad.html", `<!doctype html><body style="margin:0;background:transparent">${svg}</body>`);
// CHROME env overrides for sandboxes with a pre-installed browser.
const browser = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : {}
);
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto("file:///tmp/pad.html");
await page.screenshot({ path: "/tmp/pad-cut.png", omitBackground: true });
await browser.close();
console.log("v4 pad written");
