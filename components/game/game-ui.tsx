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
  gold: "#FFFFFF",
  emerald: "#E8F7EE",
  ruby: "#FFF0EB",
  cyan: "#E4F3FA",
  amber: "#FFF5DA",
  sapphire: "#E7F2FC",
  purple: "#F3EDFA",
};

const panelBorders: Record<OrnatePanelAccent, string> = {
  gold: "#DFD7CA",
  emerald: "#B2DEBE",
  ruby: "#F3BFB3",
  cyan: "#B4DBEE",
  amber: "#EDCD8A",
  sapphire: "#BCD8F0",
  purple: "#D3BFE8",
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
      {/* Outer ambient glow */}
      <View
        style={{
          position: "absolute",
          top: -6,
          left: -2,
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
          top: -3.5,
          left: 0,
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
          top: -1.25,
          left: 2,
          width: Math.max(0, length - 4),
          height: 2.5,
          borderRadius: 1.5,
          backgroundColor: "rgba(255, 255, 255, 0.72)",
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
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.94)" : "rgba(248, 250, 252, 0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 80,
          alignItems: "center",
          justifyContent: "center",
          opacity: fadeAnim,
          overflow: "hidden",
        } as any,
      ]}
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 22,
          paddingVertical: 18,
          borderRadius: 22,
          backgroundColor: isDark ? "rgba(30, 41, 59, 0.88)" : "rgba(255, 255, 255, 0.92)",
          borderWidth: 1.5,
          borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(226, 232, 240, 0.95)",
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Text style={{ fontSize: 32, marginBottom: 8 }}>🔒</Text>
        <Text
          style={{
            color: isDark ? "#F8FAFC" : "#1E293B",
            fontSize: 14,
            fontWeight: "900",
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          HARFLER GİZLENDİ
        </Text>
        <Text
          style={{
            color: isDark ? "#94A3B8" : "#64748B",
            fontSize: 11,
            fontWeight: "700",
            marginTop: 4,
            textAlign: "center",
          }}
        >
          {countdown > 0
            ? `${countdown} saniye sonra açılacak`
            : "Hazırlan, başlıyor!"}
        </Text>
      </View>
    </Animated.View>
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: "#D2DAD0",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  chipLabel: { color: "#54646B", fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  chipValue: { color: palette.text, fontSize: 15, fontWeight: "900" },
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
  sectionMeta: { color: "#54646B", fontSize: 10, fontWeight: "700", flexShrink: 1 },
});
