/**
 * Liderlik Tablosu, Merge Guvenlik ve Ilerleme Edge Case Testleri
 * ─────────────────────────────────────────────────────────────────
 * LeaderboardEntry yeni alanlari (avatarPhoto, selectedTitle),
 * mergePlayerProgress safeNum guvenlik sinirlari, applyMatchProgress
 * coin/LP korumasi, kozmetik katalog ID benzersizligi ve
 * getWeekId tutarliligi testleri.
 */
import { describe, expect, it } from "vitest";

import {
  DEFAULT_PROGRESS,
  mergePlayerProgress,
  applyMatchProgress,
  applyArcadeProgress,
  applyVintageProgress,
  getWeekId,
  getLeagueTier,
  reconcileSeasonReset,
  getActiveCyberTitle,
  AVATARS,
} from "../shared/progression";
import { PROFILE_FRAMES, VICTORY_EFFECTS, BOARD_SKINS, CHIP_EQUIPMENT_ITEMS } from "../shared/store-items";
import type { LeaderboardEntry } from "../shared/game";

// ─── LeaderboardEntry Yeni Alanlari ─────────────────────────────────────────

describe("LeaderboardEntry - avatarPhoto ve selectedTitle alanlari", () => {
  it("avatarPhoto ve selectedTitle opsiyonel alanlari gecerli bir LeaderboardEntry'de bulunabilir", () => {
    const entry: LeaderboardEntry = {
      id: "usr_001",
      name: "SiberSavascı",
      score: 1500,
      wins: 30,
      matches: 45,
      bestRound: 120,
      lp: 2400,
      tier: "PLATIN",
      avatar: "spark",
      avatarPhoto: "https://example.com/photo.jpg",
      selectedTitle: "[MIMARLAR]",
      level: 12,
    };
    expect(entry.avatarPhoto).toBe("https://example.com/photo.jpg");
    expect(entry.selectedTitle).toBe("[MIMARLAR]");
  });

  it("avatarPhoto ve selectedTitle olmayan eski format entry hata vermez", () => {
    const entry: LeaderboardEntry = {
      id: "usr_002",
      name: "Anonim",
      score: 500,
      wins: 5,
      matches: 10,
      bestRound: 60,
    };
    expect(entry.avatarPhoto).toBeUndefined();
    expect(entry.selectedTitle).toBeUndefined();
  });

  it("leaderboard listesi avatarPhoto'su olan ve olmayan entry'leri birlikte tutabilir", () => {
    const entries: LeaderboardEntry[] = [
      { id: "usr_1", name: "A", score: 1000, wins: 10, matches: 15, bestRound: 80, avatarPhoto: "photo1.jpg" },
      { id: "usr_2", name: "B", score: 800, wins: 8, matches: 12, bestRound: 60 },
      { id: "usr_3", name: "C", score: 1200, wins: 15, matches: 20, bestRound: 100, selectedTitle: "[USTA]" },
    ];
    expect(entries.filter((e) => e.avatarPhoto)).toHaveLength(1);
    expect(entries.filter((e) => e.selectedTitle)).toHaveLength(1);
    expect(entries.filter((e) => !e.avatarPhoto && !e.selectedTitle)).toHaveLength(1);
  });

  it("selectedTitle liderlik siralamasinda unvani yansitiyor", () => {
    const podium: LeaderboardEntry[] = [
      { id: "1", name: "Birinci", score: 3000, wins: 50, matches: 70, bestRound: 200, selectedTitle: "[RADIAN]" },
      { id: "2", name: "Ikinci", score: 2500, wins: 40, matches: 60, bestRound: 180, selectedTitle: "[OLUMSUYZLUK]" },
    ];
    expect(podium[0].selectedTitle).toBe("[RADIAN]");
    expect(podium[1].selectedTitle).toBe("[OLUMSUYZLUK]");
  });
});

// ─── mergePlayerProgress safeNum Guvenlik Sinirlari ─────────────────────────

describe("mergePlayerProgress - safeNum Guvenlik ve Edge Case Testleri", () => {
  it("remote'ta NaN degerleri yerel degeri korur (safeNum fallback)", () => {
    const local = { ...DEFAULT_PROGRESS, xp: 500, coins: 100 };
    const remote = { xp: NaN, coins: NaN };
    const merged = mergePlayerProgress(local, remote);
    expect(merged.xp).toBe(500);
    expect(merged.coins).toBe(100);
  });

  it("negatif deger 0'a yuvarlanir (safeNum Math.max(0, ...))", () => {
    const local = { ...DEFAULT_PROGRESS, xp: 200, coins: 50 };
    const remote = { xp: -999, coins: -500 };
    const merged = mergePlayerProgress(local, remote);
    expect(merged.xp).toBeGreaterThanOrEqual(0);
    expect(merged.coins).toBeGreaterThanOrEqual(0);
  });

  it("Infinity degeri 2 milyar cap'e sinirlanir", () => {
    const local = { ...DEFAULT_PROGRESS, xp: 100 };
    const remote = { xp: Infinity };
    const merged = mergePlayerProgress(local, remote);
    expect(merged.xp).toBeLessThanOrEqual(2_000_000_000);
  });

  it("remote null olduğunda local oldugu gibi doner", () => {
    const local = { ...DEFAULT_PROGRESS, xp: 999, coins: 777 };
    const merged = mergePlayerProgress(local, null);
    expect(merged).toEqual(local);
  });

  it("remote undefined oldugunda local oldugu gibi doner", () => {
    const local = { ...DEFAULT_PROGRESS, xp: 123 };
    const merged = mergePlayerProgress(local, undefined);
    expect(merged).toEqual(local);
  });

  it("remote'ta undefined deger olan alanlar local'in degerini korur", () => {
    const local = { ...DEFAULT_PROGRESS, xp: 400, coins: 200 };
    const remote = { xp: undefined as any, coins: undefined as any, streak: 3 };
    const merged = mergePlayerProgress(local, remote);
    expect(merged.xp).toBe(400); // undefined override edilmemeli
    expect(merged.coins).toBe(200);
    expect(merged.streak).toBe(3);
  });

  it("sezon gecmisi her iki taraftan birlestirilir ve mujde duplication olmaz", () => {
    const local = {
      ...DEFAULT_PROGRESS,
      seasonHistory: [
        { seasonId: "2026-S03", rank: "GÜMÜŞ", lp: 900, date: "2026-05-01" },
        { seasonId: "2026-S04", rank: "ALTIN", lp: 1600, date: "2026-07-01" },
      ],
    };
    const remote = {
      seasonHistory: [
        { seasonId: "2026-S04", rank: "ALTIN", lp: 1650, date: "2026-07-01" }, // Daha yüksek LP
        { seasonId: "2026-S05", rank: "PLATIN", lp: 2200, date: "2026-09-01" },
      ],
    };
    const merged = mergePlayerProgress(local, remote);
    expect(merged.seasonHistory).toHaveLength(3); // Tekrar yok
    const s04 = merged.seasonHistory!.find((s) => s.seasonId === "2026-S04");
    expect(s04?.lp).toBe(1650); // Remote'taki daha yüksek LP kazandi
  });

  it("purchasedAvatars her iki taraftan union edilir", () => {
    const local = { ...DEFAULT_PROGRESS, purchasedAvatars: { spark: true, orbit: true } };
    const remote = { purchasedAvatars: { orbit: true, sage: true } };
    const merged = mergePlayerProgress(local, remote);
    expect(merged.purchasedAvatars?.spark).toBe(true);
    expect(merged.purchasedAvatars?.orbit).toBe(true);
    expect(merged.purchasedAvatars?.sage).toBe(true);
  });

  it("ownedFrames ve ownedVictoryEffects her iki taraftan union edilir", () => {
    const local = { ...DEFAULT_PROGRESS, ownedFrames: { signal: true }, ownedVictoryEffects: { pulse: true } };
    const remote = { ownedFrames: { neon: true }, ownedVictoryEffects: { glitch: true } };
    const merged = mergePlayerProgress(local, remote);
    expect(merged.ownedFrames?.signal).toBe(true);
    expect(merged.ownedFrames?.neon).toBe(true);
    expect(merged.ownedVictoryEffects?.pulse).toBe(true);
    expect(merged.ownedVictoryEffects?.glitch).toBe(true);
  });

  it("claimedMilestones her iki taraftan union edilir ve üst üste yazilmaz", () => {
    const local = { ...DEFAULT_PROGRESS, claimedMilestones: { 15: true, 30: true } };
    const remote = { claimedMilestones: { 30: true, 45: true } };
    const merged = mergePlayerProgress(local, remote);
    expect(merged.claimedMilestones).toEqual({ 15: true, 30: true, 45: true });
  });

  it("soloUnlockedLevel her zaman iki tarafin maksimumunu alir", () => {
    const local = { ...DEFAULT_PROGRESS, soloUnlockedLevel: 18 };
    const remote = { soloUnlockedLevel: 25 };
    expect(mergePlayerProgress(local, remote).soloUnlockedLevel).toBe(25);
    expect(mergePlayerProgress(remote as any, local).soloUnlockedLevel).toBe(25);
  });
});

// ─── applyMatchProgress Edge Case'ler ───────────────────────────────────────

describe("applyMatchProgress - Cip Korumasi ve LP Hesaplari", () => {
  it("PvP galibiyetinde 10 cip ve LP 30 kazanilir", () => {
    const base = { ...DEFAULT_PROGRESS, coins: 0, lp: 0 };
    const res = applyMatchProgress(base, { score: 100, tempo: 3, won: true }, "pvp");
    expect(res.coins).toBe(10);
    expect(res.lp).toBe(30);
  });

  it("PvP maglubiyet sonrasi LP 0'in altina dusmez (negatif engel)", () => {
    const base = { ...DEFAULT_PROGRESS, lp: 0 };
    const res = applyMatchProgress(base, { score: 30, tempo: 1, won: false }, "pvp");
    expect(res.lp).toBeGreaterThanOrEqual(0);
  });

  it("solo modda matches sayaci artmaz, wins artmaz, sadece XP degisir", () => {
    const base = { ...DEFAULT_PROGRESS, matches: 5, wins: 3 };
    const res = applyMatchProgress(base, { score: 80, tempo: 2, won: true }, "solo");
    expect(res.matches).toBe(5); // Solo matches artirmamali
    expect(res.wins).toBe(4);    // Wins artmali
  });

  it("bestScore ve bestTempo en yuksek degeri korur", () => {
    const base = { ...DEFAULT_PROGRESS, bestScore: 200, bestTempo: 3.0 };
    const lower = applyMatchProgress(base, { score: 100, tempo: 2.0, won: true });
    expect(lower.bestScore).toBe(200); // Dusuk skorla ustunu yazamaz
    expect(lower.bestTempo).toBe(3.0);

    const higher = applyMatchProgress(base, { score: 300, tempo: 4.5, won: true });
    expect(higher.bestScore).toBe(300); // Yuksek skor yazilir
    expect(higher.bestTempo).toBe(4.5);
  });

  it("lastMatchReward alani xp, lp, coins degerlerini dogru raporlar", () => {
    const base = { ...DEFAULT_PROGRESS, lp: 500 };
    const res = applyMatchProgress(base, { score: 100, tempo: 3, won: true }, "pvp");
    expect(res.lastMatchReward).toBeDefined();
    expect(res.lastMatchReward!.coins).toBe(10);
    expect(res.lastMatchReward!.lp).toBe(30);
    expect(res.lastMatchReward!.xp).toBeGreaterThan(0);
  });

  it("beraberlik LP kazandirmaz ama XP kazandirmaya devam eder", () => {
    const base = { ...DEFAULT_PROGRESS, lp: 1000, xp: 0 };
    const draw = applyMatchProgress(base, { score: 70, tempo: 2, won: false, isDraw: true }, "pvp");
    expect(draw.lp).toBe(1000); // Beraberlik LP degistirmez
    expect(draw.xp).toBeGreaterThan(0); // Ama XP verir
  });
});

// ─── applyArcadeProgress Edge Case'ler ──────────────────────────────────────

describe("applyArcadeProgress - Sinir Deger ve Cip Hesaplari", () => {
  it("0 puan ile minimum 5 XP garantisi saglanir", () => {
    const res = applyArcadeProgress(DEFAULT_PROGRESS, 0);
    expect(res.xp).toBe(5); // Math.max(5, 0/10) = 5
    expect(res.coins).toBe(0);
  });

  it("50 puan ile 5 XP ve 1 cip verir", () => {
    const res = applyArcadeProgress(DEFAULT_PROGRESS, 50);
    expect(res.xp).toBe(5); // Math.max(5, 50/10=5) = 5
    expect(res.coins).toBe(1); // floor(50/40) = 1
  });

  it("200 puan ile 20 XP ve 5 cip verir", () => {
    const res = applyArcadeProgress(DEFAULT_PROGRESS, 200);
    expect(res.xp).toBe(20);
    expect(res.coins).toBe(5);
  });

  it("matches sayaci arcade'de artmaz", () => {
    const base = { ...DEFAULT_PROGRESS, matches: 10 };
    const res = applyArcadeProgress(base, 100);
    expect(res.matches).toBe(10);
  });

  it("bestArcadeScore her zaman maksimum degeri korur", () => {
    const base = { ...DEFAULT_PROGRESS, bestArcadeScore: 500 };
    expect(applyArcadeProgress(base, 300).bestArcadeScore).toBe(500); // Dusuk
    expect(applyArcadeProgress(base, 800).bestArcadeScore).toBe(800); // Yuksek
  });
});

// ─── applyVintageProgress Edge Case'ler ─────────────────────────────────────

describe("applyVintageProgress - Vintage Seviye Ilerleme Tutarlilik Testleri", () => {
  it("maksimum seviye 20 ile sinirlanir", () => {
    const progress = { ...DEFAULT_PROGRESS, vintageProgress: { maxUnlockedLevel: 19, completedLevels: [19], score: 0 } };
    const res = applyVintageProgress(progress, 19, 50);
    expect(res.vintageProgress!.maxUnlockedLevel).toBe(20);
  });

  it("ayni seviye iki kez cozulurse completedLevels'ta tekrar etmez", () => {
    const progress = { ...DEFAULT_PROGRESS };
    const first = applyVintageProgress(progress, 3, 60);
    const second = applyVintageProgress(first, 3, 40);
    const levels = second.vintageProgress!.completedLevels;
    expect(levels.filter((l) => l === 3)).toHaveLength(1); // Tekrar yok
  });

  it("kucuk skorlarda coin hesabi minimum 2 cipten asagi dusmez", () => {
    const res = applyVintageProgress(DEFAULT_PROGRESS, 1, 0); // score=0, fallback=30 default
    expect(res.coins).toBeGreaterThanOrEqual(2);
  });

  it("score 100'den kucukse vintage score artisi 100 olarak uygulanir", () => {
    const initial = { ...DEFAULT_PROGRESS, vintageProgress: { maxUnlockedLevel: 1, completedLevels: [], score: 0 } };
    const res = applyVintageProgress(initial, 1, 60);
    expect(res.vintageProgress!.score).toBe(100); // 60 < 100 oldugu icin 100 eklendi
  });

  it("score 100 ve uzeri ise gercek score eklenir", () => {
    const initial = { ...DEFAULT_PROGRESS, vintageProgress: { maxUnlockedLevel: 1, completedLevels: [], score: 0 } };
    const res = applyVintageProgress(initial, 1, 150);
    expect(res.vintageProgress!.score).toBe(150);
  });
});

// ─── getWeekId Tutarlilik ────────────────────────────────────────────────────

describe("getWeekId - Hafta Kimlik Tutarlilik Testleri", () => {
  it("ayni hafta icindeki farkli gunler ayni weekId'yi uretir", () => {
    // 2026-W37: 7-13 Eylul 2026
    const mon = getWeekId(new Date("2026-09-07"));
    const wed = getWeekId(new Date("2026-09-09"));
    const sun = getWeekId(new Date("2026-09-13"));
    expect(mon).toBe(wed);
    expect(wed).toBe(sun);
    expect(mon).toContain("2026-W");
  });

  it("farkli haftalar farkli weekId uretir", () => {
    const week37 = getWeekId(new Date("2026-09-09")); // Hf 37
    const week38 = getWeekId(new Date("2026-09-16")); // Hf 38
    expect(week37).not.toBe(week38);
  });

  it("weekId formati 'YYYY-Wxx' formatina uyar", () => {
    const weekId = getWeekId(new Date("2026-09-09"));
    expect(weekId).toMatch(/^\d{4}-W\d{2}$/);
  });
});

// ─── Lig Kademesi Edge Case'ler ──────────────────────────────────────────────

describe("getLeagueTier - Sinir Deger ve Tam Esik Testleri", () => {
  it("LP 0 ile DEMİR kademe verir", () => {
    expect(getLeagueTier(0).tier).toBe("DEMİR");
  });

  it("tam esiklerde dogru kademe vermeli", () => {
    expect(getLeagueTier(350).tier).toBe("BRONZ");
    expect(getLeagueTier(900).tier).toBe("GÜMÜŞ");
    expect(getLeagueTier(1600).tier).toBe("ALTIN");
    expect(getLeagueTier(2500).tier).toBe("PLATİN");
    expect(getLeagueTier(3600).tier).toBe("ELMAS");
    expect(getLeagueTier(5000).tier).toBe("YÜCELİK");
    expect(getLeagueTier(7000).tier).toBe("ÖLÜMSÜZLÜK");
    expect(getLeagueTier(10000).tier).toBe("RADIAN");
  });

  it("esik altindaki degerler bir asagi kademede kalir", () => {
    expect(getLeagueTier(349).tier).toBe("DEMİR"); // 350 tam bronz
    expect(getLeagueTier(899).tier).toBe("BRONZ");
    expect(getLeagueTier(1599).tier).toBe("GÜMÜŞ");
    expect(getLeagueTier(9999).tier).toBe("ÖLÜMSÜZLÜK");
  });
});

// ─── Sezon Gecmisi ve Soft Reset Derinlemesine ───────────────────────────────

describe("reconcileSeasonReset - Sezon Gecmisi Yonetimi", () => {
  it("soft reset sezon gecmisine dogru rank ve lp degerleriyle kaydeder", () => {
    const progress = { ...DEFAULT_PROGRESS, lp: 2000, lastSeasonResetId: "2026-S04" };
    const result = reconcileSeasonReset(progress, new Date("2026-09-01"));
    const history = result.updatedProgress.seasonHistory;
    expect(history).toHaveLength(1);
    expect(history![0].seasonId).toBe("2026-S04");
    expect(history![0].lp).toBe(2000);
    expect(history![0].rank).toBe("ALTIN");
  });

  it("ikinci sezon resetinde gecmis birikmeli ve eski sezon silinmemeli", () => {
    const progress = {
      ...DEFAULT_PROGRESS,
      lp: 1000,
      lastSeasonResetId: "2026-S04",
      seasonHistory: [{ seasonId: "2026-S03", rank: "DEMİR", lp: 200, date: "2026-05-01" }],
    };
    const first = reconcileSeasonReset(progress, new Date("2026-09-01"));
    expect(first.updatedProgress.seasonHistory).toHaveLength(2);
    expect(first.updatedProgress.seasonHistory![0].seasonId).toBe("2026-S03");
    expect(first.updatedProgress.seasonHistory![1].seasonId).toBe("2026-S04");
  });

  it("ayni sezon icinde tekrar reset edilmez", () => {
    const progress = { ...DEFAULT_PROGRESS, lp: 500, lastSeasonResetId: "2026-S05" };
    const result = reconcileSeasonReset(progress, new Date("2026-09-05"));
    expect(result.resetResult.seasonResetPerformed).toBe(false);
    expect(result.updatedProgress.lp).toBe(500); // LP degismemeli
  });

  it("yeni oyuncu (lastSeasonResetId yok) ilk reset gerceklesir", () => {
    const progress = { ...DEFAULT_PROGRESS, lp: 0 };
    const result = reconcileSeasonReset(progress, new Date("2026-09-01"));
    expect(result.resetResult.seasonResetPerformed).toBe(true);
  });
});

// ─── Kozmetik Katalog Benzersizligi ve Tutarlilik ───────────────────────────

describe("Kozmetik Katalog ID Benzersizligi ve Format Tutarliligi", () => {
  it("PROFILE_FRAMES ID'leri tum kataloglar arasinda benzersizdir", () => {
    const frameIds = PROFILE_FRAMES.map((f) => f[0]);
    const effectIds = VICTORY_EFFECTS.map((e) => e[0]);
    const boardIds = BOARD_SKINS.map((b) => b[0]);
    const chipIds = CHIP_EQUIPMENT_ITEMS.map((c) => c.id);

    const allIds = [...frameIds, ...effectIds, ...boardIds, ...chipIds];
    expect(new Set(allIds).size).toBe(allIds.length); // Hicbir ID tekrar etmemeli
  });

  it("her katalogda en az bir ucretsiz urun bulunmalidir (price=0)", () => {
    expect(PROFILE_FRAMES.some((f) => f[3] === 0)).toBe(true);
    expect(VICTORY_EFFECTS.some((e) => e[3] === 0)).toBe(true);
    expect(BOARD_SKINS.some((b) => b[3] === 0)).toBe(true);
  });

  it("tum katalog renklerinin hex formatinda oldugu dogrulanir", () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    PROFILE_FRAMES.forEach(([, , color]) => expect(color).toMatch(hexPattern));
    BOARD_SKINS.forEach(([, , color]) => expect(color).toMatch(hexPattern));
    AVATARS.forEach((a) => expect(a.color).toMatch(hexPattern));
  });

  it("katalog fiyatlari siralama tutarliligini saglar (ucuz -> pahali)", () => {
    const framePrices = PROFILE_FRAMES.map((f) => f[3]);
    const effectPrices = VICTORY_EFFECTS.map((e) => e[3]);
    const boardPrices = BOARD_SKINS.map((b) => b[3]);
    // Fiyatlar monoton artmali (sirali katalog)
    for (let i = 1; i < framePrices.length; i++) {
      expect(framePrices[i]).toBeGreaterThanOrEqual(framePrices[i - 1]);
    }
    for (let i = 1; i < effectPrices.length; i++) {
      expect(effectPrices[i]).toBeGreaterThanOrEqual(effectPrices[i - 1]);
    }
    for (let i = 1; i < boardPrices.length; i++) {
      expect(boardPrices[i]).toBeGreaterThanOrEqual(boardPrices[i - 1]);
    }
  });

  it("AVATAR katalogu 5 adet ve her birinin zorunlu alanlari var", () => {
    expect(AVATARS).toHaveLength(5);
    AVATARS.forEach((avatar) => {
      expect(avatar.id).toBeTruthy();
      expect(avatar.label).toBeTruthy();
      expect(avatar.icon).toBeTruthy();
      expect(avatar.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(avatar.surface).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(avatar.unlockHint).toBeTruthy();
    });
  });
});

// ─── getActiveCyberTitle Detayli Dogrulama ───────────────────────────────────

describe("getActiveCyberTitle - Unvan Secimi ve Kilitleme Mantigi", () => {
  it("0 XP oyuncusuna CAYLAK unvani verilir", () => {
    expect(getActiveCyberTitle(DEFAULT_PROGRESS)).toBe("[ÇAYLAK]");
  });

  it("3 mac sonrasi otomatik IZCI unvani devreye girer", () => {
    expect(getActiveCyberTitle({ ...DEFAULT_PROGRESS, matches: 3 })).toBe("[İZCİ]");
  });

  it("oyuncu kazandigi bir unvani elle kusanabilir", () => {
    const progressed = { ...DEFAULT_PROGRESS, matches: 3, selectedTitle: "[ÇAYLAK]" };
    expect(getActiveCyberTitle(progressed)).toBe("[ÇAYLAK]");
  });

  it("kilitli unvan secilirse fallback olarak en son acilan unvan doner", () => {
    const locked = { ...DEFAULT_PROGRESS, selectedTitle: "[SiBER HAKiM]" }; // 0 XP ile kilitli
    expect(getActiveCyberTitle(locked)).toBe("[ÇAYLAK]");
  });

  it("yuksek XP ile yuksek unvan kazanilir ve secili tutulabilir", () => {
    const highXP = { ...DEFAULT_PROGRESS, xp: 2100, selectedTitle: "[SİBER HAKİM]" };
    expect(getActiveCyberTitle(highXP)).toBe("[SİBER HAKİM]");
  });
});
