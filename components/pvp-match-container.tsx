import React, { useEffect, useRef, useState } from "react";
import type { ScrollView } from "react-native";
import { PvpMatchScreen } from "./pvp-match-screen";
import {
  getRoundDurationMs,
  wordFromSelection,
  wordScoreMultiplier,
  type BoardSize,
  type RoomSnapshot,
} from "../shared/game";
import type { PlayerProgress } from "../shared/progression";
import type { ToastData } from "./global-game-toast";
import type { InspectableUser } from "./user-profile-modal";
import type { useBoardSelection } from "../hooks/use-board-selection";

export interface PvpMatchContainerProps {
  room: RoomSnapshot;
  playerId: string;
  safeName: string;
  sfxOn: boolean;
  toggleSfx: (val: boolean) => void;
  isSocketConnected: boolean;
  activeEmote: { id?: string; playerId: string; playerName: string; emote: string } | null;
  sendEmote: (emote: string) => void;
  progress: PlayerProgress;
  activeBoardSkinColor: string;
  activeVictoryEffect: string;
  gameCountdown: number | null;
  boardSelection: ReturnType<typeof useBoardSelection>;
  allFinishedWords: { word: string; path: number[]; color: string; isMissed: boolean }[];
  inspectedPath: number[] | null;
  setInspectedPath: (path: number[] | null) => void;
  inspectedColor: string;
  inspectWord: (word: string, path: number[] | null, color: string) => void;
  selectedWordInfo: any;
  setSelectedWordInfo: (info: any) => void;
  notice: string;
  showResultModal: boolean;
  setShowResultModal: (show: boolean) => void;
  showLeaveDuelModal: boolean;
  setShowLeaveDuelModal: (show: boolean) => void;
  selectedModeInfo: "pvp" | "daily" | "vintage" | "arcade" | "solo" | null;
  setSelectedModeInfo: (mode: "pvp" | "daily" | "vintage" | "arcade" | "solo" | null) => void;
  requestRematch: () => void;
  leaveRoom: () => void;
  openUserProfile: (user: any) => void;
  watchAd: (onReward: () => void) => void;
  setGlobalToast: (toast: ToastData | null) => void;
  inspectedUser: InspectableUser | null;
  setInspectedUser: (user: InspectableUser | null) => void;
  handleAddFriendTarget: (user: InspectableUser) => void;
  handleChallengeTarget: (user: InspectableUser, size?: BoardSize) => void;
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
  handleLiveGameExitPress: () => void;
  gameScrollRef: React.RefObject<ScrollView | null>;
  boardWidth: number;
}

export function PvpMatchContainer({
  room,
  playerId,
  safeName,
  sfxOn,
  toggleSfx,
  isSocketConnected,
  activeEmote,
  sendEmote,
  progress,
  activeBoardSkinColor,
  activeVictoryEffect,
  gameCountdown,
  boardSelection,
  allFinishedWords,
  inspectedPath,
  setInspectedPath,
  inspectedColor,
  inspectWord,
  selectedWordInfo,
  setSelectedWordInfo,
  notice,
  showResultModal,
  setShowResultModal,
  showLeaveDuelModal,
  setShowLeaveDuelModal,
  selectedModeInfo,
  setSelectedModeInfo,
  requestRematch,
  leaveRoom,
  openUserProfile,
  watchAd,
  setGlobalToast,
  inspectedUser,
  setInspectedUser,
  handleAddFriendTarget,
  handleChallengeTarget,
  livesModalElement,
  celebrationModalElement,
  handleLiveGameExitPress,
  gameScrollRef,
  boardWidth,
}: PvpMatchContainerProps) {
  const [clockNow, setClockNow] = useState(() => Date.now());

  useEffect(() => {
    if (room?.status !== "playing" || !room.startedAt) return;
    setClockNow(Date.now());
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [room?.startedAt, room?.status]);

  const opponent = room.players.find((player) => player.id !== playerId) ?? null;
  const activeWord = wordFromSelection(room.board, boardSelection.selectedCells);
  const iWon = room.winnerId === playerId;
  const isDraw = Boolean(room.status === "finished" && !room.winnerId);
  const myScore = room.scores[playerId] ?? 0;
  const opponentScore = opponent ? room.scores[opponent.id] ?? 0 : 0;
  const myWordCount = room.foundWords.filter((entry) => entry.playerId === playerId).length ?? 0;
  const [pvpCombo, setPvpCombo] = useState(0);
  const lastFoundTimeRef = useRef<number>(0);
  const prevWordCountRef = useRef(myWordCount);

  useEffect(() => {
    if (myWordCount > prevWordCountRef.current) {
      const now = Date.now();
      const diff = now - lastFoundTimeRef.current;
      lastFoundTimeRef.current = now;
      if (diff < 8000 && lastFoundTimeRef.current > 0) {
        setPvpCombo((c) => Math.min(5, c + 1));
      } else {
        setPvpCombo(1);
      }
    }
    prevWordCountRef.current = myWordCount;
  }, [myWordCount]);
  const opponentWordCount = opponent ? room.foundWords.filter((entry) => entry.playerId !== playerId).length ?? 0 : 0;
  const myLastFoundWord = room.foundWords.filter((entry) => entry.playerId === playerId).at(-1)?.word ?? "";
  const myMultiplier = wordScoreMultiplier(myLastFoundWord.length);
  const roundDuration = getRoundDurationMs(room.size);
  const remainingMs =
    room.status === "playing" && room.startedAt
      ? Math.max(0, Math.min(roundDuration, room.startedAt + roundDuration - clockNow))
      : 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isFinalPush = room.status === "playing" && remainingSeconds > 0 && remainingSeconds <= 10;
  const disconnectRemainingSeconds = room.disconnectExpiresAt
    ? Math.max(0, Math.ceil((room.disconnectExpiresAt - clockNow) / 1000))
    : 0;
  const elapsedSeconds = room.startedAt ? Math.max(1, Math.floor((clockNow - room.startedAt) / 1000)) : 1;
  const myTempo = Math.round(((myWordCount * 60) / elapsedSeconds) * 10) / 10;
  const opponentTempo = Math.round(((opponentWordCount * 60) / elapsedSeconds) * 10) / 10;
  const scoreDifference = myScore - opponentScore;
  const scoreLeadLabel =
    scoreDifference === 0 ? "EŞİT" : scoreDifference > 0 ? `+${scoreDifference} ÖNDE` : `${scoreDifference} GERİDE`;
  const isBotMatch = Boolean(room.players.some((p) => p.isBot));
  const isCustomRoom = Boolean(room.isCustom || !room.isRanked);
  const hasContributedInMatch = myWordCount > 0 || myScore > 0;
  const matchXpEarned =
    isCustomRoom || (!hasContributedInMatch && !iWon)
      ? 0
      : (progress.lastMatchReward?.xp ?? (iWon ? (isBotMatch ? 35 : 60) : isDraw ? (isBotMatch ? 20 : 40) : isBotMatch ? 10 : 15));
  const matchLpEarned = isCustomRoom
    ? 0
    : (progress.lastMatchReward?.lp ?? (iWon ? (isBotMatch ? 15 : 25) : isDraw ? 0 : isBotMatch ? -10 : -20));
  const matchCoinsEarned =
    isCustomRoom || (!hasContributedInMatch && !iWon)
      ? 0
      : (progress.lastMatchReward?.coins ?? (iWon ? (isBotMatch ? 4 : 10) : 1));

  return (
    <PvpMatchScreen
      room={room}
      playerId={playerId}
      safeName={safeName}
      sfxOn={sfxOn}
      toggleSfx={toggleSfx}
      isSocketConnected={isSocketConnected}
      remainingSeconds={remainingSeconds}
      isFinalPush={isFinalPush}
      myMultiplier={myMultiplier}
      myWordCount={myWordCount}
      pvpCombo={pvpCombo}
      opponentWordCount={opponentWordCount}
      myScore={myScore}
      opponentScore={opponentScore}
      scoreDifference={scoreDifference}
      scoreLeadLabel={scoreLeadLabel}
      myTempo={myTempo}
      opponentTempo={opponentTempo}
      disconnectRemainingSeconds={disconnectRemainingSeconds}
      activeEmote={activeEmote}
      onSendEmote={sendEmote}
      progress={progress}
      activeBoardSkinColor={activeBoardSkinColor}
      activeVictoryEffect={activeVictoryEffect}
      matchXpEarned={matchXpEarned}
      matchLpEarned={matchLpEarned}
      matchCoinsEarned={matchCoinsEarned}
      isCustomRoom={isCustomRoom}
      gameCountdown={gameCountdown}
      selectedCells={boardSelection.selectedCells}
      selectionFeedback={boardSelection.selectionFeedback}
      activeWord={activeWord}
      isSelecting={boardSelection.isSelecting}
      setIsSelecting={boardSelection.setIsSelecting}
      getCellCenter={boardSelection.getCellCenter}
      allFinishedWords={allFinishedWords}
      inspectedPath={inspectedPath}
      setInspectedPath={setInspectedPath}
      inspectedColor={inspectedColor}
      particles={boardSelection.particles}
      boardRef={boardSelection.boardRef}
      measureBoard={boardSelection.measureBoard}
      boardWidth={boardWidth}
      handleGestureStart={boardSelection.handleGestureStart}
      handleGestureMove={boardSelection.handleGestureMove}
      handleGestureEnd={boardSelection.handleGestureEnd}
      selectionActiveRef={boardSelection.selectionActiveRef}
      clearSelection={boardSelection.clearSelection}
      submitSelection={() => boardSelection.submitSelection()}
      pendingWordRef={boardSelection.pendingWordRef}
      selectedWordInfo={selectedWordInfo}
      setSelectedWordInfo={setSelectedWordInfo}
      inspectWord={inspectWord}
      notice={notice}
      showResultModal={showResultModal}
      setShowResultModal={setShowResultModal}
      showLeaveDuelModal={showLeaveDuelModal}
      setShowLeaveDuelModal={setShowLeaveDuelModal}
      selectedModeInfo={selectedModeInfo}
      setSelectedModeInfo={setSelectedModeInfo}
      onRequestRematch={requestRematch}
      onLeaveRoom={leaveRoom}
      onOpenUserProfile={openUserProfile}
      onWatchAd={watchAd}
      onSetGlobalToast={setGlobalToast}
      inspectedUser={inspectedUser}
      setInspectedUser={setInspectedUser}
      onAddFriendTarget={handleAddFriendTarget}
      onChallengeTarget={handleChallengeTarget}
      livesModalElement={livesModalElement}
      celebrationModalElement={celebrationModalElement}
      onLiveGameExitPress={handleLiveGameExitPress}
      gameScrollRef={gameScrollRef}
    />
  );
}
