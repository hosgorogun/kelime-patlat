import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
  MILESTONE_REWARDS,
  applyVintageProgress,
  checkDailyLoginReward,
  getDayId,
  getPlayerLevel,
} from "../shared/progression";

describe("Milestone Sandıkları, Günlük Ödül & Vintage Modu Testleri", () => {
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
    expect(updated.vintageProgress.maxUnlockedLevel).toBe(20);
    expect(updated.vintageProgress.completedLevels).toContain(19);

    // 20. seviyeyi bitirince maxUnlockedLevel 20 üstünde 21 olmamalı, 20'de kalmalı
    const maxed = applyVintageProgress(updated, 20, 50);
    expect(maxed.vintageProgress.maxUnlockedLevel).toBe(20);
  });
});
