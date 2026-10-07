import { describe, expect, it } from "vitest";
import {
  WORD_BOOK_MILESTONES,
  DEFAULT_PROGRESS,
  PlayerProgress,
  applyMatchProgress,
  completeDailyProgress,
  mergePlayerProgress,
} from "../shared/progression";
import { isEqualTr } from "../shared/tr-utils";

describe("Senior QA Test Suite: Kelime Defteri & Sözlük Müzesi (Word Discovery Codex)", () => {
  it("WORD_BOOK_MILESTONES artan hedef sayıları ve geçerli ödüller içermelidir", () => {
    expect(WORD_BOOK_MILESTONES.length).toBeGreaterThanOrEqual(5);

    let lastCount = 0;
    WORD_BOOK_MILESTONES.forEach((m) => {
      expect(m.count).toBeGreaterThan(lastCount);
      expect(m.rewardCoins).toBeGreaterThan(0);
      expect(m.title).toBeTruthy();
      expect(m.badgeIcon).toBeTruthy();
      lastCount = m.count;
    });

    const counts = WORD_BOOK_MILESTONES.map((m) => m.count);
    expect(counts).toEqual([25, 50, 100, 250, 500]);
  });

  it("Maçta bulunan kelimeler Türkçe büyük harfle normalize edilerek discoveredWords dizisine eklenmelidir", () => {
    let progress: PlayerProgress = { ...DEFAULT_PROGRESS, discoveredWords: [] };

    progress = applyMatchProgress(
      progress,
      {
        score: 120,
        tempo: 3.2,
        won: true,
        foundWords: ["kitap", "ışık", "İĞNE", "şeker", "su"], // 'su' is 2 letters, should be skipped
      },
      "pvp"
    );

    expect(progress.discoveredWords).toContain("KİTAP");
    expect(progress.discoveredWords).toContain("IŞIK");
    expect(progress.discoveredWords).toContain("İĞNE");
    expect(progress.discoveredWords).toContain("ŞEKER");
    // 2 harfli kelime dahil edilmemeli
    expect(progress.discoveredWords).not.toContain("SU");
  });

  it("Mükerrer kelimeler discoveredWords dizisine tekrar eklenmemelidir", () => {
    let progress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      discoveredWords: ["KİTAP", "GÜNEŞ"],
    };

    progress = applyMatchProgress(
      progress,
      {
        score: 90,
        tempo: 2.5,
        won: true,
        foundWords: ["kitap", "KİTAP", "deniz"],
      },
      "pvp"
    );

    const kitapCount = (progress.discoveredWords || []).filter((w) => isEqualTr(w, "KİTAP")).length;
    expect(kitapCount).toBe(1);
    expect(progress.discoveredWords).toContain("DENİZ");
    expect(progress.discoveredWords?.length).toBe(3);
  });

  it("Günlük rota tamamlandığında rota kelimeleri sözlük koleksiyonuna eklenmelidir", () => {
    let progress: PlayerProgress = { ...DEFAULT_PROGRESS, discoveredWords: [] };
    const daily = {
      id: "2026-10-15",
      variation: 99,
      level: 22,
      themeId: "space" as const,
      title: "GÜNÜN ROTASI",
      rewardXp: 120,
      words: ["ROKET", "UYDU", "AY"],
    };

    progress = completeDailyProgress(progress, daily, 100, 3, ["ROKET", "UYDU", "AY"]);

    expect(progress.discoveredWords).toContain("ROKET");
    expect(progress.discoveredWords).toContain("UYDU");
    // 'AY' 2 harfli olduğu için filtrelenmelidir
    expect(progress.discoveredWords).not.toContain("AY");
  });

  it("Cihazlar arası mergeProgress (senkronizasyon) kelime defterini ve alınan ödülleri kayıpsız birleştirmelidir", () => {
    const localProg: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      discoveredWords: ["ELMA", "ARMUT", "KİRAZ"],
      wordBookClaimedMilestones: { 25: true },
    };

    const remoteProg: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      discoveredWords: ["ARMUT", "ŞEFTALİ", "KAVUN"],
      wordBookClaimedMilestones: { 50: true },
    };

    const merged = mergePlayerProgress(localProg, remoteProg);

    expect(merged.discoveredWords?.length).toBe(5);
    expect(merged.discoveredWords).toContain("ELMA");
    expect(merged.discoveredWords).toContain("ARMUT");
    expect(merged.discoveredWords).toContain("KİRAZ");
    expect(merged.discoveredWords).toContain("ŞEFTALİ");
    expect(merged.discoveredWords).toContain("KAVUN");
    expect(merged.wordBookClaimedMilestones?.[25]).toBe(true);
    expect(merged.wordBookClaimedMilestones?.[50]).toBe(true);
  });
});
