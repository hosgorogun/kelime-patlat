import { describe, it, expect } from "vitest";
import {
  createSoloBoard,
  getSoloLevel,
  getSoloLevelWords,
  generateSpecialTiles,
  MAX_SOLO_LEVEL,
} from "../shared/solo";
import { getDifficultyProfile } from "../shared/difficulty";
import {
  catalogWordsForTheme,
  catalogWordsForBoard,
  WORD_CATALOG_DATA,
  WORD_BANK,
  type WordTheme,
} from "../shared/word-catalog";
import { isValidTurkishWord } from "../shared/dictionary";
import { buildGameBoard, makeUniqueCode } from "../server/game/board-builder";
import { generatePuzzle, WORD_DICTIONARY } from "../shared/puzzle-generator";
import { TURKISH_LETTERS } from "../shared/game";
import { BALANCED_TURKISH_POOL } from "../shared/kelimematik";
import { createInitialTurnBoard, calculateTurnWordScore } from "../shared/turn-match";
import { isEqualTr } from "../shared/tr-utils";

describe("WORD DISTRIBUTION & BOARD GENERATION ENGINE MASTER SUITE", () => {
  describe("1. Matematiksel Hücre Bölme ve Sıfır Boşluk Garantisi (Zero Waste Grid Partition)", () => {
    it("Tüm tahta boyutlarında (4x4, 6x6, 8x8, 10x10) kelime harf toplamları tahtayı %100 eksiksiz doldurmalıdır", () => {
      const testLevels = [1, 5, 15, 20, 35, 45, 50, 65, 75, 80, 95, 100];
      for (const level of testLevels) {
        const board = createSoloBoard(level, 42, "general");
        const expectedCells = board.size * board.size;
        const totalLetters = board.words.reduce((sum, w) => sum + w.length, 0);

        expect(board.board.length).toBe(expectedCells);
        expect(totalLetters).toBe(expectedCells);

        // Hiçbir hücre boş veya tanımsız olmamalıdır
        for (let i = 0; i < board.board.length; i++) {
          expect(board.board[i]).toBeDefined();
          expect(board.board[i]!.length).toBe(1);
          expect(board.board[i]).toMatch(/^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]$/);
        }
      }
    });

    it("Her kelimenin rotasındaki harfler, tahtadaki karşılık gelen hücrelerle birebir eşleşmelidir", () => {
      for (let level = 1; level <= 30; level += 5) {
        const board = createSoloBoard(level, 101, "general");
        for (const word of board.words) {
          const route = board.routes[word];
          expect(route).toBeDefined();
          expect(route!.length).toBe(word.length);

          const spelledFromBoard = route!.map((cellIdx) => board.board[cellIdx]).join("");
          expect(isEqualTr(spelledFromBoard, word)).toBe(true);
        }
      }
    });
  });

  describe("2. Kesin Ortogonal Komşuluk ve Yol Bütünlüğü (Strict Orthogonal Adjacency)", () => {
    it("Tüm rotalardaki ardışık harf adımları kesinlikle yatay veya dikey olmalı, asla çapraz olmamalıdır", () => {
      for (let level = 1; level <= 50; level += 7) {
        const board = createSoloBoard(level, 777, "general");
        const size = board.size;

        for (const [word, route] of Object.entries(board.routes)) {
          for (let i = 1; i < route.length; i++) {
            const prev = route[i - 1]!;
            const curr = route[i]!;

            const prevRow = Math.floor(prev / size);
            const prevCol = prev % size;
            const currRow = Math.floor(curr / size);
            const currCol = curr % size;

            const manhattanDist = Math.abs(prevRow - currRow) + Math.abs(prevCol - currCol);
            // Ortogonal kuralı: Manhattan mesafesi daima tam 1 olmalıdır
            expect(manhattanDist).toBe(1);
          }
        }
      }
    });

    it("Bir kelime içindeki rota hücreleri kesinlikle tekil olmalı (self-intersecting döngü olmamalı)", () => {
      for (let level = 1; level <= 40; level += 4) {
        const board = createSoloBoard(level, 888, "general");
        for (const route of Object.values(board.routes)) {
          const uniqueCells = new Set(route);
          expect(uniqueCells.size).toBe(route.length);
        }
      }
    });
  });

  describe("3. Sözlük ve Kelime Geçerliliği (Vocabulary & Dictionary Integrity)", () => {
    it("Üretilen tüm tahtalardaki kelimelerin tamamı resmi sözlükte (isValidTurkishWord) geçerli olmalıdır", () => {
      for (let level = 1; level <= 60; level += 6) {
        const board = createSoloBoard(level, 333, "general");
        for (const word of board.words) {
          expect(isValidTurkishWord(word)).toBe(true);
          expect(word.length).toBeGreaterThanOrEqual(3);
        }
      }
    });

    it("Tematik tahtalar (nature, space, city vb.) ilgili temanın sözlük dağarcığını doğru yansıtmalıdır", () => {
      const themes: WordTheme[] = ["nature", "space", "city", "food"];
      for (const theme of themes) {
        const words = catalogWordsForTheme(6, theme);
        expect(words.length).toBeGreaterThan(0);
        for (const entry of words.slice(0, 15)) {
          expect(isValidTurkishWord(entry.word)).toBe(true);
        }
      }
    });
  });

  describe("4. Kayan Pencere Tekrar Engelleme (Rolling Exclusion Pipeline)", () => {
    it("Ardışık seviyeler üretilirken bir önceki seviyedeki kelimeler tekrar etmemelidir", () => {
      const level1Words = new Set(createSoloBoard(1, 0, "general").words);
      const level2Words = new Set(createSoloBoard(2, 0, "general").words);

      // Seviye 1'deki kelimelerin Seviye 2'de doğrudan tekrarlanmadığı doğrulanır
      let intersectionCount = 0;
      for (const w of level2Words) {
        if (level1Words.has(w)) intersectionCount++;
      }
      expect(intersectionCount).toBe(0);
    });
  });

  describe("5. Özel Hücre (Buz, Bomba, Altın) Dağıtım Kuralları", () => {
    it("Seviye 16 altındaki acemi seviyelerde özel engel hücreleri üretilmemelidir", () => {
      for (let level = 1; level <= 15; level += 3) {
        const board = createSoloBoard(level, 12, "general");
        expect(board.specialTiles).toBeDefined();
        expect(Object.keys(board.specialTiles || {})).toHaveLength(0);
      }
    });

    it("Seviye 16–29 arasında sadece Buzlu hücreler eklenmelidir", () => {
      const board = createSoloBoard(20, 12, "general");
      const special = Object.values(board.specialTiles || {});
      expect(special.length).toBeGreaterThanOrEqual(1);
      expect(special.every((tile) => tile.type === "ice")).toBe(true);
    });

    it("Seviye 30+ seviyelerde Bomba, Seviye 45+ seviyelerde Altın hücreler devreye girmelidir", () => {
      const board50 = createSoloBoard(50, 99, "general");
      const special = Object.values(board50.specialTiles || {});
      const types = new Set(special.map((s) => s.type));

      expect(types.has("ice")).toBe(true);
      expect(types.has("bomb")).toBe(true);
      expect(types.has("gold")).toBe(true);

      // Bomba sayacının pozitif tam sayı olduğu kontrol edilir
      const bomb = special.find((s) => s.type === "bomb");
      expect(bomb?.counter).toBeGreaterThanOrEqual(3);

      // Altın hücrenin bonus çip ödülü verdiği kontrol edilir
      const gold = special.find((s) => s.type === "gold");
      expect(gold?.bonusChips).toBe(15);
    });
  });

  describe("6. Çok Oyunculu (Multiplayer) Tahta Üretim Paritesi (server/game/board-builder)", () => {
    it("buildGameBoard 4x4, 6x6, 8x8 ve 10x10 boyutlarında adil, çözülebilir ve hatasız tahtalar üretmelidir", () => {
      const sizes: Array<4 | 6 | 8 | 10> = [4, 6, 8, 10];
      for (const size of sizes) {
        const game = buildGameBoard(size);
        expect(game.board).toHaveLength(size * size);
        expect(game.words.length).toBeGreaterThanOrEqual(3);
        expect(Object.keys(game.routes).length).toBe(game.words.length);

        // Her harfin tahtaya basıldığı ve rotaların doğruluğu
        for (const word of game.words) {
          const route = game.routes[word]!;
          expect(route.length).toBe(word.length);
          const spelled = route.map((idx) => game.board[idx]).join("");
          expect(isEqualTr(spelled, word)).toBe(true);
        }
      }
    });

    it("makeUniqueCode 5 karakterli ve 0/O, 1/I kafa karışıklığı yaratmayan güvenli oda kodları üretmelidir", () => {
      for (let i = 0; i < 50; i++) {
        const code = makeUniqueCode(() => false);
        expect(code).toHaveLength(5);
        expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/);
        expect(code).not.toContain("0");
        expect(code).not.toContain("O");
        expect(code).not.toContain("1");
        expect(code).not.toContain("I");
      }
    });
  });

  describe("7. Gazete Nostalji Çapraz Bulmaca Motoru (shared/puzzle-generator)", () => {
    it("generatePuzzle merkez kelime ve kesişimli dikey/yatay kelimeleri doğru yerleştirmelidir", () => {
      const puzzle = generatePuzzle("medium");
      expect(puzzle.boardSize).toBe(10);
      expect(puzzle.centerWord).toBeDefined();
      expect(puzzle.centerWord.isCenter).toBe(true);
      expect(puzzle.words.length).toBeGreaterThan(1);

      // Kesişen harflerin aynı harf olduğu kontrol edilir
      const grid = Array.from({ length: 10 }, () => Array(10).fill(""));
      for (const pw of [puzzle.centerWord, ...puzzle.words]) {
        pw.cells.forEach(([r, c], idx) => {
          const char = pw.answer[idx]!;
          if (grid[r]![c] !== "") {
            // Kesişen harf çakışması olmamalıdır
            expect(isEqualTr(grid[r]![c], char)).toBe(true);
          } else {
            grid[r]![c] = char;
          }
        });
      }
    });
  });

  describe("8. Asenkron Düello Tahta Üretimi ve Kelimematik Harf Dağılımı", () => {
    it("createInitialTurnBoard tahtası Türkçe dengeli harf dizilimi sunmalıdır", () => {
      const turnBoard = createInitialTurnBoard(4);
      expect(turnBoard).toHaveLength(16);
      const vowels = new Set(["A", "E", "İ", "O", "U"]);
      const vowelCount = turnBoard.filter((c) => vowels.has(c)).length;
      expect(vowelCount).toBeGreaterThanOrEqual(2);
    });

    it("calculateTurnWordScore kelime uzunluğuna göre artan puan skalasını doğru hesaplamalıdır", () => {
      expect(calculateTurnWordScore("SU")).toBe(5);
      expect(calculateTurnWordScore("BAL")).toBe(15);
      expect(calculateTurnWordScore("KALE")).toBe(25);
      expect(calculateTurnWordScore("GÜNEŞ")).toBe(40);
      expect(calculateTurnWordScore("YILDIZ")).toBe(60);
      expect(calculateTurnWordScore("PENCERE")).toBe(85);
    });

    it("BALANCED_TURKISH_POOL sesli ve sessiz harfleri dengeli dağıtmalıdır", () => {
      expect(BALANCED_TURKISH_POOL.length).toBeGreaterThan(50);
      const vowels = new Set(["A", "E", "I", "İ", "O", "Ö", "U", "Ü"]);
      const vowelFreq = BALANCED_TURKISH_POOL.filter((c) => vowels.has(c)).length;
      const ratio = vowelFreq / BALANCED_TURKISH_POOL.length;
      // Türkçede sesli harf frekansı %35 - %50 arasındadır
      expect(ratio).toBeGreaterThan(0.35);
      expect(ratio).toBeLessThan(0.50);
    });
  });
});
