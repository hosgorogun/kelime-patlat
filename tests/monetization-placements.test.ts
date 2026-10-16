import { describe, it, expect } from "vitest";
import { checkDailyLoginReward, DEFAULT_PROGRESS, type PlayerProgress } from "../shared/progression";
import { monetizationManager, type AdRewardType } from "../shared/monetization";

describe("Monetization & Ad Placements Verification", () => {
  it("should support all newly registered AdRewardTypes without error", async () => {
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
      expect(rewarded).toBe(true);
    }
  });

  it("should grant 1x reward when isDoubled is false", () => {
    const today = "2026-10-16";
    const initialProgress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      coins: 100,
      xp: 200,
      streakShields: 0,
      loginDaysCount: 0, // Day 1: 8 coins
      lastLoginDay: "2026-10-15",
    };

    const result = checkDailyLoginReward(initialProgress, today, false);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.reward.amount).toBe(8);
      expect(result.updatedProgress.coins).toBe(108);
      expect(result.updatedProgress.lastLoginDay).toBe(today);
      expect(result.updatedProgress.loginDaysCount).toBe(1);
    }
  });

  it("should grant 2x reward when isDoubled is true (Rewarded Ad watched)", () => {
    const today = "2026-10-16";
    const initialProgress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      coins: 100,
      xp: 200,
      streakShields: 0,
      loginDaysCount: 0, // Day 1: base 8 coins -> 2x = 16 coins
      lastLoginDay: "2026-10-15",
    };

    const result = checkDailyLoginReward(initialProgress, today, true);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.reward.amount).toBe(16);
      expect(result.reward.label).toContain("2x");
      expect(result.updatedProgress.coins).toBe(116);
      expect(result.updatedProgress.lastLoginDay).toBe(today);
      expect(result.updatedProgress.loginDaysCount).toBe(1);
    }
  });

  it("should trigger interstitial after 3 completed matches or turns", () => {
    monetizationManager.resetInterstitialCounter();
    expect(monetizationManager.getCompletedMatchesCount()).toBe(0);

    const m1 = monetizationManager.recordMatchFinished(true);
    expect(m1.shouldShowInterstitial).toBe(false);

    const m2 = monetizationManager.recordMatchFinished(true);
    expect(m2.shouldShowInterstitial).toBe(false);

    const m3 = monetizationManager.recordMatchFinished(true);
    expect(m3.shouldShowInterstitial).toBe(true);

    const m4 = monetizationManager.recordMatchFinished(true);
    expect(m4.shouldShowInterstitial).toBe(false);
  });
});
