import mongoose from "mongoose";
import { UserModel, FriendRequestModel, connectDb, hashPassword } from "../server/db";
import { DEFAULT_PROGRESS } from "../shared/progression";

async function main() {
  await connectDb();
  const users = await UserModel.countDocuments();
  const friends = await FriendRequestModel.countDocuments();
  console.log(`[Reset] Mevcut: ${users} hesap, ${friends} arkadaşlık isteği`);
  await UserModel.deleteMany({});
  await FriendRequestModel.deleteMany({});
  const collections = await mongoose.connection.db!.listCollections().toArray();
  for (const c of collections) {
    if (/leaderboard|profile/i.test(c.name)) {
      await mongoose.connection.db!.collection(c.name).deleteMany({});
      console.log(`[Reset] Temizlendi: ${c.name}`);
    }
  }
  const now = new Date();
  await UserModel.create({
    id: 1001,
    openId: "usr_oyuncu",
    username: "oyuncu",
    passwordHash: hashPassword("kelime123"),
    name: "Oyuncu",
    email: "oyuncu@kelimepatlat.com",
    loginMethod: "credentials",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    progress: DEFAULT_PROGRESS,
  });
  console.log("[Reset] Yeni hesap: oyuncu / kelime123");
  await mongoose.disconnect();
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("[Reset] Hata:", e.message);
  process.exit(1);
});
