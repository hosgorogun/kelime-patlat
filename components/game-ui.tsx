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

function CornerJewel({ style }: { style: ViewStyle }) {
  return (
    <View style={[styles.cornerJewel, style]}>
      <LinearGradient colors={[palette.goldHi, palette.goldDeep]} style={styles.cornerJewelInner} />
    </View>
  );
}

export function OrnatePanel({
  children,
  style,
  contentStyle,
  accent = "gold",
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accent?: "gold" | "emerald";
}) {
  const frame = accent === "emerald" ? ([palette.mint, palette.emeraldDeep, palette.bronzeDark, palette.teal] as const) : FRAME_GRADIENT;
  return (
    <View style={[styles.panelOuter, style]}>
      <LinearGradient colors={[...frame]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.panelFrame}>
        <View style={[styles.panelInner, contentStyle]}>
          <LinearGradient colors={[...PANEL_SHEEN]} style={styles.panelSheen} pointerEvents="none" />
          <CornerJewel style={styles.jewelTL} />
          <CornerJewel style={styles.jewelTR} />
          <CornerJewel style={styles.jewelBL} />
          <CornerJewel style={styles.jewelBR} />
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

type GameButtonVariant = "gold" | "emerald" | "dark";

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
    variant === "gold" ? GOLD_BUTTON_GRADIENT : variant === "emerald" ? EMERALD_GRADIENT : (["#1E4A3C", "#0E2C22", "#071A14"] as const);
  const labelColor = variant === "dark" ? palette.goldHi : "#3A2408";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btnWrap,
        { height, borderRadius: radius, opacity: disabled ? 0.55 : 1 },
        pressed && styles.btnPressed,
        style,
      ]}
    >
      <View style={[styles.btnRing, { borderRadius: radius, height }]}>
        <LinearGradient colors={[...colors]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[styles.btnFill, { borderRadius: radius - 2 }]}>
          <View style={styles.btnGloss} />
          <View style={styles.btnRow}>
            {iconSource ? <Image source={iconSource} style={styles.btnIconImg} /> : null}
            {icon && !iconSource ? <Text style={styles.btnEmoji}>{icon}</Text> : null}
            <Text style={[styles.btnLabel, { color: labelColor, fontSize: size === "lg" ? 15 : size === "md" ? 13 : 11 }]}>{label}</Text>
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
        <Image source={source} style={{ width: size, height: size }} />
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
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, pressed && { transform: [{ scale: 0.96 }] }]}>
      <LinearGradient colors={["#1A4A3A", "#0C2A20"]} style={styles.chipFill}>
        {iconSource ? <Image source={iconSource} style={styles.chipIcon} /> : <Text style={styles.chipEmoji}>{icon}</Text>}
        <View style={{ flex: 1, minWidth: 0 }}>
          {label ? <Text numberOfLines={1} style={styles.chipLabel}>{label}</Text> : null}
          <Text style={[styles.chipValue, { color }]}>{value}</Text>
        </View>
        {plus ? (
          <View style={styles.plusBubble}>
            <Text style={styles.plusText}>+</Text>
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
      <Text style={styles.sectionTitle}>{title}</Text>
      {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : <View style={styles.sectionRule} />}
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
    gap: 8,
    paddingHorizontal: 14,
  },
  btnEmoji: { fontSize: 16 },
  btnIconImg: { width: 22, height: 22, borderRadius: 11 },
  btnLabel: {
    fontWeight: "900",
    letterSpacing: 0.8,
    textShadowColor: "rgba(255,255,255,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
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
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    color: palette.goldBright,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
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
