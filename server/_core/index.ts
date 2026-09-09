import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { Server as SocketIOServer } from "socket.io";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { sdk } from "./sdk";
import { registerGameRooms } from "../game/rooms";

import { UserModel, hashPassword, verifyPassword, connectDb } from "../db";
import { deletePlayerProfile, loadPlayerProfile, ProfileModel } from "../game/mongo-store";
import { COOKIE_NAME } from "../../shared/const.js";
import { getSessionCookieOptions } from "./cookies";
import { z } from "zod";
import { randomUUID, randomInt } from "node:crypto";
import { applyArcadeProgress, applyMatchProgress, completeDailyProgress, DEFAULT_PROGRESS, getDailyChallenge, mergePlayerProgress, SEASON_MISSIONS, findMissionById, getLeagueTier, type PlayerProgress } from "../../shared/progression";
import type { LeaderboardEntry } from "../../shared/game";

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

async function startServer() {
  if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGINS?.trim()) {
    throw new Error("CORS_ORIGINS must be configured in production.");
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

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  const authAttempts = new Map<string, { startedAt: number; count: number }>();
  app.use("/api/auth", (req, res, next) => {
    if (!req.path.endsWith("/login") && !req.path.endsWith("/signup")) return next();
    const key = req.ip || "unknown";
    const now = Date.now();
    const current = authAttempts.get(key);
    if (!current || now - current.startedAt >= 60_000) {
      // Periodically purge stale entries to prevent unbounded memory growth
      if (authAttempts.size > 500) {
        for (const [k, v] of authAttempts) {
          if (now - v.startedAt >= 60_000) authAttempts.delete(k);
        }
      }
      authAttempts.set(key, { startedAt: now, count: 1 });
      return next();
    }
    current.count += 1;
    if (current.count > 10) {
      res.status(429).json({ error: "Çok fazla deneme. Lütfen bir dakika sonra tekrar deneyin." });
      return;
    }
    next();
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
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

  app.post("/api/auth/signup", async (req, res) => {
    try {
      await connectDb();
      const { username, password, email, fullName, gender } = req.body;
      if (!username || !password || username.length < 3 || password.length < 4) {
        return res.status(400).json({ error: "Geçersiz kullanıcı adı veya şifre (Kullanıcı adı min 3, şifre min 4 karakter olmalıdır)." });
      }
      if (!email || !fullName) {
        return res.status(400).json({ error: "E-posta ve ad soyad alanları zorunludur." });
      }
      const existingUser = await UserModel.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış." });
      }
      
      const openId = `usr_${username.toLowerCase()}`;
      const passwordHash = hashPassword(password);
      const now = new Date();

      const validGender = gender === "male" || gender === "female" ? gender : "unspecified";
      const initialProgress = { gender: validGender };

      const user = new UserModel({
        id: randomInt(1, 2_147_483_647),
        openId,
        username: username.toLowerCase(),
        passwordHash,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        loginMethod: "credentials",
        role: "user",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
        progress: initialProgress
      });

      await user.save();
      const token = await sdk.createSessionToken(openId, { name: fullName.trim() });
      res.json({ success: true, token, user: { openId, name: fullName.trim(), username: username.toLowerCase(), progress: initialProgress } });
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
        { new: false },
      );
      if (!guest) return res.status(409).json({ error: "Bu misafir ilerlemesi daha önce başka bir hesaba aktarıldı." });
      const target = await UserModel.findOne({ openId: user.openId });
      if (target) {
        target.progress = mergePlayerProgress({ ...DEFAULT_PROGRESS, ...(target.progress ?? {}) } as PlayerProgress, guest.progress);
        target.updatedAt = new Date();
        await target.save();
      }
      res.json({ progress: target?.progress ?? guest.progress });
    } catch (err: any) {
      res.status(err?.status === 403 ? 401 : 500).json({ error: err?.message || "Misafir ilerlemesi aktarılamadı." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      await connectDb();
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Kullanıcı adı ve şifre gereklidir." });
      }
      const user = await UserModel.findOne({ username: username.toLowerCase() });
      if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });
      }

      user.lastSignedIn = new Date();
      await user.save();

      const token = await sdk.createSessionToken(user.openId, { name: user.name || username.toUpperCase() });
      res.json({ success: true, token, user: { openId: user.openId, name: user.name || username.toUpperCase(), username: user.username, progress: user.progress } });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Giriş işlemi başarısız." });
    }
  });

  app.post("/api/auth/sync-progress", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) return res.status(401).json({ error: "Yetkisiz işlem." });
      
      const { progress } = req.body as { progress?: Partial<PlayerProgress> };
      if (!progress || typeof progress !== "object") return res.status(400).json({ error: "Geçersiz progress verisi." });
      await connectDb();
      const dbUser = await UserModel.findOne({ openId: user.openId });
      if (dbUser) {
        dbUser.progress = mergePlayerProgress(
          { ...DEFAULT_PROGRESS, ...(dbUser.progress ?? {}) } as PlayerProgress,
          progress,
          { preferRemoteBalances: true },
        );
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

      await UserModel.deleteOne({ openId: user.openId });
      await deletePlayerProfile(user.openId);
      res.json({ success: true, message: "Hesabınız ve verileriniz başarıyla silindi." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Hesap silme başarısız." });
    }
  });

  app.get("/api/user/profile/:idOrName", async (req, res) => {
    try {
      const idOrName = req.params.idOrName?.trim();
      if (!idOrName) return res.status(400).json({ error: "Geçersiz arama parametresi." });

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
          { name: new RegExp(`^${idOrName}$`, "i") },
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
          { name: new RegExp(`^${idOrName}$`, "i") },
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

  app.post("/api/game/award", async (req, res) => {
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
        { $addToSet: { processedAwardIds: payload.data.awardId } },
        { new: true },
      );
      if (!dbUser) return res.status(409).json({ error: "Bu ödül isteği daha önce işlendi." });
      const current = { ...DEFAULT_PROGRESS, ...(dbUser?.progress ?? {}) } as PlayerProgress;
      const next = payload.data.kind === "arcade"
        ? applyArcadeProgress(current, payload.data.score ?? 0)
        : payload.data.kind === "vintage"
        ? {
            ...current,
            xp: current.xp + (payload.data.score ?? 30),
            coins: (current.coins ?? 50) + Math.max(2, Math.floor((payload.data.score ?? 30) / 10)),
            vintageProgress: {
              maxUnlockedLevel: Math.min(20, Math.max(current.vintageProgress?.maxUnlockedLevel ?? 1, (payload.data.level ?? 1) + 1)),
              completedLevels: Array.from(new Set([
                ...(current.vintageProgress?.completedLevels ?? []),
                ...(payload.data.level ? [payload.data.level] : []),
              ])).sort((a, b) => a - b),
              score: (current.vintageProgress?.score ?? 0) + (payload.data.score ?? 100),
            },
          }
        : {
            ...applyMatchProgress(current, {
              score: (payload.data.level ?? 1) * 14,
              tempo: Math.max(1, (payload.data.level ?? 1) / 2),
              won: true,
              longWord: (payload.data.level ?? 1) >= 5,
              foundWords: payload.data.foundWords ?? [],
            }, "solo"),
            soloUnlockedLevel: Math.min(101, Math.max(current.soloUnlockedLevel ?? 1, (payload.data.level ?? 1) + 1)),
          };
      const awarded = payload.data.daily ? completeDailyProgress(next, getDailyChallenge()) : next;
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
          coins: (current.coins ?? 50) + catalogMission.rewardCoins,
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
        next = { ...current, xp: current.xp + mission.rewardXp, coins: (current.coins ?? 50) + 25, dailyClaimed: { ...(current.dailyClaimed ?? {}), [mission.id]: true } };
      } else if (payload.data.missionId === "victoryStreak") {
        if (current.wins < 3 || current.weeklyClaimed?.victoryStreak) return res.status(409).json({ error: "Haftalık görev henüz tamamlanmadı veya zaten alındı." });
        next = { ...current, xp: current.xp + 250, streakShields: (current.streakShields ?? 0) + 1, weeklyClaimed: { ...(current.weeklyClaimed ?? {}), victoryStreak: true } };
      } else if (payload.data.missionId === "speedDemon") {
        if ((current.bestArcadeScore ?? 0) < 400 || current.weeklyClaimed?.speedDemon) return res.status(409).json({ error: "Haftalık görev henüz tamamlanmadı veya zaten alındı." });
        next = { ...current, xp: current.xp + 200, coins: (current.coins ?? 50) + 50, weeklyClaimed: { ...(current.weeklyClaimed ?? {}), speedDemon: true } };
      } else {
        return res.status(400).json({ error: "Bilinmeyen görev." });
      }
      if (dbUser) { dbUser.progress = next; dbUser.updatedAt = new Date(); await dbUser.save(); }
      res.json({ progress: next });
    } catch (err: any) {
      res.status(err?.status === 403 ? 401 : 500).json({ error: err?.message || "Görev ödülü alınamadı." });
    }
  });

  app.get("/api/auth/get-progress", async (req, res) => {
    try {
      await connectDb();
      const user = await sdk.authenticateRequest(req);
      if (!user) return res.status(401).json({ error: "Yetkisiz işlem." });

      const dbUser = await UserModel.findOne({ openId: user.openId });
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
          level: Math.floor((prog.xp || 0) / 200) + 1,
        };
      });

      res.json({ leaderboard });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Liderlik tablosu alınamadı." });
    }
  });


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
