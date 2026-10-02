import { describe, expect, it } from "vitest";
import {
  ARCADE_INITIAL_TIME,
  MAX_ARCADE_TIME,
  getNextArcadeSeed,
  getArcadeBoardClearBonus,
  calculateArcadeCombo,
  createSoloBoard,
} from "../shared/solo";
import { applyArcadeProgress, DEFAULT_PROGRESS } from "../shared/progression";

describe("Arcade Modu Dengeleme ve İlerleme Testleri", () => {
  it("başlangıç süresi ve maksimum süre tavanı doğru tanımlanmıştır", () => {
    expect(ARCADE_INITIAL_TIME).toBe(45);
    expect(MAX_ARCADE_TIME).toBe(85);
    expect(ARCADE_INITIAL_TIME).toBeLessThan(MAX_ARCADE_TIME);
  });

  it("skora göre seviye tohumu geçişleri tüm tahta boyutlarını (4x4, 6x6, 8x8, 10x10) destekler", () => {
    // 0 - 999: 4x4 Akıcı Blitz Tahtaları (Seviye 1-15, ilk ~5-6 tahta)
    for (let seed = 1; seed <= 15; seed++) {
      const nextSeed = getNextArcadeSeed(500, seed);
      expect(nextSeed).toBeGreaterThanOrEqual(1);
      expect(nextSeed).toBeLessThanOrEqual(15);
      const board = createSoloBoard(nextSeed, 1, "general");
      expect(board.size).toBe(4);
    }

    // 1000 - 2499: 6x6 Isınmış Taktiksel Tahtalar (Seviye 16-45)
    for (let seed = 1; seed <= 30; seed++) {
      const nextSeed = getNextArcadeSeed(1500, seed);
      expect(nextSeed).toBeGreaterThanOrEqual(16);
      expect(nextSeed).toBeLessThanOrEqual(45);
      const board = createSoloBoard(nextSeed, 1, "general");
      expect(board.size).toBe(6);
    }

    // 2500 - 4499: 8x8 Usta Tahtaları (Seviye 46-75)
    for (let seed = 1; seed <= 30; seed++) {
      const nextSeed = getNextArcadeSeed(3000, seed);
      expect(nextSeed).toBeGreaterThanOrEqual(46);
      expect(nextSeed).toBeLessThanOrEqual(75);
      const board = createSoloBoard(nextSeed, 1, "general");
      expect(board.size).toBe(8);
    }

    // 4500+: 10x10 Kozmik Şampiyon Tahtaları (Seviye 76-100)
    for (let seed = 1; seed <= 30; seed++) {
      const nextSeed = getNextArcadeSeed(5000, seed);
      expect(nextSeed).toBeGreaterThanOrEqual(76);
      expect(nextSeed).toBeLessThanOrEqual(100);
      const board = createSoloBoard(nextSeed, 1, "general");
      expect(board.size).toBe(10);
    }
  });

  it("tahta temizleme ve kademe atlama bonusları kademeye göre doğru süre verir", () => {
    // 4x4 tahta aynı boyutta kalırsa +12s, 6x6'ya mezun olursa +22s
    expect(getArcadeBoardClearBonus(4, 4)).toBe(12);
    expect(getArcadeBoardClearBonus(4, 6)).toBe(22);

    // 6x6 tahta aynı boyutta kalırsa +16s, 8x8'e mezun olursa +26s
    expect(getArcadeBoardClearBonus(6, 6)).toBe(16);
    expect(getArcadeBoardClearBonus(6, 8)).toBe(26);

    // 8x8 tahta aynı boyutta kalırsa +20s, 10x10'a mezun olursa +30s
    expect(getArcadeBoardClearBonus(8, 8)).toBe(20);
    expect(getArcadeBoardClearBonus(8, 10)).toBe(30);

    // 10x10 sonsuz aşama temizleme bonusu: +24s
    expect(getArcadeBoardClearBonus(10, 10)).toBe(24);
  });

  it("kombo çarpanı seriye göre doğru ek süre ve bonus puan hesaplar", () => {
    // Kombo 1: normal, bonus yok
    const c1 = calculateArcadeCombo(1);
    expect(c1.bonusSeconds).toBe(0);
    expect(c1.bonusScore).toBe(0);

    // Kombo 2: +1s, +15 puan
    const c2 = calculateArcadeCombo(2);
    expect(c2.bonusSeconds).toBe(1);
    expect(c2.bonusScore).toBe(15);
    expect(c2.label).toContain("x2");

    // Kombo 3: +2s, +30 puan
    const c3 = calculateArcadeCombo(3);
    expect(c3.bonusSeconds).toBe(2);
    expect(c3.bonusScore).toBe(30);
    expect(c3.label).toContain("x3");

    // Kombo 4: +3s, +45 puan
    const c4 = calculateArcadeCombo(4);
    expect(c4.bonusSeconds).toBe(3);
    expect(c4.bonusScore).toBe(45);
    expect(c4.label).toContain("x4");

    // Kombo 5+ (Fever): +4s, +65 puan
    const c5 = calculateArcadeCombo(5);
    expect(c5.bonusSeconds).toBe(4);
    expect(c5.bonusScore).toBe(65);
    expect(c5.label).toContain("SÜPER ALEV");

    const c6 = calculateArcadeCombo(6);
    expect(c6.bonusSeconds).toBe(4);
    expect(c6.bonusScore).toBe(65);
    expect(c6.label).toContain("x6");
  });

  it("yüksek arcade skorları ve kelime sayıları ilerleme sistemine doğru yazılır", () => {
    const p1 = applyArcadeProgress(DEFAULT_PROGRESS, 3500, 48);
    expect(p1.bestArcadeScore).toBe(3500);
    expect(p1.xp).toBeGreaterThan(DEFAULT_PROGRESS.xp);
    expect(p1.coins).toBeGreaterThan(0);
    expect(p1.matchHistory?.[0]?.wordsCount).toBe(48);

    // 2X ödül testi
    const p2 = applyArcadeProgress(p1, 3500, 48, true);
    expect(p2.matchHistory?.length).toBe(1); // Tekrar kayıt oluşmamalı
    expect(p2.xp).toBeGreaterThan(p1.xp);
    expect(p2.coins).toBeGreaterThan(p1.coins!);
  });
});
