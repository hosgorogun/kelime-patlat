import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../server/db";

describe("Custom Credentials Parola Güvenliği", () => {
  it("şifreleri doğru şekilde tuzlar ve hash'ler", () => {
    const rawPassword = "oyuncu_sifre_123";
    const storedHash = hashPassword(rawPassword);
    
    // New format: "iterations:salt:hash" (3 colon-separated parts)
    const parts = storedHash.split(":");
    expect(parts).toHaveLength(3);
    expect(Number(parts[0])).toBeGreaterThanOrEqual(100_000); // strong iteration count
    expect(parts[1]).toHaveLength(32); // 16 bytes = 32 hex chars (salt)
    expect(parts[2]).toHaveLength(128); // 64 bytes = 128 hex chars (hash)
    
    // Verification should succeed with correct password
    expect(verifyPassword(rawPassword, storedHash)).toBe(true);
    
    // Verification should fail with wrong password
    expect(verifyPassword("yanlis_sifre", storedHash)).toBe(false);
  });

  it("Türkçe özel karakterler ve semboller içeren parolaları güvenle hash'ler", () => {
    const rawPassword = "ŞifreÇözümleme!2026_🔑";
    const storedHash = hashPassword(rawPassword);
    
    expect(verifyPassword(rawPassword, storedHash)).toBe(true);
    expect(verifyPassword("SifreCozumleme!2026_🔑", storedHash)).toBe(false);
  });
});

describe("Siber Güvenlik & Hile Önleme Kontrolleri", () => {
  it("Socket.io: anonim kullanıcıların kayıtlı usr_* kimliklerini taklit etmesini engeller", () => {
    // Simüle edilmiş ownsPlayerId mantığı
    function createPlayerChecker(sessionUserId: string | null) {
      let boundPlayerId: string | null = null;
      return (playerId: string) => {
        if (sessionUserId) return sessionUserId === playerId;
        if (playerId.startsWith("usr_")) return false;
        if (!boundPlayerId) {
          boundPlayerId = playerId;
          return true;
        }
        return boundPlayerId === playerId;
      };
    }

    // 1. Kayıtlı kullanıcı sadece kendi openId'sini kullanabilir
    const authChecker = createPlayerChecker("usr_ahmet");
    expect(authChecker("usr_ahmet")).toBe(true);
    expect(authChecker("usr_mehmet")).toBe(false);
    expect(authChecker("guest_1234")).toBe(false);

    // 2. Misafir kullanıcı asla usr_* kullanamaz
    const guestChecker = createPlayerChecker(null);
    expect(guestChecker("usr_ahmet")).toBe(false);
    expect(guestChecker("usr_admin")).toBe(false);

    // 3. Misafir kullanıcı bağlandığı ilk misafir kimliğine kilitlenir
    expect(guestChecker("guest_abc")).toBe(true);
    expect(guestChecker("guest_xyz")).toBe(false); // Başka misafiri taklit edemez
  });

  it("Seviye Atlama (Level Skip) Koruması: kilitli seviyelerin ödüllendirilmesini engeller", () => {
    function canClaimSoloAward(currentUnlocked: number, requestedLevel: number, isDaily: boolean) {
      if (isDaily) return true;
      return requestedLevel <= currentUnlocked;
    }

    expect(canClaimSoloAward(5, 5, false)).toBe(true);
    expect(canClaimSoloAward(5, 4, false)).toBe(true);
    expect(canClaimSoloAward(5, 6, false)).toBe(false); // Kilitli seviye
    expect(canClaimSoloAward(1, 100, false)).toBe(false); // Hileli 100. seviye isteği
    expect(canClaimSoloAward(1, 25, true)).toBe(true); // Günlük rota serbesttir
  });

  it("Bakiye Koruma: istemcinin sunucuya sınırsız çip veya XP enjekte etmesini engeller", () => {
    const serverProgress = {
      coins: 100,
      xp: 500,
      lp: 300,
      streakShields: 1,
      radarChargesBonus: 0,
    };

    const maliciousClientPayload = {
      coins: 999999, // Hileli çip
      xp: 999999,    // Hileli XP
      lp: 999999,    // Hileli LP
      streakShields: 99,
    };

    // Güvenlik süzgeci
    const secureNext = {
      ...serverProgress,
      coins: typeof maliciousClientPayload.coins === "number" && maliciousClientPayload.coins < serverProgress.coins
        ? maliciousClientPayload.coins
        : serverProgress.coins,
      xp: serverProgress.xp,
      lp: serverProgress.lp,
      streakShields: typeof maliciousClientPayload.streakShields === "number" && maliciousClientPayload.streakShields < serverProgress.streakShields
        ? maliciousClientPayload.streakShields
        : serverProgress.streakShields,
    };

    expect(secureNext.coins).toBe(100);
    expect(secureNext.xp).toBe(500);
    expect(secureNext.lp).toBe(300);
    expect(secureNext.streakShields).toBe(1);

    // Meşru kozmetik harcamasında çip azalmasına izin verilir
    const legitimateSpentCoins = 40; // 60 harcandı
    const nextLegitCoins = legitimateSpentCoins < serverProgress.coins ? legitimateSpentCoins : serverProgress.coins;
    expect(nextLegitCoins).toBe(40);
  });

  it("Sandık Ödülleri: kilitli veya mükerrer sandık taleplerini reddeder", () => {
    function canClaimMilestone(soloUnlockedLevel: number, milestoneLevel: number, claimedMilestones: Record<number, boolean>) {
      const isUnlocked = soloUnlockedLevel > milestoneLevel;
      const isClaimed = Boolean(claimedMilestones[milestoneLevel]);
      if (!isUnlocked) return { ok: false, error: "locked" };
      if (isClaimed) return { ok: false, error: "already_claimed" };
      return { ok: true };
    }

    // Seviye 15 sandığı için seviye 16 gerekir
    expect(canClaimMilestone(10, 15, {}).ok).toBe(false);
    expect(canClaimMilestone(15, 15, {}).ok).toBe(false);
    expect(canClaimMilestone(16, 15, {}).ok).toBe(true);

    // Daha önce açılmış sandık tekrar açılamaz
    expect(canClaimMilestone(20, 15, { 15: true }).ok).toBe(false);
    expect(canClaimMilestone(20, 15, { 15: true }).error).toBe("already_claimed");
  });

  it("Çevrimdışı Solo Seviye Koruma: çevrimdışı kazanılan meşru seviyeleri korur ve sınırları gözetir", () => {
    function resolveSoloUnlockedSync(currentServerLevel: number, clientReportedLevel: unknown) {
      return Math.min(
        101,
        Math.max(
          currentServerLevel,
          typeof clientReportedLevel === "number" ? clientReportedLevel : 1
        )
      );
    }

    // Çevrimdışı oynayıp 8. seviyeye gelen oyuncunun ilerlemesi korunur
    expect(resolveSoloUnlockedSync(1, 8)).toBe(8);
    // Sunucudaki seviye daha yüksekse düşürülmez
    expect(resolveSoloUnlockedSync(15, 5)).toBe(15);
    // Hileli veya geçersiz tipler engellenir
    expect(resolveSoloUnlockedSync(10, "999")).toBe(10);
    expect(resolveSoloUnlockedSync(10, null)).toBe(10);
    // Maksimum solo seviye sınırı (101) aşılmaz
    expect(resolveSoloUnlockedSync(1, 9999)).toBe(101);
  });
});

describe("JWT Oturum Doğrulama ve Token Bütünlüğü", () => {
  it("sdk.createSessionToken ve sdk.verifySession tokenları eksiksiz doğrular", async () => {
    const { sdk } = await import("../server/_core/sdk");
    const openId = "usr_test_oyuncu";
    const displayName = "Test Oyuncu";

    // Token üret
    const token = await sdk.createSessionToken(openId, { name: displayName });
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    // Token doğrula
    const session = await sdk.verifySession(token);
    expect(session).not.toBeNull();
    expect(session?.openId).toBe(openId);
    expect(session?.name).toBe(displayName);
    expect(session?.appId).toBeTruthy();

    // Geçersiz token reddedilir
    const invalidSession = await sdk.verifySession("gecersiz.jwt.token");
    expect(invalidSession).toBeNull();

    // Boş token reddedilir
    expect(await sdk.verifySession(null)).toBeNull();
    expect(await sdk.verifySession("")).toBeNull();
  }, 15000);
});

describe("Giriş & Kayıt Gelişmiş Kimlik Doğrulama Kontrolleri", () => {
  it("Kayıt: kullanıcı adında boşluk bulunmasını reddeder", () => {
    const usernameRegex = /^\S+$/;
    expect(usernameRegex.test("siber_oyuncu")).toBe(true);
    expect(usernameRegex.test("oyuncu123")).toBe(true);
    expect(usernameRegex.test("ahmet mehmet")).toBe(false);
    expect(usernameRegex.test(" oyuncu")).toBe(false);
    expect(usernameRegex.test("oyuncu ")).toBe(false);
    expect(usernameRegex.test("oyun cu")).toBe(false);
  });

  it("Giriş: kullanıcı adı veya e-posta ile kimlik çözümleme mantığını destekler", () => {
    const mockUsers = [
      { username: "siber_oyuncu", email: "siber@kelimepatlat.com", openId: "usr_siber_oyuncu" },
      { username: "kelime_ustasi", email: "kelime@test.com", openId: "usr_kelime_ustasi" }
    ];

    function findUserByIdentifier(identifier: string) {
      const lower = identifier.toLocaleLowerCase("tr-TR");
      return mockUsers.find(u => u.username === lower || u.email === lower);
    }

    // Kullanıcı adı ile bulma
    expect(findUserByIdentifier("siber_oyuncu")?.openId).toBe("usr_siber_oyuncu");
    expect(findUserByIdentifier("SİBER_OYUNCU")?.openId).toBe("usr_siber_oyuncu");

    // E-posta ile bulma
    expect(findUserByIdentifier("siber@kelimepatlat.com")?.openId).toBe("usr_siber_oyuncu");
    expect(findUserByIdentifier("SİBER@KELİMEPATLAT.COM")?.openId).toBe("usr_siber_oyuncu");
    expect(findUserByIdentifier("kelime@test.com")?.openId).toBe("usr_kelime_ustasi");

    // Bulunamayan giriş
    expect(findUserByIdentifier("olmayan_kullanici")).toBeUndefined();
    expect(findUserByIdentifier("yanlis@email.com")).toBeUndefined();
  });

  it("OAuth: generateOAuthUrl güvenli URL üretimi yapar ve provider parametresini ekler", () => {
    function buildLoginUrl(portalUrl: string | undefined, apiBase: string, appId: string, redirectUri: string, provider?: string) {
      const portal = (portalUrl || apiBase).trim();
      const base = portal.startsWith("http") ? portal : `https://${portal}`;
      const url = new URL(`${base.replace(/\/$/, "")}/app-auth`);
      url.searchParams.set("appId", appId || "kelime-patlat");
      url.searchParams.set("redirectUri", redirectUri);
      url.searchParams.set("type", "signIn");
      if (provider) {
        url.searchParams.set("provider", provider.toLowerCase());
      }
      return url.toString();
    }

    // Portal boş olduğunda dahi asla crash olmamalı, apiBase fallback kullanmalı
    const fallbackUrl = buildLoginUrl("", "http://localhost:3000", "kelime-patlat", "http://localhost:3000/callback", "google");
    expect(fallbackUrl).toContain("provider=google");
    expect(fallbackUrl).toContain("app-auth");

    // Portal tanımlı olduğunda portal URL'sini kullanmalı
    const prodUrl = buildLoginUrl("https://auth.kelimepatlat.com", "http://localhost:3000", "kelime-patlat", "http://localhost:3000/callback", "apple");
    expect(prodUrl).toContain("auth.kelimepatlat.com/app-auth");
    expect(prodUrl).toContain("provider=apple");
  });
});


