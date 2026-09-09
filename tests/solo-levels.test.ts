import { describe, expect, it } from "vitest";

import { createSoloBoard, getSoloLevel, solutionColorByCell } from "../shared/solo";
import { WORD_CATALOG } from "../shared/game";
import { catalogWordsForTheme } from "../shared/word-catalog";
import { getDifficultyProfile } from "../shared/difficulty";

function hasPath(board: string[], size: number, word: string) {
  const visit = (index: number, offset: number, used: number[]): boolean => {
    if (board[index] !== word[offset]) return false;
    if (offset === word.length - 1) return true;
    const row = Math.floor(index / size);
    const column = index % size;
    const neighbors = [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1]];
    return neighbors.some(([nextRow, nextColumn]) => {
      const nextIndex = nextRow * size + nextColumn;
      return nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size && !used.includes(nextIndex)
        ? visit(nextIndex, offset + 1, [...used, nextIndex])
        : false;
    });
  };
  return board.some((_letter, index) => visit(index, 0, [index]));
}

function turnCount(path: number[]) {
  return path.slice(2).filter((cell, index) => cell - path[index + 1]! !== path[index + 1]! - path[index]!).length;
}

describe("Tek oyunculu seviye yolculuğu", () => {
  it("kelime kataloğu kolay, orta ve zor sınıflarda geniş çeşitlilik sunar", () => {
    expect(WORD_CATALOG[4].length).toBeGreaterThanOrEqual(40);
    expect(WORD_CATALOG[6].length).toBeGreaterThanOrEqual(40);
    expect(WORD_CATALOG[8].length).toBeGreaterThanOrEqual(40);
    for (const size of [4, 6, 8] as const) {
      expect(new Set(WORD_CATALOG[size].map((entry) => entry.difficulty))).toEqual(new Set(["easy", "medium", "hard"]));
      expect(new Set(WORD_CATALOG[size].map((entry) => entry.word)).size).toBe(WORD_CATALOG[size].length);
    }
  });

  it("zorluk motoru seviye arttıkça süreyi, rota gereksinimini ve zor kelime oranını kademeli yükseltir", () => {
    const first = getDifficultyProfile(1);
    const final = getDifficultyProfile(12);
    expect(first.timeLimit).toBeGreaterThan(final.timeLimit);
    expect(first.minTurns).toBeLessThan(final.minTurns);
    expect(first.mix.easy).toBeGreaterThan(final.mix.easy);
    expect(first.mix.hard).toBeLessThan(final.mix.hard);
    expect(final.minWordLength).toBeGreaterThanOrEqual(first.minWordLength);
  });

  it("seviyeler büyüdükçe daha büyük tahtaya ve daha kısa süreye geçer", () => {
    expect(getSoloLevel(1).size).toBe(4);
    expect(getSoloLevel(16).size).toBe(6);
    expect(getSoloLevel(46).size).toBe(8);
    expect(getSoloLevel(1).wordCount).toBe(3);
    expect(getSoloLevel(12).wordCount).toBe(3);
    expect(getSoloLevel(1).timeLimit).toBeGreaterThan(getSoloLevel(16).timeLimit);
  });

  it("üretilen seviyedeki tüm kelimelerin yatay-dikey yolu bulunur", () => {
    for (const level of [1, 10, 16, 25, 46, 60]) {
      const challenge = createSoloBoard(level, 2);
      expect(challenge.board).toHaveLength(challenge.size * challenge.size);
      expect(challenge.words.length).toBeGreaterThan(0);
      expect(Object.keys(challenge.routes)).toHaveLength(challenge.words.length);
      if (challenge.size === 4) {
        expect(challenge.words).toHaveLength(3);
        expect(challenge.words.every((word) => word.length >= 3)).toBe(true);
        expect(challenge.words.reduce((total, word) => total + word.length, 0)).toBe(16);
        expect(new Set(Object.values(challenge.wordDifficulties)).size).toBeGreaterThanOrEqual(2);
      }
      if (challenge.size === 6) {
        expect(challenge.words.length).toBeGreaterThanOrEqual(5);
        expect(challenge.words.length).toBeLessThanOrEqual(9);
        expect(challenge.words.every((word) => word.length >= 3 && word.length <= 8)).toBe(true);
      }
      challenge.words.forEach((word) => {
        expect(hasPath(challenge.board, challenge.size, word)).toBe(true);
        expect(challenge.routes[word]).toHaveLength(word.length);
        expect(challenge.routes[word].map((cell) => challenge.board[cell]).join("")).toBe(word);
        expect(challenge.wordDifficulties[word]).toMatch(/easy|medium|hard/);
      });
    }
  });

  it("4×4 seviyeleri uzun hedef kelimeler ve yeni denemelerde farklı ızgaralar üretir", () => {
    for (const level of [1, 2, 3]) {
      const firstTry = createSoloBoard(level, 0);
      const nextTry = createSoloBoard(level, 1);
      expect(nextTry.words).not.toEqual(firstTry.words);
      expect(nextTry.board).not.toEqual(firstTry.board);
      for (const variation of [0, 1, 2, 3, 4, 5]) {
        const challenge = createSoloBoard(level, variation);
        expect(challenge.words).toHaveLength(3);
        expect(challenge.words.every((word) => word.length >= 3)).toBe(true);
        expect(new Set(Object.values(challenge.wordDifficulties)).size).toBeGreaterThanOrEqual(2);
        challenge.words.forEach((word) => {
          expect(hasPath(challenge.board, 4, word)).toBe(true);
          expect(turnCount(challenge.routes[word]!)).toBeGreaterThanOrEqual(getSoloLevel(level).minTurns);
        });
      }
    }
  });

  it("6×6 orta av seviyeleri dengeli kelime sayısı, rota dönüşü ve boşluksuz tahta üretir", () => {
    for (const level of [16, 17, 18, 19]) {
      for (const variation of [0, 2, 5]) {
        const challenge = createSoloBoard(level, variation);
        expect(challenge.size).toBe(6);
        expect(challenge.board).toHaveLength(36);
        expect(challenge.board.every(Boolean)).toBe(true);
        expect(challenge.words.length).toBeGreaterThanOrEqual(5);
        challenge.words.forEach((word) => {
          expect(hasPath(challenge.board, 6, word)).toBe(true);
          expect(turnCount(challenge.routes[word]!)).toBeGreaterThanOrEqual(1);
        });
      }
    }
  });

  it("tüm seviye ve deneme çeşitlerinde hedef rotaları çakışmadan, dolu tahtada üretir", () => {
    for (let level = 1; level <= 12; level += 1) {
      for (const variation of [0, 17, 71]) {
        const challenge = createSoloBoard(level, variation);
        const expected = getSoloLevel(level);
        expect(challenge.size).toBe(expected.size);
        expect(challenge.words.length).toBeGreaterThanOrEqual(expected.wordCount);
        expect(challenge.board).toHaveLength(expected.size * expected.size);
        expect(challenge.board.every(Boolean)).toBe(true);
        const routeCells = challenge.words.flatMap((word) => challenge.routes[word]!);
        expect(new Set(routeCells).size).toBe(routeCells.length);
        challenge.words.forEach((word) => {
          expect(hasPath(challenge.board, challenge.size, word)).toBe(true);
          expect(challenge.routes[word]?.map((cell) => challenge.board[cell]).join("")).toBe(word);
        });
      }
    }
  });

  it("tahta boyutu değişimlerinin tüm sınırlarında rotaları korur", () => {
    for (const level of [1, 15, 16, 30, 31, 45, 46, 60, 61, 75, 76, 90, 100]) {
      for (const variation of [0, 17, 999]) {
        const challenge = createSoloBoard(level, variation);
        const routeCells = challenge.words.flatMap((word) => challenge.routes[word] ?? []);
        expect(challenge.board).toHaveLength(challenge.size * challenge.size);
        expect(challenge.board.every(Boolean)).toBe(true);
        expect(new Set(routeCells).size).toBe(routeCells.length);
        challenge.words.forEach((word) => {
          const route = challenge.routes[word]!;
          expect(route).toHaveLength(word.length);
          expect(route.map((cell) => challenge.board[cell]).join("")).toBe(word);
        });
      }
    }
  });

  it("rastgele oyunlar zorluk kategorilerinden dengeli kelime karışımları üretir", () => {
    const seenDifficulties = new Set<string>();
    for (const level of [1, 16, 46, 60]) {
      for (const variation of [7, 19, 31, 43]) {
        const challenge = createSoloBoard(level, variation);
        const difficulties = new Set(Object.values(challenge.wordDifficulties));
        expect(difficulties.size).toBeGreaterThanOrEqual(2);
        difficulties.forEach((difficulty) => seenDifficulties.add(difficulty));
      }
    }
    expect(seenDifficulties).toEqual(new Set(["easy", "medium", "hard"]));
  });

  it("süre sonunda tüm doğru rotaları kelime bazında ayrı renklere eşler", () => {
    const challenge = createSoloBoard(4, 71);
    const colors = solutionColorByCell(challenge);
    const routeCells = challenge.words.flatMap((word) => challenge.routes[word]!);
    expect(colors.size).toBe(routeCells.length);
    challenge.words.forEach((word, index) => {
      challenge.routes[word]!.forEach((cell) => expect(colors.get(cell)).toBe(index));
    });
  });

  it("günlük rota ve uzay teması zengin ve temaya uygun kelimeler üretir", () => {
    const dailyChallenge = createSoloBoard(21, 42, "space");
    expect(dailyChallenge.size).toBe(6);
    expect(dailyChallenge.words.length).toBeGreaterThanOrEqual(4);
    // Board should not just repeat trivial 4x4 words
    expect(dailyChallenge.words.some((w) => w.length >= 6)).toBe(true);
  });

  it("solo seviyeler genel zengin Türkçe sözlükten doğal kelimeler seçer", () => {
    const level4 = createSoloBoard(4, 0, "general");
    expect(level4.words.length).toBe(3);
    // 4. seviye tümüyle tek bir temaya (uzay vb.) sıkışmamalı, genel havuzdan seçmeli
    const spaceOnly = ["METEOR", "KOZMOZ", "UZAY"];
    const isOnlySpace = level4.words.every((w) => spaceOnly.includes(w));
    expect(isOnlySpace).toBe(false);

    for (let l = 1; l <= 5; l++) {
      const b = createSoloBoard(l, 0, "general");
      expect(b.words.length).toBe(3);
    }
  });

  it("ardışık seviyeler arasında kelime tekrarı kesinlikle olmaz (kesişim sıfırdır)", () => {
    let prevWords: string[] = [];
    for (let level = 1; level <= 15; level++) {
      const board = createSoloBoard(level, 0, "general");
      for (const word of board.words) {
        expect(prevWords).not.toContain(word);
      }
      prevWords = board.words;
    }
  });

  it("excludeWords parametresine verilen kelimeler tahtaya kesinlikle dahil edilmez", () => {
    const excluded = ["MARKET", "ZEKA", "SEÇMEK", "OTEL", "VARLIK", "NESİL"];
    const board = createSoloBoard(1, 0, "general", excluded);
    for (const word of board.words) {
      expect(excluded).not.toContain(word);
    }
  });
});

