import { describe, expect, it } from "vitest";

import { VISUAL_THEMES, getThemeForLevel } from "../shared/themes";
import { getWordDefinition } from "../shared/dictionary";
import { normalizeRoomCode, inviteMessage } from "../shared/invite";

describe("Görsel Temalar, Sözlük ve Davet Sistemi Testleri", () => {
  describe("Görsel Temalar (shared/themes.ts)", () => {
    it("tüm temaların eksiksiz renk paletine sahip olduğunu doğrular", () => {
      const themeKeys = Object.keys(VISUAL_THEMES);
      expect(themeKeys).toEqual(["standard", "space", "cyber", "retro"]);

      themeKeys.forEach((key) => {
        const theme = VISUAL_THEMES[key]!;
        expect(theme.id).toBe(key);
        expect(theme.name).toBeTruthy();
        expect(theme.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(theme.surface).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(theme.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(theme.text).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(theme.trayBackground).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(theme.cellBorder).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it("seviye aralıklarına göre doğru temayı döndürür", () => {
      expect(getThemeForLevel(1).id).toBe("standard");
      expect(getThemeForLevel(15).id).toBe("standard");

      expect(getThemeForLevel(16).id).toBe("space");
      expect(getThemeForLevel(40).id).toBe("space");

      expect(getThemeForLevel(41).id).toBe("cyber");
      expect(getThemeForLevel(70).id).toBe("cyber");

      expect(getThemeForLevel(71).id).toBe("retro");
      expect(getThemeForLevel(100).id).toBe("retro");
    });
  });

    it("tanımlı kelimelerin anlamlarını Türkçe karakter duyarlılığıyla doğru döndürür", () => {
      expect(getWordDefinition("GÖL")).toContain("su birikintisi");
      expect(getWordDefinition("göl")).toContain("su birikintisi"); // Küçük harf desteği
      expect(getWordDefinition("ELMA")).toContain("meyve");
      expect(getWordDefinition("ORMAN")).toContain("ekosistem");
      expect(getWordDefinition("BAKLAVA")).toContain("tatlı");
      expect(getWordDefinition("İÇECEK")).toContain("sıvı gıda");
      expect(getWordDefinition("icecek")).toContain("sıvı gıda");
      expect(getWordDefinition("ICECEK")).toContain("sıvı gıda");
      expect(getWordDefinition("ruzgar")).toContain("yatay hareketi");
      expect(getWordDefinition("GURME")).toContain("lezzet uzmanı");
    });

    it("sözlükte yer almayan kelimeler için güvenli yedek açıklama üretir", () => {
      const fallback = getWordDefinition("UZAYGEMİSİ");
      expect(fallback).toContain("Kelime Patlat ile kelime dağarcığını zenginleştir");
      const emptyFallback = getWordDefinition("   ");
      expect(emptyFallback).toContain("Kelime Patlat");
    });

    it("tüm kelime kataloğunun (WORD_CATALOG_DATA) Türkçe harfler ve min 3 uzunluğunda olduğunu doğrular", async () => {
      const { WORD_CATALOG_DATA } = await import("../shared/word-catalog");
      const TR_REGEX = /^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/;
      for (const entry of WORD_CATALOG_DATA.words) {
        expect(TR_REGEX.test(entry.word)).toBe(true);
        expect(entry.word.length).toBeGreaterThanOrEqual(3);
        expect(entry.word.length).toBeLessThanOrEqual(15);
      }
    });

    it("PESEK, UŞAKLI, BEŞİRİ, ÇOKÇA ve il/ilçe demomimlerinin kelime havuzundan kesinlikle çıkarıldığını doğrular", async () => {
      const { WORD_CATALOG_DATA, WORD_BANK } = await import("../shared/word-catalog");
      const catalogSet = new Set(WORD_CATALOG_DATA.words.map((w) => w.word));
      const forbidden = [
        "PESEK", "UŞAKLI", "BEŞİRİ", "ÇOKÇA", "KÜTAHYALI", "DÜZCELİ", "ADANALI", "ANTALYALI", "AĞRILI",
        "BURDURLU", "RİZELİ", "MERSİNLİ", "AKSARAYLI", "HATAYLI", "AMASYALI", "BAYBURTLU",
        "ARTVİNLİ", "TRABZONLU", "KIRŞEHİRLİ", "YALOVALI", "TUNCELİLİ", "ERZURUMLU",
        "ERZİNCANLI", "KARABÜKLÜ", "TOKATLI", "SİVASLI", "BİNGÖLLÜ", "GİRİTLİ", "KARTALLI",
        "KOZLUK", "GERCÜŞ", "HASANKEYF", "TAVAS", "ACIPAYAM", "BULDAN", "CİHANBEYLİ", "SİLİVRİ",
      ];
      for (const badWord of forbidden) {
        expect(catalogSet.has(badWord)).toBe(false);
        expect(WORD_BANK[4].includes(badWord)).toBe(false);
        expect(WORD_BANK[6].includes(badWord)).toBe(false);
        expect(WORD_BANK[8].includes(badWord)).toBe(false);
        expect(WORD_BANK[10].includes(badWord)).toBe(false);
      }
    });

  describe("Oda Daveti ve Kod Normalizasyonu (shared/invite.ts)", () => {
    it("geçerli oda kodlarını standart 5 karakterli büyük harfe dönüştürür", () => {
      expect(normalizeRoomCode("abc12")).toBe("ABC12");
      expect(normalizeRoomCode("  X7K9Z  ")).toBe("X7K9Z");
    });

    it("geçersiz veya bozuk oda kodlarını reddeder", () => {
      expect(normalizeRoomCode("")).toBe(null);
      expect(normalizeRoomCode("ABCD")).toBe(null); // 4 karakter
      expect(normalizeRoomCode("ABCDEF")).toBe(null); // 6 karakter
      expect(normalizeRoomCode("ABC-1")).toBe(null); // Özel karakter
      expect(normalizeRoomCode(12345)).toBe(null); // String değil
      expect(normalizeRoomCode(null)).toBe(null);
    });

    it("paylaşılabilir davet mesajı formatını doğru oluşturur", () => {
      const msg = inviteMessage("ABC12", "https://kelimepatlat.com/join/ABC12");
      expect(msg).toContain("ABC12");
      expect(msg).toContain("Kelime Patlat'ta benimle düelloya katıl");
      expect(msg).toContain("https://kelimepatlat.com/join/ABC12");
    });
  });
});
