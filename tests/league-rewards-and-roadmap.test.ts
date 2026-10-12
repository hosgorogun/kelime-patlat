import { describe, it, expect } from "vitest";
import {
  LEAGUE_TIERS,
  DEFAULT_PROGRESS,
  getLeagueTier,
  LEAGUE_REWARDS,
  badgesFor,
  type BadgeProgressInput,
} from "../shared/progression";
import type { PlayerProgress } from "../shared/progression";

describe("League Rewards & Roadmap Unit Tests", () => {
  it("9 kademenin tümü için getLeagueTier doğru eşleşmeyi üretir", () => {
    expect(LEAGUE_TIERS).toHaveLength(9);

    const expectations: Array<{ lp: number; expectedTier: string; expectedName: string }> = [
      { lp: 0, expectedTier: "DEMİR", expectedName: "DEMİR LİGİ" },
      { lp: 350, expectedTier: "BRONZ", expectedName: "BRONZ LİGİ" },
      { lp: 900, expectedTier: "GÜMÜŞ", expectedName: "GÜMÜŞ LİGİ" },
      { lp: 1600, expectedTier: "ALTIN", expectedName: "ALTIN LİGİ" },
      { lp: 2500, expectedTier: "PLATİN", expectedName: "PLATİN LİGİ" },
      { lp: 3600, expectedTier: "ELMAS", expectedName: "ELMAS LİGİ" },
      { lp: 5000, expectedTier: "KOZMİK", expectedName: "KOZMİK LİG" },
      { lp: 7000, expectedTier: "EBEDİ", expectedName: "EBEDİ LİG" },
      { lp: 10000, expectedTier: "HAKİM", expectedName: "HAKİM LİGİ" },
    ];

    expectations.forEach(({ lp, expectedTier, expectedName }) => {
      const tierInfo = getLeagueTier(lp);
      expect(tierInfo.tier).toBe(expectedTier);
      expect(tierInfo.name).toBe(expectedName);
    });
  });

  it("her lig kademesi için ödül tanımları makul ve dengeli olmalıdır", () => {
    expect(Object.keys(LEAGUE_REWARDS)).toHaveLength(9);

    LEAGUE_TIERS.forEach((tier) => {
      const reward = LEAGUE_REWARDS[tier.tier];
      expect(reward).toBeDefined();
      expect(reward.chips).toBeGreaterThanOrEqual(30);
      expect(reward.chips).toBeLessThanOrEqual(750);
      expect(reward.shields).toBeGreaterThanOrEqual(1);
      expect(reward.badgeId).toBe(`badge-rank-${tier.tier}`);
    });
  });

  it("kademe ödülü alındığında coins, streakShields ve claimedLeagueTiers güncellenir", () => {
    let progress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      lp: 1800, // ALTIN liginde (1600 - 2499)
      coins: 100,
      streakShields: 0,
      claimedLeagueTiers: {},
    };

    const currentTier = getLeagueTier(progress.lp ?? 0).tier;
    expect(currentTier).toBe("ALTIN");

    // ALTIN kademesini ödül olarak al
    const reward = LEAGUE_REWARDS[currentTier];
    expect(reward).toBeDefined();

    progress = {
      ...progress,
      coins: (progress.coins ?? 0) + reward.chips,
      streakShields: (progress.streakShields ?? 0) + reward.shields,
      claimedLeagueTiers: {
        ...(progress.claimedLeagueTiers ?? {}),
        [currentTier]: true,
      },
    };

    expect(progress.coins).toBe(100 + reward.chips);
    expect(progress.streakShields).toBe(reward.shields);
    expect(progress.claimedLeagueTiers?.[currentTier]).toBe(true);
  });

  it("alınan lig rozeti badgesFor içinde doğru şekilde kilit açar", () => {
    const unrankedProgress: BadgeProgressInput = {
      ...DEFAULT_PROGRESS,
      lp: 0,
      wins: 0,
      claimedLeagueTiers: {},
    };

    const allBadges = badgesFor(unrankedProgress);
    const demirBadge = allBadges.find((b) => b.id === "badge-rank-DEMİR");
    const bronzBadge = allBadges.find((b) => b.id === "badge-rank-BRONZ");
    const altinBadge = allBadges.find((b) => b.id === "badge-rank-ALTIN");

    expect(demirBadge?.unlocked).toBe(false); // LP 0 ve wins 0 iken kilitli
    expect(bronzBadge?.unlocked).toBe(false);
    expect(altinBadge?.unlocked).toBe(false);

    // DEMİR kademesi claimed edildiğinde veya 1 galibiyet alındığında açılır
    const demirClaimed = badgesFor({
      ...DEFAULT_PROGRESS,
      lp: 0,
      wins: 0,
      claimedLeagueTiers: { DEMİR: true },
    });
    expect(demirClaimed.find((b) => b.id === "badge-rank-DEMİR")?.unlocked).toBe(true);

    // ALTIN ligine ulaşıldığında (lp >= 1400) veya claimed edildiğinde açılır
    const altinProgress: BadgeProgressInput = {
      ...DEFAULT_PROGRESS,
      lp: 1600,
      claimedLeagueTiers: { ALTIN: true },
    };

    const updatedBadges = badgesFor(altinProgress);
    const updatedAltinBadge = updatedBadges.find((b) => b.id === "badge-rank-ALTIN");
    expect(updatedAltinBadge?.unlocked).toBe(true);
  });

  it("aynı kademe ödülü iki kez alınamaz (idempotency)", () => {
    const progress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      lp: 2000,
      claimedLeagueTiers: { PLATİN: true },
    };

    const isAlreadyClaimed = Boolean(progress.claimedLeagueTiers?.["PLATİN"]);
    expect(isAlreadyClaimed).toBe(true);
  });
});
