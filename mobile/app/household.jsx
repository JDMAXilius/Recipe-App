import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { displayNameFor } from "../lib/username";
import ScreenHeader from "../components/ScreenHeader";
import { createHouseholdStyles } from "../assets/styles/household.styles";
import { CollabAPI } from "../services/userRecipes";
import { sharePlainText } from "../lib/shareText";
import { parseInviteToken } from "../lib/inviteLink.mjs";
import OttoIdle from "../components/OttoIdle";

// S3 — the shared list. One unguessable link is the whole membership: start
// a list (seeded from your own shopping list if you like), hand the link to
// your household, and everyone adds and checks the same list. No sockets —
// the screen refreshes on focus and every few seconds while open, which is
// honest enough for a grocery run.

const STORE_KEY = "otto.household.v1";
const SHOPPING_KEY = "otto.shopping.v1";

// Lists you've been in, kept on THIS device only. Losing the invite link is
// the usual way back in gets blocked, so remember the last few tokens and
// offer one-tap rejoin. Deliberately local: there is no member directory to
// search — the token is the membership — and building one would mean a user
// index and a consent surface for the sake of a grocery list.
const HISTORY_KEY = "otto.household.recent.v1";
const HISTORY_MAX = 3;

const agoLabel = (iso) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (!Number.isFinite(days) || days < 0) return "recently";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
};


const HouseholdScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { show } = useToast();
  const { user } = useAuth();
  const styles = useMemo(() => createHouseholdStyles(colors), [colors]);

  const [membership, setMembership] = useState(null); // {token, url, displayName}
  const [recent, setRecent] = useState([]); // [{token, url, displayName, lastSeen}]
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState(null); // {mine, items}
  // Seeded from the name set on the account screen — one identity, so nobody
  // sets a name there and still shows up as a relay address on a shared list.
  const [displayName, setDisplayName] = useState(() => displayNameFor(user, "Me"));
  // The initializer above runs on the first render, which is a beat BEFORE
  // AuthContext resolves the session — so it sees user=null and settles on
  // "Me". This follows the account name once the user actually arrives, but
  // never overwrites a name loaded from a stored list or one being typed.
  const nameTouched = useRef(false);
  const [joinLink, setJoinLink] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [busy, setBusy] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORE_KEY), AsyncStorage.getItem(HISTORY_KEY)])
      .then(([rawMembership, rawHistory]) => {
        const stored = rawMembership ? JSON.parse(rawMembership) : null;
        if (stored?.token) {
          setMembership(stored);
          setDisplayName(stored.displayName || "Me");
          nameTouched.current = true;
        }
        const history = rawHistory ? JSON.parse(rawHistory) : [];
        if (Array.isArray(history)) setRecent(history.filter((entry) => entry?.token));
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (nameTouched.current || !user) return;
    setDisplayName(displayNameFor(user, "Me"));
  }, [user]);

  const rememberList = useCallback((entry) => {
    setRecent((prev) => {
      const next = [
        { ...entry, lastSeen: new Date().toISOString() },
        ...prev.filter((r) => r.token !== entry.token),
      ].slice(0, HISTORY_MAX);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const forgetList = useCallback((token) => {
    setRecent((prev) => {
      const next = prev.filter((r) => r.token !== token);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const leaveLocally = useCallback(
    async (message) => {
      setMembership(null);
      setData(null);
      await AsyncStorage.removeItem(STORE_KEY).catch(() => {});
      if (message) show({ message });
    },
    [show]
  );

  const refresh = useCallback(
    async (current) => {
      const m = current || membership;
      if (!m?.token) return;
      try {
        setData(await CollabAPI.get(m.token));
      } catch (error) {
        // a put-away or dead link clears the membership instead of erroring forever
        if (/put away|No list/i.test(error.message || "")) {
          leaveLocally("That shared list was put away.");
        }
      }
    },
    [membership, leaveLocally]
  );

  // refresh on focus + a slow poll while the screen stays open
  useFocusEffect(
    useCallback(() => {
      refresh();
      pollRef.current = setInterval(refresh, 8000);
      return () => clearInterval(pollRef.current);
    }, [refresh])
  );

  const persistMembership = async (next) => {
    setMembership(next);
    rememberList(next);
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(next)).catch(() => {});
  };

  // Back into a list you were already in, without hunting for the link.
  const rejoin = async (entry) => {
    if (busy) return;
    setBusy(true);
    try {
      const fetched = await CollabAPI.get(entry.token); // proves it's still live
      await persistMembership({
        token: entry.token,
        url: fetched.url || entry.url || null,
        displayName: cleanName(),
      });
      setData(fetched);
      show({ message: "You're back on the list." });
    } catch (error) {
      forgetList(entry.token); // put away or gone — stop offering it
      show({ message: error.message || "That list isn't around any more." });
    } finally {
      setBusy(false);
    }
  };

  const cleanName = () => displayName.trim() || "Me";

  const start = async (seedFromList) => {
    if (busy) return;
    setBusy(true);
    Haptics.selectionAsync().catch(() => {});
    try {
      let items = [];
      if (seedFromList) {
        try {
          const stored = JSON.parse((await AsyncStorage.getItem(SHOPPING_KEY)) || "null");
          items = [
            ...(stored?.items || []).filter((i) => !stored.checked?.[i.key]),
            ...(stored?.custom || []).filter((c) => !stored.checked?.[c.key]),
          ].map((i) => ({ name: i.name, amount: i.amount || "" }));
        } catch {
          items = [];
        }
      }
      const created = await CollabAPI.create(cleanName(), items);
      await persistMembership({ ...created, displayName: cleanName() });
      await refresh({ ...created, displayName: cleanName() });
      show({ message: "List started — send the link so others can join." });
    } catch (error) {
      show({
        message: error.message?.startsWith("Otto")
          ? error.message
          : "Shared lists aren't switched on for this kitchen yet.",
      });
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    const token = parseInviteToken(joinLink);
    if (!token) {
      show({ message: "That link doesn't look right — paste the whole thing." });
      return;
    }
    setBusy(true);
    try {
      const fetched = await CollabAPI.get(token); // proves the list is live
      // Take the canonical URL from the server, not the string that was pasted:
      // a joiner who pasted a bare token still needs a real link to pass on.
      const next = { token, url: fetched.url || null, displayName: cleanName() };
      await persistMembership(next);
      setData(fetched);
      setJoinLink("");
      show({ message: "You're on the list — everyone sees the same one now." });
    } catch (error) {
      show({ message: error.message || "Couldn't find a live list at that link." });
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (item) => {
    Haptics.selectionAsync().catch(() => {});
    // optimistic — the poll reconciles
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === item.id
          ? { ...i, checked: !item.checked, checkedByName: !item.checked ? cleanName() : null }
          : i
      ),
    }));
    try {
      await CollabAPI.check(membership.token, item.id, !item.checked, cleanName());
    } catch {
      refresh();
    }
  };

  const add = async () => {
    const name = newItem.trim();
    if (!name) return;
    setNewItem("");
    try {
      const created = await CollabAPI.addItem(membership.token, {
        name,
        amount: "",
        displayName: cleanName(),
      });
      setData((prev) => ({ ...prev, items: [...prev.items, created] }));
    } catch (error) {
      show({ message: error.message || "Couldn't add that." });
    }
  };

  const removeItem = async (item) => {
    setData((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== item.id) }));
    try {
      await CollabAPI.removeItem(membership.token, item.id);
    } catch {
      refresh();
    }
  };

  const shareLink = async () => {
    const url = data?.url || membership?.url || "";
    if (!url) {
      show({ message: "Couldn't build the invite link — pull the list down to refresh." });
      return;
    }
    const { copied } = await sharePlainText(
      "Join our shopping list on Otto — add things, check things off, we all see the same list.",
      "Our shopping list",
      url
    );
    if (copied) show({ message: "Invite copied — paste it to your household." });
  };

  const putAway = async () => {
    try {
      await CollabAPI.putAway(membership.token);
      forgetList(membership.token); // dead for everyone — don't offer a rejoin
      leaveLocally("List put away — the link is off for everyone.");
    } catch (error) {
      show({ message: error.message || "Couldn't put the list away." });
    }
  };

  const open = data?.items?.filter((i) => !i.checked).length || 0;
  // Who's pitched in — distinct names off the items themselves (Instacart's
  // "everyone shopping with you" strip, without a members table).
  const members = data
    ? [...new Set((data.items || []).flatMap((i) => [i.addedByName, i.checkedByName]).filter(Boolean))]
    : [];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Our list"
        onBack={() => router.back()}
        right={
          membership && data ? (
            <TouchableOpacity
              onPress={shareLink}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Share the invite link"
            >
              <Ionicons name="person-add-outline" size={20} color={colors.ink} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {!hydrated ? null : !membership ? (
          <ScrollView contentContainerStyle={styles.setupScroll} keyboardShouldPersistTaps="handled">
            <OttoIdle
              source={require("../assets/mascot/otto-happy-cut.png")}
              style={styles.setupOtto}
            />
            <Text style={styles.setupTitle}>One list, shared</Text>
            <Text style={styles.setupBody}>
              Everyone in the house adds and checks off the same list — live.
              Start yours from what&apos;s already on your list.
            </Text>

            {/* name as one quiet inline line, not a form to fill out */}
            <View style={styles.nameLine}>
              <Text style={styles.nameLabel}>You&apos;ll show up as</Text>
              <TextInput
                style={styles.nameInput}
                value={displayName}
                onChangeText={(text) => {
                  nameTouched.current = true;
                  setDisplayName(text);
                }}
                placeholder="your name"
                placeholderTextColor={colors.inkSoft}
                maxLength={40}
                accessibilityLabel="Your display name"
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => start(true)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Start a shared list"
            >
              <Ionicons name="people-outline" size={18} color={colors.white} />
              <Text style={styles.primaryButtonText}>Start a shared list</Text>
            </TouchableOpacity>

            {/* one tap back into a list you've already been in */}
            {recent.length > 0 && (
              <View style={styles.joinReveal}>
                <Text style={styles.cardHint}>Lists you’ve been in</Text>
                {recent.map((entry) => (
                  <TouchableOpacity
                    key={entry.token}
                    style={styles.itemRow}
                    onPress={() => rejoin(entry)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={`Rejoin the list you were last in ${agoLabel(entry.lastSeen)}`}
                  >
                    <Ionicons name="repeat-outline" size={18} color={colors.accent} />
                    <View style={styles.itemBody}>
                      <Text style={styles.itemName}>Shared list</Text>
                      <Text style={styles.itemWho}>last here {agoLabel(entry.lastSeen)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* joining is the rarer path — quiet until asked for */}
            {showJoin ? (
              <View style={styles.joinReveal}>
                <TextInput
                  style={styles.input}
                  value={joinLink}
                  onChangeText={setJoinLink}
                  placeholder="Paste the invite link"
                  placeholderTextColor={colors.inkSoft}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  accessibilityLabel="Invite link"
                />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={join}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel="Join the shared list"
                >
                  <Ionicons name="enter-outline" size={18} color={colors.accent} />
                  <Text style={styles.secondaryButtonText}>Join it</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.joinLink}
                onPress={() => setShowJoin(true)}
                accessibilityRole="button"
                accessibilityLabel="I have an invite link"
              >
                <Text style={styles.joinLinkText}>Got an invite link? Join it</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {members.length > 0 && (
              <View style={styles.membersRow}>
                {members.slice(0, 6).map((name) => (
                  <View key={name} style={styles.avatar}>
                    <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                ))}
                <Text style={styles.membersLabel} numberOfLines={1}>
                  {members.length === 1 ? "just you so far" : members.join(", ")}
                </Text>
              </View>
            )}

            {data && (
              <Text style={styles.countLine}>
                {open === 0 ? "ALL DONE" : `${open} STILL TO PICK UP`}
              </Text>
            )}

            {data?.items?.length === 0 && (
              <View style={styles.emptyList}>
                <OttoIdle
                  source={require("../assets/mascot/otto-thinking-cut.png")}
                  style={{ width: 120, height: 120 }}
                />
                <Text style={styles.emptyText}>
                  Nothing on the list yet — add the first thing below.
                </Text>
              </View>
            )}

            {(data?.items || []).map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <TouchableOpacity
                  onPress={() => toggle(item)}
                  style={[styles.itemCheck, item.checked && styles.itemCheckOn]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: Boolean(item.checked) }}
                  accessibilityLabel={item.name}
                >
                  {item.checked && <Ionicons name="checkmark" size={16} color={colors.white} />}
                </TouchableOpacity>
                <View style={styles.itemBody}>
                  <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                    {item.amount ? <Text style={styles.itemQty}>{item.amount} </Text> : null}
                    {item.name}
                  </Text>
                  <Text style={styles.itemWho}>
                    {item.checked && item.checkedByName
                      ? `${item.checkedByName} got it`
                      : `${item.addedByName} added`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeItem(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.name}`}
                >
                  <Ionicons name="close" size={16} color={colors.inkSoft} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newItem}
                onChangeText={setNewItem}
                placeholder="Add something for everyone…"
                placeholderTextColor={colors.inkSoft}
                onSubmitEditing={add}
                returnKeyType="done"
                accessibilityLabel="Add an item to the shared list"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={add}
                accessibilityRole="button"
                accessibilityLabel="Add item"
              >
                <Ionicons name="add" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.quietAction}
              onPress={data?.mine ? putAway : () => leaveLocally("You've left the list.")}
              accessibilityRole="button"
              accessibilityLabel={data?.mine ? "Put the list away for everyone" : "Leave the list"}
            >
              <Text style={styles.quietActionText}>
                {data?.mine ? "Put the list away (turns it off for everyone)" : "Leave the list"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};
export default HouseholdScreen;
