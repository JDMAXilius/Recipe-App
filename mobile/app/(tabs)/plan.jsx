import { View, Text } from "react-native";
import { useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { createFavoritesStyles } from "../../assets/styles/favorites.styles";

// Otto's week — placeholder while the Plan build lands (roadmap Phase 4).
const PlanScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createFavoritesStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Otto's week</Text>
      </View>
    </View>
  );
};
export default PlanScreen;
