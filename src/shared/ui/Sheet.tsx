import React, { useEffect } from 'react';
import { Modal, Pressable, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii, space, spring, timing } from '../theme/tokens';
import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  // false = no drag-to-dismiss and no grabber (a grabber promises a drag).
  // Backdrop tap, Android back and the VoiceOver escape still call onClose.
  draggable?: boolean;
  children: React.ReactNode;
}

// Bottom sheet on RN Modal (works on Expo web and native, contract rule 2).
// A grabber means draggable (HIG · Sheets): the grabber + title strip drags the
// panel down, and a long or fast enough pull dismisses. Only that strip starts
// the drag, so inner ScrollViews never fight it.
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;
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
  // A sheet is anchored to the bottom of a flex-end backdrop, and RN's default
  // flexShrink is 0 — so a panel taller than the window doesn't scroll or
  // shrink, it runs off the TOP, taking the grabber and title with it and
  // leaving no way to scroll them back. Cap it so tall content is contained;
  // content that can grow (a chip list, a long form) owns its own scroller.
  maxHeight: '85%',
};

const grabber: ViewStyle = {
  width: 36,
  height: 4,
  borderRadius: radii.pill,
  backgroundColor: colors.creamDeep,
};
// The bar stays 4pt; the touch target around it is the 44pt minimum.
const grabberHit: ViewStyle = {
  alignSelf: 'center',
  minWidth: 44,
  minHeight: 24,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: -space[2],
  marginBottom: space[1],
};

export function Sheet({ visible, onClose, title, draggable = true, children }: SheetProps) {
  // Reduce Motion: cross-fade in place of the slide (the system sheet does the same).
  const reduced = useReducedMotion();
  const dragY = useSharedValue(0);

  // A drag-dismissed panel is left where the finger let go; start the next
  // presentation from rest.
  useEffect(() => {
    if (visible) dragY.value = 0;
  }, [visible, dragY]);

  const pan = Gesture.Pan()
    .enabled(draggable)
    .activeOffsetY(8)
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        runOnJS(onClose)(); // the Modal's own exit carries it the rest of the way
      } else {
        dragY.value = reduced
          ? withTiming(0, { duration: timing.exit })
          : withSpring(0, spring.sheet);
      }
    });
  const dragStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dragY.value }] }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduced ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      {/* Android Modals render outside the root GestureHandlerRootView. */}
      <GestureHandlerRootView style={backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={{ flex: 1 }}
        />
        <Animated.View
          style={[panel, dragStyle]}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
        >
          <GestureDetector gesture={pan}>
            <View>
              {draggable && (
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss"
                  hitSlop={{ left: 12, right: 12, top: 10, bottom: 10 }}
                  style={grabberHit}
                >
                  <View style={grabber} />
                </Pressable>
              )}
              {title != null && (
                <View style={{ marginBottom: space[4] }}>
                  <Text role="title">{title}</Text>
                </View>
              )}
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
