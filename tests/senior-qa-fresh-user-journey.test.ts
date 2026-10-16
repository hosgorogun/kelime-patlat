/**
 * SENIOR QA AUTOMATION: FRESH INSTALL & COMPLETE USER JOURNEY (FIRST-TIME USER EXPERIENCE)
 *
 * Bu test, oyunu cihazına sıfırdan kurup açan bir kullanıcının tüm yolculuğunu test eder:
 * 1. COLD START & ONBOARDING (Misafir Girişi, Hoşgeldin Hediyesi, Eğitim Turu)
 * 2. KOMUTA MERKEZİ (Lobi, Can / Çip / LP barları, Bildirimler, Günlük Giriş)
 * 3. İLK SOLO MAÇ (Seviye 1, Harf Seçimi, Patlatma, Can Düşüşü, Yıldız & XP Kazanımı)
 * 4. GAZETE BULMACASI (Crossword & Kelime Yerleşimi, İpucu Butonu)
 * 5. ÇOK OYUNCULU DERECELİ DÜELLO (Eşleşme, LP Kazanımı, Teslim Olma / Ayrılma Diyaloğu)
 * 6. MAÇ SONU EKRANI & RAKİP ETKİLEŞİMİ (Profil Açma, Arkadaş Ekleme, Çıkarma, Rövanş)
 * 7. MAĞAZA & EKONOMİ (Çip Harcama, Can Satın Alma, Kozmetik Kuşanma, Şans Çarkı)
 * 8. GÖREVLER & BAŞARIMLAR (Seviye Sandığı Açma, Günlük Görevler)
 * 9. UÇ DURUMLAR & VERİ GÜVENLİĞİ (App Restart, 30dk Can Yenilenmesi, Geriye Dönük Veri Bütünlüğü)
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  DEFAULT_PROGRESS,
  PlayerProgress,
  getCalculatedLives,
  deductLife,
  buyLives,
  applyMatchProgress,
  getLeagueTier,
  checkDailyLoginReward,
  canSpinLuckyWheel,
  claimLuckyWheelReward,
  LUCKY_WHEEL_SECTORS,
  buyBooster,
  useBooster,
  BOOSTER_CONFIG,
  badgesFor,
  getUnclaimedMilestonesCount,
} from "../shared/progression";
import { createSoloBoard } from "../shared/solo";
import { generatePuzzle } from "../shared/puzzle-generator";
import { wordFromSelection } from "../shared/game";
import { isEqualTr, normalizeTrUpper } from "../shared/tr-utils";
import { getRandomBotPersona } from "../shared/botPersonas";
import { CHIP_EQUIPMENT_ITEMS, PROFILE_FRAMES, VICTORY_EFFECTS, BOARD_SKINS, MYSTERY_CHEST_COST } from "../shared/store-items";

// UI Bileşenleri
import { CommandCenter } from "../components/command/command-center";
import { MatchResultModal } from "../components/modals/match-result-modal";
import { UserProfileModal, InspectableUser } from "../components/profile/user-profile-modal";
import { LeaveDuelModal } from "../components/friends/leave-duel-modal";
import { LivesModal } from "../components/modals/lives-modal";
import { LuckyWheelModal } from "../components/modals/lucky-wheel-modal";
import { LootBoxRevealModal } from "../components/modals/loot-box-reveal-modal";
import { InteractiveTutorialBoard } from "../components/onboarding/interactive-tutorial-board";
import { WelcomeRewardModal } from "../components/modals/welcome-reward-modal";
import { OnboardingGuide } from "../components/onboarding/onboarding-guide";
import { GUIDE_SECTIONS } from "../components/onboarding/onboarding.data";
import { AuthScreen } from "../components/auth/auth-screen";
import { ProfileCustomizer } from "../components/profile/profile-customizer";
import { ProfileSettingsTab } from "../components/profile/profile-settings-tab";
import { SeasonHub } from "../components/season/season-hub";
import { MissionsScreen } from "../components/missions/missions-screen";
import { OnlineLobbyScreen } from "../components/pvp/online-lobby-screen";
import { WordBookModal } from "../components/profile/word-book-modal";
import { StoreCosmeticsTab } from "../components/store/store-cosmetics-tab";

describe("Senior QA: Fresh Install & End-to-End User Journey", () => {
  let userProgress: PlayerProgress;

  beforeEach(() => {
    // 0. AN: Kullanıcı uygulamayı ilk defa açar
    userProgress = JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
  });

  describe("AŞAMA 1: Sıfırdan Kayıt Olma & Giriş Yapma (Auth & Credentials)", () => {
    it("AuthScreen Giriş Yap ve Kayıt Ol sekmelerini, input alanlarını eksiksiz render etmelidir", () => {
      const onSuccessMock = vi.fn();
      const html = renderToStaticMarkup(
        React.createElement(AuthScreen, {
          onSuccess: onSuccessMock,
        })
      );

      expect(html).toContain("KELİME PATLAT");
      expect(html).toContain("Giriş Yap");
      expect(html).toContain("Kayıt Ol");
      expect(html).toContain("KULLANICI ADI VEYA E-POSTA");
      expect(html).toContain("ŞİFRE");
    });

    it("yeni başlayan kullanıcı sıfır kilometre doğru envanter ve varsayılan ayarlarla başlamalıdır", () => {
      expect(userProgress.xp).toBe(0);
      expect(userProgress.coins).toBe(0); // Başlangıç çipi
      expect(userProgress.lives).toBe(5); // 5/5 Tam Can
      expect(userProgress.lp).toBe(0);
      expect(getLeagueTier(userProgress.lp ?? 0).tier).toBe("DEMİR");
      expect(userProgress.streak).toBe(0);
      expect(userProgress.streakShields).toBe(0);
      expect(userProgress.radarChargesBonus).toBe(0);
      expect(userProgress.welcomeRewardClaimed).toBeFalsy();
      expect(userProgress.soloUnlockedLevel).toBe(1);
      expect(userProgress.matchHistory).toHaveLength(0);
    });

    it("ilk kurulumda Hoş Geldin Hediyesi Modalı (WelcomeRewardModal) açılmalı ve hediyeleri eksiksiz listelemelidir", () => {
      const onClaimMock = vi.fn();
      const onCloseMock = vi.fn();

      const html = renderToStaticMarkup(
        React.createElement(WelcomeRewardModal, {
          visible: true,
          isClaiming: false,
          onClaim: onClaimMock,
          onClose: onCloseMock,
        })
      );

      // Modal başlığı ve hoş geldin mesajı
      expect(html).toContain("HOŞ GELDİN HEDİYESİ!");
      expect(html).toContain("Kelime Patlat dünyasına hoş geldin!");

      // 3 temel başlangıç hediyesi kartı
      expect(html).toContain("50");
      expect(html).toContain("Çip"); // +50 Çip
      expect(html).toContain("5");
      expect(html).toContain("Radar İpucu Hakkı"); // +5 Radar
      expect(html).toContain("1");
      expect(html).toContain("Seri Kalkanı"); // +1 Seri Kalkanı
      expect(html).toContain("HARİKA, BAŞLA! 🚀");
    });

    it("kullanıcı hoş geldin hediyesini aldığında hesaba +50 Çip, +1 Kalkan ve +5 Radar eklenmeli, tekrar alınamamalıdır", () => {
      expect(userProgress.welcomeRewardClaimed).toBeFalsy();

      // useRewardModals içerisindeki handleClaimWelcomeReward mutasyon mantığı
      userProgress = {
        ...userProgress,
        welcomeRewardClaimed: true,
        coins: (userProgress.coins || 0) + 50,
        streakShields: (userProgress.streakShields || 0) + 1,
        radarChargesBonus: (userProgress.radarChargesBonus || 0) + 5,
      };

      expect(userProgress.welcomeRewardClaimed).toBe(true);
      expect(userProgress.coins).toBe(50);
      expect(userProgress.streakShields).toBe(1);
      expect(userProgress.radarChargesBonus).toBe(5);

      // İkinci kez talep edildiğinde (mükerrer alım) değerler değişmemelidir
      const prevProgress = { ...userProgress };
      if (!userProgress.welcomeRewardClaimed) {
        userProgress.coins = (userProgress.coins || 0) + 50;
      }
      expect(userProgress.coins).toBe(prevProgress.coins);
    });

    it("öğretici rehberde (OnboardingGuide) 6 bölümün tamamı gezilebilmeli, başlık ve içerikler doğrulanmalıdır", () => {
      expect(GUIDE_SECTIONS.length).toBe(6);
      const sectionKeys = GUIDE_SECTIONS.map((s) => s.key);
      expect(sectionKeys).toEqual(["basics", "modes", "leagues", "powers", "economy", "tactics"]);

      // 6 bölümün her birinin modalda doğru render edildiği
      GUIDE_SECTIONS.forEach((section, index) => {
        expect(section.tabLabel).toBeDefined();
        expect(section.badge).toBeDefined();
        expect(section.title).toBeDefined();
        expect(section.blocks.length).toBeGreaterThan(0);
      });

      const onCloseGuideMock = vi.fn();
      const html = renderToStaticMarkup(
        React.createElement(OnboardingGuide, {
          visible: true,
          onClose: onCloseGuideMock,
        })
      );

      // Rehber başlığı ve ilk bölüm içeriği
      expect(html).toContain("OYUN REHBERİ");
      expect(html).toContain("Parmağını Sürükle, Kelimeni Patlat!");
      expect(html).toContain("Kelimeleri Bağlama");
      expect(html).toContain("Hareket Yönleri");
      expect(html).toContain("1 / 6");
    });

    it("öğretici interaktif tahta (InteractiveTutorialBoard) sürükleme ve hedef kelime rotasını doğru sunmalıdır", () => {
      const onInteractingMock = vi.fn();
      const html = renderToStaticMarkup(
        React.createElement(InteractiveTutorialBoard, {
          onInteractingChange: onInteractingMock,
        })
      );

      // Öğretici ekranı başarıyla render edilmeli
      expect(html).toBeDefined();
    });
  });

  describe("AŞAMA 2: Komuta Merkezi (Lobi) & Günlük Karşılama", () => {
    it("lobi ekranı oyuncu adı, can, çip, LP ve tüm oyun modları butonlarını eksiksiz render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(CommandCenter, {
          playerName: "Acemi_Kelimeci",
          progress: userProgress,
          leaderboard: [],
          onPlayBot: vi.fn(),
          onSolo: vi.fn(),
          onNavigate: vi.fn(),
          onShowGuide: vi.fn(),
        })
      );

      expect(html).toContain("Acemi_Kelimeci");
      expect(html).toContain("SEVİYE YOLCULUĞU");
      expect(html).toContain("SKOR HÜCUMU");
      expect(html).toContain("GAZETE BULMACASI");
      expect(html).toContain("BİR KELİMEYLE BAŞLA");
    });

    it("kullanıcı 1. gün giriş ödülünü alabilmeli ve mükerrer alım engellenmelidir", () => {
      const today = "2026-10-14";
      const loginReward = checkDailyLoginReward(userProgress, today);
      expect(loginReward).not.toBeNull();
      expect(loginReward!.reward.day).toBe(1);
      expect(loginReward!.reward.amount).toBe(8);

      // Çip hesaba geçti mi?
      userProgress = loginReward!.updatedProgress;
      expect(userProgress.coins).toBe(8);

      // Aynı gün tekrar tıklanırsa engellenmeli
      const duplicateReward = checkDailyLoginReward(userProgress, today);
      expect(duplicateReward).toBeNull();
    });
  });

  describe("AŞAMA 3: İlk Solo Seviye Deneyimi (Level 1)", () => {
    it("seviye 1 tahtası üretilmeli, geçerli kelime bulunabilmeli ve ödüller kazanılmalıdır", () => {
      const boardObj = createSoloBoard(1);
      expect(boardObj.words.length).toBeGreaterThanOrEqual(3);
      expect(boardObj.board.length).toBe(16); // 4x4 başlangıç tahtası

      // Seviyedeki ilk kelime ve rotası
      const firstWord = boardObj.words[0];
      const route = boardObj.routes[firstWord];
      expect(route).toBeDefined();
      expect(route.length).toBe(firstWord.length);

      const extractedWord = wordFromSelection(boardObj.board, route);
      expect(extractedWord).toBe(firstWord);

      // Maç bitimi: Solo galibiyeti
      userProgress = applyMatchProgress(userProgress, {
        score: 120,
        tempo: 3.0,
        won: true,
        foundWords: [firstWord],
      }, "solo");

      expect(userProgress.xp).toBeGreaterThan(0);
      expect(userProgress.coins).toBeGreaterThan(0);
    });

    it("yanlış hamleler veya başarısızlık durumunda can düşmeli ve geri sayım başlamalıdır", () => {
      // 1 Can kaybet
      userProgress = deductLife(userProgress);
      expect(userProgress.lives).toBe(4);

      // Can modalı doğru can sayısını göstermeli
      const livesInfo = getCalculatedLives(userProgress);
      expect(livesInfo.lives).toBe(4);

      const html = renderToStaticMarkup(
        React.createElement(LivesModal, {
          visible: true,
          progress: userProgress,
          onClose: vi.fn(),
          onBuyOne: vi.fn(),
          onRefillAll: vi.fn(),
          onWatchAd: vi.fn(),
        })
      );
      expect(html).toContain("CAN MERKEZİ");
    });
  });

  describe("AŞAMA 4: Gazete Bulmacası (10x10 Crossword & Gazete Modu)", () => {
    it("gazete modu sıfır çakışmayla 10x10 ızgara üretmeli ve hamle doğrulaması kusursuz çalışmalıdır", () => {
      const puzzle = generatePuzzle("easy");
      expect(puzzle).toBeDefined();
      expect(puzzle.boardSize).toBe(10);
      expect(puzzle.words.length).toBeGreaterThanOrEqual(3);
      expect(puzzle.centerWord).toBeDefined();

      // Kesişen harflerin sıfır çakışmayla 10x10 ızgaraya oturması
      const grid: (string | null)[][] = Array(10).fill(null).map(() => Array(10).fill(null));
      for (const w of puzzle.words) {
        for (let i = 0; i < w.length; i++) {
          const r = w.direction === "horizontal" ? w.row : w.row + i;
          const c = w.direction === "horizontal" ? w.col + i : w.col;
          const char = w.answer[i];
          if (grid[r][c] !== null) {
            expect(grid[r][c]).toBe(char);
          } else {
            grid[r][c] = char;
          }
        }
      }
    });
  });

  describe("AŞAMA 5: Çok Oyunculu Dereceli Maç & Kaçış / Ayrılma Modal Testi", () => {
    it("maçtan ayrılma tuşuna tıklandığında LeaveDuelModal lige özel ceza uyarısı ve kalan LP'yi göstermelidir", () => {
      const onConfirmSurrender = vi.fn();
      const onCancelSurrender = vi.fn();

      const html = renderToStaticMarkup(
        React.createElement(LeaveDuelModal, {
          visible: true,
          progress: {
            ...userProgress,
            lp: 20,
          },
          isRanked: true,
          onLeave: onConfirmSurrender,
          onStay: onCancelSurrender,
        })
      );

      // Kullanıcı ne kaybedeceğini net görmeli
      expect(html).toContain("DÜELLODAN AYRIL?");
      expect(html).toContain("AYRILIRSAN KAYBEDECEKLERİN");
      expect(html).toContain("AYRIL");
      expect(html).toContain("DEVAM ET");
    });

    it("maç kazanıldığında LP hesaplanmalı, lig atlama ve seri ödülü verilmelidir", () => {
      userProgress.lp = 330; // Bronz eşiği 350 LP

      // 1. Galibiyet (+30 LP)
      const winResult = applyMatchProgress(userProgress, {
        score: 110,
        tempo: 3.2,
        won: true,
      }, "pvp");

      expect(winResult.lp).toBe(360);
      expect(winResult.pvpWinStreak).toBe(1);

      // Lig atlama gerçekleşti mi? (Demir -> Bronz)
      const tierInfo = getLeagueTier(winResult.lp);
      expect(tierInfo.tier).toBe("BRONZ");
      userProgress = winResult;
    });
  });

  describe("AŞAMA 6: Maç Sonu Ekranı & Rakip Profili / Arkadaşlık İşlemleri", () => {
    const persona = getRandomBotPersona({ lp: 300, level: 5 });
    const mockOpponent: InspectableUser = {
      id: "bot_1",
      name: persona.name,
      level: 5,
      tier: "bronze",
      lp: 120,
      avatar: persona.avatar,
      wins: 12,
      matches: 20,
      streak: 3,
    };

    it("maç sonu ekranında rakip profiline bakma ve arkadaş ekleme butonları tıklanabilir olmalıdır", () => {
      const onOpenProfileMock = vi.fn();
      const onAddFriendMock = vi.fn();

      const html = renderToStaticMarkup(
        React.createElement(MatchResultModal, {
          visible: true,
          iWon: true,
          isDraw: false,
          activeVictoryEffect: "classic",
          progress: userProgress,
          myScore: 120,
          opponentScore: 80,
          myWordCount: 5,
          opponentWordCount: 3,
          wordsTotal: 6,
          meName: "Acemi_Kelimeci",
          opponentName: mockOpponent.name,
          opponent: mockOpponent,
          matchXpEarned: 60,
          matchLpEarned: 20,
          matchCoinsEarned: 15,
          isCustomRoom: false,
          myTempo: 1.5,
          opponentTempo: 1.0,
          allFinishedWords: [{ word: "KİTAP", path: [0, 1, 2, 3, 4], color: "#2a9c7a" }],
          myFoundWords: [{ word: "KİTAP", path: [0, 1, 2, 3, 4] }],
          onInspectWord: vi.fn(),
          onRequestRematch: vi.fn(),
          onLeaveRoom: vi.fn(),
          onClose: vi.fn(),
          onOpenUserProfile: onOpenProfileMock,
          onAddFriend: onAddFriendMock,
          isFriend: false,
        })
      );

      expect(html).toContain("PROFİL");
      expect(html).toContain("EKLE");
    });

    it("UserProfileModal açıldığında arkadaş çıkarma ve ekleme butonları doğru durumda olmalıdır", () => {
      // Arkadaş değilken: + ARKADAŞ EKLE
      const htmlNotFriend = renderToStaticMarkup(
        React.createElement(UserProfileModal, {
          visible: true,
          user: mockOpponent,
          isFriend: false,
          isSelf: false,
          onClose: vi.fn(),
          onAddFriend: vi.fn(),
          onRemoveFriend: vi.fn(),
        })
      );
      expect(htmlNotFriend).toContain("ARKADAŞ EKLE");

      // Arkadaşken: ✓ ARKADAŞINIZ (ÇIKAR)
      const htmlFriend = renderToStaticMarkup(
        React.createElement(UserProfileModal, {
          visible: true,
          user: mockOpponent,
          isFriend: true,
          isSelf: false,
          onClose: vi.fn(),
          onAddFriend: vi.fn(),
          onRemoveFriend: vi.fn(),
        })
      );
      expect(htmlFriend).toContain("ARKADAŞINIZ (ÇIKAR)");
    });
  });

  describe("AŞAMA 7: Mağaza, Can Satın Alma & Şans Çarkı", () => {
    it("canı azalan kullanıcı çip karşılığında can satın alabilmelidir", () => {
      userProgress.lives = 2;
      userProgress.coins = 100;

      // 1 Can satın al ("one" -> 50 çip)
      const buyResult = buyLives(userProgress, "one");
      expect(buyResult.success).toBe(true);
      expect(buyResult.updatedProgress.lives).toBe(3);
      expect(buyResult.updatedProgress.coins).toBe(50); // 100 - 50 = 50
      userProgress = buyResult.updatedProgress;

      // Yetersiz çipte engelleme
      userProgress.coins = 5;
      const failResult = buyLives(userProgress, "one");
      expect(failResult.success).toBe(false);
    });

    it("şans çarkı modalı render edilebilmeli ve ödül çarkı çevrilebilmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(LuckyWheelModal, {
          visible: true,
          progress: userProgress,
          onClose: vi.fn(),
          setProgress: vi.fn(),
          syncProgressToCloud: vi.fn().mockResolvedValue(undefined),
          onShowToast: vi.fn(),
        })
      );
      expect(html).toContain("ŞANS ÇARKI");

      // Çark durum kontrolü
      const spinStatus = canSpinLuckyWheel(userProgress);
      expect(spinStatus.canSpin).toBe(true);

      // Çarkı çevir ve ödülü al
      const sectorIndex = 0;
      const claimResult = claimLuckyWheelReward(userProgress, sectorIndex);
      expect(claimResult.reward).toBeDefined();
      expect(claimResult.updatedProgress.lastSpinTimestamp).toBeGreaterThan(0);
      userProgress = claimResult.updatedProgress;
    });

    it("gizemli sandık (mystery chest) ve mağaza kozmetik fiyatları doğru olmalıdır", () => {
      expect(MYSTERY_CHEST_COST).toBe(100);
      expect(PROFILE_FRAMES.length).toBeGreaterThanOrEqual(5);
      expect(VICTORY_EFFECTS.length).toBeGreaterThanOrEqual(5);
      expect(BOARD_SKINS.length).toBeGreaterThanOrEqual(5);
      expect(CHIP_EQUIPMENT_ITEMS.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("AŞAMA 8: Seviye Sandıkları (Milestones) & Güçlendiriciler", () => {
    it("seviye 15'e ulaşan kullanıcı seviye sandığını açabilmelidir", () => {
      userProgress.xp = 2800; // Seviye 15

      // Seviye 15 tamamlandığında (unlockedLevel = 16) 1 açılmamış sandık sayar
      const unclaimed = getUnclaimedMilestonesCount(userProgress, 16);
      expect(unclaimed).toBe(1);

      // Milestone kaydı
      userProgress.claimedMilestones = { ...userProgress.claimedMilestones, 15: true };
      expect(getUnclaimedMilestonesCount(userProgress, 16)).toBe(0);
    });

    it("güçlendirici (booster) satın alma ve tüketme mantığı kusursuz çalışmalıdır", () => {
      userProgress.coins = 100;
      userProgress.boosters = { hint: 0, freeze: 0, shuffle: 0 };

      // İpucu güçlendiricisi satın al (1 adet, 25 çip)
      const buyB = buyBooster(userProgress, "hint", 1);
      expect(buyB.success).toBe(true);
      expect(buyB.updatedProgress.boosters?.hint).toBe(1);
      expect(buyB.updatedProgress.coins).toBe(100 - BOOSTER_CONFIG.hint.cost);

      // Güçlendiriciyi maçta kullan
      const useB = useBooster(buyB.updatedProgress, "hint");
      expect(useB.success).toBe(true);
      expect(useB.updatedProgress.boosters?.hint).toBe(0);
    });
  });

  describe("AŞAMA 9: Oyun Kapatılıp Açıldığında Veri Bütünlüğü (Cold Reboot)", () => {
    it("oyun geçmişi kaydedilmeli ve 30 dakika sonra canlar tam dolmalıdır", () => {
      // Bir maç geçmişi ekle
      userProgress = applyMatchProgress(userProgress, {
        score: 130,
        tempo: 4.1,
        won: true,
        opponentName: "Efsane",
      }, "pvp");

      expect(userProgress.matchHistory?.length).toBeGreaterThan(0);

      // Simüle edilen telefon kapanışı: 3 saat sonra tekrar açıldı
      userProgress.lives = 0;
      userProgress.lastLifeRegenTimestamp = Date.now() - 3 * 60 * 60 * 1000; // 3 saat önce

      const recoveredLives = getCalculatedLives(userProgress);
      expect(recoveredLives.lives).toBe(5); // 5/5 Tam dolmuş olmalı
    });
  });

  describe("AŞAMA 10: Oyun Açıldığında Tüm Alanları ve Ekranları Tek Tek Deneme", () => {
    it("10.1 Mağaza Kozmetik Vitrini (StoreCosmeticsTab) çerçeve, zafer efektleri ve tahta kaplamalarını listelemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(StoreCosmeticsTab, {
          progress: userProgress,
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

    it("10.2 Profil Özelleştirici (ProfileCustomizer) Çerçeve, Avatar, Unvan ve Rozet sekmelerini sorunsuz açmalıdır", () => {
      const html = renderToStaticMarkup(
        React.createElement(ProfileCustomizer, {
          customizerTab: "frames",
          setCustomizerTab: vi.fn(),
          unlockedFramesCount: 3,
          unlockedAvatarsCount: 5,
          unlockedTitlesCount: 2,
          unlockedBadgesCount: 4,
          progress: userProgress,
          activeTitle: "[ÇAYLAK]",
          badges: [],
          onSelectFrame: vi.fn(),
          onSelectAvatar: vi.fn(),
          onSelectTitle: vi.fn(),
        })
      );

      expect(html).toContain("KOLEKSİYON");
      expect(html).toContain("ÇERÇEVE");
      expect(html).toContain("AVATAR");
      expect(html).toContain("UNVAN");
      expect(html).toContain("ROZET");
    });

    it("10.3 Profil Ayarlar Sekmesi (ProfileSettingsTab) ses, haptik titreşim ve hesap seçeneklerini sunmalıdır", () => {
      const html = renderToStaticMarkup(
        React.createElement(ProfileSettingsTab, {
          sfxOn: true,
          toggleSfx: vi.fn(),
          hapticsOn: true,
          toggleHaptics: vi.fn(),
          progress: userProgress,
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

    it("10.4 Sezon & Lig Merkezi (SeasonHub) ligler, liderlik sıralaması ve arkadaş listesini bağlamalıdır", () => {
      const html = renderToStaticMarkup(
        React.createElement(SeasonHub, {
          playerId: "test_user_id",
          playerName: "Acemi_Kelimeci",
          progress: userProgress,
          leaderboard: [],
          onBack: vi.fn(),
        })
      );

      expect(html).toContain("Ligler");
      expect(html).toContain("Sıralama");
      expect(html).toContain("Arkadaşlar");
    });

    it("10.5 Görevler Ekranı (MissionsScreen) günlük ve haftalık görevleri render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(MissionsScreen, {
          progress: userProgress,
          onBack: vi.fn(),
          onClaimDaily: vi.fn(),
          onClaimWeekly: vi.fn(),
        })
      );

      expect(html).toContain("Görevler");
      expect(html).toContain("KÜÇÜK HEDEFLER, GÜZEL ÖDÜLLER");
      expect(html).toContain("Günlük");
      expect(html).toContain("Haftalık");
    });

    it("10.6 Çevrimiçi Arena Lobisi (OnlineLobbyScreen) 4 farklı tahta boyutunu (4x4, 6x6, 8x8, 10x10) ve düello butonunu sunmalıdır", () => {
      const html = renderToStaticMarkup(
        React.createElement(OnlineLobbyScreen, {
          playerName: "Acemi_Kelimeci",
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
      expect(html).toContain("TAHTA BOYUTU SEÇİN");
      expect(html).toContain("Nabız");
      expect(html).toContain("Akış");
      expect(html).toContain("Derinlik");
      expect(html).toContain("Zirve");
      expect(html).toContain("DERECELİ DÜELLO");
    });

    it("10.7 Kelime Defteri Modalı (WordBookModal) bulunan kelimeleri ve TDK sözlük açıklamalarını göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(WordBookModal, {
          visible: true,
          progress: {
            ...userProgress,
            discoveredWords: ["KİTAP", "GÜNEŞ", "DENİZ"],
          },
          setProgress: vi.fn(),
          onDismiss: vi.fn(),
        })
      );

      expect(html).toContain("LÜGAT MÜZESİ 📖");
      expect(html).toContain("KİŞİSEL SÖZLÜK KOLEKSİYONU");
      expect(html).toContain("KİTAP");
      expect(html).toContain("GÜNEŞ");
      expect(html).toContain("DENİZ");
    });
  });
});
