import { MAX_LIVES } from "../lives-economy";
import {
  DEFAULT_PROGRESS,
  GenderType,
  MatchHistoryEntry,
  PlayerProgress,
} from "./progression.types";

export function backfillMatchHistoryIfEmpty(progress: PlayerProgress): MatchHistoryEntry[] {
  if (Array.isArray(progress.matchHistory) && progress.matchHistory.length > 0) {
    return progress.matchHistory;
  }
  const entries: MatchHistoryEntry[] = [];
  const now = Date.now();

  // 1. Günün Rotası (Eğer tamamlanmışsa)
  if (progress.dailyCompletedId) {
    entries.push({
      id: `m_backfill_daily_${progress.dailyCompletedId}`,
      mode: "daily",
      won: true,
      myScore: 120,
      xpEarned: 50,
      coinsEarned: 5,
      wordsCount: 5,
      date: now - 35 * 60 * 1000,
    });
  }

  // 2. Solo Seviyeler (Mevcut açık seviyeye kadar önceki tamamlanan seviyeler)
  const soloLevel = progress.soloUnlockedLevel ?? 1;
  if (soloLevel > 1) {
    const count = Math.min(5, soloLevel - 1);
    for (let i = 0; i < count; i++) {
      const lvl = soloLevel - 1 - i;
      entries.push({
        id: `m_backfill_solo_${lvl}`,
        mode: "solo",
        won: true,
        myScore: lvl * 14,
        xpEarned: 15,
        coinsEarned: 3,
        wordsCount: Math.min(6, 2 + Math.floor(lvl / 2)),
        date: now - (i + 1) * 50 * 60 * 1000,
      });
    }
  }

  // 3. Skor Hücumu (Arcade)
  const arcadeScore = progress.bestArcadeScore ?? 0;
  if (arcadeScore > 0) {
    entries.push({
      id: `m_backfill_arcade_${arcadeScore}`,
      mode: "arcade",
      won: arcadeScore >= 50,
      myScore: arcadeScore,
      xpEarned: Math.max(5, Math.floor(arcadeScore / 10)),
      coinsEarned: Math.floor(arcadeScore / 40),
      wordsCount: Math.max(1, Math.floor(arcadeScore / 15)),
      date: now - 2 * 60 * 60 * 1000,
    });
  }

  // 4. Düello Galibiyetleri
  const wins = progress.wins ?? 0;
  if (wins > 0) {
    const count = Math.min(3, wins);
    for (let i = 0; i < count; i++) {
      entries.push({
        id: `m_backfill_ranked_${i}`,
        mode: "ranked",
        won: true,
        myScore: 110 + i * 5,
        opponentScore: 75 - i * 5,
        opponentName: i === 0 ? "Siber Şampiyon" : "Rakip Oyuncu",
        opponentAvatar: "⚡",
        lpChange: 25,
        xpEarned: 35,
        coinsEarned: 10,
        wordsCount: 5,
        date: now - (i + 1) * 3 * 60 * 60 * 1000,
      });
    }
  }

  // 5. Gazete Bulmacası (Vintage)
  const vintageCompleted = progress.vintageProgress?.completedLevels ?? [];
  if (vintageCompleted.length > 0) {
    vintageCompleted.slice(-3).reverse().forEach((lvl, idx) => {
      entries.push({
        id: `m_backfill_vintage_${lvl}`,
        mode: "vintage",
        won: true,
        myScore: 60,
        xpEarned: 60,
        coinsEarned: 6,
        wordsCount: 1,
        date: now - (idx + 1) * 4 * 60 * 60 * 1000,
      });
    });
  }

  return entries.sort((a, b) => b.date - a.date).slice(0, 50);
}

export function mergePlayerProgress(
  local: PlayerProgress,
  remote?: Partial<PlayerProgress> | null,
  options?: { preferRemoteBalances?: boolean; addGuestBalances?: boolean }
): PlayerProgress {
  if (!remote) return local;
  const safeNum = (val: any, fallback: number, maxCap = 2_000_000_000) => {
    const num = typeof val === "number" && Number.isFinite(val) ? val : fallback;
    return Math.max(0, Math.min(maxCap, num));
  };

  const useRemoteBalances = Boolean(options?.preferRemoteBalances);
  const addGuest = Boolean(options?.addGuestBalances);

  // Filter out explicit undefined keys from remote so they don't overwrite local defined values
  const cleanRemote: Record<string, any> = {};
  for (const [k, v] of Object.entries(remote)) {
    if (v !== undefined) cleanRemote[k] = v;
  }

  // Gender resolution: priority to explicit choices ("male" | "female") over "unspecified"
  const resolveGender = (): GenderType => {
    if (local.gender && local.gender !== "unspecified") return local.gender;
    if (cleanRemote.gender && cleanRemote.gender !== "unspecified") return cleanRemote.gender;
    return local.gender || cleanRemote.gender || "unspecified";
  };

  const nextXp = addGuest
    ? safeNum((local.xp ?? 0) + (cleanRemote.xp ?? 0), local.xp)
    : safeNum(Math.max(local.xp, cleanRemote.xp ?? 0), local.xp);

  const nextLp = useRemoteBalances && cleanRemote.lp !== undefined
    ? safeNum(cleanRemote.lp, local.lp ?? 0)
    : safeNum(Math.max(local.lp ?? 0, cleanRemote.lp ?? 0), local.lp ?? 0);

  const nextCoins = addGuest
    ? safeNum((local.coins ?? 0) + (cleanRemote.coins ?? 0), local.coins ?? 0)
    : useRemoteBalances && cleanRemote.coins !== undefined
      ? safeNum(cleanRemote.coins, local.coins ?? 0)
      : safeNum(Math.max(local.coins ?? 0, cleanRemote.coins ?? 0), local.coins ?? 0);

  const nextShields = addGuest
    ? safeNum((local.streakShields ?? 0) + (cleanRemote.streakShields ?? 0), local.streakShields ?? 0, 99)
    : useRemoteBalances && cleanRemote.streakShields !== undefined
      ? safeNum(cleanRemote.streakShields, local.streakShields ?? 0, 99)
      : safeNum(Math.max(local.streakShields ?? 0, cleanRemote.streakShields ?? 0), local.streakShields ?? 0, 99);

  const nextRadar = addGuest
    ? safeNum((local.radarChargesBonus ?? 0) + (cleanRemote.radarChargesBonus ?? 0), local.radarChargesBonus ?? 0, 99)
    : useRemoteBalances && cleanRemote.radarChargesBonus !== undefined
      ? safeNum(cleanRemote.radarChargesBonus, local.radarChargesBonus ?? 0, 99)
      : safeNum(Math.max(local.radarChargesBonus ?? 0, cleanRemote.radarChargesBonus ?? 0), local.radarChargesBonus ?? 0, 99);

  const mergedSeasonHistory = (() => {
    const map = new Map<string, { seasonId: string; rank: string; lp: number; date: string }>();
    (local.seasonHistory ?? []).forEach((s) => map.set(s.seasonId, s));
    (cleanRemote.seasonHistory ?? []).forEach((s: any) => {
      const existing = map.get(s.seasonId);
      if (!existing || s.lp > existing.lp) {
        map.set(s.seasonId, s);
      }
    });
    return Array.from(map.values());
  })();

  const mergedMatchHistory = (() => {
    const map = new Map<string, MatchHistoryEntry>();
    (local.matchHistory ?? []).forEach((m) => {
      if (m && typeof m.id === "string") map.set(m.id, m);
    });
    (cleanRemote.matchHistory ?? []).forEach((m: any) => {
      if (m && typeof m.id === "string") map.set(m.id, m);
    });
    const combined = Array.from(map.values())
      .sort((a, b) => (b.date || 0) - (a.date || 0))
      .slice(0, 50);
    if (combined.length === 0) {
      return backfillMatchHistoryIfEmpty({ ...DEFAULT_PROGRESS, ...local, ...cleanRemote });
    }
    return combined;
  })();

  return {
    ...DEFAULT_PROGRESS,
    ...local,
    ...cleanRemote,
    welcomeRewardClaimed: Boolean(local.welcomeRewardClaimed || cleanRemote.welcomeRewardClaimed),
    xp: nextXp,
    lp: nextLp,
    coins: nextCoins,
    streakShields: nextShields,
    radarChargesBonus: nextRadar,
    lives: useRemoteBalances && cleanRemote.lives !== undefined
      ? safeNum(cleanRemote.lives, local.lives ?? MAX_LIVES, MAX_LIVES)
      : safeNum(typeof cleanRemote.lives === "number" && typeof local.lives === "number" ? Math.min(local.lives, cleanRemote.lives) : (cleanRemote.lives ?? local.lives ?? MAX_LIVES), MAX_LIVES, MAX_LIVES),
    lastLifeRegenTimestamp: typeof cleanRemote.lastLifeRegenTimestamp === "number" ? cleanRemote.lastLifeRegenTimestamp : (typeof local.lastLifeRegenTimestamp === "number" ? local.lastLifeRegenTimestamp : Date.now()),
    infiniteLivesUntil: Math.max(local.infiniteLivesUntil ?? 0, cleanRemote.infiniteLivesUntil ?? 0),
    lastSpinTimestamp: Math.max(local.lastSpinTimestamp ?? 0, cleanRemote.lastSpinTimestamp ?? 0),
    boosters: {
      hint: Math.max(local.boosters?.hint ?? 0, cleanRemote.boosters?.hint ?? 0),
      freeze: Math.max(local.boosters?.freeze ?? 0, cleanRemote.boosters?.freeze ?? 0),
      shuffle: Math.max(local.boosters?.shuffle ?? 0, cleanRemote.boosters?.shuffle ?? 0),
    },
    streak: safeNum(Math.max(local.streak, cleanRemote.streak ?? 0), local.streak, 3650),
    pvpWinStreak: safeNum(cleanRemote.pvpWinStreak !== undefined ? cleanRemote.pvpWinStreak : (local.pvpWinStreak ?? 0), local.pvpWinStreak ?? 0, 1000),
    wins: addGuest
      ? safeNum((local.wins ?? 0) + (cleanRemote.wins ?? 0), local.wins)
      : safeNum(Math.max(local.wins, cleanRemote.wins ?? 0), local.wins),
    matches: addGuest
      ? safeNum((local.matches ?? 0) + (cleanRemote.matches ?? 0), local.matches)
      : safeNum(Math.max(local.matches, cleanRemote.matches ?? 0), local.matches),
    bestScore: safeNum(Math.max(local.bestScore, cleanRemote.bestScore ?? 0), local.bestScore),
    bestTempo: safeNum(Math.max(local.bestTempo, cleanRemote.bestTempo ?? 0), local.bestTempo),
    bestArcadeScore: safeNum(Math.max(local.bestArcadeScore ?? 0, cleanRemote.bestArcadeScore ?? 0), local.bestArcadeScore ?? 0),
    dailyCompletedId: local.dailyCompletedId || cleanRemote.dailyCompletedId || null,
    missions: (() => {
      const mergedMissions: Record<string, number> = {
        daily: safeNum(Math.max(local.missions?.daily ?? 0, cleanRemote.missions?.daily ?? 0), local.missions?.daily ?? 0, 100),
        duels: safeNum(Math.max(local.missions?.duels ?? 0, cleanRemote.missions?.duels ?? 0), local.missions?.duels ?? 0, 100),
        wordsmith: safeNum(Math.max(local.missions?.wordsmith ?? 0, cleanRemote.missions?.wordsmith ?? 0), local.missions?.wordsmith ?? 0, 100),
      };
      const allKeys = new Set([...Object.keys(local.missions ?? {}), ...Object.keys(cleanRemote?.missions ?? {})]);
      for (const k of allKeys) {
        mergedMissions[k] = safeNum(Math.max(local.missions?.[k] ?? 0, cleanRemote?.missions?.[k] ?? 0), local.missions?.[k] ?? 0, 10000);
      }
      return mergedMissions;
    })(),
    claimedMilestones: {
      ...(cleanRemote.claimedMilestones ?? {}),
      ...(local.claimedMilestones ?? {}),
    },
    purchasedAvatars: {
      ...(cleanRemote.purchasedAvatars ?? {}),
      ...(local.purchasedAvatars ?? {}),
    },
    weeklyClaimed: {
      ...(cleanRemote.weeklyClaimed ?? {}),
      ...(local.weeklyClaimed ?? {}),
    },
    dailyClaimed: {
      ...(cleanRemote.dailyClaimed ?? {}),
      ...(local.dailyClaimed ?? {}),
    },
    history: Array.from(new Set([...(local.history ?? []), ...(cleanRemote.history ?? [])])).slice(-150),
    matchHistory: mergedMatchHistory,
    selectedAvatar: local.selectedAvatar || cleanRemote.selectedAvatar || "spark",
    selectedTheme: local.selectedTheme || cleanRemote.selectedTheme || "nature",
    selectedTitle: local.selectedTitle || cleanRemote.selectedTitle || "[ÇAYLAK]",
    gender: resolveGender(),
    avatarPhoto: local.avatarPhoto || cleanRemote.avatarPhoto,
    selectedFrame: local.selectedFrame || cleanRemote.selectedFrame || "signal",
    selectedVictoryEffect: local.selectedVictoryEffect || cleanRemote.selectedVictoryEffect || "pulse",
    ownedFrames: { ...(cleanRemote.ownedFrames ?? {}), ...(local.ownedFrames ?? {}) },
    ownedVictoryEffects: { ...(cleanRemote.ownedVictoryEffects ?? {}), ...(local.ownedVictoryEffects ?? {}) },
    selectedBoardSkin: local.selectedBoardSkin || cleanRemote.selectedBoardSkin || "grid",
    ownedBoardSkins: { ...(cleanRemote.ownedBoardSkins ?? {}), ...(local.ownedBoardSkins ?? {}) },
    soloUnlockedLevel: safeNum(Math.max(local.soloUnlockedLevel ?? 1, cleanRemote.soloUnlockedLevel ?? 1), local.soloUnlockedLevel ?? 1, 101),
    vintageProgress: {
      maxUnlockedLevel: safeNum(Math.max(local.vintageProgress?.maxUnlockedLevel ?? 1, cleanRemote.vintageProgress?.maxUnlockedLevel ?? 1), 1, 20),
      completedLevels: Array.from(new Set([
        ...(local.vintageProgress?.completedLevels ?? []),
        ...(cleanRemote.vintageProgress?.completedLevels ?? []),
      ])).sort((a, b) => a - b),
      score: safeNum(Math.max(local.vintageProgress?.score ?? 0, cleanRemote.vintageProgress?.score ?? 0), 0),
    },
    sfxEnabled: cleanRemote?.sfxEnabled ?? local.sfxEnabled ?? true,
    hapticsEnabled: cleanRemote?.hapticsEnabled ?? local.hapticsEnabled ?? true,
    lastLoginDay: local.lastLoginDay || cleanRemote?.lastLoginDay,
    loginDaysCount: safeNum(Math.max(local.loginDaysCount ?? 0, cleanRemote?.loginDaysCount ?? 0), 0),
    lastStreakCheckDate: local.lastStreakCheckDate || cleanRemote?.lastStreakCheckDate,
    missionsDate: local.missionsDate || cleanRemote?.missionsDate,
    weeklyMissionsWeek: local.weeklyMissionsWeek || cleanRemote?.weeklyMissionsWeek,
    seasonHistory: mergedSeasonHistory,
    lastSeasonResetId: local.lastSeasonResetId || cleanRemote?.lastSeasonResetId,
    friends: (() => {
      const map = new Map<string, any>();
      (local.friends ?? []).forEach((f) => map.set(f.username.toLocaleLowerCase("tr-TR"), f));
      (cleanRemote?.friends ?? []).forEach((f: any) => map.set(f.username.toLocaleLowerCase("tr-TR"), f));
      return Array.from(map.values());
    })(),
  };
}
