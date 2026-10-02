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
import type { Screen } from "./types";
import type { SeasonTab } from "../season/season-hub";
import type { BoardSize, RoomSnapshot } from "@/shared/game";
import type { PlayerProgress, DailyChallenge } from "@/shared/progression";
import type { ToastData } from "../common/global-game-toast";
import type { ModernAlertData } from "../modals/modern-alert-modal";
import type { FriendRequest, FriendUser } from "@/shared/social";
import type { InspectableUser } from "../profile/user-profile-modal";

export interface AppScreenRouterProps {
  splashFinished: boolean;
  setSplashFinished: (finished: boolean) => void;
  authLoading: boolean;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  playerId: string;
  setPlayerId: (id: string) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  safeName: string;
  progress: PlayerProgress;
  progressRef: React.MutableRefObject<PlayerProgress>;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud: (progress: PlayerProgress) => Promise<void>;
  awardProgressOnServer: (award: any) => Promise<any>;
  reconnectGameSocket: () => void;
  daily: DailyChallenge;
  dailySession: any;
  setDailySession: (session: any) => void;
  recentSoloWords: string[];
  soloLevel: number;
  setSoloLevel: (level: number) => void;
  openSoloLevel: (level: number) => void;
  completeSoloLevel: (level: number, words?: string[], won?: boolean) => void;
  completeDailyChallenge: (level: number, words?: string[], won?: boolean) => void;
  soloUnlockedLevel: number;
  setSoloUnlockedLevel: (level: number) => void;
  claimMilestoneOnServer: (level: number, fallback: (current: PlayerProgress) => PlayerProgress) => Promise<void>;
  claimMissionOnServer: (kind: "daily" | "weekly", missionId: string, fallback: (current: PlayerProgress) => PlayerProgress) => Promise<void>;
  leaderboard: any[];
  friendsList: FriendUser[];
  pendingRequests: FriendRequest[];
  notice: string;
  setNotice: (msg: string) => void;
  seasonInitialTab: SeasonTab;
  setSeasonInitialTab: (tab: SeasonTab) => void;
  seasonResetModal: any;
  setSeasonResetModal: (modal: any) => void;
  unclaimedMissions: number;
  unclaimedMilestones: number;
  hasClaimableDailyReward: boolean;
  livesCalc: { lives: number; nextLifeTimerSeconds: number };
  globalToast: ToastData | null;
  setGlobalToast: (toast: ToastData | null) => void;
  globalAlert: ModernAlertData | null;
  setGlobalAlert: (alert: ModernAlertData | null) => void;
  showGuide: boolean;
  setShowGuide: (show: boolean) => void;
  handleCloseGuide: () => void;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
  isClaimingWelcomeReward: boolean;
  handleClaimWelcomeReward: () => void;
  handleClaimDailyReward: () => void;
  showConsentModal: boolean;
  setShowConsentModal: (show: boolean) => void;
  // Root-level overlay elements (rendered once here)
  livesModalElement: React.ReactNode;
  setShowLivesModal: (show: boolean) => void;
  celebrationModalElement: React.ReactNode;
  luckyWheelModalElement?: React.ReactNode;
  onOpenLuckyWheel?: () => void;
  inspectedUser: InspectableUser | null;
  setInspectedUser: (user: InspectableUser | null) => void;
  openUserProfile: (target: Partial<InspectableUser> & { id: string; name: string }) => Promise<void>;
  incomingDuelInvite: any;
  handleAcceptDuelInvite: () => void;
  handleRejectDuelInvite: () => void;
  matchmakingState: any;
  startMatchmaking: (size: BoardSize) => void;
  cancelMatchmaking: () => void;
  promptBotDuel: (size: BoardSize) => void;
  handleConfirmMatch: (info: { size: BoardSize; isBot?: boolean }) => void;
  pendingMatchConfirm: any;
  setPendingMatchConfirm: (confirm: any) => void;
  selectedModeInfo: any;
  setSelectedModeInfo: (info: any) => void;
  handleAcceptFriendRequest: (reqId: string, fromPlayerId?: string) => void;
  handleRejectFriendRequest: (reqId: string) => void;
  handleSendFriendRequest: (toUsername: string) => Promise<{ success: boolean; message: string; }> | any;
  handleAddFriendTarget: (target: InspectableUser) => void;
  handleChallengeTarget: (target: InspectableUser, size?: BoardSize) => Promise<void>;
  activeBoardSkinColor: string;
  activeVictoryEffect: string;
  watchAd: (onReward: () => void) => void;
  selectedSize: BoardSize;
  setSelectedSize: (size: BoardSize) => void;
  roomCodeInput: string;
  setRoomCodeInput: (code: string) => void;
  createRoom: (size?: BoardSize, inviteTarget?: any) => Promise<any>;
  joinRoom: (code?: string) => Promise<any>;
  leaveRoom: () => void;
  shareRoomInvite: () => Promise<void>;
  markReady: () => void;
  requestRematch: () => void;
  sendEmote: (emote: string) => void;
  activeEmote: any;
  room: RoomSnapshot | null;
  isSocketConnected: boolean;
  sfxOn: boolean;
  toggleSfx: (val: boolean) => void;
  hapticsOn: boolean;
  toggleHaptics: (val: boolean) => void;
  gameCountdown: number | null;
  boardSelection: any;
  boardWidth: number;
  gameScrollRef: React.RefObject<any>;
  handleLiveGameExitPress: () => void;
  allFinishedWords: any[];
  inspectedPath: number[] | null;
  setInspectedPath: (path: number[] | null) => void;
  inspectedColor: string;
  inspectWord: (word: string, path: number[] | null, color: string) => void;
  selectedWordInfo: any;
  setSelectedWordInfo: (info: any) => void;
  showResultModal: boolean;
  setShowResultModal: (show: boolean) => void;
  showLeaveDuelModal: boolean;
  setShowLeaveDuelModal: (show: boolean) => void;
}

export function AppScreenRouter(props: AppScreenRouterProps) {
  const {
    splashFinished,
    setSplashFinished,
    authLoading,
    screen,
    setScreen,
    authToken,
    setAuthToken,
    playerId,
    setPlayerId,
    playerName,
    setPlayerName,
    safeName,
    progress,
    progressRef,
    setProgress,
    syncProgressToCloud,
    awardProgressOnServer,
    reconnectGameSocket,
    daily,
    dailySession,
    setDailySession,
    recentSoloWords,
    soloLevel,
    setSoloLevel,
    openSoloLevel,
    completeSoloLevel,
    completeDailyChallenge,
    soloUnlockedLevel,
    setSoloUnlockedLevel,
    claimMilestoneOnServer,
    claimMissionOnServer,
    leaderboard,
    friendsList,
    pendingRequests,
    notice,
    setNotice,
    seasonInitialTab,
    setSeasonInitialTab,
    seasonResetModal,
    setSeasonResetModal,
    unclaimedMissions,
    unclaimedMilestones,
    hasClaimableDailyReward,
    livesCalc,
    globalToast,
    setGlobalToast,
    globalAlert,
    setGlobalAlert,
    showGuide,
    setShowGuide,
    handleCloseGuide,
    showWelcomeModal,
    setShowWelcomeModal,
    isClaimingWelcomeReward,
    handleClaimWelcomeReward,
    handleClaimDailyReward,
    showConsentModal,
    setShowConsentModal,
    livesModalElement,
    setShowLivesModal,
    celebrationModalElement,
    luckyWheelModalElement,
    onOpenLuckyWheel,
    inspectedUser,
    setInspectedUser,
    openUserProfile,
    incomingDuelInvite,
    handleAcceptDuelInvite,
    handleRejectDuelInvite,
    matchmakingState,
    startMatchmaking,
    cancelMatchmaking,
    promptBotDuel,
    handleConfirmMatch,
    pendingMatchConfirm,
    setPendingMatchConfirm,
    selectedModeInfo,
    setSelectedModeInfo,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
    handleSendFriendRequest,
    handleAddFriendTarget,
    handleChallengeTarget,
    activeBoardSkinColor,
    activeVictoryEffect,
    watchAd,
    selectedSize,
    setSelectedSize,
    roomCodeInput,
    setRoomCodeInput,
    createRoom,
    joinRoom,
    leaveRoom,
    shareRoomInvite,
    markReady,
    requestRematch,
    sendEmote,
    activeEmote,
    room,
    isSocketConnected,
    sfxOn,
    toggleSfx,
    hapticsOn,
    toggleHaptics,
    gameCountdown,
    boardSelection,
    boardWidth,
    gameScrollRef,
    handleLiveGameExitPress,
    allFinishedWords,
    inspectedPath,
    setInspectedPath,
    inspectedColor,
    inspectWord,
    selectedWordInfo,
    setSelectedWordInfo,
    showResultModal,
    setShowResultModal,
    showLeaveDuelModal,
    setShowLeaveDuelModal,
  } = props;

  // ── Root overlay layer rendered once regardless of screen ────────────────────
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
        invite={incomingDuelInvite}
        onAccept={handleAcceptDuelInvite}
        onReject={handleRejectDuelInvite}
      />
      <MatchmakingOverlay state={matchmakingState} onCancel={cancelMatchmaking} />
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

  if (screen === "auth" || !authToken) {
    return (
      <>
        <AuthScreenContainer
          authToken={authToken}
          progress={progress}
          setAuthToken={setAuthToken}
          setPlayerId={setPlayerId}
          setPlayerName={setPlayerName}
          setProgress={setProgress}
          syncProgressToCloud={syncProgressToCloud}
          reconnectGameSocket={reconnectGameSocket}
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
        {rootOverlays}
      </>
    );
  }

  if (screen === "home") {
    return (
      <>
        <HomeScreenView
          safeName={safeName}
          progress={progress}
          daily={daily}
          leaderboard={leaderboard}
          unclaimedMissions={unclaimedMissions}
          unclaimedMilestones={unclaimedMilestones}
          hasClaimableDailyReward={hasClaimableDailyReward}
          showGuide={showGuide}
          onCloseGuide={handleCloseGuide}
          onShowGuide={() => setShowGuide(true)}
          onNavigate={setScreen}
          onPlayDaily={() => setScreen("daily-lobby")}
          onPlayBot={promptBotDuel}
          onSolo={() => setScreen("levels")}
          onLeaderboard={() => setScreen("season")}
          onOpenLivesModal={() => setShowLivesModal(true)}
          onSelectTheme={(selectedTheme) => {
            setProgress((current) => ({ ...current, selectedTheme }));
          }}
          onClaimDailyReward={handleClaimDailyReward}
          onShowToast={(title, subtitle, icon, accentColor) => {
            setGlobalToast({
              id: Date.now().toString(),
              title,
              subtitle,
              icon: icon || "🔒",
              accentColor: accentColor || "#EF4444",
            });
          }}
          selectedModeInfo={selectedModeInfo}
          onOpenModeInfo={(mode) => setSelectedModeInfo(mode)}
          onCloseModeInfo={() => setSelectedModeInfo(null)}
          pendingMatchConfirm={pendingMatchConfirm}
          onConfirmMatch={handleConfirmMatch}
          onCancelMatchConfirm={() => setPendingMatchConfirm(null)}
          showConsentModal={showConsentModal}
          onAcceptConsent={async () => {
            await consentManager.acceptConsent();
            setShowConsentModal(false);
          }}
          showWelcomeModal={showWelcomeModal}
          isClaimingWelcomeReward={isClaimingWelcomeReward}
          onClaimWelcomeReward={handleClaimWelcomeReward}
          onCloseWelcomeModal={() => setShowWelcomeModal(false)}
          onOpenLuckyWheel={onOpenLuckyWheel}
          luckyWheelModalElement={luckyWheelModalElement}
        />
        {rootOverlays}
      </>
    );
  }

  if (screen === "daily-lobby") {
    return (
      <>
        <DailyLobbyContainer
          daily={daily}
          progress={progress}
          setProgress={setProgress}
          setDailySession={setDailySession}
          setSoloLevel={setSoloLevel}
          setScreen={setScreen}
          setSelectedModeInfo={setSelectedModeInfo}
          unclaimedMissions={unclaimedMissions}
          hasClaimableDailyReward={hasClaimableDailyReward}
          setGlobalToast={setGlobalToast}
        />
        {rootOverlays}
      </>
    );
  }

  if (screen === "season" || screen === "league") {
    return (
      <>
        <SeasonHubContainer
          screen={screen}
          seasonInitialTab={seasonInitialTab}
          playerId={playerId}
          playerName={playerName}
          safeName={safeName}
          progress={progress}
          setProgress={setProgress}
          leaderboard={leaderboard}
          pendingRequests={pendingRequests}
          onAcceptFriendRequest={handleAcceptFriendRequest}
          onRejectFriendRequest={handleRejectFriendRequest}
          onSendFriendRequest={handleSendFriendRequest}
          onChallengeFriend={async (friendName, size) => {
            const targetFriend = friendsList.find(
              (f) => f.name === friendName || f.username === friendName
            );
            if (targetFriend) {
              await handleChallengeTarget(targetFriend as any, size);
            }
          }}
          openUserProfile={openUserProfile}
          inspectedUser={inspectedUser}
          setInspectedUser={setInspectedUser}
          handleAddFriendTarget={handleAddFriendTarget}
          handleChallengeTarget={handleChallengeTarget}
          unclaimedMissions={unclaimedMissions}
          hasClaimableDailyReward={hasClaimableDailyReward}
          onNavigate={setScreen}
        />
        {rootOverlays}
      </>
    );
  }

  if (screen === "levels") {
    return (
      <>
        <SoloLevelsContainer
          soloUnlockedLevel={soloUnlockedLevel}
          progress={progress}
          unclaimedMissions={unclaimedMissions}
          hasClaimableDailyReward={hasClaimableDailyReward}
          globalToast={globalToast}
          setGlobalToast={setGlobalToast}
          onOpenLivesModal={() => setShowLivesModal(true)}
          onNavigate={setScreen}
          onSelectLevel={openSoloLevel}
          claimMilestoneOnServer={claimMilestoneOnServer}
        />
        {rootOverlays}
      </>
    );
  }

  if (screen === "solo") {
    return (
      <>
        <SoloPlayContainer
          soloLevel={soloLevel}
          dailySession={dailySession}
          setDailySession={setDailySession}
          recentSoloWords={recentSoloWords}
          progress={progress}
          setProgress={setProgress}
          syncProgressToCloud={syncProgressToCloud}
          activeBoardSkinColor={activeBoardSkinColor}
          onOpenLivesModal={() => setShowLivesModal(true)}
          watchAd={watchAd}
          completeSoloLevel={completeSoloLevel}
          completeDailyChallenge={completeDailyChallenge}
          openSoloLevel={openSoloLevel}
          setScreen={setScreen}
        />
        {rootOverlays}
      </>
    );
  }

  if (screen === "store") {
    return (
      <>
        <CyberStoreScreenContainer
          progress={progress}
          progressRef={progressRef}
          setProgress={setProgress}
          syncProgressToCloud={syncProgressToCloud}
          unclaimedMissions={unclaimedMissions}
          hasClaimableDailyReward={hasClaimableDailyReward}
          setGlobalToast={setGlobalToast}
          onNavigate={setScreen}
          onClaimDailyReward={handleClaimDailyReward}
        />
        {rootOverlays}
      </>
    );
  }

  if (screen === "arcade") {
    return (
      <>
        <ArcadeScreenContainer
          progress={progress}
          setProgress={setProgress}
          syncProgressToCloud={syncProgressToCloud}
          activeBoardSkinColor={activeBoardSkinColor}
          awardProgressOnServer={awardProgressOnServer}
          unclaimedMissions={unclaimedMissions}
          hasClaimableDailyReward={hasClaimableDailyReward}
          setGlobalToast={setGlobalToast}
          setSelectedModeInfo={setSelectedModeInfo}
          watchAd={watchAd}
          onNavigate={setScreen}
        />
        {rootOverlays}
      </>
    );
  }

  if (screen === "online") {
    return (
      <>
        <OnlineLobbyContainer
          playerName={playerName}
          setPlayerName={setPlayerName}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          progress={progress}
          notice={notice}
          unclaimedMissions={unclaimedMissions}
          hasClaimableDailyReward={hasClaimableDailyReward}
          setGlobalToast={setGlobalToast}
          onStartMatchmaking={(size) => void startMatchmaking(size)}
          onPromptBotDuel={promptBotDuel}
          setSelectedModeInfo={setSelectedModeInfo}
          onNavigate={setScreen}
        />
        {rootOverlays}
      </>
    );
  }

  if (screen === "friends") {
    return (
      <>
        <FriendsLobbyContainer
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          roomCodeInput={roomCodeInput}
          setRoomCodeInput={setRoomCodeInput}
          friendsList={friendsList}
          notice={notice}
          unclaimedMissions={unclaimedMissions}
          hasClaimableDailyReward={hasClaimableDailyReward}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onInspectUser={setInspectedUser}
          onChallengeFriend={handleChallengeTarget}
          setSeasonInitialTab={setSeasonInitialTab}
          onNavigate={setScreen}
        />
        {rootOverlays}
      </>
    );
  }

  if (screen === "vintage") {
    return (
      <>
        <VintageScreenContainer
          progress={progress}
          progressRef={progressRef}
          lives={livesCalc.lives}
          setProgress={setProgress}
          syncProgressToCloud={syncProgressToCloud}
          awardProgressOnServer={awardProgressOnServer}
          setGlobalToast={setGlobalToast}
          onOpenLivesModal={() => setShowLivesModal(true)}
          onNavigate={setScreen}
        />
        {rootOverlays}
      </>
    );
  }

  if (screen === "missions") {
    return (
      <>
        <MissionsScreenContainer
          progress={progress}
          unclaimedMissions={unclaimedMissions}
          hasClaimableDailyReward={hasClaimableDailyReward}
          onNavigate={setScreen}
          claimMissionOnServer={claimMissionOnServer}
        />
        {rootOverlays}
      </>
    );
  }

  if (screen === "profile") {
    return (
      <>
        <ProfileScreenContainer
          safeName={safeName}
          playerId={playerId}
          authToken={authToken}
          progress={progress}
          setProgress={setProgress}
          setPlayerName={setPlayerName}
          setAuthToken={setAuthToken}
          setPlayerId={setPlayerId}
          setSoloUnlockedLevel={setSoloUnlockedLevel}
          setShowGuide={setShowGuide}
          setShowWelcomeModal={setShowWelcomeModal}
          setNotice={setNotice}
          syncProgressToCloud={syncProgressToCloud}
          sfxOn={sfxOn}
          toggleSfx={toggleSfx}
          hapticsOn={hapticsOn}
          toggleHaptics={toggleHaptics}
          globalAlert={globalAlert}
          setGlobalAlert={setGlobalAlert}
          setGlobalToast={setGlobalToast}
          unclaimedMissions={unclaimedMissions}
          hasClaimableDailyReward={hasClaimableDailyReward}
          onNavigate={setScreen}
        />
        {rootOverlays}
      </>
    );
  }

  if (screen === "room" && room) {
    return (
      <>
        <RoomWaitingContainer
          room={room}
          playerId={playerId}
          safeName={safeName}
          notice={notice}
          onLeaveRoom={leaveRoom}
          onShareInvite={shareRoomInvite}
          onMarkReady={markReady}
          openUserProfile={openUserProfile}
          inspectedUser={inspectedUser}
          setInspectedUser={setInspectedUser}
          handleAddFriendTarget={handleAddFriendTarget}
          handleChallengeTarget={handleChallengeTarget}
        />
        {rootOverlays}
      </>
    );
  }

  if (!room) {
    return (
      <ScreenContainer style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2a9c7a" />
      </ScreenContainer>
    );
  }

  return (
    <>
      <PvpMatchContainer
        room={room}
        playerId={playerId}
        safeName={safeName}
        sfxOn={sfxOn}
        toggleSfx={toggleSfx}
        isSocketConnected={isSocketConnected}
        activeEmote={activeEmote}
        sendEmote={sendEmote}
        progress={progress}
        activeBoardSkinColor={activeBoardSkinColor}
        activeVictoryEffect={activeVictoryEffect}
        gameCountdown={gameCountdown}
        boardSelection={boardSelection}
        allFinishedWords={allFinishedWords}
        inspectedPath={inspectedPath}
        setInspectedPath={setInspectedPath}
        inspectedColor={inspectedColor}
        inspectWord={inspectWord}
        selectedWordInfo={selectedWordInfo}
        setSelectedWordInfo={setSelectedWordInfo}
        notice={notice}
        showResultModal={showResultModal}
        setShowResultModal={setShowResultModal}
        showLeaveDuelModal={showLeaveDuelModal}
        setShowLeaveDuelModal={setShowLeaveDuelModal}
        selectedModeInfo={selectedModeInfo}
        setSelectedModeInfo={setSelectedModeInfo}
        requestRematch={requestRematch}
        leaveRoom={leaveRoom}
        openUserProfile={openUserProfile}
        watchAd={watchAd}
        setGlobalToast={setGlobalToast}
        inspectedUser={inspectedUser}
        setInspectedUser={setInspectedUser}
        handleAddFriendTarget={handleAddFriendTarget}
        handleChallengeTarget={handleChallengeTarget}
        handleLiveGameExitPress={handleLiveGameExitPress}
        gameScrollRef={gameScrollRef}
        boardWidth={boardWidth}
      />
      {rootOverlays}
    </>
  );
}
