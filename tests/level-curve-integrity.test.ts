import { describe, it, expect } from "vitest";
import {
  getPlayerLevel,
  getXpForLevel,
  getXpRequiredForNextLevel,
  getLevelProgress,
} from "../shared/level-curves";
import { getLevelUpDetails } from "../components/modals/celebration-modal";

describe("Level Curve Mathematical Integrity & Continuity Test", () => {
  it("Tüm seviyeler (1 -> 150) arasında getPlayerLevel ve getXpForLevel tam süreklilik ve tutarlılık göstermelidir", () => {
    for (let lvl = 1; lvl <= 150; lvl++) {
      const baseXp = getXpForLevel(lvl);
      const calculatedLvl = getPlayerLevel(baseXp);
      expect(calculatedLvl).toBe(lvl);

      const requiredForNext = getXpRequiredForNextLevel(lvl);
      const nextBaseXp = getXpForLevel(lvl + 1);
      expect(nextBaseXp - baseXp).toBe(requiredForNext);

      // getLevelProgress tam sınır testleri
      const progressAtStart = getLevelProgress(baseXp);
      expect(progressAtStart.level).toBe(lvl);
      expect(progressAtStart.currentLevelXp).toBe(0);

      // 1 XP kala seviyenin henüz atlamadığını doğrula
      const progressJustBeforeNext = getLevelProgress(nextBaseXp - 1);
      expect(progressJustBeforeNext.level).toBe(lvl);
      expect(progressJustBeforeNext.currentLevelXp).toBe(requiredForNext - 1);
    }
  });

  it("getLevelUpDetails her seviye için çip ve can ödülü üretmeli, çökme yapmamalıdır", () => {
    for (let lvl = 2; lvl <= 100; lvl++) {
      const details = getLevelUpDetails(lvl);
      expect(details).toBeDefined();
      expect(details.coins).toBeGreaterThanOrEqual(15);
      expect(details.title).toBeTruthy();
      expect(details.unlocks.length).toBeGreaterThan(0);
    }
  });
});
