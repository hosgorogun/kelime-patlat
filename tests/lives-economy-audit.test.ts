import { describe, it, expect } from "vitest";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
  deductLife,
  buyLives,
  getCalculatedLives,
  grantInfiniteLives,
  claimLuckyWheelReward,
  useBooster,
  MAX_LIVES,
} from "../shared/progression";

describe("Tüm Oyun Can ve Çip/Ekonomi Denetimi", () => {
  it("Can eksilme: Normal durumda 1 can düşmeli, 0'ın altına inmemeli", () => {
    const full = { ...DEFAULT_PROGRESS, lives: 5 };
    const deducted = deductLife(full);
    expect(deducted.lives).toBe(4);

    const zero = { ...DEFAULT_PROGRESS, lives: 0 };
    const deductedZero = deductLife(zero);
    expect(deductedZero.lives).toBe(0);
  });

  it("Sonsuz Can: Sonsuz can aktifken can düşmemeli ve sonsuz olarak kalmalı", () => {
    const infinite = grantInfiniteLives(DEFAULT_PROGRESS, 30);
    expect(infinite.infiniteLivesUntil).toBeGreaterThan(Date.now());

    const calc = getCalculatedLives(infinite);
    expect(calc.isInfinite).toBe(true);
    expect(calc.lives).toBe(MAX_LIVES);

    const deducted = deductLife(infinite);
    expect(deducted.lives).toBe(MAX_LIVES);
    expect(deducted.infiniteLivesUntil).toBe(infinite.infiniteLivesUntil);
  });

  it("Can satın alma: Çip ile 1 can ve tüm canları yenileme bakiyeyi ve canı doğru güncellemeli", () => {
    const lowLives = { ...DEFAULT_PROGRESS, lives: 1, coins: 500 };

    // 1 can alma (COST_PER_LIFE = 20)
    const buyOne = buyLives(lowLives, "one");
    expect(buyOne.success).toBe(true);
    expect(buyOne.updatedProgress.lives).toBe(2);
    expect(buyOne.updatedProgress.coins).toBe(480); // 500 - 20

    // Tüm canları yenileme (COST_REFILL_ALL = 75)
    const buyAll = buyLives(lowLives, "all");
    expect(buyAll.success).toBe(true);
    expect(buyAll.updatedProgress.lives).toBe(MAX_LIVES);
    expect(buyAll.updatedProgress.coins).toBe(425); // 500 - 75
  });

  it("Can satın alma: Yetersiz çip olduğunda can vermemeli ve çip harcamamalı", () => {
    const broke = { ...DEFAULT_PROGRESS, lives: 1, coins: 10 };
    const res = buyLives(broke, "one");
    expect(res.success).toBe(false);
    expect(res.updatedProgress.lives).toBe(1);
    expect(res.updatedProgress.coins).toBe(10);
  });

  it("Can satın alma: Canlar zaten doluyken (5/5) çip harcatmamalı", () => {
    const full = { ...DEFAULT_PROGRESS, lives: 5, coins: 500 };
    const res = buyLives(full, "all");
    expect(res.success).toBe(false);
    expect(res.updatedProgress.coins).toBe(500);
    expect(res.message).toContain("Canlarınız zaten dolu");
  });

  it("Şans Çarkı: Can ödülü kazanıldığında can artmalı ve lastLifeRegenTimestamp doğru ayarlanmalı", () => {
    const prog: PlayerProgress = { ...DEFAULT_PROGRESS, lives: 2 };
    // Sector 1: +1 Can
    const result = claimLuckyWheelReward(prog, 1, false);
    expect(result.reward.type).toBe("life");
    expect(result.updatedProgress.lives).toBe(3);
    expect(result.updatedProgress.lastLifeRegenTimestamp).toBeDefined();
  });

  it("Joker kullanımı: Çip veya envanter kontrolü", () => {
    // Envanterde joker varken çip harcamadan envanterden düşmeli
    const withBoosters: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      coins: 100,
      boosters: { hint: 2, freeze: 1, shuffle: 1 },
    };
    const res1 = useBooster(withBoosters, "hint");
    expect(res1.success).toBe(true);
    expect(res1.updatedProgress.boosters?.hint).toBe(1);
    expect(res1.updatedProgress.coins).toBe(100);

    // Envanterde joker 0 iken çip ile satın alıp kullanmalı (hint cost: 25)
    const zeroBoosters: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      coins: 100,
      boosters: { hint: 0, freeze: 0, shuffle: 0 },
    };
    const res2 = useBooster(zeroBoosters, "hint");
    expect(res2.success).toBe(true);
    expect(res2.updatedProgress.coins).toBe(75); // 100 - 25
  });

  it("Joker kullanımı: Yetersiz çip olduğunda işlemi reddetmeli ve bakiye değişmemeli", () => {
    const broke: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      coins: 10,
      boosters: { hint: 0, freeze: 0, shuffle: 0 },
    };
    const res = useBooster(broke, "hint");
    expect(res.success).toBe(false);
    expect(res.updatedProgress.coins).toBe(10);
  });
});
