import "dotenv/config";
import { MongoClient } from "mongodb";
import { describe, expect, it } from "vitest";

describe.skipIf(process.env.RUN_MONGODB_INTEGRATION !== "true")("MongoDB bağlantısı", () => {
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
});
