import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { generatePuzzle, PlacedWord } from "../shared/puzzle-generator";
import {
  getLevelTimeThresholds,
  calculateLevelStars,
  formatElapsedTimer,
  VINTAGE_HINT_COST,
} from "../components/vintage/vintage-constants";
import { VintageMapView } from "../components/vintage/vintage-map-view";
import { VintagePlayHeader } from "../components/vintage/vintage-play-header";
import { VintageVictoryModal } from "../components/vintage/vintage-dialogs";
import {
  DEFAULT_PROGRESS,
  applyVintageProgress,
  mergePlayerProgress,
  PlayerProgress,
} from "../shared/progression";
import { isEqualTr } from "../shared/tr-utils";

describe("Gazete Bulmacası (Nostalji 10×10) Kapsamlı Sistem & QA Testleri", () => {
  describe("1. Süre & Yıldız Algoritması Eşikleri", () => {
    it("Seviye 1-5 (Kolay) için süre eşikleri 90sn (3 yıldız) ve 180sn (2 yıldız) olmalıdır", () => {
      const thresholds = getLevelTimeThresholds(3);
      expect(thresholds.threeStar).toBe(90);
      expect(thresholds.twoStar).toBe(180);

      expect(calculateLevelStars(3, 45)).toBe(3);
      expect(calculateLevelStars(3, 90)).toBe(3);
      expect(calculateLevelStars(3, 91)).toBe(2);
      expect(calculateLevelStars(3, 180)).toBe(2);
      expect(calculateLevelStars(3, 181)).toBe(1);
    });

    it("Seviye 6-10 (Orta) için süre eşikleri 120sn ve 240sn olmalıdır", () => {
      const thresholds = getLevelTimeThresholds(8);
      expect(thresholds.threeStar).toBe(120);
      expect(thresholds.twoStar).toBe(240);

      expect(calculateLevelStars(8, 110)).toBe(3);
      expect(calculateLevelStars(8, 200)).toBe(2);
      expect(calculateLevelStars(8, 300)).toBe(1);
    });

    it("Seviye 11-15 (Zor) ve 16-20 (Usta) zorluğa göre kademeli esneklik sağlamalıdır", () => {
      const hard = getLevelTimeThresholds(14);
      expect(hard.threeStar).toBe(160);
      expect(hard.twoStar).toBe(300);

      const ultra = getLevelTimeThresholds(18);
      expect(ultra.threeStar).toBe(210);
      expect(ultra.twoStar).toBe(390);

      expect(calculateLevelStars(18, 150)).toBe(3);
      expect(calculateLevelStars(18, 250)).toBe(2);
      expect(calculateLevelStars(18, 450)).toBe(1);
    });

    it("formatElapsedTimer saniyeyi standart mm:ss formatına dönüştürmelidir", () => {
      expect(formatElapsedTimer(0)).toBe("00:00");
      expect(formatElapsedTimer(7)).toBe("00:07");
      expect(formatElapsedTimer(75)).toBe("01:15");
      expect(formatElapsedTimer(605)).toBe("10:05");
    });
  });

  describe("2. UI Bileşenlerinin Render Doğrulaması", () => {
    it("VintageMapView seviye kartlarını, kazanılan dinamik yıldızları ve ilerleme yüzdesini doğru basmalıdır", () => {
      const completed = new Set([1, 2]);
      const starsMap = { 1: 3, 2: 2 };

      const html = renderToStaticMarkup(
        React.createElement(VintageMapView, {
          measureContainer: vi.fn(),
          onBack: vi.fn(),
          onOpenLivesModal: vi.fn(),
          isInfiniteLives: false,
          lives: 5,
          coins: 250,
          score: 1200,
          maxUnlockedLevel: 3,
          completedLevels: completed,
          levelStars: starsMap,
          levelIndex: 1,
          onSelectLevel: vi.fn(),
        })
      );

      // Başlıklar ve Manşet
      expect(html).toContain("NOSTALJİ KELİME BULMACA");
      expect(html).toContain("SEVİYE HARİTASI");
      expect(html).toContain("10×10 ÇAPRAZ BULMACA");
      // İlerleme oranı (2 / 20 = %10)
      expect(html).toContain("%10");
      // Toplam yıldız: 3 + 2 = 5
      expect(html).toContain("⭐ 5");
      // Kilit açık: 3 / 20
      expect(html).toContain("3 / 20");
      // Can ve Çip
      expect(html).toContain("5/5 Can");
      expect(html).toContain("250 Çip");
    });

    it("VintagePlayHeader dashboard barında can, çip, kronometre ve ipucunu dengeli render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(VintagePlayHeader, {
          levelIndex: 4,
          lives: 3,
          isInfiniteLives: false,
          coins: 400,
          score: 300,
          boardSwapCount: 1,
          elapsedSeconds: 45,
          onBackPress: vi.fn(),
          onUseHint: vi.fn(),
          onResetLevel: vi.fn(),
        })
      );

      expect(html).toContain("10×10 KELİME BULMACA");
      expect(html).toContain("4. BÖLÜM");
      expect(html).toContain("⏱️ 00:45");
      expect(html).toContain("3/5");
      expect(html).toContain("400");
      expect(html).toContain(String(VINTAGE_HINT_COST));
    });

    it("VintageVictoryModal kazanılan yıldızları ve çözüm süresini doğru göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(VintageVictoryModal, {
          visible: true,
          levelIndex: 3,
          earnedStars: 3,
          elapsedSeconds: 78,
          isInfiniteLives: false,
          lives: 5,
          onOpenLivesModal: vi.fn(),
          onNextLevel: vi.fn(),
          onReturnToMap: vi.fn(),
        })
      );

      expect(html).toContain("⭐⭐⭐");
      expect(html).toContain("Kusursuz Hız! (3 Yıldız)");
      expect(html).toContain("1 dk 18 sn");
      expect(html).toContain("3. bölümde bütün kelimeleri yerleştirdin.");
    });
  });

  describe("3. İlerleme & Bulut Senkronizasyon (Merge & Persistence) Mantığı", () => {
    it("applyVintageProgress tamamlanan seviyeyi ve görevleri doğru işlemelidir", () => {
      const initial: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        xp: 100,
        coins: 50,
        vintageProgress: {
          maxUnlockedLevel: 2,
          completedLevels: [1],
          score: 100,
          levelStars: { 1: 3 },
        },
      };

      const updated = applyVintageProgress(initial, 2, 50, 4, ["KİTAP", "MASA", "KALEM", "DENİZ"]);
      expect(updated.vintageProgress?.maxUnlockedLevel).toBe(3);
      expect(updated.vintageProgress?.completedLevels).toContain(2);
      expect(updated.vintageProgress?.levelStars?.[1]).toBe(3);
      expect(updated.xp).toBe(150);
      expect(updated.coins).toBe(55);
      expect(updated.matchHistory?.[0].mode).toBe("vintage");
    });

    it("mergePlayerProgress yerel ve uzak levelStars sözlüğünü en yüksek yıldızlarla birleştirmelidir", () => {
      const local: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        vintageProgress: {
          maxUnlockedLevel: 3,
          completedLevels: [1, 2],
          score: 200,
          levelStars: { 1: 2, 2: 3 },
        },
      };

      const remote: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        vintageProgress: {
          maxUnlockedLevel: 4,
          completedLevels: [1, 2, 3],
          score: 350,
          levelStars: { 1: 3, 2: 2, 3: 3 }, // Remote'da 1. seviye 3 yıldız, 2. seviye 2 yıldız
        },
      };

      const merged = mergePlayerProgress(local, remote);
      expect(merged.vintageProgress?.maxUnlockedLevel).toBe(4);
      expect(merged.vintageProgress?.completedLevels).toEqual([1, 2, 3]);
      // 1. seviye: max(2, 3) = 3
      expect(merged.vintageProgress?.levelStars?.[1]).toBe(3);
      // 2. seviye: max(3, 2) = 3
      expect(merged.vintageProgress?.levelStars?.[2]).toBe(3);
      // 3. seviye: 3
      expect(merged.vintageProgress?.levelStars?.[3]).toBe(3);
    });
  });

  describe("4. Türkçe Karakter & Bulmaca Çözüm Uyumluluğu", () => {
    it("Tüm kelimelerde isEqualTr ile I/İ/ı/i unicode uyumluluğunu doğrular", () => {
      const puzzle = generatePuzzle("easy");
      expect(puzzle.words.length).toBeGreaterThanOrEqual(3);

      puzzle.words.forEach((w) => {
        expect(w.answer.length).toBe(w.length);
        for (let i = 0; i < w.length; i++) {
          const char = w.answer[i]!;
          expect(isEqualTr(char, char)).toBe(true);
        }
      });
    });
  });
});
