import React from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ScreenContainer } from "../common/screen-container";
import { GameSplashScreen } from "../game/game-splash-screen";
import { AuthScreenContainer } from "../auth/auth-screen-container";
import { HomeScreenView } from "./home-screen-view";
import { DailyLobbyContainer } from "../daily/daily-lobby-container";
import { SeasonHubContainer } from "../season/season-hub-container";
import { SoloLevelsContainer } from "../solo/solo-levels-container";
import { SoloPlayContainer } from "../solo/solo-play-container";
import { CyberStoreScreenContainer } from "../store/cyber-store-screen-container";
import { ArcadeScreenContainer } from "../arcade/arcade-screen-container";
import { OnlineLobbyContainer } from "../pvp/online-lobby-container";
import { FriendsLobbyContainer } from "../friends/friends-lobby-container";
import { VintageScreenContainer } from "../vintage/vintage-screen-container";
import { MissionsScreenContainer } from "../missions/missions-screen-container";
import { ProfileScreenContainer } from "../profile/profile-screen-container";
import { RoomWaitingContainer } from "../pvp/room-waiting-container";
import { PvpMatchContainer } from "../pvp/pvp-match-container";
import { GlobalGameToast } from "../common/global-game-toast";
import { ModernAlertModal } from "../modals/modern-alert-modal";
import { SeasonResetModal } from "../season/season-reset-modal";
import { DuelInviteModal } from "../friends/duel-invite-modal";
import { MatchmakingOverlay } from "../modals/matchmaking-overlay";
import { consentManager } from "@/lib/engagement";
import { useNavigation, useAuth, useUIFeedback, usePvP } from "@/context";

export interface AppScreenRouterProps {
  splashFinished: boolean;
  setSplashFinished: (finished: boolean) => void;
  // Solo game
  dailySession: any;
  setDailySession: (session: any) => void;
  recentSoloWords: string[];
  soloLevel: number;
  setSoloLevel: (level: number) => void;
  openSoloLevel: (level: number) => void;
  completeSoloLevel: (level: number, words?: string[], won?: boolean) => void;
  completeDailyChallenge: (level: number, words?: string[], won?: boolean) => void;
  // Root overlay elements & feedback
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
  luckyWheelModalElement?: React.ReactNode;
  onOpenLuckyWheel?: () => void;
  watchAd?: (onReward: () => void) => void;
}

export function AppScreenRouter(props: AppScreenRouterProps) {
  const { screen, setScreen } = useNavigation();
  const { authToken, authLoading } = useAuth();
  const {
    globalToast,
    setGlobalToast,
    globalAlert,
    setGlobalAlert,
    seasonResetModal,
    setSeasonResetModal,
    setShowGuide,
    setShowWelcomeModal,
    setShowConsentModal,
  } = useUIFeedback();
  const pvp = usePvP();

  const {
    splashFinished,
    setSplashFinished,
    dailySession,
    setDailySession,
    recentSoloWords,
    soloLevel,
    setSoloLevel,
    openSoloLevel,
    completeSoloLevel,
    completeDailyChallenge,
    livesModalElement,
    celebrationModalElement,
    luckyWheelModalElement,
    onOpenLuckyWheel,
    watchAd,
  } = props;

  // Single overlay layer rendered once at the root level
  const rootOverlays = (
    <>
      {globalToast && (
        <GlobalGameToast toast={globalToast} onDismiss={() => setGlobalToast(null)} />
      )}
      <ModernAlertModal alert={globalAlert} onDismiss={() => setGlobalAlert(null)} />
      {seasonResetModal && (
        <SeasonResetModal data={seasonResetModal} onClose={() => setSeasonResetModal(null)} />
      )}
      <DuelInviteModal
        invite={pvp.incomingDuelInvite}
        onAccept={pvp.handleAcceptDuelInvite}
        onReject={pvp.handleRejectDuelInvite}
      />
      <MatchmakingOverlay state={pvp.matchmakingState} onCancel={pvp.cancelMatchmaking} />
      {livesModalElement}
      {celebrationModalElement}
      {luckyWheelModalElement}
    </>
  );

  if (!splashFinished) {
    return (
      <View style={{ flex: 1, width: "100%", height: "100%", backgroundColor: "#050B14" }}>
        <GameSplashScreen isReady={!authLoading} onFinish={() => setSplashFinished(true)} />
      </View>
    );
  }

  const renderScreen = () => {
    if (screen === "auth" || !authToken) {
      return (
        <AuthScreenContainer
          onFinishAuth={({ showWelcomeModal: showWelcome }) => {
            if (showWelcome) {
              setTimeout(() => {
                setShowWelcomeModal(true);
              }, 300);
            } else {
              setShowWelcomeModal(false);
              setShowGuide(false);
            }
            setScreen("home");
          }}
        />
      );
    }

    if (screen === "home") {
      return (
        <HomeScreenView
          onAcceptConsent={async () => {
            await consentManager.acceptConsent();
            setShowConsentModal(false);
          }}
          onOpenLuckyWheel={onOpenLuckyWheel}
          luckyWheelModalElement={luckyWheelModalElement}
        />
      );
    }

    if (screen === "daily-lobby") {
      return (
        <DailyLobbyContainer
          setDailySession={setDailySession}
          setSoloLevel={setSoloLevel}
        />
      );
    }

    if (screen === "season" || screen === "league") {
      return <SeasonHubContainer />;
    }

    if (screen === "levels") {
      return <SoloLevelsContainer onSelectLevel={openSoloLevel} />;
    }

    if (screen === "solo") {
      return (
        <SoloPlayContainer
          soloLevel={soloLevel}
          dailySession={dailySession}
          setDailySession={setDailySession}
          recentSoloWords={recentSoloWords}
          watchAd={watchAd}
          completeSoloLevel={completeSoloLevel}
          completeDailyChallenge={completeDailyChallenge}
          openSoloLevel={openSoloLevel}
        />
      );
    }

    if (screen === "store") {
      return <CyberStoreScreenContainer />;
    }

    if (screen === "arcade") {
      return <ArcadeScreenContainer />;
    }

    if (screen === "online") {
      return <OnlineLobbyContainer />;
    }

    if (screen === "friends") {
      return <FriendsLobbyContainer />;
    }

    if (screen === "vintage") {
      return <VintageScreenContainer />;
    }

    if (screen === "missions") {
      return <MissionsScreenContainer />;
    }

    if (screen === "profile") {
      return <ProfileScreenContainer />;
    }

    if (screen === "room" && pvp.room) {
      return <RoomWaitingContainer />;
    }

    if (!pvp.room) {
      return (
        <ScreenContainer style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <StatusBar style="dark" />
          <ActivityIndicator size="large" color="#2a9c7a" />
        </ScreenContainer>
      );
    }

    return <PvpMatchContainer />;
  };

  return (
    <>
      {renderScreen()}
      {rootOverlays}
    </>
  );
}
