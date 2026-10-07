import { describe, it, expect } from "vitest";
import {
  isWeekendActive,
  getWeekendHuntEvent,
  isWeekendTargetWord,
  recordWeekendHuntWords,
  claimWeekendHuntReward,
  WEEKEND_THEMES,
} from "../shared/weekend-hunt";
import { DEFAULT_PROGRESS, PlayerProgress } from "../shared/progression/progression.types";
import { completeDailyProgress, applyMatchProgress } from "../shared/progression/match-progress";
import { mergePlayerProgress } from "../shared/progression/merge-progress";

describe("Hafta Sonu Tematik Kelime Avı (Weekend Hunt)", () => {
  it("Hafta sonu aktiflik kontrolünü Cuma, Cumartesi ve Pazar günleri için doğru belirler", () => {
    // 2026-10-09 is Friday (day 5)
    const friday = new Date(2026, 9, 9, 14, 0, 0);
    // 2026-10-10 is Saturday (day 6)
    const saturday = new Date(2026, 9, 10, 14, 0, 0);
    // 2026-10-11 is Sunday (day 0)
    const sunday = new Date(2026, 9, 11, 14, 0, 0);
    // 2026-10-12 is Monday (day 1)
    const monday = new Date(2026, 9, 12, 14, 0, 0);

    expect(isWeekendActive(friday)).toBe(true);
    expect(isWeekendActive(saturday)).toBe(true);
    expect(isWeekendActive(sunday)).toBe(true);
    expect(isWeekendActive(monday)).toBe(false);
  });

  it("Aynı hafta için deterministik etkinlik üretir", () => {
    const d1 = new Date(2026, 9, 10, 10, 0, 0);
    const d2 = new Date(2026, 9, 11, 18, 0, 0);

    const event1 = getWeekendHuntEvent(d1);
    const event2 = getWeekendHuntEvent(d2);

    expect(event1.eventId).toBe(event2.eventId);
    expect(event1.themeTitle).toBe(event2.themeTitle);
    expect(event1.targetWords).toEqual(event2.targetWords);
    expect(event1.targetWords.length).toBe(5);
  });

  it("Türkçe karakterleri (İ/i, I/ı) doğru normalize ederek hedef kelimeyi eşleştirir", () => {
    const targetWords = ["YILDIZ", "GALAKSİ", "GEZEGEN"];

    expect(isWeekendTargetWord("yıldız", targetWords)).toBe(true);
    expect(isWeekendTargetWord("galaksi", targetWords)).toBe(true);
    expect(isWeekendTargetWord("GALAKSİ", targetWords)).toBe(true);
    expect(isWeekendTargetWord("gezegen", targetWords)).toBe(true);
    expect(isWeekendTargetWord("ELMA", targetWords)).toBe(false);
  });

  it("Oyunda bulunan kelimeleri av kayıtlarına ekler ve mükerrer kayıtları engeller", () => {
    const event = WEEKEND_THEMES[0]!;
    const huntEvent = { ...event, eventId: "test-event-1" };
    let player: PlayerProgress = { ...DEFAULT_PROGRESS };

    // Player finds 1 target word and 2 random words
    player = recordWeekendHuntWords(player, ["MASA", "yıldız", "KİTAP"], huntEvent);

    expect(player.weekendHunt?.foundWords.length).toBe(1);
    expect(player.weekendHunt?.foundWords[0]).toBe("YILDIZ");

    // Finding the same word again does not duplicate
    player = recordWeekendHuntWords(player, ["YILDIZ"], huntEvent);
    expect(player.weekendHunt?.foundWords.length).toBe(1);

    // Finding another target word adds it
    player = recordWeekendHuntWords(player, ["galaksi"], huntEvent);
    expect(player.weekendHunt?.foundWords.length).toBe(2);
    expect(player.weekendHunt?.foundWords).toContain("GALAKSİ");
  });

  it("Kademe ödüllerini hedeflere ulaşıldığında verir, mükerrer alımı engeller", () => {
    const event = WEEKEND_THEMES[0]!;
    const huntEvent = { ...event, eventId: "test-event-rewards" };
    let player: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      coins: 10,
      xp: 100,
      streakShields: 0,
      weekendHunt: {
        eventId: "test-event-rewards",
        foundWords: ["YILDIZ", "GALAKSİ", "GEZEGEN", "KUASAR", "YÖRÜNGE"],
        claimedTiers: [],
      },
    };

    // Claim Tier 0 (1 word: +100 XP, +30 Coins)
    const res0 = claimWeekendHuntReward(player, 0, huntEvent);
    expect(res0).not.toBeNull();
    player = res0!.updatedProgress;
    expect(player.xp).toBe(200);
    expect(player.coins).toBe(40);
    expect(player.weekendHunt?.claimedTiers).toContain(0);

    // Claiming Tier 0 again should fail
    const res0Repeat = claimWeekendHuntReward(player, 0, huntEvent);
    expect(res0Repeat).toBeNull();

    // Claim Tier 2 (5 words: +350 XP, +120 Coins, +1 Shield)
    const res2 = claimWeekendHuntReward(player, 2, huntEvent);
    expect(res2).not.toBeNull();
    player = res2!.updatedProgress;
    expect(player.xp).toBe(550);
    expect(player.coins).toBe(160);
    expect(player.streakShields).toBe(1);
    expect(player.weekendHunt?.claimedTiers).toContain(2);
  });

  it("completeDailyProgress ile günlük kelimeler sözlük müzesine (discoveredWords) ve hafta sonu avına işlenir", () => {
    const daily = {
      id: "2026-10-10",
      variation: 123,
      level: 25,
      themeId: "nature" as const,
      title: "GÜNÜN ROTASI",
      rewardXp: 120,
      words: ["KİTAP", "GÜNEŞ", "DENİZ"],
    };

    let player: PlayerProgress = { ...DEFAULT_PROGRESS };
    player = completeDailyProgress(player, daily, 150, 3, ["KİTAP", "GÜNEŞ", "DENİZ"]);

    expect(player.discoveredWords).toContain("KİTAP");
    expect(player.discoveredWords).toContain("GÜNEŞ");
    expect(player.discoveredWords).toContain("DENİZ");
    expect(player.streak).toBe(1);
  });

  it("mergeProgress hafta sonu avını (weekendHunt) yerel ve sunucu arasında kayıpsız birleştirir", () => {
    const localProg: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      weekendHunt: {
        eventId: "weekend-2026-W41",
        foundWords: ["YILDIZ", "GALAKSİ"],
        claimedTiers: [0],
      },
    };

    const remoteProg: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      weekendHunt: {
        eventId: "weekend-2026-W41",
        foundWords: ["GALAKSİ", "GEZEGEN"],
        claimedTiers: [0, 1],
      },
    };

    const merged = mergePlayerProgress(localProg, remoteProg);

    expect(merged.weekendHunt?.eventId).toBe("weekend-2026-W41");
    expect(merged.weekendHunt?.foundWords).toHaveLength(3);
    expect(merged.weekendHunt?.foundWords).toContain("YILDIZ");
    expect(merged.weekendHunt?.foundWords).toContain("GALAKSİ");
    expect(merged.weekendHunt?.foundWords).toContain("GEZEGEN");
    expect(merged.weekendHunt?.claimedTiers).toContain(0);
    expect(merged.weekendHunt?.claimedTiers).toContain(1);
  });
});
