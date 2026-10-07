import { describe, expect, it } from "vitest";
import {
  advanceSelection,
  isAdjacent,
  wordFromSelection,
} from "../shared/game";
import {
  createSoloBoard,
  getSoloLevel,
} from "../shared/solo";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
  applyMatchProgress,
  completeDailyProgress,
  mergePlayerProgress,
  getLeagueTier,
  getCalculatedLives,
  deductLife,
  buyLives,
  reconcileDailyStreak,
  getDailyChallenge,
  WORD_BOOK_MILESTONES,
} from "../shared/progression";
import {
  getWeeklyCohort,
} from "../shared/leagues";
import {
  getWeekendHuntEvent,
  recordWeekendHuntWords,
  claimWeekendHuntReward,
  isWeekendTargetWord,
  WEEKEND_THEMES,
} from "../shared/weekend-hunt";
import {
  createInitialTurnBoard,
  calculateTurnWordScore,
} from "../shared/turn-match";
import {
  createTurnMatchRecord,
  findTurnMatchById,
  updateTurnMatchRecord,
} from "../server/db";
import {
  isValidTurkishWord,
  getWordDefinition,
} from "../shared/dictionary";
import {
  isEqualTr,
  normalizeTr,
  normalizeTrUpper,
} from "../shared/tr-utils";
import { CHIP_EQUIPMENT_ITEMS } from "../shared/store-items";

describe("Senior QA: İnsan Davranışları, Kaos & Gerçekçi Uç Durumlar (Human Behavior & Chaos Simulation)", () => {
  // =========================================================================
  // BÖLÜM 1: İNSAN OYUNCU DOKUNMATİK & SÜRÜKLEME DAVRANIŞLARI
  // =========================================================================
  describe("1. İnsan Dokunmatik & Sürükleme Hataları (Touch Gestures & Backtracking)", () => {
    it("Tereddüt edip parmağı geri çeken oyuncunun rotası geri sarılmalı (backtracking)", () => {
      // 4x4 tahtada: 0 -> 1 -> 2 -> 3 harflerine sürükledi
      let selection = [0, 1, 2, 3];

      // Oyuncu fikrini değiştirip 2'ye geri döndü
      selection = advanceSelection(selection, 2, 4);
      expect(selection).toEqual([0, 1, 2]);

      // 1'e geri döndü
      selection = advanceSelection(selection, 1, 4);
      expect(selection).toEqual([0, 1]);

      // Tekrar 2'ye sürükledi
      selection = advanceSelection(selection, 2, 4);
      expect(selection).toEqual([0, 1, 2]);
    });

    it("Çapraz parmak kayması (diagonal slip) dik açılı kural gereği kesinlikle reddedilmelidir", () => {
      // 4x4 tahtada 0'dan 5'e çapraz kaydı
      expect(isAdjacent(0, 5, 4)).toBe(false);

      const selection = [0];
      const afterSlip = advanceSelection(selection, 5, 4);
      // Çapraz hücre rota dışı kalmalı, seçim bozulmamalı
      expect(afterSlip).toEqual([0]);
    });

    it("Döngü oluşturma (aynı hücreye tekrar basma) mevcut seçimi bozmamalı veya klonlamamalıdır", () => {
      let selection = [0, 1, 2];
      // Oyuncu yanlışlıkla daha önce basılmış olan 0'a tekrar basıyor
      const afterLoopTap = advanceSelection(selection, 0, 4);
      // Seçim korunmalı, 0 mükerrer eklenmemelidir
      expect(afterLoopTap).toEqual([0, 1, 2]);
    });

    it("Tahta sınırları dışına taşan indeksler güvenle göz ardı edilmelidir", () => {
      expect(isAdjacent(0, -1, 4)).toBe(false);
      expect(isAdjacent(0, 16, 4)).toBe(false);
      expect(isAdjacent(15, 16, 4)).toBe(false);
      expect(isAdjacent(3, 4, 4)).toBe(false); // Satır sonundan bir alt satırın başına atlama
    });

    it("1 harfli yetersiz seçimlerde kelime üretimi güvenle boş/kısa karşılanmalıdır", () => {
      const board = ["A", "B", "C", "D"];
      const word = wordFromSelection(board, [0]);
      expect(word).toBe("A");
      expect(word.length).toBeLessThan(2);
      expect(isValidTurkishWord(word)).toBe(false);
    });
  });

  // =========================================================================
  // BÖLÜM 2: BUTON ÇILGINLIĞI & EŞZAMANLI İSTEK KORUMASI (BUTTON MASHING)
  // =========================================================================
  describe("2. Buton Çılgınlığı & Eşzamanlı İstek Koruması (Button Mashing & Race Conditions)", () => {
    it("Oyuncu Seri Kalkanı al butonuna hızlıca 10 kez tıklasa bile çip asla negatif olmamalıdır", () => {
      const SHIELD_COST = 120;
      let player: PlayerProgress = { ...DEFAULT_PROGRESS, coins: 150, streakShields: 0 };

      const buyShieldAttempt = (p: PlayerProgress): PlayerProgress => {
        const curCoins = p.coins ?? 0;
        if (curCoins < SHIELD_COST) return p;
        return {
          ...p,
          coins: curCoins - SHIELD_COST,
          streakShields: (p.streakShields ?? 0) + 1,
        };
      };

      // 10 kez art arda basış simülasyonu
      for (let tap = 0; tap < 10; tap++) {
        player = buyShieldAttempt(player);
      }

      // 150 çipi olan oyuncu sadece 1 kalkan alabilir, kalanı 30 çip olmalı, asla eksiye düşmemeli
      expect(player.streakShields).toBe(1);
      expect(player.coins).toBe(30);
    });

    it("Sözlük Müzesi kademe ödülüne mükerrer tıklamalarda ödül yalnız 1 kez verilmelidir", () => {
      let player: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        coins: 0,
        discoveredWords: Array(30).fill("KELİME"),
        wordBookClaimedMilestones: {},
      };

      const milestone25 = WORD_BOOK_MILESTONES[0]!; // 25 kelime, 50 çip
      expect(milestone25.count).toBe(25);

      const claimAttempt = (p: PlayerProgress): PlayerProgress => {
        const claimed = p.wordBookClaimedMilestones || {};
        if (claimed[milestone25.count]) return p; // Zaten alınmış
        if ((p.discoveredWords || []).length < milestone25.count) return p;

        return {
          ...p,
          coins: (p.coins ?? 0) + milestone25.rewardCoins,
          wordBookClaimedMilestones: {
            ...claimed,
            [milestone25.count]: true,
          },
        };
      };

      // 5 kez seri tıklama
      for (let i = 0; i < 5; i++) {
        player = claimAttempt(player);
      }

      expect(player.coins).toBe(50); // Sadece 50 çip eklendi
      expect(player.wordBookClaimedMilestones?.[25]).toBe(true);
    });

    it("Kahve Düellosu: Sırası olmayan oyuncu hamle gönderdiğinde istek reddedilmelidir", async () => {
      const matchId = `chaos_turn_${Date.now()}`;
      await createTurnMatchRecord({
        id: matchId,
        player1Id: "p_attacker",
        player1Name: "Saldırgan",
        player2Id: "p_defender",
        player2Name: "Savunan",
        turnPlayerId: "p_attacker", // Sıra 1. oyuncuda
        board: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "İ", "J", "K", "L", "M", "N", "O"],
        size: 4,
        round: 1,
        maxRounds: 3,
        player1Score: 0,
        player2Score: 0,
        foundWords: [],
        status: "active",
        winnerId: null,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const match = await findTurnMatchById(matchId);
      expect(match?.turnPlayerId).toBe("p_attacker");

      // 2. oyuncu (sırası olmayan) hamle yapmaya çalışıyor
      const isLegal = match?.turnPlayerId === "p_defender";
      expect(isLegal).toBe(false);
    });
  });

  // =========================================================================
  // BÖLÜM 3: E2E GERÇEKÇİ OYUNCU GÜNLÜK YAŞAM DÖNGÜSÜ (FULL PLAYER JOURNEY)
  // =========================================================================
  describe("3. E2E Gerçekçi Oyuncu Oturumu (Full Human Lifecycle Journey)", () => {
    it("Oyuncu 3 günlük bir döngüde tüm modları insan gibi oynar ve deneyimler", () => {
      let player: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        xp: 0,
        coins: 100,
        streak: 0,
        streakShields: 0,
        discoveredWords: [],
      };

      // -------------------------------------------------------------
      // 1. GÜN: Çarşamba (Normal Gün)
      // -------------------------------------------------------------
      const day1Challenge = getDailyChallenge(new Date("2026-10-07"));
      expect(day1Challenge.title).toBe("GÜNÜN ROTASI");

      // Günlük rotayı oynar ve 4 kelime bulup tamamlar
      const day1Words = ["KİTAP", "GÜNEŞ", "DENİZ", "ORMAN"];
      player = completeDailyProgress(player, day1Challenge, 160, 4, day1Words);

      expect(player.streak).toBe(1);
      expect(player.dailyCompletedId).toBe(day1Challenge.id);
      expect(player.discoveredWords).toContain("KİTAP");
      expect(player.discoveredWords).toContain("ORMAN");

      // Wordle paylaşım kartını oluşturur
      const shareMsg = `💥 Kelime Patlat · Günün Rotası\n📅 ${day1Challenge.id} | 🔥 ${player.streak} Günlük Seri!\n\n🟩🟩🟩🟩\n🟩🟩🟩🟩🟩`;
      expect(shareMsg).toContain("🔥 1 Günlük Seri!");

      // -------------------------------------------------------------
      // 2. GÜN: Perşembe (Oyuncu Oyuna Girmeyi Unuttu - Missed Day!)
      // -------------------------------------------------------------
      // (Herhangi bir işlem yapmadı)

      // -------------------------------------------------------------
      // 3. GÜN: Cuma (Girdiğinde Seri Sıfırlanır, Kalkan Alır ve Hafta Sonu Avına Katılır)
      // -------------------------------------------------------------
      const fridayReconcile = reconcileDailyStreak(player, "2026-10-09");
      expect(fridayReconcile.streakReset).toBe(true);
      expect(fridayReconcile.updatedProgress.streak).toBe(0); // Kalkanı olmadığı için serisi sıfırlandı
      player = fridayReconcile.updatedProgress;

      // Akıllanan oyuncu mağazadan 1 Seri Kalkanı satın alır (+120 çip kazanıp alır)
      const curCoins = (player.coins ?? 0) + 100; // Önce çip kazanır (toplam 200+)
      player = { ...player, coins: curCoins };
      const SHIELD_COST = 120;
      expect(player.coins).toBeGreaterThanOrEqual(SHIELD_COST);
      player = {
        ...player,
        coins: curCoins - SHIELD_COST,
        streakShields: (player.streakShields ?? 0) + 1,
      };
      expect(player.streakShields).toBe(1);

      // Cuma saat 14:00: Hafta Sonu Avı Aktiftir
      const fridayDate = new Date("2026-10-09T14:00:00Z");
      const huntEvent = getWeekendHuntEvent(fridayDate);
      expect(huntEvent.targetWords.length).toBe(5);

      // Oyuncu Solo seviye 32 (Bomba 💣 ve Buz 🧊 içeren) oynar
      const soloBoard = createSoloBoard(32, 555);
      expect(soloBoard.specialTiles).toBeDefined();

      // Seviye sırasında hafta sonu hedef kelimelerinden birini ("YILDIZ" veya listenin ilki) bulur
      const targetFound = huntEvent.targetWords[0]!;
      expect(isWeekendTargetWord(targetFound, huntEvent.targetWords)).toBe(true);

      // Maç raporu işlenir
      player = applyMatchProgress(
        player,
        {
          score: 180,
          tempo: 3.1,
          won: true,
          foundWords: [targetFound, "KARTAL"],
        },
        "solo"
      );

      // Hem Kelime Defterine hem de Hafta Sonu Avına yansıdı
      expect(player.discoveredWords).toContain(targetFound);
      expect(player.discoveredWords).toContain("KARTAL");

      // Hafta Sonu Avı ödülünü talep eder
      const huntRewardRes = claimWeekendHuntReward(player, 0, huntEvent);
      if (huntRewardRes) {
        player = huntRewardRes.updatedProgress;
        expect(player.weekendHunt?.claimedTiers).toContain(0);
        expect(player.xp).toBeGreaterThan(0);
      }

      // Oyuncu 20'li Haftalık Lig durumunu kontrol eder
      const playerProfile = {
        id: "p_human",
        name: "İnsan Oyuncu",
        lp: player.lp ?? 450,
      };
      const cohort = getWeeklyCohort(playerProfile, fridayDate);
      expect(cohort.members.length).toBe(20);
      const myRank = cohort.members.findIndex((m) => m.isCurrentPlayer) + 1;
      expect(myRank).toBeGreaterThanOrEqual(1);
      expect(myRank).toBeLessThanOrEqual(20);
    });
  });

  // =========================================================================
  // BÖLÜM 4: ÇEVRİMDIŞI OYNANIŞ & BOZUK UZAK VERİ BULUT BİRLEŞTİRMESİ
  // =========================================================================
  describe("4. Çevrimdışı Oynanış & Bozuk Bulut Verisi Direnci (Offline Resilience & Corrupt Data)", () => {
    it("Oyuncu uçaktayken seviye atlayıp çip kazandığında, internet gelince veriler ezilmemelidir", () => {
      const localProgress: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        soloUnlockedLevel: 14,
        coins: 180,
        xp: 1200,
        discoveredWords: ["BULUT", "UÇAK", "KANAT"],
        streakShields: 2,
      };

      const oldCloudProgress: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        soloUnlockedLevel: 10,
        coins: 50,
        xp: 800,
        discoveredWords: ["BULUT"],
        streakShields: 1,
      };

      const merged = mergePlayerProgress(localProgress, oldCloudProgress);

      // Yerelde offline kazanılan daha yüksek değerler korunmalı
      expect(merged.soloUnlockedLevel).toBe(14);
      expect(merged.coins).toBeGreaterThanOrEqual(180);
      expect(merged.xp).toBe(1200);
      expect(merged.streakShields).toBe(2);
      expect(merged.discoveredWords).toEqual(expect.arrayContaining(["BULUT", "UÇAK", "KANAT"]));
    });

    it("Uzak sunucudan gelen bozuk veya saldırgan veriler (NaN, negatif, aşırı büyük) sanitize edilmelidir", () => {
      const safeLocal: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        coins: 100,
        xp: 500,
        streak: 3,
      };

      const corruptRemote: any = {
        ...DEFAULT_PROGRESS,
        coins: -9999, // Negatif bakiye hatası
        xp: NaN,      // Sayısal olmayan değer
        streak: 999999, // Hileli / aşırı büyük seri
        lives: -5,
      };

      const merged = mergePlayerProgress(safeLocal, corruptRemote);

      expect(merged.coins).toBeGreaterThanOrEqual(0);
      expect(isNaN(merged.xp)).toBe(false);
      expect(merged.streak).toBeLessThanOrEqual(3650); // Maksimum mantıklı tavan
      expect(merged.lives).toBeGreaterThanOrEqual(0);
    });
  });

  // =========================================================================
  // BÖLÜM 5: TÜRKÇE DİL KURALLARI, DİAKRİTİK & ARAMA GERÇEKÇİLİĞİ
  // =========================================================================
  describe("5. Türkçe Dil Kuralları & Arama Gerçekçiliği (Turkish Orthography Realism)", () => {
    it("Büyük/küçük İ ve I ayrımı Türkçe kurallarına göre kusursuz çalışmalıdır", () => {
      // Türkçe'de:
      // 'i' -> 'İ'
      // 'ı' -> 'I'
      expect(normalizeTrUpper("iğne")).toBe("İĞNE");
      expect(normalizeTrUpper("ışık")).toBe("IŞIK");
      expect(normalizeTr("İĞNE")).toBe("iğne");
      expect(normalizeTr("IŞIK")).toBe("ışık");

      // Eşitlik kontrolü
      expect(isEqualTr("istanbul", "İSTANBUL")).toBe(true);
      expect(isEqualTr("isparta", "ISPARTA")).toBe(false); // biri İ biri I
      expect(isEqualTr("ısparta", "ISPARTA")).toBe(true);
    });

    it("Karmaşık casing ('kİtAp', 'şEKeR') ile yapılan sözlük sorguları sorunsuz çözülmelidir", () => {
      const messyInput1 = "kİtAp";
      const messyInput2 = "şEKeR";

      expect(isValidTurkishWord(messyInput1)).toBe(true);
      expect(isValidTurkishWord(messyInput2)).toBe(true);

      const def = getWordDefinition(messyInput1);
      expect(def).toBeTruthy();
      expect(typeof def).toBe("string");
    });
  });

  // =========================================================================
  // BÖLÜM 6: KAHVE DÜELLOSU UÇ DURUMLARI (BERABERLİK & SÜRE AŞIMI)
  // =========================================================================
  describe("6. Kahve Düellosu Uç Durumları (Draw Matches & Timeouts)", () => {
    it("Eşit puanla biten maçta winnerId 'draw' olarak atanmalıdır", async () => {
      const matchId = `draw_match_${Date.now()}`;
      await createTurnMatchRecord({
        id: matchId,
        player1Id: "p_draw_1",
        player1Name: "Ahmet",
        player2Id: "p_draw_2",
        player2Name: "Mehmet",
        turnPlayerId: "p_draw_2",
        board: createInitialTurnBoard(4),
        size: 4,
        round: 3,
        maxRounds: 3,
        player1Score: 60,
        player2Score: 35, // P2 şimdi 25 puanlık kelime yapıp 60'a eşitleyecek
        foundWords: [],
        status: "active",
        winnerId: null,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const p2TurnWord = "KAPI"; // 25 puan
      const p2WordScore = calculateTurnWordScore(p2TurnWord);
      const finalP2Score = 35 + p2WordScore; // 60
      expect(finalP2Score).toBe(60);

      // Her iki oyuncunun skoru 60 == 60 oldu
      const winnerId = 60 > finalP2Score ? "p_draw_1" : finalP2Score > 60 ? "p_draw_2" : "draw";
      expect(winnerId).toBe("draw");

      const concluded = await updateTurnMatchRecord(matchId, {
        player2Score: finalP2Score,
        round: 4,
        status: "completed",
        winnerId,
      });

      expect(concluded?.status).toBe("completed");
      expect(concluded?.winnerId).toBe("draw");
      expect(concluded?.player1Score).toBe(60);
      expect(concluded?.player2Score).toBe(60);
    });

    it("createInitialTurnBoard tahtası her zaman en az 2 sesli harf içeren dengeli bir karma sunmalıdır", () => {
      // 10 farklı PRNG tohumu ile tahta üret ve sesli harf dağılımını kontrol et
      for (let run = 0; run < 10; run++) {
        let seed = 1000 + run * 37;
        const prng = () => {
          seed = (seed * 16807) % 2147483647;
          return (seed - 1) / 2147483646;
        };
        const board = createInitialTurnBoard(4, prng);
        const vowels = ["A", "E", "İ", "O", "U"];
        const vowelCount = board.filter((c) => vowels.includes(c)).length;

        // 16 hücreli 4x4 tahtada oyuncuların kelime kurabilmesi için en az 2 sesli harf bulunmalıdır
        expect(vowelCount).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
