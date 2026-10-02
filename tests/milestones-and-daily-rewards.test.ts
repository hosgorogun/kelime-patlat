import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
  MILESTONE_REWARDS,
  applyVintageProgress,
  checkDailyLoginReward,
  getDayId,
  getPlayerLevel,
  getLevelProgress,
  getXpForLevel,
  getXpRequiredForNextLevel,
  badgesFor,
} from "../shared/progression";

describe("Milestone Sandıkları, Günlük Ödül & Vintage Modu Testleri", () => {
  it("Kademeli Seviye ve EXP Eğrisini doğru hesaplamalıdır", () => {
    // 0 XP -> Seviye 1, sonraki seviye için 200 XP gerekir
    const p1 = getLevelProgress(0);
    expect(p1.level).toBe(1);
    expect(p1.currentLevelXp).toBe(0);
    expect(p1.nextLevelXp).toBe(200);

    // 200 XP -> Seviye 2
    expect(getPlayerLevel(200)).toBe(2);

    // 2800 XP -> Tam Seviye 15 (Onboarding sınırı, 200 XP/seviye)
    expect(getPlayerLevel(2800)).toBe(15);
    const p15 = getLevelProgress(2800);
    expect(p15.level).toBe(15);
    expect(p15.currentLevelXp).toBe(0);
    expect(p15.nextLevelXp).toBe(350); // Seviye 16'ya geçiş için 350 XP gerekir

    // 3150 XP -> Seviye 16 (2800 + 350)
    expect(getPlayerLevel(3150)).toBe(16);

    // 8050 XP -> Seviye 30 (Gümüş Sandık eşiği)
    expect(getPlayerLevel(8050)).toBe(30);

    // 18050 XP -> Seviye 50
    expect(getPlayerLevel(18050)).toBe(50);

    // 36800 XP -> Seviye 75
    expect(getPlayerLevel(36800)).toBe(75);

    // 61800 XP -> Seviye 100 (Kozmik İmparator Zirvesi)
    expect(getPlayerLevel(61800)).toBe(100);

    // Seviye eşik fonksiyonu tutarlı olmalıdır
    expect(getXpForLevel(1)).toBe(0);
    expect(getXpForLevel(15)).toBe(2800);
    expect(getXpForLevel(30)).toBe(8050);
    expect(getXpForLevel(50)).toBe(18050);
    expect(getXpForLevel(75)).toBe(36800);
    expect(getXpForLevel(100)).toBe(61800);

    // Gereken XP aralıkları
    expect(getXpRequiredForNextLevel(1)).toBe(200);
    expect(getXpRequiredForNextLevel(15)).toBe(350);
    expect(getXpRequiredForNextLevel(30)).toBe(500);
    expect(getXpRequiredForNextLevel(50)).toBe(750);
    expect(getXpRequiredForNextLevel(75)).toBe(1000);
    expect(getXpRequiredForNextLevel(100)).toBe(1200);
  });

  it("Rozetler Seviye veya Claimed Milestone ile açılmalıdır", () => {
    const unearned = badgesFor({ ...DEFAULT_PROGRESS, xp: 0 });
    const b15 = unearned.find((b) => b.id === "badge-lvl-15");
    expect(b15?.unlocked).toBe(false);

    // Seviye 15'e ulaşınca rozet açılır
    const earnedByLevel = badgesFor({ ...DEFAULT_PROGRESS, xp: 2800 });
    const b15Earned = earnedByLevel.find((b) => b.id === "badge-lvl-15");
    expect(b15Earned?.unlocked).toBe(true);

    // Veya claimedMilestones işaretlenince açılır
    const earnedByClaim = badgesFor({ ...DEFAULT_PROGRESS, xp: 0, claimedMilestones: { 15: true } });
    const b15Claimed = earnedByClaim.find((b) => b.id === "badge-lvl-15");
    expect(b15Claimed?.unlocked).toBe(true);
  });
  it("Seviye milestoneları doğru seviye eşiklerini tanımlamalıdır", () => {
    const levels = MILESTONE_REWARDS.map((m) => m.level);
    expect(levels).toEqual([15, 30, 45, 60, 75, 100]);
  });

  it("Player seviyesi eşiği geçtiğinde ilgili milestone alınabilir olmalıdır", () => {
    // 2800+ XP = Seviye 15+ (getPlayerLevel = Math.floor(xp/200) + 1)
    const xp = 3000;
    const currentLevel = getPlayerLevel(xp);
    expect(currentLevel).toBeGreaterThanOrEqual(15);

    const availableMilestones = MILESTONE_REWARDS.filter((m) => currentLevel >= m.level);
    expect(availableMilestones.length).toBeGreaterThanOrEqual(1);
    expect(availableMilestones[0]?.level).toBe(15);
  });

  it("Alınmış bir milestone sandığı (claimedMilestones) tekrar alınamamalıdır", () => {
    const progress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      xp: 2000,
      claimedMilestones: { 15: true },
    };

    const currentLevel = getPlayerLevel(progress.xp);
    const uncollectedMilestones = MILESTONE_REWARDS.filter(
      (m) => currentLevel >= m.level && !progress.claimedMilestones?.[m.level]
    );

    // Level 15 sandığı alınmış olmalı
    expect(uncollectedMilestones.some((m) => m.level === 15)).toBe(false);
  });

  it("checkDailyLoginReward aynı gün içerisinde 2 defa ödül vermemelidir", () => {
    const today = getDayId();
    const progress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      lastLoginDay: today,
      loginDaysCount: 3,
    };

    const result = checkDailyLoginReward(progress, today);
    expect(result).toBeNull();
  });

  it("checkDailyLoginReward yeni bir günde ödülü vermeli ve loginDaysCount artmalıdır", () => {
    const today = "2026-09-17";
    const progress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      lastLoginDay: "2026-09-16",
      loginDaysCount: 2,
    };

    const result = checkDailyLoginReward(progress, today);
    expect(result).not.toBeNull();
    expect(result?.updatedProgress.loginDaysCount).toBe(3);
    expect(result?.updatedProgress.lastLoginDay).toBe(today);
  });

  it("applyVintageProgress Seviye 20 üst sınırını korumalı ve skor eklemelidir", () => {
    const progress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      vintageProgress: {
        maxUnlockedLevel: 19,
        completedLevels: [1, 2, 3],
        score: 100,
      },
    };

    // 19. seviyeyi bitirince maxUnlockedLevel 20 olmalı
    const updated = applyVintageProgress(progress, 19, 50);
    expect(updated.vintageProgress!.maxUnlockedLevel).toBe(20);
    expect(updated.vintageProgress!.completedLevels).toContain(19);

    // 20. seviyeyi bitirince maxUnlockedLevel 20 üstünde 21 olmamalı, 20'de kalmalı
    const maxed = applyVintageProgress(updated, 20, 50);
    expect(maxed.vintageProgress!.maxUnlockedLevel).toBe(20);
  });
});
