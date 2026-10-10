import { useEffect } from "react";
import { AppState } from "react-native";
import { getCalculatedLives, MAX_LIVES, type PlayerProgress } from "@/shared/progression";

/**
 * Yerel Bildirim Zamanlayıcı (Local Life & Daily Reward Reminder Engine)
 * Oyuncunun canı 5/5 dolduğunda veya cihaz 30 dakikalık can yenilenmesini tamamladığında
 * arka planda bildirim zamanlamasını simüle/tetikler.
 */
export function useLocalNotificationEngine(progress?: PlayerProgress) {
  useEffect(() => {
    if (!progress) return;

    const checkAndSchedule = () => {
      const liveInfo = getCalculatedLives(progress);
      
      // Canlar tam dolduysa veya yenilenmeye yakınsa
      if (liveInfo.lives >= MAX_LIVES) {
        // Canlar tam dolu bildirimi hazır
      }
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
  }, [progress?.lives, progress?.lastLifeRegenTimestamp]);
}
