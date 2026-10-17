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
        console.info(
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

  /**
   * 1. KLASİK GAZETE MODU HATIRLATMASI (Sabah 09:00)
   * Günün 10x10 çengel bulmacası için sabah kahvesi rutini oluşturur.
   */
  async scheduleMorningGazetteNotification() {
    const notifs = await getNotificationsModule();
    if (!notifs) return;
    try {
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) return;

      const now = new Date();
      const morning = new Date();
      morning.setHours(9, 0, 0, 0);

      let delaySeconds = Math.floor((morning.getTime() - now.getTime()) / 1000);
      if (delaySeconds <= 0) {
        delaySeconds += 24 * 3600;
      }

      await notifs.scheduleNotificationAsync({
        content: {
          title: "☕ GÜNÜN GAZETESİ BASILDI!",
          body: "10×10 Çapraz Bulmaca hazır! Kahvenin yanında kelimeleri ilk sen tamamla, 150 Çip kazan!",
          sound: true,
          data: { screen: "vintage" },
        },
        trigger: {
          type: notifs.SchedulableTriggerInputTypes?.TIME_INTERVAL || "timeInterval",
          seconds: delaySeconds,
          repeats: false,
        },
      });
    } catch (e) {
      console.warn("[Notifications] Failed to schedule morning gazette notification:", e);
    }
  },

  /**
   * 2. KELİMEMATİK / GÜNLÜK AV HATIRLATMASI (Akşam 21:15)
   * Günün gizli kelimesi sıfırlanmadan önceki son çağrı.
   */
  async scheduleDailyKelimematikReminder() {
    const notifs = await getNotificationsModule();
    if (!notifs) return;
    try {
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) return;

      const now = new Date();
      const evening = new Date();
      evening.setHours(21, 15, 0, 0);

      let delaySeconds = Math.floor((evening.getTime() - now.getTime()) / 1000);
      if (delaySeconds <= 0) {
        delaySeconds += 24 * 3600;
      }

      await notifs.scheduleNotificationAsync({
        content: {
          title: "⏳ GÜNLÜK KELİMELER SIFIRLANIYOR!",
          body: "Kelimematik çarkı gece yenilenecek! Bugünkü bonus puanları ve gizli harfleri kaçırma!",
          sound: true,
          data: { screen: "kelimematik" },
        },
        trigger: {
          type: notifs.SchedulableTriggerInputTypes?.TIME_INTERVAL || "timeInterval",
          seconds: delaySeconds,
          repeats: false,
        },
      });
    } catch (e) {
      console.warn("[Notifications] Failed to schedule daily kelimematik reminder:", e);
    }
  },

  /**
   * 3. ARCADE / ZAMANA KARŞI ETKİNLİK BİLDİRİMİ (Hafta Sonu 13:00)
   * 60 saniyelik bomba modu ve rekor kırma heyecanını tetikler.
   */
  async scheduleWeekendArcadeNotification() {
    const notifs = await getNotificationsModule();
    if (!notifs) return;
    try {
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) return;

      const now = new Date();
      const target = new Date();
      target.setHours(13, 0, 0, 0);

      let delaySeconds = Math.floor((target.getTime() - now.getTime()) / 1000);
      if (delaySeconds <= 0) {
        delaySeconds += 24 * 3600;
      }

      await notifs.scheduleNotificationAsync({
        content: {
          title: "💣 60 SANİYELİK BOMBA AVI BAŞLADI!",
          body: "Arcade modunda bombaları patlat! 2X çarpanla rekorunu kırıp mega sandığı kap!",
          sound: true,
          data: { screen: "arcade" },
        },
        trigger: {
          type: notifs.SchedulableTriggerInputTypes?.TIME_INTERVAL || "timeInterval",
          seconds: delaySeconds,
          repeats: false,
        },
      });
    } catch (e) {
      console.warn("[Notifications] Failed to schedule arcade notification:", e);
    }
  },

  /**
   * 4. SIRA TABANLI DÜELLO BİLDİRİMİ (Anlık)
   * Rakip oyuncu hamlesini yaptığında anında gönderilir.
   */
  async notifyTurnMatchTurn(opponentName: string) {
    const notifs = await getNotificationsModule();
    if (!notifs) return;
    try {
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) return;

      await notifs.scheduleNotificationAsync({
        content: {
          title: "🎯 SIRA SENDE!",
          body: `${opponentName} hamlesini yaptı! Sıra sende, karşılık ver!`,
          sound: true,
          data: { screen: "online" },
        },
        trigger: null, // Anında göster
      });
    } catch (e) {
      console.warn("[Notifications] Failed to send turn notification:", e);
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

  async registerPushTokenWithServer(authToken: string, apiBaseUrl?: string): Promise<string | null> {
    const notifs = await getNotificationsModule();
    if (!notifs || !authToken || authToken === "guest") return null;
    try {
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) return null;
      let pushToken = "";
      if (notifs.getExpoPushTokenAsync) {
        const response = await notifs.getExpoPushTokenAsync().catch(() => null);
        pushToken = response?.data || "";
      }
      if (!pushToken) return null;
      const baseUrl = apiBaseUrl || (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
      if (!baseUrl) return pushToken;
      await fetch(`${baseUrl}/api/user/push-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ pushToken }),
      }).catch((e) => console.warn("[Notifications] Push token sync failed:", e));
      return pushToken;
    } catch (e) {
      console.warn("[Notifications] Push token registration error:", e);
      return null;
    }
  },
};
