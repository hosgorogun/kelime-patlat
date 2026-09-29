import React from "react";
import { StyleSheet, View } from "react-native";
import { ScreenContainer } from "./screen-container";
import { CyberBannerAd } from "./cyber-banner-ad";
import { PremiumDock, type DockDestination } from "./premium-dock";
import { GlobalGameToast, type ToastData } from "./global-game-toast";
import { OnboardingGuide } from "./onboarding-guide";
import { SeasonResetModal } from "./season-reset-modal";
import { DuelInviteModal } from "./duel-invite-modal";
import { MatchmakingOverlay } from "./matchmaking-overlay";
import type { BoardSize } from "../shared/game";

export interface MainShellProps {
  active: DockDestination;
  children: React.ReactNode;
  onNavigate: (destination: DockDestination) => void;
  showGuide?: boolean;
  onCloseGuide?: () => void;
  missionsBadgeCount?: number;
  storeBadgeCount?: number;
  toast?: ToastData | null;
  onDismissToast?: () => void;
  seasonResetModal?: { newSeasonId: string; previousRank: string; previousLp: number; newLp: number } | null;
  onCloseSeasonResetModal?: () => void;
  duelInvite?: { fromPlayerId: string; fromPlayerName: string; roomCode: string; size: BoardSize } | null;
  onAcceptDuel?: () => void;
  onRejectDuel?: () => void;
  matchmakingState?: { size: BoardSize; elapsedSeconds: number } | null;
  onCancelMatchmaking?: () => void;
  livesModal?: React.ReactNode;
  celebrationModal?: React.ReactNode;
}

export function MainShell({
  active,
  children,
  onNavigate,
  showGuide,
  onCloseGuide,
  missionsBadgeCount,
  storeBadgeCount,
  toast,
  onDismissToast,
  seasonResetModal,
  onCloseSeasonResetModal,
  duelInvite,
  onAcceptDuel,
  onRejectDuel,
  matchmakingState,
  onCancelMatchmaking,
  livesModal,
  celebrationModal,
}: MainShellProps) {
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} style={{ paddingHorizontal: 14, paddingTop: 6 }}>
      {toast && onDismissToast && (
        <GlobalGameToast toast={toast} onDismiss={onDismissToast} />
      )}
      <View style={styles.shell}>
        {children}
        <View style={styles.fixedDock}>
          <CyberBannerAd />
          <PremiumDock active={active} onNavigate={onNavigate} missionsBadgeCount={missionsBadgeCount} storeBadgeCount={storeBadgeCount} />
        </View>
      </View>
      {showGuide !== undefined && onCloseGuide && (
        <OnboardingGuide visible={showGuide} onClose={onCloseGuide} />
      )}
      {seasonResetModal && onCloseSeasonResetModal && (
        <SeasonResetModal data={seasonResetModal} onClose={onCloseSeasonResetModal} />
      )}
      {duelInvite && onAcceptDuel && onRejectDuel && (
        <DuelInviteModal invite={duelInvite} onAccept={onAcceptDuel} onReject={onRejectDuel} />
      )}
      {matchmakingState && onCancelMatchmaking && (
        <MatchmakingOverlay state={matchmakingState} onCancel={onCancelMatchmaking} />
      )}
      {livesModal}
      {celebrationModal}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, userSelect: "none", touchAction: "none" } as any,
  fixedDock: { position: "absolute", left: 0, right: 0, bottom: 8 },
});
