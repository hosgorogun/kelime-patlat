import {
  CatalogMission,
  getDailyMissions,
  getWeeklyMissions,
} from "../missions-catalog";
import { getDayId, getWeekId } from "./date-utils";
import { MILESTONE_REWARDS, PlayerProgress } from "./progression.types";

export function updateMissionAction(
  missions: Record<string, number>,
  activeMissions: CatalogMission[],
  actionType: string,
  increment: number = 1,
  param?: number
): Record<string, number> {
  const nextMissions = { ...missions };
  for (const m of activeMissions) {
    if (m.actionType === actionType) {
      if (m.param !== undefined) {
        if (actionType === "duel_play" || actionType === "duel_win") {
          // Düello tahta boyutu (4x4, 6x6, 8x8, 10x10)
          if (m.param === 8 && param !== undefined && param >= 8) {
            nextMissions[m.id] = (nextMissions[m.id] ?? 0) + increment;
          } else if (param !== undefined && param === m.param) {
            nextMissions[m.id] = (nextMissions[m.id] ?? 0) + increment;
          }
        } else if (param !== undefined && param >= m.param) {
          nextMissions[m.id] = (nextMissions[m.id] ?? 0) + increment;
        }
      } else {
        nextMissions[m.id] = (nextMissions[m.id] ?? 0) + increment;
      }
    }
  }
  return nextMissions;
}

export function reconcileMissions(progress: PlayerProgress, todayId: string, weekId: string): PlayerProgress {
  let updated = { ...progress };

  if (updated.missionsDate !== todayId) {
    // Reset daily mission counters and claimed state
    const nextMissions = { ...(updated.missions || {}) };
    // Clear old legacy keys
    nextMissions.daily = 0;
    nextMissions.duels = 0;
    nextMissions.wordsmith = 0;
    // Clear previous daily catalog keys (starting with d_)
    Object.keys(nextMissions).forEach((k) => {
      if (k.startsWith("d_")) {
        delete nextMissions[k];
      }
    });
    // Initialize today's active missions to 0
    const dailyMissions = getDailyMissions(todayId);
    dailyMissions.forEach((m) => {
      nextMissions[m.id] = 0;
    });

    updated = {
      ...updated,
      missions: nextMissions,
      dailyClaimed: {},
      missionsDate: todayId,
    };
  }

  if (updated.weeklyMissionsWeek !== weekId) {
    const nextMissions = { ...(updated.missions || {}) };
    // Clear previous weekly catalog keys (starting with w_)
    Object.keys(nextMissions).forEach((k) => {
      if (k.startsWith("w_")) {
        delete nextMissions[k];
      }
    });
    const weeklyMissions = getWeeklyMissions(weekId);
    weeklyMissions.forEach((m) => {
      nextMissions[m.id] = 0;
    });

    updated = {
      ...updated,
      missions: nextMissions,
      weeklyClaimed: {},
      weeklyMissionsWeek: weekId,
    };
  }

  return updated;
}

export function getUnclaimedMissionsCount(progress: PlayerProgress, todayId?: string, weekId?: string): number {
  if (!progress) return 0;
  let count = 0;

  const currentTodayId = todayId || getDayId();
  const currentWeekId = weekId || getWeekId();

  // Dynamic daily missions from pool
  const activeDaily = getDailyMissions(currentTodayId);
  let catalogDailyClaimedOrDone = false;
  for (const mission of activeDaily) {
    const current = progress.missions?.[mission.id] ?? 0;
    const isDone = current >= mission.target;
    const isClaimed = Boolean(progress.dailyClaimed?.[mission.id]);
    if (isDone && !isClaimed) {
      count++;
      catalogDailyClaimedOrDone = true;
    }
  }

  // Legacy daily missions fallback for tests and old progress format:
  if (!catalogDailyClaimedOrDone && !progress.missionsDate) {
    for (const key of ["daily", "duels", "wordsmith"] as const) {
      const target = key === "duels" ? 2 : 1;
      const current = progress.missions?.[key] ?? 0;
      const isDone = current >= target;
      const isClaimed = Boolean(progress.dailyClaimed?.[key]);
      if (isDone && !isClaimed) {
        count++;
      }
    }
  }

  // Dynamic weekly missions from pool
  const activeWeekly = getWeeklyMissions(currentWeekId);
  let catalogWeeklyClaimedOrDone = false;
  for (const mission of activeWeekly) {
    const current = progress.missions?.[mission.id] ?? 0;
    const isDone = current >= mission.target;
    const isClaimed = Boolean(progress.weeklyClaimed?.[mission.id]);
    if (isDone && !isClaimed) {
      count++;
      catalogWeeklyClaimedOrDone = true;
    }
  }

  // Legacy weekly fallbacks for tests and old progress format ONLY (when not using catalog weekly missions):
  if (!catalogWeeklyClaimedOrDone && !progress.weeklyMissionsWeek) {
    if (progress.wins >= 3 && !progress.weeklyClaimed?.victoryStreak) {
      count++;
    }
    if ((progress.bestArcadeScore || 0) >= 400 && !progress.weeklyClaimed?.speedDemon) {
      count++;
    }
  }

  return count;
}

export function getUnclaimedMilestonesCount(progress: PlayerProgress, unlockedLevel = 1): number {
  if (!progress) return 0;
  let count = 0;
  for (const milestone of MILESTONE_REWARDS) {
    const isUnlocked = unlockedLevel > milestone.level;
    const isClaimed = Boolean(progress.claimedMilestones?.[milestone.level]);
    if (isUnlocked && !isClaimed) {
      count++;
    }
  }
  return count;
}
