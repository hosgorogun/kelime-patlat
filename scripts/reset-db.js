import "dotenv/config";
import { connectDb, UserModel, hashPassword } from "../server/db.js";

async function resetDb() {
  try {
    await connectDb();
    console.log("MongoDB veritabanı temizliği başlatılıyor...");
    
    // Tüm kayıtlı hesapları sil
    const usersCount = await UserModel.countDocuments();
    await UserModel.deleteMany({});
    console.log(`${usersCount} adet kayıtlı hesap veritabanından başarıyla silindi.`);
    
    // Yeni temiz kullanıcı oluştur
    const openId = "usr_ogo77";
    const now = new Date();
    const newUser = new UserModel({
      id: 1001,
      openId,
      username: "ogo77",
      passwordHash: hashPassword("123456"),
      name: "OGO77",
      email: "ogo77@kelimepatlat.app",
      loginMethod: "credentials",
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
      progress: {
        xp: 0,
        lp: 0,
        dailyCompletedId: null,
        streak: 0,
        wins: 0,
        matches: 0,
        bestScore: 0,
        bestTempo: 0,
        bestArcadeScore: 0,
        missions: { daily: 0, duels: 0, wordsmith: 0 },
        selectedTheme: "nature",
        selectedAvatar: "spark",
        history: [],
        streakShields: 1,
        coins: 100,
        radarChargesBonus: 2,
        claimedMilestones: {},
        dailyClaimed: {},
        gender: "male",
        selectedFrame: "signal",
        selectedVictoryEffect: "pulse",
        ownedFrames: { signal: true },
        ownedVictoryEffects: { pulse: true },
        selectedBoardSkin: "grid",
        ownedBoardSkins: { grid: true },
      }
    });
    
    await newUser.save();
    console.log("\n====================================================");
    console.log("🎉 TÜM HESAPLAR SİLİNDİ VE YENİ HESABINIZ AÇILDI!");
    console.log("====================================================");
    console.log("Kullanıcı Adı : ogo77");
    console.log("Şifre         : 123456");
    console.log("İsim          : OGO77");
    console.log("Hoş Geldin Hediyesi: 100 Siber Çip, 2 Radar Hakkı, 1 Kalkan");
    console.log("====================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("DB Reset Hatası:", err);
    process.exit(1);
  }
}

resetDb();
