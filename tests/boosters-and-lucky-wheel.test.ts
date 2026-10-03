import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROGRESS,
  MAX_LIVES,
  getCalculatedLives,
  deductLife,
  grantInfiniteLives,
  buyLives,
  useBooster,
  buyBooster,
  canSpinLuckyWheel,
  claimLuckyWheelReward,
  mergePlayerProgress,
  BOOSTER_CONFIG,
  LUCKY_WHEEL_SECTORS,
  type PlayerProgress,
} from "../shared/progression";

describe("Boosters, Infinite Lives & Lucky Wheel Systems", () => {
  describe("1. Infinite Lives (Sonsuz Can) Engine", () => {
    it("grantInfiniteLives sets infiniteLivesUntil and refills lives to MAX_LIVES", () => {
      const now = Date.now();
      const prog = grantInfiniteLives({ ...DEFAULT_PROGRESS, infiniteLivesUntil: 0 }, 15);
      expect(prog.infiniteLivesUntil).toBeGreaterThan(now);
      expect(prog.infiniteLivesUntil).toBeLessThanOrEqual(now + 15 * 60 * 1000 + 500);
      expect(prog.lives).toBe(MAX_LIVES);
    });

    it("grantInfiniteLives cumulatively extends active duration", () => {
      const base = grantInfiniteLives({ ...DEFAULT_PROGRESS }, 10);
      const extended = grantInfiniteLives(base, 15);
      expect(extended.infiniteLivesUntil).toBeGreaterThanOrEqual(base.infiniteLivesUntil! + 14 * 60 * 1000);
    });

    it("getCalculatedLives returns isInfinite: true and infiniteRemainingSeconds", () => {
      const prog = grantInfiniteLives({ ...DEFAULT_PROGRESS, lives: 1 }, 20);
      const calc = getCalculatedLives(prog);
      expect(calc.isInfinite).toBe(true);
      expect(calc.lives).toBe(MAX_LIVES);
      expect(calc.infiniteRemainingSeconds).toBeGreaterThan(0);
      expect(calc.infiniteRemainingSeconds).toBeLessThanOrEqual(1200);
    });

    it("deductLife does NOT reduce lives when infinite lives are active", () => {
      const prog = grantInfiniteLives({ ...DEFAULT_PROGRESS }, 15);
      const initialLives = prog.lives;
      const afterDeduct = deductLife(prog);
      expect(afterDeduct.lives).toBe(initialLives);
      expect(afterDeduct.infiniteLivesUntil).toBe(prog.infiniteLivesUntil);
    });

    it("expired infinite lives revert to normal lives logic", () => {
      const pastTime = Date.now() - 5000;
      const prog: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        lives: 2,
        infiniteLivesUntil: pastTime,
      };
      const calc = getCalculatedLives(prog);
      expect(calc.isInfinite).toBeUndefined();
      expect(calc.lives).toBe(2);

      const afterDeduct = deductLife(prog);
      expect(afterDeduct.lives).toBe(1);
    });

    it("buyLives rejects purchase when infinite lives is active", () => {
      const prog = grantInfiniteLives({ ...DEFAULT_PROGRESS, coins: 500 }, 15);
      const res = buyLives(prog, "all");
      expect(res.success).toBe(false);
      expect(res.message).toBe("Sonsuz can süreniz devam ediyor!");
      expect(res.updatedProgress.coins).toBe(500);
    });
  });

  describe("2. Tactical Boosters (Güçlendiriciler) System", () => {
    it("useBooster consumes from inventory when available", () => {
      const prog: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        boosters: { hint: 3, freeze: 1, shuffle: 0 },
        coins: 10,
      };

      const res = useBooster(prog, "hint");
      expect(res.success).toBe(true);
      expect(res.updatedProgress.boosters!.hint).toBe(2);
      expect(res.updatedProgress.coins).toBe(10); // Coins untouched
    });

    it("useBooster uses coin fallback when inventory is zero", () => {
      const prog: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        boosters: { hint: 0, freeze: 0, shuffle: 0 },
        coins: 100,
      };

      const cost = BOOSTER_CONFIG.freeze.cost;
      const res = useBooster(prog, "freeze");
      expect(res.success).toBe(true);
      expect(res.updatedProgress.boosters!.freeze).toBe(0);
      expect(res.updatedProgress.coins).toBe(100 - cost);
    });

    it("useBooster fails when both inventory and coins are insufficient", () => {
      const prog: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        boosters: { hint: 0, freeze: 0, shuffle: 0 },
        coins: 5,
      };

      const res = useBooster(prog, "shuffle");
      expect(res.success).toBe(false);
      expect(res.updatedProgress.coins).toBe(5);
      expect(res.message.toLowerCase()).toContain("yetersiz");
    });

    it("buyBooster adds to inventory and deducts coins correctly", () => {
      const prog: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        boosters: { hint: 1, freeze: 0, shuffle: 0 },
        coins: 150,
      };

      const cost = BOOSTER_CONFIG.hint.cost * 2;
      const res = buyBooster(prog, "hint", 2);
      expect(res.success).toBe(true);
      expect(res.updatedProgress.boosters!.hint).toBe(3);
      expect(res.updatedProgress.coins).toBe(150 - cost);
    });

    it("buyBooster rejects when player has insufficient coins", () => {
      const prog: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        boosters: { hint: 0, freeze: 0, shuffle: 0 },
        coins: 10,
      };

      const res = buyBooster(prog, "shuffle", 1); // costs 20
      expect(res.success).toBe(false);
      expect(res.updatedProgress.boosters!.shuffle).toBe(0);
      expect(res.updatedProgress.coins).toBe(10);
    });
  });

  describe("3. Cyber Lucky Wheel (Siber Şans Çarkı) System", () => {
    it("canSpinLuckyWheel allows spin when lastSpinTimestamp is 0", () => {
      const prog: PlayerProgress = { ...DEFAULT_PROGRESS, lastSpinTimestamp: 0 };
      const status = canSpinLuckyWheel(prog);
      expect(status.canSpin).toBe(true);
      expect(status.remainingSeconds).toBe(0);
    });

    it("canSpinLuckyWheel enforces 24h cooldown after spin", () => {
      const now = Date.now();
      const prog: PlayerProgress = { ...DEFAULT_PROGRESS, lastSpinTimestamp: now };
      const status = canSpinLuckyWheel(prog);
      expect(status.canSpin).toBe(false);
      expect(status.remainingSeconds).toBeGreaterThan(0);
      expect(status.remainingSeconds).toBeLessThanOrEqual(24 * 60 * 60);
    });

    it("canSpinLuckyWheel allows spin once 24h cooldown expires", () => {
      const past25Hours = Date.now() - 25 * 60 * 60 * 1000;
      const prog: PlayerProgress = { ...DEFAULT_PROGRESS, lastSpinTimestamp: past25Hours };
      const status = canSpinLuckyWheel(prog);
      expect(status.canSpin).toBe(true);
      expect(status.remainingSeconds).toBe(0);
    });

    it("claimLuckyWheelReward awards coins properly", () => {
      const prog: PlayerProgress = { ...DEFAULT_PROGRESS, coins: 50 };
      const sectorIndex = LUCKY_WHEEL_SECTORS.findIndex((s) => s.type === "coins" && s.value === 50);
      const res = claimLuckyWheelReward(prog, sectorIndex);
      expect(res.updatedProgress.coins).toBe(100);
      expect(res.updatedProgress.lastSpinTimestamp).toBeGreaterThan(0);
    });

    it("claimLuckyWheelReward awards infinite lives properly", () => {
      const prog: PlayerProgress = { ...DEFAULT_PROGRESS, infiniteLivesUntil: 0 };
      const sectorIndex = LUCKY_WHEEL_SECTORS.findIndex((s) => s.type === "infinite_lives");
      const res = claimLuckyWheelReward(prog, sectorIndex);
      expect(res.updatedProgress.infiniteLivesUntil).toBeGreaterThan(Date.now());
      const calc = getCalculatedLives(res.updatedProgress);
      expect(calc.isInfinite).toBe(true);
    });

    it("claimLuckyWheelReward awards coins properly", () => {
      const prog: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        coins: 100,
      };
      const sectorIndex = LUCKY_WHEEL_SECTORS.findIndex((s) => s.type === "coins");
      const sector = LUCKY_WHEEL_SECTORS[sectorIndex]!;
      const res = claimLuckyWheelReward(prog, sectorIndex);
      expect(res.updatedProgress.coins).toBe(100 + sector.value);
    });

    it("claimLuckyWheelReward awards life refill", () => {
      const prog: PlayerProgress = { ...DEFAULT_PROGRESS, lives: 2 };
      const sectorIndex = LUCKY_WHEEL_SECTORS.findIndex((s) => s.type === "life");
      const sector = LUCKY_WHEEL_SECTORS[sectorIndex]!;
      const res = claimLuckyWheelReward(prog, sectorIndex);
      expect(res.updatedProgress.lives).toBe(2 + sector.value);
    });
  });

  describe("4. Cloud Sync & Progress Merging Integrity", () => {
    it("mergePlayerProgress preserves highest infiniteLivesUntil and booster balances", () => {
      const now = Date.now();
      const local: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        coins: 100,
        infiniteLivesUntil: now + 10 * 60 * 1000,
        lastSpinTimestamp: now - 3600000,
        boosters: { hint: 2, freeze: 1, shuffle: 0 },
      };

      const cloud: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        coins: 80,
        infiniteLivesUntil: now + 20 * 60 * 1000,
        lastSpinTimestamp: now - 1800000,
        boosters: { hint: 1, freeze: 3, shuffle: 2 },
      };

      const merged = mergePlayerProgress(local, cloud);
      expect(merged.infiniteLivesUntil).toBe(cloud.infiniteLivesUntil);
      expect(merged.lastSpinTimestamp).toBe(cloud.lastSpinTimestamp);
      expect(merged.boosters!.hint).toBe(2); // Math.max(2, 1)
      expect(merged.boosters!.freeze).toBe(3); // Math.max(1, 3)
      expect(merged.boosters!.shuffle).toBe(2); // Math.max(0, 2)
    });
  });
});
