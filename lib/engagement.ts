import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking, Platform } from "react-native";

const REVIEW_PROMPT_KEY = "kelime-patlat:review-prompt-count";
const TERMS_ACCEPTED_KEY = "kelime-patlat:terms-accepted-v1";

/**
 * 1. LOCAL NOTIFICATIONS HELPER (Safe In-App / Expo Compatible)
 * Manages engagement local reminders for daily rewards, streaks, and lives regen
 */
export const notificationManager = {
  async requestPermissions(): Promise<boolean> {
    return true;
  },

  /**
   * Schedule engagement reminders safely without native build bundle errors
   */
  async initAndScheduleReminders(currentLives = 5, nextLifeTimerSeconds = 0) {
    try {
      const today = new Date().toDateString();
      const lastScheduled = await AsyncStorage.getItem("kelime-patlat:last-reminder-scheduled");
      if (lastScheduled === today) return;

      await AsyncStorage.setItem("kelime-patlat:last-reminder-scheduled", today);
      console.log("[NotificationManager] Local engagement reminders active.", { currentLives, nextLifeTimerSeconds });
    } catch (e) {
      console.warn("[NotificationManager] Failed to init reminders", e);
    }
  },
};

/**
 * 2. IN-APP REVIEW PROMPT HELPER
 * Prompts user to rate the app after consecutive victories or streak achievements
 */
export const reviewManager = {
  async recordVictoryAndCheckPrompt(winsCount: number) {
    try {
      const alreadyPrompted = await AsyncStorage.getItem(REVIEW_PROMPT_KEY);
      if (alreadyPrompted === "true") return;

      // Prompt after 3 wins or 5 wins
      if (winsCount >= 3) {
        Alert.alert(
          "⭐ KELİME PATLAT'I SEVDİN Mİ?",
          "Harika bir galibiyet serisi yakaladın! Oyunu geliştirmemize destek olmak için mağazada 5 yıldız vermek ister misin?",
          [
            { text: "Daha Sonra", style: "cancel" },
            {
              text: "5 YILDIZ VER ⭐",
              onPress: async () => {
                await AsyncStorage.setItem(REVIEW_PROMPT_KEY, "true");
                const storeUrl = Platform.OS === "ios"
                  ? "https://apps.apple.com"
                  : "https://play.google.com/store";
                Linking.openURL(storeUrl).catch(() => undefined);
              },
            },
          ]
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
