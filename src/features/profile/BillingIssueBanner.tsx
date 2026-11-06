// R2.7 (flowV2): Apple couldn't renew Otto Club and is retrying (Billing
// Grace Period, switched on in App Store Connect). Access continues, so this
// is a quiet line on Home, not a wall: Update payment opens Apple's own sheet.
import React from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared/ui';
import { colors, radii, space, type } from '@/shared/theme/tokens';
import { openManageSubscriptions, useMembership } from './club.purchases';

export function BillingIssueBanner() {
  const { billingIssue } = useMembership();
  if (!billingIssue) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Apple couldn't take your last Otto Club payment. Update payment."
      onPress={openManageSubscriptions}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3], borderRadius: radii.card, backgroundColor: colors.creamDeep }}
    >
      <Ionicons name="card-outline" size={22} color={colors.ink} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text role="body">Apple couldn&apos;t take your last payment</Text>
        <Text role="caption">Otto Club keeps going while Apple tries again.</Text>
      </View>
      <RNText style={{ ...type.body, fontWeight: '600', color: colors.terracotta }}>Update</RNText>
    </Pressable>
  );
}
