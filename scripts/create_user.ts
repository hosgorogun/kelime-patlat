import mongoose from "mongoose";
import { UserModel, hashPassword } from "../server/db";

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kelime_patlat";
  console.log("Connecting to database:", uri);
  try {
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    const username = "oyuncu";
    const password = "şifre123";
    const fullName = "Kelime Oyuncusu";
    const email = "oyuncu@kelimepatlat.com";

    // Check if user exists
    const existing = await UserModel.findOne({ username });
    if (existing) {
      console.log(`Kullanıcı '${username}' zaten var!`);
      process.exit(0);
    }

    const openId = `usr_${username}`;
    const passwordHash = hashPassword(password);
    const now = new Date();

    const user = new UserModel({
      id: Math.abs([...openId].reduce((value, char) => ((value * 31) ^ char.charCodeAt(0)) >>> 0, 7_431)),
      openId,
      username,
      passwordHash,
      name: fullName,
      email,
      loginMethod: "credentials",
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
      progress: null
    });

    await user.save();
    console.log(`Kullanıcı başarıyla oluşturuldu!`);
    console.log(`Kullanıcı Adı: ${username}`);
    console.log(`Şifre: ${password}`);
  } catch (err) {
    console.error("Hata:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
