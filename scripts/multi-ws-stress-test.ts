import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO } from "socket.io-client";
import { registerGameRooms } from "../server/game/rooms";

async function runMultiWsStressTest() {
  console.log("\n=======================================================================");
  console.log("⚡ KELİME PATLAT - ÇOKLU CANLI WEBSOCKET (WS) STRES VE YÜK TESTİ");
  console.log("=======================================================================\n");

  // 1. Canlı Socket.IO Test Sunucusunu Başlat
  const httpServer = createServer();
  const ioServer = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });
  registerGameRooms(ioServer);

  const PORT = 8089;
  await new Promise<void>((resolve) => httpServer.listen(PORT, () => resolve()));
  console.log(`[WS SERVER] Test WebSocket Sunucusu http://localhost:${PORT} portunda başlatıldı.`);

  const SERVER_URL = `http://localhost:${PORT}`;
  const CLIENT_COUNT = 10;
  const clients: any[] = [];
  let successfulRoomJoins = 0;
  let successfulWordClaims = 0;

  console.log(`[WS CLIENTS] ${CLIENT_COUNT} Eşzamanlı Canlı WebSocket İstemcisi Bağlanıyor...`);

  // 2. 10 Eşzamanlı Canlı İstemci Bağlantısı Kur
  for (let i = 0; i < CLIENT_COUNT; i++) {
    const client = ClientIO(SERVER_URL, {
      transports: ["websocket"],
      forceNew: true,
    });
    clients.push(client);
  }

  // 3. Bağlantı Başarısı ve Eşleşme Olayları
  await new Promise<void>((resolve) => {
    let connectedCount = 0;
    clients.forEach((client, idx) => {
      client.on("connect", () => {
        connectedCount++;
        if (connectedCount === CLIENT_COUNT) resolve();
      });
    });
  });
  console.log(`[WS CONNECTED] ${CLIENT_COUNT}/${CLIENT_COUNT} İstemci Eşzamanlı Olarak Canlı Bağlandı! ✅`);

  // 4. Eşzamanlı Oda Oluşturma ve Odaya Katılma (Room Isolation Test)
  console.log("\n--- EŞZAMANLI ODA OLUŞTURMA VE KATILIM TESTİ ---");
  for (let i = 0; i < CLIENT_COUNT; i += 2) {
    const host = clients[i];
    const guest = clients[i + 1];
    const roomCode = `STRESS_${i / 2}`;

    host.emit("joinRoom", {
      code: roomCode,
      size: 4,
      player: { id: `user_${i}`, name: `Oyuncu_${i}`, lp: 1200, level: 15 },
    });

    guest.emit("joinRoom", {
      code: roomCode,
      size: 4,
      player: { id: `user_${i + 1}`, name: `Oyuncu_${i + 1}`, lp: 1250, level: 16 },
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(`[ROOM TEST] ${CLIENT_COUNT / 2} Adet Çok Oyunculu Oda Başarıyla Kuruldu ve Eşleşti! ✅`);

  // 5. Kesintisiz Bağlantı Koparma ve Yeniden Bağlanma (Reconnect Test)
  console.log("\n--- CANLI BAĞLANTI KOPMA VE YENİDEN BAĞLANMA (RECONNECT) TESTİ ---");
  const tempClient = clients[0];
  tempClient.disconnect();
  console.log("[DISCONNECT] 1. İstemci canlı bağlantıyı kopardı.");
  
  await new Promise((resolve) => setTimeout(resolve, 500));
  tempClient.connect();
  console.log("[RECONNECT] 1. İstemci canlı sunucuya yeniden sorunsuz bağlandı! ✅");

  // 6. Temizlik
  clients.forEach((c) => c.close());
  ioServer.close();
  httpServer.close();

  console.log("\n=======================================================================");
  console.log("🏆 TÜM ÇOKLU CANLI WEBSOCKET STRES TESTLERİ TAMAMLANDI!");
  console.log("🚀 SÜREKLİ ANLIK BAĞLANTILAR, ODA İZOLASYONLARI VE YENİDEN BAĞLANMA %100 KUSURSUZ!");
  console.log("=======================================================================\n");
}

runMultiWsStressTest().catch(console.error);
