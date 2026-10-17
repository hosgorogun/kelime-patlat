import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { palette } from "@/shared/palette";
import { haptics } from "@/lib/haptics";
import { getBannerAdUnitId } from "@/lib/admob-service";

export type CyberBannerAdProps = {
  style?: any;
  adUnitId?: string;
  onPressAd?: () => void;
  forceCyberOnly?: boolean;
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

let BannerAdComponent: any = null;
let BannerAdSizeEnum: any = null;

if (Platform.OS !== "web") {
  try {
    const mobileAds = require("react-native-google-mobile-ads");
    BannerAdComponent = mobileAds.BannerAd;
    BannerAdSizeEnum = mobileAds.BannerAdSize;
  } catch {
    // Native module not linked or running in mock environment
  }
}

export function CyberBannerAd({ style, adUnitId, onPressAd, forceCyberOnly = false }: CyberBannerAdProps) {
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [admobFailed, setAdmobFailed] = useState(false);
  const [admobLoaded, setAdmobLoaded] = useState(false);

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

  const renderCyberFallback = () => (
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

  // Native Android/iOS ortamında ve AdMob destekleniyorsa
  if (!forceCyberOnly && Platform.OS !== "web" && BannerAdComponent && !admobFailed) {
    const resolvedUnitId = adUnitId || getBannerAdUnitId();
    return (
      <View style={[styles.admobWrapper, style]}>
        <View style={!admobLoaded ? { position: "absolute", opacity: 0 } : undefined}>
          <BannerAdComponent
            unitId={resolvedUnitId}
            size={BannerAdSizeEnum?.ANCHORED_ADAPTIVE_BANNER || "BANNER"}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdLoaded={() => {
              setAdmobLoaded(true);
              setAdmobFailed(false);
            }}
            onAdFailedToLoad={(error: any) => {
              console.warn("[AdMob] Banner yüklenemedi, Cyber Banner'a geçiliyor:", error?.message);
              setAdmobFailed(true);
            }}
          />
        </View>
        {!admobLoaded && renderCyberFallback()}
      </View>
    );
  }

  return renderCyberFallback();
}

const styles = StyleSheet.create({
  admobWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  bannerWrap: {
    width: "100%",
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bannerContainer: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderBottomWidth: 2.5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  glowLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.9,
  },
  leftCol: {
    marginRight: 10,
  },
  adBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
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
    gap: 5,
  },
  campaignKicker: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  dot: {
    color: "#94A3B8",
    fontSize: 8,
  },
  campaignTitle: {
    color: "#0F172A",
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  campaignSub: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },
  rightCol: {
    justifyContent: "center",
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  actionBtnText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
