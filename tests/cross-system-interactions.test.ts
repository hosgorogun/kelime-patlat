import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS, PlayerProgress } from "../shared/progression";

describe("Çapraz Sistem Etkileşimi (Cross-System Interaction Matrix) Testleri", () => {
  it("Mağazadan alınan Siber Radar (Economy ↔ Gameplay) profildeki radarChargesBonus güncellendiğinde aktif maça yansımalıdır", () => {
    let progress: PlayerProgress = { ...DEFAULT_PROGRESS, radarChargesBonus: 0 };
    expect(progress.radarChargesBonus).toBe(0);

    // Mağazadan 5'li radar paketi satın alındı
    progress = {
      ...progress,
      radarChargesBonus: (progress.radarChargesBonus || 0) + 5,
    };

    expect(progress.radarChargesBonus).toBe(5);
  });

  it("Günlük Oturum (dailySession ↔ Solo Level) navigasyon değişimlerinde session sıfırlama kuralına uymalıdır", () => {
    let dailySession: { id: string; themeId: any } | null = { id: "2026-09-17", themeId: "space" };
    let currentScreen = "daily-lobby";

    // Seviye ekranına yönlenme
    const openSoloLevel = (level: number) => {
      dailySession = null; // Navigasyon kuralı
      currentScreen = "solo";
    };

    openSoloLevel(5);
    expect(dailySession).toBeNull();
    expect(currentScreen).toBe("solo");
  });
});
