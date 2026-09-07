import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { haptics } from "../lib/haptics";
import { gameSfx } from "../lib/game-sfx";

export type ToastData = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  accentColor?: string;
  badge?: string;
};

type GlobalGameToastProps = {
  toast: ToastData | null;
  onDismiss: () => void;
};

export function GlobalGameToast({ toast, onDismiss }: GlobalGameToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -90,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [onDismiss, opacity, translateY]);

  useEffect(() => {
    if (!toast) return;

    // Trigger feedback
    try {
      haptics.success();
      gameSfx.victory();
    } catch {
      // Audio or haptics unavailable
    }

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
      }),
    ]).start();

    // Auto dismiss timer (4.5s)
    const timer = setTimeout(() => {
      dismiss();
    }, 4500);

    return () => clearTimeout(timer);
  }, [dismiss, opacity, scale, toast, toast?.id, translateY]);

  if (!toast) return null;

  const accent = toast.accentColor || "#00F5D4";

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toastCard,
          {
            borderColor: accent,
            shadowColor: accent,
            transform: [{ translateY }, { scale }],
            opacity,
          },
        ]}
      >
        <Pressable onPress={dismiss} style={styles.pressableRow}>
          <View style={[styles.iconBubble, { backgroundColor: `${accent}22`, borderColor: accent }]}>
            <Text style={styles.iconText}>{toast.icon}</Text>
          </View>

          <View style={styles.contentWrap}>
            <View style={styles.titleRow}>
              <Text numberOfLines={1} style={[styles.title, { color: accent }]}>
                {toast.title}
              </Text>
              {toast.badge && (
                <View style={[styles.badgePill, { backgroundColor: accent }]}>
                  <Text style={styles.badgeText}>{toast.badge}</Text>
                </View>
              )}
            </View>
            <Text numberOfLines={2} style={styles.subtitle}>
              {toast.subtitle}
            </Text>
          </View>

          <View style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 18,
    left: 14,
    right: 14,
    zIndex: 9999,
    alignItems: "center",
  },
  toastCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(18, 13, 36, 0.96)",
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  pressableRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  iconText: {
    fontSize: 22,
  },
  contentWrap: {
    flex: 1,
    paddingRight: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: "#0B071E",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#CBD5E1",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  closeBtnText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "900",
  },
});
