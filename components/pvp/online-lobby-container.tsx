import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "../shell/main-shell";
import { OnlineLobbyScreen } from "./online-lobby-screen";
import { TurnMatchesModal } from "./turn-matches-modal";
import { getPlayerLevel, type PlayerProgress } from "@/shared/progression";
import type { BoardSize } from "@/shared/game";
import type { ToastData } from "../common/global-game-toast";

import { useProgression, useNavigation, useAuth, useUIFeedback, usePvP } from "@/context";

export interface OnlineLobbyContainerProps {
  playerName?: string;
  setPlayerName?: (name: string) => void;
  selectedSize?: BoardSize;
  setSelectedSize?: (size: BoardSize) => void;
  progress?: PlayerProgress;
  notice?: string;
  unclaimedMissions?: number;
  hasClaimableDailyReward?: boolean;
  setGlobalToast?: (toast: ToastData | null) => void;
  onStartMatchmaking?: (size: BoardSize) => void;
  onPromptBotDuel?: (size: BoardSize) => void;
  setSelectedModeInfo?: (mode: "pvp" | "daily" | "vintage" | "arcade" | "solo" | null) => void;
  onNavigate?: (destination: any) => void;
}

export function OnlineLobbyContainer(props: OnlineLobbyContainerProps) {
  const auth = useAuth();
  const progression = useProgression();
  const navigation = useNavigation();
  const uiFeedback = useUIFeedback();
  const pvp = usePvP();

  const playerName = props.playerName ?? auth.playerName;
  const setPlayerName = props.setPlayerName ?? auth.setPlayerName;
  const progress = props.progress ?? progression.progress;
  const unclaimedMissions = props.unclaimedMissions ?? progression.unclaimedMissions;
  const hasClaimableDailyReward = props.hasClaimableDailyReward ?? progression.hasClaimableDailyReward;
  const setGlobalToast = props.setGlobalToast ?? uiFeedback.setGlobalToast;
  const onNavigate = props.onNavigate ?? navigation.setScreen;
  const setSelectedModeInfo = props.setSelectedModeInfo ?? (() => {});

  const selectedSize = props.selectedSize ?? pvp.selectedSize;
  const setSelectedSize = props.setSelectedSize ?? pvp.setSelectedSize;
  const notice = props.notice ?? pvp.notice;
  const onStartMatchmaking = props.onStartMatchmaking ?? ((size) => void pvp.startMatchmaking(size));
  const onPromptBotDuel = props.onPromptBotDuel ?? pvp.promptBotDuel;
  const currentLevel = getPlayerLevel(progress.xp);
  const [showTurnMatchesModal, setShowTurnMatchesModal] = React.useState(false);

  return (
    <MainShell
      active="home"
      onNavigate={(destination) => onNavigate(destination)}
      missionsBadgeCount={unclaimedMissions}
      storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
    >
      <StatusBar style="dark" />
      <OnlineLobbyScreen
        playerName={playerName}
        onPlayerNameChange={setPlayerName}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        currentLevel={currentLevel}
        pvpWinStreak={progress.pvpWinStreak}
        streakShields={progress.streakShields}
        notice={notice}
        onBack={() => onNavigate("home")}
        onOpenInfo={() => setSelectedModeInfo("pvp")}
        onStartMatchmaking={(size) => void onStartMatchmaking(size)}
        onPromptBotDuel={(size) => onPromptBotDuel(size)}
        onOpenTurnMatches={() => setShowTurnMatchesModal(true)}
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
      <TurnMatchesModal
        visible={showTurnMatchesModal}
        onDismiss={() => setShowTurnMatchesModal(false)}
        playerId={auth.playerId}
        playerName={playerName}
        avatar={progress.selectedAvatar}
        friendsList={pvp.friendsList}
      />
    </MainShell>
  );
}
