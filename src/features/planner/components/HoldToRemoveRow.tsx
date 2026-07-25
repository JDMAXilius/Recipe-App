// Hold-then-drag removal for a shopping-list ingredient row (founder, 2026-07:
// "no button. You have to hold it down, then there is a visual effect
// representing the item is held, then if you swipe you remove it"). So: the row
// looks EXACTLY as it does at rest — no ✕, no swipe-reveal drawer — until a
// ~300ms press lifts it, and only a lifted row can be flung off the list.
//
// Gesture.Pan().activateAfterLongPress() is the whole trick: the pan stays
// dormant while the finger is down, so the list's vertical ScrollView keeps
// scrolling normally (a bare Pan would fight it for the touch), and a plain tap
// still falls through to the checkbox Pressable underneath.
//
// Repo law (src/shared/motion.ts): reanimated LAYOUT animations break web, so
// nothing here uses Layout/entering/exiting — only transform + opacity shared
// values, which ride fine on web. Reduced motion drops the flourish (no lift,
// no fade, no fly-out) and removes instantly; the gesture itself still works,
// and VoiceOver never needs it at all (accessibilityActions below).
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { haptics } from '@/shared/haptics';
import { colors, radii, shadow, spring, timing } from '@/shared/theme/tokens';

// Hold long enough to read as deliberate, short enough not to feel stuck. 300ms
// matches the platform long-press feel.
const HOLD_MS = 300;
// Fling distance that commits the removal: 35% of the row's own width, so the
// gesture scales with phone/tablet instead of a magic pixel count.
const COMMIT_RATIO = 0.35;
// Commit THRESHOLD (already-scaled px, not a width) for the frame before
// onLayout has measured the row — the review caught it being multiplied by
// COMMIT_RATIO, which made a pre-layout release commit at 42pt.
const COMMIT_FALLBACK = 120;
const LIFT_SCALE = 1.03;
// A touch that travels farther than this before the hold arms is a scroll or a
// stray swipe, not a press — it must neither arm the pan (failOffsetY) nor
// fall through to the checkbox press (movement guard below).
const MOVE_SLOP = 12;

export interface HoldToRemoveRowProps {
  /** Tap (no hold) — the existing whole-row check-off. */
  onPress: () => void;
  /** Committed removal: past the threshold, or the VoiceOver "remove" action. */
  onRemove: () => void;
  checked: boolean;
  accessibilityLabel: string;
  style?: ViewStyle;
  children: React.ReactNode;
}

function HoldToRemoveRowBase({
  onPress,
  onRemove,
  checked,
  accessibilityLabel,
  style,
  children,
}: HoldToRemoveRowProps) {
  const reduced = useReducedMotion();
  const [lifted, setLifted] = useState(false);

  const x = useSharedValue(0);
  const lift = useSharedValue(0); // 0 = at rest, 1 = held
  const width = useSharedValue(0);
  const removing = useSharedValue(false);

  // A hold that turns into a drag must NOT also fire the row's check-off when
  // the finger comes up. Native cancels the touch responder on activation, web
  // does not — this ref is the platform-proof guard.
  const heldRef = useRef(false);

  // Latest-prop refs. The gesture below is built ONCE (useMemo, stable deps):
  // rebuilding it pushed a new handler config to the native side on every
  // render — including mid-hold, when setLifted(true) re-renders the row, and
  // ~6× per row per keystroke in the screen's "Something else?" field. The
  // gesture must therefore never close over a prop directly.
  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;

  const held = useCallback(() => {
    heldRef.current = true;
    setLifted(true);
    haptics.impact('medium'); // the "it's in your hand now" beat
    // The lift is scale + shadow only — announce it for anyone not seeing it
    // (WCAG 1.4.1: state changes can't live in visuals alone).
    AccessibilityInfo.announceForAccessibility('Held. Swipe sideways to remove.');
  }, []);
  const released = useCallback(() => setLifted(false), []);
  // New touch — clear the last press's guard so a plain tap still checks off.
  const clearHeld = useCallback(() => {
    heldRef.current = false;
  }, []);
  const commitRemove = useCallback(() => {
    onRemoveRef.current();
  }, []);

  // Touch travel before the hold arms, tracked from the first touch. The pan
  // never fires onUpdate until it activates, so this is the only view of the
  // pre-activation movement — it feeds the press guard: a sideways swipe that
  // never held used to fail the gesture and fall through to Pressable.onPress,
  // i.e. a swipe TICKED THE ITEM OFF.
  const touchStart = useSharedValue<{ x: number; y: number } | null>(null);
  const moved = useSharedValue(false);
  // Set when a post-activation vertical drag abandons the removal (see onUpdate).
  const bailed = useSharedValue(false);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(HOLD_MS)
        // NOTE: no failOffsetX/Y here — with activateAfterLongPress set, RNGH
        // already fails the gesture on ANY pre-activation movement past its own
        // ~10pt slop (RNPanHandler.m; web uses 15), and offset thresholds are
        // only consulted while the state is still Possible. Adding them reads
        // like a fix and does nothing. The real hazard is AFTER activation —
        // handled in onUpdate below.
        .onTouchesDown((e) => {
          const t = e.allTouches[0];
          touchStart.value = { x: t.absoluteX, y: t.absoluteY };
          moved.value = false;
        })
        .onTouchesMove((e) => {
          const s = touchStart.value;
          const t = e.allTouches[0];
          if (s && t && Math.hypot(t.absoluteX - s.x, t.absoluteY - s.y) > MOVE_SLOP) {
            moved.value = true;
          }
        })
        .onBegin(() => {
          removing.value = false;
          bailed.value = false;
          runOnJS(clearHeld)();
        })
        .onStart(() => {
          lift.value = reduced ? 0 : withSpring(1, spring.snappy);
          runOnJS(held)();
        })
        .onUpdate((e) => {
          if (bailed.value) return;
          // A thumb resting while reading arms the hold; the follow-up flick is
          // then a VERTICAL drag on an active pan. It can't be handed back to
          // the ScrollView mid-gesture, so the next best thing is to let go
          // immediately and visibly: the row drops back, and the user's second
          // flick scrolls normally instead of dragging a lifted row around.
          // ponytail: real simultaneity needs the ScrollView's gesture ref
          // threaded in (simultaneousWithExternalGesture) — do that if the
          // one-wasted-flick still annoys on device.
          if (Math.abs(e.translationY) > MOVE_SLOP * 2 && Math.abs(e.translationY) > Math.abs(e.translationX)) {
            bailed.value = true;
            x.value = withSpring(0, spring.snappy);
            lift.value = reduced ? 0 : withSpring(0, spring.snappy);
            runOnJS(released)();
            return;
          }
          x.value = e.translationX;
        })
        .onEnd((e, success) => {
          // success === false means CANCELLED, not released: backgrounded app,
          // an incoming call, a web pointercancel. The finger never came up, so
          // nothing may be removed — onFinalize still springs the row back.
          if (!success) return;
          if (bailed.value) return; // the finger went scrolling — not a removal
          // COMMIT_FALLBACK is already a threshold — only the measured width
          // gets scaled by the ratio.
          const limit = width.value ? width.value * COMMIT_RATIO : COMMIT_FALLBACK;
          if (Math.abs(e.translationX) < limit) return; // under the threshold → onFinalize springs it back
          removing.value = true;
          // Commit HERE, on release — the fly-out is purely decorative. Driving
          // the removal from the animation's completion callback lost it
          // whenever the row unmounted mid-flight (reanimated cancels on
          // unmount and calls back with finished === false), and left a
          // 200 ms window where a share still contained the removed row.
          runOnJS(commitRemove)();
          if (reduced) return;
          // Fly it off the way the finger was going, so the row leaves under
          // the drag for whatever frames it has left instead of blinking out.
          const dir = e.translationX > 0 ? 1 : -1;
          x.value = withTiming(dir * (width.value || COMMIT_FALLBACK) * 1.2, {
            duration: timing.fade,
          });
        })
        .onFinalize(() => {
          // Runs after onEnd and after a cancel (e.g. the ScrollView taking the
          // touch), so the spring-back lives here once instead of in both paths.
          if (removing.value) return;
          x.value = withSpring(0, spring.snappy);
          lift.value = reduced ? 0 : withSpring(0, spring.snappy);
          runOnJS(released)();
        }),
    [reduced, clearHeld, held, released, commitRemove, lift, removing, width, x, touchStart, moved, bailed],
  );

  const animStyle = useAnimatedStyle(() => {
    const travel = Math.abs(x.value) / (width.value || COMMIT_FALLBACK);
    // Reduced motion: the row still tracks the finger (that IS the gesture),
    // but no scale-up and no fade — the flourish is what we drop.
    if (reduced) return { transform: [{ translateX: x.value }] };
    return {
      transform: [{ translateX: x.value }, { scale: 1 + lift.value * (LIFT_SCALE - 1) }],
      opacity: 1 - Math.min(travel, 0.7),
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={(e) => {
          width.value = e.nativeEvent.layout.width;
        }}
        // The held row sits proud of the sheet: rounded + raised, so "this one
        // is in your hand" is unmistakable even without the scale (reduced
        // motion keeps the shadow, which costs no movement). The white fill is
        // what a native shadow is cast FROM — a transparent view drops none —
        // and it matches the pad sheet the row sits on.
        style={[
          animStyle,
          lifted && {
            backgroundColor: colors.white,
            borderRadius: radii.button,
            ...shadow.featured,
          },
        ]}
      >
        <Pressable
          style={style}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={accessibilityLabel}
          // Describe the path this user actually HAS. "Hold, then swipe
          // sideways" is the one interaction a screen-reader user cannot
          // perform (the gesture layer owns the touch), so the hint names the
          // rotor action instead — and the tap that is always available.
          accessibilityHint="Double tap to check it off, or use the Remove from list action to take it off"
          // Hold-and-drag is unreachable with VoiceOver and hard with a motor
          // impairment — the rotor action is the equal path to removal.
          accessibilityActions={[{ name: 'remove', label: 'Remove from list' }]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'remove') onRemove();
          }}
          onPress={() => {
            if (heldRef.current) {
              heldRef.current = false;
              return; // that press was a hold/drag, not a check-off
            }
            if (moved.value) return; // a swipe/scroll that never held is NOT a check-off
            onPress();
          }}
        >
          {children}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

// Memoized: typing in the screen's "Something else?" field re-renders the
// screen, and a 40-row list re-rendering every row per keystroke re-ran every
// row's animated style and children for nothing. The screen passes stable
// callbacks (useCallback) and stable item objects, so a keystroke now re-renders
// nothing below it.
export const HoldToRemoveRow = React.memo(HoldToRemoveRowBase);
HoldToRemoveRow.displayName = 'HoldToRemoveRow';
