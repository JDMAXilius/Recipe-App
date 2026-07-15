import { useEffect } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { useSaved } from "../context/SavedContext";
import { SPRING } from "../constants/tokens";

const pawOutline = require("../assets/mascot/paw-outline.png");
const pawFilled = require("../assets/mascot/paw-filled.png");

// THE save mark (docs/DESIGN_SYSTEM.md B5): Otto's paw. Outline = unsaved,
// inked = saved. The paw-pop on save is the app's signature motion moment.
// `recipe` needs { id, title, image, cookTime, servings }.
export default function PawMark({ recipe, size = 22, style }) {
  const { colors } = useTheme();
  const { isSaved, toggleSave } = useSaved();
  const reducedMotion = useReducedMotion();
  const saved = isSaved(recipe.id);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = async () => {
    const nowSaved = await toggleSave(recipe);
    if (nowSaved === null) return;
    if (nowSaved) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (!reducedMotion) {
        scale.value = withSequence(withSpring(1.25, SPRING.pop), withSpring(1, SPRING.pop));
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[styles.touch, { backgroundColor: colors.surface }, style]}
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
    shadowColor: "#2A211B",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
