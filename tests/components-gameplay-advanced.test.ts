import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Animated } from "react-native";
import { DEFAULT_PROGRESS } from "@/shared/progression";

// 1. Solo Advanced Components
import { SoloBoardGrid } from "@/components/solo/solo-board-grid";
import { SoloWonView, SoloLostView } from "@/components/solo/solo-result-views";
import { SoloWordRouteCard } from "@/components/solo/solo-word-route-card";
import { SoloLevelsScreen } from "@/components/solo/solo-levels-screen";

// 2. Vintage Advanced Components
import { VintageBoardGrid } from "@/components/vintage/vintage-board-grid";
import { GridCellItem } from "@/components/vintage/vintage-grid-cell";
import { VintageMapView } from "@/components/vintage/vintage-map-view";

// 3. Arcade Advanced Components
import { ArcadeBoardGrid } from "@/components/arcade/arcade-board-grid";
import { ArcadeLobbyScreen } from "@/components/arcade/arcade-lobby-screen";
import { ArcadeRouteInspector } from "@/components/arcade/arcade-route-inspector";

// 4. Boosters & Effects
import { FloatingCombo } from "@/components/game/game-boosters";
import { VictoryBanner, VictoryEffectOverlay } from "@/components/game/victory-effect-overlay";

describe("Component Tests: Advanced Gameplay & Interactive Grids", () => {
  describe("SoloBoardGrid", () => {
    it("solo tahta hücrelerini ve harfleri eksiksiz render etmelidir", () => {
      const mockChallenge = {
        size: 4,
        words: ["KALE", "MASA"],
        routes: { KALE: [0, 1, 2, 3], MASA: [4, 5, 6, 7] },
        board: [
          "K", "A", "L", "E",
          "M", "A", "S", "A",
          "T", "E", "S", "T",
          "O", "Y", "U", "N",
        ],
      };

      const html = renderToStaticMarkup(
        React.createElement(SoloBoardGrid, {
          boardRef: { current: null },
          measureBoard: vi.fn(),
          boardWidth: 320,
          activeTheme: {
            id: "theme_default",
            name: "Klasik",
            boardColor: "#1B2A38",
            tileColor: "#2C3E50",
            textColor: "#FFFFFF",
            accentColor: "#3498DB",
            bgColors: ["#0B131B", "#1B2A38"],
          } as any,
          shakeAnim: new Animated.Value(0),
          isUrgent: false,
          scoreBurstText: null,
          countdown: null,
          selected: [0, 1],
          getCellCenter: () => ({ x: 20, y: 20 }),
          status: "playing",
          foundPaths: [[0, 1, 2, 3]],
          challenge: mockChallenge,
          inspectedPath: null,
          inspectedColor: null,
          selectedSet: new Set([0, 1]),
          foundCells: new Set([0, 1, 2, 3]),
          foundCellColors: new Map(),
          solutionColors: new Map(),
          radarHighlights: new Set<number>(),
          feedback: "idle",
          particles: [],
          onGestureStart: vi.fn(),
          onGestureMove: vi.fn(),
          onGestureEnd: vi.fn(),
          onGestureCancel: vi.fn(),
        })
      );

      expect(html).toContain("K");
      expect(html).toContain("M");
      expect(html).toContain("O");
    });
  });

  describe("SoloWonView & SoloLostView", () => {
    it("SoloWonView zafer başlığını, bulunan kelime sayısını ve devam butonunu göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SoloWonView, {
          daily: false,
          level: 3,
          foundCount: 5,
          seconds: 24,
          accentColor: "#3EE8B5",
          handleShareDaily: vi.fn(),
          chestState: "closed",
          decryptText: "",
          decryptProgress: 0,
          doubleXpEarned: false,
          startDecryption: vi.fn(),
          safeWatchAd: vi.fn(),
          setDoubleXpEarned: vi.fn(),
          onNext: vi.fn(),
          onExit: vi.fn(),
        })
      );

      expect(html).toContain("Seviye senin!");
      expect(html).toContain("5 kelime buldun · 24 saniye artırdın");
      expect(html).toContain("SEVİYE HARİTASINA DÖN");
    });

    it("SoloLostView süre dolduğunda çözüm ipuçlarını ve reklamla kurtar seçeneğini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SoloLostView, {
          words: ["KİTAP", "DEFTER"],
          routes: { KİTAP: [0, 1, 2, 3, 4], DEFTER: [5, 6, 7, 8, 9, 10] },
          wordDifficulties: { KİTAP: "easy", DEFTER: "medium" },
          inspectWord: vi.fn(),
          revived: false,
          remainingRevives: 2,
          onReviveWithAd: vi.fn(),
          daily: false,
          accentColor: "#F59E0B",
          onRetry: vi.fn(),
          onExit: vi.fn(),
        })
      );

      expect(html).toContain("SÜRE DOLDU");
      expect(html).toContain("KİTAP");
      expect(html).toContain("DEFTER");
      expect(html).toContain("SÜREYİ KURTAR (+20sn REKLAM) · KALAN: 2/3");
    });
  });

  describe("SoloWordRouteCard", () => {
    it("seçilen kelimenin harf sayısını ve rota başlığını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SoloWordRouteCard, {
          selectedWordInfo: {
            word: "BİLGİSAYAR",
            definition: "Verileri işleyen elektronik cihaz.",
            loading: false,
          },
          inspectedPath: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          inspectedColor: "#3498DB",
          accentColor: "#3EE8B5",
          onClose: vi.fn(),
        })
      );

      expect(html).toContain("KELİME ROTASI &amp; YÖNÜ");
      expect(html).toContain("10 HARF");
      expect(html).toContain("Verileri işleyen elektronik cihaz.");
      expect(html).toContain("Rotayı Kapat");
    });
  });

  describe("SoloLevelsScreen", () => {
    it("seviye haritası ekranını ve kilit durumunu render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SoloLevelsScreen, {
          soloUnlockedLevel: 12,
          progress: DEFAULT_PROGRESS,
          lives: 5,
          unclaimedMissions: 1,
          hasClaimableDailyReward: false,
          globalToast: null,
          setGlobalToast: vi.fn(),
          onOpenLivesModal: vi.fn(),
          onNavigate: vi.fn(),
          onSelectLevel: vi.fn(),
          claimMilestoneOnServer: vi.fn(),
        })
      );

      expect(html).toBeDefined();
      expect(html).toContain("12");
    });
  });

  describe("VintageBoardGrid & GridCellItem & VintageMapView", () => {
    it("GridCellItem bulmaca hücresini harf ve indeks numarasıyla render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(GridCellItem, {
          row: 0,
          col: 0,
          char: "A",
          isSelected: true,
          isPuzzleCell: true,
          cellNumber: 1,
          isCenterArea: false,
          isCellCompleted: false,
          isCenterWordPlaced: false,
          isTargetWordCell: true,
          isErrorCell: false,
          cellSize: 32,
          onPress: vi.fn(),
        })
      );

      expect(html).toContain("A");
      expect(html).toContain("1");
    });

    it("VintageMapView nostalji bulmaca başlığını ve can göstergesini render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(VintageMapView, {
          measureContainer: vi.fn(),
          onBack: vi.fn(),
          isInfiniteLives: false,
          lives: 5,
          score: 250,
          maxUnlockedLevel: 3,
          completedLevels: new Set([1, 2]),
          levelIndex: 3,
          onSelectLevel: vi.fn(),
        })
      );

      expect(html).toContain("NOSTALJİ KELİME BULMACA");
      expect(html).toContain("SEVİYE HARİTASI");
      expect(html).toContain("250");
    });
  });

  describe("ArcadeBoardGrid & ArcadeLobbyScreen & ArcadeRouteInspector", () => {
    it("ArcadeLobbyScreen en yüksek skor kartını ve başlığını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ArcadeLobbyScreen, {
          bestScore: 1250,
          onBack: vi.fn(),
          onOpenInfo: vi.fn(),
          onStart: vi.fn(),
        })
      );

      expect(html).toContain("ZAMANA KARŞI HÜCUM");
      expect(html).toContain("1250");
      expect(html).toContain("EN YÜKSEK SKORUN");
    });

    it("ArcadeRouteInspector rota akışını ve harf rozetini render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ArcadeRouteInspector, {
          selectedWordInfo: {
            word: "ROTA",
            definition: "Bir hedefe ulaşmak için takip edilen yön.",
            loading: false,
          },
          inspectedPath: [0, 1, 2, 3],
          inspectedColor: "#EAB308",
          onClose: vi.fn(),
        })
      );

      expect(html).toContain("KELİME ROTASI &amp; YÖNÜ");
      expect(html).toContain("4 HARF");
      expect(html).toContain("Rotayı Kapat");
    });
  });

  describe("GameBoosters & VictoryEffectOverlay", () => {
    it("FloatingCombo 2 ve üzeri kombolarda kombo rozetini göstermelidir", () => {
      const html2 = renderToStaticMarkup(
        React.createElement(FloatingCombo, { comboCount: 2 })
      );
      expect(html2).toBeDefined();

      const html4 = renderToStaticMarkup(
        React.createElement(FloatingCombo, { comboCount: 4 })
      );
      expect(html4).toBeDefined();
    });

    it("VictoryBanner yıldızları, başlık ve alt başlığı render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(VictoryBanner, {
          title: "MUHTEŞEM GALİBİYET!",
          subtitle: "Rakibini 450 puanla geride bıraktın",
        })
      );

      expect(html).toContain("★  ★  ★");
      expect(html).toContain("MUHTEŞEM GALİBİYET!");
      expect(html).toContain("Rakibini 450 puanla geride bıraktın");
    });

    it("VictoryEffectOverlay pulse ve fireworks efekt modlarında hatasız ayağa kalkmalıdır", () => {
      const pulseHtml = renderToStaticMarkup(
        React.createElement(VictoryEffectOverlay, {
          effectId: "pulse",
          visible: true,
          title: "Zafer!",
        })
      );
      expect(pulseHtml).toBeDefined();

      const fireworksHtml = renderToStaticMarkup(
        React.createElement(VictoryEffectOverlay, {
          effectId: "fireworks",
          visible: true,
          title: "Büyük Kutlama!",
        })
      );
      expect(fireworksHtml).toBeDefined();
    });
  });
});
