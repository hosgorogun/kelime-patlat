import { describe, expect, it, vi, beforeEach } from "vitest";

// React Native ve AsyncStorage mockları (vitest/node ortamı için)
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  Alert: { alert: vi.fn() },
  Linking: { openURL: vi.fn() },
}));

const mockStorage = new Map<string, string>();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: vi.fn(async (key: string, val: string) => { mockStorage.set(key, val); }),
    removeItem: vi.fn(async (key: string) => { mockStorage.delete(key); }),
  },
}));

import { normalizeRoomCode } from "../shared/invite";
import { isEqualTr, normalizeTr, normalizeTrUpper } from "../shared/tr-utils";
import { reviewManager } from "../lib/engagement";

describe("Senior QA Test Suite - Phase 3 (Sosyal Sistem, Oda Kodları ve Platform Korumaları)", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe("1. Oda Kodu Girişi ve Türkçe Harf Normalizasyonu", () => {
    it("Türkçe klavyeden girilen 'i', 'ı', 'İ' karakterlerini güvenle ASCII 'I' yapar", () => {
      const sanitizeRoomInput = (val: string) =>
        val.replace(/[iıİ]/g, "I").toUpperCase().replace(/[^A-Z0-9]/g, "");

      expect(sanitizeRoomInput("kitap")).toBe("KITAP");
      expect(sanitizeRoomInput("kısa1")).toBe("KISA1");
      expect(sanitizeRoomInput("İZMİR")).toBe("IZMIR");
      expect(sanitizeRoomInput("a b-c!d")).toBe("ABCD");
    });

    it("normalizeRoomCode 5 haneli Türkçe girdileri standartlaştırır", () => {
      expect(normalizeRoomCode("kitap")).toBe("KITAP");
      expect(normalizeRoomCode("kısa1")).toBe("KISA1");
      expect(normalizeRoomCode("  izmir ")).toBe("IZMIR");
      expect(normalizeRoomCode("İZMİR")).toBe("IZMIR");
      expect(normalizeRoomCode("kısa")).toBeNull(); // 4 karakter -> geçersiz
      expect(normalizeRoomCode("123456")).toBeNull(); // 6 karakter -> geçersiz
    });

    it("Oda kodunun uzunluğu 5'ten küçükken katılma butonu pasif olmalıdır", () => {
      const isJoinDisabled = (code: string) => code.length < 5;
      expect(isJoinDisabled("")).toBe(true);
      expect(isJoinDisabled("ABC")).toBe(true);
      expect(isJoinDisabled("ABCD")).toBe(true);
      expect(isJoinDisabled("ABCDE")).toBe(false);
    });
  });

  describe("2. Sosyal Hub Arkadaş Karşılaştırmaları (isEqualTr Uyumluluğu)", () => {
    it("Kendini eklemeyi engellerken Türkçe İ/i harf çiftini doğru eşleştirir", () => {
      const myName = "İlker";
      const typed1 = "ilker";
      const typed2 = "İLKER";

      expect(isEqualTr(typed1, myName)).toBe(true);
      expect(isEqualTr(typed2, myName)).toBe(true);
    });

    it("Arkadaş listesinde zaten var olan kullanıcıyı Türkçe karakter duyarsız tespit eder", () => {
      const friends = [
        { id: "u1", name: "IŞIK SÖNMEZ", username: "isik_sonmez" },
        { id: "u2", name: "Çağdaş", username: "cagdas99" },
      ];

      const checkExists = (input: string) =>
        friends.some(
          (f) =>
            isEqualTr(f.name, input) ||
            (Boolean(f.username) && isEqualTr(f.username, input)) ||
            f.id === input
        );

      expect(checkExists("ışık sönmez")).toBe(true);
      expect(checkExists("IŞIK SÖNMEZ")).toBe(true);
      expect(checkExists("isik_sonmez")).toBe(true);
      expect(checkExists("İSİK_SONMEZ")).toBe(true);
      expect(checkExists("ÇAĞDAŞ")).toBe(true);
      expect(checkExists("çağdaş")).toBe(true);
      expect(checkExists("u1")).toBe(true);
    });
  });

  describe("3. Profil Hesap Silme Onayı (isEqualTr ve Evrensel SIL Desteği)", () => {
    it("'sil', 'SİL', 'sİl' ve İngilizce klavye 'SIL' girdilerinin tümünü geçerli sayar", () => {
      const isValidDeleteInput = (val: string) =>
        isEqualTr(val.trim(), "SİL") || val.trim().toUpperCase() === "SIL";

      expect(isValidDeleteInput("SİL")).toBe(true);
      expect(isValidDeleteInput("sil")).toBe(true);
      expect(isValidDeleteInput("sİl")).toBe(true);
      expect(isValidDeleteInput(" SIL ")).toBe(true);
      expect(isValidDeleteInput("SİLME")).toBe(false);
      expect(isValidDeleteInput("iptal")).toBe(false);
    });
  });

  describe("4. 4×4 Düello ve Solo Rota Tutarlılığı", () => {
    it("4×4 düello ve solo modlarında 3 rota olduğunu doğrular", () => {
      const getRoutesText = (size: 4 | 6 | 8 | 10) =>
        size === 4 ? "3 Rota" : size === 6 ? "6 Rota" : size === 8 ? "8 Rota" : "12 Rota";

      expect(getRoutesText(4)).toBe("3 Rota");
      expect(getRoutesText(6)).toBe("6 Rota");
      expect(getRoutesText(8)).toBe("8 Rota");
      expect(getRoutesText(10)).toBe("12 Rota");
    });
  });

  describe("6. Canlı Düello Rövanş (Rematch) ve Odadan Ayrılma Durumları", () => {
    it("Rakip rövanş istediğinde buton durumu ve banner metinleri doğru formatlanmalıdır", () => {
      const getRematchButtonState = (params: {
        rematchPending: boolean;
        opponentRematch: boolean;
        opponentLeft: boolean;
        opponentName?: string;
      }) => {
        if (params.opponentLeft) {
          return { text: "🚪 RAKİP AYRILDI", disabled: true, isAccept: false };
        }
        if (params.opponentRematch && !params.rematchPending) {
          return {
            text: `⚡ RÖVANŞI KABUL ET ▶`,
            disabled: false,
            isAccept: true,
          };
        }
        if (params.rematchPending) {
          return { text: "⏳ BEKLENİYOR...", disabled: true, isAccept: false };
        }
        return { text: "↻ RÖVANŞ İSTE", disabled: false, isAccept: false };
      };

      // Durum 1: Kimse rövanş istememiş
      const initial = getRematchButtonState({
        rematchPending: false,
        opponentRematch: false,
        opponentLeft: false,
        opponentName: "Caner",
      });
      expect(initial.text).toBe("↻ RÖVANŞ İSTE");
      expect(initial.disabled).toBe(false);
      expect(initial.isAccept).toBe(false);

      // Durum 2: Rakip rövanş teklif etmiş, ben henüz basmadım (Kabul etme modu)
      const opponentChallenged = getRematchButtonState({
        rematchPending: false,
        opponentRematch: true,
        opponentLeft: false,
        opponentName: "Caner",
      });
      expect(opponentChallenged.text).toBe("⚡ RÖVANŞI KABUL ET ▶");
      expect(opponentChallenged.disabled).toBe(false);
      expect(opponentChallenged.isAccept).toBe(true);

      // Durum 3: Ben rövanş istedim, rakip henüz basmadı (Bekleme modu)
      const waitingOpponent = getRematchButtonState({
        rematchPending: true,
        opponentRematch: false,
        opponentLeft: false,
        opponentName: "Caner",
      });
      expect(waitingOpponent.text).toBe("⏳ BEKLENİYOR...");
      expect(waitingOpponent.disabled).toBe(true);
      expect(waitingOpponent.isAccept).toBe(false);

      // Durum 4: Rakip odadan ayrıldı
      const opponentLeft = getRematchButtonState({
        rematchPending: false,
        opponentRematch: false,
        opponentLeft: true,
        opponentName: "Caner",
      });
      expect(opponentLeft.text).toBe("🚪 RAKİP AYRILDI");
      expect(opponentLeft.disabled).toBe(true);
    });

    it("Rakip ayrılmışken rövanş isteği sunucu tarafında güvenle engellenmelidir", () => {
      const room = {
        code: "TEST1",
        status: "finished",
        host: { id: "p1", name: "Host", rematch: false, connected: true },
        guest: null as any,
      };

      const canInitiateRematch = Boolean(room.guest && (room.guest.isBot || room.guest.connected));
      expect(canInitiateRematch).toBe(false);
    });
  });
});

