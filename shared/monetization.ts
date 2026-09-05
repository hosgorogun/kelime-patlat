// Monetization Engine (Google AdMob Rewarded & In-App Purchases Abstraction)

export type ProductItem = {
  id: string;
  name: string;
  description: string;
  priceText: string;
  coins: number;
  unlimitedRadar?: boolean;
  type: "coin_pack" | "theme" | "radar_pack";
};

export const DIGITAL_STORE_PRODUCTS: ProductItem[] = [
  { id: "coins_small", name: "100 Siber Çip", description: "Market alışverişleri için başlangıç paketi", priceText: "₺19.99", coins: 100, type: "coin_pack" },
  { id: "coins_medium", name: "300 Siber Çip", description: "Popüler siber çip paketi (+50 Bonus)", priceText: "₺49.99", coins: 350, type: "coin_pack" },
  { id: "coins_large", name: "1000 Siber Çip", description: "Büyük siber çip kasası (+250 Bonus)", priceText: "₺129.99", coins: 1250, type: "coin_pack" },
  { id: "radar_infinite", name: "Sınırsız Siber Radar", description: "Tüm oyunlarda süresiz +10 Radar Şifre Çözücü", priceText: "₺79.99", coins: 0, unlimitedRadar: true, type: "radar_pack" },
];

export type AdRewardType = "radar_charge" | "double_xp" | "time_boost";

class MonetizationManager {
  private isAdMobInitialized = false;

  async initAdMob(): Promise<boolean> {
    // In production, initialize Google Mobile Ads SDK here
    this.isAdMobInitialized = true;
    return true;
  }

  async showRewardedAd(type: AdRewardType, onReward: () => void, onError?: (err: string) => void) {
    // Mock simulation for development and fallback for seamless gameplay
    try {
      setTimeout(() => {
        onReward();
      }, 1500);
    } catch (error) {
      if (onError) onError("Reklam yüklenirken bir hata oluştu.");
    }
  }

  async purchaseProduct(productId: string): Promise<{ success: boolean; product?: ProductItem; error?: string }> {
    const product = DIGITAL_STORE_PRODUCTS.find((p) => p.id === productId);
    if (!product) return { success: false, error: "Ürün bulunamadı." };

    // In production, trigger Expo IAP / Google Play Billing here
    return { success: true, product };
  }
}

export const monetizationManager = new MonetizationManager();
