import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "./main-shell";
import { CommandCenter } from "../command/command-center";
import { GameModeInfoModal } from "../modals/game-mode-info-modal";
import { MatchConfirmModal } from "../modals/match-confirm-modal";
import { TermsModal } from "../modals/terms-modal";
import { WelcomeRewardModal } from "../modals/welcome-reward-modal";
import { useProgression, useNavigation, useAuth, useUIFeedback, usePvP } from "@/context";
import type { BoardSize, LeaderboardEntry } from "@/shared/game";
import type { DailyChallenge, PlayerProgress } from "@/shared/progression";

export interface HomeScreenViewProps {
  safeName?: string;
  progress?: PlayerProgress;
  daily?: DailyChallenge;
  leaderboard?: LeaderboardEntry[];
  unclaimedMissions?: number;
  unclaimedMilestones?: number;
  hasClaimableDailyReward?: boolean;
  showGuide?: boolean;
  onCloseGuide?: () => void;
  onShowGuide?: () => void;
  onNavigate?: (destination: any) => void;
  onPlayBot?: (size: BoardSize) => void;
  onSolo?: () => void;
  onLeaderboard?: () => void;
  onOpenLivesModal?: () => void;
  onClaimDailyReward?: () => void;
  onShowToast?: (title: string, subtitle: string, icon?: string, accentColor?: string) => void;
  selectedModeInfo?: "pvp" | "vintage" | "arcade" | "solo" | null;
  onOpenModeInfo?: (mode: "pvp" | "vintage" | "arcade" | "solo") => void;
  onCloseModeInfo?: () => void;
  pendingMatchConfirm?: { size: BoardSize; modeTitle: string; durationText: string; routesText: string; isBot?: boolean } | null;
  onConfirmMatch?: (info: { size: BoardSize; isBot?: boolean }) => void;
  onCancelMatchConfirm?: () => void;
  showConsentModal?: boolean;
  onAcceptConsent?: () => void;
  showWelcomeModal?: boolean;
  isClaimingWelcomeReward?: boolean;
  onClaimWelcomeReward?: () => void;
  onCloseWelcomeModal?: () => void;
  onOpenLuckyWheel?: () => void;
  luckyWheelModalElement?: React.ReactNode;
}

export function HomeScreenView(props: HomeScreenViewProps) {
  const auth = useAuth();
  const progression = useProgression();
  const navigation = useNavigation();
  const uiFeedback = useUIFeedback();
  const pvp = usePvP();

  const safeName = props.safeName ?? auth.safeName;
  const progress = props.progress ?? progression.progress;
  const daily = props.daily ?? progression.daily;
  const leaderboard = props.leaderboard ?? progression.leaderboard;
  const unclaimedMissions = props.unclaimedMissions ?? progression.unclaimedMissions;
  const unclaimedMilestones = props.unclaimedMilestones ?? progression.unclaimedMilestones;
  const hasClaimableDailyReward = props.hasClaimableDailyReward ?? progression.hasClaimableDailyReward;
  const showGuide = props.showGuide ?? uiFeedback.showGuide;
  const onCloseGuide = props.onCloseGuide ?? uiFeedback.handleCloseGuide;
  const onShowGuide = props.onShowGuide ?? (() => uiFeedback.setShowGuide(true));
  const onNavigate = props.onNavigate ?? navigation.setScreen;
  const onPlayBot = props.onPlayBot ?? pvp.promptBotDuel;
  const onSolo = props.onSolo ?? (() => navigation.setScreen("levels"));
  const onLeaderboard = props.onLeaderboard ?? (() => navigation.setScreen("season"));
  const onOpenLivesModal = props.onOpenLivesModal ?? (() => uiFeedback.setShowLivesModal(true));
  const onClaimDailyReward = props.onClaimDailyReward ?? uiFeedback.handleClaimDailyReward;
  const onShowToast = props.onShowToast ?? uiFeedback.showToast;
  const selectedModeInfo = props.selectedModeInfo !== undefined ? props.selectedModeInfo : pvp.selectedModeInfo;
  const onOpenModeInfo = props.onOpenModeInfo ?? ((mode) => pvp.setSelectedModeInfo(mode));
  const onCloseModeInfo = props.onCloseModeInfo ?? (() => pvp.setSelectedModeInfo(null));
  const pendingMatchConfirm = props.pendingMatchConfirm !== undefined ? props.pendingMatchConfirm : pvp.pendingMatchConfirm;
  const onConfirmMatch = props.onConfirmMatch ?? pvp.handleConfirmMatch;
  const onCancelMatchConfirm = props.onCancelMatchConfirm ?? (() => pvp.setPendingMatchConfirm(null));
  const showConsentModal = props.showConsentModal ?? uiFeedback.showConsentModal;
  const onAcceptConsent = props.onAcceptConsent ?? (() => uiFeedback.setShowConsentModal(false));
  const showWelcomeModal = props.showWelcomeModal ?? uiFeedback.showWelcomeModal;
  const isClaimingWelcomeReward = props.isClaimingWelcomeReward ?? uiFeedback.isClaimingWelcomeReward;
  const onClaimWelcomeReward = props.onClaimWelcomeReward ?? uiFeedback.handleClaimWelcomeReward;
  const onCloseWelcomeModal = props.onCloseWelcomeModal ?? (() => uiFeedback.setShowWelcomeModal(false));
  const onOpenLuckyWheel = props.onOpenLuckyWheel ?? (() => uiFeedback.setShowLuckyWheel(true));
  const luckyWheelModalElement = props.luckyWheelModalElement;

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
        leaderboard={leaderboard}
        onPlayBot={onPlayBot}
        onSolo={onSolo}
        onNavigate={onNavigate}
        onLeaderboard={onLeaderboard}
        onShowGuide={onShowGuide}
        onOpenModeInfo={onOpenModeInfo}
        onOpenLivesModal={onOpenLivesModal}
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
