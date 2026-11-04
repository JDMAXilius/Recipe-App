import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Text as RNText, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, space } from '../theme/tokens';
import { useOnline } from '../online';

// One quiet offline notice (gap audit P1-12), mounted once at the root. It sits
// just under the status bar, clear of the tab bar, and never takes a touch
// (pointerEvents none) — cached screens stay fully usable underneath.
export function OfflineBanner() {
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const wasOnline = useRef(true);

  // Announce on the transition only, same imperative path as ToastHost.
  useEffect(() => {
    if (online === wasOnline.current) return;
    wasOnline.current = online;
    AccessibilityInfo.announceForAccessibility(
      online ? 'Back online.' : "You're offline. Showing saved recipes.",
    );
  }, [online]);

  if (online) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: insets.top + space[1], left: space[4], right: space[4], alignItems: 'center' }}
    >
      <View
        accessibilityRole="alert"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[2],
          backgroundColor: colors.ink,
          borderRadius: radii.pill,
          paddingVertical: space[1] + 2,
          paddingHorizontal: space[4],
        }}
      >
        <Ionicons name="cloud-offline-outline" size={14} color={colors.white} />
        <RNText style={{ color: colors.white, fontSize: 13, fontWeight: '500' }}>
          You&apos;re offline. Showing saved recipes.
        </RNText>
      </View>
    </View>
  );
}
