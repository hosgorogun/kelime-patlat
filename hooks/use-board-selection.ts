import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, type View } from "react-native";
import { getGameSocket } from "../lib/game-socket";
import { haptics } from "../lib/haptics";
import { gameSfx } from "../lib/game-sfx";
import { advanceSelection, wordFromSelection, type RoomSnapshot } from "../shared/game";

export interface UseBoardSelectionParams {
  room: RoomSnapshot | null;
  playerId: string;
  boardWidth: number;
  setNotice: (notice: string) => void;
}

export function useBoardSelection({
  room,
  playerId,
  boardWidth,
  setNotice,
}: UseBoardSelectionParams) {
  const selectionRef = useRef<number[]>([]);
  const selectionActiveRef = useRef(false);
  const pendingWordRef = useRef<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGestureStartTimeRef = useRef(0);
  const lastTouchedIndexRef = useRef<number | null>(null);

  const boardRef = useRef<View>(null);
  const boardPageX = useRef(0);
  const boardPageY = useRef(0);

  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionFeedback, setSelectionFeedback] = useState<"idle" | "invalid" | "accepted">("idle");
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; color: string; anim: Animated.ValueXY }[]
  >([]);

  const measureBoard = useCallback(() => {
    boardRef.current?.measure((x, y, width, height, pageX, pageY) => {
      if (pageX !== undefined) boardPageX.current = pageX;
      if (pageY !== undefined) boardPageY.current = pageY;
    });
  }, []);

  const getCellCenter = useCallback(
    (cellIndex: number) => {
      if (!room) return { x: 0, y: 0 };
      const BOARD_PAD = 4;
      const innerSize = boardWidth - BOARD_PAD * 2;
      const cellSize = innerSize / room.size;
      const row = Math.floor(cellIndex / room.size);
      const col = cellIndex % room.size;
      return {
        x: col * cellSize + cellSize / 2 + BOARD_PAD,
        y: row * cellSize + cellSize / 2 + BOARD_PAD,
      };
    },
    [room, boardWidth]
  );

  const explodeParticles = useCallback(
    (cells: number[]) => {
      if (!room) return;
      const newParticles: typeof particles = [];

      cells.forEach((cellIndex) => {
        const { x, y } = getCellCenter(cellIndex);
        for (let i = 0; i < 8; i++) {
          const anim = new Animated.ValueXY({ x: 0, y: 0 });
          const id = Math.random();
          newParticles.push({ id, x, y, color: "#219d8d", anim });

          const angle = Math.random() * Math.PI * 2;
          const speed = 15 + Math.random() * 35;

          Animated.timing(anim, {
            toValue: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
            duration: 350,
            useNativeDriver: true,
          }).start();
        }
      });

      setParticles((prev) => [...prev, ...newParticles]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
      }, 380);
    },
    [room, getCellCenter]
  );

  const clearSelection = useCallback(() => {
    selectionRef.current = [];
    lastTouchedIndexRef.current = null;
    setSelectedCells([]);
  }, []);

  const clearFeedbackLater = useCallback(
    (delay = 620) => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => {
        clearSelection();
        setSelectionFeedback("idle");
      }, delay);
    },
    [clearSelection]
  );

  const includeCell = useCallback(
    (index: number | null) => {
      if (index === null || !room) return;
      const previous = selectionRef.current;
      const next = advanceSelection(previous, index, room.size);
      if (next === previous) return;
      if (next.length === previous.length && previous.at(-2) !== index) {
        setNotice("Yalnız yatay veya dikey komşu harflere geçebilirsin.");
        return;
      }
      selectionRef.current = next;
      setSelectedCells(next);
      if (next.length < previous.length) haptics.light();
      else haptics.select();
    },
    [room, setNotice]
  );

  const submitSelection = useCallback(
    (fromPointer = false) => {
      if (!room) return;
      if (selectionRef.current.length < 2) {
        if (!fromPointer) {
          haptics.error();
          setNotice("Kelime göndermek için en az 2 harf seç.");
        }
        return;
      }
      const selected = [...selectionRef.current];
      if (pendingWordRef.current) return;
      pendingWordRef.current = wordFromSelection(room.board, selected);
      setSelectionFeedback("idle");
      getGameSocket().emit("word:submit", { code: room.code, playerId, selection: selected });

      if (pendingWordTimeoutRef.current) clearTimeout(pendingWordTimeoutRef.current);
      pendingWordTimeoutRef.current = setTimeout(() => {
        if (pendingWordRef.current) {
          pendingWordRef.current = null;
          setSelectionFeedback("idle");
          clearSelection();
        }
      }, 1500);
    },
    [room, playerId, clearSelection, setNotice]
  );

  const startPointerSelection = useCallback(
    (index: number) => {
      if (room?.status !== "playing") return;
      if (pendingWordRef.current) return;
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
      selectionActiveRef.current = true;
      setSelectionFeedback("idle");
      clearSelection();
      gameSfx.select();
      includeCell(index);
    },
    [clearSelection, includeCell, room?.status]
  );

  const continuePointerSelection = useCallback(
    (index: number) => {
      if (!selectionActiveRef.current || room?.status !== "playing") return;
      includeCell(index);
    },
    [includeCell, room?.status]
  );

  const finishPointerSelection = useCallback(() => {
    if (!selectionActiveRef.current) return;
    selectionActiveRef.current = false;
    submitSelection(true);
  }, [submitSelection]);

  const handleGesture = (locationX: number, locationY: number) => {
    if (!room || room.status !== "playing") return;
    const BOARD_PAD = 4;
    const innerSize = boardWidth - BOARD_PAD * 2;
    const ox = locationX - BOARD_PAD;
    const oy = locationY - BOARD_PAD;
    if (ox < 0 || ox > innerSize || oy < 0 || oy > innerSize) return;
    const cellSize = innerSize / room.size;
    const col = Math.floor(ox / cellSize);
    const row = Math.floor(oy / cellSize);
    if (col >= 0 && col < room.size && row >= 0 && row < room.size) {
      const index = row * room.size + col;
      if (lastTouchedIndexRef.current === index) return;
      lastTouchedIndexRef.current = index;
      const isFound = room.foundWords.some(
        (entry) => entry.playerId === playerId && entry.path.includes(index)
      );
      if (isFound) return;
      if (!selectionActiveRef.current) {
        if (pendingWordRef.current) return;
        if (feedbackTimerRef.current) {
          clearTimeout(feedbackTimerRef.current);
          feedbackTimerRef.current = null;
        }
        selectionActiveRef.current = true;
        setSelectionFeedback("idle");
        clearSelection();
        gameSfx.select();
        includeCell(index);
      } else {
        includeCell(index);
      }
    }
  };

  const getEventPageCoords = (event: any) => {
    const ne = event.nativeEvent ?? event;
    if (ne.touches && ne.touches.length > 0) {
      return { pageX: ne.touches[0].pageX, pageY: ne.touches[0].pageY };
    }
    return { pageX: ne.pageX ?? 0, pageY: ne.pageY ?? 0 };
  };

  const getEventBoardCoords = (event: any) => {
    const ne = event.nativeEvent ?? event;
    const x = ne.locationX ?? ne.offsetX;
    const y = ne.locationY ?? ne.offsetY;
    if (x !== undefined && y !== undefined) {
      return { x, y };
    }
    if (event.currentTarget && typeof event.currentTarget.getBoundingClientRect === "function") {
      const rect = event.currentTarget.getBoundingClientRect();
      const clientX = ne.clientX ?? (ne.touches && ne.touches[0] ? ne.touches[0].clientX : 0);
      const clientY = ne.clientY ?? (ne.touches && ne.touches[0] ? ne.touches[0].clientY : 0);
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }
    const { pageX, pageY } = getEventPageCoords(event);
    return {
      x: pageX - boardPageX.current,
      y: pageY - boardPageY.current,
    };
  };

  const handleGestureStart = (event: any) => {
    event.preventDefault?.();
    event.stopPropagation?.();
    const now = Date.now();
    // 60ms içinde gelen mükerrer pointer/touch çift tetiklenmesini engelle
    if (now - lastGestureStartTimeRef.current < 60) return;
    lastGestureStartTimeRef.current = now;
    setIsSelecting(true);
    measureBoard();
    const { x, y } = getEventBoardCoords(event);
    handleGesture(x, y);
  };

  const handleGestureMove = (event: any) => {
    event.preventDefault?.();
    event.stopPropagation?.();
    if (!selectionActiveRef.current) return;
    const { x, y } = getEventBoardCoords(event);
    handleGesture(x, y);
  };

  const handleGestureEnd = () => {
    setIsSelecting(false);
    if (!selectionActiveRef.current) return;
    selectionActiveRef.current = false;
    lastGestureStartTimeRef.current = 0;
    submitSelection(true);
  };

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (pendingWordTimeoutRef.current) clearTimeout(pendingWordTimeoutRef.current);
    };
  }, []);

  return {
    boardRef,
    boardPageX,
    boardPageY,
    selectionRef,
    selectionActiveRef,
    pendingWordRef,
    feedbackTimerRef,
    pendingWordTimeoutRef,
    selectedCells,
    setSelectedCells,
    isSelecting,
    setIsSelecting,
    selectionFeedback,
    setSelectionFeedback,
    particles,
    setParticles,
    measureBoard,
    getCellCenter,
    explodeParticles,
    clearSelection,
    clearFeedbackLater,
    includeCell,
    submitSelection,
    startPointerSelection,
    continuePointerSelection,
    finishPointerSelection,
    handleGestureStart,
    handleGestureMove,
    handleGestureEnd,
  };
}
