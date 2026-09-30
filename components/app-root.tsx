import React, { useEffect, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";

import type { SeasonTab } from "./season-hub";
import { reconnectGameSocket } from "../lib/game-socket";
import { useAudioHapticsSettings } from "../hooks/use-audio-haptics-settings";
import type { PlayerProgress } from "../shared/progression";
import type { ToastData } from "./global-game-toast";
import { useLivesManager } from "../hooks/use-lives-manager";
import type { ModernAlertData } from "./modern-alert-modal";
import { useCelebrationManager } from "../hooks/use-celebration-manager";
import { AppScreenRouter } from "./app-screen-router";
import { usePlayerProgression } from "../hooks/use-player-progression";
import { useSoloGame } from "../hooks/use-solo-game";
import { useAuthSession } from "../hooks/use-auth-session";
import { useDeepLinkHandler } from "../hooks/use-deep-link-handler";
import { useUserProfileInspector } from "../hooks/use-user-profile-inspector";
import { useAndroidBackHandler } from "../hooks/use-android-back-handler";
import { useRewardModals } from "../hooks/use-reward-modals";
import { useSocialState } from "../hooks/use-social-state";
import { useProgressionStats } from "../hooks/use-progression-stats";
import { useEngagementLifecycle } from "../hooks/use-engagement-lifecycle";
import { useMatchConfirmation } from "../hooks/use-match-confirmation";
import { usePvpGameCoordinator } from "../hooks/use-pvp-game-coordinator";
import { useLuckyWheel } from "../hooks/use-lucky-wheel";

export type Screen =
  | "home"
  | "online"
  | "friends"
  | "profile"
  | "levels"
  | "solo"
  | "room"
  | "game"
  | "season"
  | "league"
  | "arcade"
  | "daily-lobby"
  | "missions"
  | "auth"
  | "store"
  | "vintage";

export function AppRoot() {
  const { width } = useWindowDimensions();
  const [screen, setScreen] = useState<Screen>("home");
  const [seasonInitialTab, setSeasonInitialTab] = useState<SeasonTab>("leagues");
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const [globalAlert, setGlobalAlert] = useState<ModernAlertData | null>(null);
  const [globalToast, setGlobalToast] = useState<ToastData | null>(null);
  const [splashFinished, setSplashFinished] = useState(false);
  const [seasonResetModal, setSeasonResetModal] = useState<{
    newSeasonId: string;
    previousRank: string;
    previousLp: number;
    newLp: number;
  } | null>(null);

  const setProgressRef = useRef<React.Dispatch<React.SetStateAction<PlayerProgress>>>(() => {});
  const flushPendingAwardsRef = useRef<() => Promise<void>>(async () => {});
  const setShowWelcomeModalRef = useRef<(show: boolean) => void>(() => {});

  const authSession = useAuthSession({
    setProgress: (val) => setProgressRef.current(val),
    setScreen,
    flushPendingAwards: () => flushPendingAwardsRef.current(),
  });

  const {
    authToken,
    setAuthToken,
    authLoading,
    playerId,
    setPlayerId,
    playerName,
    setPlayerName,
    safeName,
  } = authSession;

  const {
    friendsList,
    pendingRequests,
    setPendingRequests,
    notice,
    setNotice,
  } = useSocialState();

  const {
    progress,
    setProgress,
    progressRef,
    progressReady,
    soloUnlockedLevel,
    setSoloUnlockedLevel,
    leaderboard,
    setLeaderboard,
    syncProgressToCloud,
    flushPendingAwards,
    awardProgressOnServer,
    claimMissionOnServer,
    claimMilestoneOnServer,
  } = usePlayerProgression({
    safeName,
    authToken,
    screen,
    setGlobalAlert,
    setSeasonResetModal,
    setShowWelcomeModal: (show) => setShowWelcomeModalRef.current(show),
  });

  setProgressRef.current = setProgress;
  flushPendingAwardsRef.current = flushPendingAwards;

  const { sfxOn, hapticsOn, toggleSfx, toggleHaptics } = useAudioHapticsSettings({
    progress,
    progressReady,
    setProgress,
  });

  const {
    daily,
    livesCalc,
    unclaimedMissions,
    unclaimedMilestones,
    hasClaimableDailyReward,
    activeBoardSkinColor,
    activeVictoryEffect,
  } = useProgressionStats({
    progress,
    soloUnlockedLevel,
  });

  const {
    showGuide,
    setShowGuide,
    showWelcomeModal,
    setShowWelcomeModal,
    isClaimingWelcomeReward,
    handleClaimWelcomeReward,
    handleClaimDailyReward,
    handleCloseGuide,
  } = useRewardModals({
    progress,
    setProgress,
    syncProgressToCloud,
    setGlobalToast,
  });

  setShowWelcomeModalRef.current = setShowWelcomeModal;

  const { celebrationModalElement } = useCelebrationManager({
    progress,
    progressReady,
    screen,
    setProgress,
    setGlobalToast,
    syncProgressToCloud,
  });

  const { inspectedUser, setInspectedUser, openUserProfile } = useUserProfileInspector();

  const pvp = usePvpGameCoordinator({
    width,
    playerId,
    safeName,
    progress,
    setProgress,
    syncProgressToCloud,
    flushPendingAwards,
    setScreen,
    screenRef,
    setNotice,
    setGlobalToast,
    setLeaderboard,
    setPendingRequests,
  });

  const {
    pendingMatchConfirm,
    setPendingMatchConfirm,
    selectedModeInfo,
    setSelectedModeInfo,
    promptBotDuel,
    handleConfirmMatch,
    watchAd,
  } = useMatchConfirmation({
    startBotDuel: pvp.startBotDuel,
    startMatchmaking: pvp.startMatchmaking,
    setGlobalAlert,
  });

  const {
    showLuckyWheel,
    setShowLuckyWheel,
    luckyWheelModalElement,
  } = useLuckyWheel({
    progress,
    setProgress,
    syncProgressToCloud,
    watchAd,
    onShowToast: (title, subtitle, icon, accentColor) => {
      setGlobalToast({
        id: Date.now().toString(),
        title,
        subtitle,
        icon: icon || "🎡",
        accentColor: accentColor || "#38BDF8",
      });
    },
  });

  useDeepLinkHandler({
    progress,
    setProgress,
    syncProgressToCloud,
    setAuthToken,
    setPlayerId,
    setPlayerName,
    setRoomCodeInput: pvp.setRoomCodeInput,
    setScreen,
    setNotice,
  });

  useEffect(() => {
    if ((screen === "room" || screen === "game") && !pvp.room) {
      setScreen("home");
    }
  }, [screen, pvp.room]);

  const {
    showLivesModal,
    setShowLivesModal,
    livesModalElement,
  } = useLivesManager({
    progress,
    progressRef,
    setProgress,
    syncProgressToCloud,
    setGlobalToast,
  });

  const {
    soloLevel,
    setSoloLevel,
    dailySession,
    setDailySession,
    recentSoloWords,
    openSoloLevel,
    completeSoloLevel,
    completeDailyChallenge,
  } = useSoloGame({
    progress,
    setProgress,
    soloUnlockedLevel,
    setSoloUnlockedLevel,
    daily,
    setScreen,
    setGlobalToast,
    setShowLivesModal,
    syncProgressToCloud,
    awardProgressOnServer,
  });

  useAndroidBackHandler({
    screen,
    setScreen,
    showGuide,
    setShowGuide,
    selectedWordInfo: pvp.selectedWordInfo,
    setSelectedWordInfo: pvp.setSelectedWordInfo,
    inspectedPath: pvp.inspectedPath,
    setInspectedPath: pvp.setInspectedPath,
    selectedModeInfo,
    setSelectedModeInfo,
    pendingMatchConfirm,
    setPendingMatchConfirm,
    showLivesModal,
    setShowLivesModal,
    showWelcomeModal,
    setShowWelcomeModal,
    showResultModal: pvp.showResultModal,
    setShowResultModal: pvp.setShowResultModal,
    showLeaveDuelModal: pvp.showLeaveDuelModal,
    setShowLeaveDuelModal: pvp.setShowLeaveDuelModal,
    seasonResetModal,
    setSeasonResetModal,
    globalAlert,
    setGlobalAlert,
    room: pvp.room,
    leaveRoom: pvp.leaveRoom,
    dailySession,
    setDailySession,
    soloLevel,
    completeSoloLevel,
  });

  const { showConsentModal, setShowConsentModal } = useEngagementLifecycle();

  return (
    <AppScreenRouter
      splashFinished={splashFinished}
      setSplashFinished={setSplashFinished}
      authLoading={authLoading}
      screen={screen}
      setScreen={setScreen}
      authToken={authToken}
      setAuthToken={setAuthToken}
      playerId={playerId}
      setPlayerId={setPlayerId}
      playerName={playerName}
      setPlayerName={setPlayerName}
      safeName={safeName}
      progress={progress}
      progressRef={progressRef}
      setProgress={setProgress}
      syncProgressToCloud={syncProgressToCloud}
      awardProgressOnServer={awardProgressOnServer}
      reconnectGameSocket={reconnectGameSocket}
      daily={daily}
      dailySession={dailySession}
      setDailySession={setDailySession}
      recentSoloWords={recentSoloWords}
      soloLevel={soloLevel}
      setSoloLevel={setSoloLevel}
      openSoloLevel={openSoloLevel}
      completeSoloLevel={completeSoloLevel}
      completeDailyChallenge={completeDailyChallenge}
      soloUnlockedLevel={soloUnlockedLevel}
      setSoloUnlockedLevel={setSoloUnlockedLevel}
      claimMilestoneOnServer={claimMilestoneOnServer}
      claimMissionOnServer={claimMissionOnServer}
      leaderboard={leaderboard}
      friendsList={friendsList}
      pendingRequests={pendingRequests}
      notice={notice}
      setNotice={setNotice}
      seasonInitialTab={seasonInitialTab}
      setSeasonInitialTab={setSeasonInitialTab}
      seasonResetModal={seasonResetModal}
      setSeasonResetModal={setSeasonResetModal}
      unclaimedMissions={unclaimedMissions}
      unclaimedMilestones={unclaimedMilestones}
      hasClaimableDailyReward={hasClaimableDailyReward}
      livesCalc={livesCalc}
      globalToast={globalToast}
      setGlobalToast={setGlobalToast}
      globalAlert={globalAlert}
      setGlobalAlert={setGlobalAlert}
      showGuide={showGuide}
      setShowGuide={setShowGuide}
      handleCloseGuide={handleCloseGuide}
      showWelcomeModal={showWelcomeModal}
      setShowWelcomeModal={setShowWelcomeModal}
      isClaimingWelcomeReward={isClaimingWelcomeReward}
      handleClaimWelcomeReward={handleClaimWelcomeReward}
      handleClaimDailyReward={handleClaimDailyReward}
      showConsentModal={showConsentModal}
      setShowConsentModal={setShowConsentModal}
      livesModalElement={livesModalElement}
      setShowLivesModal={setShowLivesModal}
      celebrationModalElement={celebrationModalElement}
      luckyWheelModalElement={luckyWheelModalElement}
      onOpenLuckyWheel={() => setShowLuckyWheel(true)}
      inspectedUser={inspectedUser}
      setInspectedUser={setInspectedUser}
      openUserProfile={openUserProfile}
      incomingDuelInvite={pvp.incomingDuelInvite}
      handleAcceptDuelInvite={pvp.handleAcceptDuelInvite}
      handleRejectDuelInvite={pvp.handleRejectDuelInvite}
      matchmakingState={pvp.matchmakingState}
      startMatchmaking={pvp.startMatchmaking}
      cancelMatchmaking={pvp.cancelMatchmaking}
      promptBotDuel={promptBotDuel}
      handleConfirmMatch={handleConfirmMatch}
      pendingMatchConfirm={pendingMatchConfirm}
      setPendingMatchConfirm={setPendingMatchConfirm}
      selectedModeInfo={selectedModeInfo}
      setSelectedModeInfo={setSelectedModeInfo}
      handleAcceptFriendRequest={pvp.handleAcceptFriendRequest}
      handleRejectFriendRequest={pvp.handleRejectFriendRequest}
      handleSendFriendRequest={pvp.handleSendFriendRequest}
      handleAddFriendTarget={pvp.handleAddFriendTarget}
      handleChallengeTarget={pvp.handleChallengeTarget}
      activeBoardSkinColor={activeBoardSkinColor}
      activeVictoryEffect={activeVictoryEffect}
      watchAd={watchAd}
      selectedSize={pvp.selectedSize}
      setSelectedSize={pvp.setSelectedSize}
      roomCodeInput={pvp.roomCodeInput}
      setRoomCodeInput={pvp.setRoomCodeInput}
      createRoom={pvp.createRoom}
      joinRoom={pvp.joinRoom}
      leaveRoom={pvp.leaveRoom}
      shareRoomInvite={pvp.shareRoomInvite}
      markReady={pvp.markReady}
      requestRematch={pvp.requestRematch}
      sendEmote={pvp.sendEmote}
      activeEmote={pvp.activeEmote}
      room={pvp.room}
      isSocketConnected={pvp.isSocketConnected}
      sfxOn={sfxOn}
      toggleSfx={toggleSfx}
      hapticsOn={hapticsOn}
      toggleHaptics={toggleHaptics}
      gameCountdown={pvp.gameCountdown}
      boardSelection={pvp.boardSelection}
      boardWidth={pvp.boardWidth}
      gameScrollRef={pvp.gameScrollRef}
      handleLiveGameExitPress={pvp.handleLiveGameExitPress}
      allFinishedWords={pvp.allFinishedWords}
      inspectedPath={pvp.inspectedPath}
      setInspectedPath={pvp.setInspectedPath}
      inspectedColor={pvp.inspectedColor}
      inspectWord={pvp.inspectWord}
      selectedWordInfo={pvp.selectedWordInfo}
      setSelectedWordInfo={pvp.setSelectedWordInfo}
      showResultModal={pvp.showResultModal}
      setShowResultModal={pvp.setShowResultModal}
      showLeaveDuelModal={pvp.showLeaveDuelModal}
      setShowLeaveDuelModal={pvp.setShowLeaveDuelModal}
    />
  );
}
