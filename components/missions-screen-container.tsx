import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "./main-shell";
import { MissionsScreen } from "./missions-screen";
import type { PlayerProgress } from "../shared/progression";
import type { ToastData } from "./global-game-toast";
import type { BoardSize } from "../shared/game";

export interface MissionsScreenContainerProps {
  progress: PlayerProgress;
  unclaimedMissions: number;
  hasClaimableDailyReward: boolean;
  globalToast: ToastData | null;
  setGlobalToast: (toast: ToastData | null) => void;
  incomingDuelInvite: { fromPlayerId: string; fromPlayerName: string; roomCode: string; size: BoardSize } | null;
  onAcceptDuel: () => void;
  onRejectDuel: () => void;
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
  onNavigate: (destination: any) => void;
  claimMissionOnServer: (type: "daily" | "weekly", missionId: string, updater: (curr: PlayerProgress) => PlayerProgress) => void;
}

export function MissionsScreenContainer({
  progress,
  unclaimedMissions,
  hasClaimableDailyReward,
  globalToast,
  setGlobalToast,
  incomingDuelInvite,
  onAcceptDuel,
  onRejectDuel,
  livesModalElement,
  celebrationModalElement,
  onNavigate,
  claimMissionOnServer,
}: MissionsScreenContainerProps) {
  return (
    <MainShell
      active="missions"
      onNavigate={onNavigate}
      missionsBadgeCount={unclaimedMissions}
      storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
      toast={globalToast}
      onDismissToast={() => setGlobalToast(null)}
      duelInvite={incomingDuelInvite}
      onAcceptDuel={onAcceptDuel}
      onRejectDuel={onRejectDuel}
      livesModal={livesModalElement}
      celebrationModal={celebrationModalElement}
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
