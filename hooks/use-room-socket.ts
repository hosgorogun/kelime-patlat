import { useCallback, useEffect, useRef, useState } from "react";
import { Share } from "react-native";
import * as Linking from "expo-linking";
import { getGameSocket } from "../lib/game-socket";
import { haptics } from "../lib/haptics";
import { gameSfx } from "../lib/game-sfx";
import { triggerHapticSelection, triggerHapticSuccess } from "../shared/audio-haptics";
import { inviteMessage, normalizeRoomCode } from "../shared/invite";
import { isEqualTr } from "../shared/tr-utils";
import { monetizationManager } from "../shared/monetization";
import { applyMatchProgress, getPlayerLevel, getLeagueTier, type PlayerProgress } from "../shared/progression";
import { socialManager, type FriendRequest, type FriendUser } from "../shared/social";
import type { BoardSize, LeaderboardEntry, RoomSnapshot } from "../shared/game";
import type { ToastData } from "../components/common/global-game-toast";
import type { InspectableUser } from "../components/profile/user-profile-modal";

export interface UseRoomSocketParams {
  playerId: string;
  safeName: string;
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud: (prog: PlayerProgress) => Promise<void>;
  flushPendingAwards: () => Promise<void>;
  setScreen: (screen: any) => void;
  screenRef: React.MutableRefObject<string>;
  setNotice: (msg: string) => void;
  setGlobalToast: (toast: ToastData | null) => void;
  onWordAccepted: (foundWords: RoomSnapshot["foundWords"]) => void;
  onWordRejected: (payload?: { word?: string; reason?: string }) => void;
  clearSelection: () => void;
  setInspectedPath: (path: number[] | null) => void;
  setSelectedWordInfo: (info: any) => void;
  setShowResultModal: (show: boolean) => void;
  setShowLeaveDuelModal: (show: boolean) => void;
  setGameCountdown: (countdown: number | null) => void;
  setLeaderboard: React.Dispatch<React.SetStateAction<LeaderboardEntry[]>>;
  setPendingRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>;
  prevStartedAtRef: React.MutableRefObject<number | null>;
  recordedRoundRef: React.MutableRefObject<string | null>;
}

export function useRoomSocket({
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
  onWordAccepted,
  onWordRejected,
  clearSelection,
  setInspectedPath,
  setSelectedWordInfo,
  setShowResultModal,
  setShowLeaveDuelModal,
  setGameCountdown,
  setLeaderboard,
  setPendingRequests,
  prevStartedAtRef,
  recordedRoundRef,
}: UseRoomSocketParams) {
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(() => getGameSocket().connected);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [selectedSize, setSelectedSize] = useState<BoardSize>(4);
  const [matchmakingState, setMatchmakingState] = useState<{ size: BoardSize; elapsedSeconds: number } | null>(null);
  const [activeEmote, setActiveEmote] = useState<{ id: string; playerId: string; playerName: string; emote: string } | null>(null);
  const [incomingDuelInvite, setIncomingDuelInvite] = useState<{ fromPlayerId: string; fromPlayerName: string; roomCode: string; size: BoardSize } | null>(null);

  const activeRoomCodeRef = useRef<string | null>(null);
  const matchmakingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const emoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastEmoteSentRef = useRef<number>(0);
  const pendingDuelInviteRef = useRef<{ targetId: string; targetUsername?: string; size: BoardSize; botProfile?: any } | null>(null);
  const prevOpponentWordCountRef = useRef(0);
  const prevRoomStatusRef = useRef<string | null>(null);

  const setRoomFromServer = useCallback(
    (next: RoomSnapshot) => {
      activeRoomCodeRef.current = next.code;
      setRoom(next);
      if (next.status !== "finished") {
        setInspectedPath(null);
        setSelectedWordInfo(null);
      }
      if (next.status === "playing" || next.status === "finished") setScreen("game");
      else setScreen("room");
      setNotice(next.message);

      const opponentFoundCount = next.foundWords.filter((entry) => entry.playerId !== playerId).length;
      if (next.status === "playing" && prevOpponentWordCountRef.current < opponentFoundCount) {
        haptics.light();
      }
      prevOpponentWordCountRef.current = next.status === "playing" ? opponentFoundCount : 0;

      onWordAccepted(next.foundWords);
      if (next.status !== "playing") {
        clearSelection();
      }
    },
    [clearSelection, onWordAccepted, playerId, setInspectedPath, setNotice, setScreen, setSelectedWordInfo]
  );

  const ensureConnectedSocket = async (): Promise<any> => {
    const socket = getGameSocket();
    if (socket.connected) return socket;
    socket.connect();
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

  const getMyProfile = useCallback(() => {
    return {
      avatar: progress.selectedAvatar,
      avatarPhoto: progress.avatarPhoto,
      selectedTitle: progress.selectedTitle || "[ÇAYLAK]",
      selectedFrame: progress.selectedFrame || "signal",
      level: getPlayerLevel(progress.xp),
      tier: getLeagueTier(progress).tier,
      lp: progress.lp || 0,
      wins: progress.wins || 0,
      matches: progress.matches || 0,
      streak: progress.streak || 0,
      bestScore: progress.bestScore || 0,
      bestTempo: progress.bestTempo || 0,
    };
  }, [progress]);

  const createRoom = async (
    size = selectedSize,
    inviteTarget?: { toPlayerId: string; toUsername?: string; botProfile?: any }
  ) => {
    setInspectedPath(null);
    setSelectedWordInfo(null);
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
    const myProfile = getMyProfile();
    socket.emit("room:create", { playerId, playerName: safeName, size, immediateBot: false, profile: myProfile, inviteTarget });
    setNotice("Odan hazırlanıyor…");
  };

  const startBotDuel = async (size: BoardSize) => {
    setSelectedSize(size);
    setInspectedPath(null);
    setSelectedWordInfo(null);
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
    const myProfile = getMyProfile();
    socket.emit("room:create", { playerId, playerName: safeName, size, immediateBot: true, profile: myProfile });
    setNotice("Yapay zeka rakip hazırlanıyor...");
  };

  const startMatchmaking = async (size: BoardSize) => {
    const socket = await ensureConnectedSocket();
    if (!socket || !socket.connected) {
      setGlobalToast({
        id: `mm-err-${Date.now()}`,
        title: "BAĞLANTI HATASI",
        subtitle: "Sunucuya bağlanılamadı. İnternet bağlantını kontrol et.",
        icon: "📡",
        accentColor: "#FF647C",
      });
      return;
    }

    const myProfile = getMyProfile();
    setMatchmakingState({ size, elapsedSeconds: 0 });
    socket.emit("matchmaking:join", { playerId, playerName: safeName, size, profile: myProfile });

    if (matchmakingIntervalRef.current) clearInterval(matchmakingIntervalRef.current);
    matchmakingIntervalRef.current = setInterval(() => {
      setMatchmakingState((prev) => (prev ? { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 } : null));
    }, 1000);
  };

  const cancelMatchmaking = () => {
    if (matchmakingIntervalRef.current) {
      clearInterval(matchmakingIntervalRef.current);
      matchmakingIntervalRef.current = null;
    }
    if (matchmakingState) {
      const socket = getGameSocket();
      socket.emit("matchmaking:leave", { playerId, size: matchmakingState.size });
    }
    setMatchmakingState(null);
    triggerHapticSelection();
  };

  const sendEmote = (emote: string) => {
    if (!room) return;
    const now = Date.now();
    if (now - lastEmoteSentRef.current < 800) return;
    lastEmoteSentRef.current = now;
    const socket = getGameSocket();
    socket.emit("room:emote", { code: room.code, playerId, emote });
    gameSfx.tap();
    haptics.light();
  };

  const joinRoom = async (targetCode?: string) => {
    const normalized = normalizeRoomCode(targetCode || roomCodeInput);
    if (!normalized) {
      haptics.error();
      setNotice("5 karakterli oda kodunu yaz.");
      setGlobalToast({
        id: `code-short-${Date.now()}`,
        title: "EKSİK KOD",
        subtitle: "Lütfen 5 haneli oda kodunu eksiksiz girin.",
        icon: "⚠️",
        accentColor: "#FF647C",
      });
      return;
    }
    const code = normalized;
    setInspectedPath(null);
    setSelectedWordInfo(null);
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
    const myProfile = getMyProfile();
    socket.emit("room:join", { code, playerId, playerName: safeName, profile: myProfile });
    setNotice("Odaya katılıyorsun…");
  };

  const leaveRoom = () => {
    if (room) {
      if (room.status === "playing") {
        const roundId = `${room.code}:${room.startedAt ?? 0}`;
        recordedRoundRef.current = roundId;
        const isBotMatch = room.players.some((p) => p.isBot);
        const opponent = room.players.find((p) => p.id !== playerId);
        const isFriend = Boolean((room as any).isFriendGame || room.isCustom || !room.isRanked);
        const myScore = room.scores[playerId] ?? 0;
        const opponentScore = opponent ? (room.scores[opponent.id] ?? 0) : 0;
        const myWords = room.foundWords
          .filter((entry) => entry.playerId === playerId && !entry.hidden)
          .map((entry) => entry.word);
        setProgress((current) => {
          const updated = applyMatchProgress(
            current,
            {
              score: myScore,
              tempo: 0,
              won: false,
              isDraw: false,
              longWord: false,
              foundWords: myWords,
              size: room.size,
              opponentName: opponent?.name || (isBotMatch ? "Siber Bot" : "Rakip"),
              opponentAvatar: opponent?.avatar,
              opponentScore: opponentScore,
              isFriendGame: isFriend,
            },
            isBotMatch ? "bot" : "pvp"
          );
          void syncProgressToCloud(updated);
          return updated;
        });
      } else if (room.status === "finished") {
        const won = room.winnerId === playerId;
        const { shouldShowInterstitial } = monetizationManager.recordMatchFinished(won);
        if (shouldShowInterstitial) {
          void monetizationManager.showInterstitialAd();
        }
      }
      getGameSocket().emit("room:leave", { code: room.code, playerId });
    }
    getGameSocket().emit("matchmaking:leave", { playerId, size: selectedSize });
    setShowResultModal(false);
    setShowLeaveDuelModal(false);
    activeRoomCodeRef.current = null;
    prevStartedAtRef.current = null;
    recordedRoundRef.current = null;
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

  const handleAcceptDuelInvite = () => {
    if (!incomingDuelInvite) return;
    const invite = incomingDuelInvite;
    setIncomingDuelInvite(null);
    const socket = getGameSocket();
    if (room) {
      socket.emit("room:leave", { code: room.code, playerId });
      setRoom(null);
    }
    setShowResultModal(false);
    setShowLeaveDuelModal(false);
    activeRoomCodeRef.current = null;
    prevStartedAtRef.current = null;
    recordedRoundRef.current = null;
    setGameCountdown(null);
    setInspectedPath(null);
    clearSelection();

    socket.emit("friend:duel:respond", {
      toPlayerId: invite.fromPlayerId,
      fromPlayerName: safeName,
      roomCode: invite.roomCode,
      accepted: true,
    });
    joinRoom(invite.roomCode);
  };

  const handleRejectDuelInvite = () => {
    if (!incomingDuelInvite) return;
    const invite = incomingDuelInvite;
    setIncomingDuelInvite(null);
    const socket = getGameSocket();
    socket.emit("friend:duel:respond", {
      toPlayerId: invite.fromPlayerId,
      fromPlayerName: safeName,
      roomCode: invite.roomCode,
      accepted: false,
    });
  };

  const handleChallengeTarget = async (target: InspectableUser, size?: BoardSize) => {
    const duelSize: BoardSize = size || (room?.size as BoardSize) || selectedSize || 4;
    if (room) {
      getGameSocket().emit("room:leave", { code: room.code, playerId });
      setRoom(null);
    }
    setShowResultModal(false);
    setShowLeaveDuelModal(false);
    activeRoomCodeRef.current = null;
    prevStartedAtRef.current = null;
    recordedRoundRef.current = null;
    setGameCountdown(null);
    setInspectedPath(null);
    clearSelection();

    const isBot = Boolean(
      target.isBot ||
      target.id?.startsWith("bot:") ||
      target.id?.startsWith("friend:bot:") ||
      target.id?.startsWith("mock:")
    );

    const targetId = target.id?.startsWith("bot:")
      ? target.id
      : (isBot ? `bot:${target.id || target.username || target.name}` : target.id);
    const targetUsername = target.username || target.name;

    const botProfile = isBot ? {
      avatar: target.avatar,
      avatarPhoto: target.avatarPhoto,
      selectedTitle: target.selectedTitle,
      selectedFrame: target.selectedFrame,
      level: target.level,
      tier: target.tier,
      lp: target.lp,
      wins: target.wins,
      matches: target.matches,
      streak: target.streak,
      bestScore: target.bestScore,
      bestTempo: target.bestTempo,
    } : undefined;

    pendingDuelInviteRef.current = {
      targetId,
      targetUsername,
      size: duelSize,
      botProfile,
    };

    setGlobalToast({
      id: `duel-sent-${Date.now()}`,
      title: "DÜELLO DAVETİ GÖNDERİLDİ ⚔️",
      subtitle: `${targetUsername} oyuncusuna davet iletildi. Katılması bekleniyor...`,
      icon: "⚔️",
      accentColor: "#3EE8B5",
    });

    createRoom(duelSize, {
      toPlayerId: targetId,
      toUsername: targetUsername,
      botProfile,
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

  const handleSendFriendRequest = async (toUsername: string): Promise<{ success: boolean; message: string }> => {
    const socket = await ensureConnectedSocket();
    if (!socket || !socket.connected) {
      return { success: false, message: "Sunucuya bağlanılamadı. İnternet bağlantını kontrol et." };
    }
    const myProfile = {
      username: safeName,
      avatar: progress.selectedAvatar,
      avatarPhoto: progress.avatarPhoto,
      selectedTitle: progress.selectedTitle || "[ÇAYLAK]",
      level: getPlayerLevel(progress.xp),
      tier: getLeagueTier(progress).tier,
      lp: progress.lp || 0,
      xp: progress.xp || 0,
    };
    return new Promise((resolve) => {
      let resolved = false;
      const onSent = (res: { success: boolean; message: string }) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(res);
      };
      const onError = (err: { message: string }) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve({ success: false, message: err?.message || "İstek gönderilemedi." });
      };
      const cleanup = () => {
        socket.off("friend:request:sent", onSent);
        socket.off("friend:error", onError);
      };
      socket.once("friend:request:sent", onSent);
      socket.once("friend:error", onError);
      socket.emit("friend:request:send", {
        toUsername,
        fromPlayerId: playerId,
        fromPlayerName: safeName,
        profile: myProfile,
      });
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({ success: false, message: "Sunucudan yanıt alınamadı. Lütfen tekrar deneyin." });
        }
      }, 3500);
    });
  };

  const handleAddFriendTarget = async (target: InspectableUser) => {
    if (target.isBot) {
      const botFriend: FriendUser = {
        id: target.id || `bot_${Date.now()}`,
        name: target.name,
        username: target.username || target.name,
        avatar: target.avatar || "🤖",
        avatarPhoto: target.avatarPhoto,
        selectedTitle: target.selectedTitle || "[BOT RAKİP]",
        isOnline: true,
        xp: target.xp ?? 2500,
        level: target.level ?? 10,
        lp: target.lp ?? 100,
        tier: target.tier ?? "PLATİN",
        wins: target.wins ?? 25,
        matches: target.matches ?? 35,
        streak: target.streak ?? 3,
        bestScore: target.bestScore ?? 140,
        bestTempo: target.bestTempo ?? 3.8,
      };
      const res = socialManager.addFriend(botFriend);
      if (res.success) {
        const updated = [...socialManager.getFriends()];
        setProgress((curr) => ({ ...curr, friends: updated }));
        void syncProgressToCloud({ ...progress, friends: updated });
        triggerHapticSuccess();
        gameSfx.victory();
        setGlobalToast({
          id: `bot-friend-${Date.now()}`,
          title: "BOT DOSTU EKLENDİ! 🤖",
          subtitle: `${target.name} arkadaş listene eklendi! Sosyal Arena'dan istediğin zaman pratik maçı yapabilirsin.`,
          icon: "🤖",
          accentColor: "#3EE8B5",
        });
      } else {
        setGlobalToast({
          id: `bot-friend-already-${Date.now()}`,
          title: "BİLGİ",
          subtitle: res.message,
          icon: "ℹ️",
          accentColor: "#FFC24A",
        });
      }
      return;
    }

    const targetName = target.username || target.name;
    const res = await handleSendFriendRequest(targetName);
    setGlobalToast({
      id: `friend-${Date.now()}`,
      title: res.success ? "İSTEK GÖNDERİLDİ" : "BİLGİ",
      subtitle: res.message,
      icon: res.success ? "👥" : "ℹ️",
      accentColor: res.success ? "#3EE8B5" : "#FFC24A",
    });
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    const socket = await ensureConnectedSocket();
    if (socket && socket.connected) {
      socket.emit("friend:request:respond", {
        requestId,
        action: "accept",
        playerId,
        playerName: safeName,
        profile: {
          avatar: progress.selectedAvatar,
          avatarPhoto: progress.avatarPhoto,
          selectedTitle: progress.selectedTitle,
          level: getPlayerLevel(progress.xp),
          tier: getLeagueTier(progress).tier,
          lp: progress.lp || 0,
          xp: progress.xp || 0,
        },
      });
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    socialManager.removePendingRequest(requestId);
    setPendingRequests([...socialManager.getPendingRequests()]);
    const socket = await ensureConnectedSocket();
    if (socket && socket.connected) {
      socket.emit("friend:request:respond", {
        requestId,
        action: "reject",
        playerId,
      });
    }
  };

  const callbacksRef = useRef({
    flushPendingAwards,
    onWordRejected,
    setGlobalToast,
    setLeaderboard,
    setNotice,
    setPendingRequests,
    setProgress,
    setRoomFromServer,
    setScreen,
  });
  callbacksRef.current = {
    flushPendingAwards,
    onWordRejected,
    setGlobalToast,
    setLeaderboard,
    setNotice,
    setPendingRequests,
    setProgress,
    setRoomFromServer,
    setScreen,
  };

  // Socket event subscriptions
  useEffect(() => {
    const socket = getGameSocket();
    const onRoomUpdate = (next: RoomSnapshot) => {
      if (matchmakingIntervalRef.current) {
        clearInterval(matchmakingIntervalRef.current);
        matchmakingIntervalRef.current = null;
      }
      setMatchmakingState(null);
      callbacksRef.current.setRoomFromServer(next);

      if (pendingDuelInviteRef.current && next.status === "waiting") {
        const { targetId, targetUsername, size, botProfile } = pendingDuelInviteRef.current;
        pendingDuelInviteRef.current = null;
        socket.emit("friend:duel:invite", {
          toPlayerId: targetId,
          toUsername: targetUsername,
          fromPlayerId: playerId,
          fromPlayerName: safeName,
          roomCode: next.code,
          size,
          botProfile,
        });
      }
    };

    const onRoomError = (payload: { message?: string }) => {
      haptics.error();
      const msg = payload.message ?? "Odayla ilgili bir sorun oluştu.";
      callbacksRef.current.setNotice(msg);
      callbacksRef.current.setGlobalToast({
        id: `room-err-${Date.now()}`,
        title: "ODA HATASI",
        subtitle: msg,
        icon: "⚠️",
        accentColor: "#FF647C",
      });
      if (
        msg.includes("Oda süresi") ||
        msg.includes("sonlandırıldı") ||
        msg.includes("bulunamadı") ||
        msg.includes("dolu") ||
        msg.includes("maç başladı")
      ) {
        activeRoomCodeRef.current = null;
        setRoom(null);
        if (screenRef.current === "room" || screenRef.current === "game") {
          callbacksRef.current.setScreen("home");
        }
      }
    };

    const onRejected = (payload?: { word?: string; reason?: string }) => {
      callbacksRef.current.onWordRejected(payload);
    };

    const onLeaderboardUpdate = (next: LeaderboardEntry[]) => callbacksRef.current.setLeaderboard(next);

    const onFriendRequestReceived = (req: FriendRequest) => {
      socialManager.addPendingRequest(req);
      callbacksRef.current.setPendingRequests([...socialManager.getPendingRequests()]);
      gameSfx.tap();
      haptics.success();
      callbacksRef.current.setGlobalToast({
        id: `freq-${Date.now()}`,
        title: "ARKADAŞLIK İSTEĞİ",
        subtitle: `${req.fromName} sana arkadaşlık isteği gönderdi!`,
        icon: "👥",
        accentColor: "#3EE8B5",
      });
    };

    const onFriendRequestAccepted = (payload: { requestId?: string; newFriend: FriendUser; message?: string }) => {
      if (payload.requestId) {
        socialManager.removePendingRequest(payload.requestId);
        callbacksRef.current.setPendingRequests([...socialManager.getPendingRequests()]);
      }
      socialManager.addFriend(payload.newFriend);
      const updated = [...socialManager.getFriends()];
      callbacksRef.current.setProgress((curr) => ({ ...curr, friends: updated }));
      gameSfx.victory();
      haptics.success();
      callbacksRef.current.setGlobalToast({
        id: `freq-acc-${Date.now()}`,
        title: "İSTEK KABUL EDİLDİ",
        subtitle: payload.message || `${payload.newFriend.name} arkadaşlık isteğini kabul etti!`,
        icon: "🎉",
        accentColor: "#3EE8B5",
      });
    };

    const onFriendRequestsList = (list: FriendRequest[]) => {
      if (Array.isArray(list)) {
        socialManager.setPendingRequests(list);
        callbacksRef.current.setPendingRequests([...socialManager.getPendingRequests()]);
      }
    };

    const onFriendRemoved = (payload: { friendId: string }) => {
      socialManager.removeFriend(payload.friendId);
      const updated = [...socialManager.getFriends()];
      callbacksRef.current.setProgress((curr) => ({ ...curr, friends: updated }));
    };

    const onDuelIncoming = (payload: { fromPlayerId: string; fromPlayerName: string; roomCode: string; size: BoardSize }) => {
      gameSfx.tap();
      haptics.success();
      setIncomingDuelInvite(payload);
    };

    const onDuelAccepted = (payload: { fromPlayerName: string; roomCode: string }) => {
      gameSfx.victory();
      haptics.success();
      callbacksRef.current.setGlobalToast({
        id: `duel-acc-${Date.now()}`,
        title: "DÜELLO KABUL EDİLDİ! ⚔️",
        subtitle: `${payload.fromPlayerName} davetini kabul etti, odaya katılıyor!`,
        icon: "⚔️",
        accentColor: "#3EE8B5",
      });
    };

    const onDuelRejected = (payload: { fromPlayerName: string }) => {
      callbacksRef.current.setGlobalToast({
        id: `duel-rej-${Date.now()}`,
        title: "DÜELLO REDDEDİLDİ",
        subtitle: `${payload.fromPlayerName} düello davetini reddetti.`,
        icon: "⚔️",
        accentColor: "#FF647C",
      });
    };

    const onDuelFailed = (payload: { message: string }) => {
      callbacksRef.current.setGlobalToast({
        id: `duel-fail-${Date.now()}`,
        title: "DAVET İLETİLEMEDİ",
        subtitle: payload.message || "Rakibe ulaşılamadı.",
        icon: "⚠️",
        accentColor: "#FF647C",
      });
    };

    const onEmoteReceived = (payload: { playerId: string; playerName: string; emote: string }) => {
      setActiveEmote({
        id: `${Date.now()}-${Math.random()}`,
        playerId: payload.playerId,
        playerName: payload.playerName,
        emote: payload.emote,
      });
      gameSfx.tap();
      haptics.light();
      if (emoteTimeoutRef.current) clearTimeout(emoteTimeoutRef.current);
      emoteTimeoutRef.current = setTimeout(() => {
        setActiveEmote(null);
      }, 2500);
    };

    const onReconnect = () => {
      setIsSocketConnected(true);
      if (activeRoomCodeRef.current) {
        socket.emit("room:reconnect", { code: activeRoomCodeRef.current, playerId });
      }
      socket.emit("player:identify", { playerId, username: safeName });
      socket.emit("friend:requests:get", { playerId, username: safeName });
      void callbacksRef.current.flushPendingAwards();
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
    socket.on("friend:request:received", onFriendRequestReceived);
    socket.on("friend:request:accepted", onFriendRequestAccepted);
    socket.on("friend:requests:list", onFriendRequestsList);
    socket.on("friend:removed", onFriendRemoved);
    socket.on("friend:duel:incoming", onDuelIncoming);
    socket.on("friend:duel:accepted", onDuelAccepted);
    socket.on("friend:duel:rejected", onDuelRejected);
    socket.on("friend:duel:failed", onDuelFailed);
    socket.on("room:emote:received", onEmoteReceived);

    socket.emit("leaderboard:request");
    socket.emit("player:identify", { playerId, username: safeName });
    socket.emit("friend:requests:get", { playerId, username: safeName });

    return () => {
      if (matchmakingIntervalRef.current) {
        clearInterval(matchmakingIntervalRef.current);
        matchmakingIntervalRef.current = null;
      }
      if (emoteTimeoutRef.current) {
        clearTimeout(emoteTimeoutRef.current);
        emoteTimeoutRef.current = null;
      }
      socket.off("room:update", onRoomUpdate);
      socket.off("room:error", onRoomError);
      socket.off("word:rejected", onRejected);
      socket.off("connect", onReconnect);
      socket.off("disconnect", onDisconnect);
      socket.off("leaderboard:update", onLeaderboardUpdate);
      socket.off("friend:request:received", onFriendRequestReceived);
      socket.off("friend:request:accepted", onFriendRequestAccepted);
      socket.off("friend:requests:list", onFriendRequestsList);
      socket.off("friend:removed", onFriendRemoved);
      socket.off("friend:duel:incoming", onDuelIncoming);
      socket.off("friend:duel:accepted", onDuelAccepted);
      socket.off("friend:duel:rejected", onDuelRejected);
      socket.off("friend:duel:failed", onDuelFailed);
      socket.off("room:emote:received", onEmoteReceived);
    };
  }, [playerId, safeName, screenRef]);

  return {
    room,
    setRoom,
    isSocketConnected,
    roomCodeInput,
    setRoomCodeInput,
    selectedSize,
    setSelectedSize,
    matchmakingState,
    activeEmote,
    incomingDuelInvite,
    activeRoomCodeRef,
    prevRoomStatusRef,
    createRoom,
    startBotDuel,
    startMatchmaking,
    cancelMatchmaking,
    sendEmote,
    joinRoom,
    leaveRoom,
    handleLiveGameExitPress,
    markReady,
    requestRematch,
    handleAcceptDuelInvite,
    handleRejectDuelInvite,
    handleChallengeTarget,
    shareRoomInvite,
    handleSendFriendRequest,
    handleAddFriendTarget,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
  };
}
