import { describe, it, expect } from "vitest";
import {
  LEAGUE_TIERS,
  DEFAULT_PROGRESS,
  getLeagueTier,
  applyMatchProgress,
  type PlayerProgress,
} from "../shared/progression";

describe("Live Rank & League Promotion Simulation (Canlı Rütbe Atlama Simülasyonu)", () => {
  it("0 LP Demir'den başlayıp kademe kademe Hakim Ligi'ne kadar yükselme simülasyonunu doğrular", () => {
    let progress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      lp: 0,
      xp: 0,
      wins: 0,
      matches: 0,
    };

    expect(getLeagueTier(progress).tier).toBe("DEMİR");

    // Simülasyon: Demir Ligi'nde maçlar kazanarak Bronz'a yüksel (Hedef: 350 LP)
    let matchCount = 0;
    while (progress.lp! < 350) {
      progress = applyMatchProgress(
        progress,
        {
          score: 130,
          tempo: 3.6, // Ezici galibiyet
          won: true,
          foundWords: ["ELMA", "ARMUT", "KIRAZ"],
        },
        "pvp"
      );
      matchCount++;
      expect(progress.lp).toBeGreaterThan(0);
    }

    expect(getLeagueTier(progress).tier).toBe("BRONZ");
    expect(matchCount).toBeLessThan(15); // Hızlı ve tatmin edici başlangıç ligi ilerlemesi

    // Bronz'dan Gümüş'e yüksel (Hedef: 900 LP)
    while (progress.lp! < 900) {
      progress = applyMatchProgress(
        progress,
        {
          score: 110,
          tempo: 2.5,
          won: true,
          foundWords: ["KALEM", "DEFTER"],
        },
        "pvp"
      );
    }
    expect(getLeagueTier(progress).tier).toBe("GÜMÜŞ");

    // Gümüş'ten Altın'a yüksel (Hedef: 1600 LP)
    while (progress.lp! < 1600) {
      progress = applyMatchProgress(
        progress,
        {
          score: 125,
          tempo: 3.5,
          won: true,
          foundWords: ["İSTANBUL", "TÜRKİYE"],
        },
        "pvp"
      );
    }
    expect(getLeagueTier(progress).tier).toBe("ALTIN");

    // Altın'dan Platin'e yüksel (Hedef: 2500 LP)
    while (progress.lp! < 2500) {
      progress = applyMatchProgress(
        progress,
        {
          score: 140,
          tempo: 3.8,
          won: true,
          foundWords: ["ŞAMPİYON", "PATLAMA"],
        },
        "pvp"
      );
    }
    expect(getLeagueTier(progress).tier).toBe("PLATİN");

    // Platin'den Elmas'a yüksel (Hedef: 3600 LP)
    while (progress.lp! < 3600) {
      progress = applyMatchProgress(
        progress,
        {
          score: 150,
          tempo: 3.9,
          won: true,
          foundWords: ["GÖKYÜZÜ", "YILDIZLAR"],
        },
        "pvp"
      );
    }
    expect(getLeagueTier(progress).tier).toBe("ELMAS");

    // Elmas Ligi'nde zorluk denetimi:
    // Elmas'ta bot maçı kazanıldığında LP artmamalıdır (0 LP - bot farm engeli)
    const lpBeforeBot = progress.lp!;
    const botProgress = applyMatchProgress(
      progress,
      {
        score: 120,
        tempo: 3.0,
        won: true,
        foundWords: ["KONTROL"],
      },
      "bot"
    );
    expect(botProgress.lp).toBe(lpBeforeBot); // Farm engeli çalışıyor!

    // Elmas Ligi'nde mağlubiyet cezası (-22 LP) galibiyet kazancından (+20 LP) fazladır.
    // Kazanma oranı %50'nin altındaysa oyuncu Elmas'ta yükselemez.
    const lpBeforeLoss = progress.lp!;
    const lossProgress = applyMatchProgress(
      progress,
      {
        score: 40,
        tempo: 1.0,
        won: false,
        foundWords: ["HATA"],
      },
      "pvp"
    );
    expect(lossProgress.lp).toBe(lpBeforeLoss - 22);

    // Kalkan testi: Galibiyet serisi varken ve kalkan varsa serinin kırılmadığını doğrula
    let streakPlayer: PlayerProgress = {
      ...progress,
      pvpWinStreak: 4,
      streakShields: 2,
    };
    const shieldedLoss = applyMatchProgress(
      streakPlayer,
      {
        score: 50,
        tempo: 1.2,
        won: false,
        foundWords: ["KORUMA"],
      },
      "pvp"
    );
    expect(shieldedLoss.pvpWinStreak).toBe(4); // Seri korundu!
    expect(shieldedLoss.streakShields).toBe(1); // 1 kalkan harcandı
    expect(shieldedLoss.lastMatchReward?.shieldUsed).toBe(true);
  });
});
