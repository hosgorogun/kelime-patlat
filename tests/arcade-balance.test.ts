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
    expect(ARCADE_INITIAL_TIME).toBe(40);
    expect(MAX_ARCADE_TIME).toBe(65);
    expect(ARCADE_INITIAL_TIME).toBeLessThan(MAX_ARCADE_TIME);
  });

  it("skora göre seviye tohumu geçişleri tüm tahta boyutlarını (4x4, 6x6, 8x8, 10x10) destekler", () => {
    // 0 - 319: 4x4 Tahtalar (Seviye 1-15)
    for (let seed = 1; seed <= 15; seed++) {
      const nextSeed = getNextArcadeSeed(150, seed);
      expect(nextSeed).toBeGreaterThanOrEqual(1);
      expect(nextSeed).toBeLessThanOrEqual(15);
      const board = createSoloBoard(nextSeed, 1, "general");
      expect(board.size).toBe(4);
    }

    // 320 - 899: 6x6 Tahtalar (Seviye 16-45)
    for (let seed = 1; seed <= 30; seed++) {
      const nextSeed = getNextArcadeSeed(450, seed);
      expect(nextSeed).toBeGreaterThanOrEqual(16);
      expect(nextSeed).toBeLessThanOrEqual(45);
      const board = createSoloBoard(nextSeed, 1, "general");
      expect(board.size).toBe(6);
    }

    // 900 - 1799: 8x8 Tahtalar (Seviye 46-75)
    for (let seed = 1; seed <= 30; seed++) {
      const nextSeed = getNextArcadeSeed(1200, seed);
      expect(nextSeed).toBeGreaterThanOrEqual(46);
      expect(nextSeed).toBeLessThanOrEqual(75);
      const board = createSoloBoard(nextSeed, 1, "general");
      expect(board.size).toBe(8);
    }

    // 1800+: 10x10 Tahtalar (Seviye 76-100)
    for (let seed = 1; seed <= 30; seed++) {
      const nextSeed = getNextArcadeSeed(2200, seed);
      expect(nextSeed).toBeGreaterThanOrEqual(76);
      expect(nextSeed).toBeLessThanOrEqual(100);
      const board = createSoloBoard(nextSeed, 1, "general");
      expect(board.size).toBe(10);
    }
  });

  it("tahta temizleme ve kademe atlama bonusları kademeye göre doğru süre verir", () => {
    // 4x4 tahta aynı boyutta kalırsa +10s, 6x6'ya mezun olursa +18s
    expect(getArcadeBoardClearBonus(4, 4)).toBe(10);
    expect(getArcadeBoardClearBonus(4, 6)).toBe(18);

    // 6x6 tahta aynı boyutta kalırsa +14s, 8x8'e mezun olursa +22s
    expect(getArcadeBoardClearBonus(6, 6)).toBe(14);
    expect(getArcadeBoardClearBonus(6, 8)).toBe(22);

    // 8x8 tahta aynı boyutta kalırsa +18s, 10x10'a mezun olursa +26s
    expect(getArcadeBoardClearBonus(8, 8)).toBe(18);
    expect(getArcadeBoardClearBonus(8, 10)).toBe(26);

    // 10x10 sonsuz aşama temizleme bonusu: +22s
    expect(getArcadeBoardClearBonus(10, 10)).toBe(22);
  });

  it("kombo çarpanı seriye göre doğru ek süre ve bonus puan hesaplar", () => {
    // Kombo 1: normal, bonus yok
    const c1 = calculateArcadeCombo(1);
    expect(c1.bonusSeconds).toBe(0);
    expect(c1.bonusScore).toBe(0);

    // Kombo 2: +1s, +10 puan
    const c2 = calculateArcadeCombo(2);
    expect(c2.bonusSeconds).toBe(1);
    expect(c2.bonusScore).toBe(10);
    expect(c2.label).toContain("x2");

    // Kombo 3: +2s, +25 puan
    const c3 = calculateArcadeCombo(3);
    expect(c3.bonusSeconds).toBe(2);
    expect(c3.bonusScore).toBe(25);
    expect(c3.label).toContain("x3");

    // Kombo 4+: +3s, +40 puan
    const c4 = calculateArcadeCombo(4);
    expect(c4.bonusSeconds).toBe(3);
    expect(c4.bonusScore).toBe(40);
    expect(c4.label).toContain("x4");

    const c6 = calculateArcadeCombo(6);
    expect(c6.bonusSeconds).toBe(3);
    expect(c6.bonusScore).toBe(40);
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
