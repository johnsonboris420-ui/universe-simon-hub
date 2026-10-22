import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

interface SettingRowProps {
  icon: string;
  iconFamily?: "feather" | "mdi";
  label: string;
  sublabel?: string;
  rightContent?: React.ReactNode;
  onPress?: () => void;
}

function SettingRow({
  icon,
  iconFamily = "feather",
  label,
  sublabel,
  rightContent,
  onPress,
}: SettingRowProps) {
  const IconComp = iconFamily === "mdi" ? MaterialCommunityIcons : Feather;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.settingIcon}>
        <IconComp name={icon as any} size={18} color={Colors.cyan} />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sublabel ? <Text style={styles.settingSubLabel}>{sublabel}</Text> : null}
      </View>
      {rightContent ?? (
        onPress ? <Feather name="chevron-right" size={16} color={Colors.textMuted} /> : null
      )}
    </Pressable>
  );
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.sectionCard, style]}>
      {children}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [highQuality, setHighQuality] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [smoothRendering, setSmoothRendering] = useState(true);

  const FRACTAL_FACTS = [
    "The Mandelbrot set has infinite complexity at any zoom level",
    "Julia sets are generated from every point of the Mandelbrot set",
    "Fractals were named by Benoît Mandelbrot in 1975",
    "The burning ship fractal was discovered by Michael Michelitsch in 1992",
    "Newton fractals arise from applying Newton's root-finding method",
  ];

  const fact = FRACTAL_FACTS[Math.floor(Math.random() * FRACTAL_FACTS.length)];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Did you know */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <LinearGradient
            colors={["rgba(0,229,255,0.1)", "rgba(59,130,246,0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.factCard}
          >
            <View style={styles.factHeader}>
              <MaterialCommunityIcons name="atom" size={16} color={Colors.cyan} />
              <Text style={styles.factLabel}>Quantum Fact</Text>
            </View>
            <Text style={styles.factText}>{fact}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Rendering */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text style={styles.sectionTitle}>Rendering</Text>
          <SectionCard>
            <SettingRow
              icon="layers"
              label="High Quality Mode"
              sublabel="More detail, slower rendering"
              rightContent={
                <Switch
                  value={highQuality}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setHighQuality(v);
                  }}
                  trackColor={{ false: Colors.surfaceBorder, true: Colors.cyanDim }}
                  thumbColor={Colors.textPrimary}
                />
              }
            />
            <Divider />
            <SettingRow
              icon="zap"
              label="Smooth Rendering"
              sublabel="Progressive tile rendering"
              rightContent={
                <Switch
                  value={smoothRendering}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setSmoothRendering(v);
                  }}
                  trackColor={{ false: Colors.surfaceBorder, true: Colors.cyanDim }}
                  thumbColor={Colors.textPrimary}
                />
              }
            />
          </SectionCard>
        </Animated.View>

        {/* Behavior */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>Behavior</Text>
          <SectionCard>
            <SettingRow
              icon="bookmark"
              label="Auto-save Favorites"
              sublabel="Save when you pinch to zoom"
              rightContent={
                <Switch
                  value={autoSave}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setAutoSave(v);
                  }}
                  trackColor={{ false: Colors.surfaceBorder, true: Colors.cyanDim }}
                  thumbColor={Colors.textPrimary}
                />
              }
            />
          </SectionCard>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text style={styles.sectionTitle}>About</Text>
          <SectionCard>
            <SettingRow
              icon="infinity"
              iconFamily="mdi"
              label="Quantum Fractal Explorer"
              sublabel="Version 1.0.0"
            />
            <Divider />
            <SettingRow
              icon="code"
              label="Fractal Types"
              sublabel="Mandelbrot, Julia, Burning Ship, Newton"
            />
            <Divider />
            <SettingRow
              icon="cpu"
              label="Rendering Engine"
              sublabel="JavaScript — pure on-device computation"
            />
          </SectionCard>
        </Animated.View>

        {/* Fractals legend */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.sectionTitle}>Fractal Guide</Text>
          <SectionCard>
            {[
              {
                letter: "M",
                name: "Mandelbrot",
                desc: "The classic set. Infinite self-similar boundary.",
              },
              {
                letter: "J",
                name: "Julia",
                desc: "Parameter-driven. Each point spawns a unique shape.",
              },
              {
                letter: "B",
                name: "Burning Ship",
                desc: "Folded iteration creates a ship silhouette.",
              },
              {
                letter: "N",
                name: "Newton",
                desc: "Root-finding convergence creates color basins.",
              },
            ].map(({ letter, name, desc }, i) => (
              <React.Fragment key={name}>
                {i > 0 && <Divider />}
                <View style={styles.guideRow}>
                  <View style={styles.guideBadge}>
                    <Text style={styles.guideLetter}>{letter}</Text>
                  </View>
                  <View style={styles.guideText}>
                    <Text style={styles.guideName}>{name}</Text>
                    <Text style={styles.guideDesc}>{desc}</Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </SectionCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  factCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cyanGlow,
    gap: 8,
  },
  factHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  factLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.cyan,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  factText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.cyanGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  settingSubLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginLeft: 60,
  },
  guideRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  guideBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.cyanGlow,
    borderWidth: 1,
    borderColor: Colors.cyan,
    alignItems: "center",
    justifyContent: "center",
  },
  guideLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.cyan,
  },
  guideText: {
    flex: 1,
    gap: 2,
  },
  guideName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  guideDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
