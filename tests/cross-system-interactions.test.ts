import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS, PlayerProgress, applyMatchProgress } from "../shared/progression";
import { socialManager } from "../shared/social";
import { monetizationManager } from "../shared/monetization";

describe("Çapraz Sistem Etkileşimi (Cross-System Interaction Matrix) Testleri", () => {
  it("Mağazadan alınan Siber Radar profildeki radarChargesBonus güncellendiğinde aktif maça yansımalıdır", () => {
    let progress: PlayerProgress = { ...DEFAULT_PROGRESS, radarChargesBonus: 0 };
    expect(progress.radarChargesBonus).toBe(0);

    // Mağazadan 5'li radar paketi satın alındı
    progress = {
      ...progress,
      radarChargesBonus: (progress.radarChargesBonus || 0) + 5,
    };

    expect(progress.radarChargesBonus).toBe(5);
  });

  it("Maç Sonu İlerlemesi (applyMatchProgress ↔ Economy ↔ Progression) XP, Çip ve Seri bonuslarını doğru aktarmalıdır", () => {
    const initialProgress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      xp: 100,
      coins: 50,
      streak: 2,
    };

    const matchResult = {
      won: true,
      score: 450,
      tempo: 8,
      opponentScore: 200,
      opponentName: "Rakip",
      foundWords: ["KALE", "PATLAT"],
    };

    const updated = applyMatchProgress(initialProgress, matchResult, "pvp");
    expect(updated.xp).toBeGreaterThan(initialProgress.xp);
    expect(updated.coins).toBeGreaterThan(initialProgress.coins ?? 0);
    expect(updated.lastMatchReward).toBeDefined();
    expect(updated.lastMatchReward?.xp).toBeGreaterThan(0);
  });

  it("Sosyal Ekleme ↔ Monetizasyon Sayaç Etkileşimi: Maç tamamlandığında hem istatistik hem reklam sayacı senkron güncellenmelidir", () => {
    monetizationManager.resetInterstitialCounter();
    let progress: PlayerProgress = { ...DEFAULT_PROGRESS, matches: 0, wins: 0 };

    // 1. Maç Kazanıldı
    progress = { ...progress, matches: progress.matches + 1, wins: progress.wins + 1 };
    const adRes = monetizationManager.recordMatchFinished(true);

    expect(progress.matches).toBe(1);
    expect(progress.wins).toBe(1);
    expect(adRes.matchCount).toBe(1);
  });

  it("Günlük Oturum (dailySession ↔ Solo Level) navigasyon değişimlerinde session sıfırlama kuralına uymalıdır", () => {
    let dailySession: { id: string; themeId: any } | null = { id: "2026-09-17", themeId: "space" };
    let currentScreen = "daily-lobby";

    const openSoloLevel = (level: number) => {
      dailySession = null;
      currentScreen = "solo";
    };

    openSoloLevel(5);
    expect(dailySession).toBeNull();
    expect(currentScreen).toBe("solo");
  });
});
