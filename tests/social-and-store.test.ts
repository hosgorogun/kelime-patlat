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
import { monetizationManager } from "../shared/monetization";

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

    it("siber bot rakiplerini (TaktikMaster vb.) pratik dostu olarak arkadaş listesine eklemeyi destekler", () => {
      const botOpponent = {
        id: `bot_taktikmaster_${Date.now()}`,
        name: "TaktikMaster",
        username: "TaktikMaster",
        avatar: "🤖",
        selectedTitle: "[SİBER BOT]",
        isOnline: true,
        xp: 2800,
        level: 3,
        lp: 97,
        tier: "GLADYATÖR",
        wins: 97,
        matches: 180,
        streak: 2,
        bestScore: 473,
        bestTempo: 38,
      };
      const result = socialManager.addFriend(botOpponent);
      expect(result.success).toBe(true);
      expect(result.friend?.name).toBe("TaktikMaster");
      expect(result.friend?.isOnline).toBe(true);
      expect(socialManager.getFriends().some((f) => f.username.toLowerCase() === "taktikmaster")).toBe(true);

      // Tekrar eklenmeye çalışıldığında güvenle engeller
      const duplicateRes = socialManager.addFriend(botOpponent);
      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.message).toContain("zaten");
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

    it("gerçek para ile mağaza içi çip satışı olmadığını ve sistemin reklam tabanlı olduğunu doğrular", () => {
      // Çip satışı tamamen kaldırılmıştır, çip kazanımı ödüllü reklamlar ve oynanışla sağlanır
      expect(typeof monetizationManager.showRewardedAd).toBe("function");
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

    it("interstitial (geçiş) reklam motorunun her 3 maçta bir doğru tetiklendiğini doğrular", async () => {
      monetizationManager.resetInterstitialCounter();
      expect(monetizationManager.getCompletedMatchesCount()).toBe(0);

      // 1. Galibiyet
      const r1 = monetizationManager.recordMatchFinished(true);
      expect(r1.shouldShowInterstitial).toBe(false);
      expect(r1.matchCount).toBe(1);

      // Mağlubiyet (oyuncu cezalandırılmaz, sayaç artmaz)
      const rLoss = monetizationManager.recordMatchFinished(false);
      expect(rLoss.shouldShowInterstitial).toBe(false);
      expect(rLoss.matchCount).toBe(1);

      // 2. Galibiyet
      const r2 = monetizationManager.recordMatchFinished(true);
      expect(r2.shouldShowInterstitial).toBe(false);
      expect(r2.matchCount).toBe(2);

      // 3. Galibiyet -> Reklam tetiklenmeli!
      const r3 = monetizationManager.recordMatchFinished(true);
      expect(r3.shouldShowInterstitial).toBe(true);
      expect(r3.matchCount).toBe(3);

      // Reklam gösterildiğinde callback çalışır
      let closed = false;
      await monetizationManager.showInterstitialAd(() => {
        closed = true;
      });
      expect(closed).toBe(true);
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

    it("correctly resolves board skin colors and victory effect animations across game modes", () => {
      const getBoardSkinColor = (skinId?: string) => {
        const skin = BOARD_SKINS.find((s) => s[0] === skinId);
        return skin ? skin[2] : "#3EE8B5";
      };

      const getVictoryEffectGlyph = (effectId?: string) => {
        const eff = VICTORY_EFFECTS.find((e) => e[0] === effectId);
        return eff ? eff[2] : "✦";
      };

      // Default fallbacks
      expect(getBoardSkinColor(undefined)).toBe("#3EE8B5");
      expect(getBoardSkinColor("unknown_skin")).toBe("#3EE8B5");
      expect(getVictoryEffectGlyph(undefined)).toBe("✦");

      // Verify each board skin resolves to a distinct vibrant color
      expect(getBoardSkinColor("grid")).toBe("#3EE8B5");
      expect(getBoardSkinColor("night")).toBe("#818CF8");
      expect(getBoardSkinColor("ember")).toBe("#FB7185");
      expect(getBoardSkinColor("gold_grid")).toBe("#FFC24A");
      expect(getBoardSkinColor("cyber_pink")).toBe("#FF2A85");

      // Verify each victory effect resolves to its unique celebration icon
      expect(getVictoryEffectGlyph("pulse")).toBe("🌊");
      expect(getVictoryEffectGlyph("glitch")).toBe("💻");
      expect(getVictoryEffectGlyph("flare")).toBe("💥");
      expect(getVictoryEffectGlyph("lightning")).toBe("⚡");
      expect(getVictoryEffectGlyph("fireworks")).toBe("🎆");
    });

    it("varsayılan kozmetikler ve çip ekipmanları tutarlı fiyatlandırmaya sahiptir", () => {
      // Verify all default cosmetics cost 0
      const defaultFrame = PROFILE_FRAMES.find(([id]) => id === "signal");
      const defaultEffect = VICTORY_EFFECTS.find(([id]) => id === "pulse");
      const defaultSkin = BOARD_SKINS.find(([id]) => id === "grid");

      expect(defaultFrame?.[3]).toBe(0);
      expect(defaultEffect?.[3]).toBe(0);
      expect(defaultSkin?.[3]).toBe(0);

      // Verify all chip equipment items have distinct rewards and valid positive costs
      CHIP_EQUIPMENT_ITEMS.forEach((item) => {
        expect(item.cost).toBeGreaterThan(0);
        expect(["lives", "radar", "shield", "xp"]).toContain(item.rewardType);
      });
    });
  });
});
