import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { palette } from "@/shared/palette";
import { haptics } from "@/lib/haptics";

export type CyberBannerAdProps = {
  style?: any;
  adUnitId?: string;
  onPressAd?: () => void;
};

const SAMPLE_CAMPAIGNS = [
  {
    kicker: "ÖZEL ETKİNLİK",
    title: "Yeni sezon başladı! 🏆",
    sub: "Liderlik sıralamasına katıl, +1000 Çip ödülü kap!",
    badge: "SEZON",
    accent: palette.gold,
  },
  {
    kicker: "İPUCU",
    title: "Zorlu Harfleri Patlat! ⚡",
    sub: "Radar güçlendiricisi ile gizli kelimeleri anında yakala.",
    badge: "REHBER",
    accent: palette.emerald,
  },
  {
    kicker: "TOPLULUK",
    title: "Arkadaşlarınla Canlı Düello Yap! ⚔️",
    sub: "Oda kur veya arkadaşını 4×4 düelloya davet et.",
    badge: "DÜELLO",
    accent: palette.teal,
  },
  {
    kicker: "GÜNLÜK ÖDÜL",
    title: "Giriş Sandığını Unutma! 🎁",
    sub: "Her gün oyuna gir, kesintisiz seri bonuslarını topla.",
    badge: "BONUS",
    accent: palette.warning,
  },
];

export function CyberBannerAd({ style, onPressAd }: CyberBannerAdProps) {
  const [campaignIndex, setCampaignIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCampaignIndex((prev) => (prev + 1) % SAMPLE_CAMPAIGNS.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const campaign = SAMPLE_CAMPAIGNS[campaignIndex] ?? SAMPLE_CAMPAIGNS[0]!;

  const handlePress = () => {
    haptics.light();
    if (onPressAd) {
      onPressAd();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.bannerWrap, style, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={["#FFFFFF", "#FFFFFF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bannerContainer, { borderColor: `${campaign.accent}45` }]}
      >
        {/* Subtle Cyber Grid Line */}
        <View style={[styles.glowLine, { backgroundColor: campaign.accent }]} />

        {/* Ad Tag / Sponsorlu Rozeti */}
        <View style={styles.leftCol}>
          <View style={[styles.adBadge, { borderColor: `${campaign.accent}60` }]}>
            <Text style={[styles.adBadgeText, { color: campaign.accent }]}>AD</Text>
          </View>
        </View>

        {/* Banner Content */}
        <View style={styles.centerCol}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.campaignKicker, { color: campaign.accent }]}>
              {campaign.kicker}
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text numberOfLines={1} style={styles.campaignTitle}>
              {campaign.title}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.campaignSub}>
            {campaign.sub}
          </Text>
        </View>

        {/* Action Button Pill */}
        <View style={styles.rightCol}>
          <View style={[styles.actionBtn, { borderColor: `${campaign.accent}70`, backgroundColor: `${campaign.accent}15` }]}>
            <Text style={[styles.actionBtnText, { color: campaign.accent }]}>
              {campaign.badge}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    width: "100%",
    marginBottom: 8,
    borderRadius: 14,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bannerContainer: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    overflow: "hidden",
    position: "relative",
  },
  glowLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    opacity: 0.8,
  },
  leftCol: {
    marginRight: 8,
  },
  adBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    backgroundColor: "#FFF8E8",
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  centerCol: {
    flex: 1,
    justifyContent: "center",
    marginRight: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  campaignKicker: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  dot: {
    color: "#293541",
    fontSize: 8,
  },
  campaignTitle: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  campaignSub: {
    color: "#293541",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  rightCol: {
    justifyContent: "center",
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
