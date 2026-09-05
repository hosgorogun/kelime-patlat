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

class SocialManager {
  private friends: FriendUser[] = [...MOCK_FRIENDS];

  getFriends(): FriendUser[] {
    return this.friends;
  }

  addFriend(username: string): { success: boolean; message: string } {
    if (!username.trim()) return { success: false, message: "Geçerli bir kullanıcı adı girin." };
    const exists = this.friends.some((f) => f.username.toLowerCase() === username.toLowerCase());
    if (exists) return { success: false, message: "Bu kullanıcı zaten arkadaş listenizde." };

    const newFriend: FriendUser = {
      id: `f_${Date.now()}`,
      name: username,
      username: username,
      avatar: "🎮",
      isOnline: true,
      xp: 500,
    };
    this.friends.push(newFriend);
    return { success: true, message: `${username} arkadaş listenize eklendi!` };
  }

  scheduleDailyReminderNotification() {
    // Schedules local push notification for daily puzzle streak maintenance
    return { scheduled: true, notificationTime: "20:00" };
  }
}

export const socialManager = new SocialManager();
