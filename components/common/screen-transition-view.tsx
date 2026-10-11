import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

interface ScreenTransitionViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

/**
 * ScreenTransitionView adds a polished, buttery smooth entrance transition
 * (micro-fade + gentle vertical spring) whenever a screen mounts or tab switches.
 * Uses native driver for 60fps performance without JS thread contention.
 */
export function ScreenTransitionView({
  children,
  style,
  delay = 0,
}: ScreenTransitionViewProps) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(12)).current;
  const scaleAnim = useRef(new Animated.Value(0.985)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        tension: 180,
        friction: 14,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 180,
        friction: 14,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, translateYAnim, scaleAnim, delay]);

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          opacity: opacityAnim,
          transform: [
            { translateY: translateYAnim },
            { scale: scaleAnim },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
