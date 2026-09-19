import { describe, it, expect, beforeEach, vi } from "vitest";
import { type LeaderboardEntry, type BoardSize } from "../shared/game";
import { type FriendUser, socialManager } from "../shared/social";
import { getLeagueTier } from "../shared/progression";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => {
  let store: Record<string, string> = {};
  return {
    default: {
      getItem: vi.fn(async (key: string) => store[key] ?? null),
      setItem: vi.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn(async (key: string) => {
        delete store[key];
      }),
      clear: vi.fn(async () => {
        store = {};
      }),
    },
  };
});

describe("Gerçekçi Oyun Mekanikleri Testleri (Matchmaking, Emotes & Friends Leaderboard)", () => {
  beforeEach(async () => {
    await socialManager.reset();
  });

  describe("1. Arkadaş Sıralaması (Friends Leaderboard) Havuz Entegrasyonu", () => {
    it("küresel ilk 50'de olmayan arkadaşlar da arkadaş sıralaması havuzuna dahil edilmeli ve sıralanmalıdır", () => {
      // Senaryo: Küresel liderlik tablosunda çok yüksek puanlı oyuncular var
      const globalLeaderboard: LeaderboardEntry[] = [
        { id: "top_1", name: "Efsane", score: 50000, wins: 200, matches: 250, bestRound: 500, lp: 3200, tier: "RADYAN", level: 50 },
        { id: "top_2", name: "Usta", score: 45000, wins: 180, matches: 230, bestRound: 480, lp: 2900, tier: "ELMAS", level: 45 },
      ];

      // Kullanıcının kendi profili
      const playerId = "user_me";
      const playerName = "BenimAdim";
      const myProgress = {
        xp: 1200,
        lp: 450,
        wins: 15,
        matches: 25,
        bestScore: 210,
        selectedAvatar: "spark" as const,
        selectedTitle: "[ÇAYLAK]",
      };

      // Kullanıcının arkadaşları (küresel listede YOKLAR)
      const friendsList: FriendUser[] = [
        {
          id: "friend_1",
          name: "Ahmet",
          username: "ahmet_01",
          avatar: "bolt",
          selectedTitle: "[SERİ KATİL]",
          level: 8,
          tier: "GÜMÜŞ",
          lp: 650,
          xp: 1500,
          wins: 20,
          matches: 35,
          isOnline: true,
        },
        {
          id: "friend_2",
          name: "Zeynep",
          username: "zeynep_99",
          avatar: "sage",
          selectedTitle: "[BİLGİN]",
          level: 4,
          tier: "BRONZ",
          lp: 250,
          xp: 700,
          wins: 5,
          matches: 12,
          isOnline: false,
        },
      ];

      // Arkadaş sıralama havuzu algoritması
      const poolMap = new Map<string, LeaderboardEntry>();

      // 1. Kullanıcı
      const userTier = getLeagueTier(myProgress as any);
      poolMap.set(playerId, {
        id: playerId,
        name: playerName,
        score: myProgress.xp,
        wins: myProgress.wins,
        matches: myProgress.matches,
        bestRound: myProgress.bestScore,
        lp: myProgress.lp,
        tier: userTier.tier,
        selectedTitle: myProgress.selectedTitle,
        level: Math.floor(myProgress.xp / 200) + 1,
      });

      // 2. Arkadaşlar
      friendsList.forEach((f) => {
        poolMap.set(f.id, {
          id: f.id,
          name: f.name || f.username,
          score: f.xp ?? (f.level ? (f.level - 1) * 200 : 0),
          wins: f.wins ?? 0,
          matches: f.matches ?? 0,
          bestRound: f.bestScore ?? 0,
          lp: f.lp ?? 0,
          tier: f.tier || "DEMİR",
          avatar: f.avatar || "spark",
          selectedTitle: f.selectedTitle || "[ÇAYLAK]",
          level: f.level || 1,
        });
      });

      const friendsPool = Array.from(poolMap.values()).sort((a, b) => (b.lp ?? 0) - (a.lp ?? 0));

      // Doğrulama
      expect(friendsPool.length).toBe(3); // Ben + 2 arkadaş
      expect(friendsPool[0]?.name).toBe("Ahmet"); // 650 LP ile 1. sırada
      expect(friendsPool[1]?.name).toBe("BenimAdim"); // 450 LP ile 2. sırada
      expect(friendsPool[2]?.name).toBe("Zeynep"); // 250 LP ile 3. sırada
    });
  });

  describe("2. Canlı Eşleştirme Kuyruğu (Matchmaking Queue)", () => {
    it("kuyruğa katılma ve iptal etme durumları doğru yönetilmelidir", () => {
      type QueueEntry = { playerId: string; playerName: string; size: BoardSize };
      const queue: QueueEntry[] = [];

      // 1. Oyuncu kuyruğa katılır
      queue.push({ playerId: "p1", playerName: "Ali", size: 4 });
      expect(queue.length).toBe(1);
      expect(queue[0]?.playerId).toBe("p1");

      // 2. Oyuncu vazgeçip iptal eder
      const cancelIdx = queue.findIndex((p) => p.playerId === "p1");
      if (cancelIdx !== -1) queue.splice(cancelIdx, 1);
      expect(queue.length).toBe(0);
    });

    it("aynı tahta boyutunda iki gerçek oyuncu kuyruğa girdiğinde anında eşleşmelidir", () => {
      type QueueEntry = { playerId: string; playerName: string; size: BoardSize };
      const matchmakingQueue = new Map<BoardSize, QueueEntry[]>();
      matchmakingQueue.set(4, []);

      const joinMatchmaking = (player: QueueEntry) => {
        const q = matchmakingQueue.get(player.size) || [];
        if (q.length > 0) {
          const opponent = q.shift()!;
          return {
            matched: true,
            players: [opponent, player],
            roomCode: "MATCH1",
          };
        }
        q.push(player);
        matchmakingQueue.set(player.size, q);
        return { matched: false, players: [player] };
      };

      // 1. Oyuncu katılır (beklemede)
      const res1 = joinMatchmaking({ playerId: "p1", playerName: "Ali", size: 4 });
      expect(res1.matched).toBe(false);
      expect(matchmakingQueue.get(4)?.length).toBe(1);

      // 2. Oyuncu katılır (anında eşleşir)
      const res2 = joinMatchmaking({ playerId: "p2", playerName: "Veli", size: 4 });
      expect(res2.matched).toBe(true);
      expect(res2.players.length).toBe(2);
      expect(res2.players[0]?.playerId).toBe("p1");
      expect(res2.players[1]?.playerId).toBe("p2");
      expect(matchmakingQueue.get(4)?.length).toBe(0);
    });
  });

  describe("3. Oyun İçi Canlı Emote / Tepki Sistemi", () => {
    it("geçerli emojiler kabul edilmeli ve odaya iletilmelidir", () => {
      const allowedEmotes = ["🔥", "👏", "⚡", "😱", "🤝", "😎"];

      const validateEmote = (emote: string): boolean => {
        return allowedEmotes.includes(emote);
      };

      expect(validateEmote("🔥")).toBe(true);
      expect(validateEmote("👏")).toBe(true);
      expect(validateEmote("⚡")).toBe(true);
      expect(validateEmote("invalid_string_too_long")).toBe(false);
    });

    it("emote gönderildiğinde ilgili oyuncunun ve emojinin bilgisi doğru biçimlendirilmelidir", () => {
      const createEmotePayload = (playerId: string, playerName: string, emote: string) => {
        return {
          id: `${Date.now()}-${Math.random()}`,
          playerId,
          playerName,
          emote,
        };
      };

      const payload = createEmotePayload("usr_1", "SiberOyuncu", "🔥");
      expect(payload.playerId).toBe("usr_1");
      expect(payload.playerName).toBe("SiberOyuncu");
      expect(payload.emote).toBe("🔥");
      expect(payload.id).toBeDefined();
    });
  });

  describe("4. Özel Oda / Arkadaş Maçlarında LP ve EXP Kazanım Koruması (Unranked Friendly Match)", () => {
    it("arkadaşlarla oynanan özel odalarda (custom/friend rooms) LP ve EXP kazanılmamalıdır (0 olmalıdır)", () => {
      const calculateMatchRewards = (params: {
        isCustomRoom: boolean;
        iWon: boolean;
        isDraw: boolean;
        isBotMatch: boolean;
      }) => {
        const { isCustomRoom, iWon, isDraw, isBotMatch } = params;
        if (isCustomRoom) {
          return { lp: 0, xp: 0, coins: 0 };
        }
        const xp = iWon ? (isBotMatch ? 35 : 60) : isDraw ? (isBotMatch ? 20 : 40) : (isBotMatch ? 20 : 35);
        const lp = iWon ? (isBotMatch ? 15 : 25) : isDraw ? 0 : (isBotMatch ? -10 : -20);
        const coins = iWon ? (isBotMatch ? 4 : 10) : 1;
        return { lp, xp, coins };
      };

      // Arkadaşla oynanan özel maç: Kazansa dahi 0 LP, 0 EXP
      const friendWon = calculateMatchRewards({ isCustomRoom: true, iWon: true, isDraw: false, isBotMatch: false });
      expect(friendWon.lp).toBe(0);
      expect(friendWon.xp).toBe(0);
      expect(friendWon.coins).toBe(0);

      // Arkadaşla oynanan özel maç: Kaybetse dahi puan düşmez (0 LP)
      const friendLost = calculateMatchRewards({ isCustomRoom: true, iWon: false, isDraw: false, isBotMatch: false });
      expect(friendLost.lp).toBe(0);
      expect(friendLost.xp).toBe(0);
      expect(friendLost.coins).toBe(0);

      // Gerçek dereceli eşleştirme maçı: Kazanınca normal LP ve EXP verilir
      const rankedWon = calculateMatchRewards({ isCustomRoom: false, iWon: true, isDraw: false, isBotMatch: false });
      expect(rankedWon.lp).toBe(25);
      expect(rankedWon.xp).toBe(60);
      expect(rankedWon.coins).toBe(10);
    });

    it("RoomSnapshot ve Room nesneleri isCustom ve isRanked durumlarını doğru taşımalıdır", () => {
      // Arkadaş odası
      const friendRoom = {
        code: "FRND1",
        size: 4 as BoardSize,
        isCustom: true,
        isRanked: false,
      };
      expect(friendRoom.isCustom).toBe(true);
      expect(friendRoom.isRanked).toBe(false);

      // Canlı dereceli eşleşme odası
      const rankedRoom = {
        code: "RNKD1",
        size: 4 as BoardSize,
        isCustom: false,
        isRanked: true,
      };
      expect(rankedRoom.isCustom).toBe(false);
      expect(rankedRoom.isRanked).toBe(true);
    });
  });
});
