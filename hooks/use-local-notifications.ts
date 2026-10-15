import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { getCalculatedLives, MAX_LIVES, type PlayerProgress } from "@/shared/progression";
import { notificationManager } from "@/lib/engagement";
import { notificationsService } from "@/lib/notifications";

/**
 * Yerel Bildirim Zamanlayıcı (Local Life, Daily Reward & Streak Reminder Engine)
 * Oyuncunun canı dolduğunda veya cihaz 30 dakikalık can yenilenmesini tamamladığında
 * arka planda bildirim zamanlamasını senkronize eder.
 */
export function useLocalNotificationEngine(progress?: PlayerProgress) {
  const lastScheduledRef = useRef<number>(0);

  useEffect(() => {
    if (!progress) return;
    if (progress.notificationsEnabled === false) {
      void notificationsService.cancelAll();
      return;
    }

    const checkAndSchedule = () => {
      const now = Date.now();
      // En fazla dakikada bir kontrol yap
      if (now - lastScheduledRef.current < 60000) return;
      lastScheduledRef.current = now;

      const liveInfo = getCalculatedLives(progress);
      void notificationManager.initAndScheduleReminders(
        liveInfo.lives,
        liveInfo.nextLifeTimerSeconds,
        progress.streak || 1
      );
    };

    checkAndSchedule();
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        checkAndSchedule();
      }
    });

    return () => {
      sub.remove();
    };
  }, [progress?.lives, progress?.lastLifeRegenTimestamp, progress?.notificationsEnabled, progress?.streak]);
}
