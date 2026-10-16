export interface AdMobConfig {
  androidAppId: string;
  iosAppId: string;
  bannerIdAndroid: string;
  bannerIdIos: string;
  interstitialIdAndroid: string;
  interstitialIdIos: string;
  rewardedIdAndroid: string;
  rewardedIdIos: string;
  testMode: boolean;
}

function getReactNativeModule(): any {
  try {
    if (typeof require !== "undefined") {
      return require("react-native");
    }
  } catch {
    // Web, test veya Node ESM ortamı
  }
  return null;
}

function getExpoConstantsModule(): any {
  try {
    if (typeof require !== "undefined") {
      return require("expo-constants");
    }
  } catch {
    // Web, test veya Node ESM ortamı
  }
  return null;
}

function getGoogleMobileAdsModule(): any {
  try {
    if (typeof require !== "undefined") {
      return require("react-native-google-mobile-ads");
    }
  } catch {
    // Web, test veya Node ESM ortamı
  }
  return null;
}

export function getPlatformOS(): "android" | "ios" | "web" {
  try {
    const rn = getReactNativeModule();
    if (rn?.Platform?.OS) return rn.Platform.OS;
  } catch {
    // Headless, Node veya Test ortamı
  }
  return process.platform === "darwin" ? "ios" : "android";
}

function getExpoExtra(): any {
  try {
    const expoConstants = getExpoConstantsModule();
    const Constants = expoConstants?.default || expoConstants;
    return Constants?.expoConfig?.extra?.admob || {};
  } catch {
    return {};
  }
}

// Google Resmi Test Reklam Birimi Kimlikleri (AdMob Official Test Unit IDs)
export const GOOGLE_TEST_IDS = {
  BANNER_ANDROID: "ca-app-pub-3940256099942544/6300978111",
  BANNER_IOS: "ca-app-pub-3940256099942544/2934735716",
  INTERSTITIAL_ANDROID: "ca-app-pub-3940256099942544/1033173712",
  INTERSTITIAL_IOS: "ca-app-pub-3940256099942544/4411468910",
  REWARDED_ANDROID: "ca-app-pub-3940256099942544/5224354917",
  REWARDED_IOS: "ca-app-pub-3940256099942544/1712485313",
  APP_ANDROID: "ca-app-pub-3940256099942544~3347511713",
  APP_IOS: "ca-app-pub-3940256099942544~1458002511",
};

/**
 * .env dosyasından, process.env'den veya Expo Constants'tan
 * AdMob konfigürasyonunu dinamik olarak çözümler.
 */
export function getAdMobConfig(): AdMobConfig {
  const extra = getExpoExtra();

  const isTestMode =
    process.env.EXPO_PUBLIC_ADMOB_TEST_MODE !== "false" &&
    extra.testMode !== false;

  return {
    androidAppId:
      process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
      process.env.ADMOB_ANDROID_APP_ID ||
      extra.androidAppId ||
      GOOGLE_TEST_IDS.APP_ANDROID,
    iosAppId:
      process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ||
      process.env.ADMOB_IOS_APP_ID ||
      extra.iosAppId ||
      GOOGLE_TEST_IDS.APP_IOS,
    bannerIdAndroid:
      process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID ||
      extra.bannerIdAndroid ||
      GOOGLE_TEST_IDS.BANNER_ANDROID,
    bannerIdIos:
      process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_IOS ||
      extra.bannerIdIos ||
      GOOGLE_TEST_IDS.BANNER_IOS,
    interstitialIdAndroid:
      process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID ||
      extra.interstitialIdAndroid ||
      GOOGLE_TEST_IDS.INTERSTITIAL_ANDROID,
    interstitialIdIos:
      process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS ||
      extra.interstitialIdIos ||
      GOOGLE_TEST_IDS.INTERSTITIAL_IOS,
    rewardedIdAndroid:
      process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID ||
      extra.rewardedIdAndroid ||
      GOOGLE_TEST_IDS.REWARDED_ANDROID,
    rewardedIdIos:
      process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS ||
      extra.rewardedIdIos ||
      GOOGLE_TEST_IDS.REWARDED_IOS,
    testMode: isTestMode,
  };
}

/**
 * Platforma (Android veya iOS) ve test moduna göre Banner Ad Unit ID döner.
 */
export function getBannerAdUnitId(): string {
  const config = getAdMobConfig();
  if (config.testMode) {
    try {
      const gma = getGoogleMobileAdsModule();
      if (gma?.TestIds?.BANNER) return gma.TestIds.BANNER;
    } catch {
      // Fallback to static test ids if package mock is used
    }
    return getPlatformOS() === "ios" ? GOOGLE_TEST_IDS.BANNER_IOS : GOOGLE_TEST_IDS.BANNER_ANDROID;
  }
  return getPlatformOS() === "ios" ? config.bannerIdIos : config.bannerIdAndroid;
}

/**
 * Platforma ve test moduna göre Geçiş (Interstitial) Ad Unit ID döner.
 */
export function getInterstitialAdUnitId(): string {
  const config = getAdMobConfig();
  if (config.testMode) {
    try {
      const gma = getGoogleMobileAdsModule();
      if (gma?.TestIds?.INTERSTITIAL) return gma.TestIds.INTERSTITIAL;
    } catch {
      // Fallback to static test ids
    }
    return getPlatformOS() === "ios"
      ? GOOGLE_TEST_IDS.INTERSTITIAL_IOS
      : GOOGLE_TEST_IDS.INTERSTITIAL_ANDROID;
  }
  return getPlatformOS() === "ios" ? config.interstitialIdIos : config.interstitialIdAndroid;
}

/**
 * Platforma ve test moduna göre Ödüllü Video (Rewarded) Ad Unit ID döner.
 */
export function getRewardedAdUnitId(): string {
  const config = getAdMobConfig();
  if (config.testMode) {
    try {
      const gma = getGoogleMobileAdsModule();
      if (gma?.TestIds?.REWARDED) return gma.TestIds.REWARDED;
    } catch {
      // Fallback to static test ids
    }
    return getPlatformOS() === "ios"
      ? GOOGLE_TEST_IDS.REWARDED_IOS
      : GOOGLE_TEST_IDS.REWARDED_ANDROID;
  }
  return getPlatformOS() === "ios" ? config.rewardedIdIos : config.rewardedIdAndroid;
}

class AdMobService {
  private isInitialized = false;
  private initializingPromise: Promise<boolean> | null = null;

  /**
   * Google Mobile Ads SDK'sını başlatır.
   * Yalnızca Android ve iOS ortamlarında yerel SDK tetiklenir.
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.initializingPromise) return this.initializingPromise;

    if (getPlatformOS() === "web") {
      this.isInitialized = true;
      return true;
    }

    this.initializingPromise = (async () => {
      try {
        const gma = getGoogleMobileAdsModule();
        const mobileAds = gma?.default || gma;
        if (typeof mobileAds === "function") {
          await mobileAds().initialize();
          console.log("[AdMobService] Google Mobile Ads başarıyla başlatıldı.");
          this.isInitialized = true;
          return true;
        }
      } catch (err) {
        console.warn("[AdMobService] Native AdMob başlatma atlandı (Fallback dev modu):", err);
      }
      this.isInitialized = true;
      return true;
    })();

    return this.initializingPromise;
  }

  /**
   * Geçiş (Interstitial) Reklam Gösterimi.
   * Reklam yüklenemezse veya zaman aşımına uğrarsa oyunu kilitlememek için
   * 7 saniye içinde onClosed callback'ini otomatik tetikler.
   */
  async showInterstitial(onClosed?: () => void, onError?: (err: string) => void): Promise<void> {
    const handleClose = () => {
      if (onClosed) onClosed();
    };

    if (getPlatformOS() === "web") {
      handleClose();
      return;
    }

    try {
      await this.initialize();
      const gma = getGoogleMobileAdsModule();
      if (!gma?.InterstitialAd) {
        handleClose();
        return;
      }
      const { InterstitialAd, AdEventType } = gma;
      const adUnitId = getInterstitialAdUnitId();
      const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      let finished = false;
      const finishOnce = () => {
        if (!finished) {
          finished = true;
          handleClose();
        }
      };

      // 7 saniye güvenlik zaman aşımı (oyuncunun oyunda takılı kalmasını önler)
      const timeout = setTimeout(() => {
        if (!finished) {
          console.warn("[AdMobService] Interstitial zaman aşımı (7s), oyun devam ediyor.");
          finishOnce();
        }
      }, 7000);

      const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        try {
          interstitial.show();
        } catch {
          finishOnce();
        }
      });

      const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        clearTimeout(timeout);
        unsubscribeLoaded();
        unsubscribeClosed();
        unsubscribeError();
        finishOnce();
      });

      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
        clearTimeout(timeout);
        unsubscribeLoaded();
        unsubscribeClosed();
        unsubscribeError();
        if (onError) onError(error?.message || "Geçiş reklamı yüklenemedi.");
        finishOnce();
      });

      interstitial.load();
    } catch (err: any) {
      if (onError) onError(err?.message || "Geçiş reklamı çalıştırılamadı.");
      handleClose();
    }
  }

  /**
   * Ödüllü Video (Rewarded) Reklam Gösterimi.
   * Oyuncu videoyu sonuna kadar izlediğinde (EARNED_REWARD) onReward callback'i çalışır.
   * Web veya emülatörde simüle edilmiş ödüllendirme ile güvenli çalışır.
   */
  async showRewarded(onReward: () => void, onError?: (err: string) => void): Promise<void> {
    if (getPlatformOS() === "web") {
      // Web / Emülatör simülasyonu
      setTimeout(() => {
        try {
          onReward();
        } catch (e: any) {
          if (onError) onError(e?.message || "Ödül verilirken hata oluştu.");
        }
      }, 400);
      return;
    }

    try {
      await this.initialize();
      const gma = getGoogleMobileAdsModule();
      if (!gma?.RewardedAd) {
        onReward();
        return;
      }
      const { RewardedAd, RewardedAdEventType, AdEventType } = gma;
      const adUnitId = getRewardedAdUnitId();
      const rewarded = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      let earned = false;
      let finished = false;

      const finishOnce = () => {
        if (!finished) {
          finished = true;
          if (earned) {
            onReward();
          }
        }
      };

      // 9 saniye güvenlik zaman aşımı
      const timeout = setTimeout(() => {
        if (!finished) {
          console.warn("[AdMobService] Rewarded ad yükleme zaman aşımı (9s). Fallback ödül verildi.");
          // Geliştirme veya ağ kopukluğunda oyuncuyu mağdur etmemek için ödül verilir
          earned = true;
          finishOnce();
        }
      }, 9000);

      const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        try {
          rewarded.show();
        } catch (e: any) {
          clearTimeout(timeout);
          if (onError) onError(e?.message || "Ödüllü reklam gösterilemedi.");
        }
      });

      const unsubscribeEarned = rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          earned = true;
        }
      );

      const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        clearTimeout(timeout);
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeClosed();
        unsubscribeError();
        finishOnce();
      });

      const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error: any) => {
        clearTimeout(timeout);
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeClosed();
        unsubscribeError();
        if (onError) onError(error?.message || "Ödüllü reklam hatası.");
        // Ağ hatasında oyuncu akışını bozmamak için ödülü onayla
        earned = true;
        finishOnce();
      });

      rewarded.load();
    } catch (err: any) {
      if (onError) onError(err?.message || "Ödüllü video çalıştırılamadı.");
      // Fallback
      onReward();
    }
  }
}

export const admobService = new AdMobService();
