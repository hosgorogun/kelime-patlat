import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "@/components/shell/main-shell";
import { FriendsLobbyScreen } from "./friends-lobby-screen";
import type { FriendUser } from "@/shared/social";
import type { BoardSize } from "@/shared/game";
import type { InspectableUser } from "@/components/profile/user-profile-modal";
import type { SeasonTab } from "@/components/season/season-hub";

import { useProgression, useNavigation, useUIFeedback, usePvP } from "@/context";

export interface FriendsLobbyContainerProps {
  selectedSize?: BoardSize;
  setSelectedSize?: (size: BoardSize) => void;
  roomCodeInput?: string;
  setRoomCodeInput?: (code: string) => void;
  friendsList?: FriendUser[];
  notice?: string;
  unclaimedMissions?: number;
  hasClaimableDailyReward?: boolean;
  onCreateRoom?: (size: BoardSize) => void;
  onJoinRoom?: () => void;
  onInspectUser?: (user: InspectableUser) => void;
  onChallengeFriend?: (user: InspectableUser, size?: BoardSize) => void;
  setSeasonInitialTab?: (tab: SeasonTab) => void;
  onNavigate?: (destination: any) => void;
}

export function FriendsLobbyContainer(props: FriendsLobbyContainerProps) {
  const progression = useProgression();
  const navigation = useNavigation();
  const uiFeedback = useUIFeedback();
  const pvp = usePvP();

  const selectedSize = props.selectedSize ?? pvp.selectedSize;
  const setSelectedSize = props.setSelectedSize ?? pvp.setSelectedSize;
  const roomCodeInput = props.roomCodeInput ?? pvp.roomCodeInput;
  const setRoomCodeInput = props.setRoomCodeInput ?? pvp.setRoomCodeInput;
  const friendsList = props.friendsList ?? pvp.friendsList;
  const notice = props.notice ?? pvp.notice;
  const unclaimedMissions = props.unclaimedMissions ?? progression.unclaimedMissions;
  const hasClaimableDailyReward = props.hasClaimableDailyReward ?? progression.hasClaimableDailyReward;
  const onCreateRoom = props.onCreateRoom ?? pvp.createRoom;
  const onJoinRoom = props.onJoinRoom ?? pvp.joinRoom;
  const onInspectUser = props.onInspectUser ?? uiFeedback.setInspectedUser;
  const onChallengeFriend = props.onChallengeFriend ?? pvp.handleChallengeTarget;
  const setSeasonInitialTab = props.setSeasonInitialTab ?? navigation.setSeasonInitialTab;
  const onNavigate = props.onNavigate ?? navigation.setScreen;
  return (
    <MainShell
      active="home"
      onNavigate={(destination) => onNavigate(destination)}
      missionsBadgeCount={unclaimedMissions}
      storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
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
