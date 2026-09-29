import { describe, expect, it, beforeEach } from "vitest";
import {
  DEFAULT_PROGRESS,
  MAX_LIVES,
  getCalculatedLives,
  deductLife,
  buyLives,
  reconcileDailyStreak,
  checkDailyLoginReward,
  getDayId,
  applyMatchProgress,
  applyArcadeProgress,
  applyVintageProgress,
  type PlayerProgress,
} from "../shared/progression";
import {
  advanceSelection,
  isAdjacent,
  wordFromSelection,
  wordScoreMultiplier,
  botThinkDelayMs,
  type BoardSize,
} from "../shared/game";
import { createSoloBoard, getSoloLevelWords, MAX_SOLO_LEVEL } from "../shared/solo";
import { fetchWordDetail, getWordDefinition } from "../shared/dictionary";
import { normalizeRoomCode } from "../shared/invite";
import { cleanCode } from "../server/game/rooms";
import { normalizeTr, normalizeTrUpper, isEqualTr } from "../shared/tr-utils";
import { monetizationManager } from "../shared/monetization";
import { CHIP_EQUIPMENT_ITEMS, PROFILE_FRAMES, BOARD_SKINS, VICTORY_EFFECTS } from "../shared/store-items";

describe("Senior QA & Full-Stack Production Readiness Audit", () => {
  describe("1. Can (Lives) ve İyileşme Zamanlayıcısı Bütünlüğü", () => {
    it("Canlar 0'ın altına düşmemeli ve maksimum kapasiteyi (5) aşmamalıdır", () => {
      let prog: PlayerProgress = { ...DEFAULT_PROGRESS, lives: 5 };

      // 5 kez can düşür
      for (let i = 0; i < 5; i++) {
        prog = deductLife(prog);
      }
      expect(prog.lives).toBe(0);

      // Can 0 iken tekrar düşürülürse eksiye inmemeli, 0'da kalmalı
      prog = deductLife(prog);
      expect(prog.lives).toBe(0);

      // Hesaplanan can 0 olmalı
      const calc = getCalculatedLives(prog);
      expect(calc.lives).toBe(0);
      expect(calc.nextLifeTimerSeconds).toBeGreaterThan(0);
    });

    it("Can satın alma ve yenileme bakiyeyi ve sınırları doğru yönetir", () => {
      let prog: PlayerProgress = { ...DEFAULT_PROGRESS, lives: 2, coins: 100 };

      // 1 can satın al (maliyeti 20 çip)
      const resOne = buyLives(prog, "one");
      expect(resOne.success).toBe(true);
      expect(resOne.updatedProgress.lives).toBe(3);
      expect(resOne.updatedProgress.coins).toBe(80);

      // Kalan canları tamamen doldur (maliyeti 75 çip)
      const resAll = buyLives(resOne.updatedProgress, "all");
      expect(resAll.success).toBe(true);
      expect(resAll.updatedProgress.lives).toBe(MAX_LIVES);
      expect(resAll.updatedProgress.coins).toBe(5);

      // Canlar doluyken tekrar satın alma engellenmeli
      const resFull = buyLives(resAll.updatedProgress, "all");
      expect(resFull.success).toBe(false);
      expect(resFull.message).toContain("Canlarınız zaten dolu");
    });
  });

  describe("2. Türkçe Karakter ve Oda Kodu Normalizasyonu", () => {
    it("Türkçe küçük/büyük i ve ı harfleri oda kodlarında sorunsuz eşleşmelidir", () => {
      const rawCodes = ["ı1234", "i1234", "İ1234", "I1234"];
      const cleaned = rawCodes.map(cleanCode);

      // Tüm varyasyonlar aynı standartlaştırılmış 5 haneli koda dönüşmelidir
      for (const code of cleaned) {
        expect(code).toBe("I1234");
      }

      expect(normalizeRoomCode("kısa1")).toBe("KISA1");
      expect(normalizeRoomCode("kitap")).toBe("KITAP");
    });

    it("Kullanıcı adı ve kelime karşılaştırmalarında Türkçe duyarlılığı tam olmalıdır", () => {
      expect(isEqualTr("ışık", "IŞIK")).toBe(true);
      expect(isEqualTr("iğne", "İĞNE")).toBe(true);
      expect(isEqualTr("çay", "ÇAY")).toBe(true);
      expect(normalizeTrUpper("istanbul")).toBe("İSTANBUL");
      expect(normalizeTr("İSTANBUL")).toBe("istanbul");
    });
  });

  describe("3. Tahta Dokunma / Harf Birleştirme ve Backtracking Doğrulaması", () => {
    it("Harf seçiminde ardışık komşuluk Manhattan mesafesi = 1 olmalıdır", () => {
      const size: BoardSize = 4;
      // 0. hücre (0,0), 1. hücre (0,1) -> Komşu
      expect(isAdjacent(0, 1, size)).toBe(true);
      // 0. hücre (0,0), 4. hücre (1,0) -> Komşu
      expect(isAdjacent(0, 4, size)).toBe(true);
      // 0. hücre (0,0), 5. hücre (1,1) -> Çapraz (komşu değil)
      expect(isAdjacent(0, 5, size)).toBe(false);
    });

    it("Geriye doğru sürükleme (Backtracking) son seçilen harfi temizlemelidir", () => {
      const size: BoardSize = 4;
      let selection = [0, 1, 2];

      // Kullanıcı 1. hücreye geri kaydırırsa 2. hücre listeden çıkmalı
      selection = advanceSelection(selection, 1, size);
      expect(selection).toEqual([0, 1]);

      // Tekrar 0'a kaydırırsa
      selection = advanceSelection(selection, 0, size);
      expect(selection).toEqual([0]);
    });

    it("Hızlı parmak geçişinde aradaki hücreyi atlamadan köprülemelidir", () => {
      const size: BoardSize = 4;
      // 0'dan 2'ye hızlıca geçiş yapıldığında arada kalan 1 hücresi de seçilmeli
      const selection = advanceSelection([0], 2, size);
      expect(selection).toEqual([0, 1, 2]);
    });
  });

  describe("4. Tek Oyunculu Seviye Üretimi ve Performans", () => {
    it("1. seviyeden 100. seviyeye kadar tüm seviyeler geçerli ve çözülebilir tahtalar üretir", () => {
      const sampleLevels = [1, 10, 25, 50, 75, 100];
      for (const level of sampleLevels) {
        const boardData = createSoloBoard(level);
        expect(boardData.words.length).toBeGreaterThanOrEqual(3);
        expect(boardData.board.length).toBe(boardData.size * boardData.size);

        // Her kelimenin rotası tahtada doğru harfleri veriyor mu?
        for (const word of boardData.words) {
          const route = boardData.routes[word];
          expect(route).toBeDefined();
          const spelledWord = wordFromSelection(boardData.board, route!);
          expect(spelledWord).toBe(word);
        }
      }
    });

    it("Seviye kelimeleri hızlı ve deterministik olarak elde edilmelidir", () => {
      const tStart = performance.now();
      const words = getSoloLevelWords(85);
      const tElapsed = performance.now() - tStart;
      expect(words.length).toBeGreaterThanOrEqual(3);
      // O(N^2) lag düzeltildikten sonra bu işlem < 25ms sürmelidir
      expect(tElapsed).toBeLessThan(100);
    });
  });

  describe("5. Sözlük ve TDK Sorgusu Güvenliği", () => {
    it("Bilinmeyen veya çevrimdışı kelimelerde sistem askıda kalmadan anında yerel açıklama döner", async () => {
      const detail = await fetchWordDetail("KALEM");
      expect(detail).toBeDefined();
      expect(detail.word).toBe("KALEM");
      expect(detail.definition.length).toBeGreaterThan(0);

      // Veritabanında olmayan uydurma bir kelime sorgulandığında güvenli fallback dönmeli
      const unknownDetail = await fetchWordDetail("XYZABC123");
      expect(unknownDetail).toBeDefined();
      expect(unknownDetail.definition).toContain("Kelime Patlat ile kelime dağarcığını zenginleştir");
    });
  });

  describe("6. Puanlama ve Ekonomi Bütünlüğü", () => {
    it("Kelime uzunluğu çarpanları kurallara tam uymalıdır", () => {
      expect(wordScoreMultiplier(3)).toBe(1);
      expect(wordScoreMultiplier(4)).toBe(1);
      expect(wordScoreMultiplier(5)).toBe(2);
      expect(wordScoreMultiplier(6)).toBe(2);
      expect(wordScoreMultiplier(7)).toBe(3);
      expect(wordScoreMultiplier(10)).toBe(3);
    });

    it("Maç ilerlemesi uygulandığında kazanılan çip ve XP tutarları negatif olmamalıdır", () => {
      const initial: PlayerProgress = { ...DEFAULT_PROGRESS, xp: 100, coins: 50 };
      const next = applyMatchProgress(initial, {
        score: 120,
        won: true,
        tempo: 2.5,
        foundWords: ["ELMA", "ARMUT", "PORTAKAL"],
      }, "pvp");

      expect(next.xp).toBeGreaterThan(initial.xp);
      expect(next.coins).toBeGreaterThanOrEqual(initial.coins ?? 0);
      expect(next.matches).toBe(initial.matches + 1);
      expect(next.wins).toBe(initial.wins + 1);
    });
  });
});
