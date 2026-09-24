import { describe, expect, it } from "vitest";
import { getRandomBotPersona, BOT_USERNAMES, BOT_AVATARS } from "../shared/botPersonas";
import { botThinkDelayMs } from "../shared/game";

describe("Bot AI & Persona Sistemi Kapsamlı Test Suiti", () => {
  it("Ev sahibi oyuncu bilgileri ile gerçekçi, dengeli bot profili üretmelidir", () => {
    const hostPlayer = { name: "Ahmet", lp: 500, level: 20 };
    const bot = getRandomBotPersona(hostPlayer);

    expect(bot.isBot).toBe(true);
    expect(bot.connected).toBe(true);
    expect(bot.ready).toBe(true);
    expect(BOT_USERNAMES).toContain(bot.name);
    expect(BOT_AVATARS).toContain(bot.avatar);
    expect(bot.level!).toBeGreaterThanOrEqual(10);
    expect(bot.level!).toBeLessThanOrEqual(25);
    expect(bot.lp!).toBeGreaterThanOrEqual(380);
    expect(bot.lp!).toBeLessThanOrEqual(620);
    expect(bot.tier).toBeDefined();
    expect(bot.selectedTitle).toBeDefined();
    expect(bot.selectedFrame).toBeDefined();
    expect(bot.matches!).toBeGreaterThan(0);
    expect(bot.wins!).toBeLessThanOrEqual(bot.matches!);
  });

  it("Ev sahibi verilmediğinde varsayılan bot profil parametrelerini güvenle üretmelidir", () => {
    const bot = getRandomBotPersona();
    expect(bot.isBot).toBe(true);
    expect(bot.lp!).toBeGreaterThanOrEqual(0);
    expect(bot.level!).toBeGreaterThanOrEqual(1);
  });

  it("İnsan benzeri düşünme sürelerini (botThinkDelayMs) harf ve tahta boyutuna göre ölçeklemelidir", () => {
    // 3 harfli kısa kelime (daha hızlı düşünülür)
    const shortDelays: number[] = [];
    for (let i = 0; i < 50; i++) {
      shortDelays.push(botThinkDelayMs(4, 3));
    }
    const avgShort = shortDelays.reduce((a, b) => a + b, 0) / shortDelays.length;

    // 7 harfli uzun kelime (daha uzun düşünülür)
    const longDelays: number[] = [];
    for (let i = 0; i < 50; i++) {
      longDelays.push(botThinkDelayMs(4, 7));
    }
    const avgLong = longDelays.reduce((a, b) => a + b, 0) / longDelays.length;

    expect(avgShort).toBeLessThan(avgLong);
    expect(avgShort).toBeGreaterThanOrEqual(2000);
    expect(avgLong).toBeLessThanOrEqual(18000);
  });

  it("Peş peşe çağrılarda benzersiz Bot ID'leri ve kişiselleştirilmiş özellikler üretmelidir", () => {
    const bot1 = getRandomBotPersona();
    const bot2 = getRandomBotPersona();
    
    expect(bot1.id).not.toEqual(bot2.id);
  });
});
