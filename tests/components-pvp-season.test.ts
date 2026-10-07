import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_PROGRESS } from "@/shared/progression";

// PvP & Season Components
import { OnlineLobbyScreen } from "@/components/pvp/online-lobby-screen";
import { PlayerRow } from "@/components/pvp/room-waiting-screen";
import { TurnMatchesModal } from "@/components/pvp/turn-matches-modal";
import { SeasonLeaderboardTab } from "@/components/season/season-leaderboard-tab";
import { LeagueHub } from "@/components/season/league-hub";
import { MissionsScreen } from "@/components/missions/missions-screen";
import { WeekendHuntCard } from "@/components/daily/weekend-hunt-card";
import { FriendsLobbyScreen } from "@/components/friends/friends-lobby-screen";

describe("Component Tests: PvP, Season & Social Views", () => {
  describe("OnlineLobbyScreen", () => {
    it("dereceli arena başlığını ve tahta boyutu seçim kartlarını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(OnlineLobbyScreen, {
          playerName: "MeydanOkuyan",
          onPlayerNameChange: vi.fn(),
          selectedSize: 6,
          onSelectSize: vi.fn(),
          currentLevel: 8,
          onBack: vi.fn(),
          onOpenInfo: vi.fn(),
          onStartMatchmaking: vi.fn(),
          onPromptBotDuel: vi.fn(),
          onLockedSize: vi.fn(),
        })
      );
      expect(html).toContain("DERECELİ ARENA");
      expect(html).toContain("DERECELİ DÜELLO");
      expect(html).toContain("TAHTA BOYUTU SEÇİN");
      expect(html).toContain("Nabız");
      expect(html).toContain("Akış");
      expect(html).toContain("Derinlik");
      expect(html).toContain("Zirve");
    });
  });

  describe("RoomWaitingScreen - PlayerRow", () => {
    it("oyuncu ismini ve hazır durumunu doğru render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(PlayerRow, {
          player: {
            id: "p1",
            name: "Savaşçı_01",
            connected: true,
            ready: true,
            isBot: false,
          },
          isMe: true,
          accent: "#2a9c7a",
        })
      );
      expect(html).toContain("Savaşçı_01");
    });

    it("bot oyuncular için bot etiketini render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(PlayerRow, {
          player: {
            id: "bot_1",
            name: "Yapay_Zeka",
            connected: true,
            ready: true,
            isBot: true,
          },
          isMe: false,
          accent: "#2a8fbc",
        })
      );
      expect(html).toContain("Yapay_Zeka");
      expect(html).toContain("BOT");
    });
  });

  describe("TurnMatchesModal", () => {
    it("visible false iken hiçbir şey render etmemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(TurnMatchesModal, {
          visible: false,
          onDismiss: vi.fn(),
          playerId: "p1",
          playerName: "Oyuncu",
          friendsList: [],
        })
      );
      expect(html).toBe("");
    });

    it("visible true iken kahve düellosu başlığını ve sekmeleri göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(TurnMatchesModal, {
          visible: true,
          onDismiss: vi.fn(),
          playerId: "p1",
          playerName: "Oyuncu",
          friendsList: [],
        })
      );
      expect(html).toContain("KAHVE DÜELLOSU");
      expect(html).toContain("Sıra Sende");
      expect(html).toContain("Rakipte");
      expect(html).toContain("Bitenler");
    });
  });

  describe("SeasonLeaderboardTab", () => {
    it("kullanıcı sıralama kartını ve puanını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SeasonLeaderboardTab, {
          playerName: "Lider_Ali",
          rank: "ALTIN",
          userRankPosition: 4,
          userScore: 540,
          scoreDiffToLeader: 120,
          rankingType: "lp",
          setRankingType: vi.fn(),
          leaderboardFilter: "global",
          setLeaderboardFilter: vi.fn(),
          displayedLeaderboard: [],
          restOfLeaderboard: [],
          showAllLeaderboard: false,
          setShowAllLeaderboard: vi.fn(),
          playerId: "p1",
        })
      );
      expect(html).toContain("Lider_Ali");
      expect(html).toContain("ALTIN");
      expect(html).toContain("4. SIRADASIN");
      expect(html).toContain("540 PUAN");
      expect(html).toContain("LP");
      expect(html).toContain("SEVİYE");
    });

    it("kullanıcı 1. sıradaysa 'LİDERSİN' rozetini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SeasonLeaderboardTab, {
          playerName: "Zirve_Kralı",
          rank: "ELMAS",
          userRankPosition: 1,
          userScore: 1200,
          scoreDiffToLeader: 0,
          rankingType: "lp",
          setRankingType: vi.fn(),
          leaderboardFilter: "global",
          setLeaderboardFilter: vi.fn(),
          displayedLeaderboard: [],
          restOfLeaderboard: [],
          showAllLeaderboard: false,
          setShowAllLeaderboard: vi.fn(),
          playerId: "p1",
        })
      );
      expect(html).toContain("LİDERSİN");
    });
  });

  describe("LeagueHub", () => {
    it("lig seviyesini ve puanlarını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(LeagueHub, {
          playerId: "p1",
          progress: { ...DEFAULT_PROGRESS, lp: 350 },
          leaderboard: [],
          embedded: true,
        })
      );
      expect(html).toBeDefined();
      expect(html).toContain("LP");
    });
  });

  describe("MissionsScreen", () => {
    it("görevler ekranı başlığını ve özet ilerleme kartını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(MissionsScreen, {
          progress: DEFAULT_PROGRESS,
          onBack: vi.fn(),
          onPlayDaily: vi.fn(),
        })
      );
      expect(html).toContain("KÜÇÜK HEDEFLER, GÜZEL ÖDÜLLER");
      expect(html).toContain("Görevler");
      expect(html).toContain("AKTİF DÖNGÜ");
      expect(html).toContain("GÖREV TAMAM");
    });
  });

  describe("WeekendHuntCard", () => {
    it("hafta sonu kelime avı başlığını ve hedef kelime durumunu render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(WeekendHuntCard, {
          progress: DEFAULT_PROGRESS,
          setProgress: vi.fn(),
        })
      );
      expect(html).toBeDefined();
      expect(html).toContain("AVLANACAK GİZLİ KELİMELER");
      expect(html).toContain("KADEME ÖDÜLLERİ");
    });
  });

  describe("FriendsLobbyScreen", () => {
    it("sosyal arena başlığını ve tahta boyutu seçeneklerini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(FriendsLobbyScreen, {
          selectedSize: 6,
          onSelectSize: vi.fn(),
          roomCodeInput: "",
          onRoomCodeChange: vi.fn(),
          friendsList: [],
          onBack: vi.fn(),
          onCreateRoom: vi.fn(),
          onJoinRoom: vi.fn(),
          onInspectUser: vi.fn(),
          onChallengeFriend: vi.fn(),
          onFindFriends: vi.fn(),
          onOpenLeaderboard: vi.fn(),
        })
      );
      expect(html).toContain("SOSYAL ARENA");
      expect(html).toContain("ARKADAŞLA OYNA");
      expect(html).toContain("4×4");
      expect(html).toContain("6×6");
      expect(html).toContain("8×8");
      expect(html).toContain("10×10");
    });
  });
});
