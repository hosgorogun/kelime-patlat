import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

/**
 * Parmak harfe değdiğinde (active: false -> true) kutucuk %15 büyüyüp
 * yaylanarak yerine oturur (squash & stretch pop).
 */
export const TilePop = React.memo(function TilePop({ active, children }: { active: boolean; children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  const wasActive = useRef(false);

  useEffect(() => {
    if (active && !wasActive.current) {
      scale.setValue(0.92);
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 70, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 3.5, tension: 140, useNativeDriver: true }),
      ]).start();
    } else if (!active && wasActive.current) {
      scale.setValue(1);
    }
    wasActive.current = active;
  }, [active, scale]);

  if (!active && !wasActive.current) {
    return <View style={{ width: "100%", height: "100%" }}>{children}</View>;
  }

  return (
    <Animated.View style={{ width: "100%", height: "100%", transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
});
