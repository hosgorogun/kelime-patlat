import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";

export type CoinParticle = {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  delay: number;
  icon: string;
};

interface CoinCascadeOverlayProps {
  trigger: boolean;
  count?: number;
  icon?: string;
  onComplete?: () => void;
}

export function CoinCascadeOverlay({
  trigger,
  count = 10,
  icon = "🪙",
  onComplete,
}: CoinCascadeOverlayProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [particles, setParticles] = useState<CoinParticle[]>([]);
  const animValues = useRef<Map<number, Animated.Value>>(new Map()).current;
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Clear any previous timeouts
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];

    if (!trigger) {
      setParticles([]);
      return;
    }

    const startCenterX = screenWidth * 0.5;
    const startCenterY = screenHeight * 0.45;
    const targetHeaderX = screenWidth - 50;
    const targetHeaderY = 40;

    const newParticles: CoinParticle[] = Array.from({ length: count }, (_, i) => ({
      id: Math.random() + i,
      startX: startCenterX + (Math.random() * 80 - 40),
      startY: startCenterY + (Math.random() * 60 - 30),
      targetX: targetHeaderX + (Math.random() * 30 - 15),
      targetY: targetHeaderY,
      delay: i * 75,
      icon,
    }));

    newParticles.forEach((p) => {
      animValues.set(p.id, new Animated.Value(0));
    });

    setParticles(newParticles);

    const animations = newParticles.map((p) => {
      const anim = animValues.get(p.id)!;
      return Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 650,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(50, animations).start(() => {
      onComplete?.();
    });

    // Har bir para hedefe ulaşırken haptik çıtlatma ver (cleanup ref ekli)
    newParticles.forEach((p) => {
      const tid = setTimeout(() => {
        triggerHapticSelection();
      }, p.delay + 500);
      timeoutIdsRef.current.push(tid);
    });

    return () => {
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
    };
  }, [trigger, count, icon, animValues, onComplete, screenWidth, screenHeight]);

  if (!particles.length) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => {
        const anim = animValues.get(p.id);
        if (!anim) return null;

        const translateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [p.startX, p.targetX],
        });

        const translateY = anim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [p.startY, p.startY - 60, p.targetY],
        });

        const scale = anim.interpolate({
          inputRange: [0, 0.3, 0.8, 1],
          outputRange: [0.3, 1.3, 1, 0.4],
        });

        const opacity = anim.interpolate({
          inputRange: [0, 0.1, 0.85, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.coin,
              {
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
              },
            ]}
          >
            <Text style={styles.coinText}>{p.icon}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  coin: {
    position: "absolute",
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  coinText: {
    fontSize: 24,
  },
});
