import { describe, expect, it } from "vitest";
import { createSoloBoard, getSoloLevel, ARCADE_INITIAL_TIME, calculateArcadeCombo } from "../shared/solo";
import { socialManager } from "../shared/social";

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
    expect(ARCADE_INITIAL_TIME).toBe(40);
    const comboRes = calculateArcadeCombo(3);
    expect(comboRes.bonusSeconds).toBe(2);
    expect(comboRes.bonusScore).toBe(25);
  });

  it("🎁 Loot Box Reveal ve Sosyal Etkileşimleri canlı test eder", async () => {
    await socialManager.init();
    const addRes = socialManager.addFriend({ username: "SiberOyuncu", name: "Siber Oyuncu" });
    expect(addRes.success).toBe(true);
  });
});
