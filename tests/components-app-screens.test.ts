import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_PROGRESS } from "@/shared/progression";

// 1. Dashboard & Lobby Screens
import { CommandCenter } from "@/components/command/command-center";

// 2. Store & Customization Tabs
import { StoreCosmeticsTab } from "@/components/store/store-cosmetics-tab";
import { ProfileCustomizer } from "@/components/profile/profile-customizer";
import { ProfileSettingsTab } from "@/components/profile/profile-settings-tab";

// 3. Season Hub & Friends Tab
import { SeasonHub } from "@/components/season/season-hub";
import { SeasonFriendsTab } from "@/components/season/season-friends-tab";

// 4. PvP Result & Route Inspector
import { PvpResultPanel } from "@/components/pvp/pvp-result-panel";
import { PvpRouteInspectorCard } from "@/components/pvp/pvp-route-inspector";

// 5. Match Insight & Rewards
import { MatchInsight } from "@/components/modals/match-insight";
import { MatchRewardsCard } from "@/components/modals/match-rewards";

describe("Component Tests: App Screens, Tabs & Post-Match Cards", () => {
  describe("CommandCenter", () => {
    it("komuta merkezi başlığını, oyuncu adını ve oyun modlarını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(CommandCenter, {
          playerName: "Yıldız_Kelimeci",
          progress: DEFAULT_PROGRESS,
          leaderboard: [],
          onPlayBot: vi.fn(),
          onSolo: vi.fn(),
          onNavigate: vi.fn(),
          onShowGuide: vi.fn(),
        })
      );

      expect(html).toContain("Yıldız_Kelimeci");
      expect(html).toContain("SEVİYE YOLCULUĞU");
      expect(html).toContain("SKOR HÜCUMU");
      expect(html).toContain("GAZETE BULMACASI");
      expect(html).toContain("BİR KELİMEYLE BAŞLA");
    });
  });

  describe("StoreCosmeticsTab", () => {
    it("profil çerçeveleri ve zafer efektleri vitrinini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(StoreCosmeticsTab, {
          progress: DEFAULT_PROGRESS,
          onCosmeticPress: vi.fn(),
          onSelectFrame: vi.fn(),
          onSelectVictoryEffect: vi.fn(),
          onSelectBoardSkin: vi.fn(),
        })
      );

      expect(html).toContain("PROFİL SİNYALİNİ KUR");
      expect(html).toContain("PROFİL ÇERÇEVELERİ");
      expect(html).toContain("ZAFER VE KUTLAMA EFEKTLERİ");
      expect(html).toContain("SİBER TAHTA KAPLAMALARI");
    });
  });

  describe("ProfileCustomizer", () => {
    it("koleksiyon başlığını ve çerçeve/avatar sekmelerini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ProfileCustomizer, {
          customizerTab: "frames",
          setCustomizerTab: vi.fn(),
          unlockedFramesCount: 3,
          unlockedAvatarsCount: 5,
          unlockedTitlesCount: 2,
          unlockedBadgesCount: 4,
          progress: DEFAULT_PROGRESS,
          activeTitle: "ROTA USTASI",
          badges: [],
          onSelectFrame: vi.fn(),
          onSelectAvatar: vi.fn(),
          onSelectTitle: vi.fn(),
        })
      );

      expect(html).toContain("Kendine göre seç");
      expect(html).toContain("KOLEKSİYON");
      expect(html).toContain("ÇERÇEVE");
      expect(html).toContain("AVATAR");
      expect(html).toContain("UNVAN");
      expect(html).toContain("ROZET");
    });
  });

  describe("ProfileSettingsTab", () => {
    it("ses efektleri ve titreşim anahtarlarını, gizlilik seçeneklerini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ProfileSettingsTab, {
          sfxOn: true,
          toggleSfx: vi.fn(),
          hapticsOn: true,
          toggleHaptics: vi.fn(),
          progress: DEFAULT_PROGRESS,
          isGuest: true,
          hasDeleteAccount: true,
          onOpenLogoutModal: vi.fn(),
          onOpenDeleteModal: vi.fn(),
          onOpenPrivacyModal: vi.fn(),
        })
      );

      expect(html).toContain("SES VE GERİ BİLDİRİM");
      expect(html).toContain("SES EFEKTLERİ");
      expect(html).toContain("HAPTİK TİTREŞİM");
      expect(html).toContain("GİZLİLİK POLİTİKASI");
    });
  });

  describe("SeasonHub & SeasonFriendsTab", () => {
    it("SeasonHub ligler, liderlik tablosu ve arkadaşlar sekmelerini içermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SeasonHub, {
          playerId: "p1",
          playerName: "MeydanOkuyan",
          progress: DEFAULT_PROGRESS,
          leaderboard: [],
          onBack: vi.fn(),
        })
      );

      expect(html).toContain("Ligler");
      expect(html).toContain("Sıralama");
      expect(html).toContain("Arkadaşlar");
    });

    it("SeasonFriendsTab arkadaş ekleme alanını ve topluluk kahraman kartını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SeasonFriendsTab, {
          friendsList: [
            { id: "f1", name: "Dost_Oyuncu", isOnline: true, tier: "ALTIN" } as any,
          ],
          onlineFriendsCount: 1,
          friendInput: "",
          setFriendInput: vi.fn(),
          handleAddFriend: vi.fn(),
          socialMessage: null,
          friendsSubTab: "friends",
          setFriendsSubTab: vi.fn(),
          pendingRequestsList: [],
          setPendingRequestsList: vi.fn(),
          setFriendsList: vi.fn(),
          handleRemoveFriend: vi.fn(),
          handleDuelPress: vi.fn(),
        })
      );

      expect(html).toContain("TOPLULUK AĞI");
      expect(html).toContain("ARKADAŞLARINLA YARIŞ");
      expect(html).toContain("Dost_Oyuncu");
      expect(html).toContain("YENİ ARKADAŞ EKLE");
    });
  });

  describe("PvpResultPanel & PvpRouteInspectorCard", () => {
    it("PvpResultPanel galibiyet veya mağlubiyet durumunu ve rövanş butonunu render etmelidir", () => {
      const htmlWin = renderToStaticMarkup(
        React.createElement(PvpResultPanel, {
          isFinished: true,
          isDraw: false,
          iWon: true,
          activeVictoryEffect: "🔥",
          rematchPending: false,
          notice: "",
          onShowResultsModal: vi.fn(),
          onRequestRematch: vi.fn(),
          onLeaveRoom: vi.fn(),
        })
      );

      expect(htmlWin).toContain("TUR SENİN! 🔥");
      expect(htmlWin).toContain("RÖVANŞ İSTE");
      expect(htmlWin).toContain("SONUÇ VE DETAY KARTINI GÖR");

      const htmlDraw = renderToStaticMarkup(
        React.createElement(PvpResultPanel, {
          isFinished: true,
          isDraw: true,
          iWon: false,
          activeVictoryEffect: "",
          rematchPending: true,
          notice: "",
          onShowResultsModal: vi.fn(),
          onRequestRematch: vi.fn(),
          onLeaveRoom: vi.fn(),
        })
      );

      expect(htmlDraw).toContain("BERABERE BİTTİ!");
      expect(htmlDraw).toContain("RAKİP BEKLENİYOR");
    });

    it("PvpRouteInspectorCard seçilen kelimenin harf sayısını ve rota başlığını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(PvpRouteInspectorCard, {
          selectedWordInfo: {
            word: "KAZANIM",
            definition: "Elde edilen başarı veya fayda.",
          },
          inspectedPath: [0, 1, 2, 3, 4, 5, 6],
          inspectedColor: "#10B981",
          onClose: vi.fn(),
        })
      );

      expect(html).toContain("KELİME ROTASI &amp; YÖNÜ");
      expect(html).toContain("7 HARF");
      expect(html).toContain("Rotayı Kapat");
    });
  });

  describe("MatchInsight & MatchRewardsCard", () => {
    it("MatchInsight skor farkını, kelime dağılımını ve tempo analizini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(MatchInsight, {
          score: 180,
          opponentScore: 120,
          words: 6,
          opponentWords: 4,
          tempo: 12,
          opponentTempo: 8,
          bestScore: 200,
        })
      );

      expect(html).toContain("ROTA VE TEMPO ANALİZİ");
      expect(html).toContain("SEN");
      expect(html).toContain("RAKİP");
      expect(html).toContain("6 kelime (%60)");
      expect(html).toContain("180 · 120");
    });

    it("MatchRewardsCard kazanılan XP, LP ve zafer bonuslarını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(MatchRewardsCard, {
          progress: DEFAULT_PROGRESS,
          xpEarned: 150,
          lpEarned: 25,
          currentLp: 120,
          coinsEarned: 15,
          pvpWinStreak: 3,
          isCrushingWin: true,
        })
      );

      expect(html).toContain("MAÇ SONU KAZANIMLARI");
      expect(html).toContain("KAZANILAN EXP");
      expect(html).toContain("KAZANILAN LİG");
      expect(html).toContain("3 MAÇLIK GALİBİYET SERİSİ!");
    });
  });
});
