import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ColorSchemeSelector } from "@/components/ColorSchemeSelector";
import { FractalCanvas } from "@/components/FractalCanvas";
import { FractalTypeSelector } from "@/components/FractalTypeSelector";
import Colors from "@/constants/colors";
import { useFractal } from "@/context/FractalContext";
import { ColorScheme, FractalType } from "@/utils/fractal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function ZoomControl({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          scale.value = withSpring(0.88, {}, () => {
            scale.value = withSpring(1);
          });
          onPress();
        }}
        style={styles.zoomBtn}
      >
        <Text style={styles.zoomBtnText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function ExploreContent() {
  const insets = useSafeAreaInsets();
  const {
    currentParams,
    updateParams,
    setFractalType,
    saveFractal,
  } = useFractal();

  const [panelOpen, setPanelOpen] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveName, setSaveName] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleZoomIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateParams({ zoom: currentParams.zoom * 2 });
  };

  const handleZoomOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateParams({ zoom: Math.max(0.1, currentParams.zoom / 2) });
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFractalType(currentParams.type);
  };

  const handleSave = async () => {
    if (!saveName.trim()) return;
    await saveFractal(saveName.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaveModalVisible(false);
    setSaveName("");
    Alert.alert("Saved!", `"${saveName.trim()}" added to your gallery.`);
  };

  const canvasSize = SCREEN_WIDTH;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quantum Fractal</Text>
          <Text style={styles.headerSub}>Explorer</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSaveModalVisible(true);
            }}
            style={styles.iconBtn}
          >
            <Feather name="bookmark" size={20} color={Colors.cyan} />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPanelOpen(!panelOpen);
            }}
            style={[styles.iconBtn, panelOpen && styles.iconBtnActive]}
          >
            <Feather name="sliders" size={20} color={panelOpen ? Colors.cyan : Colors.textSecondary} />
          </Pressable>
        </View>
      </Animated.View>

      {/* Canvas */}
      <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.canvasWrapper}>
        <FractalCanvas
          params={currentParams}
          onParamsChange={updateParams}
          size={canvasSize}
        />
        {/* Zoom controls overlay */}
        <View style={styles.zoomControls}>
          <ZoomControl label="+" onPress={handleZoomIn} />
          <ZoomControl label="−" onPress={handleZoomOut} />
          <Pressable onPress={handleReset} style={styles.resetBtn}>
            <MaterialCommunityIcons name="refresh" size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Coordinates overlay */}
        <View style={styles.coordsOverlay}>
          <Text style={styles.coordText}>
            {currentParams.centerX.toFixed(4)}, {currentParams.centerY.toFixed(4)}
          </Text>
          <Text style={styles.coordText}>
            {currentParams.zoom.toFixed(2)}×
          </Text>
        </View>
      </Animated.View>

      {/* Type selector */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.typeRow}>
        <FractalTypeSelector
          value={currentParams.type}
          onChange={(t: FractalType) => {
            Haptics.selectionAsync();
            setFractalType(t);
          }}
        />
      </Animated.View>

      {/* Collapsible panel */}
      {panelOpen && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.panel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Color Palette</Text>
            <ColorSchemeSelector
              value={currentParams.colorScheme}
              onChange={(s: ColorScheme) => {
                Haptics.selectionAsync();
                updateParams({ colorScheme: s });
              }}
            />

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Iterations</Text>
            <View style={styles.iterRow}>
              {[50, 100, 200, 500].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateParams({ maxIterations: n });
                  }}
                  style={[
                    styles.iterBtn,
                    currentParams.maxIterations === n && styles.iterBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.iterBtnText,
                      currentParams.maxIterations === n && styles.iterBtnTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>

            {currentParams.type === "julia" && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Julia Preset</Text>
                <View style={styles.iterRow}>
                  {[
                    { r: -0.7269, i: 0.1889, label: "Dragon" },
                    { r: -0.4, i: 0.6, label: "Wave" },
                    { r: 0.355, i: 0.355, label: "Spiral" },
                    { r: -0.54, i: 0.54, label: "Star" },
                  ].map((preset) => (
                    <Pressable
                      key={preset.label}
                      onPress={() => {
                        Haptics.selectionAsync();
                        updateParams({ juliaReal: preset.r, juliaImag: preset.i });
                      }}
                      style={styles.iterBtn}
                    >
                      <Text style={styles.iterBtnText}>{preset.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* Save Modal */}
      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSaveModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Save to Gallery</Text>
            <Text style={styles.modalSub}>Give this fractal a name</Text>
            <TextInput
              style={styles.modalInput}
              value={saveName}
              onChangeText={setSaveName}
              placeholder="e.g. Dragon Valley"
              placeholderTextColor={Colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setSaveModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function ExploreScreen() {
  return <ExploreContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cyan,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnActive: {
    backgroundColor: Colors.cyanGlow,
    borderColor: Colors.cyan,
  },
  canvasWrapper: {
    position: "relative",
  },
  zoomControls: {
    position: "absolute",
    right: 12,
    bottom: 12,
    gap: 6,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  coordsOverlay: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 2,
  },
  coordText: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  typeRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  panel: {
    flex: 1,
    backgroundColor: Colors.surface,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  iterRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  iterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.deepSpace,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  iterBtnActive: {
    borderColor: Colors.cyan,
    backgroundColor: Colors.cyanGlow,
  },
  iterBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  iterBtnTextActive: {
    color: Colors.cyan,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 12,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
  },
  modalSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
  },
  modalCancelText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.cyan,
    alignItems: "center",
  },
  modalSaveText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.void,
  },
});
