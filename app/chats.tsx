// Recent chats (Figma 228:510) — reached from the clock in the ＋ tab header.
// Read-only list of on-device chat threads: tap a row to reopen that thread in
// the chat (/create?chat=<id>) and pick it back up. Everything is local (kv
// 'chats' via the chat feature's loadThreads); Otto keeps the last 30 days.
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OttoIdle, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { loadThreads, type ChatThread } from '@/features/chat';

const DAY_MS = 24 * 60 * 60 * 1000;

// "now" / "12m" / "2h" / "Tue" / "12 Jul" — short enough for the row's right edge.
function whenLabel(ts: number, now = Date.now()): string {
  const mins = Math.floor((now - ts) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return new Date(ts).toLocaleDateString(undefined, { weekday: 'short' });
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// Today / Earlier this week / Older — empty groups dropped so a heading never
// sits over nothing.
function groupThreads(threads: ChatThread[], now = Date.now()) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const today: ChatThread[] = [];
  const week: ChatThread[] = [];
  const older: ChatThread[] = [];
  for (const t of threads) {
    if (t.updatedAt >= startOfToday.getTime()) today.push(t);
    else if (now - t.updatedAt < 7 * DAY_MS) week.push(t);
    else older.push(t);
  }
  return [
    { label: 'Today', rows: today },
    { label: 'Earlier this week', rows: week },
    { label: 'Older', rows: older },
  ].filter((g) => g.rows.length);
}

const previewOf = (t: ChatThread): string => {
  const last = t.messages[t.messages.length - 1]?.content ?? '';
  return last.length > 64 ? `${last.slice(0, 64).trimEnd()}…` : last;
};

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [threads, setThreads] = useState<ChatThread[] | null>(null); // null = loading

  useFocusEffect(
    useCallback(() => {
      loadThreads()
        .then(setThreads)
        .catch(() => setThreads([]));
    }, []),
  );

  const groups = useMemo(() => groupThreads(threads ?? []), [threads]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top }}>
      <View style={{ height: 44, justifyContent: 'center', paddingHorizontal: space[3] }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{
            width: 40,
            height: 40,
            borderRadius: radii.pill,
            backgroundColor: colors.creamDeep,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[4], paddingBottom: space[7] }}>
        <Text role="display">Recent chats</Text>
        <View style={{ height: space[2] }} />
        <Text role="body">Otto keeps the last 30 days. Tap one to pick it back up.</Text>

        {threads && threads.length === 0 ? (
          <View style={{ alignItems: 'center', gap: space[4], paddingTop: space[7] }}>
            <OttoIdle name="sleepy" size={120} />
            <Text role="body">Nothing here yet. Ask Otto for a recipe and it’ll show up.</Text>
          </View>
        ) : null}

        {groups.map((g) => (
          <View key={g.label} style={{ marginTop: space[5], gap: space[2] }}>
            <Text role="meta">{g.label}</Text>
            {g.rows.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/create?chat=${t.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Reopen chat: ${t.title}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space[3],
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.card,
                  paddingVertical: space[3],
                  paddingHorizontal: space[4],
                }}
              >
                <View style={{ flex: 1, gap: space[1] }}>
                  <Text role="body">{t.title}</Text>
                  <Text role="caption">{previewOf(t)}</Text>
                </View>
                <Text role="caption">{whenLabel(t.updatedAt)}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
