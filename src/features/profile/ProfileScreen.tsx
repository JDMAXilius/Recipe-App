import React, { useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text as RNText,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import type { User } from '@supabase/supabase-js';
import { Text, SegmentBar, OttoArt, useToast } from '@/shared/ui';
import { colors, radii, space, type } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { useAuth, displayNameFor, hasUsername, cleanUsername, MAX_USERNAME } from '@/features/auth';
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
const PRIVACY_URL = 'https://ottosapp.com/privacy';
const TERMS_URL = 'https://ottosapp.com/terms';
// ponytail: no App Store listing yet — Rate Otto toasts until this URL is set.
const RATE_APP_URL: string | null = null;
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

function hasPasswordLogin(user: User | null): boolean {
  return (
    user?.identities?.some((i) => i.provider === 'email') ??
    (user?.app_metadata?.provider === 'email')
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { user, signOut, saveUsername } = useAuth();
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

  // Tap-to-edit display name. Optimistic: show the draft immediately, roll back
  // on failure. saveUsername writes user_metadata.username, which displayNameFor
  // reads once the session refreshes.
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const shownName = nameOverride ?? displayNameFor(user);

  const startEditName = () => {
    haptics.select();
    setDraftName(hasUsername(user) ? displayNameFor(user) : '');
    setEditingName(true);
  };
  const commitName = async () => {
    setEditingName(false);
    const next = cleanUsername(draftName);
    if (!next || next === displayNameFor(user)) return;
    setNameOverride(next);
    try {
      setNameOverride(await saveUsername(next));
    } catch {
      setNameOverride(null);
      show("Couldn't save your name — try again.", 'error');
    }
  };

  const tellAFriend = () => {
    haptics.select();
    void Share.share({
      message:
        "I've been cooking with Otto — the quieter kind of cookbook. Ask me to show you!",
    }).catch(() => {});
  };
  const rateOtto = () => {
    haptics.select();
    if (RATE_APP_URL) {
      void Linking.openURL(RATE_APP_URL).catch(() => {});
      return;
    }
    show("Otto isn't in the store yet — thank you for wanting to!", 'info');
  };
  const reportBug = () => {
    haptics.select();
    const body = `What happened?\n\n\nWhat did you expect?\n\n\n—\nOtto v${APP_VERSION} · ${Platform.OS}`;
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Otto bug report')}&body=${encodeURIComponent(body)}`;
    void Linking.openURL(url).catch(() => {});
  };

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

      {/* IDENTITY — Otto badge + tap-to-edit name */}
      <View style={styles.identityCard}>
        <OttoArt name="badge" size={56} />
        <View style={{ flex: 1 }}>
          {editingName ? (
            <TextInput
              style={nameInput}
              value={draftName}
              onChangeText={setDraftName}
              onSubmitEditing={commitName}
              onBlur={commitName}
              maxLength={MAX_USERNAME}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              placeholder="What should Otto call you?"
              placeholderTextColor={colors.inkSoft}
              accessibilityLabel="Your name"
            />
          ) : (
            <Pressable
              onPress={startEditName}
              accessibilityRole="button"
              accessibilityLabel={`Your name, ${shownName}. Tap to change.`}
            >
              <View style={styles.nameRow}>
                <Text role="title">{shownName}</Text>
                <Ionicons name="pencil" size={14} color={colors.inkSoft} />
              </View>
              <Text role="caption">
                {hasUsername(user) || nameOverride ? 'Tap to change your name' : 'Tap to add your name'}
              </Text>
            </Pressable>
          )}
        </View>
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
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: space[1] }}>
              <RNText style={clubTitle}>Otto Club</RNText>
              <Text role="body">Everything Otto can do, one simple membership. Opening soon.</Text>
            </View>
            <OttoArt name="floating" size={72} />
          </View>
          <View style={styles.clubButton}>
            <RNText style={clubButtonText}>See how it works</RNText>
          </View>
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

      {/* PREFERENCES — settings list, the inline units toggle sits last (Figma) */}
      <View style={styles.section}>
        <Text role="caption">Preferences</Text>
        <View style={styles.card}>
          {hasPasswordLogin(user) && (
            <SettingsRow icon="lock-closed-outline" label="Change password" onPress={() => router.push('/change-password')} />
          )}
          <SettingsRow icon="restaurant-outline" label="Food preferences" onPress={() => router.push('/preferences')} divided={hasPasswordLogin(user)} />
          <SettingsRow icon="notifications-outline" label="Reminders" onPress={() => router.push('/notifications')} divided />
          <SettingsRow icon="people-outline" label="Our shared list" onPress={() => router.push('/household')} divided />
          <View style={[styles.unitRow, styles.rowDivider]}>
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
      </View>

      {/* SPREAD THE WORD */}
      <View style={styles.section}>
        <Text role="caption">Spread the word</Text>
        <View style={styles.card}>
          <SettingsRow icon="gift-outline" label="Tell a friend" onPress={tellAFriend} />
          <SettingsRow icon="heart-outline" label="Rate Otto" divided onPress={rateOtto} />
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
          <SettingsRow icon="bug-outline" label="Report a bug" divided onPress={reportBug} />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy policy"
            divided
            onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL)}
          />
          <SettingsRow
            icon="document-text-outline"
            label="Terms"
            divided
            onPress={() => void WebBrowser.openBrowserAsync(TERMS_URL)}
          />
          <View style={[styles.row, styles.settingsRow, styles.rowDivider]}>
            <Ionicons name="paw-outline" size={20} color={colors.inkSoft} style={{ marginRight: space[3] }} />
            <Text role="body">About Otto</Text>
            <View style={{ flex: 1 }} />
            <Text role="caption">v{APP_VERSION}</Text>
          </View>
        </View>
      </View>

      {/* EXITS — quiet, honest, never buried */}
      <Pressable
        style={styles.signOutRow}
        onPress={onSignOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Ionicons name="log-out-outline" size={20} color={colors.terracotta} />
        <Text role="computed">Sign out</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: space[4],
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  section: { gap: space[2] },
  card: { backgroundColor: colors.white, borderRadius: radii.card, paddingHorizontal: space[4] },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: space[3] },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    marginTop: space[4],
    height: 52,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: colors.terracotta,
  },
  settingsRow: { minHeight: 44 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.creamDeep },
  unitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space[3] },
  unitToggle: { width: 160 },
  clubCard: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.terracotta,
    padding: space[4],
    gap: space[3],
    overflow: 'hidden',
  },
  clubButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.terracotta,
    borderRadius: radii.pill,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
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

// Inline name field — styled to sit where the title Text was, no bordered box.
const nameInput: TextStyle = {
  ...type.title,
  color: colors.ink,
  padding: 0,
};

// Otto Club card: terracotta serif title + filled pill button (Figma). Styled
// directly because the shared Text is role-only (terracotta title + white
// on-terracotta button label are both outside the role palette).
const clubTitle: TextStyle = { ...type.title, color: colors.terracotta };
const clubButtonText: TextStyle = { ...type.label, color: colors.white, fontWeight: '700' };
