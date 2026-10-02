import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SESSION_TOKEN_KEY, getApiBaseUrl } from "../constants/oauth";
import { mergePlayerProgress, type PlayerProgress } from "../shared/progression";

export interface UseAuthSessionParams {
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  setScreen: (screen: any) => void;
  flushPendingAwards: () => Promise<void>;
}

export function useAuthSession({
  setProgress,
  setScreen,
  flushPendingAwards,
}: UseAuthSessionParams) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [playerName, setPlayerName] = useState("OYUNCU");
  const [playerId, setPlayerId] = useState<string>(
    () => `player-${Math.random().toString(36).slice(2, 10)}`
  );

  const safeName = playerName.trim().slice(0, 16) || "OYUNCU";

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(SESSION_TOKEN_KEY)
      .then(async (token) => {
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
            const authAbort = new AbortController();
            const timeoutId = setTimeout(() => authAbort.abort(), 2500);
            const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
              signal: authAbort.signal,
            });
            clearTimeout(timeoutId);
            if (response.ok) {
              const data = await response.json();
              const user = data?.user || data;
              if (user && user.openId) {
                setAuthToken(token);
                setPlayerId(user.openId);
                setPlayerName(user.name || user.username || "OYUNCU");
                await AsyncStorage.setItem("kelime-patlat:player-id", user.openId);
                await AsyncStorage.setItem(
                  "kelime-patlat:player-name",
                  user.name || user.username || "OYUNCU"
                );
                if (user.progress) {
                  setProgress((current) =>
                    mergePlayerProgress(current, user.progress, { preferRemoteBalances: true })
                  );
                }
              } else {
                const cachedId = await AsyncStorage.getItem("kelime-patlat:player-id");
                const cachedName = await AsyncStorage.getItem("kelime-patlat:player-name");
                setAuthToken(token);
                setPlayerId(cachedId || `user-${Math.random().toString(36).slice(2, 10)}`);
                setPlayerName(cachedName || "OYUNCU");
              }
              void flushPendingAwards();
            } else {
              const cachedId = await AsyncStorage.getItem("kelime-patlat:player-id");
              const cachedName = await AsyncStorage.getItem("kelime-patlat:player-name");
              setAuthToken(token);
              setPlayerId(cachedId || `user-${Math.random().toString(36).slice(2, 10)}`);
              setPlayerName(cachedName || "OYUNCU");
            }
          } catch (err) {
            console.log("[Auth] Failed to verify token on startup (offline fallback active):", err);
            const cachedId = await AsyncStorage.getItem("kelime-patlat:player-id");
            const cachedName = await AsyncStorage.getItem("kelime-patlat:player-name");
            setAuthToken(token);
            setPlayerId(cachedId || `offline-${Math.random().toString(36).slice(2, 10)}`);
            setPlayerName(cachedName || "OYUNCU");
          }
        } else {
          // Sıfır Sürtünmeli Giriş (Instant Zero-Friction Onboarding)
          // Yeni oyuncu doğrudan misafir olarak oyuna başlar, kayıt duvarı olmadan anında oynar.
          const guestNumber = Math.floor(1000 + Math.random() * 9000);
          const guestName = `Oyuncu #${guestNumber}`;
          const guestId = `guest_${Math.random().toString(36).slice(2, 10)}`;
          setAuthToken("guest");
          setPlayerId(guestId);
          setPlayerName(guestName);
          await AsyncStorage.setItem(SESSION_TOKEN_KEY, "guest");
          await AsyncStorage.setItem("kelime-patlat:player-id", guestId);
          await AsyncStorage.setItem("kelime-patlat:player-name", guestName);
          setScreen("home");
        }
        setAuthLoading(false);
      })
      .catch(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
    };
  }, [flushPendingAwards, setProgress, setScreen]);

  return {
    authToken,
    setAuthToken,
    authLoading,
    setAuthLoading,
    playerId,
    setPlayerId,
    playerName,
    setPlayerName,
    safeName,
  };
}
