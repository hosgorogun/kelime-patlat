import { describe, expect, it, beforeAll, afterAll } from "vitest";

// In-Memory MongoDB Document Store Simulator
class InMemoryMongoDatabase {
  private users = new Map<string, any>();
  private leaderboards = new Map<string, any>();

  async connect() {
    return true;
  }

  async disconnect() {
    this.users.clear();
    this.leaderboards.clear();
  }

  async saveUser(openId: string, data: any) {
    const existing = this.users.get(openId) || {};
    const updated = { ...existing, ...data, openId, updatedAt: new Date() };
    this.users.set(openId, updated);
    return updated;
  }

  async getUser(openId: string) {
    return this.users.get(openId) || null;
  }

  async saveLeaderboard(openId: string, name: string, score: number, wins: number) {
    const entry = { openId, name, bestArcadeScore: score, wins, updatedAt: new Date() };
    this.leaderboards.set(openId, entry);
    return entry;
  }

  async getTopLeaderboard(limit = 10) {
    return Array.from(this.leaderboards.values())
      .sort((a, b) => b.bestArcadeScore - a.bestArcadeScore)
      .slice(0, limit);
  }
}

describe("In-Memory MongoDB Integration Engine", () => {
  let db: InMemoryMongoDatabase;

  beforeAll(async () => {
    db = new InMemoryMongoDatabase();
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  it("should create and retrieve a user profile seamlessly in memory", async () => {
    const user = await db.saveUser("usr_test_1001", {
      name: "SiberSavaşçı",
      username: "siber1001",
      xp: 1500,
      coins: 450,
    });
    expect(user.openId).toBe("usr_test_1001");
    expect(user.xp).toBe(1500);

    const fetched = await db.getUser("usr_test_1001");
    expect(fetched).not.toBeNull();
    expect(fetched.name).toBe("SiberSavaşçı");
    expect(fetched.coins).toBe(450);
  });

  it("should update user progression correctly without data loss", async () => {
    await db.saveUser("usr_test_1001", { xp: 1800, coins: 600 });
    const updated = await db.getUser("usr_test_1001");
    expect(updated.xp).toBe(1800);
    expect(updated.coins).toBe(600);
    expect(updated.username).toBe("siber1001");
  });

  it("should generate dynamic leaderboards from in-memory records", async () => {
    await db.saveLeaderboard("usr_1", "Alpha", 1200, 15);
    await db.saveLeaderboard("usr_2", "Beta", 1850, 22);
    await db.saveLeaderboard("usr_3", "Gamma", 950, 8);

    const top = await db.getTopLeaderboard(2);
    expect(top.length).toBe(2);
    expect(top[0].name).toBe("Beta");
    expect(top[0].bestArcadeScore).toBe(1850);
    expect(top[1].name).toBe("Alpha");
  });
});
