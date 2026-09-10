import AsyncStorage from "@react-native-async-storage/async-storage";

// Social System: Friends & Local Notification Manager

export type FriendUser = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  avatarPhoto?: string;
  selectedTitle?: string;
  isOnline: boolean;
  xp: number;
  level?: number;
  lp?: number;
  tier?: string;
  wins?: number;
  matches?: number;
  streak?: number;
  bestScore?: number;
  bestTempo?: number;
};

export const MOCK_FRIENDS: FriendUser[] = [
  { id: "f1", name: "Ege Neon", username: "ege_neon", avatar: "⚡", selectedTitle: "[NEON HAKİMİ]", isOnline: true, xp: 4850, level: 24, lp: 4200, tier: "ELMAS", wins: 38, matches: 45, streak: 8, bestScore: 180, bestTempo: 4.8 },
  { id: "f2", name: "Kaan Kiber", username: "kaan_cyber", avatar: "🤖", selectedTitle: "[GLADYATÖR]", isOnline: true, xp: 3200, level: 16, lp: 2800, tier: "PLATİN", wins: 22, matches: 30, streak: 5, bestScore: 145, bestTempo: 4.1 },
  { id: "f3", name: "Zeynep Matrix", username: "zeynep_m", avatar: "👾", selectedTitle: "[MİMAR]", isOnline: false, xp: 2400, level: 12, lp: 1850, tier: "ALTIN", wins: 15, matches: 22, streak: 3, bestScore: 120, bestTempo: 3.5 },
  { id: "f4", name: "Selin Vektör", username: "selin_vector", avatar: "🔮", selectedTitle: "[İZCİ]", isOnline: true, xp: 1750, level: 9, lp: 1150, tier: "GÜMÜŞ", wins: 10, matches: 18, streak: 4, bestScore: 95, bestTempo: 2.9 },
  { id: "f5", name: "Barış Piksel", username: "baris_pixel", avatar: "🎮", selectedTitle: "[ÇAYLAK]", isOnline: false, xp: 920, level: 5, lp: 450, tier: "BRONZ", wins: 5, matches: 12, streak: 1, bestScore: 70, bestTempo: 2.2 },
];

export const FRIENDS_STORAGE_KEY = "kelime-patlat:friends-list-v1";

class SocialManager {
  private friends: FriendUser[] = [...MOCK_FRIENDS];
  private initialized = false;

  async init(): Promise<FriendUser[]> {
    if (this.initialized) return this.friends;
    try {
      const stored = await AsyncStorage.getItem(FRIENDS_STORAGE_KEY);
      if (stored !== null) {
        // Key exists in storage — trust it, even if it's an empty array
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.friends = parsed;
        }
      }
      // If key was never written (null), keep the default mock friends for demo purposes
    } catch {
      // Fallback to default mock friends if storage fails
    }
    this.initialized = true;
    return this.friends;
  }

  getFriends(): FriendUser[] {
    return this.friends;
  }

  syncFromCloud(cloudFriends?: FriendUser[]): FriendUser[] {
    if (Array.isArray(cloudFriends) && cloudFriends.length > 0) {
      const map = new Map<string, FriendUser>();
      this.friends.forEach((f) => map.set(f.username.toLocaleLowerCase("tr-TR"), f));
      cloudFriends.forEach((f) => map.set(f.username.toLocaleLowerCase("tr-TR"), f));
      this.friends = Array.from(map.values());
      void this.persist();
    }
    return this.friends;
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(this.friends));
    } catch {
      // Ignore storage errors
    }
  }

  addFriend(userOrUsername: string | Partial<FriendUser>): { success: boolean; message: string; friend?: FriendUser } {
    const rawUsername = typeof userOrUsername === "string" ? userOrUsername : userOrUsername.username || userOrUsername.name || "";
    const cleanName = rawUsername.trim();
    if (!cleanName) return { success: false, message: "Geçerli bir kullanıcı adı girin." };
    const exists = this.friends.some((f) => f.username.toLocaleLowerCase("tr-TR") === cleanName.toLocaleLowerCase("tr-TR"));
    if (exists) return { success: false, message: "Bu kullanıcı zaten arkadaş listenizde." };

    const extra = typeof userOrUsername === "object" ? userOrUsername : {};
    const newFriend: FriendUser = {
      id: extra.id || `f_${Date.now()}`,
      name: extra.name || cleanName,
      username: cleanName,
      avatar: extra.avatar || "🎮",
      avatarPhoto: extra.avatarPhoto,
      selectedTitle: extra.selectedTitle || "[ÇAYLAK]",
      isOnline: true,
      xp: extra.xp ?? 500,
      level: extra.level ?? 1,
      lp: extra.lp ?? 0,
      tier: extra.tier ?? "DEMİR",
      wins: extra.wins ?? 0,
      matches: extra.matches ?? 0,
      streak: extra.streak ?? 0,
      bestScore: extra.bestScore ?? 0,
      bestTempo: extra.bestTempo ?? 0,
    };
    this.friends = [newFriend, ...this.friends];
    void this.persist();
    return { success: true, message: `${newFriend.name} arkadaş listenize eklendi!`, friend: newFriend };
  }

  removeFriend(friendId: string): { success: boolean; message: string } {
    const friend = this.friends.find((f) => f.id === friendId);
    if (!friend) return { success: false, message: "Arkadaş bulunamadı." };
    this.friends = this.friends.filter((f) => f.id !== friendId);
    void this.persist();
    return { success: true, message: `${friend.name} arkadaş listenizden çıkarıldı.` };
  }

  scheduleDailyReminderNotification() {
    return { scheduled: true, notificationTime: "20:00" };
  }
}

export const socialManager = new SocialManager();
