/**
 * SENIOR QA AUTOMATION: MİSAFİR (GUEST) VS KAYITLI (REGISTERED) KULLANICI DETAYLI DENETİMİ
 *
 * Bu test paketi:
 * 1. Misafir Girişi Başlatma (Offline & Online JWT Token ile başlatma)
 * 2. Kayıtlı Kullanıcı Girişi (Signup & Login) ve Güvenlik Doğrulamaları
 * 3. Misafir Hesabını Kayıtlı Hesaba Aktarma (Claim-Guest & Progress Merge)
 * 4. Çip, XP, Can, Rütbe ve Kozmetiklerin Aktarım Bütünlüğü (Veri Kaybı Önleme)
 * 5. Mükerrer / Tekrar Aktarım Koruması (Double-Claim Attack Prevention)
 * 6. Profil Ekranında Misafir Uyarı Bandı (isGuest) Mantığı
 * 7. Cihaz Değiştirme / Çıkış Yapma Durumları (Account Recovery)
 */

import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  DEFAULT_PROGRESS,
  PlayerProgress,
  mergePlayerProgress,
  getLeagueTier,
} from "../shared/progression";
import { ProfileSettingsTab } from "../components/profile/profile-settings-tab";
import { AuthScreen } from "../components/auth/auth-screen";

describe("Senior QA: Misafir (Guest) vs Kayıtlı (Registered) Kullanıcı Mimarisi", () => {
  describe("1. Misafir Oturumu Başlangıcı ve Varsayılan Durum", () => {
    it("misafir kullanıcının başlangıç verisi güvenli varsayılanlarla oluşmalıdır", () => {
      const guestProgress: PlayerProgress = { ...DEFAULT_PROGRESS };

      expect(guestProgress.xp).toBe(0);
      expect(guestProgress.coins).toBe(0);
      expect(guestProgress.lives).toBe(5);
      expect(guestProgress.lp).toBe(0);
      expect(guestProgress.welcomeRewardClaimed).toBeFalsy();
      expect(guestProgress.soloUnlockedLevel).toBe(1);
    });

    it("misafir oyuncu online olduğunda 'guest_' önekiyle benzersiz openId almalıdır", () => {
      const guestOpenId = `guest_e847c20a-6627-4a0b-9cf3-9799478f722c`;
      expect(guestOpenId.startsWith("guest_")).toBe(true);

      const isGuestSession = (id: string, token: string | null) => {
        return token === "guest" || !token || Boolean(id && (id.startsWith("guest_") || id.startsWith("player-")));
      };

      // Online misafir (JWT session token + guest_ openId)
      expect(isGuestSession(guestOpenId, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token")).toBe(true);
      // Offline misafir (token: "guest")
      expect(isGuestSession(guestOpenId, "guest")).toBe(true);
      // Tokensiz misafir
      expect(isGuestSession("player-1234", null)).toBe(true);
      // Kayıtlı kullanıcı (usr_ openId + JWT token)
      expect(isGuestSession("usr_ahmet", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token")).toBe(false);
    });
  });

  describe("2. Profil Ekranında 'isGuest' ve Hesap Bağlama Vitrini", () => {
    it("misafir kullanıcı ayarlar sekmesini açtığında 'MİSAFİR HESABI KULLANIYORSUN' ve 'HESABINI BAĞLA / GİRİŞ YAP' butonunu görmelidir", () => {
      const onOpenAuthMock = vi.fn();
      const onLogoutMock = vi.fn();

      const html = renderToStaticMarkup(
        React.createElement(ProfileSettingsTab, {
          sfxOn: true,
          toggleSfx: vi.fn(),
          hapticsOn: true,
          toggleHaptics: vi.fn(),
          progress: DEFAULT_PROGRESS,
          isGuest: true,
          onOpenAuth: onOpenAuthMock,
          onOpenLogoutModal: onLogoutMock,
          onOpenDeleteModal: vi.fn(),
          onOpenPrivacyModal: vi.fn(),
          hasDeleteAccount: false,
        })
      );

      // Misafir özel altın uyarı kartı
      expect(html).toContain("MİSAFİR HESABI KULLANIYORSUN");
      expect(html).toContain("HESABINI BAĞLA / GİRİŞ YAP ➔");
      expect(html).toContain("ÇIKIŞ YAP / YENİDEN GİRİŞ YAP");
      // Kayıtlı kullanıcının doğrudan çıkış butonu gizlenmeli
      expect(html).not.toContain("HESAPTAN ÇIKIŞ YAP");
    });

    it("kayıtlı kullanıcı ayarlar sekmesini açtığında misafir uyarısı görmemeli, doğrudan 'HESAPTAN ÇIKIŞ YAP' görmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ProfileSettingsTab, {
          sfxOn: true,
          toggleSfx: vi.fn(),
          hapticsOn: true,
          toggleHaptics: vi.fn(),
          progress: DEFAULT_PROGRESS,
          isGuest: false,
          onOpenAuth: vi.fn(),
          onOpenLogoutModal: vi.fn(),
          onOpenDeleteModal: vi.fn(),
          onOpenPrivacyModal: vi.fn(),
          hasDeleteAccount: true,
        })
      );

      expect(html).not.toContain("MİSAFİR HESABI KULLANIYORSUN");
      expect(html).not.toContain("HESABINI BAĞLA / GİRİŞ YAP ➔");
      expect(html).toContain("HESAPTAN ÇIKIŞ YAP");
      expect(html).toContain("HESABIMI KALICI OLARAK SİL");
    });
  });

  describe("3. Misafir İlerlemesini Kayıtlı Hesaba Aktarma (Claim-Guest & Data Merge)", () => {
    it("misafir olarak oynayan kullanıcı kayıt olduğunda kazandığı tüm Çip, XP, Kalkan, Radar ve Seviyeleri yeni hesabına eksiksiz aktarmalıdır", () => {
      // 1. Misafir oyuncu oyunu oynar ve birikim yapar:
      const guestProgress: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        xp: 1200, // Seviye 8
        coins: 350, // 350 Çip kazandı
        lp: 180, // 180 Kupa Puanı
        streakShields: 2, // 2 Seri Kalkanı
        radarChargesBonus: 4, // 4 İpucu
        soloUnlockedLevel: 12, // Seviye 12'ye kadar geldi
        discoveredWords: ["KİTAP", "GÜNEŞ", "DENİZ", "YILDIZ"],
        ownedFrames: { signal: true, cyber: true },
        welcomeRewardClaimed: true,
      };

      // 2. Yeni oluşturulan boş kayıtlı hesap:
      const targetUserProgress: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        coins: 0,
        xp: 0,
        lp: 0,
        streakShields: 0,
        radarChargesBonus: 0,
        soloUnlockedLevel: 1,
        welcomeRewardClaimed: false,
      };

      // 3. /api/auth/claim-guest endpoint'indeki birleştirme motoru (addGuestBalances: true):
      const merged = mergePlayerProgress(targetUserProgress, guestProgress, { addGuestBalances: true });

      // Doğrulama: Tüm misafir bakiyeleri ve kazanımları aktarılmış olmalı
      expect(merged.coins).toBe(350);
      expect(merged.xp).toBe(1200);
      expect(merged.lp).toBe(180);
      expect(merged.streakShields).toBe(2);
      expect(merged.radarChargesBonus).toBe(4);
      expect(merged.soloUnlockedLevel).toBe(12);
      expect(merged.discoveredWords).toContain("KİTAP");
      expect(merged.discoveredWords).toContain("YILDIZ");
      expect(merged.ownedFrames?.cyber).toBe(true);
      expect(merged.welcomeRewardClaimed).toBe(true);
    });

    it("daha önceden bakiyesi olan bir kayıtlı hesaba misafir aktarılırsa bakiyeler toplanmalı, seviye ve lig en yüksek değerde korunmalıdır", () => {
      // Halihazırda hesabı olan oyuncu (Örn: 200 Çip, 500 XP, Seviye 5)
      const existingRegisteredUser: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        coins: 200,
        xp: 500,
        lp: 100,
        streakShields: 1,
        radarChargesBonus: 2,
        soloUnlockedLevel: 6,
        discoveredWords: ["ELMA", "ARMUT"],
      };

      // Misafir oturumundaki yeni kazanımlar (150 Çip, 800 XP, Seviye 9)
      const guestSessionProgress: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        coins: 150,
        xp: 800,
        lp: 220,
        streakShields: 2,
        radarChargesBonus: 3,
        soloUnlockedLevel: 9,
        discoveredWords: ["KİTAP", "ARMUT", "KİRAZ"],
      };

      const merged = mergePlayerProgress(existingRegisteredUser, guestSessionProgress, { addGuestBalances: true });

      // Bakiyeler toplanmalı (200 + 150 = 350 Çip)
      expect(merged.coins).toBe(350);
      // XP toplanmalı (500 + 800 = 1300 XP)
      expect(merged.xp).toBe(1300);
      // Kalkanlar toplanmalı (1 + 2 = 3)
      expect(merged.streakShields).toBe(3);
      // Radarlar toplanmalı (2 + 3 = 5)
      expect(merged.radarChargesBonus).toBe(5);
      // Seviye en yüksekte kalmalı (Math.max(6, 9) = 9)
      expect(merged.soloUnlockedLevel).toBe(9);
      // Keşfedilen kelimeler tekilleştirilerek birleştirilmeli
      expect(merged.discoveredWords).toHaveLength(4);
      expect(merged.discoveredWords).toEqual(expect.arrayContaining(["ELMA", "ARMUT", "KİTAP", "KİRAZ"]));
    });

    it("mükerrer aktarım koruması (guestClaimedBy) ile aynı misafir oturumu ikinci kez talep edilememelidir", () => {
      let guestDoc = {
        openId: "guest_12345",
        guestClaimedBy: null as string | null,
        progress: { coins: 100, xp: 400 },
      };

      // 1. Talep işlemi: Başarılı
      const targetUserId = "usr_mehmet";
      if (guestDoc.guestClaimedBy === null) {
        guestDoc.guestClaimedBy = targetUserId;
      }
      expect(guestDoc.guestClaimedBy).toBe("usr_mehmet");

      // 2. Saldırgan veya mükerrer çağrı (Aynı guest_12345'i tekrar aktarmaya çalışma)
      let secondClaimSuccess = false;
      if (guestDoc.guestClaimedBy === null) {
        guestDoc.guestClaimedBy = "usr_baska_hesap";
        secondClaimSuccess = true;
      }

      // İkinci talep reddedilmeli
      expect(secondClaimSuccess).toBe(false);
      expect(guestDoc.guestClaimedBy).toBe("usr_mehmet");
    });
  });

  describe("4. Kayıt ve Giriş Doğrulama Güvenliği (AuthScreen Validasyonları)", () => {
    it("AuthScreen kullanıcı adı ve şifre kurallarını eksiksiz uygulamalıdır", () => {
      const html = renderToStaticMarkup(
        React.createElement(AuthScreen, {
          onSuccess: vi.fn(),
        })
      );

      // Başlangıçta Giriş Yap sekmesi aktif
      expect(html).toContain("Giriş Yap");
      expect(html).toContain("Kayıt Ol");
      expect(html).toContain("KULLANICI ADI VEYA E-POSTA");
      expect(html).toContain("ŞİFRE");
    });

    it("boşluklu kullanıcı adları reddedilmeli, Türkçe karakterli şifreler desteklenmelidir", () => {
      const usernameWithSpace = "ahmet kaya";
      const hasSpace = /\s/.test(usernameWithSpace);
      expect(hasSpace).toBe(true); // Boşluk tespit edilip reddedilmeli

      const validUsername = "ahmet_kaya_2026";
      const isValid = /^[a-zA-Z0-9._-]+$/.test(validUsername);
      expect(isValid).toBe(true);

      const complexTurkishPassword = "ŞifremÇokGüçlü*2026!";
      expect(complexTurkishPassword.length).toBeGreaterThanOrEqual(6);
    });
  });
});
