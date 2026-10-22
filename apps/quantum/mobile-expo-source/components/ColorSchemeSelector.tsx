import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import { COLOR_PALETTES, ColorScheme } from "@/utils/fractal";

interface ColorSchemeSelectorProps {
  value: ColorScheme;
  onChange: (scheme: ColorScheme) => void;
}

const SCHEME_COLORS: Record<ColorScheme, [string, string]> = {
  quantum: ["#00e5ff", "#3b82f6"],
  fire: ["#ff4500", "#fcd34d"],
  ice: ["#60a5fa", "#e0f2fe"],
  nebula: ["#8b5cf6", "#f0abfc"],
  monochrome: ["#888", "#fff"],
  aurora: ["#34d399", "#60a5fa"],
};

export function ColorSchemeSelector({ value, onChange }: ColorSchemeSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {(Object.entries(COLOR_PALETTES) as [ColorScheme, string][]).map(
        ([scheme, label]) => {
          const [c1, c2] = SCHEME_COLORS[scheme];
          const isSelected = scheme === value;
          return (
            <Pressable
              key={scheme}
              onPress={() => onChange(scheme)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <View style={styles.colorDots}>
                <View style={[styles.dot, { backgroundColor: c1 }]} />
                <View style={[styles.dot, { backgroundColor: c2, marginLeft: -4 }]} />
              </View>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {label}
              </Text>
            </Pressable>
          );
        }
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  chipSelected: {
    borderColor: Colors.cyan,
    backgroundColor: Colors.cyanGlow,
  },
  colorDots: {
    flexDirection: "row",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.void,
  },
  chipLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chipLabelSelected: {
    color: Colors.cyan,
  },
});
