import { describe, expect, it } from "vitest";
import { getRandomBotPersona, BOT_USERNAMES, BOT_AVATARS } from "../shared/botPersonas";
import { botThinkDelayMs } from "../shared/game";

describe("Bot AI & Persona System", () => {
  it("should generate a realistic bot persona with valid properties", () => {
    const hostPlayer = { name: "Ahmet", lp: 500, level: 20 };
    const bot = getRandomBotPersona(hostPlayer);

    expect(bot.isBot).toBe(true);
    expect(bot.connected).toBe(true);
    expect(BOT_USERNAMES).toContain(bot.name);
    expect(BOT_AVATARS).toContain(bot.avatar);
    expect(bot.level).toBeGreaterThanOrEqual(15); // hostLevel 20 - 5
    expect(bot.level).toBeLessThanOrEqual(25);    // hostLevel 20 + 5
    expect(bot.lp).toBeGreaterThanOrEqual(380);   // hostLp 500 - 120
    expect(bot.lp).toBeLessThanOrEqual(620);      // hostLp 500 + 120
    expect(bot.tier).toBeDefined();
    expect(bot.selectedTitle).toBeDefined();
    expect(bot.matches).toBeGreaterThan(0);
    expect(bot.wins).toBeLessThanOrEqual(bot.matches);
  });

  it("should calculate human-like bot thinking delays with length scaling", () => {
    // Test 3-letter word (should be faster on average)
    const shortDelays: number[] = [];
    for (let i = 0; i < 50; i++) {
      shortDelays.push(botThinkDelayMs(4, 3));
    }
    const avgShort = shortDelays.reduce((a, b) => a + b, 0) / shortDelays.length;

    // Test 7-letter word (should take longer on average)
    const longDelays: number[] = [];
    for (let i = 0; i < 50; i++) {
      longDelays.push(botThinkDelayMs(4, 7));
    }
    const avgLong = longDelays.reduce((a, b) => a + b, 0) / longDelays.length;

    expect(avgShort).toBeLessThan(avgLong);
    expect(avgShort).toBeGreaterThanOrEqual(2500);
    expect(avgLong).toBeLessThanOrEqual(16000);
  });

  it("should generate different bot personas on subsequent calls", () => {
    const bot1 = getRandomBotPersona();
    const bot2 = getRandomBotPersona();
    
    // IDs should be unique
    expect(bot1.id).not.toEqual(bot2.id);
  });
});
