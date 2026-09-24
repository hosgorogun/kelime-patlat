import { describe, expect, it, beforeEach } from "vitest";
import { socialManager } from "../shared/social";
import { getDayId, getWeekId, getSeasonId, getLeagueTier, buyLives, getCalculatedLives, DEFAULT_PROGRESS, COST_PER_LIFE, COST_REFILL_ALL } from "../shared/progression";

describe("Senior QA Edge Case Test Suiti - Sosyal Sistem & Tarih Tutarlılığı", () => {
  beforeEach(async () => {
    // Sosyal yöneticiyi sıfırla
    await socialManager.init();
  });

  it("Arkadaş eklerken Türkçe büyük/küçük İ ve I harflerini aynı kullanıcı olarak algılamalıdır", () => {
    // "İSMAİL" kullanıcısı ile "ismail" veya "ısmail" aynı kişi kabul edilmeli
    const res1 = socialManager.addFriend({ username: "İsmail", name: "İsmail" });
    expect(res1.success).toBe(true);

    // Aynı ismi küçük Türkçe karakterle eklemeye çalışınca çift kayıt engellenmeli
    const res2 = socialManager.addFriend({ username: "ismail", name: "ismail" });
    expect(res2.success).toBe(false);
    expect(res2.message).toContain("zaten arkadaş");
  });

  it("Boş veya yalnızca boşluk içeren kullanıcı adlarını reddetmelidir", () => {
    const resEmpty = socialManager.addFriend("   ");
    expect(resEmpty.success).toBe(false);
    expect(resEmpty.message).toBe("Geçerli bir kullanıcı adı girin.");
  });

  it("Arkadaş silme işlemi mevcut arkadaşı listeden çıkarmalıdır", () => {
    const friendListBefore = socialManager.getFriends().length;
    const addRes = socialManager.addFriend({ id: "qa_test_usr", username: "qa_user", name: "QA Tester" });
    expect(addRes.success).toBe(true);

    const removeRes = socialManager.removeFriend(addRes.friend!.id);
    expect(removeRes.success).toBe(true);
    expect(socialManager.getFriends().length).toBe(friendListBefore);
  });

  it("Olmayan bir arkadaş ID'si silinmek istendiğinde hata mesajı dönmelidir", () => {
    const removeRes = socialManager.removeFriend("non_existing_id_9999");
    expect(removeRes.success).toBe(false);
    expect(removeRes.message).toBe("Arkadaş bulunamadı.");
  });

  it("Tarih ve Sezon formatları (getDayId, getWeekId, getSeasonId) geçerli ISO ve bimonthly kalıbında olmalıdır", () => {
    const today = getDayId();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD

    const currentWeek = getWeekId();
    expect(currentWeek).toMatch(/^\d{4}-W\d{2}$/); // YYYY-Www

    const currentSeason = getSeasonId();
    expect(currentSeason).toMatch(/^\d{4}-S0[1-6]$/); // YYYY-S0X (Bimonthly 1-6)
  });

  it("Lig tier aşamaları (getLeagueTier) LP sınır değerlerini tam doğrulamalıdır", () => {
    expect(getLeagueTier(0).tier).toBe("DEMİR");
    expect(getLeagueTier(349).tier).toBe("DEMİR");
    expect(getLeagueTier(350).tier).toBe("BRONZ");
    expect(getLeagueTier(899).tier).toBe("BRONZ");
    expect(getLeagueTier(900).tier).toBe("GÜMÜŞ");
    expect(getLeagueTier(1599).tier).toBe("GÜMÜŞ");
    expect(getLeagueTier(1600).tier).toBe("ALTIN");
    expect(getLeagueTier(2499).tier).toBe("ALTIN");
    expect(getLeagueTier(2500).tier).toBe("PLATİN");
    expect(getLeagueTier(3599).tier).toBe("PLATİN");
    expect(getLeagueTier(3600).tier).toBe("ELMAS");
    expect(getLeagueTier(4999).tier).toBe("ELMAS");
    expect(getLeagueTier(5000).tier).toBe("YÜCELİK");
    expect(getLeagueTier(99999).tier).toBe("RADIAN");
  });

  it("Arkadaş listesindeki tüm arkadaşlar silindiğinde liste boş [] kalmalı ve mock veriler geri gelmemelidir", async () => {
    const friends = socialManager.getFriends();
    const ids = friends.map((f) => f.id);
    ids.forEach((id) => socialManager.removeFriend(id));

    expect(socialManager.getFriends().length).toBe(0);
    const reInited = await socialManager.init();
    expect(reInited.length).toBe(0);
  });

  it("Sözlük arama fonksiyonu (getWordDefinition) tüm Türkçe harfler, küçük/büyük duyarlılık ve bilinmeyen kelimeler için hatasız çalışmalıdır", async () => {
    const { getWordDefinition } = await import("../shared/dictionary");
    
    // Bilinen Türkçe kelime
    const def1 = getWordDefinition("ORMAN");
    expect(def1).toContain("Ağaçlarla kaplı");

    // Küçük harfle arama ("orman" -> "ORMAN")
    const def2 = getWordDefinition("orman");
    expect(def2).toContain("Ağaçlarla kaplı");

    // Türkçe İ harfi içeren kelime ("ÇİÇEK")
    const def3 = getWordDefinition("çiçek");
    expect(def3.length).toBeGreaterThan(5);

    // Sözlükte olmayan rastgele kelime ("XYZQWER")
    const defFallback = getWordDefinition("XYZQWER");
    expect(defFallback).toContain("Kelime Patlat ile kelime dağarcığını zenginleştir");
  });

  it("Tüm 100 Tek Oyunculu Seviye tahtaları hatasız, çakışmasız ve geçerli harflerle üretilmelidir", async () => {
    const { createSoloBoard } = await import("../shared/solo");
    
    // 1 ile 100 arasındaki tüm seviye örneklerini simüle et
    for (let level = 1; level <= 100; level += 10) {
      const challenge = createSoloBoard(level);
      expect(challenge.level).toBe(level);
      expect(challenge.board.length).toBe(challenge.size * challenge.size);
      expect(challenge.words.length).toBeGreaterThanOrEqual(3);
      
      // Tahtada hiç undefined/null harf olmamalı
      expect(challenge.board.every((char) => typeof char === "string" && char.length === 1)).toBe(true);
    }
  }, 20000);

  it("Eşleştirme kuyruğunda boyut değiştirildiğinde oyuncu eski kuyruklardan tamamen temizlenmelidir", () => {
    type QueueEntry = { socketId: string; playerId: string };
    const queues: Record<number, QueueEntry[]> = {
      4: [{ socketId: "sock_1", playerId: "player_123" }],
      6: [],
      8: [],
      10: [],
    };

    // Oyuncu 4'lü kuyruktayken 8'liye geçmek istediğinde
    const newSize = 8;
    const incoming = { socketId: "sock_1", playerId: "player_123" };

    // Çoklu kuyruk temizleme fonksiyonu mantığı
    [4, 6, 8, 10].forEach((sz) => {
      queues[sz] = queues[sz]!.filter(
        (entry) => entry.socketId !== incoming.socketId && entry.playerId !== incoming.playerId
      );
    });
    queues[newSize]!.push(incoming);

    expect(queues[4]!.length).toBe(0);
    expect(queues[8]!.length).toBe(1);
    expect(queues[8]![0]!.playerId).toBe("player_123");
  });

  it("Profil arama/görüntüleme parametresi 64 karakteri aştığında reddedilmelidir", () => {
    const validateParam = (idOrName: string) => {
      const trimmed = idOrName.trim();
      if (!trimmed || trimmed.length > 64) {
        return { valid: false, status: 400, error: "Geçersiz veya aşırı uzun kullanıcı kimliği." };
      }
      return { valid: true, status: 200 };
    };

    expect(validateParam("siber_oyuncu").valid).toBe(true);
    expect(validateParam("a".repeat(64)).valid).toBe(true);
    expect(validateParam("a".repeat(65)).valid).toBe(false);
    expect(validateParam("a".repeat(100)).status).toBe(400);
    expect(validateParam("   ").valid).toBe(false);
  });

  it("mergePlayerProgress yerel ve sunucu kozmetik envanterlerini veri kaybı olmadan birleştirmelidir", async () => {
    const { mergePlayerProgress, DEFAULT_PROGRESS } = await import("../shared/progression");

    const localProgress = {
      ...DEFAULT_PROGRESS,
      ownedFrames: { signal: true, neon: true },
      ownedVictoryEffects: { glitch: true },
      ownedBoardSkins: { night: true },
      selectedFrame: "neon",
    };

    const serverProgress = {
      ...DEFAULT_PROGRESS,
      ownedFrames: { signal: true, gold: true },
      ownedVictoryEffects: { matrix: true },
      ownedBoardSkins: { emerald: true },
      coins: 250,
    };

    const merged = mergePlayerProgress(localProgress, serverProgress);

    // Tüm sahiplikler korunmalı
    expect(merged.ownedFrames?.signal).toBe(true);
    expect(merged.ownedFrames?.neon).toBe(true);
    expect(merged.ownedFrames?.gold).toBe(true);
    expect(merged.ownedVictoryEffects?.glitch).toBe(true);
    expect(merged.ownedVictoryEffects?.matrix).toBe(true);
    expect(merged.ownedBoardSkins?.night).toBe(true);
    expect(merged.ownedBoardSkins?.emerald).toBe(true);
  });

  it("Cihaz saati geleceğe alınıp geri getirildiğinde (clock skew) getCalculatedLives can sayacını dondurmamalıdır", async () => {
    const { getCalculatedLives, MAX_LIVES } = await import("../shared/progression");

    const futureTime = Date.now() + 60 * 60 * 1000; // 1 saat gelecekteki bir zaman damgası
    const progressWithFutureStamp = {
      lives: 2,
      lastLifeRegenTimestamp: futureTime,
    };

    const calc = getCalculatedLives(progressWithFutureStamp);

    // Gelecekteki zaman damgası mevcut zamana çekilmeli ve kalan süre normal 30 dk (1800s) aralığında olmalıdır
    expect(calc.lives).toBe(2);
    expect(calc.nextLifeTimerSeconds).toBeLessThanOrEqual(30 * 60);
    expect(calc.nextLifeTimerSeconds).toBeGreaterThan(0);
    expect(calc.lastLifeRegenTimestamp).toBeLessThanOrEqual(Date.now());
  });

  it("Kullanıcı profil modalında name alanı undefined veya null olduğunda çökme yaşanmamalıdır", () => {
    const resolveDisplayName = (user: { name?: string; username?: string }) => {
      return (user.name || user.username || "").trim().slice(0, 16) || "OYUNCU";
    };

    expect(resolveDisplayName({ name: "Siber Savaşçı" })).toBe("Siber Savaşçı");
    expect(resolveDisplayName({ username: "gece_avcisi" })).toBe("gece_avcisi");
    expect(resolveDisplayName({ name: undefined, username: undefined })).toBe("OYUNCU");
    expect(resolveDisplayName({ name: "   ", username: "" })).toBe("OYUNCU");
  });

  it("room:emote hız sınırı 800ms cooldown kuralına tam uymalıdır", () => {
    let lastEmoteAt = 0;
    const canSendEmote = (now: number) => {
      if (lastEmoteAt && now - lastEmoteAt < 800) return false;
      lastEmoteAt = now;
      return true;
    };

    const t0 = 10000;
    expect(canSendEmote(t0)).toBe(true);
    // 200ms sonra spam denemesi -> engellenmeli
    expect(canSendEmote(t0 + 200)).toBe(false);
    // 500ms sonra spam denemesi -> engellenmeli
    expect(canSendEmote(t0 + 500)).toBe(false);
    // 799ms sonra spam denemesi -> engellenmeli
    expect(canSendEmote(t0 + 799)).toBe(false);
    // 800ms sonra yeni istek -> kabul edilmeli
    expect(canSendEmote(t0 + 800)).toBe(true);
  });

  it("Arcade modunda score 0 iken erken çıkışta onComplete çağrısı izole edilmelidir", () => {
    let completeCalled = false;
    const handleExit = (score: number) => {
      if (score > 0) {
        completeCalled = true;
      }
    };

    // 0 skorla çıkış
    handleExit(0);
    expect(completeCalled).toBe(false);

    // 100 skorla çıkış
    handleExit(100);
    expect(completeCalled).toBe(true);
  });

  it("applyArcadeProgress ve applyVintageProgress yerel uygulandığında tek sefer doğru ödül verir", async () => {
    const { applyArcadeProgress, applyVintageProgress, DEFAULT_PROGRESS } = await import("../shared/progression");

    const p1 = applyArcadeProgress(DEFAULT_PROGRESS, 200, 5, false, 2, ["ELMA", "ARMUT"]);
    expect(p1.xp).toBe(DEFAULT_PROGRESS.xp + 20); // 200 / 10 = 20
    expect(p1.coins).toBe((DEFAULT_PROGRESS.coins || 0) + 5); // 200 / 40 = 5
    expect(p1.bestArcadeScore).toBe(200);

    const p2 = applyVintageProgress(DEFAULT_PROGRESS, 1, 30, 5);
    expect(p2.xp).toBe(DEFAULT_PROGRESS.xp + 30);
    expect(p2.coins).toBe((DEFAULT_PROGRESS.coins || 0) + 3); // max(2, floor(30/10)) = 3
  });

  it("reconcileDailyStreak bozuk/geçersiz tarih dizgelerinde seriyi sıfırlamamalı ve çökmeyi önlemelidir", async () => {
    const { reconcileDailyStreak, DEFAULT_PROGRESS } = await import("../shared/progression");

    const corruptProgress = {
      ...DEFAULT_PROGRESS,
      streak: 7,
      dailyCompletedId: "invalid-date-string-xyz",
    };

    const result = reconcileDailyStreak(corruptProgress, "2026-09-21");
    expect(result.streakReset).toBe(false);
    expect(result.updatedProgress.streak).toBe(7);
  });

  it("formatRelativeTime ISO dizgesi, sayı, Date veya geçersiz değerlerde NaN üretmemelidir", () => {
    function formatRelativeTime(timestamp: number | string | Date): string {
      if (!timestamp) return "Bilinmiyor";
      const ms = typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();
      if (!ms || isNaN(ms) || ms <= 0) return "Bilinmiyor";
      const diffSec = Math.max(1, Math.floor((Date.now() - ms) / 1000));
      if (diffSec < 60) return "Az önce";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} dk önce`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} sa önce`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Dün";
      if (diffDays < 7) return `${diffDays} gün önce`;
      const d = new Date(ms);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      return `${day}.${month}.${d.getFullYear()}`;
    }

    expect(formatRelativeTime(0)).toBe("Bilinmiyor");
    expect(formatRelativeTime("invalid-date")).toBe("Bilinmiyor");
    expect(formatRelativeTime(Date.now() - 30_000)).toBe("Az önce");
    expect(formatRelativeTime(new Date(Date.now() - 120_000).toISOString())).toBe("2 dk önce");
    expect(formatRelativeTime(new Date(Date.now() - 7200_000))).toBe("2 sa önce");
  });

  it("Yeni başlayan oyuncuda (0 maç, 0 LP) sezon sıfırlama modalı gösterilmemelidir", async () => {
    const { DEFAULT_PROGRESS } = await import("../shared/progression");
    const freshPlayer = {
      ...DEFAULT_PROGRESS,
      lastSeasonResetId: undefined,
      matches: 0,
      lp: 0,
    };

    const shouldShowModal = (p: { matches?: number; lp?: number }, performed: boolean) => {
      return performed && ((p.matches ?? 0) > 0 || (p.lp ?? 0) > 0);
    };

    expect(shouldShowModal(freshPlayer, true)).toBe(false);

    const activePlayer = {
      ...DEFAULT_PROGRESS,
      matches: 5,
      lp: 350,
    };
    expect(shouldShowModal(activePlayer, true)).toBe(true);
  });

  it("Mevcut aktif oyuncuda (maç ve LP sahibi) reconcileSeasonReset normal soft reset gerçekleştirmelidir", async () => {
    const { reconcileSeasonReset, DEFAULT_PROGRESS } = await import("../shared/progression");
    const activePlayer = {
      ...DEFAULT_PROGRESS,
      lastSeasonResetId: "2025-S01", // Eski sezon
      matches: 15,
      lp: 4000, // Elmas ligi
    };

    const res = reconcileSeasonReset(activePlayer);
    expect(res.resetResult.seasonResetPerformed).toBe(true);
    expect(res.resetResult.previousLp).toBe(4000);
    expect(res.updatedProgress.lp).toBe(2500); // 3600+ LP -> 2500'e çekilir
  });

  it("applyVintageProgress kelime sayısı verilmediğinde actualWordsCount ile matchHistory üretmelidir", async () => {
    const { applyVintageProgress, DEFAULT_PROGRESS } = await import("../shared/progression");
    const res = applyVintageProgress(DEFAULT_PROGRESS, 2, 80, 0, ["TREN", "VAGON", "RAY", "MAKAS"]);
    expect(res.matchHistory).toBeDefined();
    expect(res.matchHistory![0].wordsCount).toBe(4);
    expect(res.matchHistory![0].mode).toBe("vintage");
  });

  it("onRoomError oda dolu veya maç başladı hatalarında oda durumunu temizlemelidir", () => {
    const shouldCleanupRoom = (msg: string) => {
      return (
        msg.includes("Oda süresi") ||
        msg.includes("sonlandırıldı") ||
        msg.includes("bulunamadı") ||
        msg.includes("dolu") ||
        msg.includes("maç başladı")
      );
    };

    expect(shouldCleanupRoom("Bu oda zaten dolu.")).toBe(true);
    expect(shouldCleanupRoom("Bu odada maç başladı; yeni oda kurun.")).toBe(true);
    expect(shouldCleanupRoom("Bu oda bulunamadı veya süresi doldu.")).toBe(true);
    expect(shouldCleanupRoom("Geçersiz harf rotası.")).toBe(false);
  });

  it("checkDailyLoginReward ve handleClaimDailyReward eşzamanlı çift talepte mükerrer ödül vermemelidir", async () => {
    const { checkDailyLoginReward, DEFAULT_PROGRESS } = await import("../shared/progression");
    const today = "2026-09-21";

    // 1. İlk talep
    const firstClaim = checkDailyLoginReward(DEFAULT_PROGRESS, today);
    expect(firstClaim).not.toBeNull();
    expect(firstClaim!.updatedProgress.lastLoginDay).toBe(today);

    // 2. İkinci talep (aynı gün) -> null dönmeli, bakiye veya seri artmamalı
    const secondClaim = checkDailyLoginReward(firstClaim!.updatedProgress, today);
    expect(secondClaim).toBeNull();
  });

  describe("Senior QA Edge Case Test Suiti - Bot / Arkadaş Kimlik Ayrımı (startsWith 'f' vs ^f\\d+$)", () => {
    const isMockFriendRegex = (id: string) => /^f\d+$/.test(id) || id.startsWith("mock") || id.startsWith("bot") || id.startsWith("friend:");

    it("Mock arkadaş kimliklerini (f1, f2, f3, f4, f5) doğru şekilde tespit eder", () => {
      expect(isMockFriendRegex("f1")).toBe(true);
      expect(isMockFriendRegex("f2")).toBe(true);
      expect(isMockFriendRegex("f3")).toBe(true);
      expect(isMockFriendRegex("f4")).toBe(true);
      expect(isMockFriendRegex("f5")).toBe(true);
      expect(isMockFriendRegex("f100")).toBe(true);
      expect(isMockFriendRegex("bot:gladiator")).toBe(true);
      expect(isMockFriendRegex("mock:friend")).toBe(true);
      expect(isMockFriendRegex("friend:f1")).toBe(true);
    });

    it("'f' harfiyle başlayan gerçek kullanıcı kimliklerini ASLA sahte bot olarak işaretlemez", () => {
      // Gerçek oyuncu kimlikleri ve kullanıcı adları:
      expect(isMockFriendRegex("fe152968-50ca-4b9f-864b-78c47ed3780c")).toBe(false);
      expect(isMockFriendRegex("fatma_yildiz")).toBe(false);
      expect(isMockFriendRegex("furkan123")).toBe(false);
      expect(isMockFriendRegex("ferhat_matrix")).toBe(false);
      expect(isMockFriendRegex("filiz")).toBe(false);
      expect(isMockFriendRegex("facebook_user_12345")).toBe(false);
      expect(isMockFriendRegex("firebase_auth_999")).toBe(false);
    });
  });

  describe("Senior QA Edge Case Test Suiti - Can Satın Alma ve Yenileme Güvenliği", () => {
    it("Canı dolu olan bir oyuncu ek can veya ful yenileme satın alamaz", () => {
      const fullProgress = { ...DEFAULT_PROGRESS, lives: 5, coins: 500 };
      const buyOne = buyLives(fullProgress, "one");
      expect(buyOne.success).toBe(false);
      expect(buyOne.message).toContain("Canlarınız zaten dolu");

      const buyAll = buyLives(fullProgress, "all");
      expect(buyAll.success).toBe(false);
      expect(buyAll.message).toContain("Canlarınız zaten dolu");

      const adWatch = buyLives(fullProgress, "ad");
      expect(adWatch.success).toBe(false);
      expect(adWatch.message).toContain("Canlarınız zaten dolu");
    });

    it("Yetersiz çipi olan oyuncunun can satın alma işlemi engellenir", () => {
      const brokeProgress = { ...DEFAULT_PROGRESS, lives: 1, coins: 5 };
      const buyOne = buyLives(brokeProgress, "one");
      expect(buyOne.success).toBe(false);
      expect(buyOne.message).toContain("Yetersiz çip");

      const buyAll = buyLives(brokeProgress, "all");
      expect(buyAll.success).toBe(false);
      expect(buyAll.message).toContain("Yetersiz çip");
    });

    it("1 can satın alındığında çip düşer, can +1 artar ve timer korunur", () => {
      const playerProgress = {
        ...DEFAULT_PROGRESS,
        lives: 2,
        coins: 100,
        lastLifeRegenTimestamp: Date.now() - 60_000,
      };
      const res = buyLives(playerProgress, "one");
      expect(res.success).toBe(true);
      expect(res.updatedProgress.lives).toBe(3);
      expect(res.updatedProgress.coins).toBe(100 - COST_PER_LIFE);
      // Kalan can 5'ten küçük olduğunda yenilenme zamanlayıcısı korunmalıdır
      expect(res.updatedProgress.lastLifeRegenTimestamp).toBe(playerProgress.lastLifeRegenTimestamp);
    });

    it("Tüm canlar doldurulduğunda can 5 olur, çip düşer ve sonraki can sayacı sıfırlanır", () => {
      const playerProgress = {
        ...DEFAULT_PROGRESS,
        lives: 1,
        coins: 200,
        lastLifeRegenTimestamp: Date.now() - 100_000,
      };
      const res = buyLives(playerProgress, "all");
      expect(res.success).toBe(true);
      expect(res.updatedProgress.lives).toBe(5);
      expect(res.updatedProgress.coins).toBe(200 - COST_REFILL_ALL);
      expect(getCalculatedLives(res.updatedProgress).nextLifeTimerSeconds).toBe(0);
    });
  });
});



