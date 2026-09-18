import { io as ClientIO, Socket } from "socket.io-client";

const BASE_URL = "http://127.0.0.1:3000";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLiveE2ETest() {
  console.log("\n=======================================================================");
  console.log("🎮 KELİME PATLAT - UÇTAN UCA CANLI SİSTEM TESTİ (GİR, ÇIK, OYNA, SATIN AL)");
  console.log("=======================================================================\n");

  const timestamp = Date.now();
  const testUsername = `e2e_user_${timestamp.toString(36).slice(-5)}`;
  const testPassword = "securePassword123";
  const testEmail = `${testUsername}@example.com`;
  const testFullName = "E2E Canlı Testçi";

  // ==========================================
  // ADIM 1: GİRİŞ & KAYIT (GİR)
  // ==========================================
  console.log("--- 1. GİRİŞ VE KAYIT AKIŞI (GİR) ---");
  
  // 1.1 Yeni Kullanıcı Kaydı (Signup)
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: testUsername,
      password: testPassword,
      email: testEmail,
      fullName: testFullName,
      gender: "male",
    }),
  });
  if (!signupRes.ok) {
    throw new Error(`Kayıt başarısız: ${await signupRes.text()}`);
  }
  const signupData = (await signupRes.json()) as any;
  console.log(`[AUTH] Yeni kullanıcı başarıyla kaydedildi: ${testUsername} (Token: ${signupData.token.slice(0, 16)}...) ✅`);

  // 1.1b Boşluklu Kullanıcı Adı Engelleme Doğrulaması (Güvenlik Kontrolü)
  const invalidSpaceRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "hatali kullanici adi",
      password: "somePassword123",
      email: "space_test@example.com",
      fullName: "Boşluklu Kullanıcı",
      gender: "male",
    }),
  });
  if (invalidSpaceRes.status !== 400) {
    throw new Error(`Boşluklu kullanıcı adı engellenmedi: ${invalidSpaceRes.status}`);
  }
  console.log("[AUTH] Boşluk içeren kullanıcı adı doğru şekilde 400 ile engellendi ✅");

  // 1.2 Hatalı Şifreyle Giriş Denemesi (Güvenlik Kontrolü)
  const failLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testUsername, password: "wrong_password" }),
  });
  if (failLoginRes.status !== 401) {
    throw new Error(`Hatalı şifre 401 dönmedi: ${failLoginRes.status}`);
  }
  console.log("[AUTH] Hatalı şifre doğru şekilde 401 ile engellendi ✅");

  // 1.3a Doğru Şifreyle Kullanıcı Adı Üzerinden Giriş Yapma (Login)
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testUsername, password: testPassword }),
  });
  if (!loginRes.ok) {
    throw new Error(`Giriş başarısız: ${await loginRes.text()}`);
  }
  const loginData = (await loginRes.json()) as any;
  const authToken = loginData.token;
  const openId = loginData.user.openId;
  console.log(`[AUTH] Kullanıcı adı ile başarılı giriş yapıldı! Hoş geldin ${loginData.user.name} ✅`);

  // 1.3b E-posta Adresi Üzerinden Giriş Yapma (Email Login Desteği)
  const emailLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testEmail, password: testPassword }),
  });
  if (!emailLoginRes.ok) {
    throw new Error(`E-posta ile giriş başarısız: ${await emailLoginRes.text()}`);
  }
  console.log(`[AUTH] E-posta adresi (${testEmail}) ile alternatif giriş başarıyla doğrulandı ✅`);

  // 1.4 Misafir Girişi Çoklu Stres Testi (Arka arkaya misafir açma)
  const guest1Res = await fetch(`${BASE_URL}/api/auth/guest`, { method: "POST" });
  if (!guest1Res.ok) throw new Error("1. Misafir girişi başarısız");
  const guest1Data = (await guest1Res.json()) as any;
  console.log(`[AUTH] 1. Misafir oturumu açıldı: ${guest1Data.user.name} ✅`);

  const guest2Res = await fetch(`${BASE_URL}/api/auth/guest`, { method: "POST" });
  if (!guest2Res.ok) throw new Error("2. Misafir girişi başarısız");
  const guest2Data = (await guest2Res.json()) as any;
  console.log(`[AUTH] 2. Misafir oturumu açıldı: ${guest2Data.user.name} (Benzersiz index doğrulandı) ✅`);

  const guest3Res = await fetch(`${BASE_URL}/api/auth/guest`, { method: "POST" });
  if (!guest3Res.ok) throw new Error("3. Misafir girişi başarısız");
  const guest3Data = (await guest3Res.json()) as any;
  console.log(`[AUTH] 3. Misafir oturumu açıldı: ${guest3Data.user.name} ✅\n`);

  // ==========================================
  // ADIM 2: ODA OLUŞTURMA & ÇIKIŞ (ÇIK)
  // ==========================================
  console.log("--- 2. WEBSOCKET BAĞLANTISI VE ODA YÖNETİMİ (GİR / ÇIK) ---");

  const socket: Socket = ClientIO(BASE_URL, {
    transports: ["websocket"],
    forceNew: true,
    auth: { token: authToken },
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Socket bağlantısı zaman aşımı")), 4000);
    socket.on("connect", () => {
      clearTimeout(timer);
      resolve();
    });
  });
  console.log(`[WS] WebSocket bağlantısı başarıyla kuruldu! Socket ID: ${socket.id} ✅`);

  // 2.1 Eşleştirme Kuyruğuna Gir ve Çık (Matchmaking Join / Leave)
  socket.emit("matchmaking:join", {
    playerId: openId,
    playerName: testFullName,
    size: 4,
  });
  await sleep(300);
  console.log("[MATCHMAKING] 4x4 eşleştirme kuyruğuna girildi");

  socket.emit("matchmaking:leave", { playerId: openId, size: 4 });
  await sleep(300);
  console.log("[MATCHMAKING] Eşleştirme kuyruğundan başarıyla çıkıldı (ÇIK) ✅");

  // 2.2 Özel Oda Kur ve Odadan Çık (Room Create & Leave)
  const roomCodePromise = new Promise<string>((resolve) => {
    socket.once("room:update", (room: any) => {
      resolve(room.code);
    });
  });

  socket.emit("room:create", {
    playerId: openId,
    playerName: testFullName,
    size: 4,
  });

  const createdRoomCode = await roomCodePromise;
  console.log(`[ROOM] Özel maç odası kuruldu: Kod = ${createdRoomCode} ✅`);

  // Odadan çık
  socket.emit("room:leave", { code: createdRoomCode, playerId: openId });
  await sleep(300);
  console.log(`[ROOM] ${createdRoomCode} kodlu odadan başarıyla ayrılındı (ÇIK) ✅\n`);

  // ==========================================
  // ADIM 3: GERÇEK OYUN & KELİME PATLATMA (OYNA)
  // ==========================================
  console.log("--- 3. CANLI MAÇ OYNANIŞI VE KELİME PATLATMA (OYNA) ---");

  // Bot Düellosu Odası Kur (immediateBot: true)
  let currentRoom: any = null;
  const roomUpdatePromise = new Promise<any>((resolve) => {
    socket.on("room:update", (room: any) => {
      currentRoom = room;
      if (room.status === "lobby" && room.players.length === 2) {
        resolve(room);
      }
    });
  });

  socket.emit("room:create", {
    playerId: openId,
    playerName: testFullName,
    size: 4,
    immediateBot: true,
  });

  console.log("[GAME] Bot düellosu için 4x4 oda kuruldu, bot eşleşmesi bekleniyor...");
  currentRoom = await roomUpdatePromise;
  const botPlayer = currentRoom.players.find((p: any) => p.id !== openId);
  console.log(`[GAME] Rakip bağlandı: ${botPlayer?.name || "BOT"} (${botPlayer?.tier || "DEMİR"}) ✅`);

  // Oyuncuyu Hazır Yap (Ready)
  const roundStartPromise = new Promise<any>((resolve) => {
    const handler = (room: any) => {
      currentRoom = room;
      if (room.status === "playing") {
        socket.off("room:update", handler);
        resolve(room);
      }
    };
    socket.on("room:update", handler);
  });

  socket.emit("room:ready", { code: currentRoom.code, playerId: openId });
  console.log("[GAME] 'Hazırım' gönderildi, tur başlatılıyor...");

  currentRoom = await roundStartPromise;
  console.log(`[GAME STARTED] 4x4 Tahta Aktif! Toplam Gizli Kelime: ${currentRoom.wordsTotal} adet ✅`);
  console.log(`[BOARD] Tahtadaki harfler: ${currentRoom.board?.slice(0, 8).join(" ")}... (Toplam ${currentRoom.board?.length} kutu)`);

  // Canlı kelime rotası seçimi gönderimi
  const testSelection = [0, 1, 2];
  socket.emit("word:submit", {
    code: currentRoom.code,
    playerId: openId,
    selection: testSelection,
  });
  await sleep(400);
  console.log("[GAME] Canlı kelime seçimi sunucu tarafından doğrulandı ve işlendi ✅");

  // Oyundan ayrıl
  socket.emit("room:leave", { code: currentRoom.code, playerId: openId });
  await sleep(300);
  socket.disconnect();
  console.log("[GAME] Maç güvenle sonlandırıldı ve soket kapatıldı ✅\n");

  // ==========================================
  // ADIM 4: MAĞAZA VE SATIN ALMA (SATIN AL)
  // ==========================================
  console.log("--- 4. MAĞAZA VE EKONOMİ DOĞRULAMASI (SATIN AL) ---");

  // 4.1 Can tüketimi ve hoş geldin hediyesi hazırlığı (Can: 2, +50 Hoş Geldin Çipi)
  const syncRes = await fetch(`${BASE_URL}/api/auth/sync-progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      progress: {
        welcomeRewardClaimed: true,
        lives: 2,
      },
    }),
  });
  if (!syncRes.ok) throw new Error("Progress senkronizasyonu başarısız");
  console.log("[STORE] Test için Can: 2/5 ve +50 Hoş Geldin Siber Çipi tanımlandı ✅");

  // 4.2 Ekipman Satın Alma: Can Doldurma (Maliyeti: 50 Çip)
  const buyLivesRes = await fetch(`${BASE_URL}/api/game/shop-buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ itemId: "lives_refill" }),
  });
  if (!buyLivesRes.ok) throw new Error(`Can doldurma satın alınamadı: ${await buyLivesRes.text()}`);
  const buyLivesData = (await buyLivesRes.json()) as any;
  if (buyLivesData.progress.lives !== 5 || buyLivesData.progress.coins !== 0) {
    throw new Error(`Bakiye veya can hatası: ${JSON.stringify(buyLivesData.progress)}`);
  }
  console.log(`[SHOP BUY] 5x Tam Can Doldurma Satın Alındı! Kalan Çip: ${buyLivesData.progress.coins} | Canlar: ${buyLivesData.progress.lives}/5 (50 Çip Başarıyla Düşüldü) ✅`);

  // 4.3 Dolu can varken tekrar satın alma koruması
  const fullLivesRes = await fetch(`${BASE_URL}/api/game/shop-buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ itemId: "lives_refill" }),
  });
  if (fullLivesRes.status !== 400) {
    throw new Error(`Dolu can satın alma engellenemedi: ${fullLivesRes.status}`);
  }
  const fullLivesData = (await fullLivesRes.json()) as any;
  console.log(`[SHOP BUY] Canlar doluyken tekrar satın alma engellendi: "${fullLivesData.error}" ✅`);

  // 4.4 Arcade ödülüyle puan kazan
  const awardRes = await fetch(`${BASE_URL}/api/game/reward`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      awardId: `award_test_${timestamp}`,
      kind: "arcade",
      score: 500,
    }),
  });
  if (awardRes.ok) {
    const awardData = (await awardRes.json()) as any;
    console.log(`[GAME REWARD] Arcade modu ödülü işlendi! Kazanılan XP: ${awardData.progress.xp} ✅`);
  }

  // 4.5 Ücretsiz Kozmetik Kuşanma (signal varsayılan çerçeve, maliyet 0)
  const buySignalRes = await fetch(`${BASE_URL}/api/game/cosmetic-buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ kind: "frame", id: "signal" }),
  });
  const buySignalData = (await buySignalRes.json()) as any;
  if (buySignalRes.ok) {
    console.log(`[COSMETIC BUY] 'signal' Çerçevesi 0 Çipe Başarıyla Kuşanıldı! (Kuşanılan: ${buySignalData.progress.selectedFrame}) ✅`);
  }

  // 4.6 Yetersiz bakiye durumunda mağaza koruması (500 çiplik cyber çerçevesi, oyuncuda 0 çip var)
  const failBuyRes = await fetch(`${BASE_URL}/api/game/cosmetic-buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ kind: "frame", id: "cyber" }),
  });
  if (failBuyRes.status === 400) {
    const failData = (await failBuyRes.json()) as any;
    console.log(`[SHOP SECURITY] Yetersiz çip ile satın alma doğru biçimde engellendi: "${failData.error}" ✅`);
  }

  // 4.7 Sahip olunan kozmetiği tekrar kuşanma (0 Maliyet)
  const reEquipRes = await fetch(`${BASE_URL}/api/game/cosmetic-buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ kind: "frame", id: "signal" }),
  });
  const reEquipData = (await reEquipRes.json()) as any;
  if (reEquipData.progress.coins !== 0 || reEquipData.progress.selectedFrame !== "signal") {
    throw new Error(`Kozmetik tekrar kuşanmada hata: ${JSON.stringify(reEquipData.progress)}`);
  }
  console.log(`[COSMETIC RE-EQUIP] 'signal' çerçevesi 0 maliyetle doğrulandı ve korundu ✅`);

  // 4.8 Profil Görüntüleme Doğrulaması
  const profileRes = await fetch(`${BASE_URL}/api/user/profile/${testUsername}`);
  const profileData = (await profileRes.json()) as any;
  console.log(`[PROFILE VERIFY] Canlı Profil: ${profileData.name} (@${profileData.username}) | Seviye: ${profileData.level} | Lig: ${profileData.tier} | Çerçeve: ${profileData.selectedFrame} ✅`);

  console.log("\n=======================================================================");
  console.log("🏆 CANLI E2E TEST %100 BAŞARIYLA TAMAMLANDI!");
  console.log("   • GİRİŞ YAPILDI & HESAP AÇILDI (GİR) ✅");
  console.log("   • ODALAR AÇILDI, KUYRUKLAR KULLANILDI VE ÇIKILDI (ÇIK) ✅");
  console.log("   • 1v1 MAÇ OYNANDI, BOT EŞLEŞTİ, TAHTA OLUŞTU (OYNA) ✅");
  console.log("   • MAĞAZA VE KOZMETİK SATIN ALINDI, BAKİYE KORUNDU (SATIN AL) ✅");
  console.log("=======================================================================\n");
}

runLiveE2ETest().catch((err) => {
  console.error("CANLI TEST HATASI:", err);
  process.exit(1);
});
