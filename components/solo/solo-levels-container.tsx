import React from "react";
import { SoloLevelsScreen } from "./solo-levels-screen";
import { getCalculatedLives, type PlayerProgress } from "@/shared/progression";
import type { ToastData } from "../common/global-game-toast";
import { useProgression, useNavigation, useUIFeedback } from "@/context";

export interface SoloLevelsContainerProps {
  soloUnlockedLevel?: number;
  progress?: PlayerProgress;
  unclaimedMissions?: number;
  hasClaimableDailyReward?: boolean;
  globalToast?: ToastData | null;
  setGlobalToast?: (toast: ToastData | null) => void;
  onOpenLivesModal?: () => void;
  onNavigate?: (destination: any) => void;
  onSelectLevel: (level: number) => void;
  claimMilestoneOnServer?: (level: number, updater: (curr: PlayerProgress) => PlayerProgress) => void;
}

export function SoloLevelsContainer(props: SoloLevelsContainerProps) {
  const progression = useProgression();
  const navigation = useNavigation();
  const uiFeedback = useUIFeedback();

  const soloUnlockedLevel = props.soloUnlockedLevel ?? progression.soloUnlockedLevel;
  const progress = props.progress ?? progression.progress;
  const unclaimedMissions = props.unclaimedMissions ?? progression.unclaimedMissions;
  const hasClaimableDailyReward = props.hasClaimableDailyReward ?? progression.hasClaimableDailyReward;
  const globalToast = props.globalToast ?? uiFeedback.globalToast;
  const setGlobalToast = props.setGlobalToast ?? uiFeedback.setGlobalToast;
  const onOpenLivesModal = props.onOpenLivesModal ?? (() => uiFeedback.setShowLivesModal(true));
  const onNavigate = props.onNavigate ?? navigation.setScreen;
  const claimMilestoneOnServer = props.claimMilestoneOnServer ?? progression.claimMilestoneOnServer;

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
      onSelectLevel={props.onSelectLevel}
      claimMilestoneOnServer={claimMilestoneOnServer}
    />
  );
}
