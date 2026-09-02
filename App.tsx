import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ActivityIndicator,
  Alert,
  Switch,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ScreenContainer } from "./components/screen-container";
import { CommandCenter } from "./components/command-center";
import { MatchInsight } from "./components/match-insight";
import { PremiumDock, type DockDestination } from "./components/premium-dock";
import { PlayerCollection } from "./components/player-collection";
import { SeasonHub } from "./components/season-hub";
import { SoloChallenge } from "./components/solo-challenge";
import { SoloLevels } from "./components/solo-levels";
import { ArcadeChallenge } from "./components/arcade-challenge";
import { getGameSocket } from "./lib/game-socket";
import { OnboardingGuide } from "./components/onboarding-guide";
import { haptics, setHapticsEnabled } from "./lib/haptics";
import { gameSfx, setSfxEnabled } from "./lib/game-sfx";
import { setHapticsEnabled as setSoloHapticsEnabled } from "./shared/audio-haptics";
import { advanceSelection, getRoundDurationMs, wordFromSelection, wordScoreMultiplier, type BoardSize, type LeaderboardEntry, type RoomSnapshot } from "./shared/game";
import { applyMatchProgress, applyArcadeProgress, completeDailyProgress, DEFAULT_PROGRESS, getDailyChallenge, AVATARS, getPlayerLevel, type DailyChallenge, type PlayerProgress, THEME_PACKS } from "./shared/progression";
import { inviteMessage, normalizeRoomCode } from "./shared/invite";
import { MAX_SOLO_LEVEL } from "./shared/solo";
import { initManusRuntime } from "./lib/_core/manus-runtime";
import { getWordDefinition } from "./shared/dictionary";
import { AuthScreen } from "./components/auth-screen";
import { MissionsScreen } from "./components/missions-screen";
import { SESSION_TOKEN_KEY, getApiBaseUrl } from "./constants/oauth";

type Screen = "home" | "online" | "profile" | "levels" | "solo" | "room" | "game" | "season" | "arcade" | "daily-lobby" | "missions";

const SOLO_UNLOCK_KEY = "kelime-patlat:solo-unlocked-level";
const PROGRESS_KEY = "kelime-patlat:season-progress-v1";

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "KP";
}

function ConnectLine({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x1,
        top: y1 - 2.5,
        width: length,
        height: 5,
        backgroundColor: color,
        transform: [
          { rotate: `${angle}rad` }
        ],
        transformOrigin: "0% 50%",
        zIndex: 10,
        opacity: 0.85,
        borderRadius: 2.5
      }}
    />
  );
}

function HomeScreen() {
  const { width } = useWindowDimensions();
  const selectionRef = useRef<number[]>([]);
  const selectionActiveRef = useRef(false);
  const activeRoomCodeRef = useRef<string | null>(null);
  const pendingWordRef = useRef<string | null>(null);
  const remoteProfileRef = useRef(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<View>(null);
  const boardPageX = useRef(0);
  const boardPageY = useRef(0);

  const measureBoard = () => {
    boardRef.current?.measure((x, y, width, height, pageX, pageY) => {
      if (pageX !== undefined) boardPageX.current = pageX;
      if (pageY !== undefined) boardPageY.current = pageY;
    });
  };

  const getCellCenter = (cellIndex: number) => {
    if (!room) return { x: 0, y: 0 };
    const cellSize = boardWidth / room.size;
    const row = Math.floor(cellIndex / room.size);
    const col = cellIndex % room.size;
    return {
      x: col * cellSize + cellSize / 2,
      y: row * cellSize + cellSize / 2,
    };
  };

  const getEventPageCoords = (event: any) => {
    const ne = event.nativeEvent ?? event;
    if (ne.touches && ne.touches.length > 0) {
      return { pageX: ne.touches[0].pageX, pageY: ne.touches[0].pageY };
    }
    return { pageX: ne.pageX ?? 0, pageY: ne.pageY ?? 0 };
  };
  const [screen, setScreen] = useState<Screen>("home");
  const [playerName, setPlayerName] = useState("OYUNCU");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [playerId, setPlayerId] = useState<string>(() => `player-${Math.random().toString(36).slice(2, 10)}`);
  const [selectedWordInfo, setSelectedWordInfo] = useState<{ word: string; definition: string } | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [selectedSize, setSelectedSize] = useState<BoardSize>(4);
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [sfxOn, setSfxOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("kelime-patlat:sfx-enabled").then((val) => {
      const enabled = val !== "false";
      setSfxOn(enabled);
      setSfxEnabled(enabled);
    }).catch(() => undefined);
    AsyncStorage.getItem("kelime-patlat:haptics-enabled").then((val) => {
      const enabled = val !== "false";
      setHapticsOn(enabled);
      setHapticsEnabled(enabled);
      setSoloHapticsEnabled(enabled);
    }).catch(() => undefined);
  }, []);

  const toggleSfx = (val: boolean) => {
    setSfxOn(val);
    setSfxEnabled(val);
    AsyncStorage.setItem("kelime-patlat:sfx-enabled", String(val)).catch(() => undefined);
  };
  
  const toggleHaptics = (val: boolean) => {
    setHapticsOn(val);
    setHapticsEnabled(val);
    setSoloHapticsEnabled(val);
    AsyncStorage.setItem("kelime-patlat:haptics-enabled", String(val)).catch(() => undefined);
  };
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; anim: Animated.ValueXY }[]>([]);

  const explodeParticles = (cells: number[]) => {
    if (!room) return;
    const newParticles: typeof particles = [];
    
    cells.forEach((cellIndex) => {
      const { x, y } = getCellCenter(cellIndex);
      for (let i = 0; i < 8; i++) {
        const anim = new Animated.ValueXY({ x: 0, y: 0 });
        const id = Math.random();
        newParticles.push({ id, x, y, color: "#2DD4BF", anim });
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 15 + Math.random() * 35;
        
        Animated.timing(anim, {
          toValue: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          duration: 350,
          useNativeDriver: true
        }).start();
      }
    });

    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter(p => !newParticles.includes(p)));
    }, 380);
  };

  const [isSelecting, setIsSelecting] = useState(false);
  const [notice, setNotice] = useState("Bir oda kur ve rakibini davet et.");
  const [selectionFeedback, setSelectionFeedback] = useState<"idle" | "invalid" | "accepted">("idle");
  const [soloLevel, setSoloLevel] = useState(1);
  const [soloUnlockedLevel, setSoloUnlockedLevel] = useState(1);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [progressReady, setProgressReady] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailySession, setDailySession] = useState<DailyChallenge | null>(null);
  const daily = useMemo(() => getDailyChallenge(), []);
  const incomingUrl = Linking.useURL();
  const recordedRoundRef = useRef<string | null>(null);
  const victoryCueRef = useRef<string | null>(null);

  const safeName = playerName.trim().slice(0, 16) || "OYUNCU";
  const boardWidth = Math.min(
    width - (room?.size === 10 ? 20 : room?.size === 8 ? 28 : room?.size === 6 ? 34 : 40),
    room?.size === 10 ? 410 : room?.size === 8 ? 392 : room?.size === 6 ? 374 : 356
  );
  const me = room?.players.find((player) => player.id === playerId) ?? null;
  const opponent = room?.players.find((player) => player.id !== playerId) ?? null;
  const activeWord = room ? wordFromSelection(room.board, selectedCells) : "";
  const iWon = room?.winnerId === playerId;
  const myScore = room?.scores[playerId] ?? 0;
  const opponentScore = opponent ? room?.scores[opponent.id] ?? 0 : 0;
  const myWordCount = room?.foundWords.filter((entry) => entry.playerId === playerId).length ?? 0;
  const opponentWordCount = opponent ? room?.foundWords.filter((entry) => entry.playerId !== playerId).length ?? 0 : 0;
  const myLastFoundWord = room?.foundWords.filter((entry) => entry.playerId === playerId).at(-1)?.word ?? "";
  const myMultiplier = wordScoreMultiplier(myLastFoundWord.length);
  const roundDuration = room ? getRoundDurationMs(room.size) : 0;
  const remainingMs = room?.status === "playing" && room.startedAt ? Math.max(0, room.startedAt + roundDuration - clockNow) : 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isFinalPush = room?.status === "playing" && remainingSeconds > 0 && remainingSeconds <= 10;
  const elapsedSeconds = room?.startedAt ? Math.max(1, Math.floor((clockNow - room.startedAt) / 1000)) : 1;
  const myTempo = Math.round((myWordCount * 60 / elapsedSeconds) * 10) / 10;
  const opponentTempo = Math.round((opponentWordCount * 60 / elapsedSeconds) * 10) / 10;
  const scoreDifference = myScore - opponentScore;
  const scoreLeadLabel = scoreDifference === 0 ? "EŞİT" : scoreDifference > 0 ? `+${scoreDifference} ÖNDE` : `${scoreDifference} GERİDE`;

  useEffect(() => {
    if (room?.status !== "playing" || !room.startedAt) return;
    setClockNow(Date.now());
    const timer = setInterval(() => setClockNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [room?.startedAt, room?.status]);

  const clearSelection = useCallback(() => {
    selectionRef.current = [];
    setSelectedCells([]);
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(SOLO_UNLOCK_KEY).then((stored) => {
      const storedLevel = Number(stored);
      if (active && Number.isInteger(storedLevel) && storedLevel >= 1) {
        setSoloUnlockedLevel(Math.min(storedLevel, MAX_SOLO_LEVEL));
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  // Load token and verify auth state
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(SESSION_TOKEN_KEY).then(async (token) => {
      if (!active) return;
      if (token) {
        try {
          const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            const user = data?.user || data;
            if (user && user.openId) {
              setAuthToken(token);
              setPlayerId(user.openId);
              setPlayerName(user.name || user.username || "OYUNCU");
              await AsyncStorage.setItem("kelime-patlat:player-id", user.openId);
              await AsyncStorage.setItem("kelime-patlat:player-name", user.name || user.username || "OYUNCU");
              if (user.progress) {
                setProgress(user.progress);
              }
            } else {
              await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
            }
          } else {
            // Bad response status (like 401 Unauthorized), clean up
            await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
          }
        } catch (err) {
          console.warn("[Auth] Failed to verify token on startup (offline fallback active):", err);
          const cachedId = await AsyncStorage.getItem("kelime-patlat:player-id");
          const cachedName = await AsyncStorage.getItem("kelime-patlat:player-name");
          setAuthToken(token);
          setPlayerId(cachedId || `offline-${Math.random().toString(36).slice(2, 10)}`);
          setPlayerName(cachedName || "OYUNCU");
        }
      }
      setAuthLoading(false);
    }).catch(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  const syncProgressToCloud = useCallback(async (currentProgress: PlayerProgress) => {
    try {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      if (!token) return;
      await fetch(`${getApiBaseUrl()}/api/auth/sync-progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ progress: currentProgress })
      });
    } catch (err) {
      console.warn("[Auth] Cloud sync failed:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PROGRESS_KEY).then((stored) => {
      if (!active) return;
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<PlayerProgress>;
          setProgress({ ...DEFAULT_PROGRESS, ...parsed, missions: { ...DEFAULT_PROGRESS.missions, ...parsed.missions } });
        } catch { setProgress(DEFAULT_PROGRESS); }
      }
      setProgressReady(true);
    }).catch(() => { if (active) setProgressReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!progressReady) return;
    AsyncStorage.getItem("kelime-patlat:guide-seen").then((seen) => {
      if (!seen && progress.xp === 0) {
        setShowGuide(true);
      }
    });
  }, [progressReady, progress.xp]);

  useEffect(() => {
    if (!progressReady) return;
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => undefined);
    AsyncStorage.setItem("kelime-patlat:player-name", safeName).catch(() => undefined);
    if (authToken) {
      syncProgressToCloud(progress);
    }
    if (remoteProfileRef.current) {
      remoteProfileRef.current = false;
      return;
    }
    getGameSocket().emit("profile:save", { playerId, playerName: safeName, progress });
  }, [progress, progressReady, safeName, playerId, authToken, syncProgressToCloud]);

  useEffect(() => {
    if (!incomingUrl) return;
    const code = normalizeRoomCode(Linking.parse(incomingUrl).queryParams?.code);
    if (code) {
      setRoomCodeInput(code);
      setScreen("online");
      setNotice("Davet kodu hazır. Adını kontrol edip odaya katıl.");
    }
  }, [incomingUrl]);

  useEffect(() => {
    if (!room || room.status !== "finished") return;
    const roundId = `${room.code}:${room.startedAt ?? 0}`;
    if (recordedRoundRef.current === roundId) return;
    recordedRoundRef.current = roundId;
    const foundLongWord = room.foundWords.some((entry) => entry.playerId === playerId && !entry.hidden && entry.word.length >= 7);
    const isBotMatch = room.players.some((p) => p.isBot);
    setProgress((current) => applyMatchProgress(current, { score: myScore, tempo: myTempo, won: Boolean(iWon), longWord: foundLongWord }, isBotMatch ? "bot" : "pvp"));
  }, [iWon, myScore, myTempo, room, playerId]);

  useEffect(() => {
    if (!room) return;
    const roundId = `${room.code}:${room.startedAt ?? 0}`;
    if (room.status === "playing") victoryCueRef.current = null;
    if (room.status === "finished" && room.winnerId === playerId && victoryCueRef.current !== roundId) {
      victoryCueRef.current = roundId;
      gameSfx.victory();
      haptics.victory();
    }
  }, [room, playerId]);

  const clearFeedbackLater = useCallback((delay = 620) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      clearSelection();
      setSelectionFeedback("idle");
    }, delay);
  }, [clearSelection]);

  const setRoomFromServer = useCallback((next: RoomSnapshot) => {
    activeRoomCodeRef.current = next.code;
    setRoom(next);
    if (next.status === "playing" || next.status === "finished") setScreen("game");
    else setScreen("room");
    setNotice(next.message);
    const pendingWord = pendingWordRef.current;
    const accepted = Boolean(pendingWord && next.foundWords.some((entry) => entry.word === pendingWord && entry.playerId === playerId));
    if (accepted) {
      if (pendingWordTimeoutRef.current) clearTimeout(pendingWordTimeoutRef.current);
      pendingWordRef.current = null;
      setSelectionFeedback("accepted");
      explodeParticles(selectedCells);
      haptics.success();
      gameSfx.accepted();
      clearFeedbackLater(360);
    } else if (next.status !== "playing") {
      clearSelection();
    }
  }, [clearFeedbackLater, clearSelection]);

  useEffect(() => {
    const socket = getGameSocket();
    const onRoomUpdate = (next: RoomSnapshot) => setRoomFromServer(next);
    const onRoomError = (payload: { message?: string }) => {
      haptics.error();
      setNotice(payload.message ?? "Odayla ilgili bir sorun oluştu.");
    };
    const onRejected = () => {
      if (pendingWordTimeoutRef.current) clearTimeout(pendingWordTimeoutRef.current);
      pendingWordRef.current = null;
      haptics.error();
      setNotice("Bu kelime tahtadaki gizli kelimelerden biri değil veya daha önce bulundu.");
      setSelectionFeedback("invalid");
      gameSfx.rejected();
      clearFeedbackLater();
    };
    const onLeaderboardUpdate = (next: LeaderboardEntry[]) => setLeaderboard(next);
    const onProfileUpdate = (next: { playerId: string; name: string; progress: PlayerProgress }) => {
      if (next.playerId !== playerId) return;
      remoteProfileRef.current = true;
      setProgress({ ...DEFAULT_PROGRESS, ...next.progress, missions: { ...DEFAULT_PROGRESS.missions, ...next.progress.missions } });
      if (next.name) setPlayerName(next.name);
    };
    const onReconnect = () => {
      socket.emit("profile:load", { playerId });
      if (activeRoomCodeRef.current) {
        socket.emit("room:reconnect", { code: activeRoomCodeRef.current, playerId });
      }
    };

    socket.on("room:update", onRoomUpdate);
    socket.on("room:error", onRoomError);
    socket.on("word:rejected", onRejected);
    socket.on("connect", onReconnect);
    socket.on("leaderboard:update", onLeaderboardUpdate);
    socket.on("profile:update", onProfileUpdate);
    socket.emit("leaderboard:request");
    socket.emit("profile:load", { playerId });
    return () => {
      socket.off("room:update", onRoomUpdate);
      socket.off("room:error", onRoomError);
      socket.off("word:rejected", onRejected);
      socket.off("connect", onReconnect);
      socket.off("leaderboard:update", onLeaderboardUpdate);
      socket.off("profile:update", onProfileUpdate);
      if (pendingWordTimeoutRef.current) clearTimeout(pendingWordTimeoutRef.current);
    };
  }, [clearFeedbackLater, setRoomFromServer, playerId]);

  const createRoom = (size = selectedSize) => {
    haptics.light();
    const socket = getGameSocket();
    if (!socket.connected) {
      setNotice("Sunucuya bağlanılamadı. Lütfen internet bağlantını kontrol et.");
      haptics.error();
      return;
    }
    socket.emit("room:create", { playerId, playerName: safeName, size, immediateBot: false });
    setNotice("Odan hazırlanıyor…");
  };

  const startBotDuel = (size: BoardSize) => {
    setSelectedSize(size);
    setScreen("online");
    haptics.light();
    const socket = getGameSocket();
    if (!socket.connected) {
      setNotice("Sunucuya bağlanılamadı. Lütfen internet bağlantını kontrol et.");
      haptics.error();
      return;
    }
    socket.emit("matchmaking:join", { playerId, playerName: safeName, size });
    setNotice("Rakip aranıyor...");
  };

  const shareRoomInvite = async () => {
    if (!room) return;
    const url = Linking.createURL("room", { queryParams: { code: room.code } });
    try {
      await Share.share({ title: "Kelime Patlat düellosu", message: inviteMessage(room.code, url), url });
      haptics.success();
    } catch {
      setNotice("Davet paylaşımı şu anda açılamadı. Oda kodunu doğrudan gönder: " + room.code);
    }
  };

  const joinRoom = () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (code.length < 5) {
      haptics.error();
      setNotice("5 karakterli oda kodunu yaz.");
      return;
    }
    haptics.light();
    getGameSocket().emit("room:join", { code, playerId, playerName: safeName });
    setNotice("Odaya katılıyorsun…");
  };

  const leaveRoom = () => {
    if (room) getGameSocket().emit("room:leave", { code: room.code, playerId });
    getGameSocket().emit("matchmaking:leave", { playerId, size: selectedSize });
    activeRoomCodeRef.current = null;
    setRoom(null);
    clearSelection();
    setScreen("home");
    setNotice("Yeni bir düello için hazırsın.");
  };

  const markReady = () => {
    if (!room) return;
    haptics.light();
    getGameSocket().emit("room:ready", { code: room.code, playerId });
  };

  const requestRematch = () => {
    if (!room) return;
    haptics.light();
    getGameSocket().emit("room:rematch", { code: room.code, playerId });
  };

  const includeCell = useCallback((index: number | null) => {
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
  }, [room]);

  const submitSelection = useCallback((fromPointer = false) => {
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
  }, [room, playerId, clearSelection]);

  const startPointerSelection = useCallback((index: number) => {
    if (room?.status !== "playing") return;
    if (pendingWordRef.current) return;
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    selectionActiveRef.current = true;
    setSelectionFeedback("idle");
    clearSelection();
    gameSfx.select();
    includeCell(index);
  }, [clearSelection, includeCell, room?.status]);

  const continuePointerSelection = useCallback((index: number) => {
    if (!selectionActiveRef.current || room?.status !== "playing") return;
    includeCell(index);
  }, [includeCell, room?.status]);

  const finishPointerSelection = useCallback(() => {
    if (!selectionActiveRef.current) return;
    selectionActiveRef.current = false;
    submitSelection(true);
  }, [submitSelection]);

  const handleGesture = (locationX: number, locationY: number) => {
    if (!room || room.status !== "playing") return;
    const BOARD_PAD = 4; // styles.board padding
    const innerSize = boardWidth - BOARD_PAD * 2;
    const ox = locationX - BOARD_PAD;
    const oy = locationY - BOARD_PAD;
    if (ox < 0 || ox > innerSize || oy < 0 || oy > innerSize) return;
    const cellSize = innerSize / room.size;
    const col = Math.floor(ox / cellSize);
    const row = Math.floor(oy / cellSize);
    if (col >= 0 && col < room.size && row >= 0 && row < room.size) {
      const index = row * room.size + col;
      const isFound = room.foundWords.some(entry => entry.playerId === playerId && entry.path.includes(index));
      if (isFound) return;
      if (!selectionActiveRef.current) {
        if (pendingWordRef.current) return;
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
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
    submitSelection(true);
  };

  const openSoloLevel = (level: number) => {
    setDailySession(null);
    setSoloLevel(Math.min(level, soloUnlockedLevel));
    setScreen("solo");
  };

  const completeSoloLevel = (level: number, foundWords: string[] = []) => {
    setSoloUnlockedLevel((current) => {
      const next = Math.min(MAX_SOLO_LEVEL, Math.max(current, level + 1));
      AsyncStorage.setItem(SOLO_UNLOCK_KEY, String(next)).catch(() => undefined);
      return next;
    });
    setProgress((current) => applyMatchProgress(current, { score: level * 14, tempo: Math.max(1, level / 2), won: true, longWord: level >= 5, foundWords }, "solo"));
  };

  const startDailyChallenge = () => {
    setDailySession(daily);
    setSoloLevel(daily.level);
    setScreen("solo");
  };

  const closeGuide = async () => {
    setShowGuide(false);
    await AsyncStorage.setItem("kelime-patlat:guide-seen", "true");
  };

  const completeDailyChallenge = (level: number, foundWords: string[] = [], won = true) => {
    if (won) {
      setProgress((current) => applyMatchProgress(current, { score: level * 14, tempo: Math.max(1, level / 2), won: true, longWord: level >= 5, foundWords }, "solo"));
      setProgress((current) => completeDailyProgress(current, daily));
    } else {
      setProgress((current) => ({ ...current, dailyCompletedId: daily.id }));
    }
  };

  if (screen === "home") {
    return (
      <MainShell active="home" onNavigate={(destination) => setScreen(destination)}>
        <StatusBar style="light" />
        <CommandCenter playerName={safeName} progress={progress} daily={daily} leaderboard={leaderboard} onPlayDaily={() => setScreen("daily-lobby")} onPlayBot={startBotDuel} onSolo={() => setScreen("levels")} onNavigate={setScreen} onLeaderboard={() => setScreen("season")} onShowGuide={() => setShowGuide(true)} />
      </MainShell>
    );
  }

  if (screen === "daily-lobby") {
    const dailyDone = progress.dailyCompletedId === daily.id;
    return (
      <MainShell active="home" onNavigate={(destination) => setScreen(destination)}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.subHeader}>
            <Pressable onPress={() => setScreen("home")} style={styles.backButton}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <View>
              <Text style={styles.subHeaderKicker}>ETKİNLİK MERKEZİ</Text>
              <Text style={styles.subHeaderTitle}>SABİT ROTA SEÇİMİ</Text>
            </View>
          </View>

          <Text style={styles.modeIntro}>
            Bugünkü günlük rota için oynamak istediğin kelime paketini seç. Günlük sadece 1 kez oynamaya hakkın var! Başarırsan XP ödülü senin, kaybedersen kilitlenir.
          </Text>

          <View style={{ gap: 12 }}>
            {THEME_PACKS.map((pack) => {
              const isSelected = progress.selectedTheme === pack.id;
              return (
                <Pressable
                  key={pack.id}
                  onPress={() => {
                    if (dailyDone) {
                      Alert.alert("🔒 Günlük Rota Kilitlendi", "Bugünkü sabit rotayı zaten tamamladın veya kaybettin! Yarın yeni bir hak kazanacaksın.");
                      return;
                    }
                    haptics.light();
                    setProgress((current) => ({ ...current, selectedTheme: pack.id }));
                  }}
                  style={({ pressed }) => [
                    styles.sizeCard,
                    { borderColor: pack.accent, flexDirection: "row", alignItems: "center", gap: 14 },
                    isSelected && { backgroundColor: pack.glow, borderColor: pack.accent, shadowColor: pack.accent, shadowOpacity: 0.15, shadowRadius: 8 },
                    dailyDone && { opacity: 0.5 },
                    pressed && !dailyDone && styles.pressed
                  ]}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: isSelected ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: pack.accent }}>
                    <Text style={{ fontSize: 22, color: pack.accent }}>{pack.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "900" }}>{pack.label}</Text>
                      {isSelected && <Text style={{ color: pack.accent, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>AKTİF SEÇİM</Text>}
                    </View>
                    <Text style={{ color: "#E2E8F0", fontSize: 12, fontWeight: "800", marginTop: 2 }}>{pack.title}</Text>
                    <Text style={{ color: "#94A3B8", fontSize: 10, marginTop: 2 }}>{pack.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => {
              if (dailyDone) {
                Alert.alert("🔒 Günlük Rota Kilitlendi", "Bugünkü sabit rotayı zaten tamamladın veya kaybettin! Yarın yeni bir hak kazanacaksın.");
                return;
              }
              // Start daily challenge with the selected theme!
              setDailySession({
                ...daily,
                themeId: progress.selectedTheme
              });
              setSoloLevel(daily.level);
              setScreen("solo");
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: THEME_PACKS.find(p => p.id === progress.selectedTheme)?.accent ?? "#06B6D4" },
              dailyDone && styles.disabledButton,
              pressed && !dailyDone && styles.pressed
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: "#0B132B" }]}>
              {dailyDone ? "BUGÜNLÜK HAKKIN BİTTİ" : "BUGÜNKÜ ROTAYI BAŞLAT"}
            </Text>
            <Text style={[styles.primaryButtonArrow, { color: "#0B132B" }]}>→</Text>
          </Pressable>

          <Text style={styles.notice}>
            Süre sınırını yetiştiremezseniz ödül kazanamazsınız ve rota kilitlenir. Başarılar!
          </Text>
        </ScrollView>
      </MainShell>
    );
  }

  if (screen === "season") {
    return <MainShell active="profile" onNavigate={(destination) => setScreen(destination)}><StatusBar style="light" /><SeasonHub playerId={playerId} progress={progress} leaderboard={leaderboard} onBack={() => setScreen("home")} onSelectTheme={(selectedTheme) => setProgress((current) => ({ ...current, selectedTheme }))} /></MainShell>;
  }

  if (screen === "levels") {
    return <MainShell active="home" onNavigate={(destination) => setScreen(destination)}><StatusBar style="light" /><SoloLevels unlockedLevel={soloUnlockedLevel} onBack={() => setScreen("home")} onSelect={openSoloLevel} /></MainShell>;
  }

  if (screen === "solo") {
    return <ScreenContainer style={{ paddingBottom: 16 }}><StatusBar style="light" /><SoloChallenge level={soloLevel} theme={dailySession?.themeId ?? progress.selectedTheme} variationSeed={dailySession?.variation} daily={Boolean(dailySession)} excludeWords={progress.history || []} onExit={() => { const destination = dailySession ? "home" : "levels"; setDailySession(null); setScreen(destination); }} onComplete={dailySession ? completeDailyChallenge : completeSoloLevel} onNext={() => setSoloLevel((current) => Math.min(MAX_SOLO_LEVEL, current + 1))} /></ScreenContainer>;
  }

  if (screen === "arcade") {
    return (
      <ScreenContainer style={{ paddingBottom: 16 }}>
        <StatusBar style="light" />
        <ArcadeChallenge
          onExit={() => setScreen("home")}
          onComplete={(score) => {
            setProgress((current) => applyArcadeProgress(current, score));
          }}
        />
      </ScreenContainer>
    );
  }

  if (screen === "online") {
    return (
      <MainShell active="home" onNavigate={(destination) => setScreen(destination)}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.subHeader}>
            <Pressable onPress={() => setScreen("home")} style={styles.backButton}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <View>
              <Text style={styles.subHeaderKicker}>HIZLI ANTRENMAN</Text>
              <Text style={styles.subHeaderTitle}>BOT DÜELLOSU</Text>
            </View>
          </View>
          
          <Text style={styles.modeIntro}>İsmini seç, oynamak istediğin tahta boyutunu belirle ve anında savaşa başla.</Text>
          
          <View style={styles.nameCard}>
            <Text style={styles.inputLabel}>OYUNCU ADIN</Text>
            <TextInput 
              value={playerName} 
              onChangeText={setPlayerName} 
              maxLength={16} 
              autoCapitalize="characters" 
              style={styles.nameInput} 
              placeholder="OYUNCU" 
              placeholderTextColor="#6F879A" 
            />
          </View>
          
          <Text style={styles.sectionLabel}>TAHTA BOYUTU SEÇİN</Text>
          <View style={styles.sizeRow}>
            {([4, 6, 8, 10] as BoardSize[]).map((size) => {
              const currentLevel = getPlayerLevel(progress.xp);
              const isLocked = size === 6 ? currentLevel < 5 : size === 8 ? currentLevel < 8 : size === 10 ? currentLevel < 10 : false;
              return (
                <Pressable 
                  key={size} 
                  onPress={() => {
                    if (isLocked) {
                      Alert.alert(
                        `🔒 Seviye ${size === 6 ? 5 : size === 8 ? 8 : 10} Gerekli`,
                        `${size}×${size} modu Seviye ${size === 6 ? 5 : size === 8 ? 8 : 10}'de açılır. Şu anki seviyeniz: ${currentLevel}.`
                      );
                      haptics.error();
                    } else {
                      haptics.light();
                      setSelectedSize(size);
                    }
                  }} 
                  style={({ pressed }) => [
                    styles.sizeCard,
                    selectedSize === size && styles.sizeCardSelected,
                    isLocked && { opacity: 0.5 },
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={[styles.sizeValue, selectedSize === size && styles.sizeValueSelected]}>
                    {isLocked ? "🔒" : `${size}×${size}`}
                  </Text>
                  <Text style={styles.sizeCaption}>
                    {size === 4 ? "Nabız (Hızlı)" : size === 6 ? "Akış (Orta)" : size === 8 ? "Derinlik (Zor)" : "Zirve (Usta)"}
                  </Text>
                  <Text style={styles.sizeDetail}>
                    {size === 4 ? "4 rota · 55 sn" : size === 6 ? "6 rota · 75 sn" : size === 8 ? "8 rota · 90 sn" : "10 rota · 110 sn"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          
          <Pressable onPress={() => startBotDuel(selectedSize)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>SAVAŞI BAŞLAT</Text>
            <Text style={styles.primaryButtonArrow}>→</Text>
          </Pressable>
          
          <Text style={styles.notice}>Bot rakipler anında hazır olur ve bekleme süresi yoktur.</Text>
        </ScrollView>
      </MainShell>
    );
  }

  if (authLoading) {
    return (
      <ScreenContainer style={{ flex: 1, backgroundColor: "#121025", justifyContent: "center", alignItems: "center" }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#00F5D4" />
      </ScreenContainer>
    );
  }

  if (!authToken) {
    return (
      <AuthScreen
        onSuccess={async (token, username, cloudProgress, openId) => {
          setAuthToken(token);
          setPlayerId(openId);
          setPlayerName(username);
          await AsyncStorage.setItem("kelime-patlat:player-id", openId);
          await AsyncStorage.setItem("kelime-patlat:player-name", username);
          if (cloudProgress) {
            setProgress(cloudProgress);
          } else {
            syncProgressToCloud(progress);
          }
          setScreen("home");
        }}
      />
    );
  }

  if (screen === "missions") {
    return (
      <MainShell active="missions" onNavigate={(destination) => setScreen(destination)}>
        <StatusBar style="light" />
        <MissionsScreen progress={progress} onBack={() => setScreen("home")} onPlayDaily={() => setScreen("daily-lobby")} />
      </MainShell>
    );
  }

  if (screen === "profile") {
    const activeAvatar = AVATARS.find((a) => a.id === progress.selectedAvatar) ?? AVATARS[0]!;
    return (
      <MainShell active="profile" onNavigate={(destination) => setScreen(destination)}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.subHeader}>
            <View style={[styles.profileAvatarLarge, { backgroundColor: activeAvatar.surface, borderColor: activeAvatar.color, borderWidth: 1.5 }]}>
              <Text style={[styles.profileAvatarLargeText, { color: activeAvatar.color, fontSize: 24 }]}>{activeAvatar.icon}</Text>
            </View>
            <View>
              <Text style={styles.subHeaderKicker}>OYUNCU PROFİLİ</Text>
              <Text style={styles.subHeaderTitle}>{safeName} (SEVİYE {getPlayerLevel(progress.xp)})</Text>
            </View>
          </View>
          
          <View style={styles.profilePanel}>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>SEVİYE</Text>
                <Text style={styles.statValue}>{getPlayerLevel(progress.xp)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>XP PUANI</Text>
                <Text style={styles.statValue}>{progress.xp}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>GALİBİYET</Text>
                <Text style={styles.statValue}>{progress.wins}</Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>En İyi Skor:</Text>
                <Text style={styles.miniStatValue}>{progress.bestScore} p</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>En İyi Tempo:</Text>
                <Text style={styles.miniStatValue}>{progress.bestTempo || "—"} K/D</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>Seri:</Text>
                <Text style={styles.miniStatValue}>{progress.streak} Gün</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>GÖRÜNEN AD</Text>
            <View style={styles.inputContainer}>
              <TextInput value={playerName} onChangeText={setPlayerName} maxLength={16} autoCapitalize="characters" style={styles.profileInput} placeholder="OYUNCU" placeholderTextColor="#6F879A" />
              <Text style={styles.inputIcon}>✏️</Text>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>OYUN AYARLARI</Text>
            <View style={styles.settingsBox}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>SES EFEKTLERİ</Text>
                <Switch value={sfxOn} onValueChange={toggleSfx} trackColor={{ false: "#121025", true: "#00F5D4" }} thumbColor={sfxOn ? "#FFFFFF" : "#6E5B9D"} />
              </View>
              <View style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 0, marginTop: 12 }]}>
                <Text style={styles.settingLabel}>TİTREŞİM (HAPTICS)</Text>
                <Switch value={hapticsOn} onValueChange={toggleHaptics} trackColor={{ false: "#121025", true: "#00F5D4" }} thumbColor={hapticsOn ? "#FFFFFF" : "#6E5B9D"} />
              </View>
            </View>
          </View>
          
          <PlayerCollection progress={progress} onSelectAvatar={(selectedAvatar) => { haptics.light(); setProgress((current) => ({ ...current, selectedAvatar })); }} />
          
          <View style={styles.profileHint}>
            <Text style={styles.profileHintTitle}>ETKİN KELİME PAKETİ</Text>
            <Text style={styles.profileHintCopy}>Sezon merkezinden temalı kelime paketini seç ve tekli avların rotasını değiştir.</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={() => setScreen("season")} style={styles.profileHintButton}>
                <Text style={styles.profileHintButtonText}>SEZON MERKEZİ</Text>
              </Pressable>
              <Pressable 
                onPress={async () => {
                  haptics.error();
                  await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
                  setAuthToken(null);
                  setPlayerId(`player-${Math.random().toString(36).slice(2, 10)}`);
                  setPlayerName("OYUNCU");
                  setProgress(DEFAULT_PROGRESS);
                  setScreen("home");
                }} 
                style={[styles.profileHintButton, { backgroundColor: "#EF4444" }]}
              >
                <Text style={[styles.profileHintButtonText, { color: "#FFFFFF" }]}>ÇIKIŞ YAP</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </MainShell>
    );
  }

  if (screen === "room" && room) {
    const bothPlayers = room.players.length === 2;
    return (
      <ScreenContainer style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.roomScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.navRow}><Pressable onPress={leaveRoom} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.navTitle}>BOT DÜELLOSU</Text><View style={styles.navSpacer} /></View>
        <View style={styles.roomHero}>
          <Text style={styles.eyebrow}>DAVET KODU</Text>
          <Text style={styles.roomCode}>{room.code}</Text>
          <Text style={styles.roomHint}>Rakibin bu kodla odaya katılabilir.</Text>
          <Pressable onPress={shareRoomInvite} style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]}><Text style={styles.inviteButtonText}>DAVET BAĞLANTISINI PAYLAŞ</Text><Text style={styles.inviteButtonIcon}>↗</Text></Pressable>
        </View>
        <View style={styles.playerList}>
          {room.players.map((player, index) => <PlayerRow key={player.id} player={player} isMe={player.id === playerId} accent={index === 0 ? "#2DD4BF" : "#FB7185"} />)}
          {!bothPlayers && <View style={styles.waitPlayer}><View style={styles.waitAvatar}><Text style={styles.waitAvatarText}>?</Text></View><View><Text style={styles.waitTitle}>RAKİP BEKLENİYOR</Text><Text style={styles.waitSub}>Oda kodunu paylaş</Text></View></View>}
        </View>
        <View style={styles.ruleCard}><Text style={styles.ruleIcon}>✦</Text><View style={styles.ruleTextWrap}><Text style={styles.ruleTitle}>{room.size}×{room.size} TAHTA · {room.wordsTotal} KELİME</Text><Text style={styles.ruleCopy}>Aynı tahtadaki tüm kelimeleri bul. Sadece yatay ve dikey komşu harfleri bağla.</Text></View></View>
        <Pressable disabled={!bothPlayers || me?.ready} onPress={markReady} style={({ pressed }) => [styles.primaryButton, (!bothPlayers || me?.ready) && styles.disabledButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>{me?.ready ? "RAKİP HAZIRLANIYOR" : "HAZIRIM"}</Text><Text style={styles.primaryButtonArrow}>{me?.ready ? "…" : "✓"}</Text>
        </Pressable>
        <Text style={styles.notice}>{notice}</Text>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (!room) return null;
  const selectionSet = new Set(selectedCells);
  const foundCellOwners = new Map<number, string>();
  room.foundWords.filter((entry) => entry.playerId === playerId).forEach((entry) => entry.path.forEach((cell) => foundCellOwners.set(cell, entry.playerId)));
  return (
    <ScreenContainer style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20 }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={battleStyles.gameScroll} scrollEnabled={!isSelecting} showsVerticalScrollIndicator={false}>
      <View style={styles.gameHeader}><Pressable onPress={leaveRoom} style={styles.exitButton}><Text style={styles.exitText}>×</Text></Pressable><View><Text style={styles.gameMode}>CANLI KELİME DÜELLOSU</Text><Text style={styles.gameCode}>ODA {room.code}</Text></View><View style={styles.liveChip}><View style={styles.liveDot} /><Text style={styles.liveText}>{room.status === "playing" ? "CANLI" : "SONUÇ"}</Text></View></View>
        <View style={[battleStyles.statusRail, isFinalPush && battleStyles.statusRailFinal]}>
          <View><Text style={battleStyles.railLabel}>{isFinalPush ? "SON HAMLE" : "TUR SÜRESİ"}</Text><Text style={[battleStyles.timerValue, isFinalPush && battleStyles.timerValueFinal]}>{room.status === "playing" ? `00:${String(remainingSeconds).padStart(2, "0")}` : "00:00"}</Text></View>
          <View style={battleStyles.battleBadges}>{myMultiplier > 1 && <View style={battleStyles.multiplierBadge}><Text style={battleStyles.multiplierText}>×{myMultiplier} UZUN KELİME</Text></View>}{myWordCount >= 2 && <View style={battleStyles.streakBadge}><Text style={battleStyles.streakText}>{myWordCount} SERİ</Text></View>}</View>
        </View>
        <View style={styles.scoreRow}>
          <ScoreBadge name={me?.name ?? safeName} score={myScore} words={myWordCount} total={room.wordsTotal} active={!room.winnerId || iWon} won={iWon} accent="#2DD4BF" combo={room.combos?.[playerId]} />
          <View style={styles.vsMark}><Text style={styles.vsText}>VS</Text></View>
          <ScoreBadge name={opponent?.name ?? "RAKİP"} score={opponentScore} words={opponentWordCount} total={room.wordsTotal} active={!room.winnerId || !iWon} won={Boolean(room.winnerId && !iWon)} accent="#FB7185" combo={opponent ? room.combos?.[opponent.id] : undefined} />
        </View>
        <View style={battleStyles.statsRow}><View style={battleStyles.statCell}><Text style={battleStyles.statLabel}>PUAN FARKI</Text><Text style={[battleStyles.statValue, scoreDifference > 0 && battleStyles.statValuePositive, scoreDifference < 0 && battleStyles.statValueNegative]}>{scoreLeadLabel}</Text></View><View style={battleStyles.statDivider} /><View style={battleStyles.statCell}><Text style={battleStyles.statLabel}>TEMPO</Text><Text style={battleStyles.statValue}>{myTempo} · {opponentTempo} K/DK</Text></View></View>
        <View style={styles.targetCard}>
          <Text style={styles.targetLabel}>{room.status === "finished" ? "TUR TAMAMLANDI" : "GİZLİ KELİMELERİ BUL"}</Text>
          <Text style={styles.targetWord}>{room.wordsTotal} KELİME</Text>
        <Text style={styles.targetTip}>{room.status === "playing" ? "Parmağını/mouse'u basılı tutarak yatay/dikey komşu harfleri bağla." : room.message}</Text>
      </View>
      <View
        ref={boardRef}
        onLayout={measureBoard}
        style={[styles.board, { width: boardWidth, height: boardWidth, position: "relative" }]}
      >
        {selectedCells.slice(0, -1).map((cellIdx, i) => {
          const nextCellIdx = selectedCells[i + 1]!;
          const start = getCellCenter(cellIdx);
          const end = getCellCenter(nextCellIdx);
          return (
            <ConnectLine
              key={`line-${i}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              color="#2DD4BF"
            />
          );
        })}

        {room.board.map((letter, index) => {
          const order = selectedCells.indexOf(index);
          const selected = selectionSet.has(index);
          const isTail = selectedCells.at(-1) === index;
          const foundBy = foundCellOwners.get(index);
          const isFound = foundBy !== undefined;

          return <BoardCell
            key={`${letter}-${index}`}
            letter={letter}
            index={index}
            order={order}
            selected={selected}
            isTail={isTail}
            foundBy={foundBy}
            isFound={isFound}
            size={room.size}
            selectionFeedback={selectionFeedback}
            playerId={playerId}
            status={room.status}
            isBotSelected={false}
            botOrder={-1}
            isBotTail={false}
          />;
        })}

        {particles.map(p => (
          <Animated.View key={p.id} style={{ position: 'absolute', left: p.x - 4, top: p.y - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: p.color, transform: p.anim.getTranslateTransform() }} />
        ))}

        {/* Absolute touch/pointer overlay to intercept gestures relative to board cleanly */}
        <View
          onPointerDown={(e: any) => { if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId ?? e.nativeEvent?.pointerId); handleGestureStart(e); }}
          onPointerMove={handleGestureMove}
          onPointerUp={handleGestureEnd}
          onPointerCancel={() => { selectionActiveRef.current = false; clearSelection(); setIsSelecting(false); }}
          onPointerLeave={finishPointerSelection}
          onTouchStart={handleGestureStart}
          onTouchMove={handleGestureMove}
          onTouchEnd={handleGestureEnd}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[styles.wordTray, selectionFeedback === "invalid" && styles.wordTrayInvalid, selectionFeedback === "accepted" && styles.wordTrayAccepted]}><Text style={styles.wordLabel}>{selectionFeedback === "invalid" ? "GEÇERSİZ KELİME" : selectionFeedback === "accepted" ? "KELİME KABUL EDİLDİ" : selectedCells.length >= 2 ? "ROTA SEÇİLDİ · DOĞRULAMAK İÇİN GÖNDER" : "SEÇTİĞİN KELİME"}</Text><Text style={[styles.drawnWord, !activeWord && styles.drawnWordEmpty]}>{activeWord || "HARFLERİ BİRLEŞTİR"}</Text><Text style={styles.routeHint}>{selectionFeedback === "invalid" ? "Kırmızı rota birazdan temizlenecek." : selectedCells.length > 1 ? "Mavi önizleme · yeşil yalnız kabul edilince görünür." : "Yalnız yatay ve dikey ilerle"}</Text><View style={styles.wordActions}>{selectedCells.length > 0 && <Pressable onPress={clearSelection} style={styles.clearWord}><Text style={styles.clearWordText}>TEMİZLE</Text></Pressable>}<Pressable disabled={selectedCells.length < 2 || Boolean(pendingWordRef.current)} onPress={() => submitSelection()} style={[styles.submitWord, (selectedCells.length < 2 || Boolean(pendingWordRef.current)) && styles.disabledButton]}><Text style={styles.submitWordText}>GÖNDER</Text></Pressable></View></View>
      <View style={styles.foundPanel}><Text style={styles.foundLabel}>{room.status === "finished" ? "TURDA BULUNAN KELİMELER (SÖZLÜK ANLAMI İÇİN TIKLA)" : "BULUNAN KELİMELER (SÖZLÜK ANLAMI İÇİN TIKLA)"}</Text><View style={styles.foundTags}>{room.foundWords.length ? room.foundWords.map((entry, index) => <Pressable key={`${entry.playerId}-${index}`} onPress={() => { if (!entry.hidden) { haptics.light(); setSelectedWordInfo({ word: entry.word, definition: getWordDefinition(entry.word) }); } }} style={({ pressed }) => [styles.foundTag, entry.playerId === playerId && styles.foundTagMine, pressed && { opacity: 0.7 }]}><Text style={styles.foundTagText}>{entry.hidden ? "RAKİP KELİMESİ" : entry.word}</Text></Pressable>) : <Text style={styles.foundEmpty}>Henüz kelime bulunmadı.</Text>}</View></View>
      {room.status === "finished" ? <View style={styles.resultPanel}><Text style={styles.resultTitle}>{iWon ? "TUR SENİN!" : "TUR RAKİBİNİN"}</Text><Text style={styles.resultCopy}>{iWon ? "En yüksek puanı sen topladın." : "Rövanşta daha fazla kelime bul."}</Text><MatchInsight score={myScore} opponentScore={opponentScore} words={myWordCount} opponentWords={opponentWordCount} tempo={myTempo} opponentTempo={opponentTempo} bestScore={progress.bestScore} /><Pressable onPress={requestRematch} style={({ pressed }) => [styles.primaryButton, styles.rematchButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{me?.rematch ? "RAKİP BEKLENİYOR" : "RÖVANŞ İSTE"}</Text><Text style={styles.primaryButtonArrow}>↻</Text></Pressable></View> : <Text style={styles.notice}>{notice}</Text>}
      </ScrollView>

      {selectedWordInfo && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#1A1530", borderColor: "#2DD4BF" }]}>
            <Text style={[styles.modalTitle, { color: "#2DD4BF" }]}>{selectedWordInfo.word}</Text>
            <Text style={styles.modalBody}>{selectedWordInfo.definition}</Text>
            <Pressable onPress={() => setSelectedWordInfo(null)} style={({ pressed }) => [styles.modalCloseButton, { backgroundColor: "#2DD4BF" }, pressed && { opacity: 0.8 }]}>
              <Text style={styles.modalCloseText}>KAPAT</Text>
            </Pressable>
          </View>
        </View>
      )}
      <OnboardingGuide visible={showGuide} onClose={closeGuide} />
    </ScreenContainer>
  );
}

const BoardCell = React.memo(({
  letter,
  index,
  order,
  selected,
  isTail,
  foundBy,
  isFound,
  size,
  selectionFeedback,
  playerId,
  status,
  isBotSelected,
  botOrder,
  isBotTail,
}: {
  letter: string;
  index: number;
  order: number;
  selected: boolean;
  isTail: boolean;
  foundBy?: string;
  isFound: boolean;
  size: number;
  selectionFeedback: string;
  playerId: string;
  status: string;
  isBotSelected?: boolean;
  botOrder?: number;
  isBotTail?: boolean;
}) => {
  return (
    <View
      pointerEvents="none"
      style={[styles.cellWrap, { width: `${100 / size}%`, height: `${100 / size}%` }]}
    >
      <View style={[
        styles.cell,
        isFound && styles.cellFound,
        foundBy === playerId && styles.cellFoundMine,
        selected && battleStyles.previewCell,
        isTail && styles.cellTail,
        isBotSelected && battleStyles.botPreviewCell,
        isBotTail && battleStyles.cellTailBot,
        selectionFeedback === "invalid" && selected && styles.cellInvalid,
        selectionFeedback === "accepted" && selected && styles.cellAccepted,
        status === "finished" && selected && styles.cellFinished
      ]}>
        <Text selectable={false} style={[
          styles.cellLetter,
          size === 6 && styles.cellLetterMedium,
          size === 8 && styles.cellLetterSmall,
          size === 10 && styles.cellLetterExtraSmall
        ]}>{letter}</Text>
        {selected && <Text selectable={false} style={styles.cellOrder}>{order + 1}</Text>}
        {isBotSelected && !selected && <Text selectable={false} style={battleStyles.cellOrderBot}>{botOrder! + 1}</Text>}
        {isFound && !selected && <Text selectable={false} style={styles.cellCheck}>✓</Text>}
      </View>
    </View>
  );
});

function PlayerRow({ player, isMe, accent }: { player: { name: string; connected: boolean; ready: boolean; isBot?: boolean }; isMe: boolean; accent: string }) {
  return <View style={styles.playerRow}><View style={[styles.playerAvatar, { borderColor: accent }]}><Text style={styles.playerAvatarText}>{player.isBot ? "BOT" : initials(player.name)}</Text></View><View style={styles.playerInfo}><Text style={styles.playerName}>{player.name}{isMe ? "  (SEN)" : ""}</Text><Text style={styles.playerState}>{player.isBot ? "YAPAY RAKİP HAZIR" : player.connected ? (player.ready ? "HAZIR" : "TAHTAYI İNCELİYOR") : "BAĞLANTI YENİLENİYOR"}</Text></View><View style={[styles.readyDot, { backgroundColor: player.ready ? "#A3E635" : "#466279" }]} /></View>;
}

function ScoreBadge({ name, score, words, total, active, won, accent, combo }: { name: string; score: number; words: number; total: number; active: boolean; won: boolean; accent: string; combo?: number }) {
  return (
    <View style={[styles.scoreBadge, won && { borderColor: accent }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text numberOfLines={1} style={[styles.scoreName, { flexShrink: 1 }]}>{name}</Text>
        {combo && combo >= 2 ? <Text style={{ fontSize: 9, fontWeight: "900", color: "#FF9B62" }}>🔥 x{combo}</Text> : null}
      </View>
      <Text style={[styles.scoreValue, active && { color: accent }]}>{score}</Text>
      <Text style={[styles.scoreStatus, won && { color: accent }]}>{words} / {total} KELİME</Text>
    </View>
  );
}

function MainShell({ active, children, onNavigate }: { active: DockDestination; children: React.ReactNode; onNavigate: (destination: DockDestination) => void }) {
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} style={{ paddingHorizontal: 20, paddingTop: 12 }}><View style={styles.shell}>{children}<View style={styles.fixedDock}><PremiumDock active={active} onNavigate={onNavigate} /></View></View></ScreenContainer>;
}

const battleStyles = StyleSheet.create({
  gameScroll: { flexGrow: 1, paddingBottom: 28 },
  previewCell: { backgroundColor: "#0F3652", borderColor: "#22D3EE", shadowColor: "#22D3EE", shadowOpacity: 0.45, shadowRadius: 6, elevation: 4 },
  botPreviewCell: { backgroundColor: "#3D172A", borderColor: "#F43F5E", shadowColor: "#F43F5E", shadowOpacity: 0.45, shadowRadius: 6, elevation: 4 },
  cellTailBot: { borderColor: "#F43F5E", borderWidth: 2, transform: [{ scale: 1.04 }] },
  cellOrderBot: { position: "absolute", top: 3, right: 4, color: "#FFE4E6", fontSize: 8, fontWeight: "900" },
  statusRail: { marginTop: 7, minHeight: 48, backgroundColor: "rgba(15, 23, 42, 0.85)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.15)", borderRadius: 16, paddingHorizontal: 13, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusRailFinal: { backgroundColor: "rgba(61, 23, 42, 0.85)", borderColor: "rgba(244, 63, 94, 0.35)" },
  railLabel: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  timerValue: { color: "#E2E8F0", fontSize: 19, lineHeight: 21, fontWeight: "900", letterSpacing: 1.3, marginTop: 1 },
  timerValueFinal: { color: "#FDA4AF" },
  battleBadges: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 5, maxWidth: "64%" },
  multiplierBadge: { backgroundColor: "rgba(234, 179, 8, 0.15)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(234, 179, 8, 0.45)" },
  multiplierText: { color: "#FEF08A", fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
  streakBadge: { backgroundColor: "rgba(16, 185, 129, 0.15)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(16, 185, 129, 0.45)" },
  streakText: { color: "#A7F3D0", fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  statsRow: { minHeight: 47, marginTop: 8, borderRadius: 16, backgroundColor: "rgba(15, 23, 42, 0.85)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.15)", flexDirection: "row", alignItems: "center", paddingHorizontal: 10 },
  statCell: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 24, backgroundColor: "rgba(148, 163, 184, 0.15)" },
  statLabel: { color: "#94A3B8", fontSize: 8, fontWeight: "900", letterSpacing: 0.9 },
  statValue: { color: "#F1F5F9", fontSize: 11, fontWeight: "900", marginTop: 2 },
  statValuePositive: { color: "#10B981" },
  statValueNegative: { color: "#EF4444" },
});

const styles = StyleSheet.create({
  shell: { flex: 1 },
  fixedDock: { position: "absolute", left: 0, right: 0, bottom: 0 },
  homeScroll: { paddingBottom: 132, flexGrow: 1 },
  subHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  subHeaderKicker: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  subHeaderTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", marginTop: 2, letterSpacing: 0.5 },
  modeIntro: { color: "#CBD5E1", fontSize: 13, lineHeight: 19, marginTop: 23, marginBottom: 14 },
  nameCard: { backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)", padding: 14, borderRadius: 20 },
  inputLabel: { color: "#94A3B8", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  nameInput: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", paddingVertical: 6, letterSpacing: 1.3 },
  sectionLabel: { color: "#94A3B8", fontSize: 10, fontWeight: "800", letterSpacing: 1.1, marginTop: 22, marginBottom: 9 },
  sizeRow: { flexDirection: "row", gap: 10 },
  sizeCard: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)", borderRadius: 20, padding: 16 },
  sizeCardSelected: { borderColor: "#22D3EE", backgroundColor: "rgba(6, 182, 212, 0.12)", shadowColor: "#22D3EE", shadowOpacity: 0.1, shadowRadius: 8 },
  sizeValue: { color: "#FFFFFF", fontSize: 25, fontWeight: "900" },
  sizeValueSelected: { color: "#22D3EE" },
  sizeCaption: { color: "#F1F5F9", fontSize: 13, fontWeight: "800", marginTop: 4 },
  sizeDetail: { color: "#94A3B8", fontSize: 11, marginTop: 3 },
  primaryButton: { marginTop: 18, height: 58, backgroundColor: "#06B6D4", borderRadius: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, shadowColor: "#06B6D4", shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
  primaryButtonText: { color: "#0B132B", fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  primaryButtonArrow: { color: "#0B132B", fontSize: 24, fontWeight: "600" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  disabledButton: { opacity: 0.46 },
  joinCard: { backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)", borderRadius: 20, padding: 14, marginTop: 14 },
  joinTitle: { color: "#94A3B8", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  joinRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 9 },
  codeInput: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", letterSpacing: 3, flex: 1, paddingVertical: 7 },
  joinButton: { backgroundColor: "rgba(6, 182, 212, 0.15)", borderRadius: 12, paddingHorizontal: 17, paddingVertical: 12, borderWidth: 1, borderColor: "rgba(6, 182, 212, 0.3)" },
  joinButtonText: { color: "#22D3EE", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  notice: { color: "#94A3B8", textAlign: "center", fontSize: 12, lineHeight: 18, marginTop: 15, paddingHorizontal: 15 },
  navRow: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 36, height: 36, justifyContent: "center", alignItems: "center", borderRadius: 12, backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)" },
  backText: { color: "#FFFFFF", fontSize: 30, lineHeight: 32 },
  navTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "900", letterSpacing: 1.2 },
  navSpacer: { width: 36 },
  roomHero: { alignItems: "center", paddingVertical: 35 },
  roomCode: { color: "#10B981", fontSize: 42, fontWeight: "900", letterSpacing: 6, marginTop: 6, shadowColor: "#10B981", shadowOpacity: 0.25, shadowRadius: 8 },
  roomHint: { color: "#CBD5E1", fontSize: 13, marginTop: 8 },
  inviteButton: { marginTop: 15, borderRadius: 14, backgroundColor: "rgba(99, 102, 241, 0.15)", borderWidth: 1, borderColor: "rgba(99, 102, 241, 0.4)", minHeight: 42, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  inviteButtonText: { color: "#E0E7FF", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  inviteButtonIcon: { color: "#818CF8", fontSize: 18, fontWeight: "900" },
  playerList: { backgroundColor: "rgba(15, 23, 42, 0.8)", borderRadius: 24, padding: 8, borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)" },
  playerRow: { flexDirection: "row", alignItems: "center", minHeight: 64, paddingHorizontal: 8, gap: 11 },
  playerAvatar: { width: 43, height: 43, borderRadius: 15, borderWidth: 2, borderColor: "#38BDF8", backgroundColor: "#0B132B", alignItems: "center", justifyContent: "center" },
  playerAvatarText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 },
  playerInfo: { flex: 1 },
  playerName: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  playerState: { color: "#94A3B8", fontSize: 10, marginTop: 3, fontWeight: "700" },
  readyDot: { width: 9, height: 9, borderRadius: 8, marginRight: 7 },
  waitPlayer: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "rgba(148, 163, 184, 0.1)" },
  waitAvatar: { width: 43, height: 43, borderRadius: 15, borderWidth: 1, borderColor: "#475569", borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  waitAvatarText: { color: "#64748B", fontWeight: "700", fontSize: 19 },
  waitTitle: { color: "#E2E8F0", fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  waitSub: { color: "#64748B", fontSize: 11, marginTop: 3 },
  ruleCard: { marginTop: 18, backgroundColor: "rgba(15, 23, 42, 0.8)", flexDirection: "row", padding: 15, borderRadius: 20, gap: 11, borderLeftWidth: 4, borderLeftColor: "#10B981", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.08)" },
  ruleIcon: { color: "#10B981", fontSize: 20 },
  ruleTextWrap: { flex: 1 },
  ruleTitle: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  ruleCopy: { color: "#CBD5E1", fontSize: 12, lineHeight: 17, marginTop: 4 },
  gameHeader: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 5 },
  exitButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15, 23, 42, 0.8)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)" },
  exitText: { color: "#E2E8F0", fontSize: 25, lineHeight: 25 },
  gameMode: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  gameCode: { color: "#94A3B8", fontSize: 9, marginTop: 2, fontWeight: "800", letterSpacing: 0.8 },
  liveChip: { backgroundColor: "rgba(6, 182, 212, 0.15)", borderRadius: 99, flexDirection: "row", alignItems: "center", paddingHorizontal: 9, paddingVertical: 6, gap: 5, borderWidth: 1, borderColor: "rgba(6, 182, 212, 0.3)" },
  liveDot: { width: 6, height: 6, borderRadius: 5, backgroundColor: "#10B981" },
  liveText: { color: "#22D3EE", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 7 },
  scoreBadge: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)", borderRadius: 20, alignItems: "center", paddingVertical: 9 },
  scoreName: { color: "#E2E8F0", maxWidth: 105, fontSize: 10, fontWeight: "900", letterSpacing: 0.4 },
  scoreValue: { color: "#FFFFFF", fontSize: 25, lineHeight: 29, fontWeight: "900", marginTop: 1 },
  scoreStatus: { color: "#94A3B8", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  vsMark: { width: 28, alignItems: "center" },
  vsText: { color: "#64748B", fontSize: 10, fontWeight: "900" },
  targetCard: { alignItems: "center", paddingTop: 15, paddingBottom: 11 },
  targetLabel: { color: "#94A3B8", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  targetWord: { color: "#10B981", fontSize: 29, fontWeight: "900", letterSpacing: 2, marginTop: 2 },
  targetTip: { color: "#CBD5E1", fontSize: 11, lineHeight: 15, marginTop: 4, maxWidth: "100%", paddingHorizontal: 12, textAlign: "center" },
  board: { alignSelf: "center", flexDirection: "row", flexWrap: "wrap", backgroundColor: "#0B132B", borderRadius: 26, padding: 4, borderWidth: 1.5, borderColor: "rgba(148, 163, 184, 0.15)", overflow: "hidden", userSelect: "none", touchAction: "none" } as any,
  cellWrap: { padding: 5 },
  cell: { flex: 1, borderRadius: 99, backgroundColor: "#1C2541", borderWidth: 1.5, borderColor: "rgba(148, 163, 184, 0.2)", alignItems: "center", justifyContent: "center", aspectRatio: 1 },
  cellFinished: { backgroundColor: "#10B981" },
  cellLetter: { color: "#F1F5F9", fontSize: 25, fontWeight: "900" },
  cellLetterMedium: { fontSize: 21 },
  cellLetterSmall: { fontSize: 17 },
  cellLetterExtraSmall: { fontSize: 13 },
  cellOrder: { position: "absolute", top: 3, right: 4, color: "#ECFDF5", fontSize: 8, fontWeight: "900" },
  cellTail: { borderColor: "#F97316", borderWidth: 2, transform: [{ scale: 1.04 }], shadowColor: "#F97316", shadowOpacity: 0.5, shadowRadius: 5 },
  cellInvalid: { backgroundColor: "#7F1D1D", borderColor: "#EF4444" },
  cellAccepted: { backgroundColor: "#065F46", borderColor: "#34D399" },
  cellFound: { backgroundColor: "#065F46", borderColor: "#34D399" },
  cellFoundMine: { backgroundColor: "#059669", borderColor: "#10B981", shadowColor: "#10B981", shadowOpacity: 0.45, shadowRadius: 6, elevation: 4 },
  cellCheck: { position: "absolute", left: 4, bottom: 2, color: "#D1FAE5", fontSize: 9, fontWeight: "900" },
  wordTray: { minHeight: 82, marginTop: 12, borderRadius: 20, backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)", alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  wordTrayInvalid: { borderColor: "#EF4444", backgroundColor: "rgba(127, 29, 29, 0.4)" },
  wordTrayAccepted: { borderColor: "#10B981", backgroundColor: "rgba(6, 95, 70, 0.4)" },
  wordLabel: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  drawnWord: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", letterSpacing: 2, marginTop: 3 },
  drawnWordEmpty: { color: "#64748B", fontSize: 10, letterSpacing: 1.1 },
  routeHint: { color: "#94A3B8", fontSize: 8, fontWeight: "800", marginTop: 3 },
  wordActions: { position: "absolute", right: 10, top: 19, gap: 8, alignItems: "flex-end" },
  clearWord: { paddingVertical: 2 },
  clearWordText: { color: "#F43F5E", fontSize: 9, fontWeight: "900" },
  submitWord: { backgroundColor: "#06B6D4", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  submitWordText: { color: "#0B132B", fontSize: 9, fontWeight: "900" },
  foundPanel: { marginTop: 9, borderRadius: 16, backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)", padding: 10 },
  foundLabel: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  foundTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 },
  foundTag: { backgroundColor: "#334155", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  foundTagMine: { backgroundColor: "#065F46" },
  foundTagText: { color: "#F1F5F9", fontSize: 10, fontWeight: "900" },
  foundEmpty: { color: "#64748B", fontSize: 11 },
  resultPanel: { alignItems: "center", marginTop: 10 },
  resultTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", letterSpacing: 0.2 },
  resultCopy: { color: "#CBD5E1", fontSize: 12, marginTop: 3 },
  rematchButton: { alignSelf: "stretch", marginTop: 12, height: 52 },
  roomScroll: { flexGrow: 1, paddingBottom: 8 },
  eyebrow: { color: "#06B6D4", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  profileAvatarLarge: { width: 52, height: 52, borderRadius: 18, backgroundColor: "rgba(124, 58, 237, 0.2)", alignItems: "center", justifyContent: "center" },
  profileAvatarLargeText: { color: "#FFF9FC", fontSize: 15, fontWeight: "900" },
  profilePanel: { backgroundColor: "rgba(33, 26, 61, 0.4)", borderRadius: 24, borderWidth: 1.5, borderColor: "rgba(93, 74, 144, 0.3)", padding: 17, marginTop: 23 },
  profilePanelTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  profilePanelCopy: { color: "#E9D5FF", fontSize: 12, lineHeight: 18, marginTop: 7 },
  profileRule: { height: 1, backgroundColor: "rgba(93, 74, 144, 0.3)", marginVertical: 16 },
  profileHint: { backgroundColor: "rgba(33, 26, 61, 0.4)", borderRadius: 20, padding: 16, marginTop: 12, borderLeftWidth: 4, borderLeftColor: "#00F5D4", borderWidth: 1.5, borderColor: "rgba(93, 74, 144, 0.3)" },
  profileHintTitle: { color: "#F1F5F9", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  profileHintCopy: { color: "#E2E8F0", fontSize: 12, lineHeight: 17, marginTop: 5 },
  profileHintButton: { alignSelf: "flex-start", marginTop: 12, backgroundColor: "#00F5D4", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  profileHintButtonText: { color: "#0B132B", fontSize: 10, fontWeight: "900" },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 12 }, 
  statBox: { flex: 1, backgroundColor: "rgba(12, 8, 37, 0.3)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(93, 74, 144, 0.25)", padding: 10, alignItems: "center" }, 
  statLabel: { color: "#E9D5FF", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 }, 
  statValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 4 }, 
  statsRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(12, 8, 37, 0.15)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 }, 
  miniStat: { flexDirection: "row", gap: 6, alignItems: "center" }, 
  miniStatLabel: { color: "#BDB0D7", fontSize: 10, fontWeight: "800" }, 
  miniStatValue: { color: "#FFF9FC", fontSize: 10, fontWeight: "900" }, 
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(12, 8, 37, 0.3)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(93, 74, 144, 0.3)", paddingHorizontal: 14, height: 48, marginTop: 8 }, 
  profileInput: { flex: 1, color: "#FFFFFF", fontSize: 14, fontWeight: "800", letterSpacing: 1 }, 
  inputIcon: { fontSize: 14, color: "#00F5D4" }, 
  settingsBox: { backgroundColor: "rgba(12, 8, 37, 0.3)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(93, 74, 144, 0.3)", padding: 14, marginTop: 8 }, 
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(93, 74, 144, 0.15)" }, 
  settingLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", zIndex: 100 },
  modalContent: { width: "86%", borderRadius: 24, borderWidth: 1.5, padding: 22, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 20, elevation: 12 },
  modalTitle: { fontSize: 22, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 },
  modalBody: { color: "#FFFFFF", fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20, fontWeight: "600" },
  modalCloseButton: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, shadowOpacity: 0.4, shadowRadius: 5, elevation: 4 },
  modalCloseText: { color: "#0B132B", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
});

export default function App() {
  useEffect(() => {
    initManusRuntime();
  }, []);

  return (
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}
