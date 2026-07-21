// How a stored chat reads on the Recent chats screen (Figma 200:24) — the
// derivation half of chat history, kept free of AsyncStorage so it can be
// tested (see test/chatSummary.test.mjs).
//
// Honesty: a row says "Saved" only when the recipe actually reached the
// cookbook. A thread that produced a recipe the user walked away from says
// so rather than implying it's on the shelf.

const DAY_MS = 24 * 60 * 60 * 1000;

// Title = what the user actually asked, verbatim.
export function summarize(chat) {
  const thread = chat?.thread || [];
  const firstAsk = thread.find((m) => m.from === "you" && m.text);
  const recipes = thread.filter((m) => m.recipe?.title).map((m) => m.recipe.title);
  const replies = thread.filter((m) => m.from === "otto" && m.text).length;

  let subtitle;
  if (chat?.savedTitle) subtitle = `Saved · ${chat.savedTitle}`;
  else if (recipes.length) subtitle = `${recipes[recipes.length - 1]} · not saved`;
  else if (replies) subtitle = `${replies} ${replies === 1 ? "reply" : "replies"} · nothing saved`;
  else subtitle = "Nothing yet";

  return { title: firstAsk?.text || "New chat", subtitle };
}

// "now" / "12m" / "2h" / "Tue" / "12 Jul" — short enough for the row's right edge.
export function whenLabel(iso, now = Date.now()) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// Today / Earlier this week / Older — the screen's headings. Empty groups are
// dropped so a heading never sits over nothing.
export function groupChats(chats, now = Date.now()) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const today = [];
  const week = [];
  const older = [];
  for (const c of chats || []) {
    const t = new Date(c.updatedAt).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= startOfToday.getTime()) today.push(c);
    else if (now - t < 7 * DAY_MS) week.push(c);
    else older.push(c);
  }
  return [
    { label: "Today", rows: today },
    { label: "Earlier this week", rows: week },
    { label: "Older", rows: older },
  ].filter((g) => g.rows.length);
}
