// Search (R3.3, flowV2): its own screen, pushed from Home's search field and
// back to Home. Empty field: recent searches (5) and browse by kind (the
// painted category tiles). Typing: results, narrowed by kind with chips.
// Nothing found: Ask Otto with the words already in the box (the route wires
// the hand-off; this screen only says what was asked).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text as RNText, TextInput, View, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Chip, OttoArt, OttoError, OttoLoading, Text } from '@/shared/ui';
import { colors, radii, space, type } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { addRecent, loadRecent, saveRecent } from '@/shared/recentSearches';
import { CategoryTiles } from './components/CategoryTiles';
import { RecipeCard } from './RecipeCard';
import { useCategories, useDiscover, useSearch } from './recipe.queries';
import { kindsIn, narrowByKind } from './search.logic';

const textButton: TextStyle = { ...type.body, fontWeight: '600', color: colors.terracotta };

export interface SearchScreenProps {
  /** Nothing found → the route hands the words to Otto and opens the chat. */
  onAskOtto: (query: string) => void;
}

export function SearchScreen({ onAskOtto }: SearchScreenProps) {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [kind, setKind] = useState<string | null>(null); // narrows results
  const [browse, setBrowse] = useState<string | null>(null); // a tile tapped, no words
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    void loadRecent().then(setRecent);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);
  // New words, new results: an old kind chip would hide them.
  useEffect(() => setKind(null), [debounced]);

  // From storage, not the on-screen list: a search sent before the list has
  // loaded must add to the saved five, not replace them.
  const remember = (q: string) => {
    setRecent((cur) => addRecent(cur, q));
    void loadRecent().then((saved) => saveRecent(addRecent(saved, q)));
  };
  const run = (q: string) => {
    setBrowse(null);
    setQuery(q);
    setDebounced(q);
    remember(q);
    inputRef.current?.blur();
  };
  const clearRecent = () => {
    setRecent([]);
    saveRecent([]);
  };

  const categories = useCategories();
  const search = useSearch(debounced);
  const browsing = useDiscover(debounced ? null : browse);
  const isSearching = debounced.length > 0;
  const active = isSearching ? search : browse ? browsing : null;

  const all = useMemo(() => (active?.data ?? []), [active?.data]);
  const kinds = useMemo(() => (isSearching ? kindsIn(all) : []), [isSearching, all]);
  const grid = useMemo(() => (isSearching ? narrowByKind(all, kind) : all), [isSearching, all, kind]);

  const back = () => {
    if (browse && !isSearching) return setBrowse(null);
    router.back();
  };

  const Header = (
    <View style={{ gap: space[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={back}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.creamDeep,
            borderRadius: radii.pill,
            paddingHorizontal: space[4],
            minHeight: 48,
            justifyContent: 'center',
          }}
        >
          <TextInput
            ref={inputRef}
            autoFocus
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              if (t) setBrowse(null);
            }}
            onSubmitEditing={() => remember(query)}
            placeholder="Dishes, ingredients, cuisines"
            placeholderTextColor={colors.inkSoft}
            returnKeyType="search"
            enablesReturnKeyAutomatically
            clearButtonMode="while-editing"
            accessibilityLabel="Search recipes"
            style={{ fontSize: 16, color: colors.ink }}
          />
        </View>
        {query.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => {
              setQuery('');
              setDebounced('');
              inputRef.current?.focus();
            }}
            style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: space[1] }}
          >
            <RNText style={textButton}>Clear</RNText>
          </Pressable>
        )}
      </View>

      {!isSearching && !browse && (
        <>
          {recent.length > 0 && (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text role="meta">RECENT</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear recent searches"
                  onPress={clearRecent}
                  style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' }}
                >
                  <RNText style={textButton}>Clear</RNText>
                </Pressable>
              </View>
              {recent.map((q) => (
                <Pressable
                  key={q}
                  accessibilityRole="button"
                  accessibilityLabel={`Search ${q}`}
                  onPress={() => run(q)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 44, borderBottomWidth: 1, borderBottomColor: colors.border }}
                >
                  <Ionicons name="time-outline" size={18} color={colors.inkSoft} />
                  <View style={{ flex: 1 }}>
                    <Text role="body" numberOfLines={1}>{q}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
          {categories.data?.length ? (
            <View style={{ gap: space[2] }}>
              <Text role="meta">BROWSE BY KIND</Text>
              <CategoryTiles
                categories={categories.data}
                selected={null}
                onSelect={(name) => {
                  haptics.select();
                  inputRef.current?.blur();
                  setBrowse(name);
                }}
              />
            </View>
          ) : null}
        </>
      )}

      {isSearching && kinds.length > 1 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          {kinds.map((k) => (
            <Chip key={k} label={k} kind="radio" selected={kind === k} onPress={() => setKind(kind === k ? null : k)} />
          ))}
        </View>
      )}

      {(isSearching || browse) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text role="title">{isSearching ? `Results for “${debounced}”` : browse}</Text>
          {grid.length > 0 ? <Text role="meta">{grid.length} recipes</Text> : null}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream }}>
      <FlatList
        data={grid}
        renderItem={({ item }) => <RecipeCard recipe={item} />}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', gap: space[2] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: space[4], gap: space[3] }}
        ListHeaderComponent={Header}
        ListEmptyComponent={
          !active ? null : active.isLoading ? (
            <OttoLoading message="Otto’s looking…" />
          ) : active.isError ? (
            <OttoError onRetry={() => void active.refetch()} />
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: space[7], paddingHorizontal: space[5], gap: space[3] }}>
              <OttoArt name="sleepy" size={120} />
              <Text role="title">{isSearching ? `Nothing called “${debounced}” yet` : 'This shelf is empty'}</Text>
              {isSearching && (
                <>
                  <Text role="caption">Otto can write it for you.</Text>
                  <Button
                    title={`Ask Otto for “${debounced}”`}
                    variant="primary"
                    onPress={() => {
                      remember(debounced);
                      onAskOtto(debounced);
                    }}
                  />
                </>
              )}
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
