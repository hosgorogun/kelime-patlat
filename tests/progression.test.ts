import { describe, expect, it } from "vitest";

import { createSoloBoard } from "../shared/solo";
import { applyMatchProgress, AVATARS, badgesFor, completeDailyProgress, DEFAULT_PROGRESS, getDailyChallenge, getDayId, THEME_PACKS } from "../shared/progression";
import { catalogWordsForTheme } from "../shared/word-catalog";
import { inviteMessage, normalizeRoomCode } from "../shared/invite";

describe("Günlük rota ve sezon ilerlemesi", () => {
  it("aynı takvim günü için aynı günlük rota kimliğini ve sabit varyasyonu üretir", () => {
    const date = new Date("2026-08-19T09:30:00");
    const first = getDailyChallenge(date);
    const second = getDailyChallenge(date);
    expect(first).toEqual(second);
    expect(first.id).toBe(getDayId(date));
    expect(first.level).toBeGreaterThanOrEqual(6);
    expect(first.level).toBeLessThanOrEqual(8);
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
  });

  it("her tema paketi seçilebilir kelimeler ve geçerli tek oyunculu rota üretir", () => {
    THEME_PACKS.forEach((pack) => {
      expect(catalogWordsForTheme(6, pack.id).length).toBeGreaterThanOrEqual(3);
      const challenge = createSoloBoard(4, 37, pack.id);
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
    const seasoned = { ...DEFAULT_PROGRESS, xp: 600, bestArcadeScore: 500, matches: 6, wins: 1, streak: 3, missions: { daily: 1, duels: 2, wordsmith: 1 } };
    expect(badgesFor(seasoned).every((badge) => badge.unlocked)).toBe(true);
  });

  it("davet kodunu güvenli biçimde normalleştirip paylaşılabilir mesajı üretir", () => {
    expect(normalizeRoomCode(" ab12c ")).toBe("AB12C");
    expect(normalizeRoomCode("abc")).toBeNull();
    expect(normalizeRoomCode(["ABCDE"])).toBeNull();
    expect(inviteMessage("AB12C", "kelime://room?code=AB12C")).toContain("AB12C");
  });
});
