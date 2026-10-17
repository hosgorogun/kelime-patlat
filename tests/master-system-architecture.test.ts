import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword, verifyPassword } from "../server/db";
import {
  isAdjacent,
  advanceSelection,
  wordFromSelection,
  maskOpponentFoundWords,
  getRoundDurationMs,
  wordScoreMultiplier,
  botThinkDelayMs,
  type BoardSize,
} from "../shared/game";
import {
  getXpForLevel,
  getPlayerLevel,
  getXpRequiredForNextLevel,
  getLevelProgress,
} from "../shared/level-curves";
import {
  getLeagueTier,
  LEAGUE_TIERS,
  LEAGUE_REWARDS,
} from "../shared/leagues";
import {
  applyMatchProgress,
  applyArcadeProgress,
  applyVintageProgress,
  completeDailyProgress,
} from "../shared/progression/match-progress";
import {
  reconcileSeasonReset,
  getDailyMysteryWord,
  getDailyChallenge,
} from "../shared/progression/season-streak";
import {
  mergePlayerProgress,
  backfillMatchHistoryIfEmpty,
} from "../shared/progression/merge-progress";
import {
  isEqualTr,
  normalizeTr,
  normalizeTrUpper,
} from "../shared/tr-utils";
import { isValidTurkishWord } from "../shared/dictionary";
import React from "react";
import { DEFAULT_PROGRESS, type PlayerProgress } from "../shared/progression";
import { useAndroidBackHandler, resolveBackPressAction } from "../hooks/use-android-back-handler";
import { BackHandler } from "react-native";

describe("MASTER SYSTEM ARCHITECTURE & EXHAUSTIVE QA REGRESSION SUITE", () => {
  describe("1. Kriptografi ve Güvenlik Doğrulaması (Security & Cryptography)", () => {
    it("PBKDF2 100,000 iterasyonlu parola hash'leme ve doğrulama hatasız çalışmalıdır", () => {
      const rawPassword = "Güvenli123_Şifre!*";
      const hashed = hashPassword(rawPassword);

      // Format: "100000:salt:hash"
      const parts = hashed.split(":");
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe("100000");
      expect(parts[1]?.length).toBe(32); // 16 bytes hex
      expect(parts[2]?.length).toBe(128); // 64 bytes sha512 hex

      // Doğru parola doğrulanmalıdır
      expect(verifyPassword(rawPassword, hashed)).toBe(true);
      // Yanlış parola kesinlikle reddedilmelidir
      expect(verifyPassword("YanlisSifre", hashed)).toBe(false);
      expect(verifyPassword("Güvenli123_Şifre", hashed)).toBe(false);
    });

    it("Eski 1,000 iterasyonlu format (legacy backward compatibility) ile uyumlu olmalıdır", () => {
      // Legacy format: "salt:hash"
      const fakeSalt = "abcdef0123456789abcdef0123456789";
      const crypto = require("crypto");
      const legacyHash = crypto.pbkdf2Sync("EskiParola", fakeSalt, 1000, 64, "sha512").toString("hex");
      const legacyStored = `${fakeSalt}:${legacyHash}`;

      expect(verifyPassword("EskiParola", legacyStored)).toBe(true);
      expect(verifyPassword("YanlisParola", legacyStored)).toBe(false);
    });

    it("Bozuk veya eksik hash formatlarında verifyPassword hata fırlatmadan false dönmelidir", () => {
      expect(verifyPassword("test", "")).toBe(false);
      expect(verifyPassword("test", "tekparca")).toBe(false);
      expect(verifyPassword("test", "gecersiz:salt:hash:fazla")).toBe(false);
      expect(verifyPassword("test", "notanumber:salt:hash")).toBe(false);
    });
  });

  describe("2. Soket Tahtası ve Anti-Cheat Mekanizması (Authoritative Server & Anti-Cheat)", () => {
    it("Komşuluk kuralı (isAdjacent) yalnızca yatay ve dikey adımlara izin vermelidir (Çapraz yasak)", () => {
      const size: BoardSize = 4;
      // 0  1  2  3
      // 4  5  6  7
      // 8  9 10 11
      // 12 13 14 15

      // Yatay adımlar geçerli
      expect(isAdjacent(0, 1, size)).toBe(true);
      expect(isAdjacent(1, 0, size)).toBe(true);
      expect(isAdjacent(5, 6, size)).toBe(true);

      // Dikey adımlar geçerli
      expect(isAdjacent(0, 4, size)).toBe(true);
      expect(isAdjacent(5, 9, size)).toBe(true);

      // Çapraz adımlar KESİNLİKLE GEÇERSİZ olmalı
      expect(isAdjacent(0, 5, size)).toBe(false); // Çapraz sağ-alt
      expect(isAdjacent(5, 0, size)).toBe(false);
      expect(isAdjacent(6, 9, size)).toBe(false); // Çapraz sol-alt
      expect(isAdjacent(10, 5, size)).toBe(false);

      // Satır taşmaları geçersiz
      expect(isAdjacent(3, 4, size)).toBe(false); // 3 (1. satır sonu) ile 4 (2. satır başı) yan yana değildir
    });

    it("advanceSelection: Geriye sürüklemede son harfi iptal etmeli, hızlı kaydırmada 1 kutuluk boşluğu bağlamalıdır", () => {
      const size: BoardSize = 4;
      // Seçim: [0, 1, 2]
      let sel = [0, 1, 2];
      // Oyuncu 1'e geri gelirse 2 iptal edilmeli -> [0, 1]
      let updated = advanceSelection(sel, 1, size);
      expect(updated).toEqual([0, 1]);

      // Hızlı kaydırma köprüsü: Oyuncu 0'dan aniden 2'ye geçerse aradaki 1'i köprülemeli
      sel = [0];
      updated = advanceSelection(sel, 2, size);
      expect(updated).toEqual([0, 1, 2]);

      // Dikey hızlı kaydırma köprüsü: 0'dan 8'e atlarsa aradaki 4'ü bağlamalı
      sel = [0];
      updated = advanceSelection(sel, 8, size);
      expect(updated).toEqual([0, 4, 8]);
    });

    it("Anti-cheat maskelemesi: Maç devam ederken rakip kelimeleri gizlenmeli, bitince açılmalıdır", () => {
      const rawWords = [
        { word: "ELMA", playerId: "me", path: [0, 1, 2, 3] },
        { word: "ARMUT", playerId: "opponent", path: [4, 5, 6, 7, 8] },
      ];

      // Maç devam ederken (revealAll = false)
      const masked = maskOpponentFoundWords(rawWords, "me", false);
      expect(masked[0]?.word).toBe("ELMA");
      expect(masked[0]?.hidden).toBeFalsy();

      // Rakip kelimesi boşaltılmalı ve hidden=true olmalı
      expect(masked[1]?.word).toBe("");
      expect(masked[1]?.path).toEqual([]);
      expect(masked[1]?.hidden).toBe(true);

      // Maç bitince (revealAll = true)
      const revealed = maskOpponentFoundWords(rawWords, "me", true);
      expect(revealed[1]?.word).toBe("ARMUT");
      expect(revealed[1]?.hidden).toBe(false);
    });

    it("Tahta süreleri ve bot gecikmeleri makul insan sınırları içinde olmalıdır", () => {
      expect(getRoundDurationMs(4)).toBe(55_000);
      expect(getRoundDurationMs(6)).toBe(75_000);
      expect(getRoundDurationMs(8)).toBe(95_000);
      expect(getRoundDurationMs(10)).toBe(125_000);

      // Bot düşünme süresi 2.5s ile 16s arasında sınırlı olmalı
      for (let i = 0; i < 50; i++) {
        const delay = botThinkDelayMs(4, 4);
        expect(delay).toBeGreaterThanOrEqual(2500);
        expect(delay).toBeLessThanOrEqual(16000);
      }
    });
  });

  describe("3. Türkçe Unicode ve Harf Normalizasyonu (Unicode Invariance)", () => {
    it("I/ı/İ/i Türkçe büyük-küçük harf dönüşümleri tüm kenar durumlarda eşit olmalıdır", () => {
      expect(isEqualTr("ışık", "IŞIK")).toBe(true);
      expect(isEqualTr("iğne", "İĞNE")).toBe(true);
      expect(isEqualTr("İSTANBUL", "istanbul")).toBe(true);
      expect(isEqualTr("KIRŞEHİR", "kırşehir")).toBe(true);

      expect(normalizeTrUpper("ışık")).toBe("IŞIK");
      expect(normalizeTrUpper("iğne")).toBe("İĞNE");
      expect(normalizeTr("IŞIK")).toBe("ışık");
      expect(normalizeTr("İĞNE")).toBe("iğne");
    });
  });

  describe("4. Matematiksel İlerleme ve Seviye Eğrileri (Level Curves & Progression)", () => {
    it("Seviye geçiş noktalarında (15, 30, 50, 75, 100) XP eğrisi tam sürekli ve boşluksuz olmalıdır", () => {
      // 1-15
      expect(getXpRequiredForNextLevel(1)).toBe(200);
      expect(getXpForLevel(15)).toBe(2800);
      expect(getPlayerLevel(2799)).toBe(14);
      expect(getPlayerLevel(2800)).toBe(15);

      // 16-30
      expect(getXpRequiredForNextLevel(15)).toBe(350);
      expect(getXpForLevel(30)).toBe(8050);
      expect(getPlayerLevel(8049)).toBe(29);
      expect(getPlayerLevel(8050)).toBe(30);

      // 31-50
      expect(getXpRequiredForNextLevel(30)).toBe(500);
      expect(getXpForLevel(50)).toBe(18050);
      expect(getPlayerLevel(18049)).toBe(49);
      expect(getPlayerLevel(18050)).toBe(50);

      // 51-75
      expect(getXpRequiredForNextLevel(50)).toBe(750);
      expect(getXpForLevel(75)).toBe(36800);
      expect(getPlayerLevel(36799)).toBe(74);
      expect(getPlayerLevel(36800)).toBe(75);

      // 76-100
      expect(getXpRequiredForNextLevel(75)).toBe(1000);
      expect(getXpForLevel(100)).toBe(61800);
      expect(getPlayerLevel(61799)).toBe(99);
      expect(getPlayerLevel(61800)).toBe(100);

      // 100+
      expect(getXpRequiredForNextLevel(100)).toBe(1200);
      expect(getPlayerLevel(63000)).toBe(101);
    });

    it("getLevelProgress yüzdesi her zaman 0 ile 1 arasında sınırlandırılmalıdır", () => {
      const p1 = getLevelProgress(0);
      expect(p1.level).toBe(1);
      expect(p1.progressRatio).toBeGreaterThanOrEqual(0);
      expect(p1.progressRatio).toBeLessThanOrEqual(1);

      const p2 = getLevelProgress(15000);
      expect(p2.progressRatio).toBeGreaterThanOrEqual(0);
      expect(p2.progressRatio).toBeLessThanOrEqual(1);
    });
  });

  describe("5. Lig Puanı (LP) ve Rekabetçi Ekonomi Dengesi (Competitive LP & Economy)", () => {
    it("Demir ligindeki oyuncu mağlubiyette kesinlikle LP kaybetmemelidir (0 ceza)", () => {
      const ironProg = { ...DEFAULT_PROGRESS, lp: 100 };
      const updated = applyMatchProgress(
        ironProg,
        { score: 50, tempo: 1.5, won: false, foundWords: ["ELMA"] },
        "pvp"
      );
      // Demir ligde LP düşmez (yeni oyuncu koruması)
      expect(updated.lp).toBe(100);
      expect(updated.lastMatchReward?.lp).toBe(0);
    });

    it("Galibiyet serisi (Win Streak) üst üste galibiyetlerde artan bonus LP vermelidir", () => {
      let current = { ...DEFAULT_PROGRESS, lp: 500, pvpWinStreak: 0 };

      // 1. Galibiyet
      current = applyMatchProgress(current, { score: 80, tempo: 2.0, won: true, foundWords: ["ELMA", "ARMUT"] }, "pvp");
      expect(current.pvpWinStreak).toBe(1);
      expect(current.lastMatchReward?.streakBonus).toBe(0);

      // 2. Galibiyet (Streak = 2 -> +3 LP bonus)
      current = applyMatchProgress(current, { score: 80, tempo: 2.0, won: true, foundWords: ["ELMA", "ARMUT"] }, "pvp");
      expect(current.pvpWinStreak).toBe(2);
      expect(current.lastMatchReward?.streakBonus).toBe(3);

      // 3. Galibiyet (Streak = 3 -> +7 LP bonus)
      current = applyMatchProgress(current, { score: 80, tempo: 2.0, won: true, foundWords: ["ELMA", "ARMUT"] }, "pvp");
      expect(current.pvpWinStreak).toBe(3);
      expect(current.lastMatchReward?.streakBonus).toBe(7);
    });

    it("Seri Kalkanı (Streak Shield) normal mağlubiyette seriyi korumalı ve 1 adet harcanmalıdır", () => {
      const withShield = { ...DEFAULT_PROGRESS, lp: 1500, pvpWinStreak: 5, streakShields: 2 };
      const updated = applyMatchProgress(
        withShield,
        { score: 40, tempo: 1.2, won: false, foundWords: ["MASA"] },
        "pvp"
      );
      // Seri sıfırlanmamalı, 5 olarak korunmalı
      expect(updated.pvpWinStreak).toBe(5);
      // 1 kalkan harcanmış olmalı
      expect(updated.streakShields).toBe(1);
      expect(updated.lastMatchReward?.shieldUsed).toBe(true);
    });

    it("Maçı terk eden oyuncunun (Surrender) serisi kalkan olsa bile sönmeli ve kaçış cezası almalıdır", () => {
      const ragequitter = { ...DEFAULT_PROGRESS, lp: 2000, pvpWinStreak: 4, streakShields: 3 };
      const updated = applyMatchProgress(
        ragequitter,
        { score: 20, tempo: 1.0, won: false, isSurrender: true, foundWords: ["KAPI"] },
        "pvp"
      );
      // Seri direkt sıfırlanmalı
      expect(updated.pvpWinStreak).toBe(0);
      // Kalkanı boşa harcanmamalı (kendi terk ettiği için)
      expect(updated.streakShields).toBe(3);
      // Ağır lig cezası almalı (-22 LP)
      expect(updated.lastMatchReward?.lp).toBe(-22);
      expect(updated.lp).toBe(1978);
    });

    it("Dostluk/Arkadaş maçlarında (isFriendGame) LP, XP ve Çip kazancı 0 olmalıdır (Win-trading önleme)", () => {
      const player = { ...DEFAULT_PROGRESS, lp: 1000, xp: 500, coins: 50 };
      const updated = applyMatchProgress(
        player,
        { score: 200, tempo: 4.0, won: true, isFriendGame: true, foundWords: ["KALEM", "DEFTER", "KITAP"] },
        "pvp"
      );
      expect(updated.lp).toBe(1000);
      expect(updated.xp).toBe(500);
      expect(updated.coins).toBe(50);
      expect(updated.lastMatchReward?.lp).toBe(0);
      expect(updated.lastMatchReward?.xp).toBe(0);
      expect(updated.lastMatchReward?.coins).toBe(0);
    });

    it("Bot maçlarında (type: 'bot') lig puanı (LP) kesinlikle değişmemelidir", () => {
      const player = { ...DEFAULT_PROGRESS, lp: 1200 };
      const wonBot = applyMatchProgress(player, { score: 100, tempo: 2.0, won: true, foundWords: ["ELMA"] }, "bot");
      expect(wonBot.lp).toBe(1200);
      expect(wonBot.lastMatchReward?.lp).toBe(0);

      const lostBot = applyMatchProgress(player, { score: 30, tempo: 1.0, won: false, foundWords: ["MASA"] }, "bot");
      expect(lostBot.lp).toBe(1200);
      expect(lostBot.lastMatchReward?.lp).toBe(0);
    });
  });

  describe("6. Sezonluk Yumuşak Sıfırlama (Soft Reset) & Günlük Bilmece Doğrulaması", () => {
    it("Sezon sıfırlaması üst ligleri 2500 LP'ye, orta ligleri %70'e çekmeli, alt ligleri korumalıdır", () => {
      // 1. Elmas Oyuncusu (4000 LP) -> 2500 LP'ye çekilmeli
      const highRank = { ...DEFAULT_PROGRESS, lp: 4000, lastSeasonResetId: "season_old" };
      const resHigh = reconcileSeasonReset(highRank, new Date());
      expect(resHigh.resetResult.seasonResetPerformed).toBe(true);
      expect(resHigh.updatedProgress.lp).toBe(2500);

      // 2. Altın Oyuncusu (2000 LP) -> 1400 LP'ye (%70) çekilmeli
      const midRank = { ...DEFAULT_PROGRESS, lp: 2000, lastSeasonResetId: "season_old" };
      const resMid = reconcileSeasonReset(midRank, new Date());
      expect(resMid.updatedProgress.lp).toBe(1400);

      // 3. Bronz Oyuncusu (500 LP) -> 500 LP aynen kalmalı
      const lowRank = { ...DEFAULT_PROGRESS, lp: 500, lastSeasonResetId: "season_old" };
      const resLow = reconcileSeasonReset(lowRank, new Date());
      expect(resLow.updatedProgress.lp).toBe(500);
    });

    it("30 Günlük Gizemli Kelime havuzundaki tüm kelimeler geçerli Türkçe kelime olmalıdır", () => {
      for (let day = 1; day <= 31; day++) {
        const testDate = new Date(2026, 9, day);
        const mystery = getDailyMysteryWord(testDate);
        expect(mystery.word.length).toBeGreaterThanOrEqual(3);
        expect(mystery.definition.length).toBeGreaterThan(10);
        expect(isValidTurkishWord(mystery.word)).toBe(true);
      }
    });
  });

  describe("7. Çevrimdışı İlerleme ve Veri Birleştirme Güvenliği (Offline Queue & Data Merging)", () => {
    it("mergePlayerProgress: Eski/çevrimdışı bir istemci verisi sunucudaki puanı asla geriye düşürmemelidir", () => {
      const serverProgress: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        xp: 15000,
        lp: 1800,
        coins: 450,
        soloUnlockedLevel: 25,
      };

      const staleClientData: Partial<PlayerProgress> = {
        xp: 12000, // Daha eski XP
        lp: 1600,  // Daha eski LP
        coins: 300, // Daha eski Çip
        soloUnlockedLevel: 20, // Daha eski seviye
      };

      const merged = mergePlayerProgress(serverProgress, staleClientData);
      // Math.max koruması sayesinde yüksek değerler korunmalıdır
      expect(merged.xp).toBe(15000);
      expect(merged.lp).toBe(1800);
      expect(merged.coins).toBe(450);
      expect(merged.soloUnlockedLevel).toBe(25);
    });

    it("Misafir hesabı bağlarken (addGuestBalances) misafirin bakiyesi ana hesaba eksiksiz eklenmelidir", () => {
      const userProgress: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        xp: 5000,
        coins: 200,
        streakShields: 1,
      };

      const guestData: Partial<PlayerProgress> = {
        xp: 1200,
        coins: 80,
        streakShields: 2,
      };

      const merged = mergePlayerProgress(userProgress, guestData, { addGuestBalances: true });
      expect(merged.xp).toBe(6200);
      expect(merged.coins).toBe(280);
      expect(merged.streakShields).toBe(3);
    });
  });

  describe("8. Android Donanım Geri Tuşu Hiyerarşisi (BackHandler Modal Stack)", () => {
    it("Geri tuşuna basıldığında açık modallar hiyerarşik sırada (LIFO) tek tek kapanmalıdır", () => {
      const setShowGuide = vi.fn();
      const setSelectedWordInfo = vi.fn();
      const setShowLivesModal = vi.fn();
      const setGlobalAlert = vi.fn();
      const setScreen = vi.fn();

      // Durum: Hem Rehber, hem Sözlük Kartı, hem Can Modalı açık
      const handled1 = resolveBackPressAction({
        screen: "home",
        setScreen,
        showGuide: true,
        setShowGuide,
        selectedWordInfo: { word: "TEST" },
        setSelectedWordInfo,
        inspectedPath: null,
        setInspectedPath: vi.fn(),
        selectedModeInfo: null,
        setSelectedModeInfo: vi.fn(),
        pendingMatchConfirm: null,
        setPendingMatchConfirm: vi.fn(),
        showLivesModal: true,
        setShowLivesModal,
        showWelcomeModal: false,
        setShowWelcomeModal: vi.fn(),
        showResultModal: false,
        setShowResultModal: vi.fn(),
        showLeaveDuelModal: false,
        setShowLeaveDuelModal: vi.fn(),
        seasonResetModal: null,
        setSeasonResetModal: vi.fn(),
        globalAlert: null,
        setGlobalAlert,
        room: null,
        leaveRoom: vi.fn(),
        dailySession: null,
        setDailySession: vi.fn(),
        soloLevel: 1,
        completeSoloLevel: vi.fn(),
      });

      // 1. Basış: En üstteki Rehber (Guide) modalı kapanmalıdır
      expect(handled1).toBe(true);
      expect(setShowGuide).toHaveBeenCalledWith(false);
    });

    it("Alt menülerdeyken (store, profile vb.) geri tuşuna basıldığında ana ekrana ('home') dönmelidir", () => {
      const setScreen = vi.fn();

      const handled = resolveBackPressAction({
        screen: "store", // Mağaza ekranında
        setScreen,
        showGuide: false,
        setShowGuide: vi.fn(),
        selectedWordInfo: null,
        setSelectedWordInfo: vi.fn(),
        inspectedPath: null,
        setInspectedPath: vi.fn(),
        selectedModeInfo: null,
        setSelectedModeInfo: vi.fn(),
        pendingMatchConfirm: null,
        setPendingMatchConfirm: vi.fn(),
        showLivesModal: false,
        setShowLivesModal: vi.fn(),
        showWelcomeModal: false,
        setShowWelcomeModal: vi.fn(),
        showResultModal: false,
        setShowResultModal: vi.fn(),
        showLeaveDuelModal: false,
        setShowLeaveDuelModal: vi.fn(),
        seasonResetModal: null,
        setSeasonResetModal: vi.fn(),
        globalAlert: null,
        setGlobalAlert: vi.fn(),
        room: null,
        leaveRoom: vi.fn(),
        dailySession: null,
        setDailySession: vi.fn(),
        soloLevel: 1,
        completeSoloLevel: vi.fn(),
      });

      expect(handled).toBe(true);
      expect(setScreen).toHaveBeenCalledWith("home");
    });

    it("Ana ekrandayken ('home') hiçbir modal açık değilse geri tuşu uygulamayı kapatmalıdır (return false)", () => {
      const handled = resolveBackPressAction({
        screen: "home",
        setScreen: vi.fn(),
        showGuide: false,
        setShowGuide: vi.fn(),
        selectedWordInfo: null,
        setSelectedWordInfo: vi.fn(),
        inspectedPath: null,
        setInspectedPath: vi.fn(),
        selectedModeInfo: null,
        setSelectedModeInfo: vi.fn(),
        pendingMatchConfirm: null,
        setPendingMatchConfirm: vi.fn(),
        showLivesModal: false,
        setShowLivesModal: vi.fn(),
        showWelcomeModal: false,
        setShowWelcomeModal: vi.fn(),
        showResultModal: false,
        setShowResultModal: vi.fn(),
        showLeaveDuelModal: false,
        setShowLeaveDuelModal: vi.fn(),
        seasonResetModal: null,
        setSeasonResetModal: vi.fn(),
        globalAlert: null,
        setGlobalAlert: vi.fn(),
        room: null,
        leaveRoom: vi.fn(),
        dailySession: null,
        setDailySession: vi.fn(),
        soloLevel: 1,
        completeSoloLevel: vi.fn(),
      });

      // Ana ekranda modal yoksa false döner -> Android OS uygulamadan çıkar
      expect(handled).toBe(false);
    });
  });
});
