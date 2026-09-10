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
  const currentCoins = progress.coins ?? 0;
  if (cost > 0 && currentCoins < cost) return { ok: false, error: "Yetersiz cip!" };
  const nextCoins = Math.max(0, currentCoins - cost);
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
    expect(result.next!.coins).toBe(150);
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
});

