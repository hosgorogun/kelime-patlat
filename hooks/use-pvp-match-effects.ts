import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { RoomSnapshot } from "../shared/game";
import type { PlayerProgress } from "../shared/progression";
import { applyMatchProgress } from "../shared/progression";
import { reviewManager } from "../lib/engagement";
import { gameSfx } from "../lib/game-sfx";
import { haptics } from "../lib/haptics";
import { getApiBaseUrl } from "../constants/oauth";
import { fetchWordDetail, getCachedWordDetail, getWordDefinition } from "../shared/dictionary";
import { APP_WORD_PALETTE } from "../shared/solo";

interface UsePvpMatchEffectsParams {
  room: RoomSnapshot | null;
  playerId: string;
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud: (progress: PlayerProgress) => Promise<void>;
  prevStartedAtRef?: React.MutableRefObject<number | null>;
  recordedRoundRef?: React.MutableRefObject<string | null>;
}

export function usePvpMatchEffects({
  room,
  playerId,
  progress,
  setProgress,
  syncProgressToCloud,
  prevStartedAtRef: externalPrevStartedAtRef,
  recordedRoundRef: externalRecordedRoundRef,
}: UsePvpMatchEffectsParams) {
  const [gameCountdown, setGameCountdown] = useState<number | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showLeaveDuelModal, setShowLeaveDuelModal] = useState(false);
  const [selectedWordInfo, setSelectedWordInfo] = useState<{
    word: string;
    definition: string;
    type?: string;
    example?: string;
    source?: string;
    loading?: boolean;
  } | null>(null);
  const [inspectedPath, setInspectedPath] = useState<number[] | null>(null);
  const [inspectedColor, setInspectedColor] = useState<string>("#F59E0B");

  const prevRoomStatusRef = useRef<string | null>(null);
  const localPrevStartedAtRef = useRef<number | null>(null);
  const prevStartedAtRef = externalPrevStartedAtRef || localPrevStartedAtRef;
  const localRecordedRoundRef = useRef<string | null>(null);
  const recordedRoundRef = externalRecordedRoundRef || localRecordedRoundRef;
  const victoryCueRef = useRef<string | null>(null);

  // Finished words list computation
  const allFinishedWords = useMemo(() => {
    if (!room || room.status !== "finished") return [];
    const myFound = room.foundWords.filter((entry: RoomSnapshot["foundWords"][number]) => entry.playerId === playerId);
    const list: { word: string; path: number[]; color: string; isMissed: boolean }[] = [];
    myFound.forEach((w: RoomSnapshot["foundWords"][number], idx: number) => {
      const palette = APP_WORD_PALETTE[idx % APP_WORD_PALETTE.length]!;
      list.push({ word: w.word, path: w.path, color: palette.border, isMissed: false });
    });
    if (room.missedWords) {
      room.missedWords.forEach((w: { word: string; path: number[] }, idx: number) => {
        const colorIdx = (myFound.length + idx) % APP_WORD_PALETTE.length;
        const palette = APP_WORD_PALETTE[colorIdx]!;
        list.push({ word: w.word, path: w.path, color: palette.border, isMissed: true });
      });
    }
    return list;
  }, [room, playerId]);

  // Inspect word details and definition
  const inspectWord = useCallback((word: string, path: number[] | null, color: string) => {
    haptics.light();
    setInspectedColor(color);
    if (path) setInspectedPath(path);

    const cached = getCachedWordDetail(word);
    const syncDef = cached ? cached.definition : getWordDefinition(word);
    const hasRealDef = cached || (syncDef && !syncDef.includes("Kelime Patlat ile kelime dağarcığını"));

    setSelectedWordInfo({
      word,
      definition: hasRealDef ? syncDef : "TDK sözlüğünden anlamı yükleniyor...",
      type: cached?.type,
      example: cached?.example,
      source: cached?.source || "TDK",
      loading: !hasRealDef,
    });

    fetchWordDetail(word, getApiBaseUrl())
      .then((detail: any) => {
        setSelectedWordInfo((prev) => {
          if (!prev || prev.word !== word) return prev;
          return {
            word,
            definition: detail.definition,
            type: detail.type,
            example: detail.example,
            source: detail.source,
            loading: false,
          };
        });
      })
      .catch(() => {
        setSelectedWordInfo((prev) => (prev && prev.word === word ? { ...prev, loading: false } : prev));
      });
  }, []);

  // Auto-inspect first word when match finishes
  useEffect(() => {
    if (room?.status !== "finished") {
      if (inspectedPath) setInspectedPath(null);
      if (selectedWordInfo) setSelectedWordInfo(null);
      return;
    }
    if (room.status === "finished" && allFinishedWords.length > 0 && !inspectedPath) {
      const first = allFinishedWords[0]!;
      inspectWord(first.word, first.path, first.color);
    }
  }, [room?.status, allFinishedWords, inspectedPath, selectedWordInfo, inspectWord]);

  // Countdown timer
  useEffect(() => {
    if (gameCountdown === null) return;
    if (gameCountdown === 0) {
      const timer = setTimeout(() => {
        setGameCountdown(null);
      }, 700);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      if (gameCountdown === 1) {
        setGameCountdown(0);
        return;
      }
      if (gameCountdown > 1) {
        setGameCountdown(gameCountdown - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [gameCountdown]);

  // Apply match progression when room finishes
  useEffect(() => {
    if (!room || room.status !== "finished") return;
    const roundId = `${room.code}:${room.startedAt ?? 0}`;
    if (recordedRoundRef.current === roundId) return;
    recordedRoundRef.current = roundId;
    const myFoundWords = room.foundWords
      .filter((entry: RoomSnapshot["foundWords"][number]) => entry.playerId === playerId && !entry.hidden)
      .map((entry: RoomSnapshot["foundWords"][number]) => entry.word);
    const foundLongWord = myFoundWords.some((w: string) => w.length >= 7);
    const isBotMatch = room.players.some((p: RoomSnapshot["players"][number]) => p.isBot);
    // Compute result values directly from room to avoid stale derived-state deps
    const currentMyScore = room.scores[playerId] ?? 0;
    const myWc = room.foundWords.filter((e: RoomSnapshot["foundWords"][number]) => e.playerId === playerId).length;
    const elapsedSec = room.startedAt ? Math.max(5, Math.floor((Date.now() - room.startedAt) / 1000)) : 5;
    const currentTempo = Math.round(((myWc * 60) / elapsedSec) * 10) / 10;
    const currentIWon = room.winnerId === playerId;
    const currentIsDraw = !room.winnerId;

    if (currentIWon) {
      void reviewManager.recordVictoryAndCheckPrompt(progress.wins + 1);
    }

    const opponent = room.players.find((p: RoomSnapshot["players"][number]) => p.id !== playerId);
    const opponentScore = opponent ? (room.scores[opponent.id] ?? 0) : 0;
    const isFriendGame = Boolean((room as any).isFriendGame || room.isCustom || !room.isRanked);

    setProgress((current: PlayerProgress) => {
      const updated = applyMatchProgress(
        current,
        {
          score: currentMyScore,
          tempo: currentTempo,
          won: currentIWon,
          isDraw: currentIsDraw,
          longWord: foundLongWord,
          foundWords: myFoundWords,
          size: room.size,
          opponentName: opponent?.name || (isBotMatch ? "Siber Bot" : "Rakip"),
          opponentAvatar: opponent?.avatar,
          opponentScore: opponentScore,
          isFriendGame: isFriendGame,
        },
        isBotMatch ? "bot" : "pvp"
      );
      void syncProgressToCloud(updated);
      return updated;
    });
  }, [room, playerId, progress.wins, setProgress, syncProgressToCloud]);

  // Handle room status sound effects, countdown trigger and victory cues
  useEffect(() => {
    if (!room) return;
    const roundId = `${room.code}:${room.startedAt ?? 0}`;
    if (room.status === "playing") {
      victoryCueRef.current = null;
      setShowResultModal(false);
      setInspectedPath(null);
      setSelectedWordInfo(null);
      if (room.startedAt && room.startedAt !== prevStartedAtRef.current) {
        prevStartedAtRef.current = room.startedAt;
        if (room.startedAt > Date.now() - 1500) {
          setGameCountdown(3);
          gameSfx.tap();
          haptics.select();
        } else {
          setGameCountdown(null);
        }
      }
    } else {
      setGameCountdown(null);
    }
    if (room.status === "finished" && prevRoomStatusRef.current !== "finished") {
      setShowResultModal(true);
      if (room.winnerId === playerId && victoryCueRef.current !== roundId) {
        victoryCueRef.current = roundId;
        gameSfx.victory();
        haptics.victory();
      } else if (room.winnerId && room.winnerId !== playerId) {
        haptics.error();
      }
    }
    prevRoomStatusRef.current = room.status;
  }, [room, playerId]);

  return {
    gameCountdown,
    setGameCountdown,
    showResultModal,
    setShowResultModal,
    showLeaveDuelModal,
    setShowLeaveDuelModal,
    selectedWordInfo,
    setSelectedWordInfo,
    inspectedPath,
    setInspectedPath,
    inspectedColor,
    setInspectedColor,
    allFinishedWords,
    inspectWord,
    prevStartedAtRef,
    recordedRoundRef,
  };
}
