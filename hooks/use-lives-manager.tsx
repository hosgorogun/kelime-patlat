import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LivesModal } from "../components/lives-modal";
import { triggerHapticSuccess } from "../shared/audio-haptics";
import { buyLives, MAX_LIVES, type PlayerProgress } from "../shared/progression";
import { SESSION_TOKEN_KEY, getApiBaseUrl } from "../constants/oauth";
import type { ToastData } from "../components/global-game-toast";

export interface UseLivesManagerParams {
  progress: PlayerProgress;
  progressRef: React.RefObject<PlayerProgress>;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud: (progress: PlayerProgress) => Promise<void>;
  setGlobalToast: (toast: ToastData | null) => void;
}

export function useLivesManager({
  progress,
  progressRef,
  setProgress,
  syncProgressToCloud,
  setGlobalToast,
}: UseLivesManagerParams) {
  const [showLivesModal, setShowLivesModal] = useState(false);
  const [buyingLivesLoading, setBuyingLivesLoading] = useState(false);

  const handleBuyOneLife = async () => {
    if (buyingLivesLoading) return;
    setBuyingLivesLoading(true);
    try {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      if (!token || token === "guest") {
        const res = buyLives(progressRef.current, "one");
        if (!res.success) {
          setGlobalToast({
            id: `no-chips-${Date.now()}`,
            title: "İŞLEM GERÇEKLEŞTİRİLEMEDİ",
            subtitle: res.message,
            icon: "🪙",
            accentColor: "#EF4444",
          });
        } else {
          setProgress(res.updatedProgress);
          void syncProgressToCloud(res.updatedProgress);
          triggerHapticSuccess();
          setGlobalToast({
            id: `life-bought-${Date.now()}`,
            title: "CAN EKLENDİ 💚",
            subtitle: "1 Can başarıyla profilinize tanımlandı!",
            icon: "💚",
            accentColor: "#22C55E",
          });
        }
      } else {
        const response = await fetch(`${getApiBaseUrl()}/api/game/lives`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ option: "one" }),
        });
        const data = await response.json();
        if (!response.ok) {
          const res = buyLives(progressRef.current, "one");
          if (res.success) {
            setProgress(res.updatedProgress);
            void syncProgressToCloud(res.updatedProgress);
            triggerHapticSuccess();
            setGlobalToast({
              id: `life-bought-${Date.now()}`,
              title: "CAN EKLENDİ 💚",
              subtitle: "1 Can başarıyla profilinize tanımlandı!",
              icon: "💚",
              accentColor: "#22C55E",
            });
          } else {
            setGlobalToast({
              id: `life-err-${Date.now()}`,
              title: "İŞLEM BAŞARISIZ",
              subtitle: data.error || res.message,
              icon: "❌",
              accentColor: "#EF4444",
            });
          }
        } else {
          setProgress(data.progress);
          triggerHapticSuccess();
          setGlobalToast({
            id: `life-bought-${Date.now()}`,
            title: "CAN EKLENDİ 💚",
            subtitle: "1 Can başarıyla profilinize tanımlandı!",
            icon: "💚",
            accentColor: "#22C55E",
          });
        }
      }
    } catch {
      const res = buyLives(progressRef.current, "one");
      if (res.success) {
        setProgress(res.updatedProgress);
        void syncProgressToCloud(res.updatedProgress);
        triggerHapticSuccess();
        setGlobalToast({
          id: `life-bought-${Date.now()}`,
          title: "CAN EKLENDİ 💚",
          subtitle: "1 Can başarıyla profilinize tanımlandı!",
          icon: "💚",
          accentColor: "#22C55E",
        });
      }
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
        const res = buyLives(progressRef.current, "all");
        if (!res.success) {
          setGlobalToast({
            id: `no-chips-${Date.now()}`,
            title: "İŞLEM GERÇEKLEŞTİRİLEMEDİ",
            subtitle: res.message,
            icon: "🪙",
            accentColor: "#EF4444",
          });
        } else {
          setProgress(res.updatedProgress);
          void syncProgressToCloud(res.updatedProgress);
          triggerHapticSuccess();
          setGlobalToast({
            id: `lives-refilled-${Date.now()}`,
            title: "CANLAR DOLDU! 💚",
            subtitle: `Canlarınız ${MAX_LIVES}/${MAX_LIVES} olarak yenilendi!`,
            icon: "💚",
            accentColor: "#22C55E",
          });
        }
      } else {
        const response = await fetch(`${getApiBaseUrl()}/api/game/lives`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ option: "all" }),
        });
        const data = await response.json();
        if (!response.ok) {
          const res = buyLives(progressRef.current, "all");
          if (res.success) {
            setProgress(res.updatedProgress);
            void syncProgressToCloud(res.updatedProgress);
            triggerHapticSuccess();
            setGlobalToast({
              id: `lives-refilled-${Date.now()}`,
              title: "CANLAR DOLDU! 💚",
              subtitle: `Canlarınız ${MAX_LIVES}/${MAX_LIVES} olarak yenilendi!`,
              icon: "💚",
              accentColor: "#22C55E",
            });
          } else {
            setGlobalToast({
              id: `life-err-${Date.now()}`,
              title: "İŞLEM BAŞARISIZ",
              subtitle: data.error || res.message,
              icon: "❌",
              accentColor: "#EF4444",
            });
          }
        } else {
          setProgress(data.progress);
          triggerHapticSuccess();
          setGlobalToast({
            id: `lives-refilled-${Date.now()}`,
            title: "CANLAR DOLDU! 💚",
            subtitle: `Canlarınız ${MAX_LIVES}/${MAX_LIVES} olarak yenilendi!`,
            icon: "💚",
            accentColor: "#22C55E",
          });
        }
      }
    } catch {
      const res = buyLives(progressRef.current, "all");
      if (res.success) {
        setProgress(res.updatedProgress);
        void syncProgressToCloud(res.updatedProgress);
        triggerHapticSuccess();
        setGlobalToast({
          id: `lives-refilled-${Date.now()}`,
          title: "CANLAR DOLDU! 💚",
          subtitle: `Canlarınız ${MAX_LIVES}/${MAX_LIVES} olarak yenilendi!`,
          icon: "💚",
          accentColor: "#22C55E",
        });
      }
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
        const res = buyLives(progressRef.current, "ad");
        if (res.success) {
          setProgress(res.updatedProgress);
          void syncProgressToCloud(res.updatedProgress);
          triggerHapticSuccess();
          setGlobalToast({
            id: `ad-life-${Date.now()}`,
            title: "REKLAM ÖDÜLÜ 📺",
            subtitle: "+1 Can kazandın!",
            icon: "💚",
            accentColor: "#22C55E",
          });
        }
      } else {
        const response = await fetch(`${getApiBaseUrl()}/api/game/lives`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ option: "ad" }),
        });
        const data = await response.json();
        if (!response.ok) {
          const res = buyLives(progressRef.current, "ad");
          if (res.success) {
            setProgress(res.updatedProgress);
            void syncProgressToCloud(res.updatedProgress);
            triggerHapticSuccess();
            setGlobalToast({
              id: `ad-life-${Date.now()}`,
              title: "REKLAM ÖDÜLÜ 📺",
              subtitle: "+1 Can kazandın!",
              icon: "💚",
              accentColor: "#22C55E",
            });
          }
        } else {
          setProgress(data.progress);
          triggerHapticSuccess();
          setGlobalToast({
            id: `ad-life-${Date.now()}`,
            title: "REKLAM ÖDÜLÜ 📺",
            subtitle: "+1 Can kazandın!",
            icon: "💚",
            accentColor: "#22C55E",
          });
        }
      }
    } catch {
      const res = buyLives(progressRef.current, "ad");
      if (res.success) {
        setProgress(res.updatedProgress);
        void syncProgressToCloud(res.updatedProgress);
        triggerHapticSuccess();
        setGlobalToast({
          id: `ad-life-${Date.now()}`,
          title: "REKLAM ÖDÜLÜ 📺",
          subtitle: "+1 Can kazandın!",
          icon: "💚",
          accentColor: "#22C55E",
        });
      }
    } finally {
      setBuyingLivesLoading(false);
    }
  };

  const livesModalElement = (
    <LivesModal
      visible={showLivesModal}
      progress={progress}
      onClose={() => setShowLivesModal(false)}
      onBuyOne={handleBuyOneLife}
      onRefillAll={handleRefillAllLives}
      onWatchAd={handleWatchAdForLife}
      loading={buyingLivesLoading}
    />
  );

  return {
    showLivesModal,
    setShowLivesModal,
    buyingLivesLoading,
    handleBuyOneLife,
    handleRefillAllLives,
    handleWatchAdForLife,
    livesModalElement,
  };
}
