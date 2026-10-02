import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "../shell/main-shell";
import { DailyLobbyScreen } from "./daily-lobby-screen";
import type { DailyChallenge, PlayerProgress } from "@/shared/progression";
import type { ToastData } from "../common/global-game-toast";

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
  setGlobalToast: (toast: ToastData | null) => void;
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
  setGlobalToast,
}: DailyLobbyContainerProps) {
  return (
    <MainShell
      active="home"
      onNavigate={(destination) => setScreen(destination)}
      missionsBadgeCount={unclaimedMissions}
      storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
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
