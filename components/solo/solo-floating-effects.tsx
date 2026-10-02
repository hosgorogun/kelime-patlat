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
