import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "./main-shell";
import { FriendsLobbyScreen } from "./friends-lobby-screen";
import type { FriendUser } from "../shared/social";
import type { BoardSize } from "../shared/game";
import type { ToastData } from "./global-game-toast";
import type { InspectableUser } from "./user-profile-modal";
import type { SeasonTab } from "./season-hub";

export interface FriendsLobbyContainerProps {
  selectedSize: BoardSize;
  setSelectedSize: (size: BoardSize) => void;
  roomCodeInput: string;
  setRoomCodeInput: (code: string) => void;
  friendsList: FriendUser[];
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
  onCreateRoom: (size: BoardSize) => void;
  onJoinRoom: () => void;
  onInspectUser: (user: InspectableUser) => void;
  onChallengeFriend: (user: InspectableUser, size?: BoardSize) => void;
  setSeasonInitialTab: (tab: SeasonTab) => void;
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
  onNavigate: (destination: any) => void;
}

export function FriendsLobbyContainer({
  selectedSize,
  setSelectedSize,
  roomCodeInput,
  setRoomCodeInput,
  friendsList,
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
  onCreateRoom,
  onJoinRoom,
  onInspectUser,
  onChallengeFriend,
  setSeasonInitialTab,
  livesModalElement,
  celebrationModalElement,
  onNavigate,
}: FriendsLobbyContainerProps) {
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
      <FriendsLobbyScreen
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        roomCodeInput={roomCodeInput}
        onRoomCodeChange={setRoomCodeInput}
        friendsList={friendsList}
        notice={notice}
        onBack={() => onNavigate("home")}
        onCreateRoom={(size) => onCreateRoom(size)}
        onJoinRoom={() => onJoinRoom()}
        onInspectUser={(user) => onInspectUser(user)}
        onChallengeFriend={(user, size) => onChallengeFriend(user, size)}
        onFindFriends={() => {
          setSeasonInitialTab("friends");
          onNavigate("season");
        }}
        onOpenLeaderboard={() => {
          setSeasonInitialTab("leaderboard");
          onNavigate("season");
        }}
      />
    </MainShell>
  );
}
