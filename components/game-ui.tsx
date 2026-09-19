import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
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
import { LinearGradient } from "expo-linear-gradient";

import { EMERALD_GRADIENT, FRAME_GRADIENT, GOLD_BUTTON_GRADIENT, PANEL_SHEEN, palette } from "@/shared/palette";

const BG = require("../assets/ui/game-bg-forest.png");
export const ICONS = {
  coin: require("../assets/ui/icon-coin.png"),
  gem: require("../assets/ui/icon-gem.png"),
  heart: require("../assets/ui/icon-heart.png"),
  radar: require("../assets/ui/icon-radar.png"),
  shield: require("../assets/ui/icon-shield.png"),
  play: require("../assets/ui/icon-play.png"),
  trophy: require("../assets/ui/icon-trophy.png"),
} as const;

export function GameAtmosphere({ dim = 0.55 }: { dim?: number }) {
  const drift = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const driftLoop = Animated.loop(
      Animated.timing(drift, { toValue: 1, duration: 18000, easing: Easing.linear, useNativeDriver: true })
    );
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 0.9, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0.2, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    driftLoop.start();
    sparkleLoop.start();
    return () => {
      driftLoop.stop();
      sparkleLoop.stop();
    };
  }, [drift, sparkle]);

  const motes = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: `${(i * 19 + 7) % 94}%`,
        top: `${(i * 13 + 9) % 88}%`,
        size: 2 + (i % 4),
        gold: i % 3 !== 0,
      })),
    []
  );

  const floatY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFill} resizeMode="cover" imageStyle={{ opacity: 0.72 }} />
      <LinearGradient
        colors={[`rgba(4,17,12,${dim})`, "rgba(6,20,15,0.35)", `rgba(4,17,12,${Math.min(0.88, dim + 0.22)})`]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.vignette} />
      <Animated.View style={[styles.glowOrb, styles.glowLeft, { opacity: sparkle }]} />
      <Animated.View style={[styles.glowOrb, styles.glowRight, { opacity: sparkle }]} />
      {motes.map((mote, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: mote.left as any,
            top: mote.top as any,
            width: mote.size,
            height: mote.size,
            borderRadius: mote.size,
            backgroundColor: mote.gold ? palette.goldHi : palette.emerald,
            opacity: sparkle,
            transform: [{ translateY: floatY }],
            shadowColor: mote.gold ? palette.gold : palette.emerald,
            shadowOpacity: 0.9,
            shadowRadius: 6,
          }}
        />
      ))}
    </View>
  );
}

function CornerJewel({ style, colors }: { style: ViewStyle; colors?: readonly [string, string] }) {
  return (
    <View style={[styles.cornerJewel, style]}>
      <LinearGradient colors={colors || [palette.goldHi, palette.goldDeep]} style={styles.cornerJewelInner} />
    </View>
  );
}

export type OrnatePanelAccent = "gold" | "emerald" | "ruby" | "cyan" | "amber" | "sapphire" | "purple";

export function OrnatePanel({
  children,
  style,
  contentStyle,
  accent = "gold",
  showJewels = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accent?: OrnatePanelAccent;
  showJewels?: boolean;
}) {
  const frame =
    accent === "ruby"
      ? (["#FDA4AF", "#FB7185", "#881337", "#E11D48"] as const)
      : accent === "cyan"
      ? (["#A5F3FC", "#38BDF8", "#0369A1", "#0284C7"] as const)
      : accent === "amber"
      ? (["#FFE08A", "#FFC24A", "#B45309", "#78350F"] as const)
      : accent === "sapphire"
      ? (["#BAE6FD", "#38BDF8", "#0284C7", "#0C4A6E"] as const)
      : accent === "purple"
      ? (["#E9D5FF", "#C084FC", "#7E22CE", "#581C87"] as const)
      : accent === "emerald"
      ? ([palette.mint, palette.emeraldDeep, palette.bronzeDark, palette.teal] as const)
      : FRAME_GRADIENT;

  const innerBg =
    accent === "gold"
      ? "rgba(34, 26, 12, 0.96)"
      : accent === "amber"
      ? "rgba(42, 26, 6, 0.96)"
      : accent === "sapphire"
      ? "rgba(10, 24, 44, 0.96)"
      : accent === "ruby"
      ? "rgba(44, 14, 22, 0.96)"
      : accent === "cyan"
      ? "rgba(10, 32, 44, 0.96)"
      : accent === "purple"
      ? "rgba(32, 12, 44, 0.96)"
      : "rgba(10, 38, 28, 0.96)";

  const jewelColors: readonly [string, string] =
    accent === "ruby"
      ? ["#FDA4AF", "#BE123C"]
      : accent === "cyan" || accent === "sapphire"
      ? ["#BAE6FD", "#0284C7"]
      : accent === "emerald"
      ? [palette.mint, palette.emeraldDeep]
      : accent === "purple"
      ? ["#E9D5FF", "#7E22CE"]
      : [palette.goldHi, palette.goldDeep];

  return (
    <View style={[styles.panelOuter, style]}>
      <LinearGradient colors={[...frame]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.panelFrame}>
        <View style={[styles.panelInner, { backgroundColor: innerBg }, contentStyle]}>
          <LinearGradient colors={[...PANEL_SHEEN]} style={styles.panelSheen} pointerEvents="none" />
          {showJewels && (
            <>
              <CornerJewel style={styles.jewelTL} colors={jewelColors} />
              <CornerJewel style={styles.jewelTR} colors={jewelColors} />
              <CornerJewel style={styles.jewelBL} colors={jewelColors} />
              <CornerJewel style={styles.jewelBR} colors={jewelColors} />
            </>
          )}
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

type GameButtonVariant = "gold" | "emerald" | "ruby" | "sapphire" | "dark";

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
  const height = size === "lg" ? 56 : size === "md" ? 46 : 38;
  const radius = height / 2;

  const colors =
    variant === "gold"
      ? (["#FFE885", "#F5BE2C", "#C48616"] as const)
      : variant === "emerald"
      ? (["#6EE7B7", "#10B981", "#059669"] as const)
      : variant === "ruby"
      ? (["#FB7185", "#E11D48", "#BE123C"] as const)
      : variant === "sapphire"
      ? (["#38BDF8", "#0EA5E9", "#0284C7"] as const)
      : (["#1E4A3C", "#0E2C22", "#071A14"] as const);

  const bottomBorderColor =
    variant === "gold"
      ? "#8B5E14"
      : variant === "emerald"
      ? "#064E3B"
      : variant === "ruby"
      ? "#881337"
      : variant === "sapphire"
      ? "#0369A1"
      : "#05160E";

  const labelColor =
    variant === "gold"
      ? "#3A2408"
      : variant === "emerald"
      ? "#06281C"
      : variant === "sapphire"
      ? "#042033"
      : variant === "dark"
      ? palette.goldHi
      : "#FFFFFF";

  const shadowGlowColor =
    variant === "gold"
      ? "rgba(245, 190, 44, 0.45)"
      : variant === "emerald"
      ? "rgba(16, 185, 129, 0.4)"
      : variant === "ruby"
      ? "rgba(244, 63, 94, 0.4)"
      : variant === "sapphire"
      ? "rgba(14, 165, 233, 0.4)"
      : "rgba(0, 0, 0, 0.6)";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btnWrap,
        { height, borderRadius: radius, opacity: disabled ? 0.55 : 1, shadowColor: shadowGlowColor },
        pressed && styles.btnPressed,
        style,
      ]}
    >
      <View
        style={[
          styles.btnRing,
          {
            borderRadius: radius,
            height,
            borderBottomColor: bottomBorderColor,
            borderBottomWidth: size === "sm" ? 3 : 4,
          },
        ]}
      >
        <LinearGradient colors={[...colors]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[styles.btnFill, { borderRadius: radius - 2 }]}>
          <View style={styles.btnGloss} />
          <View style={styles.btnRow}>
            {iconSource ? <Image source={iconSource} style={styles.btnIconImg} /> : null}
            {icon && !iconSource ? <Text style={styles.btnEmoji}>{icon}</Text> : null}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.72}
              style={[
                styles.btnLabel,
                {
                  color: labelColor,
                  fontSize: size === "lg" ? 13.5 : size === "md" ? 12 : 10.5,
                  textShadowColor: variant === "dark" || variant === "ruby" ? "#000" : "rgba(255,255,255,0.45)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 1,
                },
              ]}
            >
              {label}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export function GameIcon({
  source,
  emoji,
  size = 44,
  glow,
}: {
  source?: ImageSourcePropType;
  emoji?: string;
  size?: number;
  glow?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: palette.gold,
        backgroundColor: palette.panelInner,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        shadowColor: glow || palette.gold,
        shadowOpacity: 0.55,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      {source ? (
        <Image source={source} style={{ width: size * 0.75, height: size * 0.75 }} resizeMode="contain" />
      ) : (
        <Text style={{ fontSize: size * 0.46 }}>{emoji}</Text>
      )}
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
  const bgColors =
    color === palette.gemBlue || color === "#38BDF8"
      ? (["#0E3248", "#061824"] as const)
      : color === palette.gold || color === "#F4D06F" || color === "#FFC24A"
      ? (["#382408", "#1A1003"] as const)
      : (["#10382B", "#061C14"] as const);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: `${color}55`,
          shadowColor: color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 3,
        },
        pressed && { transform: [{ scale: 0.96 }] },
      ]}
    >
      <LinearGradient colors={[...bgColors]} style={styles.chipFill}>
        {iconSource ? <Image source={iconSource} style={styles.chipIcon} /> : <Text style={styles.chipEmoji}>{icon}</Text>}
        <View style={{ flex: 1, minWidth: 0 }}>
          {label ? <Text numberOfLines={1} style={styles.chipLabel}>{label}</Text> : null}
          <Text style={[styles.chipValue, { color }]}>{value}</Text>
        </View>
        {plus ? (
          <View style={[styles.plusBubble, { backgroundColor: color }]}>
            <Text style={[styles.plusText, { color: "#06140F" }]}>+</Text>
          </View>
        ) : null}
        {badge ? <View style={styles.chipBadge} /> : null}
      </LinearGradient>
    </Pressable>
  );
}

export function JewelTitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[styles.jewelTitle, style]}>
      {children}
    </Text>
  );
}

export function SectionLabel({ title, meta }: { title: string; meta?: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionRule} />
      <View style={styles.sectionTitleWrap}>
        <Text style={styles.sectionDiamond}>✦</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        {meta ? <Text style={styles.sectionMeta}>· {meta}</Text> : null}
        <Text style={styles.sectionDiamond}>✦</Text>
      </View>
      <View style={styles.sectionRule} />
    </View>
  );
}

const styles = StyleSheet.create({
  vignette: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.9,
    shadowRadius: 40,
  },
  glowOrb: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  glowLeft: {
    left: -60,
    top: 120,
    backgroundColor: "rgba(46, 180, 120, 0.16)",
  },
  glowRight: {
    right: -40,
    bottom: 90,
    backgroundColor: "rgba(244, 208, 111, 0.12)",
  },
  panelOuter: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  panelFrame: {
    borderRadius: 26,
    padding: 3,
  },
  panelInner: {
    backgroundColor: palette.panel,
    borderRadius: 23,
    overflow: "hidden",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(14, 28, 22, 0.9)",
  },
  panelSheen: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 70,
  },
  cornerJewel: {
    position: "absolute",
    width: 12,
    height: 12,
    zIndex: 4,
  },
  cornerJewelInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    transform: [{ rotate: "45deg" }],
    borderWidth: 1,
    borderColor: palette.goldHi,
  },
  jewelTL: { top: 8, left: 8 },
  jewelTR: { top: 8, right: 8 },
  jewelBL: { bottom: 8, left: 8 },
  jewelBR: { bottom: 8, right: 8 },
  btnWrap: {
    shadowColor: palette.gold,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  btnPressed: {
    transform: [{ translateY: 2 }, { scale: 0.985 }],
    shadowOpacity: 0.2,
  },
  btnRing: {
    borderWidth: 2,
    borderColor: palette.bronzeDark,
    overflow: "hidden",
    backgroundColor: palette.bronzeDark,
    width: "100%",
  },
  btnFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  btnGloss: {
    position: "absolute",
    top: 2,
    left: 10,
    right: 10,
    height: "42%",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
    maxWidth: "100%",
  },
  btnEmoji: { fontSize: 16 },
  btnIconImg: { width: 20, height: 20, borderRadius: 10 },
  btnLabel: {
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    flexShrink: 1,
  },
  chip: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: palette.bronzeBorder,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  chipFill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 7,
    gap: 5,
    position: "relative",
  },
  chipIcon: { width: 22, height: 22, borderRadius: 11 },
  chipEmoji: { fontSize: 14 },
  chipLabel: { color: palette.muted, fontSize: 7.5, fontWeight: "900", letterSpacing: 0.4 },
  chipValue: { fontSize: 12, fontWeight: "900" },
  plusBubble: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  plusText: { color: "#3A2408", fontSize: 11, fontWeight: "900", lineHeight: 13 },
  chipBadge: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.danger,
    borderWidth: 1,
    borderColor: palette.cream,
  },
  jewelTitle: {
    color: palette.goldHi,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1.2,
    textShadowColor: "#5A3A10",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  sectionDiamond: {
    color: palette.gold,
    fontSize: 8,
    opacity: 0.85,
  },
  sectionTitle: {
    color: palette.goldBright,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textAlign: "center",
  },
  sectionMeta: {
    color: palette.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(184, 134, 58, 0.45)",
  },
});
