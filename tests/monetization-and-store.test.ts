import { describe, expect, it, beforeEach } from "vitest";
import { monetizationManager, INTERSTITIAL_MATCH_INTERVAL } from "../shared/monetization";
import { CHIP_EQUIPMENT_ITEMS, PROFILE_FRAMES, VICTORY_EFFECTS } from "../shared/store-items";

describe("Monetizasyon & Mağaza Ürünleri Test Suiti", () => {
  beforeEach(() => {
    monetizationManager.resetInterstitialCounter();
  });

  it("Reklam motoru her 3 kazanılan maçta bir geçiş reklamı önerisinde bulunmalıdır", () => {
    expect(monetizationManager.getCompletedMatchesCount()).toBe(0);

    // 1. Maç
    const res1 = monetizationManager.recordMatchFinished(true);
    expect(res1.shouldShowInterstitial).toBe(false);

    // 2. Maç
    const res2 = monetizationManager.recordMatchFinished(true);
    expect(res2.shouldShowInterstitial).toBe(false);

    // 3. Maç (Sınır)
    const res3 = monetizationManager.recordMatchFinished(true);
    expect(res3.shouldShowInterstitial).toBe(true);
    expect(res3.matchCount).toBe(3);
  });

  it("Kaybedilen maçlarda sayaç artmamalı, kullanıcıyı ekstra cezalandırmamalıdır", () => {
    const resLost = monetizationManager.recordMatchFinished(false);
    expect(resLost.shouldShowInterstitial).toBe(false);
    expect(monetizationManager.getCompletedMatchesCount()).toBe(0);
  });

  it("Mağaza çip ekipmanları ve çerçeve/efekt tanımları eksiksiz olmalıdır", () => {
    expect(CHIP_EQUIPMENT_ITEMS.length).toBeGreaterThanOrEqual(4);
    for (const item of CHIP_EQUIPMENT_ITEMS) {
      expect(item.id).toBeDefined();
      expect(item.cost).toBeGreaterThan(0);
      expect(item.name).toBeDefined();
    }

    expect(PROFILE_FRAMES.length).toBeGreaterThanOrEqual(5);
    expect(VICTORY_EFFECTS.length).toBeGreaterThanOrEqual(5);
  });
});
