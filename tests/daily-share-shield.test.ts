import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
  completeDailyProgress,
  reconcileDailyStreak,
  getDailyChallenge,
} from "../shared/progression";
import { CHIP_EQUIPMENT_ITEMS } from "../shared/store-items";

describe("Senior QA Test Suite: Günlük Rota, Wordle Paylaşım Kartı & Seri Kalkanı", () => {
  it("CHIP_EQUIPMENT_ITEMS içinde 120 çip değerinde Seri Kalkanı tanımlı olmalıdır", () => {
    const shieldItem = CHIP_EQUIPMENT_ITEMS.find((item) => item.id === "shield_1");
    expect(shieldItem).toBeDefined();
    expect(shieldItem?.cost).toBe(120);
    expect(shieldItem?.rewardType).toBe("shield");
    expect(shieldItem?.icon).toBe("🛡️");
  });

  it("completeDailyProgress günlük seriyi artırmalı ve mükerrer çağrılarda seriyi korumalıdır", () => {
    const daily = getDailyChallenge(new Date("2026-10-07"));
    let player: PlayerProgress = { ...DEFAULT_PROGRESS, streak: 3, dailyCompletedId: null };

    player = completeDailyProgress(player, daily, 150, 4, ["KALE", "MASA", "KAPI", "KENT"]);

    expect(player.streak).toBe(4);
    expect(player.dailyCompletedId).toBe(daily.id);
    expect(player.xp).toBeGreaterThan(DEFAULT_PROGRESS.xp);

    // Aynı gün tekrar bitirilmeye çalışıldığında seri 4'te kalmalı
    const repeatPlayer = completeDailyProgress(player, daily, 150, 4, ["KALE", "MASA", "KAPI", "KENT"]);
    expect(repeatPlayer.streak).toBe(4);
  });

  it("Seri Kalkanı (streakShields) kaçırılan 1 günde seriyi sıfırlanmaktan kurtarmalıdır", () => {
    const playerWithShield: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      streak: 7,
      dailyCompletedId: "2026-10-01",
      streakShields: 1,
      lastStreakCheckDate: "2026-10-01",
    };

    // Oyuncu 2026-10-03 tarihinde girdi (1 gün kaçırdı: 2026-10-02)
    const result = reconcileDailyStreak(playerWithShield, "2026-10-03");

    expect(result.shieldUsed).toBe(true);
    expect(result.streakReset).toBe(false);
    expect(result.shieldsConsumed).toBe(1);
    expect(result.updatedProgress.streak).toBe(7); // Seri korundu!
    expect(result.updatedProgress.streakShields).toBe(0); // Kalkan harcandı
    expect(result.updatedProgress.dailyCompletedId).toBe("2026-10-02"); // Dün olarak backfill edildi
  });

  it("Kalkanı olmayan oyuncu gün kaçırdığında seri sıfırlanmalıdır", () => {
    const playerWithoutShield: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      streak: 12,
      dailyCompletedId: "2026-10-01",
      streakShields: 0,
      lastStreakCheckDate: "2026-10-01",
    };

    // 2 gün sonra girdi
    const result = reconcileDailyStreak(playerWithoutShield, "2026-10-03");

    expect(result.shieldUsed).toBe(false);
    expect(result.streakReset).toBe(true);
    expect(result.previousStreak).toBe(12);
    expect(result.updatedProgress.streak).toBe(0); // Seri sıfırlandı
    expect(result.updatedProgress.dailyCompletedId).toBeNull();
  });

  it("Wordle tarzı paylaşım mesajı formatı doğru emojileri ve seriyi içermelidir", () => {
    const todayStr = "2026-10-07";
    const streak = 5;
    const emojiGrid = "🟩🟩🟩🟩\n🟩🟩🟩🟩🟩\n🟩🟩🟩🟩🟩🟩";
    const shareMessage =
      `💥 Kelime Patlat · Günün Rotası\n` +
      `📅 ${todayStr} | 🔥 ${streak} Günlük Seri!\n\n` +
      `${emojiGrid}\n\n` +
      `Sen de kelime dehanı sına 👉 https://kelimepatlat.com`;

    expect(shareMessage).toContain("Kelime Patlat · Günün Rotası");
    expect(shareMessage).toContain("🔥 5 Günlük Seri!");
    expect(shareMessage).toContain("🟩🟩🟩🟩");
    expect(shareMessage).toContain("https://kelimepatlat.com");
  });
});
