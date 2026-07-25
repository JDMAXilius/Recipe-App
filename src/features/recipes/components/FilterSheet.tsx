import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Sheet, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { useDiscover } from '../recipe.queries';

// FilterSheet — Figma (node 213:99) plus the researched filter-sheet structure
// (eBay/Airwallex/Base): grab handle · header with the live result count ·
// "Selected · N" summary · Category group · Cuisine group · footer with Clear
// all + live-count CTA. Category is SINGLE choice (tap the active chip to clear
// it); Cuisine is multi — a recipe matching ANY selected cuisine qualifies. Each
// group says so in its header, because a chip row can't show its own arity.
// The intersection itself lives in useDiscover; the sheet just warms it — the
// live count calls useDiscover with the PENDING selection, so hitting "Show"
// lifts pending → applied and the grid reads a warm cache. Gated on `visible`
// so the count query is idle while closed.
export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  categories: string[];
  areas: string[];
  initialCategory: string | null;
  initialAreas: string[];
  onApply: (category: string | null, areas: string[]) => void;
}

// Selected state carries THREE cues — soft terracotta wash, a terracotta ring,
// and a check — never colour alone (WCAG 1.4.1; the researched filter pattern).
// The label stays INK at every state: a category name is authored content, and
// ink on accentSoft reads ~11.7:1 where the old filled-terracotta chip painted
// terracotta text on a terracotta fill (1:1 — the label vanished). accentSoft is
// used exactly as its token documents it: "chip fills, selected tiles".
function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filter ${label}`}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[2],
        minHeight: 44, // tap-target law (matches the shopping-list chip)
        paddingHorizontal: space[4],
        paddingVertical: space[2],
        borderRadius: radii.pill,
        backgroundColor: active ? colors.accentSoft : colors.creamDeep,
        borderWidth: 1.5,
        borderColor: active ? colors.terracotta : 'transparent',
      }}
    >
      {active ? <Ionicons name="checkmark" size={15} color={colors.terracotta} /> : null}
      <Text role="body">{label}</Text>
    </Pressable>
  );
}

// The summary chip: a selected Chip whose trailing check becomes an ✕. Same
// wash/ring/ink label as the selected state above (it IS a selected value —
// borrowing a second visual language for the same thing would be a lie), only
// the affordance changes. The whole chip is the target, not just the glyph, so
// the 44pt law holds for the icon too; the label carries the intent.
function RemoveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Remove ${label} filter`}
      onPress={onRemove}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[2],
        minHeight: 44,
        paddingLeft: space[4],
        paddingRight: space[3],
        paddingVertical: space[2],
        borderRadius: radii.pill,
        backgroundColor: colors.accentSoft,
        borderWidth: 1.5,
        borderColor: colors.terracotta,
      }}
    >
      <Text role="body">{label}</Text>
      <Ionicons name="close" size={15} color={colors.terracotta} />
    </Pressable>
  );
}

// Group header: authored label left, behaviour hint right. The hint is
// caption (quiet inkSoft), not meta — it's a sentence fragment, not an eyebrow,
// and shouting "SINGLE CHOICE" next to "Category" would out-rank the label.
function GroupHeader({ label, hint }: { label: string; hint: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space[3] }}>
      <Text role="meta">{label}</Text>
      <Text role="caption">{hint}</Text>
    </View>
  );
}

// Module-level so the disabled (sheet-closed) count query gets a stable empty
// array instead of a fresh literal every render.
const NO_AREAS: string[] = [];

export function FilterSheet({
  visible,
  onClose,
  categories,
  areas,
  initialCategory,
  initialAreas,
  onApply,
}: FilterSheetProps) {
  const [category, setCategory] = useState<string | null>(initialCategory);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(initialAreas);

  // Re-seat the pending selection from the applied one each time it opens.
  useEffect(() => {
    if (visible) {
      setCategory(initialCategory);
      setSelectedAreas(initialAreas);
    }
  }, [visible, initialCategory, initialAreas]);

  // Live count — disabled (nothing selected) while closed. Feeds BOTH the
  // header count and the CTA off one query, so they can never disagree.
  const count = useDiscover(visible ? category : null, visible ? selectedAreas : NO_AREAS);
  const n = count.data?.length ?? 0;
  const nothingSelected = !category && selectedAreas.length === 0;

  // Category is single choice: tapping the active chip clears it.
  const toggleCategory = (value: string) => () => {
    haptics.select();
    setCategory((current) => (current === value ? null : value));
  };

  // Cuisine is a set: tapping toggles the value in or out, order of selection
  // preserved (useDiscover sorts for its cache key, so it doesn't matter here).
  const toggleArea = (value: string) => () => {
    haptics.select();
    setSelectedAreas((current) =>
      current.includes(value) ? current.filter((a) => a !== value) : [...current, value],
    );
  };

  const removeArea = (value: string) => () => {
    haptics.select();
    setSelectedAreas((current) => current.filter((a) => a !== value));
  };

  const clearCategory = () => {
    haptics.select();
    setCategory(null);
  };

  const clearAll = () => {
    haptics.select();
    setCategory(null);
    setSelectedAreas([]);
  };

  const countLabel = count.isFetching ? 'Counting…' : `${n} ${n === 1 ? 'recipe' : 'recipes'}`;
  const ctaTitle = nothingSelected
    ? 'Show recipes'
    : count.isFetching
      ? 'Counting…'
      : `Show ${n} ${n === 1 ? 'recipe' : 'recipes'}`;
  const selectedCount = (category ? 1 : 0) + selectedAreas.length;

  return (
    // Title rendered here rather than through Sheet's `title` prop: the count
    // has to sit beside it, and Sheet takes a plain string (shared component —
    // not this packet's to widen). Same title role + spacing it would apply.
    <Sheet visible={visible} onClose={onClose}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: space[3],
          marginBottom: space[4],
        }}
      >
        <Text role="title">Filters</Text>
        {/* The count answers "will this leave me anything?" BEFORE the scroll
            down to the CTA — same query, so it's free. */}
        {nothingSelected ? null : <Text role="meta">{countLabel}</Text>}
      </View>

      {/* Selected summary — what's on, and one tap to take any of it off,
          without hunting the value back down in its group. Absent entirely
          when nothing is selected (no empty-state noise). */}
      {selectedCount > 0 ? (
        <View
          style={{
            backgroundColor: colors.creamDeep,
            borderRadius: radii.card,
            padding: space[3],
            gap: space[2],
            marginBottom: space[4],
          }}
        >
          <Text role="meta">{`SELECTED · ${selectedCount}`}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
            {category ? <RemoveChip label={category} onRemove={clearCategory} /> : null}
            {selectedAreas.map((a) => (
              <RemoveChip key={a} label={a} onRemove={removeArea(a)} />
            ))}
          </View>
        </View>
      ) : null}

      <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
        <GroupHeader label="Category" hint="single choice" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginTop: space[2], marginBottom: space[4] }}>
          {categories.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={toggleCategory(c)} />
          ))}
        </View>

        <GroupHeader label="Cuisine" hint="choose any" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginTop: space[2] }}>
          {areas.map((a) => (
            <Chip key={a} label={a} active={selectedAreas.includes(a)} onPress={toggleArea(a)} />
          ))}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4], marginTop: space[5] }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Clear all filters" onPress={clearAll} hitSlop={8}>
          <Text role="computed">Clear all</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button title={ctaTitle} onPress={() => onApply(category, selectedAreas)} variant="primary" />
        </View>
      </View>
    </Sheet>
  );
}
