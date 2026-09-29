import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "./main-shell";
import { OnlineLobbyScreen } from "./online-lobby-screen";
import { getPlayerLevel, type PlayerProgress } from "../shared/progression";
import type { BoardSize } from "../shared/game";
import type { ToastData } from "./global-game-toast";

export interface OnlineLobbyContainerProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  selectedSize: BoardSize;
  setSelectedSize: (size: BoardSize) => void;
  progress: PlayerProgress;
  notice: string;
  unclaimedMissions: number;
  hasClaimableDailyReward: boolean;
  globalToast: ToastData | null;
  setGlobalToast: (toast: ToastData | null) => void;
  incomingDuelInvite: { fromPlayerId: string; fromPlayerName: string; roomCode: string; size: BoardSize } | null;
  onAcceptDuel: () => void;
  onRejectDuel: () => void;
  matchmakingState: { size: BoardSize; elapsedSeconds: number } | null;
  onCancelMatchmaking: () => void;
  onStartMatchmaking: (size: BoardSize) => void;
  onPromptBotDuel: (size: BoardSize) => void;
  setSelectedModeInfo: (mode: "pvp" | "daily" | "vintage" | "arcade" | "solo" | null) => void;
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
  onNavigate: (destination: any) => void;
}

export function OnlineLobbyContainer({
  playerName,
  setPlayerName,
  selectedSize,
  setSelectedSize,
  progress,
  notice,
  unclaimedMissions,
  hasClaimableDailyReward,
  globalToast,
  setGlobalToast,
  incomingDuelInvite,
  onAcceptDuel,
  onRejectDuel,
  matchmakingState,
  onCancelMatchmaking,
  onStartMatchmaking,
  onPromptBotDuel,
  setSelectedModeInfo,
  livesModalElement,
  celebrationModalElement,
  onNavigate,
}: OnlineLobbyContainerProps) {
  const currentLevel = getPlayerLevel(progress.xp);

  return (
    <MainShell
      active="home"
      onNavigate={(destination) => onNavigate(destination)}
      missionsBadgeCount={unclaimedMissions}
      storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
      toast={globalToast}
      onDismissToast={() => setGlobalToast(null)}
      duelInvite={incomingDuelInvite}
      onAcceptDuel={onAcceptDuel}
      onRejectDuel={onRejectDuel}
      matchmakingState={matchmakingState}
      onCancelMatchmaking={onCancelMatchmaking}
      livesModal={livesModalElement}
      celebrationModal={celebrationModalElement}
    >
      <StatusBar style="dark" />
      <OnlineLobbyScreen
        playerName={playerName}
        onPlayerNameChange={setPlayerName}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        currentLevel={currentLevel}
        notice={notice}
        onBack={() => onNavigate("home")}
        onOpenInfo={() => setSelectedModeInfo("pvp")}
        onStartMatchmaking={(size) => void onStartMatchmaking(size)}
        onPromptBotDuel={(size) => onPromptBotDuel(size)}
        onLockedSize={(size, reqLevel) => {
          setGlobalToast({
            id: `size-locked-${size}-${Date.now()}`,
            title: `SEVİYE ${reqLevel} GEREKLİ`,
            subtitle: `${size}×${size} modu Seviye ${reqLevel}'de açılır. Şu anki seviyen: ${currentLevel}.`,
            icon: "🔒",
            accentColor: "#FFC24A",
          });
        }}
      />
    </MainShell>
  );
}
