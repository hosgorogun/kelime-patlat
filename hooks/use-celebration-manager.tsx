import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CelebrationModal,
  type CelebrationModalData,
  getLevelUpDetails,
} from "../components/modals/celebration-modal";
import {
  getCalculatedLives,
  getLeagueTier,
  getPlayerLevel,
  MAX_LIVES,
  type PlayerProgress,
} from "../shared/progression";
import { notificationManager } from "../lib/engagement";
import type { ToastData } from "../components/common/global-game-toast";

export interface UseCelebrationManagerParams {
  progress: PlayerProgress;
  progressReady: boolean;
  screen: string;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  setGlobalToast: (toast: ToastData | null) => void;
  syncProgressToCloud?: (progress: PlayerProgress) => Promise<void>;
}

export function useCelebrationManager({
  progress,
  progressReady,
  screen,
  setProgress,
  setGlobalToast,
  syncProgressToCloud,
}: UseCelebrationManagerParams) {
  const [celebrationQueue, setCelebrationQueue] = useState<CelebrationModalData[]>([]);
  const prevLevelRef = useRef<number | null>(null);
  const prevTierRef = useRef<string | null>(null);
  const lastAwardedLevelRef = useRef<number | null>(null);

  const handleDismissCelebration = useCallback(() => {
    setCelebrationQueue((prev) => prev.slice(1));
  }, []);

  // Reactive Level-up & League Promotion Celebrations
  useEffect(() => {
    if (!progressReady) return;
    const currentLevel = getPlayerLevel(progress.xp);
    const currentTier = getLeagueTier(progress).tier;

    const didLevelUp = prevLevelRef.current !== null && currentLevel > prevLevelRef.current;
    const tierOrder = ["DEMİR", "BRONZ", "GÜMÜŞ", "ALTIN", "PLATİN", "ELMAS", "YÜCELİK", "ÖLÜMSÜZLÜK", "RADIAN"];
    const prevTier = prevTierRef.current;
    const isTierPromo =
      prevTier !== null && currentTier !== prevTier && tierOrder.indexOf(currentTier) > tierOrder.indexOf(prevTier);

    if (didLevelUp || isTierPromo) {
      const newItems: CelebrationModalData[] = [];

      if (didLevelUp) {
        let unlockHint = "Yeni rozetler ve unvanlar açıldı!";
        if (currentLevel === 3) unlockHint = "Yeni Avatar Açıldı: Orbit 🪐";
        else if (currentLevel === 5) unlockHint = "Yeni Mod Açıldı: 6×6 Matris Düellosu ⚡";
        else if (currentLevel === 6) unlockHint = "Yeni Avatar Açıldı: Bilge Sage 🧙";
        else if (currentLevel === 8) unlockHint = "Yeni Mod Açıldı: 8×8 Matris Düellosu 🏆";
        else if (currentLevel === 10) unlockHint = "Yeni Mod Açıldı: 10×10 Matris Düellosu 👑";

        const levelDetails = getLevelUpDetails(currentLevel);

        newItems.push({
          type: "level-up",
          level: currentLevel,
          unlockHint,
          bonusCoins: levelDetails.coins,
        });

        // Seviye atlayınca ödül çiplerini ekle ve canları tamamen tazele
        if (lastAwardedLevelRef.current !== currentLevel) {
          lastAwardedLevelRef.current = currentLevel;
          if (levelDetails.coins > 0) {
            setProgress((curr) => {
              const updated = {
                ...curr,
                coins: (curr.coins ?? 0) + levelDetails.coins,
                lives: MAX_LIVES,
                lastLifeRegenTimestamp: Date.now(),
              };
              void syncProgressToCloud?.(updated);
              return updated;
            });
          }
        }

        setGlobalToast({
          id: `lvl-${currentLevel}-${Date.now()}`,
          title: `SEVİYE ATLADIN! (SEVİYE ${currentLevel})`,
          subtitle: unlockHint,
          icon: "🚀",
          accentColor: "#3EE8B5",
          badge: `LVL ${currentLevel}`,
        });
      }

      if (isTierPromo && prevTier) {
        newItems.push({
          type: "league-promotion",
          previousTier: prevTier,
          newTier: currentTier,
          newLp: progress.lp || 0,
        });

        const tierToastData: ToastData = {
          id: `tier-${currentTier}-${Date.now()}`,
          title: `LİG TERFİSİ! ${currentTier} LİGİ`,
          subtitle: `Harika performans! ${currentTier} ligine yükseldin. Ödüllerini sezon menüsünden incele.`,
          icon: "🏆",
          accentColor: "#FFC24A",
          badge: currentTier,
        };
        if (didLevelUp) {
          setTimeout(() => setGlobalToast(tierToastData), 4500);
        } else {
          setGlobalToast(tierToastData);
        }
      }

      setCelebrationQueue((prev) => [...prev, ...newItems]);
    }

    prevLevelRef.current = currentLevel;
    prevTierRef.current = currentTier;

    // Schedule local push notifications for streak & lives refill
    const livesCalc = getCalculatedLives(progress);
    notificationManager.initAndScheduleReminders(livesCalc.lives, livesCalc.nextLifeTimerSeconds);
  }, [
    progress.xp,
    progress.lp,
    progress.lives,
    progress.lastLifeRegenTimestamp,
    progressReady,
    setProgress,
    setGlobalToast,
  ]);

  const celebrationModalElement = (
    <CelebrationModal
      data={
        screen !== "solo" && screen !== "game" && screen !== "room"
          ? celebrationQueue[0] || null
          : null
      }
      onClose={handleDismissCelebration}
    />
  );

  return {
    celebrationQueue,
    handleDismissCelebration,
    celebrationModalElement,
  };
}
