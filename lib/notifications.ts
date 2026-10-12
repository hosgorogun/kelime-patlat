import { Platform } from "react-native";

// Safe wrapper around expo-notifications so it never crashes Metro, web or dev environments
let NotificationsModule: any = null;

export async function getNotificationsModule() {
  if (Platform.OS === "web") return null;
  if (!NotificationsModule) {
    try {
      NotificationsModule = await import("expo-notifications");
      // Set foreground notification presentation handler
      if (NotificationsModule?.setNotificationHandler) {
        NotificationsModule.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      }
    } catch (e) {
      console.warn("[Notifications] Native expo-notifications module not loaded in current runtime:", e);
      return null;
    }
  }
  return NotificationsModule;
}

export const notificationsService = {
  async requestPermissions(): Promise<boolean> {
    const notifs = await getNotificationsModule();
    if (!notifs) return false;
    try {
      const { status: existingStatus } = await notifs.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await notifs.requestPermissionsAsync();
        finalStatus = status;
      }
      if (Platform.OS === "android" && notifs.setNotificationChannelAsync) {
        await notifs.setNotificationChannelAsync("game-reminders", {
          name: "Oyun Hatırlatıcıları",
          importance: notifs.AndroidImportance?.HIGH ?? 4,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#38BDF8",
        });
      }
      return finalStatus === "granted";
    } catch {
      return false;
    }
  },

  async scheduleLivesRefillNotification(secondsUntilFull: number) {
    const notifs = await getNotificationsModule();
    if (!notifs) return;
    try {
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) return;

      await notifs.scheduleNotificationAsync({
        content: {
          title: "💚 CANLARIN TAMAMEN DOLDU!",
          body: "Kelime avı için tüm canların yenilendi (5/5). Hemen yeni bir maça başla!",
          sound: true,
          data: { screen: "home" },
        },
        trigger: {
          type: notifs.SchedulableTriggerInputTypes?.TIME_INTERVAL || "timeInterval",
          seconds: Math.max(60, secondsUntilFull),
          repeats: false,
        },
      });
    } catch (e) {
      console.warn("[Notifications] Failed to schedule lives notification:", e);
    }
  },

  async scheduleEveningStreakReminder() {
    const notifs = await getNotificationsModule();
    if (!notifs) return;
    try {
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) return;

      const now = new Date();
      const evening = new Date();
      evening.setHours(20, 30, 0, 0);

      let delaySeconds = Math.floor((evening.getTime() - now.getTime()) / 1000);
      if (delaySeconds <= 0) {
        delaySeconds += 24 * 3600;
      }

      await notifs.scheduleNotificationAsync({
        content: {
          title: "🔥 GÜNLÜK SERİNİ KAYBETME!",
          body: "Günün kelime rotası ve ödülleri seni bekliyor. Serini korumak için 1 tur tamamla!",
          sound: true,
          data: { screen: "missions" },
        },
        trigger: {
          type: notifs.SchedulableTriggerInputTypes?.TIME_INTERVAL || "timeInterval",
          seconds: delaySeconds,
          repeats: false,
        },
      });
    } catch (e) {
      console.warn("[Notifications] Failed to schedule evening reminder:", e);
    }
  },

  async cancelAll() {
    const notifs = await getNotificationsModule();
    if (!notifs) return;
    try {
      await notifs.cancelAllScheduledNotificationsAsync();
    } catch {
      // ignore
    }
  },
};
