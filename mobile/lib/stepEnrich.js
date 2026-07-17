// Deterministic step-text enrichment: find durations and temperatures inside
// instruction prose so the UI can tint them (Method section) and make
// durations tappable timers (Cook Mode). No AI — regex over known shapes.
//
// segmentStep("Bake 35 minutes at 350° F.") →
//   [ {type:'text', text:'Bake '},
//     {type:'duration', text:'35 minutes', minutes:35},
//     {type:'text', text:' at '},
//     {type:'temp', text:'350° F'},
//     {type:'text', text:'.'} ]

const DURATION_RE =
  /(\d+(?:\s*(?:-|–|to)\s*\d+)?)\s*(hours?|hrs?|minutes?|mins?|min\b|seconds?|secs?)/gi;

const TEMP_RE = /(\d{2,3})\s*(?:°|degrees?\s*)\s*([FC])\b/gi;

const unitToMinutes = (value, unit) => {
  const u = unit.toLowerCase();
  if (u.startsWith("h")) return value * 60;
  if (u.startsWith("s")) return Math.max(1, Math.round(value / 60));
  return value;
};

// Parse "8-10" / "8 to 10" → use the upper bound (kitchen-safe default).
const rangeValue = (raw) => {
  const parts = raw.split(/\s*(?:-|–|to)\s*/).map((p) => parseInt(p, 10));
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
};

export function segmentStep(text) {
  if (!text) return [{ type: "text", text: "" }];
  const marks = [];

  for (const match of text.matchAll(DURATION_RE)) {
    marks.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "duration",
      text: match[0],
      minutes: unitToMinutes(rangeValue(match[1]), match[2]),
    });
  }
  for (const match of text.matchAll(TEMP_RE)) {
    marks.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "temp",
      text: match[0],
    });
  }

  marks.sort((a, b) => a.start - b.start);
  // drop overlaps (durations win — they're actionable)
  const clean = [];
  let cursor = 0;
  for (const m of marks) {
    if (m.start < cursor) continue;
    clean.push(m);
    cursor = m.end;
  }

  const segments = [];
  let pos = 0;
  for (const m of clean) {
    if (m.start > pos) segments.push({ type: "text", text: text.slice(pos, m.start) });
    segments.push({ type: m.type, text: m.text, minutes: m.minutes });
    pos = m.end;
  }
  if (pos < text.length) segments.push({ type: "text", text: text.slice(pos) });
  return segments;
}
