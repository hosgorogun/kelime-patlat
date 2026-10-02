import { useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PlayerProgress } from "../shared/progression";
import { getDayId, checkDailyLoginReward } from "../shared/progression";
import type { ToastData } from "../components/common/global-game-toast";
import { getApiBaseUrl, SESSION_TOKEN_KEY } from "../constants/oauth";
import { PROGRESS_KEY } from "./use-player-progression";
import { haptics } from "../lib/haptics";
import { gameSfx } from "../lib/game-sfx";

interface UseRewardModalsParams {
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud: (progress: PlayerProgress) => Promise<void>;
  setGlobalToast: (toast: ToastData | null) => void;
}

export function useRewardModals({
  progress,
  setProgress,
  syncProgressToCloud,
  setGlobalToast,
}: UseRewardModalsParams) {
  const [showGuide, setShowGuide] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isClaimingWelcomeReward, setIsClaimingWelcomeReward] = useState(false);
  const isClaimingDailyRewardRef = useRef(false);

  const progressRef = useRef(progress);
  progressRef.current = progress;

  const handleClaimWelcomeReward = async () => {
    if (isClaimingWelcomeReward) return;
    setIsClaimingWelcomeReward(true);
    haptics.success();

    setShowWelcomeModal(false);

    let updatedNext: PlayerProgress | null = null;
    setProgress((prev: PlayerProgress) => {
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
  };

  const handleClaimDailyReward = async () => {
    if (isClaimingDailyRewardRef.current) return;
    const currentProgress = progressRef.current;
    const todayId = getDayId();
    if (currentProgress.lastLoginDay === todayId) return;
    isClaimingDailyRewardRef.current = true;

    try {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      if (token && token !== "guest") {
        try {
          const response = await fetch(`${getApiBaseUrl()}/api/game/daily-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (response.ok && data.progress) {
            setProgress(data.progress);
            await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(data.progress)).catch(() => undefined);
            haptics.success();
            gameSfx.victory();
            const reward = data.reward;
            const rewardName =
              reward.rewardType === "coins" ? "ÇİP" : reward.rewardType === "shield" ? "SERİ KALKANI" : "SEZON XP";
            setGlobalToast({
              id: `daily-reward-${Date.now()}`,
              title: `🎁 GÜNLÜK ÖDÜL ALINDI!`,
              subtitle: `${reward.label} tamamlandı! +${reward.amount} ${rewardName} hesabına eklendi.`,
              icon: reward.icon,
              accentColor: "#3EE8B5",
              badge: `+${reward.amount}`,
            });
            return;
          } else if (response.status === 400) {
            // Sunucuda bugünkü giriş ödülü zaten alınmış; yerel mükerrer ödül verilmesi önlendi
            if (data.progress) {
              setProgress(data.progress);
              await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(data.progress)).catch(() => undefined);
            }
            return;
          }
        } catch {
          // Fallback to local
        }
      }

      const res = checkDailyLoginReward(progressRef.current, todayId);
      if (!res) return;
      setProgress(res.updatedProgress);
      AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(res.updatedProgress)).catch(() => undefined);
      void syncProgressToCloud(res.updatedProgress);
      haptics.success();
      gameSfx.victory();
      const rewardName =
        res.reward.rewardType === "coins" ? "ÇİP" : res.reward.rewardType === "shield" ? "SERİ KALKANI" : "SEZON XP";
      setGlobalToast({
        id: `daily-reward-${Date.now()}`,
        title: `🎁 GÜNLÜK ÖDÜL ALINDI!`,
        subtitle: `${res.reward.label} tamamlandı! +${res.reward.amount} ${rewardName} hesabına eklendi.`,
        icon: res.reward.icon,
        accentColor: "#3EE8B5",
        badge: `+${res.reward.amount}`,
      });
    } finally {
      isClaimingDailyRewardRef.current = false;
    }
  };

  const handleCloseGuide = () => {
    setShowGuide(false);
    AsyncStorage.setItem("kelime-patlat:guide-seen", "true").catch(() => undefined);
  };

  return {
    showGuide,
    setShowGuide,
    showWelcomeModal,
    setShowWelcomeModal,
    isClaimingWelcomeReward,
    setIsClaimingWelcomeReward,
    handleClaimWelcomeReward,
    handleClaimDailyReward,
    handleCloseGuide,
  };
}
