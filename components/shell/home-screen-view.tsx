import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "./main-shell";
import { CommandCenter } from "../command/command-center";
import { GameModeInfoModal } from "../modals/game-mode-info-modal";
import { MatchConfirmModal } from "../modals/match-confirm-modal";
import { TermsModal } from "../modals/terms-modal";
import { WelcomeRewardModal } from "../modals/welcome-reward-modal";
import type { BoardSize, LeaderboardEntry } from "@/shared/game";
import type { DailyChallenge, PlayerProgress, ThemePackId } from "@/shared/progression";

export interface HomeScreenViewProps {
  safeName: string;
  progress: PlayerProgress;
  daily: DailyChallenge;
  leaderboard: LeaderboardEntry[];
  unclaimedMissions: number;
  unclaimedMilestones: number;
  hasClaimableDailyReward: boolean;
  showGuide: boolean;
  onCloseGuide: () => void;
  onShowGuide: () => void;
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
  showGuide,
  onCloseGuide,
  onShowGuide,
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
