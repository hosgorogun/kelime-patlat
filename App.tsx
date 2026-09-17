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
  Animated,
  AppState,
  BackHandler,
  Modal,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ScreenContainer } from "./components/screen-container";
import { CommandCenter } from "./components/command-center";
import { MatchInsight } from "./components/match-insight";
import { MatchRewardsCard } from "./components/match-rewards";
import { PremiumDock, type DockDestination } from "./components/premium-dock";
import { ProfileScreen } from "./components/profile-screen";
import { SeasonHub } from "./components/season-hub";
import { LeagueHub } from "./components/league-hub";
import { SoloChallenge } from "./components/solo-challenge";
import { SoloLevels } from "./components/solo-levels";
import { ArcadeChallenge } from "./components/arcade-challenge";
import { getGameSocket } from "./lib/game-socket";
import { OnboardingGuide } from "./components/onboarding-guide";
import { haptics, setHapticsEnabled } from "./lib/haptics";
import { gameSfx, setSfxEnabled } from "./lib/game-sfx";
import { setHapticsEnabled as setSoloHapticsEnabled, triggerHapticSelection, triggerHapticSuccess } from "./shared/audio-haptics";
import { advanceSelection, getRoundDurationMs, wordFromSelection, wordScoreMultiplier, type BoardSize, type LeaderboardEntry, type RoomSnapshot } from "./shared/game";
import { applyMatchProgress, applyArcadeProgress, applyVintageProgress, completeDailyProgress, reconcilePlayerProgress, checkDailyLoginReward, getDayId, DEFAULT_PROGRESS, getDailyChallenge, getPlayerLevel, type DailyChallenge, type PlayerProgress, THEME_PACKS, AVATARS, mergePlayerProgress, getUnclaimedMissionsCount, getUnclaimedMilestonesCount, getLeagueTier, buyLives, deductLife, getCalculatedLives, COST_PER_LIFE, COST_REFILL_ALL, MAX_LIVES } from "./shared/progression";
import { inviteMessage, normalizeRoomCode } from "./shared/invite";
import { MAX_SOLO_LEVEL, APP_WORD_PALETTE } from "./shared/solo";
import { getWordDefinition } from "./shared/dictionary";
import { initManusRuntime } from "./lib/_core/manus-runtime";
import { AuthScreen } from "./components/auth-screen";
import { MissionsScreen } from "./components/missions-screen";
import { CyberStore } from "./components/cyber-store";
import { GlobalGameToast, type ToastData } from "./components/global-game-toast";
import { TermsModal } from "./components/terms-modal";
import { consentManager, notificationManager, reviewManager } from "./lib/engagement";
import { SESSION_TOKEN_KEY, getApiBaseUrl } from "./constants/oauth";
import { VintagePuzzle } from "./components/vintage-puzzle";
import { socialManager } from "./shared/social";
import { UserProfileModal, type InspectableUser } from "./components/user-profile-modal";
import { LivesModal } from "./components/lives-modal";
import { ErrorBoundary } from "./components/error-boundary";

type Screen = "home" | "online" | "profile" | "levels" | "solo" | "room" | "game" | "season" | "league" | "arcade" | "daily-lobby" | "missions" | "auth" | "store" | "vintage";

const SOLO_UNLOCK_KEY = "kelime-patlat:solo-unlocked-level";
const PROGRESS_KEY = "kelime-patlat:season-progress-v1";

function initials(name: string) {
  return name.trim().slice(0, 2).toLocaleUpperCase("tr-TR") || "KP";
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


const WORD_PALETTE = APP_WORD_PALETTE;

function HomeScreen() {

  const { width } = useWindowDimensions();
  const selectionRef = useRef<number[]>([]);
  const selectionActiveRef = useRef(false);
  const activeRoomCodeRef = useRef<string | null>(null);
  const pendingWordRef = useRef<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const BOARD_PAD = 4;
    const innerSize = boardWidth - BOARD_PAD * 2;
    const cellSize = innerSize / room.size;
    const row = Math.floor(cellIndex / room.size);
    const col = cellIndex % room.size;
    return {
      x: col * cellSize + cellSize / 2 + BOARD_PAD,
      y: row * cellSize + cellSize / 2 + BOARD_PAD,
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
  const [inspectedPath, setInspectedPath] = useState<number[] | null>(null);
  const [inspectedColor, setInspectedColor] = useState<string>("#F59E0B");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [selectedSize, setSelectedSize] = useState<BoardSize>(4);
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [sfxOn, setSfxOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(() => getGameSocket().connected);

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
    setProgress((curr) => ({ ...curr, sfxEnabled: val }));
  };
  
  const toggleHaptics = (val: boolean) => {
    setHapticsOn(val);
    setHapticsEnabled(val);
    setSoloHapticsEnabled(val);
    AsyncStorage.setItem("kelime-patlat:haptics-enabled", String(val)).catch(() => undefined);
    setProgress((curr) => ({ ...curr, hapticsEnabled: val }));
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
  const [recentSoloWords, setRecentSoloWords] = useState<string[]>([]);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [progressReady, setProgressReady] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isClaimingWelcomeReward, setIsClaimingWelcomeReward] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailySession, setDailySession] = useState<DailyChallenge | null>(null);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((t) => t + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const daily = useMemo(() => getDailyChallenge(), [ticker]);
  const livesCalc = useMemo(() => getCalculatedLives(progress), [progress, ticker]);
  const unclaimedMissions = useMemo(() => getUnclaimedMissionsCount(progress), [progress]);
  const unclaimedMilestones = useMemo(() => getUnclaimedMilestonesCount(progress, soloUnlockedLevel), [progress, soloUnlockedLevel]);
  const hasClaimableDailyReward = useMemo(() => {
    const todayId = getDayId();
    return progress.lastLoginDay !== todayId;
  }, [progress.lastLoginDay, ticker]);
  const [seasonResetModal, setSeasonResetModal] = useState<{ newSeasonId: string; previousRank: string; previousLp: number; newLp: number } | null>(null);
  const [globalToast, setGlobalToast] = useState<ToastData | null>(null);
  const prevLevelRef = useRef<number | null>(null);
  const prevTierRef = useRef<string | null>(null);
  const lastTouchedIndexRef = useRef<number | null>(null);
  const incomingUrl = Linking.useURL();
  const recordedRoundRef = useRef<string | null>(null);
  const victoryCueRef = useRef<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showLeaveDuelModal, setShowLeaveDuelModal] = useState(false);
  const [pendingMatchConfirm, setPendingMatchConfirm] = useState<{ size: BoardSize; modeTitle: string; durationText: string; routesText: string } | null>(null);
  const [selectedModeInfo, setSelectedModeInfo] = useState<"pvp" | "daily" | "vintage" | "arcade" | "solo" | null>(null);
  const [showLivesModal, setShowLivesModal] = useState(false);
  const [buyingLivesLoading, setBuyingLivesLoading] = useState(false);
  const prevRoomStatusRef = useRef<string | null>(null);
  const gameScrollRef = useRef<ScrollView>(null);
  const [arcadeStarted, setArcadeStarted] = useState(false);
  const [gameCountdown, setGameCountdown] = useState<number | null>(null);
  const [inspectedUser, setInspectedUser] = useState<InspectableUser | null>(null);
  const prevStartedAtRef = useRef<number | null>(null);

  const openUserProfile = useCallback(async (target: Partial<InspectableUser> & { id: string; name: string }) => {
    // Önce eldeki hazır bilgileri anında göster
    const base: InspectableUser = {
      id: target.id,
      name: target.name,
      username: target.username || target.name,
      isBot: target.isBot ?? target.id.startsWith("bot:"),
      avatar: target.avatar,
      avatarPhoto: target.avatarPhoto,
      selectedTitle: target.selectedTitle || "[ÇAYLAK]",
      level: target.level || 1,
      tier: target.tier || "DEMİR",
      lp: target.lp ?? 0,
      wins: target.wins ?? 0,
      matches: target.matches ?? 0,
      streak: target.streak ?? 0,
      bestScore: target.bestScore ?? 0,
      bestTempo: target.bestTempo ?? 0,
      xp: target.xp ?? 0,
      historyCount: target.historyCount ?? (target.matches ? target.matches * 3 : 0),
    };
    setInspectedUser(base);

    // Eğer bot değilse sunucudan en güncel detayları arka planda çek
    if (!base.isBot) {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/user/profile/${encodeURIComponent(target.id || target.name)}`);
        if (res.ok) {
          const fresh = await res.json();
          setInspectedUser((current) => current && current.id === target.id ? { ...current, ...fresh } : current);
        }
      } catch {
        // Çevrimdışı veya hata durumunda base bilgiler görünmeye devam eder
      }
    }
  }, []);

  const watchAd = (onReward: () => void) => {
    Alert.alert(
      "📺 Sponsorlu Reklam İzle",
      "Serini korumak için 15 saniyelik sponsorlu ödüllü reklam oynatılacak. Onaylıyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "İzle ve Koruları Al",
          onPress: () => {
            onReward();
          },
        },
      ]
    );
  };

  // Reactive Level-up & League Promotion Celebrations
  useEffect(() => {
    if (!progressReady) return;
    const currentLevel = getPlayerLevel(progress.xp);
    const currentTier = getLeagueTier(progress).tier;

    if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
      let unlockHint = "Yeni rozetler ve unvanlar açıldı!";
      if (currentLevel === 3) unlockHint = "Yeni Avatar Açıldı: Orbit 🪐";
      else if (currentLevel === 5) unlockHint = "Yeni Mod Açıldı: 6×6 Matris Düellosu ⚡";
      else if (currentLevel === 6) unlockHint = "Yeni Avatar Açıldı: Bilge Sage 🧙";
      else if (currentLevel === 8) unlockHint = "Yeni Mod Açıldı: 8×8 Matris Düellosu 🏆";
      else if (currentLevel === 10) unlockHint = "Yeni Mod Açıldı: 10×10 Matris Düellosu 👑";

      setGlobalToast({
        id: `lvl-${currentLevel}-${Date.now()}`,
        title: `SEVİYE ATLADIN! (SEVİYE ${currentLevel})`,
        subtitle: unlockHint,
        icon: "🚀",
        accentColor: "#00F5D4",
        badge: `LVL ${currentLevel}`,
      });
    }
    prevLevelRef.current = currentLevel;

    if (prevTierRef.current !== null && currentTier !== prevTierRef.current) {
      const tierOrder = ["DEMİR", "BRONZ", "GÜMÜŞ", "ALTIN", "PLATİN", "ELMAS", "YÜCELİK", "ÖLÜMSÜZLÜK", "RADIAN"];
      const prevIdx = tierOrder.indexOf(prevTierRef.current);
      const currIdx = tierOrder.indexOf(currentTier);
      if (currIdx > prevIdx) {
        const tierToastData = {
          id: `tier-${currentTier}-${Date.now()}`,
          title: `LİG TERFİSİ! ${currentTier} LİGİ`,
          subtitle: `Harika performans! ${currentTier} ligine yükseldin. Ödüllerini sezon menüsünden incele.`,
          icon: "🏆",
          accentColor: "#FFC24A",
          badge: currentTier,
        };
        if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
          setTimeout(() => setGlobalToast(tierToastData), 4500);
        } else {
          setGlobalToast(tierToastData);
        }
      }
    }
    prevTierRef.current = currentTier;

    // Schedule local push notifications for streak & lives refill
    const livesCalc = getCalculatedLives(progress);
    notificationManager.initAndScheduleReminders(livesCalc.lives, livesCalc.nextLifeTimerSeconds);
  }, [progress.xp, progress.lp, progress.lives, progress.lastLifeRegenTimestamp, progressReady]);

  const safeName = playerName.trim().slice(0, 16) || "OYUNCU";
  const boardWidth = Math.min(
    width - (room?.size === 10 ? 20 : room?.size === 8 ? 28 : room?.size === 6 ? 34 : 40),
    room?.size === 10 ? 410 : room?.size === 8 ? 392 : room?.size === 6 ? 374 : 356
  );
  const me = room?.players.find((player) => player.id === playerId) ?? null;
  const opponent = room?.players.find((player) => player.id !== playerId) ?? null;
  const activeWord = room ? wordFromSelection(room.board, selectedCells) : "";
  const iWon = room?.winnerId === playerId;
  const isDraw = Boolean(room?.status === "finished" && !room?.winnerId);
  const myScore = room?.scores[playerId] ?? 0;
  const opponentScore = opponent ? room?.scores[opponent.id] ?? 0 : 0;
  const myWordCount = room?.foundWords.filter((entry) => entry.playerId === playerId).length ?? 0;
  const opponentWordCount = opponent ? room?.foundWords.filter((entry) => entry.playerId !== playerId).length ?? 0 : 0;
  const myLastFoundWord = room?.foundWords.filter((entry) => entry.playerId === playerId).at(-1)?.word ?? "";
  const myMultiplier = wordScoreMultiplier(myLastFoundWord.length);
  const roundDuration = room ? getRoundDurationMs(room.size) : 0;
  const remainingMs = room?.status === "playing" && room.startedAt ? Math.max(0, Math.min(roundDuration, room.startedAt + roundDuration - clockNow)) : 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isFinalPush = room?.status === "playing" && remainingSeconds > 0 && remainingSeconds <= 10;
  const disconnectRemainingSeconds = room?.disconnectExpiresAt ? Math.max(0, Math.ceil((room.disconnectExpiresAt - clockNow) / 1000)) : 0;
  const elapsedSeconds = room?.startedAt ? Math.max(1, Math.floor((clockNow - room.startedAt) / 1000)) : 1;
  const myTempo = Math.round((myWordCount * 60 / elapsedSeconds) * 10) / 10;
  const opponentTempo = Math.round((opponentWordCount * 60 / elapsedSeconds) * 10) / 10;
  const scoreDifference = myScore - opponentScore;
  const scoreLeadLabel = scoreDifference === 0 ? "EŞİT" : scoreDifference > 0 ? `+${scoreDifference} ÖNDE` : `${scoreDifference} GERİDE`;
  const isBotMatch = Boolean(room?.players.some((p) => p.isBot));
  const matchXpEarned = progress.lastMatchReward?.xp ?? (iWon ? (isBotMatch ? 35 : 60) : isDraw ? (isBotMatch ? 20 : 40) : (isBotMatch ? 20 : 35));
  const matchLpEarned = progress.lastMatchReward?.lp ?? (iWon ? (isBotMatch ? 15 : 25) : isDraw ? 0 : (isBotMatch ? -10 : -20));
  const matchCoinsEarned = progress.lastMatchReward?.coins ?? (iWon ? (isBotMatch ? 4 : 10) : 1);

  useEffect(() => {
    if (room?.status !== "playing" || !room.startedAt) return;
    setClockNow(Date.now());
    const timer = setInterval(() => setClockNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [room?.startedAt, room?.status]);

  useEffect(() => {
    if (screen !== "arcade") {
      setArcadeStarted(false);
    }
  }, [screen]);

  useEffect(() => {
    if (gameCountdown === null) return;
    if (gameCountdown === 0) {
      const timer = setTimeout(() => {
        setGameCountdown(null);
      }, 700);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setGameCountdown((prev) => {
        if (prev === null) return null;
        if (prev === 1) {
          gameSfx.accepted();
          haptics.success();
          return 0;
        }
        if (prev > 1) {
          gameSfx.tap();
          haptics.select();
          return prev - 1;
        }
        return null;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [gameCountdown]);

  const clearSelection = useCallback(() => {
    selectionRef.current = [];
    lastTouchedIndexRef.current = null;
    setSelectedCells([]);
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(SOLO_UNLOCK_KEY).then((stored) => {
      const storedLevel = Number(stored);
      if (active && Number.isInteger(storedLevel) && storedLevel >= 1) {
        setSoloUnlockedLevel(Math.min(storedLevel, MAX_SOLO_LEVEL + 1));
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  // Hardware Back Button Support (Android)
  useEffect(() => {
    const onBackPress = () => {
      if (showGuide) {
        setShowGuide(false);
        return true;
      }
      if (selectedWordInfo) {
        setSelectedWordInfo(null);
        return true;
      }
      if (screen === "room" || screen === "game") {
        Alert.alert(
          "Düellodan Ayrıl",
          "Mevcut odadan ve maçtan ayrılmak istediğinize emin misiniz?",
          [
            { text: "Vazgeç", style: "cancel" },
            {
              text: "Ayrıl",
              style: "destructive",
              onPress: () => leaveRoom(),
            },
          ]
        );
        return true;
      }
      if (screen === "solo") {
        const destination = dailySession ? "home" : "levels";
        setDailySession(null);
        setScreen(destination);
        return true;
      }
      if (screen === "arcade" || screen === "daily-lobby" || screen === "levels" || screen === "season" || screen === "league" || screen === "missions" || screen === "profile" || screen === "online" || screen === "auth" || screen === "store" || screen === "vintage") {
        setScreen("home");
        return true;
      }
      return false; // Exit app if already on home screen
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [screen, showGuide, selectedWordInfo, dailySession, room]);

  // Load token and verify auth state
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(SESSION_TOKEN_KEY).then(async (token) => {
      if (!active) return;
      if (token) {
        if (token === "guest") {
          setAuthToken("guest");
          const cachedId = await AsyncStorage.getItem("kelime-patlat:player-id");
          const cachedName = await AsyncStorage.getItem("kelime-patlat:player-name");
          setPlayerId(cachedId || `guest_${Math.random().toString(36).slice(2, 10)}`);
          setPlayerName(cachedName || "Misafir");
          setAuthLoading(false);
          return;
        }
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
                setProgress((current) => mergePlayerProgress(current, user.progress, { preferRemoteBalances: true }));
              }
            } else {
              const cachedId = await AsyncStorage.getItem("kelime-patlat:player-id");
              const cachedName = await AsyncStorage.getItem("kelime-patlat:player-name");
              setAuthToken(token);
              setPlayerId(cachedId || `user-${Math.random().toString(36).slice(2, 10)}`);
              setPlayerName(cachedName || "OYUNCU");
            }
          } else {
            // Hot refresh / temporary server reconnect: keep cached session active
            const cachedId = await AsyncStorage.getItem("kelime-patlat:player-id");
            const cachedName = await AsyncStorage.getItem("kelime-patlat:player-name");
            setAuthToken(token);
            setPlayerId(cachedId || `user-${Math.random().toString(36).slice(2, 10)}`);
            setPlayerName(cachedName || "OYUNCU");
          }
        } catch (err) {
          console.warn("[Auth] Failed to verify token on startup (offline fallback active):", err);
          const cachedId = await AsyncStorage.getItem("kelime-patlat:player-id");
          const cachedName = await AsyncStorage.getItem("kelime-patlat:player-name");
          setAuthToken(token);
          setPlayerId(cachedId || `offline-${Math.random().toString(36).slice(2, 10)}`);
          setPlayerName(cachedName || "OYUNCU");
        }
      } else {
        // No token stored -> Show Auth (Login/Signup) Screen
        setAuthToken(null);
        setScreen("auth");
      }
      setAuthLoading(false);
    }).catch(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  const syncProgressToCloud = useCallback(async (currentProgress: PlayerProgress) => {
    try {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      if (!token || token === "guest") return;
      await fetch(`${getApiBaseUrl()}/api/auth/sync-progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ progress: currentProgress })
      });
    } catch {
      // Çevrimdışı veya sunucuya ulaşılamayan durumlarda ilerleme yerel AsyncStorage içinde güvenle korunur.
    }
  }, []);

  const awardProgressOnServer = useCallback(async (payload: { kind: "solo" | "arcade" | "vintage"; level?: number; score?: number; foundWords?: string[]; daily?: boolean }, fallback: (current: PlayerProgress) => PlayerProgress) => {
    const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    if (!token || token === "guest") { 
      setProgress(fallback);
      return;
    }
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/game/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...payload, awardId: `${payload.kind}:${Date.now()}:${Math.random().toString(36).slice(2)}` }), 
      });
      if (!response.ok) throw new Error("Ödül sunucuda hesaplanamadı.");
      const data = await response.json();
      if (data.progress) setProgress(data.progress);
      else throw new Error("Sunucu progress döndürmedi.");
    } catch {
      setProgress(fallback);
    }
  }, []);

  const claimMissionOnServer = useCallback(async (kind: "daily" | "weekly", missionId: string, fallback: (current: PlayerProgress) => PlayerProgress) => {
    const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    if (!token || token === "guest") { setProgress(fallback); return; } 
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/game/claim`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ kind, missionId }) });
      if (!response.ok) throw new Error("Görev ödülü alınamadı.");
      const data = await response.json();
      setProgress(data.progress);
    } catch { setProgress(fallback); }
  }, []);

  const claimMilestoneOnServer = useCallback(async (level: number, fallback: (current: PlayerProgress) => PlayerProgress) => {
    const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    if (!token || token === "guest") { setProgress(fallback); return; }
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/game/milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ level })
      });
      if (!response.ok) throw new Error("Sandık ödülü alınamadı.");
      const data = await response.json();
      if (data.progress) setProgress(data.progress);
      else setProgress(fallback);
    } catch {
      setProgress(fallback);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(PROGRESS_KEY),
      AsyncStorage.getItem(SOLO_UNLOCK_KEY),
    ]).then(([storedProgress, storedSolo]) => {
      if (!active) return;
      let localSolo = storedSolo ? parseInt(storedSolo, 10) : 1;
      if (isNaN(localSolo) || localSolo < 1) localSolo = 1;

      if (storedProgress) {
        try {
          const parsed = JSON.parse(storedProgress) as Partial<PlayerProgress>;
          const merged = mergePlayerProgress(DEFAULT_PROGRESS, {
            ...parsed,
            soloUnlockedLevel: Math.max(localSolo, parsed.soloUnlockedLevel ?? 1),
            missions: { ...DEFAULT_PROGRESS.missions, ...parsed.missions },
          });
          setProgress(merged);
          setSoloUnlockedLevel(merged.soloUnlockedLevel ?? 1);
        } catch {
          setProgress({ ...DEFAULT_PROGRESS, soloUnlockedLevel: localSolo });
          setSoloUnlockedLevel(localSolo);
        }
      } else {
        setProgress((curr) => ({ ...curr, soloUnlockedLevel: localSolo }));
        setSoloUnlockedLevel(localSolo);
      }
      setProgressReady(true);
    }).catch(() => { if (active) setProgressReady(true); });

    // Fetch cloud progress on launch if user token exists
    AsyncStorage.getItem(SESSION_TOKEN_KEY).then((token) => {
      if (active && token && token !== "guest") {
        fetch(`${getApiBaseUrl()}/api/auth/get-progress`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (active && data?.progress) {
              setProgress((current) => mergePlayerProgress(current, data.progress, { preferRemoteBalances: true }));
            }
          })
          .catch(() => undefined);
      }
    }).catch(() => undefined);

    // Fetch real-time leaderboard from backend
    fetch(`${getApiBaseUrl()}/api/game/leaderboard`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.leaderboard) && data.leaderboard.length > 0) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch(() => undefined);

    return () => { active = false; };
  }, []);

  // Fetch / refresh real-time leaderboard when navigating to season or league screens
  useEffect(() => {
    if (screen !== "season" && screen !== "league") return;
    let active = true;
    fetch(`${getApiBaseUrl()}/api/game/leaderboard`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.leaderboard) && data.leaderboard.length > 0) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [screen]);

  useEffect(() => {
    if (!progressReady) return;
    if (typeof progress.soloUnlockedLevel === "number" && progress.soloUnlockedLevel > soloUnlockedLevel) {
      setSoloUnlockedLevel(progress.soloUnlockedLevel);
      AsyncStorage.setItem(SOLO_UNLOCK_KEY, String(progress.soloUnlockedLevel)).catch(() => undefined);
    }
  }, [progress.soloUnlockedLevel, progressReady]);

  useEffect(() => {
    if (!progressReady) return;
    if (typeof progress.sfxEnabled === "boolean") {
      setSfxOn(progress.sfxEnabled);
      setSfxEnabled(progress.sfxEnabled);
    }
    if (typeof progress.hapticsEnabled === "boolean") {
      setHapticsOn(progress.hapticsEnabled);
      setHapticsEnabled(progress.hapticsEnabled);
      setSoloHapticsEnabled(progress.hapticsEnabled);
    }
    if (Array.isArray(progress.friends) && progress.friends.length > 0) {
      socialManager.syncFromCloud(progress.friends);
    }
  }, [progress.sfxEnabled, progress.hapticsEnabled, progress.friends, progressReady]);

  useEffect(() => {
    if (!progressReady) return;
    if (progress.welcomeRewardClaimed) return;
    void AsyncStorage.getItem("kelime-patlat:player-id").then((openId) => {
      const key = openId ? `kelime-patlat:guide-seen:${openId}` : "kelime-patlat:guide-seen";
      AsyncStorage.getItem(key).then((seen) => {
        if (!seen) {
          setShowWelcomeModal(true);
        }
      });
    });

    // Comprehensive daily reconciliation: streak shields, daily/weekly missions, and season resets
    const reconciliation = reconcilePlayerProgress(progress);
    if (reconciliation.shieldSaved || reconciliation.streakReset || reconciliation.missionsReset || reconciliation.seasonReset.seasonResetPerformed) {
      setProgress(reconciliation.progress);
    }

    if (reconciliation.seasonReset.seasonResetPerformed) {
      const sr = reconciliation.seasonReset;
      setSeasonResetModal({
        newSeasonId: sr.newSeasonId,
        previousRank: sr.previousRank || "DEMİR",
        previousLp: sr.previousLp ?? 0,
        newLp: sr.newLp ?? 0,
      });
    } else if (reconciliation.shieldSaved) {
      Alert.alert(
        "🛡️ Seri Kalkanı Devreye Girdi!",
        `Dün oyuna giremediğin için ${reconciliation.shieldsConsumed} adet Seri Kalkanı kullanıldı ve ${reconciliation.previousStreak} günlük serin başarıyla korundu!`
      );
    } else if (reconciliation.streakReset && reconciliation.previousStreak > 0) {
      Alert.alert(
        "⚡ Günlük Seri Sıfırlandı",
        `Dün günlük rotayı tamamlamadığın için ${reconciliation.previousStreak} günlük serin sıfırlandı. Bugün yeni bir seri başlatabilirsin!`
      );
    }
  }, [progressReady]);

  // Handle app resuming from background / sleep mode (day change & streak check)
  useEffect(() => {
    if (!progressReady) return;
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setProgress((current) => {
          const res = reconcilePlayerProgress(current);
          if (res.shieldSaved || res.streakReset || res.missionsReset || res.seasonReset.seasonResetPerformed) {
            return res.progress;
          }
          return current;
        });
      }
    });
    return () => subscription.remove();
  }, [progressReady]);

  useEffect(() => {
    if (!progressReady) return;
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => undefined);
    AsyncStorage.setItem("kelime-patlat:player-name", safeName).catch(() => undefined);
    if (authToken && authToken !== "guest") {
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
      syncDebounceRef.current = setTimeout(() => {
        syncProgressToCloud(progress);
      }, 1500);
    }
    return () => {
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    };
  }, [progress, progressReady, safeName, authToken, syncProgressToCloud]);

  useEffect(() => {
    if (!incomingUrl) return;
    let active = true;
    const parsedUrl = Linking.parse(incomingUrl);
    const oauthCode = typeof parsedUrl.queryParams?.code === "string" ? parsedUrl.queryParams.code : null;
    const oauthState = typeof parsedUrl.queryParams?.state === "string" ? parsedUrl.queryParams.state : null;
    if (parsedUrl.path?.includes("oauth/callback") && oauthCode && oauthState) {
      fetch(`${getApiBaseUrl()}/api/oauth/mobile?code=${encodeURIComponent(oauthCode)}&state=${encodeURIComponent(oauthState)}`)
        .then(async (response) => {
          if (!response.ok) throw new Error("OAuth callback failed");
          return response.json();
        })
        .then(async (data) => {
          if (!active || !data?.app_session_id || !data.user?.openId) return;
          const previousToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
          await AsyncStorage.setItem(SESSION_TOKEN_KEY, data.app_session_id);
          await AsyncStorage.setItem("kelime-patlat:player-id", data.user.openId);
          await AsyncStorage.setItem("kelime-patlat:player-name", data.user.name || "OYUNCU");
          setAuthToken(data.app_session_id);
          setPlayerId(data.user.openId);
          setPlayerName(data.user.name || "OYUNCU");

          // Misafir oturumundan geliniyorsa misafir ilerlemesini yeni OAuth hesabına aktar
          if (previousToken && previousToken !== "guest" && previousToken !== data.app_session_id) {
            try {
              const transferResponse = await fetch(`${getApiBaseUrl()}/api/auth/claim-guest`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.app_session_id}` },
                body: JSON.stringify({ guestToken: previousToken }),
              });
              const transferData = await transferResponse.json();
              if (transferResponse.ok && transferData.progress) {
                setProgress(transferData.progress);
                await syncProgressToCloud(transferData.progress);
                return;
              }
            } catch {
              // Fallback to local merge
            }
          }

          if (data.user.progress) {
            const merged = mergePlayerProgress(progress, data.user.progress, { preferRemoteBalances: true });
            setProgress(merged);
            await syncProgressToCloud(merged);
          }
        })
        .catch(() => {
          if (active) setNotice("Giriş tamamlanamadı. Lütfen tekrar deneyin.");
        });
      return () => { active = false; };
    }
    const code = normalizeRoomCode(parsedUrl.queryParams?.code);
    if (code) {
      setRoomCodeInput(code);
      setScreen("online");
      setNotice("Davet kodu hazır. Adını kontrol edip odaya katıl.");
    }
    return () => { active = false; };
  }, [incomingUrl]);

  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    let active = true;
    consentManager.isConsentAccepted().then((accepted) => {
      if (active && !accepted) {
        setShowConsentModal(true);
      }
    });
    void notificationManager.initAndScheduleReminders();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!room || room.status !== "finished") return;
    const roundId = `${room.code}:${room.startedAt ?? 0}`;
    if (recordedRoundRef.current === roundId) return;
    recordedRoundRef.current = roundId;
    const myFoundWords = room.foundWords.filter((entry) => entry.playerId === playerId && !entry.hidden).map((entry) => entry.word);
    const foundLongWord = myFoundWords.some((w) => w.length >= 7);
    const isBotMatch = room.players.some((p) => p.isBot);
    // Compute result values directly from room to avoid stale derived-state deps
    const currentMyScore = room.scores[playerId] ?? 0;
    const myWc = room.foundWords.filter((e) => e.playerId === playerId).length;
    const elapsedSec = room.startedAt ? Math.max(5, Math.floor((Date.now() - room.startedAt) / 1000)) : 5;
    const currentTempo = Math.round((myWc * 60 / elapsedSec) * 10) / 10;
    const currentIWon = room.winnerId === playerId;
    const currentIsDraw = !room.winnerId;
    
    if (currentIWon) {
      void reviewManager.recordVictoryAndCheckPrompt(progress.wins + 1);
    }
    
    setProgress((current) => applyMatchProgress(current, { score: currentMyScore, tempo: currentTempo, won: currentIWon, isDraw: currentIsDraw, longWord: foundLongWord, foundWords: myFoundWords, size: room.size }, isBotMatch ? "bot" : "pvp"));
  }, [room, playerId, progress.wins]);

  useEffect(() => {
    if (!room) return;
    const roundId = `${room.code}:${room.startedAt ?? 0}`;
    if (room.status === "playing") {
      victoryCueRef.current = null;
      setShowResultModal(false);
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
      explodeParticles(selectionRef.current);
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
    const onRejected = (payload?: { word?: string; reason?: string }) => {
      if (pendingWordTimeoutRef.current) clearTimeout(pendingWordTimeoutRef.current);
      pendingWordRef.current = null;
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
      setSelectionFeedback("invalid");
      gameSfx.rejected();
      clearFeedbackLater();
    };
    const onLeaderboardUpdate = (next: LeaderboardEntry[]) => setLeaderboard(next);
    const onReconnect = () => {
      setIsSocketConnected(true);
      if (activeRoomCodeRef.current) {
        socket.emit("room:reconnect", { code: activeRoomCodeRef.current, playerId });
      }
    };
    const onDisconnect = () => {
      setIsSocketConnected(false);
    };

    socket.on("room:update", onRoomUpdate);
    socket.on("room:error", onRoomError);
    socket.on("word:rejected", onRejected);
    socket.on("connect", onReconnect);
    socket.on("disconnect", onDisconnect);
    socket.on("leaderboard:update", onLeaderboardUpdate);
    socket.emit("leaderboard:request");
    return () => {
      socket.off("room:update", onRoomUpdate);
      socket.off("room:error", onRoomError);
      socket.off("word:rejected", onRejected);
      socket.off("connect", onReconnect);
      socket.off("disconnect", onDisconnect);
      socket.off("leaderboard:update", onLeaderboardUpdate);
      if (pendingWordTimeoutRef.current) clearTimeout(pendingWordTimeoutRef.current);
    };
  }, [clearFeedbackLater, setRoomFromServer, playerId]);

  const ensureConnectedSocket = async (): Promise<any> => {
    const socket = getGameSocket();
    if (socket.connected) return socket;
    socket.connect();
    // 7 saniye boyunca bağlantının kurulmasını bekle
    return new Promise((resolve) => {
      if (socket.connected) return resolve(socket);
      let timer: NodeJS.Timeout;
      const onConnect = () => {
        cleanup();
        resolve(socket);
      };
      const onError = (err?: any) => {
        if (err?.message && err.message !== "Invalid session") {
          console.warn("[Socket] Connection error:", err);
        }
        cleanup();
        resolve(socket.connected ? socket : null);
      };
      const cleanup = () => {
        clearTimeout(timer);
        socket.off("connect", onConnect);
        socket.off("connect_error", onError);
      };
      timer = setTimeout(() => {
        cleanup();
        resolve(socket.connected ? socket : null);
      }, 7000);
      socket.once("connect", onConnect);
      socket.once("connect_error", onError);
    });
  };

  const createRoom = async (size = selectedSize) => {
    haptics.light();
    const socket = await ensureConnectedSocket();
    if (!socket || !socket.connected) {
      setNotice("Sunucuya bağlanılamadı. Lütfen internet bağlantını kontrol et.");
      setGlobalToast({
        id: `conn-err-${Date.now()}`,
        title: "BAĞLANTI HATASI",
        subtitle: "Sunucuya bağlanılamadı. Lütfen internet bağlantını kontrol et.",
        icon: "📡",
        accentColor: "#FF647C",
      });
      haptics.error();
      return;
    }
    const myProfile = {
      avatar: progress.selectedAvatar,
      avatarPhoto: progress.avatarPhoto,
      selectedTitle: progress.selectedTitle || "[ÇAYLAK]",
      level: getPlayerLevel(progress.xp),
      tier: getLeagueTier(progress).tier,
      lp: progress.lp || 0,
      wins: progress.wins || 0,
      matches: progress.matches || 0,
      streak: progress.streak || 0,
      bestScore: progress.bestScore || 0,
      bestTempo: progress.bestTempo || 0,
    };
    socket.emit("room:create", { playerId, playerName: safeName, size, immediateBot: false, profile: myProfile });
    setNotice("Odan hazırlanıyor…");
  };

  const startBotDuel = async (size: BoardSize) => {
    setSelectedSize(size);
    setScreen("online");
    haptics.light();
    const socket = await ensureConnectedSocket();
    if (!socket || !socket.connected) {
      setNotice("Sunucuya bağlanılamadı. Lütfen internet bağlantını kontrol et.");
      setGlobalToast({
        id: `conn-err-${Date.now()}`,
        title: "BAĞLANTI HATASI",
        subtitle: "Sunucuya bağlanılamadı. Lütfen internet bağlantını kontrol et.",
        icon: "📡",
        accentColor: "#FF647C",
      });
      haptics.error();
      return;
    }
    const myProfile = {
      avatar: progress.selectedAvatar,
      avatarPhoto: progress.avatarPhoto,
      selectedTitle: progress.selectedTitle || "[ÇAYLAK]",
      level: getPlayerLevel(progress.xp),
      tier: getLeagueTier(progress).tier,
      lp: progress.lp || 0,
      wins: progress.wins || 0,
      matches: progress.matches || 0,
      streak: progress.streak || 0,
      bestScore: progress.bestScore || 0,
      bestTempo: progress.bestTempo || 0,
    };
    socket.emit("room:create", { playerId, playerName: safeName, size, immediateBot: true, profile: myProfile });
    setNotice("Yapay zeka rakip hazırlanıyor...");
  };

  const promptBotDuel = (size: BoardSize) => {
    const modeTitle = size === 4 ? "4×4 Nabız Hızlı Savaş" : size === 6 ? "6×6 Akış Düellosu" : size === 8 ? "8×8 Derinlik Düellosu" : "10×10 Zirve Master Savaş";
    const durationText = size === 4 ? "55 Saniye" : size === 6 ? "75 Saniye" : size === 8 ? "90 Saniye" : "110 Saniye";
    const routesText = size === 4 ? "4 Rota" : size === 6 ? "6 Rota" : size === 8 ? "8 Rota" : "10 Rota";

    setPendingMatchConfirm({
      size,
      modeTitle,
      durationText,
      routesText,
    });
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

  const joinRoom = async () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (code.length < 5) {
      haptics.error();
      setNotice("5 karakterli oda kodunu yaz.");
      return;
    }
    const socket = await ensureConnectedSocket();
    if (!socket || !socket.connected) {
      setNotice("Sunucuya bağlanılamadı. Lütfen internet bağlantını kontrol et.");
      setGlobalToast({
        id: `conn-err-${Date.now()}`,
        title: "BAĞLANTI HATASI",
        subtitle: "Sunucuya bağlanılamadı. Lütfen internet bağlantını kontrol et.",
        icon: "📡",
        accentColor: "#FF647C",
      });
      haptics.error();
      return;
    }
    haptics.light();
    const myProfile = {
      avatar: progress.selectedAvatar,
      avatarPhoto: progress.avatarPhoto,
      selectedTitle: progress.selectedTitle || "[ÇAYLAK]",
      level: getPlayerLevel(progress.xp),
      tier: getLeagueTier(progress).tier,
      lp: progress.lp || 0,
      wins: progress.wins || 0,
      matches: progress.matches || 0,
      streak: progress.streak || 0,
      bestScore: progress.bestScore || 0,
      bestTempo: progress.bestTempo || 0,
    };
    socket.emit("room:join", { code, playerId, playerName: safeName, profile: myProfile });
    setNotice("Odaya katılıyorsun…");
  };

  const leaveRoom = () => {
    if (room) getGameSocket().emit("room:leave", { code: room.code, playerId });
    getGameSocket().emit("matchmaking:leave", { playerId, size: selectedSize });
    setShowResultModal(false);
    setShowLeaveDuelModal(false);
    activeRoomCodeRef.current = null;
    prevStartedAtRef.current = null;
    setGameCountdown(null);
    setInspectedPath(null);
    setRoom(null);
    clearSelection();
    setScreen("home");
    setNotice("Yeni bir düello için hazırsın.");
  };

  const handleLiveGameExitPress = () => {
    if (room?.status === "playing") {
      haptics.light();
      setShowLeaveDuelModal(true);
    } else {
      leaveRoom();
    }
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
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
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
      if (lastTouchedIndexRef.current === index) return;
      lastTouchedIndexRef.current = index;
      const isFound = room.foundWords.some(entry => entry.playerId === playerId && entry.path.includes(index));
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

  const handleBuyOneLife = async () => {
    if (buyingLivesLoading) return;
    setBuyingLivesLoading(true);
    try {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      if (!token || token === "guest") {
        const res = buyLives(progress, "one");
        if (!res.success) {
          setGlobalToast({
            id: `no-chips-${Date.now()}`,
            title: "İŞLEM GERÇEKLEŞTİRİLEMEDİ",
            subtitle: res.message,
            icon: "🪙",
            accentColor: "#EF4444"
          });
        } else {
          setProgress(res.updatedProgress);
          syncProgressToCloud(res.updatedProgress);
          triggerHapticSuccess();
          setGlobalToast({
            id: `life-bought-${Date.now()}`,
            title: "CAN EKLENDİ 💚",
            subtitle: "1 Can başarıyla profilinize tanımlandı!",
            icon: "💚",
            accentColor: "#22C55E"
          });
        }
      } else {
        const response = await fetch(`${getApiBaseUrl()}/api/game/lives`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ option: "one" })
        });
        const data = await response.json();
        if (!response.ok) {
          setGlobalToast({
            id: `life-err-${Date.now()}`,
            title: "İŞLEM BAŞARISIZ",
            subtitle: data.error || "Can satın alınamadı.",
            icon: "❌",
            accentColor: "#EF4444"
          });
        } else {
          setProgress(data.progress);
          triggerHapticSuccess();
          setGlobalToast({
            id: `life-bought-${Date.now()}`,
            title: "CAN EKLENDİ 💚",
            subtitle: "1 Can başarıyla profilinize tanımlandı!",
            icon: "💚",
            accentColor: "#22C55E"
          });
        }
      }
    } catch {
      const res = buyLives(progress, "one");
      if (res.success) setProgress(res.updatedProgress);
    } finally {
      setBuyingLivesLoading(false);
    }
  };

  const handleRefillAllLives = async () => {
    if (buyingLivesLoading) return;
    setBuyingLivesLoading(true);
    try {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      if (!token || token === "guest") {
        const res = buyLives(progress, "all");
        if (!res.success) {
          setGlobalToast({
            id: `no-chips-${Date.now()}`,
            title: "İŞLEM GERÇEKLEŞTİRİLEMEDİ",
            subtitle: res.message,
            icon: "🪙",
            accentColor: "#EF4444"
          });
        } else {
          setProgress(res.updatedProgress);
          syncProgressToCloud(res.updatedProgress);
          triggerHapticSuccess();
          setGlobalToast({
            id: `lives-refilled-${Date.now()}`,
            title: "CANLAR DOLDU! 💚",
            subtitle: `Canlarınız ${MAX_LIVES}/${MAX_LIVES} olarak yenilendi!`,
            icon: "💚",
            accentColor: "#22C55E"
          });
        }
      } else {
        const response = await fetch(`${getApiBaseUrl()}/api/game/lives`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ option: "all" })
        });
        const data = await response.json();
        if (!response.ok) {
          setGlobalToast({
            id: `life-err-${Date.now()}`,
            title: "İŞLEM BAŞARISIZ",
            subtitle: data.error || "Canlar yenilenemedi.",
            icon: "❌",
            accentColor: "#EF4444"
          });
        } else {
          setProgress(data.progress);
          triggerHapticSuccess();
          setGlobalToast({
            id: `lives-refilled-${Date.now()}`,
            title: "CANLAR DOLDU! 💚",
            subtitle: `Canlarınız ${MAX_LIVES}/${MAX_LIVES} olarak yenilendi!`,
            icon: "💚",
            accentColor: "#22C55E"
          });
        }
      }
    } catch {
      const res = buyLives(progress, "all");
      if (res.success) setProgress(res.updatedProgress);
    } finally {
      setBuyingLivesLoading(false);
    }
  };

  const handleWatchAdForLife = async () => {
    if (buyingLivesLoading) return;
    setBuyingLivesLoading(true);
    try {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      if (!token || token === "guest") {
        const res = buyLives(progress, "ad");
        if (res.success) {
          setProgress(res.updatedProgress);
          syncProgressToCloud(res.updatedProgress);
          triggerHapticSuccess();
          setGlobalToast({
            id: `ad-life-${Date.now()}`,
            title: "REKLAM ÖDÜLÜ 📺",
            subtitle: "+1 Can kazandın!",
            icon: "💚",
            accentColor: "#22C55E"
          });
        }
      } else {
        const response = await fetch(`${getApiBaseUrl()}/api/game/lives`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ option: "ad" })
        });
        const data = await response.json();
        if (response.ok) {
          setProgress(data.progress);
          triggerHapticSuccess();
          setGlobalToast({
            id: `ad-life-${Date.now()}`,
            title: "REKLAM ÖDÜLÜ 📺",
            subtitle: "+1 Can kazandın!",
            icon: "💚",
            accentColor: "#22C55E"
          });
        }
      }
    } catch {
      const res = buyLives(progress, "ad");
      if (res.success) setProgress(res.updatedProgress);
    } finally {
      setBuyingLivesLoading(false);
    }
  };

  const openSoloLevel = (level: number) => {
    const calc = getCalculatedLives(progress);
    if (calc.lives <= 0) {
      setGlobalToast({
        id: `no-lives-${Date.now()}`,
        title: "CANIN KALMADI! 💔",
        subtitle: "Solo moda girmek için en az 1 Can gereklidir. Bekleyebilir veya Can satın alabilirsin.",
        icon: "💚",
        accentColor: "#EF4444",
      });
      setShowLivesModal(true);
      return;
    }
    setDailySession(null);
    setSoloLevel(Math.min(level, MAX_SOLO_LEVEL));
    setScreen("solo");
  };

  const completeSoloLevel = (level: number, foundWords: string[] = [], won = true) => {
    if (!won) {
      setProgress((curr) => {
        const updated = deductLife(curr);
        void syncProgressToCloud(updated);
        const calc = getCalculatedLives(updated);
        if (calc.lives <= 0) {
          setGlobalToast({
            id: `life-lost-${Date.now()}`,
            title: "CAN KAYBEDİLDİ 💔",
            subtitle: "Son canını tükettin! Canların 15 dakikada bir otomatik dolar veya çiple yenileyebilirsin.",
            icon: "💔",
            accentColor: "#EF4444",
          });
          setShowLivesModal(true);
        } else {
          setGlobalToast({
            id: `life-deducted-${Date.now()}`,
            title: "1 CAN KAYBEDİLDİ 💔",
            subtitle: `Kalan Can: ${calc.lives}/${MAX_LIVES}`,
            icon: "💔",
            accentColor: "#EF4444",
          });
        }
        return updated;
      });
      return;
    }
    if (foundWords && foundWords.length > 0) {
      setRecentSoloWords((prev) => Array.from(new Set([...foundWords, ...prev])).slice(0, 80));
    }
    const next = Math.min(MAX_SOLO_LEVEL + 1, Math.max(soloUnlockedLevel, level + 1));
    setSoloUnlockedLevel(next);
    AsyncStorage.setItem(SOLO_UNLOCK_KEY, String(next)).catch(() => undefined);
    setProgress((curr) => {
      const updated = { ...curr, soloUnlockedLevel: next };
      void syncProgressToCloud(updated);
      return updated;
    });
    void awardProgressOnServer(
      { kind: "solo", level, foundWords },
      (current) => ({
        ...applyMatchProgress(current, { score: level * 14, tempo: Math.max(1, level / 2), won: true, longWord: level >= 5, foundWords }, "solo"),
        soloUnlockedLevel: Math.min(MAX_SOLO_LEVEL + 1, Math.max(current.soloUnlockedLevel ?? 1, next)),
      }),
    );
  };

  const closeGuide = async () => {
    setShowGuide(false);
    await AsyncStorage.setItem("kelime-patlat:guide-seen", "true");
  };

  const completeDailyChallenge = (level: number, foundWords: string[] = [], won = true) => {
    if (won) {
      const updated = completeDailyProgress(applyMatchProgress(progress, { score: level * 14, tempo: Math.max(1, level / 2), won: true, longWord: level >= 5, foundWords }, "solo"), daily);
      setProgress(updated);
      void awardProgressOnServer(
        { kind: "solo", level, foundWords, daily: true },
        () => updated,
      );
    } else {
      setProgress((current) => {
        const availableShields = current.streakShields || 0;
        if (availableShields >= 1) {
          setGlobalToast({
            id: `shield-used-${Date.now()}`,
            title: "🛡️ SERİ KALKANI KULLANILDI!",
            subtitle: "Günlük rotayı tamamlayamadın ancak 1 Seri Kalkanın harcanarak galibiyet serin korundu!",
            icon: "🛡️",
            accentColor: "#A78BFA",
          });
          return {
            ...current,
            dailyCompletedId: daily.id,
            streakShields: availableShields - 1,
            lastStreakCheckDate: daily.id,
          };
        }
        return {
          ...current,
          dailyCompletedId: daily.id,
          streak: 0,
          lastStreakCheckDate: daily.id,
        };
      });
    }
  };

  const handleClaimDailyReward = () => {
    const todayId = getDayId();
    const res = checkDailyLoginReward(progress, todayId);
    if (!res) return;
    setProgress(res.updatedProgress);
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(res.updatedProgress)).catch(() => undefined);
    void syncProgressToCloud(res.updatedProgress);
    haptics.success();
    gameSfx.victory();
    const rewardName = res.reward.rewardType === "coins" ? "SİBER ÇİP" : res.reward.rewardType === "shield" ? "SERİ KALKANI" : "SEZON XP";
    setGlobalToast({
      id: `daily-reward-${Date.now()}`,
      title: `🎁 GÜNLÜK ÖDÜL ALINDI!`,
      subtitle: `${res.reward.label} tamamlandı! +${res.reward.amount} ${rewardName} hesabına eklendi.`,
      icon: res.reward.icon,
      accentColor: "#00F5D4",
      badge: `+${res.reward.amount}`,
    });
  };

  const handleCloseGuide = () => {
    setShowGuide(false);
    AsyncStorage.setItem("kelime-patlat:guide-seen", "true").catch(() => undefined);
  };

  if (screen === "home") {
    return (
      <MainShell active="home" onNavigate={(destination) => setScreen(destination)} showGuide={showGuide} onCloseGuide={handleCloseGuide} missionsBadgeCount={unclaimedMissions} storeBadgeCount={hasClaimableDailyReward ? 1 : undefined} toast={globalToast} onDismissToast={() => setGlobalToast(null)} seasonResetModal={seasonResetModal} onCloseSeasonResetModal={() => setSeasonResetModal(null)}>
        <StatusBar style="light" />
        <CommandCenter
          playerName={safeName}
          progress={progress}
          daily={daily}
          leaderboard={leaderboard}
          onPlayDaily={() => setScreen("daily-lobby")}
          onPlayBot={promptBotDuel}
          onSolo={() => setScreen("levels")}
          onNavigate={setScreen}
          onLeaderboard={() => setScreen("season")}
          onShowGuide={() => setShowGuide(true)}
          onOpenModeInfo={(mode) => setSelectedModeInfo(mode)}
          onOpenLivesModal={() => setShowLivesModal(true)}
          onSelectTheme={(selectedTheme) => {
            setProgress((current) => ({ ...current, selectedTheme }));
          }}
          unclaimedMissionsCount={unclaimedMissions}
          unclaimedMilestonesCount={unclaimedMilestones}
          onClaimDailyReward={handleClaimDailyReward}
          onShowToast={(title, subtitle, icon, accentColor) => {
            setGlobalToast({
              id: Date.now().toString(),
              title,
              subtitle,
              icon: icon || "🔒",
              accentColor: accentColor || "#EF4444",
            });
          }}
        />
        {/* Game Mode Info Modal */}
        <Modal
          visible={selectedModeInfo !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedModeInfo(null)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "center", alignItems: "center", padding: 24 }}
            onPress={() => setSelectedModeInfo(null)}
          >
            <Pressable
              style={{
                width: "100%",
                maxWidth: 360,
                backgroundColor: "#130E26",
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: selectedModeInfo === "arcade" ? "#FFD000" : selectedModeInfo === "vintage" ? "#FFC24A" : selectedModeInfo === "daily" ? "#A78BFA" : "#00F5D4",
                padding: 24,
                alignItems: "center",
                shadowColor: selectedModeInfo === "arcade" ? "#FFD000" : selectedModeInfo === "vintage" ? "#FFC24A" : selectedModeInfo === "daily" ? "#A78BFA" : "#00F5D4",
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 12,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: selectedModeInfo === "arcade" ? "rgba(255, 208, 0, 0.15)" : selectedModeInfo === "vintage" ? "rgba(255, 194, 74, 0.15)" : selectedModeInfo === "solo" ? "rgba(56, 189, 248, 0.15)" : selectedModeInfo === "daily" ? "rgba(167, 139, 250, 0.15)" : "rgba(0, 245, 212, 0.15)",
                  borderWidth: 1.5,
                  borderColor: selectedModeInfo === "arcade" ? "#FFD000" : selectedModeInfo === "vintage" ? "#FFC24A" : selectedModeInfo === "solo" ? "#38BDF8" : selectedModeInfo === "daily" ? "#A78BFA" : "#00F5D4",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 24 }}>
                  {selectedModeInfo === "pvp" ? "⚔️" : selectedModeInfo === "daily" ? "🗓️" : selectedModeInfo === "solo" ? "🏆" : selectedModeInfo === "vintage" ? "🗞️" : "⚡"}
                </Text>
              </View>

              <Text style={{ color: selectedModeInfo === "arcade" ? "#FFD000" : selectedModeInfo === "vintage" ? "#FFC24A" : selectedModeInfo === "solo" ? "#38BDF8" : selectedModeInfo === "daily" ? "#A78BFA" : "#00F5D4", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 4, textAlign: "center" }}>
                {selectedModeInfo === "pvp" ? "ÇOK OYUNCULU DÜELLO" : selectedModeInfo === "daily" ? "ETKİNLİK MODU" : selectedModeInfo === "solo" ? "KLASİK TEK OYUNCU" : selectedModeInfo === "vintage" ? "NOSTALJİ MİNİ OYUN" : "ZAMANA KARŞI YARIŞ"}
              </Text>
              
              <Text style={{ color: "#FFF", fontSize: 20, fontWeight: "900", letterSpacing: 0.5, marginBottom: 12, textAlign: "center" }}>
                {selectedModeInfo === "pvp" ? "Canlı Kelime Düellosu" : selectedModeInfo === "daily" ? "Günün Sabit Rotası" : selectedModeInfo === "solo" ? "Seviye Yolculuğu" : selectedModeInfo === "vintage" ? "Gazete Kare Bulmacası" : "Zamanda Yarış Arcade"}
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.05)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16, gap: 6 }}>
                <Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }}>OYUN TİPİ:</Text>
                <Text style={{ color: selectedModeInfo === "arcade" ? "#FFD000" : selectedModeInfo === "vintage" ? "#FFC24A" : selectedModeInfo === "solo" ? "#38BDF8" : selectedModeInfo === "daily" ? "#A78BFA" : "#00F5D4", fontSize: 12, fontWeight: "900" }}>
                  {selectedModeInfo === "pvp" ? "1v1 Canlı Rakip" : selectedModeInfo === "daily" ? "Günlük Özel Tahta" : selectedModeInfo === "solo" ? "Bölüm İlerleme Sistemi" : selectedModeInfo === "vintage" ? "10×10 Gazete Matrisi" : "Süreli Rekor Modu"}
                </Text>
              </View>

              <Text style={{ color: "#CBD5E1", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 18 }}>
                {selectedModeInfo === "pvp"
                  ? "Gerçek bir rakiple aynı anda yarışırsın. Izgaradaki harfleri parmağınla bağlayarak geçerli kelimeler üret. Ne kadar uzun kelime bulursan puan çarpanın o kadar katlanır!"
                  : selectedModeInfo === "daily"
                  ? "Her gün yenilenen sabit bulmaca rotasında kelimeleri tamamla. Günlük rotayı bitirmek galibiyet serini (Streak) korur ve ekstra seri puanı kazandırır."
                  : selectedModeInfo === "solo"
                  ? "1. seviyeden başlayarak Seviye Yolculuğu'nda ilerle! Izgaradaki hedef kelimeleri bularak seviyeleri tamamla, ustalık kazan ve kilitli ızgara boyutlarını aç."
                  : selectedModeInfo === "vintage"
                  ? "Nostaljik gazete bulmacası keyfi! İpuçlarını çözerek harf taşlarını 10×10 matrise yerleştir, kare bulmacayı tamamla ve nostalji bonus XP'lerini topla."
                  : "Zamansız akış! Belirlenen süre bitmeden olabildiğince çok kelime bul, kombo puanlarını katla ve liderlik tablosundaki rekorunu kır."}
              </Text>

              <View style={{ width: "100%", backgroundColor: "rgba(255, 255, 255, 0.04)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)", padding: 14, marginBottom: 20 }}>
                <Text style={{ color: "#F1F5F9", fontSize: 11, fontWeight: "900", letterSpacing: 0.5, marginBottom: 6 }}>💡 STRATEJİ VE İPUCU</Text>
                <Text style={{ color: "#94A3B8", fontSize: 12, lineHeight: 18 }}>
                  {selectedModeInfo === "pvp"
                    ? "• 5 harfli kelimeler 1.5×, 7+ harfli kelimeler 2.0× puan verir.\n• Siber Radar jokeri ile harf rotalarını anında gör."
                    : selectedModeInfo === "daily"
                    ? "• Her gün 1 defa oynama hakkın vardır.\n• Tamamlayamadığın günlerde Seri Kalkanı otomatik devreye girer."
                    : selectedModeInfo === "solo"
                    ? "• Seviye atladıkça 6×6, 8×8 ve 10×10 düello modları açılır.\n• Belirli seviyelerde sürpriz ödül sandıkları kazanırsın.\n• Sıkıştığın anlarda Siber Radar jokeri kullan."
                    : selectedModeInfo === "vintage"
                    ? "• 20 özel nostaljik bulmaca bölümü içerir.\n• Kesişen harfler doğru kelimeleri bulmayı kolaylaştırır.\n• Günlük girişlerde ekstra ipucu hakkı kazanabilirsin."
                    : "• Hızlı kombolar süre bonusu kazandırır.\n• Sıkıştığında Siber Radar jokeri ile gizli rotaları aç."}
                </Text>
              </View>

              <Pressable
                onPress={() => setSelectedModeInfo(null)}
                style={({ pressed }) => ({
                  width: "100%",
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: selectedModeInfo === "arcade" ? "#FFD000" : selectedModeInfo === "vintage" ? "#FFC24A" : selectedModeInfo === "solo" ? "#38BDF8" : selectedModeInfo === "daily" ? "#A78BFA" : "#00F5D4",
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: "#0B071E", fontSize: 14, fontWeight: "900", letterSpacing: 0.8 }}>ANLADIM</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Dereceli Mod Onay Modalı */}
        <Modal
          visible={pendingMatchConfirm !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPendingMatchConfirm(null)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 24 }}
            onPress={() => setPendingMatchConfirm(null)}
          >
            <Pressable
              style={{
                width: "100%",
                maxWidth: 360,
                backgroundColor: "#130E26",
                borderRadius: 24,
                borderWidth: 2,
                borderColor: "#00F5D4",
                padding: 24,
                alignItems: "center",
                shadowColor: "#00F5D4",
                shadowOpacity: 0.35,
                shadowRadius: 20,
                elevation: 14,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              {/* İkon */}
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "rgba(0,245,212,0.12)",
                  borderWidth: 1.5,
                  borderColor: "#00F5D4",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontSize: 26 }}>⚔️</Text>
              </View>

              {/* Üst etiket */}
              <Text style={{ color: "#00F5D4", fontSize: 10, fontWeight: "900", letterSpacing: 2, marginBottom: 4 }}>
                DERECELİ DÜELLO
              </Text>

              {/* Mod adı */}
              <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "900", letterSpacing: 0.5, marginBottom: 16, textAlign: "center" }}>
                {pendingMatchConfirm?.modeTitle}
              </Text>

              {/* İstatistik satırları */}
              <View style={{ width: "100%", gap: 8, marginBottom: 20 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
                  <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "700" }}>⏱ SÜRE</Text>
                  <Text style={{ color: "#00F5D4", fontSize: 12, fontWeight: "900" }}>{pendingMatchConfirm?.durationText}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
                  <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "700" }}>🗺 ROTA</Text>
                  <Text style={{ color: "#A78BFA", fontSize: 12, fontWeight: "900" }}>{pendingMatchConfirm?.routesText}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
                  <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "700" }}>🏅 LP</Text>
                  <Text style={{ color: "#FFC24A", fontSize: 12, fontWeight: "900" }}>Galibiyet / Mağlubiyet</Text>
                </View>
              </View>

              {/* Butonlar */}
              <View style={{ width: "100%", gap: 10 }}>
                <Pressable
                  onPress={() => {
                    if (pendingMatchConfirm) {
                      const size = pendingMatchConfirm.size;
                      setPendingMatchConfirm(null);
                      startBotDuel(size);
                    }
                  }}
                  style={({ pressed }) => ({
                    width: "100%",
                    height: 50,
                    borderRadius: 14,
                    backgroundColor: "#00F5D4",
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: "#0B071E", fontSize: 15, fontWeight: "900", letterSpacing: 1 }}>⚔️ SAVAŞI BAŞLAT</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPendingMatchConfirm(null)}
                  style={({ pressed }) => ({
                    width: "100%",
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "700" }}>Vazgeç</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <TermsModal
          visible={showConsentModal}
          onAccept={async () => {
            await consentManager.acceptConsent();
            setShowConsentModal(false);
          }}
        />

        {/* Hoş Geldin Hediyesi Modal */}
        <Modal
          visible={showWelcomeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWelcomeModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "center", alignItems: "center", padding: 24 }}>
            <View style={{
              width: "100%", maxWidth: 360,
              backgroundColor: "#130E26",
              borderRadius: 28,
              borderWidth: 2,
              borderColor: "#00F5D4",
              padding: 28,
              shadowColor: "#00F5D4",
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 16,
            }}>
              {/* Başlık */}
              <Text style={{ fontSize: 26, textAlign: "center", marginBottom: 4 }}>🎁</Text>
              <Text style={{ color: "#00F5D4", fontSize: 18, fontWeight: "900", letterSpacing: 1.2, textAlign: "center", marginBottom: 4 }}>
                HOŞ GELDİN HEDİYESİ!
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 12, textAlign: "center", marginBottom: 20, lineHeight: 18 }}>
                Kelime Patlat dünyasına hoş geldin! Başlangıç hediyelerin hesabına tanımlandı.
              </Text>

              {/* Hediye kartları */}
              <View style={{ gap: 10, marginBottom: 22 }}>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 208, 0, 0.1)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255, 208, 0, 0.35)", padding: 14, gap: 14 }}>
                  <Text style={{ fontSize: 28 }}>🪙</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#FFD000", fontSize: 20, fontWeight: "900" }}>50</Text>
                    <Text style={{ color: "#E2E8F0", fontSize: 13, fontWeight: "700" }}>Siber Çip</Text>
                  </View>
                  <Text style={{ color: "#FFD000", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }}>BAŞLANGIÇ</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0, 245, 212, 0.08)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(0, 245, 212, 0.3)", padding: 14, gap: 14 }}>
                  <Text style={{ fontSize: 28 }}>👁️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#00F5D4", fontSize: 20, fontWeight: "900" }}>5</Text>
                    <Text style={{ color: "#E2E8F0", fontSize: 13, fontWeight: "700" }}>Radar İpucu Hakkı</Text>
                  </View>
                  <Text style={{ color: "#00F5D4", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }}>JOKER</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(154, 118, 237, 0.1)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(154, 118, 237, 0.35)", padding: 14, gap: 14 }}>
                  <Text style={{ fontSize: 28 }}>🛡️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#9A76ED", fontSize: 20, fontWeight: "900" }}>1</Text>
                    <Text style={{ color: "#E2E8F0", fontSize: 13, fontWeight: "700" }}>Seri Kalkanı</Text>
                  </View>
                  <Text style={{ color: "#9A76ED", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }}>KORUMA</Text>
                </View>
              </View>

              {/* Buton */}
              <Pressable
                disabled={isClaimingWelcomeReward}
                onPress={async () => {
                  if (isClaimingWelcomeReward) return;
                  setIsClaimingWelcomeReward(true);
                  haptics.success();

                  // 1. Modalı kapat
                  setShowWelcomeModal(false);

                  // 2. Atomik State Güncellemesi & Anında Senkronizasyon
                  let updatedNext: PlayerProgress | null = null;
                  setProgress((prev) => {
                    if (prev.welcomeRewardClaimed) return prev;
                    updatedNext = {
                      ...prev,
                      welcomeRewardClaimed: true,
                      coins: (prev.coins || 0) + 50,
                      streakShields: (prev.streakShields || 0) + 1,
                      radarChargesBonus: (prev.radarChargesBonus || 0) + 5,
                    };
                    return updatedNext;
                  });

                  // 3. Arka plan senkronizasyonu
                  try {
                    const openId = await AsyncStorage.getItem("kelime-patlat:player-id");
                    const key = openId ? `kelime-patlat:guide-seen:${openId}` : "kelime-patlat:guide-seen";
                    await AsyncStorage.setItem(key, "true");
                    await AsyncStorage.setItem("kelime-patlat:guide-seen", "true");
                    if (updatedNext) {
                      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(updatedNext));
                      await syncProgressToCloud(updatedNext);
                    }
                  } catch (e) {
                    console.warn("[WelcomeReward] Async save warning:", e);
                  } finally {
                    setIsClaimingWelcomeReward(false);
                    setTimeout(() => {
                      setShowGuide(true);
                    }, 250);
                  }
                }}
                style={({ pressed }) => ({
                  backgroundColor: "#00F5D4",
                  borderRadius: 18,
                  paddingVertical: 15,
                  alignItems: "center",
                  opacity: pressed || isClaimingWelcomeReward ? 0.7 : 1,
                  shadowColor: "#00F5D4",
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  elevation: 6,
                })}
              >
                <Text style={{ color: "#0B132B", fontSize: 14, fontWeight: "900", letterSpacing: 1 }}>HARİKA, BAŞLA! 🚀</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </MainShell>
    );
  }

  if (screen === "daily-lobby") {
    const dailyDone = progress.dailyCompletedId === daily.id;
    return (
      <MainShell active="home" onNavigate={(destination) => setScreen(destination)} missionsBadgeCount={unclaimedMissions} storeBadgeCount={hasClaimableDailyReward ? 1 : undefined} toast={globalToast} onDismissToast={() => setGlobalToast(null)}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                      setGlobalToast({
                        id: `daily-done-${Date.now()}`,
                        title: "GÜNLÜK ROTA KİLİTLİ",
                        subtitle: "Bugünkü sabit rotayı zaten tamamladın! Yarın yeni bir hak kazanacaksın.",
                        icon: "🔒",
                        accentColor: "#A78BFA",
                      });
                      return;
                    }
                    haptics.light();
                    setProgress((current) => ({ ...current, selectedTheme: pack.id }));
                  }}
                  style={({ pressed }) => [
                    styles.dailyThemeCard,
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
                setGlobalToast({
                  id: `daily-done-${Date.now()}`,
                  title: "GÜNLÜK ROTA KİLİTLİ",
                  subtitle: "Bugünkü sabit rotayı zaten tamamladın! Yarın yeni bir hak kazanacaksın.",
                  icon: "🔒",
                  accentColor: "#A78BFA",
                });
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
    return (
      <MainShell active="season" onNavigate={(destination) => setScreen(destination)} missionsBadgeCount={unclaimedMissions} storeBadgeCount={hasClaimableDailyReward ? 1 : undefined} toast={globalToast} onDismissToast={() => setGlobalToast(null)}>
        <StatusBar style="light" />
        <SeasonHub
          playerId={playerId}
          playerName={playerName}
          progress={progress}
          leaderboard={leaderboard}
          onBack={() => setScreen("home")}
          onChallengeFriend={(friendName, size) => {
            createRoom(size || 4);
            setNotice(`${friendName} ile ${size}×${size} düellosu için oda oluşturuldu! Davet kodunu paylaş.`);
          }}
          onUpdateFriends={(updatedFriends) => {
            setProgress((current) => ({
              ...current,
              friends: updatedFriends,
            }));
          }}
          onInspectUser={openUserProfile}
        />
        <UserProfileModal
          visible={inspectedUser !== null}
          user={inspectedUser}
          isSelf={inspectedUser ? (inspectedUser.id === playerId || (inspectedUser.username || inspectedUser.name).toLocaleLowerCase("tr-TR") === safeName.toLocaleLowerCase("tr-TR")) : false}
          isFriend={inspectedUser ? socialManager.getFriends().some((f) => f.username.toLocaleLowerCase("tr-TR") === (inspectedUser.username || inspectedUser.name).toLocaleLowerCase("tr-TR")) : false}
          onClose={() => setInspectedUser(null)}
          onAddFriend={(target) => {
            const res = socialManager.addFriend({
              id: target.id,
              name: target.name,
              username: target.username || target.name,
              avatar: target.avatar,
              avatarPhoto: target.avatarPhoto,
              selectedTitle: target.selectedTitle,
              level: target.level,
              tier: target.tier,
              lp: target.lp,
              wins: target.wins,
              matches: target.matches,
              streak: target.streak,
              bestScore: target.bestScore,
              bestTempo: target.bestTempo,
            });
            setGlobalToast({
              id: `friend-${Date.now()}`,
              title: res.success ? "ARKADAŞ EKLENDİ" : "BİLGİ",
              subtitle: res.message,
              icon: res.success ? "👥" : "ℹ️",
              accentColor: res.success ? "#00F5D4" : "#FFC24A",
            });
          }}
          onChallenge={(target) => {
            setInspectedUser(null);
            if (target.isBot) {
              startBotDuel(4);
            } else {
              createRoom(4);
              setNotice(`${target.name} ile 4×4 düellosu için oda oluşturuldu!`);
            }
          }}
        />
      </MainShell>
    );
  }

  if (screen === "league") {
    return (
      <MainShell active="season" onNavigate={(destination) => setScreen(destination)} missionsBadgeCount={unclaimedMissions} storeBadgeCount={hasClaimableDailyReward ? 1 : undefined} toast={globalToast} onDismissToast={() => setGlobalToast(null)}>
        <StatusBar style="light" />
        <LeagueHub playerId={playerId} progress={progress} leaderboard={leaderboard} onBack={() => setScreen("home")} />
      </MainShell>
    );
  }

  if (screen === "levels") {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} style={{ paddingHorizontal: 0, paddingTop: 0 }}>
        <StatusBar style="light" />
        <GlobalGameToast toast={globalToast} onDismiss={() => setGlobalToast(null)} />
        <SoloLevels
          unlockedLevel={soloUnlockedLevel}
          claimedMilestones={progress.claimedMilestones ?? {}}
          lives={livesCalc.lives}
          onOpenLivesModal={() => setShowLivesModal(true)}
          onBack={() => setScreen("home")}
          onSelect={openSoloLevel}
          onClaimMilestone={(milestone) => {
            haptics.success();
            claimMilestoneOnServer(milestone.level, (curr) => ({
              ...curr,
              coins: (curr.coins ?? 0) + milestone.coins,
              streakShields: (curr.streakShields ?? 1) + milestone.shields,
              xp: curr.xp + milestone.xp,
              claimedMilestones: {
                ...(curr.claimedMilestones ?? {}),
                [milestone.level]: true,
              },
            }));
            setGlobalToast({
              id: `milestone-${milestone.level}-${Date.now()}`,
              title: `SANDIK AÇILDI: ${milestone.title}`,
              subtitle: `+${milestone.coins} Çip, +${milestone.shields} Kalkan, +${milestone.xp} XP hesabına eklendi!`,
              icon: "🎁",
              accentColor: "#FFC24A",
              badge: `LVL ${milestone.level}`,
            });
          }}
        />
        <View style={{ position: "absolute", bottom: 8, left: 14, right: 14 }}>
          <PremiumDock active="home" onNavigate={(destination) => setScreen(destination)} missionsBadgeCount={unclaimedMissions} storeBadgeCount={hasClaimableDailyReward ? 1 : undefined} />
        </View>
      </ScreenContainer>
    );
  }

  if (screen === "solo") {
    return (
      <ScreenContainer style={{ paddingBottom: 16 }}>
        <StatusBar style="light" />
        <SoloChallenge
          key={`solo-${soloLevel}-${dailySession ? dailySession.id : "normal"}`}
          level={soloLevel}
          theme={dailySession ? dailySession.themeId : "general"}
          variationSeed={dailySession?.variation}
          daily={Boolean(dailySession)}
          excludeWords={recentSoloWords}
          radarChargesBonus={progress.radarChargesBonus || 0}
          lives={getCalculatedLives(progress).lives}
          onExit={() => {
            const destination = dailySession ? "home" : "levels";
            setDailySession(null);
            setScreen(destination);
          }}
          onComplete={dailySession ? completeDailyChallenge : completeSoloLevel}
          onNext={() => setScreen("levels")}
          onAdvanceLevel={() => {
            if (soloLevel < MAX_SOLO_LEVEL) {
              openSoloLevel(soloLevel + 1);
            } else {
              setScreen("levels");
            }
          }}
          onBonusReward={(xp, radar) => {
            setProgress((current) => ({
              ...current,
              xp: current.xp + xp,
              radarChargesBonus: (current.radarChargesBonus || 0) + radar,
            }));
          }}
        />
      </ScreenContainer>
    );
  }

  if (screen === "store") {
    return (
      <MainShell active="store" onNavigate={(destination) => setScreen(destination)} missionsBadgeCount={unclaimedMissions} storeBadgeCount={hasClaimableDailyReward ? 1 : undefined} toast={globalToast} onDismissToast={() => setGlobalToast(null)}>
        <StatusBar style="light" />
        <CyberStore
          coins={progress.coins ?? 0}
          progress={progress}
          onBuyCoins={(amount) => {
            setProgress((current) => {
              const next = { ...current, coins: (current.coins ?? 0) + amount };
              void syncProgressToCloud(next);
              return next;
            });
          }}
          onBuyRadar={() => {
            setProgress((current) => {
              const next = {
                ...current,
                xp: current.xp + 200,
                radarChargesBonus: (current.radarChargesBonus || 0) + 10,
              };
              void syncProgressToCloud(next);
              return next;
            });
          }}
          onSpendCoins={async (item) => {
            const currentCoins = progress.coins ?? 0;
            if (currentCoins < item.cost) {
              setGlobalToast({ id: `store-err-${Date.now()}`, title: "YETERSİZ ÇİP", subtitle: `${item.cost} çip gerekiyor.`, icon: "⚠️", accentColor: "#FF647C" });
              return;
            }
            if (item.rewardType === "lives") {
              const calc = getCalculatedLives(progress);
              if (calc.lives >= MAX_LIVES) {
                setGlobalToast({
                  id: `lives-full-${Date.now()}`,
                  title: "CANLARIN DOLU! 💚",
                  subtitle: "Tüm canların zaten tam kapasite dolu (5/5). Çiplerin korunuyor.",
                  icon: "💚",
                  accentColor: "#22C55E",
                });
                return;
              }
            }

            const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
            if (token && token !== "guest") {
              try {
                const res = await fetch(`${getApiBaseUrl()}/api/game/shop-buy`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ itemId: item.id }),
                });
                const data = await res.json();
                if (res.ok && data.progress) {
                  setProgress(data.progress);
                  setGlobalToast({ id: `item-bought-${Date.now()}`, title: "SATIN ALINDI!", subtitle: `${item.name} envanterinize eklendi.`, icon: item.icon, accentColor: "#00F5D4" });
                  return;
                }
              } catch {
                // Fallback to local
              }
            }

            // Local fallback (offline or guest)
            setProgress((current) => {
              const curCoins = current.coins ?? 0;
              if (curCoins < item.cost) return current;
              let next = { ...current, coins: curCoins - item.cost };
              if (item.rewardType === "lives") {
                next = { ...next, lives: MAX_LIVES, lastLifeRegenTimestamp: Date.now() };
              } else if (item.rewardType === "radar") {
                next = { ...next, radarChargesBonus: (current.radarChargesBonus || 0) + 5 };
              } else if (item.rewardType === "shield") {
                next = { ...next, streakShields: (current.streakShields || 0) + 1 };
              } else if (item.rewardType === "xp") {
                next = { ...next, xp: current.xp + 250 };
              }
              void syncProgressToCloud(next);
              return next;
            });
            setGlobalToast({ id: `item-bought-${Date.now()}`, title: "SATIN ALINDI!", subtitle: `${item.name} envanterinize eklendi.`, icon: item.icon, accentColor: "#00F5D4" });
          }}
          onSelectFrame={(selectedFrame) => {
            setProgress((current) => {
              const next = { ...current, selectedFrame };
              void syncProgressToCloud(next);
              return next;
            });
            setGlobalToast({ id: `frame-${Date.now()}`, title: "ÇERÇEVE KUŞANILDI", subtitle: "Profiler sinyalin güncellendi.", icon: "✨", accentColor: "#00F5D4" });
          }}
          onSelectVictoryEffect={(selectedVictoryEffect) => {
            setProgress((current) => {
              const next = { ...current, selectedVictoryEffect };
              void syncProgressToCloud(next);
              return next;
            });
            setGlobalToast({ id: `effect-${Date.now()}`, title: "ZAFER EFEKTİ SEÇİLDİ", subtitle: "Bitiriş kutlama efekti aktif.", icon: "💥", accentColor: "#A78BFA" });
          }}
          onSelectBoardSkin={(selectedBoardSkin) => {
            setProgress((current) => {
              const next = { ...current, selectedBoardSkin };
              void syncProgressToCloud(next);
              return next;
            });
            setGlobalToast({ id: `skin-${Date.now()}`, title: "TAHTA GÖRÜNÜMÜ DEĞİŞTİ", subtitle: "Matris arka planın güncellendi.", icon: "🎨", accentColor: "#FFC24A" });
          }}
          onBuyCosmetic={async (kind, id, cost) => {
            const currentCoins = progress.coins ?? 0;
            if (cost > 0 && currentCoins < cost) {
              setGlobalToast({ id: `store-${Date.now()}`, title: "YETERSİZ ÇİP", subtitle: `${cost} çip gerekiyor.`, icon: "⚠️", accentColor: "#FF647C" });
              return false;
            }

            const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
            if (token && token !== "guest" && cost > 0) {
              try {
                const res = await fetch(`${getApiBaseUrl()}/api/game/cosmetic-buy`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ kind, id }),
                });
                const data = await res.json();
                if (res.ok && data.progress) {
                  setProgress(data.progress);
                  setGlobalToast({ id: `buy-${Date.now()}`, title: "KOZMETİK KAZANILDI", subtitle: "Yeni ürün envanterine eklendi ve kuşatıldı!", icon: "🎉", accentColor: "#00F5D4" });
                  return true;
                }
              } catch {
                // Fallback to local
              }
            }

            setProgress((current) => {
              const curCoins = current.coins ?? 0;
              if (cost > 0 && curCoins < cost) return current;
              let next = { ...current, coins: Math.max(0, curCoins - cost) };
              if (kind === "avatar") next = { ...next, selectedAvatar: id as PlayerProgress["selectedAvatar"], purchasedAvatars: { ...(next.purchasedAvatars ?? {}), [id]: true } };
              else if (kind === "frame") next = { ...next, selectedFrame: id, ownedFrames: { ...(next.ownedFrames ?? {}), [id]: true } };
              else if (kind === "board") next = { ...next, selectedBoardSkin: id, ownedBoardSkins: { ...(next.ownedBoardSkins ?? {}), [id]: true } };
              else next = { ...next, selectedVictoryEffect: id, ownedVictoryEffects: { ...(next.ownedVictoryEffects ?? {}), [id]: true } };
              void syncProgressToCloud(next);
              return next;
            });
            setGlobalToast({ id: `buy-${Date.now()}`, title: "KOZMETİK KAZANILDI", subtitle: "Yeni ürün envanterine eklendi ve kuşatıldı!", icon: "🎉", accentColor: "#00F5D4" });
            return true;
          }}
          onBack={() => setScreen("home")}
        />
      </MainShell>
    );
  }

  if (screen === "arcade") {
    if (!arcadeStarted) {
      const bestScore = progress.bestArcadeScore || 0;
      return (
        <MainShell active="home" onNavigate={(destination) => { setArcadeStarted(false); setScreen(destination); }} missionsBadgeCount={unclaimedMissions} storeBadgeCount={hasClaimableDailyReward ? 1 : undefined} toast={globalToast} onDismissToast={() => setGlobalToast(null)}>
          <StatusBar style="light" />
          <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.subHeader}>
              <Pressable onPress={() => setScreen("home")} style={styles.backButton}>
                <Text style={styles.backText}>‹</Text>
              </Pressable>
              <View>
                <Text style={styles.subHeaderKicker}>ARCADE MODU</Text>
                <Text style={styles.subHeaderTitle}>ZAMANA KARŞI HÜCUM</Text>
              </View>
            </View>

            <View style={styles.arcadeHeroCard}>
              <View style={styles.arcadeHeroTop}>
                <View style={styles.arcadeIconCircle}>
                  <Text style={{ fontSize: 32 }}>⚡</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.arcadeHeroKicker}>EN YÜKSEK SKORUN</Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                    <Text style={styles.arcadeHeroScore}>{bestScore}</Text>
                    <Text style={styles.arcadeHeroUnit}>PUAN</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.arcadeHeroSub}>
                {bestScore >= 500
                  ? "🔥 Efsanevi Seviye! Skorunu daha da yukarı taşımaya hazır mısın?"
                  : bestScore >= 400
                  ? "⭐ Usta Seviyesi! 500 puana ulaşıp Matris Efsanesi unvanını kap!"
                  : "⏱️ Hızlı olan kazanır! Kelimeleri buldukça süren uzar, puanın katlanır."}
              </Text>
            </View>

            <View style={styles.arcadeInfoSection}>
              <Text style={styles.sectionLabel}>YARIŞMA KURALLARI VE DİNAMİKLER</Text>
              <View style={styles.arcadeRuleTile}>
                <Text style={styles.arcadeRuleIcon}>⏱️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.arcadeRuleTitle}>30 Saniyelik Hızlı Başlangıç</Text>
                  <Text style={styles.arcadeRuleDesc}>Zaman durmaksızın akar. Harfleri yatay ve dikey bağlayarak geçerli Türkçe kelimeler oluştur.</Text>
                </View>
              </View>
              <View style={styles.arcadeRuleTile}>
                <Text style={styles.arcadeRuleIcon}>⏳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.arcadeRuleTitle}>Zaman Bonusu</Text>
                  <Text style={styles.arcadeRuleDesc}>Bulduğun her kelime süreni +3 saniye, 5+ harfli uzun kelimeler ise +5 saniye uzatır.</Text>
                </View>
              </View>
              <View style={styles.arcadeRuleTile}>
                <Text style={styles.arcadeRuleIcon}>🏆</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.arcadeRuleTitle}>Kupa & Rozet Hedefleri</Text>
                  <Text style={styles.arcadeRuleDesc}>400 puanda Kuyruklu Yıldız avatarı, 500 puanda Matris Efsanesi unvanı açılır!</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => {
                haptics.light();
                gameSfx.tap();
                setArcadeStarted(true);
              }}
              style={({ pressed }) => [styles.arcadeStartButton, pressed && styles.pressed]}
            >
              <Text style={styles.arcadeStartButtonText}>⚡ ARCADE YARIŞINI BAŞLAT</Text>
              <Text style={styles.arcadeStartButtonIcon}>→</Text>
            </Pressable>
          </ScrollView>
        </MainShell>
      );
    }

    return (
      <ScreenContainer style={{ paddingBottom: 16 }}>
        <StatusBar style="light" />
        <GlobalGameToast toast={globalToast} onDismiss={() => setGlobalToast(null)} />
        <ArcadeChallenge
          onExit={() => setArcadeStarted(false)}
          onComplete={(score) => {
            void awardProgressOnServer({ kind: "arcade", score }, (current) => applyArcadeProgress(current, score));
          }}
        />
      </ScreenContainer>
    );
  }

  if (screen === "online") {
    return (
      <MainShell active="home" onNavigate={(destination) => setScreen(destination)} missionsBadgeCount={unclaimedMissions} storeBadgeCount={hasClaimableDailyReward ? 1 : undefined} toast={globalToast} onDismissToast={() => setGlobalToast(null)}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.subHeader}>
            <Pressable onPress={() => setScreen("home")} style={styles.backButton}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <View>
              <Text style={styles.subHeaderKicker}>CANLI ARENA</Text>
              <Text style={styles.subHeaderTitle}>DÜELLO VE EŞLEŞME</Text>
            </View>
          </View>
          
          <Text style={styles.modeIntro}>İsmini ve tahta boyutunu seç. İster anında botla antrenman yap, ister özel oda kurup arkadaşını davet et.</Text>
          
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
                      setGlobalToast({
                        id: `size-locked-${size}-${Date.now()}`,
                        title: `SEVİYE ${size === 6 ? 5 : size === 8 ? 8 : 10} GEREKLİ`,
                        subtitle: `${size}×${size} modu Seviye ${size === 6 ? 5 : size === 8 ? 8 : 10}'de açılır. Şu anki seviyen: ${currentLevel}.`,
                        icon: "🔒",
                        accentColor: "#FFC24A",
                      });
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
            <Text style={styles.primaryButtonText}>HIZLI SAVAŞI BAŞLAT</Text>
            <Text style={styles.primaryButtonArrow}>→</Text>
          </Pressable>

          <Pressable onPress={() => createRoom(selectedSize)} style={({ pressed }) => [styles.customRoomButton, pressed && styles.pressed]}>
            <Text style={styles.customRoomButtonText}>ÖZEL ODA KUR (ARKADAŞINI DAVET ET)</Text>
            <Text style={styles.customRoomButtonIcon}>＋</Text>
          </Pressable>

          <View style={styles.joinCard}>
            <Text style={styles.joinTitle}>DAVET KODUYLA ODAYA KATIL</Text>
            <View style={styles.joinRow}>
              <TextInput 
                value={roomCodeInput} 
                onChangeText={(val) => setRoomCodeInput(val.toUpperCase())} 
                maxLength={5} 
                autoCapitalize="characters" 
                placeholder="5 HANELİ KOD" 
                placeholderTextColor="#6F879A" 
                style={styles.codeInput} 
              />
              <Pressable onPress={joinRoom} style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}>
                <Text style={styles.joinButtonText}>ODAYA GİR</Text>
              </Pressable>
            </View>
          </View>
          
          <Text style={styles.notice}>{notice}</Text>
        </ScrollView>
      </MainShell>
    );
  }

  if (authLoading) {
    return (
      <ScreenContainer style={{ flex: 1, backgroundColor: "#0C091C", justifyContent: "center", alignItems: "center" }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#00F5D4" />
      </ScreenContainer>
    );
  }

  if (screen === "auth" || !authToken) {
    return (
      <AuthScreen
        onCancel={async () => {
          if (!authToken) {
            try {
              const response = await fetch(`${getApiBaseUrl()}/api/auth/guest`, { method: "POST" });
              const data = await response.json();
              if (response.ok && data.token && data.user?.openId) {
                const fallbackGuestName = `Misafir #${Math.floor(1000 + Math.random() * 9000)}`;
                const finalGuestName = data.user?.name || fallbackGuestName;
                setAuthToken(data.token);
                setPlayerId(data.user.openId);
                setPlayerName(finalGuestName);
                await AsyncStorage.setItem(SESSION_TOKEN_KEY, data.token);
                await AsyncStorage.setItem("kelime-patlat:player-id", data.user.openId);
                await AsyncStorage.setItem("kelime-patlat:player-name", finalGuestName);
                if (data.user.progress) setProgress(data.user.progress);
              } else {
                const fallbackGuestName = `Misafir #${Math.floor(1000 + Math.random() * 9000)}`;
                setAuthToken("guest");
                setPlayerName(fallbackGuestName);
                await AsyncStorage.setItem(SESSION_TOKEN_KEY, "guest");
                await AsyncStorage.setItem("kelime-patlat:player-name", fallbackGuestName);
              }
            } catch {
              const fallbackGuestName = `Misafir #${Math.floor(1000 + Math.random() * 9000)}`;
              setAuthToken("guest");
              setPlayerName(fallbackGuestName);
              await AsyncStorage.setItem(SESSION_TOKEN_KEY, "guest");
              await AsyncStorage.setItem("kelime-patlat:player-name", fallbackGuestName);
            }
          }
          setScreen("home");
        }}
        onSuccess={async (token, username, cloudProgress, openId, previousGuestToken) => {
          setAuthToken(token);
          setPlayerId(openId);
          setPlayerName(username);
          await AsyncStorage.setItem("kelime-patlat:player-id", openId);
          await AsyncStorage.setItem("kelime-patlat:player-name", username);
          
          const guestTokenToClaim = (previousGuestToken && previousGuestToken !== "guest" && previousGuestToken !== token)
            ? previousGuestToken
            : (authToken && authToken !== "guest" && authToken !== token ? authToken : null);

          if (guestTokenToClaim) {
            try {
              const transferResponse = await fetch(`${getApiBaseUrl()}/api/auth/claim-guest`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ guestToken: guestTokenToClaim }),
              });
              const transferData = await transferResponse.json();
              if (transferResponse.ok && transferData.progress) {
                setProgress(transferData.progress);
                await syncProgressToCloud(transferData.progress);
                setScreen("home");
                return;
              }
            } catch {
              // Fall back to the local/cloud merge below when transfer is unavailable.
            }
          }

          // Seamless guest to registered account progress merge (prefer cloud account balances when logging in)
          const mergedProgress = mergePlayerProgress(progress, cloudProgress, { preferRemoteBalances: true });

          setProgress(mergedProgress);
          await syncProgressToCloud(mergedProgress);
          setScreen("home");

          const key = openId ? `kelime-patlat:guide-seen:${openId}` : "kelime-patlat:guide-seen";
          const seen = await AsyncStorage.getItem(key);
          if (!seen && !mergedProgress.welcomeRewardClaimed) {
            setTimeout(() => {
              setShowWelcomeModal(true);
            }, 300);
          }
        }}
      />
    );
  }

  if (screen === "vintage") {
    return (
      <ScreenContainer style={{ flex: 1, backgroundColor: "#0C091C" }}>
        <StatusBar style="light" />
        <VintagePuzzle
          onBack={() => setScreen("home")}
          vintageProgress={progress.vintageProgress}
          lives={livesCalc.lives}
          onOpenLivesModal={() => setShowLivesModal(true)}
          onSaveProgress={(newProgress) => {
            setProgress((current) => {
              const updated = { ...current, vintageProgress: newProgress };
              void syncProgressToCloud(updated);
              return updated;
            });
          }}
          onRewardXp={(amount: number, level: number) => {
            void awardProgressOnServer(
              { kind: "vintage", score: amount, level },
              (current) => applyVintageProgress(current, level, amount)
            );
            setGlobalToast({
              id: `vintage-${Date.now()}`,
              title: "🗞️ SEVİYE TAMAMLANDI!",
              subtitle: `Nostaljik gazeteyi başarıyla tamamladın. +${amount} XP kazanıldı!`,
              icon: "🗞️",
              accentColor: "#FFC24A",
            });
          }}
        />
        {globalToast && <GlobalGameToast toast={globalToast} onDismiss={() => setGlobalToast(null)} />}
      </ScreenContainer>
    );
  }

  if (screen === "missions") {
    return (
      <MainShell active="missions" onNavigate={(destination) => setScreen(destination)} missionsBadgeCount={unclaimedMissions} storeBadgeCount={hasClaimableDailyReward ? 1 : undefined} toast={globalToast} onDismissToast={() => setGlobalToast(null)}>
        <StatusBar style="light" />
        <MissionsScreen
          progress={progress}
          onBack={() => setScreen("home")}
          onPlayDaily={() => setScreen("daily-lobby")}
          onClaimDaily={(missionId, xp, coins) => {
            void claimMissionOnServer("daily", missionId, (current) => ({
              ...current,
              xp: current.xp + xp,
              coins: (current.coins ?? 0) + coins,
              dailyClaimed: { ...(current.dailyClaimed || {}), [missionId]: true },
            }));
          }}
          onClaimWeekly={(missionId, xp, shield, coins) => {
            void claimMissionOnServer("weekly", missionId, (current) => ({
              ...current,
              xp: current.xp + xp,
              streakShields: (current.streakShields || 0) + (shield || 0),
              coins: (current.coins ?? 0) + (coins || 0),
              weeklyClaimed: { ...(current.weeklyClaimed || {}), [missionId]: true },
            }));
          }}
        />
      </MainShell>
    );
  }

  if (screen === "profile") {
    return (
      <MainShell active="profile" onNavigate={(destination) => setScreen(destination)} missionsBadgeCount={unclaimedMissions} storeBadgeCount={hasClaimableDailyReward ? 1 : undefined} toast={globalToast} onDismissToast={() => setGlobalToast(null)}>
        <StatusBar style="light" />
        <ProfileScreen
          playerName={safeName}
          onUpdatePlayerName={setPlayerName}
          progress={progress}
          onShowToast={(title, subtitle, icon, color) => {
            setGlobalToast({
              id: `toast-${Date.now()}`,
              title,
              subtitle,
              icon: icon || "ℹ️",
              accentColor: color || "#00F5D4",
            });
          }}
          onSelectAvatar={(selectedAvatar) => {
            setProgress((current) => {
              const next = { ...current, selectedAvatar };
              void syncProgressToCloud(next);
              return next;
            });
          }}
          onSelectTitle={(selectedTitle) => {
            setProgress((current) => {
              const next = { ...current, selectedTitle };
              void syncProgressToCloud(next);
              return next;
            });
            setGlobalToast({
              id: `title-${Date.now()}`,
              title: "UNVAN KUŞANILDI",
              subtitle: `"${selectedTitle}" unvanı profilinde ve maçlarda aktif edildi.`,
              icon: "🏷️",
              accentColor: "#00F5D4",
            });
          }}
          onSelectTheme={(selectedTheme) => {
            setProgress((current) => {
              const next = { ...current, selectedTheme };
              void syncProgressToCloud(next);
              return next;
            });
          }}
          onUpdateGender={(gender) => {
            setProgress((current) => {
              const next = { ...current, gender };
              void syncProgressToCloud(next);
              return next;
            });
          }}
          onUpdateAvatarPhoto={(avatarPhoto) => {
            setProgress((current) => {
              const next = { ...current, avatarPhoto };
              void syncProgressToCloud(next);
              return next;
            });
            setGlobalToast({
              id: `photo-${Date.now()}`,
              title: avatarPhoto ? "PROFİL FOTOĞRAFI GÜNCELLENDİ" : "GLİF AVATARINA GEÇİLDİ",
              subtitle: avatarPhoto ? "Yeni profil portreniz kuşanıldı." : "Klasik siber glif simgenize geri dönüldü.",
              icon: "📷",
              accentColor: "#00F5D4",
            });
          }}
          sfxOn={sfxOn}
          toggleSfx={toggleSfx}
          hapticsOn={hapticsOn}
          toggleHaptics={toggleHaptics}
          onBack={() => setScreen("home")}
          onLogout={async () => {
            haptics.error();
            setAuthToken(null);
            setPlayerId(`player-${Math.random().toString(36).slice(2, 10)}`);
            setPlayerName("OYUNCU");
            setProgress(DEFAULT_PROGRESS);
            setSoloUnlockedLevel(1);
            setShowGuide(false);
            setScreen("auth");
            await socialManager.reset().catch(() => undefined);
            await AsyncStorage.removeItem(SESSION_TOKEN_KEY).catch(() => undefined);
            await AsyncStorage.removeItem(PROGRESS_KEY).catch(() => undefined);
            await AsyncStorage.removeItem(SOLO_UNLOCK_KEY).catch(() => undefined);
            await AsyncStorage.removeItem("kelime-patlat:player-id").catch(() => undefined);
            await AsyncStorage.removeItem("kelime-patlat:player-name").catch(() => undefined);
          }}
          onDeleteAccount={async () => {
            haptics.error();
            if (authToken) {
              try {
                await fetch(`${getApiBaseUrl()}/api/auth/delete-account`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                  },
                });
              } catch (e) {
                console.warn("Delete account API failed", e);
              }
            }
            await socialManager.reset().catch(() => undefined);
            await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
            await AsyncStorage.removeItem(PROGRESS_KEY);
            await AsyncStorage.removeItem(SOLO_UNLOCK_KEY);
            await AsyncStorage.removeItem("kelime-patlat:player-id");
            await AsyncStorage.removeItem("kelime-patlat:player-name");
            await AsyncStorage.removeItem("kelime-patlat:guide-seen");
            setAuthToken(null);
            setPlayerId(`player-${Math.random().toString(36).slice(2, 10)}`);
            setPlayerName("OYUNCU");
            setProgress(DEFAULT_PROGRESS);
            setSoloUnlockedLevel(1);
            setShowGuide(false);
            setNotice("Hesabınız ve tüm verileriniz kalıcı olarak silindi.");
            setScreen("auth");
          }}
        />
      </MainShell>
    );
  }

  if (screen === "room" && room) {
    const bothPlayers = room.players.length === 2;
    return (
      <ScreenContainer style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.roomScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.navRow}><Pressable onPress={leaveRoom} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.navTitle}>{room.players.some((p) => p.isBot) ? "BOT DÜELLOSU" : "CANLI DÜELLO LOBİSİ"}</Text><View style={styles.navSpacer} /></View>
        <View style={styles.roomHero}>
          <Text style={styles.eyebrow}>DAVET KODU</Text>
          <Text style={styles.roomCode}>{room.code}</Text>
          <Text style={styles.roomHint}>Rakibin bu kodla odaya katılabilir.</Text>
          <Pressable onPress={shareRoomInvite} style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]}><Text style={styles.inviteButtonText}>DAVET BAĞLANTISINI PAYLAŞ</Text><Text style={styles.inviteButtonIcon}>↗</Text></Pressable>
        </View>
        <View style={styles.playerList}>
          {room.players.map((player, index) => (
            <PlayerRow
              key={player.id}
              player={player}
              isMe={player.id === playerId}
              accent={index === 0 ? "#2DD4BF" : "#FB7185"}
              onPress={player.id !== playerId ? () => {
                triggerHapticSelection();
                openUserProfile(player);
              } : undefined}
            />
          ))}
          {!bothPlayers && <View style={styles.waitPlayer}><View style={styles.waitAvatar}><Text style={styles.waitAvatarText}>?</Text></View><View><Text style={styles.waitTitle}>RAKİP BEKLENİYOR</Text><Text style={styles.waitSub}>Oda kodunu paylaş</Text></View></View>}
        </View>
        <View style={styles.ruleCard}><Text style={styles.ruleIcon}>✦</Text><View style={styles.ruleTextWrap}><Text style={styles.ruleTitle}>{room.size}×{room.size} TAHTA · {room.wordsTotal} KELİME</Text><Text style={styles.ruleCopy}>Aynı tahtadaki tüm kelimeleri bul. Sadece yatay ve dikey komşu harfleri bağla.</Text></View></View>
        <Pressable disabled={!bothPlayers || me?.ready} onPress={markReady} style={({ pressed }) => [styles.primaryButton, (!bothPlayers || me?.ready) && styles.disabledButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>{me?.ready ? "RAKİP HAZIRLANIYOR" : "HAZIRIM"}</Text><Text style={styles.primaryButtonArrow}>{me?.ready ? "…" : "✓"}</Text>
        </Pressable>
        <Text style={styles.notice}>{notice}</Text>
        </ScrollView>
        <UserProfileModal
          visible={inspectedUser !== null}
          user={inspectedUser}
          isSelf={inspectedUser ? (inspectedUser.id === playerId || (inspectedUser.username || inspectedUser.name).toLocaleLowerCase("tr-TR") === safeName.toLocaleLowerCase("tr-TR")) : false}
          isFriend={inspectedUser ? socialManager.getFriends().some((f) => f.username.toLocaleLowerCase("tr-TR") === (inspectedUser.username || inspectedUser.name).toLocaleLowerCase("tr-TR")) : false}
          onClose={() => setInspectedUser(null)}
          onAddFriend={(target) => {
            const res = socialManager.addFriend({
              id: target.id,
              name: target.name,
              username: target.username || target.name,
              avatar: target.avatar,
              avatarPhoto: target.avatarPhoto,
              selectedTitle: target.selectedTitle,
              level: target.level,
              tier: target.tier,
              lp: target.lp,
              wins: target.wins,
              matches: target.matches,
              streak: target.streak,
              bestScore: target.bestScore,
              bestTempo: target.bestTempo,
            });
            setGlobalToast({
              id: `friend-${Date.now()}`,
              title: res.success ? "ARKADAŞ EKLENDİ" : "BİLGİ",
              subtitle: res.message,
              icon: res.success ? "👥" : "ℹ️",
              accentColor: res.success ? "#00F5D4" : "#FFC24A",
            });
          }}
          onChallenge={(target) => {
            setInspectedUser(null);
            if (target.isBot) {
              startBotDuel(4);
            } else {
              createRoom(4);
              setNotice(`${target.name} ile 4×4 düellosu için oda oluşturuldu!`);
            }
          }}
        />
      </ScreenContainer>
    );
  }

  if (!room) return null;
  const selectionSet = new Set(selectedCells);
  const foundCellOwners = new Map<number, string>();
  const myFoundWords = room.foundWords.filter((entry) => entry.playerId === playerId);
  const foundCellColors = new Map<number, {
    bg: string;
    border: string;
    letterText: string;
    checkColor: string;
    glow: string;
    isMissed?: boolean;
  }>();

  // Her bulunan kelimeye ayrı bir canlı renk ata
  myFoundWords.forEach((entry, wordIndex) => {
    const palette = WORD_PALETTE[wordIndex % WORD_PALETTE.length]!;
    entry.path.forEach((cell) => {
      foundCellOwners.set(cell, entry.playerId);
      foundCellColors.set(cell, {
        bg: palette.bg,
        border: palette.border,
        letterText: palette.letterText,
        checkColor: palette.checkColor,
        glow: palette.glow,
        isMissed: false,
      });
    });
  });

  // Oyun bitince bulunamayan kelimelere de sıradaki farklı renkleri ata
  if (room.status === "finished" && room.missedWords) {
    room.missedWords.forEach((entry, missedIndex) => {
      const colorIndex = (myFoundWords.length + missedIndex) % WORD_PALETTE.length;
      const palette = WORD_PALETTE[colorIndex]!;
      entry.path.forEach((cell) => {
        if (!foundCellOwners.has(cell)) {
          foundCellOwners.set(cell, "missed");
          foundCellColors.set(cell, {
            bg: palette.bg,
            border: palette.border,
            letterText: palette.letterText,
            checkColor: palette.checkColor,
            glow: palette.glow,
            isMissed: true,
          });
        }
      });
    });
  }


  return (
    <ScreenContainer style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20 }}>
      <StatusBar style="light" />
      <ScrollView ref={gameScrollRef} contentContainerStyle={battleStyles.gameScroll} scrollEnabled={!isSelecting} showsVerticalScrollIndicator={false}>
      <View style={styles.gameHeader}><Pressable onPress={handleLiveGameExitPress} style={styles.exitButton}><Text style={styles.exitText}>×</Text></Pressable><View><Text style={styles.gameMode}>CANLI KELİME DÜELLOSU</Text><Text style={styles.gameCode}>ODA {room.code}</Text></View><View style={styles.liveChip}><View style={styles.liveDot} /><Text style={styles.liveText}>{room.status === "playing" ? "CANLI" : "SONUÇ"}</Text></View></View>
        {!isSocketConnected && room.status === "playing" && (
          <View style={{ marginTop: 6, marginBottom: 8, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "rgba(239, 68, 68, 0.25)", borderRadius: 8, borderWidth: 1, borderColor: "#EF4444", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="small" color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={{ color: "#FCA5A5", fontSize: 11, fontWeight: "900" }}>
              📡 Bağlantın kesildi, tekrar bağlanılıyor...
            </Text>
          </View>
        )}
        <View style={[battleStyles.statusRail, isFinalPush && battleStyles.statusRailFinal]}>
          <View><Text style={battleStyles.railLabel}>{isFinalPush ? "SON HAMLE" : "TUR SÜRESİ"}</Text><Text style={[battleStyles.timerValue, isFinalPush && battleStyles.timerValueFinal]}>{room.status === "playing" ? `00:${String(remainingSeconds).padStart(2, "0")}` : "00:00"}</Text></View>
          <View style={battleStyles.battleBadges}>{myMultiplier > 1 && <View style={battleStyles.multiplierBadge}><Text style={battleStyles.multiplierText}>×{myMultiplier} UZUN KELİME</Text></View>}{myWordCount >= 2 && <View style={battleStyles.streakBadge}><Text style={battleStyles.streakText}>{myWordCount} SERİ</Text></View>}</View>
        </View>
        <View style={styles.scoreRow}>
          <ScoreBadge
            name={me?.name ?? safeName}
            score={myScore}
            words={myWordCount}
            total={room.wordsTotal}
            active={!room.winnerId || iWon}
            won={iWon}
            accent="#2DD4BF"
            combo={room.combos?.[playerId]}
            avatar={me?.avatar || (progress.selectedAvatar ? String(progress.selectedAvatar) : "🎮")}
            avatarPhoto={me?.avatarPhoto || progress.avatarPhoto}
          />
          <View style={styles.vsMark}><Text style={styles.vsText}>VS</Text></View>
          <ScoreBadge
            name={opponent?.name ?? "RAKİP"}
            score={opponentScore}
            words={opponentWordCount}
            total={room.wordsTotal}
            active={!room.winnerId || !iWon}
            won={Boolean(room.winnerId && !iWon)}
            accent="#FB7185"
            combo={opponent ? room.combos?.[opponent.id] : undefined}
            avatar={opponent?.avatar || (opponent?.isBot ? "🤖" : "👤")}
            avatarPhoto={opponent?.avatarPhoto}
            onPress={opponent ? () => {
              triggerHapticSelection();
              openUserProfile(opponent);
            } : undefined}
          />
        </View>
        <View style={battleStyles.statsRow}><View style={battleStyles.statCell}><Text style={battleStyles.statLabel}>PUAN FARKI</Text><Text style={[battleStyles.statValue, scoreDifference > 0 && battleStyles.statValuePositive, scoreDifference < 0 && battleStyles.statValueNegative]}>{scoreLeadLabel}</Text></View><View style={battleStyles.statDivider} /><View style={battleStyles.statCell}><Text style={battleStyles.statLabel}>TEMPO</Text><Text style={battleStyles.statValue}>{myTempo} · {opponentTempo} K/DK</Text></View></View>
        <View style={styles.targetCard}>
          <Text style={styles.targetLabel}>{room.status === "finished" ? "TUR TAMAMLANDI" : "GİZLİ KELİMELERİ BUL"}</Text>
          <Text style={styles.targetWord}>{room.wordsTotal} KELİME</Text>
          {disconnectRemainingSeconds > 0 ? (
            <View style={{ marginTop: 6, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "rgba(239, 68, 68, 0.2)", borderRadius: 8, borderWidth: 1, borderColor: "#EF4444", alignItems: "center" }}>
              <Text style={{ color: "#EF4444", fontSize: 11, fontWeight: "900" }}>
                ⚠️ RAKİBİN BAĞLANTISI KOPTU ({disconnectRemainingSeconds}s)
              </Text>
              <Text style={{ color: "#FCA5A5", fontSize: 9, fontWeight: "800", marginTop: 2 }}>
                Geri dönmezse hükmen galip sayılacaksın.
              </Text>
            </View>
          ) : (
            <Text style={styles.targetTip}>{room.status === "playing" ? "Parmağını/mouse'u basılı tutarak yatay/dikey komşu harfleri bağla." : room.message}</Text>
          )}
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

        {inspectedPath && inspectedPath.slice(0, -1).map((cellIdx, i) => {
          const nextCellIdx = inspectedPath[i + 1]!;
          const start = getCellCenter(cellIdx);
          const end = getCellCenter(nextCellIdx);
          return (
            <ConnectLine
              key={`inspect-line-${i}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              color={inspectedColor || "#F59E0B"}
            />
          );
        })}

        {room.board.map((letter, index) => {
          const order = selectedCells.indexOf(index);
          const selected = selectionSet.has(index);
          const isTail = selectedCells.at(-1) === index;
          const foundBy = foundCellOwners.get(index);
          const isFound = foundBy !== undefined;
          const isInspected = Boolean(inspectedPath?.includes(index));
          const cellColor = foundCellColors.get(index);

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
            isInspected={isInspected}
            cellColor={cellColor}
          />;
        })}



        {particles.map(p => (
          <Animated.View key={p.id} style={{ position: 'absolute', left: p.x - 4, top: p.y - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: p.color, transform: p.anim.getTranslateTransform() }} />
        ))}

        {/* Absolute touch/pointer overlay to intercept gestures relative to board cleanly */}
        <View
          pointerEvents={room.status === "playing" && gameCountdown === null ? "auto" : "none"}
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
      {room.status === "playing" && (
        <View style={[styles.wordTray, selectionFeedback === "invalid" && styles.wordTrayInvalid, selectionFeedback === "accepted" && styles.wordTrayAccepted]}>
          <Text style={styles.wordLabel}>{selectionFeedback === "invalid" ? "GEÇERSİZ KELİME" : selectionFeedback === "accepted" ? "KELİME KABUL EDİLDİ" : selectedCells.length >= 2 ? "ROTA SEÇİLDİ · DOĞRULAMAK İÇİN GÖNDER" : "SEÇTİĞİN KELİME"}</Text>
          <Text style={[styles.drawnWord, !activeWord && styles.drawnWordEmpty]}>{activeWord || "HARFLERİ BİRLEŞTİR"}</Text>
          <Text style={styles.routeHint}>{selectionFeedback === "invalid" ? "Kırmızı rota birazdan temizlenecek." : selectedCells.length > 1 ? "Mavi önizleme · yeşil yalnız kabul edilince görünür." : "Yalnız yatay ve dikey ilerle"}</Text>
          <View style={styles.wordActions}>
            {selectedCells.length > 0 && <Pressable onPress={clearSelection} style={styles.clearWord}><Text style={styles.clearWordText}>TEMİZLE</Text></Pressable>}
            <Pressable disabled={selectedCells.length < 2 || Boolean(pendingWordRef.current)} onPress={() => submitSelection()} style={[styles.submitWord, (selectedCells.length < 2 || Boolean(pendingWordRef.current)) && styles.disabledButton]}>
              <Text style={styles.submitWordText}>GÖNDER</Text>
            </Pressable>
          </View>
        </View>
      )}
      <View style={styles.foundPanel}>
        <Text style={styles.foundLabel}>{room.status === "finished" ? "OYUNDAKİ TÜM KELİMELER (SÖZLÜK VE ROTA İÇİN DOKUN)" : "BULDUĞUN KELİMELER"}</Text>
        
        <View style={{ marginTop: 6 }}>
          <Text style={{ color: "#2DD4BF", fontSize: 10, fontWeight: "800", letterSpacing: 0.5, marginBottom: 4 }}>
            ✓ BULDUKLARIN ({myFoundWords.length} / {room.wordsTotal})
          </Text>
          <View style={styles.foundTags}>
            {myFoundWords.length ? (
              myFoundWords.map((entry, index) => {
                const palette = WORD_PALETTE[index % WORD_PALETTE.length]!;
                return (
                  <Pressable
                    key={`mine-${index}`}
                    onPress={() => {
                      haptics.light();
                      setInspectedColor(palette.border);
                      setInspectedPath(entry.path);
                      setSelectedWordInfo({ word: entry.word, definition: getWordDefinition(entry.word) });
                    }}
                    style={({ pressed }) => [
                      styles.foundTag,
                      {
                        backgroundColor: palette.tagBg,
                        borderColor: palette.tagBorder,
                        borderWidth: 1.5,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={[styles.foundTagText, { color: palette.tagText }]}>
                      ✓ {entry.word}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.foundEmpty}>Henüz kelime bulunmadı.</Text>
            )}
          </View>
        </View>

        {room.status === "finished" && room.missedWords && room.missedWords.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: "#FB7185", fontSize: 10, fontWeight: "800", letterSpacing: 0.5, marginBottom: 4 }}>
              ✗ BULAMADIĞIN KELİMELER ({room.missedWords.length})
            </Text>
            <View style={styles.foundTags}>
              {room.missedWords.map((entry, index) => {
                const colorIndex = (myFoundWords.length + index) % WORD_PALETTE.length;
                const palette = WORD_PALETTE[colorIndex]!;
                return (
                  <Pressable
                    key={`missed-${index}`}
                    onPress={() => {
                      haptics.light();
                      setInspectedColor(palette.border);
                      setInspectedPath(entry.path);
                      setSelectedWordInfo({ word: entry.word, definition: getWordDefinition(entry.word) });
                    }}
                    style={({ pressed }) => [
                      styles.foundTag,
                      {
                        backgroundColor: palette.tagBg,
                        borderColor: palette.tagBorder,
                        borderWidth: 1.5,
                        borderStyle: "dashed",
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={[styles.foundTagMissedText, { color: palette.tagText }]}>
                      ✗ {entry.word}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>


      {room.status === "finished" ? (
        <View style={styles.resultPanel}>
          <Text style={styles.resultTitle}>{isDraw ? "BERABERE BİTTİ!" : iWon ? "TUR SENİN!" : "TUR RAKİBİNİN"}</Text>
          <Text style={styles.resultCopy}>{isDraw ? "İki taraf da eşit puan topladı! Rövanşla kazananı belirle." : iWon ? "En yüksek puanı sen topladın." : "Rövanşta daha fazla kelime bul."}</Text>
          <Pressable onPress={() => setShowResultModal(true)} style={({ pressed }) => [styles.viewResultsButton, pressed && styles.pressed]}>
            <Text style={styles.viewResultsButtonText}>📊 SONUÇ VE DETAY KARTINI GÖR</Text>
          </Pressable>
          <Pressable onPress={requestRematch} style={({ pressed }) => [styles.primaryButton, styles.rematchButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>{me?.rematch ? "RAKİP BEKLENİYOR" : "↻ RÖVANŞ İSTE"}</Text>
            <Text style={styles.primaryButtonArrow}>↻</Text>
          </Pressable>
          <Pressable onPress={leaveRoom} style={({ pressed }) => [styles.returnHomeButton, pressed && styles.pressed]}>
            <Text style={styles.returnHomeButtonText}>🏠 ANA MENÜYE DÖN</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.notice}>{notice}</Text>
      )}
      </ScrollView>

      {selectedWordInfo && (
        <Modal visible transparent animationType="fade" onRequestClose={() => { setSelectedWordInfo(null); setInspectedPath(null); }}>
          <Pressable style={styles.modalOverlay} onPress={() => { setSelectedWordInfo(null); setInspectedPath(null); }}>
            <Pressable style={[styles.modalContent, { backgroundColor: "#1A1530", borderColor: "#2DD4BF" }]} onPress={(e) => e.stopPropagation()}>
              <Text style={[styles.modalTitle, { color: "#2DD4BF" }]}>{selectedWordInfo.word}</Text>
              <Text style={styles.modalBody}>{selectedWordInfo.definition}</Text>
              <Pressable onPress={() => { setSelectedWordInfo(null); setInspectedPath(null); }} style={({ pressed }) => [styles.modalCloseButton, { backgroundColor: "#2DD4BF" }, pressed && { opacity: 0.8 }]}>
                <Text style={styles.modalCloseText}>KAPAT</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}


      {/* Game Over / Match Result Modal */}
      {room.status === "finished" && showResultModal && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowResultModal(false)}>
          <Pressable style={[styles.modalOverlay, { flex: 1, width: "100%", height: "100%", paddingHorizontal: 14, paddingVertical: 20 }]} onPress={() => setShowResultModal(false)}>
            <Pressable
              style={{
                width: "100%",
                maxWidth: 440,
                height: "88%",
                maxHeight: 740,
                backgroundColor: "#130E26",
                borderRadius: 24,
                borderWidth: 2,
                borderColor: isDraw ? "#A78BFA" : iWon ? "#2DD4BF" : "#FB7185",
                overflow: "hidden",
                shadowColor: isDraw ? "#A78BFA" : iWon ? "#2DD4BF" : "#FB7185",
                shadowOpacity: 0.35,
                shadowRadius: 18,
                elevation: 16,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView
                style={{ flex: 1, width: "100%" }}
                contentContainerStyle={{ alignItems: "stretch", width: "100%", paddingHorizontal: 14, paddingTop: 16, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.resultModalHeader}>
                  <Text style={styles.resultModalIcon}>{isDraw ? "⚔️" : iWon ? "🏆" : "💔"}</Text>
                  <Text style={[styles.resultModalTitle, { color: isDraw ? "#A78BFA" : iWon ? "#2DD4BF" : "#FB7185" }]}>
                    {isDraw ? "BERABERE BİTTİ!" : iWon ? "TUR SENİN!" : "TUR RAKİBİNİN"}
                  </Text>
                  <Text style={styles.resultModalSub}>
                    {isDraw ? "İki taraf da eşit puan topladı! Rövanşla kazananı belirle." : iWon ? "Tebrikler! En yüksek puanı toplayarak turu kazandın." : "Rakip bu tur daha hızlı davrandı. Rövanşla puanları geri al!"}
                  </Text>
                </View>

                {/* Match Scoreboard Summary */}
                <View style={styles.resultScoreRow}>
                  <View style={[styles.resultScoreCol, iWon && styles.resultScoreWinner]}>
                    <Text style={styles.resultScorePlayerName}>{me?.name ?? safeName} (SEN)</Text>
                    <Text style={[styles.resultScoreNumber, { color: "#2DD4BF" }]}>{myScore}</Text>
                    <Text style={styles.resultScoreWords}>{myWordCount}/{room.wordsTotal} Kelime</Text>
                  </View>
                  <View style={styles.resultVsBox}><Text style={styles.resultVsText}>VS</Text></View>
                  <View style={[styles.resultScoreCol, (!isDraw && !iWon) && styles.resultScoreWinner]}>
                    <Text style={styles.resultScorePlayerName}>{opponent?.name ?? "RAKİP"}</Text>
                    <Text style={[styles.resultScoreNumber, { color: "#FB7185" }]}>{opponentScore}</Text>
                    <Text style={styles.resultScoreWords}>{opponentWordCount}/{room.wordsTotal} Kelime</Text>
                    {opponent && (
                      <View style={{ flexDirection: "row", gap: 6, marginTop: 6, justifyContent: "center" }}>
                        <Pressable
                          onPress={() => {
                            triggerHapticSelection();
                            openUserProfile(opponent);
                          }}
                          style={({ pressed }) => [
                            { backgroundColor: "rgba(124, 92, 246, 0.2)", borderColor: "#7C5CF6", borderWidth: 1, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 6 },
                            pressed && { opacity: 0.7 }
                          ]}
                        >
                          <Text style={{ color: "#C4B5FD", fontSize: 9, fontWeight: "900" }}>👤 PROFİL</Text>
                        </Pressable>
                        {!socialManager.getFriends().some((f) => f.username.toLocaleLowerCase("tr-TR") === opponent.name.toLocaleLowerCase("tr-TR")) && (
                          <Pressable
                            onPress={() => {
                              triggerHapticSuccess();
                              const res = socialManager.addFriend({
                                id: opponent.id,
                                name: opponent.name,
                                username: opponent.name,
                                avatar: opponent.avatar || (opponent.isBot ? "🤖" : "🎮"),
                                avatarPhoto: opponent.avatarPhoto,
                                selectedTitle: opponent.selectedTitle,
                                level: opponent.level,
                                tier: opponent.tier,
                                lp: opponent.lp,
                                wins: opponent.wins,
                                matches: opponent.matches,
                                streak: opponent.streak,
                                bestScore: opponent.bestScore,
                                bestTempo: opponent.bestTempo,
                              });
                              setGlobalToast({
                                id: `friend-${Date.now()}`,
                                title: res.success ? "ARKADAŞ EKLENDİ" : "BİLGİ",
                                subtitle: res.message,
                                icon: res.success ? "👥" : "ℹ️",
                                accentColor: res.success ? "#00F5D4" : "#FFC24A",
                              });
                            }}
                            style={({ pressed }) => [
                              { backgroundColor: "rgba(0, 245, 212, 0.2)", borderColor: "#00F5D4", borderWidth: 1, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 6 },
                              pressed && { opacity: 0.7 }
                            ]}
                          >
                            <Text style={{ color: "#00F5D4", fontSize: 9, fontWeight: "900" }}>➕ EKLE</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* 1. Ayrılmış Özel Kazanımlar & Lig Puanı Kartı */}
                <MatchRewardsCard
                  progress={progress}
                  xpEarned={matchXpEarned}
                  lpEarned={matchLpEarned}
                  coinsEarned={matchCoinsEarned}
                />

                {/* 2. Ayrılmış Rota ve Performans Analizi Kartı */}
                <MatchInsight
                  score={myScore}
                  opponentScore={opponentScore}
                  words={myWordCount}
                  opponentWords={opponentWordCount}
                  tempo={myTempo}
                  opponentTempo={opponentTempo}
                  bestScore={progress.bestScore}
                />

                {/* Action Buttons */}
                {!iWon && !isDraw && (
                  <Pressable
                    onPress={() => watchAd(() => {
                      haptics.success();
                      gameSfx.victory();
                      setGlobalToast({
                        id: `streak-save-${Date.now()}`,
                        title: "🛡️ SERİ KORUNDU!",
                        subtitle: "Reklam izlendi! Günlük seriniz mağlubiyetten etkilenmedi ve korundu.",
                        icon: "🔥",
                        accentColor: "#FFD000",
                      });
                    })}
                    style={({ pressed }) => [
                      {
                        width: "100%",
                        minHeight: 46,
                        borderRadius: 14,
                        backgroundColor: "rgba(255, 208, 0, 0.15)",
                        borderColor: "#FFD000",
                        borderWidth: 1.5,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 12,
                        marginTop: 10,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={{ color: "#FFD000", fontSize: 12, fontWeight: "900", letterSpacing: 0.5, textAlign: "center" }}>
                      🎬 REKLAM İZLE: GÜNLÜK SERİNİ KORU 🔥
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => {
                    requestRematch();
                  }}
                  style={({ pressed }) => [
                    {
                      width: "100%",
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: "#00F5D4",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 8,
                      shadowColor: "#00F5D4",
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      elevation: 4,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={{ color: "#0B071E", fontSize: 13, fontWeight: "900", letterSpacing: 0.8 }}>
                    {me?.rematch ? "RAKİP BEKLENİYOR..." : "↻ RÖVANŞ İSTE"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={leaveRoom}
                  style={({ pressed }) => [
                    {
                      width: "100%",
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.18)",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 8,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={{ color: "#E2E8F0", fontSize: 12, fontWeight: "900", letterSpacing: 0.6 }}>
                    🏠 ANA MENÜYE DÖN
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowResultModal(false)}
                  style={({ pressed }) => [
                    {
                      width: "100%",
                      paddingVertical: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 4,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={{ color: "#00F5D4", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }}>
                    🔍 TAHTAYI VE KELİMELERİ İNCELE
                  </Text>
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Düellodan Ayrılma Siber Modalı */}
      <Modal
        visible={showLeaveDuelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveDuelModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLeaveDuelModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: "#130E26", borderColor: "#FF007F", borderWidth: 2, width: "90%", maxWidth: 360, paddingVertical: 24, paddingHorizontal: 20, borderRadius: 28 }]} onPress={(e) => e.stopPropagation()}>
            <Text style={{ fontSize: 36, textAlign: "center", marginBottom: 6 }}>⚔️</Text>
            <Text style={{ color: "#FF007F", fontSize: 18, fontWeight: "900", letterSpacing: 1.2, textAlign: "center", marginBottom: 6 }}>
              DÜELLODAN AYRIL?
            </Text>
            <Text style={{ color: "#B5A9CD", fontSize: 12, textAlign: "center", marginBottom: 22, lineHeight: 18, fontWeight: "600" }}>
              Canlı düello henüz devam ediyor! Şimdi ayrılırsan maç mağlubiyet sayılabilir ve lig puanı kaybedebilirsin.
            </Text>

            <View style={{ gap: 10 }}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  setShowLeaveDuelModal(false);
                }}
                style={({ pressed }) => ({
                  backgroundColor: "#00F5D4",
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: "#00F5D4",
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 4,
                })}
              >
                <Text style={{ color: "#0B132B", fontSize: 13, fontWeight: "900", letterSpacing: 1 }}>⚔️ SAVAŞA DEVAM ET</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  haptics.error();
                  setShowLeaveDuelModal(false);
                  leaveRoom();
                }}
                style={({ pressed }) => ({
                  backgroundColor: "rgba(255, 0, 127, 0.12)",
                  borderWidth: 1.5,
                  borderColor: "rgba(255, 0, 127, 0.5)",
                  borderRadius: 16,
                  paddingVertical: 12,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: "#FF007F", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 }}>🏃‍♂️ MAÇI TERK ET VE AYRIL</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Oyun Modları Bilgi Modalı */}
      <Modal
        visible={selectedModeInfo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedModeInfo(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedModeInfo(null)}>
          <Pressable
            style={[
              styles.modalContent,
              {
                backgroundColor: "#130E26",
                borderColor: selectedModeInfo === "pvp" ? "#00F5D4" : selectedModeInfo === "daily" ? "#FFC24A" : selectedModeInfo === "vintage" ? "#A78BFA" : "#FF007F",
                borderWidth: 2,
                width: "90%",
                maxWidth: 370,
                paddingVertical: 24,
                paddingHorizontal: 22,
                borderRadius: 28,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: selectedModeInfo === "pvp" ? "rgba(0,245,212,0.12)" : selectedModeInfo === "daily" ? "rgba(255,194,74,0.12)" : selectedModeInfo === "vintage" ? "rgba(167,139,250,0.12)" : "rgba(255,0,127,0.12)",
                  borderWidth: 1.5,
                  borderColor: selectedModeInfo === "pvp" ? "#00F5D4" : selectedModeInfo === "daily" ? "#FFC24A" : selectedModeInfo === "vintage" ? "#A78BFA" : "#FF007F",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 26 }}>
                  {selectedModeInfo === "pvp" ? "⚔️" : selectedModeInfo === "daily" ? "🗓️" : selectedModeInfo === "vintage" ? "📜" : "⚡"}
                </Text>
              </View>

              <Text style={{ color: selectedModeInfo === "pvp" ? "#00F5D4" : selectedModeInfo === "daily" ? "#FFC24A" : selectedModeInfo === "vintage" ? "#A78BFA" : "#FF007F", fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 2 }}>
                {selectedModeInfo === "pvp" ? "ÇOK OYUNCULU SİBER MOD" : selectedModeInfo === "daily" ? "ETKİNLİK MODU" : selectedModeInfo === "vintage" ? "KLASİK MACERA MODU" : "TEMPO HÜCUM MODU"}
              </Text>
              <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "900", textAlign: "center" }}>
                {selectedModeInfo === "pvp" ? "Canlı Kelime Düellosu" : selectedModeInfo === "daily" ? "Günlük Sabit Tahta" : selectedModeInfo === "vintage" ? "Nostalji Bulmaca" : "Zamana Karşı Arcade"}
              </Text>
            </View>

            <Text style={{ color: "#B5A9CD", fontSize: 12, textAlign: "center", marginBottom: 16, lineHeight: 18 }}>
              {selectedModeInfo === "pvp"
                ? "Gerçek zamanlı olarak bir rakiple veya botla kapış! Süre dolmadan harita üzerindeki gizli kelimeleri bağlayarak en yüksek puanı topla. Kazanan lig puanı (LP) ve çip ödülü alır."
                : selectedModeInfo === "daily"
                ? "Her gün 24 saatte bir tüm oyuncular için özel olarak üretilen sabit gizli harita! Günün kelimelerini bul, rotanı tamamla ve seri kalkanı/çip ödüllerini topla."
                : selectedModeInfo === "vintage"
                ? "Gazete çengel bulmaca hissiyatlı klasik kelime yolu! Bölümleri sırayla tamamlayarak kilitli seviyeleri aç, zihnini tazele ve harita yolculuğunu tamamla."
                : "Zaman daralıyor! Hızlı kelimeler buldukça zamana ekstra saniyeler ekle, çarpanlarını katla ve son saniyeye kadar en yüksek skoru yapıp liderlik tablosunun zirvesine oyna."}
            </Text>

            <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 12, marginBottom: 18, gap: 4 }}>
              <Text style={{ color: "#E2E8F0", fontSize: 11, fontWeight: "800" }}>💡 STRATEJİ İPUÇLARI:</Text>
              <Text style={{ color: "#94A3B8", fontSize: 11, lineHeight: 16 }}>
                {selectedModeInfo === "pvp"
                  ? "• 5+ harfli uzun kelimeler ×2/×3 bonus puan verir.\n• Seri kelime patlatmak rakibe tempo üstünlüğü sağlar."
                  : selectedModeInfo === "daily"
                  ? "• Günde sadece 1 kez oynama hakkın vardır.\n• Seri Kalkanın varsa mağlubiyette günlük serin korunur."
                  : selectedModeInfo === "vintage"
                  ? "• Seviye ilerledikçe harita boyutları ve kelime çeşitliliği zorlaşır.\n• Takıldığın yerde joker ipuçlarını kullanabilirsin."
                  : "• Kombo serini bozmadan seri kelime patlat.\n• Çarpanlar aktifken uzun kelimeleri önce patlat."}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                haptics.light();
                setSelectedModeInfo(null);
              }}
              style={({ pressed }) => ({
                backgroundColor: selectedModeInfo === "pvp" ? "#00F5D4" : selectedModeInfo === "daily" ? "#FFC24A" : selectedModeInfo === "vintage" ? "#A78BFA" : "#FF007F",
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: "#0B132B", fontSize: 13, fontWeight: "900", letterSpacing: 1 }}>ANLADIM, BAŞLA! 🚀</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {gameCountdown !== null && (
        <View style={styles.countdownOverlay} pointerEvents="auto">
          <View style={styles.countdownCard}>
            <Text style={styles.countdownOverline}>DÜELLO BAŞLIYOR</Text>
            <Text style={styles.countdownText}>
              {gameCountdown === 0 ? "BAŞLA!" : gameCountdown}
            </Text>
            <Text style={styles.countdownHint}>Gizli kelimeleri ilk bulan kazanır!</Text>
          </View>
        </View>
      )}

      <UserProfileModal
        visible={inspectedUser !== null}
        user={inspectedUser}
        isSelf={inspectedUser ? (inspectedUser.id === playerId || (inspectedUser.username || inspectedUser.name).toLocaleLowerCase("tr-TR") === safeName.toLocaleLowerCase("tr-TR")) : false}
        isFriend={inspectedUser ? socialManager.getFriends().some((f) => f.username.toLocaleLowerCase("tr-TR") === (inspectedUser.username || inspectedUser.name).toLocaleLowerCase("tr-TR")) : false}
        onClose={() => setInspectedUser(null)}
        onAddFriend={(target) => {
          const res = socialManager.addFriend({
            id: target.id,
            name: target.name,
            username: target.username || target.name,
            avatar: target.avatar,
            avatarPhoto: target.avatarPhoto,
            selectedTitle: target.selectedTitle,
            level: target.level,
            tier: target.tier,
            lp: target.lp,
            wins: target.wins,
            matches: target.matches,
            streak: target.streak,
            bestScore: target.bestScore,
            bestTempo: target.bestTempo,
          });
          setGlobalToast({
            id: `friend-${Date.now()}`,
            title: res.success ? "ARKADAŞ EKLENDİ" : "BİLGİ",
            subtitle: res.message,
            icon: res.success ? "👥" : "ℹ️",
            accentColor: res.success ? "#00F5D4" : "#FFC24A",
          });
        }}
        onChallenge={(target) => {
          setInspectedUser(null);
          if (target.isBot) {
            startBotDuel(4);
          } else {
            createRoom(4);
            setNotice(`${target.name} ile 4×4 düellosu için oda oluşturuldu!`);
          }
        }}
      />

      <LivesModal
        visible={showLivesModal}
        progress={progress}
        onClose={() => setShowLivesModal(false)}
        onBuyOne={handleBuyOneLife}
        onRefillAll={handleRefillAllLives}
        onWatchAd={handleWatchAdForLife}
        loading={buyingLivesLoading}
      />
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
  isInspected,
  cellColor,
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
  isInspected?: boolean;
  cellColor?: {
    bg: string;
    border: string;
    letterText: string;
    checkColor: string;
    glow: string;
    isMissed?: boolean;
  };
}) => {
  const isMissed = foundBy === "missed";
  const isFoundByMe = !isMissed && foundBy === playerId;
  const isFoundByOpponent = !isMissed && Boolean(foundBy && foundBy !== playerId);
  return (
    <View
      pointerEvents="none"
      style={[
        styles.cellWrap,
        {
          width: `${100 / size}%`,
          height: `${100 / size}%`,
          padding: size === 10 ? 1.5 : size === 8 ? 2 : size === 6 ? 3 : 4,
        },
      ]}
    >
      <View style={[
        styles.cell,
        isFound && !isMissed && styles.cellFound,
        isFoundByMe && styles.cellFoundMine,
        isFoundByOpponent && styles.cellFoundOpponent,
        isMissed && styles.cellMissed,
        cellColor && {
          backgroundColor: cellColor.bg,
          borderColor: cellColor.border,
          borderWidth: cellColor.isMissed ? 1.5 : 2,
          shadowColor: cellColor.glow,
          shadowOpacity: 0.45,
          shadowRadius: 6,
          elevation: 4,
        },
        isInspected && styles.cellInspected,
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
          size === 10 && styles.cellLetterExtraSmall,
          cellColor && { color: cellColor.letterText },
          isMissed && !cellColor && styles.cellLetterMissed,
          isInspected && styles.cellLetterInspected,
        ]}>{letter}</Text>
        {selected && (
          <Text
            selectable={false}
            style={[
              styles.cellOrder,
              size >= 8 && { fontSize: 7, top: 1, right: 2 },
            ]}
          >
            {order + 1}
          </Text>
        )}
        {isBotSelected && !selected && (
          <Text
            selectable={false}
            style={[
              battleStyles.cellOrderBot,
              size >= 8 && { fontSize: 7, top: 1, right: 2 },
            ]}
          >
            {botOrder! + 1}
          </Text>
        )}
        {isFound && !selected && !isMissed && (
          <Text
            selectable={false}
            style={[
              styles.cellCheck,
              cellColor ? { color: cellColor.checkColor } : (isFoundByOpponent && styles.cellCheckOpponent),
              size >= 8 && { fontSize: 7, left: 2, bottom: 1 },
            ]}
          >
            {isFoundByMe ? "✓" : "•"}
          </Text>
        )}
        {isMissed && !selected && (
          <Text
            selectable={false}
            style={[
              styles.cellCheckMissed,
              cellColor && { color: cellColor.border },
              size >= 8 && { fontSize: 7, left: 2, bottom: 1 },
            ]}
          >
            ✗
          </Text>
        )}
      </View>
    </View>
  );
});




function PlayerRow({ player, isMe, accent, onPress }: { player: { name: string; connected: boolean; ready: boolean; isBot?: boolean }; isMe: boolean; accent: string; onPress?: () => void }) {
  const rowContent = (
    <View style={styles.playerRow}>
      <View style={[styles.playerAvatar, { borderColor: accent }]}>
        <Text style={styles.playerAvatarText}>{player.isBot ? "BOT" : initials(player.name)}</Text>
      </View>
      <View style={styles.playerInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={styles.playerName}>{player.name}{isMe ? "  (SEN)" : ""}</Text>
          {onPress && <Text style={{ fontSize: 9, opacity: 0.8 }}>👤</Text>}
        </View>
        <Text style={styles.playerState}>{player.isBot ? "YAPAY RAKİP HAZIR" : player.connected ? (player.ready ? "HAZIR" : "TAHTAYI İNCELİYOR") : "BAĞLANTI YENİLENİYOR"}</Text>
      </View>
      <View style={[styles.readyDot, { backgroundColor: player.ready ? "#A3E635" : "#466279" }]} />
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {rowContent}
      </Pressable>
    );
  }

  return rowContent;
}

function ScoreBadge({
  name,
  score,
  words,
  total,
  active,
  won,
  accent,
  combo,
  avatar,
  avatarPhoto,
  onPress,
}: {
  name: string;
  score: number;
  words: number;
  total: number;
  active: boolean;
  won: boolean;
  accent: string;
  combo?: number;
  avatar?: string;
  avatarPhoto?: string;
  onPress?: () => void;
}) {
  const activeAvatarObj = AVATARS.find((a) => a.id === avatar);
  const displayIcon = activeAvatarObj ? activeAvatarObj.icon : (avatar && avatar.length <= 3 ? avatar : (name.toLocaleLowerCase("tr-TR").includes("bot") ? "🤖" : "👤"));
  const avatarBorderColor = activeAvatarObj ? activeAvatarObj.color : accent;
  const avatarBgColor = activeAvatarObj ? activeAvatarObj.surface : `${accent}25`;
  const [imgError, setImgError] = useState(false);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [{ flex: 1 }, onPress && pressed && styles.pressed]}
    >
      <View style={[styles.scoreBadge, { width: "100%", height: 88 }, won && { borderColor: accent, shadowColor: accent, shadowOpacity: 0.4, shadowRadius: 8 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginBottom: 4 }}>
          {/* Profil Fotoğrafı / Avatar Dairesi */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: avatarBgColor,
              borderWidth: 1.5,
              borderColor: avatarBorderColor,
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {avatarPhoto && !imgError ? (
              <Image source={{ uri: avatarPhoto }} style={{ width: "100%", height: "100%", borderRadius: 18, resizeMode: "cover" }} onError={() => setImgError(true)} />
            ) : (
              <Text style={{ fontSize: 17, color: activeAvatarObj ? activeAvatarObj.color : "#FFF", fontWeight: "900" }}>{displayIcon}</Text>
            )}
          </View>

          <View style={{ justifyContent: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text numberOfLines={1} style={[styles.scoreName, { flexShrink: 1 }]}>{name}</Text>
              {combo && combo >= 2 ? <Text style={{ fontSize: 9, fontWeight: "900", color: "#FF9B62" }}>🔥x{combo}</Text> : null}
            </View>
            <Text style={[styles.scoreStatus, won && { color: accent }]}>{words} / {total} KELİME</Text>
          </View>
        </View>

        <Text style={[styles.scoreValue, active && { color: accent }, { textAlign: "center", marginTop: 0 }]}>{score}</Text>
      </View>
    </Pressable>
  );
}

const RANK_IMAGES: Record<string, any> = {
  DEMİR: require("./assets/ranks/iron.jpg"),
  BRONZ: require("./assets/ranks/bronze.jpg"),
  GÜMÜŞ: require("./assets/ranks/silver.jpg"),
  ALTIN: require("./assets/ranks/gold.jpg"),
  PLATİN: require("./assets/ranks/platinum.jpg"),
  ELMAS: require("./assets/ranks/diamond.jpg"),
  YÜCELİK: require("./assets/ranks/ascendant.jpg"),
  ÖLÜMSÜZLÜK: require("./assets/ranks/immortal.jpg"),
  RADIAN: require("./assets/ranks/radian.jpg"),
};

function SeasonResetModal({ data, onClose }: { data: { newSeasonId: string; previousRank: string; previousLp: number; newLp: number }; onClose: () => void }) {
  const prevTier = getLeagueTier(data.previousLp);
  const newTier = getLeagueTier(data.newLp);

  const prevImg = RANK_IMAGES[prevTier.tier];
  const newImg = RANK_IMAGES[newTier.tier];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: "#130D2B", borderColor: "#7C3AED", borderWidth: 2, width: "90%", maxWidth: 390, paddingVertical: 24, paddingHorizontal: 20, borderRadius: 28 }]}>
          {/* Header Trophy Circle */}
          <View style={{ width: 72, height: 72, borderRadius: 26, backgroundColor: "rgba(255, 194, 74, 0.14)", borderWidth: 2, borderColor: "#FFC24A", alignItems: "center", justifyContent: "center", marginBottom: 14, shadowColor: "#FFC24A", shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 }}>
            <Text style={{ fontSize: 36 }}>🏆</Text>
          </View>

          <View style={{ backgroundColor: "rgba(255, 194, 74, 0.12)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255, 194, 74, 0.3)", marginBottom: 8 }}>
            <Text style={{ color: "#FFC24A", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 }}>SEZON {data.newSeasonId}</Text>
          </View>
          
          <Text style={{ color: "#FFFFFF", textAlign: "center", fontSize: 22, fontWeight: "900", letterSpacing: 0.5, marginBottom: 18 }}>YENİ SEZON BAŞLADI!</Text>

          {/* Rank comparison cards */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, width: "100%", marginBottom: 20 }}>
            {/* Previous season */}
            <View style={{ flex: 1, backgroundColor: "rgba(23, 17, 48, 0.95)", borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8, alignItems: "center", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.16)" }}>
              <Text style={{ color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginBottom: 6 }}>ÖNCEKİ SEZON</Text>
              <View style={{ width: 52, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: prevTier.color, backgroundColor: "rgba(255, 255, 255, 0.06)", alignItems: "center", justifyContent: "center", marginBottom: 8, overflow: "hidden" }}>
                {prevImg ? (
                  <Image source={prevImg} style={{ width: 52, height: 52, borderRadius: 14 }} resizeMode="cover" />
                ) : (
                  <Text style={{ color: prevTier.color, fontSize: 20, fontWeight: "900" }}>{prevTier.icon}</Text>
                )}
              </View>
              <Text style={{ color: prevTier.color, fontSize: 13, fontWeight: "900", letterSpacing: 0.5 }}>{data.previousRank}</Text>
              <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "800", marginTop: 2 }}>{data.previousLp} LP</Text>
            </View>

            {/* Arrow icon */}
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(124, 58, 237, 0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#7C3AED" }}>
              <Text style={{ color: "#A78BFA", fontSize: 13, fontWeight: "900" }}>➔</Text>
            </View>

            {/* New season */}
            <View style={{ flex: 1, backgroundColor: "rgba(6, 182, 212, 0.14)", borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8, alignItems: "center", borderWidth: 2, borderColor: "#00F5D4", shadowColor: "#00F5D4", shadowOpacity: 0.2, shadowRadius: 8 }}>
              <Text style={{ color: "#00F5D4", fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginBottom: 6 }}>YENİ DERECE</Text>
              <View style={{ width: 52, height: 52, borderRadius: 16, borderWidth: 2, borderColor: newTier.color, backgroundColor: "rgba(0, 245, 212, 0.15)", alignItems: "center", justifyContent: "center", marginBottom: 8, overflow: "hidden" }}>
                {newImg ? (
                  <Image source={newImg} style={{ width: 52, height: 52, borderRadius: 14 }} resizeMode="cover" />
                ) : (
                  <Text style={{ color: newTier.color, fontSize: 20, fontWeight: "900" }}>{newTier.icon}</Text>
                )}
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900", letterSpacing: 0.5 }}>{newTier.tier}</Text>
              <Text style={{ color: "#00F5D4", fontSize: 10, fontWeight: "900", marginTop: 2 }}>{data.newLp} LP</Text>
            </View>
          </View>

          <Text style={{ color: "#CBD5E1", fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 22, paddingHorizontal: 4 }}>
            Kademeli lig puanı sıfırlaması uygulandı. Yeni sezonda liderlik sıralamasında zirveye tırmanmak için hemen yarışmaya katıl!
          </Text>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [{
              alignSelf: "stretch",
              height: 52,
              borderRadius: 18,
              backgroundColor: "#00F5D4",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#00F5D4",
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 6,
              opacity: pressed ? 0.85 : 1,
            } as any]}
          >
            <Text style={{ color: "#0B132B", fontSize: 14, fontWeight: "900", letterSpacing: 1 }}>YENİ SEZONA BAŞLA 🚀</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function MainShell({
  active,
  children,
  onNavigate,
  showGuide,
  onCloseGuide,
  missionsBadgeCount,
  storeBadgeCount,
  toast,
  onDismissToast,
  seasonResetModal,
  onCloseSeasonResetModal,
}: {
  active: DockDestination;
  children: React.ReactNode;
  onNavigate: (destination: DockDestination) => void;
  showGuide?: boolean;
  onCloseGuide?: () => void;
  missionsBadgeCount?: number;
  storeBadgeCount?: number;
  toast?: ToastData | null;
  onDismissToast?: () => void;
  seasonResetModal?: { newSeasonId: string; previousRank: string; previousLp: number; newLp: number } | null;
  onCloseSeasonResetModal?: () => void;
}) {
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} style={{ paddingHorizontal: 14, paddingTop: 6 }}>
      {toast && onDismissToast && (
        <GlobalGameToast toast={toast} onDismiss={onDismissToast} />
      )}
      <View style={styles.shell}>
        {children}
        <View style={styles.fixedDock}>
          <PremiumDock active={active} onNavigate={onNavigate} missionsBadgeCount={missionsBadgeCount} storeBadgeCount={storeBadgeCount} />
        </View>
      </View>
      {showGuide !== undefined && onCloseGuide && (
        <OnboardingGuide visible={showGuide} onClose={onCloseGuide} />
      )}
      {seasonResetModal && onCloseSeasonResetModal && (
        <SeasonResetModal data={seasonResetModal} onClose={onCloseSeasonResetModal} />
      )}
    </ScreenContainer>
  );
}

const battleStyles = StyleSheet.create({
  gameScroll: { flexGrow: 1, paddingBottom: 50 },
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
  shell: { flex: 1, userSelect: "none", touchAction: "none" } as any,
  fixedDock: { position: "absolute", left: 0, right: 0, bottom: 8 },
  homeScroll: { paddingBottom: 132, flexGrow: 1 },
  subHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  subHeaderKicker: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  subHeaderTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", marginTop: 2, letterSpacing: 0.5 },
  modeIntro: { color: "#CBD5E1", fontSize: 13, lineHeight: 19, marginTop: 23, marginBottom: 14 },
  nameCard: { backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)", padding: 14, borderRadius: 20 },
  inputLabel: { color: "#94A3B8", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  nameInput: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", paddingVertical: 6, letterSpacing: 1.3 },
  sectionLabel: { color: "#94A3B8", fontSize: 10, fontWeight: "800", letterSpacing: 1.1, marginTop: 22, marginBottom: 9 },
  sizeRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  sizeCard: { width: "48%", backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)", borderRadius: 20, padding: 14 },
  dailyThemeCard: { width: "100%", backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)", borderRadius: 20, padding: 14 },
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
  customRoomButton: { marginTop: 12, height: 52, backgroundColor: "rgba(124, 58, 237, 0.2)", borderWidth: 1.5, borderColor: "#8B5CF6", borderRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  customRoomButtonText: { color: "#DDD6FE", fontSize: 13, fontWeight: "900", letterSpacing: 0.8 },
  customRoomButtonIcon: { color: "#DDD6FE", fontSize: 20, fontWeight: "900" },
  returnHomeButton: { marginTop: 10, height: 48, alignSelf: "stretch", backgroundColor: "rgba(255, 255, 255, 0.08)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.2)", borderRadius: 18, alignItems: "center", justifyContent: "center" },
  returnHomeButtonText: { color: "#E2E8F0", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
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
  scoreBadge: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)", borderRadius: 20, alignItems: "center", justifyContent: "center", paddingVertical: 10, paddingHorizontal: 8 },
  scoreName: { color: "#E2E8F0", maxWidth: 105, fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },
  scoreValue: { color: "#FFFFFF", fontSize: 26, lineHeight: 28, fontWeight: "900", marginTop: 2 },
  scoreStatus: { color: "#94A3B8", fontSize: 9.5, fontWeight: "800", letterSpacing: 0.6, marginTop: 1 },
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
  cellFoundOpponent: { backgroundColor: "rgba(244, 63, 94, 0.35)", borderColor: "#FB7185", shadowColor: "#FB7185", shadowOpacity: 0.45, shadowRadius: 6, elevation: 4 },
  cellCheck: { position: "absolute", left: 4, bottom: 2, color: "#D1FAE5", fontSize: 9, fontWeight: "900" },
  cellCheckOpponent: { color: "#FDA4AF" },
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
  cellMissed: { backgroundColor: "rgba(239, 68, 68, 0.22)", borderColor: "#EF4444", borderWidth: 1.5, shadowColor: "#EF4444", shadowOpacity: 0.45, shadowRadius: 6, elevation: 3 },
  cellLetterMissed: { color: "#FCA5A5" },
  cellInspected: { borderColor: "#F59E0B", borderWidth: 2.5, backgroundColor: "rgba(245, 158, 11, 0.3)", transform: [{ scale: 1.06 }], shadowColor: "#F59E0B", shadowOpacity: 0.7, shadowRadius: 8, elevation: 6 },
  cellLetterInspected: { color: "#FEF08A" },
  cellCheckMissed: { position: "absolute", left: 4, bottom: 2, color: "#EF4444", fontSize: 10, fontWeight: "900" },
  foundPanel: { marginTop: 9, borderRadius: 16, backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)", padding: 12 },
  foundLabel: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  foundTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  foundTag: { backgroundColor: "#334155", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  foundTagMine: { backgroundColor: "#065F46", borderWidth: 1, borderColor: "#10B981" },
  foundTagOpponent: { backgroundColor: "rgba(244, 63, 94, 0.2)", borderWidth: 1, borderColor: "rgba(244, 63, 94, 0.4)" },
  foundTagOpponentText: { color: "#FDA4AF" },
  foundTagMissed: { backgroundColor: "rgba(239, 68, 68, 0.16)", borderWidth: 1.5, borderColor: "#EF4444" },
  foundTagMissedText: { color: "#FCA5A5", fontSize: 11, fontWeight: "900" },
  foundTagText: { color: "#F1F5F9", fontSize: 11, fontWeight: "900" },
  foundEmpty: { color: "#64748B", fontSize: 11 },


  resultPanel: { alignItems: "center", marginTop: 10 },
  resultTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", letterSpacing: 0.2 },
  resultCopy: { color: "#CBD5E1", fontSize: 12, marginTop: 3 },
  viewResultsButton: { marginTop: 10, marginBottom: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "rgba(0, 245, 212, 0.15)", borderWidth: 1.5, borderColor: "#00F5D4", alignItems: "center", alignSelf: "stretch" },
  viewResultsButtonText: { color: "#00F5D4", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  resultModalCard: { width: "94%", maxWidth: 400, maxHeight: "92%", paddingHorizontal: 14, paddingVertical: 14, borderRadius: 24, borderWidth: 2, backgroundColor: "#130E26", alignItems: "center" },
  resultModalHeader: { alignItems: "center", marginBottom: 6 },
  resultModalIcon: { fontSize: 30, marginBottom: 2 },
  resultModalTitle: { fontSize: 18, fontWeight: "900", letterSpacing: 0.4 },
  resultModalSub: { color: "#CBD5E1", fontSize: 11, textAlign: "center", marginTop: 2, lineHeight: 15 },
  resultScoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginVertical: 6, backgroundColor: "rgba(26, 21, 51, 0.8)", borderRadius: 14, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: "rgba(124, 92, 246, 0.2)" },
  resultScoreCol: { flex: 1, alignItems: "center" },
  resultScoreWinner: { transform: [{ scale: 1.04 }] },
  resultScorePlayerName: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  resultScoreNumber: { fontSize: 22, fontWeight: "900", marginVertical: 1 },
  resultScoreWords: { color: "#E2E8F0", fontSize: 9, fontWeight: "800" },
  resultVsBox: { paddingHorizontal: 6 },
  resultVsText: { color: "#64748B", fontSize: 11, fontWeight: "900" },
  inspectBoardButton: { marginTop: 6, paddingVertical: 8, alignItems: "center", justifyContent: "center", width: "100%" },
  inspectBoardButtonText: { color: "#00F5D4", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  rematchButton: { alignSelf: "stretch", marginTop: 8, height: 46 },
  roomScroll: { flexGrow: 1, paddingBottom: 8 },
  eyebrow: { color: "#06B6D4", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", zIndex: 100 },
  modalContent: { width: "92%", maxWidth: 420, maxHeight: "90%", borderRadius: 24, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 18, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 20, elevation: 12 },
  modalTitle: { fontSize: 22, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 },
  modalBody: { color: "#FFFFFF", fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20, fontWeight: "600" },
  modalCloseButton: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, shadowOpacity: 0.4, shadowRadius: 5, elevation: 4 },
  modalCloseText: { color: "#0B132B", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },

  // Arcade Lobby Styles
  arcadeHeroCard: { backgroundColor: "rgba(33, 26, 61, 0.7)", borderRadius: 24, borderWidth: 1.5, borderColor: "#FFD000", padding: 20, marginTop: 14, shadowColor: "#FFD000", shadowOpacity: 0.15, shadowRadius: 12 },
  arcadeHeroTop: { flexDirection: "row", alignItems: "center" },
  arcadeIconCircle: { width: 64, height: 64, borderRadius: 22, backgroundColor: "rgba(255, 208, 0, 0.15)", borderWidth: 2, borderColor: "#FFD000", alignItems: "center", justifyContent: "center" },
  arcadeHeroKicker: { color: "#FFD000", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  arcadeHeroScore: { color: "#FFFFFF", fontSize: 34, fontWeight: "900", letterSpacing: 1 },
  arcadeHeroUnit: { color: "#FFD000", fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  arcadeHeroSub: { color: "#E2E8F0", fontSize: 12, lineHeight: 18, marginTop: 14, fontWeight: "600" },
  arcadeInfoSection: { marginTop: 18 },
  arcadeRuleTile: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(15, 23, 42, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.12)", borderRadius: 18, padding: 14, marginBottom: 10 },
  arcadeRuleIcon: { fontSize: 24 },
  arcadeRuleTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "900", letterSpacing: 0.5 },
  arcadeRuleDesc: { color: "#94A3B8", fontSize: 11, lineHeight: 16, marginTop: 3 },
  arcadeStartButton: { marginTop: 16, marginBottom: 30, height: 56, backgroundColor: "#FFD000", borderRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, shadowColor: "#FFD000", shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  arcadeStartButtonText: { color: "#0B132B", fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  arcadeStartButtonIcon: { color: "#0B132B", fontSize: 22, fontWeight: "900" },

  // Ranked/Game Countdown Overlay Styles
  countdownOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(11, 19, 43, 0.88)", justifyContent: "center", alignItems: "center", zIndex: 999 },
  countdownCard: { alignItems: "center", justifyContent: "center", padding: 30, borderRadius: 28, backgroundColor: "rgba(28, 37, 65, 0.95)", borderWidth: 2, borderColor: "#22D3EE", shadowColor: "#22D3EE", shadowOpacity: 0.4, shadowRadius: 20, elevation: 15 },
  countdownOverline: { color: "#22D3EE", fontSize: 12, fontWeight: "900", letterSpacing: 2, marginBottom: 12 },
  countdownText: { color: "#FFFFFF", fontSize: 68, fontWeight: "900", letterSpacing: 2, textShadowColor: "#22D3EE", textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 16 },
  countdownHint: { color: "#94A3B8", fontSize: 12, fontWeight: "700", marginTop: 14, textAlign: "center" },
});

export default function App() {
  useEffect(() => {
    initManusRuntime();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <HomeScreen />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
