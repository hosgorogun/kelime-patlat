import { describe, expect, it, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking, Platform } from "react-native";

// 1. Server User Socket Registry
import {
  registerUserSocket,
  unregisterUserSocket,
  getSocketsForUser,
  isUserOnline,
  removeSocketFromAllUsers,
} from "../server/game/user-socket-registry";

// 2. Server Board Builder
import { makeUniqueCode, buildGameBoard } from "../server/game/board-builder";

// 3. Lib Engagement
import {
  notificationManager,
  consentManager,
  reviewManager,
} from "../lib/engagement";

describe("Server Units: User Socket Registry & Board Builder", () => {
  describe("user-socket-registry", () => {
    beforeEach(() => {
      // Clear socket mappings by removing test sockets
      removeSocketFromAllUsers("sock-1");
      removeSocketFromAllUsers("sock-2");
      removeSocketFromAllUsers("sock-3");
    });

    it("kullanıcı soketlerini Türkçe karakter duyarlılığı ile (normalizeTr) kaydetmelidir", () => {
      registerUserSocket("İlker_99", "sock-1");
      // "ilker_99" ile sorgulandığında aynı soket bulunmalıdır
      expect(isUserOnline("ilker_99")).toBe(true);
      expect(isUserOnline("İlker_99")).toBe(true);
      expect(getSocketsForUser("İLKER_99")).toEqual(["sock-1"]);
    });

    it("aynı kullanıcıya birden fazla soket eklenebilmeli ve kaldırılabilmelidir", () => {
      registerUserSocket("Zeynep", "sock-1");
      registerUserSocket("Zeynep", "sock-2");

      const sockets = getSocketsForUser("zeynep");
      expect(sockets).toHaveLength(2);
      expect(sockets).toContain("sock-1");
      expect(sockets).toContain("sock-2");

      unregisterUserSocket("Zeynep", "sock-1");
      expect(getSocketsForUser("zeynep")).toEqual(["sock-2"]);
      expect(isUserOnline("zeynep")).toBe(true);

      unregisterUserSocket("Zeynep", "sock-2");
      expect(isUserOnline("zeynep")).toBe(false);
      expect(getSocketsForUser("zeynep")).toEqual([]);
    });

    it("removeSocketFromAllUsers bağlantısı kopan soketi tüm kullanıcı kayıtlarından silmelidir", () => {
      registerUserSocket("Ahmet", "sock-3");
      expect(isUserOnline("Ahmet")).toBe(true);

      removeSocketFromAllUsers("sock-3");
      expect(isUserOnline("Ahmet")).toBe(false);
    });

    it("boş veya geçersiz kullanıcı adlarında hata fırlatmadan güvenli davranmalıdır", () => {
      expect(isUserOnline("")).toBe(false);
      expect(getSocketsForUser("")).toEqual([]);
      expect(() => registerUserSocket("", "sock-x")).not.toThrow();
      expect(() => unregisterUserSocket("", "sock-x")).not.toThrow();
    });
  });

  describe("board-builder", () => {
    it("makeUniqueCode 5 karakterli ve karışıklık yaratmayan (0, O, 1, I içermeyen) kod üretmelidir", () => {
      const existingCodes = new Set(["ABCDE", "12345"]);
      const code = makeUniqueCode((c) => existingCodes.has(c));

      expect(code).toHaveLength(5);
      expect(code).toMatch(/^[A-Z2-9]{5}$/);
      expect(code).not.toContain("0");
      expect(code).not.toContain("O");
      expect(code).not.toContain("1");
      expect(code).not.toContain("I");
    });

    it("buildGameBoard 4x4, 6x6, 8x8 ve 10x10 boyutlarında eksiksiz çözülebilir tahtalar üretmelidir", () => {
      const sizes: Array<4 | 6 | 8 | 10> = [4, 6, 8, 10];
      for (const size of sizes) {
        const game = buildGameBoard(size);
        expect(game.board).toHaveLength(size * size);
        expect(game.words.length).toBeGreaterThan(0);
        expect(Object.keys(game.routes).length).toBe(game.words.length);

        // Her kelimenin rota indeksleri tahta sınırları içinde olmalıdır
        for (const word of game.words) {
          const route = game.routes[word];
          expect(route).toBeDefined();
          expect(route.length).toBe(word.length);
          for (const idx of route) {
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThan(size * size);
          }
        }
      }
    });
  });
});

describe("Client Lib: Engagement, Consent & Reviews", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe("consentManager", () => {
    it("başlangıçta onayı false olarak okumalı, acceptConsent sonrası true dönmelidir", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
      const isAcceptedBefore = await consentManager.isConsentAccepted();
      expect(isAcceptedBefore).toBe(false);

      await consentManager.acceptConsent();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("kelime-patlat:terms-accepted-v1", "true");
    });
  });

  describe("notificationManager", () => {
    it("aynı gün içinde birden fazla çağrıldığında tekrar bildirim zamanlamamalıdır", async () => {
      const today = new Date().toDateString();
      // İlk çağrıda henüz kaydedilmemiş
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

      await notificationManager.initAndScheduleReminders(5, 0);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "kelime-patlat:last-reminder-scheduled",
        today
      );

      // İkinci çağrıda bugün zaten kaydedilmiş
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(today);
      await notificationManager.initAndScheduleReminders(4, 1800);
      // İkinci çağrıda setItem çağrılmamalıdır
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe("reviewManager", () => {
    it("galibiyet sayısı 3'ten az ise veya Web ortamında değerlendirme diyaloğu açmamalıdır", async () => {
      const alertSpy = vi.spyOn(Alert, "alert");

      // 2 galibiyet (yetersiz)
      await reviewManager.recordVictoryAndCheckPrompt(2);
      expect(alertSpy).not.toHaveBeenCalled();
    });
  });
});
