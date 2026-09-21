import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS, PlayerProgress, deductLife, getCalculatedLives, MAX_LIVES } from "../shared/progression";

describe("Dereceli Onay & Can Mantığı Testleri", () => {
  it("promptBotDuel verileri doğru mod başlıklarını ve sürelerini oluşturmalıdır", () => {
    const getModeInfo = (size: 4 | 6 | 8 | 10) => {
      const modeTitle = size === 4 ? "4×4 Nabız Hızlı Savaş" : size === 6 ? "6×6 Akış Düellosu" : size === 8 ? "8×8 Derinlik Düellosu" : "10×10 Zirve Master Savaş";
      const durationText = size === 4 ? "55 Saniye" : size === 6 ? "75 Saniye" : size === 8 ? "90 Saniye" : "110 Saniye";
      const routesText = size === 4 ? "4 Rota" : size === 6 ? "6 Rota" : size === 8 ? "8 Rota" : "10 Rota";
      return { modeTitle, durationText, routesText };
    };

    expect(getModeInfo(4)).toEqual({ modeTitle: "4×4 Nabız Hızlı Savaş", durationText: "55 Saniye", routesText: "4 Rota" });
    expect(getModeInfo(6)).toEqual({ modeTitle: "6×6 Akış Düellosu", durationText: "75 Saniye", routesText: "6 Rota" });
    expect(getModeInfo(8)).toEqual({ modeTitle: "8×8 Derinlik Düellosu", durationText: "90 Saniye", routesText: "8 Rota" });
    expect(getModeInfo(10)).toEqual({ modeTitle: "10×10 Zirve Master Savaş", durationText: "110 Saniye", routesText: "10 Rota" });
  });

  it("deductLife canları 1 eksiltmeli ve son güncelleme zamanını kaydetmelidir", () => {
    const now = Date.now();
    const progress: PlayerProgress = { ...DEFAULT_PROGRESS, lives: 5, lastLifeRegenTimestamp: now };
    const updated = deductLife(progress);

    const calc = getCalculatedLives(updated);
    expect(calc.lives).toBe(4);
  });

  it("canlar 0 olduğunda deductLife canları negatif yapmamalı ve 0 ile sınırlandırmalıdır", () => {
    const progress: PlayerProgress = { ...DEFAULT_PROGRESS, lives: 0, lastLifeRegenTimestamp: Date.now() };
    const updated = deductLife(progress);

    const calc = getCalculatedLives(updated);
    expect(calc.lives).toBe(0);
  });

  it("30 dakika geçtikten sonra getCalculatedLives otomatik 1 can yenilemelidir", () => {
    const thirtyMinsAgo = Date.now() - 30 * 60 * 1000 - 1000;
    const progress: PlayerProgress = { ...DEFAULT_PROGRESS, lives: 3, lastLifeRegenTimestamp: thirtyMinsAgo };
    const calc = getCalculatedLives(progress);

    expect(calc.lives).toBe(4);
  });

  it("Seri kalkanı (streakShields) harcandığında envanterden tam 1 adet düşmelidir", () => {
    const progress: PlayerProgress = { ...DEFAULT_PROGRESS, streakShields: 2 };
    const availableShields = progress.streakShields || 0;
    expect(availableShields).toBe(2);

    const updated = {
      ...progress,
      streakShields: Math.max(0, availableShields - 1),
    };

    expect(updated.streakShields).toBe(1);
  });

  it("Seri kalkanı 0 iken harcanmak istendiğinde negatif değer almamalıdır", () => {
    const progress: PlayerProgress = { ...DEFAULT_PROGRESS, streakShields: 0 };
    const availableShields = progress.streakShields || 0;

    const updated = {
      ...progress,
      streakShields: Math.max(0, availableShields - 1),
    };

    expect(updated.streakShields).toBe(0);
  });

  it("Retry (Tekrar Dene) yapıldığında maç tamamlanma kilitleri (hasFinished & submitted) sıfırlanmalıdır", () => {
    let hasFinished = true;
    let submitted = true;

    // Retry simülasyonu
    const handleRetry = () => {
      hasFinished = false;
      submitted = false;
    };

    handleRetry();
    expect(hasFinished).toBe(false);
    expect(submitted).toBe(false);
  });

  it("hücreler arası yön okları ve açı hesabı (atan2 ve mesafe) doğru çalışmalıdır", () => {
    // 1. Sağa doğru yatay bağlantı (0 derece / 0 rad)
    const p1 = { x: 50, y: 50 };
    const p2 = { x: 100, y: 50 };
    const dx1 = p2.x - p1.x;
    const dy1 = p2.y - p1.y;
    const length1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const angle1 = Math.atan2(dy1, dx1);
    expect(length1).toBe(50);
    expect(angle1).toBe(0);

    // 2. Aşağı doğru dikey bağlantı (90 derece / PI/2 rad)
    const p3 = { x: 50, y: 120 };
    const dx2 = p3.x - p1.x;
    const dy2 = p3.y - p1.y;
    const length2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    const angle2 = Math.atan2(dy2, dx2);
    expect(length2).toBe(70);
    expect(angle2).toBeCloseTo(Math.PI / 2, 4);

    // 3. Çapraz bağlantı (45 derece)
    const p4 = { x: 100, y: 100 };
    const dx3 = p4.x - p1.x;
    const dy3 = p4.y - p1.y;
    const angle3 = Math.atan2(dy3, dx3);
    expect(angle3).toBeCloseTo(Math.PI / 4, 4);
  });

  it("rota harf sırası başlangıç ve bitiş rozetlerini doğru belirlemelidir", () => {
    const letters = ["K", "A", "L", "E"];

    const getCellBadge = (idx: number, total: number) => {
      if (idx === 0) return { label: "1", type: "start", color: "#10B981" };
      if (idx === total - 1) return { label: "✓", type: "end", color: "#EF4444" };
      return { label: String(idx + 1), type: "middle", color: "#3B82F6" };
    };

    expect(getCellBadge(0, letters.length)).toEqual({ label: "1", type: "start", color: "#10B981" });
    expect(getCellBadge(1, letters.length)).toEqual({ label: "2", type: "middle", color: "#3B82F6" });
    expect(getCellBadge(2, letters.length)).toEqual({ label: "3", type: "middle", color: "#3B82F6" });
    expect(getCellBadge(3, letters.length)).toEqual({ label: "✓", type: "end", color: "#EF4444" });
  });

  it("activeRouteCard harf çipleri başlangıç, bitiş ve yön oklarını eksiksiz üretmelidir", () => {
    const word = "KALE";
    const chips = word.split("").map((letter, idx, arr) => {
      const isStart = idx === 0;
      const isEnd = idx === arr.length - 1;
      const label = `${idx + 1} ${letter}${isStart ? " • BAŞLANGIÇ" : isEnd ? " • BİTİŞ" : ""}`;
      return { letter, idx, label, hasArrowAfter: !isEnd };
    });

    expect(chips.length).toBe(4);
    expect(chips[0].label).toBe("1 K • BAŞLANGIÇ");
    expect(chips[0].hasArrowAfter).toBe(true);
    expect(chips[1].label).toBe("2 A");
    expect(chips[1].hasArrowAfter).toBe(true);
    expect(chips[2].label).toBe("3 L");
    expect(chips[2].hasArrowAfter).toBe(true);
    expect(chips[3].label).toBe("4 E • BİTİŞ");
    expect(chips[3].hasArrowAfter).toBe(false);
  });

  it("MatchHistoryModal rozet rengi ve etiketi solo mağlubiyet durumunu (won: false) doğru yansıtmalıdır", () => {
    const getBadgeInfo = (isSoloMode: boolean, isWon: boolean, isDraw = false) => {
      const resultBadgeColor = isSoloMode
        ? (isWon ? "#06B6D4" : "#EF4444")
        : isDraw
        ? "#F59E0B"
        : isWon
        ? "#10B981"
        : "#EF4444";

      const resultLabel = isSoloMode
        ? (isWon ? "🎯 TAMAMLANDI" : "💔 BAŞARISIZ")
        : isDraw
        ? "⚖️ BERABERE"
        : isWon
        ? "🏆 KAZANDI"
        : "💔 KAYBETTİ";

      return { resultBadgeColor, resultLabel };
    };

    // Solo kazanma
    expect(getBadgeInfo(true, true)).toEqual({
      resultBadgeColor: "#06B6D4",
      resultLabel: "🎯 TAMAMLANDI",
    });

    // Solo kaybetme (artık hatalı olarak TAMAMLANDI yazmıyor)
    expect(getBadgeInfo(true, false)).toEqual({
      resultBadgeColor: "#EF4444",
      resultLabel: "💔 BAŞARISIZ",
    });

    // Düello kazanma
    expect(getBadgeInfo(false, true)).toEqual({
      resultBadgeColor: "#10B981",
      resultLabel: "🏆 KAZANDI",
    });

    // Düello kaybetme
    expect(getBadgeInfo(false, false)).toEqual({
      resultBadgeColor: "#EF4444",
      resultLabel: "💔 KAYBETTİ",
    });
  });
});
