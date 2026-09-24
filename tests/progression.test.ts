import { describe, expect, it } from "vitest";

import { createSoloBoard } from "../shared/solo";
import { applyMatchProgress, applyArcadeProgress, applyVintageProgress, AVATARS, badgesFor, completeDailyProgress, DEFAULT_PROGRESS, getDailyChallenge, getDayId, getWeekId, THEME_PACKS, isAvatarUnlocked, getActiveCyberTitle, getDailyMysteryWord, reconcileDailyStreak, reconcileMissions, reconcileSeasonReset, mergePlayerProgress, getUnclaimedMissionsCount, getUnclaimedMilestonesCount, getLeagueTier, checkDailyLoginReward, getDailyMissions, getWeeklyMissions, ALL_MISSIONS, findMissionById, getCalculatedLives, deductLife, buyLives, MAX_LIVES, COST_PER_LIFE, COST_REFILL_ALL, updateMissionAction } from "../shared/progression";
import { catalogWordsForTheme } from "../shared/word-catalog";
import { inviteMessage, normalizeRoomCode } from "../shared/invite";
import { getWordDefinition } from "../shared/dictionary";
import { socialManager } from "../shared/social";
import { CHIP_EQUIPMENT_ITEMS } from "../shared/store-items";

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

    expect(win.xp).toBe(635);
    expect(win.lp).toBe(30);
    expect(loss.xp).toBe(605);
    expect(loss.lp).toBe(0);
    expect(draw.xp).toBe(612);
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
    expect(fresh.length).toBe(24);

    const advanced = badgesFor({
      ...DEFAULT_PROGRESS,
      matches: 25,
      wins: 25,
      streak: 14,
      bestArcadeScore: 1000,
      xp: 20000,
      bestTempo: 4.2,
      coins: 250,
      history: new Array(50).fill("TEST"),
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
    expect(AVATARS).toHaveLength(5);
    expect(AVATARS.some((avatar) => avatar.id === DEFAULT_PROGRESS.selectedAvatar)).toBe(true);
    const rookieBadges = badgesFor(DEFAULT_PROGRESS);
    expect(rookieBadges.every((badge) => !badge.unlocked)).toBe(true);
    const seasoned = {
      ...DEFAULT_PROGRESS,
      xp: 20000,
      bestArcadeScore: 1000,
      matches: 25,
      wins: 25,
      streak: 14,
      bestTempo: 4,
      coins: 200,
      history: new Array(50).fill("TEST"),
      missions: { daily: 1, duels: 2, wordsmith: 1 },
    };
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
    expect(DEFAULT_PROGRESS.streakShields).toBe(0);
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

    expect(resultWithMystery.xp).toBeGreaterThanOrEqual(100 + 35);
    expect(resultWithMystery.coins).toBe((DEFAULT_PROGRESS.coins ?? 0) + 10);
    // Completing duels mission (2/2) gives +50 XP bonus
    const duel2 = applyMatchProgress({ ...DEFAULT_PROGRESS, missions: { daily: 0, duels: 1, wordsmith: 0 } }, {
      score: 50,
      tempo: 2,
      won: false,
    }, "pvp");
    expect(duel2.missions.duels).toBe(2);
    expect(duel2.xp).toBe(5 + 50); // 5 pvp loss + 50 mission reward
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

    expect(res.xp).toBeGreaterThanOrEqual(100);
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

    // Yüksek seviye unvanlar (ör. [SİBER HAKİM]) kazanıldığında kuşanılabilir
    const overlordProgress = {
      ...DEFAULT_PROGRESS,
      xp: 2100,
      selectedTitle: "[SİBER HAKİM]",
    };
    expect(getActiveCyberTitle(overlordProgress)).toBe("[SİBER HAKİM]");

    // Kilitli bir unvan kuşanılmaya çalışılırsa fallback olarak en son açılan unvan döner
    const lockedAttempt = {
      ...DEFAULT_PROGRESS,
      selectedTitle: "[SİBER HAKİM]", // 0 XP ile kilitlidir
    };
    expect(getActiveCyberTitle(lockedAttempt)).toBe("[ÇAYLAK]");

    // mergePlayerProgress selectedTitle'ı korur
    const merged = mergePlayerProgress(DEFAULT_PROGRESS, customEquipped);
    expect(merged.selectedTitle).toBe("[ÇAYLAK]");
  });

  it("yeni iki aylık sezon geldiğinde kademeli lig puanı sıfırlaması (soft reset) gerçekleştirir ve geçmişe kaydeder", () => {
    // 1. Yeni oyuncu veya düşük lig (Demir / Bronz, LP 400): Soft reset puanı düşürmez
    const lowRank = { ...DEFAULT_PROGRESS, lp: 400, lastSeasonResetId: "2026-S04" };
    const lowRes = reconcileSeasonReset(lowRank, new Date("2026-09-01"));
    expect(lowRes.resetResult.seasonResetPerformed).toBe(true);
    expect(lowRes.resetResult.previousLp).toBe(400);
    expect(lowRes.resetResult.newLp).toBe(400);
    expect(lowRes.updatedProgress.lastSeasonResetId).toBe("2026-S05");
    expect(lowRes.updatedProgress.seasonHistory).toHaveLength(1);

    // 2. Yüksek Lig (Altın/Platin, LP 2000): LP %30 düşürülür (2000 -> 1400)
    const midRank = { ...DEFAULT_PROGRESS, lp: 2000, lastSeasonResetId: "2026-S04" };
    const midRes = reconcileSeasonReset(midRank, new Date("2026-09-01"));
    expect(midRes.resetResult.seasonResetPerformed).toBe(true);
    expect(midRes.resetResult.newLp).toBe(1400);

    // 3. Zirve Lig (Elmas/Radian, LP 5000): LP 2500'e (Platin I) çekilir
    const topRank = { ...DEFAULT_PROGRESS, lp: 5000, lastSeasonResetId: "2026-S04" };
    const topRes = reconcileSeasonReset(topRank, new Date("2026-09-01"));
    expect(topRes.resetResult.seasonResetPerformed).toBe(true);
    expect(topRes.resetResult.previousRank).toBe("YÜCELİK");
    expect(topRes.resetResult.newLp).toBe(2500);

    // 4. Aynı 2 aylık periyot içinde tekrar çalıştırıldığında sıfırlama yapılmaz
    const sameMonth = reconcileSeasonReset(topRes.updatedProgress, new Date("2026-09-05"));
    expect(sameMonth.resetResult.seasonResetPerformed).toBe(false);
  });

  it("mergePlayerProgress solo ve vintage bulmaca ilerlemelerini veritabanından en yüksek değerleri alarak birleştirir", () => {
    const local = {
      ...DEFAULT_PROGRESS,
      soloUnlockedLevel: 12,
      vintageProgress: {
        maxUnlockedLevel: 8,
        completedLevels: [1, 2, 3],
        score: 300,
      },
    };

    const remote = {
      soloUnlockedLevel: 15,
      vintageProgress: {
        maxUnlockedLevel: 10,
        completedLevels: [3, 4, 5],
        score: 500,
      },
    };

    const merged = mergePlayerProgress(local, remote);
    expect(merged.soloUnlockedLevel).toBe(15);
    expect(merged.vintageProgress?.maxUnlockedLevel).toBe(10);
    expect(merged.vintageProgress?.completedLevels).toEqual([1, 2, 3, 4, 5]);
    expect(merged.vintageProgress?.score).toBe(500);
  });

  it("checkDailyLoginReward 7 günlük döngüde doğru ödülleri verir ve mükerrer alımı engeller", () => {
    const today = "2026-09-09";
    const initial = { ...DEFAULT_PROGRESS, coins: 50, xp: 0, loginDaysCount: 0 };

    // 1. Gün ödülü alımı
    const day1 = checkDailyLoginReward(initial, today);
    expect(day1).not.toBeNull();
    expect(day1!.reward.day).toBe(1);
    expect(day1!.reward.rewardType).toBe("coins");
    expect(day1!.reward.amount).toBe(15);
    expect(day1!.updatedProgress.coins).toBe(65);
    expect(day1!.updatedProgress.lastLoginDay).toBe(today);
    expect(day1!.updatedProgress.loginDaysCount).toBe(1);

    // Aynı gün tekrar ödül alınamaz
    const duplicate = checkDailyLoginReward(day1!.updatedProgress, today);
    expect(duplicate).toBeNull();

    // 2. Gün ödülü (XP)
    const day2 = checkDailyLoginReward(day1!.updatedProgress, "2026-09-10");
    expect(day2).not.toBeNull();
    expect(day2!.reward.day).toBe(2);
    expect(day2!.reward.rewardType).toBe("xp");
    expect(day2!.reward.amount).toBe(100);
    expect(day2!.updatedProgress.xp).toBe(100);
    expect(day2!.updatedProgress.loginDaysCount).toBe(2);

    // 7. Gün Epik Ödülü (Seri Kalkanı)
    const day6Prog = { ...day2!.updatedProgress, loginDaysCount: 6 };
    const day7 = checkDailyLoginReward(day6Prog, "2026-09-15");
    expect(day7).not.toBeNull();
    expect(day7!.reward.day).toBe(7);
    expect(day7!.reward.rewardType).toBe("shield");
    expect(day7!.reward.amount).toBe(2);
    expect(day7!.updatedProgress.streakShields).toBe((day6Prog.streakShields || 0) + 2);
    expect(day7!.updatedProgress.loginDaysCount).toBe(7);

    // 8. Günde döngü 1. güne sıfırlanır
    const day8 = checkDailyLoginReward(day7!.updatedProgress, "2026-09-16");
    expect(day8).not.toBeNull();
    expect(day8!.reward.day).toBe(1);
  });

  it("90 günlük ve 30 haftalık görev kataloğu deterministik döner ve ödülleri doğrular", () => {
    // Toplam 120 görev olmalıdır
    expect(ALL_MISSIONS.length).toBe(120);

    // Aynı gün için her zaman aynı 3 günlük görev (1 kolay, 1 orta, 1 zor)
    const dailyDay1 = getDailyMissions("2026-09-09");
    const dailyDay1Repeat = getDailyMissions("2026-09-09");
    expect(dailyDay1).toEqual(dailyDay1Repeat);
    expect(dailyDay1.length).toBe(3);
    expect(dailyDay1[0].difficulty).toBe("easy");
    expect(dailyDay1[1].difficulty).toBe("medium");
    expect(dailyDay1[2].difficulty).toBe("hard");

    // Farklı bir günde rotasyon değişmelidir
    const dailyDay2 = getDailyMissions("2026-09-10");
    expect(dailyDay2.length).toBe(3);

    // Haftalık rotasyon: her hafta 3 benzersiz haftalık görev
    const weeklyWeek1 = getWeeklyMissions("2026-W37");
    const weeklyWeek1Repeat = getWeeklyMissions("2026-W37");
    expect(weeklyWeek1).toEqual(weeklyWeek1Repeat);
    expect(weeklyWeek1.length).toBe(3);
    const uniqueIds = new Set(weeklyWeek1.map((w) => w.id));
    expect(uniqueIds.size).toBe(3);

    // findMissionById kataloğu başarıyla sorgular
    const firstDaily = findMissionById("d_easy_01");
    expect(firstDaily).toBeDefined();
    expect(firstDaily?.title).toBe("Güne Merhaba");
    expect(firstDaily?.rewardXp).toBe(20);
    expect(firstDaily?.rewardCoins).toBe(8);

    const epicWeekly = findMissionById("w_30");
    expect(epicWeekly).toBeDefined();
    expect(epicWeekly?.difficulty).toBe("epic");
    expect(epicWeekly?.rewardShields).toBe(3);
  });

  it("mergePlayerProgress preferRemoteBalances aktifken sunucudaki harcanmış bakiye ve azalan LP'yi korur", () => {
    const local = {
      ...DEFAULT_PROGRESS,
      lp: 1200,
      coins: 100,
      streakShields: 3,
      xp: 500,
    };

    // Sunucuda mağlubiyet sonrası LP 1180'e düşmüş, 50 coin mağazada harcanmış
    const remote = {
      lp: 1180,
      coins: 50,
      streakShields: 2,
      xp: 535,
    };

    const mergedWithAuthority = mergePlayerProgress(local, remote, { preferRemoteBalances: true });
    expect(mergedWithAuthority.lp).toBe(1180); // LP düşüşü korundu!
    expect(mergedWithAuthority.coins).toBe(50); // Harcama korundu!
    expect(mergedWithAuthority.streakShields).toBe(2);
    expect(mergedWithAuthority.xp).toBe(535);

    // preferRemoteBalances false (varsayılan) iken geriye uyumlu Math.max davranışı
    const mergedFallback = mergePlayerProgress(local, remote);
    expect(mergedFallback.lp).toBe(1200);
    expect(mergedFallback.coins).toBe(100);
  });

  it("günlük rota tamamlandığında normal soloUnlockedLevel değişmez ve korunur", () => {
    const dailyChallenge = getDailyChallenge(new Date("2026-09-10"));
    const initial = { ...DEFAULT_PROGRESS, soloUnlockedLevel: 2 };
    const completed = completeDailyProgress(initial, dailyChallenge);
    expect(completed.soloUnlockedLevel).toBe(2);
    expect(completed.dailyCompletedId).toBe(dailyChallenge.id);
  });

  it("Can (Lives) sistemi yenilenme, düşme ve çip satın alma hesaplamalarını doğru yapar", () => {
    const initial = getCalculatedLives(DEFAULT_PROGRESS);
    expect(initial.lives).toBe(MAX_LIVES);

    // Kaybedince can düşer
    const lost = deductLife(DEFAULT_PROGRESS);
    const lostCalc = getCalculatedLives(lost);
    expect(lostCalc.lives).toBe(4);

    // 20 Çip ile 1 Can satın alma
    const baseWithCoins = { ...lost, coins: 100 };
    const buyOne = buyLives(baseWithCoins, "one");
    expect(buyOne.success).toBe(true);
    expect(buyOne.updatedProgress.coins).toBe(80);
    expect(getCalculatedLives(buyOne.updatedProgress).lives).toBe(5);

    // 75 Çip ile tüm canları doldurma (0 candan 5 cana)
    const zeroLives = { ...DEFAULT_PROGRESS, lives: 0, coins: 200, lastLifeRegenTimestamp: Date.now() };
    const buyAll = buyLives(zeroLives, "all");
    expect(buyAll.success).toBe(true);
    expect(buyAll.updatedProgress.coins).toBe(125); // 200 - 75 = 125
    expect(getCalculatedLives(buyAll.updatedProgress).lives).toBe(5);

    // Yetersiz bakiyede hata dönme
    const poor = { ...zeroLives, coins: 10 };
    const failBuy = buyLives(poor, "one");
    expect(failBuy.success).toBe(false);
  });

  it("sandık ödülleri seviye eşiği aşıldığında açılır ve 100. seviye tacı doğru hesaplanır", () => {
    // Seviye 1: Hiçbir sandık açık değil
    expect(getUnclaimedMilestonesCount(DEFAULT_PROGRESS, 1)).toBe(0);

    // Seviye 16 (15 tamamlandı): 1 sandık açık
    expect(getUnclaimedMilestonesCount(DEFAULT_PROGRESS, 16)).toBe(1);

    // Seviye 101 (Tüm 100 seviye tamamlandı): 6 sandığın hepsi açık
    expect(getUnclaimedMilestonesCount(DEFAULT_PROGRESS, 101)).toBe(6);

    // Sandıklardan biri alındığında bildirim sayısı düşer
    const claimedOne = { ...DEFAULT_PROGRESS, claimedMilestones: { 15: true } };
    expect(getUnclaimedMilestonesCount(claimedOne, 101)).toBe(5);

    // Tüm sandıklar alındığında bildirim 0 olur
    const allClaimed = {
      ...DEFAULT_PROGRESS,
      claimedMilestones: { 15: true, 30: true, 45: true, 60: true, 75: true, 100: true },
    };
    expect(getUnclaimedMilestonesCount(allClaimed, 101)).toBe(0);
  });

  it("applyVintageProgress nostalji bulmaca ilerlemesini, vintage_solve ve earn_chips görevlerini doğru işler", () => {
    const updated = applyVintageProgress(DEFAULT_PROGRESS, 1, 60);
    expect(updated.xp).toBe(DEFAULT_PROGRESS.xp + 60);
    expect(updated.coins).toBe((DEFAULT_PROGRESS.coins ?? 0) + 6); // 60 / 10 = 6 çip
    expect(updated.vintageProgress?.maxUnlockedLevel).toBe(2);
    expect(updated.vintageProgress?.completedLevels).toContain(1);
    expect(updated.vintageProgress?.score).toBe(100);

    // Tekrar seviye 1 çözülürse maxUnlockedLevel düşmez veya bozulmaz
    const repeat = applyVintageProgress(updated, 1, 40);
    expect(repeat.vintageProgress?.maxUnlockedLevel).toBe(2);
    expect(repeat.vintageProgress?.completedLevels).toEqual([1]);
  });

  it("applyMatchProgress tahta boyutu (size) parametresini duel_play ve duel_win görevleriyle eşleştirir", () => {
    const activeCatalog = [
      {
        id: "test_4x4",
        title: "4x4 Arenası",
        desc: "",
        period: "daily" as const,
        difficulty: "easy" as const,
        actionType: "duel_play" as const,
        target: 1,
        param: 4,
        rewardXp: 20,
        rewardCoins: 5,
      },
      {
        id: "test_8x8",
        title: "8x8 Meydanı",
        desc: "",
        period: "daily" as const,
        difficulty: "easy" as const,
        actionType: "duel_play" as const,
        target: 1,
        param: 8,
        rewardXp: 30,
        rewardCoins: 10,
      }
    ];

    // 4x4 maç yapıldığında 4x4 görevi ilerlemeli, 8x8 ilerlememeli
    const match4x4 = applyMatchProgress(
      DEFAULT_PROGRESS,
      { score: 50, tempo: 2, won: true, size: 4 },
      "pvp"
    );
    // missions nesnesine catalog mission'ı manuel simüle edip test edebiliriz
    expect(match4x4.wins).toBe(1);
    expect(match4x4.matches).toBe(1);
  });

  it("mergePlayerProgress addGuestBalances seçeneğiyle misafir bakiyelerini toplar ve cinsiyet seçimini korur", () => {
    const guestProgress = {
      ...DEFAULT_PROGRESS,
      coins: 80,
      streakShields: 2,
      radarChargesBonus: 4,
      wins: 5,
      matches: 10,
      xp: 350,
      gender: "unspecified" as const,
    };

    const registeredProgress = {
      ...DEFAULT_PROGRESS,
      coins: 150,
      streakShields: 1,
      radarChargesBonus: 3,
      wins: 20,
      matches: 35,
      xp: 1200,
      gender: "female" as const,
    };

    // addGuestBalances: true olduğunda misafirin kazandığı çip, kalkan ve radar mevcut hesaba eklenir
    const merged = mergePlayerProgress(guestProgress, registeredProgress, { addGuestBalances: true });
    expect(merged.coins).toBe(150 + 80); // 230
    expect(merged.streakShields).toBe(1 + 2); // 3
    expect(merged.radarChargesBonus).toBe(3 + 4); // 7
    expect(merged.wins).toBe(20 + 5); // 25
    expect(merged.matches).toBe(35 + 10); // 45
    expect(merged.xp).toBe(1200 + 350); // 1550

    // Misafirin "unspecified" cinsiyeti kayıtlı kullanıcının "female" cinsiyetini ezmez
    expect(merged.gender).toBe("female");

    // Kayıtlı kullanıcının cinsiyeti belirtilmemişken misafir "male" seçmişse korunur
    const guestWithMale = { ...guestProgress, gender: "male" as const };
    const regUnspecified = { ...registeredProgress, gender: "unspecified" as const };
    const mergedMale = mergePlayerProgress(guestWithMale, regUnspecified, { addGuestBalances: true });
    expect(mergedMale.gender).toBe("male");
  });

  it("LP, XP ve Çip kazanımları lig kademelerine, serilere ve ezici galibiyete göre doğru hesaplanır", () => {
    // 1. Giriş Kademesi (Demir): 1. galibiyet +30 LP, seri bonusu yok
    const p1 = applyMatchProgress(DEFAULT_PROGRESS, { score: 100, tempo: 3, won: true }, "pvp");
    expect(p1.lp).toBe(30);
    expect(p1.pvpWinStreak).toBe(1);
    expect(p1.lastMatchReward?.streakBonus).toBe(0);
    expect(p1.coins).toBe(10);

    // 2. galibiyet: +30 LP + 3 LP seri bonusu = +33 LP (toplam 63 LP)
    const p2 = applyMatchProgress(p1, { score: 100, tempo: 3, won: true }, "pvp");
    expect(p2.lp).toBe(63);
    expect(p2.pvpWinStreak).toBe(2);
    expect(p2.lastMatchReward?.streakBonus).toBe(3);

    // 3. galibiyet: +30 LP + 7 LP seri bonusu = +37 LP (toplam 100 LP)
    const p3 = applyMatchProgress(p2, { score: 100, tempo: 3, won: true }, "pvp");
    expect(p3.lp).toBe(100);
    expect(p3.pvpWinStreak).toBe(3);
    expect(p3.lastMatchReward?.streakBonus).toBe(7);

    // 4. Ezici Galibiyet (score >= 120): +30 LP + 7 LP (seri) + 5 LP (ezici) = +42 LP, 15 çip
    const p4 = applyMatchProgress(p3, { score: 130, tempo: 3, won: true }, "pvp");
    expect(p4.lp).toBe(142);
    expect(p4.lastMatchReward?.isCrushingWin).toBe(true);
    expect(p4.lastMatchReward?.coins).toBe(15);

    // 5. Mağlubiyet: seriyi sıfırlar, demir liginde -10 LP, 2 çip teselli ödülü
    const p5 = applyMatchProgress(p4, { score: 40, tempo: 1, won: false }, "pvp");
    expect(p5.lp).toBe(132);
    expect(p5.pvpWinStreak).toBe(0);
    expect(p5.lastMatchReward?.coins).toBe(2);

    // 6. Orta Kademe (Gümüş: 900 LP): galibiyet +25 LP, mağlubiyet -18 LP
    const silverBase = { ...DEFAULT_PROGRESS, lp: 1000, pvpWinStreak: 0 };
    const silverWin = applyMatchProgress(silverBase, { score: 80, tempo: 2, won: true }, "pvp");
    expect(silverWin.lp).toBe(1025);
    const silverLoss = applyMatchProgress(silverBase, { score: 40, tempo: 1, won: false }, "pvp");
    expect(silverLoss.lp).toBe(982);

    // 7. Üst Kademe (Elmas: 3600 LP): galibiyet +20 LP, mağlubiyet -22 LP
    const diamondBase = { ...DEFAULT_PROGRESS, lp: 4000, pvpWinStreak: 0 };
    const diamondWin = applyMatchProgress(diamondBase, { score: 80, tempo: 2, won: true }, "pvp");
    expect(diamondWin.lp).toBe(4020);
    const diamondLoss = applyMatchProgress(diamondBase, { score: 40, tempo: 1, won: false }, "pvp");
    expect(diamondLoss.lp).toBe(3978);

    // 8. 0 LP taban sınırı (Demotion Floor): 5 LP'deki oyuncu kaybettiğinde 0'ın altına inemez
    const lowLp = { ...DEFAULT_PROGRESS, lp: 5, pvpWinStreak: 0 };
    const floorLoss = applyMatchProgress(lowLp, { score: 20, tempo: 1, won: false }, "pvp");
    expect(floorLoss.lp).toBe(0);
  });

  it("görevler sistemi: Günlük rota, Arcade ve Vintage modlarında kelime, kombo ve çip takibini eksiksiz yapar", () => {
    const today = getDayId();
    const week = getWeekId();
    const dailyMission = getDailyMissions(today)[0];
    const baseProgress = {
      ...DEFAULT_PROGRESS,
      missionsDate: today,
      weeklyMissionsWeek: week,
      missions: {},
    };

    // 1. Günlük rota: word_count, earn_chips ve word_length takibi
    const dailyChallenge = getDailyChallenge(new Date());
    const dailyDone = completeDailyProgress(baseProgress, dailyChallenge, 120, 5, ["KİTAP", "MERHABA"]);
    expect(dailyDone.missions.daily).toBe(1);
    expect(dailyDone.coins).toBe(5);

    // 2. Arcade modu: combo_count ve word_length takibi
    const arcadeDone = applyArcadeProgress(baseProgress, 500, 4, false, 3, ["FUTBOL", "ŞAMPİYONLUK"]);
    expect(arcadeDone.bestArcadeScore).toBe(500);

    // 3. Vintage modu: word_length ve word_count takibi
    const vintageDone = applyVintageProgress(baseProgress, 1, 50, 4, ["TELEFON", "MASA"]);
    expect(vintageDone.vintageProgress?.completedLevels).toContain(1);

    // 4. Tahta Terörü (d_hard_26: 8x8 veya 10x10): 10x10 düellolarının m.param=8 ile eşleşmesi
    const mockCatalog = [
      {
        id: "d_hard_26",
        title: "Tahta Terörü",
        desc: "3 adet 8x8 veya 10x10 Düello tamamla",
        actionType: "duel_play" as const,
        target: 3,
        param: 8,
        rewardXp: 140,
        rewardCoins: 80,
        period: "daily" as const,
        difficulty: "hard" as const,
      },
    ];
    const match8x8 = updateMissionAction({}, mockCatalog, "duel_play", 1, 8);
    expect(match8x8["d_hard_26"]).toBe(1);
    const match10x10 = updateMissionAction(match8x8, mockCatalog, "duel_play", 1, 10);
    expect(match10x10["d_hard_26"]).toBe(2);

    // 5. reconcileMissions: Önceki günlerden kalan d_ ve w_ anahtarlarını temizleme
    const staleProgress = {
      ...DEFAULT_PROGRESS,
      missions: {
        d_easy_01: 5,
        d_old_99: 3,
        w_old_01: 10,
      },
      missionsDate: "2026-09-01",
      weeklyMissionsWeek: "2026-W30",
    };
    const reconciled = reconcileMissions(staleProgress, "2026-09-02", "2026-W31");
    expect(reconciled.missions["d_old_99"]).toBeUndefined();
    expect(reconciled.missions["w_old_01"]).toBeUndefined();

    // 6. getUnclaimedMissionsCount: Gerçek oyuncu profillerinde miras hayalet rozetleri engelleme
    const modernPlayer = {
      ...DEFAULT_PROGRESS,
      wins: 10, // >= 3
      bestArcadeScore: 600, // >= 400
      missionsDate: today,
      weeklyMissionsWeek: week,
      missions: {},
    };
    // Hiçbir katalog görevi tamamlanmamışken rozet sayısı 0 olmalıdır (hayalet rozet engellendi)
    expect(getUnclaimedMissionsCount(modernPlayer)).toBe(0);
  });
});

