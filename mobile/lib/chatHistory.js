// Recent chats with Otto (Figma 200:24). Stored on-device, like prefs and the
// shopping list — no account needed, nothing leaves the phone.
//
// Honesty contract (the screen's copy states exactly this):
// - "Otto keeps the last 30 days" — so loading PRUNES anything older, rather
//   than showing a promise the store doesn't keep.
// - A row only says "Saved" when the recipe actually reached the cookbook;
//   a thread that produced a recipe the user walked away from says so.
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "otto.chats.v1";
const KEEP_DAYS = 30;
const MAX_CHATS = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

const isFresh = (chat, now) => now - new Date(chat.updatedAt).getTime() < KEEP_DAYS * DAY_MS;

// Newest first, pruned. Any malformed blob resets to empty rather than
// throwing into the screen — history is a convenience, never a blocker.
export async function loadChats() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);
    if (!Array.isArray(all)) return [];
    const now = Date.now();
    const kept = all
      .filter((c) => c && c.id && c.updatedAt && isFresh(c, now))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, MAX_CHATS);
    if (kept.length !== all.length) await AsyncStorage.setItem(KEY, JSON.stringify(kept));
    return kept;
  } catch {
    return [];
  }
}

export async function getChat(id) {
  const all = await loadChats();
  return all.find((c) => c.id === id) || null;
}

// Upsert. Returns the id so the caller can keep writing to the same chat as
// the thread grows. An empty thread is never stored — closing the ＋ tab
// without saying anything shouldn't leave a ghost row.
export async function saveChat({ id, thread, savedTitle }) {
  if (!Array.isArray(thread) || thread.length === 0) return id || null;
  try {
    const all = await loadChats();
    const chatId = id || String(Date.now());
    const existing = all.find((c) => c.id === chatId);
    const next = {
      id: chatId,
      updatedAt: new Date().toISOString(),
      thread,
      // once saved, stays saved — a later turn in the same chat doesn't unsave it
      savedTitle: savedTitle ?? existing?.savedTitle ?? null,
    };
    const rest = all.filter((c) => c.id !== chatId);
    await AsyncStorage.setItem(KEY, JSON.stringify([next, ...rest].slice(0, MAX_CHATS)));
    return chatId;
  } catch {
    return id || null;
  }
}

export async function deleteChat(id) {
  try {
    const all = await loadChats();
    await AsyncStorage.setItem(KEY, JSON.stringify(all.filter((c) => c.id !== id)));
  } catch {
    // a failed delete is not worth an error state — the row stays, user retries
  }
}
