import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import Colors from "@/constants/colors";
import { FractalType } from "@/utils/fractal";

interface FractalTypeSelectorProps {
  value: FractalType;
  onChange: (type: FractalType) => void;
}

const FRACTAL_TYPES: { type: FractalType; label: string; symbol: string }[] = [
  { type: "mandelbrot", label: "Mandelbrot", symbol: "M" },
  { type: "julia", label: "Julia", symbol: "J" },
  { type: "burning-ship", label: "Burning Ship", symbol: "B" },
  { type: "newton", label: "Newton", symbol: "N" },
];

export function FractalTypeSelector({ value, onChange }: FractalTypeSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FRACTAL_TYPES.map(({ type, label, symbol }) => {
        const isSelected = type === value;
        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.symbol, isSelected && styles.symbolSelected]}>
              {symbol}
            </Text>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  chipSelected: {
    borderColor: Colors.cyan,
    backgroundColor: Colors.cyanGlow,
  },
  chipPressed: {
    opacity: 0.7,
  },
  symbol: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.textMuted,
    width: 16,
    textAlign: "center",
  },
  symbolSelected: {
    color: Colors.cyan,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  labelSelected: {
    color: Colors.textPrimary,
  },
});
