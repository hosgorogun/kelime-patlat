import { Platform } from "react-native";

let NotificationsModule: any = null;
let expoGoWarningLogged = false;

export async function getNotificationsModule() {
  if (Platform.OS === "web") return null;

  // Expo SDK 53+ removed remote push notifications from Expo Go on Android.
  // Importing expo-notifications inside Expo Go on Android triggers DevicePushTokenAutoRegistration.fx
  // which calls addPushTokenListener -> warnOfExpoGoPushUsage and throws an unhandled Error.
  try {
    const { isRunningInExpoGo } = await import("expo");
    if (isRunningInExpoGo && isRunningInExpoGo() && Platform.OS === "android") {
      if (!expoGoWarningLogged) {
        expoGoWarningLogged = true;
        console.warn(
          "[Notifications] Expo Go (Android) detected: expo-notifications dynamic import is bypassed to avoid SDK 53 crash. Use a development build (expo run:android / EAS Build) for native notifications."
        );
      }
      return null;
    }
  } catch {
    // ignore detection failure
  }

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

  async scheduleEveningStreakReminder(streakDays = 1) {
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
          title: `🔥 ${streakDays} GÜNLÜK SERİN YANMAK ÜZERE!`,
          body: "Gece 00:00 olmadan hemen 1 kelime bul ve alevini söndürme!",
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

  async scheduleRushHourReminder() {
    const notifs = await getNotificationsModule();
    if (!notifs) return;
    try {
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) return;

      const now = new Date();
      const rushHour = new Date();
      rushHour.setHours(19, 55, 0, 0); // 19:55'te haber ver (5 dk önce)

      let delaySeconds = Math.floor((rushHour.getTime() - now.getTime()) / 1000);
      if (delaySeconds <= 0) {
        delaySeconds += 24 * 3600;
      }

      await notifs.scheduleNotificationAsync({
        content: {
          title: "⚡ ALTIN SAAT BAŞLAMAK ÜZERE! (20:00)",
          body: "20:00 - 21:00 arası tüm PvP maçlarında 2X LİG PUANI (LP) aktif! Sıralamada yüksel!",
          sound: true,
          data: { screen: "pvp" },
        },
        trigger: {
          type: notifs.SchedulableTriggerInputTypes?.TIME_INTERVAL || "timeInterval",
          seconds: delaySeconds,
          repeats: false,
        },
      });
    } catch (e) {
      console.warn("[Notifications] Failed to schedule rush hour reminder:", e);
    }
  },

  async notifyRivalOvertake(rivalName: string) {
    const notifs = await getNotificationsModule();
    if (!notifs) return;
    try {
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) return;

      await notifs.scheduleNotificationAsync({
        content: {
          title: "⚔️ LİGDE GERİYE DÜŞTÜN!",
          body: `${rivalName} az önce seni ligde geçti! Sıranı hemen geri alabilecek misin?`,
          sound: true,
          data: { screen: "leaderboard" },
        },
        trigger: null, // Anında göster
      });
    } catch (e) {
      console.warn("[Notifications] Failed to send rival overtake notification:", e);
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
