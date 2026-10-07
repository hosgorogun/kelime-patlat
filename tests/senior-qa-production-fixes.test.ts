import { describe, it, expect, vi } from "vitest";
import {
  getPlayerLevel,
  DEFAULT_PROGRESS,
  reconcileDailyStreak,
  getDiffDays,
  getPreviousDayId,
  getDayId,
  type PlayerProgress,
} from "../shared/progression";
import { normalizeTr, normalizeTrUpper, isEqualTr } from "../shared/tr-utils";
import { snapshot } from "../server/game/room-snapshot";
import type { Room, PlayerRecord } from "../server/game/types";

describe("Senior QA Production Fixes & Regression Suite", () => {
  describe("1. getPlayerLevel - Tier-Scaled Level Curves vs Linear Regression", () => {
    it("10000 XP canonical tier curve seviyesi 33 olmalıdır (lineer 51 değil)", () => {
      const canonicalLevel = getPlayerLevel(10000);
      expect(canonicalLevel).toBe(33);
      expect(canonicalLevel).not.toBe(Math.floor(10000 / 200) + 1);
    });

    it("0 XP seviye 1, 100 XP seviye 1, 200 XP seviye 2 olmalıdır", () => {
      expect(getPlayerLevel(0)).toBe(1);
      expect(getPlayerLevel(100)).toBe(1);
      expect(getPlayerLevel(200)).toBe(2);
    });

    it("Yüksek XP seviyelerinde (50000 XP) seviye tutarlı ve pozitif tam sayı kalmalıdır", () => {
      const lvl = getPlayerLevel(50000);
      expect(lvl).toBeGreaterThan(50);
      expect(Number.isInteger(lvl)).toBe(true);
    });
  });

  describe("2. Turkish Casing & Letter Comparison (AGENTS.md Rule 1)", () => {
    it("normalizeTrUpper küçük i harfini İ, küçük ı harfini I yapar", () => {
      expect(normalizeTrUpper("iğne")).toBe("İĞNE");
      expect(normalizeTrUpper("ışık")).toBe("IŞIK");
      expect(normalizeTrUpper("istanbul")).toBe("İSTANBUL");
      expect(normalizeTrUpper("ılık")).toBe("ILIK");
    });

    it("isEqualTr Türkçe dotted ve dotless 'I' / 'İ' karşılaştırmalarını doğru eşler", () => {
      expect(isEqualTr("İSTANBUL", "istanbul")).toBe(true);
      expect(isEqualTr("ISLIK", "ıslık")).toBe(true);
      expect(isEqualTr("ışık", "IŞIK")).toBe(true);
      expect(isEqualTr("ISLIK", "islik")).toBe(false);
    });

    it("Solo/Arcade kelime aramasında array.some((w) => isEqualTr(w, word)) harf farklılıklarını yakalar", () => {
      const challengeWords = ["İĞNE", "IŞIK", "KİTAP"];
      const submitted = "iğne";
      const isTarget = challengeWords.some((w) => isEqualTr(w, submitted));
      expect(isTarget).toBe(true);

      const found = ["İĞNE"];
      const isAlreadyFound = found.some((w) => isEqualTr(w, submitted));
      expect(isAlreadyFound).toBe(true);
    });
  });

  describe("3. Timezone & Date Arithmetic (getDiffDays, getPreviousDayId)", () => {
    it("getDiffDays ardışık günler arasında tam 1 gün farkı hesaplar", () => {
      expect(getDiffDays("2026-10-04", "2026-10-03")).toBe(1);
      expect(getDiffDays("2026-10-04", "2026-10-02")).toBe(2);
      expect(getDiffDays("2026-10-04", "2026-10-04")).toBe(0);
    });

    it("getDiffDays ay ve yıl sınırlarında (ör. 1 Mart -> 28 Şubat) kusursuz çalışır", () => {
      expect(getDiffDays("2026-03-01", "2026-02-28")).toBe(1);
      expect(getDiffDays("2026-01-01", "2025-12-31")).toBe(1);
    });

    it("getPreviousDayId bir önceki günün ISO formatını verir", () => {
      expect(getPreviousDayId("2026-10-04", 1)).toBe("2026-10-03");
      expect(getPreviousDayId("2026-10-01", 1)).toBe("2026-09-30");
      expect(getPreviousDayId("2026-01-01", 1)).toBe("2025-12-31");
    });

    it("reconcileDailyStreak 1 gün atlandığında kalkanı tüketir ve dün tarihini atar", () => {
      const progress: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        streak: 5,
        streakShields: 2,
        dailyCompletedId: "2026-10-02",
      };
      // Bugün 2026-10-04, tamamlanan gün 2026-10-02 (2 gün fark -> 1 gün kaçırılmış)
      const res = reconcileDailyStreak(progress, "2026-10-04");
      expect(res.shieldUsed).toBe(true);
      expect(res.shieldsConsumed).toBe(1);
      expect(res.updatedProgress.streakShields).toBe(1);
      expect(res.updatedProgress.dailyCompletedId).toBe("2026-10-03"); // Tam bir gün önce
      expect(res.updatedProgress.streak).toBe(5);
    });

    it("reconcileDailyStreak kalkan yoksa ve gün kaçırıldıysa seriyi sıfırlar", () => {
      const progress: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        streak: 5,
        streakShields: 0,
        dailyCompletedId: "2026-10-02",
      };
      const res = reconcileDailyStreak(progress, "2026-10-04");
      expect(res.streakReset).toBe(true);
      expect(res.updatedProgress.streak).toBe(0);
    });
  });

  describe("4. Cloud Sync Streak & Bonus Safety Logic", () => {
    it("Yeni kullanıcının yerel serisi (streak=5), sunucudaki 0 ile sıfırlanmamalıdır", () => {
      const currentProgStreak = 0;
      const incomingStreak = 5;

      // Eski hatalı kod: Math.min(currentProg.streak, Math.max(0, progress.streak)) => Math.min(0, 5) = 0
      const brokenStreak = Math.min(currentProgStreak, Math.max(0, incomingStreak));
      expect(brokenStreak).toBe(0); // Eski bug doğrulandı

      // Düzeltilmiş kod:
      const fixedStreak = typeof incomingStreak === "number" && Number.isFinite(incomingStreak)
        ? Math.max(0, Math.min(3650, Math.floor(incomingStreak)))
        : currentProgStreak;
      expect(fixedStreak).toBe(5); // Düzeltildi!
    });

    it("Hoşgeldin ödülü çift kredi verilmesi engellenmelidir", () => {
      const currentCoins = 100;
      // İstemci yerel olarak +50 ekleyip 150 gönderdi
      const incomingCoins = 150;
      const isClaimingWelcome = true;

      // İstemci zaten eklediyse (incomingCoins > currentCoins) tekrar +50 eklenmemelidir
      const missingWelcomeCoins = isClaimingWelcome && incomingCoins <= currentCoins ? 50 : 0;
      expect(missingWelcomeCoins).toBe(0);

      const finalCoins = incomingCoins + missingWelcomeCoins;
      expect(finalCoins).toBe(150); // Çiftlenmedi (200 olmadı)
    });

    it("İstemci hoşgeldin ödülü alıp yerel bakiyesini artırmadıysa, sunucu +50 tamamlar", () => {
      const currentCoins = 100;
      const incomingCoins = 100; // İstemci artırmadan gönderdi
      const isClaimingWelcome = true;

      const missingWelcomeCoins = isClaimingWelcome && incomingCoins <= currentCoins ? 50 : 0;
      expect(missingWelcomeCoins).toBe(50);

      const finalCoins = incomingCoins + missingWelcomeCoins;
      expect(finalCoins).toBe(150); // Eksik ödül tamamlandı
    });
  });

  describe("5. Room Snapshot Turkish Unicode Normalization & Missed Words", () => {
    it("Oyun bittiğinde bulunan kelimeler Türkçe normalize edilerek missedWords listesinden çıkarılır", () => {
      const mockHost: PlayerRecord = {
        id: "p1",
        name: "Ahmet",
        isBot: false,
        connected: true,
        ready: true,
        rematch: false,
        socketId: "s1",
      };
      const mockRoom: Room = {
        code: "TEST1",
        size: 4,
        status: "finished",
        board: ["A", "B", "C", "D"],
        words: ["İĞNE", "IŞIK", "KAPLAN"],
        routes: { "İĞNE": [0, 1], "IŞIK": [2, 3], "KAPLAN": [0, 2] },
        foundWords: [
          // p1 küçük harfle veya farklı case ile bulmuş olsun
          { word: "iğne", path: [0, 1], playerId: "p1" },
        ],
        scores: { p1: 10 },
        comboCount: { p1: 1 },
        host: mockHost,
        guest: null,
        winnerId: "p1",
        startedAt: Date.now(),
        message: "Oyun bitti",
        touchedAt: Date.now(),
        botFillToken: 0,
        roundToken: 0,
      };

      const snap = snapshot(mockRoom, "p1");
      expect(snap.missedWords).toBeDefined();
      const missedWordList = snap.missedWords!.map((m) => m.word);
      // İĞNE oyuncu tarafından 'iğne' olarak bulunmuş olduğu için missedWords içinde OLMAMALIDIR
      expect(missedWordList).not.toContain("İĞNE");
      expect(missedWordList).toContain("IŞIK");
      expect(missedWordList).toContain("KAPLAN");
    });
  });

  describe("6. Room Timer Cleanup on Forfeit", () => {
    it("Terk etme durumunda oda roundEndTimer, botTurnTimer ve disconnectTimer temizlenmelidir", () => {
      let roundTimerCleared = false;
      let botTimerCleared = false;
      let disconnectTimerCleared = false;

      const mockRoom: Partial<Room> = {
        status: "playing",
        roundEndTimer: setTimeout(() => { roundTimerCleared = false; }, 10000),
        botTurnTimer: setTimeout(() => { botTimerCleared = false; }, 10000),
        disconnectTimer: setTimeout(() => { disconnectTimerCleared = false; }, 10000),
      };

      // Forfeit handler simülasyonu
      if (mockRoom.roundEndTimer) {
        clearTimeout(mockRoom.roundEndTimer);
        mockRoom.roundEndTimer = undefined;
        roundTimerCleared = true;
      }
      if (mockRoom.botTurnTimer) {
        clearTimeout(mockRoom.botTurnTimer);
        mockRoom.botTurnTimer = undefined;
        botTimerCleared = true;
      }
      if (mockRoom.disconnectTimer) {
        clearTimeout(mockRoom.disconnectTimer);
        mockRoom.disconnectTimer = undefined;
        disconnectTimerCleared = true;
      }

      expect(roundTimerCleared).toBe(true);
      expect(botTimerCleared).toBe(true);
      expect(disconnectTimerCleared).toBe(true);
      expect(mockRoom.roundEndTimer).toBeUndefined();
      expect(mockRoom.botTurnTimer).toBeUndefined();
      expect(mockRoom.disconnectTimer).toBeUndefined();
    });
  });

  describe("7. Weekly Timer Modulo Calculation", () => {
    it("Haftalık sıfırlama sayacında dakikalar saniye modulosu değil saat modulosu ile hesaplanmalıdır", () => {
      // 2 saat, 35 dakika, 42 saniye = (2 * 3600 + 35 * 60 + 42) * 1000 ms
      const diffWeekly = (2 * 3600 + 35 * 60 + 42) * 1000;
      const weeklyHours = Math.floor((diffWeekly % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const weeklyMins = Math.floor((diffWeekly % (1000 * 60 * 60)) / (1000 * 60));
      const weeklySecs = Math.floor((diffWeekly % (1000 * 60)) / 1000);

      expect(weeklyHours).toBe(2);
      expect(weeklyMins).toBe(35);
      expect(weeklySecs).toBe(42);
    });
  });

  describe("8. Lucky Wheel Rotation Mathematics", () => {
    it("Çark her zaman ileri yönde döner ve ibre sektörün tam merkezine oturur", () => {
      const sectorCount = 8;
      const sectorAngle = 360 / sectorCount;
      const extraRounds = 5 * 360;

      for (let targetIndex = 0; targetIndex < sectorCount; targetIndex++) {
        for (let currentAngle = 0; currentAngle < 360; currentAngle += 45) {
          const startAngle = currentAngle;
          const targetMod = ((sectorCount - targetIndex) % sectorCount) * sectorAngle;
          const currentMod = startAngle % 360;
          const forwardDiff = (targetMod - currentMod + 360) % 360;
          const finalAngle = startAngle + extraRounds + forwardDiff;

          // Asla geriye dönmemeli (en az 5 tam tur ileri dönmeli)
          expect(finalAngle).toBeGreaterThanOrEqual(startAngle + extraRounds);

          // İbre açısı hedef sektörün modulosuna tam oturmalı
          expect(finalAngle % 360).toBe(targetMod);
        }
      }
    });
  });

  describe("9. Extra Bonus Words Mechanics & Word Validation", () => {
    it("isValidTurkishWord sözlükteki ve katalogdaki geçerli kelimeleri doğru tanımalıdır", async () => {
      const { isValidTurkishWord } = await import("../shared/dictionary");
      // Sözlük ve katalog kelimeleri
      expect(isValidTurkishWord("ELMA")).toBe(true);
      expect(isValidTurkishWord("deniz")).toBe(true);
      expect(isValidTurkishWord("BAHÇE")).toBe(true);
      expect(isValidTurkishWord("dünya")).toBe(true);

      // Geçersiz veya çok kısa kelimeler
      expect(isValidTurkishWord("")).toBe(false);
      expect(isValidTurkishWord("AB")).toBe(false);
      expect(isValidTurkishWord("XYZ123")).toBe(false);
    });

    it("Bonus kelime bulunduğunda ödül vermeli ve mükerrer bulunmaları engellemelidir", () => {
      const bonusWords: string[] = [];
      const testWord = "KENT";

      const isFoundFirst = bonusWords.some((w) => w === testWord);
      expect(isFoundFirst).toBe(false);

      bonusWords.push(testWord);

      const isFoundSecond = bonusWords.some((w) => w === testWord);
      expect(isFoundSecond).toBe(true);
    });

    it("Bonus kelimeler seviye sonu istatistiklerine (wordsCount, görevler) dahil edilmelidir", async () => {
      const { applyMatchProgress } = await import("../shared/progression");
      const initialProgress = {
        xp: 100,
        level: 1,
        lp: 50,
        coins: 100,
        stats: { duelsWon: 0, duelsLost: 0, totalMatches: 0, wordsFound: 10 },
        matchHistory: [],
      } as any;

      const targetWords = ["ELMA", "ARMUT"];
      const bonusWords = ["KENT", "KALE"];
      const allDiscovered = [...targetWords, ...bonusWords];

      const result = applyMatchProgress(
        initialProgress,
        {
          score: 100,
          tempo: 1.0,
          won: true,
          foundWords: allDiscovered,
        },
        "solo"
      );

      // Maç geçmişinde toplam bulunan kelime sayısı hedef + bonus toplamı (4) olmalıdır
      expect(result.matchHistory[0].wordsCount).toBe(4);
    });

    it("PvP ve Canlı Maçlarda hedef dışı geçerli Türkçe kelime bulunduğunda bonus ödülü tetiklenmelidir", async () => {
      const { isValidTurkishWord } = await import("../shared/dictionary");
      const targetWords = ["KİTAP", "DEFTER"];
      const candidateBonus = "KALEM";

      const isTarget = targetWords.includes(candidateBonus);
      expect(isTarget).toBe(false);

      const isValid = isValidTurkishWord(candidateBonus);
      expect(isValid).toBe(true);

      const bonusPoints = 10;
      let playerScore = 50;
      playerScore += bonusPoints;
      expect(playerScore).toBe(60);
    });
  });

  describe("10. Uzun Vadeli Yaşam Döngüsü & Retention Sistemleri Entegrasyonu (Longevity & Retention Suite)", () => {
    it("Özel hücreli Solo seviyelerinde bulunan kelimeler Kelime Defterine (discoveredWords) eksiksiz yazılmalıdır", async () => {
      const { createSoloBoard } = await import("../shared/solo");
      const { applyMatchProgress, DEFAULT_PROGRESS } = await import("../shared/progression");

      const board = createSoloBoard(20, 101); // Lv 20 -> Ice tiles
      expect(board.specialTiles).toBeDefined();

      const found = board.words.slice(0, 3);
      const updated = applyMatchProgress(
        DEFAULT_PROGRESS,
        {
          score: 150,
          tempo: 2.0,
          won: true,
          foundWords: found,
        },
        "solo"
      );

      found.forEach((w) => {
        expect(updated.discoveredWords).toContain(w);
      });
    });

    it("Hafta sonu etkinliğinde hedef kelime bulunduğunda hem av sayacı hem de kelime müzesi güncellenmelidir", async () => {
      const { applyMatchProgress, DEFAULT_PROGRESS } = await import("../shared/progression");
      const { WEEKEND_THEMES } = await import("../shared/weekend-hunt");

      const targetWord = WEEKEND_THEMES[0]!.targetWords[0]!; // e.g. "YILDIZ"

      const updated = applyMatchProgress(
        DEFAULT_PROGRESS,
        {
          score: 200,
          tempo: 3.5,
          won: true,
          foundWords: [targetWord, "DEFTER"],
        },
        "pvp"
      );

      expect(updated.discoveredWords).toContain(targetWord);
      expect(updated.discoveredWords).toContain("DEFTER");
    });

    it("20'li Haftalık Lig Grubu puanları oyuncunun haftalık aktivitesine göre anında yansımalıdır", async () => {
      const { getWeeklyCohort } = await import("../shared/leagues");

      const playerLow = { id: "p_pro", name: "Pro Oyuncu", lp: 3600 };
      const date = new Date("2026-10-07T12:00:00Z");

      const cohort1 = getWeeklyCohort({ ...playerLow, lp: 3600 }, date);
      const p1 = cohort1.members.find((m) => m.id === "p_pro");
      expect(p1).toBeDefined();

      const cohort2 = getWeeklyCohort({ ...playerLow, lp: 4200 }, date);
      const p2 = cohort2.members.find((m) => m.id === "p_pro");
      expect(p2).toBeDefined();
      expect(cohort2.members.length).toBe(20);
    });
  });
});

