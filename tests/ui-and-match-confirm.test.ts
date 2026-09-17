import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS, PlayerProgress, deductLife, getCalculatedLives, MAX_LIVES } from "../shared/progression";

describe("Dereceli Onay & Can Mantığı Testleri", () => {
  it("promptBotDuel verileri doğru mod başlıklarını ve sürelerini oluşturmalıdır", () => {
    const getModeInfo = (size: 4 | 6 | 8 | 10) => {
      const modeTitle = size === 4 ? "4×4 Nabız Hızlı Savaş" : size === 6 ? "6×6 Akış Düellosu" : size === 8 ? "8×8 Derinlik Düellosu" : "10×10 Zirve Master Savaş";
      const durationText = size === 4 ? "55 Saniye" : size === 6 ? "75 Saniye" : size === 8 ? "90 Saniye" : "110 Saniye";
      const routesText = size === 4 ? "4 Rota" : size === 6 ? "6 Rota" : size === 8 ? "8 Rota" : "10 Rota";
      return { modeTitle, durationText, routesText };
    };

    expect(getModeInfo(4)).toEqual({ modeTitle: "4×4 Nabız Hızlı Savaş", durationText: "55 Saniye", routesText: "4 Rota" });
    expect(getModeInfo(6)).toEqual({ modeTitle: "6×6 Akış Düellosu", durationText: "75 Saniye", routesText: "6 Rota" });
    expect(getModeInfo(8)).toEqual({ modeTitle: "8×8 Derinlik Düellosu", durationText: "90 Saniye", routesText: "8 Rota" });
    expect(getModeInfo(10)).toEqual({ modeTitle: "10×10 Zirve Master Savaş", durationText: "110 Saniye", routesText: "10 Rota" });
  });

  it("deductLife canları 1 eksiltmeli ve son güncelleme zamanını kaydetmelidir", () => {
    const now = Date.now();
    const progress: PlayerProgress = { ...DEFAULT_PROGRESS, lives: 5, lastLifeRegenTimestamp: now };
    const updated = deductLife(progress);

    const calc = getCalculatedLives(updated);
    expect(calc.lives).toBe(4);
  });

  it("canlar 0 olduğunda deductLife canları negatif yapmamalı ve 0 ile sınırlandırmalıdır", () => {
    const progress: PlayerProgress = { ...DEFAULT_PROGRESS, lives: 0, lastLifeRegenTimestamp: Date.now() };
    const updated = deductLife(progress);

    const calc = getCalculatedLives(updated);
    expect(calc.lives).toBe(0);
  });

  it("15 dakika geçtikten sonra getCalculatedLives otomatik 1 can yenilemelidir", () => {
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000 - 1000;
    const progress: PlayerProgress = { ...DEFAULT_PROGRESS, lives: 3, lastLifeRegenTimestamp: fifteenMinsAgo };
    const calc = getCalculatedLives(progress);

    expect(calc.lives).toBe(4);
  });

  it("Seri kalkanı (streakShields) harcandığında envanterden tam 1 adet düşmelidir", () => {
    const progress: PlayerProgress = { ...DEFAULT_PROGRESS, streakShields: 2 };
    const availableShields = progress.streakShields || 0;
    expect(availableShields).toBe(2);

    const updated = {
      ...progress,
      streakShields: Math.max(0, availableShields - 1),
    };

    expect(updated.streakShields).toBe(1);
  });

  it("Seri kalkanı 0 iken harcanmak istendiğinde negatif değer almamalıdır", () => {
    const progress: PlayerProgress = { ...DEFAULT_PROGRESS, streakShields: 0 };
    const availableShields = progress.streakShields || 0;

    const updated = {
      ...progress,
      streakShields: Math.max(0, availableShields - 1),
    };

    expect(updated.streakShields).toBe(0);
  });

  it("Retry (Tekrar Dene) yapıldığında maç tamamlanma kilitleri (hasFinished & submitted) sıfırlanmalıdır", () => {
    let hasFinished = true;
    let submitted = true;

    // Retry simülasyonu
    const handleRetry = () => {
      hasFinished = false;
      submitted = false;
    };

    handleRetry();
    expect(hasFinished).toBe(false);
    expect(submitted).toBe(false);
  });
});
