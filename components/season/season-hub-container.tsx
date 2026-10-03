import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "../shell/main-shell";
import { SeasonHub, type SeasonTab } from "./season-hub";
import { UserProfileModal, type InspectableUser } from "../profile/user-profile-modal";
import { socialManager, type FriendRequest } from "@/shared/social";
import { isEqualTr } from "@/shared/tr-utils";
import type { BoardSize, LeaderboardEntry } from "@/shared/game";
import type { PlayerProgress } from "@/shared/progression";

import { useProgression, useNavigation, useAuth, useUIFeedback, usePvP } from "@/context";

export interface SeasonHubContainerProps {
  screen?: "season" | "league";
  seasonInitialTab?: SeasonTab;
  playerId?: string;
  playerName?: string;
  safeName?: string;
  progress?: PlayerProgress;
  setProgress?: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  leaderboard?: LeaderboardEntry[];
  pendingRequests?: FriendRequest[];
  onAcceptFriendRequest?: (requestId: string) => void;
  onRejectFriendRequest?: (requestId: string) => void;
  onSendFriendRequest?: (toUsername: string) => Promise<{ success: boolean; message: string }>;
  onChallengeFriend?: (friendName: string, size?: BoardSize) => void;
  openUserProfile?: (target: any) => void;
  inspectedUser?: InspectableUser | null;
  setInspectedUser?: (user: InspectableUser | null) => void;
  handleAddFriendTarget?: (target: InspectableUser) => void;
  handleChallengeTarget?: (target: InspectableUser, size?: BoardSize) => void;
  unclaimedMissions?: number;
  hasClaimableDailyReward?: boolean;
  onNavigate?: (destination: any) => void;
}

export function SeasonHubContainer(props: SeasonHubContainerProps) {
  const progression = useProgression();
  const navigation = useNavigation();
  const auth = useAuth();
  const uiFeedback = useUIFeedback();
  const pvp = usePvP();

  const screen = (props.screen ?? navigation.screen) as "season" | "league";
  const seasonInitialTab = props.seasonInitialTab ?? navigation.seasonInitialTab;
  const playerId = props.playerId ?? auth.playerId;
  const playerName = props.playerName ?? auth.playerName;
  const safeName = props.safeName ?? auth.safeName;
  const progress = props.progress ?? progression.progress;
  const setProgress = props.setProgress ?? progression.setProgress;
  const leaderboard = props.leaderboard ?? progression.leaderboard;
  const openUserProfile = props.openUserProfile ?? uiFeedback.openUserProfile;
  const inspectedUser = props.inspectedUser ?? uiFeedback.inspectedUser;
  const setInspectedUser = props.setInspectedUser ?? uiFeedback.setInspectedUser;
  const unclaimedMissions = props.unclaimedMissions ?? progression.unclaimedMissions;
  const hasClaimableDailyReward = props.hasClaimableDailyReward ?? progression.hasClaimableDailyReward;
  const onNavigate = props.onNavigate ?? navigation.setScreen;

  const pendingRequests = props.pendingRequests ?? pvp.pendingRequests;
  const onAcceptFriendRequest = props.onAcceptFriendRequest ?? pvp.handleAcceptFriendRequest;
  const onRejectFriendRequest = props.onRejectFriendRequest ?? pvp.handleRejectFriendRequest;
  const onSendFriendRequest = props.onSendFriendRequest ?? pvp.handleSendFriendRequest;
  const handleAddFriendTarget = props.handleAddFriendTarget ?? pvp.handleAddFriendTarget;
  const handleChallengeTarget = props.handleChallengeTarget ?? pvp.handleChallengeTarget;
  const onChallengeFriend = props.onChallengeFriend ?? (async (friendName, size) => {
    const targetFriend = pvp.friendsList.find(
      (f) => f.name === friendName || f.username === friendName
    );
    if (targetFriend) {
      await pvp.handleChallengeTarget(targetFriend as any, size);
    }
  });
  return (
    <MainShell
      active="season"
      onNavigate={onNavigate}
      missionsBadgeCount={unclaimedMissions}
      storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
    >
      <StatusBar style="dark" />
      <SeasonHub
        initialTab={screen === "league" ? "leagues" : seasonInitialTab}
        playerId={playerId}
        playerName={playerName}
        progress={progress}
        leaderboard={leaderboard}
        onBack={() => onNavigate("home")}
        onOpenLeagueHub={() => onNavigate("league")}
        onPlayRanked={() => onNavigate("online")}
        pendingRequests={pendingRequests}
        onAcceptRequest={onAcceptFriendRequest}
        onRejectRequest={onRejectFriendRequest}
        onSendFriendRequest={onSendFriendRequest}
        onChallengeFriend={onChallengeFriend}
        onUpdateFriends={(updatedFriends) => {
          setProgress((current) => ({
            ...current,
            friends: updatedFriends,
          }));
        }}
        onInspectUser={openUserProfile}
      />
      <UserProfileModal
        visible={inspectedUser !== null}
        user={inspectedUser}
        isSelf={
          inspectedUser
            ? inspectedUser.id === playerId ||
              isEqualTr(inspectedUser.username || inspectedUser.name, safeName)
            : false
        }
        isFriend={
          inspectedUser
            ? socialManager
                .getFriends()
                .some(
                  (f) =>
                    isEqualTr(f.username, inspectedUser.username || inspectedUser.name)
                )
            : false
        }
        onClose={() => setInspectedUser(null)}
        onAddFriend={handleAddFriendTarget}
        onChallenge={handleChallengeTarget}
      />
    </MainShell>
  );
}
