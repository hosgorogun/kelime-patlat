import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DIGITAL_STORE_PRODUCTS, monetizationManager, type ProductItem } from "@/shared/monetization";
import { gameSfx, triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { type PlayerProgress } from "@/shared/progression";
import { type ChipEquipmentItem, CHIP_EQUIPMENT_ITEMS } from "@/shared/store-items";

export type { ChipEquipmentItem };
export { CHIP_EQUIPMENT_ITEMS };

type StoreTab = "equipment" | "cosmetics" | "chips";

const PROFILE_FRAMES = [
  ["signal", "SİNYAL", "#00F5D4", 0],
  ["neon", "NEON", "#A78BFA", 140],
  ["chrome", "KROM", "#CBD5E1", 220],
] as const;
const VICTORY_EFFECTS = [
  ["pulse", "PULSE", "✦", 0],
  ["glitch", "GLITCH", "▦", 160],
  ["flare", "FLARE", "✹", 240],
] as const;
const BOARD_SKINS = [
  ["grid", "MATRİS", "#00F5D4", 0],
  ["night", "GECE SİNYALİ", "#818CF8", 120],
  ["ember", "KOR HATTI", "#FB7185", 180],
] as const;

export function CyberStore({
  coins,
  progress,
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
  onBuyCoins: (amount: number) => void;
  onBuyRadar: () => void;
  onSpendCoins?: (item: ChipEquipmentItem) => void;
  onSelectFrame?: (frameId: string) => void;
  onSelectVictoryEffect?: (effectId: string) => void;
  onBuyCosmetic?: (kind: "avatar" | "frame" | "effect" | "board", id: string, cost: number) => boolean;
  onSelectBoardSkin?: (skinId: string) => void;
  onBack: () => void;
}) {
  const [storeMessage, setStoreMessage] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<StoreTab>("equipment");

  const handlePurchase = async (product: ProductItem) => {
    triggerHapticSelection();
    setBuyingId(product.id);
    const res = await monetizationManager.purchaseProduct(product.id);
    setBuyingId(null);
    if (res.success && res.product) {
      triggerHapticSuccess();
      if (res.product.coins > 0) onBuyCoins(res.product.coins);
      if (res.product.unlimitedRadar) onBuyRadar();
    } else {
      setStoreMessage(res.error ?? "Satın alma şu anda kullanılamıyor.");
      setTimeout(() => setStoreMessage(null), 3500);
    }
  };

  const handleSpendChips = (item: ChipEquipmentItem) => {
    if (coins < item.cost) {
      triggerHapticSelection();
      setStoreMessage(`Yetersiz Çip! Bu ekipman için ${item.cost} siber çip gerekiyor.`);
      setTimeout(() => setStoreMessage(null), 3500);
      return;
    }
    triggerHapticSuccess();
    gameSfx.victory();
    onSpendCoins?.(item);
    setStoreMessage(`Tebrikler! ${item.name} başarıyla envanterine eklendi! 🎉`);
    setTimeout(() => setStoreMessage(null), 3500);
  };

  const handleWatchAdForCoins = async () => {
    setAdLoading(true);
    triggerHapticSelection();
    await monetizationManager.showRewardedAd(
      "radar_charge",
      () => {
        setAdLoading(false);
        triggerHapticSuccess();
        gameSfx.victory();
        onBuyCoins(10);
        setStoreMessage("Ödül alındı: +10 Siber Çip kazandın! 🪙");
        setTimeout(() => setStoreMessage(null), 3500);
      },
      () => {
        setAdLoading(false);
        triggerHapticSuccess();
        gameSfx.victory();
        onBuyCoins(10);
        setStoreMessage("Sponsorlu reklam izlendi: +10 Siber Çip eklendi! 🪙");
        setTimeout(() => setStoreMessage(null), 3500);
      }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerKicker}>EKİPMAN & BAKİYE MERKEZİ</Text>
          <Text numberOfLines={1} style={styles.headerTitle}>SİBER MAĞAZA</Text>
        </View>
        <View style={styles.coinBadge}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinText}>{coins}</Text>
          <Text style={styles.coinUnit}>ÇİP</Text>
        </View>
      </View>

      {storeMessage && (
        <View style={styles.msgBanner}>
          <Text style={styles.msgBannerText}>{storeMessage}</Text>
        </View>
      )}

      <View style={styles.tabs}>
        {([
          ["equipment", "EKİPMAN"],
          ["cosmetics", "KOZMETİK"],
          ["chips", "ÇİP YÜKLE"],
        ] as const).map(([tab, label]) => (
          <Pressable key={tab} onPress={() => { triggerHapticSelection(); setActiveTab(tab); }} style={[styles.tab, activeTab === tab && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.storeList}>
        {activeTab === "equipment" && <>
        {/* Rewarded Ad Free Coins */}
        <View style={styles.adBannerCard}>
          <View style={styles.adIconCircle}>
            <Text style={{ fontSize: 24 }}>📺</Text>
          </View>
          <View style={{ flex: 1, marginRight: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.adBannerKicker}>GÜNLÜK HEDİYE</Text>
              <View style={styles.adFreeBadge}><Text style={styles.adFreeText}>ÜCRETSİZ</Text></View>
            </View>
            <Text style={styles.adBannerTitle}>Ücretsiz Günlük Çip Ödülü</Text>
            <Text style={styles.adBannerDesc}>Reklam izle ve anında +10 Siber Çip bonusunu hesabına aktar!</Text>
          </View>
          <Pressable
            disabled={adLoading}
            onPress={handleWatchAdForCoins}
            style={({ pressed }) => [styles.adButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.adButtonText}>{adLoading ? "..." : "AL (+10)"}</Text>
          </Pressable>
        </View>

        {/* In-Game Chip Equipment Section */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitleHeader}>🪙 ÇİPLERİNLE ALABİLECEĞİN EKİPMANLAR</Text>
          <Text style={styles.sectionSubHeader}>OYUN İÇİ AVANTAJ</Text>
        </View>

        {CHIP_EQUIPMENT_ITEMS.map((item) => {
          const isOwned = item.rewardType === "avatar" && Boolean(progress?.purchasedAvatars?.crown || (progress?.wins && progress.wins >= 5) || progress?.selectedAvatar === "crown");
          const canAfford = coins >= item.cost;
          const isDisabled = isOwned || !canAfford;
          const isRadar = item.rewardType === "radar";
          const isShield = item.rewardType === "shield";
          const isXp = item.rewardType === "xp";
          const isCrown = item.rewardType === "avatar";

          const accentColor = isRadar ? "#00F5D4" : isShield ? "#60A5FA" : isXp ? "#F59E0B" : "#EC4899";

          return (
            <View key={item.id} style={[styles.productCard, { borderColor: `${accentColor}40` }]}>
              {/* Realistic Cyber Emblem */}
              <View style={[styles.productIconWrap, { borderColor: accentColor, backgroundColor: `${accentColor}18` }]}>
                <Text style={styles.productIcon}>{item.icon}</Text>
                <View style={[styles.productEmblemDot, { backgroundColor: accentColor }]} />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDesc}>{item.description}</Text>
              </View>
              <Pressable
                disabled={isDisabled}
                onPress={() => handleSpendChips(item)}
                style={({ pressed }) => [
                  styles.chipBuyButton,
                  isOwned && styles.chipBuyButtonOwned,
                  !isOwned && !canAfford && styles.chipBuyButtonDisabled,
                  pressed && !isDisabled && { opacity: 0.8 }
                ]}
              >
                <Text style={[styles.chipBuyButtonText, isOwned && { color: "#00F5D4" }, !isOwned && !canAfford && { color: "#8E82A8" }]}>
                  {isOwned ? "✓ AÇIK" : `🪙 ${item.cost}`}
                </Text>
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
              const owned = Boolean(progress?.ownedFrames?.[id]);
              const isSelected = progress?.selectedFrame === id;
              const isSignal = id === "signal";
              const isNeon = id === "neon";
              const avatarEmoji = isSignal ? "📡" : isNeon ? "🔮" : "💎";
              const avatarBg = isSignal ? "#071E1A" : isNeon ? "#1A0F35" : "#0F1A2B";

              return (
                <Pressable
                  key={id}
                  onPress={() => (owned ? onSelectFrame?.(id) : onBuyCosmetic?.("frame", id, cost))}
                  style={({ pressed }) => [
                    styles.cosmeticCard,
                    { borderColor: isSelected ? color : "rgba(255,255,255,0.12)" },
                    isSelected && { backgroundColor: `${color}12` },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {/* Avatar halka önizleme */}
                  <View style={[styles.cosmeticRing, { borderColor: color, shadowColor: color }]}>
                    <View style={[styles.cosmeticRingInner, { backgroundColor: avatarBg }]}>
                      <Text style={{ fontSize: 22 }}>{avatarEmoji}</Text>
                    </View>
                    <View style={[styles.cosmeticCornerDot, { backgroundColor: color, top: 2, left: 2 }]} />
                    <View style={[styles.cosmeticCornerDot, { backgroundColor: color, top: 2, right: 2 }]} />
                    <View style={[styles.cosmeticCornerDot, { backgroundColor: color, bottom: 2, left: 2 }]} />
                    <View style={[styles.cosmeticCornerDot, { backgroundColor: color, bottom: 2, right: 2 }]} />
                  </View>

                  <Text numberOfLines={1} style={[styles.cosmeticCardName, { color }]}>{label}</Text>

                  <View style={[styles.cosmeticCardBadge,
                    isSelected ? { backgroundColor: color } :
                    owned ? styles.badgeOwned : styles.badgeCost
                  ]}>
                    <Text style={[styles.cosmeticBadgeText, isSelected && { color: "#0B071E" }]}>
                      {isSelected ? "✓ SEÇİLİ" : owned ? "KULLAN" : cost === 0 ? "ÜCRETSİZ" : `🪙 ${cost}`}
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
            {VICTORY_EFFECTS.map(([id, label, , cost]) => {
              const owned = Boolean(progress?.ownedVictoryEffects?.[id]);
              const isSelected = progress?.selectedVictoryEffect === id;
              const isPulse = id === "pulse";
              const isGlitch = id === "glitch";
              const themeColor = isPulse ? "#00F5D4" : isGlitch ? "#A78BFA" : "#FFC24A";
              const centerEmoji = isPulse ? "🌊" : isGlitch ? "💻" : "🔥";

              return (
                <Pressable
                  key={id}
                  onPress={() => (owned ? onSelectVictoryEffect?.(id) : onBuyCosmetic?.("effect", id, cost))}
                  style={({ pressed }) => [
                    styles.cosmeticCard,
                    { borderColor: isSelected ? themeColor : "rgba(255,255,255,0.12)" },
                    isSelected && { backgroundColor: `${themeColor}10` },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {/* Efekt önizleme kutusu */}
                  <View style={[styles.cosmeticEffectBox, {
                    borderColor: `${themeColor}70`,
                    backgroundColor: `${themeColor}12`,
                  }]}>
                    <Text style={{ fontSize: 28 }}>{centerEmoji}</Text>
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
                    <Text style={[styles.cosmeticBadgeText, isSelected && { color: "#0B071E" }]}>
                      {isSelected ? "✓ SEÇİLİ" : owned ? "KULLAN" : cost === 0 ? "ÜCRETSİZ" : `🪙 ${cost}`}
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
            {BOARD_SKINS.map(([id, label, color, cost]) => {
              const owned = Boolean(progress?.ownedBoardSkins?.[id]);
              const isSelected = progress?.selectedBoardSkin === id;
              const isGrid = id === "grid";
              const isNight = id === "night";
              const isEmber = id === "ember";

              return (
                <Pressable
                  key={id}
                  onPress={() => (owned ? onSelectBoardSkin?.(id) : onBuyCosmetic?.("board", id, cost))}
                  style={({ pressed }) => [
                    styles.frameCard,
                    {
                      backgroundColor: isSelected ? "rgba(35, 26, 65, 0.95)" : "rgba(27, 21, 51, 0.9)",
                      borderColor: isSelected ? color : "rgba(255, 255, 255, 0.12)",
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {/* Realistic Mini Board Matrix View */}
                  <View style={[styles.realisticBoardWrap, { borderColor: color, backgroundColor: isGrid ? "#0A1F26" : isNight ? "#141539" : "#2B111F" }]}>
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
                        <Text style={[styles.miniCellText, { color: "#FFF" }]}>✦</Text>
                      </View>
                    </View>
                  </View>

                  <Text numberOfLines={1} style={styles.cosmeticName}>{label}</Text>
                  <View style={[styles.cosmeticBadge, isSelected ? { backgroundColor: color } : owned ? styles.badgeOwned : styles.badgeCost]}>
                    <Text style={[styles.cosmeticBadgeText, isSelected && { color: "#0B071E" }]}>
                      {isSelected ? "✓ SEÇİLİ" : owned ? "KULLAN" : `🪙 ${cost}`}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>}

        {activeTab === "chips" && <>
        {/* Real Money / IAP Top Up */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitleHeader}>💳 ÇİP YÜKLEME (MAĞAZA PAKETLERİ)</Text>
          <Text style={styles.sectionSubHeader}>ÖZEL FIRSATLAR</Text>
        </View>

        {DIGITAL_STORE_PRODUCTS.map((prod) => (
          <View key={prod.id} style={[styles.productCard, styles.iapCard]}>
            <View style={[styles.productIconWrap, styles.iapIconWrap]}>
              <Text style={styles.productIcon}>{prod.type === "radar_pack" ? "👁" : "🪙"}</Text>
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{prod.name}</Text>
              <Text style={styles.productDesc}>{prod.description}</Text>
            </View>
            <Pressable
              disabled={buyingId === prod.id}
              onPress={() => handlePurchase(prod)}
              style={({ pressed }) => [styles.buyButton, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.buyButtonText}>
                {buyingId === prod.id ? "..." : prod.priceText}
              </Text>
            </Pressable>
          </View>
        ))}
        </>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 0, paddingTop: 4, paddingBottom: 136 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  backButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#1F1936", borderWidth: 1, borderColor: "rgba(124, 92, 246, 0.25)", alignItems: "center", justifyContent: "center" },
  backText: { color: "#FFF", fontSize: 26, lineHeight: 28 },
  headerTitleWrap: { flex: 1, marginLeft: 12, marginRight: 8 },
  headerKicker: { color: "#7C5CF6", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "900", marginTop: 2, letterSpacing: 0.3 },
  coinBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(39, 30, 68, 0.95)", paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14, borderWidth: 1.5, borderColor: "#FFC24A", gap: 4 },
  coinIcon: { fontSize: 14 },
  coinText: { color: "#FFC24A", fontSize: 14, fontWeight: "900" },
  coinUnit: { color: "#E9D5FF", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },

  msgBanner: { backgroundColor: "#271E44", padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "#00F5D4", marginBottom: 12 },
  msgBannerText: { color: "#00F5D4", fontSize: 11, fontWeight: "800", textAlign: "center" },

  storeList: { gap: 10 },
  tabs: { flexDirection: "row", backgroundColor: "#17112D", borderRadius: 14, padding: 4, marginBottom: 14, borderWidth: 1, borderColor: "#30264F" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: "#00F5D4" },
  tabText: { color: "#8E82A8", fontSize: 9, fontWeight: "900", letterSpacing: 0.3 },
  tabTextActive: { color: "#0E0922" },
  tabIntro: { padding: 14, borderRadius: 16, backgroundColor: "#1B1533", borderWidth: 1, borderColor: "#493B70" },
  tabIntroTitle: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  tabIntroText: { color: "#A49BBF", fontSize: 10, marginTop: 4 },
  cosmeticGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%" },

  /* Kompakt Grid Kartlar */
  cosmeticCard: {
    flex: 1,
    minWidth: 95,
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 10,
    backgroundColor: "#16102B",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cosmeticRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
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

  /* Yeni: Profil Çerçeve Satır Kartları */
  frameListCol: { flexDirection: "column", gap: 10 },
  frameRowCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: "#16102B",
    padding: 12,
    gap: 0,
  },
  framePreviewRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
    flexShrink: 0,
  },
  framePreviewInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  frameCornerDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  frameRowName: { fontSize: 13, fontWeight: "900", letterSpacing: 0.5 },
  frameRowDesc: { color: "#8B82A4", fontSize: 9.5, lineHeight: 14, flexShrink: 1 },
  frameGlyphChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  frameActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 68,
    marginLeft: 8,
    flexShrink: 0,
  },
  frameActionText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },
  selectedPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  selectedPillText: { color: "#0B132B", fontSize: 7.5, fontWeight: "900" },

  /* Yeni: Zafer Efekti Satır Kartları */
  effectGridCol: { flexDirection: "column", gap: 10 },
  effectRowCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: "#16102B",
    padding: 12,
  },
  effectPreviewBox: {
    width: 62,
    height: 62,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
  },
  effectPreviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  effectPreviewChar: { fontSize: 11, textAlign: "center", width: 14, height: 14, lineHeight: 14 },
  effectGlowRing: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
  },
  effectTypePill: {
    marginTop: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  effectTypePillText: { fontSize: 7.5, fontWeight: "900", letterSpacing: 0.4 },

  /* Eski stiller — hâlâ tahta görünümü için kullanılıyor */
  frameCard: {
    width: "31.8%",
    minHeight: 124,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 10,
    backgroundColor: "rgba(27, 21, 51, 0.9)",
    alignItems: "center",
    justifyContent: "space-between",
  },
  realisticFrameWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 6,
  },
  frameWrapSignal: { borderColor: "#00F5D4" },
  frameWrapNeon: { borderColor: "#A78BFA" },
  frameWrapChrome: { borderColor: "#E2E8F0" },
  innerAvatarCore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  innerAvatarGlyph: { fontSize: 16, fontWeight: "900" },
  frameAccentDot: { position: "absolute", width: 6, height: 6, borderRadius: 3 },

  effectRow: { flexDirection: "row", gap: 8 },
  effectCard: {
    flex: 1,
    minHeight: 124,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 10,
    backgroundColor: "rgba(27, 21, 51, 0.9)",
    alignItems: "center",
    justifyContent: "space-between",
  },
  realisticEffectWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 6,
  },
  effectWrapPulse: { borderColor: "#00F5D4" },
  effectWrapGlitch: { borderColor: "#A78BFA" },
  effectWrapFlare: { borderColor: "#FFC24A" },
  realisticEffectGlyph: { fontSize: 22, fontWeight: "900" },
  effectAuraRing: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderStyle: "dashed",
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

  cosmeticName: { color: "#FFF", fontSize: 10, fontWeight: "900", textAlign: "center", marginBottom: 4 },
  cosmeticBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeOwned: {
    backgroundColor: "rgba(0, 245, 212, 0.15)",
    borderWidth: 1,
    borderColor: "#00F5D4",
  },
  badgeCost: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  cosmeticBadgeText: {
    color: "#E2D9F3",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 2 },
  sectionTitleHeader: { color: "#E9D5FF", fontSize: 9.5, fontWeight: "900", letterSpacing: 0.8 },
  sectionSubHeader: { color: "#766D89", fontSize: 8, fontWeight: "900" },

  adBannerCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(26, 21, 58, 0.95)", padding: 14, borderRadius: 20, borderWidth: 1.5, borderColor: "#00F5D4" },
  adIconCircle: { width: 44, height: 44, borderRadius: 15, backgroundColor: "rgba(0, 245, 212, 0.12)", borderWidth: 1, borderColor: "#00F5D4", alignItems: "center", justifyContent: "center", marginRight: 12 },
  adBannerKicker: { color: "#00F5D4", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  adFreeBadge: { backgroundColor: "rgba(0, 245, 212, 0.2)", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 },
  adFreeText: { color: "#00F5D4", fontSize: 7, fontWeight: "900" },
  adBannerTitle: { color: "#FFF", fontSize: 13, fontWeight: "900", marginTop: 2 },
  adBannerDesc: { color: "#A49BBF", fontSize: 10, marginTop: 2 },
  adButton: { backgroundColor: "#00F5D4", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignItems: "center", justifyContent: "center", minWidth: 64 },
  adButtonText: { color: "#0E0922", fontSize: 12, fontWeight: "900" },

  productCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(27, 21, 51, 0.9)", padding: 14, borderRadius: 18, borderWidth: 1, borderColor: "#372B5E" },
  iapCard: { borderColor: "rgba(124, 92, 246, 0.35)", backgroundColor: "rgba(25, 18, 48, 0.9)" },
  productIconWrap: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#251C45", borderWidth: 1.5, borderColor: "#4F3C80", alignItems: "center", justifyContent: "center", marginRight: 12, position: "relative" },
  productEmblemDot: { position: "absolute", top: 3, right: 3, width: 6, height: 6, borderRadius: 3 },
  iapIconWrap: { borderColor: "#7C5CF6", backgroundColor: "rgba(124, 92, 246, 0.15)" },
  productIcon: { fontSize: 24 },
  productInfo: { flex: 1, marginRight: 10 },
  productName: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  productDesc: { color: "#A49BBF", fontSize: 10, marginTop: 2, lineHeight: 14 },

  chipBuyButton: { backgroundColor: "#00F5D4", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, alignItems: "center", justifyContent: "center", minWidth: 72, shadowColor: "#00F5D4", shadowOpacity: 0.35, shadowRadius: 6, elevation: 3 },
  chipBuyButtonDisabled: { backgroundColor: "#261E3E", borderWidth: 1, borderColor: "#3D3360", shadowOpacity: 0, elevation: 0 },
  chipBuyButtonOwned: { backgroundColor: "rgba(0, 245, 212, 0.12)", borderWidth: 1, borderColor: "#00F5D4", shadowOpacity: 0, elevation: 0 },
  chipBuyButtonText: { color: "#0B132B", fontSize: 11.5, fontWeight: "900" },

  buyButton: { backgroundColor: "#00F5D4", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, alignItems: "center", justifyContent: "center", minWidth: 72 },
  buyButtonText: { color: "#121025", fontSize: 12, fontWeight: "900" },
});
