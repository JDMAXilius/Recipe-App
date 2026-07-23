// Otto — Figma build script: "Add / Create" redesign screens
// ============================================================================
// WHAT: Builds the two approved redesign screens into the Figma file as a new
//       page "2 · Screens — Add / Create":
//         1) Chat with Otto  (the ＋ tab: header + import icon, minimal empty
//            state with real Otto art, Speak/type input pill, bottom tab bar)
//         2) Bring in a recipe  (import sheet: Close X, Otto header, 2×2 tile
//            grid, TikTok/Instagram row)
//       Reuses the DS colours and the real Otto happy-cut art (node 7:9).
//
// WHY A SCRIPT: the cloud session that designed these screens can READ Figma
//       but is not permitted to WRITE (the `use_figma` tool needs an approval
//       the headless session can't surface). Running this from a desktop
//       Claude Code session — where `use_figma` is approved — creates both
//       screens in one shot.
//
// HOW TO RUN (desktop Claude Code, Figma MCP connected):
//       Ask Claude:  "Run docs/figma/build-add-create-screens.js via use_figma
//                     against fileKey mM0uWkHod9rL1Ff1VJ64Au"
//       (Claude pastes the body below into a single `use_figma` call. The code
//        is written for that tool: top-level await + return, no IIFE.)
//
// RE-RUNNING: creates ANOTHER page each time. Delete the old
//       "2 · Screens — Add / Create" page first if you re-run.
// ============================================================================

const hex = (h) => ({ r: parseInt(h.slice(1,3),16)/255, g: parseInt(h.slice(3,5),16)/255, b: parseInt(h.slice(5,7),16)/255 });
const C = {
  bg: hex("#FAF4EA"), surface: hex("#FFFFFF"), surfaceWarm: hex("#F3E9DA"),
  accent: hex("#C4562E"), accentSoft: hex("#F3D9CD"), ink: hex("#2A211B"),
  inkSoft: hex("#6E6055"), border: hex("#E8DECF"), white: hex("#FFFFFF"),
};
const H = { ink: "#2A211B", inkSoft: "#6E6055", accent: "#C4562E", white: "#FFFFFF" };
const solid = (c) => [{ type: "SOLID", color: c }];

// --- Otto mascot: read the happy-cut image hash before switching pages ---
const happyCut = await figma.getNodeByIdAsync("7:9");
let mascotHash = null;
if (happyCut && "fills" in happyCut && Array.isArray(happyCut.fills)) {
  const im = happyCut.fills.find((f) => f.type === "IMAGE");
  if (im) mascotHash = im.imageHash;
}

// --- fonts: Lora Bold (display) + Inter family (body/labels) ---
await figma.loadFontAsync({ family: "Lora", style: "Bold" });
for (const s of ["Regular", "Medium", "Semi Bold", "Bold"]) {
  await figma.loadFontAsync({ family: "Inter", style: s });
}

// --- new page + section ---
const page = figma.createPage();
page.name = "2 · Screens — Add / Create";
await figma.setCurrentPageAsync(page);

const section = figma.createSection();
section.name = "Add / Create — redesign (2026-07)";
section.resizeWithoutConstraints(1000, 1140);
figma.currentPage.appendChild(section);

// --- helpers ---
function text(parent, chars, o = {}) {
  const { family = "Inter", style = "Regular", size = 15, color = C.ink, align = "LEFT", width = null, lh = null, ls = null } = o;
  const t = figma.createText();
  t.fontName = { family, style };
  t.fontSize = size;
  t.characters = chars;
  t.fills = solid(color);
  t.textAlignHorizontal = align;
  if (width != null) { t.textAutoResize = "HEIGHT"; t.resize(width, t.height); }
  if (lh != null) t.lineHeight = { unit: "PIXELS", value: lh };
  if (ls != null) t.letterSpacing = { unit: "PIXELS", value: ls };
  parent.appendChild(t);
  return t;
}
function rrect(parent, w, h, r, fill, o = {}) {
  const { stroke = null, sw = 1 } = o;
  const n = figma.createFrame();
  n.resize(w, h);
  n.cornerRadius = r;
  n.fills = fill ? solid(fill) : [];
  n.clipsContent = false;
  if (stroke) { n.strokes = solid(stroke); n.strokeWeight = sw; n.strokeAlign = "INSIDE"; }
  parent.appendChild(n);
  return n;
}
function icon(parent, d, o = {}) {
  const { size = 24, stroke = H.ink } = o;
  const svg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${d.replace(/COLOR/g, stroke)}</svg>`;
  const n = figma.createNodeFromSvg(svg);
  n.name = "icon";
  n.resize(size, size);
  parent.appendChild(n);
  return n;
}
function mascot(parent, size) {
  const f = figma.createFrame();
  f.name = "Otto mascot (happy-cut)";
  f.resize(size, size);
  f.cornerRadius = 0;
  f.fills = mascotHash ? [{ type: "IMAGE", imageHash: mascotHash, scaleMode: "FIT" }] : solid(C.surfaceWarm);
  parent.appendChild(f);
  return f;
}

const ICON = {
  download: `<path d="M12 3v11m0 0l-4-4m4 4l4-4M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  close: `<path d="M6 6l12 12M18 6L6 18" stroke="COLOR" stroke-width="2" stroke-linecap="round"/>`,
  mic: `<rect x="9" y="3" width="6" height="11" rx="3" stroke="COLOR" stroke-width="2"/><path d="M6 11a6 6 0 0012 0M12 17v4" stroke="COLOR" stroke-width="2" stroke-linecap="round"/>`,
  arrowUp: `<path d="M12 20V6M6 12l6-6 6 6" stroke="COLOR" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  link: `<path d="M10 14a4 4 0 006 .4l2-2a4 4 0 00-5.6-5.6l-1 1M14 10a4 4 0 00-6-.4l-2 2A4 4 0 007.6 17l1-1" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  doc: `<rect x="5" y="3" width="14" height="18" rx="2" stroke="COLOR" stroke-width="2"/><path d="M8 8h8M8 12h8M8 16h5" stroke="COLOR" stroke-width="2" stroke-linecap="round"/>`,
  camera: `<rect x="3" y="7" width="18" height="13" rx="2.5" stroke="COLOR" stroke-width="2"/><circle cx="12" cy="13.5" r="3.2" stroke="COLOR" stroke-width="2"/><path d="M8.5 7l1.2-2h4.6l1.2 2" stroke="COLOR" stroke-width="2" stroke-linejoin="round"/>`,
  pencil: `<path d="M5 19l3.5-.7L18 8.8a2 2 0 00-2.8-2.8L5.7 15.5 5 19z" stroke="COLOR" stroke-width="2" stroke-linejoin="round"/><path d="M13.3 8.7l2 2" stroke="COLOR" stroke-width="2"/>`,
  plus: `<path d="M12 5v14M5 12h14" stroke="COLOR" stroke-width="2.4" stroke-linecap="round"/>`,
  discover: `<path d="M7 3v7a3 3 0 006 0V3M9 3v6M16.5 3c-1.5 1-2.2 3-2.2 5s.6 3 2.2 3v10" stroke="COLOR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  paw: `<circle cx="7" cy="9.5" r="1.5" stroke="COLOR" stroke-width="1.6"/><circle cx="12" cy="7.5" r="1.6" stroke="COLOR" stroke-width="1.6"/><circle cx="17" cy="9.5" r="1.5" stroke="COLOR" stroke-width="1.6"/><path d="M12 12c-3 0-5 2-5 4.3S9 20 12 20s5-1.2 5-3.7S15 12 12 12z" stroke="COLOR" stroke-width="1.6"/>`,
  calendar: `<rect x="4" y="5" width="16" height="16" rx="2.5" stroke="COLOR" stroke-width="1.8"/><path d="M4 9.5h16M8 3v4M16 3v4" stroke="COLOR" stroke-width="1.8" stroke-linecap="round"/>`,
  person: `<circle cx="12" cy="8" r="3.6" stroke="COLOR" stroke-width="1.8"/><path d="M5 20c0-3.5 3.2-5.5 7-5.5s7 2 7 5.5" stroke="COLOR" stroke-width="1.8" stroke-linecap="round"/>`,
  chevron: `<path d="M9 6l6 6-6 6" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
};

function phone(name, x) {
  const f = figma.createFrame();
  f.name = name;
  f.resize(393, 852);
  f.x = x; f.y = 140;
  f.fills = solid(C.bg);
  f.clipsContent = true;
  section.appendChild(f);
  return f;
}

function tabBar(parent) {
  const barTop = 852 - 84;
  const bar = rrect(parent, 393, 84, 0, C.surface, { stroke: C.border, sw: 1 });
  bar.x = 0; bar.y = barTop;
  const slots = [
    { ic: "discover", label: "Discover", color: C.accent },
    { ic: "paw", label: "Cookbook", color: C.inkSoft },
    { plus: true },
    { ic: "calendar", label: "Plan", color: C.inkSoft },
    { ic: "person", label: "Account", color: C.inkSoft },
  ];
  const slotW = 393 / 5;
  slots.forEach((s, i) => {
    const cx = i * slotW + slotW / 2;
    if (s.plus) {
      const circle = rrect(parent, 58, 58, 29, C.accent);
      circle.x = cx - 29; circle.y = barTop - 22;
      const ic = icon(parent, ICON.plus, { size: 28, stroke: H.white });
      ic.x = cx - 14; ic.y = barTop - 22 + 15;
      return;
    }
    const hexColor = s.color === C.accent ? H.accent : H.inkSoft;
    const ic = icon(parent, ICON[s.ic], { size: 24, stroke: hexColor });
    ic.x = cx - 12; ic.y = barTop + 16;
    const lb = text(parent, s.label, { family: "Inter", style: "Semi Bold", size: 11, color: s.color, align: "CENTER", width: slotW });
    lb.x = cx - slotW / 2; lb.y = barTop + 44;
  });
}

// ============================ SCREEN 1: CHAT ============================
const chat = phone("Chat with Otto — ＋ tab", 40);
// header
const cTitle = text(chat, "Chat with Otto", { family: "Lora", style: "Bold", size: 20, color: C.ink, align: "CENTER", width: 240 });
cTitle.x = (393 - 240) / 2; cTitle.y = 26;
const impBtn = rrect(chat, 44, 44, 22, C.surfaceWarm);
impBtn.x = 393 - 16 - 44; impBtn.y = 16;
const impIc = icon(chat, ICON.download, { size: 22, stroke: H.ink });
impIc.x = impBtn.x + 11; impIc.y = impBtn.y + 11;
// empty state
const cM = mascot(chat, 120); cM.x = (393 - 120) / 2; cM.y = 300;
const cEt = text(chat, "Tell me what you're hungry for.\nI'll write you the recipe.", { family: "Lora", style: "Bold", size: 22, color: C.ink, align: "CENTER", width: 340, lh: 30 });
cEt.x = (393 - 340) / 2; cEt.y = 442;
// input bar
const barTop = 852 - 84;
const wrapY = barTop - 12 - 56;
const wrap = rrect(chat, 361, 56, 28, C.surface, { stroke: C.border, sw: 1 });
wrap.x = 16; wrap.y = wrapY;
const cPh = text(chat, "Tell Otto what you're after…", { family: "Inter", style: "Regular", size: 15, color: C.inkSoft });
cPh.x = 32; cPh.y = wrapY + 18;
const speak = figma.createAutoLayout("HORIZONTAL", { name: "Speak", itemSpacing: 6 });
speak.fills = solid(C.ink);
speak.cornerRadius = 999;
speak.counterAxisAlignItems = "CENTER";
speak.paddingLeft = 14; speak.paddingRight = 16;
chat.appendChild(speak);
icon(speak, ICON.mic, { size: 16, stroke: H.white });
text(speak, "Speak", { family: "Inter", style: "Bold", size: 14, color: C.white });
speak.counterAxisSizingMode = "FIXED";
speak.resize(speak.width, 40);
speak.x = 16 + 361 - 8 - speak.width; speak.y = wrapY + 8;
tabBar(chat);

// ======================= SCREEN 2: IMPORT SHEET =======================
const imp = phone("Bring in a recipe — import sheet", 500);
const closeBtn = rrect(imp, 44, 44, 22, C.surfaceWarm);
closeBtn.x = 16; closeBtn.y = 16;
const closeIc = icon(imp, ICON.close, { size: 22, stroke: H.ink });
closeIc.x = closeBtn.x + 11; closeIc.y = closeBtn.y + 11;
const iM = mascot(imp, 110); iM.x = (393 - 110) / 2; iM.y = 150;
const iTitle = text(imp, "Bring in a recipe", { family: "Lora", style: "Bold", size: 26, color: C.ink, align: "CENTER", width: 340 });
iTitle.x = (393 - 340) / 2; iTitle.y = 282;
const iSub = text(imp, "Found something good? Otto will copy it down.", { family: "Inter", style: "Regular", size: 15, color: C.inkSoft, align: "CENTER", width: 340 });
iSub.x = (393 - 340) / 2; iSub.y = 324;
// tile grid
const tiles = [["link", "Paste a link"], ["doc", "Paste text"], ["camera", "Snap a photo"], ["pencil", "Write it myself"]];
const gx = 16, gy = 384, gap = 12, tw = (393 - 16 - 16 - gap) / 2, th = 92;
tiles.forEach(([ic, label], i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const tx = gx + col * (tw + gap), ty = gy + row * (th + gap);
  const tile = rrect(imp, tw, th, 20, C.surface, { stroke: C.border, sw: 1 });
  tile.x = tx; tile.y = ty;
  const tic = icon(imp, ICON[ic], { size: 24, stroke: H.accent });
  tic.x = tx + 16; tic.y = ty + 16;
  const tl = text(imp, label, { family: "Inter", style: "Bold", size: 15, color: C.ink });
  tl.x = tx + 16; tl.y = ty + th - 16 - tl.height;
});
// tiktok/instagram row
const rowY = gy + 2 * (th + gap) + 22;
const rrow = text(imp, "Save straight from TikTok & Instagram — see how it'll work", { family: "Inter", style: "Medium", size: 12, color: C.inkSoft, align: "CENTER", width: 300 });
rrow.x = (393 - 300) / 2; rrow.y = rowY;
const rchev = icon(imp, ICON.chevron, { size: 14, stroke: H.inkSoft });
rchev.x = (393 + 300) / 2 - 6; rchev.y = rowY + rrow.height / 2 - 7;

// mascotNodeIds → if the in-file art (node 7:9) didn't apply (mascotFound:false,
// or a blank warm square), upload docs asset onto these two frames via the
// upload_assets tool (nodeId each, scaleMode FIT). See the terminal ticket.
return { pageId: page.id, sectionId: section.id, chatId: chat.id, importId: imp.id, mascotFound: !!mascotHash, mascotNodeIds: [cM.id, iM.id] };
