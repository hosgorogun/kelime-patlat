import { describe, expect, it } from "vitest";
import {
  DAILY_EASY_POOL,
  DAILY_MEDIUM_POOL,
  DAILY_HARD_POOL,
  WEEKLY_POOL,
  getDailyMissions,
  getWeeklyMissions,
  CatalogMission,
} from "../shared/missions-catalog";

describe("Görevler Kataloğu & Rotasyon (Missions Catalog) Test Suiti", () => {
  it("Tüm günlük ve haftalık görev havuzları tanımlı ve geçerli hedef değerlere sahip olmalıdır", () => {
    const allMissions: CatalogMission[] = [
      ...DAILY_EASY_POOL,
      ...DAILY_MEDIUM_POOL,
      ...DAILY_HARD_POOL,
      ...WEEKLY_POOL,
    ];

    expect(allMissions.length).toBeGreaterThanOrEqual(100);

    for (const m of allMissions) {
      expect(m.id).toBeDefined();
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.desc.length).toBeGreaterThan(0);
      expect(m.target).toBeGreaterThan(0);
      expect(m.rewardCoins).toBeGreaterThanOrEqual(0);
      expect(m.rewardXp).toBeGreaterThan(0);
    }
  });

  it("Görev ID'leri benzersiz olmalı, çakışan ID bulunmamalıdır", () => {
    const allMissions = [
      ...DAILY_EASY_POOL,
      ...DAILY_MEDIUM_POOL,
      ...DAILY_HARD_POOL,
      ...WEEKLY_POOL,
    ];

    const ids = allMissions.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("getDailyMissions ve getWeeklyMissions deterministik ve geçerli görevler üretmelidir", () => {
    const daily = getDailyMissions("2026-09-24");
    expect(daily.length).toBe(3);
    expect(daily[0].difficulty).toBe("easy");
    expect(daily[1].difficulty).toBe("medium");
    expect(daily[2].difficulty).toBe("hard");

    const weekly = getWeeklyMissions("2026-W38");
    expect(weekly.length).toBe(3);
  });
});
