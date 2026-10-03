import React from "react";
import { StatusBar } from "expo-status-bar";
import { ScreenContainer } from "../common/screen-container";
import { RoomWaitingScreen } from "./room-waiting-screen";
import { UserProfileModal, type InspectableUser } from "../profile/user-profile-modal";
import { socialManager } from "@/shared/social";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { isEqualTr } from "@/shared/tr-utils";
import { useAuth, useUIFeedback, usePvP } from "@/context";
import type { RoomSnapshot, BoardSize } from "@/shared/game";

export interface RoomWaitingContainerProps {
  room?: RoomSnapshot;
  playerId?: string;
  safeName?: string;
  notice?: string;
  onLeaveRoom?: () => void;
  onShareInvite?: () => void;
  onMarkReady?: () => void;
  openUserProfile?: (user: any) => void;
  inspectedUser?: InspectableUser | null;
  setInspectedUser?: (user: InspectableUser | null) => void;
  handleAddFriendTarget?: (user: InspectableUser) => void;
  handleChallengeTarget?: (user: InspectableUser, size?: BoardSize) => void;
}

export function RoomWaitingContainer(props: RoomWaitingContainerProps) {
  const auth = useAuth();
  const uiFeedback = useUIFeedback();
  const pvp = usePvP();

  const playerId = props.playerId ?? auth.playerId;
  const safeName = props.safeName ?? auth.safeName;
  const openUserProfile = props.openUserProfile ?? uiFeedback.openUserProfile;
  const inspectedUser = props.inspectedUser ?? uiFeedback.inspectedUser;
  const setInspectedUser = props.setInspectedUser ?? uiFeedback.setInspectedUser;

  const room = props.room ?? pvp.room!;
  const notice = props.notice ?? pvp.notice;
  const onLeaveRoom = props.onLeaveRoom ?? pvp.leaveRoom;
  const onShareInvite = props.onShareInvite ?? pvp.shareRoomInvite;
  const onMarkReady = props.onMarkReady ?? pvp.markReady;
  const handleAddFriendTarget = props.handleAddFriendTarget ?? pvp.handleAddFriendTarget;
  const handleChallengeTarget = props.handleChallengeTarget ?? pvp.handleChallengeTarget;

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
              isEqualTr(inspectedUser.username || inspectedUser.name, safeName)
            : false
        }
        isFriend={
          inspectedUser
            ? socialManager
                .getFriends()
                .some((f) =>
                  isEqualTr(f.username, inspectedUser.username || inspectedUser.name)
                )
            : false
        }
        onClose={() => setInspectedUser(null)}
        onAddFriend={handleAddFriendTarget}
        onChallenge={handleChallengeTarget}
      />
    </ScreenContainer>
  );
}
