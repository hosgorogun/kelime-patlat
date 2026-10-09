import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

export interface OfflineBannerProps {
  isOffline: boolean;
}

export const OfflineBanner = React.memo(({ isOffline }: OfflineBannerProps) => {
  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>☁️</Text>
      <Text style={styles.text}>
        ÇEVRİMDİŞİ MOD — İlerlemeniz cihazınızda yerel olarak saklanıyor.
      </Text>
    </View>
  );
});

OfflineBanner.displayName = "OfflineBanner";

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#F59E0B",
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  icon: {
    fontSize: 13,
    marginRight: 6,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
