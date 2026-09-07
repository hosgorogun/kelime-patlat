import AsyncStorage from "@react-native-async-storage/async-storage";

// Social System: Friends & Local Notification Manager

export type FriendUser = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  xp: number;
};

export const MOCK_FRIENDS: FriendUser[] = [
  { id: "f1", name: "Kaan Kiber", username: "kaan_cyber", avatar: "🤖", isOnline: true, xp: 2400 },
  { id: "f2", name: "Zeynep Matrix", username: "zeynep_m", avatar: "👾", isOnline: false, xp: 1950 },
  { id: "f3", name: "Ege Neon", username: "ege_neon", avatar: "⚡", isOnline: true, xp: 3100 },
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

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(this.friends));
    } catch {
      // Ignore storage errors
    }
  }

  addFriend(username: string): { success: boolean; message: string; friend?: FriendUser } {
    const cleanName = username.trim();
    if (!cleanName) return { success: false, message: "Geçerli bir kullanıcı adı girin." };
    const exists = this.friends.some((f) => f.username.toLocaleLowerCase("tr-TR") === cleanName.toLocaleLowerCase("tr-TR"));
    if (exists) return { success: false, message: "Bu kullanıcı zaten arkadaş listenizde." };

    const newFriend: FriendUser = {
      id: `f_${Date.now()}`,
      name: cleanName,
      username: cleanName,
      avatar: "🎮",
      isOnline: true,
      xp: 500,
    };
    this.friends = [newFriend, ...this.friends];
    void this.persist();
    return { success: true, message: `${cleanName} arkadaş listenize eklendi!`, friend: newFriend };
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
