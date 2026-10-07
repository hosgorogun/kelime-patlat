import { describe, expect, it } from "vitest";
import { getWeeklyCohort } from "../shared/leagues";

describe("Senior QA Test Suite: 20'li Haftalık Lig Grubu (Weekly Division Cohort)", () => {
  it("Her grup tam olarak 20 üyeden oluşmalı ve oyuncuyu grubun içine dahil etmelidir", () => {
    const player = {
      id: "player_123",
      name: "Ahmet Usta",
      avatar: "spark",
      lp: 1800, // ALTIN
    };
    const now = new Date("2026-10-07T12:00:00Z");
    const cohort = getWeeklyCohort(player, now);

    expect(cohort.members.length).toBe(20);
    expect(cohort.weekId).toBeTruthy();
    expect(cohort.tier).toBe("ALTIN");

    const playerMember = cohort.members.find((m) => m.isCurrentPlayer);
    expect(playerMember).toBeDefined();
    expect(playerMember?.id).toBe("player_123");
    expect(playerMember?.name).toBe("Ahmet Usta");
  });

  it("Aynı hafta ve oyuncu kimliği için deterministik (tutarlı) grup ve puanlar üretmelidir", () => {
    const player = {
      id: "user_abc",
      name: "User ABC",
      avatar: "orbit",
      lp: 1100, // GÜMÜŞ
    };
    const date = new Date("2026-10-08T10:00:00Z");

    const cohortA = getWeeklyCohort(player, date);
    const cohortB = getWeeklyCohort(player, date);

    expect(cohortA.members.map((m) => m.id)).toEqual(cohortB.members.map((m) => m.id));
    expect(cohortA.members.map((m) => m.weeklyPoints)).toEqual(cohortB.members.map((m) => m.weeklyPoints));
  });

  it("Üyeler haftalık puanlarına göre büyükten küçüğe sıralı olmalıdır", () => {
    const player = {
      id: "player_top",
      name: "Lider",
      avatar: "flame",
      lp: 3800, // ELMAS
    };
    const cohort = getWeeklyCohort(player, new Date("2026-10-09T14:00:00Z"));

    for (let i = 0; i < cohort.members.length - 1; i++) {
      expect(cohort.members[i]!.weeklyPoints).toBeGreaterThanOrEqual(cohort.members[i + 1]!.weeklyPoints);
    }
  });

  it("Bölge (zone) dağılımı: İlk 3 terfi (promotion), 4-17 güvenli (safe), son 3 düşme (relegation) olmalıdır", () => {
    const player = {
      id: "player_mid",
      name: "Ortanca",
      avatar: "spark",
      lp: 2600, // PLATİN
    };
    const cohort = getWeeklyCohort(player, new Date("2026-10-09T14:00:00Z"));

    cohort.members.forEach((member, index) => {
      const rank = index + 1;
      if (rank <= 3) {
        expect(member.zone).toBe("promotion");
      } else if (rank <= 17) {
        expect(member.zone).toBe("safe");
      } else {
        expect(member.zone).toBe("relegation");
      }
    });

    const promotionCount = cohort.members.filter((m) => m.zone === "promotion").length;
    const safeCount = cohort.members.filter((m) => m.zone === "safe").length;
    const relegationCount = cohort.members.filter((m) => m.zone === "relegation").length;

    expect(promotionCount).toBe(3);
    expect(safeCount).toBe(14);
    expect(relegationCount).toBe(3);
  });

  it("Farklı haftalarda farklı rakipler ve puan dinamikleri üretilmelidir", () => {
    const player = { id: "player_x", name: "Oyuncu X", lp: 500 };
    const week1 = new Date("2026-10-05T10:00:00Z"); // W41
    const week2 = new Date("2026-10-12T10:00:00Z"); // W42

    const cohort1 = getWeeklyCohort(player, week1);
    const cohort2 = getWeeklyCohort(player, week2);

    expect(cohort1.weekId).not.toBe(cohort2.weekId);
    const botNames1 = cohort1.members.filter((m) => !m.isCurrentPlayer).map((m) => m.name);
    const botNames2 = cohort2.members.filter((m) => !m.isCurrentPlayer).map((m) => m.name);
    expect(botNames1).not.toEqual(botNames2);
  });
});
