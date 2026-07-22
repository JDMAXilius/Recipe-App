import React from 'react';
import { Pressable, ScrollView, Text as RNText, View } from 'react-native';
import { Sheet, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { mmss } from '../session';
import type { CookTimer } from '../cook.types';

export interface AvailableTimer {
  label: string;
  minutes: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  timers: CookTimer[];
  available: AvailableTimer[]; // step durations not yet running
  onStart: (label: string, minutes: number) => void;
  onExtend: (id: string, minutes: number) => void;
  onDismiss: (id: string) => void;
}

const chip = {
  minHeight: 40,
  justifyContent: 'center' as const,
  backgroundColor: colors.creamDeep,
  borderRadius: radii.pill,
  paddingHorizontal: space[3],
};

// Multi-timer hub: every running/finished timer with +1/dismiss, plus every
// step duration you haven't started yet (one tap to launch a named timer).
export function TimerHub({ visible, onClose, timers, available, onStart, onExtend, onDismiss }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Otto's timers">
      <ScrollView style={{ maxHeight: 380 }}>
        {timers.map((t) => (
          <View
            key={t.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space[3],
              paddingVertical: space[2],
              borderBottomWidth: 1,
              borderBottomColor: colors.creamDeep,
            }}
          >
            <View style={{ flex: 1 }}>
              <RNText style={{ fontSize: 15, color: colors.ink }} numberOfLines={1}>
                {t.label}
              </RNText>
              <RNText
                style={{
                  fontSize: 18,
                  fontWeight: '800',
                  color: t.done ? colors.success : colors.terracotta,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {t.done ? 'done' : mmss(t.remaining)}
              </RNText>
            </View>
            <Pressable
              onPress={() => onExtend(t.id, 1)}
              accessibilityRole="button"
              accessibilityLabel={`Add a minute to ${t.label}`}
              hitSlop={8}
              style={chip}
            >
              <RNText style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>+1</RNText>
            </Pressable>
            <Pressable
              onPress={() => onDismiss(t.id)}
              accessibilityRole="button"
              accessibilityLabel={`Dismiss ${t.label}`}
              hitSlop={8}
              style={{ minHeight: 40, minWidth: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <RNText style={{ fontSize: 20, color: colors.inkSoft }}>×</RNText>
            </Pressable>
          </View>
        ))}

        {available.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => onStart(a.label, a.minutes)}
            accessibilityRole="button"
            accessibilityLabel={`Start ${a.label}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space[3],
              minHeight: 44,
              paddingVertical: space[2],
              borderBottomWidth: 1,
              borderBottomColor: colors.creamDeep,
            }}
          >
            <RNText style={{ fontSize: 18, color: colors.terracotta }}>▷</RNText>
            <RNText style={{ fontSize: 15, color: colors.ink, flex: 1 }}>{a.label}</RNText>
          </Pressable>
        ))}

        {timers.length === 0 && available.length === 0 && (
          <View style={{ paddingVertical: space[4] }}>
            <Text role="caption">No timers in this recipe.</Text>
          </View>
        )}
      </ScrollView>
    </Sheet>
  );
}
