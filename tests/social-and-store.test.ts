import { describe, expect, it, vi, beforeEach } from "vitest";

// In-memory AsyncStorage mock for SocialManager testing
const storageMap = new Map<string, string>();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storageMap.get(key) ?? null),
    setItem: vi.fn(async (key: string, val: string) => { storageMap.set(key, val); }),
    removeItem: vi.fn(async (key: string) => { storageMap.delete(key); }),
  },
}));

import { socialManager, MOCK_FRIENDS } from "../shared/social";
import { CHIP_EQUIPMENT_ITEMS, PROFILE_FRAMES, VICTORY_EFFECTS, BOARD_SKINS } from "../shared/store-items";
import { DIGITAL_STORE_PRODUCTS, monetizationManager } from "../shared/monetization";

describe("Sosyal ve Mağaza Sistemi Testleri", () => {
  beforeEach(() => {
    storageMap.clear();
  });

  describe("SocialManager (Arkadaş Listesi ve Sosyal Özellikler)", () => {
    it("varsayılan arkadaş listesini başarıyla başlatır ve getirir", async () => {
      const friends = await socialManager.init();
      expect(friends).toBeDefined();
      expect(friends.length).toBeGreaterThanOrEqual(MOCK_FRIENDS.length);
      expect(socialManager.getFriends()).toEqual(friends);
    });

    it("yeni arkadaş ekleme başarılı olur ve listeye eklenir", () => {
      const uniqueUsername = `test_player_${Date.now()}`;
      const result = socialManager.addFriend(uniqueUsername);
      expect(result.success).toBe(true);
      expect(result.friend?.username).toBe(uniqueUsername);
      expect(socialManager.getFriends().some((f) => f.username === uniqueUsername)).toBe(true);
    });

    it("tam profil nesnesiyle arkadaş eklemeyi ve istatistikleri doğru bağlamayı destekler", () => {
      const profileUser = {
        id: `usr_${Date.now()}`,
        name: "Neon Siber",
        username: `neon_siber_${Date.now()}`,
        avatar: "⚡",
        selectedTitle: "[RADYANT]",
        level: 42,
        tier: "YÜCELİK" as const,
        lp: 5400,
        wins: 65,
        matches: 80,
      };
      const result = socialManager.addFriend(profileUser);
      expect(result.success).toBe(true);
      expect(result.friend?.id).toBe(profileUser.id);
      expect(result.friend?.name).toBe("Neon Siber");
      expect(result.friend?.tier).toBe("YÜCELİK");
      expect(result.friend?.lp).toBe(5400);
      expect(result.friend?.level).toBe(42);
    });

    it("boş kullanıcı adı eklenmesini engeller", () => {
      const result = socialManager.addFriend("   ");
      expect(result.success).toBe(false);
      expect(result.message).toBe("Geçerli bir kullanıcı adı girin.");
    });

    it("zaten ekli olan arkadaşın tekrar eklenmesini engeller (büyük/küçük harf duyarsız)", () => {
      const friends = socialManager.getFriends();
      const existing = friends[0]!.username;
      const result = socialManager.addFriend(existing.toUpperCase());
      expect(result.success).toBe(false);
      expect(result.message).toBe("Bu kullanıcı zaten arkadaş listenizde.");
    });

    it("arkadaşı listeden başarıyla çıkarır", () => {
      const username = `to_remove_${Date.now()}`;
      const addRes = socialManager.addFriend(username);
      expect(addRes.friend).toBeDefined();

      const removeRes = socialManager.removeFriend(addRes.friend!.id);
      expect(removeRes.success).toBe(true);
      expect(socialManager.getFriends().some((f) => f.id === addRes.friend!.id)).toBe(false);
    });

    it("olmayan bir arkadaş silinmek istendiğinde hata mesajı döner", () => {
      const removeRes = socialManager.removeFriend("non_existent_id_9999");
      expect(removeRes.success).toBe(false);
      expect(removeRes.message).toBe("Arkadaş bulunamadı.");
    });

    it("günlük hatırlatma bildirimi planını doğrular", () => {
      const reminder = socialManager.scheduleDailyReminderNotification();
      expect(reminder.scheduled).toBe(true);
      expect(reminder.notificationTime).toBe("20:00");
    });
  });

  describe("Siber Mağaza ve Çip Ekipmanları", () => {
    it("tüm çip ekipmanlarının benzersiz kimlik, geçerli maliyet ve ödül tipine sahip olduğunu doğrular", () => {
      expect(CHIP_EQUIPMENT_ITEMS.length).toBeGreaterThanOrEqual(3);
      const ids = CHIP_EQUIPMENT_ITEMS.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);

      CHIP_EQUIPMENT_ITEMS.forEach((item) => {
        expect(item.cost).toBeGreaterThan(0);
        expect(item.name).toBeTruthy();
        expect(item.description).toBeTruthy();
        expect(["radar", "shield", "xp", "lives"]).toContain(item.rewardType);
      });
    });

    it("dijital mağaza ürünlerinin fiyat ve çip değerlerini doğrular", () => {
      expect(DIGITAL_STORE_PRODUCTS.length).toBeGreaterThanOrEqual(4);
      DIGITAL_STORE_PRODUCTS.forEach((product) => {
        expect(product.id).toBeTruthy();
        expect(product.name).toBeTruthy();
        expect(product.priceText).toMatch(/^₺/);
        expect(["coin_pack", "theme", "radar_pack"]).toContain(product.type);
      });
    });

    it("satın alma altyapısı henüz aktif değilken güvenli hata döner", async () => {
      const result = await monetizationManager.purchaseProduct("coins_small");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Satın alma altyapısı henüz etkin değil.");

      const invalidResult = await monetizationManager.purchaseProduct("unknown_product");
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toBe("Ürün bulunamadı.");
    });

    it("ödüllü reklam kullanılamadığında onError callback'ini tetikler", async () => {
      let errorReceived = "";
      await monetizationManager.showRewardedAd(
        "radar_charge",
        () => {},
        (err) => { errorReceived = err; }
      );
      expect(errorReceived).toBe("Ödüllü reklam şu anda kullanılamıyor.");
    });

    it("tüm kozmetik kataloglarının (çerçeveler, zafer efektleri, tahta temaları) geçerli ID ve fiyatlara sahip olduğunu doğrular", () => {
      expect(PROFILE_FRAMES.length).toBeGreaterThanOrEqual(5);
      PROFILE_FRAMES.forEach(([id, name, color, price]) => {
        expect(id).toBeTruthy();
        expect(name).toBeTruthy();
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(price).toBeGreaterThanOrEqual(0);
      });

      expect(VICTORY_EFFECTS.length).toBeGreaterThanOrEqual(5);
      VICTORY_EFFECTS.forEach(([id, name, glyph, price]) => {
        expect(id).toBeTruthy();
        expect(name).toBeTruthy();
        expect(glyph).toBeTruthy();
        expect(price).toBeGreaterThanOrEqual(0);
      });

      expect(BOARD_SKINS.length).toBeGreaterThanOrEqual(5);
      BOARD_SKINS.forEach(([id, name, color, price]) => {
        expect(id).toBeTruthy();
        expect(name).toBeTruthy();
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(price).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
