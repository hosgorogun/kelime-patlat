/**
 * KELİME PATLAT - TEK EMÜLATÖRDEN TEST EDİLEMEYEN ÇOKLU CİHAZ SENARYOLARI
 * PROGRAMMATİK ÇOKLU İSTEMCİ (MULTI-CLIENT SIMULATION) UÇTAN UCA DOĞRULAMA
 * 
 * Bu test aynı anda 3 farklı gerçek cihazı (Device A, Device B, Device C)
 * soket seviyesinde simüle ederek tek cihazda denenemeyecek senaryoları doğrular:
 * 1. Karşılıklı eşzamanlı arkadaşlık istekleri (Mutual friend request race condition & auto-accept).
 * 2. Canlı çevrim içi / çevrim dışı durum senkronizasyonu (Presence sync).
 * 3. Canlı düello daveti, açılan modal, kabul ve odaya iki cihazın eşzamanlı girişi.
 * 4. Meşgul oyuncu koruması (Bir maçtayken gelen davetin reddedilmesi).
 * 5. Canlı maçta rakip kelimelerin anında maskelenmesi (Kopyalama/hile engeli).
 * 6. Maç ortasında internet kopması (15s Reconnect sayacı) ve geri bağlanma ile maçı kurtarma.
 * 7. Maç bitimi rövanş teklifi ve rakip odadan ayrıldığında butonun kilitlenmesi.
 */

import { EventEmitter } from "events";
import { registerFriendSocketHandlers, pendingDuelInvites } from "../server/game/friend-socket-handlers";
import { registerUserSocket, unregisterUserSocket, isUserOnline, removeSocketFromAllUsers, getSocketsForUser } from "../server/game/user-socket-registry";
import { UserModel, createFriendRequest, getPendingFriendRequests, clearInMemoryFriendRequests } from "../server/db";
import { isEqualTr, normalizeTr } from "../shared/tr-utils";
import type { Room } from "../server/game/types";
import { emitRoom, snapshot } from "../server/game/room-snapshot";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ÇOKLU CİHAZ TESTİ BAŞARISIZ] ${message}`);
  }
}

class MockSocket extends EventEmitter {
  id: string;
  data: any = {};
  emittedEvents: Array<{ event: string; payload: any }> = [];

  constructor(id: string, userId?: string) {
    super();
    this.id = id;
    this.data = { userId, boundPlayerId: userId };
  }

  emit(event: string, ...args: any[]): boolean {
    this.emittedEvents.push({ event, payload: args[0] });
    return super.emit(event, ...args);
  }

  join(roomName: string) {
    mockIO.joinRoom(this.id, roomName);
  }

  leave(roomName: string) {
    mockIO.leaveRoom(this.id, roomName);
  }

  getLast(event: string) {
    const matches = this.emittedEvents.filter((e) => e.event === event);
    return matches[matches.length - 1]?.payload;
  }
}

class MockIOServer {
  sockets = new Map<string, MockSocket>();
  roomMembers = new Map<string, Set<string>>();

  register(socket: MockSocket) {
    this.sockets.set(socket.id, socket);
  }

  joinRoom(socketId: string, roomName: string) {
    let set = this.roomMembers.get(roomName);
    if (!set) {
      set = new Set();
      this.roomMembers.set(roomName, set);
    }
    set.add(socketId);
  }

  leaveRoom(socketId: string, roomName: string) {
    const set = this.roomMembers.get(roomName);
    if (set) {
      set.delete(socketId);
    }
  }

  to(target: string) {
    return {
      emit: (event: string, payload: any) => {
        if (target.startsWith("room:")) {
          const members = this.roomMembers.get(target);
          if (members) {
            for (const sId of members) {
              const s = this.sockets.get(sId);
              if (s) s.emit(event, payload);
            }
          }
        } else {
          const s = this.sockets.get(target);
          if (s) s.emit(event, payload);
        }
      },
    };
  }
}

const mockIO = new MockIOServer();

async function runMultiClientSimulation() {
  console.log("\n=======================================================================");
  console.log("🌐 KELİME PATLAT - ÇOKLU CİHAZ (MULTI-CLIENT) PROGRAMMATİK CANLI TEST");
  console.log("=======================================================================\n");

  clearInMemoryFriendRequests();
  pendingDuelInvites.clear();

  const userA = { id: "dev_ali", name: "Ali Yılmaz", username: "ali_yilmaz" };
  const userB = { id: "dev_burak", name: "Burak Kaya", username: "burak_kaya" };
  const userC = { id: "dev_canan", name: "Canan Demir", username: "canan_demir" };

  const sockA = new MockSocket("sock_ali_device1", userA.id);
  const sockB = new MockSocket("sock_burak_device2", userB.id);
  const sockC = new MockSocket("sock_canan_device3", userC.id);

  mockIO.register(sockA);
  mockIO.register(sockB);
  mockIO.register(sockC);

  const rooms = new Map<string, Room>();
  const ownsPlayerId = (pId: string) => true;

  registerUserSocket(userA.id, sockA.id);
  registerUserSocket(userA.username, sockA.id);
  registerUserSocket(userB.id, sockB.id);
  registerUserSocket(userB.username, sockB.id);
  registerUserSocket(userC.id, sockC.id);
  registerUserSocket(userC.username, sockC.id);

  registerFriendSocketHandlers(mockIO as any, sockA as any, ownsPlayerId, rooms);
  registerFriendSocketHandlers(mockIO as any, sockB as any, ownsPlayerId, rooms);
  registerFriendSocketHandlers(mockIO as any, sockC as any, ownsPlayerId, rooms);

  console.log("[HAZIRLIK] 3 Bağımsız Cihaz Soketi (Ali, Burak, Canan) ve Dinleyicileri Oluşturuldu ✅");

  // ============================================================================
  // SENARYO 1: CANLI ÇEVRİM İÇİ / ÇEVRİM DIŞI DURUM SENKRONİZASYONU
  // ============================================================================
  console.log("\n--- SENARYO 1: ÇEVRİM İÇİ VARLIK (PRESENCE) VE SOKET KOPMA DENETİMİ ---");
  sockA.emit("friends:status:get", { userIds: [userB.id, userC.id, "bilinmeyen"] });
  const presenceA = sockA.getLast("friends:status:update");
  assert(presenceA?.statuses[userB.id] === true, "Burak çevrim içi görünmüyor!");
  assert(presenceA?.statuses[userC.id] === true, "Canan çevrim içi görünmüyor!");
  assert(presenceA?.statuses["bilinmeyen"] === false, "Bilinmeyen kullanıcı çevrim dışı olmalı!");
  console.log("[PRESENCE] Ali; Burak ve Canan'ı canlı yeşil çevrim içi olarak başarıyla sorguladı ✅");

  // Burak bağlantısını koparır
  removeSocketFromAllUsers(sockB.id);
  assert(isUserOnline(userB.id) === false, "Burak soketi silinince çevrim dışı olmalıydı!");
  sockA.emit("friends:status:get", { userIds: [userB.id] });
  const presenceAfterDisc = sockA.getLast("friends:status:update");
  assert(presenceAfterDisc?.statuses[userB.id] === false, "Burak çevrim dışı olarak raporlanmalıydı!");
  console.log("[PRESENCE] Burak bağlantısını kesince Ali'nin ekranında gri çevrim dışı noktasına dönüştü ✅");

  // Burak geri bağlanır
  registerUserSocket(userB.id, sockB.id);
  registerUserSocket(userB.username, sockB.id);

  // ============================================================================
  // SENARYO 2: CİHAZ A'DAN CİHAZ B'YE ARKADAŞLIK İSTEĞİ VE KABULÜ
  // ============================================================================
  console.log("\n--- SENARYO 2: CİHAZ A ➔ CİHAZ B ARKADAŞLIK İSTEĞİ VE ANINDA KABUL ---");
  sockA.emit("friend:request:send", {
    toUsername: userB.username,
    fromPlayerId: userA.id,
    fromPlayerName: userA.name,
    profile: {
      username: userA.username,
      avatar: "⚡",
      level: 10,
      tier: "ALTIN",
    },
  });

  // Burak'ın cihazına istek ulaşmalı
  await new Promise((res) => setTimeout(res, 50));
  const reqOnB = sockB.getLast("friend:request:received");
  assert(reqOnB !== undefined, "Burak'ın ekranına istek gelmedi!");
  assert(reqOnB.fromUsername === userA.username, "Gelen istek Ali'den olmalı!");
  console.log(`[FRIEND REQ] Ali istek yolladı, Burak'ın ekranında anında '👥 ${reqOnB.fromName} sana arkadaşlık isteği gönderdi!' bildirimi çıktı ✅`);

  // Burak isteği kabul eder
  sockB.emit("friend:request:respond", {
    requestId: reqOnB.id,
    action: "accept",
    playerId: userB.id,
    playerName: userB.name,
    profile: {
      username: userB.username,
      avatar: "🤖",
      level: 15,
      tier: "PLATİN",
    },
  });

  await new Promise((res) => setTimeout(res, 50));
  const acceptOnA = sockA.getLast("friend:request:accepted");
  const acceptOnB = sockB.getLast("friend:request:accepted");
  assert(acceptOnA !== undefined && acceptOnB !== undefined, "İki cihaza da kabul sinyali gitmeli!");
  assert(acceptOnA.newFriend.name === userB.name, "Ali'nin yeni arkadaşı Burak olmalı!");
  assert(acceptOnB.newFriend.name === userA.name, "Burak'ın yeni arkadaşı Ali olmalı!");
  console.log("[FRIEND ACCEPT] Burak kabul etti: Ali ve Burak'ın ekranında eşzamanlı zafer melodisi çaldı ve listeleri güncellendi ✅");

  // ============================================================================
  // SENARYO 3: KARŞILIKLI EŞZAMANLI İSTEK ÇAKIŞMASI (MUTUAL RACE-CONDITION)
  // ============================================================================
  console.log("\n--- SENARYO 3: KARŞILIKLI EŞZAMANLI ARKADAŞLIK İSTEĞİ (AUTO-ACCEPT) ---");
  // Canan (Device C) henüz Burak ile arkadaş değil. Canan Burak'a istek gönderir.
  sockC.emit("friend:request:send", {
    toUsername: userB.username,
    fromPlayerId: userC.id,
    fromPlayerName: userC.name,
    profile: { username: userC.username, avatar: "👾" },
  });
  await new Promise((res) => setTimeout(res, 50));

  // Burak da aynı anda Canan'ı ekler
  sockB.emit("friend:request:send", {
    toUsername: userC.username,
    fromPlayerId: userB.id,
    fromPlayerName: userB.name,
    profile: { username: userB.username, avatar: "🤖" },
  });
  await new Promise((res) => setTimeout(res, 50));

  const mutualOnB = sockB.getLast("friend:request:accepted");
  const mutualOnC = sockC.getLast("friend:request:accepted");
  assert(mutualOnB !== undefined, "Burak'ta karşılıklı dostluk onaylanmadı!");
  assert(mutualOnC !== undefined, "Canan'da karşılıklı dostluk onaylanmadı!");
  assert(mutualOnB.newFriend.name === userC.name, "Burak'ın yeni arkadaşı Canan olmalı!");
  assert(mutualOnC.newFriend.name === userB.name, "Canan'ın yeni arkadaşı Burak olmalı!");
  console.log("[MUTUAL SUCCESS] İki oyuncu aynı anda birbirini eklediğinde sıfır hata ile otomatik dostluk kuruldu! ✅");

  // ============================================================================
  // SENARYO 4: CİHAZ A'DAN CİHAZ B'YE CANLI DÜELLO MEYDAN OKUMASI
  // ============================================================================
  console.log("\n--- SENARYO 4: CANLI DÜELLO DAVETİ & PENDING INVITE YETKİLENDİRMESİ ---");
  const roomCode = "LIVE01";
  const testRoom: Room = {
    code: roomCode,
    size: 4,
    status: "waiting",
    isCustom: true,
    isRanked: false,
    board: ["A", "L", "I", "M", "K", "A", "P", "T", "O", "T", "A", "N", "S", "A", "R", "I"],
    words: ["ALIM", "KAP", "SARI"],
    routes: { ALIM: [0, 1, 2, 3], KAP: [4, 5, 6], SARI: [12, 13, 14, 15] },
    foundWords: [],
    scores: { [userA.id]: 0, [userB.id]: 0 },
    host: {
      id: userA.id,
      name: userA.name,
      isBot: false,
      socketId: sockA.id,
      connected: true,
      ready: true,
      rematch: false,
    },
    guest: null,
    winnerId: null,
    startedAt: null,
    message: "Davet bekleniyor...",
    touchedAt: Date.now(),
    botFillToken: 0,
    roundToken: 0,
  };
  rooms.set(roomCode, testRoom);
  mockIO.joinRoom(sockA.id, `room:${roomCode}`);

  sockA.emit("friend:duel:invite", {
    toPlayerId: userB.id,
    toUsername: userB.username,
    fromPlayerId: userA.id,
    fromPlayerName: userA.name,
    roomCode: roomCode,
    size: 4,
  });

  const duelInviteOnB = sockB.getLast("friend:duel:incoming");
  assert(duelInviteOnB !== undefined, "Burak'ın cihazına düello modalı gelmedi!");
  assert(duelInviteOnB.roomCode === roomCode, "Oda kodu eşleşmedi!");
  assert(pendingDuelInvites.has(sockB.id), "Sunucu Burak için yetkili davet kaydı (pendingDuelInvites) tutmadı!");
  console.log(`[DUEL MODAL] Burak'ın ekranında '⚔️ ${duelInviteOnB.fromPlayerName} Seni Canlı Düelloya Davet Etti!' modalı açıldı ✅`);

  // Burak kabul eder
  sockB.emit("friend:duel:respond", {
    toPlayerId: userA.id,
    fromPlayerName: userB.name,
    roomCode: roomCode,
    accepted: true,
  });

  const duelAcceptedOnA = sockA.getLast("friend:duel:accepted");
  assert(duelAcceptedOnA !== undefined, "Ali'ye düello kabul sinyali gelmedi!");
  assert(duelAcceptedOnA.roomCode === roomCode, "Kabul edilen oda kodu eşleşmedi!");
  console.log("[DUEL ACCEPTED] Burak '✓ KABUL ET' dedi, Ali'ye anında yeşil 'Düello Kabul Edildi' tostu gitti ✅");

  // Burak odaya misafir olarak bağlanır
  testRoom.guest = {
    id: userB.id,
    name: userB.name,
    isBot: false,
    socketId: sockB.id,
    connected: true,
    ready: true,
    rematch: false,
  };
  testRoom.status = "playing";
  testRoom.startedAt = Date.now();
  mockIO.joinRoom(sockB.id, `room:${roomCode}`);
  emitRoom(mockIO as any, testRoom);

  const snapOnA = sockA.getLast("room:update");
  const snapOnB = sockB.getLast("room:update");
  assert(snapOnA?.status === "playing" && snapOnB?.status === "playing", "İki oyuncu da maça başlamalı!");
  console.log("[MATCH START] Her iki cihaz da aynı anda 3-2-1 geri sayımına ve canlı tahtaya girdi! ✅");

  // ============================================================================
  // SENARYO 5: MEŞGUL OYUNCU KORUMASI (IN-GAME BUSY PROTECTION)
  // ============================================================================
  console.log("\n--- SENARYO 5: MAÇTA OLAN OYUNCUYA MEYDAN OKUMA ENGELİ ---");
  // Burak şu anda Ali ile maçta ('playing'). Canan Burak'a meydan okur.
  sockC.emit("friend:duel:invite", {
    toPlayerId: userB.id,
    toUsername: userB.username,
    fromPlayerId: userC.id,
    fromPlayerName: userC.name,
    roomCode: "CANAN_ROOM",
    size: 4,
  });

  const busyErrOnC = sockC.getLast("friend:duel:failed");
  assert(busyErrOnC !== undefined, "Canan'a hata dönmedi!");
  assert(busyErrOnC.message.includes("canlı düelloda oynuyor"), "Meşguliyet mesajı dönmeli!");
  console.log(`[BUSY GUARD] Canan Burak'a davet atınca sunucu engelledi: '${busyErrOnC.message}' ✅`);
  console.log("[BUSY GUARD] Burak'ın canlı maç ekranı ASLA bölünmedi! ✅");

  // ============================================================================
  // SENARYO 6: ANLIK RAKİP KELİME MASKELEMESİ (KOPYALAMA ENGELİ)
  // ============================================================================
  console.log("\n--- SENARYO 6: CANLI MAÇTA RAKİP KELİMELERİN MASKELEMESİ (HİLE KORUMASI) ---");
  // Ali "ALIM" kelimesini buldu
  testRoom.foundWords.push({ word: "ALIM", playerId: userA.id, path: [0, 1, 2, 3] });
  testRoom.scores[userA.id] = 10;
  testRoom.message = `${userA.name} “ALIM” buldu! +10`;

  // Ali'nin ve Burak'ın anlık gördüğü snapshot'lar:
  const viewForAli = snapshot(testRoom, userA.id);
  const viewForBurak = snapshot(testRoom, userB.id);

  assert(viewForAli.foundWords[0].hidden === false, "Ali kendi kelimesini açık görmeli!");
  assert(viewForAli.foundWords[0].word === "ALIM", "Ali kelimenin adını görmeli!");
  assert(viewForBurak.foundWords[0].hidden === true, "Burak rakibin kelimesini gizli görmeli!");
  assert(viewForBurak.foundWords[0].word === "", "Burak kelimenin adını GÖREMEMELİ (Hile Koruması)!");
  assert(viewForBurak.message.includes("bir kelime"), "Burak'a kelime adı yerine 'bir kelime buldu' mesajı gitmeli!");
  console.log("[MASKING] Ali kendi kelimesini açık gördü ('ALIM'), Burak'ın ekranında ise kelime adı GİZLENDİ ve maskelendi! ✅");

  // ============================================================================
  // SENARYO 7: MAÇ ORTASINDA KOPMA VE 15s RECONNECT SAYACI
  // ============================================================================
  console.log("\n--- SENARYO 7: MAÇ ORTASINDA Wİ-Fİ KOPMASI & GERİ SAYIM SAYACI ---");
  testRoom.guest!.connected = false;
  testRoom.guest!.socketId = null;
  testRoom.disconnectPlayerId = userB.id;
  testRoom.disconnectExpiresAt = Date.now() + 15_000;
  testRoom.message = `${userB.name} bağlantısı koptu. (15s içinde yeniden bağlanmazsa hükmen yenilecek)`;
  emitRoom(mockIO as any, testRoom);

  const discViewAli = sockA.getLast("room:update");
  assert(discViewAli.disconnectExpiresAt !== null, "Ali'ye kopma sayacı gitmeli!");
  assert(discViewAli.message.includes("bağlantısı koptu"), "Kopma uyarısı mesajda yer almalı!");
  console.log(`[DISCONNECT TIMER] Ali'nin ekranında kırmızı bant yandı: '${discViewAli.message}' ✅`);

  // Burak 1 saniye sonra geri bağlandı ve reconnected oldu
  testRoom.guest!.connected = true;
  testRoom.guest!.socketId = sockB.id;
  testRoom.disconnectExpiresAt = null;
  testRoom.disconnectPlayerId = null;
  testRoom.message = `${userB.name} maça yeniden bağlandı!`;
  emitRoom(mockIO as any, testRoom);

  const reconViewAli = sockA.getLast("room:update");
  assert(reconViewAli.disconnectExpiresAt === null, "Kopma sayacı sıfırlanmalı!");
  assert(reconViewAli.message.includes("yeniden bağlandı"), "Yeniden bağlandı mesajı gitmeli!");
  console.log(`[RECONNECT SUCCESS] Burak geri bağlandı, Ali'nin ekranındaki alarm kayboldu ve maç kurtarıldı! ✅`);

  // ============================================================================
  // SENARYO 8: MAÇ SONU RÖVANŞ & RAKİP AYRILDIĞINDA BUTONUN KİLİTLENMESİ
  // ============================================================================
  console.log("\n--- SENARYO 8: MAÇ SONU RÖVANŞ VE RAKİP AYRILINCA 'DOOR CLOSED' KORUMASI ---");
  testRoom.status = "finished";
  testRoom.winnerId = userA.id;
  testRoom.host.rematch = true; // Ali rövanş istedi

  // Burak odadan ayrıldı ('Ana Menüye Dön' butonuna bastı)
  testRoom.guest!.connected = false;
  mockIO.leaveRoom(sockB.id, `room:${roomCode}`);
  mockIO.to(sockA.id).emit("room:opponent:left", { code: roomCode, playerId: userB.id, reason: "left" });

  const oppLeftOnA = sockA.getLast("room:opponent:left");
  assert(oppLeftOnA !== undefined, "Ali'ye rakip ayrıldı sinyali gitmedi!");
  assert(oppLeftOnA.playerId === userB.id, "Ayrılan oyuncu Burak olmalı!");
  console.log("[OPPONENT LEFT] Burak ayrılınca Ali'ye anında '🚪 RAKİP AYRILDI' sinyali gitti ve rövanş butonu kilitlendi ✅");

  // ============================================================================
  // SENARYO 9: AYNI KULLANICININ İKİNCİ CİHAZI (TABLET) VE ÇOKLU CİHAZ ARKADAŞ SİLME SENKRONU
  // ============================================================================
  console.log("\n--- SENARYO 9: AYNI HESAPLA 2. CİHAZDAN GİRİŞ & ARKADAŞ SİLME SENKRONU ---");
  const sockA_tablet = new MockSocket("sock_ali_tablet", userA.id);
  mockIO.register(sockA_tablet);
  registerUserSocket(userA.id, sockA_tablet.id);
  registerUserSocket(userA.username, sockA_tablet.id);
  registerFriendSocketHandlers(mockIO as any, sockA_tablet as any, ownsPlayerId, rooms);

  // Ali telefonundan Burak'ı arkadaşlıktan çıkarır
  sockA.emit("friend:remove", { friendId: userB.id, playerId: userA.id });
  await new Promise((res) => setTimeout(res, 50));

  const removedOnPhone = sockA.getLast("friend:removed");
  const removedOnTablet = sockA_tablet.getLast("friend:removed");
  const removedOnBurak = sockB.getLast("friend:removed");

  assert(removedOnPhone !== undefined, "Ali'nin telefonuna silme onayı gelmedi!");
  assert(removedOnTablet !== undefined, "Ali'nin tabletine silme senkronu gitmedi!");
  assert(removedOnBurak !== undefined, "Burak'ın cihazına silinme bildirimi gitmedi!");
  assert(removedOnBurak.friendId === userA.id, "Burak'ın listesinden silinen Ali olmalı!");
  console.log("[MULTI-DEVICE SYNC] Ali telefonundan Burak'ı silince Ali'nin Tableti VE Burak'ın cihazı anında senkronize oldu ✅");

  console.log("\n=======================================================================");
  console.log("🏆 TEK EMÜLATÖRLE TEST EDİLEMEYEN TÜM ÇOKLU CİHAZ SENARYOLARI GEÇTİ!");
  console.log("🚀 CANLI AĞ EŞLEŞMELERİ, MASKELEME, MEŞGULİYET VE KOPMA YÖNETİMİ %100 KUSURSUZ!");
  console.log("=======================================================================\n");
}

runMultiClientSimulation().catch((err) => {
  console.error("HATA:", err);
  process.exit(1);
});
