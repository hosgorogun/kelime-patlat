import React, { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { getBannerAdUnitId } from "@/lib/admob-service";
import { CyberBannerAd, CyberBannerAdProps } from "./cyber-banner-ad";

export interface AdMobBannerProps extends CyberBannerAdProps {
  size?: any;
}

export function AdMobBanner({ style, adUnitId, onPressAd }: AdMobBannerProps) {
  const [adFailed, setAdFailed] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  // Web veya test ortamında doğrudan şık Cyber banner göster
  if (Platform.OS === "web" || adFailed) {
    return <CyberBannerAd style={style} onPressAd={onPressAd} />;
  }

  try {
    const { BannerAd, BannerAdSize } = require("react-native-google-mobile-ads");
    const resolvedAdUnitId = adUnitId || getBannerAdUnitId();

    return (
      <View style={[styles.container, style]}>
        <BannerAd
          unitId={resolvedAdUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            setAdLoaded(true);
            setAdFailed(false);
          }}
          onAdFailedToLoad={(error: any) => {
            console.warn("[AdMobBanner] Reklam yüklenemedi, Cyber Banner'a geçiliyor:", error?.message);
            setAdFailed(true);
          }}
        />
        {/* Reklam henüz yüklenene kadar boşluk yerine cyber banner göster */}
        {!adLoaded && !adFailed && (
          <CyberBannerAd style={{ marginBottom: 0 }} onPressAd={onPressAd} />
        )}
      </View>
    );
  } catch (err) {
    return <CyberBannerAd style={style} onPressAd={onPressAd} />;
  }
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
});
