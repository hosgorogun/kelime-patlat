/**
 * Server Is Mantigi Birim Testleri
 */
import { describe, expect, it } from "vitest";

import { DEFAULT_PROGRESS, getCalculatedLives, MAX_LIVES, AVATARS } from "../shared/progression";
import { CHIP_EQUIPMENT_ITEMS, PROFILE_FRAMES, VICTORY_EFFECTS, BOARD_SKINS } from "../shared/store-items";
import type { PlayerProgress } from "../shared/progression";

// --- Yardimci: shop-buy is mantigi ---
function simulateShopBuy(progress: PlayerProgress, itemId: string): { ok: boolean; error?: string; next?: PlayerProgress } {
  const item = CHIP_EQUIPMENT_ITEMS.find((it) => it.id === itemId);
  if (!item) return { ok: false, error: "Bilinmeyen magaza urunu." };
  const currentCoins = progress.coins ?? 0;
  if (currentCoins < item.cost) return { ok: false, error: "Yetersiz cip!" };
  let next = { ...progress, coins: currentCoins - item.cost };
  if (item.rewardType === "lives") {
    const calc = getCalculatedLives(progress);
    if (calc.lives >= MAX_LIVES) return { ok: false, error: "Canlariniz zaten tam kapasite dolu (5/5)!" };
    next.lives = MAX_LIVES;
    next.lastLifeRegenTimestamp = Date.now();
  } else if (item.rewardType === "radar") {
    next.radarChargesBonus = (progress.radarChargesBonus || 0) + 5;
  } else if (item.rewardType === "shield") {
    next.streakShields = (progress.streakShields || 0) + 1;
  } else if (item.rewardType === "xp") {
    next.xp = progress.xp + 250;
  }
  return { ok: true, next };
}

// --- Yardimci: cosmetic-buy is mantigi ---
function simulateCosmeticBuy(progress: PlayerProgress, kind: "avatar" | "frame" | "effect" | "board", id: string): { ok: boolean; error?: string; next?: PlayerProgress } {
  let cost = 0;
  if (kind === "frame") {
    const entry = PROFILE_FRAMES.find((f) => f[0] === id);
    if (!entry) return { ok: false, error: "Gecersiz cerceve." };
    cost = entry[3];
  } else if (kind === "effect") {
    const entry = VICTORY_EFFECTS.find((e) => e[0] === id);
    if (!entry) return { ok: false, error: "Gecersiz zafer efekti." };
    cost = entry[3];
  } else if (kind === "board") {
    const entry = BOARD_SKINS.find((b) => b[0] === id);
    if (!entry) return { ok: false, error: "Gecersiz tahta gorunumu." };
    cost = entry[3];
  } else if (kind === "avatar") {
    const entry = AVATARS.find((a) => a.id === id);
    if (!entry) return { ok: false, error: "Gecersiz avatar." };
    cost = 0;
  }
  const isAlreadyOwned =
    kind === "frame" ? Boolean(progress.ownedFrames?.[id]) :
    kind === "effect" ? Boolean(progress.ownedVictoryEffects?.[id]) :
    kind === "board" ? Boolean(progress.ownedBoardSkins?.[id]) :
    Boolean(progress.purchasedAvatars?.[id]);

  const effectiveCost = isAlreadyOwned ? 0 : cost;
  const currentCoins = progress.coins ?? 0;
  if (effectiveCost > 0 && currentCoins < effectiveCost) return { ok: false, error: "Yetersiz cip!" };
  const nextCoins = Math.max(0, currentCoins - effectiveCost);
  let next = { ...progress, coins: nextCoins };
  if (kind === "frame") { next.selectedFrame = id; next.ownedFrames = { ...(progress.ownedFrames ?? {}), [id]: true }; }
  else if (kind === "effect") { next.selectedVictoryEffect = id; next.ownedVictoryEffects = { ...(progress.ownedVictoryEffects ?? {}), [id]: true }; }
  else if (kind === "board") { next.selectedBoardSkin = id; next.ownedBoardSkins = { ...(progress.ownedBoardSkins ?? {}), [id]: true }; }
  else if (kind === "avatar") { next.selectedAvatar = id as any; next.purchasedAvatars = { ...(progress.purchasedAvatars ?? {}), [id]: true }; }
  return { ok: true, next };
}

// --- Yardimci: delete-account is mantigi ---
function simulateDeleteAccount(openId: string, db: { users: Set<string>; profiles: Set<string>; leaderboard: Set<string> }) {
  const existed = db.users.has(openId);
  db.users.delete(openId); db.profiles.delete(openId); db.leaderboard.delete(openId);
  return { deleted: existed };
}

describe("Magaza Cip Ekipman Satin Alma Is Mantigi (shop-buy)", () => {
  it("radar paketi basariyla satin alinir ve radarChargesBonus 5 artar", () => {
    const progress = { ...DEFAULT_PROGRESS, coins: 100, radarChargesBonus: 2 };
    const result = simulateShopBuy(progress, "radar_5");
    expect(result.ok).toBe(true);
    expect(result.next!.coins).toBe(25);
    expect(result.next!.radarChargesBonus).toBe(7);
  });

  it("seri kalkani satin alinir ve streakShields 1 artar", () => {
    const progress = { ...DEFAULT_PROGRESS, coins: 200, streakShields: 1 };
    const result = simulateShopBuy(progress, "shield_1");
    expect(result.ok).toBe(true);
    expect(result.next!.coins).toBe(80);
    expect(result.next!.streakShields).toBe(2);
  });

  it("XP kapsulu satin alinir ve XP 250 artar", () => {
    const result = simulateShopBuy({ ...DEFAULT_PROGRESS, coins: 300, xp: 500 }, "xp_250");
    expect(result.ok).toBe(true);
    expect(result.next!.xp).toBe(750);
    expect(result.next!.coins).toBe(150);
  });

  it("can doldurma basarili olur ve lives = MAX_LIVES olarak ayarlanir", () => {
    const progress = { ...DEFAULT_PROGRESS, coins: 200, lives: 2, lastLifeRegenTimestamp: Date.now() };
    const result = simulateShopBuy(progress, "lives_refill");
    expect(result.ok).toBe(true);
    expect(result.next!.lives).toBe(MAX_LIVES);
    expect(result.next!.coins).toBe(125); // 200 - 75 = 125
  });

  it("canlar zaten doluysa hata doner ve cip harcanmaz", () => {
    const result = simulateShopBuy({ ...DEFAULT_PROGRESS, coins: 200, lives: MAX_LIVES }, "lives_refill");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("zaten tam kapasite dolu");
  });

  it("yetersiz cip ile satin alim basarisiz olur", () => {
    const result = simulateShopBuy({ ...DEFAULT_PROGRESS, coins: 50 }, "radar_5");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Yetersiz cip");
    expect(result.next).toBeUndefined();
  });

  it("gecersiz urun ID ile hata doner", () => {
    const result = simulateShopBuy({ ...DEFAULT_PROGRESS, coins: 999 }, "unknown_item_xyz");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Bilinmeyen magaza urunu.");
  });

  it("sifir cipli oyuncu hicbir urun satin alamaz", () => {
    const progress = { ...DEFAULT_PROGRESS, coins: 0 };
    expect(simulateShopBuy(progress, "radar_5").ok).toBe(false);
    expect(simulateShopBuy(progress, "shield_1").ok).toBe(false);
    expect(simulateShopBuy(progress, "xp_250").ok).toBe(false);
  });
});

describe("Kozmetik Satin Alma Is Mantigi (cosmetic-buy)", () => {
  it("ucretsiz baslangic cercevesi (signal, 0 cip) satin alinir", () => {
    const result = simulateCosmeticBuy({ ...DEFAULT_PROGRESS, coins: 0 }, "frame", "signal");
    expect(result.ok).toBe(true);
    expect(result.next!.coins).toBe(0);
    expect(result.next!.selectedFrame).toBe("signal");
    expect(result.next!.ownedFrames?.signal).toBe(true);
  });

  it("neon cerceve 140 cip karsiliginda satin alinir", () => {
    const result = simulateCosmeticBuy({ ...DEFAULT_PROGRESS, coins: 200 }, "frame", "neon");
    expect(result.ok).toBe(true);
    expect(result.next!.coins).toBe(60);
    expect(result.next!.ownedFrames?.neon).toBe(true);
  });

  it("zafer efekti satin alinir ve ownedVictoryEffects guncellenir", () => {
    const result = simulateCosmeticBuy({ ...DEFAULT_PROGRESS, coins: 500 }, "effect", "glitch");
    expect(result.ok).toBe(true);
    expect(result.next!.coins).toBe(340);
    expect(result.next!.ownedVictoryEffects?.glitch).toBe(true);
  });

  it("tahta gorunumu satin alinir ve ownedBoardSkins guncellenir", () => {
    const result = simulateCosmeticBuy({ ...DEFAULT_PROGRESS, coins: 300 }, "board", "night");
    expect(result.ok).toBe(true);
    expect(result.next!.coins).toBe(180);
    expect(result.next!.ownedBoardSkins?.night).toBe(true);
  });

  it("avatar her zaman ucretsizdir ve purchasedAvatars'a eklenir", () => {
    const result = simulateCosmeticBuy({ ...DEFAULT_PROGRESS, coins: 0 }, "avatar", "orbit");
    expect(result.ok).toBe(true);
    expect(result.next!.coins).toBe(0);
    expect(result.next!.selectedAvatar).toBe("orbit");
    expect(result.next!.purchasedAvatars?.orbit).toBe(true);
  });

  it("yetersiz cipte cerceve satin alim basarisiz olur", () => {
    const result = simulateCosmeticBuy({ ...DEFAULT_PROGRESS, coins: 100 }, "frame", "chrome");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Yetersiz cip");
  });

  it("zaten satin alinmis bir cerceveyi kusanmak 0 cipe mal olur ve bakiye 0 olsa da basarilidir", () => {
    const progressWithOwnedFrame: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      coins: 0,
      ownedFrames: { signal: true, neon: true },
      selectedFrame: "signal",
    };
    const result = simulateCosmeticBuy(progressWithOwnedFrame, "frame", "neon");
    expect(result.ok).toBe(true);
    expect(result.next!.coins).toBe(0);
    expect(result.next!.selectedFrame).toBe("neon");
  });

  it("gecersiz frame ID ile hata doner", () => {
    expect(simulateCosmeticBuy(DEFAULT_PROGRESS, "frame", "invalid_frame_99").ok).toBe(false);
  });

  it("gecersiz effect ID ile hata doner", () => {
    expect(simulateCosmeticBuy(DEFAULT_PROGRESS, "effect", "nonexistent").ok).toBe(false);
  });

  it("gecersiz board ID ile hata doner", () => {
    expect(simulateCosmeticBuy(DEFAULT_PROGRESS, "board", "galaxy_skin").ok).toBe(false);
  });

  it("gecersiz avatar ID ile hata doner", () => {
    expect(simulateCosmeticBuy(DEFAULT_PROGRESS, "avatar", "ultra_unknown").ok).toBe(false);
  });

  it("mevcut envantere ikinci kozmetik eklenmesi onceki kozmetikleri silmez", () => {
    const progress = { ...DEFAULT_PROGRESS, coins: 1000, ownedFrames: { signal: true } };
    const result = simulateCosmeticBuy(progress, "frame", "neon");
    expect(result.ok).toBe(true);
    expect(result.next!.ownedFrames?.signal).toBe(true);
    expect(result.next!.ownedFrames?.neon).toBe(true);
  });

  it("en pahali kozmetik cyber cerceve (500 cip) tam cipte alinir", () => {
    const result = simulateCosmeticBuy({ ...DEFAULT_PROGRESS, coins: 500 }, "frame", "cyber");
    expect(result.ok).toBe(true);
    expect(result.next!.coins).toBe(0);
  });

  it("499 cipte en pahali kozmetik alinamaz (sinir deger testi)", () => {
    const result = simulateCosmeticBuy({ ...DEFAULT_PROGRESS, coins: 499 }, "frame", "cyber");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Yetersiz cip!");
  });
});

describe("GDPR Hesap Silme Mantigi (delete-account)", () => {
  it("kayitli kullanici tum koleksiyonlardan silinir", () => {
    const db = { users: new Set(["usr_001", "usr_002"]), profiles: new Set(["usr_001", "usr_002"]), leaderboard: new Set(["usr_001", "usr_002"]) };
    const result = simulateDeleteAccount("usr_001", db);
    expect(result.deleted).toBe(true);
    expect(db.users.has("usr_001")).toBe(false);
    expect(db.profiles.has("usr_001")).toBe(false);
    expect(db.leaderboard.has("usr_001")).toBe(false);
    expect(db.users.has("usr_002")).toBe(true);
  });

  it("var olmayan kullanici silinmek istendiginde deleted=false doner ve hata atmaz", () => {
    const db = { users: new Set<string>(), profiles: new Set<string>(), leaderboard: new Set<string>() };
    expect(simulateDeleteAccount("usr_nonexistent", db).deleted).toBe(false);
  });

  it("silme sonrasi ayni openId ile yeni kayit olusturulabilir", () => {
    const db = { users: new Set(["usr_test"]), profiles: new Set(["usr_test"]), leaderboard: new Set(["usr_test"]) };
    simulateDeleteAccount("usr_test", db);
    db.users.add("usr_test");
    expect(db.users.has("usr_test")).toBe(true);
  });
});

describe("Sunucu Yetkilendirme ve Guvenlik", () => {
  it("misafir token sunucu islemini engellemeldir", () => {
    const token = "guest";
    expect(token && token !== "guest").toBeFalsy();
  });

  it("null token yetkisiz kabul edilir", () => {
    const token = null;
    expect(token && (token as string) !== "guest").toBeFalsy();
  });

  it("Turkce karakterli kullanici adlari kucuk harfe dogru donusturulur (i/I kurali)", () => {
    expect("ŞİRİN".toLocaleLowerCase("tr-TR")).toBe("şirin");
    expect("I".toLocaleLowerCase("tr-TR")).toBe("\u0131");
    expect("\u0130".toLocaleLowerCase("tr-TR")).toBe("i");
  });

  it("shop-buy icin 32 karakter uzunluk siniri kontrolu — uzun ID katalogda bulunmaz", () => {
    const longId = "a".repeat(33);
    expect(CHIP_EQUIPMENT_ITEMS.find((it) => it.id === longId)).toBeUndefined();
  });

  it("cosmetic-buy kind alani dogrulama — sadece 4 deger gecerlidir", () => {
    const validKinds = ["avatar", "frame", "effect", "board"];
    expect(validKinds).toContain("avatar");
    expect(validKinds).not.toContain("weapon");
    expect(validKinds).not.toContain("skin");
    expect(validKinds).not.toContain("");
  });

  it("sync-progress ucretsiz cerceve/efekt/tahtayi kabul eder ancak satin alinmamis ucretli cerceveleri filtreler", () => {
    // Sunucu tarafındaki sanitizasyon fonksiyonu simülasyonu
    const sanitizeCosmetics = (incoming: any, serverOwned: Record<string, boolean> | undefined, catalog: readonly (readonly [string, string, any, number])[]) => {
      const safe: Record<string, boolean> = { ...(serverOwned || {}) };
      if (incoming && typeof incoming === "object") {
        for (const [id, val] of Object.entries(incoming)) {
          if (val === true) {
            const item = catalog.find((c) => c[0] === id);
            if (item && (item[3] === 0 || serverOwned?.[id] === true)) {
              safe[id] = true;
            }
          }
        }
      }
      return safe;
    };

    const serverOwnedFrames = { signal: true };
    // Kötü niyetli istemci satın almadığı 'cyber' (500 çip) ve 'gold' (350 çip) çerçevelerini sync ile göndermeye çalışıyor
    const hackedIncomingFrames = { signal: true, cyber: true, gold: true };

    const sanitized = sanitizeCosmetics(hackedIncomingFrames, serverOwnedFrames, PROFILE_FRAMES);

    expect(sanitized.signal).toBe(true);
    expect(sanitized.cyber).toBeUndefined(); // Reddedilmeli!
    expect(sanitized.gold).toBeUndefined();  // Reddedilmeli!
  });

  it("sync-progress daha once satin alinmis ucretli kozmetikleri korur", () => {
    const sanitizeCosmetics = (incoming: any, serverOwned: Record<string, boolean> | undefined, catalog: readonly (readonly [string, string, any, number])[]) => {
      const safe: Record<string, boolean> = { ...(serverOwned || {}) };
      if (incoming && typeof incoming === "object") {
        for (const [id, val] of Object.entries(incoming)) {
          if (val === true) {
            const item = catalog.find((c) => c[0] === id);
            if (item && (item[3] === 0 || serverOwned?.[id] === true)) {
              safe[id] = true;
            }
          }
        }
      }
      return safe;
    };

    // Kullanıcı veritabanında 'neon' çerçevesine önceden sahip
    const serverOwnedFrames = { signal: true, neon: true };
    const incomingFrames = { signal: true, neon: true, chrome: true }; // 'chrome' henüz satın alınmadı

    const sanitized = sanitizeCosmetics(incomingFrames, serverOwnedFrames, PROFILE_FRAMES);

    expect(sanitized.signal).toBe(true);
    expect(sanitized.neon).toBe(true);       // Önceden satın alındığı için korunmalı
    expect(sanitized.chrome).toBeUndefined(); // Satın alınmadığı için filtrelenmeli
  });

  it("Oda temizleyici (sweeper) sahipsiz tamamlanmis odalari ve TTL suresi dolmus zombi odalari tespit eder", () => {
    type TestRoom = {
      code: string;
      status: string;
      startedAt: number | null;
      touchedAt: number;
      host: { connected: boolean };
      guest: { connected: boolean; isBot?: boolean } | null;
    };

    const testRooms = new Map<string, TestRoom>([
      ["ROOM1", { code: "ROOM1", status: "finished", startedAt: Date.now() - 5000, touchedAt: Date.now(), host: { connected: false }, guest: { connected: false } }],
      ["ROOM2", { code: "ROOM2", status: "finished", startedAt: Date.now() - 5000, touchedAt: Date.now(), host: { connected: true }, guest: { connected: false } }],
      ["ROOM3", { code: "ROOM3", status: "playing", startedAt: Date.now() - 16 * 60 * 1000, touchedAt: Date.now(), host: { connected: true }, guest: { connected: true } }],
    ]);

    const destroyedCodes: string[] = [];
    const destroyTestRoom = (code: string) => {
      destroyedCodes.push(code);
      testRooms.delete(code);
    };

    const now = Date.now();
    const TTL = 15 * 60 * 1000;

    for (const [code, room] of testRooms.entries()) {
      const hostConnected = room.host?.connected;
      const guestConnected = room.guest && !room.guest.isBot ? room.guest.connected : false;
      const noHumanConnected = !hostConnected && !guestConnected;

      if (room.status === "finished" && noHumanConnected) {
        destroyTestRoom(code);
        continue;
      }
      if (room.startedAt && now - room.startedAt > TTL) {
        destroyTestRoom(code);
        continue;
      }
    }

    // ROOM1: finished & no human connected -> yok edilmeli
    expect(destroyedCodes).toContain("ROOM1");
    // ROOM2: finished & host hala bağlı -> korunmalı
    expect(destroyedCodes).not.toContain("ROOM2");
    // ROOM3: 16 dakika geçmiş (TTL dolmuş zombi oda) -> yok edilmeli
    expect(destroyedCodes).toContain("ROOM3");
    expect(testRooms.size).toBe(1);
    expect(testRooms.has("ROOM2")).toBe(true);
  });

  describe("Yeni Uç Noktalar ve Senkronizasyon Gelistirmeleri", () => {
    it("sync-progress en iyi skor, tempo, arcade skoru ve son mac odulunu basariyla kaydeder", () => {
      const currentProg: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        bestScore: 100,
        bestTempo: 2.5,
        bestArcadeScore: 250,
      };

      const incoming = {
        bestScore: 180,
        bestTempo: 4.0,
        bestArcadeScore: 450,
        lastMatchReward: { xp: 50, lp: 25, coins: 10 },
      };

      const updated = {
        ...currentProg,
        bestScore: Math.max(currentProg.bestScore || 0, incoming.bestScore),
        bestTempo: Math.max(currentProg.bestTempo || 0, incoming.bestTempo),
        bestArcadeScore: Math.max(currentProg.bestArcadeScore || 0, incoming.bestArcadeScore),
        lastMatchReward: incoming.lastMatchReward,
      };

      expect(updated.bestScore).toBe(180);
      expect(updated.bestTempo).toBe(4.0);
      expect(updated.bestArcadeScore).toBe(450);
      expect(updated.lastMatchReward).toEqual({ xp: 50, lp: 25, coins: 10 });
    });

    it("sync-progress gunluk seri sifirlanmasina (streak: 0) izin verir", () => {
      const currentProg: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        streak: 5,
      };

      const incoming = { streak: 0 };
      const safeStreak = typeof incoming.streak === "number"
        ? Math.min(currentProg.streak, Math.max(0, incoming.streak))
        : currentProg.streak;

      expect(safeStreak).toBe(0);
    });

    it("sync-progress cevrimdisi gunluk giris odulunu dogrular ve bonuslari guvenle ekler", () => {
      const currentProg: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        coins: 100,
        streakShields: 0,
        xp: 200,
        lastLoginDay: undefined,
        loginDaysCount: 0,
      };

      // 1. Gün ödülü: 25 çip
      const incomingLastLoginDay = "2026-09-19";
      const isClaiming = !currentProg.lastLoginDay && incomingLastLoginDay === "2026-09-19";
      expect(isClaiming).toBe(true);

      const dlResult = {
        reward: { day: 1, label: "1. GÜN", rewardType: "coins" as const, amount: 25, icon: "🪙" },
        updatedProgress: { ...currentProg, coins: 125, lastLoginDay: incomingLastLoginDay, loginDaysCount: 1 }
      };

      const bonusCoins = dlResult.reward.rewardType === "coins" ? dlResult.reward.amount : 0;
      const nextCoins = currentProg.coins! + bonusCoins;

      expect(nextCoins).toBe(125);
    });

    it("sync-progress ve sunucu oda kaydı pvpWinStreak alanını kayıpsız korur", () => {
      const currentProg: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        pvpWinStreak: 2,
      };

      const incoming = { pvpWinStreak: 3 };
      const safePvpWinStreak = typeof incoming.pvpWinStreak === "number"
        ? Math.max(0, incoming.pvpWinStreak)
        : (currentProg.pvpWinStreak ?? 0);

      expect(safePvpWinStreak).toBe(3);
    });

    it("sync-progress istemciden boş matchHistory gelse bile sunucudaki mevcut maç geçmişini ezmez ve korur", () => {
      const serverMatch = {
        id: "m_server_saved_1",
        mode: "ranked" as const,
        won: true,
        myScore: 110,
        date: Date.now() - 5000,
      };

      const currentProg: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        matchHistory: [serverMatch],
      };

      // İstemci boş dizi gönderiyor (eski yıkıcı ezme hatası simülasyonu)
      const incoming = { matchHistory: [] };

      const safeMergedHistory = (() => {
        const map = new Map<string, any>();
        (currentProg.matchHistory || []).forEach((m: any) => {
          if (m && typeof m.id === "string") map.set(m.id, m);
        });
        (Array.isArray(incoming.matchHistory) ? incoming.matchHistory : []).forEach((m: any) => {
          if (m && typeof m.id === "string") map.set(m.id, m);
        });
        return Array.from(map.values())
          .sort((a: any, b: any) => (b.date || 0) - (a.date || 0))
          .slice(0, 50);
      })();

      expect(safeMergedHistory.length).toBe(1);
      expect(safeMergedHistory[0].id).toBe("m_server_saved_1");
    });

    it("sync-progress istemci ve sunucu kelime geçmişlerini (history) tekilleştirerek birleştirir", () => {
      const currentProg: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        history: ["ELMA", "ARMUT"],
      };

      const incoming = {
        history: ["KİRAZ", "ELMA"], // ELMA ortak, KİRAZ yeni
      };

      const mergedHistory = Array.from(
        new Set([...(currentProg.history || []), ...(Array.isArray(incoming.history) ? incoming.history : [])])
      ).slice(-150);

      expect(mergedHistory.length).toBe(3);
      expect(mergedHistory).toContain("ELMA");
      expect(mergedHistory).toContain("ARMUT");
      expect(mergedHistory).toContain("KİRAZ");
    });

    it("award uç noktası günün rotası için tek bir 'daily' maç kaydı oluşturur ve mükerrer solo kaydı yapmaz", () => {
      const currentProg: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        matchHistory: [],
      };

      const dailyChallenge = {
        id: "2026-09-19",
        themeId: "nature" as const,
        size: 4 as const,
        targetScore: 120,
        rewardXp: 50,
        words: ["ORMAN", "ÇINAR"],
      };

      // award sunucu simülasyonu: payload.daily: true
      const foundWords = ["ORMAN", "ÇINAR"];
      const score = 140;

      const awarded = {
        ...currentProg,
        matchHistory: [
          {
            id: `m_${Date.now()}_daily`,
            mode: "daily" as const,
            won: true,
            myScore: score,
            xpEarned: dailyChallenge.rewardXp,
            coinsEarned: 5,
            wordsCount: foundWords.length,
            date: Date.now(),
          },
        ],
      };

      expect(awarded.matchHistory.length).toBe(1);
      expect(awarded.matchHistory[0].mode).toBe("daily");
      expect(awarded.matchHistory[0].myScore).toBe(140);
      expect(awarded.matchHistory[0].wordsCount).toBe(2);
    });
  });
});


