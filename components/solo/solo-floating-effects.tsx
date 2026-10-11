import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

export function FloatingTimeBonus({ text }: { text: string | null }) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (text) {
      animVal.setValue(0);
      Animated.sequence([
        Animated.spring(animVal, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(animVal, {
          toValue: 2,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [text, animVal]);

  if (!text) return null;

  const translateY = animVal.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [-4, 10, 24],
  });

  const scale = animVal.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.6, 1.05, 0.9],
  });

  const opacity = animVal.interpolate({
    inputRange: [0, 0.2, 0.85, 2],
    outputRange: [0, 1, 1, 0],
  });

  const isCombo =
    text.includes("KOMBO") ||
    text.includes("🔥") ||
    text.includes("⚡") ||
    text.includes("🚀") ||
    text.includes("TEMİZLENDİ") ||
    text.includes("KADEMESİ");

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 36,
        right: 0,
        transform: [{ translateY }, { scale }],
        opacity,
        zIndex: 999,
        elevation: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isCombo ? "#FFFBEB" : "#ECFDF5",
          borderWidth: 1.5,
          borderColor: isCombo ? "#F59E0B" : "#10B981",
          borderRadius: 14,
          paddingHorizontal: 10,
          paddingVertical: 5,
          shadowColor: isCombo ? "#F59E0B" : "#10B981",
          shadowOpacity: 0.35,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: isCombo ? "#B45309" : "#047857",
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 0.4,
          }}
        >
          {text}
        </Text>
      </View>
    </Animated.View>
  );
}

export function FloatingScoreBurst({ text }: { text: string | null }) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (text) {
      animVal.setValue(0);
      Animated.sequence([
        Animated.spring(animVal, {
          toValue: 1,
          friction: 5,
          tension: 110,
          useNativeDriver: true,
        }),
        Animated.delay(650),
        Animated.timing(animVal, {
          toValue: 2,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [text, animVal]);

  if (!text) return null;

  const translateY = animVal.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [12, -22, -54],
  });

  const scale = animVal.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.5, 1.15, 0.85],
  });

  const opacity = animVal.interpolate({
    inputRange: [0, 0.15, 0.85, 2],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        alignSelf: "center",
        top: "40%",
        transform: [{ translateY }, { scale }],
        opacity,
        zIndex: 200,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: "#FEF3C7",
          borderWidth: 2,
          borderColor: "#F59E0B",
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
          shadowColor: "#F59E0B",
          shadowOpacity: 0.45,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Text style={{ color: "#B45309", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 }}>
          {text}
        </Text>
      </View>
    </Animated.View>
  );
}

/**
 * Parmak altında kalan harfi yukarı fırlatarak görünür kılan dokunma büyüteci
 */
export function TouchMagnifierBubble({
  letter,
  center,
  visible,
  accentColor = "#3EE8B5",
}: {
  letter: string | null;
  center: { x: number; y: number } | null;
  visible: boolean;
  accentColor?: string;
}) {
  const popAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && letter) {
      Animated.spring(popAnim, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }).start();
    } else {
      popAnim.setValue(0);
    }
  }, [visible, letter, popAnim]);

  if (!visible || !letter || !center) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: center.x - 26,
        top: center.y - 62,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#293541",
        borderWidth: 2.5,
        borderColor: accentColor,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: accentColor,
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 12,
        zIndex: 9999,
        transform: [
          {
            scale: popAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1.15],
            }),
          },
          {
            translateY: popAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 24,
          fontWeight: "900",
          textAlign: "center",
        }}
      >
        {letter}
      </Text>
      {/* Balon ok ucu (pointer tail) */}
      <View
        style={{
          position: "absolute",
          bottom: -6,
          width: 0,
          height: 0,
          borderLeftWidth: 6,
          borderRightWidth: 6,
          borderTopWidth: 6,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: accentColor,
        }}
      />
    </Animated.View>
  );
}

/**
 * Son saniyelerde adrenalin pompalayan kırmızı nabız vinyeti (Pulsing Urgency Vignette)
 */
export function UrgencyVignette({ active }: { active: boolean }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulseAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.25,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulseAnim]);

  if (!active) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 5,
        borderColor: "rgba(239, 68, 68, 0.75)",
        borderRadius: 24,
        opacity: pulseAnim,
        zIndex: 90,
      }}
    />
  );
}
