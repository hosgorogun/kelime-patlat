import assert from "node:assert";
import { checkDailyLoginReward, DEFAULT_PROGRESS, type PlayerProgress } from "../shared/progression";
import { monetizationManager, type AdRewardType } from "../shared/monetization";

async function runTests() {
  console.log("=================================================");
  console.log("🎯 REKLAM YERLEŞİMLERİ & GELİR MOTORU TESTİ");
  console.log("=================================================");

  // 1. AdRewardType Desteği
  console.log("\n--- 1. YENİ REKLAM TİPLERİ DOĞRULAMASI ---");
  const rewardTypes: AdRewardType[] = [
    "radar_charge",
    "double_xp",
    "time_boost",
    "second_chance",
    "daily_treasure_double",
    "vintage_clue",
    "weekend_hunt_clue",
  ];

  for (const type of rewardTypes) {
    let rewarded = false;
    await monetizationManager.showRewardedAd(type, () => {
      rewarded = true;
    });
    assert.strictEqual(rewarded, true, `Rewarded callback failed for type: ${type}`);
    console.log(`[REWARD TYPE] ${type} -> Başarıyla destekleniyor ✅`);
  }

  // 2. Günlük Giriş 1x (Normal)
  console.log("\n--- 2. GÜNLÜK GİRİŞ 1X (NORMAL ALIM) ---");
  const today = "2026-10-16";
  const initialProgress: PlayerProgress = {
    ...DEFAULT_PROGRESS,
    coins: 100,
    xp: 200,
    streakShields: 0,
    loginDaysCount: 0,
    lastLoginDay: "2026-10-15",
  };

  const normalResult = checkDailyLoginReward(initialProgress, today, false);
  assert(normalResult !== null, "Normal login reward should not be null");
  assert.strictEqual(normalResult.reward.amount, 8, "Day 1 standard reward should be 8 coins");
  assert.strictEqual(normalResult.updatedProgress.coins, 108, "Coins should increase by 8");
  assert.strictEqual(normalResult.updatedProgress.lastLoginDay, today, "lastLoginDay should be updated");
  assert.strictEqual(normalResult.updatedProgress.loginDaysCount, 1, "loginDaysCount should increment");
  console.log(`[NORMAL CLAIM] +${normalResult.reward.amount} Çip -> Toplam: ${normalResult.updatedProgress.coins} ✅`);

  // 3. Günlük Giriş 2x (Reklamla 2 Katı Kazan)
  console.log("\n--- 3. GÜNLÜK GİRİŞ 2X REKLAM ÖDÜLÜ ---");
  const doubledResult = checkDailyLoginReward(initialProgress, today, true);
  assert(doubledResult !== null, "Doubled login reward should not be null");
  assert.strictEqual(doubledResult.reward.amount, 16, "Day 1 doubled reward should be 16 coins (8 * 2)");
  assert.strictEqual(doubledResult.updatedProgress.coins, 116, "Coins should increase by 16");
  assert(doubledResult.reward.label.includes("2x"), "Reward label should note 2x multiplier");
  console.log(`[DOUBLED CLAIM] +${doubledResult.reward.amount} Çip (2x) -> Toplam: ${doubledResult.updatedProgress.coins} ✅`);

  // 4. Maç ve Hamle Sonu Interstitial Sıklığı
  console.log("\n--- 4. MAÇ & HAMLE SONU INTERSTITIAL SIKLIĞI ---");
  monetizationManager.resetInterstitialCounter();
  assert.strictEqual(monetizationManager.getCompletedMatchesCount(), 0);

  const m1 = monetizationManager.recordMatchFinished(true);
  assert.strictEqual(m1.shouldShowInterstitial, false, "Match 1 should not trigger interstitial");

  const m2 = monetizationManager.recordMatchFinished(true);
  assert.strictEqual(m2.shouldShowInterstitial, false, "Match 2 should not trigger interstitial");

  const m3 = monetizationManager.recordMatchFinished(true);
  assert.strictEqual(m3.shouldShowInterstitial, true, "Match 3 should trigger interstitial");
  console.log(`[INTERSTITIAL SIKLIĞI] 3. maç / hamle sonunda geçiş reklamı tetiklendi ✅`);

  const m4 = monetizationManager.recordMatchFinished(true);
  assert.strictEqual(m4.shouldShowInterstitial, false, "Match 4 should not trigger interstitial");

  console.log("\n=================================================");
  console.log("🎉 TÜM REKLAM YERLEŞİMLERİ VE GELİR SENARYOLARI GEÇTİ!");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
