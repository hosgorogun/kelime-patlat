import { describe, expect, it } from "vitest";

import { advanceSelection, BOARD_SIZES, botThinkDelayMs, fillBoardBlanks, getRoundDurationMs, isAdjacent, LIVE_FOUR_WORD_LENGTH_PATTERNS, maskOpponentFoundWords, pickLiveFourWordLengths, wordFromSelection, wordScoreMultiplier } from "../shared/game";

describe("Kelime Patlat tahta kuralları", () => {
  it("yalnız yatay ve dikey komşu hücrelere izin verir", () => {
    expect(isAdjacent(0, 1, 4)).toBe(true);
    expect(isAdjacent(0, 4, 4)).toBe(true);
    expect(isAdjacent(0, 5, 4)).toBe(false);
    expect(isAdjacent(0, 6, 6)).toBe(true);
    expect(isAdjacent(6, 7, 6)).toBe(true);
    expect(isAdjacent(0, 7, 6)).toBe(false);
  });

  it("komşu olmayan hücreleri reddeder", () => {
    expect(isAdjacent(0, 2, 4)).toBe(false);
    expect(isAdjacent(0, 8, 4)).toBe(false);
    expect(isAdjacent(3, 4, 4)).toBe(false);
  });

  it("seçim sırasına göre kelimeyi üretir", () => {
    const board = ["O", "Y", "U", "N", "A", "K", "E", "L"];
    expect(wordFromSelection(board, [0, 1, 2, 3])).toBe("OYUN");
    expect(wordFromSelection(board, [7, 6, 5, 4])).toBe("LEKA");
  });

  it("geri sürüklemede son hücreyi çıkarır ve hızlı yatay geçişte köprü hücresini ekler", () => {
    expect(advanceSelection([0, 1, 2], 1, 4)).toEqual([0, 1]);
    expect(advanceSelection([0], 2, 4)).toEqual([0, 1, 2]);
    expect(advanceSelection([0], 5, 4)).toEqual([0]);
  });

  it("canlı maçta rakibin kelime metnini gizlerken rota bilgisini korur", () => {
    const visible = maskOpponentFoundWords([
      { word: "KELİME", playerId: "ben", path: [0, 1, 2, 3, 7, 11] },
      { word: "ORMAN", playerId: "rakip", path: [15, 14, 13, 9, 5] },
    ], "ben");
    expect(visible[0]).toMatchObject({ word: "KELİME", playerId: "ben" });
    expect(visible[0]?.hidden).toBeUndefined();
    expect(visible[1]).toMatchObject({ word: "", playerId: "rakip", path: [], hidden: true });
    const results = maskOpponentFoundWords([
      { word: "KELİME", playerId: "ben", path: [0, 1, 2, 3, 7, 11] },
      { word: "ORMAN", playerId: "rakip", path: [15, 14, 13, 9, 5] },
    ], "ben", true);
    expect(results[1]).toMatchObject({ word: "ORMAN", playerId: "rakip", path: [15, 14, 13, 9, 5], hidden: false });
  });

  it("uzun kelimelere daha yüksek puan çarpanı verir ve botu insanî aralıkta bekletir", () => {
    expect(wordScoreMultiplier(4)).toBe(1);
    expect(wordScoreMultiplier(5)).toBe(2);
    expect(wordScoreMultiplier(7)).toBe(3);
    expect(botThinkDelayMs(4, () => 0)).toBe(11_000);
    expect(botThinkDelayMs(4, () => 0.99)).toBeGreaterThanOrEqual(16_900);
    expect(botThinkDelayMs(6, () => 0)).toBe(12_000);
    expect(botThinkDelayMs(8, () => 0)).toBe(10_000);
    expect(BOARD_SIZES).toEqual([4, 6, 8, 10]);
    expect(getRoundDurationMs(4)).toBe(55_000);
    expect(getRoundDurationMs(6)).toBe(75_000);
    expect(getRoundDurationMs(8)).toBe(95_000);
    expect(getRoundDurationMs(10)).toBe(125_000);
  });

  it("canlı 4×4 modunda tahta kapasitesine uygun rastgele kelime karışımları seçer", () => {
    const allLengths = new Set(LIVE_FOUR_WORD_LENGTH_PATTERNS.flat());
    allLengths.forEach((len) => {
      expect(len).toBeGreaterThanOrEqual(3);
      expect(len).toBeLessThanOrEqual(6);
    });
    LIVE_FOUR_WORD_LENGTH_PATTERNS.forEach((pattern, index) => {
      expect(pickLiveFourWordLengths(() => (index + 0.01) / LIVE_FOUR_WORD_LENGTH_PATTERNS.length)).toEqual([...pattern]);
      expect(pattern.reduce((sum, length) => sum + length, 0)).toBeLessThanOrEqual(16);
      expect(pattern.every((length) => length >= 3 && length <= 6)).toBe(true);
    });
  });

  it("kısa kelime desenlerinden sonra boş kalan tahta hücrelerini rastgele harfle doldurur", () => {
    expect(fillBoardBlanks(["A", "", "", "K"], () => 0)).toEqual(["A", "A", "A", "K"]);
    expect(fillBoardBlanks(Array(16).fill(""), () => 0.99).every(Boolean)).toBe(true);
  });

  it("oda kodlarını doğru normalleştirir ve davet mesajı formatını doğrular", () => {
    const normalizeRoomCode = (val: unknown) => (typeof val === "string" && /^[A-Z0-9]{5}$/.test(val.trim().toUpperCase()) ? val.trim().toUpperCase() : null);
    expect(normalizeRoomCode("ab123")).toBe("AB123");
    expect(normalizeRoomCode(" AB123 ")).toBe("AB123");
    expect(normalizeRoomCode("invalid_code")).toBe(null);
    expect(normalizeRoomCode(12345)).toBe(null);
  });

  it("kelime uzunluklarına göre puan çarpanlarını sınır değerlerde (boundary values) dener", () => {
    expect(wordScoreMultiplier(1)).toBe(1);
    expect(wordScoreMultiplier(3)).toBe(1);
    expect(wordScoreMultiplier(4)).toBe(1);
    expect(wordScoreMultiplier(5)).toBe(2);
    expect(wordScoreMultiplier(6)).toBe(2);
    expect(wordScoreMultiplier(7)).toBe(3);
    expect(wordScoreMultiplier(12)).toBe(3);
  });
});
