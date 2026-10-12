import React, { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { palette } from "@/shared/palette";
import { ICONS } from "@/components/game/game-ui";
import { triggerHapticSelection } from "@/shared/audio-haptics";

export type DockDestination =
  | "store"
  | "missions"
  | "home"
  | "season"
  | "profile";

const tabs: { id: DockDestination; label: string; icon: ImageSourcePropType }[] = [
  { id: "store", label: "Mağaza", icon: ICONS.store },
  { id: "missions", label: "Görevler", icon: ICONS.missions },
  { id: "home", label: "Oyna", icon: ICONS.play },
  { id: "season", label: "Lig", icon: ICONS.trophy },
  { id: "profile", label: "Profil", icon: ICONS.profile },
];

function DockTabItem({
  tab,
  selected,
  count,
  onPress,
}: {
  tab: { id: DockDestination; label: string; icon: ImageSourcePropType };
  selected: boolean;
  count?: number;
  onPress: () => void;
}) {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (selected) {
      bounceAnim.setValue(0.82);
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 260,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [selected, bounceAnim]);

  const handlePress = () => {
    triggerHapticSelection();
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.88,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 300,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.tab,
        selected && styles.active,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          { transform: [{ scale: bounceAnim }] },
        ]}
      >
        <Image
          source={tab.icon}
          style={[
            styles.iconImage,
            tab.id === "home" && styles.homeIconImage,
            selected ? styles.iconActive : styles.iconInactive,
          ]}
          resizeMode="contain"
        />
      </Animated.View>
      <Text
        style={[
          styles.label,
          selected && styles.labelActive,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
      {selected && <View style={styles.activeDot} />}
      {!!count && count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function PremiumDock({
  active,
  onNavigate,
  missionsBadgeCount,
  storeBadgeCount,
}: {
  active: DockDestination;
  onNavigate: (destination: DockDestination) => void;
  missionsBadgeCount?: number;
  storeBadgeCount?: number;
}) {
  return (
    <View style={styles.dock} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = active === tab.id;
        const count =
          tab.id === "missions"
            ? missionsBadgeCount
            : tab.id === "store"
              ? storeBadgeCount
              : 0;
        return (
          <DockTabItem
            key={tab.id}
            tab={tab}
            selected={selected}
            count={count}
            onPress={() => onNavigate(tab.id)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: "#E2E8F0",
    padding: 6,
    gap: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  tab: {
    flex: 1,
    minHeight: 62,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 3,
  },
  active: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1.5,
    borderBottomWidth: 2.5,
    borderColor: "#FDE68A",
    borderBottomColor: "#F59E0B",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D97706",
    marginTop: 1,
  },
  iconContainer: {
    width: 36,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 28,
    height: 28,
  },
  homeIconImage: {
    width: 30,
    height: 30,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  iconInactive: {
    opacity: 0.85,
  },
  label: {
    color: palette.muted,
    fontSize: 10.5,
    fontWeight: "700",
  },
  labelActive: {
    color: palette.text,
    fontWeight: "900",
  },
  badge: {
    position: "absolute",
    right: 5,
    top: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.heart,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
});
