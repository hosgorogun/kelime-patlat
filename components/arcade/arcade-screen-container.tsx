import React, { useEffect, useState } from "react";
import { BackHandler } from "react-native";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "../shell/main-shell";
import { ScreenContainer } from "../common/screen-container";
import { ArcadeLobbyScreen } from "./arcade-lobby-screen";
import { ArcadeChallenge } from "./arcade-challenge";
import { applyArcadeProgress, type PlayerProgress } from "@/shared/progression";
import type { ToastData } from "../common/global-game-toast";

export interface ArcadeScreenContainerProps {
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  activeBoardSkinColor: string;
  unclaimedMissions: number;
  hasClaimableDailyReward: boolean;
  setGlobalToast: (toast: ToastData | null) => void;
  setSelectedModeInfo: (mode: "pvp" | "daily" | "vintage" | "arcade" | "solo" | null) => void;
  watchAd?: (onReward: () => void) => void;
  awardProgressOnServer: (award: any, updater: (curr: PlayerProgress) => PlayerProgress) => void;
  syncProgressToCloud?: (progress: PlayerProgress) => Promise<void>;
  onNavigate: (destination: any) => void;
}

export function ArcadeScreenContainer({
  progress,
  setProgress,
  syncProgressToCloud,
  activeBoardSkinColor,
  unclaimedMissions,
  hasClaimableDailyReward,
  setGlobalToast,
  setSelectedModeInfo,
  watchAd,
  awardProgressOnServer,
  onNavigate,
}: ArcadeScreenContainerProps) {
  const [arcadeStarted, setArcadeStarted] = useState(false);

  useEffect(() => {
    if (!arcadeStarted) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setArcadeStarted(false);
      return true;
    });
    return () => sub.remove();
  }, [arcadeStarted]);

  if (!arcadeStarted) {
    return (
      <MainShell
        active="home"
        onNavigate={(destination: any) => {
          setArcadeStarted(false);
          onNavigate(destination);
        }}
        missionsBadgeCount={unclaimedMissions}
        storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
      >
        <StatusBar style="dark" />
        <ArcadeLobbyScreen
          bestScore={progress.bestArcadeScore || 0}
          onBack={() => onNavigate("home")}
          onOpenInfo={() => setSelectedModeInfo("arcade")}
          onStart={() => setArcadeStarted(true)}
        />
      </MainShell>
    );
  }

  return (
    <ScreenContainer style={{ paddingBottom: 16 }}>
      <StatusBar style="dark" />
      <ArcadeChallenge
        boardSkinColor={activeBoardSkinColor}
        selectedVictoryEffect={progress.selectedVictoryEffect}
        progress={progress}
        setProgress={setProgress}
        syncProgressToCloud={syncProgressToCloud}
        watchAd={watchAd}
        onExit={() => setArcadeStarted(false)}
        onComplete={(score, wordsCount, isDoubled, comboCount, foundWords) => {
          setProgress((current) => {
            const updated = applyArcadeProgress(current, score, wordsCount, isDoubled, comboCount, foundWords);
            return updated;
          });
          void awardProgressOnServer(
            { kind: "arcade", score, wordsCount, isDoubled, comboCount, foundWords },
            (current) => applyArcadeProgress(current, score, wordsCount, isDoubled, comboCount, foundWords)
          );
        }}
      />
    </ScreenContainer>
  );
}
