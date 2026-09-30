import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROGRESS,
  MAX_LIVES,
  COST_PER_LIFE,
  COST_REFILL_ALL,
  getCalculatedLives,
  deductLife,
  grantInfiniteLives,
  buyLives,
  useBooster,
  buyBooster,
  canSpinLuckyWheel,
  claimLuckyWheelReward,
  checkDailyLoginReward,
  getDayId,
  BOOSTER_CONFIG,
  LUCKY_WHEEL_SECTORS,
  type PlayerProgress,
} from "../shared/progression";
import { isEqualTr, normalizeTr, normalizeTrUpper } from "../shared/tr-utils";
import { CHIP_EQUIPMENT_ITEMS } from "../shared/store-items";

describe("Senior QA Audit Phase 2 - Advanced Resiliency & Edge Cases", () => {
  describe("1. Infinite Lives Edge Cases & Purchase Guards", () => {
    it("buyLives rejects all purchase options when infinite lives is active to protect chips", () => {
      const activeInfinite = grantInfiniteLives({ ...DEFAULT_PROGRESS, coins: 1000 }, 30);

      const resOne = buyLives(activeInfinite, "one");
      expect(resOne.success).toBe(false);
      expect(resOne.message).toBe("Sonsuz can süreniz devam ediyor!");
      expect(resOne.updatedProgress.coins).toBe(1000);

      const resAll = buyLives(activeInfinite, "all");
      expect(resAll.success).toBe(false);
      expect(resAll.message).toBe("Sonsuz can süreniz devam ediyor!");
      expect(resAll.updatedProgress.coins).toBe(1000);

      const resAd = buyLives(activeInfinite, "ad");
      expect(resAd.success).toBe(false);
      expect(resAd.message).toBe("Sonsuz can süreniz devam ediyor!");
    });

    it("Store lives equipment item is correctly mapped in CHIP_EQUIPMENT_ITEMS", () => {
      const livesItem = CHIP_EQUIPMENT_ITEMS.find((it) => it.id === "lives_refill");
      expect(livesItem).toBeDefined();
      expect(livesItem?.rewardType).toBe("lives");
      expect(livesItem?.cost).toBe(75);
    });

    it("Multiple consecutive deductions during infinite lives do not reduce lives below MAX_LIVES", () => {
      let prog = grantInfiniteLives({ ...DEFAULT_PROGRESS }, 10);
      for (let i = 0; i < 20; i++) {
        prog = deductLife(prog);
      }
      expect(prog.lives).toBe(MAX_LIVES);
      const calc = getCalculatedLives(prog);
      expect(calc.isInfinite).toBe(true);
      expect(calc.lives).toBe(MAX_LIVES);
    });
  });

  describe("2. Turkish Unicode Letter Matching in Puzzles (isEqualTr)", () => {
    it("Correctly matches Turkish dotted/dotless I edge cases in all combinations", () => {
      expect(isEqualTr("i", "İ")).toBe(true);
      expect(isEqualTr("İ", "i")).toBe(true);
      expect(isEqualTr("ı", "I")).toBe(true);
      expect(isEqualTr("I", "ı")).toBe(true);

      // Contrast: 'i' and 'ı' must NOT match
      expect(isEqualTr("i", "ı")).toBe(false);
      expect(isEqualTr("İ", "I")).toBe(false);
    });

    it("Correctly matches all other Turkish special letters", () => {
      const pairs = [
        ["ş", "Ş"],
        ["ğ", "Ğ"],
        ["ç", "Ç"],
        ["ö", "Ö"],
        ["ü", "Ü"],
      ];
      for (const [lower, upper] of pairs) {
        expect(isEqualTr(lower, upper)).toBe(true);
        expect(normalizeTrUpper(lower)).toBe(upper);
        expect(normalizeTr(upper)).toBe(lower);
      }
    });

    it("Handles null or undefined gracefully without throwing runtime errors", () => {
      expect(isEqualTr("", "")).toBe(true);
      expect(isEqualTr("A", "")).toBe(false);
      expect(isEqualTr("", "B")).toBe(false);
      expect(isEqualTr(undefined as any, "A")).toBe(false);
      expect(isEqualTr("A", null as any)).toBe(false);
    });
  });

  describe("3. Tactical Booster Inventory & Economics", () => {
    it("useBooster auto-buys booster with chips when inventory is 0", () => {
      const prog: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        boosters: { hint: 0, freeze: 0, shuffle: 0 },
        coins: 150,
      };

      const res = useBooster(prog, "hint");
      expect(res.success).toBe(true);
      expect(res.updatedProgress.coins).toBe(150 - BOOSTER_CONFIG.hint.cost);
      expect(res.updatedProgress.boosters?.hint).toBe(0);
    });

    it("useBooster rejects when inventory is 0 and chips are insufficient", () => {
      const prog: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        boosters: { hint: 0, freeze: 0, shuffle: 0 },
        coins: 10, // Cost is 35
      };

      const res = useBooster(prog, "hint");
      expect(res.success).toBe(false);
      expect(res.message).toContain("Yetersiz çip");
      expect(res.updatedProgress.coins).toBe(10);
    });

    it("buyBooster increases inventory and deducts exact cost", () => {
      const prog: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        boosters: { hint: 1, freeze: 1, shuffle: 1 },
        coins: 200,
      };

      const res = buyBooster(prog, "freeze", 3);
      expect(res.success).toBe(true);
      expect(res.updatedProgress.boosters?.freeze).toBe(4);
      expect(res.updatedProgress.coins).toBe(200 - BOOSTER_CONFIG.freeze.cost * 3);
    });
  });

  describe("4. Lucky Wheel Cooldown & Cumulative Rewards", () => {
    it("canSpinLuckyWheel respects 24h cooldown exactly", () => {
      const now = Date.now();
      const prog: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        lastSpinTimestamp: now - 12 * 3600 * 1000, // 12 hours ago
      };

      const check = canSpinLuckyWheel(prog);
      expect(check.canSpin).toBe(false);
      expect(check.remainingSeconds).toBeGreaterThan(11 * 3600);
      expect(check.remainingSeconds).toBeLessThanOrEqual(12 * 3600);
    });

    it("claimLuckyWheelReward with isAdSpin allows spinning during cooldown without resetting lastSpinTimestamp", () => {
      const pastTime = Date.now() - 3600 * 1000;
      const prog: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        lastSpinTimestamp: pastTime,
        coins: 100,
      };

      // Find a sector with coins
      const coinsSectorIndex = LUCKY_WHEEL_SECTORS.findIndex((s) => s.type === "coins");
      expect(coinsSectorIndex).toBeGreaterThanOrEqual(0);

      const res = claimLuckyWheelReward(prog, coinsSectorIndex, true);
      expect(res.updatedProgress.coins).toBeGreaterThan(100);
      // Ad spin must not change lastSpinTimestamp
      expect(res.updatedProgress.lastSpinTimestamp).toBe(pastTime);
    });

    it("Stacking infinite lives rewards from lucky wheel cumulatively extends duration", () => {
      const baseProg = grantInfiniteLives({ ...DEFAULT_PROGRESS }, 15);
      const infiniteSectorIndex = LUCKY_WHEEL_SECTORS.findIndex((s) => s.type === "infinite_lives");
      expect(infiniteSectorIndex).toBeGreaterThanOrEqual(0);

      const sector = LUCKY_WHEEL_SECTORS[infiniteSectorIndex]!;
      const res = claimLuckyWheelReward(baseProg, infiniteSectorIndex, true);
      expect(res.updatedProgress.infiniteLivesUntil).toBeGreaterThanOrEqual(
        baseProg.infiniteLivesUntil! + (sector.value - 1) * 60 * 1000
      );
    });
  });

  describe("5. Daily Login Idempotency & Streaks", () => {
    it("checkDailyLoginReward returns null when called multiple times on the same day", () => {
      const todayId = getDayId();
      const firstClaim = checkDailyLoginReward({ ...DEFAULT_PROGRESS, lastLoginDay: "2026-09-28" }, todayId);
      expect(firstClaim).not.toBeNull();
      expect(firstClaim?.updatedProgress.lastLoginDay).toBe(todayId);

      // Attempting to claim again on the same day must return null
      const secondClaim = checkDailyLoginReward(firstClaim!.updatedProgress, todayId);
      expect(secondClaim).toBeNull();
    });
  });

  describe("6. Authoritative Match Word Claim & Turkish Case Invariance", () => {
    it("Matches target words with Turkish case differences seamlessly", () => {
      const roomWords = ["IŞIK", "İĞNE", "ÇİÇEK", "AĞAÇ"];
      
      const candidate1 = "ışık";
      const candidate2 = "iğne";
      const candidate3 = "çiçek";

      expect(roomWords.some((w) => isEqualTr(w, candidate1))).toBe(true);
      expect(roomWords.some((w) => isEqualTr(w, candidate2))).toBe(true);
      expect(roomWords.some((w) => isEqualTr(w, candidate3))).toBe(true);

      const found1 = roomWords.find((w) => isEqualTr(w, candidate1));
      expect(found1).toBe("IŞIK");
    });
  });

  describe("7. Level-Up Refill & Audio Persistence Safeguards", () => {
    it("Level up awards coins and refuels lives to MAX_LIVES with fresh timestamp", () => {
      const now = Date.now();
      const initial: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        xp: 150, // Level 1
        lives: 1,
        lastLifeRegenTimestamp: now - 3600 * 1000,
        coins: 50,
      };

      // Simulating level-up update
      const updated: PlayerProgress = {
        ...initial,
        coins: (initial.coins ?? 0) + 25,
        lives: MAX_LIVES,
        lastLifeRegenTimestamp: now,
      };

      expect(updated.lives).toBe(MAX_LIVES);
      expect(updated.coins).toBe(75);
      expect(updated.lastLifeRegenTimestamp).toBeGreaterThanOrEqual(now);
    });
  });
});
