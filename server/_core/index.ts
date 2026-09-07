import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { Server as SocketIOServer } from "socket.io";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { sdk } from "./sdk";
import { registerGameRooms } from "../game/rooms";

import { UserModel, hashPassword, verifyPassword } from "../db";

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
  const app = express();
  const server = createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: true, credentials: true },
  });

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
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

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
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
        id: Math.abs([...openId].reduce((value, char) => ((value * 31) ^ char.charCodeAt(0)) >>> 0, 7_431)),
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

  app.post("/api/auth/login", async (req, res) => {
    try {
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
      
      const { progress } = req.body;
      const dbUser = await UserModel.findOne({ openId: user.openId });
      if (dbUser) {
        dbUser.progress = progress;
        dbUser.updatedAt = new Date();
        await dbUser.save();
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Senkronizasyon başarısız." });
    }
  });

  app.get("/api/auth/get-progress", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) return res.status(401).json({ error: "Yetkisiz işlem." });

      const dbUser = await UserModel.findOne({ openId: user.openId });
      res.json({ progress: dbUser?.progress || null });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "İlerleme verisi alınamadı." });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const authUser = await sdk.authenticateRequest(req);
      if (authUser && authUser.openId) {
        const dbUser = await UserModel.findOne({ openId: authUser.openId });
        if (dbUser) {
          res.json({
            ...authUser,
            progress: dbUser.progress || null,
            name: dbUser.name || authUser.name
          });
          return;
        }
      }
      res.json(authUser || null);
    } catch (err) {
      res.json(null);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    try {
      const { COOKIE_NAME } = require("../../shared/const.js");
      const { getSessionCookieOptions } = require("./cookies");
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Logout failed" });
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
