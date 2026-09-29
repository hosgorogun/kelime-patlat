import React from "react";
import { StatusBar } from "expo-status-bar";
import { ScreenContainer } from "./screen-container";
import { SoloChallenge } from "./solo-challenge";
import { MAX_SOLO_LEVEL } from "../shared/solo";
import type { DailyChallenge, PlayerProgress } from "../shared/progression";

export interface SoloPlayScreenProps {
  soloLevel: number;
  dailySession: DailyChallenge | null;
  recentSoloWords: string[];
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  activeBoardSkinColor: string;
  calculatedLives: number;
  onOpenLivesModal: () => void;
  watchAd: (onReward: () => void) => void;
  onExit: () => void;
  onComplete: (level: number, foundWords?: string[], won?: boolean) => void;
  onNext: () => void;
  openSoloLevel: (level: number) => void;
  onNavigate: (destination: any) => void;
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
}

export function SoloPlayScreen({
  soloLevel,
  dailySession,
  recentSoloWords,
  progress,
  setProgress,
  activeBoardSkinColor,
  calculatedLives,
  onOpenLivesModal,
  watchAd,
  onExit,
  onComplete,
  onNext,
  openSoloLevel,
  onNavigate,
  livesModalElement,
  celebrationModalElement,
}: SoloPlayScreenProps) {
  return (
    <ScreenContainer style={{ paddingBottom: 16 }}>
      <StatusBar style="dark" />
      <SoloChallenge
        key={`solo-${soloLevel}-${dailySession ? dailySession.id : "normal"}`}
        level={soloLevel}
        theme={dailySession ? dailySession.themeId : "general"}
        variationSeed={dailySession?.variation}
        daily={Boolean(dailySession)}
        excludeWords={recentSoloWords}
        radarChargesBonus={progress.radarChargesBonus || 0}
        lives={calculatedLives}
        onOpenLivesModal={onOpenLivesModal}
        boardSkinColor={activeBoardSkinColor}
        selectedVictoryEffect={progress.selectedVictoryEffect}
        watchAd={watchAd}
        onExit={onExit}
        onComplete={onComplete}
        onNext={onNext}
        onAdvanceLevel={() => {
          if (soloLevel < MAX_SOLO_LEVEL) {
            openSoloLevel(soloLevel + 1);
          } else {
            onNavigate("levels");
          }
        }}
        onBonusReward={(xp, radar) => {
          setProgress((current) => ({
            ...current,
            xp: current.xp + xp,
            radarChargesBonus: (current.radarChargesBonus || 0) + radar,
          }));
        }}
      />
      {livesModalElement}
      {celebrationModalElement}
    </ScreenContainer>
  );
}
