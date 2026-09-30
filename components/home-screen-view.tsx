import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "./main-shell";
import { CommandCenter } from "./command-center";
import { GameModeInfoModal } from "./game-mode-info-modal";
import { MatchConfirmModal } from "./match-confirm-modal";
import { TermsModal } from "./terms-modal";
import { WelcomeRewardModal } from "./welcome-reward-modal";
import type { BoardSize, LeaderboardEntry } from "../shared/game";
import type { DailyChallenge, PlayerProgress, ThemePackId } from "../shared/progression";
import type { ToastData } from "./global-game-toast";

export interface HomeScreenViewProps {
  safeName: string;
  progress: PlayerProgress;
  daily: DailyChallenge;
  leaderboard: LeaderboardEntry[];
  unclaimedMissions: number;
  unclaimedMilestones: number;
  hasClaimableDailyReward: boolean;
  globalToast: ToastData | null;
  onDismissToast: () => void;
  showGuide: boolean;
  onCloseGuide: () => void;
  onShowGuide: () => void;
  seasonResetModal: { newSeasonId: string; previousRank: string; previousLp: number; newLp: number } | null;
  onCloseSeasonResetModal: () => void;
  incomingDuelInvite: { fromPlayerId: string; fromPlayerName: string; roomCode: string; size: BoardSize } | null;
  onAcceptDuel: () => void;
  onRejectDuel: () => void;
  matchmakingState: { size: BoardSize; elapsedSeconds: number } | null;
  onCancelMatchmaking: () => void;
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
  onNavigate: (destination: any) => void;
  onPlayDaily: () => void;
  onPlayBot: (size: BoardSize) => void;
  onSolo: () => void;
  onLeaderboard: () => void;
  onOpenLivesModal: () => void;
  onSelectTheme: (theme: ThemePackId) => void;
  onClaimDailyReward: () => void;
  onShowToast: (title: string, subtitle: string, icon?: string, accentColor?: string) => void;
  selectedModeInfo: "pvp" | "daily" | "vintage" | "arcade" | "solo" | null;
  onOpenModeInfo: (mode: "pvp" | "daily" | "vintage" | "arcade" | "solo") => void;
  onCloseModeInfo: () => void;
  pendingMatchConfirm: { size: BoardSize; modeTitle: string; durationText: string; routesText: string; isBot?: boolean } | null;
  onConfirmMatch: (info: { size: BoardSize; isBot?: boolean }) => void;
  onCancelMatchConfirm: () => void;
  showConsentModal: boolean;
  onAcceptConsent: () => void;
  showWelcomeModal: boolean;
  isClaimingWelcomeReward: boolean;
  onClaimWelcomeReward: () => void;
  onCloseWelcomeModal: () => void;
  onOpenLuckyWheel?: () => void;
  luckyWheelModalElement?: React.ReactNode;
}

export function HomeScreenView({
  safeName,
  progress,
  daily,
  leaderboard,
  unclaimedMissions,
  unclaimedMilestones,
  hasClaimableDailyReward,
  globalToast,
  onDismissToast,
  showGuide,
  onCloseGuide,
  onShowGuide,
  seasonResetModal,
  onCloseSeasonResetModal,
  incomingDuelInvite,
  onAcceptDuel,
  onRejectDuel,
  matchmakingState,
  onCancelMatchmaking,
  livesModalElement,
  celebrationModalElement,
  onNavigate,
  onPlayDaily,
  onPlayBot,
  onSolo,
  onLeaderboard,
  onOpenLivesModal,
  onSelectTheme,
  onClaimDailyReward,
  onShowToast,
  selectedModeInfo,
  onOpenModeInfo,
  onCloseModeInfo,
  pendingMatchConfirm,
  onConfirmMatch,
  onCancelMatchConfirm,
  showConsentModal,
  onAcceptConsent,
  showWelcomeModal,
  isClaimingWelcomeReward,
  onClaimWelcomeReward,
  onCloseWelcomeModal,
  onOpenLuckyWheel,
  luckyWheelModalElement,
}: HomeScreenViewProps) {
  return (
    <MainShell
      active="home"
      onNavigate={onNavigate}
      showGuide={showGuide}
      onCloseGuide={onCloseGuide}
      missionsBadgeCount={unclaimedMissions}
      storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
      toast={globalToast}
      onDismissToast={onDismissToast}
      seasonResetModal={seasonResetModal}
      onCloseSeasonResetModal={onCloseSeasonResetModal}
      duelInvite={incomingDuelInvite}
      onAcceptDuel={onAcceptDuel}
      onRejectDuel={onRejectDuel}
      matchmakingState={matchmakingState}
      onCancelMatchmaking={onCancelMatchmaking}
      livesModal={livesModalElement}
      celebrationModal={celebrationModalElement}
    >
      <StatusBar style="dark" />
      <CommandCenter
        playerName={safeName}
        progress={progress}
        daily={daily}
        leaderboard={leaderboard}
        onPlayDaily={onPlayDaily}
        onPlayBot={onPlayBot}
        onSolo={onSolo}
        onNavigate={onNavigate}
        onLeaderboard={onLeaderboard}
        onShowGuide={onShowGuide}
        onOpenModeInfo={onOpenModeInfo}
        onOpenLivesModal={onOpenLivesModal}
        onSelectTheme={onSelectTheme}
        unclaimedMissionsCount={unclaimedMissions}
        unclaimedMilestonesCount={unclaimedMilestones}
        onClaimDailyReward={onClaimDailyReward}
        onShowToast={onShowToast}
        onOpenLuckyWheel={onOpenLuckyWheel}
      />

      {/* Game Mode Info Modal */}
      <GameModeInfoModal
        visible={selectedModeInfo !== null}
        mode={selectedModeInfo}
        onClose={onCloseModeInfo}
      />

      {/* Dereceli Mod Onay Modalı */}
      <MatchConfirmModal
        visible={pendingMatchConfirm !== null}
        matchInfo={pendingMatchConfirm}
        onConfirm={onConfirmMatch}
        onCancel={onCancelMatchConfirm}
      />

      <TermsModal
        visible={showConsentModal}
        onAccept={onAcceptConsent}
      />

      {/* Hoş Geldin Hediyesi Modal */}
      <WelcomeRewardModal
        visible={showWelcomeModal}
        isClaiming={isClaimingWelcomeReward}
        onClaim={onClaimWelcomeReward}
        onClose={onCloseWelcomeModal}
      />

      {/* Siber Şans Çarkı Modalı */}
      {luckyWheelModalElement}
    </MainShell>
  );
}
