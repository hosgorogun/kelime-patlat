import React from "react";
import { StatusBar } from "expo-status-bar";
import { ScreenContainer } from "./screen-container";
import { RoomWaitingScreen } from "./room-waiting-screen";
import { UserProfileModal, type InspectableUser } from "./user-profile-modal";
import { socialManager } from "../shared/social";
import { triggerHapticSelection } from "../shared/audio-haptics";
import type { RoomSnapshot, BoardSize } from "../shared/game";

export interface RoomWaitingContainerProps {
  room: RoomSnapshot;
  playerId: string;
  safeName: string;
  notice: string;
  onLeaveRoom: () => void;
  onShareInvite: () => void;
  onMarkReady: () => void;
  openUserProfile: (user: any) => void;
  inspectedUser: InspectableUser | null;
  setInspectedUser: (user: InspectableUser | null) => void;
  handleAddFriendTarget: (user: InspectableUser) => void;
  handleChallengeTarget: (user: InspectableUser, size?: BoardSize) => void;
  celebrationModalElement: React.ReactNode;
}

export function RoomWaitingContainer({
  room,
  playerId,
  safeName,
  notice,
  onLeaveRoom,
  onShareInvite,
  onMarkReady,
  openUserProfile,
  inspectedUser,
  setInspectedUser,
  handleAddFriendTarget,
  handleChallengeTarget,
  celebrationModalElement,
}: RoomWaitingContainerProps) {
  return (
    <ScreenContainer style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
      <StatusBar style="dark" />
      <RoomWaitingScreen
        room={room}
        playerId={playerId}
        notice={notice}
        onLeaveRoom={onLeaveRoom}
        onShareInvite={onShareInvite}
        onMarkReady={onMarkReady}
        onOpenUserProfile={(player) => {
          triggerHapticSelection();
          openUserProfile(player);
        }}
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
      {celebrationModalElement}
    </ScreenContainer>
  );
}
