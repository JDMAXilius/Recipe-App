import React from 'react';
import { Modal, Pressable, View, type ViewStyle } from 'react-native';
import { colors, radii, space } from '../theme/tokens';
import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Bottom sheet on plain RN Modal + View — no gesture/reanimated deps, works
// identically on Expo web and native (contract rule 2).
const backdrop: ViewStyle = {
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: 'rgba(42, 35, 32, 0.4)', // ink @ 40%
};

const panel: ViewStyle = {
  backgroundColor: colors.cream,
  borderTopLeftRadius: radii.sheet,
  borderTopRightRadius: radii.sheet,
  padding: space[5],
  paddingBottom: space[6],
};

const grabber: ViewStyle = {
  alignSelf: 'center',
  width: 36,
  height: 4,
  borderRadius: radii.pill,
  backgroundColor: colors.creamDeep,
  marginBottom: space[3],
};

export function Sheet({ visible, onClose, title, children }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={{ flex: 1 }}
        />
        <View style={panel} accessibilityViewIsModal>
          <View style={grabber} />
          {title != null && (
            <View style={{ marginBottom: space[4] }}>
              <Text role="title">{title}</Text>
            </View>
          )}
          {children}
        </View>
      </View>
    </Modal>
  );
}
