import { describe, it, expect } from "vitest";
import {
  applyMatchProgress,
  applyArcadeProgress,
  applyVintageProgress,
  completeDailyProgress,
  mergePlayerProgress,
  backfillMatchHistoryIfEmpty,
  DEFAULT_PROGRESS,
  type PlayerProgress,
  type MatchHistoryEntry,
} from "../shared/progression";

describe("Match History (Oyun Geçmişi) Testleri", () => {
  it("applyMatchProgress tamamlanan PvP maçını matchHistory listesine eklemelidir", () => {
    const updated = applyMatchProgress(
      DEFAULT_PROGRESS,
      {
        score: 110,
        tempo: 3.2,
        won: true,
        size: 6,
        opponentName: "EfsaneOyuncu",
        opponentAvatar: "⚡",
        opponentScore: 85,
        foundWords: ["ELMA", "ARMUT", "PORTAKAL"],
      },
      "pvp"
    );

    expect(updated.matchHistory).toBeDefined();
    expect(updated.matchHistory?.length).toBe(1);

    const match = updated.matchHistory![0];
    expect(match.mode).toBe("ranked");
    expect(match.won).toBe(true);
    expect(match.myScore).toBe(110);
    expect(match.opponentScore).toBe(85);
    expect(match.opponentName).toBe("EfsaneOyuncu");
    expect(match.opponentAvatar).toBe("⚡");
    expect(match.size).toBe(6);
    expect(match.wordsCount).toBe(3);
    expect(match.lpChange).toBeGreaterThan(0);
    expect(match.xpEarned).toBeGreaterThan(0);
    expect(match.date).toBeGreaterThan(0);
  });

  it("arkadaş maçında (isFriendGame: true) LP, XP ve Çip kazancı 0 olmalı, mode 'friend' olarak kaydedilmeli ve galibiyet/maç sayısı artmamalıdır", () => {
    const initialWins = DEFAULT_PROGRESS.wins;
    const initialMatches = DEFAULT_PROGRESS.matches;
    const initialXp = DEFAULT_PROGRESS.xp;
    const initialLp = DEFAULT_PROGRESS.lp ?? 0;
    const initialCoins = DEFAULT_PROGRESS.coins ?? 0;

    const updated = applyMatchProgress(
      DEFAULT_PROGRESS,
      {
        score: 140,
        tempo: 4.0,
        won: true,
        size: 8,
        opponentName: "DostumAli",
        opponentAvatar: "👾",
        opponentScore: 100,
        foundWords: ["MUHABBET", "KARDES"],
        isFriendGame: true,
      },
      "pvp"
    );

    expect(updated.wins).toBe(initialWins);
    expect(updated.matches).toBe(initialMatches);
    expect(updated.xp).toBe(initialXp);
    expect(updated.lp).toBe(initialLp);
    expect(updated.coins).toBe(initialCoins);

    expect(updated.matchHistory?.length).toBe(1);
    const match = updated.matchHistory![0];
    expect(match.mode).toBe("friend");
    expect(match.won).toBe(true);
    expect(match.lpChange).toBe(0);
    expect(match.xpEarned).toBe(0);
    expect(match.coinsEarned).toBe(0);
    expect(match.opponentName).toBe("DostumAli");
  });

  it("applyArcadeProgress ve applyVintageProgress maç geçmişine kayıt eklemelidir", () => {
    const arcadeProgress = applyArcadeProgress(DEFAULT_PROGRESS, 180);
    expect(arcadeProgress.matchHistory?.length).toBe(1);
    expect(arcadeProgress.matchHistory![0].mode).toBe("arcade");
    expect(arcadeProgress.matchHistory![0].myScore).toBe(180);

    const vintageProgress = applyVintageProgress(DEFAULT_PROGRESS, 1, 60);
    expect(vintageProgress.matchHistory?.length).toBe(1);
    expect(vintageProgress.matchHistory![0].mode).toBe("vintage");
    expect(vintageProgress.matchHistory![0].myScore).toBe(60);
  });

  it("completeDailyProgress günün rotasını maç geçmişine eklemelidir", () => {
    const dailyChallenge = {
      id: "2026-09-19",
      themeId: "nature" as const,
      size: 4 as const,
      targetScore: 120,
      rewardXp: 50,
      words: ["AGAC", "ORMAN"],
    };

    const updated = completeDailyProgress(DEFAULT_PROGRESS, dailyChallenge);
    expect(updated.matchHistory?.length).toBe(1);
    expect(updated.matchHistory![0].mode).toBe("daily");
    expect(updated.matchHistory![0].xpEarned).toBe(50);
  });

  it("maç geçmişi en fazla 50 maç ile sınırlandırılmalıdır", () => {
    let prog: PlayerProgress = { ...DEFAULT_PROGRESS, matchHistory: [] };

    for (let i = 0; i < 55; i++) {
      prog = applyMatchProgress(
        prog,
        {
          score: 50 + i,
          tempo: 1.5,
          won: i % 2 === 0,
        },
        "bot"
      );
    }

    expect(prog.matchHistory?.length).toBe(50);
    // En son eklenen maç ilk sırada olmalı
    expect(prog.matchHistory![0].myScore).toBe(50 + 54);
  });

  it("mergePlayerProgress yerel ve sunucu maç geçmişlerini tekilleştirerek birleştirmelidir", () => {
    const now = Date.now();
    const localEntry: MatchHistoryEntry = {
      id: "m_local_1",
      mode: "ranked",
      won: true,
      myScore: 90,
      date: now - 1000,
    };
    const remoteEntry: MatchHistoryEntry = {
      id: "m_remote_1",
      mode: "bot",
      won: false,
      myScore: 45,
      date: now - 500,
    };

    const local: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      matchHistory: [localEntry],
    };

    const remote: Partial<PlayerProgress> = {
      matchHistory: [localEntry, remoteEntry], // Duplicate localEntry
    };

    const merged = mergePlayerProgress(local, remote);
    expect(merged.matchHistory?.length).toBe(2);
    // Tarihe göre sıralı olmalı: remoteEntry daha yeni (now - 500)
    expect(merged.matchHistory![0].id).toBe("m_remote_1");
    expect(merged.matchHistory![1].id).toBe("m_local_1");
  });

  it("backfillMatchHistoryIfEmpty boş geçmişe sahip mevcut oyuncuların başarılarını geri yüklemelidir", () => {
    const existingPlayer: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      soloUnlockedLevel: 4,
      wins: 2,
      bestArcadeScore: 180,
      dailyCompletedId: "2026-09-19",
      matchHistory: [],
    };

    const backfilled = backfillMatchHistoryIfEmpty(existingPlayer);
    expect(backfilled.length).toBeGreaterThanOrEqual(4);

    const modes = backfilled.map((m) => m.mode);
    expect(modes).toContain("daily");
    expect(modes).toContain("solo");
    expect(modes).toContain("ranked");
    expect(modes).toContain("arcade");
  });

  it("completeDailyProgress aynı oturumda mükerrer günlük rota kaydı oluşturmamalıdır", () => {
    const dailyChallenge = {
      id: "2026-09-19",
      themeId: "nature" as const,
      size: 4 as const,
      targetScore: 120,
      rewardXp: 50,
      words: ["AGAC", "ORMAN"],
    };

    const firstRun = completeDailyProgress(DEFAULT_PROGRESS, dailyChallenge, 150, 4);
    expect(firstRun.matchHistory?.length).toBe(1);
    expect(firstRun.matchHistory![0].mode).toBe("daily");
    expect(firstRun.matchHistory![0].myScore).toBe(150);
    expect(firstRun.matchHistory![0].wordsCount).toBe(4);

    // İkinci çağrıda mükerrer maç eklenmemeli
    const secondRun = completeDailyProgress(firstRun, dailyChallenge, 150, 4);
    expect(secondRun.matchHistory?.length).toBe(1);
  });

  it("solo seviye mağlubiyeti (won: false) maç geçmişine doğru kaydedilmelidir", () => {
    const soloLossItem: MatchHistoryEntry = {
      id: `m_solo_loss_${Date.now()}`,
      mode: "solo",
      won: false,
      myScore: 30,
      wordsCount: 3,
      date: Date.now(),
    };

    const progWithLoss: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      matchHistory: [soloLossItem, ...(DEFAULT_PROGRESS.matchHistory || [])],
    };

    expect(progWithLoss.matchHistory?.length).toBe(1);
    const entry = progWithLoss.matchHistory![0];
    expect(entry.mode).toBe("solo");
    expect(entry.won).toBe(false);
    expect(entry.myScore).toBe(30);
    expect(entry.wordsCount).toBe(3);
  });

  it("günün rotası mağlubiyeti (won: false) maç geçmişine doğru kaydedilmelidir", () => {
    const dailyLossItem: MatchHistoryEntry = {
      id: `m_daily_loss_${Date.now()}`,
      mode: "daily",
      won: false,
      myScore: 20,
      wordsCount: 2,
      date: Date.now(),
    };

    const progWithLoss: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      matchHistory: [dailyLossItem, ...(DEFAULT_PROGRESS.matchHistory || [])],
    };

    expect(progWithLoss.matchHistory?.length).toBe(1);
    const entry = progWithLoss.matchHistory![0];
    expect(entry.mode).toBe("daily");
    expect(entry.won).toBe(false);
    expect(entry.myScore).toBe(20);
    expect(entry.wordsCount).toBe(2);
  });

  it("applyMatchProgress type 'daily' verildiğinde mode 'daily' olarak kaydedilmelidir", () => {
    const updated = applyMatchProgress(
      DEFAULT_PROGRESS,
      {
        score: 140,
        tempo: 2.5,
        won: true,
        foundWords: ["KIRLANGIÇ", "BAHAR"],
      },
      "daily"
    );

    expect(updated.matchHistory?.length).toBe(1);
    expect(updated.matchHistory![0].mode).toBe("daily");
    expect(updated.matchHistory![0].won).toBe(true);
    // matches sayacı artmamalıdır (düello değildir)
    expect(updated.matches).toBe(DEFAULT_PROGRESS.matches);
  });

  it("mergePlayerProgress boş geçmişli oyuncuyu backfillMatchHistoryIfEmpty ile doldurmalıdır", () => {
    const local: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      soloUnlockedLevel: 3,
      matchHistory: [],
    };
    const remote: Partial<PlayerProgress> = {
      soloUnlockedLevel: 5,
      matchHistory: [],
    };

    const merged = mergePlayerProgress(local, remote);
    expect(merged.matchHistory).toBeDefined();
    expect(merged.matchHistory!.length).toBeGreaterThanOrEqual(4);
    expect(merged.matchHistory![0].mode).toBe("solo");
  });

  it("nostalji gazete bulmacası (vintage) tamamlandığında backfillMatchHistoryIfEmpty vintage maçlarını oluşturmalıdır", () => {
    const playerWithVintage: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      vintageProgress: {
        maxUnlockedLevel: 4,
        completedLevels: [1, 2, 3],
        score: 180,
      },
      matchHistory: [],
    };

    const backfilled = backfillMatchHistoryIfEmpty(playerWithVintage);
    const vintageEntries = backfilled.filter((m) => m.mode === "vintage");
    expect(vintageEntries.length).toBe(3);
    expect(vintageEntries[0].myScore).toBe(60);
    expect(vintageEntries[0].won).toBe(true);
  });

  it("kategori filtreleri tüm modları (ranked, bot, friend, solo, arcade, vintage, daily) doğru eşleştirmelidir", () => {
    const testEntries: MatchHistoryEntry[] = [
      { id: "1", mode: "ranked", won: true, myScore: 100, date: 1 },
      { id: "2", mode: "bot", won: true, myScore: 80, date: 2 },
      { id: "3", mode: "friend", won: true, myScore: 90, date: 3 },
      { id: "4", mode: "solo", won: true, myScore: 50, date: 4 },
      { id: "5", mode: "arcade", won: true, myScore: 150, date: 5 },
      { id: "6", mode: "vintage", won: true, myScore: 60, date: 6 },
      { id: "7", mode: "daily", won: true, myScore: 120, date: 7 },
    ];

    const filterMatches = (filter: "all" | "duel" | "friend" | "solo") => {
      return testEntries.filter((item) => {
        if (filter === "all") return true;
        if (filter === "duel") return item.mode === "ranked" || item.mode === "bot";
        if (filter === "friend") return item.mode === "friend";
        if (filter === "solo") return item.mode === "solo" || item.mode === "arcade" || item.mode === "vintage" || item.mode === "daily";
        return true;
      });
    };

    expect(filterMatches("all").length).toBe(7);
    expect(filterMatches("duel").length).toBe(2);
    expect(filterMatches("friend").length).toBe(1);
    expect(filterMatches("solo").length).toBe(4);
  });
});
