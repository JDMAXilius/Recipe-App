import { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { createCategoryStyles } from "../assets/styles/home.styles";
import { getFoodIcon } from "../constants/foodIcons";

// TheMealDB names that don't fit a tile label.
const DISPLAY_NAMES = { Miscellaneous: "Misc" };

// Illustrated category tiles (D5): hand-painted Otto-style food art at art
// scale on a shared warm tint — replaces TheMealDB photo thumbnails.
export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  const { colors } = useTheme();
  const categoryStyles = useMemo(() => createCategoryStyles(colors), [colors]);

  const handleSelect = (name) => {
    Haptics.selectionAsync().catch(() => {});
    onSelectCategory(name);
  };

  return (
    <View style={categoryStyles.categoryFilterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={categoryStyles.categoryFilterScrollContent}
      >
        {categories.map((category) => {
          const selected = selectedCategory === category.name;
          return (
            <TouchableOpacity
              key={category.id}
              style={categoryStyles.categoryButton}
              onPress={() => handleSelect(category.name)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${category.name} recipes`}
              accessibilityState={{ selected }}
            >
              <View
                style={[
                  categoryStyles.categoryTile,
                  selected && categoryStyles.selectedCategoryTile,
                ]}
              >
                <Image
                  source={getFoodIcon(category.name)}
                  style={categoryStyles.categoryImage}
                  contentFit="cover"
                  transition={200}
                />
              </View>
              <Text
                style={[
                  categoryStyles.categoryText,
                  selected && categoryStyles.selectedCategoryText,
                ]}
                numberOfLines={1}
              >
                {DISPLAY_NAMES[category.name] || category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
