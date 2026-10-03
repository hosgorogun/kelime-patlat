import React from "react";
import { SoloPlayScreen } from "./solo-play-screen";
import { getCalculatedLives, type DailyChallenge, type PlayerProgress } from "@/shared/progression";
import { useProgression, useNavigation, useUIFeedback, usePvP } from "@/context";

export interface SoloPlayContainerProps {
  soloLevel: number;
  dailySession: DailyChallenge | null;
  setDailySession: (session: DailyChallenge | null) => void;
  recentSoloWords: string[];
  progress?: PlayerProgress;
  setProgress?: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  activeBoardSkinColor?: string;
  onOpenLivesModal?: () => void;
  watchAd?: (onReward: () => void) => void;
  completeSoloLevel: (level: number, foundWords?: string[], won?: boolean) => void;
  completeDailyChallenge: (level: number, foundWords?: string[], won?: boolean) => void;
  openSoloLevel: (level: number) => void;
  setScreen?: (screen: any) => void;
  syncProgressToCloud?: (progress: PlayerProgress) => Promise<void>;
}

export function SoloPlayContainer(props: SoloPlayContainerProps) {
  const progression = useProgression();
  const navigation = useNavigation();
  const uiFeedback = useUIFeedback();
  const pvp = usePvP();

  const progress = props.progress ?? progression.progress;
  const setProgress = props.setProgress ?? progression.setProgress;
  const syncProgressToCloud = props.syncProgressToCloud ?? progression.syncProgressToCloud;
  const activeBoardSkinColor = props.activeBoardSkinColor ?? progression.activeBoardSkinColor;
  const setScreen = props.setScreen ?? navigation.setScreen;
  const onOpenLivesModal = props.onOpenLivesModal ?? (() => uiFeedback.setShowLivesModal(true));
  const watchAd = props.watchAd ?? pvp.watchAd ?? ((cb) => cb());

  const calculatedLives = getCalculatedLives(progress).lives;

  return (
    <SoloPlayScreen
      soloLevel={props.soloLevel}
      dailySession={props.dailySession}
      recentSoloWords={props.recentSoloWords}
      progress={progress}
      setProgress={setProgress}
      syncProgressToCloud={syncProgressToCloud}
      activeBoardSkinColor={activeBoardSkinColor}
      calculatedLives={calculatedLives}
      onOpenLivesModal={onOpenLivesModal}
      watchAd={watchAd}
      onExit={() => {
        const destination = props.dailySession ? "home" : "levels";
        props.setDailySession(null);
        setScreen(destination);
      }}
      onComplete={props.dailySession ? props.completeDailyChallenge : props.completeSoloLevel}
      onNext={() => setScreen("levels")}
      openSoloLevel={props.openSoloLevel}
      onNavigate={setScreen}
    />
  );
}

