import { describe, expect, it } from "vitest";

import { createSoloBoard } from "../shared/solo";
import { applyMatchProgress, applyArcadeProgress, AVATARS, badgesFor, completeDailyProgress, DEFAULT_PROGRESS, getDailyChallenge, getDayId, THEME_PACKS, isAvatarUnlocked, getActiveCyberTitle, getDailyMysteryWord, reconcileDailyStreak, reconcileMissions, mergePlayerProgress, getUnclaimedMissionsCount, getUnclaimedMilestonesCount, getLeagueTier } from "../shared/progression";
import { catalogWordsForTheme } from "../shared/word-catalog";
import { inviteMessage, normalizeRoomCode } from "../shared/invite";
import { getWordDefinition } from "../shared/dictionary";
import { socialManager } from "../shared/social";
import { CHIP_EQUIPMENT_ITEMS } from "../components/cyber-store";

describe("Günlük rota ve sezon ilerlemesi", () => {
  it("aynı takvim günü için aynı günlük rota kimliğini ve sabit varyasyonu üretir", () => {
    const date = new Date("2026-08-19T09:30:00");
    const first = getDailyChallenge(date);
    const second = getDailyChallenge(date);
    expect(first).toEqual(second);
    expect(first.id).toBe(getDayId(date));
    expect(first.level).toBeGreaterThanOrEqual(20);
    expect(first.level).toBeLessThanOrEqual(24);
  });

  it("günlük ödülü aynı gün iki kez yazılmaz ve seri yalnız yeni günlükte artar", () => {
    const daily = getDailyChallenge(new Date("2026-08-19T09:30:00"));
    const claimed = completeDailyProgress(DEFAULT_PROGRESS, daily);
    const claimedAgain = completeDailyProgress(claimed, daily);
    expect(claimed.xp).toBe(daily.rewardXp);
    expect(claimed.streak).toBe(1);
    expect(claimed.missions.daily).toBe(1);
    expect(claimedAgain).toEqual(claimed);
  });

  it("maç raporu galibiyet, rekor, tempo ve görev ilerlemesini günceller", () => {
    const updated = applyMatchProgress(DEFAULT_PROGRESS, { score: 88, tempo: 4.5, won: true, longWord: true });
    expect(updated.matches).toBe(1);
    expect(updated.wins).toBe(1);
    expect(updated.bestScore).toBe(88);
    expect(updated.bestTempo).toBe(4.5);
    expect(updated.missions.duels).toBe(1);
    expect(updated.missions.wordsmith).toBe(1);
    expect(updated.xp).toBeGreaterThan(DEFAULT_PROGRESS.xp);

    const autoWordsmith = applyMatchProgress(DEFAULT_PROGRESS, { score: 50, tempo: 2, won: false, foundWords: ["DENEMELER"] });
    expect(autoWordsmith.missions.wordsmith).toBe(1);
  });

  it("XP ve LP'yi ayrı tutar ve dengeli maç oranlarını uygular", () => {
    const base = { ...DEFAULT_PROGRESS, xp: 600, lp: 0 };
    const win = applyMatchProgress(base, { score: 100, tempo: 3, won: true }, "pvp");
    const loss = applyMatchProgress(base, { score: 40, tempo: 1, won: false }, "pvp");
    const draw = applyMatchProgress(base, { score: 70, tempo: 2, won: false, isDraw: true }, "pvp");

    expect(win.xp).toBe(660);
    expect(win.lp).toBe(25);
    expect(loss.xp).toBe(635);
    expect(loss.lp).toBe(0);
    expect(draw.xp).toBe(640);
    expect(draw.lp).toBe(0);
    expect(getLeagueTier({ ...base, xp: 900, lp: 0 }).tier).toBe("DEMİR");
  });

  it("arcade raporu en yüksek skoru ve XP ilerlemesini günceller", () => {
    const updated = applyArcadeProgress(DEFAULT_PROGRESS, 120);
    expect(updated.bestArcadeScore).toBe(120);
    expect(updated.xp).toBe(12); // 120 / 10 = 12 XP
    expect(updated.matches).toBe(0); // matches should not increment
  });

  it("mağaza ekipman fiyatları ödül değerine göre dengeli kalır", () => {
    expect(CHIP_EQUIPMENT_ITEMS.find((item) => item.id === "radar_5")?.cost).toBe(75);
    expect(CHIP_EQUIPMENT_ITEMS.find((item) => item.id === "shield_1")?.cost).toBe(120);
    expect(CHIP_EQUIPMENT_ITEMS.find((item) => item.id === "xp_250")?.cost).toBe(150);
    expect(CHIP_EQUIPMENT_ITEMS.find((item) => item.id === "avatar_crown")?.cost).toBe(300);
  });

  it("dokuz lig kademesini LP eşiklerine göre seçer", () => {
    const expected = [
      [0, "DEMİR"],
      [350, "BRONZ"],
      [900, "GÜMÜŞ"],
      [1600, "ALTIN"],
      [2500, "PLATİN"],
      [3600, "ELMAS"],
      [5000, "YÜCELİK"],
      [7000, "ÖLÜMSÜZLÜK"],
      [10000, "RADIAN"],
    ] as const;
    expected.forEach(([points, tier]) => expect(getLeagueTier(points).tier).toBe(tier));
    expect(getLeagueTier(349).tier).toBe("DEMİR");
    expect(getLeagueTier(899).tier).toBe("BRONZ");
  });

  it("başarı rozetlerinin kilit açılma şartlarını doğru değerlendirir", () => {
    const fresh = badgesFor(DEFAULT_PROGRESS);
    expect(fresh.every((b) => !b.unlocked)).toBe(true);

    const advanced = badgesFor({
      ...DEFAULT_PROGRESS,
      matches: 6,
      wins: 1,
      streak: 7,
      bestArcadeScore: 550,
      xp: 650,
      missions: { daily: 1, duels: 2, wordsmith: 1 },
    });
    expect(advanced.every((b) => b.unlocked)).toBe(true);
  });

  it("her tema paketi seçilebilir kelimeler ve geçerli tek oyunculu rota üretir", () => {
    THEME_PACKS.forEach((pack) => {
      expect(catalogWordsForTheme(6, pack.id).length).toBeGreaterThanOrEqual(3);
      const challenge = createSoloBoard(16, 37, pack.id);
      expect(challenge.board).toHaveLength(36);
      expect(challenge.board.every(Boolean)).toBe(true);
      expect(challenge.words.length).toBeGreaterThanOrEqual(4);
    });
  });

  it("avatar koleksiyonu seçilebilir kimlikler sunar ve rozetler ilerlemeye göre açılır", () => {
    expect(AVATARS).toHaveLength(6);
    expect(AVATARS.some((avatar) => avatar.id === DEFAULT_PROGRESS.selectedAvatar)).toBe(true);
    const rookieBadges = badgesFor(DEFAULT_PROGRESS);
    expect(rookieBadges.every((badge) => !badge.unlocked)).toBe(true);
    const seasoned = { ...DEFAULT_PROGRESS, xp: 600, bestArcadeScore: 500, matches: 6, wins: 1, streak: 7, missions: { daily: 1, duels: 2, wordsmith: 1 } };
    expect(badgesFor(seasoned).every((badge) => badge.unlocked)).toBe(true);
  });

  it("davet kodunu güvenli biçimde normalleştirip paylaşılabilir mesajı üretir", () => {
    expect(normalizeRoomCode(" ab12c ")).toBe("AB12C");
    expect(normalizeRoomCode("abc")).toBeNull();
    expect(normalizeRoomCode(["ABCDE"])).toBeNull();
    expect(inviteMessage("AB12C", "kelime://room?code=AB12C")).toContain("AB12C");
  });

  it("avatar kilit açma milestones durumlarını doğru kontrol eder", () => {
    // KIVILCIM (spark) her zaman açık olmalı
    expect(isAvatarUnlocked("spark", DEFAULT_PROGRESS)).toBe(true);

    // YÖRÜNGE (orbit) seviye 3 gerektirir (xp 0 = seviye 1, xp 400 = seviye 3)
    expect(isAvatarUnlocked("orbit", DEFAULT_PROGRESS)).toBe(false);
    expect(isAvatarUnlocked("orbit", { ...DEFAULT_PROGRESS, xp: 400 })).toBe(true);

    // BİLGE (sage) seviye 6 gerektirir (xp 1000 = seviye 6)
    expect(isAvatarUnlocked("sage", DEFAULT_PROGRESS)).toBe(false);
    expect(isAvatarUnlocked("sage", { ...DEFAULT_PROGRESS, xp: 1000 })).toBe(true);

    // KUYRUKLU (comet) arcade skoru 400 gerektirir
    expect(isAvatarUnlocked("comet", DEFAULT_PROGRESS)).toBe(false);
    expect(isAvatarUnlocked("comet", { ...DEFAULT_PROGRESS, bestArcadeScore: 400 })).toBe(true);

    // TAÇ (crown) galibiyet 5 veya satın alma gerektirir
    expect(isAvatarUnlocked("crown", DEFAULT_PROGRESS)).toBe(false);
    expect(isAvatarUnlocked("crown", { ...DEFAULT_PROGRESS, wins: 5 })).toBe(true);
    expect(isAvatarUnlocked("crown", { ...DEFAULT_PROGRESS, purchasedAvatars: { crown: true } })).toBe(true);
    expect(isAvatarUnlocked("crown", { ...DEFAULT_PROGRESS, selectedAvatar: "crown" })).toBe(true);

    // KOR (ember) seri 5 gerektirir
    expect(isAvatarUnlocked("ember", DEFAULT_PROGRESS)).toBe(false);
    expect(isAvatarUnlocked("ember", { ...DEFAULT_PROGRESS, streak: 5 })).toBe(true);
  });

  it("kelime sözlük tanımlarını ve fallback yapısını doğru çözer", () => {
    // Bilinen kelimelerin tanımlarını alabilmeli
    expect(getWordDefinition("AY")).toBe("Dünya'nın tek doğal uydusu olan gök cismi.");
    expect(getWordDefinition("ADA")).toBe("Dört tarafı tamamen suyla çevrili kara parçası.");

    // Küçük harfle arandığında da doğru dönmeli (büyük harfe dönüştürülmeli)
    expect(getWordDefinition("ay")).toBe("Dünya'nın tek doğal uydusu olan gök cismi.");
    expect(getWordDefinition("deniz")).toBe("Yeryüzünün büyük kısmını kaplayan geniş tuzlu su kütlesi.");

    // Bilinmeyen kelimelerde siberpunk fallback metnini dönmeli
    expect(getWordDefinition("BİLİNMEYEN")).toContain("Kelime Patlat ile kelime dağarcığını zenginleştir!");
  });

  it("siber unvanları ve günün gizemli kelimesini doğru çözer", () => {
    expect(getActiveCyberTitle(DEFAULT_PROGRESS)).toBe("[ÇAYLAK]");
    expect(getActiveCyberTitle({ ...DEFAULT_PROGRESS, matches: 3 })).toBe("[İZCİ]");
    expect(getActiveCyberTitle({ ...DEFAULT_PROGRESS, xp: 500 })).toBe("[MİMAR]");

    const mystery = getDailyMysteryWord(new Date("2026-08-19"));
    expect(mystery.word).toBeTruthy();
    expect(mystery.definition).toBeTruthy();
    expect(mystery.rewardXp).toBe(150);
    expect(DEFAULT_PROGRESS.streakShields).toBe(1);
  });

  it("günün gizemli kelimesi ve görev tamamlamaları için ekstra XP ve çip ödülü verir", () => {
    const mystery = getDailyMysteryWord();
    // Finding the mystery word awards +150 XP bonus
    const resultWithMystery = applyMatchProgress(DEFAULT_PROGRESS, {
      score: 100,
      tempo: 3,
      won: true,
      foundWords: [mystery.word],
    }, "pvp");

    expect(resultWithMystery.xp).toBeGreaterThanOrEqual(150 + 60);
    expect(resultWithMystery.coins).toBe((DEFAULT_PROGRESS.coins ?? 50) + 25);
    // Completing duels mission (2/2) gives +80 XP bonus
    const duel2 = applyMatchProgress({ ...DEFAULT_PROGRESS, missions: { daily: 0, duels: 1, wordsmith: 0 } }, {
      score: 50,
      tempo: 2,
      won: false,
    }, "pvp");
    expect(duel2.missions.duels).toBe(2);
    expect(duel2.xp).toBe(35 + 80); // 35 pvp + 80 mission reward
  });

  it("gün kaçırıldığında seri kalkanı varsa seriyi korur ve kalkanı eksiltir", () => {
    const pastProgress = {
      ...DEFAULT_PROGRESS,
      dailyCompletedId: "2026-09-05",
      streak: 5,
      streakShields: 2,
    };

    // 2026-09-07 tarihinde açıldı (2026-09-06 kaçırıldı, 1 gün kaçırıldı)
    const result = reconcileDailyStreak(pastProgress, "2026-09-07");
    expect(result.shieldUsed).toBe(true);
    expect(result.shieldsConsumed).toBe(1);
    expect(result.streakReset).toBe(false);
    expect(result.updatedProgress.streak).toBe(5);
    expect(result.updatedProgress.streakShields).toBe(1);
    expect(result.updatedProgress.lastStreakCheckDate).toBe("2026-09-07");

    // Aynı gün tekrar açıldığında tekrar kalkan harcamaz
    const secondCheck = reconcileDailyStreak(result.updatedProgress, "2026-09-07");
    expect(secondCheck.shieldUsed).toBe(false);
    expect(secondCheck.shieldsConsumed).toBe(0);
    expect(secondCheck.updatedProgress.streakShields).toBe(1);
  });

  it("gün kaçırıldığında kalkan yoksa seriyi sıfırlar", () => {
    const pastProgress = {
      ...DEFAULT_PROGRESS,
      dailyCompletedId: "2026-09-05",
      streak: 5,
      streakShields: 0,
    };

    // 2026-09-07 tarihinde açıldı (2026-09-06 kaçırıldı, kalkan yok)
    const result = reconcileDailyStreak(pastProgress, "2026-09-07");
    expect(result.shieldUsed).toBe(false);
    expect(result.streakReset).toBe(true);
    expect(result.previousStreak).toBe(5);
    expect(result.updatedProgress.streak).toBe(0);
  });

  it("dün oynandıysa seri bozulmaz ve kalkan harcanmaz", () => {
    const yesterdayProgress = {
      ...DEFAULT_PROGRESS,
      dailyCompletedId: "2026-09-06",
      streak: 3,
      streakShields: 1,
    };

    // 2026-09-07 tarihinde açıldı (dün tamamlanmış, bugün henüz oynanmadı)
    const result = reconcileDailyStreak(yesterdayProgress, "2026-09-07");
    expect(result.shieldUsed).toBe(false);
    expect(result.streakReset).toBe(false);
    expect(result.updatedProgress.streak).toBe(3);
    expect(result.updatedProgress.streakShields).toBe(1);
  });

  it("yeni gün geldiğinde günlük görevler sıfırlanır, yeni haftada haftalık görevler yenilenir", () => {
    const completedProgress = {
      ...DEFAULT_PROGRESS,
      missions: { daily: 1, duels: 2, wordsmith: 1 },
      missionsDate: "2026-09-06",
      weeklyClaimed: { victoryStreak: true },
      weeklyMissionsWeek: "2026-W36",
    };

    // Aynı gün içinde görevler sıfırlanmaz
    const sameDay = reconcileMissions(completedProgress, "2026-09-06", "2026-W36");
    expect(sameDay.missions.daily).toBe(1);
    expect(sameDay.missions.duels).toBe(2);
    expect(sameDay.weeklyClaimed?.victoryStreak).toBe(true);

    // Yeni günde günlük görevler sıfırlanır
    const nextDay = reconcileMissions(completedProgress, "2026-09-07", "2026-W36");
    expect(nextDay.missions.daily).toBe(0);
    expect(nextDay.missions.duels).toBe(0);
    expect(nextDay.missions.wordsmith).toBe(0);
    expect(nextDay.missionsDate).toBe("2026-09-07");
    expect(nextDay.weeklyClaimed?.victoryStreak).toBe(true); // Aynı hafta içinde haftalık kalır

    // Yeni haftada haftalık görev ödülleri de yenilenir
    const nextWeek = reconcileMissions(completedProgress, "2026-09-08", "2026-W37");
    expect(nextWeek.weeklyClaimed).toEqual({});
    expect(nextWeek.weeklyMissionsWeek).toBe("2026-W37");
  });

  it("spor ve yemek temalarına ait kelimelerin sözlük tanımları eksiksizdir", () => {
    expect(getWordDefinition("FUTBOL")).toContain("ayakla oynanan popüler spor");
    expect(getWordDefinition("BASKET")).toContain("topun çemberden geçirilmesi");
    expect(getWordDefinition("PENALTI")).toContain("11 metre vuruşu");
    expect(getWordDefinition("BAKLAVA")).toContain("şerbetlenen efsanevi Türk tatlısı");
    expect(getWordDefinition("KAHVE")).toContain("aromatik içecek");
    expect(getWordDefinition("PEYNİR")).toContain("süt ürünü");
  });

  it("arkadaş ekleme, mükerrer kontrolü ve çıkarma işlemlerini doğru yönetir", () => {
    const initialCount = socialManager.getFriends().length;
    const addRes = socialManager.addFriend("siber_avci");
    expect(addRes.success).toBe(true);
    expect(socialManager.getFriends().length).toBe(initialCount + 1);

    // Aynı kullanıcı adı tekrar eklenemez
    const dupRes = socialManager.addFriend("siber_avci");
    expect(dupRes.success).toBe(false);
    expect(dupRes.message).toContain("zaten arkadaş listenizde");

    // Arkadaş çıkarma
    const added = addRes.friend!;
    const removeRes = socialManager.removeFriend(added.id);
    expect(removeRes.success).toBe(true);
    expect(socialManager.getFriends().some((f) => f.id === added.id)).toBe(false);
  });

  it("mergePlayerProgress yerel ve bulut verilerini kayıpsız birleştirir", () => {
    const local = {
      ...DEFAULT_PROGRESS,
      xp: 500,
      coins: 120,
      streakShields: 3,
      radarChargesBonus: 5,
      streak: 4,
      wins: 8,
      matches: 12,
      bestArcadeScore: 450,
      claimedMilestones: { 15: true },
      purchasedAvatars: { crown: true },
    };

    const remote = {
      xp: 200,
      coins: 60,
      streakShields: 1,
      streak: 2,
      wins: 2,
      bestScore: 240,
      claimedMilestones: { 30: true },
    };

    const merged = mergePlayerProgress(local, remote);
    expect(merged.xp).toBe(500);
    expect(merged.coins).toBe(120);
    expect(merged.streakShields).toBe(3);
    expect(merged.radarChargesBonus).toBe(5);
    expect(merged.streak).toBe(4);
    expect(merged.wins).toBe(8);
    expect(merged.matches).toBe(12);
    expect(merged.bestScore).toBe(240);
    expect(merged.bestArcadeScore).toBe(450);
    expect(merged.claimedMilestones).toEqual({ 15: true, 30: true });
    expect(merged.purchasedAvatars?.crown).toBe(true);
  });

  it("arcade modunda yüksek skor elde eden oyuncuya çip ve XP ödülü verir", () => {
    const initial = { ...DEFAULT_PROGRESS, coins: 50, xp: 0 };
    const res = applyArcadeProgress(initial, 200);
    expect(res.xp).toBe(20);
    expect(res.coins).toBe(55); // 50 + Math.floor(200 / 40) = 55
  });

  it("günün gizemli kelimesini Türkçe harf duyarlılığıyla (İ/i, I/ı) doğru tanır ve bonus XP verir", () => {
    const mystery = getDailyMysteryWord();
    const lowerWord = mystery.word.toLocaleLowerCase("tr-TR");
    const res = applyMatchProgress(DEFAULT_PROGRESS, {
      score: 50,
      tempo: 2,
      won: true,
      foundWords: [lowerWord],
    }, "pvp");

    expect(res.xp).toBeGreaterThanOrEqual(mystery.rewardXp);
  });

  it("tüm siber temalar benzersiz kimliklere ve görsel yapılandırmalara sahiptir", () => {
    expect(THEME_PACKS.length).toBe(6);
    const ids = new Set(THEME_PACKS.map((t) => t.id));
    expect(ids.size).toBe(6);
    THEME_PACKS.forEach((theme) => {
      expect(theme.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.icon.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("tamamlanan ve toplanmayı bekleyen günlük ve haftalık görev sayısını (badge count) doğru hesaplar", () => {
    // 1. Sıfır görev tamamlanmışken sayı 0'dır
    expect(getUnclaimedMissionsCount(DEFAULT_PROGRESS)).toBe(0);

    // 2. Günlük görev tamamlandığında sayaç 1 artar
    const oneDailyDone = {
      ...DEFAULT_PROGRESS,
      missions: { daily: 1, duels: 0, wordsmith: 0 },
    };
    expect(getUnclaimedMissionsCount(oneDailyDone)).toBe(1);

    // 3. İki günlük görev tamamlandığında sayaç 2 olur
    const twoDailyDone = {
      ...DEFAULT_PROGRESS,
      missions: { daily: 1, duels: 2, wordsmith: 0 },
    };
    expect(getUnclaimedMissionsCount(twoDailyDone)).toBe(2);

    // 4. Biri alındığında sayaç 1'e düşer
    const oneClaimed = {
      ...twoDailyDone,
      dailyClaimed: { daily: true },
    };
    expect(getUnclaimedMissionsCount(oneClaimed)).toBe(1);

    // 5. Haftalık görev (3 galibiyet) tamamlandığında sayaca eklenir
    const withWeekly = {
      ...oneClaimed,
      wins: 3,
    };
    expect(getUnclaimedMissionsCount(withWeekly)).toBe(2);

    // 6. Arcade haftalık görevi de tamamlandığında sayaca eklenir
    const withArcade = {
      ...withWeekly,
      bestArcadeScore: 450,
    };
    expect(getUnclaimedMissionsCount(withArcade)).toBe(3);

    // 7. Tüm görevler toplandığında sayaç 0'a iner
    const allClaimed = {
      ...withArcade,
      dailyClaimed: { daily: true, duels: true, wordsmith: true },
      weeklyClaimed: { victoryStreak: true, speedDemon: true },
    };
    expect(getUnclaimedMissionsCount(allClaimed)).toBe(0);
  });

  it("getUnclaimedMilestonesCount solo kilitli/açılmış sandık sayılarını doğru hesaplar", () => {
    // 1. Seviye 1-15 arasında henüz 15 tamamlanmadığı için açılmış sandık yoktur
    expect(getUnclaimedMilestonesCount(DEFAULT_PROGRESS, 1)).toBe(0);
    expect(getUnclaimedMilestonesCount(DEFAULT_PROGRESS, 15)).toBe(0);

    // 2. Seviye 15 tamamlandığında (unlockedLevel = 16), 1 sandık açılır (Seviye 15 Sandığı)
    expect(getUnclaimedMilestonesCount(DEFAULT_PROGRESS, 16)).toBe(1);

    // 3. Seviye 15 sandığı alındığında sayaç 0 olur
    const level15Claimed = {
      ...DEFAULT_PROGRESS,
      claimedMilestones: { 15: true },
    };
    expect(getUnclaimedMilestonesCount(level15Claimed, 16)).toBe(0);

    // 4. Seviye 45 tamamlandığında (unlockedLevel = 46), seviye 30 ve 45 sandıkları bekler (2 adet)
    expect(getUnclaimedMilestonesCount(level15Claimed, 46)).toBe(2);

    // 5. Seviye 100 tamamlandığında (unlockedLevel = 101), tüm 6 sandıktan alınmamış olanlar sayılır
    expect(getUnclaimedMilestonesCount(DEFAULT_PROGRESS, 101)).toBe(6);
  });

  it("seçilmiş unvan (selectedTitle) ve unvan kuşanma mantığını destekler", () => {
    // Varsayılan unvan Çaylak unvanıdır
    expect(getActiveCyberTitle(DEFAULT_PROGRESS)).toBe("[ÇAYLAK]");

    // 3 maç tamamlandığında otomatik olarak [İZCİ] unvanı devreye girer
    const progressed = { ...DEFAULT_PROGRESS, matches: 3 };
    expect(getActiveCyberTitle(progressed)).toBe("[İZCİ]");

    // Oyuncu daha önce açtığı [ÇAYLAK] unvanını elle kuşandığında [ÇAYLAK] döner
    const customEquipped = {
      ...progressed,
      selectedTitle: "[ÇAYLAK]",
    };
    expect(getActiveCyberTitle(customEquipped)).toBe("[ÇAYLAK]");

    // mergePlayerProgress selectedTitle'ı korur
    const merged = mergePlayerProgress(DEFAULT_PROGRESS, customEquipped);
    expect(merged.selectedTitle).toBe("[ÇAYLAK]");
  });
});
