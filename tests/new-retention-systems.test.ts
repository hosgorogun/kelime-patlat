import { describe, it, expect } from "vitest";
import { isRushHourActive, getRushHourLpMultiplier, generateDailyCommunityBoard } from "../shared/rush-hour";
import { WORD_CARD_ALBUMS, openCardPack, checkSetCompleted } from "../shared/card-albums";
import { createInitialKelimematik, dropKelimematikLetter, popKelimematikWord } from "../shared/kelimematik";
import { applyMatchProgress, applyKelimematikProgress } from "../shared/progression/match-progress";
import { DEFAULT_PROGRESS } from "../shared/progression/progression.types";

describe("Yeni Retention Sistemleri Doğrulama Testleri", () => {
  // 1. Rush Hour & Günün Eşit Tahtası
  it("Rush Hour: 20:00-21:00 arası 2x LP çarpanı vermeli, diğer saatlerde 1x vermeli", () => {
    const rushDate = new Date("2026-10-15T20:30:00");
    const normalDate = new Date("2026-10-15T14:30:00");

    expect(isRushHourActive(rushDate)).toBe(true);
    expect(getRushHourLpMultiplier(rushDate)).toBe(2.0);

    expect(isRushHourActive(normalDate)).toBe(false);
    expect(getRushHourLpMultiplier(normalDate)).toBe(1.0);
  });

  it("Günün Eşit Tahtası: Deterministik olarak tüm Türkiye için aynı gün aynı 5x5 tahtayı üretmeli", () => {
    const board1 = generateDailyCommunityBoard("2026-10-15");
    const board2 = generateDailyCommunityBoard("2026-10-15");
    const differentDayBoard = generateDailyCommunityBoard("2026-10-16");

    expect(board1.board.length).toBe(25);
    expect(board1.board).toEqual(board2.board);
    expect(board1.board).not.toEqual(differentDayBoard.board);
  });

  // 2. Lügat Koleksiyoncusu (Kart Albümleri)
  it("Lügat Koleksiyoncusu: 3 tematik albüm ve kart paketleri hatasız açılmalı", () => {
    expect(WORD_CARD_ALBUMS.length).toBe(3);
    const eskiTurkceSet = WORD_CARD_ALBUMS[0]!;
    expect(eskiTurkceSet.cards.length).toBe(6);

    const pack = openCardPack("mythic");
    expect(pack.length).toBe(4);
    expect(pack[0]?.name).toBeDefined();

    const allCardIds = eskiTurkceSet.cards.map((c) => c.id);
    expect(checkSetCompleted("eski_turkce", allCardIds)).toBe(true);
    expect(checkSetCompleted("eski_turkce", ["et_1", "et_2"])).toBe(false);
  });

  // 3. Kelimematik Survival Motoru
  it("Kelimematik: Harf düşüşü, tehlike seviyesi ve kelime patlatma doğru çalışmalı", () => {
    let state = createInitialKelimematik(5, 7);
    expect(state.columns.length).toBe(5);
    expect(state.gameOver).toBe(false);

    // Harf düşür
    state = dropKelimematikLetter(state);
    expect(state.dangerLevel).toBeGreaterThanOrEqual(0);

    // Kelime patlat (0. sütundan harf sil)
    const initialScore = state.score;
    state = popKelimematikWord(state, "ELMA", [{ col: 0, row: 0 }]);
    expect(state.score).toBeGreaterThan(initialScore);
    expect(state.wordsFound).toBe(1);
  });

  // 4. Maç İlerlemesi ve 3+ Galibiyet Serisi Kilidi (Streak Boost)
  it("Streak Boost: 3 üst üste galibiyette activeStreakBoost aktifleşmeli ve kart düşmeli", () => {
    let progress = { ...DEFAULT_PROGRESS, pvpWinStreak: 2 };
    
    const result = applyMatchProgress(
      progress,
      {
        score: 130,
        tempo: 4.0,
        won: true,
        foundWords: ["YILDIZ", "BULUT", "GÜNEŞ"],
      },
      "pvp"
    );

    expect(result.pvpWinStreak).toBe(3);
    expect(result.activeStreakBoost).toBe(true);
    expect(result.cardAlbum).toBeDefined();
    expect(Array.isArray(result.cardAlbum?.ownedCardIds)).toBe(true);
  });

  // 5. Kelimematik İlerleme & Ödül Sistemi (applyKelimematikProgress)
  it("Kelimematik İlerlemesi: Skor, XP, Çip kazanımı ve rekor kaydı doğru çalışmalı", () => {
    const initialProgress = {
      ...DEFAULT_PROGRESS,
      xp: 100,
      coins: 50,
      bestKelimematikScore: 250,
    };

    // 400 puanlık yeni rekor maç
    const res = applyKelimematikProgress(
      initialProgress,
      400,
      8,
      3,
      ["KİTAP", "GÜNEŞ", "KALEM"]
    );

    expect(res.isNewHighScore).toBe(true);
    expect(res.xpGained).toBe(80); // 400 / 5 = 80 XP
    expect(res.coinsGained).toBe(13); // Math.floor(400 / 30) = 13 Çip
    expect(res.updatedProgress.xp).toBe(180);
    expect(res.updatedProgress.coins).toBe(63);
    expect(res.updatedProgress.bestKelimematikScore).toBe(400);
    expect(res.updatedProgress.matches).toBe(1);

    // Keşfedilen kelimeler listesine eklenmeli
    expect(res.updatedProgress.discoveredWords).toContain("KİTAP");
    expect(res.updatedProgress.discoveredWords).toContain("GÜNEŞ");
    expect(res.updatedProgress.discoveredWords).toContain("KALEM");

    // Maç geçmişine arcade/kelimematik olarak eklenmeli
    expect(res.updatedProgress.matchHistory?.[0]?.mode).toBe("arcade");
    expect(res.updatedProgress.matchHistory?.[0]?.myScore).toBe(400);
    expect(res.updatedProgress.matchHistory?.[0]?.won).toBe(true);
  });

  it("Kelimematik İlerlemesi: Daha düşük skorda rekor kırılmamalı ve çip limiti korunmalı", () => {
    const progressWithHighRecord = {
      ...DEFAULT_PROGRESS,
      bestKelimematikScore: 800,
    };

    // 1500 puanlık devasa skor (çip tavanı 35)
    const res = applyKelimematikProgress(progressWithHighRecord, 1500, 20, 5);
    expect(res.isNewHighScore).toBe(true);
    expect(res.coinsGained).toBe(35); // Max cap 35
    expect(res.updatedProgress.bestKelimematikScore).toBe(1500);

    // 200 puanlık düşük skor (rekor kırılmamalı)
    const lowRes = applyKelimematikProgress(res.updatedProgress, 200, 3, 1);
    expect(lowRes.isNewHighScore).toBe(false);
    expect(lowRes.updatedProgress.bestKelimematikScore).toBe(1500);
  });
});

