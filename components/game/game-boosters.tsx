import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
} from "react-native";

export interface FloatingComboProps {
  comboCount: number;
}

export function FloatingCombo({ comboCount }: FloatingComboProps) {
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (comboCount <= 1) {
      setVisible(false);
      return;
    }

    setVisible(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(15);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 900);
    });
  }, [comboCount, fadeAnim, slideAnim]);

  if (!visible || comboCount <= 1) return null;

  const comboLabel =
    comboCount >= 4
      ? "EFSANEVİ KOMBO! x3.0 🔥"
      : comboCount === 3
      ? "HARİKA! x2.0 ⚡"
      : "KOMBO! x1.5 ✨";

  const comboColor =
    comboCount >= 4 ? "#F59E0B" : comboCount === 3 ? "#A855F7" : "#38BDF8";

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.comboContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={[styles.comboText, { color: comboColor }]}>{comboLabel}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  comboContainer: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    zIndex: 99,
    backgroundColor: "rgba(13, 27, 42, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#00f0ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  comboText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },
});
