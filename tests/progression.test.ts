import { describe, expect, it } from "vitest";

import { createSoloBoard } from "../shared/solo";
import { applyMatchProgress, applyArcadeProgress, AVATARS, badgesFor, completeDailyProgress, DEFAULT_PROGRESS, getDailyChallenge, getDayId, THEME_PACKS, isAvatarUnlocked, getActiveCyberTitle, getDailyMysteryWord } from "../shared/progression";
import { catalogWordsForTheme } from "../shared/word-catalog";
import { inviteMessage, normalizeRoomCode } from "../shared/invite";
import { getWordDefinition } from "../shared/dictionary";

describe("Günlük rota ve sezon ilerlemesi", () => {
  it("aynı takvim günü için aynı günlük rota kimliğini ve sabit varyasyonu üretir", () => {
    const date = new Date("2026-08-19T09:30:00");
    const first = getDailyChallenge(date);
    const second = getDailyChallenge(date);
    expect(first).toEqual(second);
    expect(first.id).toBe(getDayId(date));
    expect(first.level).toBeGreaterThanOrEqual(20);
    expect(first.level).toBeLessThanOrEqual(24);
  });

  it("günlük ödülü aynı gün iki kez yazılmaz ve seri yalnız yeni günlükte artar", () => {
    const daily = getDailyChallenge(new Date("2026-08-19T09:30:00"));
    const claimed = completeDailyProgress(DEFAULT_PROGRESS, daily);
    const claimedAgain = completeDailyProgress(claimed, daily);
    expect(claimed.xp).toBe(daily.rewardXp);
    expect(claimed.streak).toBe(1);
    expect(claimed.missions.daily).toBe(1);
    expect(claimedAgain).toEqual(claimed);
  });

  it("maç raporu galibiyet, rekor, tempo ve görev ilerlemesini günceller", () => {
    const updated = applyMatchProgress(DEFAULT_PROGRESS, { score: 88, tempo: 4.5, won: true, longWord: true });
    expect(updated.matches).toBe(1);
    expect(updated.wins).toBe(1);
    expect(updated.bestScore).toBe(88);
    expect(updated.bestTempo).toBe(4.5);
    expect(updated.missions.duels).toBe(1);
    expect(updated.missions.wordsmith).toBe(1);
    expect(updated.xp).toBeGreaterThan(DEFAULT_PROGRESS.xp);

    const autoWordsmith = applyMatchProgress(DEFAULT_PROGRESS, { score: 50, tempo: 2, won: false, foundWords: ["DENEMELER"] });
    expect(autoWordsmith.missions.wordsmith).toBe(1);
  });

  it("arcade raporu en yüksek skoru ve XP ilerlemesini günceller", () => {
    const updated = applyArcadeProgress(DEFAULT_PROGRESS, 120);
    expect(updated.bestArcadeScore).toBe(120);
    expect(updated.xp).toBe(12); // 120 / 10 = 12 XP
    expect(updated.matches).toBe(0); // matches should not increment
  });

  it("başarı rozetlerinin kilit açılma şartlarını doğru değerlendirir", () => {
    const fresh = badgesFor(DEFAULT_PROGRESS);
    expect(fresh.every((b) => !b.unlocked)).toBe(true);

    const advanced = badgesFor({
      ...DEFAULT_PROGRESS,
      matches: 6,
      wins: 1,
      streak: 7,
      bestArcadeScore: 550,
      xp: 650,
      missions: { daily: 1, duels: 2, wordsmith: 1 },
    });
    expect(advanced.every((b) => b.unlocked)).toBe(true);
  });

  it("her tema paketi seçilebilir kelimeler ve geçerli tek oyunculu rota üretir", () => {
    THEME_PACKS.forEach((pack) => {
      expect(catalogWordsForTheme(6, pack.id).length).toBeGreaterThanOrEqual(3);
      const challenge = createSoloBoard(16, 37, pack.id);
      expect(challenge.board).toHaveLength(36);
      expect(challenge.board.every(Boolean)).toBe(true);
      expect(challenge.words.length).toBeGreaterThanOrEqual(4);
    });
  });

  it("avatar koleksiyonu seçilebilir kimlikler sunar ve rozetler ilerlemeye göre açılır", () => {
    expect(AVATARS).toHaveLength(6);
    expect(AVATARS.some((avatar) => avatar.id === DEFAULT_PROGRESS.selectedAvatar)).toBe(true);
    const rookieBadges = badgesFor(DEFAULT_PROGRESS);
    expect(rookieBadges.every((badge) => !badge.unlocked)).toBe(true);
    const seasoned = { ...DEFAULT_PROGRESS, xp: 600, bestArcadeScore: 500, matches: 6, wins: 1, streak: 7, missions: { daily: 1, duels: 2, wordsmith: 1 } };
    expect(badgesFor(seasoned).every((badge) => badge.unlocked)).toBe(true);
  });

  it("davet kodunu güvenli biçimde normalleştirip paylaşılabilir mesajı üretir", () => {
    expect(normalizeRoomCode(" ab12c ")).toBe("AB12C");
    expect(normalizeRoomCode("abc")).toBeNull();
    expect(normalizeRoomCode(["ABCDE"])).toBeNull();
    expect(inviteMessage("AB12C", "kelime://room?code=AB12C")).toContain("AB12C");
  });

  it("avatar kilit açma milestones durumlarını doğru kontrol eder", () => {
    // KIVILCIM (spark) her zaman açık olmalı
    expect(isAvatarUnlocked("spark", DEFAULT_PROGRESS)).toBe(true);

    // YÖRÜNGE (orbit) seviye 3 gerektirir (xp 0 = seviye 1, xp 400 = seviye 3)
    expect(isAvatarUnlocked("orbit", DEFAULT_PROGRESS)).toBe(false);
    expect(isAvatarUnlocked("orbit", { ...DEFAULT_PROGRESS, xp: 400 })).toBe(true);

    // BİLGE (sage) seviye 6 gerektirir (xp 1000 = seviye 6)
    expect(isAvatarUnlocked("sage", DEFAULT_PROGRESS)).toBe(false);
    expect(isAvatarUnlocked("sage", { ...DEFAULT_PROGRESS, xp: 1000 })).toBe(true);

    // KUYRUKLU (comet) arcade skoru 400 gerektirir
    expect(isAvatarUnlocked("comet", DEFAULT_PROGRESS)).toBe(false);
    expect(isAvatarUnlocked("comet", { ...DEFAULT_PROGRESS, bestArcadeScore: 400 })).toBe(true);

    // TAÇ (crown) galibiyet 5 gerektirir
    expect(isAvatarUnlocked("crown", DEFAULT_PROGRESS)).toBe(false);
    expect(isAvatarUnlocked("crown", { ...DEFAULT_PROGRESS, wins: 5 })).toBe(true);

    // KOR (ember) seri 5 gerektirir
    expect(isAvatarUnlocked("ember", DEFAULT_PROGRESS)).toBe(false);
    expect(isAvatarUnlocked("ember", { ...DEFAULT_PROGRESS, streak: 5 })).toBe(true);
  });

  it("kelime sözlük tanımlarını ve fallback yapısını doğru çözer", () => {
    // Bilinen kelimelerin tanımlarını alabilmeli
    expect(getWordDefinition("AY")).toBe("Dünya'nın tek doğal uydusu olan gök cismi.");
    expect(getWordDefinition("ADA")).toBe("Dört tarafı tamamen suyla çevrili kara parçası.");

    // Küçük harfle arandığında da doğru dönmeli (büyük harfe dönüştürülmeli)
    expect(getWordDefinition("ay")).toBe("Dünya'nın tek doğal uydusu olan gök cismi.");
    expect(getWordDefinition("deniz")).toBe("Yeryüzünün büyük kısmını kaplayan geniş tuzlu su kütlesi.");

    // Bilinmeyen kelimelerde siberpunk fallback metnini dönmeli
    expect(getWordDefinition("BİLİNMEYEN")).toContain("Kelime Patlat ile kelime dağarcığını zenginleştir!");
  });

  it("siber unvanları ve günün gizemli kelimesini doğru çözer", () => {
    expect(getActiveCyberTitle(DEFAULT_PROGRESS)).toBe("[ÇAYLAK]");
    expect(getActiveCyberTitle({ ...DEFAULT_PROGRESS, matches: 3 })).toBe("[İZCİ]");
    expect(getActiveCyberTitle({ ...DEFAULT_PROGRESS, xp: 500 })).toBe("[MİMAR]");

    const mystery = getDailyMysteryWord(new Date("2026-08-19"));
    expect(mystery.word).toBeTruthy();
    expect(mystery.definition).toBeTruthy();
    expect(mystery.rewardXp).toBe(150);
    expect(DEFAULT_PROGRESS.streakShields).toBe(1);
  });

  it("günün gizemli kelimesi ve görev tamamlamaları için ekstra XP ve çip ödülü verir", () => {
    const mystery = getDailyMysteryWord();
    // Finding the mystery word awards +150 XP bonus
    const resultWithMystery = applyMatchProgress(DEFAULT_PROGRESS, {
      score: 100,
      tempo: 3,
      won: true,
      foundWords: [mystery.word],
    }, "pvp");

    expect(resultWithMystery.xp).toBeGreaterThanOrEqual(150 + 40 + 25);
    expect(resultWithMystery.coins).toBe((DEFAULT_PROGRESS.coins ?? 50) + 25);
    // Completing duels mission (2/2) gives +80 XP bonus
    const duel2 = applyMatchProgress({ ...DEFAULT_PROGRESS, missions: { daily: 0, duels: 1, wordsmith: 0 } }, {
      score: 50,
      tempo: 2,
      won: false,
    }, "pvp");
    expect(duel2.missions.duels).toBe(2);
    expect(duel2.xp).toBe(40 + 80); // 40 pvp + 80 mission reward
  });
});
