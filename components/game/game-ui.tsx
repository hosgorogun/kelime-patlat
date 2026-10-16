import React, { useRef, useEffect, type ReactNode } from "react";
import {
  Animated,
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
import { triggerHapticSelection } from "@/shared/audio-haptics";

export const ICONS = {
  coin: require("../../assets/ui/icon-coin.png"),
  heart: require("../../assets/ui/icon-heart.png"),
  radar: require("../../assets/ui/icon-radar.png"),
  shield: require("../../assets/ui/icon-shield.png"),
  play: require("../../assets/ui/icon-play.png"),
  trophy: require("../../assets/ui/icon-trophy.png"),
  store: require("../../assets/ui/icon-store.png"),
  missions: require("../../assets/ui/icon-missions.png"),
  profile: require("../../assets/ui/icon-profile.png"),
  gift: require("../../assets/ui/icon-gift.png"),
  wheel: require("../../assets/ui/icon-wheel.png"),
  history: require("../../assets/ui/icon-history.png"),
  duel: require("../../assets/ui/icon-duel.png"),
} as const;

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

const panelColors: Record<OrnatePanelAccent, string> = {
  gold: "#FFFBEB",
  emerald: "#ECFDF5",
  ruby: "#FFF1F2",
  cyan: "#F0F9FF",
  amber: "#FFFBEB",
  sapphire: "#F0F9FF",
  purple: "#FAF5FF",
};

const panelBorders: Record<OrnatePanelAccent, string> = {
  gold: "#FDE68A",
  emerald: "#A7F3D0",
  ruby: "#FECDD3",
  cyan: "#BAE6FD",
  amber: "#FDE68A",
  sapphire: "#BAE6FD",
  purple: "#E9D5FF",
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
    <View
      style={[
        styles.panel,
        { borderColor: panelBorders[accent] },
        style,
      ]}
    >
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

type GameButtonVariant = "gold" | "emerald" | "ruby" | "sapphire" | "dark" | "primary" | "friend";

const buttons: Record<GameButtonVariant, readonly [string, string, string]> = {
  gold: ["#F59E0B", "#B45309", "#FFFFFF"],
  emerald: ["#10B981", "#047857", "#FFFFFF"],
  primary: ["#10B981", "#047857", "#FFFFFF"],
  ruby: ["#F43F5E", "#BE123C", "#FFFFFF"],
  sapphire: ["#0284C7", "#0369A1", "#FFFFFF"],
  friend: ["#0284C7", "#0369A1", "#FFFFFF"],
  dark: ["#F1F5F9", "#94A3B8", "#0F172A"],
};

export function GameButton({
  label,
  icon,
  iconSource,
  iconSize,
  variant = "gold",
  size = "lg",
  onPress,
  disabled,
  style,
  textStyle,
  iconBoxStyle,
}: {
  label: string;
  icon?: string;
  iconSource?: ImageSourcePropType;
  iconSize?: number;
  variant?: GameButtonVariant;
  size?: "lg" | "md" | "sm";
  onPress?: PressableProps["onPress"];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconBoxStyle?: StyleProp<ViewStyle>;
}) {
  const [backgroundColor, borderColor, textColor] = buttons[variant];
  const defaultIconSize = size === "lg" ? 22 : size === "md" ? 18 : 16;
  const actualIconSize = iconSize ?? defaultIconSize;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={(e) => {
        if (!disabled) {
          triggerHapticSelection();
        }
        onPress?.(e);
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: size === "lg" ? 56 : size === "md" ? 44 : 38,
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.45 : 1,
        },
        style,
        pressed && { transform: [{ scale: 0.97 }, { translateY: 2 }], borderBottomWidth: 2 },
      ]}
    >
      <View style={styles.buttonTopGlow} />
      {iconSource ? (
        <View style={[styles.buttonIconBox, iconBoxStyle]}>
          <GameGlyph source={iconSource} size={actualIconSize} />
        </View>
      ) : icon ? (
        <Text style={{ fontSize: size === "lg" ? 20 : 17 }}>{icon}</Text>
      ) : null}
      <Text
        numberOfLines={2}
        style={[
          styles.buttonText,
          {
            color: textColor,
            fontSize: size === "lg" ? 15.5 : size === "sm" ? 12 : 13.5,
            fontWeight: "900",
            letterSpacing: 0.3,
          },
          textStyle,
        ]}
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
  bg,
  borderColor,
  borderBottomColor,
  onPress,
  plus,
  badge,
  iconSize = 25,
}: {
  icon?: string;
  iconSource?: ImageSourcePropType;
  value: string | number;
  label?: string;
  color: string;
  bg?: string;
  borderColor?: string;
  borderBottomColor?: string;
  onPress?: () => void;
  plus?: boolean;
  badge?: boolean;
  iconSize?: number;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${label ?? ""}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        bg ? { backgroundColor: bg } : null,
        borderColor ? { borderColor } : null,
        borderBottomColor ? { borderBottomColor } : null,
        pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
      ]}
    >
      {iconSource ? (
        <View style={[styles.chipIconBox, bg ? { backgroundColor: "rgba(255,255,255,0.85)" } : null]}>
          <GameGlyph source={iconSource} size={iconSize} color={color} />
        </View>
      ) : (
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        {label ? (
          <Text numberOfLines={1} style={[styles.chipLabel, color ? { color } : null]}>
            {label}
          </Text>
        ) : null}
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.chipValue}>{value}</Text>
      </View>
      {plus ? (
        <View style={styles.plusPill}>
          <Text style={styles.plusText}>+</Text>
        </View>
      ) : null}
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

export const ConnectLine = React.memo(function ConnectLine({
  x1,
  y1,
  x2,
  y2,
  color,
  opacity = 0.95,
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
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length < 1) return null;

  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const angle = Math.atan2(dy, dx);
  const LINE_HEIGHT = 12;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: cx - length / 2,
        top: cy - LINE_HEIGHT / 2,
        width: length,
        height: LINE_HEIGHT,
        transform: [{ rotate: `${angle}rad` }],
        zIndex: 20,
        opacity,
      }}
    >
      {/* Outer ambient glow */}
      <View
        style={{
          position: "absolute",
          left: -2,
          top: 0,
          width: length + 4,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          opacity: 0.28,
        }}
      />
      {/* Main vibrant beam */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 2.5,
          width: length,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: color,
        }}
      />
      {/* Inner high-energy bright core */}
      <View
        style={{
          position: "absolute",
          left: 2,
          top: 4.75,
          width: Math.max(0, length - 4),
          height: 2.5,
          borderRadius: 1.25,
          backgroundColor: "rgba(255, 255, 255, 0.72)",
        }}
      />
      {showArrow && length > 14 ? (
        <View
          style={{
            position: "absolute",
            left: length - 12,
            top: 0,
            width: 0,
            height: 0,
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
});

export function BoardCountdownShield({
  countdown,
  theme = "light",
}: {
  countdown: number | null;
  theme?: "light" | "dark";
}) {
  const fadeAnim = useRef(new Animated.Value(countdown !== null ? 1 : 0)).current;

  useEffect(() => {
    if (countdown === 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else if (countdown !== null) {
      fadeAnim.setValue(1);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [countdown, fadeAnim]);

  if (countdown === null) return null;

  const isDark = theme === "dark";

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: 22,
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(240, 245, 237, 0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 80,
          opacity: fadeAnim,
          overflow: "hidden",
        } as any,
      ]}
    />
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
    borderRadius: 18,
    borderWidth: 1.5,
    borderBottomWidth: 4.5,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonTopGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "38%",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  buttonIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: palette.text,
    fontWeight: "900",
    textAlign: "center",
    flexShrink: 1,
  },
  chip: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: palette.panel,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: "#E2E8F0",
    borderBottomColor: "#CBD5E1",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  chipIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: { color: "#54646B", fontSize: 9, fontWeight: "900", letterSpacing: 0.2 },
  chipValue: { color: palette.text, fontSize: 14.5, fontWeight: "900", letterSpacing: -0.2 },
  plusPill: {
    width: 20,
    height: 20,
    borderRadius: 7,
    backgroundColor: "#FCE7A6",
    borderWidth: 1,
    borderColor: "#F0B938",
    alignItems: "center",
    justifyContent: "center",
  },
  plusText: { color: "#8E5E04", fontSize: 13, fontWeight: "900", lineHeight: 15 },
  badge: {
    position: "absolute",
    right: 5,
    top: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
  sectionMeta: { color: "#54646B", fontSize: 10, fontWeight: "700", flexShrink: 1 },
});
