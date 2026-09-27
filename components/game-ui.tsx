import type { ReactNode } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { palette } from "@/shared/palette";

export const ICONS = {
  coin: require("../assets/ui/icon-coin.png"),
  heart: require("../assets/ui/icon-heart.png"),
  radar: require("../assets/ui/icon-radar.png"),
  shield: require("../assets/ui/icon-shield.png"),
  play: require("../assets/ui/icon-play.png"),
  trophy: require("../assets/ui/icon-trophy.png"),
  store: require("../assets/ui/icon-store.png"),
  missions: require("../assets/ui/icon-missions.png"),
  profile: require("../assets/ui/icon-profile.png"),
} as const;
const glyphs = new Map<ImageSourcePropType, string>([
  [ICONS.coin, "●"],
  [ICONS.heart, "♥"],
  [ICONS.radar, "⌕"],
  [ICONS.shield, "◆"],
  [ICONS.play, "▶"],
  [ICONS.trophy, "★"],
  [ICONS.store, "▣"],
  [ICONS.missions, "✓"],
  [ICONS.profile, "☺"],
]);
export function GameGlyph({
  source,
  size = 24,
  color: _color,
}: {
  source: ImageSourcePropType;
  size?: number;
  color?: string;
}) {
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
export function GameAtmosphere({ dim: _dim }: { dim?: number }) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]}
    />
  );
}
export type OrnatePanelAccent =
  | "gold"
  | "emerald"
  | "ruby"
  | "cyan"
  | "amber"
  | "sapphire"
  | "purple";
const panelColors = {
  gold: "#FFFFFF",
  emerald: "#EDF8F0",
  ruby: "#FFF0EB",
  cyan: "#EDF7FC",
  amber: "#FFF6DE",
  sapphire: "#EDF4FC",
  purple: "#F5F0FC",
};
export function OrnatePanel({
  children,
  style,
  contentStyle,
  accent = "gold",
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accent?: OrnatePanelAccent;
  showJewels?: boolean;
}) {
  return (
    <View style={[styles.panel, style]}>
      <View
        style={[
          styles.panelContent,
          { backgroundColor: panelColors[accent] },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
type GameButtonVariant = "gold" | "emerald" | "ruby" | "sapphire" | "dark";
const buttons = {
  gold: ["#FFD66E", "#D3A63D"],
  emerald: ["#9DE5BB", "#64AD84"],
  ruby: ["#FFAA99", "#CE796B"],
  sapphire: ["#B6DCFF", "#7BA9D0"],
  dark: ["#E9EDE7", "#BFC8BD"],
} as const;
export function GameButton({
  label,
  icon,
  iconSource,
  variant = "gold",
  size = "lg",
  onPress,
  disabled,
  style,
}: {
  label: string;
  icon?: string;
  iconSource?: ImageSourcePropType;
  variant?: GameButtonVariant;
  size?: "lg" | "md" | "sm";
  onPress?: PressableProps["onPress"];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [backgroundColor, borderColor] = buttons[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: size === "lg" ? 56 : 44,
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.45 : 1,
        },
        style,
        pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
      ]}
    >
      {iconSource ? (
        <GameGlyph source={iconSource} size={18} />
      ) : icon ? (
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      ) : null}
      <Text
        numberOfLines={2}
        style={[styles.buttonText, { fontSize: size === "sm" ? 12 : 14 }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function GameIcon({
  source,
  emoji,
  size = 44,
}: {
  source?: ImageSourcePropType;
  emoji?: string;
  size?: number;
  glow?: string;
}) {
  if (source) {
    return (
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: "#FFF0C7",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.46 }}>{emoji}</Text>
    </View>
  );
}
export function GemChip({
  icon,
  iconSource,
  value,
  label,
  color,
  onPress,
  plus,
  badge,
}: {
  icon?: string;
  iconSource?: ImageSourcePropType;
  value: string | number;
  label?: string;
  color: string;
  onPress?: () => void;
  plus?: boolean;
  badge?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${label ?? ""}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
    >
      {iconSource ? (
        <GameGlyph source={iconSource} size={19} color={color} />
      ) : (
        <Text>{icon}</Text>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        {label ? (
          <Text numberOfLines={1} style={styles.chipLabel}>
            {label}
          </Text>
        ) : null}
        <Text style={styles.chipValue}>{value}</Text>
      </View>
      {plus ? <Text style={styles.plus}>+</Text> : null}
      {badge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}
export function JewelTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}
export function SectionLabel({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
    </View>
  );
}
export function ConnectLine({
  x1,
  y1,
  x2,
  y2,
  color,
  opacity = 0.85,
  showArrow = true,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  opacity?: number;
  showArrow?: boolean;
}) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x1,
        top: y1,
        width: length,
        height: 0,
        transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }],
        transformOrigin: "0% 50%",
        zIndex: 20,
        opacity,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: -3,
          width: length,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
        }}
      />
      {showArrow && length > 14 ? (
        <View
          style={{
            position: "absolute",
            left: length - 12,
            top: -6,
            borderTopWidth: 6,
            borderBottomWidth: 6,
            borderLeftWidth: 10,
            borderTopColor: "transparent",
            borderBottomColor: "transparent",
            borderLeftColor: color,
          }}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: palette.line,
    overflow: "hidden",
  },
  panelContent: { borderRadius: 22, padding: 20, overflow: "hidden" },
  button: {
    borderRadius: 17,
    borderWidth: 1,
    borderBottomWidth: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: palette.text,
    fontWeight: "800",
    textAlign: "center",
    flexShrink: 1,
  },
  chip: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  chipLabel: { color: palette.muted, fontSize: 9, fontWeight: "700" },
  chipValue: { color: palette.text, fontSize: 15, fontWeight: "800" },
  plus: { color: palette.text, fontSize: 20, fontWeight: "700" },
  badge: {
    position: "absolute",
    right: 5,
    top: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.heart,
  },
  title: {
    color: palette.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -1.1,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { color: palette.text, fontSize: 13, fontWeight: "800" },
  sectionMeta: { color: palette.muted, fontSize: 10, flexShrink: 1 },
});
