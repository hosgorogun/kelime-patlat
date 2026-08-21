import "dotenv/config";
import { MongoClient } from "mongodb";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";

import { connectDb } from "../server/db";
import { savePlayerProfile, loadPlayerProfile, recordLeaderboardRounds, loadLeaderboard } from "../server/game/mongo-store";
import { DEFAULT_PROGRESS } from "../shared/progression";

describe.skipIf(process.env.RUN_MONGODB_INTEGRATION !== "true")("MongoDB bağlantısı ve oyun veri akışı", () => {
  const TEST_PLAYER_ID = "test-player-999";

  afterAll(async () => {
    // Clean up test data and close Mongoose connection
    try {
      await connectDb();
      const db = mongoose.connection.db;
      if (db) {
        await db.collection("player_profiles").deleteOne({ playerId: TEST_PLAYER_ID });
        await db.collection("season_leaderboard").deleteOne({ id: TEST_PLAYER_ID });
      }
      await mongoose.disconnect();
    } catch (e) {
      console.warn("Clean up failed:", e);
    }
  });

  it("yapılandırılmış URI ile ping komutuna yanıt verir", async () => {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kelime_patlat";
    expect(uri).toBeTruthy();
    const client = new MongoClient(uri!, { serverSelectionTimeoutMS: 6_000 });
    try {
      await client.connect();
      const result = await client.db().command({ ping: 1 });
      expect(result.ok).toBe(1);
    } finally {
      await client.close();
    }
  }, 10_000);

  it("oyuncu profili kaydetme ve yükleme işlemlerini başarıyla gerçekleştirir", async () => {
    const testProgress = {
      ...DEFAULT_PROGRESS,
      xp: 450,
      bestScore: 230,
    };

    // Save profile
    const saveResult = await savePlayerProfile(TEST_PLAYER_ID, "TEST_AVCI", testProgress);
    expect(saveResult).toBeTruthy();
    expect(saveResult?.name).toBe("TEST_AVCI");
    expect(saveResult?.progress.xp).toBe(450);

    // Load profile
    const loadResult = await loadPlayerProfile(TEST_PLAYER_ID);
    expect(loadResult).toBeTruthy();
    expect(loadResult?.name).toBe("TEST_AVCI");
    expect(loadResult?.progress.bestScore).toBe(230);
  });

  it("liderlik tablosu puan güncellemelerini işler ve sıralı çıktı verir", async () => {
    // Record round
    const rounds = [{ id: TEST_PLAYER_ID, name: "TEST_AVCI", score: 180, won: true }];
    const leaderboardAfter = await recordLeaderboardRounds(rounds);
    
    expect(leaderboardAfter).toBeTruthy();
    const testEntry = leaderboardAfter?.find(e => e.id === TEST_PLAYER_ID);
    expect(testEntry).toBeTruthy();
    expect(testEntry?.score).toBeGreaterThanOrEqual(180);

    // Fetch leaderboard
    const currentLeaderboard = await loadLeaderboard();
    expect(currentLeaderboard).toBeTruthy();
    expect(currentLeaderboard!.length).toBeGreaterThan(0);
  });
});
