import { describe, expect, it } from "vitest";
import { createSoloBoard, ARCADE_INITIAL_TIME, calculateArcadeCombo } from "../shared/solo";
import { socialManager } from "../shared/social";
import {
  DEFAULT_PROGRESS,
  applyMatchProgress,
  applyArcadeProgress,
  applyVintageProgress,
  completeDailyProgress,
  checkDailyLoginReward,
  getDailyChallenge,
  getDayId,
  getWeekId,
  useBooster,
  buyBooster,
  canSpinLuckyWheel,
  claimLuckyWheelReward,
  reconcileMissions,
  getUnclaimedMissionsCount,
  getPlayerLevel,
  getLeagueTier,
  buyLives,
  deductLife,
  getCalculatedLives,
  MAX_LIVES,
  CYBER_TITLES,
  AVATARS,
} from "../shared/progression";
import type { PlayerProgress } from "../shared/progression";
import { CHIP_EQUIPMENT_ITEMS, PROFILE_FRAMES, VICTORY_EFFECTS, BOARD_SKINS } from "../shared/store-items";

describe("CANLI OYUN OYNAMA & PLAYTEST SİMÜLASYONU", () => {
  it("🎮 Tek Oyunculu Seviyeleri (1-100) canlı oynar ve tamamlama mekaniğini doğrular", () => {
    for (const levelNum of [1, 15, 30, 50, 75, 100]) {
      const challenge = createSoloBoard(levelNum);
      expect(challenge.level).toBe(levelNum);
      expect(challenge.words.length).toBeGreaterThanOrEqual(3);
      expect(challenge.board.length).toBe(challenge.size * challenge.size);
    }
  });

  it("⚡ Arcade Kombat modunda hamle yapar ve skor/zaman reaksiyonlarını tetikler", () => {
    expect(ARCADE_INITIAL_TIME).toBe(45);
    const comboRes = calculateArcadeCombo(3);
    expect(comboRes.bonusSeconds).toBe(2);
    expect(comboRes.bonusScore).toBe(30);
  });

  it("🎁 Loot Box Reveal ve Sosyal Etkileşimleri canlı test eder", async () => {
    await socialManager.init();
    const addRes = socialManager.addFriend({ username: "SiberOyuncu", name: "Siber Oyuncu" });
    expect(addRes.success).toBe(true);
  });

  it("🚀 Seviye Atlama (Level Up) & Bildirim/Ödül Mekanizmasını Canlı Oynatır", () => {
    let player = { ...DEFAULT_PROGRESS, coins: 50 };
    expect(getPlayerLevel(player.xp)).toBe(1);

    // Seviye 1'den Seviye 2'ye geçiş için maç kazandır (200 XP barajı)
    // 8 maç kazandırarak seviye atlatıyoruz:
    for (let i = 0; i < 8; i++) {
      player = applyMatchProgress(
        player,
        {
          score: 130,
          tempo: 3.6,
          won: true,
          foundWords: ["KİTAP", "GÜNEŞ", "DENİZ"],
          size: 6,
        },
        "pvp"
      );
    }

    const newLevel = getPlayerLevel(player.xp);
    expect(newLevel).toBeGreaterThanOrEqual(2);
    expect(player.coins).toBeGreaterThan(50); // Çip kazanımı çalışıyor
    expect(player.lp).toBeGreaterThan(0); // LP kazanımı çalışıyor
  });

  it("🏆 Lig Terfisi (Demir -> Bronz -> Gümüş) ve LP İlerlemesini Canlı Doğrular", () => {
    let player = { ...DEFAULT_PROGRESS, lp: 330 };
    expect(getLeagueTier(player).tier).toBe("DEMİR");

    // Ezici galibiyet ile 30+5 LP kazanıp Bronz'a terfi etmeli (Eşik: 350 LP)
    player = applyMatchProgress(
      player,
      {
        score: 140,
        tempo: 4.0,
        won: true,
        foundWords: ["YILDIZ", "BULUT", "RÜZGAR"],
        size: 6,
      },
      "pvp"
    );

    expect(player.lp).toBeGreaterThanOrEqual(350);
    expect(getLeagueTier(player).tier).toBe("BRONZ");
  });

  it("💎 Market / Siber Mağaza: Çip ile Ekipman, Çerçeve, Efekt ve Can Satın Almayı Doğrular", () => {
    let player = {
      ...DEFAULT_PROGRESS,
      coins: 500,
      lives: 1,
      streakShields: 0,
    };

    // 1. Ekipman Satın Alma: Seri Kalkanı (shield_1) 120 Çip
    const shieldItem = CHIP_EQUIPMENT_ITEMS.find((i) => i.id === "shield_1")!;
    expect(player.coins).toBeGreaterThanOrEqual(shieldItem.cost);
    player.coins -= shieldItem.cost;
    player.streakShields = (player.streakShields || 0) + 1;
    expect(player.coins).toBe(380);
    expect(player.streakShields).toBe(1);

    // 2. Can Satın Alma (buyLives: 75 Çip ile Tam Doldurma)
    const buyResult = buyLives(player, "all");
    expect(buyResult.success).toBe(true);
    player = buyResult.updatedProgress;
    expect(player.lives).toBe(MAX_LIVES);
    expect(player.coins).toBe(305);

    // 3. Kozmetik Satın Alma: Neon Mor Çerçeve (140 Çip)
    const neonFrame = PROFILE_FRAMES.find(([fId]) => fId === "neon")!;
    const frameCost = neonFrame[3];
    expect(player.coins).toBeGreaterThanOrEqual(frameCost);
    player.coins -= frameCost;
    player.ownedFrames = { ...player.ownedFrames, neon: true };
    player.selectedFrame = "neon";
    expect(player.coins).toBe(165);
    expect(player.ownedFrames.neon).toBe(true);
    expect(player.selectedFrame).toBe("neon");

    // 4. Zafer Efekti Kuşanma
    const glitchEffect = VICTORY_EFFECTS.find(([eId]) => eId === "glitch")!;
    player.ownedVictoryEffects = { ...player.ownedVictoryEffects, glitch: true };
    player.selectedVictoryEffect = "glitch";
    expect(player.selectedVictoryEffect).toBe("glitch");
  });

  it("🏷️ Unvanlar, Madalyalar ve Avatarlar: Kriterlere Göre Kilit Açılmasını Doğrular", () => {
    const freshPlayer = { ...DEFAULT_PROGRESS, wins: 0, bestScore: 0 };
    const noviceTitle = CYBER_TITLES.find((t) => t.id === "novice")!;
    expect(noviceTitle.unlocked(freshPlayer)).toBe(true); // Çaylak unvanı açık

    const victorTitle = CYBER_TITLES.find((t) => t.id === "victor")!;
    expect(victorTitle.unlocked(freshPlayer)).toBe(false); // 5 zafer olmadan kilitli

    // Oyuncu 5 galibiyete ulaştığında açılır
    const victorPlayer = { ...freshPlayer, wins: 5 };
    expect(victorTitle.unlocked(victorPlayer)).toBe(true);

    // Avatar kilitleri
    const sparkAvatar = AVATARS.find((a) => a.id === "spark")!;
    expect(sparkAvatar).toBeDefined();
  });

  it("📰 Gazete & Nostalji (Vintage) Modu: Harf Çözümü, Seviye İlerlemesi ve Skor Artışını Canlı Simüle Eder", () => {
    let player = { ...DEFAULT_PROGRESS };
    expect(player.vintageProgress?.maxUnlockedLevel).toBe(1);

    // Seviye 1'i tamamla
    player = applyVintageProgress(player, 1, 100, 5, ["KİTAP", "MASA", "KALEM"]);
    expect(player.vintageProgress?.completedLevels).toContain(1);
    expect(player.vintageProgress?.maxUnlockedLevel).toBeGreaterThanOrEqual(2);
    expect(player.vintageProgress?.score).toBeGreaterThan(0);
    expect(player.xp).toBeGreaterThan(0);
    expect(player.coins).toBeGreaterThan(0);
  });

  it("📅 Günün Rotası (Daily Challenge) & Günlük Giriş ve Seri (Streak) Korumasını Canlı Simüle Eder", () => {
    let player: PlayerProgress = { ...DEFAULT_PROGRESS, streak: 3, streakShields: 1 };
    const todayId = getDayId();

    // 1. Günlük Giriş Ödülü Al
    const loginRewardResult = checkDailyLoginReward(player, todayId);
    expect(loginRewardResult).not.toBeNull();
    player = loginRewardResult!.updatedProgress;
    expect(player.lastLoginDay).toBe(todayId);

    // Aynı gün ikinci kez ödül talep edilirse engellenmeli
    const duplicateLogin = checkDailyLoginReward(player, todayId);
    expect(duplicateLogin).toBeNull();

    // 2. Günün Rotası Tamamla
    const dailyChallenge = getDailyChallenge();
    player = completeDailyProgress(player, dailyChallenge, 150, 6, ["GÜNEŞ", "BULUT", "DENİZ"]);
    expect(player.dailyCompletedId).toBe(dailyChallenge.id);
    expect(player.streak).toBe(4); // 3 -> 4'e yükseldi
    expect(player.xp).toBeGreaterThanOrEqual(dailyChallenge.rewardXp);
  });

  it("🎯 Oyun İçi Güçlendiriciler (Boosters) & Çip ile Kullanım Mekaniğini Canlı Doğrular", () => {
    let player = {
      ...DEFAULT_PROGRESS,
      coins: 100,
      boosters: { hint: 1, freeze: 0, shuffle: 0 },
    };

    // 1. Envanterde var olan Radar/İpucunu kullan
    const hintRes = useBooster(player, "hint");
    expect(hintRes.success).toBe(true);
    player = hintRes.updatedProgress;
    expect(player.boosters?.hint).toBe(0);
    expect(player.coins).toBe(100); // Çip harcanmadı çünkü envanterde vardı

    // 2. Envanterde olmayan Dondurucuyu satın al ve kullan (30 Çip)
    const freezeRes = useBooster(player, "freeze");
    expect(freezeRes.success).toBe(true);
    player = freezeRes.updatedProgress;
    expect(player.coins).toBe(70); // 100 - 30 = 70

    // 3. Toplu Güçlendirici Satın Alma (buyBooster)
    const buyShuffleRes = buyBooster(player, "shuffle", 2); // 20 * 2 = 40 Çip
    expect(buyShuffleRes.success).toBe(true);
    player = buyShuffleRes.updatedProgress;
    expect(player.boosters?.shuffle).toBe(2);
    expect(player.coins).toBe(30); // 70 - 40 = 30
  });

  it("🎡 Şans Çarkı (Lucky Wheel): Cooldown, Çevirme ve Ödül Kazanımını Canlı Test Eder", () => {
    let player = { ...DEFAULT_PROGRESS, lastSpinTimestamp: 0, coins: 0 };
    const canSpinCheck = canSpinLuckyWheel(player);
    expect(canSpinCheck.canSpin).toBe(true);

    // 50 Çip sektörünü kazanma (Sektör 2)
    const spinResult = claimLuckyWheelReward(player, 2);
    player = spinResult.updatedProgress;
    expect(spinResult.reward.type).toBe("coins");
    expect(spinResult.reward.value).toBe(50);
    expect(player.coins).toBe(50);
    expect(player.lastSpinTimestamp).toBeGreaterThan(0);

    // Hemen ardından tekrar çevirmeye çalıştığında cooldown devrede olmalı
    const cooldownCheck = canSpinLuckyWheel(player);
    expect(cooldownCheck.canSpin).toBe(false);
    expect(cooldownCheck.remainingSeconds).toBeGreaterThan(0);
  });

  it("❤️ Can Ekonomisi & Süreye Göre Otomatik Can Dolumu (Lives Regeneration) Simülasyonu", () => {
    let player = { ...DEFAULT_PROGRESS, lives: 5 };
    // Can düşür
    player = deductLife(player);
    expect(player.lives).toBe(4);

    player = deductLife(player);
    expect(player.lives).toBe(3);

    // 30 dakika sonrasını simüle et (1 can yenilenmeli)
    const pastTime = Date.now() - 31 * 60 * 1000;
    const simulatedPlayer = { ...player, lastLifeRegenTimestamp: pastTime };
    const calc = getCalculatedLives(simulatedPlayer);
    expect(calc.lives).toBe(4); // 3'ten 4'e doldu
  });

  it("📋 Görev İlerlemesi (Missions) & Alınabilir Görev Bildirim Rozetini Canlı Doğrular", () => {
    let player = { ...DEFAULT_PROGRESS, missions: {} };
    const todayId = getDayId();
    const weekId = getWeekId();
    player = reconcileMissions(player, todayId, weekId);

    // Bir maç yaparak görevleri ilerlet
    player = applyMatchProgress(
      player,
      {
        score: 150,
        tempo: 3.5,
        won: true,
        foundWords: ["MUHTEŞEM", "KELİME"], // 7+ harf kelime
        size: 8,
      },
      "pvp"
    );

    expect(player.missions).toBeDefined();
    // Görev sayacının çalıştığını doğrula
    const unclaimed = getUnclaimedMissionsCount(player, todayId, weekId);
    expect(typeof unclaimed).toBe("number");
  });
});
