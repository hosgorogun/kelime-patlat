import { useEffect, useRef } from "react";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SESSION_TOKEN_KEY, getApiBaseUrl } from "../constants/oauth";
import { normalizeRoomCode } from "../shared/invite";
import { mergePlayerProgress, type PlayerProgress } from "../shared/progression";

export interface UseDeepLinkHandlerParams {
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud: (progress: PlayerProgress) => Promise<void>;
  setAuthToken: (token: string | null) => void;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setRoomCodeInput: (code: string) => void;
  setScreen: (screen: any) => void;
  setNotice: (notice: string) => void;
}

export function useDeepLinkHandler({
  progress,
  setProgress,
  syncProgressToCloud,
  setAuthToken,
  setPlayerId,
  setPlayerName,
  setRoomCodeInput,
  setScreen,
  setNotice,
}: UseDeepLinkHandlerParams) {
  const incomingUrl = Linking.useURL();

  const handledUrlRef = useRef<string | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    if (!incomingUrl) return;
    if (handledUrlRef.current === incomingUrl) return;
    handledUrlRef.current = incomingUrl;

    let active = true;
    const parsedUrl = Linking.parse(incomingUrl);
    const oauthCode =
      typeof parsedUrl.queryParams?.code === "string" ? parsedUrl.queryParams.code : null;
    const oauthState =
      typeof parsedUrl.queryParams?.state === "string" ? parsedUrl.queryParams.state : null;

    if (parsedUrl.path?.includes("oauth/callback") && oauthCode && oauthState) {
      fetch(
        `${getApiBaseUrl()}/api/oauth/mobile?code=${encodeURIComponent(
          oauthCode
        )}&state=${encodeURIComponent(oauthState)}`
      )
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
          if (
            previousToken &&
            previousToken !== "guest" &&
            previousToken !== data.app_session_id
          ) {
            try {
              const transferResponse = await fetch(`${getApiBaseUrl()}/api/auth/claim-guest`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${data.app_session_id}`,
                },
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
            const merged = mergePlayerProgress(progressRef.current, data.user.progress, {
              preferRemoteBalances: true,
            });
            setProgress(merged);
            await syncProgressToCloud(merged);
          }
        })
        .catch(() => {
          if (active) setNotice("Giriş tamamlanamadı. Lütfen tekrar deneyin.");
        });
      return () => {
        active = false;
      };
    }

    const code = normalizeRoomCode(parsedUrl.queryParams?.code);
    if (code) {
      setRoomCodeInput(code);
      setScreen("online");
      setNotice("Davet kodu hazır. Adını kontrol edip odaya katıl.");
    }

    return () => {
      active = false;
    };
  }, [
    incomingUrl,
    setProgress,
    syncProgressToCloud,
    setAuthToken,
    setPlayerId,
    setPlayerName,
    setRoomCodeInput,
    setScreen,
    setNotice,
  ]);
}
