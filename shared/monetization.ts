// Monetization Engine (Google AdMob Rewarded & Interstitial Ads)

export type AdRewardType = "radar_charge" | "double_xp" | "time_boost";

/**
 * Ansızın çıkan (interstitial) video reklamların tetiklenme sıklığı.
 * Kullanıcı deneyimini bozmamak adına her 3 galibiyet/tamamlanan maçta bir gösterilir.
 */
export const INTERSTITIAL_MATCH_INTERVAL = 3;

class MonetizationManager {
  private completedMatchesCount = 0;

  /**
   * Ödüllü video reklam motoru (Rewarded Video Ad).
   */
  async showRewardedAd(type: AdRewardType, onReward: () => void, onError?: (err: string) => void) {
    void type;
    if (onError) onError("Ödüllü reklam şu anda kullanılamıyor.");
  }

  /**
   * Maç veya solo bölüm tamamlandığında çağrılır.
   * Oyuncuyu kaybetme anında cezalandırmamak için sadece kazanılan (won=true) maçlarda
   * veya tamamlanan maçlarda sayaç artırılır.
   * Sayaç INTERSTITIAL_MATCH_INTERVAL (3) katına ulaştığında interstitial tetiklenmesini önerir.
   */
  recordMatchFinished(won: boolean = true): { shouldShowInterstitial: boolean; matchCount: number } {
    if (won) {
      this.completedMatchesCount++;
    }
    const shouldShow = this.completedMatchesCount > 0 && this.completedMatchesCount % INTERSTITIAL_MATCH_INTERVAL === 0;
    return {
      shouldShowInterstitial: shouldShow,
      matchCount: this.completedMatchesCount,
    };
  }

  getCompletedMatchesCount(): number {
    return this.completedMatchesCount;
  }

  resetInterstitialCounter() {
    this.completedMatchesCount = 0;
  }

  /**
   * Ansızın çıkan (interstitial) geçiş reklamını oynatır.
   */
  async showInterstitialAd(onClosed?: () => void, onError?: (err: string) => void) {
    try {
      if (onClosed) onClosed();
    } catch (err: any) {
      if (onError) onError(err?.message || "Geçiş reklamı gösterilemedi.");
    }
  }
}

export const monetizationManager = new MonetizationManager();
