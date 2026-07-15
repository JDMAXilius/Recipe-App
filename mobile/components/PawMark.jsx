import { TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useSaved } from "../context/SavedContext";
import { useToast } from "../context/ToastContext";
import { SPRING } from "../constants/tokens";
import { ottoBus } from "../lib/ottoBus";

const pawOutline = require("../assets/mascot/paw-outline.png");
const pawFilled = require("../assets/mascot/paw-filled.png");
const ottoExcited = require("../assets/mascot/otto-excited-cut.png");

const FIRST_SAVE_KEY = "otto.firstSaveCelebrated.v1";

// THE save mark (docs/DESIGN_SYSTEM.md B5): Otto's paw. Outline = unsaved,
// inked = saved. Paw-pop = the app's signature motion moment.
// Feedback per P2-8: first save EVER gets the one Excited-Otto toast; routine
// saves stay silent (the pop + haptic is the feedback); unsave gets an Undo
// toast (mis-tap protection, Instacart pattern).
export default function PawMark({ recipe, size = 22, style }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSaved();
  const { show } = useToast();
  const reducedMotion = useReducedMotion();
  const saved = isSaved(recipe.id);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = async () => {
    // Anonymous wanderers hit the cloakroom at their FIRST save (ticket P10 §1
    // — value first, account only when something's worth keeping).
    if (user?.is_anonymous) {
      show({ message: "Want Otto to remember this kitchen? Pull up a stool." });
      router.push("/(auth)/sign-up");
      return;
    }
    const nowSaved = await toggleSave(recipe);
    if (nowSaved === null) {
      // Save failed (offline/backend down) — state already rolled back.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      show({ message: "We dropped the pan — couldn't save. Try again." });
      return;
    }
    if (nowSaved) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      ottoBus.emit("save"); // any visible Otto with reactTo="save" celebrates
      if (!reducedMotion) {
        scale.value = withSequence(withSpring(1.25, SPRING.pop), withSpring(1, SPRING.pop));
      }
      try {
        const celebrated = await AsyncStorage.getItem(FIRST_SAVE_KEY);
        if (!celebrated) {
          await AsyncStorage.setItem(FIRST_SAVE_KEY, "1");
          show({
            message: "First one saved — Otto's keeping it safe.",
            ottoImage: ottoExcited,
            duration: 3500,
          });
        }
      } catch {
        // celebration is optional; never block a save on storage
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      show({
        message: "Removed from Saved",
        actionLabel: "Undo",
        onAction: () => {
          toggleSave(recipe);
          Haptics.selectionAsync().catch(() => {});
        },
      });
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[styles.touch, { backgroundColor: colors.surface, shadowColor: colors.shadow }, style]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={saved ? "Remove from saved" : "Save recipe"}
      accessibilityState={{ selected: saved }}
    >
      <Animated.View style={animatedStyle}>
        <Image
          source={saved ? pawFilled : pawOutline}
          style={{ width: size, height: size }}
          contentFit="contain"
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
