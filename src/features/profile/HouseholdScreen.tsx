import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OttoArt, OttoIdle, Screen, Text, Button, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';

// Our shared list — one list a household adds to and checks off together.
// ponytail: the live sync layer (unguessable invite links, the CollabAPI
// backend, cross-device polling) is the share/planner domain and isn't in
// profile's allowlist — see packet gaps. This is the on-device shell: start a
// list, add and check items locally. Wire the network layer when the shared
// shopping-list surface exists.
interface Item {
  id: number;
  name: string;
  checked: boolean;
}

export function HouseholdScreen() {
  const router = useRouter();
  const { show } = useToast();
  const [started, setStarted] = useState(false);
  const [name, setName] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    setItems((prev) => [...prev, { id: Date.now(), name: value, checked: false }]);
    setDraft('');
  };
  const toggle = (id: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  const removeItem = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  const open = items.filter((i) => !i.checked).length;

  if (!started) {
    return (
      <Screen title="Our list" onBack={() => router.back()}>
        <ScrollView contentContainerStyle={styles.setupScroll} keyboardShouldPersistTaps="handled">
          <OttoIdle name="happy" size={140} />
          <Text role="title">One list, shared</Text>
          <Text role="caption">
            Everyone in the house adds and checks off the same list. Start yours here, then send the
            invite link so others can join.
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
            <Button
              title="Start a shared list"
              variant="primary"
              onPress={() => {
                setStarted(true);
                show('List started — invite links open with the shopping list.', 'info');
              }}
            />
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen title="Our list" onBack={() => router.back()}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text role="caption">{open === 0 ? 'ALL DONE' : `${open} STILL TO PICK UP`}</Text>

        {items.length === 0 && (
          <View style={styles.emptyList}>
            <OttoArt name="thinking" size={120} />
            <Text role="caption">
              Nothing on the list yet — add the first thing below.
            </Text>
          </View>
        )}

        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Pressable
              onPress={() => toggle(item.id)}
              style={[styles.check, item.checked && styles.checkOn]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.checked }}
              accessibilityLabel={item.name}
            >
              {item.checked && <Ionicons name="checkmark" size={16} color={colors.terracotta} />}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text role="body">{item.name}</Text>
            </View>
            <Pressable
              onPress={() => removeItem(item.id)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.name}`}
            >
              <Ionicons name="close" size={18} color={colors.inkSoft} />
            </Pressable>
          </View>
        ))}

        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={draft}
            onChangeText={setDraft}
            placeholder="Add something for everyone…"
            placeholderTextColor={colors.inkSoft}
            onSubmitEditing={add}
            returnKeyType="done"
            accessibilityLabel="Add an item to the shared list"
          />
          <Button title="Add" variant="secondary" onPress={add} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  setupScroll: { padding: space[4], paddingTop: space[6], alignItems: 'center', gap: space[4] },
  scroll: { padding: space[4], paddingBottom: space[7], gap: space[3] },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  nameInput: {
    minWidth: 120,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: space[1],
    color: colors.terracotta,
    fontWeight: '600',
  },
  emptyList: { alignItems: 'center', gap: space[2], paddingVertical: space[5] },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    minHeight: 44,
    color: colors.ink,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  check: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.accentSoft },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
});
