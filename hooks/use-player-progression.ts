import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_PROGRESS,
  mergePlayerProgress,
  reconcilePlayerProgress,
  type PlayerProgress,
} from "../shared/progression";
import type { LeaderboardEntry } from "../shared/game";
import { SESSION_TOKEN_KEY, getApiBaseUrl } from "../constants/oauth";
import { socialManager } from "../shared/social";
import { getGameSocket } from "../lib/game-socket";
import type { ModernAlertData } from "../components/modals/modern-alert-modal";

export const SOLO_UNLOCK_KEY = "kelime-patlat:solo-unlocked-level";
export const PROGRESS_KEY = "kelime-patlat:season-progress-v1";
export const PENDING_AWARDS_KEY = "kelime-patlat:pending-awards-v1";
export const MAX_PENDING_AWARDS = 50;

export interface UsePlayerProgressionParams {
  safeName: string;
  authToken: string | null;
  screen: string;
  setGlobalAlert: (alert: ModernAlertData | null) => void;
  setSeasonResetModal: (modal: {
    newSeasonId: string;
    previousRank: string;
    previousLp: number;
    newLp: number;
  } | null) => void;
  setShowWelcomeModal: (show: boolean) => void;
  setGlobalToast?: (toast: any) => void;
}

export function usePlayerProgression({
  safeName,
  authToken,
  screen,
  setGlobalAlert,
  setSeasonResetModal,
  setShowWelcomeModal,
  setGlobalToast,
}: UsePlayerProgressionParams) {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);
  const progressRef = useRef<PlayerProgress>(DEFAULT_PROGRESS);
  const [progressReady, setProgressReady] = useState(false);
  const [soloUnlockedLevel, setSoloUnlockedLevel] = useState(1);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const syncProgressToCloud = useCallback(
    async (currentProgress: PlayerProgress, customName?: string) => {
      try {
        const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
        if (!token || token === "guest") return;
        const res = await fetch(`${getApiBaseUrl()}/api/auth/sync-progress`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            progress: currentProgress,
            name: customName || safeName,
          }),
        });
        if (res.ok) {
          if (wasOfflineRef.current) {
            wasOfflineRef.current = false;
            setGlobalToast?.({
              id: `sync-recovered-${Date.now()}`,
              title: "BULUT EŞİTLENDİ",
              subtitle: "Bağlantı kuruldu, ilerlemeniz güvenle eşitlendi.",
              icon: "☁️",
              accentColor: "#3EE8B5",
            });
          }
        } else {
          wasOfflineRef.current = true;
        }
      } catch {
        // Çevrimdışı veya sunucuya ulaşılamayan durumlarda ilerleme yerel AsyncStorage içinde güvenle korunur.
        wasOfflineRef.current = true;
      }
    },
    [safeName, setGlobalToast]
  );

  const flushPendingAwards = useCallback(async () => {
    const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    if (!token || token === "guest") return;
    let queue: any[] = [];
    try {
      const stored = await AsyncStorage.getItem(PENDING_AWARDS_KEY);
      queue = stored ? JSON.parse(stored) : [];
    } catch {
      return;
    }
    if (queue.length === 0) return;
    const remaining: any[] = [];
    for (const item of queue) {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/game/award`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(item),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.progress) {
            setProgress((current) => mergePlayerProgress(current, data.progress, { preferRemoteBalances: true }));
          }
        } else if (response.status === 400 || response.status === 409) {
          // Kalıcı olarak reddedildi
        } else {
          remaining.push(item);
        }
      } catch {
        const currentIndex = queue.indexOf(item);
        if (currentIndex !== -1) {
          remaining.push(...queue.slice(currentIndex));
        }
        break;
      }
    }
    try {
      await AsyncStorage.setItem(PENDING_AWARDS_KEY, JSON.stringify(remaining));
    } catch {
      // Yoksay
    }
  }, []);

  const awardProgressOnServer = useCallback(
    async (
      payload: {
        kind: "solo" | "arcade" | "vintage";
        level?: number;
        score?: number;
        foundWords?: string[];
        daily?: boolean;
        wordsCount?: number;
        dailyId?: string;
        isDoubled?: boolean;
        comboCount?: number;
      },
      fallback?: (current: PlayerProgress) => PlayerProgress
    ) => {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      if (!token || token === "guest") {
        return;
      }
      const awardId = `${payload.kind}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/game/award`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...payload, awardId }),
        });
        if (!response.ok) throw new Error("Ödül sunucuda hesaplanamadı.");
        const data = await response.json();
        if (data.progress) {
          setProgress((current) => mergePlayerProgress(current, data.progress, { preferRemoteBalances: true }));
        } else {
          throw new Error("Sunucu progress döndürmedi.");
        }
      } catch {
        try {
          const stored = await AsyncStorage.getItem(PENDING_AWARDS_KEY);
          const queue: any[] = stored ? JSON.parse(stored) : [];
          queue.push({ ...payload, awardId, queuedAt: Date.now() });
          await AsyncStorage.setItem(PENDING_AWARDS_KEY, JSON.stringify(queue.slice(-MAX_PENDING_AWARDS)));
        } catch {
          // Kuyruğa yazma başarısız olursa ödül yalnızca yerel ilerlemede kalır
        }
      }
    },
    []
  );

  const claimMissionOnServer = useCallback(
    async (kind: "daily" | "weekly", missionId: string, fallback: (current: PlayerProgress) => PlayerProgress) => {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      const applyLocalFallback = () => {
        setProgress((curr) => {
          const updated = fallback(curr);
          void syncProgressToCloud(updated);
          return updated;
        });
      };
      if (!token || token === "guest") {
        applyLocalFallback();
        return;
      }
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/game/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ kind, missionId }),
        });
        if (response.status === 400 || response.status === 409) {
          return;
        }
        if (!response.ok) throw new Error("Görev ödülü alınamadı.");
        const data = await response.json();
        if (data.progress) {
          setProgress((current) => mergePlayerProgress(current, data.progress, { preferRemoteBalances: true }));
        }
      } catch {
        applyLocalFallback();
      }
    },
    [syncProgressToCloud]
  );

  const claimMilestoneOnServer = useCallback(
    async (level: number, fallback: (current: PlayerProgress) => PlayerProgress) => {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      if (!token || token === "guest") {
        setProgress(fallback);
        return;
      }
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/game/milestone`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ level }),
        });
        if (response.status === 400 || response.status === 409) {
          return;
        }
        if (!response.ok) throw new Error("Sandık ödülü alınamadı.");
        const data = await response.json();
        if (data.progress) {
          setProgress((current) => mergePlayerProgress(current, data.progress, { preferRemoteBalances: true }));
        } else {
          setProgress(fallback);
        }
      } catch {
        setProgress(fallback);
      }
    },
    []
  );

  // Initial load from storage and cloud
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
    }).catch(() => {
      if (active) setProgressReady(true);
    });

    // Fetch cloud progress on launch if user token exists
    AsyncStorage.getItem(SESSION_TOKEN_KEY).then((token) => {
      if (active && token && token !== "guest") {
        fetch(`${getApiBaseUrl()}/api/auth/get-progress`, {
          headers: { Authorization: `Bearer ${token}` },
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

    return () => {
      active = false;
    };
  }, []);

  // Refresh real-time leaderboard when navigating to season or league screens
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
    return () => {
      active = false;
    };
  }, [screen]);

  // Keep soloUnlockedLevel synced
  useEffect(() => {
    if (!progressReady) return;
    if (typeof progress.soloUnlockedLevel === "number" && progress.soloUnlockedLevel > soloUnlockedLevel) {
      setSoloUnlockedLevel(progress.soloUnlockedLevel);
      AsyncStorage.setItem(SOLO_UNLOCK_KEY, String(progress.soloUnlockedLevel)).catch(() => undefined);
    }
  }, [progress.soloUnlockedLevel, progressReady, soloUnlockedLevel]);

  // Keep friends synced from cloud
  useEffect(() => {
    if (!progressReady) return;
    if (Array.isArray(progress.friends) && progress.friends.length > 0) {
      socialManager.syncFromCloud(progress.friends);
    }
  }, [progress.friends, progressReady]);

  // Daily reconciliation and streak check
  useEffect(() => {
    if (!progressReady || !authToken || screen === "auth") return;
    if (progress.welcomeRewardClaimed) return;
    void (async () => {
      const openId = await AsyncStorage.getItem("kelime-patlat:player-id");
      const key = openId ? `kelime-patlat:guide-seen:${openId}` : "kelime-patlat:guide-seen";
      const [seenSpecific, seenGeneral] = await Promise.all([
        AsyncStorage.getItem(key),
        AsyncStorage.getItem("kelime-patlat:guide-seen"),
      ]);
      if (!seenSpecific && !seenGeneral) {
        setShowWelcomeModal(true);
      }
    })();

    const reconciliation = reconcilePlayerProgress(progress);
    if (
      reconciliation.shieldSaved ||
      reconciliation.streakReset ||
      reconciliation.missionsReset ||
      reconciliation.seasonReset.seasonResetPerformed
    ) {
      setProgress(reconciliation.progress);
    }

    if (reconciliation.seasonReset.seasonResetPerformed) {
      const sr = reconciliation.seasonReset;
      if ((progress.matches ?? 0) > 0 || (progress.lp ?? 0) > 0) {
        setSeasonResetModal({
          newSeasonId: sr.newSeasonId,
          previousRank: sr.previousRank || "DEMİR",
          previousLp: sr.previousLp ?? 0,
          newLp: sr.newLp ?? 0,
        });
      }
    } else if (reconciliation.shieldSaved) {
      setGlobalAlert({
        icon: "🛡️",
        kicker: "SERİ KORUMASI",
        title: "Seri Kalkanı Devreye Girdi!",
        message: `Dün oyuna giremediğin için ${reconciliation.shieldsConsumed} adet Seri Kalkanı kullanıldı ve ${reconciliation.previousStreak} günlük serin başarıyla korundu!`,
        accentColor: "#3EE8B5",
        primaryButton: {
          text: "HARİKA!",
          onPress: () => {},
        },
      });
    } else if (reconciliation.streakReset && reconciliation.previousStreak > 0) {
      setGlobalAlert({
        icon: "⚡",
        kicker: "SERİ GÜNCELLEMESİ",
        title: "Günlük Seri Sıfırlandı",
        message: `Dün günlük rotayı tamamlamadığın için ${reconciliation.previousStreak} günlük serin sıfırlandı. Bugün yeni bir seri başlatabilirsin!`,
        accentColor: "#FF647C",
        primaryButton: {
          text: "YENİDEN BAŞLA",
          color: "#2a9c7a",
          onPress: () => {},
        },
      });
    }
  }, [
    progressReady,
    authToken,
    screen,
    progress.welcomeRewardClaimed,
    progress.matches,
    progress.lp,
    progress.lastLoginDay,
    setGlobalAlert,
    setSeasonResetModal,
    setShowWelcomeModal,
  ]);

  // App resuming from background: socket liveness recovery and day reconciliation
  // App backgrounding: immediately flush pending debounced progress to cloud
  useEffect(() => {
    if (!progressReady) return;
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        try {
          const socket = getGameSocket();
          if (!socket.connected) {
            socket.connect();
          }
        } catch {
          // Socket liveness recovery
        }
        setProgress((current) => {
          const res = reconcilePlayerProgress(current);
          if (res.shieldSaved || res.streakReset || res.missionsReset || res.seasonReset.seasonResetPerformed) {
            return res.progress;
          }
          return current;
        });
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        if (syncDebounceRef.current) {
          clearTimeout(syncDebounceRef.current);
          syncDebounceRef.current = null;
        }
        if (authToken && authToken !== "guest") {
          void syncProgressToCloud(progressRef.current);
        }
      }
    });
    return () => subscription.remove();
  }, [progressReady, authToken, syncProgressToCloud]);

  // Autosave to AsyncStorage and debounce sync to cloud
  useEffect(() => {
    if (!progressReady) return;
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => undefined);
    AsyncStorage.setItem("kelime-patlat:player-name", safeName).catch(() => undefined);
    if (authToken && authToken !== "guest") {
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
      syncDebounceRef.current = setTimeout(() => {
        syncProgressToCloud(progressRef.current);
      }, 1500);
    }
    return () => {
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    };
  }, [progress, progressReady, safeName, authToken, syncProgressToCloud]);

  return {
    progress,
    setProgress,
    progressRef,
    progressReady,
    soloUnlockedLevel,
    setSoloUnlockedLevel,
    leaderboard,
    setLeaderboard,
    syncProgressToCloud,
    flushPendingAwards,
    awardProgressOnServer,
    claimMissionOnServer,
    claimMilestoneOnServer,
  };
}
