import React, { useState } from "react";
import { canSpinLuckyWheel, type PlayerProgress } from "../shared/progression";
import { LuckyWheelModal } from "../components/lucky-wheel-modal";

export interface UseLuckyWheelParams {
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud: (progress: PlayerProgress) => Promise<void>;
  watchAd?: (onReward: () => void) => void;
  onShowToast: (title: string, subtitle: string, icon?: string, accentColor?: string) => void;
}

export function useLuckyWheel({
  progress,
  setProgress,
  syncProgressToCloud,
  watchAd,
  onShowToast,
}: UseLuckyWheelParams) {
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);

  const { canSpin, remainingSeconds } = canSpinLuckyWheel(progress);

  const luckyWheelModalElement = (
    <LuckyWheelModal
      visible={showLuckyWheel}
      onClose={() => setShowLuckyWheel(false)}
      progress={progress}
      setProgress={setProgress}
      syncProgressToCloud={syncProgressToCloud}
      watchAd={watchAd}
      onShowToast={onShowToast}
    />
  );

  return {
    showLuckyWheel,
    setShowLuckyWheel,
    canSpin,
    remainingSeconds,
    luckyWheelModalElement,
  };
}
