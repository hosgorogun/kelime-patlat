import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "node:path";
import fs from "node:fs";
import net from "net";
import { Server as SocketIOServer } from "socket.io";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { sdk } from "./sdk";
import { registerGameRooms } from "../game/rooms";

import { UserModel, hashPassword, verifyPassword, connectDb, createFriendRequest, getPendingFriendRequests, updateFriendRequestStatus, findFriendRequestById } from "../db";
import { deletePlayerProfile, ProfileModel } from "../game/mongo-store";
import { z } from "zod";
import { randomUUID, randomInt } from "node:crypto";
import { AVATARS, applyArcadeProgress, applyMatchProgress, applyVintageProgress, completeDailyProgress, DEFAULT_PROGRESS, getDailyChallenge, mergePlayerProgress, backfillMatchHistoryIfEmpty, SEASON_MISSIONS, findMissionById, getLeagueTier, buyLives, getCalculatedLives, reconcilePlayerProgress, MAX_LIVES, MILESTONE_REWARDS, checkDailyLoginReward, getDayId, type PlayerProgress, type GenderType } from "../../shared/progression";
import { CHIP_EQUIPMENT_ITEMS, PROFILE_FRAMES, VICTORY_EFFECTS, BOARD_SKINS } from "../../shared/store-items";
import type { LeaderboardEntry } from "../../shared/game";
import { getWordDefinition } from "../../shared/dictionary";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function startServer() {
  if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGINS?.trim()) {
    console.warn("[Server] Warning: CORS_ORIGINS is not set.");
  }
  const app = express();
  const server = createServer(app);
  const allowedOrigins = new Set(
    [process.env.CORS_ORIGINS, process.env.EXPO_WEB_PREVIEW_URL, "http://localhost:8081"]
      .flatMap((value) => value?.split(",") ?? [])
      .map((value) => value.trim().replace(/\/$/, ""))
      .filter(Boolean),
  );
  const isAllowedOrigin = (origin?: string) => !origin || allowedOrigins.has(origin.replace(/\/$/, ""));
  const io = new SocketIOServer(server, {
    cors: { origin: (origin, callback) => callback(null, isAllowedOrigin(origin) ? origin : false), credentials: true },
  });

  app.set("trust proxy", 1);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isAllowedOrigin(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  function checkRateLimit(storage: Map<string, { startedAt: number; count: number }>, key: string, max: number, windowMs = 60_000): boolean {
    const now = Date.now();
    const current = storage.get(key);
    if (!current || now - current.startedAt >= windowMs) {
      if (storage.size > 1000) {
        for (const [k, v] of storage) {
          if (now - v.startedAt >= windowMs) storage.delete(k);
        }
      }
      storage.set(key, { startedAt: now, count: 1 });
      return true;
    }
    current.count += 1;
    return current.count <= max;
  }

  const authAttempts = new Map<string, { startedAt: number; count: number }>();
  const guestAttempts = new Map<string, { startedAt: number; count: number }>();
  const gameAttempts = new Map<string, { startedAt: number; count: number }>();

  app.use("/api/auth", (req, res, next) => {
    const key = req.ip || "unknown";
    if (req.path.endsWith("/login") || req.path.endsWith("/signup")) {
      if (!checkRateLimit(authAttempts, key, 10)) {
        return res.status(429).json({ error: "Çok fazla deneme. Lütfen bir dakika sonra tekrar deneyin." });
      }
    } else if (req.path.endsWith("/guest")) {
      if (!checkRateLimit(guestAttempts, key, 15)) {
        return res.status(429).json({ error: "Çok fazla misafir oturumu isteği. Lütfen bir dakika sonra tekrar deneyin." });
      }
    } else if (req.path.endsWith("/sync-progress")) {
      if (!checkRateLimit(gameAttempts, key, 30)) {
        return res.status(429).json({ error: "Çok sık ilerleme senkronizasyonu yapıldı. Lütfen biraz bekleyin." });
      }
    }
    next();
  });

  app.use("/api/game", (req, res, next) => {
    if (req.method === "POST") {
      const key = (req.headers.authorization?.replace("Bearer ", "") || req.ip || "unknown").slice(0, 64);
      if (!checkRateLimit(gameAttempts, key, 35)) {
        return res.status(429).json({ error: "Çok sık oyun işlemi yapıldı. Lütfen biraz bekleyin." });
      }
    }
    next();
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  const serverDictionaryCache = new Map<string, any>();

  app.get("/api/dictionary/:word", async (req, res) => {
    try {
      const rawWord = req.params.word;
      if (!rawWord || typeof rawWord !== "string") {
        return res.status(400).json({ error: "Kelime belirtilmedi" });
      }
      const clean = rawWord.trim();
      const trUpper = clean.toLocaleUpperCase("tr-TR");

      if (serverDictionaryCache.has(trUpper)) {
        return res.json(serverDictionaryCache.get(trUpper));
      }

      // TDK GTS API sorgusu
      try {
        const tdkUrl = `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(clean.toLocaleLowerCase("tr-TR"))}`;
        const tdkRes = await fetch(tdkUrl, { headers: { "User-Agent": "KelimePatlat/1.0" } });
        if (tdkRes.ok) {
          const data = await tdkRes.json();
          if (Array.isArray(data) && data[0]?.anlamlarListe && data[0].anlamlarListe.length > 0) {
            const item = data[0];
            const definitions: string[] = item.anlamlarListe.map((a: any, idx: number) => {
              const type = a.ozelliklerListe?.[0]?.tam_adi ? `(${a.ozelliklerListe[0].tam_adi}) ` : "";
              return item.anlamlarListe.length > 1 ? `${idx + 1}. ${type}${a.anlam}` : `${type}${a.anlam}`;
            });
            const firstType = item.anlamlarListe[0]?.ozelliklerListe?.[0]?.tam_adi;
            const firstExample = item.anlamlarListe.find((a: any) => a.orneklerListe?.[0]?.ornek)?.orneklerListe?.[0]?.ornek;
            const fullDef = definitions.join("\n");

            const result = {
              word: trUpper,
              definition: fullDef,
              definitions,
              type: firstType,
              example: firstExample,
              source: "TDK",
            };
            serverDictionaryCache.set(trUpper, result);
            return res.json(result);
          }
        }
      } catch {
        // TDK servisine ulaşılamadıysa yerel tanıma düş
      }

      const localDef = getWordDefinition(clean);
      const fallbackResult = {
        word: trUpper,
        definition: localDef,
        definitions: [localDef],
        source: "Yerel",
      };
      serverDictionaryCache.set(trUpper, fallbackResult);
      return res.json(fallbackResult);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Sözlük hatası" });
    }
  });

  app.post("/api/auth/guest", async (_req, res) => {
    try {
      await connectDb();
      const openId = `guest_${randomUUID()}`;
      const guestNumber = Math.floor(1000 + Math.random() * 9000);
      const guestName = `Misafir #${guestNumber}`;
      const now = new Date();
      const user = new UserModel({
        id: randomInt(1, 2_147_483_647),
        openId,
        name: guestName,
        email: null,
        loginMethod: "guest",
        role: "user",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
        progress: DEFAULT_PROGRESS,
      });
      await user.save();
      const token = await sdk.createSessionToken(openId, { name: guestName });
      res.json({ success: true, token, user: { openId, name: guestName, progress: DEFAULT_PROGRESS } });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Misafir oturumu oluşturulamadı." });
    }
  });

  const signupSchema = z.object({
    username: z.string().trim().min(3, "Kullanıcı adı min 3 karakter olmalıdır.").max(32).regex(/^\S+$/, "Kullanıcı adı boşluk içeremez."),
    password: z.string().min(4, "Şifre min 4 karakter olmalıdır.").max(128),
    email: z.string().trim().email("Geçerli bir e-posta adresi gereklidir.").max(128),
    fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalıdır.").max(64),
    gender: z.enum(["male", "female", "unspecified"]).optional(),
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      await connectDb();
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Geçersiz kayıt bilgileri." });
      }
      const { username, password, email, fullName, gender } = parsed.data;
      const lowerUsername = username.toLocaleLowerCase("tr-TR");
      const lowerEmail = email.trim().toLocaleLowerCase("tr-TR");
      const existingUser = await UserModel.findOne({
        $or: [{ username: lowerUsername }, { email: lowerEmail }]
      });
      if (existingUser) {
        if (existingUser.username === lowerUsername) {
          return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış." });
        }
        return res.status(400).json({ error: "Bu e-posta adresi ile zaten bir hesap var." });
      }
      
      const openId = `usr_${lowerUsername}`;
      const passwordHash = hashPassword(password);
      const now = new Date();

      const validGender: GenderType = gender === "male" || gender === "female" ? gender : "unspecified";
      const initialProgress: PlayerProgress = { ...DEFAULT_PROGRESS, gender: validGender };

      const user = new UserModel({
        id: randomInt(1, 2_147_483_647),
        openId,
        username: lowerUsername,
        passwordHash,
        name: fullName.trim(),
        email: lowerEmail,
        loginMethod: "credentials",
        role: "user",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
        progress: initialProgress
      });

      await user.save();
      const token = await sdk.createSessionToken(openId, { name: fullName.trim() });
      res.json({ success: true, token, user: { openId, name: fullName.trim(), username: lowerUsername, progress: initialProgress } });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Kayıt işlemi başarısız." });
    }
  });

  app.post("/api/auth/claim-guest", async (req, res) => {
    try {
      await connectDb();
      const user = await sdk.authenticateRequest(req);
      const guestToken = typeof req.body?.guestToken === "string" ? req.body.guestToken : "";
      const guestSession = await sdk.verifySession(guestToken);
      if (!guestSession?.openId.startsWith("guest_")) return res.status(400).json({ error: "Geçerli bir misafir oturumu bulunamadı." });
      const guest = await UserModel.findOneAndUpdate(
        { openId: guestSession.openId, guestClaimedBy: null },
        { $set: { guestClaimedBy: user.openId, updatedAt: new Date() } },
        { returnDocument: 'before' },
      );
      if (!guest) return res.status(409).json({ error: "Bu misafir ilerlemesi daha önce başka bir hesaba aktarıldı." });
      const target = await UserModel.findOne({ openId: user.openId });
      if (target) {
        target.progress = mergePlayerProgress(
          { ...DEFAULT_PROGRESS, ...(target.progress ?? {}) } as PlayerProgress,
          guest.progress,
          { addGuestBalances: true }
        );
        const combinedAwardIds = Array.from(new Set([...(target.processedAwardIds ?? []), ...(guest.processedAwardIds ?? [])])).slice(-200);
        target.processedAwardIds = combinedAwardIds;
        target.updatedAt = new Date();
        await target.save();
      }
      res.json({ progress: target?.progress ?? guest.progress });
    } catch (err: any) {
      res.status(err?.status === 403 ? 401 : 500).json({ error: err?.message || "Misafir ilerlemesi aktarılamadı." });
    }
  });

  const loginSchema = z.object({
    username: z.string().trim().min(1, "Kullanıcı adı veya e-posta gereklidir.").max(128),
    password: z.string().min(1, "Şifre gereklidir.").max(128),
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      await connectDb();
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Geçersiz giriş bilgileri." });
      }
      const { username, password } = parsed.data;
      const lowerIdentifier = username.toLocaleLowerCase("tr-TR");
      const user = await UserModel.findOne({
        $or: [{ username: lowerIdentifier }, { email: lowerIdentifier }]
      });
      if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });
      }

      user.lastSignedIn = new Date();
      await user.save();

      const displayName = user.name || (user.username || lowerIdentifier).toLocaleUpperCase("tr-TR");
      const token = await sdk.createSessionToken(user.openId, { name: displayName });
      res.json({ success: true, token, user: { openId: user.openId, name: displayName, username: user.username, progress: user.progress } });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Giriş işlemi başarısız." });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      await connectDb();
      const user = await sdk.authenticateRequest(req);
      if (!user) return res.status(401).json({ error: "Yetkisiz işlem." });
      const dbUser = await UserModel.findOne({ openId: user.openId });
      if (!dbUser) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
      if (dbUser.progress && (!Array.isArray(dbUser.progress.matchHistory) || dbUser.progress.matchHistory.length === 0)) {
        dbUser.progress.matchHistory = backfillMatchHistoryIfEmpty({ ...DEFAULT_PROGRESS, ...dbUser.progress });
        dbUser.updatedAt = new Date();
        await dbUser.save();
      }
      const displayName = dbUser.name || (dbUser.username || "").toLocaleUpperCase("tr-TR") || "OYUNCU";
      res.json({
        success: true,
        user: {
          openId: dbUser.openId,
          name: displayName,
          username: dbUser.username,
          progress: dbUser.progress,
        },
      });
    } catch (err: any) {
      res.status(err?.status === 403 ? 401 : 500).json({ error: err.message || "Kullanıcı bilgisi alınamadı." });
    }
  });

  app.post("/api/auth/sync-progress", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) return res.status(401).json({ error: "Yetkisiz işlem." });
      
      const { progress, name } = req.body as { progress?: Partial<PlayerProgress>; name?: string };
      if (!progress || typeof progress !== "object") return res.status(400).json({ error: "Geçersiz progress verisi." });
      await connectDb();
      const dbUser = await UserModel.findOne({ openId: user.openId });
      if (dbUser) {
        if (name && typeof name === "string" && name.trim().length >= 2) {
          dbUser.name = name.trim().slice(0, 32);
        }

        const currentProg = { ...DEFAULT_PROGRESS, ...(dbUser.progress ?? {}) } as PlayerProgress;
        // Bakiye alanları istemci tarafından artırılamaz (yalnızca kozmetik harcamasında azalabilir)
        const nextCoins = typeof progress.coins === "number" && progress.coins < (currentProg.coins ?? 0)
          ? Math.max(0, progress.coins)
          : (currentProg.coins ?? 0);
        const nextShields = typeof progress.streakShields === "number" && progress.streakShields < (currentProg.streakShields ?? 0)
          ? Math.max(0, progress.streakShields)
          : (currentProg.streakShields ?? 0);
        const nextRadar = typeof progress.radarChargesBonus === "number" && progress.radarChargesBonus < (currentProg.radarChargesBonus ?? 0)
          ? Math.max(0, progress.radarChargesBonus)
          : (currentProg.radarChargesBonus ?? 0);

        const isClaimingWelcome = !currentProg.welcomeRewardClaimed && Boolean(progress.welcomeRewardClaimed);
        const welcomeCoinsBonus = isClaimingWelcome ? 50 : 0;
        const welcomeShieldsBonus = isClaimingWelcome ? 1 : 0;
        const welcomeRadarBonus = isClaimingWelcome ? 5 : 0;

        // Çevrimdışı/senkronize sırasında alınan günlük giriş ödülü doğrulaması
        const todayId = getDayId();
        const isClaimingDailyLogin = Boolean(
          progress.lastLoginDay &&
          progress.lastLoginDay !== currentProg.lastLoginDay &&
          progress.lastLoginDay === todayId
        );
        let dailyLoginCoinsBonus = 0;
        let dailyLoginShieldBonus = 0;
        let dailyLoginXpBonus = 0;
        if (isClaimingDailyLogin) {
          const dlResult = checkDailyLoginReward(currentProg, progress.lastLoginDay!);
          if (dlResult) {
            dailyLoginCoinsBonus = dlResult.reward.rewardType === "coins" ? dlResult.reward.amount : 0;
            dailyLoginShieldBonus = dlResult.reward.rewardType === "shield" ? dlResult.reward.amount : 0;
            dailyLoginXpBonus = dlResult.reward.rewardType === "xp" ? dlResult.reward.amount : 0;
          }
        }

        // Kozmetik Güvenliği: Yalnızca ücretsiz (maliyeti 0) veya veritabanında daha önceden satın alınmış eşyalar kabul edilir
        const safeOwnedFrames: Record<string, boolean> = { ...(currentProg.ownedFrames || {}), signal: true };
        if (progress.ownedFrames && typeof progress.ownedFrames === "object") {
          for (const [fId, val] of Object.entries(progress.ownedFrames)) {
            if (val === true) {
              const item = PROFILE_FRAMES.find((f) => f[0] === fId);
              if (item && (item[3] === 0 || currentProg.ownedFrames?.[fId] === true)) {
                safeOwnedFrames[fId] = true;
              }
            }
          }
        }

        const safeOwnedEffects: Record<string, boolean> = { ...(currentProg.ownedVictoryEffects || {}), pulse: true };
        if (progress.ownedVictoryEffects && typeof progress.ownedVictoryEffects === "object") {
          for (const [eId, val] of Object.entries(progress.ownedVictoryEffects)) {
            if (val === true) {
              const item = VICTORY_EFFECTS.find((e) => e[0] === eId);
              if (item && (item[3] === 0 || currentProg.ownedVictoryEffects?.[eId] === true)) {
                safeOwnedEffects[eId] = true;
              }
            }
          }
        }

        const safeOwnedBoardSkins: Record<string, boolean> = { ...(currentProg.ownedBoardSkins || {}), grid: true };
        if (progress.ownedBoardSkins && typeof progress.ownedBoardSkins === "object") {
          for (const [bId, val] of Object.entries(progress.ownedBoardSkins)) {
            if (val === true) {
              const item = BOARD_SKINS.find((b) => b[0] === bId);
              if (item && (item[3] === 0 || currentProg.ownedBoardSkins?.[bId] === true)) {
                safeOwnedBoardSkins[bId] = true;
              }
            }
          }
        }

        const validSelectedFrame =
          progress.selectedFrame && safeOwnedFrames[progress.selectedFrame]
            ? progress.selectedFrame
            : currentProg.selectedFrame;

        const validSelectedEffect =
          progress.selectedVictoryEffect && safeOwnedEffects[progress.selectedVictoryEffect]
            ? progress.selectedVictoryEffect
            : currentProg.selectedVictoryEffect;

        const validSelectedBoard =
          progress.selectedBoardSkin && safeOwnedBoardSkins[progress.selectedBoardSkin]
            ? progress.selectedBoardSkin
            : currentProg.selectedBoardSkin;

        dbUser.progress = {
          ...currentProg,
          selectedAvatar: progress.selectedAvatar || currentProg.selectedAvatar,
          selectedFrame: validSelectedFrame,
          selectedBoardSkin: validSelectedBoard,
          selectedVictoryEffect: validSelectedEffect,
          selectedTitle: progress.selectedTitle || currentProg.selectedTitle,
          selectedTheme: progress.selectedTheme || currentProg.selectedTheme,
          gender: progress.gender || currentProg.gender,
          avatarPhoto: typeof progress.avatarPhoto === "string" && progress.avatarPhoto.length <= 250_000
            ? progress.avatarPhoto
            : progress.avatarPhoto === null
            ? null
            : currentProg.avatarPhoto,
          sfxEnabled: progress.sfxEnabled !== undefined ? progress.sfxEnabled : currentProg.sfxEnabled,
          hapticsEnabled: progress.hapticsEnabled !== undefined ? progress.hapticsEnabled : currentProg.hapticsEnabled,
          purchasedAvatars: { ...(currentProg.purchasedAvatars || {}), ...(progress.purchasedAvatars || {}) },
          ownedFrames: safeOwnedFrames,
          ownedBoardSkins: safeOwnedBoardSkins,
          ownedVictoryEffects: safeOwnedEffects,
          friends: Array.isArray(progress.friends) ? progress.friends : currentProg.friends,
          welcomeRewardClaimed: currentProg.welcomeRewardClaimed || Boolean(progress.welcomeRewardClaimed),
          claimedMilestones: {
            ...(currentProg.claimedMilestones || {}),
            ...(progress.claimedMilestones || {}),
          },
          coins: nextCoins + welcomeCoinsBonus + dailyLoginCoinsBonus,
          streakShields: nextShields + welcomeShieldsBonus + dailyLoginShieldBonus,
          radarChargesBonus: nextRadar + welcomeRadarBonus,
          lives: typeof progress.lives === "number" ? Math.min(MAX_LIVES, Math.max(0, progress.lives)) : currentProg.lives,
          lastLifeRegenTimestamp: typeof progress.lastLifeRegenTimestamp === "number" ? progress.lastLifeRegenTimestamp : currentProg.lastLifeRegenTimestamp,
          dailyCompletedId: progress.dailyCompletedId || currentProg.dailyCompletedId,
          lastStreakCheckDate: progress.lastStreakCheckDate || currentProg.lastStreakCheckDate,
          lastLoginDay: progress.lastLoginDay || currentProg.lastLoginDay,
          loginDaysCount: typeof progress.loginDaysCount === "number"
            ? Math.max(currentProg.loginDaysCount || 0, progress.loginDaysCount)
            : currentProg.loginDaysCount,
          dailyClaimed: { ...(currentProg.dailyClaimed || {}), ...(progress.dailyClaimed || {}) },
          weeklyClaimed: { ...(currentProg.weeklyClaimed || {}), ...(progress.weeklyClaimed || {}) },
          missions: { ...(currentProg.missions || {}), ...(progress.missions || {}) },
          missionsDate: progress.missionsDate || currentProg.missionsDate,
          weeklyMissionsWeek: progress.weeklyMissionsWeek || currentProg.weeklyMissionsWeek,
          seasonHistory: progress.seasonHistory || currentProg.seasonHistory,
          lastSeasonResetId: progress.lastSeasonResetId || currentProg.lastSeasonResetId,
          vintageProgress: progress.vintageProgress || currentProg.vintageProgress,
          matchHistory: (() => {
            const map = new Map<string, any>();
            (currentProg.matchHistory || []).forEach((m: any) => {
              if (m && typeof m.id === "string") map.set(m.id, m);
            });
            (Array.isArray(progress.matchHistory) ? progress.matchHistory : []).forEach((m: any) => {
              if (m && typeof m.id === "string") map.set(m.id, m);
            });
            const combined = Array.from(map.values())
              .sort((a: any, b: any) => (b.date || 0) - (a.date || 0))
              .slice(0, 50);
            if (combined.length === 0) {
              return backfillMatchHistoryIfEmpty(currentProg);
            }
            return combined;
          })(),
          history: Array.from(new Set([...(currentProg.history || []), ...(Array.isArray(progress.history) ? progress.history : [])])).slice(-150),
          bestScore: Math.max(currentProg.bestScore || 0, typeof progress.bestScore === "number" ? progress.bestScore : 0),
          bestTempo: Math.max(currentProg.bestTempo || 0, typeof progress.bestTempo === "number" ? progress.bestTempo : 0),
          bestArcadeScore: Math.max(currentProg.bestArcadeScore || 0, typeof progress.bestArcadeScore === "number" ? progress.bestArcadeScore : 0),
          lastMatchReward: progress.lastMatchReward || currentProg.lastMatchReward,
          // xp, lp, wins, matches SUNUCU OTORİTESİNDEDİR (günlük giriş ödülü XP'si hariç)
          xp: currentProg.xp + dailyLoginXpBonus,
          lp: currentProg.lp,
          wins: currentProg.wins,
          matches: currentProg.matches,
          // Günlük rota başarısızlığı veya kalkan yokluğunda serinin sıfırlanmasına izin verilir
          streak: typeof progress.streak === "number" ? Math.min(currentProg.streak, Math.max(0, progress.streak)) : currentProg.streak,
          pvpWinStreak: typeof progress.pvpWinStreak === "number" ? Math.max(0, progress.pvpWinStreak) : (currentProg.pvpWinStreak ?? 0),
          // Çevrimdışı kazanılan solo seviye ilerlemesi güvenli üst sınırla (101) korunur
          soloUnlockedLevel: Math.min(101, Math.max(currentProg.soloUnlockedLevel ?? 1, typeof progress.soloUnlockedLevel === "number" ? progress.soloUnlockedLevel : 1)),
        };
        dbUser.updatedAt = new Date();
        await dbUser.save();
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Senkronizasyon başarısız." });
    }
  });

  app.post("/api/auth/delete-account", async (req, res) => {
    try {
      await connectDb();
      const user = await sdk.authenticateRequest(req);
      if (!user) return res.status(401).json({ error: "Yetkisiz işlem." });

      const dbUser = await UserModel.findOne({ openId: user.openId });
      if (dbUser) {
        await UserModel.deleteOne({ openId: user.openId });
      }

      await deletePlayerProfile(user.openId);
      if (dbUser?.username) {
        await deletePlayerProfile(dbUser.username);
      }
      res.json({ success: true, message: "Hesabınız ve verileriniz başarıyla silindi." });
    } catch (err: any) {
      res.status(err?.status === 403 ? 401 : 500).json({ error: err.message || "Hesap silme başarısız." });
    }
  });

  app.get("/api/user/profile/:idOrName", async (req, res) => {
    try {
      const idOrName = req.params.idOrName?.trim();
      if (!idOrName || idOrName.length > 64) return res.status(400).json({ error: "Geçersiz arama parametresi." });

      // Bot kontrolü
      if (idOrName.startsWith("bot:") || idOrName.toLowerCase().includes("bot")) {
        return res.json({
          id: idOrName,
          name: "KELİME BOT",
          username: "kelime_bot",
          isBot: true,
          avatar: "🤖",
          selectedTitle: "[SİBER İZCİ]",
          level: 10,
          tier: "GÜMÜŞ",
          lp: 950,
          wins: 14,
          matches: 26,
          streak: 4,
          bestScore: 120,
          bestTempo: 3.5,
          xp: 1900,
        });
      }

      await connectDb();
      // 1. UserModel arayışı (username veya openId)
      let user = await UserModel.findOne({
        $or: [
          { openId: idOrName },
          { username: idOrName.toLowerCase() },
          { name: new RegExp(`^${escapeRegex(idOrName)}$`, "i") },
        ]
      }).lean();

      if (user) {
        const prog = (user.progress || {}) as PlayerProgress;
        const tierInfo = getLeagueTier(prog);
        return res.json({
          id: user.openId,
          name: user.name || user.username || idOrName,
          username: user.username || user.openId,
          isBot: false,
          avatar: prog.selectedAvatar || "spark",
          avatarPhoto: prog.avatarPhoto,
          selectedTitle: prog.selectedTitle || "[ÇAYLAK]",
          selectedFrame: prog.selectedFrame || "signal",
          level: Math.floor((prog.xp || 0) / 200) + 1,
          tier: tierInfo.tier,
          lp: prog.lp || 0,
          wins: prog.wins || 0,
          matches: prog.matches || 0,
          streak: prog.streak || 0,
          bestScore: prog.bestScore || 0,
          bestTempo: prog.bestTempo || 0,
          xp: prog.xp || 0,
          historyCount: prog.history ? prog.history.length : 0,
        });
      }

      // 2. ProfileModel arayışı
      let profile = await ProfileModel.findOne({
        $or: [
          { playerId: idOrName },
          { name: new RegExp(`^${escapeRegex(idOrName)}$`, "i") },
        ]
      }).lean();

      if (profile) {
        const prog = (profile.progress || {}) as PlayerProgress;
        const tierInfo = getLeagueTier(prog);
        return res.json({
          id: profile.playerId,
          name: profile.name || idOrName,
          username: profile.name || idOrName,
          isBot: false,
          avatar: prog.selectedAvatar || "spark",
          avatarPhoto: prog.avatarPhoto,
          selectedTitle: prog.selectedTitle || "[ÇAYLAK]",
          selectedFrame: prog.selectedFrame || "signal",
          level: Math.floor((prog.xp || 0) / 200) + 1,
          tier: tierInfo.tier,
          lp: prog.lp || 0,
          wins: prog.wins || 0,
          matches: prog.matches || 0,
          streak: prog.streak || 0,
          bestScore: prog.bestScore || 0,
          bestTempo: prog.bestTempo || 0,
          xp: prog.xp || 0,
          historyCount: prog.history ? prog.history.length : 0,
        });
      }

      return res.status(404).json({ error: "Oyuncu profili bulunamadı." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Profil getirilemedi." });
    }
  });

  // --- SOSYAL VE ARKADAŞLIK REST ENDPOINTLERİ ---
  app.get("/api/friends/requests/:userIdOrUsername", async (req, res) => {
    try {
      const target = req.params.userIdOrUsername?.trim();
      if (!target) return res.status(400).json({ error: "Geçersiz parametre." });
      await connectDb();
      const requests = await getPendingFriendRequests(target);
      res.json({ requests });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "İstekler alınamadı." });
    }
  });

  app.post("/api/friends/request", async (req, res) => {
    try {
      const payload = z.object({
        toUsername: z.string().trim().min(1).max(64),
        fromPlayerId: z.string().trim().min(1).max(128),
        fromPlayerName: z.string().trim().min(1).max(64),
        profile: z.any().optional(),
      }).safeParse(req.body);

      if (!payload.success) return res.status(400).json({ error: "Geçersiz istek parametreleri." });
      const { toUsername, fromPlayerId, fromPlayerName, profile } = payload.data;

      if (toUsername.toLowerCase() === fromPlayerName.toLowerCase() || toUsername.toLowerCase() === (profile?.username || "").toLowerCase()) {
        return res.status(400).json({ error: "Kendinize arkadaşlık isteği gönderemezsiniz." });
      }

      await connectDb();
      const targetUser = await UserModel.findOne({
        $or: [
          { username: toUsername.toLowerCase() },
          { openId: toUsername },
          { name: new RegExp(`^${escapeRegex(toUsername)}$`, "i") }
        ]
      }).lean();

      const targetUserId = targetUser?.openId || toUsername;
      const targetUsernameClean = targetUser?.username || targetUser?.name || toUsername;
      const targetNameClean = targetUser?.name || targetUser?.username || toUsername;

      if (targetUser?.progress?.friends && Array.isArray(targetUser.progress.friends)) {
        const isAlreadyFriend = targetUser.progress.friends.some(
          (f: any) => (typeof f === "string" ? f === fromPlayerId : f.id === fromPlayerId || f.username?.toLowerCase() === (profile?.username || fromPlayerName).toLowerCase())
        );
        if (isAlreadyFriend) {
          return res.status(400).json({ error: "Bu kullanıcı zaten arkadaş listenizde." });
        }
      }

      const existingRequests = await getPendingFriendRequests(targetUserId);
      const alreadyPending = existingRequests.some(
        r => (r.fromUserId === fromPlayerId || r.fromUsername.toLowerCase() === (profile?.username || fromPlayerName).toLowerCase()) && r.status === "pending"
      );
      if (alreadyPending) {
        return res.status(400).json({ error: "Bu kullanıcıya daha önce istek gönderilmiş." });
      }

      const newRequest = await createFriendRequest({
        fromUserId: fromPlayerId,
        fromUsername: profile?.username || fromPlayerName,
        fromName: fromPlayerName,
        fromAvatar: profile?.avatar || "spark",
        fromAvatarPhoto: profile?.avatarPhoto,
        fromSelectedTitle: profile?.selectedTitle || "[ÇAYLAK]",
        fromLevel: profile?.level || 1,
        fromTier: profile?.tier || "DEMİR",
        fromLp: profile?.lp || 0,
        fromXp: profile?.xp || 0,
        toUserId: targetUserId,
        toUsername: targetUsernameClean,
        toName: targetNameClean,
      });

      res.json({ success: true, message: `${targetNameClean} kullanıcısına arkadaşlık isteği gönderildi!`, request: newRequest });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "İstek oluşturulamadı." });
    }
  });

  app.post("/api/friends/respond", async (req, res) => {
    try {
      const payload = z.object({
        requestId: z.string().trim().min(1),
        action: z.enum(["accept", "reject"]),
        playerId: z.string().trim().min(1),
        playerName: z.string().trim().optional(),
        profile: z.any().optional(),
      }).safeParse(req.body);

      if (!payload.success) return res.status(400).json({ error: "Geçersiz parametreler." });
      const { requestId, action, playerId, playerName, profile } = payload.data;

      await connectDb();
      const reqDoc = await findFriendRequestById(requestId);
      if (!reqDoc) return res.status(404).json({ error: "İstek bulunamadı." });

      if (action === "reject") {
        await updateFriendRequestStatus(requestId, "rejected");
        return res.json({ success: true, message: "İstek reddedildi." });
      }

      await updateFriendRequestStatus(requestId, "accepted");

      const friendForAcceptor = {
        id: reqDoc.fromUserId,
        name: reqDoc.fromName,
        username: reqDoc.fromUsername,
        avatar: reqDoc.fromAvatar || "spark",
        avatarPhoto: reqDoc.fromAvatarPhoto,
        selectedTitle: reqDoc.fromSelectedTitle || "[ÇAYLAK]",
        level: reqDoc.fromLevel || 1,
        tier: reqDoc.fromTier || "DEMİR",
        lp: reqDoc.fromLp || 0,
        xp: reqDoc.fromXp || 0,
        isOnline: true,
      };

      const friendForRequester = {
        id: playerId,
        name: playerName || reqDoc.toName || "OYUNCU",
        username: reqDoc.toUsername,
        avatar: profile?.avatar || "spark",
        avatarPhoto: profile?.avatarPhoto,
        selectedTitle: profile?.selectedTitle || "[ÇAYLAK]",
        level: profile?.level || 1,
        tier: profile?.tier || "DEMİR",
        lp: profile?.lp || 0,
        xp: profile?.xp || 0,
        isOnline: true,
      };

      await UserModel.findOneAndUpdate(
        { openId: reqDoc.toUserId },
        { $push: { "progress.friends": friendForAcceptor } }
      );
      await UserModel.findOneAndUpdate(
        { openId: reqDoc.fromUserId },
        { $push: { "progress.friends": friendForRequester } }
      );

      res.json({
        success: true,
        message: `${friendForAcceptor.name} ile artık arkadaşsınız!`,
        newFriend: friendForAcceptor,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "İşlem gerçekleştirilemedi." });
    }
  });

  app.post("/api/game/daily-login", async (req, res) => {
    try {
      await connectDb();
      const user = await sdk.authenticateRequest(req);
      const dbUser = await UserModel.findOne({ openId: user.openId });
      if (!dbUser) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
      const current = { ...DEFAULT_PROGRESS, ...(dbUser.progress ?? {}) } as PlayerProgress;
      const todayId = getDayId();
      const claimResult = checkDailyLoginReward(current, todayId);
      if (!claimResult) {
        return res.status(400).json({ error: "Bugünkü giriş ödülü zaten alındı.", progress: current });
      }
      dbUser.progress = claimResult.updatedProgress;
      dbUser.updatedAt = new Date();
      await dbUser.save();
      res.json({ success: true, reward: claimResult.reward, progress: claimResult.updatedProgress });
    } catch (err: any) {
      res.status(err?.status === 403 ? 401 : 500).json({ error: err?.message || "Giriş ödülü alınamadı." });
    }
  });

  app.post(["/api/game/award", "/api/game/reward"], async (req, res) => {
    const payload = z.object({
      awardId: z.string().trim().min(8).max(128),
      kind: z.enum(["solo", "arcade", "vintage"]),
      level: z.number().int().min(1).max(100).optional(),
      score: z.number().int().min(0).max(5000).optional(),
      foundWords: z.array(z.string().max(32)).max(32).optional(),
      daily: z.boolean().optional(),
    }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ error: "Geçersiz ödül isteği." });
    try {
      await connectDb();
      const user = await sdk.authenticateRequest(req);
      const dbUser = await UserModel.findOneAndUpdate(
        { openId: user.openId, processedAwardIds: { $ne: payload.data.awardId } },
        { $push: { processedAwardIds: { $each: [payload.data.awardId], $slice: -200 } } },
        { returnDocument: 'after' },
      );
      if (!dbUser) return res.status(409).json({ error: "Bu ödül isteği daha önce işlendi." });
      const current = { ...DEFAULT_PROGRESS, ...(dbUser?.progress ?? {}) } as PlayerProgress;

      // Güvenlik doğrulaması: Kilitli seviyeler için ödül talep edilemez
      if (payload.data.kind === "solo" && !payload.data.daily) {
        const currentUnlocked = current.soloUnlockedLevel ?? 1;
        const requestedLevel = payload.data.level ?? 1;
        if (requestedLevel > currentUnlocked) {
          return res.status(400).json({ error: "Kilitli seviye için ödül alınamaz." });
        }
      }
      if (payload.data.kind === "vintage") {
        const maxVintageUnlocked = current.vintageProgress?.maxUnlockedLevel ?? 1;
        const requestedLevel = payload.data.level ?? 1;
        if (requestedLevel > maxVintageUnlocked) {
          return res.status(400).json({ error: "Kilitli nostalji bulmacası için ödül alınamaz." });
        }
      }

      const score = payload.data.score ?? ((payload.data.level ?? 1) * 14);
      const foundWords = payload.data.foundWords ?? [];
      const next = payload.data.kind === "arcade"
        ? applyArcadeProgress(current, payload.data.score ?? 0)
        : payload.data.kind === "vintage"
        ? applyVintageProgress(current, payload.data.level ?? 1, payload.data.score ?? 30)
        : payload.data.daily
        ? completeDailyProgress(
            {
              ...current,
              history: Array.from(new Set([...(current.history || []), ...foundWords])).slice(-150),
            },
            getDailyChallenge(),
            score,
            foundWords.length
          )
        : {
            ...applyMatchProgress(current, {
              score,
              tempo: Math.max(1, (payload.data.level ?? 1) / 2),
              won: true,
              longWord: (payload.data.level ?? 1) >= 5,
              foundWords,
            }, "solo"),
            soloUnlockedLevel: Math.min(101, Math.max(current.soloUnlockedLevel ?? 1, (payload.data.level ?? 1) + 1)),
          };
      const awarded = next;
      dbUser.progress = awarded;
      dbUser.updatedAt = new Date();
      await dbUser.save();
      res.json({ progress: awarded });
    } catch (err: any) {
      res.status(err?.status === 403 ? 401 : 500).json({ error: err?.message || "Ödül hesaplanamadı." });
    }
  });

  app.post("/api/game/claim", async (req, res) => {
    const payload = z.object({ kind: z.enum(["daily", "weekly"]), missionId: z.string().max(32) }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ error: "Geçersiz görev isteği." });
    try {
      await connectDb();
      const user = await sdk.authenticateRequest(req);
      const dbUser = await UserModel.findOne({ openId: user.openId });
      const current = { ...DEFAULT_PROGRESS, ...(dbUser?.progress ?? {}) } as PlayerProgress;
      let next = current;
      const catalogMission = findMissionById(payload.data.missionId);
      if (catalogMission) {
        const isDaily = catalogMission.period === "daily";
        const isClaimed = isDaily
          ? Boolean(current.dailyClaimed?.[catalogMission.id])
          : Boolean(current.weeklyClaimed?.[catalogMission.id]);
        const progressVal = current.missions?.[catalogMission.id] ?? 0;
        if (progressVal < catalogMission.target || isClaimed) {
          return res.status(409).json({ error: "Görev henüz tamamlanmadı veya zaten ödülü alındı." });
        }
        next = {
          ...current,
          xp: current.xp + catalogMission.rewardXp,
          coins: (current.coins ?? 0) + catalogMission.rewardCoins,
          streakShields: (current.streakShields ?? 0) + (catalogMission.rewardShields ?? 0),
          dailyClaimed: isDaily
            ? { ...(current.dailyClaimed ?? {}), [catalogMission.id]: true }
            : current.dailyClaimed,
          weeklyClaimed: !isDaily
            ? { ...(current.weeklyClaimed ?? {}), [catalogMission.id]: true }
            : current.weeklyClaimed,
        };
      } else if (payload.data.kind === "daily") {
        const mission = SEASON_MISSIONS.find((item) => item.id === payload.data.missionId);
        if (!mission || (current.missions?.[mission.id] ?? 0) < mission.target || current.dailyClaimed?.[mission.id]) {
          return res.status(409).json({ error: "Günlük görev henüz tamamlanmadı veya zaten alındı." });
        }
        next = { ...current, xp: current.xp + mission.rewardXp, coins: (current.coins ?? 0) + 25, dailyClaimed: { ...(current.dailyClaimed ?? {}), [mission.id]: true } };
      } else if (payload.data.missionId === "victoryStreak") {
        if (current.wins < 3 || current.weeklyClaimed?.victoryStreak) return res.status(409).json({ error: "Haftalık görev henüz tamamlanmadı veya zaten alındı." });
        next = { ...current, xp: current.xp + 250, streakShields: (current.streakShields ?? 0) + 1, weeklyClaimed: { ...(current.weeklyClaimed ?? {}), victoryStreak: true } };
      } else if (payload.data.missionId === "speedDemon") {
        if ((current.bestArcadeScore ?? 0) < 400 || current.weeklyClaimed?.speedDemon) return res.status(409).json({ error: "Haftalık görev henüz tamamlanmadı veya zaten alındı." });
        next = { ...current, xp: current.xp + 200, coins: (current.coins ?? 0) + 50, weeklyClaimed: { ...(current.weeklyClaimed ?? {}), speedDemon: true } };
      } else {
        return res.status(400).json({ error: "Bilinmeyen görev." });
      }
      if (dbUser) { dbUser.progress = next; dbUser.updatedAt = new Date(); await dbUser.save(); }
      res.json({ progress: next });
    } catch (err: any) {
      res.status(err?.status === 403 ? 401 : 500).json({ error: err?.message || "Görev ödülü alınamadı." });
    }
  });

  app.post("/api/game/lives", async (req, res) => {
    const payload = z.object({ option: z.enum(["one", "all", "ad"]) }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ error: "Geçersiz can satın alma isteği." });
    try {
      await connectDb();
      const user = await sdk.authenticateRequest(req);
      const dbUser = await UserModel.findOne({ openId: user.openId });
      const current = { ...DEFAULT_PROGRESS, ...(dbUser?.progress ?? {}) } as PlayerProgress;
      const result = buyLives(current, payload.data.option);
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      if (dbUser) {
        dbUser.progress = result.updatedProgress;
        dbUser.updatedAt = new Date();
        await dbUser.save();
      }
      res.json({ success: true, message: result.message, progress: result.updatedProgress });
    } catch (err: any) {
      res.status(err?.status === 403 ? 401 : 500).json({ error: err?.message || "Can işlemi gerçekleştirilemedi." });
    }
  });

  app.post("/api/game/milestone", async (req, res) => {
    const payload = z.object({ level: z.number().int().min(1).max(100) }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ error: "Geçersiz sandık seviyesi." });
    try {
      await connectDb();
      const user = await sdk.authenticateRequest(req);
      const dbUser = await UserModel.findOne({ openId: user.openId });
      const current = { ...DEFAULT_PROGRESS, ...(dbUser?.progress ?? {}) } as PlayerProgress;
      
      const milestone = MILESTONE_REWARDS.find((m) => m.level === payload.data.level);
      if (!milestone) return res.status(400).json({ error: "Bu seviyede bir sandık bulunamadı." });
      
      const isUnlocked = (current.soloUnlockedLevel ?? 1) > milestone.level;
      const isClaimed = Boolean(current.claimedMilestones?.[milestone.level]);
      if (!isUnlocked) return res.status(400).json({ error: "Bu sandığın kilidi henüz açılmadı." });
      if (isClaimed) return res.status(409).json({ error: "Bu sandık ödülü daha önce alındı." });
      
      const next: PlayerProgress = {
        ...current,
        coins: (current.coins ?? 0) + milestone.coins,
        streakShields: (current.streakShields ?? 0) + milestone.shields,
        xp: current.xp + milestone.xp,
        claimedMilestones: {
          ...(current.claimedMilestones ?? {}),
          [milestone.level]: true,
        },
      };
      
      if (dbUser) {
        dbUser.progress = next;
        dbUser.updatedAt = new Date();
        await dbUser.save();
      }
      res.json({ success: true, progress: next });
    } catch (err: any) {
      res.status(err?.status === 403 ? 401 : 500).json({ error: err?.message || "Sandık ödülü alınamadı." });
    }
  });

  app.post("/api/game/shop-buy", async (req, res) => {
    const payload = z.object({ itemId: z.string().max(32) }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ error: "Geçersiz mağaza isteği." });
    try {
      await connectDb();
      const user = await sdk.authenticateRequest(req);
      const dbUser = await UserModel.findOne({ openId: user.openId });
      if (!dbUser) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
      const current = { ...DEFAULT_PROGRESS, ...(dbUser.progress ?? {}) } as PlayerProgress;
      const item = CHIP_EQUIPMENT_ITEMS.find((it) => it.id === payload.data.itemId);
      if (!item) return res.status(400).json({ error: "Bilinmeyen mağaza ürünü." });
      const currentCoins = current.coins ?? 0;
      if (currentCoins < item.cost) {
        return res.status(400).json({ error: `Yetersiz çip! Bu ürün için ${item.cost} siber çip gerekiyor.` });
      }

      let next = { ...current, coins: currentCoins - item.cost };
      if (item.rewardType === "lives") {
        const calc = getCalculatedLives(current);
        if (calc.lives >= MAX_LIVES) {
          return res.status(400).json({ error: "Canlarınız zaten tam kapasite dolu (5/5)!" });
        }
        next.lives = MAX_LIVES;
        next.lastLifeRegenTimestamp = Date.now();
      } else if (item.rewardType === "radar") {
        next.radarChargesBonus = (current.radarChargesBonus || 0) + 5;
      } else if (item.rewardType === "shield") {
        next.streakShields = (current.streakShields || 0) + 1;
      } else if (item.rewardType === "xp") {
        next.xp = current.xp + 250;
      }
      dbUser.progress = next;
      dbUser.updatedAt = new Date();
      await dbUser.save();
      res.json({ success: true, progress: next });
    } catch (err: any) {
      res.status(err?.status === 403 ? 401 : 500).json({ error: err?.message || "Satın alma işlemi başarısız." });
    }
  });

  app.post("/api/game/cosmetic-buy", async (req, res) => {
    const payload = z.object({
      kind: z.enum(["avatar", "frame", "effect", "board"]),
      id: z.string().max(32),
    }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ error: "Geçersiz kozmetik isteği." });
    try {
      await connectDb();
      const user = await sdk.authenticateRequest(req);
      const dbUser = await UserModel.findOne({ openId: user.openId });
      if (!dbUser) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
      const current = { ...DEFAULT_PROGRESS, ...(dbUser.progress ?? {}) } as PlayerProgress;
      const { kind, id } = payload.data;

      let cost = 0;
      if (kind === "frame") {
        const entry = PROFILE_FRAMES.find((f) => f[0] === id);
        if (!entry) return res.status(400).json({ error: "Geçersiz çerçeve." });
        cost = entry[3];
      } else if (kind === "effect") {
        const entry = VICTORY_EFFECTS.find((e) => e[0] === id);
        if (!entry) return res.status(400).json({ error: "Geçersiz zafer efekti." });
        cost = entry[3];
      } else if (kind === "board") {
        const entry = BOARD_SKINS.find((b) => b[0] === id);
        if (!entry) return res.status(400).json({ error: "Geçersiz tahta görünümü." });
        cost = entry[3];
      } else if (kind === "avatar") {
        const entry = AVATARS.find((a) => a.id === id);
        if (!entry) return res.status(400).json({ error: "Geçersiz avatar." });
        cost = 0;
      }

      const isAlreadyOwned =
        kind === "frame" ? Boolean(current.ownedFrames?.[id]) :
        kind === "effect" ? Boolean(current.ownedVictoryEffects?.[id]) :
        kind === "board" ? Boolean(current.ownedBoardSkins?.[id]) :
        Boolean(current.purchasedAvatars?.[id]);

      const effectiveCost = isAlreadyOwned ? 0 : cost;

      const currentCoins = current.coins ?? 0;
      if (effectiveCost > 0 && currentCoins < effectiveCost) {
        return res.status(400).json({ error: `Yetersiz çip! Bu kozmetik için ${effectiveCost} siber çip gerekiyor.` });
      }

      const nextCoins = Math.max(0, currentCoins - effectiveCost);
      let next = { ...current, coins: nextCoins };
      if (kind === "frame") {
        next.selectedFrame = id;
        next.ownedFrames = { ...(current.ownedFrames ?? {}), [id]: true };
      } else if (kind === "effect") {
        next.selectedVictoryEffect = id;
        next.ownedVictoryEffects = { ...(current.ownedVictoryEffects ?? {}), [id]: true };
      } else if (kind === "board") {
        next.selectedBoardSkin = id;
        next.ownedBoardSkins = { ...(current.ownedBoardSkins ?? {}), [id]: true };
      } else if (kind === "avatar") {
        next.selectedAvatar = id as any;
        next.purchasedAvatars = { ...(current.purchasedAvatars ?? {}), [id]: true };
      }
      dbUser.progress = next;
      dbUser.updatedAt = new Date();
      await dbUser.save();
      res.json({ success: true, progress: next });
    } catch (err: any) {
      res.status(err?.status === 403 ? 401 : 500).json({ error: err?.message || "Kozmetik açılamadı." });
    }
  });

  app.get("/api/auth/get-progress", async (req, res) => {
    try {
      await connectDb();
      const user = await sdk.authenticateRequest(req);
      if (!user) return res.status(401).json({ error: "Yetkisiz işlem." });

      const dbUser = await UserModel.findOne({ openId: user.openId });
      if (dbUser && dbUser.progress) {
        let prog = { ...DEFAULT_PROGRESS, ...dbUser.progress };
        if (!Array.isArray(prog.matchHistory) || prog.matchHistory.length === 0) {
          prog.matchHistory = backfillMatchHistoryIfEmpty(prog);
        }
        const rec = reconcilePlayerProgress(prog);
        dbUser.progress = rec.progress;
        dbUser.updatedAt = new Date();
        await dbUser.save();
        return res.json({ progress: rec.progress });
      }
      res.json({ progress: dbUser?.progress || null });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "İlerleme verisi alınamadı." });
    }
  });

  app.get("/api/game/leaderboard", async (_req, res) => {
    try {
      await connectDb();
      const topUsers = await UserModel.find({ "progress.xp": { $exists: true } })
        .sort({ "progress.xp": -1 })
        .limit(50)
        .lean();

      const leaderboard: LeaderboardEntry[] = topUsers.map((u: any, idx: number) => {
        const prog = u.progress || {};
        const tier = getLeagueTier(prog);
        return {
          id: u.openId || `user_${idx}`,
          name: u.username || u.name || `Oyuncu_${idx + 1}`,
          score: prog.xp || 0,
          wins: prog.wins || 0,
          matches: prog.matches || 0,
          bestRound: prog.bestScore || 0,
          lp: prog.lp || 0,
          tier: tier.tier,
          avatar: prog.selectedAvatar || "spark",
          avatarPhoto: prog.avatarPhoto,
          selectedTitle: prog.selectedTitle || "[ÇAYLAK]",
          level: Math.floor((prog.xp || 0) / 200) + 1,
        };
      });

      res.json({ leaderboard });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Liderlik tablosu alınamadı." });
    }
  });


  // Production static web export support
  const staticDir = path.resolve(process.cwd(), "dist");
  if (fs.existsSync(path.join(staticDir, "index.html"))) {
    app.use(express.static(staticDir));
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api/") && !req.path.startsWith("/socket.io/")) {
        return res.sendFile(path.join(staticDir, "index.html"));
      }
      next();
    });
  }

  registerGameRooms(io);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
