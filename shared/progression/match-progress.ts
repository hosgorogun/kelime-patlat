import { getLeagueTier } from "../leagues";
import { getDailyMissions, getWeeklyMissions } from "../missions-catalog";
import { getDayId, getWeekId } from "./date-utils";
import { getDailyMysteryWord } from "./season-streak";
import { updateMissionAction } from "./progression-missions";
import { DailyChallenge, MatchHistoryEntry, PlayerProgress } from "./progression.types";
import { isEqualTr } from "../tr-utils";

export function applyMatchProgress(
  progress: PlayerProgress,
  result: {
    score: number;
    tempo: number;
    won: boolean;
    isDraw?: boolean;
    longWord?: boolean;
    foundWords?: string[];
    arcadeScore?: number;
    size?: number;
    opponentName?: string;
    opponentAvatar?: string;
    opponentScore?: number;
    isFriendGame?: boolean;
  },
  type: "pvp" | "bot" | "solo" | "daily" = "pvp"
) {
  const isFriend = Boolean(result.isFriendGame);
  const foundWordsList = result.foundWords || [];
  const wordsCount = foundWordsList.length;
  const hasContributed = wordsCount > 0 || (result.score || 0) > 0;

  const previousDuels = progress.missions?.duels ?? 0;
  const previousWordsmith = progress.missions?.wordsmith ?? 0;

  // AFK veya sıfır kelimeli yenilgide düello görevi ilerlemez (hile/farm önleme)
  const duelProgress = Math.min(2, previousDuels + (type !== "solo" && type !== "daily" && !isFriend && (hasContributed || result.won) ? 1 : 0));
  const hasLongWord = result.longWord || foundWordsList.some((w) => w.length >= 7);
  const wordsmithProgress = Math.min(1, previousWordsmith + (hasLongWord ? 1 : 0));
  const newHistory = [...(progress.history || []), ...foundWordsList].slice(-150);

  // --- KADEMELİ VE DİNAMİK LİG PUANI (LP) HESAPLAMASI ---
  const currentLp = Math.max(0, progress.lp ?? 0);
  const tierInfo = getLeagueTier(currentLp);
  const isHighTier = tierInfo.tier === "ELMAS" || tierInfo.tier === "YÜCELİK" || tierInfo.tier === "ÖLÜMSÜZLÜK" || tierInfo.tier === "RADIAN";
  const isEntryTier = tierInfo.tier === "DEMİR" || tierInfo.tier === "BRONZ";
  const isCrushingWin = Boolean(result.won && (result.score >= 120 || (result.tempo && result.tempo >= 3.5)));

  // Galibiyet Serisi (Win Streak) hesaplaması
  let pvpWinStreak = progress.pvpWinStreak ?? 0;
  let streakBonus = 0;
  if (type === "pvp" && !isFriend) {
    if (result.won) {
      pvpWinStreak += 1;
      if (pvpWinStreak >= 3) {
        streakBonus = 7;
      } else if (pvpWinStreak === 2) {
        streakBonus = 3;
      }
    } else if (!result.isDraw) {
      pvpWinStreak = 0;
    }
  }

  let baseXP = 0;
  let lpGain = 0;
  if (isFriend) {
    // Arkadaş maçları özel dostluk maçıdır; LP, XP ve Çip kazandırmaz
    baseXP = 0;
    lpGain = 0;
  } else if (!hasContributed && !result.won) {
    // SIFIR KELİME & YENİLGİ (AFK / Katkısız maç): Kesinlikle taban EXP verilmez, ancak lig cezası düşülür!
    baseXP = 0;
    if (type === "pvp") {
      lpGain = isEntryTier ? -10 : isHighTier ? -22 : -18;
    } else if (type === "bot") {
      lpGain = isHighTier ? -15 : -10;
    } else {
      lpGain = 0;
    }
  } else if (type === "pvp") {
    if (result.won) {
      baseXP = 25;
      lpGain = isEntryTier ? 30 : isHighTier ? 20 : 25;
      if (isCrushingWin) {
        lpGain += 5; // Ezici galibiyet bonusu
      }
      lpGain += streakBonus; // Galibiyet serisi bonusu (2. galibiyette +3 LP, 3+ galibiyette +7 LP)
    } else if (result.isDraw) {
      baseXP = 12;
      lpGain = 0;
    } else {
      // Kaybetti ama en az 1 kelime bildi veya puan üretti (çaba/teselli ödülü)
      baseXP = 5;
      lpGain = isEntryTier ? -10 : isHighTier ? -22 : -18;
    }
  } else if (type === "bot") {
    if (result.won) {
      baseXP = 15;
      lpGain = isHighTier ? 0 : isEntryTier ? 12 : 8; // Yüksek liglerde bot maçı LP vermez
    } else if (result.isDraw) {
      baseXP = 8;
      lpGain = 0;
    } else {
      // Kaybetti ama kelime bildi
      baseXP = 3;
      lpGain = isHighTier ? -15 : -10;
    }
  } else if (type === "solo") {
    // Solo modunda seviye ilerledikçe (1-100) taban XP seviyeye göre dengelenir (10 ila 35 XP)
    const soloLevelFactor = Math.min(25, Math.floor((result.score || 0) / 40));
    baseXP = hasContributed || result.won ? 10 + soloLevelFactor : 0;
    lpGain = 0;
  }

  // 2. Kelime Dağarcığı ve Harf Uzunluğu Bonusu (Harf Başı İlerleme)
  let wordLengthBonus = 0;
  if (!isFriend && (hasContributed || result.won)) {
    if (foundWordsList.length > 0) {
      foundWordsList.forEach((w) => {
        if (w.length >= 7) wordLengthBonus += 8; // 7+ Harfli efsanevi kelime
        else if (w.length >= 5) wordLengthBonus += 4; // 5-6 Harfli kelime
        else if (w.length >= 3) wordLengthBonus += 2; // 3-4 Harfli kelime
      });
      wordLengthBonus = Math.min(30, wordLengthBonus); // Maksimum uzunluk bonus tavanı: +30 XP
    } else if (result.longWord) {
      wordLengthBonus = 10;
    }
  }

  // 3. Hız ve Tempo Bonusu (Saniye ve Çözüm Hızına Göre)
  let speedBonus = 0;
  if (!isFriend && result.won && result.tempo) {
    if (result.tempo >= 3.5) speedBonus = 20; // Şimşek Hızı (< 20 saniye)
    else if (result.tempo >= 2.0) speedBonus = 10; // Seri Çözüm (< 40 saniye)
    else if (result.tempo >= 1.0) speedBonus = 5; // Normal Çözüm (< 60 saniye)
  }

  let xpGain = isFriend || (!hasContributed && !result.won)
    ? 0
    : (baseXP + wordLengthBonus + speedBonus);

  // Mission completion XP rewards (arkadaş maçında veya AFK 0 kelimede görev ilerlemez)
  if (!isFriend && (hasContributed || result.won)) {
    if (previousDuels < 2 && duelProgress >= 2) {
      xpGain += 50;
    }
    if (previousWordsmith < 1 && wordsmithProgress >= 1) {
      xpGain += 50;
    }

    // Daily Mystery Word bonus (+150 XP)
    const mystery = getDailyMysteryWord();
    if (foundWordsList.some((w) => isEqualTr(w, mystery.word))) {
      xpGain += mystery.rewardXp;
    }
  }

  // Coin earnings (Dengeli Çip İlerlemesi - arkadaş maçında veya 0 kelimeli yenilgide 0)
  let coinsEarned = 0;
  if (!isFriend && (hasContributed || result.won)) {
    if (result.won) {
      if (type === "pvp") {
        coinsEarned = isCrushingWin ? 15 : 10;
      } else if (type === "bot") {
        coinsEarned = isCrushingWin ? 6 : 4;
      } else if (type === "solo") {
        // Solo modunda zorluk seviyesi ve skora göre çip ödülü (3 ila 8 çip)
        const soloBonusChips = Math.min(5, Math.floor((result.score || 0) / 150));
        coinsEarned = 3 + soloBonusChips;
      } else {
        coinsEarned = 3;
      }
    } else if (result.isDraw) {
      coinsEarned = type === "pvp" ? 3 : 1;
    } else {
      // Kaybetti ama en az 1 kelime bildi
      coinsEarned = type === "pvp" ? 2 : 1;
    }
  }

  let nextMissions: Record<string, number> = {
    ...progress.missions,
    daily: progress.missions?.daily ?? 0,
    duels: duelProgress,
    wordsmith: wordsmithProgress,
  };

  const todayId = getDayId();
  const weekId = getWeekId();
  const activeCatalogMissions = [...getDailyMissions(todayId), ...getWeeklyMissions(weekId)];

  if (!isFriend && (hasContributed || result.won)) {
    // Update duel_play (yalnızca aktif katılım sağlayan maçlar)
    if (type !== "solo" && type !== "daily") {
      nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "duel_play", 1, result.size);
    }
    // Update duel_win
    if (result.won && type !== "solo" && type !== "daily") {
      nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "duel_win", 1, result.size);
    }
    // Update solo_progress
    if (type === "solo" && result.won) {
      nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "solo_progress", 1);
    }
    // Update word_count
    const foundWordsCount = result.foundWords?.length || (result.score > 0 ? 1 : 0);
    if (foundWordsCount > 0) {
      nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "word_count", foundWordsCount);
    }
    // Update word_length
    if (result.foundWords && result.foundWords.length > 0) {
      for (const w of result.foundWords) {
        nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "word_length", 1, w.length);
      }
    } else if (result.longWord) {
      nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "word_length", 1, 7);
    }
    // Update combo_count
    if (result.tempo && result.tempo >= 2.0) {
      const comboIncrement = result.tempo >= 3.5 ? 2 : 1;
      nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "combo_count", comboIncrement);
    }
    // Update earn_chips
    if (coinsEarned > 0) {
      nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "earn_chips", coinsEarned);
    }
  }

  const nextLp = Math.max(0, currentLp + lpGain);

  const matchHistoryItem: MatchHistoryEntry = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    mode: isFriend ? "friend" : type === "pvp" ? "ranked" : type === "bot" ? "bot" : type === "daily" ? "daily" : "solo",
    size: result.size,
    opponentName: result.opponentName,
    opponentAvatar: result.opponentAvatar,
    won: result.won,
    isDraw: result.isDraw,
    myScore: result.score,
    opponentScore: result.opponentScore,
    lpChange: isFriend ? 0 : lpGain,
    xpEarned: isFriend ? 0 : xpGain,
    coinsEarned: isFriend ? 0 : coinsEarned,
    wordsCount: (result.foundWords || []).length,
    date: Date.now(),
  };

  const updatedMatchHistory = [matchHistoryItem, ...(progress.matchHistory || [])].slice(0, 50);

  const effectiveLpChange = isFriend ? 0 : (nextLp - currentLp);

  return {
    ...progress,
    xp: progress.xp + xpGain,
    lp: nextLp,
    coins: (progress.coins ?? 0) + coinsEarned,
    pvpWinStreak: type === "pvp" && !isFriend ? pvpWinStreak : (progress.pvpWinStreak ?? 0),
    wins: progress.wins + (result.won && !isFriend ? 1 : 0),
    matches: progress.matches + (type !== "solo" && type !== "daily" && !isFriend ? 1 : 0),
    bestScore: Math.max(progress.bestScore, result.score),
    bestTempo: Math.max(progress.bestTempo, result.tempo),
    bestArcadeScore: Math.max(progress.bestArcadeScore || 0, result.arcadeScore || 0),
    missions: nextMissions,
    history: newHistory,
    matchHistory: updatedMatchHistory,
    lastMatchReward: {
      xp: xpGain,
      lp: effectiveLpChange,
      coins: coinsEarned,
      streakBonus,
      pvpWinStreak: type === "pvp" && !isFriend ? pvpWinStreak : undefined,
      isCrushingWin,
    },
  };
}

export function applyArcadeProgress(
  progress: PlayerProgress,
  score: number,
  wordsCount?: number,
  isDoubled: boolean = false,
  comboCount?: number,
  foundWords?: string[]
) {
  const newBest = Math.max(progress.bestArcadeScore || 0, score);
  const baseXP = Math.max(5, Math.floor(score / 10));
  const baseCoins = Math.floor(score / 40);
  const xpGain = baseXP;
  const coinsGain = baseCoins;

  const actualWordsCount = typeof wordsCount === "number" && wordsCount > 0
    ? wordsCount
    : (foundWords?.length || Math.max(1, Math.floor(score / 15)));

  const activeCatalog = [...getDailyMissions(getDayId()), ...getWeeklyMissions(getWeekId())];
  let nextMissions = progress.missions || {};

  // 2X Reklam Ödülü: İkinci bir mükerrer maç geçmişi kaydı oluşturmak yerine
  // son arcade kaydını günceller ve fazladan XP/Çip kazancını ekler.
  if (isDoubled) {
    if (coinsGain > 0) {
      nextMissions = updateMissionAction(nextMissions, activeCatalog, "earn_chips", coinsGain);
    }
    const history = [...(progress.matchHistory || [])];
    const latestArcadeIdx = history.findIndex((h) => h.mode === "arcade");
    if (latestArcadeIdx !== -1 && history[latestArcadeIdx]) {
      const prev = history[latestArcadeIdx]!;
      history[latestArcadeIdx] = {
        ...prev,
        xpEarned: (prev.xpEarned || baseXP) + xpGain,
        coinsEarned: (prev.coinsEarned || baseCoins) + coinsGain,
      };
    }
    return {
      ...progress,
      xp: progress.xp + xpGain,
      coins: (progress.coins ?? 0) + coinsGain,
      bestArcadeScore: newBest,
      missions: nextMissions,
      matchHistory: history,
    };
  }

  nextMissions = updateMissionAction(nextMissions, activeCatalog, "arcade_score", score);
  nextMissions = updateMissionAction(nextMissions, activeCatalog, "word_count", actualWordsCount);
  if (coinsGain > 0) {
    nextMissions = updateMissionAction(nextMissions, activeCatalog, "earn_chips", coinsGain);
  }
  if (comboCount && comboCount > 0) {
    nextMissions = updateMissionAction(nextMissions, activeCatalog, "combo_count", comboCount);
  }
  if (foundWords && foundWords.length > 0) {
    for (const w of foundWords) {
      nextMissions = updateMissionAction(nextMissions, activeCatalog, "word_length", 1, w.length);
    }
  }

  const arcadeHistoryItem: MatchHistoryEntry = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    mode: "arcade",
    won: score >= 50,
    myScore: score,
    xpEarned: xpGain,
    coinsEarned: coinsGain,
    wordsCount: actualWordsCount,
    date: Date.now(),
  };

  const newHistory = foundWords && foundWords.length > 0
    ? [...(progress.history || []), ...foundWords].slice(-150)
    : (progress.history || []);

  return {
    ...progress,
    xp: progress.xp + xpGain,
    coins: (progress.coins ?? 0) + coinsGain,
    bestArcadeScore: newBest,
    missions: nextMissions,
    history: newHistory,
    matchHistory: [arcadeHistoryItem, ...(progress.matchHistory || [])].slice(0, 50),
  };
}

export function applyVintageProgress(
  progress: PlayerProgress,
  level: number,
  score: number = 30,
  wordsCount: number = 5,
  foundWords?: string[]
): PlayerProgress {
  const xpGain = score;
  const coinsGain = Math.max(2, Math.floor(score / 10));
  const activeCatalog = [...getDailyMissions(getDayId()), ...getWeeklyMissions(getWeekId())];
  let nextMissions = updateMissionAction(progress.missions || {}, activeCatalog, "vintage_solve", 1);
  const actualWordsCount = wordsCount || foundWords?.length || 5;
  nextMissions = updateMissionAction(nextMissions, activeCatalog, "word_count", actualWordsCount);
  if (coinsGain > 0) {
    nextMissions = updateMissionAction(nextMissions, activeCatalog, "earn_chips", coinsGain);
  }
  if (foundWords && foundWords.length > 0) {
    for (const w of foundWords) {
      nextMissions = updateMissionAction(nextMissions, activeCatalog, "word_length", 1, w.length);
    }
  }

  const currentVintage = progress.vintageProgress;
  const nextMaxUnlocked = Math.min(20, Math.max(currentVintage?.maxUnlockedLevel ?? 1, level + 1));
  const nextCompleted = Array.from(new Set([...(currentVintage?.completedLevels ?? []), level])).sort((a, b) => a - b);
  const nextScore = (currentVintage?.score ?? 0) + (score >= 100 ? score : 100);

  const vintageHistoryItem: MatchHistoryEntry = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    mode: "vintage",
    won: true,
    myScore: score,
    xpEarned: xpGain,
    coinsEarned: coinsGain,
    wordsCount: actualWordsCount,
    date: Date.now(),
  };

  const newHistory = foundWords && foundWords.length > 0
    ? [...(progress.history || []), ...foundWords].slice(-150)
    : (progress.history || []);

  return {
    ...progress,
    xp: progress.xp + xpGain,
    coins: (progress.coins ?? 0) + coinsGain,
    missions: nextMissions,
    history: newHistory,
    vintageProgress: {
      maxUnlockedLevel: nextMaxUnlocked,
      completedLevels: nextCompleted,
      score: nextScore,
    },
    matchHistory: [vintageHistoryItem, ...(progress.matchHistory || [])].slice(0, 50),
  };
}

export function completeDailyProgress(
  progress: PlayerProgress,
  daily: DailyChallenge,
  score?: number,
  wordsCount?: number,
  foundWords?: string[]
) {
  if (progress.dailyCompletedId === daily.id && (progress.missions?.daily ?? 0) >= 1) return progress;
  const activeCatalog = [...getDailyMissions(daily.id), ...getWeeklyMissions(getWeekId())];
  let updatedMissions = updateMissionAction({ ...progress.missions, daily: 1 }, activeCatalog, "daily_route", 1);
  const effectiveWordsCount = wordsCount ?? (foundWords?.length || daily.words?.length || 5);
  if (effectiveWordsCount > 0) {
    updatedMissions = updateMissionAction(updatedMissions, activeCatalog, "word_count", effectiveWordsCount);
  }
  updatedMissions = updateMissionAction(updatedMissions, activeCatalog, "earn_chips", 5);
  if (foundWords && foundWords.length > 0) {
    for (const w of foundWords) {
      updatedMissions = updateMissionAction(updatedMissions, activeCatalog, "word_length", 1, w.length);
    }
  }

  const alreadyHasDaily = progress.matchHistory?.[0]?.mode === "daily" && Date.now() - (progress.matchHistory[0].date || 0) < 5000;

  const dailyHistoryItem: MatchHistoryEntry = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    mode: "daily",
    won: true,
    myScore: score || daily.targetScore || 100,
    xpEarned: daily.rewardXp,
    coinsEarned: 5,
    wordsCount: effectiveWordsCount,
    date: Date.now(),
  };

  const nextHistory = alreadyHasDaily
    ? (progress.matchHistory || [])
    : [dailyHistoryItem, ...(progress.matchHistory || [])].slice(0, 50);

  const wordsForDailyHistory = foundWords || daily.words || [];
  const updatedHistory = wordsForDailyHistory.length > 0
    ? [...(progress.history || []), ...wordsForDailyHistory].slice(-150)
    : (progress.history || []);

  return {
    ...progress,
    xp: progress.xp + daily.rewardXp,
    coins: (progress.coins ?? 0) + 5,
    dailyCompletedId: daily.id,
    lastStreakCheckDate: daily.id,
    streak: progress.streak + 1,
    missions: updatedMissions,
    history: updatedHistory,
    matchHistory: nextHistory,
  };
}
