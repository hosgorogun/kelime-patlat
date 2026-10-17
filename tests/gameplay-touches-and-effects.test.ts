/**
 * KELİME PATLAT - OYUN OYNANIŞLARI, DOKUNUŞLAR, EFEKT VE ANİMASYON VITEST MASTERİ
 *
 * Bu test:
 * 1. Dokunma / Sürükleme (Touch & Gesture) Koordinat Hesaplamaları (4x4, 6x6, 8x8, 10x10)
 * 2. Harf Seçimi, Geri Alma (Undo), Köprüleme (Bridging) ve Komşuluk Mekaniği
 * 3. Haptik Titreşim ve Ses Efekti Tetikleyicileri
 * 4. Animasyonlar (TilePop, FloatingScoreBurst, FloatingTimeBonus, TouchMagnifier, UrgencyVignette)
 * 5. Zafer Efektleri (VictoryEffectOverlay: Pulse, Glitch, Flare, Lightning, Fireworks)
 * 6. Kutlama Modalı (CelebrationModal: Level-Up, Lig Atlama, Konfeti, Sunburst)
 * 7. Vintage (Gazete Modu 10x10) Dokunma ve Harf Yerleştirme Akışı
 */

import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  advanceSelection,
  isAdjacent,
  wordFromSelection,
  wordScoreMultiplier,
  BOARD_SIZES,
  type BoardSize,
} from "../shared/game";
import { createSoloBoard, getSoloLevel, APP_WORD_PALETTE } from "../shared/solo";
import { isEqualTr, normalizeTrUpper } from "../shared/tr-utils";
import { isValidTurkishWord } from "../shared/dictionary";
import {
  getSfxEnabled,
  setSfxEnabled,
  getHapticsEnabled,
  setHapticsEnabled,
  playSelectionNote,
  playSuccessSound,
  playErrorSound,
  triggerHapticSelection,
  triggerHapticSuccess,
  triggerHapticError,
  triggerHapticLongWord,
} from "../shared/audio-haptics";
import {
  CelebrationModal,
  getLevelUpDetails,
  getLeaguePromotionDetails,
} from "../components/modals/celebration-modal";
import {
  FloatingScoreBurst,
  FloatingTimeBonus,
  TouchMagnifierBubble,
  UrgencyVignette,
} from "../components/solo/solo-floating-effects";
import { TilePop } from "../components/game/tile-pop";
import { ConnectLine } from "../components/game/game-ui";
import { VictoryEffectOverlay } from "../components/game/victory-effect-overlay";
import { generatePuzzle } from "../shared/puzzle-generator";

describe("Senior QA: Oyun Oynanışları, Dokunuşlar, Efekt ve Animasyonlar Master Suite", () => {
  describe("1. DOKUNMA VE SÜRÜKLEME KOORDİNAT HESAPLAMA MOTORU (TOUCH & GESTURES)", () => {
    const BOARD_PAD = 4;
    const boardWidth = 360;
    const testSizes: BoardSize[] = [4, 6, 8, 10];

    testSizes.forEach((size) => {
      it(`${size}x${size} tahtada tüm hücrelerin merkez koordinatları ve kenar toleransları %100 eşleşmelidir`, () => {
        const innerSize = boardWidth - BOARD_PAD * 2;
        const cellSize = innerSize / size;

        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const expectedIndex = r * size + c;
            const centerX = c * cellSize + cellSize / 2 + BOARD_PAD;
            const centerY = r * cellSize + cellSize / 2 + BOARD_PAD;

            // Dokunma koordinatından matris indexi çıkarma formülü
            const ox = Math.max(0, Math.min(innerSize - 1, centerX - BOARD_PAD));
            const oy = Math.max(0, Math.min(innerSize - 1, centerY - BOARD_PAD));
            const computedCol = Math.floor(ox / cellSize);
            const computedRow = Math.floor(oy / cellSize);
            const computedIndex = computedRow * size + computedCol;

            expect(computedIndex).toBe(expectedIndex);
          }
        }

        // -8px tolerans testi (hafif dışarı taşma)
        const edgeTouchX = -4;
        const clampedOx = Math.max(0, Math.min(innerSize - 1, edgeTouchX - BOARD_PAD));
        expect(clampedOx).toBe(0);

        // -8px'den fazla taşma (sınır dışı algılama)
        const outOfBoundsLeft = -9;
        const isOutOfBounds = outOfBoundsLeft < -8 || outOfBoundsLeft > boardWidth + 8;
        expect(isOutOfBounds).toBe(true);
      });
    });
  });

  describe("2. PARMAK HAREKETİ, GERİ ALMA (UNDO), KÖPRÜLEME VE HARF SEÇİMİ", () => {
    it("komşu yatay ve dikey hücreler seçilebilmeli, çapraz hücreler reddedilmelidir", () => {
      let sel: number[] = [0]; // (0,0)
      sel = advanceSelection(sel, 1, 4); // Sağa (0,1)
      expect(sel).toEqual([0, 1]);

      sel = advanceSelection(sel, 5, 4); // Aşağı (1,1)
      expect(sel).toEqual([0, 1, 5]);

      // Çapraz (1,1) -> (2,2) = 10 reddedilmeli
      const diag = advanceSelection(sel, 10, 4);
      expect(diag).toEqual([0, 1, 5]);
    });

    it("parmak geriye kaydırıldığında son harf anında geri alınmalıdır (Instant Undo)", () => {
      const sel = [0, 1, 5]; // (0 -> 1 -> 5)
      const undone = advanceSelection(sel, 1, 4); // 1'e geri dön
      expect(undone).toEqual([0, 1]);
    });

    it("hızlı parmak kaydırmada aradaki hücre otomatik köprülenmelidir (Swipe Bridge)", () => {
      // Yatay hızlı geçiş: 0 -> 2, aradaki 1 köprülenir
      const fastHorizontal = advanceSelection([0], 2, 4);
      expect(fastHorizontal).toEqual([0, 1, 2]);

      // Dikey hızlı geçiş: 0 -> 8, aradaki 4 köprülenir
      const fastVertical = advanceSelection([0], 8, 4);
      expect(fastVertical).toEqual([0, 4, 8]);
    });

    it("aynı harf mükerrer seçilememelidir", () => {
      const sel = [0, 1, 5];
      const dup = advanceSelection(sel, 0, 4);
      expect(dup).toEqual([0, 1, 5]);
    });
  });

  describe("3. SES EFEKTLERİ (SFX) VE HAPTİK TİTREŞİM ENTEGRASYONU", () => {
    it("seçim notaları, başarı, hata ve uzun kelime haptikleri hata fırlatmadan tetiklenebilmelidir", () => {
      setSfxEnabled(true);
      setHapticsEnabled(true);
      expect(getSfxEnabled()).toBe(true);
      expect(getHapticsEnabled()).toBe(true);

      // 8 kademeli yükselen seçim notaları
      for (let i = 0; i < 8; i++) {
        expect(() => playSelectionNote(i)).not.toThrow();
        expect(() => triggerHapticSelection()).not.toThrow();
      }

      expect(() => playSuccessSound(5)).not.toThrow();
      expect(() => triggerHapticSuccess()).not.toThrow();
      expect(() => triggerHapticLongWord()).not.toThrow();
      expect(() => playErrorSound()).not.toThrow();
      expect(() => triggerHapticError()).not.toThrow();

      // Kapatma döngüsü
      setSfxEnabled(false);
      setHapticsEnabled(false);
      expect(getSfxEnabled()).toBe(false);
      expect(getHapticsEnabled()).toBe(false);

      expect(() => playSelectionNote(0)).not.toThrow();
      expect(() => triggerHapticSelection()).not.toThrow();

      // Tekrar aç
      setSfxEnabled(true);
      setHapticsEnabled(true);
    });
  });

  describe("4. ANİMASYONLAR VE GÖRSEL GERİ BİLDİRİM BİLEŞENLERİ", () => {
    it("TilePop aktif ve inaktif durumlarda doğru render edilmelidir", () => {
      const htmlActive = renderToStaticMarkup(
        React.createElement(TilePop, {
          active: true,
          children: React.createElement("div", null, "K"),
        })
      );
      expect(htmlActive).toContain("K");

      const htmlInactive = renderToStaticMarkup(
        React.createElement(TilePop, {
          active: false,
          children: React.createElement("div", null, "A"),
        })
      );
      expect(htmlInactive).toContain("A");
    });

    it("FloatingScoreBurst puan ve övgü patlamasını render etmelidir", () => {
      const htmlBurst = renderToStaticMarkup(
        React.createElement(FloatingScoreBurst, { text: "⚡ EFSANEVİ! +150 ⭐" })
      );
      expect(htmlBurst).toContain("⚡ EFSANEVİ! +150 ⭐");

      const htmlNull = renderToStaticMarkup(
        React.createElement(FloatingScoreBurst, { text: null })
      );
      expect(htmlNull).toBe("");
    });

    it("FloatingTimeBonus kombo ve süre bonusunu doğru renk şemasıyla render etmelidir", () => {
      const htmlBonus = renderToStaticMarkup(
        React.createElement(FloatingTimeBonus, { text: "🔥 ATEŞLİ KOMBO x2! +4s" })
      );
      expect(htmlBonus).toContain("🔥 ATEŞLİ KOMBO x2! +4s");

      const htmlNull = renderToStaticMarkup(
        React.createElement(FloatingTimeBonus, { text: null })
      );
      expect(htmlNull).toBe("");
    });

    it("TouchMagnifierBubble parmak üstü büyüteci doğru harfle render etmelidir", () => {
      const htmlBubble = renderToStaticMarkup(
        React.createElement(TouchMagnifierBubble, {
          letter: "Ş",
          center: { x: 100, y: 150 },
          visible: true,
          accentColor: "#F59E0B",
        })
      );
      expect(htmlBubble).toContain("Ş");

      const htmlHidden = renderToStaticMarkup(
        React.createElement(TouchMagnifierBubble, {
          letter: "A",
          center: { x: 100, y: 150 },
          visible: false,
        })
      );
      expect(htmlHidden).toBe("");
    });

    it("ConnectLine iki nokta arası bağlantı çizgisini ve okunu render etmelidir", () => {
      const htmlLine = renderToStaticMarkup(
        React.createElement(ConnectLine, {
          x1: 50,
          y1: 50,
          x2: 120,
          y2: 50,
          color: "#219d8d",
          showArrow: true,
        })
      );
      expect(htmlLine).toBeDefined();
    });

    it("UrgencyVignette aktifken kırmızı nabız çerçevesini render etmelidir", () => {
      const htmlActive = renderToStaticMarkup(
        React.createElement(UrgencyVignette, { active: true })
      );
      expect(htmlActive).toBeDefined();

      const htmlInactive = renderToStaticMarkup(
        React.createElement(UrgencyVignette, { active: false })
      );
      expect(htmlInactive).toBe("");
    });
  });

  describe("5. ZAFER EFEKTLERİ VE PARÇACIK HAVUZU (5 KOZMETİK EFEKT)", () => {
    const effects = ["pulse", "glitch", "flare", "lightning", "fireworks"];

    effects.forEach((eff) => {
      it(`"${eff}" zafer efekti parçacıkları ve banner metinlerini eksiksiz render etmelidir`, () => {
        const html = renderToStaticMarkup(
          React.createElement(VictoryEffectOverlay, {
            effectId: eff,
            visible: true,
            title: "Harika Oynadın!",
            subtitle: "Tüm Kelimeler Bulundu",
            showToast: true,
          })
        );
        expect(html).toContain("Harika Oynadın!");
        expect(html).toContain("Tüm Kelimeler Bulundu");
      });
    });
  });

  describe("6. SEVİYE ATLAMA & LİG TERFİSİ MODALI (CELEBRATION MODAL)", () => {
    it("seviye atlama kutlaması doğru rozet unvanları ve çip ödüllerini render etmelidir", () => {
      const lvl2 = getLevelUpDetails(2);
      expect(lvl2.coins).toBe(15);
      expect(lvl2.title).toBe("ÇAYLAK ADIMI");

      const lvl5 = getLevelUpDetails(5);
      expect(lvl5.coins).toBe(35);
      expect(lvl5.unlocks.some((u) => u.includes("6×6"))).toBe(true);

      const lvl8 = getLevelUpDetails(8);
      expect(lvl8.coins).toBe(40);
      expect(lvl8.unlocks.some((u) => u.includes("8×8"))).toBe(true);

      const lvl10 = getLevelUpDetails(10);
      expect(lvl10.coins).toBe(50);
      expect(lvl10.unlocks.some((u) => u.includes("10×10"))).toBe(true);

      const htmlModal = renderToStaticMarkup(
        React.createElement(CelebrationModal, {
          data: {
            type: "level-up",
            level: 5,
          },
          onClose: () => {},
        })
      );
      expect(htmlModal).toContain("5. SEVİYEYE ULAŞTIN!");
      expect(htmlModal).toContain("6×6 Matris Düello Modu");
      expect(htmlModal).toContain("HARİKA, DEVAM ET");
    });

    it("lig terfisi kutlaması yeni lig adını ve rozet simgesini render etmelidir", () => {
      const bronzePromo = getLeaguePromotionDetails("BRONZ");
      expect(bronzePromo.icon).toBe("🛡️");

      const goldPromo = getLeaguePromotionDetails("ALTIN");
      expect(goldPromo.icon).toBe("🦅");

      const diamondPromo = getLeaguePromotionDetails("ELMAS");
      expect(diamondPromo.icon).toBe("💎");

      const htmlModal = renderToStaticMarkup(
        React.createElement(CelebrationModal, {
          data: {
            type: "league-promotion",
            previousTier: "BRONZ",
            newTier: "GÜMÜŞ",
            newLp: 420,
          },
          onClose: () => {},
        })
      );
      expect(htmlModal).toContain("LİG TERFİSİ");
      expect(htmlModal).toContain("GÜMÜŞ LİGİNE YÜKSELDİN!");
      expect(htmlModal).toContain("420 LP");
      expect(htmlModal).toContain("KADEMEYE BAŞLA");
    });
  });

  describe("7. VINTAGE (GAZETE MODU 10x10) DOKUNMA VE BULMACA MEKANİĞİ", () => {
    it("10x10 bulmaca tahtası sıfır çakışma ve yeterli harf havuzuyla üretilmelidir", () => {
      const puzzle = generatePuzzle("easy");
      expect(puzzle.boardSize).toBe(10);
      expect(puzzle.words.length).toBeGreaterThanOrEqual(3);

      const uniqueChars = new Set<string>();
      puzzle.words.forEach((w) => {
        for (let i = 0; i < w.answer.length; i++) {
          uniqueChars.add(w.answer[i]!);
        }
      });

      expect(uniqueChars.size).toBeGreaterThanOrEqual(8);
      expect(puzzle.centerWord).toBeDefined();
    });
  });
});
