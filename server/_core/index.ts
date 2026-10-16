if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "production";
}
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "node:path";
import fs from "node:fs";
import net from "net";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerGameRooms } from "../game/rooms";
import { connectDb } from "../db";

// Process level safety handlers for production stability
process.on("uncaughtException", (error) => {
  console.error("[CRITICAL] Uncaught Exception trapped:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[CRITICAL] Unhandled Rejection at:", promise, "reason:", reason);
});

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
  const allowAllOrigins = allowedOrigins.has("*") || !process.env.CORS_ORIGINS?.trim();
  const isAllowedOrigin = (origin?: string) => {
    if (!origin || origin === "null") return true;
    if (allowAllOrigins) return true;
    return allowedOrigins.has(origin.replace(/\/$/, ""));
  };
  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, origin || true);
        } else {
          callback(new Error("CORS origin not allowed"), false);
        }
      },
      credentials: true,
    },
  });

  app.set("trust proxy", 1);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isAllowedOrigin(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
    } else if (!origin && allowAllOrigins) {
      res.header("Access-Control-Allow-Origin", "*");
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
        if (storage.size > 2500) {
          let evicted = 0;
          for (const k of storage.keys()) {
            storage.delete(k);
            if (++evicted >= 500) break;
          }
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

  function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}g`);
    if (h > 0) parts.push(`${h}sa`);
    if (m > 0) parts.push(`${m}dk`);
    parts.push(`${s}sn`);
    return parts.join(" ") || "0sn";
  }

  const dbStateMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  // Comprehensive health & status endpoint for cloud monitoring & production diagnostics
  app.get(["/health", "/api/health"], (_req, res) => {
    const uptimeSec = Math.floor(process.uptime());
    const mem = process.memoryUsage();
    const readyState = mongoose.connection.readyState;
    const dbStatus = dbStateMap[readyState] || "unknown";

    res.json({
      ok: true,
      status: readyState === 1 ? "healthy" : "degraded",
      server: {
        name: "Kelime Patlat Server",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "production",
        uptimeSeconds: uptimeSec,
        uptime: formatUptime(uptimeSec),
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      },
      database: {
        status: dbStatus,
        connected: readyState === 1,
        host: mongoose.connection.host || "in-memory-fallback",
        name: mongoose.connection.name || "kelime_patlat",
      },
      websocket: {
        activeClients: io.engine?.clientsCount ?? 0,
        activeRooms: io.sockets?.adapter?.rooms?.size ?? 0,
      },
      system: {
        memoryRssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      },
    });
  });

  // Root endpoint fallback for API-only deployments (when static dist/index.html is not served)
  app.get("/", (req, res, next) => {
    const staticDir = path.resolve(process.cwd(), "dist");
    if (fs.existsSync(path.join(staticDir, "index.html"))) {
      return next();
    }
    res.json({
      ok: true,
      name: "Kelime Patlat API Server",
      status: "online",
      env: process.env.NODE_ENV,
      timestamp: Date.now(),
    });
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

  // Pre-warm database connection in background
  connectDb().catch((err) => {
    console.warn("[Database] Başlangıçta veritabanına bağlanılamadı (bellek içi mod aktif):", err?.message || err);
  });

  const host = process.env.HOST || "0.0.0.0";
  const preferredPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  let port = preferredPort;

  // In local development without an explicit PORT, find next available port if 3000 is occupied
  if (!process.env.PORT && process.env.NODE_ENV !== "production") {
    port = await findAvailablePort(preferredPort);
    if (port !== preferredPort) {
      console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }
  }

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[Server CRITICAL] Port ${port} is already in use.`);
      process.exit(1);
    } else {
      console.error("[Server CRITICAL] Server error:", err);
      process.exit(1);
    }
  });

  server.listen(port, host, () => {
    console.log(`[api] server listening on http://${host === "0.0.0.0" ? "localhost" : host}:${port} (bound to ${host}, env: ${process.env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[Server] ${signal} alındı, sunucu güvenle kapatılıyor...`);
    try {
      io.close();
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close().catch(() => {});
      }
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
