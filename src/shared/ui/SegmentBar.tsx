import React from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { colors, radii, space } from '../theme/tokens';

export interface SegmentBarProps {
  segments: { label: string; value: string }[];
  selected: string; // by VALUE, never by index
  onSelect: (value: string) => void;
}

export function SegmentBar({ segments, selected, onSelect }: SegmentBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.creamDeep,
        borderRadius: radii.pill,
        padding: space[1],
      }}
    >
      {segments.map((seg) => {
        const isSelected = seg.value === selected;
        return (
          <Pressable
            key={seg.value}
            accessibilityRole="button"
            accessibilityLabel={seg.label}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(seg.value)}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.pill,
              backgroundColor: isSelected ? colors.white : 'transparent',
            }}
          >
            <RNText
              style={{
                fontSize: 14,
                fontWeight: isSelected ? '600' : '400',
                color: isSelected ? colors.terracotta : colors.inkSoft,
              }}
            >
              {seg.label}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}
