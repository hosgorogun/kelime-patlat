import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  useWindowDimensions,
} from "react-native";
import { haptics } from "../lib/haptics";
import { gameSfx } from "../lib/game-sfx";

export type ModernAlertDetailRow = {
  label: string;
  value: string;
  icon?: string;
  color?: string;
};

export type ModernAlertData = {
  id?: string;
  icon?: string;
  kicker?: string;
  title: string;
  message?: string;
  details?: ModernAlertDetailRow[];
  accentColor?: string;
  primaryButton?: {
    text: string;
    onPress: () => void;
    color?: string;
    icon?: string;
  };
  secondaryButton?: {
    text: string;
    onPress?: () => void;
  };
  onDismiss?: () => void;
};

export type ModernAlertModalProps = {
  alert: ModernAlertData | null;
  onDismiss: () => void;
};

export function ModernAlertModal({ alert, onDismiss }: ModernAlertModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alert) {
      try {
        haptics.light();
        gameSfx.tap();
      } catch {
        // Audio/haptics unavailable
      }

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [alert, scaleAnim, opacityAnim]);

  if (!alert) return null;

  const accentColor = alert.accentColor || "#F4D06F";
  const cardWidth = Math.min(windowWidth - 36, 360);

  const handleDismiss = () => {
    alert.onDismiss?.();
    onDismiss();
  };

  const handlePrimaryPress = () => {
    try {
      haptics.select();
    } catch {}
    alert.primaryButton?.onPress();
    onDismiss();
  };

  const handleSecondaryPress = () => {
    try {
      haptics.light();
    } catch {}
    if (alert.secondaryButton?.onPress) {
      alert.secondaryButton.onPress();
    }
    onDismiss();
  };

  return (
    <Modal
      visible={Boolean(alert)}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              width: cardWidth,
              borderColor: accentColor,
              shadowColor: accentColor,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon Circle */}
          {alert.icon && (
            <View style={[styles.iconCircle, { borderColor: accentColor, backgroundColor: "#04110C" }]}>
              <Text style={styles.iconText}>{alert.icon}</Text>
            </View>
          )}

          {/* Kicker / Tag */}
          {alert.kicker && (
            <Text style={[styles.kickerText, { color: accentColor }]}>
              {alert.kicker}
            </Text>
          )}

          {/* Title */}
          <Text style={styles.titleText}>{alert.title}</Text>

          {/* Message */}
          {alert.message && <Text style={styles.messageText}>{alert.message}</Text>}

          {/* Detail Rows */}
          {alert.details && alert.details.length > 0 && (
            <View style={styles.detailsContainer}>
              {alert.details.map((item, idx) => (
                <View key={idx} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {item.icon ? `${item.icon} ` : ""}{item.label}
                  </Text>
                  <Text style={[styles.detailValue, { color: item.color || accentColor }]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Buttons */}
          <View style={styles.actionsContainer}>
            {alert.primaryButton && (
              <Pressable
                onPress={handlePrimaryPress}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: alert.primaryButton?.color || accentColor },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {alert.primaryButton.icon ? `${alert.primaryButton.icon} ` : ""}
                  {alert.primaryButton.text}
                </Text>
              </Pressable>
            )}

            {alert.secondaryButton && (
              <Pressable
                onPress={handleSecondaryPress}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text style={styles.secondaryButtonText}>
                  {alert.secondaryButton.text}
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(4, 17, 12, 0.86)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  card: {
    backgroundColor: "#0E2C22",
    borderWidth: 2.5,
    borderColor: "#D4B45A",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconText: {
    fontSize: 28,
  },
  kickerText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
    textAlign: "center",
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 25,
    marginBottom: 8,
  },
  messageText: {
    color: "#A8C5B5",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
  },
  detailsContainer: {
    width: "100%",
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  detailLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "900",
  },
  actionsContainer: {
    width: "100%",
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    width: "100%",
    height: 48,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#06140F",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  secondaryButton: {
    width: "100%",
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#A8C5B5",
    fontSize: 13,
    fontWeight: "800",
  },
});
