import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FractalCanvas } from "@/components/FractalCanvas";
import Colors from "@/constants/colors";
import { useFractal } from "@/context/FractalContext";
import { SavedFractal } from "@/utils/fractal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_SIZE = (SCREEN_WIDTH - 48) / 2;

function FractalCard({
  fractal,
  onDelete,
  index,
}: {
  fractal: SavedFractal;
  onDelete: () => void;
  index: number;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <Animated.View
      entering={ZoomIn.delay(index * 60).duration(400)}
      style={styles.card}
    >
      <Pressable
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowDelete(true);
        }}
        onPress={() => showDelete && setShowDelete(false)}
      >
        <View style={styles.cardCanvas}>
          <FractalCanvas params={fractal.params} size={CARD_SIZE} readonly />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {fractal.name}
          </Text>
          <Text style={styles.cardType}>
            {fractal.params.type.charAt(0).toUpperCase() + fractal.params.type.slice(1)}
          </Text>
        </View>
        {showDelete && (
          <Animated.View entering={FadeIn.duration(150)} style={styles.deleteOverlay}>
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                setShowDelete(false);
                onDelete();
              }}
              style={styles.deleteBtn}
            >
              <Feather name="trash-2" size={18} color="#fff" />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowDelete(false)}
              style={styles.keepBtn}
            >
              <Text style={styles.keepBtnText}>Keep</Text>
            </Pressable>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function GalleryContent() {
  const insets = useSafeAreaInsets();
  const { savedFractals, deleteFractal } = useFractal();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleDelete = (fractal: SavedFractal) => {
    Alert.alert(
      "Delete Fractal",
      `Remove "${fractal.name}" from your gallery?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteFractal(fractal.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
        <Text style={styles.headerSub}>
          {savedFractals.length} saved{" "}
          {savedFractals.length === 1 ? "fractal" : "fractals"}
        </Text>
      </Animated.View>

      {savedFractals.length === 0 ? (
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.emptyState}
        >
          <View style={styles.emptyIcon}>
            <Feather name="aperture" size={40} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No fractals saved yet</Text>
          <Text style={styles.emptyText}>
            Explore fractals and tap the bookmark icon to save them here
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={savedFractals}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: bottomPad + 80 },
          ]}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FractalCard
              fractal={item}
              onDelete={() => handleDelete(item)}
              index={index}
            />
          )}
        />
      )}
    </View>
  );
}

export default function GalleryScreen() {
  return <GalleryContent />;
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
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  grid: {
    padding: 12,
    gap: 12,
  },
  row: {
    gap: 12,
  },
  card: {
    width: CARD_SIZE,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardCanvas: {
    width: CARD_SIZE,
    height: CARD_SIZE,
  },
  cardInfo: {
    padding: 10,
  },
  cardName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
  },
  cardType: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deleteOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 12,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ef4444",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
  },
  deleteBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  keepBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    width: "100%",
    alignItems: "center",
  },
  keepBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
