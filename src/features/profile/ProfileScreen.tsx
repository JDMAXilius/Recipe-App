import React, { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '@supabase/supabase-js';
import { Text, SegmentBar, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { useAuth } from '@/features/auth';
import { useSaved, useMyRecipes } from '@/features/cookbook';
import { usePlan } from '@/features/planner';
import { usePrefs } from './usePrefs';
import { UNIT_SEGMENTS, cookedCount, earnedStats, statText } from './profile.logic';
import { deleteAccount } from './profile.queries';

// "You" — Account (Mobbin account study, ported from v1). Warm header, cold
// facts: Otto greeting + plain email. Stats only if EARNED, honest at zero,
// and every number is a door (AllTrails). One inline units toggle, no settings
// dungeon. Quiet exits: sign out plain at the bottom, delete account visible
// right below it — never buried under Privacy.

const SUPPORT_EMAIL = 'juandiego@ottosapp.com';

function displayName(user: User | null): string {
  const meta = user?.user_metadata as { name?: string; full_name?: string } | undefined;
  return meta?.name || meta?.full_name || user?.email?.split('@')[0] || 'Chef';
}

function hasPasswordLogin(user: User | null): boolean {
  return (
    user?.identities?.some((i) => i.provider === 'email') ??
    (user?.app_metadata?.provider === 'email')
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { user, signOut } = useAuth();
  const { saved } = useSaved();
  const { entries } = usePlan();
  const { count: yoursCount } = useMyRecipes();
  const { unitSystem, setUnitSystem } = usePrefs();

  // cooked from usePlan(), saved from useSaved(), yours from useMyRecipes()
  // (allowlisted — one source shared with cookbook's My-recipes segment).
  const { stats, nothingYet } = earnedStats({
    cooked: cookedCount(entries),
    saved: saved.length,
    yours: yoursCount,
  });

  const onSignOut = () => {
    // Alert buttons no-op on web; confirm() keeps web usable. Sign-out is
    // reversible, so one honest tap is enough on native.
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of Otto?')) {
        haptics.notify('warning');
        void signOut();
      }
      return;
    }
    haptics.notify('warning');
    void signOut();
  };

  // Delete account: two-tap arm (works on web), then wipe server data.
  const [armDelete, setArmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const onDelete = async () => {
    if (!armDelete) {
      setArmDelete(true);
      show('This permanently deletes your recipes, saves, and week. Tap again to confirm.', 'info');
      setTimeout(() => setArmDelete(false), 6000);
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount();
      show("Everything's deleted. Otto will miss you.", 'success');
      await signOut();
    } catch {
      show("Couldn't delete right now — try again, or email us.", 'error');
      setDeleting(false);
      setArmDelete(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={styles.scroll}>
      <Text role="display">You</Text>

      {/* IDENTITY — warm header, cold facts */}
      <View style={styles.identityCard}>
        <Text role="title">{displayName(user)}</Text>
        {user?.email ? <Text role="caption">{user.email}</Text> : null}
      </View>

      {/* MEMBERSHIP — honest free state + Otto Club door */}
      <View style={styles.section}>
        <Text role="caption">Membership</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="ribbon-outline" size={20} color={colors.inkSoft} style={{ marginRight: space[3] }} />
            <Text role="body">Current plan</Text>
            <View style={{ flex: 1 }} />
            <Text role="computed">Free</Text>
          </View>
        </View>
        <Pressable
          style={styles.clubCard}
          onPress={() => router.push('/otto-club')}
          accessibilityRole="button"
          accessibilityLabel="Otto Club — see how it works"
        >
          <Text role="title">Otto Club</Text>
          <Text role="body">Everything Otto can do, one simple membership. Opening soon.</Text>
          <Text role="computed">See how it works ›</Text>
        </Pressable>
      </View>

      {/* YOUR KITCHEN SO FAR — earned numbers, each one a door */}
      <View style={styles.section}>
        <Text role="caption">Your kitchen so far</Text>
        <View style={styles.statsCard}>
          {stats.map((stat, i) => (
            <Pressable
              key={stat.label}
              style={[styles.statCell, i > 0 && styles.statCellDivider]}
              onPress={() => router.push(stat.to as Href)}
              accessibilityRole="button"
              accessibilityLabel={`${statText(stat.value)} ${stat.label} — open`}
            >
              <Text role="display">{statText(stat.value)}</Text>
              <Text role="caption">{stat.label}</Text>
            </Pressable>
          ))}
        </View>
        {nothingYet && <Text role="caption">Nothing cooked yet — Otto&apos;s ready when you are.</Text>}
      </View>

      {/* CONTENT — the private cooking journal */}
      <View style={styles.section}>
        <Pressable
          style={styles.card}
          onPress={() => {
            haptics.select();
            router.push('/journal');
          }}
          accessibilityRole="button"
          accessibilityLabel="Cooking journal"
        >
          <View style={styles.row}>
            <Ionicons name="camera-outline" size={20} color={colors.inkSoft} style={{ marginRight: space[3] }} />
            <Text role="body">Cooking journal</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
          </View>
        </Pressable>
      </View>

      {/* PREFERENCES — one inline units toggle, no settings dungeon */}
      <View style={styles.section}>
        <Text role="caption">Preferences</Text>
        <View style={styles.card}>
          <View style={styles.unitRow}>
            <Ionicons name="scale-outline" size={20} color={colors.inkSoft} style={{ marginRight: space[3] }} />
            <Text role="body">Units</Text>
            <View style={{ flex: 1 }} />
            <View style={styles.unitToggle}>
              <SegmentBar
                segments={UNIT_SEGMENTS.map((s) => ({ label: s.label, value: s.value }))}
                selected={unitSystem}
                onSelect={(v) => {
                  haptics.select();
                  setUnitSystem(v);
                }}
              />
            </View>
          </View>
        </View>
        <View style={styles.card}>
          {hasPasswordLogin(user) && (
            <SettingsRow icon="lock-closed-outline" label="Change password" onPress={() => router.push('/change-password')} />
          )}
          <SettingsRow icon="restaurant-outline" label="Food preferences" onPress={() => router.push('/preferences')} divided={hasPasswordLogin(user)} />
          <SettingsRow icon="notifications-outline" label="Reminders" onPress={() => router.push('/notifications')} divided />
          <SettingsRow icon="people-outline" label="Our shared list" onPress={() => router.push('/household')} divided />
        </View>
      </View>

      {/* THE BORING-BUT-IMPORTANT BITS */}
      <View style={styles.section}>
        <Text role="caption">The boring-but-important bits</Text>
        <View style={styles.card}>
          <SettingsRow icon="help-buoy-outline" label="Little questions" onPress={() => router.push('/faq')} />
          <SettingsRow
            icon="chatbubble-ellipses-outline"
            label="Send a thought"
            divided
            onPress={() => {
              const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('A thought about Otto')}`;
              void Linking.openURL(url).catch(() => {});
            }}
          />
        </View>
      </View>

      {/* EXITS — quiet, honest, never buried */}
      <Pressable
        style={styles.signOutRow}
        onPress={onSignOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} style={{ marginRight: space[3] }} />
        <Text role="body">Sign out</Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        disabled={deleting}
        style={styles.deleteRow}
        accessibilityRole="button"
        accessibilityLabel="Delete my account"
      >
        <Text role={armDelete ? 'computed' : 'caption'}>
          {armDelete ? 'Tap again — this is forever' : 'Delete my account'}
        </Text>
      </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  divided,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  divided?: boolean;
}) {
  return (
    <Pressable
      style={[styles.row, styles.settingsRow, divided && styles.rowDivider]}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={colors.inkSoft} style={{ marginRight: space[3] }} />
      <Text role="body">{label}</Text>
      <View style={{ flex: 1 }} />
      <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
    </Pressable>
  );
}

const styles: Record<string, ViewStyle> = {
  scroll: { padding: space[4], paddingBottom: space[7], gap: space[4] },
  identityCard: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: space[4],
    gap: space[1],
  },
  section: { gap: space[2] },
  card: { backgroundColor: colors.white, borderRadius: radii.card, paddingHorizontal: space[4] },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: space[3] },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space[4],
    paddingVertical: space[3],
  },
  settingsRow: { minHeight: 44 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.creamDeep },
  unitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space[3] },
  unitToggle: { width: 160 },
  clubCard: { backgroundColor: colors.creamDeep, borderRadius: radii.card, padding: space[4], gap: space[2] },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radii.card,
    paddingVertical: space[4],
  },
  statCell: { flex: 1, alignItems: 'center', gap: space[1] },
  statCellDivider: { borderLeftWidth: 1, borderLeftColor: colors.creamDeep },
  deleteRow: { alignItems: 'center', paddingVertical: space[4] },
};
