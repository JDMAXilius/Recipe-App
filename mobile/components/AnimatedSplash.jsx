import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTheme } from "../context/ThemeContext";
import { TYPE } from "../constants/tokens";

// Animated splash (SPLASH_BRIEF §7, ticket P10 §2): the lid-lift video plays
// ONCE over the native splash still, then dissolves into the app. Tap skips.
// Reduced-motion (and web, where autoplay is unreliable) shows the still +
// wordmark briefly instead. The "Otto" wordmark (Lora) sits over the
// reserved lower third — composited in-app, never painted into the art.

const VIDEO = require("../assets/splash/otto-splash.mp4");
const STILL = require("../assets/images/splash-icon.png");
const HOLD_MS = 1200; // still-only variants
const MAX_MS = 3400; // hard stop even if playback stalls

export default function AnimatedSplash({ onDone }) {
  const { colors } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(null);
  const fade = useRef(new Animated.Value(1)).current;
  const doneRef = useRef(false);

  const useVideo = reduceMotion === false && Platform.OS !== "web";

  const player = useVideoPlayer(VIDEO, (p) => {
    p.loop = false;
    p.muted = true;
  });

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    Animated.timing(fade, { toValue: 0, duration: 350, useNativeDriver: true }).start(() =>
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
    if (useVideo) {
      player.play();
      const sub = player.addListener("playToEnd", finish);
      const stop = setTimeout(finish, MAX_MS);
      return () => {
        sub?.remove?.();
        clearTimeout(stop);
      };
    }
    const t = setTimeout(finish, HOLD_MS);
    return () => clearTimeout(t);
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fill: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99,
        },
        media: { width: "100%", height: "100%" },
        still: { width: 280, height: 280 },
        wordmark: {
          ...TYPE.display,
          fontSize: 44,
          lineHeight: 52,
          color: colors.ink,
          position: "absolute",
          bottom: "18%",
          alignSelf: "center",
        },
      }),
    [colors]
  );

  return (
    <Animated.View style={[styles.fill, { opacity: fade }]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={finish}
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
      >
        {useVideo ? (
          <VideoView
            player={player}
            style={styles.media}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <View style={[styles.media, { alignItems: "center", justifyContent: "center" }]}>
            <Image source={STILL} style={styles.still} contentFit="contain" />
          </View>
        )}
        <Text style={styles.wordmark}>Otto</Text>
      </Pressable>
    </Animated.View>
  );
}
