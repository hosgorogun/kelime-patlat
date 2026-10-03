import React, { createContext, useContext } from "react";
import type { PlayerProgress, DailyChallenge } from "@/shared/progression";
import type { LeaderboardEntry } from "@/shared/game";

export interface ProgressionContextValue {
  progress: PlayerProgress;
  progressRef: React.MutableRefObject<PlayerProgress>;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  progressReady: boolean;
  syncProgressToCloud: (progress: PlayerProgress) => Promise<void>;
  awardProgressOnServer: (award: any) => Promise<any>;
  claimMilestoneOnServer: (
    level: number,
    fallback: (current: PlayerProgress) => PlayerProgress
  ) => Promise<void>;
  claimMissionOnServer: (
    kind: "daily" | "weekly",
    missionId: string,
    fallback: (current: PlayerProgress) => PlayerProgress
  ) => Promise<void>;
  leaderboard: LeaderboardEntry[];
  setLeaderboard: React.Dispatch<React.SetStateAction<LeaderboardEntry[]>>;
  soloUnlockedLevel: number;
  setSoloUnlockedLevel: (level: number) => void;
  daily: DailyChallenge;
  livesCalc: { lives: number; nextLifeTimerSeconds: number };
  unclaimedMissions: number;
  unclaimedMilestones: number;
  hasClaimableDailyReward: boolean;
  activeBoardSkinColor: string;
  activeVictoryEffect: string;
  reconnectGameSocket: () => void;
}

const ProgressionContext = createContext<ProgressionContextValue | null>(null);

export function ProgressionProvider({
  value,
  children,
}: {
  value: ProgressionContextValue;
  children: React.ReactNode;
}) {
  return (
    <ProgressionContext.Provider value={value}>
      {children}
    </ProgressionContext.Provider>
  );
}

export function useProgression(): ProgressionContextValue {
  const ctx = useContext(ProgressionContext);
  if (!ctx) {
    throw new Error("useProgression must be used within a ProgressionProvider");
  }
  return ctx;
}
