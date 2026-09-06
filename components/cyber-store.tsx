import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DIGITAL_STORE_PRODUCTS, monetizationManager, type ProductItem } from "@/shared/monetization";
import { gameSfx, triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";

export type ChipEquipmentItem = {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  rewardType: "radar" | "shield" | "xp" | "avatar";
};

export const CHIP_EQUIPMENT_ITEMS: ChipEquipmentItem[] = [
  {
    id: "radar_5",
    name: "5x Radar Şifre Çözücü",
    description: "Tüm solo ve günlük oyunlarda kelimelerin baş/son harflerini aydınlatır.",
    cost: 30,
    icon: "👁",
    rewardType: "radar",
  },
  {
    id: "shield_1",
    name: "Seri Kalkanı",
    description: "Bir gün oyuna giremesen bile günlük serini (streak) korur.",
    cost: 50,
    icon: "🛡️",
    rewardType: "shield",
  },
  {
    id: "xp_250",
    name: "Kozmik XP Kapsülü (+250 XP)",
    description: "Sezon sıralamasında anında yükselmeni sağlayan saf XP paketi.",
    cost: 40,
    icon: "⚡",
    rewardType: "xp",
  },
  {
    id: "avatar_crown",
    name: "Özel Taç Avatarı",
    description: "Profilinde ve canlı düellolarda parlayan siber taç unvanı.",
    cost: 100,
    icon: "♕",
    rewardType: "avatar",
  },
];

export function CyberStore({
  coins,
  onBuyCoins,
  onBuyRadar,
  onSpendCoins,
  onBack,
}: {
  coins: number;
  onBuyCoins: (amount: number) => void;
  onBuyRadar: () => void;
  onSpendCoins?: (item: ChipEquipmentItem) => void;
  onBack: () => void;
}) {
  const [storeMessage, setStoreMessage] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [adLoading, setAdLoading] = useState(false);

  const handlePurchase = async (product: ProductItem) => {
    triggerHapticSelection();
    setBuyingId(product.id);
    const res = await monetizationManager.purchaseProduct(product.id);
    setBuyingId(null);
    if (res.success && res.product) {
      triggerHapticSuccess();
      if (res.product.coins > 0) {
        onBuyCoins(res.product.coins);
      }
      if (res.product.unlimitedRadar) {
        onBuyRadar();
      }
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
        onBuyCoins(25);
        setStoreMessage("Ödül alındı: +25 Siber Çip kazandın! 🪙");
        setTimeout(() => setStoreMessage(null), 3500);
      },
      () => {
        setAdLoading(false);
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

      <View style={styles.storeList}>
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
            <Text style={styles.adBannerTitle}>Reklam İzle: +25 Siber Çip</Text>
            <Text style={styles.adBannerDesc}>Kısa video ile anında 25 çip kazan.</Text>
          </View>
          <Pressable
            disabled={adLoading}
            onPress={handleWatchAdForCoins}
            style={({ pressed }) => [styles.adButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.adButtonText}>{adLoading ? "..." : "+25 🪙"}</Text>
          </Pressable>
        </View>

        {/* In-Game Chip Equipment Section */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitleHeader}>🪙 ÇİPLERİNLE ALABİLECEĞİN EKİPMANLAR</Text>
          <Text style={styles.sectionSubHeader}>OYUN İÇİ AVANTAJ</Text>
        </View>

        {CHIP_EQUIPMENT_ITEMS.map((item) => {
          const canAfford = coins >= item.cost;
          return (
            <View key={item.id} style={styles.productCard}>
              <View style={styles.productIconWrap}>
                <Text style={styles.productIcon}>{item.icon}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDesc}>{item.description}</Text>
              </View>
              <Pressable
                onPress={() => handleSpendChips(item)}
                style={({ pressed }) => [
                  styles.chipBuyButton,
                  !canAfford && styles.chipBuyButtonDisabled,
                  pressed && { opacity: 0.8 }
                ]}
              >
                <Text style={[styles.chipBuyButtonText, !canAfford && { color: "#8E82A8" }]}>
                  🪙 {item.cost}
                </Text>
              </Pressable>
            </View>
          );
        })}

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
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 2 },
  sectionTitleHeader: { color: "#E9D5FF", fontSize: 9.5, fontWeight: "900", letterSpacing: 0.8 },
  sectionSubHeader: { color: "#766D89", fontSize: 8, fontWeight: "900" },

  adBannerCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(26, 21, 58, 0.95)", padding: 14, borderRadius: 20, borderWidth: 1.5, borderColor: "#00F5D4", shadowColor: "#00F5D4", shadowOpacity: 0.15, shadowRadius: 8 },
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
  productIconWrap: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#251C45", borderWidth: 1, borderColor: "#4F3C80", alignItems: "center", justifyContent: "center", marginRight: 12 },
  iapIconWrap: { borderColor: "#7C5CF6", backgroundColor: "rgba(124, 92, 246, 0.15)" },
  productIcon: { fontSize: 24 },
  productInfo: { flex: 1, marginRight: 10 },
  productName: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  productDesc: { color: "#A49BBF", fontSize: 10, marginTop: 2, lineHeight: 14 },

  chipBuyButton: { backgroundColor: "#FFC24A", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, alignItems: "center", justifyContent: "center", minWidth: 72 },
  chipBuyButtonDisabled: { backgroundColor: "#261E3E", borderWidth: 1, borderColor: "#3D3360" },
  chipBuyButtonText: { color: "#120B24", fontSize: 11.5, fontWeight: "900" },

  buyButton: { backgroundColor: "#00F5D4", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, alignItems: "center", justifyContent: "center", minWidth: 72 },
  buyButtonText: { color: "#121025", fontSize: 12, fontWeight: "900" },
});
