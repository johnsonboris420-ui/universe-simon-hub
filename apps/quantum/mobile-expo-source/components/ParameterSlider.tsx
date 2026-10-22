import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import Colors from "@/constants/colors";

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
}

export function ParameterSlider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  formatValue,
}: ParameterSliderProps) {
  const display = formatValue ? formatValue(value) : value.toFixed(2);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{display}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={Colors.cyan}
        maximumTrackTintColor={Colors.surfaceBorder}
        thumbTintColor={Colors.cyan}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  value: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.cyan,
    fontVariant: ["tabular-nums"],
  },
  slider: {
    width: "100%",
    height: 32,
  },
});
