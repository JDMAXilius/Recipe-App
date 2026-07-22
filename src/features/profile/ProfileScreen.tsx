import React, { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import type { User } from '@supabase/supabase-js';
import { Text, Button, SegmentBar, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { useAuth } from '@/features/auth';
import { useSaved } from '@/features/cookbook';
import { usePlan } from '@/features/planner';
import { useUnitSystem } from './profile.prefs';
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
  const [unitSystem, setUnitSystem] = useUnitSystem();

  // cooked from usePlan(), saved from useSaved(). `yours` (own-recipe count)
  // has no allowlisted source — see packet contract_gap; renders "—" for now.
  const { stats, nothingYet } = earnedStats({
    cooked: cookedCount(entries),
    saved: saved.length,
    yours: null,
  });

  const onSignOut = () => {
    // Alert buttons no-op on web; confirm() keeps web usable. Sign-out is
    // reversible, so one honest tap is enough on native.
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of Otto?')) void signOut();
      return;
    }
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
    <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={styles.scroll}>
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
              onPress={() => router.push(stat.to)}
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
          onPress={() => router.push('/journal')}
          accessibilityRole="button"
          accessibilityLabel="Cooking journal"
        >
          <View style={styles.row}>
            <Text role="body">Cooking journal</Text>
            <View style={{ flex: 1 }} />
            <Text role="caption">›</Text>
          </View>
        </Pressable>
      </View>

      {/* PREFERENCES — one inline units toggle, no settings dungeon */}
      <View style={styles.section}>
        <Text role="caption">Preferences</Text>
        <View style={styles.card}>
          <View style={styles.unitRow}>
            <Text role="body">Units</Text>
            <View style={{ flex: 1 }} />
            <View style={styles.unitToggle}>
              <SegmentBar
                segments={UNIT_SEGMENTS.map((s) => ({ label: s.label, value: s.value }))}
                selected={unitSystem}
                onSelect={setUnitSystem}
              />
            </View>
          </View>
        </View>
        <View style={styles.card}>
          {hasPasswordLogin(user) && (
            <SettingsRow label="Change password" onPress={() => router.push('/change-password')} />
          )}
          <SettingsRow label="Food preferences" onPress={() => router.push('/preferences')} divided={hasPasswordLogin(user)} />
          <SettingsRow label="Reminders" onPress={() => router.push('/notifications')} divided />
          <SettingsRow label="Our shared list" onPress={() => router.push('/household')} divided />
        </View>
      </View>

      {/* THE BORING-BUT-IMPORTANT BITS */}
      <View style={styles.section}>
        <Text role="caption">The boring-but-important bits</Text>
        <View style={styles.card}>
          <SettingsRow label="Little questions" onPress={() => router.push('/faq')} />
          <SettingsRow
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
      <View style={{ marginTop: space[4] }}>
        <Button title="Sign out" variant="secondary" onPress={onSignOut} />
      </View>
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
  );
}

function SettingsRow({ label, onPress, divided }: { label: string; onPress: () => void; divided?: boolean }) {
  return (
    <Pressable
      style={[styles.row, styles.settingsRow, divided && styles.rowDivider]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text role="body">{label}</Text>
      <View style={{ flex: 1 }} />
      <Text role="caption">›</Text>
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
