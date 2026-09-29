import { useState, useEffect, useMemo } from "react";
import { BOARD_SKINS, VICTORY_EFFECTS } from "../shared/store-items";
import {
  getDayId,
  getDailyChallenge,
  getCalculatedLives,
  getUnclaimedMissionsCount,
  getUnclaimedMilestonesCount,
  type PlayerProgress,
  type DailyChallenge,
} from "../shared/progression";

export interface UseProgressionStatsParams {
  progress: PlayerProgress;
  soloUnlockedLevel: number;
}

export interface UseProgressionStatsReturn {
  daily: DailyChallenge;
  livesCalc: { lives: number; nextLifeTimerSeconds: number };
  unclaimedMissions: number;
  unclaimedMilestones: number;
  hasClaimableDailyReward: boolean;
  activeBoardSkinColor: string;
  activeVictoryEffect: string;
}

export function useProgressionStats({
  progress,
  soloUnlockedLevel,
}: UseProgressionStatsParams): UseProgressionStatsReturn {
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const daily = useMemo(() => getDailyChallenge(), [ticker]);
  const livesCalc = useMemo(() => getCalculatedLives(progress), [progress, ticker]);
  const unclaimedMissions = useMemo(() => getUnclaimedMissionsCount(progress), [progress]);
  const unclaimedMilestones = useMemo(
    () => getUnclaimedMilestonesCount(progress, soloUnlockedLevel),
    [progress, soloUnlockedLevel]
  );
  const hasClaimableDailyReward = useMemo(() => {
    const todayId = getDayId();
    return progress.lastLoginDay !== todayId;
  }, [progress.lastLoginDay, ticker]);

  const activeBoardSkinColor = useMemo(() => {
    const skin = BOARD_SKINS.find((s) => s[0] === progress.selectedBoardSkin);
    return skin ? skin[2] : "#3EE8B5";
  }, [progress.selectedBoardSkin]);

  const activeVictoryEffect = useMemo(() => {
    const eff = VICTORY_EFFECTS.find((e) => e[0] === progress.selectedVictoryEffect);
    return eff ? eff[2] : "✦";
  }, [progress.selectedVictoryEffect]);

  return {
    daily,
    livesCalc,
    unclaimedMissions,
    unclaimedMilestones,
    hasClaimableDailyReward,
    activeBoardSkinColor,
    activeVictoryEffect,
  };
}
