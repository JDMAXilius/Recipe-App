import React, { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OttoIdle, OttoLoading, Screen, Text, Button, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { useAuth, displayNameFor } from '@/features/auth';
import { useHousehold } from '@/features/household';

// Our shared kitchen — membership for the shared shopping list. Create a kitchen
// (get an invite code), or join one with a code; members share the same list on
// the Shopping screen (aggregated week + realtime check-offs). This screen owns
// join/create/invite/members; the list itself lives in ShoppingScreen.
export function HouseholdScreen() {
  const router = useRouter();
  // Robust back: when this screen is the first in the stack (e.g. opened via a
  // deep link or after a redirect) router.back() is a no-op, which reads as a
  // dead button — fall back to Account, where "Our shared list" lives.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));
  const { show } = useToast();
  const { user } = useAuth();
  const { household, members, isLoading, create, join, leave } = useHousehold();

  const [name, setName] = useState(() => displayNameFor(user));
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | 'leave' | null>(null);

  const doCreate = async () => {
    setBusy('create');
    try {
      await create(name.trim());
      show('Kitchen ready — share the code so others can join.', 'success');
    } catch {
      show("Couldn't start the kitchen — try again.", 'error');
    } finally {
      setBusy(null);
    }
  };
  const doJoin = async () => {
    const c = code.trim();
    if (c.length < 6) {
      show('Enter the 6-character code your kitchen shared.', 'info');
      return;
    }
    setBusy('join');
    try {
      await join(c, name.trim());
      show("You're in — the shared list is on your Shopping screen.", 'success');
    } catch {
      show('No kitchen with that code — double-check it.', 'error');
    } finally {
      setBusy(null);
    }
  };
  const doLeave = async () => {
    setBusy('leave');
    try {
      await leave();
      show('Left the kitchen.', 'info');
    } catch {
      show("Couldn't leave right now — try again.", 'error');
    } finally {
      setBusy(null);
    }
  };
  const shareInvite = () => {
    if (!household) return;
    haptics.select();
    void Share.share({
      message: `Join our Otto kitchen — open the app, Account → Our shared list → Join, and enter code ${household.invite_code}.`,
    }).catch(() => {});
  };

  if (isLoading) {
    return (
      <Screen title="Our shared list" onBack={goBack}>
        <OttoLoading message="Finding your kitchen…" />
      </Screen>
    );
  }

  // ───────────────────────────────── in a household
  if (household) {
    return (
      <Screen title="Our shared list" onBack={goBack}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: space[2] }}>
            <OttoIdle name="happy" size={120} />
            <Text role="title">{household.name}</Text>
            <Text role="caption">
              Everyone here shares one shopping list — build it on the Shopping screen and check it
              off together.
            </Text>
          </View>

          {/* Invite code — the join key. */}
          <View style={styles.card}>
            <Text role="caption">INVITE CODE</Text>
            <View style={styles.codeRow}>
              <Text role="display">{household.invite_code}</Text>
              <Pressable onPress={shareInvite} hitSlop={8} accessibilityRole="button" accessibilityLabel="Share the invite code" style={styles.shareBtn}>
                <Ionicons name="share-outline" size={20} color={colors.white} />
              </Pressable>
            </View>
          </View>

          {/* Members */}
          <View style={{ gap: space[2] }}>
            <Text role="caption">In this kitchen</Text>
            {members.map((m) => (
              <View key={m.user_id} style={styles.memberRow}>
                <Ionicons name="person-circle-outline" size={28} color={colors.inkSoft} />
                <Text role="body">
                  {m.display_name || 'A cook'}
                  {m.user_id === user?.id ? ' (you)' : ''}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ alignSelf: 'stretch', marginTop: space[3] }}>
            <Button title="Open the shared list" variant="primary" onPress={() => router.push('/shopping')} />
          </View>
          <Pressable onPress={doLeave} disabled={busy === 'leave'} style={styles.leaveRow} accessibilityRole="button" accessibilityLabel="Leave this kitchen">
            <Text role="caption">Leave this kitchen</Text>
          </Pressable>
        </ScrollView>
      </Screen>
    );
  }

  // ───────────────────────────────── not in a household: create or join
  return (
    <Screen title="Our shared list" onBack={goBack}>
      <ScrollView contentContainerStyle={styles.setupScroll} keyboardShouldPersistTaps="handled">
        <OttoIdle name="happy" size={140} />
        <Text role="title">One list, shared</Text>
        <Text role="caption">
          Start a shared kitchen or join one with a code. Everyone adds to and checks off the same
          shopping list — in real time.
        </Text>

        <View style={styles.nameLine}>
          <Text role="caption">You&apos;ll show up as</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="your name"
            placeholderTextColor={colors.inkSoft}
            maxLength={40}
            accessibilityLabel="Your display name"
          />
        </View>

        <View style={{ alignSelf: 'stretch' }}>
          <Button title="Start a shared kitchen" variant="primary" loading={busy === 'create'} onPress={doCreate} />
        </View>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text role="caption">or join one</Text>
          <View style={styles.orLine} />
        </View>

        <View style={styles.joinRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="6-CHAR CODE"
            placeholderTextColor={colors.inkSoft}
            autoCapitalize="characters"
            maxLength={6}
            onSubmitEditing={doJoin}
            returnKeyType="go"
            accessibilityLabel="Invite code"
          />
          <Button title="Join" variant="secondary" loading={busy === 'join'} onPress={doJoin} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  setupScroll: { padding: space[4], paddingTop: space[6], alignItems: 'center', gap: space[4] },
  scroll: { padding: space[4], paddingBottom: space[7], gap: space[4] },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  nameInput: {
    minWidth: 120,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: space[1],
    color: colors.terracotta,
    fontWeight: '600',
  },
  card: { backgroundColor: colors.white, borderRadius: radii.card, padding: space[4], gap: space[2] },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  leaveRow: { alignItems: 'center', paddingVertical: space[4] },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], alignSelf: 'stretch' },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  joinRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], alignSelf: 'stretch' },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    minHeight: 44,
    color: colors.ink,
    letterSpacing: 2,
    fontWeight: '600',
  },
});
