import React from "react";
import { StatusBar } from "expo-status-bar";
import { ScreenContainer } from "./screen-container";
import { VintagePuzzle } from "./vintage-puzzle";
import { GlobalGameToast, type ToastData } from "./global-game-toast";
import { applyVintageProgress, type PlayerProgress } from "../shared/progression";

export interface VintageScreenContainerProps {
  progress: PlayerProgress;
  lives: number;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud: (updated: PlayerProgress) => Promise<void>;
  awardProgressOnServer: (award: any, updater: (curr: PlayerProgress) => PlayerProgress) => Promise<void> | void;
  globalToast: ToastData | null;
  setGlobalToast: (toast: ToastData | null) => void;
  onOpenLivesModal: () => void;
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
  onNavigate: (destination: any) => void;
}

export function VintageScreenContainer({
  progress,
  lives,
  setProgress,
  syncProgressToCloud,
  awardProgressOnServer,
  globalToast,
  setGlobalToast,
  onOpenLivesModal,
  livesModalElement,
  celebrationModalElement,
  onNavigate,
}: VintageScreenContainerProps) {
  return (
    <ScreenContainer style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <VintagePuzzle
        onBack={() => onNavigate("home")}
        selectedVictoryEffect={progress.selectedVictoryEffect}
        vintageProgress={progress.vintageProgress}
        lives={lives}
        coins={progress.coins ?? 0}
        onSpendCoins={(amount: number) => {
          const currentCoins = progress.coins ?? 0;
          if (currentCoins < amount) return false;
          setProgress((current) => {
            const updated = { ...current, coins: Math.max(0, (current.coins ?? 0) - amount) };
            void syncProgressToCloud(updated);
            return updated;
          });
          return true;
        }}
        onOpenLivesModal={onOpenLivesModal}
        onSaveProgress={(newProgress) => {
          setProgress((current) => ({ ...current, vintageProgress: newProgress }));
        }}
        onRewardXp={(amount: number, level: number, wordsCount: number = 5, foundWords?: string[]) => {
          setProgress((current) => {
            const updated = applyVintageProgress(current, level, amount, wordsCount, foundWords);
            return updated;
          });
          void awardProgressOnServer(
            { kind: "vintage", score: amount, level, wordsCount, foundWords },
            (current) => applyVintageProgress(current, level, amount, wordsCount, foundWords)
          );
          setGlobalToast({
            id: `vintage-${Date.now()}`,
            title: "🗞️ SEVİYE TAMAMLANDI!",
            subtitle: `Nostaljik gazeteyi başarıyla tamamladın. +${amount} XP kazanıldı!`,
            icon: "🗞️",
            accentColor: "#FFC24A",
          });
        }}
      />
      {globalToast && <GlobalGameToast toast={globalToast} onDismiss={() => setGlobalToast(null)} />}
      {livesModalElement}
      {celebrationModalElement}
    </ScreenContainer>
  );
}
