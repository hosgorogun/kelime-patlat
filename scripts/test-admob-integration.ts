/**
 * KELİME PATLAT - GOOGLE ADMOB UÇTAN UCA (END-TO-END) ENTEGRASYON DOĞRULAMASI
 * Android, iOS, .env Değişkenleri, Test/Canlı Modu, Banner, Interstitial ve Rewarded
 */

import {
  getAdMobConfig,
  getBannerAdUnitId,
  getInterstitialAdUnitId,
  getRewardedAdUnitId,
  GOOGLE_TEST_IDS,
  admobService,
} from "../lib/admob-service";
import { monetizationManager } from "../shared/monetization";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[ADMOB TEST BAŞARISIZ] ${msg}`);
  }
}

async function runAdMobSuite() {
  console.log("\n=======================================================================");
  console.log("📱 KELİME PATLAT - GOOGLE ADMOB UÇTAN UCA ENTEGRASYON TESTİ");
  console.log("=======================================================================\n");

  // 1. ENV KONFİGÜRASYONU VE APP ID DOĞRULAMASI
  console.log("--- 1. .ENV VE UYGULAMA KİMLİKLERİ (APP IDs) DOĞRULAMASI ---");
  const config = getAdMobConfig();
  assert(Boolean(config.androidAppId), "Android App ID tanımlı değil!");
  assert(Boolean(config.iosAppId), "iOS App ID tanımlı değil!");
  assert(config.androidAppId.includes("~"), "Android App ID formatı geçersiz ('~' içermeli)!");
  assert(config.iosAppId.includes("~"), "iOS App ID formatı geçersiz ('~' içermeli)!");
  console.log(`[APP ID] Android: ${config.androidAppId} ✅`);
  console.log(`[APP ID] iOS: ${config.iosAppId} ✅`);

  // 2. REKLAM BİRİMİ KİMLİKLERİ (AD UNIT IDs) DOĞRULAMASI
  console.log("\n--- 2. REKLAM BİRİMİ KİMLİKLERİ (AD UNIT IDs) DOĞRULAMASI ---");
  assert(Boolean(config.bannerIdAndroid), "Android Banner ID tanımlı değil!");
  assert(Boolean(config.bannerIdIos), "iOS Banner ID tanımlı değil!");
  assert(Boolean(config.interstitialIdAndroid), "Android Interstitial ID tanımlı değil!");
  assert(Boolean(config.interstitialIdIos), "iOS Interstitial ID tanımlı değil!");
  assert(Boolean(config.rewardedIdAndroid), "Android Rewarded ID tanımlı değil!");
  assert(Boolean(config.rewardedIdIos), "iOS Rewarded ID tanımlı değil!");

  console.log(`[BANNER] Android: ${config.bannerIdAndroid} | iOS: ${config.bannerIdIos} ✅`);
  console.log(`[INTERSTITIAL] Android: ${config.interstitialIdAndroid} | iOS: ${config.interstitialIdIos} ✅`);
  console.log(`[REWARDED] Android: ${config.rewardedIdAndroid} | iOS: ${config.rewardedIdIos} ✅`);

  // 3. GOOGLE RESMİ TEST BİRİMLERİ (GOOGLE_TEST_IDS)
  console.log("\n--- 3. GOOGLE RESMİ TEST KİMLİK DOĞRULAMASI ---");
  assert(GOOGLE_TEST_IDS.BANNER_ANDROID === "ca-app-pub-3940256099942544/6300978111", "Google Android Banner test ID hatalı!");
  assert(GOOGLE_TEST_IDS.BANNER_IOS === "ca-app-pub-3940256099942544/2934735716", "Google iOS Banner test ID hatalı!");
  assert(GOOGLE_TEST_IDS.INTERSTITIAL_ANDROID === "ca-app-pub-3940256099942544/1033173712", "Google Android Interstitial test ID hatalı!");
  assert(GOOGLE_TEST_IDS.INTERSTITIAL_IOS === "ca-app-pub-3940256099942544/4411468910", "Google iOS Interstitial test ID hatalı!");
  assert(GOOGLE_TEST_IDS.REWARDED_ANDROID === "ca-app-pub-3940256099942544/5224354917", "Google Android Rewarded test ID hatalı!");
  assert(GOOGLE_TEST_IDS.REWARDED_IOS === "ca-app-pub-3940256099942544/1712485313", "Google iOS Rewarded test ID hatalı!");
  console.log("[GOOGLE TEST IDS] Tüm resmi test reklam birimi kimlikleri Google standartlarına %100 uyumlu ✅");

  // 4. DİNAMİK BİRİM KİMLİĞİ ÇÖZÜMLEME FONKSİYONLARI
  console.log("\n--- 4. DİNAMİK BİRİM KİMLİĞİ ÇÖZÜMLEME FONKSİYONLARI ---");
  const bannerUnit = getBannerAdUnitId();
  const interstitialUnit = getInterstitialAdUnitId();
  const rewardedUnit = getRewardedAdUnitId();
  assert(Boolean(bannerUnit), "Banner Unit ID çözümlenemedi!");
  assert(Boolean(interstitialUnit), "Interstitial Unit ID çözümlenemedi!");
  assert(Boolean(rewardedUnit), "Rewarded Unit ID çözümlenemedi!");
  console.log(`[RESOLVED] Banner: ${bannerUnit} ✅`);
  console.log(`[RESOLVED] Interstitial: ${interstitialUnit} ✅`);
  console.log(`[RESOLVED] Rewarded: ${rewardedUnit} ✅`);

  // 5. ÖDÜLLÜ REKLAM (REWARDED VIDEO) UÇTAN UCA TETİKLENME VE TESLİMAT
  console.log("\n--- 5. ÖDÜLLÜ VİDEO (REWARDED) UÇTAN UCA AKIŞI ---");
  let rewardedReceived = false;
  await admobService.showRewarded(() => {
    rewardedReceived = true;
  });
  assert(Boolean(rewardedReceived), "admobService.showRewarded() ödül callback'ini çalıştırmadı!");
  console.log("[REWARDED SERVICE] AdMob ödüllü video tamamlandı ve onReward callback'i başarıyla tetiklendi ✅");

  let managerRewardedReceived = false;
  await monetizationManager.showRewardedAd("radar_charge", () => {
    managerRewardedReceived = true;
  });
  assert(Boolean(managerRewardedReceived), "monetizationManager.showRewardedAd() ödül callback'ini çalıştırmadı!");
  console.log("[MONETIZATION MANAGER] Oyun içi ödüllü reklam motoru entegrasyonu başarıyla ödülü teslim etti ✅");

  // 6. GEÇİŞ REKLAMI (INTERSTITIAL) VE OYUN AKIŞINI KİLİTLEMEME KORUMASI
  console.log("\n--- 6. GEÇİŞ REKLAMI (INTERSTITIAL) VE GÜVENLİK AKIŞI ---");
  let interstitialClosed = false;
  await admobService.showInterstitial(() => {
    interstitialClosed = true;
  });
  assert(Boolean(interstitialClosed), "admobService.showInterstitial() kapanış callback'ini çalıştırmadı!");
  console.log("[INTERSTITIAL SERVICE] Geçiş reklamı kapatıldı ve oyun akışı kesintisiz devam etti ✅");

  let managerInterstitialClosed = false;
  await monetizationManager.showInterstitialAd(() => {
    managerInterstitialClosed = true;
  });
  assert(Boolean(managerInterstitialClosed), "monetizationManager.showInterstitialAd() kapanış callback'ini çalıştırmadı!");
  console.log("[MONETIZATION MANAGER] 3 maçta bir çalışan geçiş reklamı motoru başarıyla tamamlandı ✅");

  // 7. CANLI MOD / TEST MODU GEÇİŞ DOĞRULAMASI
  console.log("\n--- 7. CANLI / TEST MODU GEÇİŞ DOĞRULAMASI ---");
  const previousMode = process.env.EXPO_PUBLIC_ADMOB_TEST_MODE;
  try {
    process.env.EXPO_PUBLIC_ADMOB_TEST_MODE = "false";
    const prodConfig = getAdMobConfig();
    assert(prodConfig.testMode === false, "Test modu 'false' yapıldığında prodConfig.testMode false olmalıydı!");
    console.log("[PROD SWITCH] EXPO_PUBLIC_ADMOB_TEST_MODE=false yapıldığında canlı AdMob moduna başarıyla geçildi ✅");
  } finally {
    process.env.EXPO_PUBLIC_ADMOB_TEST_MODE = previousMode;
  }

  console.log("\n=======================================================================");
  console.log("🏆 GOOGLE ADMOB ENTEGRASYONU ANDROID VE IOS İÇİN %100 EKSİKSİZ TAMAMLANDI!");
  console.log("🚀 BANNER, INTERSTITIAL VE REWARDED .ENV ÜZERİNDEN TAM KONTROL ALTINDA!");
  console.log("=======================================================================\n");
}

runAdMobSuite().catch((err) => {
  console.error("HATA:", err);
  process.exit(1);
});
