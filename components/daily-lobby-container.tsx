import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "./main-shell";
import { DailyLobbyScreen } from "./daily-lobby-screen";
import type { DailyChallenge, PlayerProgress } from "../shared/progression";
import type { ToastData } from "./global-game-toast";
import type { BoardSize } from "../shared/game";

export interface DailyLobbyContainerProps {
  daily: DailyChallenge;
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  setDailySession: (session: DailyChallenge | null) => void;
  setSoloLevel: (level: number) => void;
  setScreen: (screen: any) => void;
  setSelectedModeInfo: (mode: "pvp" | "daily" | "vintage" | "arcade" | "solo" | null) => void;
  unclaimedMissions: number;
  hasClaimableDailyReward: boolean;
  globalToast: ToastData | null;
  setGlobalToast: (toast: ToastData | null) => void;
  incomingDuelInvite: { fromPlayerId: string; fromPlayerName: string; roomCode: string; size: BoardSize } | null;
  onAcceptDuel: () => void;
  onRejectDuel: () => void;
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
}

export function DailyLobbyContainer({
  daily,
  progress,
  setProgress,
  setDailySession,
  setSoloLevel,
  setScreen,
  setSelectedModeInfo,
  unclaimedMissions,
  hasClaimableDailyReward,
  globalToast,
  setGlobalToast,
  incomingDuelInvite,
  onAcceptDuel,
  onRejectDuel,
  livesModalElement,
  celebrationModalElement,
}: DailyLobbyContainerProps) {
  return (
    <MainShell
      active="home"
      onNavigate={(destination) => setScreen(destination)}
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
      <DailyLobbyScreen
        daily={daily}
        progress={progress}
        onBack={() => setScreen("home")}
        onOpenInfo={() => setSelectedModeInfo("daily")}
        onSelectTheme={(themeId) => setProgress((curr) => ({ ...curr, selectedTheme: themeId }))}
        onStartDaily={() => {
          setDailySession({
            ...daily,
            themeId: progress.selectedTheme,
          });
          setSoloLevel(daily.level ?? 20);
          setScreen("solo");
        }}
        onLockedNotice={() => {
          setGlobalToast({
            id: `daily-done-${Date.now()}`,
            title: "GÜNLÜK ROTA KİLİTLİ",
            subtitle: "Bugünkü sabit rotayı zaten tamamladın! Yarın yeni bir hak kazanacaksın.",
            icon: "🔒",
            accentColor: "#E8C36A",
          });
        }}
      />
    </MainShell>
  );
}
