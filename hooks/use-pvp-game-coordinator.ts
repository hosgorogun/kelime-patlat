import React, { useRef } from "react";
import { ScrollView } from "react-native";
import { useRoomSocket } from "./use-room-socket";
import { usePvpMatchEffects } from "./use-pvp-match-effects";
import { useBoardSelection } from "./use-board-selection";
import { haptics } from "../lib/haptics";
import { gameSfx } from "../lib/game-sfx";
import type { RoomSnapshot } from "../shared/game";
import type { PlayerProgress } from "../shared/progression";
import type { ToastData } from "../components/global-game-toast";
import type { FriendRequest } from "../shared/social";
import type { Screen } from "../App";

export interface UsePvpGameCoordinatorParams {
  width: number;
  playerId: string;
  safeName: string;
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud: (progress: PlayerProgress) => Promise<void>;
  flushPendingAwards: () => Promise<void>;
  setScreen: (screen: Screen) => void;
  screenRef: React.MutableRefObject<Screen>;
  setNotice: (msg: string) => void;
  setGlobalToast: (toast: ToastData | null) => void;
  setLeaderboard: (data: any) => void;
  setPendingRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>;
}

export function usePvpGameCoordinator({
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
}: UsePvpGameCoordinatorParams) {
  const gameScrollRef = useRef<ScrollView>(null);
  const prevStartedAtRef = useRef<number | null>(null);
  const recordedRoundRef = useRef<string | null>(null);

  const clearSelectionRef = useRef<() => void>(() => {});
  const onWordAcceptedRef = useRef<(foundWords: RoomSnapshot["foundWords"]) => void>(() => {});
  const onWordRejectedRef = useRef<(payload?: { word?: string; reason?: string }) => void>(() => {});

  const setInspectedPathRef = useRef<(p: number[] | null) => void>(() => {});
  const setSelectedWordInfoRef = useRef<(info: any) => void>(() => {});
  const setShowResultModalRef = useRef<(s: boolean) => void>(() => {});
  const setShowLeaveDuelModalRef = useRef<(s: boolean) => void>(() => {});
  const setGameCountdownRef = useRef<(c: number | null) => void>(() => {});

  const roomSocket = useRoomSocket({
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
    onWordAccepted: (words) => onWordAcceptedRef.current(words),
    onWordRejected: (payload) => onWordRejectedRef.current(payload),
    clearSelection: () => clearSelectionRef.current(),
    setInspectedPath: (p) => setInspectedPathRef.current(p),
    setSelectedWordInfo: (info) => setSelectedWordInfoRef.current(info),
    setShowResultModal: (s) => setShowResultModalRef.current(s),
    setShowLeaveDuelModal: (s) => setShowLeaveDuelModalRef.current(s),
    setGameCountdown: (c) => setGameCountdownRef.current(c),
    setLeaderboard,
    setPendingRequests,
    prevStartedAtRef,
    recordedRoundRef,
  });

  const pvpEffects = usePvpMatchEffects({
    room: roomSocket.room,
    playerId,
    progress,
    setProgress,
    syncProgressToCloud,
    prevStartedAtRef,
    recordedRoundRef,
  });

  setInspectedPathRef.current = pvpEffects.setInspectedPath;
  setSelectedWordInfoRef.current = pvpEffects.setSelectedWordInfo;
  setShowResultModalRef.current = pvpEffects.setShowResultModal;
  setShowLeaveDuelModalRef.current = pvpEffects.setShowLeaveDuelModal;
  setGameCountdownRef.current = pvpEffects.setGameCountdown;

  const boardWidth = Math.min(
    width -
      (roomSocket.room?.size === 10
        ? 20
        : roomSocket.room?.size === 8
        ? 28
        : roomSocket.room?.size === 6
        ? 34
        : 40),
    roomSocket.room?.size === 10
      ? 410
      : roomSocket.room?.size === 8
      ? 392
      : roomSocket.room?.size === 6
      ? 374
      : 356
  );

  const boardSelection = useBoardSelection({
    room: roomSocket.room,
    playerId,
    boardWidth,
    setNotice,
  });

  clearSelectionRef.current = boardSelection.clearSelection;

  onWordAcceptedRef.current = (foundWords) => {
    const pendingWord = boardSelection.pendingWordRef.current;
    const accepted = Boolean(
      pendingWord &&
        foundWords.some((entry) => entry.word === pendingWord && entry.playerId === playerId)
    );
    if (accepted) {
      if (boardSelection.pendingWordTimeoutRef.current) {
        clearTimeout(boardSelection.pendingWordTimeoutRef.current);
      }
      boardSelection.pendingWordRef.current = null;
      boardSelection.setSelectionFeedback("accepted");
      boardSelection.explodeParticles(boardSelection.selectionRef.current);
      haptics.success();
      gameSfx.accepted();
      boardSelection.clearFeedbackLater(360);
    }
  };

  onWordRejectedRef.current = (payload) => {
    if (boardSelection.pendingWordTimeoutRef.current) {
      clearTimeout(boardSelection.pendingWordTimeoutRef.current);
    }
    boardSelection.pendingWordRef.current = null;
    haptics.error();
    let msg = "Bu kelime tahtadaki gizli kelimelerden biri değil.";
    if (payload?.reason === "starting") {
      msg = "Tur henüz başlamadı, geri sayımın bitmesini bekle.";
    } else if (payload?.reason === "time_up") {
      msg = "Süre doldu!";
    } else if (payload?.reason === "already_found") {
      msg = payload.word ? `“${payload.word}” daha önce bulundu.` : "Bu kelime daha önce bulundu.";
    }
    setNotice(msg);
    boardSelection.setSelectionFeedback("invalid");
    gameSfx.rejected();
    boardSelection.clearFeedbackLater();
  };

  return {
    ...roomSocket,
    ...pvpEffects,
    boardSelection,
    boardWidth,
    gameScrollRef,
  };
}
