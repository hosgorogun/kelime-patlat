import React, { useRef } from "react";
import { ScrollView } from "react-native";
import { useRoomSocket } from "./use-room-socket";
import { usePvpMatchEffects } from "./use-pvp-match-effects";
import { useBoardSelection } from "./use-board-selection";
import { haptics } from "../lib/haptics";
import { gameSfx } from "../lib/game-sfx";
import type { RoomSnapshot } from "../shared/game";
import type { PlayerProgress } from "../shared/progression";
import type { ToastData } from "../components/common/global-game-toast";
import type { FriendRequest } from "../shared/social";
import type { Screen } from "@/components/shell/types";
import { isEqualTr } from "@/shared/tr-utils";

export interface UsePvpGameCoordinatorParams {
  width: number;
  height?: number;
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
  height,
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
  const onWordBonusRef = useRef<(payload: { word: string; selection: number[]; bonusPoints: number; coins: number }) => void>(() => {});
  const onWordRejectedRef = useRef<(payload?: { word?: string; reason?: string }) => void>(() => {});

  const setInspectedPathRef = useRef<(p: number[] | null) => void>(() => {});
  const setSelectedWordInfoRef = useRef<(info: any) => void>(() => {});
  const setShowResultModalRef = useRef<(s: boolean) => void>(() => {});
  const setShowLeaveDuelModalRef = useRef<(s: boolean) => void>(() => {});
  const setGameCountdownRef = useRef<(c: number | null) => void>(() => {});

  const handleWordAccepted = React.useCallback((words: RoomSnapshot["foundWords"]) => {
    onWordAcceptedRef.current(words);
  }, []);
  const handleWordBonus = React.useCallback((payload: { word: string; selection: number[]; bonusPoints: number; coins: number }) => {
    onWordBonusRef.current(payload);
  }, []);
  const handleWordRejected = React.useCallback((payload?: { word?: string; reason?: string }) => {
    onWordRejectedRef.current(payload);
  }, []);
  const handleClearSelection = React.useCallback(() => {
    clearSelectionRef.current();
  }, []);
  const handleSetInspectedPath = React.useCallback((p: number[] | null) => {
    setInspectedPathRef.current(p);
  }, []);
  const handleSetSelectedWordInfo = React.useCallback((info: any) => {
    setSelectedWordInfoRef.current(info);
  }, []);
  const handleSetShowResultModal = React.useCallback((s: boolean) => {
    setShowResultModalRef.current(s);
  }, []);
  const handleSetShowLeaveDuelModal = React.useCallback((s: boolean) => {
    setShowLeaveDuelModalRef.current(s);
  }, []);
  const handleSetGameCountdown = React.useCallback((c: number | null) => {
    setGameCountdownRef.current(c);
  }, []);

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
    onWordAccepted: handleWordAccepted,
    onWordBonus: handleWordBonus,
    onWordRejected: handleWordRejected,
    clearSelection: handleClearSelection,
    setInspectedPath: handleSetInspectedPath,
    setSelectedWordInfo: handleSetSelectedWordInfo,
    setShowResultModal: handleSetShowResultModal,
    setShowLeaveDuelModal: handleSetShowLeaveDuelModal,
    setGameCountdown: handleSetGameCountdown,
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

  const maxBoardFromHeight = height ? Math.floor(height * 0.46) : 410;
  const maxBoardByDimension =
    roomSocket.room?.size === 10
      ? 410
      : roomSocket.room?.size === 8
      ? 392
      : roomSocket.room?.size === 6
      ? 374
      : 356;

  const boardWidth = Math.min(
    width -
      (roomSocket.room?.size === 10
        ? 20
        : roomSocket.room?.size === 8
        ? 28
        : roomSocket.room?.size === 6
        ? 34
        : 40),
    maxBoardByDimension,
    maxBoardFromHeight
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
        foundWords.some((entry) => isEqualTr(entry.word, pendingWord) && entry.playerId === playerId)
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

  onWordBonusRef.current = (payload) => {
    if (boardSelection.pendingWordTimeoutRef.current) {
      clearTimeout(boardSelection.pendingWordTimeoutRef.current);
    }
    boardSelection.pendingWordRef.current = null;
    boardSelection.setSelectionFeedback("bonus");
    boardSelection.explodeParticles(payload.selection || boardSelection.selectionRef.current);
    haptics.success();
    gameSfx.victory();
    setNotice(`✨ GİZLİ BONUS KELİME: “${payload.word}”! +${payload.bonusPoints} PUAN`);

    // Oyuncuya anında 2 çip bonusu ver ve buluta eşitle
    if (payload.coins && payload.coins > 0) {
      setProgress((curr) => {
        const updated = {
          ...curr,
          coins: (curr.coins ?? 0) + payload.coins,
        };
        void syncProgressToCloud(updated);
        return updated;
      });
    }

    // Hücreleri kısa altın parıltıdan sonra serbest bırak
    boardSelection.clearFeedbackLater(550);
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
