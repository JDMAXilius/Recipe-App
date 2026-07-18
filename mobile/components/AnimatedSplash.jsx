import { useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  Pressable,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../context/ThemeContext";
import { TYPE } from "../constants/tokens";

// Splash: the animated Otto (lid-lift) as a TRANSPARENT clip on the app's own
// cream — NO parchment box. The source mp4 baked a cream background into every
// frame (mp4 has no alpha), so it read as a rectangle; we re-cut it per-frame
// with ML matting into an alpha animated WebP (expo-image plays it, iOS +
// Android). A gentle fade + rise on entrance, plays through once, then
// dissolves into the app. Tap skips. "Otto" wordmark (Lora) sits under it.

const OTTO = require("../assets/splash/otto-splash.webp"); // matted alpha animation
const OTTO_AR = 720 / 1075; // native aspect of the matted frames
const HOLD_MS = 3000; // ~one full pass of the 3.0s clip before the dissolve

export default function AnimatedSplash({ onDone }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(null);
  const fade = useRef(new Animated.Value(0)).current; // entrance fade-in
  const rise = useRef(new Animated.Value(1)).current; // entrance scale
  const out = useRef(new Animated.Value(1)).current; // exit fade-out
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    Animated.timing(out, { toValue: 0, duration: 350, useNativeDriver: true }).start(() =>
      onDone?.()
    );
  };

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;
    if (reduceMotion) {
      fade.setValue(1);
      rise.setValue(1);
    } else {
      rise.setValue(0.94);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(rise, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      ]).start();
    }
    const t = setTimeout(finish, HOLD_MS);
    return () => clearTimeout(t);
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const ottoWidth = Math.min(width * 0.74, 320);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        fill: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.bg, // the app's own cream — no box behind Otto
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99,
        },
        otto: { width: ottoWidth, height: ottoWidth / OTTO_AR },
        wordmark: {
          ...TYPE.display,
          fontSize: 44,
          lineHeight: 52,
          color: colors.ink,
          marginTop: 8,
        },
      }),
    [colors, ottoWidth]
  );

  return (
    <Animated.View style={[styles.fill, { opacity: out }]}>
      <Pressable
        style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}
        onPress={finish}
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
      >
        <Animated.View style={{ opacity: fade, transform: [{ scale: rise }], alignItems: "center" }}>
          <Image source={OTTO} style={styles.otto} contentFit="contain" />
          <Text style={styles.wordmark}>Otto</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
