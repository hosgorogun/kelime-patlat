import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthScreen } from "./auth-screen";
import { SESSION_TOKEN_KEY, getApiBaseUrl } from "@/constants/oauth";
import { mergePlayerProgress, type PlayerProgress } from "@/shared/progression";
import { useAuth, useProgression } from "@/context";

const PROGRESS_KEY = "kelime-patlat:season-progress-v1";

export interface AuthScreenContainerProps {
  authToken?: string | null;
  progress?: PlayerProgress;
  setAuthToken?: (token: string | null) => void;
  setPlayerId?: (id: string) => void;
  setPlayerName?: (name: string) => void;
  setProgress?: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud?: (p: PlayerProgress) => Promise<void>;
  reconnectGameSocket?: () => void;
  onFinishAuth: (options: { showWelcomeModal: boolean }) => void;
}

export function AuthScreenContainer(props: AuthScreenContainerProps) {
  const auth = useAuth();
  const progression = useProgression();

  const authToken = props.authToken !== undefined ? props.authToken : auth.authToken;
  const progress = props.progress ?? progression.progress;
  const setAuthToken = props.setAuthToken ?? auth.setAuthToken;
  const setPlayerId = props.setPlayerId ?? auth.setPlayerId;
  const setPlayerName = props.setPlayerName ?? auth.setPlayerName;
  const setProgress = props.setProgress ?? progression.setProgress;
  const syncProgressToCloud = props.syncProgressToCloud ?? progression.syncProgressToCloud;
  const reconnectGameSocket = props.reconnectGameSocket ?? progression.reconnectGameSocket;
  const onFinishAuth = props.onFinishAuth;
  return (
    <AuthScreen
      onCancel={async () => {
        if (!authToken) {
          try {
            const cachedToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
            const cachedId = await AsyncStorage.getItem("kelime-patlat:player-id");
            const cachedName = await AsyncStorage.getItem("kelime-patlat:player-name");
            const cachedProgressStr = await AsyncStorage.getItem(PROGRESS_KEY);

            if (cachedToken && cachedId && cachedToken !== "guest") {
              try {
                const checkRes = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
                  headers: { Authorization: `Bearer ${cachedToken}` },
                });
                if (checkRes.ok) {
                  const checkData = await checkRes.json();
                  if (checkData.user?.openId) {
                    setAuthToken(cachedToken);
                    setPlayerId(checkData.user.openId);
                    setPlayerName(checkData.user.name || cachedName || "Misafir");
                    if (checkData.user.progress) {
                      setProgress(checkData.user.progress);
                    }
                    reconnectGameSocket();
                    onFinishAuth({ showWelcomeModal: false });
                    return;
                  }
                }
              } catch {
                // Ağ hatasında yerel önbellek ile devam
              }
            }

            if (cachedToken && cachedId && cachedProgressStr) {
              try {
                const parsed = JSON.parse(cachedProgressStr);
                setAuthToken(cachedToken);
                setPlayerId(cachedId);
                setPlayerName(cachedName || "Misafir");
                setProgress(parsed);
                reconnectGameSocket();
                onFinishAuth({ showWelcomeModal: false });
                return;
              } catch {
                // Devam et
              }
            }

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
              if (data.user.progress) {
                setProgress((current) => mergePlayerProgress(current, data.user.progress, { preferRemoteBalances: true }));
              }
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
        reconnectGameSocket();
        onFinishAuth({ showWelcomeModal: false });
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
              reconnectGameSocket();
              onFinishAuth({ showWelcomeModal: false });
              return;
            }
          } catch {
            // Fall back to local merge
          }
        }

        // Seamless guest to registered account progress merge
        const mergedProgress = mergePlayerProgress(progress, cloudProgress, { preferRemoteBalances: true });

        setProgress(mergedProgress);
        await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(mergedProgress)).catch(() => undefined);
        await syncProgressToCloud(mergedProgress);
        reconnectGameSocket();

        const key = openId ? `kelime-patlat:guide-seen:${openId}` : "kelime-patlat:guide-seen";
        let showWelcome = false;
        if (!mergedProgress.welcomeRewardClaimed) {
          showWelcome = true;
        } else {
          await AsyncStorage.setItem(key, "true").catch(() => undefined);
          await AsyncStorage.setItem("kelime-patlat:guide-seen", "true").catch(() => undefined);
        }
        onFinishAuth({ showWelcomeModal: showWelcome });
      }}
    />
  );
}
