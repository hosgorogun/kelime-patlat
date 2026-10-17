import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking, Platform } from "react-native";

const REVIEW_PROMPT_KEY = "kelime-patlat:review-prompt-count";
const TERMS_ACCEPTED_KEY = "kelime-patlat:terms-accepted-v1";

import { notificationsService } from "./notifications";

/**
 * 1. LOCAL NOTIFICATIONS HELPER (Safe In-App & Native Push)
 * Manages engagement local reminders for daily rewards, streaks, and lives regen
 */
export const notificationManager = {
  /**
   * Schedule engagement reminders safely without native build bundle errors
   */
  async initAndScheduleReminders(currentLives = 5, nextLifeTimerSeconds = 0, streakDays = 1) {
    try {
      const today = new Date().toDateString();
      const lastScheduled = await AsyncStorage.getItem("kelime-patlat:last-reminder-scheduled");
      if (lastScheduled === today) return;

      await AsyncStorage.setItem("kelime-patlat:last-reminder-scheduled", today);
      console.log("[NotificationManager] Local engagement reminders active.", { currentLives, nextLifeTimerSeconds, streakDays });

      if (Platform.OS === "web") return;

      // Temizle ve yeni hatırlatmaları planla
      await notificationsService.cancelAll();

      // 1. Can Dolumu (Canlar 5'in altındaysa tam dolduğu an için zamanla)
      if (currentLives < 5) {
        const missingLives = 5 - currentLives;
        const totalSeconds = Math.max(60, (missingLives - 1) * 1800 + (nextLifeTimerSeconds || 1800));
        await notificationsService.scheduleLivesRefillNotification(totalSeconds);
      }

      // 2. Sabah Gazetesi (09:00 - Vintage Crossword Kahve Rutini)
      await notificationsService.scheduleMorningGazetteNotification();

      // 3. Akşam Altın Saat & Alev Serisi (19:55 Altın Saat, 20:30 Seri Koruma)
      await notificationsService.scheduleRushHourReminder();
      await notificationsService.scheduleEveningStreakReminder(streakDays);

      // 4. Günlük Özel Mod (Hafta sonu ise Arcade Etkinliği, Hafta içi ise Kelimematik)
      const dayOfWeek = new Date().getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (isWeekend) {
        await notificationsService.scheduleWeekendArcadeNotification();
      } else {
        await notificationsService.scheduleDailyKelimematikReminder();
      }
    } catch (e) {
      console.warn("[NotificationManager] Failed to init reminders", e);
    }
  },
};

/**
 * 2. IN-APP REVIEW PROMPT HELPER
 * Prompts user to rate the app after consecutive victories or streak achievements
 */
const REVIEW_POSTPONED_KEY = "kelime-patlat:review-prompt-postponed";

export const reviewManager = {
  async recordVictoryAndCheckPrompt(winsCount: number) {
    if (Platform.OS === "web") return;
    try {
      const alreadyPrompted = await AsyncStorage.getItem(REVIEW_PROMPT_KEY);
      if (alreadyPrompted === "true") return;

      const postponedRaw = await AsyncStorage.getItem(REVIEW_POSTPONED_KEY);
      if (postponedRaw) {
        try {
          const { timestamp, wins } = JSON.parse(postponedRaw);
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          // Ertelemeden sonra en az 7 gün ve en az 15 yeni galibiyet geçmeli
          if (Date.now() - timestamp < sevenDaysMs || winsCount - wins < 15) {
            return;
          }
        } catch {
          // JSON ayrıştırma hatasında devam et
        }
      }

      // İlk kez en az 3 galibiyette sorulur
      if (winsCount >= 3) {
        const postpone = () => {
          AsyncStorage.setItem(
            REVIEW_POSTPONED_KEY,
            JSON.stringify({ timestamp: Date.now(), wins: winsCount })
          ).catch(() => undefined);
        };

        Alert.alert(
          "⭐ KELİME PATLAT'I SEVDİN Mİ?",
          "Harika bir galibiyet serisi yakaladın! Oyunu geliştirmemize destek olmak için mağazada 5 yıldız vermek ister misin?",
          [
            {
              text: "Daha Sonra",
              style: "cancel",
              onPress: postpone,
            },
            {
              text: "5 YILDIZ VER ⭐",
              onPress: async () => {
                await AsyncStorage.setItem(REVIEW_PROMPT_KEY, "true");
                const storeUrl = Platform.OS === "ios"
                  ? "https://apps.apple.com/app/kelime-patlat/id6470000000"
                  : "https://play.google.com/store/apps/details?id=com.kelimepatlat.app";
                Linking.openURL(storeUrl).catch(() => {
                  Linking.openURL("https://kelimepatlat.com").catch(() => undefined);
                });
              },
            },
          ],
          { onDismiss: postpone }
        );
      }
    } catch (e) {
      console.warn("[ReviewManager] Failed to check review prompt", e);
    }
  },
};

/**
 * 3. TERMS & PRIVACY CONSENT HELPER
 */
export const consentManager = {
  async isConsentAccepted(): Promise<boolean> {
    try {
      const accepted = await AsyncStorage.getItem(TERMS_ACCEPTED_KEY);
      return accepted === "true";
    } catch {
      return false;
    }
  },

  async acceptConsent(): Promise<void> {
    try {
      await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, "true");
    } catch (e) {
      console.warn("[ConsentManager] Failed to save consent", e);
    }
  },
};
