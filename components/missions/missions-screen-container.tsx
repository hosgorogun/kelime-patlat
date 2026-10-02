import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "@/components/shell/main-shell";
import { MissionsScreen } from "./missions-screen";
import type { PlayerProgress } from "@/shared/progression";

export interface MissionsScreenContainerProps {
  progress: PlayerProgress;
  unclaimedMissions: number;
  hasClaimableDailyReward: boolean;
  onNavigate: (destination: any) => void;
  claimMissionOnServer: (type: "daily" | "weekly", missionId: string, updater: (curr: PlayerProgress) => PlayerProgress) => void;
}

export function MissionsScreenContainer({
  progress,
  unclaimedMissions,
  hasClaimableDailyReward,
  onNavigate,
  claimMissionOnServer,
}: MissionsScreenContainerProps) {
  return (
    <MainShell
      active="missions"
      onNavigate={onNavigate}
      missionsBadgeCount={unclaimedMissions}
      storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
    >
      <StatusBar style="dark" />
      <MissionsScreen
        progress={progress}
        onBack={() => onNavigate("home")}
        onPlayDaily={() => onNavigate("daily-lobby")}
        onNavigate={onNavigate}
        onClaimDaily={(missionId, xp, coins) => {
          claimMissionOnServer("daily", missionId, (current) => ({
            ...current,
            xp: current.xp + xp,
            coins: (current.coins ?? 0) + coins,
            dailyClaimed: { ...(current.dailyClaimed || {}), [missionId]: true },
          }));
        }}
        onClaimWeekly={(missionId, xp, shield, coins) => {
          claimMissionOnServer("weekly", missionId, (current) => ({
            ...current,
            xp: current.xp + xp,
            streakShields: (current.streakShields || 0) + (shield || 0),
            coins: (current.coins ?? 0) + (coins || 0),
            weeklyClaimed: { ...(current.weeklyClaimed || {}), [missionId]: true },
          }));
        }}
      />
    </MainShell>
  );
}
