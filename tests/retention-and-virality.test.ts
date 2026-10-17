import { describe, expect, it } from "vitest";
import {
  TURKISH_CITIES,
  getCityByName,
  getCityByPlate,
  filterCitiesByRegion,
  searchCities,
} from "../shared/cities";
import {
  generateDailyWordle,
  calculateDailyPercentile,
  buildDailyShareText,
  getDayNumber,
  getTodayDateId,
} from "../shared/daily-wordle";
import {
  buildChallengeShareMessage,
  type FriendChallengeData,
  type ChallengeAttempt,
} from "../shared/challenge";
import {
  addCityScore,
  registerCityPlayer,
  getCityStandings,
  getPlayerCityStanding,
} from "../server/game/city-league-service";
import {
  createFriendChallenge,
  getFriendChallenge,
  submitChallengeAttempt,
} from "../server/game/challenge-service";
import { playJackpotSound } from "../shared/audio-haptics";
import { gameSfx } from "../lib/game-sfx";

describe("81 İl Ligi (Turkish City League System)", () => {
  it("should contain exactly 81 official Turkish cities with valid plate numbers", () => {
    expect(TURKISH_CITIES.length).toBe(81);

    // Verify plate codes cover 1 to 81
    const plates = TURKISH_CITIES.map((c) => c.plate).sort((a, b) => a - b);
    expect(plates[0]).toBe(1); // 01 Adana
    expect(plates[80]).toBe(81); // 81 Düzce
    for (let i = 1; i <= 81; i++) {
      expect(plates[i - 1]).toBe(i);
    }
  });

  it("should look up cities correctly with Turkish letter casing", () => {
    expect(getCityByName("İstanbul")?.plate).toBe(34);
    expect(getCityByName("istanbul")?.plate).toBe(34);
    expect(getCityByName("İZMİR")?.plate).toBe(35);
    expect(getCityByName("izmir")?.plate).toBe(35);
    expect(getCityByName("diyarbakır")?.plate).toBe(21);
    expect(getCityByPlate(6)?.name).toBe("Ankara");
    expect(getCityByPlate(61)?.name).toBe("Trabzon");
  });

  it("should filter cities by region and search queries correctly", () => {
    const marmara = filterCitiesByRegion("Marmara");
    expect(marmara.some((c) => c.name === "İstanbul")).toBe(true);
    expect(marmara.some((c) => c.name === "Bursa")).toBe(true);

    const search34 = searchCities("34");
    expect(search34[0]?.name).toBe("İstanbul");

    const searchTra = searchCities("Trab");
    expect(searchTra[0]?.name).toBe("Trabzon");
  });

  it("should update city standings accurately when players earn points", () => {
    const initialStandings = getCityStandings();
    expect(initialStandings.length).toBe(81);

    const istanbulBefore = getPlayerCityStanding("İstanbul");
    expect(istanbulBefore).toBeDefined();
    const prevScore = istanbulBefore!.weeklyScore;

    // Award 500 points to İstanbul
    addCityScore("İstanbul", 500);

    const istanbulAfter = getPlayerCityStanding("İstanbul");
    expect(istanbulAfter!.weeklyScore).toBe(prevScore + 500);
    expect(istanbulAfter!.totalScore).toBeGreaterThanOrEqual(istanbulAfter!.weeklyScore);

    // Register a player
    const prevPlayers = istanbulAfter!.playerCount;
    registerCityPlayer("İstanbul");
    const istanbulWithPlayer = getPlayerCityStanding("İstanbul");
    expect(istanbulWithPlayer!.playerCount).toBe(prevPlayers + 1);
  });
});

describe("Günün Ortak Bulmacası (Daily Wordle Engine)", () => {
  it("should generate deterministic boards for the exact same dateId", () => {
    const dateA = "2026-10-17";
    const puzzle1 = generateDailyWordle(dateA);
    const puzzle2 = generateDailyWordle(dateA);

    expect(puzzle1.dateId).toBe(dateA);
    expect(puzzle1.dayNumber).toBe(puzzle2.dayNumber);
    expect(puzzle1.size).toBe(puzzle2.size);
    expect(puzzle1.board.board).toEqual(puzzle2.board.board);
    expect(puzzle1.targetWords).toEqual(puzzle2.targetWords);
  });

  it("should calculate speed percentiles realistically", () => {
    expect(calculateDailyPercentile(15)).toBe(2); // Top 2% (Super fast)
    expect(calculateDailyPercentile(30)).toBe(5); // Top 5%
    expect(calculateDailyPercentile(45)).toBe(12);
    expect(calculateDailyPercentile(65)).toBe(25);
    expect(calculateDailyPercentile(150)).toBe(80);
  });

  it("should format spoiler-free WhatsApp emoji cards with proper badges", () => {
    const text = buildDailyShareText(142, 28, 5, 4, "2026-10-17");
    expect(text).toContain("Kelime Patlat • Günün Bulmacası #142");
    expect(text).toContain("28 saniyede tamamladım!");
    expect(text).toContain("🔥 (En Hızlı %5)");
    expect(text).toContain("🟩🟩🟩🟩");
    expect(text).toContain("kelimepatlat.com/daily?d=2026-10-17");
  });

  it("should calculate day number smoothly from reference epoch", () => {
    const dayNum = getDayNumber("2026-10-17");
    expect(dayNum).toBeGreaterThan(100);
    expect(getTodayDateId()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("Arkadaşa Meydan Oku (Challenge / Duel Link Service)", () => {
  it("should create a challenge with unique ID and 7-day expiration", () => {
    const challenge = createFriendChallenge({
      creatorId: "user_test_99",
      creatorName: "Barış",
      creatorCity: "İzmir",
      creatorScore: 480,
      size: 4,
      board: ["K", "A", "L", "E", "M", "L", "İ", "K", "A", "R", "T", "I", "S", "O", "N", "U"],
      words: ["KALEM", "KART", "SON"],
      timeLimit: 60,
    });

    expect(challenge.id).toMatch(/^CH-[A-Z0-9]{4}$/);
    expect(challenge.creatorName).toBe("Barış");
    expect(challenge.creatorScore).toBe(480);
    expect(challenge.attemptsCount).toBe(0);
    expect(challenge.expiresAt).toBeGreaterThan(challenge.createdAt);

    // Retrieve created challenge
    const retrieved = getFriendChallenge(challenge.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(challenge.id);
  });

  it("should evaluate challenge attempts accurately (win vs loss)", () => {
    const challenge = createFriendChallenge({
      creatorId: "user_test_88",
      creatorName: "Merve",
      creatorScore: 350,
      size: 4,
      board: ["K", "A", "L", "E", "M", "L", "İ", "K", "A", "R", "T", "I", "S", "O", "N", "U"],
      words: ["KALEM", "KART"],
      timeLimit: 60,
    });

    // Attempt 1: Lower score (loss)
    const lossAttempt: ChallengeAttempt = {
      challengeId: challenge.id,
      playerId: "user_test_55",
      playerName: "Can",
      score: 280,
      wordsFound: ["KALEM"],
    };
    const lossResult = submitChallengeAttempt(lossAttempt);
    expect(lossResult).not.toBeNull();
    expect(lossResult?.won).toBe(false);
    expect(lossResult?.scoreDiff).toBe(-70);
    expect(lossResult?.coinsEarned).toBe(15);

    // Attempt 2: Higher score (win)
    const winAttempt: ChallengeAttempt = {
      challengeId: challenge.id,
      playerId: "user_test_66",
      playerName: "Deniz",
      score: 420,
      wordsFound: ["KALEM", "KART"],
    };
    const winResult = submitChallengeAttempt(winAttempt);
    expect(winResult).not.toBeNull();
    expect(winResult?.won).toBe(true);
    expect(winResult?.scoreDiff).toBe(70);
    expect(winResult?.coinsEarned).toBe(35);
    expect(winResult?.xpEarned).toBe(120);

    // Best opponent should be updated
    const updated = getFriendChallenge(challenge.id);
    expect(updated?.bestOpponentScore).toBe(420);
    expect(updated?.bestOpponentName).toBe("Deniz");
    expect(updated?.attemptsCount).toBe(2);
  });

  it("should generate WhatsApp share invite message formatted with duel link", () => {
    const msg = buildChallengeShareMessage("CH-K9M2", "Ahmet", 520, 4);
    expect(msg).toContain("⚔️ Kelime Patlat Meydan Okuması!");
    expect(msg).toContain("Ahmet, 4×4 tahtada 520 PUAN yaptı!");
    expect(msg).toContain("kelimepatlat.com/meydan-oku/CH-K9M2");
  });
});

describe("Audio & Haptics Feedback (Jackpot & Fanfares)", () => {
  it("should have jackpot sound trigger defined and safe to invoke", () => {
    expect(typeof gameSfx.jackpot).toBe("function");
    expect(typeof playJackpotSound).toBe("function");

    // Invoking in test environment should be completely safe and not throw
    expect(() => gameSfx.jackpot()).not.toThrow();
    expect(() => playJackpotSound()).not.toThrow();
  });
});
