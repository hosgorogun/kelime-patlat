import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ICONS } from "@/components/game-ui";
import { palette } from "@/shared/palette";

export type DockDestination = "store" | "missions" | "home" | "season" | "profile";

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
    <View style={styles.dockWrap}>
      <LinearGradient colors={["#0F382B", "#0A281E", "#051610"]} style={styles.dock}>
        <DockTab
          emoji="🛒"
          label="MAĞAZA"
          active={active === "store"}
          badgeCount={storeBadgeCount}
          onPress={() => onNavigate("store")}
        />
        <DockTab
          emoji="📜"
          label="GÖREVLER"
          active={active === "missions"}
          badgeCount={missionsBadgeCount}
          onPress={() => onNavigate("missions")}
        />

        <Pressable onPress={() => onNavigate("home")} style={({ pressed }) => [styles.centerTab, pressed && styles.pressed]}>
          <View style={[styles.centerGem, active === "home" && styles.centerGemActive]}>
            <LinearGradient
              colors={active === "home" ? ["#FFF8D6", "#F5BE2C", "#C48616"] : ["#1B543F", "#0E3628", "#071F17"]}
              style={styles.centerGemFill}
            >
              <Image source={ICONS.play} style={styles.centerIcon} resizeMode="contain" />
            </LinearGradient>
          </View>
          <Text style={[styles.centerLabel, active === "home" && styles.centerLabelActive]}>OYNA</Text>
        </Pressable>

        <DockTab
          emoji="🏆"
          label="LİG"
          active={active === "season"}
          onPress={() => onNavigate("season")}
        />
        <DockTab
          emoji="👤"
          label="PROFİL"
          active={active === "profile"}
          onPress={() => onNavigate("profile")}
        />
      </LinearGradient>
    </View>
  );
}

function DockTab({
  emoji,
  label,
  active,
  onPress,
  badgeCount,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onPress: () => void;
  badgeCount?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <View style={[styles.iconBubble, active && styles.iconBubbleActive]}>
          <Text style={[styles.icon, active && styles.iconActive]}>{emoji}</Text>
        </View>
        {badgeCount !== undefined && badgeCount > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{badgeCount > 9 ? "9+" : badgeCount}</Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={[styles.label, active && styles.labelActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dockWrap: {
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(62, 232, 181, 0.55)",
    backgroundColor: "#051610",
    shadowColor: "#10B981",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 16,
    overflow: "visible",
  },
  dock: {
    height: 74,
    borderRadius: 25,
    overflow: "visible",
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 2,
  },
  tabActive: {
    backgroundColor: "rgba(62, 232, 181, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(62, 232, 181, 0.45)",
    borderRadius: 14,
  },
  iconBox: {
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 36, 28, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  iconBubbleActive: {
    backgroundColor: "rgba(62, 232, 181, 0.28)",
    borderWidth: 1.5,
    borderColor: "#3EE8B5",
    shadowColor: "#3EE8B5",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  tabBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.danger,
    borderWidth: 1.5,
    borderColor: palette.cream,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    shadowColor: palette.danger,
    shadowOpacity: 0.85,
    shadowRadius: 6,
    elevation: 6,
  },
  tabBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 11,
    textAlign: "center",
  },
  icon: {
    fontSize: 16,
    lineHeight: 20,
    opacity: 0.95,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  label: {
    color: "#BCE3D4",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.3,
    marginTop: 3,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  labelActive: {
    color: "#3EE8B5",
    textShadowColor: "rgba(62, 232, 181, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  centerTab: {
    flex: 1.2,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },
  centerGem: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: "#3EE8B5",
    overflow: "hidden",
    shadowColor: "#3EE8B5",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  centerGemActive: {
    borderColor: "#FFF4B8",
    shadowColor: "#F5BE2C",
    shadowOpacity: 0.95,
    shadowRadius: 16,
  },
  centerGemFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerIcon: {
    width: 42,
    height: 42,
  },
  centerLabel: {
    color: "#7FF5D0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 2,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  centerLabelActive: {
    color: "#FFE08A",
    textShadowColor: "rgba(245, 190, 44, 0.8)",
    textShadowRadius: 6,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
