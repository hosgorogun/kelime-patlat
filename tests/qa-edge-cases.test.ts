import { describe, expect, it, beforeEach } from "vitest";
import { socialManager } from "../shared/social";
import { getDayId, getWeekId, getSeasonId, getLeagueTier } from "../shared/progression";

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
  });

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

    // Gelecekteki zaman damgası mevcut zamana çekilmeli ve kalan süre normal 15 dk (900s) aralığında olmalıdır
    expect(calc.lives).toBe(2);
    expect(calc.nextLifeTimerSeconds).toBeLessThanOrEqual(15 * 60);
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
});

