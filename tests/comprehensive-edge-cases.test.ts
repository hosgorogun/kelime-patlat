import { describe, expect, it } from "vitest";
import {
  getCalculatedLives,
  deductLife,
  buyLives,
  DEFAULT_PROGRESS,
  PlayerProgress,
  MAX_LIVES,
  COST_PER_LIFE,
  COST_REFILL_ALL,
  LIVES_REGEN_INTERVAL_MS,
  getDayId,
  getWeekId,
  getSeasonId,
  getLeagueTier,
  mergePlayerProgress,
} from "../shared/progression";

describe("Senior QA Edge Case Test Suiti - Derinlikli Sınır Durumları (Comprehensive Edge Cases)", () => {
  it("Can sistemi: Gelecek/geçersiz zaman damgalarında (time-drift/overflow) kendini korumalıdır", () => {
    const futureTime = Date.now() + 1000000;
    const progressWithFutureTime: Partial<PlayerProgress> = {
      lives: 2,
      lastLifeRegenTimestamp: futureTime,
    };

    const result = getCalculatedLives(progressWithFutureTime);
    expect(result.lives).toBe(2);
    expect(result.lastLifeRegenTimestamp).toBeLessThanOrEqual(Date.now());
  });

  it("Can sistemi: 0 can durumunda can düşüldüğünde eksiye düşmemelidir (-1 yerine 0)", () => {
    const emptyLivesProgress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      lives: 0,
    };

    const deducted = deductLife(emptyLivesProgress);
    expect(deducted.lives).toBe(0);
  });

  it("Can satın alma: Yetersiz çip olduğunda satın almayı engellemeli ve doğru hata vermelidir", () => {
    const poorProgress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      lives: 1,
      coins: 10, // COST_PER_LIFE 20
    };

    const res = buyLives(poorProgress, "one");
    expect(res.success).toBe(false);
    expect(res.message).toContain("Yetersiz çip");
    expect(res.updatedProgress.lives).toBe(1);
  });

  it("Can satın alma: Canlar zaten doluyken (5/5) satın almayı reddetmelidir", () => {
    const fullProgress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      lives: 5,
      coins: 500,
    };

    const res = buyLives(fullProgress, "all");
    expect(res.success).toBe(false);
    expect(res.message).toBe("Canlarınız zaten dolu!");
  });

  it("Zaman dönüşümleri: Sezon ID'si yıl sonu geçişlerinde (Aralık-Ocak) bozulmamalıdır", () => {
    const yearEnd = getSeasonId();
    expect(yearEnd).toMatch(/^\d{4}-S0[1-6]$/);
  });

  it("Lig kademeleri: LP eksi veya aşırı yüksek uç değerlerde çökmeksizin doğru kademeyi vermelidir", () => {
    expect(getLeagueTier(-500).tier).toBe("DEMİR");
    expect(getLeagueTier(999999).tier).toBe("RADIAN");
  });

  it("Kayıt birleştirme (mergePlayerProgress): Bozuk veya null veriler geldiğinde varsayılanları korumalıdır", () => {
    const localProg: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      xp: 1500,
      coins: 300,
    };

    const corruptServerProg = null as unknown as Partial<PlayerProgress>;
    const merged = mergePlayerProgress(localProg, corruptServerProg);

    expect(merged.xp).toBe(1500);
    expect(merged.coins).toBe(300);
  });
});
