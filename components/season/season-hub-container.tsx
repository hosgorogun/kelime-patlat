import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "../shell/main-shell";
import { SeasonHub, type SeasonTab } from "./season-hub";
import { UserProfileModal, type InspectableUser } from "../profile/user-profile-modal";
import { socialManager, type FriendRequest } from "@/shared/social";
import type { BoardSize, LeaderboardEntry } from "@/shared/game";
import type { PlayerProgress } from "@/shared/progression";

export interface SeasonHubContainerProps {
  screen: "season" | "league";
  seasonInitialTab: SeasonTab;
  playerId: string;
  playerName: string;
  safeName: string;
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  leaderboard: LeaderboardEntry[];
  pendingRequests: FriendRequest[];
  onAcceptFriendRequest: (requestId: string) => void;
  onRejectFriendRequest: (requestId: string) => void;
  onSendFriendRequest: (toUsername: string) => Promise<{ success: boolean; message: string }>;
  onChallengeFriend: (friendName: string, size?: BoardSize) => void;
  openUserProfile: (target: any) => void;
  inspectedUser: InspectableUser | null;
  setInspectedUser: (user: InspectableUser | null) => void;
  handleAddFriendTarget: (target: InspectableUser) => void;
  handleChallengeTarget: (target: InspectableUser, size?: BoardSize) => void;
  unclaimedMissions: number;
  hasClaimableDailyReward: boolean;
  onNavigate: (destination: any) => void;
}

export function SeasonHubContainer({
  screen,
  seasonInitialTab,
  playerId,
  playerName,
  safeName,
  progress,
  setProgress,
  leaderboard,
  pendingRequests,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onSendFriendRequest,
  onChallengeFriend,
  openUserProfile,
  inspectedUser,
  setInspectedUser,
  handleAddFriendTarget,
  handleChallengeTarget,
  unclaimedMissions,
  hasClaimableDailyReward,
  onNavigate,
}: SeasonHubContainerProps) {
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
              (inspectedUser.username || inspectedUser.name).toLocaleLowerCase("tr-TR") ===
                safeName.toLocaleLowerCase("tr-TR")
            : false
        }
        isFriend={
          inspectedUser
            ? socialManager
                .getFriends()
                .some(
                  (f) =>
                    f.username.toLocaleLowerCase("tr-TR") ===
                    (inspectedUser.username || inspectedUser.name).toLocaleLowerCase("tr-TR")
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
