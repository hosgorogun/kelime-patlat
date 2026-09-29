import { useEffect, useRef, useState } from "react";
import { AppState, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { monetizationManager } from "@/shared/monetization";
import { gameSfx, triggerHapticError, triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { getCalculatedLives, MAX_LIVES, getPlayerLevel, getDayId, type PlayerProgress } from "@/shared/progression";
import { type ChipEquipmentItem, CHIP_EQUIPMENT_ITEMS, PROFILE_FRAMES, VICTORY_EFFECTS, BOARD_SKINS } from "@/shared/store-items";
import { STORE_ASSETS } from "./store-assets";

const DAILY_AD_LIMIT = 3;

export type { ChipEquipmentItem };
export { CHIP_EQUIPMENT_ITEMS, PROFILE_FRAMES, VICTORY_EFFECTS, BOARD_SKINS, STORE_ASSETS };

const FRAME_IMAGES: Record<string, any> = {
  signal: require("../assets/frames/signal.jpg"),
  neon: require("../assets/frames/neon.jpg"),
  chrome: require("../assets/frames/chrome.jpg"),
  gold: require("../assets/frames/gold.jpg"),
  cyber: require("../assets/frames/cyber.jpg"),
};

type StoreTab = "equipment" | "cosmetics";

export function CyberStore({
  coins,
  progress,
  hasClaimableDailyReward,
  onClaimDailyReward,
  onBuyCoins,
  onBuyRadar,
  onSpendCoins,
  onSelectFrame,
  onSelectVictoryEffect,
  onBuyCosmetic,
  onSelectBoardSkin,
  onBack,
}: {
  coins: number;
  progress?: PlayerProgress;
  hasClaimableDailyReward?: boolean;
  onClaimDailyReward?: () => void;
  onBuyCoins: (amount: number) => void;
  onBuyRadar: () => void;
  onSpendCoins?: (item: ChipEquipmentItem) => boolean | Promise<boolean>;
  onSelectFrame?: (frameId: string) => void;
  onSelectVictoryEffect?: (effectId: string) => void;
  onBuyCosmetic?: (kind: "avatar" | "frame" | "effect" | "board", id: string, cost: number) => boolean | Promise<boolean>;
  onSelectBoardSkin?: (skinId: string) => void;
  onBack: () => void;
}) {
  const [todayId, setTodayId] = useState(() => getDayId());
  const [dailyAdCount, setDailyAdCount] = useState<number>(0);
  const [storeMessage, setStoreMessage] = useState<string | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<StoreTab>("equipment");

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        const current = getDayId();
        setTodayId((prev) => (prev !== current ? current : prev));
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(`@kelime_patlat:daily_ad_watches_${todayId}`)
      .then((val) => {
        if (mounted && val) {
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed)) setDailyAdCount(parsed);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [todayId]);

  const storeMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedbackMessage = (msg: string) => {
    setStoreMessage(msg);
    if (storeMessageTimeoutRef.current) clearTimeout(storeMessageTimeoutRef.current);
    storeMessageTimeoutRef.current = setTimeout(() => setStoreMessage(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (storeMessageTimeoutRef.current) clearTimeout(storeMessageTimeoutRef.current);
    };
  }, []);

  const remainingAds = Math.max(0, DAILY_AD_LIMIT - dailyAdCount);

  // Satın alma onay modalı durumu
  const [confirmPurchase, setConfirmPurchase] = useState<{
    title: string;
    description: string;
    cost: number;
    icon: string;
    onConfirm: () => void;
  } | null>(null);

  const executeSpendChips = async (item: ChipEquipmentItem) => {
    if (coins < item.cost) {
      triggerHapticError();
      gameSfx.rejected();
      showFeedbackMessage(`Yetersiz Çip! Bu ekipman için ${item.cost} siber çip gerekiyor.`);
      return;
    }
    const success = await onSpendCoins?.(item);
    if (success !== false) {
      triggerHapticSuccess();
      gameSfx.victory();
      showFeedbackMessage(`Tebrikler! ${item.name} başarıyla envanterine eklendi! 🎉`);
    } else {
      triggerHapticError();
      gameSfx.rejected();
      showFeedbackMessage(`İşlem gerçekleştirilemedi. Lütfen çip bakiyenizi kontrol edin.`);
    }
  };

  const handleSpendChips = (item: ChipEquipmentItem) => {
    if (item.rewardType === "lives" && progress) {
      const calc = getCalculatedLives(progress);
      if (calc.lives >= MAX_LIVES) {
        triggerHapticError();
        gameSfx.rejected();
        showFeedbackMessage("Canlarınız zaten tam kapasite dolu (5/5)!");
        return;
      }
    }
    if (coins < item.cost) {
      triggerHapticError();
      gameSfx.rejected();
      showFeedbackMessage(`Yetersiz Çip! Bu ekipman için ${item.cost} siber çip gerekiyor.`);
      return;
    }
    triggerHapticSelection();
    setConfirmPurchase({
      title: item.name,
      description: item.description,
      cost: item.cost,
      icon: item.icon,
      onConfirm: () => void executeSpendChips(item),
    });
  };

  const handleCosmeticPress = (
    kind: "frame" | "effect" | "board",
    id: string,
    label: string,
    color: string,
    cost: number,
    owned: boolean,
    onSelect?: (id: string) => void
  ) => {
    triggerHapticSelection();
    if (owned) {
      onSelect?.(id);
      return;
    }
    if (cost === 0) {
      onBuyCosmetic?.(kind, id, 0);
      return;
    }
    if (coins < cost) {
      triggerHapticError();
      gameSfx.rejected();
      showFeedbackMessage(`Yetersiz Çip! Bu kozmetik için ${cost} siber çip gerekiyor.`);
      return;
    }
    setConfirmPurchase({
      title: `${label} (${kind === "frame" ? "Çerçeve" : kind === "effect" ? "Zafer Efekti" : "Tahta"})`,
      description: `${cost} Çip karşılığında bu kozmetiğin kilidini açıp kuşanmak istiyor musunuz?`,
      cost,
      icon: kind === "frame" ? "✨" : kind === "effect" ? "💥" : "🎨",
      onConfirm: async () => {
        const success = await onBuyCosmetic?.(kind, id, cost);
        if (success) {
          triggerHapticSuccess();
          gameSfx.victory();
          showFeedbackMessage(`Tebrikler! ${label} açıldı ve kuşanıldı! 🎉`);
        } else {
          triggerHapticError();
          gameSfx.rejected();
          showFeedbackMessage(`Kozmetik açılamadı. Lütfen çip bakiyenizi kontrol edin.`);
        }
      },
    });
  };

  const handleWatchAdForCoins = async () => {
    if (adLoading) return;
    if (remainingAds <= 0) {
      triggerHapticError();
      gameSfx.rejected();
      showFeedbackMessage(`Bugünkü ${DAILY_AD_LIMIT}/${DAILY_AD_LIMIT} reklam hakkını tamamladın! Yarın 00:00'da yenilenecek.`);
      return;
    }
    setAdLoading(true);
    triggerHapticSelection();
    await monetizationManager.showRewardedAd(
      "radar_charge",
      () => {
        const nextCount = dailyAdCount + 1;
        setDailyAdCount(nextCount);
        void AsyncStorage.setItem(`@kelime_patlat:daily_ad_watches_${todayId}`, String(nextCount));
        setAdLoading(false);
        triggerHapticSuccess();
        gameSfx.victory();
        onBuyCoins(15);
        const left = Math.max(0, DAILY_AD_LIMIT - nextCount);
        showFeedbackMessage(`Ödül alındı: +15 Çip kazandın! 🪙 (Bugün Kalan Hak: ${left}/${DAILY_AD_LIMIT})`);
      },
      () => {
        // Reklam oynatılamadıysa ödül VERİLMEZ (günlük hak da tüketilmez)
        setAdLoading(false);
        triggerHapticError();
        gameSfx.rejected();
        showFeedbackMessage("Reklam şu anda yüklenemedi. Lütfen daha sonra tekrar dene.");
      }
    );
  };

  return (
    <>
      {/* Satın Alma Onay Modalı */}
      <Modal
        visible={confirmPurchase !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmPurchase(null)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setConfirmPurchase(null)}>
          <Pressable style={styles.confirmCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.confirmBadge}>
              <Text style={styles.confirmBadgeIcon}>{confirmPurchase?.icon}</Text>
            </View>

            <Text style={styles.confirmKicker}>İŞLEMİ ONAYLIYOR MUSUNUZ?</Text>
            <Text numberOfLines={2} style={styles.confirmTitle}>
              {confirmPurchase?.title}
            </Text>

            <View style={styles.confirmCostPill}>
              <Text style={styles.confirmCostLabel}>ÖDENECEK TUTAR:</Text>
              <Text style={styles.confirmCostValue}>🪙 {confirmPurchase?.cost} ÇİP</Text>
            </View>

            <Text style={styles.confirmDesc}>{confirmPurchase?.description}</Text>

            <View style={styles.confirmBalanceInfo}>
              <Text style={styles.confirmBalanceText}>
                Mevcut Bakiye: <Text style={{ color: "#98732c", fontWeight: "900" }}>{coins} Çip</Text> → Kalan: <Text style={{ color: "#2a9c7a", fontWeight: "900" }}>{Math.max(0, coins - (confirmPurchase?.cost ?? 0))} Çip</Text>
              </Text>
            </View>

            <View style={styles.confirmActionsRow}>
              <Pressable
                onPress={() => setConfirmPurchase(null)}
                style={({ pressed }) => [styles.confirmCancelBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.confirmCancelText}>VAZGEÇ</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  const action = confirmPurchase?.onConfirm;
                  setConfirmPurchase(null);
                  action?.();
                }}
                style={({ pressed }) => [styles.confirmAcceptBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.confirmAcceptText}>✓ SATIN AL</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerKicker}>OYUNUNA RENK KAT</Text>
          <Text numberOfLines={1} style={styles.headerTitle}>Mağaza</Text>
        </View>
        <Pressable
          disabled={adLoading || remainingAds <= 0}
          onPress={handleWatchAdForCoins}
          style={({ pressed }) => [styles.coinBadge, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinText}>{coins}</Text>
          <Text style={styles.coinUnit}>
            {remainingAds > 0 ? `+15 (${remainingAds}/${DAILY_AD_LIMIT}) 📺` : `DOLDU ✓`}
          </Text>
        </Pressable>
      </View>

      {storeMessage && (
        <View style={styles.msgBanner}>
          <Text style={styles.msgBannerText}>{storeMessage}</Text>
        </View>
      )}

      <View style={styles.tabs}>
        {([
          ["equipment", "EKİPMAN", "#3EE8B5"],
          ["cosmetics", "KOZMETİK", "#C084FC"],
        ] as const).map(([tab, label, activeColor]) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => { triggerHapticSelection(); setActiveTab(tab); }}
              style={[
                styles.tab,
                isActive && { backgroundColor: activeColor, borderColor: activeColor }
              ]}
            >
              <Text style={[styles.tabText, isActive && { color: tab === "cosmetics" ? "#293541" : "#293541" }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.storeList}>
        {activeTab === "equipment" && <>
        {/* Daily Login Reward Chest Card (if ready) */}
        {hasClaimableDailyReward && (
          <View style={styles.dailyRewardChestCard}>
            <View style={styles.dailyChestIconCircle}>
              <Text style={{ fontSize: 32 }}>🎁</Text>
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.dailyChestKicker}>GÜNLÜK GİRİŞ HEDİYESİ</Text>
                <View style={styles.dailyChestBadge}>
                  <Text style={styles.dailyChestBadgeText}>HAZIR!</Text>
                </View>
              </View>
              <Text style={styles.dailyChestTitle}>Günün Giriş Sandığını Aç</Text>
              <Text style={styles.dailyChestDesc}>
                Bugünkü hediyeni alarak serini koru, Çip ve bonus XP kazan!
              </Text>
            </View>
            <Pressable
              onPress={() => {
                triggerHapticSuccess();
                gameSfx.victory();
                onClaimDailyReward?.();
              }}
              style={({ pressed }) => [styles.dailyChestBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.dailyChestBtnText}>ÖDÜLÜ AL</Text>
            </Pressable>
          </View>
        )}

        {/* Rewarded Ad Free Coins */}
        <View style={[styles.adBannerCard, remainingAds <= 0 && { borderColor: "#DCE1D7", opacity: 0.75 }]}>
          <View style={[styles.adIconCircle, remainingAds <= 0 && { borderColor: "#DCE1D7", backgroundColor: "rgba(143,186,171,0.1)" }]}>
            <Text style={{ fontSize: 24 }}>{remainingAds <= 0 ? "✓" : "📺"}</Text>
          </View>
          <View style={{ flex: 1, marginRight: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[styles.adBannerKicker, remainingAds <= 0 && { color: "#293541" }]}>
                {remainingAds <= 0 ? "GÜNLÜK HAK DOLDU" : "REKLAM İZLE & KAZAN"}
              </Text>
              <View style={[styles.adFreeBadge, remainingAds <= 0 && { backgroundColor: "rgba(143,186,171,0.2)" }]}>
                <Text style={[styles.adFreeText, remainingAds <= 0 && { color: "#293541" }]}>
                  {remainingAds <= 0 ? "TAMAMLANDI" : `${remainingAds}/${DAILY_AD_LIMIT} HAK`}
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
            onPress={handleWatchAdForCoins}
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

          const currentLives = progress ? getCalculatedLives(progress).lives : 5;
          const isLivesFull = isLives && currentLives >= MAX_LIVES;
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
                      <Text style={[styles.inventoryCountText, { color: "#1daa51" }]}>Can: {currentLives}/5</Text>
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
                onPress={() => handleSpendChips(item)}
                style={({ pressed }) => [
                  styles.chipBuyButton,
                  !canAfford && styles.chipBuyButtonDisabled,
                  isLivesFull && styles.chipBuyButtonFull,
                  pressed && !isDisabled && { opacity: 0.8 }
                ]}
              >
                {isLivesFull ? (
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 }}>
                    <Text style={{ color: "#349d5a", fontSize: 12, fontWeight: "900" }}>✓</Text>
                    <Text style={styles.chipBuyButtonFullText}>DOLU</Text>
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

        </>}

        {activeTab === "cosmetics" && <>
          <View style={styles.tabIntro}>
            <Text style={styles.tabIntroTitle}>PROFİL SİNYALİNİ KUR</Text>
            <Text style={styles.tabIntroText}>Özel avatar çerçevesi, zafer efekti ve neon tahta görünümlerini donan. Arenada tarzını yansıt!</Text>
          </View>

          {/* 1. Profil Çerçeveleri */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitleHeader}>✨ PROFİL ÇERÇEVELERİ</Text>
            <Text style={styles.sectionSubHeader}>SİNYAL VİTRİNİ</Text>
          </View>
          <View style={styles.cosmeticGrid}>
            {PROFILE_FRAMES.map(([id, label, color, cost]) => {
              const owned = Boolean(progress?.ownedFrames?.[id]) || cost === 0;
              const isSelected = progress?.selectedFrame === id;
              const isSignal = id === "signal";
              const isNeon = id === "neon";
              const isChrome = id === "chrome";
              const isGold = id === "gold";
              const avatarEmoji = isSignal ? "📡" : isNeon ? "🔮" : isChrome ? "💎" : isGold ? "👑" : "💖";
              const avatarBg = isSignal ? "#F0F5ED" : isNeon ? "#EDF4FC" : isChrome ? "#EDF4FC" : isGold ? "#FFF0E8" : "#FFF0E8";

              return (
                <Pressable
                  key={id}
                  onPress={() => handleCosmeticPress("frame", id, label, color, cost, owned, onSelectFrame)}
                  style={({ pressed }) => [
                    styles.cosmeticCard,
                    isSelected && styles.cosmeticCardSelected,
                    { borderColor: isSelected ? color : "#DCE1D7" },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {/* Avatar halka önizleme (Üretilen Görsel) */}
                  <View style={[styles.cosmeticRing, { borderColor: color, shadowColor: color, overflow: "hidden" }]}>
                    {FRAME_IMAGES[id] ? (
                      <Image source={FRAME_IMAGES[id]} style={{ width: "100%", height: "100%", borderRadius: 24 }} resizeMode="cover" />
                    ) : (
                      <View style={[styles.cosmeticRingInner, { backgroundColor: avatarBg }]}>
                        <Text style={{ fontSize: 22 }}>{avatarEmoji}</Text>
                      </View>
                    )}
                  </View>

                  <Text numberOfLines={1} style={[styles.cosmeticCardName, { color }]}>{label}</Text>

                  <View style={[styles.cosmeticCardBadge,
                    isSelected ? { backgroundColor: color } :
                    owned ? styles.badgeOwned : styles.badgeCost
                  ]}>
                    <Text style={[styles.cosmeticBadgeText, isSelected && { color: "#293541" }]}>
                      {isSelected ? "✓ SEÇİLİ" : owned ? "KULLAN" : `🪙 ${cost}`}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* 2. Zafer Efektleri */}
          <View style={[styles.sectionHead, { marginTop: 18 }]}>
            <Text style={styles.sectionTitleHeader}>💥 ZAFER VE KUTLAMA EFEKTLERİ</Text>
            <Text style={styles.sectionSubHeader}>BİTİRİŞ PATLAMASI</Text>
          </View>
          <View style={styles.cosmeticGrid}>
            {VICTORY_EFFECTS.map(([id, label, glyph, cost, imageKey]) => {
              const owned = Boolean(progress?.ownedVictoryEffects?.[id]) || cost === 0;
              const isSelected = progress?.selectedVictoryEffect === id;

              const VICTORY_META: Record<string, { color: string; emoji: string }> = {
                pulse: { color: "#2a9c7a", emoji: "🌊" },
                glitch: { color: "#8c7540", emoji: "💻" },
                flare: { color: "#cb5e12", emoji: "💥" },
                lightning: { color: "#967a0d", emoji: "⚡" },
                fireworks: { color: "#ff2a85", emoji: "🎆" },
              };
              const meta = VICTORY_META[id] || { color: "#98732c", emoji: glyph || "🔥" };
              const themeColor = meta.color;

              return (
                <Pressable
                  key={id}
                  onPress={() => handleCosmeticPress("effect", id, label, themeColor, cost, owned, onSelectVictoryEffect)}
                  style={({ pressed }) => [
                    styles.cosmeticCard,
                    isSelected && styles.cosmeticCardSelected,
                    { borderColor: isSelected ? themeColor : "#DCE1D7" },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {/* Efekt önizleme kutusu (3D Üretilen Görsel) */}
                  <View style={[styles.cosmeticEffectBox, {
                    borderColor: `${themeColor}70`,
                    backgroundColor: `${themeColor}12`,
                    overflow: "hidden"
                  }]}>
                    {imageKey && STORE_ASSETS[imageKey] ? (
                      <Image source={STORE_ASSETS[imageKey]} style={{ width: "100%", height: "100%", borderRadius: 12 }} resizeMode="cover" />
                    ) : (
                      <Text style={{ fontSize: 28 }}>{meta.emoji}</Text>
                    )}
                    <View style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
                      backgroundColor: themeColor, opacity: 0.5,
                      borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
                    }} />
                  </View>

                  <Text numberOfLines={1} style={[styles.cosmeticCardName, { color: themeColor }]}>{label}</Text>

                  <View style={[styles.cosmeticCardBadge,
                    isSelected ? { backgroundColor: themeColor } :
                    owned ? styles.badgeOwned : styles.badgeCost
                  ]}>
                    <Text style={[styles.cosmeticBadgeText, isSelected && { color: "#293541" }]}>
                      {isSelected ? "✓ SEÇİLİ" : owned ? "KULLAN" : `🪙 ${cost}`}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* 3. Tahta Görünümleri */}
          <View style={[styles.sectionHead, { marginTop: 18 }]}>
            <Text style={styles.sectionTitleHeader}>🌌 SİBER TAHTA KAPLAMALARI</Text>
            <Text style={styles.sectionSubHeader}>MATRİS TASARIMI</Text>
          </View>
          <View style={styles.cosmeticGrid}>
            {BOARD_SKINS.map(([id, label, color, cost, imageKey]) => {
              const owned = Boolean(progress?.ownedBoardSkins?.[id]) || cost === 0;
              const isSelected = progress?.selectedBoardSkin === id;
              const isGrid = id === "grid";
              const isNight = id === "night";

              return (
                <Pressable
                  key={id}
                  onPress={() => handleCosmeticPress("board", id, label, color, cost, owned, onSelectBoardSkin)}
                  style={({ pressed }) => [
                    styles.cosmeticCard,
                    isSelected && styles.cosmeticCardSelected,
                    { borderColor: isSelected ? color : "#DCE1D7" },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {/* Realistic Mini Board Matrix View (3D Üretilen Görsel) */}
                  <View style={[styles.realisticBoardWrap, { borderColor: color, backgroundColor: isGrid ? "#EDF4FC" : isNight ? "#EDF4FC" : "#FFF0E8", overflow: "hidden" }]}>
                    {imageKey && STORE_ASSETS[imageKey] ? (
                      <Image source={STORE_ASSETS[imageKey]} style={{ width: "100%", height: "100%", borderRadius: 12 }} resizeMode="cover" />
                    ) : (
                      <View style={styles.miniBoardGrid}>
                        <View style={[styles.miniCell, { borderColor: `${color}60`, backgroundColor: `${color}20` }]}>
                          <Text style={[styles.miniCellText, { color }]}>K</Text>
                        </View>
                        <View style={[styles.miniCell, { borderColor: `${color}60`, backgroundColor: `${color}35` }]}>
                          <Text style={[styles.miniCellText, { color }]}>P</Text>
                        </View>
                        <View style={[styles.miniCell, { borderColor: `${color}60`, backgroundColor: `${color}20` }]}>
                          <Text style={[styles.miniCellText, { color }]}>⚡</Text>
                        </View>
                        <View style={[styles.miniCell, { borderColor: `${color}60`, backgroundColor: `${color}50` }]}>
                          <Text style={[styles.miniCellText, { color: "#293541" }]}>✦</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <Text numberOfLines={1} style={[styles.cosmeticCardName, { color }]}>{label}</Text>
                  <View style={[styles.cosmeticCardBadge, isSelected ? { backgroundColor: color } : owned ? styles.badgeOwned : styles.badgeCost]}>
                    <Text style={[styles.cosmeticBadgeText, isSelected && { color: "#293541" }]}>
                      {isSelected ? "✓ SEÇİLİ" : owned ? "KULLAN" : `🪙 ${cost}`}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>}


      </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 185 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  backButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#F0F5ED", borderWidth: 1, borderColor: "#DCE1D7", alignItems: "center", justifyContent: "center" },
  backText: { color: "#293541", fontSize: 26, lineHeight: 28 },
  headerTitleWrap: { flex: 1, marginLeft: 12, marginRight: 8 },
  headerKicker: { color: "#8c763b", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  headerTitle: { color: "#293541", fontSize: 26, fontWeight: "900", marginTop: 2, letterSpacing: 0.3, textShadowColor: "transparent", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 0 },
  coinBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0F5ED", paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14, borderWidth: 1.5, borderColor: "#DCE1D7", gap: 4, shadowColor: "#293541", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  coinIcon: { fontSize: 14 },
  coinText: { color: "#98732c", fontSize: 14, fontWeight: "900" },
  coinUnit: { color: "#293541", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },

  msgBanner: { backgroundColor: "#F0F5ED", padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "#DCE1D7", marginBottom: 12 },
  msgBannerText: { color: "#2a9c7a", fontSize: 11, fontWeight: "800", textAlign: "center" },

  storeList: { gap: 10 },
  tabs: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 4, marginBottom: 14, borderWidth: 1.5, borderColor: "#DCE1D7" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: "#FFD66E" },
  tabText: { color: "#293541", fontSize: 12, fontWeight: "900", letterSpacing: 0.3 },
  tabTextActive: { color: "#293541" },
  tabIntro: { padding: 14, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#DCE1D7" },
  tabIntroTitle: { color: "#293541", fontSize: 13, fontWeight: "900" },
  tabIntroText: { color: "#293541", fontSize: 10, marginTop: 4 },
  cosmeticGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%" },

  /* Kompakt Grid Kartlar */
  cosmeticCard: {
    width: "31%",
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cosmeticCardSelected: {
    backgroundColor: "#EBFBFA",
    borderWidth: 2,
  },
  cosmeticRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cosmeticRingInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  cosmeticCornerDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  cosmeticEffectBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  cosmeticCardName: {
    fontSize: 10.5,
    fontWeight: "900",
    textAlign: "center",
    marginVertical: 4,
  },
  cosmeticCardBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },



  /* Tahta Görünümleri */
  realisticBoardWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  miniBoardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 40,
    height: 40,
    gap: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCell: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCellText: {
    fontSize: 8,
    fontWeight: "900",
  },

  cosmeticName: { color: "#293541", fontSize: 10, fontWeight: "900", textAlign: "center", marginBottom: 4 },
  cosmeticBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeOwned: {
    backgroundColor: "rgba(62, 232, 181, 0.15)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  badgeCost: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  cosmeticBadgeText: {
    color: "#293541",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 2 },
  sectionTitleHeader: { color: "#293541", fontSize: 9.5, fontWeight: "900", letterSpacing: 0.5 },
  sectionSubHeader: { color: "#293541", fontSize: 8, fontWeight: "900" },
  dailyRewardChestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F5ED",
    padding: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#DCE1D7",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  dailyChestIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 194, 74, 0.15)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dailyChestKicker: {
    color: "#98732c",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  dailyChestBadge: {
    backgroundColor: "rgba(255, 194, 74, 0.25)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  dailyChestBadgeText: {
    color: "#98732c",
    fontSize: 7.5,
    fontWeight: "900",
  },
  dailyChestTitle: {
    color: "#293541",
    fontSize: 13.5,
    fontWeight: "900",
    marginTop: 2,
    textShadowColor: "transparent",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  dailyChestDesc: {
    color: "#293541",
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  dailyChestBtn: {
    backgroundColor: "#ffe5b3",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dailyChestBtnText: {
    color: "#293541",
    fontSize: 11.5,
    fontWeight: "900",
  },

  adBannerCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", padding: 14, borderRadius: 20, borderWidth: 1.5, borderColor: "#DCE1D7", shadowColor: "#293541", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  adIconCircle: { width: 44, height: 44, borderRadius: 15, backgroundColor: "rgba(62, 232, 181, 0.12)", borderWidth: 1, borderColor: "#DCE1D7", alignItems: "center", justifyContent: "center", marginRight: 12 },
  adBannerKicker: { color: "#2a9c7a", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  adFreeBadge: { backgroundColor: "rgba(62, 232, 181, 0.2)", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 },
  adFreeText: { color: "#2a9c7a", fontSize: 7, fontWeight: "900" },
  adBannerTitle: { color: "#293541", fontSize: 13, fontWeight: "900", marginTop: 2, textShadowColor: "transparent", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 0 },
  adBannerDesc: { color: "#293541", fontSize: 10, marginTop: 2 },
  adButton: { backgroundColor: "#FFD66E", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignItems: "center", justifyContent: "center", minWidth: 64 },
  adButtonText: { color: "#293541", fontSize: 12, fontWeight: "900" },

  productCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: "#DCE1D7", shadowColor: "#293541", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  productIconWrap: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#F7F5EE", borderWidth: 1.5, borderColor: "#DCE1D7", alignItems: "center", justifyContent: "center", marginRight: 12, position: "relative" },
  productEmblemDot: { position: "absolute", top: 3, right: 3, width: 6, height: 6, borderRadius: 3 },
  productIcon: { fontSize: 24 },
  productInfo: { flex: 1, marginRight: 10 },
  productName: { color: "#293541", fontSize: 13, fontWeight: "900", textShadowColor: "transparent", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 0 },
  inventoryCountBadge: {
    backgroundColor: "rgba(96, 165, 250, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  inventoryCountText: {
    color: "#4a7ebf",
    fontSize: 8.5,
    fontWeight: "900",
  },
  productDesc: { color: "#293541", fontSize: 10, marginTop: 2, lineHeight: 14 },

  chipBuyButton: { backgroundColor: "#FFD66E", paddingHorizontal: 14, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", minWidth: 76, shadowColor: "#293541", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  chipBuyButtonDisabled: { backgroundColor: "#F1F3EE", borderWidth: 1, borderColor: "#DCE1D7", shadowOpacity: 0, elevation: 0 },
  chipBuyButtonOwned: { backgroundColor: "rgba(62, 232, 181, 0.12)", borderWidth: 1, borderColor: "#DCE1D7", shadowOpacity: 0, elevation: 0 },
  chipBuyButtonFull: { backgroundColor: "#F1F3EE", borderWidth: 1.5, borderColor: "#DCE1D7", shadowOpacity: 0, elevation: 0 },
  chipBuyButtonFullText: { color: "#349d5a", fontSize: 11.5, fontWeight: "900", letterSpacing: 0.5 },
  chipBuyButtonText: { color: "#293541", fontSize: 11.5, fontWeight: "900" },

  /* Satın Alma Onay Modalı Stilleri */
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(35,48,59,0.42)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    alignItems: "center",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(62, 232, 181, 0.12)",
    borderWidth: 2,
    borderColor: "#DCE1D7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBadgeIcon: { fontSize: 28 },
  confirmKicker: {
    color: "#8c7540",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  confirmTitle: {
    color: "#293541",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 10,
    textShadowColor: "transparent",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  confirmCostPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 194, 74, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    marginBottom: 12,
  },
  confirmCostLabel: { color: "#293541", fontSize: 9.5, fontWeight: "900", letterSpacing: 0.5 },
  confirmCostValue: { color: "#987c00", fontSize: 13, fontWeight: "900" },
  confirmDesc: {
    color: "#293541",
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: "center",
    marginBottom: 14,
  },
  confirmBalanceInfo: {
    width: "100%",
    backgroundColor: "#F0F5ED",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    marginBottom: 18,
    alignItems: "center",
  },
  confirmBalanceText: {
    color: "#293541",
    fontSize: 10.5,
    fontWeight: "700",
  },
  confirmActionsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F0F5ED",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCancelText: {
    color: "#293541",
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  confirmAcceptBtn: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#aef5e0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmAcceptText: {
    color: "#293541",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
