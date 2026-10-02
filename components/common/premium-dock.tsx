import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { palette } from "@/shared/palette";
import { ICONS } from "@/components/game/game-ui";

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
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => onNavigate(tab.id)}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.active,
              pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
            ]}
          >
            <View style={styles.iconContainer}>
              <Image
                source={tab.icon}
                style={[
                  styles.iconImage,
                  tab.id === "home" && styles.homeIconImage,
                  selected ? styles.iconActive : styles.iconInactive,
                ]}
                resizeMode="contain"
              />
            </View>
            <Text
              style={[
                styles.label,
                selected && styles.labelActive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
            {!!count && count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
              </View>
            )}
          </Pressable>
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
    borderColor: "#D2DAD0",
    padding: 6,
    gap: 4,
    shadowColor: "#293541",
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
    backgroundColor: "#FFD66E",
    borderWidth: 1.5,
    borderColor: "#F0C855",
    shadowColor: "#FFD66E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 30,
    height: 30,
  },
  homeIconImage: {
    width: 33,
    height: 33,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  iconInactive: {
    opacity: 0.8,
  },
  label: {
    color: palette.muted,
    fontSize: 11,
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
