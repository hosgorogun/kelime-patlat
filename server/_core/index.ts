import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "node:path";
import fs from "node:fs";
import net from "net";
import { Server as SocketIOServer } from "socket.io";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerGameRooms } from "../game/rooms";

// Modular Express Routers
import { authRouter } from "../routes/auth.routes";
import { gameRouter } from "../routes/game.routes";
import { friendsRouter } from "../routes/friends.routes";
import { dictionaryRouter } from "../routes/dictionary.routes";
import { userRouter } from "../routes/user.routes";
import { turnMatchRouter } from "../routes/turn-match.routes";

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
    console.warn("[Server] Warning: CORS_ORIGINS is not set.");
  }
  const app = express();
  const server = createServer(app);
  const allowedOrigins = new Set(
    [process.env.CORS_ORIGINS, process.env.EXPO_WEB_PREVIEW_URL, "http://localhost:8081", "http://localhost:8082", "http://localhost:19006"]
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

  // Mount Modular Routes
  app.use("/api/auth", authRouter);
  app.use("/api/game", gameRouter);
  app.use("/api/friends", friendsRouter);
  app.use("/api/dictionary", dictionaryRouter);
  app.use("/api/user", userRouter);
  app.use("/api/turn-matches", turnMatchRouter);

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

  const shutdown = async (signal: string) => {
    console.log(`[Server] ${signal} alındı, sunucu güvenle kapatılıyor...`);
    try {
      io.close();
      server.close(() => {
        console.log("[Server] HTTP sunucusu kapatıldı.");
        process.exit(0);
      });
      setTimeout(() => process.exit(0), 5000).unref();
    } catch {
      process.exit(0);
    }
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch(console.error);
