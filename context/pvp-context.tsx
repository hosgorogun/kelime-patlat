import React, { createContext, useContext } from "react";
import type { BoardSize, RoomSnapshot } from "@/shared/game";
import type { FriendRequest, FriendUser } from "@/shared/social";
import type { InspectableUser } from "@/components/profile/user-profile-modal";

export interface PvPContextValue {
  // Socket & Real-time Room State
  room: RoomSnapshot | null;
  isSocketConnected: boolean;
  gameCountdown: number | null;
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
  // Matchmaking & Invites
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
  watchAd: (onReward: () => void) => void;
  // Social In-PvP Interactions
  friendsList: FriendUser[];
  pendingRequests: FriendRequest[];
  notice: string;
  setNotice: (msg: string) => void;
  handleAcceptFriendRequest: (reqId: string, fromPlayerId?: string) => void;
  handleRejectFriendRequest: (reqId: string) => void;
  handleSendFriendRequest: (toUsername: string) => Promise<{ success: boolean; message: string }> | any;
  handleAddFriendTarget: (target: InspectableUser) => void;
  handleChallengeTarget: (target: InspectableUser, size?: BoardSize) => Promise<void>;
  // Live Gameplay Interactions
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

const PvPContext = createContext<PvPContextValue | null>(null);

export function PvPProvider({
  value,
  children,
}: {
  value: PvPContextValue;
  children: React.ReactNode;
}) {
  return <PvPContext.Provider value={value}>{children}</PvPContext.Provider>;
}

export function usePvP(): PvPContextValue {
  const ctx = useContext(PvPContext);
  if (!ctx) {
    throw new Error("usePvP must be used within a PvPProvider");
  }
  return ctx;
}
