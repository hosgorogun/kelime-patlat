import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// Gameplay components
import { BoardCell } from "@/components/game/board-cell";
import { FloatingCombo } from "@/components/game/game-boosters";
import { GameHeaderTimer } from "@/components/game/game-header-timer";
import { GameCountdownOverlay } from "@/components/game/game-countdown-overlay";
import { ScoreBadge } from "@/components/game/score-badge";
import { VictoryBanner } from "@/components/game/victory-effect-overlay";
import { GameSplashScreen } from "@/components/game/game-splash-screen";
import { OrnatePanel, GameAtmosphere } from "@/components/game/game-ui";

import { SoloHeader } from "@/components/solo/solo-header";
import { SoloWordTray } from "@/components/solo/solo-word-tray";
import { SoloFoundWords } from "@/components/solo/solo-found-words";

import { ArcadeHeader } from "@/components/arcade/arcade-header";
import { ArcadeSummaryPanel } from "@/components/arcade/arcade-summary-panel";

import { VintageClueBanner } from "@/components/vintage/vintage-clue-banner";
import { VintagePlayHeader } from "@/components/vintage/vintage-play-header";

describe("Component Tests: Gameplay & Board Views", () => {
  describe("BoardCell", () => {
    it("harfi ve temel ızgara hücresini render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(BoardCell, {
          letter: "A",
          index: 0,
          order: 0,
          selected: false,
          isTail: false,
          isFound: false,
          size: 6,
          selectionFeedback: "idle",
          playerId: "p1",
          status: "playing",
        })
      );
      expect(html).toContain("A");
    });

    it("seçili hücrede sıra numarasını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(BoardCell, {
          letter: "K",
          index: 2,
          order: 1,
          selected: true,
          isTail: false,
          isFound: false,
          size: 6,
          selectionFeedback: "idle",
          playerId: "p1",
          status: "playing",
        })
      );
      expect(html).toContain("K");
      expect(html).toContain("2"); // order + 1
    });

    it("özel karo tiplerini (buz, bomba, altın) doğru emojilerle göstermelidir", () => {
      const iceHtml = renderToStaticMarkup(
        React.createElement(BoardCell, {
          letter: "B",
          index: 0,
          order: 0,
          selected: false,
          isTail: false,
          isFound: false,
          size: 6,
          selectionFeedback: "idle",
          playerId: "p1",
          status: "playing",
          specialTileType: "ice",
        })
      );
      expect(iceHtml).toContain("🧊");

      const bombHtml = renderToStaticMarkup(
        React.createElement(BoardCell, {
          letter: "C",
          index: 1,
          order: 0,
          selected: false,
          isTail: false,
          isFound: false,
          size: 6,
          selectionFeedback: "idle",
          playerId: "p1",
          status: "playing",
          specialTileType: "bomb",
        })
      );
      expect(bombHtml).toContain("💣");

      const goldHtml = renderToStaticMarkup(
        React.createElement(BoardCell, {
          letter: "D",
          index: 2,
          order: 0,
          selected: false,
          isTail: false,
          isFound: false,
          size: 6,
          selectionFeedback: "idle",
          playerId: "p1",
          status: "playing",
          specialTileType: "gold",
        })
      );
      expect(goldHtml).toContain("🪙");
    });

    it("bulunan ve kaçırılan kelime hücre işaretlerini (✓ ve ✗) göstermelidir", () => {
      const foundHtml = renderToStaticMarkup(
        React.createElement(BoardCell, {
          letter: "T",
          index: 0,
          order: 0,
          selected: false,
          isTail: false,
          isFound: true,
          foundBy: "p1",
          size: 6,
          selectionFeedback: "idle",
          playerId: "p1",
          status: "playing",
        })
      );
      expect(foundHtml).toContain("✓");

      const missedHtml = renderToStaticMarkup(
        React.createElement(BoardCell, {
          letter: "Z",
          index: 1,
          order: 0,
          selected: false,
          isTail: false,
          isFound: false,
          foundBy: "missed",
          size: 6,
          selectionFeedback: "idle",
          playerId: "p1",
          status: "finished",
        })
      );
      expect(missedHtml).toContain("✗");
    });
  });

  describe("FloatingCombo", () => {
    it("comboCount 1 veya altındayken hiçbir şey render etmemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(FloatingCombo, { comboCount: 1 })
      );
      expect(html).toBe("");
    });
  });

  describe("GameHeaderTimer", () => {
    it("oyuncu isimlerini, skorlarını ve süreyi doğru formatlamalıdır", () => {
      const html = renderToStaticMarkup(
        React.createElement(GameHeaderTimer, {
          myName: "Ben",
          myScore: 120,
          opponentName: "Rakip",
          opponentScore: 90,
          remainingSeconds: 55,
          myMultiplier: 1.5,
        })
      );
      expect(html).toContain("Ben");
      expect(html).toContain("120 P");
      expect(html).toContain("Rakip");
      expect(html).toContain("90 P");
      expect(html).toContain("0:55");
      expect(html).toContain("×1.5");
    });

    it("süre 60 saniyenin üzerindeyse dakika cinsinden formatlamalıdır", () => {
      const html = renderToStaticMarkup(
        React.createElement(GameHeaderTimer, {
          myName: "Oyuncu",
          myScore: 0,
          opponentScore: 0,
          remainingSeconds: 90,
        })
      );
      expect(html).toContain("1:30");
    });
  });

  describe("GameCountdownOverlay", () => {
    it("countdown null iken hiçbir şey render etmemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(GameCountdownOverlay, { countdown: null })
      );
      expect(html).toBe("");
    });

    it("geri sayım aşamalarına göre doğru durum metinlerini basmalıdır", () => {
      const step3 = renderToStaticMarkup(
        React.createElement(GameCountdownOverlay, { countdown: 3 })
      );
      expect(step3).toContain("HAZIRLAN...");

      const step2 = renderToStaticMarkup(
        React.createElement(GameCountdownOverlay, { countdown: 2 })
      );
      expect(step2).toContain("DİKKATİNİ TOPLA...");

      const step1 = renderToStaticMarkup(
        React.createElement(GameCountdownOverlay, { countdown: 1 })
      );
      expect(step1).toContain("SON SANİYE...");

      const step0 = renderToStaticMarkup(
        React.createElement(GameCountdownOverlay, { countdown: 0 })
      );
      expect(step0).toContain("ARENA AÇILDI!");
    });
  });

  describe("ScoreBadge & VictoryBanner", () => {
    it("ScoreBadge isim, skor ve kelime oranını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ScoreBadge, {
          name: "Barış",
          score: 180,
          words: 4,
          total: 6,
          active: true,
          won: false,
          accent: "#2a9c7a",
        })
      );
      expect(html).toContain("Barış");
      expect(html).toContain("180");
      expect(html).toContain("4 / 6 KELİME");
    });

    it("VictoryBanner başlık ve alt başlığı göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(VictoryBanner, {
          title: "MÜKEMMEL ZAFER!",
          subtitle: "Rakibini geride bıraktın",
        })
      );
      expect(html).toContain("MÜKEMMEL ZAFER!");
      expect(html).toContain("Rakibini geride bıraktın");
    });
  });

  describe("SoloHeader & SoloWordTray & SoloFoundWords", () => {
    const mockTheme = {
      surface: "#FFFFFF",
      headerText: "#293541",
      accentColor: "#2a8fbc",
      trayBackground: "#F5F8F6",
      cellBorder: "#DCE1D7",
    };

    it("SoloHeader seviye numarası ve meydan okuma başlığını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SoloHeader, {
          daily: false,
          level: 12,
          challengeTitle: "Orman Gezisi",
          challengeSubtitle: "Gizli 5 kelimeyi bul",
          activeTheme: mockTheme,
          radarCharges: 2,
          radarCooldown: 0,
          status: "playing",
          seconds: 60,
          timeBonusText: null,
          foundCount: 2,
          totalWords: 5,
          comboStreak: 0,
          onExitPress: vi.fn(),
          onRadarPress: vi.fn(),
          onPausePress: vi.fn(),
        })
      );
      expect(html).toContain("SEVİYE 12");
      expect(html).toContain("Orman Gezisi");
      expect(html).toContain("Gizli 5 kelimeyi bul");
    });

    it("SoloWordTray aktif seçili kelimeyi ve durum etiketlerini formatlamalıdır", () => {
      const playingHtml = renderToStaticMarkup(
        React.createElement(SoloWordTray, {
          status: "playing",
          feedback: "idle",
          selectedLength: 4,
          activeWord: "KALE",
          activeTheme: mockTheme,
        })
      );
      expect(playingHtml).toContain("[ K - A - L - E ]");
      expect(playingHtml).toContain("BAĞLANTI SAĞLANDI");

      const wonHtml = renderToStaticMarkup(
        React.createElement(SoloWordTray, {
          status: "won",
          feedback: "accepted",
          selectedLength: 0,
          activeWord: "",
          activeTheme: mockTheme,
        })
      );
      expect(wonHtml).toContain("SEVİYE TAMAMLANDI");
      expect(wonHtml).toContain("TÜM KELİMELER ÇÖZÜLDÜ");
    });

    it("SoloFoundWords bulunan kelime etiketlerini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SoloFoundWords, {
          found: ["KİTAP", "DEFTER"],
          foundPaths: [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9, 10]],
          challengeRoutes: {},
          activeTheme: mockTheme,
          onInspectWord: vi.fn(),
        })
      );
      expect(html).toContain("KİTAP");
      expect(html).toContain("DEFTER");
      expect(html).toContain("BULDUKLARIN");
    });
  });

  describe("ArcadeHeader & ArcadeSummaryPanel", () => {
    it("ArcadeHeader skor ve kalan süreyi göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ArcadeHeader, {
          score: 340,
          seconds: 42,
          timeBonusText: null,
          foundCount: 5,
          totalWords: 8,
          size: 6,
          combo: 2,
          onExitPress: vi.fn(),
          onPausePress: vi.fn(),
        })
      );
      expect(html).toContain("ARCADE MODU");
      expect(html).toContain("ZAMANA KARŞI HÜCUM");
      expect(html).toContain("340");
      expect(html).toContain("42s");
    });

    it("ArcadeSummaryPanel kazanılan nihai skoru ve ödülleri göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ArcadeSummaryPanel, {
          score: 450,
          doubled: false,
          onDoubleReward: vi.fn(),
          onOpenResultModal: vi.fn(),
          onRestart: vi.fn(),
          onExit: vi.fn(),
        })
      );
      expect(html).toContain("450");
      expect(html).toContain("Arcade modunda ulaştığın nihai skor:");
      expect(html).toContain("EXP");
    });
  });

  describe("VintageClueBanner & VintagePlayHeader", () => {
    it("VintageClueBanner aktif ipucu metnini ve harf sayısını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(VintageClueBanner, {
          activeWordItem: {
            id: "w1",
            answer: "GÜNEŞ",
            clue: "Dünyamızı ısıtan gök cismi",
            length: 5,
            direction: "horizontal",
            row: 0,
            col: 0,
          } as any,
          solvedWordIds: new Set<string>(),
          completedCount: 1,
          totalCount: 4,
          placementDirection: "horizontal",
          onSelectDirection: vi.fn(),
          selectedWordId: "w1",
          onSelectWord: vi.fn(),
        })
      );
      expect(html).toContain("Dünyamızı ısıtan gök cismi");
      expect(html).toContain("5 HARF");
      expect(html).toContain("YATAY");
      expect(html).toContain("DİKEY");
    });

    it("VintagePlayHeader bölüm başlığını ve can göstergesini render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(VintagePlayHeader, {
          levelIndex: 5,
          lives: 4,
          isInfiniteLives: false,
          score: 120,
          boardSwapCount: 0,
          onBackPress: vi.fn(),
          onUseHint: vi.fn(),
          onResetLevel: vi.fn(),
        })
      );
      expect(html).toContain("10×10 KELİME BULMACA");
      expect(html).toContain("5. BÖLÜM");
      expect(html).toContain("HARİTA");
    });
  });

  describe("GameSplashScreen & GameUI Utilities", () => {
    it("GameSplashScreen açılış yükleme aşamasını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(GameSplashScreen, {
          isReady: false,
          onFinish: vi.fn(),
        })
      );
      expect(html).toContain("Evrenin harfleri toplanıyor...");
      expect(html).toContain("%8");
    });

    it("OrnatePanel ve GameAtmosphere bileşenleri hatasız render edilmelidir", () => {
      const panelHtml = renderToStaticMarkup(
        React.createElement(
          OrnatePanel,
          { accent: "gold", children: React.createElement("span", null, "Panel İçeriği") }
        )
      );
      expect(panelHtml).toContain("Panel İçeriği");

      const atmosphereHtml = renderToStaticMarkup(
        React.createElement(GameAtmosphere, null)
      );
      expect(atmosphereHtml).toBeDefined();
    });
  });
});
