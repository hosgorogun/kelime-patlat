import React from "react";
import { SoloLevelsScreen } from "./solo-levels-screen";
import { getCalculatedLives, type PlayerProgress } from "../shared/progression";
import type { ToastData } from "./global-game-toast";

export interface SoloLevelsContainerProps {
  soloUnlockedLevel: number;
  progress: PlayerProgress;
  unclaimedMissions: number;
  hasClaimableDailyReward: boolean;
  globalToast: ToastData | null;
  setGlobalToast: (toast: ToastData | null) => void;
  onOpenLivesModal: () => void;
  onNavigate: (destination: any) => void;
  onSelectLevel: (level: number) => void;
  claimMilestoneOnServer: (level: number, updater: (curr: PlayerProgress) => PlayerProgress) => void;
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
}

export function SoloLevelsContainer({
  soloUnlockedLevel,
  progress,
  unclaimedMissions,
  hasClaimableDailyReward,
  globalToast,
  setGlobalToast,
  onOpenLivesModal,
  onNavigate,
  onSelectLevel,
  claimMilestoneOnServer,
  livesModalElement,
  celebrationModalElement,
}: SoloLevelsContainerProps) {
  const lives = getCalculatedLives(progress).lives;

  return (
    <SoloLevelsScreen
      soloUnlockedLevel={soloUnlockedLevel}
      progress={progress}
      lives={lives}
      unclaimedMissions={unclaimedMissions}
      hasClaimableDailyReward={hasClaimableDailyReward}
      globalToast={globalToast}
      setGlobalToast={setGlobalToast}
      onOpenLivesModal={onOpenLivesModal}
      onNavigate={onNavigate}
      onSelectLevel={onSelectLevel}
      claimMilestoneOnServer={claimMilestoneOnServer}
      livesModalElement={livesModalElement}
      celebrationModalElement={celebrationModalElement}
    />
  );
}
