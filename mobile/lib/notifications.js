// Local, on-device reminders — the only notifications Otto sends are the
// ones this phone can know by itself. No push tokens, no server, nothing
// leaves the device.
//
// Two reminders, both opt-in (default OFF — Otto is the quiet kind):
// - tonight: on days with an uncooked planned dinner, one nudge at the
//   chosen hour with the actual dish name
// - sunday: a weekly planning nudge, Sunday 9am
//
// Honesty/gating: web has no scheduler and a build without the native
// module can't schedule — every call is guarded, and callers get a boolean
// so the settings screen can say so instead of silently failing. The
// native module ships with the next iOS rebuild (founder list).
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

const KEY = "otto.notifications.v1";
const TONIGHT_ID = "otto.tonight";
const SUNDAY_ID = "otto.sunday";

export const DEFAULT_NOTIF_PREFS = { tonight: false, tonightHour: 17, sunday: false };
export const TONIGHT_HOURS = [16, 17, 18, 19];

const supported = Platform.OS !== "web";

// Show reminders even when the app is foregrounded — a 5pm nudge that
// arrives silently because you happened to be browsing recipes is a miss.
if (supported) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // build without the native module — everything below stays guarded
  }
}

// Android 8+ delivers through channels; register ours once (no-op on iOS).
// Users can then tune Otto's reminders in system settings per-channel.
const CHANNEL_ID = "reminders";
async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#C4562E",
  }).catch(() => {});
}

// For the settings screen's disabled-state banner (MyFitnessPal pattern):
// "granted" | "denied" | "undetermined" | "unsupported"
export async function getPermissionState() {
  if (!supported) return "unsupported";
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return "granted";
    return current.canAskAgain ? "undetermined" : "denied";
  } catch {
    return "unsupported";
  }
}

export async function loadNotifPrefs() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_NOTIF_PREFS };
    return {
      tonight: Boolean(parsed.tonight),
      tonightHour: TONIGHT_HOURS.includes(parsed.tonightHour) ? parsed.tonightHour : 17,
      sunday: Boolean(parsed.sunday),
    };
  } catch {
    return { ...DEFAULT_NOTIF_PREFS };
  }
}

export async function saveNotifPrefs(prefs) {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}

// true = permission in hand; false = declined or unavailable in this build
export async function ensurePermission() {
  if (!supported) return false;
  try {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return Boolean(asked.granted);
  } catch {
    return false;
  }
}

// Reschedule (or clear) tonight's reminder for the given plan entry.
// Called from Discover whenever today's plan is known — cooked dishes,
// cleared plans and past hours all resolve to "no reminder".
export async function syncTonightReminder(entry) {
  if (!supported) return;
  try {
    const prefs = await loadNotifPrefs();
    await Notifications.cancelScheduledNotificationAsync(TONIGHT_ID).catch(() => {});
    if (!prefs.tonight || !entry || entry.cooked) return;
    const fireAt = new Date();
    fireAt.setHours(prefs.tonightHour, 0, 0, 0);
    if (fireAt <= new Date()) return; // that hour already passed today
    await Notifications.scheduleNotificationAsync({
      identifier: TONIGHT_ID,
      content: {
        title: `Tonight: ${entry.title}`,
        body: "It's on your week — Otto has the list if you need it.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    // no scheduler in this build — the settings screen already said so
  }
}

export async function syncSundayNudge(enabled) {
  if (!supported) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(SUNDAY_ID).catch(() => {});
    if (!enabled) return;
    await Notifications.scheduleNotificationAsync({
      identifier: SUNDAY_ID,
      content: {
        title: "A fresh week",
        body: "Sketch a dinner or two — future you eats better.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 9,
        minute: 0,
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    // same guard as above
  }
}
