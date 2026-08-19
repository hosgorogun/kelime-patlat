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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ScreenContainer } from "./components/screen-container";
import { CommandCenter } from "./components/command-center";
import { MatchInsight } from "./components/match-insight";
import { PremiumModeCenter } from "./components/premium-mode-center";
import { PremiumDock, type DockDestination } from "./components/premium-dock";
import { PlayerCollection } from "./components/player-collection";
import { SeasonHub } from "./components/season-hub";
import { SoloChallenge } from "./components/solo-challenge";
import { SoloLevels } from "./components/solo-levels";
import { getGameSocket } from "./lib/game-socket";
import { haptics } from "./lib/haptics";
import { gameSfx } from "./lib/game-sfx";
import { advanceSelection, getRoundDurationMs, wordFromSelection, wordScoreMultiplier, type BoardSize, type LeaderboardEntry, type RoomSnapshot } from "./shared/game";
import { applyMatchProgress, completeDailyProgress, DEFAULT_PROGRESS, getDailyChallenge, AVATARS, type DailyChallenge, type PlayerProgress } from "./shared/progression";
import { inviteMessage, normalizeRoomCode } from "./shared/invite";
import { MAX_SOLO_LEVEL } from "./shared/solo";
import { initManusRuntime } from "./lib/_core/manus-runtime";

type Screen = "home" | "modes" | "online" | "profile" | "levels" | "solo" | "room" | "game" | "season";

const PLAYER_ID = `player-${Math.random().toString(36).slice(2, 10)}`;
const SOLO_UNLOCK_KEY = "kelime-patlat:solo-unlocked-level";
const PROGRESS_KEY = "kelime-patlat:season-progress-v1";

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "KP";
}

function HomeScreen() {
  const { width } = useWindowDimensions();
  const selectionRef = useRef<number[]>([]);
  const selectionActiveRef = useRef(false);
  const activeRoomCodeRef = useRef<string | null>(null);
  const pendingWordRef = useRef<string | null>(null);
  const remoteProfileRef = useRef(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<View>(null);
  const boardPageX = useRef(0);
  const boardPageY = useRef(0);

  const measureBoard = () => {
    boardRef.current?.measure((x, y, width, height, pageX, pageY) => {
      if (pageX !== undefined) boardPageX.current = pageX;
      if (pageY !== undefined) boardPageY.current = pageY;
    });
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
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [selectedSize, setSelectedSize] = useState<BoardSize>(4);
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [notice, setNotice] = useState("Bir oda kur ve rakibini davet et.");
  const [selectionFeedback, setSelectionFeedback] = useState<"idle" | "invalid" | "accepted">("idle");
  const [soloLevel, setSoloLevel] = useState(1);
  const [soloUnlockedLevel, setSoloUnlockedLevel] = useState(1);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [progressReady, setProgressReady] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailySession, setDailySession] = useState<DailyChallenge | null>(null);
  const daily = useMemo(() => getDailyChallenge(), []);
  const incomingUrl = Linking.useURL();
  const recordedRoundRef = useRef<string | null>(null);
  const victoryCueRef = useRef<string | null>(null);

  const safeName = playerName.trim().slice(0, 16) || "OYUNCU";
  const boardWidth = Math.min(width - (room?.size === 8 ? 28 : room?.size === 6 ? 34 : 40), room?.size === 8 ? 392 : room?.size === 6 ? 374 : 356);
  const me = room?.players.find((player) => player.id === PLAYER_ID) ?? null;
  const opponent = room?.players.find((player) => player.id !== PLAYER_ID) ?? null;
  const activeWord = room ? wordFromSelection(room.board, selectedCells) : "";
  const iWon = room?.winnerId === PLAYER_ID;
  const myScore = room?.scores[PLAYER_ID] ?? 0;
  const opponentScore = opponent ? room?.scores[opponent.id] ?? 0 : 0;
  const myWordCount = room?.foundWords.filter((entry) => entry.playerId === PLAYER_ID).length ?? 0;
  const opponentWordCount = opponent ? room?.foundWords.filter((entry) => entry.playerId !== PLAYER_ID).length ?? 0 : 0;
  const myLastFoundWord = room?.foundWords.filter((entry) => entry.playerId === PLAYER_ID).at(-1)?.word ?? "";
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
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => undefined);
    if (remoteProfileRef.current) {
      remoteProfileRef.current = false;
      return;
    }
    getGameSocket().emit("profile:save", { playerId: PLAYER_ID, playerName: safeName, progress });
  }, [progress, progressReady, safeName]);

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
    const foundLongWord = room.foundWords.some((entry) => entry.playerId === PLAYER_ID && !entry.hidden && entry.word.length >= 7);
    setProgress((current) => applyMatchProgress(current, { score: myScore, tempo: myTempo, won: Boolean(iWon), longWord: foundLongWord }));
  }, [iWon, myScore, myTempo, room]);

  useEffect(() => {
    if (!room) return;
    const roundId = `${room.code}:${room.startedAt ?? 0}`;
    if (room.status === "playing") victoryCueRef.current = null;
    if (room.status === "finished" && room.winnerId === PLAYER_ID && victoryCueRef.current !== roundId) {
      victoryCueRef.current = roundId;
      gameSfx.victory();
      haptics.victory();
    }
  }, [room]);

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
    const accepted = Boolean(pendingWord && next.foundWords.some((entry) => entry.word === pendingWord && entry.playerId === PLAYER_ID));
    if (accepted) {
      pendingWordRef.current = null;
      setSelectionFeedback("accepted");
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
      pendingWordRef.current = null;
      haptics.error();
      setNotice("Bu kelime tahtadaki gizli kelimelerden biri değil veya daha önce bulundu.");
      setSelectionFeedback("invalid");
      gameSfx.rejected();
      clearFeedbackLater();
    };
    const onLeaderboardUpdate = (next: LeaderboardEntry[]) => setLeaderboard(next);
    const onProfileUpdate = (next: { playerId: string; name: string; progress: PlayerProgress }) => {
      if (next.playerId !== PLAYER_ID) return;
      remoteProfileRef.current = true;
      setProgress({ ...DEFAULT_PROGRESS, ...next.progress, missions: { ...DEFAULT_PROGRESS.missions, ...next.progress.missions } });
      if (next.name) setPlayerName(next.name);
    };
    const onReconnect = () => {
      socket.emit("profile:load", { playerId: PLAYER_ID });
      if (activeRoomCodeRef.current) {
        socket.emit("room:reconnect", { code: activeRoomCodeRef.current, playerId: PLAYER_ID });
      }
    };

    socket.on("room:update", onRoomUpdate);
    socket.on("room:error", onRoomError);
    socket.on("word:rejected", onRejected);
    socket.on("connect", onReconnect);
    socket.on("leaderboard:update", onLeaderboardUpdate);
    socket.on("profile:update", onProfileUpdate);
    socket.emit("leaderboard:request");
    socket.emit("profile:load", { playerId: PLAYER_ID });
    return () => {
      socket.off("room:update", onRoomUpdate);
      socket.off("room:error", onRoomError);
      socket.off("word:rejected", onRejected);
      socket.off("connect", onReconnect);
      socket.off("leaderboard:update", onLeaderboardUpdate);
      socket.off("profile:update", onProfileUpdate);
    };
  }, [clearFeedbackLater, setRoomFromServer]);

  const createRoom = (size = selectedSize) => {
    haptics.light();
    const socket = getGameSocket();
    if (!socket.connected) {
      setNotice("Sunucuya bağlanılamadı. Lütfen internet bağlantını kontrol et.");
      haptics.error();
      return;
    }
    socket.emit("room:create", { playerId: PLAYER_ID, playerName: safeName, size });
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
    socket.emit("room:create", { playerId: PLAYER_ID, playerName: safeName, size });
    setNotice("Bot düellosu hazırlanıyor…");
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
    getGameSocket().emit("room:join", { code, playerId: PLAYER_ID, playerName: safeName });
    setNotice("Odaya katılıyorsun…");
  };

  const leaveRoom = () => {
    if (room) getGameSocket().emit("room:leave", { code: room.code, playerId: PLAYER_ID });
    activeRoomCodeRef.current = null;
    setRoom(null);
    clearSelection();
    setScreen("home");
    setNotice("Yeni bir düello için hazırsın.");
  };

  const markReady = () => {
    if (!room) return;
    haptics.light();
    getGameSocket().emit("room:ready", { code: room.code, playerId: PLAYER_ID });
  };

  const requestRematch = () => {
    if (!room) return;
    haptics.light();
    getGameSocket().emit("room:rematch", { code: room.code, playerId: PLAYER_ID });
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
    getGameSocket().emit("word:submit", { code: room.code, playerId: PLAYER_ID, selection: selected });
  }, [room]);

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
      const isFound = room.foundWords.some(entry => entry.playerId === PLAYER_ID && entry.path.includes(index));
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

  const handleGestureStart = (event: any) => {
    event.preventDefault?.();
    event.stopPropagation?.();
    setIsSelecting(true);
    measureBoard();
    const { pageX, pageY } = getEventPageCoords(event);
    const x = pageX - boardPageX.current;
    const y = pageY - boardPageY.current;
    handleGesture(x, y);
  };

  const handleGestureMove = (event: any) => {
    event.preventDefault?.();
    event.stopPropagation?.();
    if (!selectionActiveRef.current) return;
    const { pageX, pageY } = getEventPageCoords(event);
    const x = pageX - boardPageX.current;
    const y = pageY - boardPageY.current;
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
    setProgress((current) => applyMatchProgress(current, { score: level * 14, tempo: Math.max(1, level / 2), won: true, longWord: level >= 5, foundWords }));
  };

  const startDailyChallenge = () => {
    setDailySession(daily);
    setSoloLevel(daily.level);
    setScreen("solo");
  };

  const completeDailyChallenge = (level: number, foundWords: string[] = []) => {
    completeSoloLevel(level, foundWords);
    setProgress((current) => completeDailyProgress(current, daily));
  };

  if (screen === "home") {
    return (
      <MainShell active="home" onNavigate={(destination) => setScreen(destination)}>
        <StatusBar style="light" />
        <CommandCenter playerName={safeName} progress={progress} daily={daily} leaderboard={leaderboard} onPlayDaily={startDailyChallenge} onPlayBot={startBotDuel} onNavigate={setScreen} onLeaderboard={() => setScreen("season")} />
      </MainShell>
    );
  }

  if (screen === "season") {
    return <MainShell active="profile" onNavigate={(destination) => setScreen(destination)}><StatusBar style="light" /><SeasonHub playerId={PLAYER_ID} progress={progress} leaderboard={leaderboard} onBack={() => setScreen("home")} onSelectTheme={(selectedTheme) => setProgress((current) => ({ ...current, selectedTheme }))} /></MainShell>;
  }

  if (screen === "modes") {
    return <MainShell active="modes" onNavigate={(destination) => setScreen(destination)}><StatusBar style="light" /><PremiumModeCenter onSolo={() => setScreen("levels")} onBot4={() => startBotDuel(4)} onBot6={() => startBotDuel(6)} onBot8={() => startBotDuel(8)} onOnline={() => setScreen("online")} onSeason={() => setScreen("season")} onNavigate={setScreen} /></MainShell>;
  }

  if (screen === "levels") {
    return <MainShell active="modes" onNavigate={(destination) => setScreen(destination)}><StatusBar style="light" /><SoloLevels unlockedLevel={soloUnlockedLevel} onBack={() => setScreen("modes")} onSelect={openSoloLevel} /></MainShell>;
  }

  if (screen === "solo") {
    return <ScreenContainer style={{ paddingBottom: 16 }}><StatusBar style="light" /><SoloChallenge level={soloLevel} theme={dailySession?.themeId ?? progress.selectedTheme} variationSeed={dailySession?.variation} daily={Boolean(dailySession)} excludeWords={progress.history || []} onExit={() => { const destination = dailySession ? "home" : "levels"; setDailySession(null); setScreen(destination); }} onComplete={dailySession ? completeDailyChallenge : completeSoloLevel} onNext={() => openSoloLevel(Math.min(MAX_SOLO_LEVEL, soloLevel + 1))} /></ScreenContainer>;
  }

  if (screen === "online") {
    return <MainShell active="online" onNavigate={(destination) => setScreen(destination)}><StatusBar style="light" /><ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}><View style={styles.subHeader}><Pressable onPress={() => setScreen("home")} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.subHeaderKicker}>CANLI DÜELLO</Text><Text style={styles.subHeaderTitle}>ÖZEL ODA</Text></View></View><Text style={styles.modeIntro}>İsmini seç, tahtanı belirle ve davet kodunu rakibinle paylaş.</Text><View style={styles.nameCard}><Text style={styles.inputLabel}>OYUNCU ADIN</Text><TextInput value={playerName} onChangeText={setPlayerName} maxLength={16} autoCapitalize="characters" style={styles.nameInput} placeholder="OYUNCU" placeholderTextColor="#6F879A" /></View><Text style={styles.sectionLabel}>TAHTA BOYUTU</Text><View style={styles.sizeRow}>{([4, 6, 8] as BoardSize[]).map((size) => <Pressable key={size} onPress={() => { haptics.light(); setSelectedSize(size); }} style={({ pressed }) => [styles.sizeCard, selectedSize === size && styles.sizeCardSelected, pressed && styles.pressed]}><Text style={[styles.sizeValue, selectedSize === size && styles.sizeValueSelected]}>{size}×{size}</Text><Text style={styles.sizeCaption}>{size === 4 ? "Hızlı düello" : size === 6 ? "Dengeli av" : "Büyük av"}</Text><Text style={styles.sizeDetail}>{size === 4 ? "4 gizli rota" : size === 6 ? "6 gizli rota" : "8 gizli rota"}</Text></Pressable>)}</View><Pressable onPress={() => createRoom()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>ODA OLUŞTUR</Text><Text style={styles.primaryButtonArrow}>→</Text></Pressable><View style={styles.joinCard}><Text style={styles.joinTitle}>DAVET KODUN MU VAR?</Text><View style={styles.joinRow}><TextInput value={roomCodeInput} onChangeText={(value) => setRoomCodeInput(value.toUpperCase())} maxLength={5} autoCapitalize="characters" style={styles.codeInput} placeholder="ABCDE" placeholderTextColor="#6F879A" /><Pressable onPress={joinRoom} style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}><Text style={styles.joinButtonText}>KATIL</Text></Pressable></View></View><Text style={styles.notice}>{notice}</Text></ScrollView></MainShell>;
  }

  if (screen === "profile") {
    const activeAvatar = AVATARS.find((a) => a.id === progress.selectedAvatar) ?? AVATARS[0]!;
    return <MainShell active="profile" onNavigate={(destination) => setScreen(destination)}><StatusBar style="light" /><ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}><View style={styles.subHeader}><View style={[styles.profileAvatarLarge, { backgroundColor: activeAvatar.surface, borderColor: activeAvatar.color, borderWidth: 1.5 }]}><Text style={[styles.profileAvatarLargeText, { color: activeAvatar.color, fontSize: 24 }]}>{activeAvatar.icon}</Text></View><View><Text style={styles.subHeaderKicker}>OYUNCU PROFİLİ</Text><Text style={styles.subHeaderTitle}>{safeName}</Text></View></View><View style={styles.profilePanel}><Text style={styles.profilePanelTitle}>{progress.xp} XP · {progress.wins} GALİBİYET</Text><Text style={styles.profilePanelCopy}>En iyi tur: {progress.bestScore} puan · En yüksek tempo: {progress.bestTempo || "—"} kelime/dk · {progress.streak} günlük seri.</Text><View style={styles.profileRule} /><Text style={styles.inputLabel}>GÖRÜNEN AD</Text><TextInput value={playerName} onChangeText={setPlayerName} maxLength={16} autoCapitalize="characters" style={styles.nameInput} placeholder="OYUNCU" placeholderTextColor="#6F879A" /></View><PlayerCollection progress={progress} onSelectAvatar={(selectedAvatar) => { haptics.light(); setProgress((current) => ({ ...current, selectedAvatar })); }} /><View style={styles.profileHint}><Text style={styles.profileHintTitle}>ETKİN KELİME PAKETİ</Text><Text style={styles.profileHintCopy}>Sezon merkezinden temalı kelime paketini seç ve tekli avların rotasını değiştir.</Text><Pressable onPress={() => setScreen("season")} style={styles.profileHintButton}><Text style={styles.profileHintButtonText}>SEZON MERKEZİ</Text></Pressable></View></ScrollView></MainShell>;
  }

  if (screen === "room" && room) {
    const bothPlayers = room.players.length === 2;
    return (
      <ScreenContainer style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.roomScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.navRow}><Pressable onPress={leaveRoom} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.navTitle}>ÖZEL ODA</Text><View style={styles.navSpacer} /></View>
        <View style={styles.roomHero}>
          <Text style={styles.eyebrow}>DAVET KODU</Text>
          <Text style={styles.roomCode}>{room.code}</Text>
          <Text style={styles.roomHint}>Rakibin bu kodla odaya katılabilir.</Text>
          <Pressable onPress={shareRoomInvite} style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]}><Text style={styles.inviteButtonText}>DAVET BAĞLANTISINI PAYLAŞ</Text><Text style={styles.inviteButtonIcon}>↗</Text></Pressable>
        </View>
        <View style={styles.playerList}>
          {room.players.map((player, index) => <PlayerRow key={player.id} player={player} isMe={player.id === PLAYER_ID} accent={index === 0 ? "#2DD4BF" : "#FB7185"} />)}
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
  room.foundWords.filter((entry) => entry.playerId === PLAYER_ID).forEach((entry) => entry.path.forEach((cell) => foundCellOwners.set(cell, entry.playerId)));
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
          <ScoreBadge name={me?.name ?? safeName} score={myScore} words={myWordCount} total={room.wordsTotal} active={!room.winnerId || iWon} won={iWon} accent="#2DD4BF" />
          <View style={styles.vsMark}><Text style={styles.vsText}>VS</Text></View>
          <ScoreBadge name={opponent?.name ?? "RAKİP"} score={opponentScore} words={opponentWordCount} total={room.wordsTotal} active={!room.winnerId || !iWon} won={Boolean(room.winnerId && !iWon)} accent="#FB7185" />
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
            playerId={PLAYER_ID}
            status={room.status}
            startPointerSelection={startPointerSelection}
            continuePointerSelection={continuePointerSelection}
            finishPointerSelection={finishPointerSelection}
            selectionActiveRef={selectionActiveRef}
          />;
        })}
        {/* Absolute touch/pointer overlay to intercept gestures relative to board cleanly */}
        <View
          onPointerDown={(e: any) => { if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId ?? e.nativeEvent?.pointerId); handleGestureStart(e); }}
          onPointerMove={handleGestureMove}
          onPointerUp={handleGestureEnd}
          onPointerCancel={() => { selectionActiveRef.current = false; clearSelection(); }}
          onPointerLeave={finishPointerSelection}
          onTouchStart={handleGestureStart}
          onTouchMove={handleGestureMove}
          onTouchEnd={handleGestureEnd}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[styles.wordTray, selectionFeedback === "invalid" && styles.wordTrayInvalid, selectionFeedback === "accepted" && styles.wordTrayAccepted]}><Text style={styles.wordLabel}>{selectionFeedback === "invalid" ? "GEÇERSİZ KELİME" : selectionFeedback === "accepted" ? "KELİME KABUL EDİLDİ" : selectedCells.length >= 2 ? "ROTA SEÇİLDİ · DOĞRULAMAK İÇİN GÖNDER" : "SEÇTİĞİN KELİME"}</Text><Text style={[styles.drawnWord, !activeWord && styles.drawnWordEmpty]}>{activeWord || "HARFLERİ BİRLEŞTİR"}</Text><Text style={styles.routeHint}>{selectionFeedback === "invalid" ? "Kırmızı rota birazdan temizlenecek." : selectedCells.length > 1 ? "Mavi önizleme · yeşil yalnız kabul edilince görünür." : "Yalnız yatay ve dikey ilerle"}</Text><View style={styles.wordActions}>{selectedCells.length > 0 && <Pressable onPress={clearSelection} style={styles.clearWord}><Text style={styles.clearWordText}>TEMİZLE</Text></Pressable>}<Pressable disabled={selectedCells.length < 2 || Boolean(pendingWordRef.current)} onPress={() => submitSelection()} style={[styles.submitWord, (selectedCells.length < 2 || Boolean(pendingWordRef.current)) && styles.disabledButton]}><Text style={styles.submitWordText}>GÖNDER</Text></Pressable></View></View>
      <View style={styles.foundPanel}><Text style={styles.foundLabel}>{room.status === "finished" ? "TURDA BULUNAN KELİMELER" : "BULUNAN KELİMELER"}</Text><View style={styles.foundTags}>{room.foundWords.length ? room.foundWords.map((entry, index) => <View key={`${entry.playerId}-${index}`} style={[styles.foundTag, entry.playerId === PLAYER_ID && styles.foundTagMine]}><Text style={styles.foundTagText}>{entry.hidden ? "RAKİP KELİMESİ" : entry.word}</Text></View>) : <Text style={styles.foundEmpty}>Henüz kelime bulunmadı.</Text>}</View></View>
      {room.status === "finished" ? <View style={styles.resultPanel}><Text style={styles.resultTitle}>{iWon ? "TUR SENİN!" : "TUR RAKİBİNİN"}</Text><Text style={styles.resultCopy}>{iWon ? "En yüksek puanı sen topladın." : "Rövanşta daha fazla kelime bul."}</Text><MatchInsight score={myScore} opponentScore={opponentScore} words={myWordCount} opponentWords={opponentWordCount} tempo={myTempo} opponentTempo={opponentTempo} bestScore={progress.bestScore} /><Pressable onPress={requestRematch} style={({ pressed }) => [styles.primaryButton, styles.rematchButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{me?.rematch ? "RAKİP BEKLENİYOR" : "RÖVANŞ İSTE"}</Text><Text style={styles.primaryButtonArrow}>↻</Text></Pressable></View> : <Text style={styles.notice}>{notice}</Text>}
      </ScrollView>
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
  startPointerSelection,
  continuePointerSelection,
  finishPointerSelection,
  selectionActiveRef
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
  startPointerSelection: (index: number) => void;
  continuePointerSelection: (index: number) => void;
  finishPointerSelection: () => void;
  selectionActiveRef: React.MutableRefObject<boolean>;
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
        selectionFeedback === "invalid" && selected && styles.cellInvalid,
        selectionFeedback === "accepted" && selected && styles.cellAccepted,
        status === "finished" && selected && styles.cellFinished
      ]}>
        <Text selectable={false} style={[
          styles.cellLetter,
          size === 6 && styles.cellLetterMedium,
          size === 8 && styles.cellLetterSmall
        ]}>{letter}</Text>
        {selected && <Text selectable={false} style={styles.cellOrder}>{order + 1}</Text>}
        {isFound && !selected && <Text selectable={false} style={styles.cellCheck}>✓</Text>}
      </View>
    </View>
  );
});

function PlayerRow({ player, isMe, accent }: { player: { name: string; connected: boolean; ready: boolean; isBot?: boolean }; isMe: boolean; accent: string }) {
  return <View style={styles.playerRow}><View style={[styles.playerAvatar, { borderColor: accent }]}><Text style={styles.playerAvatarText}>{player.isBot ? "BOT" : initials(player.name)}</Text></View><View style={styles.playerInfo}><Text style={styles.playerName}>{player.name}{isMe ? "  (SEN)" : ""}</Text><Text style={styles.playerState}>{player.isBot ? "YAPAY RAKİP HAZIR" : player.connected ? (player.ready ? "HAZIR" : "TAHTAYI İNCELİYOR") : "BAĞLANTI YENİLENİYOR"}</Text></View><View style={[styles.readyDot, { backgroundColor: player.ready ? "#A3E635" : "#466279" }]} /></View>;
}

function ScoreBadge({ name, score, words, total, active, won, accent }: { name: string; score: number; words: number; total: number; active: boolean; won: boolean; accent: string }) {
  return <View style={[styles.scoreBadge, won && { borderColor: accent }]}><Text numberOfLines={1} style={styles.scoreName}>{name}</Text><Text style={[styles.scoreValue, active && { color: accent }]}>{score}</Text><Text style={[styles.scoreStatus, won && { color: accent }]}>{words} / {total} KELİME</Text></View>;
}

function MainShell({ active, children, onNavigate }: { active: DockDestination; children: React.ReactNode; onNavigate: (destination: DockDestination) => void }) {
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} style={{ paddingHorizontal: 20, paddingTop: 12 }}><View style={styles.shell}>{children}<View style={styles.fixedDock}><PremiumDock active={active} onNavigate={onNavigate} /></View></View></ScreenContainer>;
}

const battleStyles = StyleSheet.create({
  gameScroll: { flexGrow: 1, paddingBottom: 28 },
  previewCell: { backgroundColor: "#1B4F74", borderColor: "#7DD3FC", shadowColor: "#38BDF8", shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  statusRail: { marginTop: 7, minHeight: 48, backgroundColor: "#102235", borderWidth: 1, borderColor: "#29465D", borderRadius: 15, paddingHorizontal: 13, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusRailFinal: { backgroundColor: "#4A2538", borderColor: "#FF647C" },
  railLabel: { color: "#A8BFD0", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  timerValue: { color: "#EAF8FF", fontSize: 19, lineHeight: 21, fontWeight: "900", letterSpacing: 1.3, marginTop: 1 },
  timerValueFinal: { color: "#FFE3E9" },
  battleBadges: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 5, maxWidth: "64%" },
  multiplierBadge: { backgroundColor: "#4D3B19", borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: "#FFC24A" },
  multiplierText: { color: "#FFE4A1", fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
  streakBadge: { backgroundColor: "#143C3B", borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: "#50E3C2" },
  streakText: { color: "#C6FFF6", fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  statsRow: { minHeight: 47, marginTop: 8, borderRadius: 13, backgroundColor: "#0D1D2C", borderWidth: 1, borderColor: "#203A50", flexDirection: "row", alignItems: "center", paddingHorizontal: 10 },
  statCell: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 24, backgroundColor: "#29465D" },
  statLabel: { color: "#A1BACB", fontSize: 8, fontWeight: "900", letterSpacing: 0.9 },
  statValue: { color: "#EBF5FA", fontSize: 11, fontWeight: "900", marginTop: 2 },
  statValuePositive: { color: "#50E3C2" },
  statValueNegative: { color: "#FF8B9C" },
});

const styles = StyleSheet.create({
  shell: { flex: 1 },
  fixedDock: { position: "absolute", left: 0, right: 0, bottom: 0 },
  homeScroll: { paddingBottom: 132, flexGrow: 1 },
  subHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  subHeaderKicker: { color: "#A1BACB", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  subHeaderTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", marginTop: 2 },
  modeIntro: { color: "#BDD2E1", fontSize: 13, lineHeight: 19, marginTop: 23, marginBottom: 14 },
  nameCard: { backgroundColor: "#102235", borderWidth: 1, borderColor: "#29465D", padding: 14, borderRadius: 18 },
  inputLabel: { color: "#A5C0D6", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  nameInput: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", paddingVertical: 6, letterSpacing: 1.3 },
  sectionLabel: { color: "#A5C0D6", fontSize: 10, fontWeight: "800", letterSpacing: 1.1, marginTop: 22, marginBottom: 9 },
  sizeRow: { flexDirection: "row", gap: 10 },
  sizeCard: { flex: 1, backgroundColor: "#102235", borderWidth: 1, borderColor: "#29465D", borderRadius: 18, padding: 16 },
  sizeCardSelected: { borderColor: "#2DD4BF", backgroundColor: "#123844" },
  sizeValue: { color: "#FFFFFF", fontSize: 25, fontWeight: "900" },
  sizeValueSelected: { color: "#2DD4BF" },
  sizeCaption: { color: "#F1F7FA", fontSize: 13, fontWeight: "800", marginTop: 4 },
  sizeDetail: { color: "#A5C0D6", fontSize: 11, marginTop: 3 },
  primaryButton: { marginTop: 18, height: 58, backgroundColor: "#2DD4BF", borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  primaryButtonText: { color: "#07141E", fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  primaryButtonArrow: { color: "#07141E", fontSize: 24, fontWeight: "600" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  disabledButton: { opacity: 0.46 },
  joinCard: { backgroundColor: "#0D1D2C", borderWidth: 1, borderColor: "#203A50", borderRadius: 18, padding: 14, marginTop: 14 },
  joinTitle: { color: "#A5C0D6", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  joinRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 9 },
  codeInput: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", letterSpacing: 3, flex: 1, paddingVertical: 7 },
  joinButton: { backgroundColor: "#23465B", borderRadius: 12, paddingHorizontal: 17, paddingVertical: 12 },
  joinButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  notice: { color: "#A5BCCC", textAlign: "center", fontSize: 12, lineHeight: 18, marginTop: 15, paddingHorizontal: 15 },
  navRow: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 36, height: 36, justifyContent: "center", alignItems: "center", borderRadius: 12, backgroundColor: "#102235" },
  backText: { color: "#FFFFFF", fontSize: 30, lineHeight: 32 },
  navTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "900", letterSpacing: 1.2 },
  navSpacer: { width: 36 },
  roomHero: { alignItems: "center", paddingVertical: 35 },
  roomCode: { color: "#A3E635", fontSize: 42, fontWeight: "900", letterSpacing: 6, marginTop: 6 },
  roomHint: { color: "#BDD2E1", fontSize: 13, marginTop: 8 },
  inviteButton: { marginTop: 15, borderRadius: 13, backgroundColor: "#493878", borderWidth: 1, borderColor: "#9A76ED", minHeight: 42, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  inviteButtonText: { color: "#FFF9FC", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  inviteButtonIcon: { color: "#55E6B2", fontSize: 18, fontWeight: "900" },
  playerList: { backgroundColor: "#102235", borderRadius: 20, padding: 8, borderWidth: 1, borderColor: "#29465D" },
  playerRow: { flexDirection: "row", alignItems: "center", minHeight: 64, paddingHorizontal: 8, gap: 11 },
  playerAvatar: { width: 43, height: 43, borderRadius: 15, borderWidth: 2, backgroundColor: "#0B1928", alignItems: "center", justifyContent: "center" },
  playerAvatarText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 },
  playerInfo: { flex: 1 },
  playerName: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  playerState: { color: "#A2BACB", fontSize: 10, marginTop: 3, fontWeight: "700" },
  readyDot: { width: 9, height: 9, borderRadius: 8, marginRight: 7 },
  waitPlayer: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "#1B3449" },
  waitAvatar: { width: 43, height: 43, borderRadius: 15, borderWidth: 1, borderColor: "#38536A", borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  waitAvatarText: { color: "#8BA5BC", fontWeight: "700", fontSize: 19 },
  waitTitle: { color: "#DFE7ED", fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  waitSub: { color: "#8BA5BC", fontSize: 11, marginTop: 3 },
  ruleCard: { marginTop: 18, backgroundColor: "#172A3C", flexDirection: "row", padding: 15, borderRadius: 17, gap: 11, borderLeftWidth: 3, borderLeftColor: "#A3E635" },
  ruleIcon: { color: "#A3E635", fontSize: 20 },
  ruleTextWrap: { flex: 1 },
  ruleTitle: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  ruleCopy: { color: "#BDD2E1", fontSize: 12, lineHeight: 17, marginTop: 4 },
  gameHeader: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 5 },
  exitButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", backgroundColor: "#14273A", borderRadius: 12 },
  exitText: { color: "#CBE1ED", fontSize: 25, lineHeight: 25 },
  gameMode: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  gameCode: { color: "#9DB3C2", fontSize: 9, marginTop: 2, fontWeight: "800", letterSpacing: 0.8 },
  liveChip: { backgroundColor: "#123844", borderRadius: 99, flexDirection: "row", alignItems: "center", paddingHorizontal: 9, paddingVertical: 6, gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 5, backgroundColor: "#A3E635" },
  liveText: { color: "#BDF7DE", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 7 },
  scoreBadge: { flex: 1, backgroundColor: "#102235", borderWidth: 1, borderColor: "#29465D", borderRadius: 16, alignItems: "center", paddingVertical: 9 },
  scoreName: { color: "#DFE8EE", maxWidth: 105, fontSize: 10, fontWeight: "900", letterSpacing: 0.4 },
  scoreValue: { color: "#FFFFFF", fontSize: 25, lineHeight: 29, fontWeight: "900", marginTop: 1 },
  scoreStatus: { color: "#A5BCCB", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  vsMark: { width: 28, alignItems: "center" },
  vsText: { color: "#8CA4B8", fontSize: 10, fontWeight: "900" },
  targetCard: { alignItems: "center", paddingTop: 15, paddingBottom: 11 },
  targetLabel: { color: "#A1B9CB", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  targetWord: { color: "#A3E635", fontSize: 29, fontWeight: "900", letterSpacing: 2, marginTop: 2 },
  targetTip: { color: "#BDD2E1", fontSize: 11, lineHeight: 15, marginTop: 4, maxWidth: "100%", paddingHorizontal: 12, textAlign: "center" },
  board: { alignSelf: "center", flexDirection: "row", flexWrap: "wrap", backgroundColor: "#0A1927", borderRadius: 24, padding: 4, borderWidth: 1, borderColor: "#29465D", overflow: "hidden", userSelect: "none", touchAction: "none" } as any,
  cellWrap: { padding: 3 },
  cell: { flex: 1, borderRadius: 11, backgroundColor: "#173248", borderWidth: 1, borderColor: "#29465D", alignItems: "center", justifyContent: "center" },
  cellFinished: { backgroundColor: "#7BAA24" },
  cellLetter: { color: "#FFFFFF", fontSize: 23, fontWeight: "900" },
  cellLetterMedium: { fontSize: 19 },
  cellLetterSmall: { fontSize: 15 },
  cellOrder: { position: "absolute", top: 3, right: 4, color: "#E7FFE7", fontSize: 8, fontWeight: "900" },
  cellTail: { borderColor: "#FFC24A", borderWidth: 2, transform: [{ scale: 1.04 }] },
  cellInvalid: { backgroundColor: "#8D2C46", borderColor: "#FF647C" },
  cellAccepted: { backgroundColor: "#26726A", borderColor: "#50E3C2" },
  cellFound: { backgroundColor: "#216C65", borderColor: "#50E3C2" },
  cellFoundMine: { backgroundColor: "#27887B", borderColor: "#A3E635", shadowColor: "#50E3C2", shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  cellCheck: { position: "absolute", left: 4, bottom: 2, color: "#E9FFF8", fontSize: 9, fontWeight: "900" },
  wordTray: { minHeight: 82, marginTop: 12, borderRadius: 17, backgroundColor: "#102235", borderWidth: 1, borderColor: "#29465D", alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  wordTrayInvalid: { borderColor: "#FF647C", backgroundColor: "#5B2339" },
  wordTrayAccepted: { borderColor: "#50E3C2", backgroundColor: "#1F514D" },
  wordLabel: { color: "#A1B9CB", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  drawnWord: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", letterSpacing: 2, marginTop: 3 },
  drawnWordEmpty: { color: "#8CA4B8", fontSize: 10, letterSpacing: 1.1 },
  routeHint: { color: "#A5BDCB", fontSize: 8, fontWeight: "800", marginTop: 3 },
  wordActions: { position: "absolute", right: 10, top: 19, gap: 8, alignItems: "flex-end" },
  clearWord: { paddingVertical: 2 },
  clearWordText: { color: "#FB7185", fontSize: 9, fontWeight: "900" },
  submitWord: { backgroundColor: "#2DD4BF", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  submitWordText: { color: "#07141E", fontSize: 9, fontWeight: "900" },
  foundPanel: { marginTop: 9, borderRadius: 14, backgroundColor: "#0D1D2C", borderWidth: 1, borderColor: "#203A50", padding: 10 },
  foundLabel: { color: "#A1B8C8", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  foundTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 },
  foundTag: { backgroundColor: "#2B3147", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  foundTagMine: { backgroundColor: "#17645F" },
  foundTagText: { color: "#EAF8FF", fontSize: 10, fontWeight: "900" },
  foundEmpty: { color: "#8CA4B8", fontSize: 11 },
  resultPanel: { alignItems: "center", marginTop: 10 },
  resultTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", letterSpacing: 0.2 },
  resultCopy: { color: "#BDD2E1", fontSize: 12, marginTop: 3 },
  rematchButton: { alignSelf: "stretch", marginTop: 12, height: 52 },
  roomScroll: { flexGrow: 1, paddingBottom: 8 },
  eyebrow: { color: "#2DD4BF", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  profileAvatarLarge: { width: 52, height: 52, borderRadius: 18, backgroundColor: "#A3E635", alignItems: "center", justifyContent: "center" },
  profileAvatarLargeText: { color: "#142516", fontSize: 15, fontWeight: "900" },
  profilePanel: { backgroundColor: "#102235", borderRadius: 20, borderWidth: 1, borderColor: "#29465D", padding: 17, marginTop: 23 },
  profilePanelTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  profilePanelCopy: { color: "#BDD2E1", fontSize: 12, lineHeight: 18, marginTop: 7 },
  profileRule: { height: 1, backgroundColor: "#29465D", marginVertical: 16 },
  profileHint: { backgroundColor: "#223544", borderRadius: 18, padding: 16, marginTop: 12, borderLeftWidth: 3, borderLeftColor: "#A3E635" },
  profileHintTitle: { color: "#EAF8FF", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  profileHintCopy: { color: "#DCE6ED", fontSize: 12, lineHeight: 17, marginTop: 5 },
  profileHintButton: { alignSelf: "flex-start", marginTop: 12, backgroundColor: "#A3E635", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 },
  profileHintButtonText: { color: "#132116", fontSize: 10, fontWeight: "900" },
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
