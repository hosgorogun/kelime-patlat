import React from "react";
import { SoloPlayScreen } from "./solo-play-screen";
import { getCalculatedLives, type DailyChallenge, type PlayerProgress } from "../shared/progression";

export interface SoloPlayContainerProps {
  soloLevel: number;
  dailySession: DailyChallenge | null;
  setDailySession: (session: DailyChallenge | null) => void;
  recentSoloWords: string[];
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  activeBoardSkinColor: string;
  onOpenLivesModal: () => void;
  watchAd: (onReward: () => void) => void;
  completeSoloLevel: (level: number, foundWords?: string[], won?: boolean) => void;
  completeDailyChallenge: (level: number, foundWords?: string[], won?: boolean) => void;
  openSoloLevel: (level: number) => void;
  setScreen: (screen: any) => void;
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
}

export function SoloPlayContainer({
  soloLevel,
  dailySession,
  setDailySession,
  recentSoloWords,
  progress,
  setProgress,
  activeBoardSkinColor,
  onOpenLivesModal,
  watchAd,
  completeSoloLevel,
  completeDailyChallenge,
  openSoloLevel,
  setScreen,
  livesModalElement,
  celebrationModalElement,
}: SoloPlayContainerProps) {
  const calculatedLives = getCalculatedLives(progress).lives;

  return (
    <SoloPlayScreen
      soloLevel={soloLevel}
      dailySession={dailySession}
      recentSoloWords={recentSoloWords}
      progress={progress}
      setProgress={setProgress}
      activeBoardSkinColor={activeBoardSkinColor}
      calculatedLives={calculatedLives}
      onOpenLivesModal={onOpenLivesModal}
      watchAd={watchAd}
      onExit={() => {
        const destination = dailySession ? "home" : "levels";
        setDailySession(null);
        setScreen(destination);
      }}
      onComplete={dailySession ? completeDailyChallenge : completeSoloLevel}
      onNext={() => setScreen("levels")}
      openSoloLevel={openSoloLevel}
      onNavigate={setScreen}
      livesModalElement={livesModalElement}
      celebrationModalElement={celebrationModalElement}
    />
  );
}
