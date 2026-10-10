import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, ScrollView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { monetizationManager } from "@/shared/monetization";
import { gameSfx, triggerHapticError, triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { getCalculatedLives, MAX_LIVES, getDayId, type PlayerProgress } from "@/shared/progression";
import { type ChipEquipmentItem, CHIP_EQUIPMENT_ITEMS, PROFILE_FRAMES, VICTORY_EFFECTS, BOARD_SKINS } from "@/shared/store-items";
import { styles } from "./cyber-store.styles";
import { StorePurchaseModal, type ConfirmPurchaseData } from "./store-purchase-modal";
import { StoreEquipmentTab } from "./store-equipment-tab";
import { StoreCosmeticsTab } from "./store-cosmetics-tab";
import { CoinCascadeOverlay } from "@/components/game/coin-cascade";

const DAILY_AD_LIMIT = 3;

export type { ChipEquipmentItem };
export { CHIP_EQUIPMENT_ITEMS, PROFILE_FRAMES, VICTORY_EFFECTS, BOARD_SKINS };

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
  const [confirmPurchase, setConfirmPurchase] = useState<ConfirmPurchaseData | null>(null);
  const [purchaseCascade, setPurchaseCascade] = useState<{ trigger: boolean; icon: string; badgeText?: string }>({
    trigger: false,
    icon: "✨",
  });

  const isProcessingSpendRef = useRef(false);

  const executeSpendChips = async (item: ChipEquipmentItem) => {
    if (isProcessingSpendRef.current) return;
    isProcessingSpendRef.current = true;
    try {
      if (coins < item.cost) {
        triggerHapticError();
        gameSfx.rejected();
        showFeedbackMessage(`Yetersiz Çip! Bu ekipman için ${item.cost} altın çip gerekiyor.`);
        return;
      }
      const success = await onSpendCoins?.(item);
      if (success !== false) {
        triggerHapticSuccess();
        gameSfx.victory();
        setPurchaseCascade({
          trigger: true,
          icon: item.icon || "🎁",
          badgeText: item.name,
        });
        setTimeout(() => setPurchaseCascade({ trigger: false, icon: "✨" }), 1500);
        showFeedbackMessage(`Tebrikler! ${item.name} başarıyla envanterine eklendi! 🎉`);
      } else {
        triggerHapticError();
        gameSfx.rejected();
        showFeedbackMessage(`İşlem gerçekleştirilemedi. Lütfen çip bakiyenizi kontrol edin.`);
      }
    } finally {
      isProcessingSpendRef.current = false;
    }
  };

  const handleSpendChips = (item: ChipEquipmentItem) => {
    if (item.rewardType === "lives" && progress) {
      const calc = getCalculatedLives(progress);
      if (calc.isInfinite) {
        showFeedbackMessage("Sonsuz Can aktif! Ekstra can alamazsın.");
        return;
      }
      if (calc.lives >= MAX_LIVES) {
        showFeedbackMessage("Canların zaten tamamen dolu (5/5).");
        return;
      }
    }

    if (coins < item.cost) {
      triggerHapticError();
      gameSfx.rejected();
      showFeedbackMessage(`Yetersiz Çip! Bu ekipman için ${item.cost} altın çip gerekiyor.`);
      return;
    }

    setConfirmPurchase({
      title: item.name,
      description: item.description,
      cost: item.cost,
      icon: item.icon,
      onConfirm: () => executeSpendChips(item),
    });
  };

  const handleCosmeticPress = async (
    kind: "frame" | "effect" | "board",
    id: string,
    label: string,
    color: string,
    cost: number,
    owned: boolean,
    onEquip?: (id: string) => void
  ) => {
    if (owned) {
      triggerHapticSelection();
      onEquip?.(id);
      showFeedbackMessage(`"${label}" başarıyla donanıldı! ✨`);
      return;
    }

    if (coins < cost) {
      triggerHapticError();
      gameSfx.rejected();
      showFeedbackMessage(`Yetersiz Çip! "${label}" için ${cost} altın çip gerekiyor.`);
      return;
    }

    setConfirmPurchase({
      title: label,
      description: `Bu kozmetik kilidi açıldıktan sonra istediğin zaman profiline donanabilirsin.`,
      cost,
      icon: kind === "frame" ? "✨" : kind === "effect" ? "💥" : "🌌",
      onConfirm: async () => {
        const success = await onBuyCosmetic?.(kind, id, cost);
        if (success !== false) {
          triggerHapticSuccess();
          gameSfx.victory();
          onEquip?.(id);
          setPurchaseCascade({
            trigger: true,
            icon: kind === "frame" ? "✨" : kind === "effect" ? "💥" : "🌌",
            badgeText: label,
          });
          setTimeout(() => setPurchaseCascade({ trigger: false, icon: "✨" }), 1500);
          showFeedbackMessage(`Tebrikler! "${label}" satın alındı ve profiline donanıldı! 🎉`);
        } else {
          triggerHapticError();
          gameSfx.rejected();
          showFeedbackMessage("Satın alma işlemi tamamlanamadı. Bakiyeni kontrol et.");
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
        setAdLoading(false);
        triggerHapticError();
        gameSfx.rejected();
        showFeedbackMessage("Reklam şu anda yüklenemedi. Lütfen daha sonra tekrar dene.");
      }
    );
  };

  return (
    <>
      <StorePurchaseModal
        confirmPurchase={confirmPurchase}
        coins={coins}
        onClose={() => setConfirmPurchase(null)}
      />

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
          <View style={styles.coinBadge}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinText}>{coins}</Text>
          </View>
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
                <Text style={[styles.tabText, isActive && { color: "#293541" }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.storeList}>
          {activeTab === "equipment" && (
            <StoreEquipmentTab
              progress={progress}
              coins={coins}
              remainingAds={remainingAds}
              dailyAdLimit={DAILY_AD_LIMIT}
              adLoading={adLoading}
              onWatchAd={handleWatchAdForCoins}
              onSpendChips={handleSpendChips}
            />
          )}

          {activeTab === "cosmetics" && (
            <StoreCosmeticsTab
              progress={progress}
              onCosmeticPress={handleCosmeticPress}
              onSelectFrame={onSelectFrame}
              onSelectVictoryEffect={onSelectVictoryEffect}
              onSelectBoardSkin={onSelectBoardSkin}
            />
          )}
        </View>
      </ScrollView>

      <CoinCascadeOverlay
        trigger={purchaseCascade.trigger}
        count={12}
        icon={purchaseCascade.icon}
        badgeText={purchaseCascade.badgeText}
      />
    </>
  );
}
