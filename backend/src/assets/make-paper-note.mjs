// Generates the printed notepad pad artwork (founder references: "things to
// do:" pad + printed SHOPPING LIST grocery pad). A clean stationery sheet:
// warm white paper, printed terracotta double-rule frame, stacked-pad
// bottom edge, soft cast shadow. Alpha cutout on transparency; the page
// body / app screen behind it stays Otto's cream.
//
// Outputs (all from ONE render so they align exactly):
//   /tmp/pad-cut.png  full pad  -> backend/src/assets/paper-note.png
//                                  (share page .sheet, stretched 100%/100%)
//   /tmp/pad-top.png  y 0..150  -> mobile/assets/paper/pad-top.png
//   /tmp/pad-mid.png  y 150..1120 -> mobile/assets/paper/pad-mid.png
//   /tmp/pad-bot.png  y 1120..1280 -> mobile/assets/paper/pad-bot.png
//
// The app three-slices the pad so its height can track the dynamic list:
// top and bottom keep their aspect (frame corners, stacked edge, shadow
// stay true) while the middle band stretches to any length. For that to be
// seamless the middle band MUST be vertically uniform — so the sheet is
// flat paper + a horizontal-only sheen; no turbulence textures, and nothing
// decorative may be drawn between y=150 and y=1120.
//
// Run: node make-paper-note.mjs  (needs playwright; CHROME env can point at
// a pre-installed browser).
import { writeFileSync } from "node:fs";
// playwright is a run-on-demand dev tool (`npx -y playwright`), not an app dep
// eslint-disable-next-line import/no-unresolved
import { chromium } from "playwright";

const W = 720, H = 1280;
const PAD = 26;              // transparent margin for the cast shadow
const L = PAD, R = W - PAD, TOP = PAD, BOT = H - PAD - 14; // sheet bounds
const FR = 26;               // printed frame inset from sheet edge
const SLICE_TOP = 150, SLICE_BOT = 1120; // slice lines (see header comment)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <filter id="blur10"><feGaussianBlur stdDeviation="10"/></filter>
    <!-- horizontal-only sheen: identical on every row, so the middle slice
         stretches without a seam -->
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.45"/>
      <stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="1" stop-color="#C9B18A" stop-opacity="0.12"/>
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
  <rect x="${L}" y="${TOP}" width="${R - L}" height="${BOT - TOP}" rx="6" fill="url(#sheen)"/>
  <rect x="${L}" y="${TOP}" width="${R - L}" height="${BOT - TOP}" rx="6"
        fill="none" stroke="#D9CBAF" stroke-width="1.5"/>

  <!-- printed terracotta double-rule frame (reference: the red table rules) -->
  <rect x="${L + FR}" y="${TOP + FR}" width="${R - L - FR * 2}" height="${BOT - TOP - FR * 2}"
        fill="none" stroke="#C4562E" stroke-width="2" opacity="0.5"/>
  <rect x="${L + FR + 7}" y="${TOP + FR + 7}" width="${R - L - FR * 2 - 14}" height="${BOT - TOP - FR * 2 - 14}"
        fill="none" stroke="#C4562E" stroke-width="1" opacity="0.42"/>

</svg>`;

writeFileSync("/tmp/pad.html", `<!doctype html><body style="margin:0;background:transparent">${svg}</body>`);
// CHROME env overrides for sandboxes with a pre-installed browser.
const browser = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : {}
);
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto("file:///tmp/pad.html");
await page.screenshot({ path: "/tmp/pad-cut.png", omitBackground: true });
await page.screenshot({ path: "/tmp/pad-top.png", omitBackground: true, clip: { x: 0, y: 0, width: W, height: SLICE_TOP } });
await page.screenshot({ path: "/tmp/pad-mid.png", omitBackground: true, clip: { x: 0, y: SLICE_TOP, width: W, height: SLICE_BOT - SLICE_TOP } });
await page.screenshot({ path: "/tmp/pad-bot.png", omitBackground: true, clip: { x: 0, y: SLICE_BOT, width: W, height: H - SLICE_BOT } });
await browser.close();
console.log("pad + slices written");
