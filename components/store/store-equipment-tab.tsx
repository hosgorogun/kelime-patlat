import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import {
  type ChipEquipmentItem,
  CHIP_EQUIPMENT_ITEMS,
} from "@/shared/store-items";
import {
  getCalculatedLives,
  MAX_LIVES,
  getPlayerLevel,
  type PlayerProgress,
} from "@/shared/progression";
import { STORE_ASSETS } from "./store-assets";
import { styles } from "./cyber-store.styles";

export function StoreEquipmentTab({
  progress,
  coins,
  remainingAds,
  dailyAdLimit,
  adLoading,
  onWatchAd,
  onSpendChips,
}: {
  progress?: PlayerProgress;
  coins: number;
  remainingAds: number;
  dailyAdLimit: number;
  adLoading: boolean;
  onWatchAd: () => void;
  onSpendChips: (item: ChipEquipmentItem) => void;
}) {
  return (
    <>
      {/* Rewarded Ad Sponsor Banner */}
      <View style={styles.adBannerCard}>
        <View style={styles.adIconCircle}>
          <Text style={{ fontSize: 22 }}>📺</Text>
        </View>
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text style={styles.adBannerKicker}>
              {remainingAds <= 0 ? "GÜNLÜK KOTA DOLDU" : "ÜCRETSİZ ÖDÜL"}
            </Text>
            <View style={[styles.adFreeBadge, remainingAds <= 0 && { backgroundColor: "rgba(143,186,171,0.2)" }]}>
              <Text style={[styles.adFreeText, remainingAds <= 0 && { color: "#293541" }]}>
                {remainingAds <= 0 ? "TAMAMLANDI" : `${remainingAds}/${dailyAdLimit} HAK`}
              </Text>
            </View>
          </View>
          <Text style={styles.adBannerTitle}>
            {remainingAds <= 0 ? "Bugünkü Reklamlar İzlendi" : "Sponsorlu Reklam İle Çip Kazan"}
          </Text>
          <Text style={styles.adBannerDesc}>
            {remainingAds <= 0
              ? "Günün 3 sponsorlu reklam hakkını tamamladın. Yarın saat 00:00'da yenilenecek!"
              : "Her izlemede anında +15 Çip kazan! (Günde 3 reklam hakkı)"}
          </Text>
        </View>
        <Pressable
          disabled={adLoading || remainingAds <= 0}
          onPress={onWatchAd}
          style={({ pressed }) => [
            styles.adButton,
            remainingAds <= 0 && { backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "#DCE1D7" },
            pressed && remainingAds > 0 && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.adButtonText, remainingAds <= 0 && { color: "#293541", fontSize: 10 }]}>
            {adLoading ? "..." : remainingAds <= 0 ? "✓ TAMAM" : "İZLE (+15)"}
          </Text>
        </Pressable>
      </View>

      {/* In-Game Chip Equipment Section */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitleHeader}>🪙 ÇİPLERİNLE ALABİLECEĞİN EKİPMANLAR</Text>
        <Text style={styles.sectionSubHeader}>OYUN İÇİ AVANTAJ</Text>
      </View>

      {CHIP_EQUIPMENT_ITEMS.map((item) => {
        const isRadar = item.rewardType === "radar";
        const isShield = item.rewardType === "shield";
        const isXp = item.rewardType === "xp";
        const isLives = item.rewardType === "lives";

        const livesCalc = progress ? getCalculatedLives(progress) : null;
        const currentLives = livesCalc ? livesCalc.lives : 5;
        const isLivesFull = isLives && Boolean(livesCalc?.isInfinite || currentLives >= MAX_LIVES);
        const canAfford = coins >= item.cost;
        const isDisabled = !canAfford && !isLivesFull;

        const accentColor = isLives ? "#22C55E" : isRadar ? "#3EE8B5" : isShield ? "#60A5FA" : isXp ? "#F59E0B" : "#EC4899";

        return (
          <View key={item.id} style={[styles.productCard, { borderColor: `${accentColor}40` }]}>
            <View style={[styles.productIconWrap, { borderColor: accentColor, backgroundColor: `${accentColor}18` }]}>
              <View style={{ width: 48, height: 48, borderRadius: 15, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0C7" }}>
                {item.imageKey && STORE_ASSETS[item.imageKey] ? (
                  <Image
                    source={STORE_ASSETS[item.imageKey]}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 27 }}>{item.icon}</Text>
                )}
              </View>
              <View style={[styles.productEmblemDot, { backgroundColor: accentColor }]} />
            </View>
            <View style={styles.productInfo}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Text style={styles.productName}>{item.name}</Text>
                {isLives && (
                  <View style={[styles.inventoryCountBadge, { borderColor: "#DCE1D7" }]}>
                    <Text style={[styles.inventoryCountText, { color: "#1daa51" }]}>
                      Can: {livesCalc?.isInfinite ? "∞ (Sonsuz)" : `${currentLives}/5`}
                    </Text>
                  </View>
                )}
                {isShield && (
                  <View style={styles.inventoryCountBadge}>
                    <Text style={styles.inventoryCountText}>Sahip: {progress?.streakShields ?? 0}</Text>
                  </View>
                )}
                {isRadar && (
                  <View style={[styles.inventoryCountBadge, { borderColor: "#DCE1D7" }]}>
                    <Text style={[styles.inventoryCountText, { color: "#2a9c7a" }]}>Bonus: +{progress?.radarChargesBonus ?? 0}</Text>
                  </View>
                )}
                {isXp && (
                  <View style={[styles.inventoryCountBadge, { borderColor: "#DCE1D7" }]}>
                    <Text style={[styles.inventoryCountText, { color: "#ad6f08" }]}>
                      Mevcut: {progress?.xp ?? 0} XP (Sv. {getPlayerLevel(progress?.xp ?? 0)})
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.productDesc}>{item.description}</Text>
            </View>
            <Pressable
              disabled={isDisabled}
              onPress={() => onSpendChips(item)}
              style={({ pressed }) => [
                styles.chipBuyButton,
                !canAfford && styles.chipBuyButtonDisabled,
                isLivesFull && styles.chipBuyButtonFull,
                pressed && !isDisabled && { opacity: 0.8 }
              ]}
            >
              {isLivesFull ? (
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 }}>
                  <Text style={{ color: "#349d5a", fontSize: 12, fontWeight: "900" }}>{livesCalc?.isInfinite ? "⚡" : "✓"}</Text>
                  <Text style={styles.chipBuyButtonFullText}>{livesCalc?.isInfinite ? "SONSUZ" : "DOLU"}</Text>
                </View>
              ) : (
                <Text style={[styles.chipBuyButtonText, !canAfford && { color: "#293541" }]}>
                  🪙 {item.cost}
                </Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </>
  );
}
