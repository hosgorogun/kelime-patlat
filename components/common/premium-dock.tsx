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

const tabs: {
  id: DockDestination;
  label: string;
  icon: ImageSourcePropType;
  accent: string;
  bgLight: string;
  borderLight: string;
}[] = [
  { id: "store", label: "Mağaza", icon: ICONS.store, accent: "#E67E22", bgLight: "#FFF4E8", borderLight: "#F8C291" },
  { id: "missions", label: "Görevler", icon: ICONS.missions, accent: "#27AE60", bgLight: "#E8F8F0", borderLight: "#A3E4D7" },
  { id: "home", label: "Oyna", icon: ICONS.play, accent: "#3498DB", bgLight: "#EBF5FB", borderLight: "#AED6F1" },
  { id: "season", label: "Lig", icon: ICONS.trophy, accent: "#D4AC0D", bgLight: "#FEF9E7", borderLight: "#F9E79F" },
  { id: "profile", label: "Profil", icon: ICONS.profile, accent: "#8E44AD", bgLight: "#F4ECF7", borderLight: "#D7BDE2" },
];

function DockTabItem({
  tab,
  selected,
  count,
  onPress,
}: {
  tab: typeof tabs[number];
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
        selected && [styles.active, { backgroundColor: tab.bgLight, borderColor: tab.borderLight }],
        pressed && { opacity: 0.8 },
      ]}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          selected && { backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: 18 },
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
          selected && [styles.labelActive, { color: tab.accent }],
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
      {selected && <View style={[styles.activeDot, { backgroundColor: tab.accent }]} />}
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
    <View style={styles.dockFrame}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  dockFrame: {
    padding: 3,
    backgroundColor: "#F4EDE0",
    borderRadius: 27,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: "#D9C7AC",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  dock: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1.5,
    borderBottomWidth: 2,
    borderColor: "#EAE5D9",
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 66,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    gap: 3,
  },
  active: {
    borderWidth: 1.5,
    borderBottomWidth: 2.5,
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 1,
  },
  iconContainer: {
    width: 42,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 34,
    height: 34,
  },
  homeIconImage: {
    width: 36,
    height: 36,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  iconInactive: {
    opacity: 1,
  },
  label: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  labelActive: {
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
