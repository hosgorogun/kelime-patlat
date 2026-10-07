import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_PROGRESS, type PlayerProgress } from "@/shared/progression";

// Modal Components
import { LivesModal } from "@/components/modals/lives-modal";
import { CelebrationModal, getLevelUpDetails } from "@/components/modals/celebration-modal";
import { MatchConfirmModal } from "@/components/modals/match-confirm-modal";
import { MatchResultModal } from "@/components/modals/match-result-modal";
import { WordInspectModal } from "@/components/modals/word-inspect-modal";
import { TermsModal } from "@/components/modals/terms-modal";
import { WelcomeRewardModal } from "@/components/modals/welcome-reward-modal";
import { DailyTreasureModal } from "@/components/modals/daily-treasure-modal";
import { ModernAlertModal } from "@/components/modals/modern-alert-modal";
import { GameModeInfoModal } from "@/components/modals/game-mode-info-modal";
import { MatchmakingOverlay } from "@/components/modals/matchmaking-overlay";
import { LuckyWheelModal } from "@/components/modals/lucky-wheel-modal";
import { LootBoxRevealModal } from "@/components/modals/loot-box-reveal-modal";
import { ArcadeExitModal } from "@/components/arcade/arcade-exit-modal";
import { SoloExitModal } from "@/components/solo/solo-exit-modal";
import { SoloPauseModal } from "@/components/solo/solo-pause-modal";
import { LeaveDuelModal } from "@/components/friends/leave-duel-modal";
import { DuelInviteModal } from "@/components/friends/duel-invite-modal";
import { BoardSizePickerModal } from "@/components/season/board-size-picker-modal";
import { SeasonResetModal } from "@/components/season/season-reset-modal";
import { StorePurchaseModal } from "@/components/store/store-purchase-modal";
import { WordBookModal } from "@/components/profile/word-book-modal";
import { UserProfileModal } from "@/components/profile/user-profile-modal";
import { MatchHistoryModal } from "@/components/match-history/match-history-modal";
import { BotPracticeModal } from "@/components/command/bot-practice-modal";

describe("Component Tests: Modals & Dialogs", () => {
  describe("LivesModal", () => {
    it("visible false iken hiçbir şey render etmemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(LivesModal, {
          visible: false,
          progress: DEFAULT_PROGRESS,
          onClose: vi.fn(),
          onBuyOne: vi.fn(),
          onRefillAll: vi.fn(),
          onWatchAd: vi.fn(),
        })
      );
      expect(html).toBe("");
    });

    it("visible true iken Can Merkezi başlığı ve can miktarını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(LivesModal, {
          visible: true,
          progress: { ...DEFAULT_PROGRESS, lives: 3 },
          onClose: vi.fn(),
          onBuyOne: vi.fn(),
          onRefillAll: vi.fn(),
          onWatchAd: vi.fn(),
        })
      );
      expect(html).toContain("CAN MERKEZİ");
      expect(html).toContain("3/5");
      expect(html).toContain("1 CAN SATIN AL");
    });

    it("sonsuz can aktifken 'Sonsuz Can Aktif' bildirimini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(LivesModal, {
          visible: true,
          progress: {
            ...DEFAULT_PROGRESS,
            infiniteLivesUntil: Date.now() + 3600000,
          },
          onClose: vi.fn(),
          onBuyOne: vi.fn(),
          onRefillAll: vi.fn(),
          onWatchAd: vi.fn(),
        })
      );
      expect(html).toContain("Sonsuz Can Aktif");
    });
  });

  describe("CelebrationModal", () => {
    it("data null iken hiçbir şey render etmemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(CelebrationModal, {
          data: null,
          onClose: vi.fn(),
        })
      );
      expect(html).toBe("");
    });

    it("level-up durumunda seviye atlama kutlamasını ve detaylarını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(CelebrationModal, {
          data: {
            type: "level-up",
            level: 3,
            bonusCoins: 25,
            unlockHint: "Yeni Rota Modu",
          },
          onClose: vi.fn(),
        })
      );
      expect(html).toContain("TEBRİKLER! YENİ SEVİYE");
      expect(html).toContain("3. SEVİYEYE ULAŞTIN!");
      expect(html).toContain("KAZANILAN ÖDÜLLER VE YENİLİKLER");
    });

    it("league-promotion durumunda lig yükselmesini render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(CelebrationModal, {
          data: {
            type: "league-promotion",
            previousTier: "BRONZ",
            newTier: "GÜMÜŞ",
            newLp: 120,
          },
          onClose: vi.fn(),
        })
      );
      expect(html).toContain("120 LP");
      expect(html).toContain("KADEME AVANTAJLARI VE ÖDÜLLER");
    });

    it("getLevelUpDetails yardımcı fonksiyonu doğru seviye ödüllerini vermelidir", () => {
      const l2 = getLevelUpDetails(2);
      expect(l2.title).toBe("ÇAYLAK ADIMI");
      expect(l2.coins).toBe(15);

      const l3 = getLevelUpDetails(3);
      expect(l3.title).toBe("ROTA MİMARI");
      expect(l3.coins).toBe(25);
    });
  });

  describe("MatchConfirmModal", () => {
    it("visible false veya matchInfo null ise render edilmemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(MatchConfirmModal, {
          visible: false,
          matchInfo: null,
          onConfirm: vi.fn(),
          onCancel: vi.fn(),
        })
      );
      expect(html).toBe("");
    });

    it("bot ve normal maçlar için doğru etiketleri göstermelidir", () => {
      const botHtml = renderToStaticMarkup(
        React.createElement(MatchConfirmModal, {
          visible: true,
          matchInfo: {
            size: 6,
            modeTitle: "6×6 Akış Düellosu",
            durationText: "75 Saniye",
            routesText: "6 Rota",
            isBot: true,
          },
          onConfirm: vi.fn(),
          onCancel: vi.fn(),
        })
      );
      expect(botHtml).toContain("YAPAY ZEKA DÜELLOSU");
      expect(botHtml).toContain("6×6 Akış Düellosu");
      expect(botHtml).toContain("75 Saniye");

      const pvpHtml = renderToStaticMarkup(
        React.createElement(MatchConfirmModal, {
          visible: true,
          matchInfo: {
            size: 8,
            modeTitle: "8×8 Derinlik Düellosu",
            durationText: "95 Saniye",
            routesText: "8 Rota",
            isBot: false,
          },
          onConfirm: vi.fn(),
          onCancel: vi.fn(),
        })
      );
      expect(pvpHtml).toContain("DERECELİ DÜELLO");
    });
  });

  describe("MatchResultModal", () => {
    it("visible false iken render edilmemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(MatchResultModal, {
          visible: false,
          iWon: true,
          isDraw: false,
          activeVictoryEffect: "classic",
          progress: DEFAULT_PROGRESS,
          myScore: 100,
          opponentScore: 80,
          myWordCount: 5,
          opponentWordCount: 4,
          wordsTotal: 6,
          meName: "Ali",
          opponentName: "Ayşe",
          opponent: null,
          matchXpEarned: 50,
          matchLpEarned: 25,
          matchCoinsEarned: 10,
          isCustomRoom: false,
          myTempo: 1.2,
          opponentTempo: 1.0,
          allFinishedWords: [],
          myFoundWords: [],
          onInspectWord: vi.fn(),
          onRequestRematch: vi.fn(),
          onLeaveRoom: vi.fn(),
          onClose: vi.fn(),
        })
      );
      expect(html).toBe("");
    });

    it("zafer durumunda kazanan skoru ve rövanş seçeneklerini doğru göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(MatchResultModal, {
          visible: true,
          iWon: true,
          isDraw: false,
          activeVictoryEffect: "classic",
          progress: DEFAULT_PROGRESS,
          myScore: 250,
          opponentScore: 180,
          myWordCount: 6,
          opponentWordCount: 4,
          wordsTotal: 6,
          meName: "Şampiyon",
          opponentName: "Rakip",
          opponent: { name: "Rakip", tier: "ALTIN" },
          matchXpEarned: 60,
          matchLpEarned: 30,
          matchCoinsEarned: 15,
          isCustomRoom: false,
          myTempo: 1.5,
          opponentTempo: 1.1,
          allFinishedWords: [{ word: "KİTAP", path: [0, 1, 2, 3, 4], color: "#2a9c7a" }],
          myFoundWords: [{ word: "KİTAP", path: [0, 1, 2, 3, 4] }],
          onInspectWord: vi.fn(),
          onRequestRematch: vi.fn(),
          onLeaveRoom: vi.fn(),
          onClose: vi.fn(),
        })
      );
      expect(html).toContain("250");
      expect(html).toContain("180");
      expect(html).toContain("Şampiyon");
      expect(html).toContain("Rakip");
      expect(html).toContain("RÖVANŞ İSTE");
      expect(html).toContain("ANA MENÜ");
    });
  });

  describe("WordInspectModal", () => {
    it("kelime ve anlamını modal içinde doğru göstermelidir", () => {
      const wordInfo = {
        word: "bilgisayar",
        definition: "Karmaşık mantıksal ve aritmetik işlemleri yapan elektronik aygıt.",
        type: "isim",
        example: "Bilgisayar teknolojisi hızla ilerliyor.",
      };
      const html = renderToStaticMarkup(
        React.createElement(WordInspectModal, {
          visible: true,
          wordInfo,
          onClose: vi.fn(),
        })
      );
      expect(html).toContain(wordInfo.word.toUpperCase());
      expect(html).toContain("isim");
      expect(html).toContain("Karmaşık mantıksal ve aritmetik işlemleri yapan elektronik aygıt.");
      expect(html).toContain("Bilgisayar teknolojisi hızla ilerliyor.");
    });
  });

  describe("TermsModal", () => {
    it("şartlar metnini ve kabul butonunu göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(TermsModal, {
          visible: true,
          onAccept: vi.fn(),
        })
      );
      expect(html).toContain("HOŞ GELDİNİZ!");
      expect(html).toContain("KULLANIM ŞARTLARI VE GİZLİLİK ONAYI");
      expect(html).toContain("KABUL ET VE BAŞLA");
    });
  });

  describe("WelcomeRewardModal", () => {
    it("başlangıç çip ve ödüllerini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(WelcomeRewardModal, {
          visible: true,
          isClaiming: false,
          onClaim: vi.fn(),
          onClose: vi.fn(),
        })
      );
      expect(html).toContain("HOŞ GELDİN HEDİYESİ!");
      expect(html).toContain("50");
      expect(html).toContain("BAŞLANGIÇ");
      expect(html).toContain("HARİKA, BAŞLA!");
    });
  });

  describe("DailyTreasureModal", () => {
    it("7 günlük takvim ve bugünün ödülünü göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(DailyTreasureModal, {
          visible: true,
          onClose: vi.fn(),
          progress: { ...DEFAULT_PROGRESS, loginDaysCount: 1, lastLoginDay: "2020-01-01" },
          onClaim: vi.fn(),
        })
      );
      expect(html).toContain("GÜNLÜK HAZİNE");
      expect(html).toContain("GÜN");
    });
  });

  describe("ModernAlertModal", () => {
    it("alert içeriğini ve butonlarını doğru basmalıdır", () => {
      const onPrimary = vi.fn();
      const onSecondary = vi.fn();
      const html = renderToStaticMarkup(
        React.createElement(ModernAlertModal, {
          alert: {
            title: "Test Uyarı",
            message: "Bu bir test mesajıdır",
            icon: "🔥",
            primaryButton: { text: "Onayla", onPress: onPrimary },
            secondaryButton: { text: "Vazgeç", onPress: onSecondary },
          },
          onDismiss: vi.fn(),
        })
      );
      expect(html).toContain("Test Uyarı");
      expect(html).toContain("Bu bir test mesajıdır");
      expect(html).toContain("Onayla");
      expect(html).toContain("Vazgeç");
    });
  });

  describe("GameModeInfoModal", () => {
    it("farklı oyun modları için doğru bilgi başlıklarını sunmalıdır", () => {
      const pvpHtml = renderToStaticMarkup(
        React.createElement(GameModeInfoModal, {
          visible: true,
          mode: "pvp",
          onClose: vi.fn(),
        })
      );
      expect(pvpHtml).toContain("DÜELLO");

      const vintageHtml = renderToStaticMarkup(
        React.createElement(GameModeInfoModal, {
          visible: true,
          mode: "vintage",
          onClose: vi.fn(),
        })
      );
      expect(vintageHtml).toContain("Gazete Kare Bulmacası");
    });
  });

  describe("MatchmakingOverlay", () => {
    it("aranan tahta boyutunu ve sayacını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(MatchmakingOverlay, {
          state: { size: 6, elapsedSeconds: 5 },
          onCancel: vi.fn(),
        })
      );
      expect(html).toContain("EŞLEŞME ARANIYOR");
      expect(html).toContain("6×6");
      expect(html).toContain("00:05");
      expect(html).toContain("İPTAL ET");
    });
  });

  describe("LuckyWheelModal & LootBoxRevealModal", () => {
    it("LuckyWheelModal çark başlığını ve kicker metnini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(LuckyWheelModal, {
          visible: true,
          onClose: vi.fn(),
          progress: DEFAULT_PROGRESS,
          setProgress: vi.fn(),
          syncProgressToCloud: vi.fn().mockResolvedValue(undefined),
          onShowToast: vi.fn(),
        })
      );
      expect(html).toContain("GÜNLÜK ŞANS ÇARKI");
      expect(html).toContain("Şans Çarkıfeleği");
    });

    it("LootBoxRevealModal ödülleri açıldığında sandık detaylarını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(LootBoxRevealModal, {
          visible: true,
          reward: {
            title: "Usta Sandığı",
            coins: 50,
            xp: 100,
            badge: "🏆",
            accent: "#F0C855",
            icon: "📦",
            badgeIcon: "🎖️",
            badgeTitle: "Usta",
          } as any,
          onClose: vi.fn(),
        })
      );
      expect(html).toContain("Usta Sandığı");
      expect(html).toContain("SANDIĞA DOKUN VE AÇ");
    });
  });

  describe("ArcadeExitModal & SoloExitModal & SoloPauseModal", () => {
    it("ArcadeExitModal ayrılma onayını tetiklemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ArcadeExitModal, {
          visible: true,
          onDismiss: vi.fn(),
          onConfirmExit: vi.fn(),
        })
      );
      expect(html).toContain("ARCADE HÜCUMU");
      expect(html).toContain("Yarıştan Ayrıl");
      expect(html).toContain("DEVAM ET");
      expect(html).toContain("AYRIL");
    });

    it("SoloExitModal tek oyunculu modda can uyarısını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SoloExitModal, {
          visible: true,
          daily: false,
          accentColor: "#2a8fbc",
          onDismiss: vi.fn(),
          onConfirmExit: vi.fn(),
        })
      );
      expect(html).toContain("TEK OYUNCULU MOD");
      expect(html).toContain("Seviyeden Ayrıl (-1 Can)");
      expect(html).toContain("DEVAM ET");
    });

    it("SoloPauseModal duraklatma ve ses durumunu göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SoloPauseModal, {
          visible: true,
          seconds: 45,
          accentColor: "#2a8fbc",
          soundOn: true,
          onResume: vi.fn(),
          onToggleSound: vi.fn(),
          onExit: vi.fn(),
        })
      );
      expect(html).toContain("OYUN DURAKLATILDI");
      expect(html).toContain("DEVAM ET (45s)");
      expect(html).toContain("OYUN SESİ: AÇIK");
    });
  });

  describe("LeaveDuelModal & DuelInviteModal", () => {
    it("LeaveDuelModal canlı düello terk ceza uyarısını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(LeaveDuelModal, {
          visible: true,
          onStay: vi.fn(),
          onLeave: vi.fn(),
        })
      );
      expect(html).toContain("DÜELLODAN AYRIL?");
      expect(html).toContain("SAVAŞA DEVAM ET");
      expect(html).toContain("MAÇI TERK ET VE AYRIL");
    });

    it("DuelInviteModal gelen canlı meydan okumayı göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(DuelInviteModal, {
          invite: {
            fromPlayerId: "p1",
            fromPlayerName: "Mert",
            roomCode: "XYZ123",
            size: 8,
          },
          onAccept: vi.fn(),
          onReject: vi.fn(),
        })
      );
      expect(html).toContain("Mert");
      expect(html).toContain("8×8");
      expect(html).toContain("KABUL ET");
      expect(html).toContain("REDDET");
    });
  });

  describe("BoardSizePickerModal & SeasonResetModal", () => {
    it("BoardSizePickerModal tüm boyut seçeneklerini (4, 6, 8, 10) içermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(BoardSizePickerModal, {
          target: { id: "f1", name: "Zeynep", status: "online" } as any,
          onSelectSize: vi.fn(),
          onClose: vi.fn(),
        })
      );
      expect(html).toContain("Zeynep");
      expect(html).toContain("4×4");
      expect(html).toContain("6×6");
      expect(html).toContain("8×8");
      expect(html).toContain("10×10");
    });

    it("SeasonResetModal sezon sıfırlama ödülünü ve yeni lig puanını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(SeasonResetModal, {
          data: {
            newSeasonId: "sezon_2026_q2",
            previousRank: "ELMAS",
            previousLp: 850,
            newLp: 400,
          },
          onClose: vi.fn(),
        })
      );
      expect(html).toContain("YENİ SEZON BAŞLADI!");
      expect(html).toContain("850 LP");
      expect(html).toContain("400 LP");
    });
  });

  describe("StorePurchaseModal & WordBookModal", () => {
    it("StorePurchaseModal satın alma onayını ve maliyetini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(StorePurchaseModal, {
          confirmPurchase: {
            title: "Seri Koruma Kalkanı",
            description: "Günlük serinizi 1 gün boyunca dondurur",
            cost: 50,
            icon: "🛡️",
            onConfirm: vi.fn(),
          },
          coins: 100,
          onClose: vi.fn(),
        })
      );
      expect(html).toContain("Seri Koruma Kalkanı");
      expect(html).toContain("50 ÇİP");
      expect(html).toContain("VAZGEÇ");
    });

    it("WordBookModal keşfedilen kelimeleri ve arama çubuğunu render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(WordBookModal, {
          visible: true,
          onDismiss: vi.fn(),
          progress: {
            ...DEFAULT_PROGRESS,
            discoveredWords: ["ELMA", "ARMUT", "BİLGİSAYAR"],
          },
          setProgress: vi.fn(),
        })
      );
      expect(html).toContain("LÜGAT MÜZESİ");
      expect(html).toContain("KEŞFEDİLEN KELİME");
      expect(html).toContain("ELMA");
      expect(html).toContain("ARMUT");
      expect(html).toContain("BİLGİSAYAR");
    });
  });

  describe("UserProfileModal & MatchHistoryModal & BotPracticeModal", () => {
    it("UserProfileModal kullanıcı profil kartını ve istatistiklerini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(UserProfileModal, {
          visible: true,
          user: {
            id: "u123",
            name: "Ahmet",
            level: 5,
            tier: "ALTIN",
            lp: 320,
            wins: 15,
            matches: 20,
            streak: 3,
            bestScore: 450,
          },
          isFriend: false,
          isSelf: false,
          onClose: vi.fn(),
          onAddFriend: vi.fn(),
          onChallenge: vi.fn(),
        })
      );
      expect(html).toContain("Ahmet");
      expect(html).toContain("ALTIN");
      expect(html).toContain("320 LP");
      expect(html).toContain("15");
      expect(html).toContain("MEYDAN OKU");
    });

    it("MatchHistoryModal maç geçmişi filtrelerini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(MatchHistoryModal, {
          visible: true,
          progress: {
            ...DEFAULT_PROGRESS,
            matchHistory: [
              {
                id: "m1",
                mode: "duel",
                result: "win",
                myScore: 200,
                opponentScore: 150,
                opponentName: "Can",
                date: new Date().toISOString(),
              } as any,
            ],
          },
          onClose: vi.fn(),
        })
      );
      expect(html).toContain("Maç Geçmişi");
      expect(html).toContain("Tümü");
      expect(html).toContain("Can");
      expect(html).toContain("200");
    });

    it("BotPracticeModal yapay zeka zorluk ve boyut seçeneklerini sunmalıdır", () => {
      const html = renderToStaticMarkup(
        React.createElement(BotPracticeModal, {
          visible: true,
          onClose: vi.fn(),
          onPlayBot: vi.fn(),
          onNavigateOnline: vi.fn(),
        })
      );
      expect(html).toContain("BOT İLE PRATİK YAP");
      expect(html).toContain("4×4 Nabız");
      expect(html).toContain("6×6 Akış");
      expect(html).toContain("8×8 Derinlik");
      expect(html).toContain("10×10 Zirve");
    });
  });
});
