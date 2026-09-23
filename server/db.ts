import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
import { ENV } from "./_core/env";
import { normalizeTr } from "../shared/tr-utils";

export type User = {
  id: number;
  openId: string;
  username?: string;
  passwordHash?: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
  progress?: any;
  guestClaimedBy?: string | null;
  processedAwardIds?: string[];
};

export type InsertUser = Partial<User> & { openId: string };

const PBKDF2_ITERATIONS = 100_000;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
  // Format: "iterations:salt:hash" — backward compat with legacy "salt:hash"
  return `${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  let iterations: number;
  let salt: string;
  let originalHash: string;

  if (parts.length === 3) {
    // New format: "iterations:salt:hash"
    const parsedIterations = parseInt(parts[0]!, 10);
    if (isNaN(parsedIterations) || parsedIterations < 1) return false;
    iterations = parsedIterations;
    salt = parts[1]!;
    originalHash = parts[2]!;
  } else if (parts.length === 2) {
    // Legacy format: "salt:hash" (1000 iterations)
    iterations = 1000;
    salt = parts[0]!;
    originalHash = parts[1]!;
  } else {
    return false;
  }

  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  if (hash.length !== originalHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
}

const UserSchema = new Schema<User>({
  id: { type: Number, required: true },
  openId: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, default: null },
  name: { type: String, default: null },
  email: { type: String, default: null },
  loginMethod: { type: String, default: null },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastSignedIn: { type: Date, default: Date.now },
  progress: { type: Schema.Types.Mixed, default: null },
  guestClaimedBy: { type: String, default: null },
  processedAwardIds: { type: [String], default: [] }
});

UserSchema.index({ "progress.xp": -1 });

export const UserModel = mongoose.models.User || mongoose.model<User>("User", UserSchema);

export type FriendRequest = {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromName: string;
  fromAvatar?: string;
  fromAvatarPhoto?: string;
  fromSelectedTitle?: string;
  fromLevel?: number;
  fromTier?: string;
  fromLp?: number;
  fromXp?: number;
  toUserId: string;
  toUsername: string;
  toName?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
};

const FriendRequestSchema = new Schema<FriendRequest>({
  id: { type: String, required: true, unique: true },
  fromUserId: { type: String, required: true, index: true },
  fromUsername: { type: String, required: true },
  fromName: { type: String, required: true },
  fromAvatar: { type: String, default: "spark" },
  fromAvatarPhoto: { type: String, default: null },
  fromSelectedTitle: { type: String, default: "[ÇAYLAK]" },
  fromLevel: { type: Number, default: 1 },
  fromTier: { type: String, default: "DEMİR" },
  fromLp: { type: Number, default: 0 },
  fromXp: { type: Number, default: 0 },
  toUserId: { type: String, required: true, index: true },
  toUsername: { type: String, required: true, index: true },
  toName: { type: String, default: null },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending", index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

FriendRequestSchema.index({ toUserId: 1, status: 1 });
FriendRequestSchema.index({ toUsername: 1, status: 1 });
FriendRequestSchema.index({ fromUserId: 1, toUserId: 1 });

export const FriendRequestModel = mongoose.models.FriendRequest || mongoose.model<FriendRequest>("FriendRequest", FriendRequestSchema);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// In-memory store for fallback when Mongo is unavailable or during tests
const inMemoryFriendRequests = new Map<string, FriendRequest>();

export async function createFriendRequest(data: Omit<FriendRequest, "id" | "createdAt" | "updatedAt" | "status"> & { id?: string }): Promise<FriendRequest> {
  const reqId = data.id || `freq_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const record: FriendRequest = {
    ...data,
    id: reqId,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryFriendRequests.set(reqId, record);

  try {
    if (mongoose.connection.readyState === 1) {
      const created = await FriendRequestModel.create(record);
      return created.toObject();
    }
  } catch (err) {
    console.warn("[Database] FriendRequest save fallback to in-memory:", err);
  }
  return record;
}

export async function getPendingFriendRequests(userIdOrUsername: string): Promise<FriendRequest[]> {
  const normalized = normalizeTr(userIdOrUsername);
  const memResults = Array.from(inMemoryFriendRequests.values()).filter(
    (r) => (r.toUserId === userIdOrUsername || normalizeTr(r.toUsername) === normalized) && r.status === "pending"
  );

  try {
    if (mongoose.connection.readyState === 1) {
      const docs = await FriendRequestModel.find({
        $or: [
          { toUserId: userIdOrUsername, status: "pending" },
          { toUsername: new RegExp(`^${escapeRegex(userIdOrUsername)}$`, "i"), status: "pending" }
        ]
      }).sort({ createdAt: -1 }).lean();
      
      const map = new Map<string, FriendRequest>();
      docs.forEach((d: any) => map.set(d.id, d));
      memResults.forEach((m) => map.set(m.id, m));
      return Array.from(map.values());
    }
  } catch (err) {
    console.warn("[Database] FriendRequest find fallback to in-memory:", err);
  }
  return memResults;
}

export async function updateFriendRequestStatus(requestId: string, status: "accepted" | "rejected"): Promise<FriendRequest | null> {
  const mem = inMemoryFriendRequests.get(requestId);
  if (mem) {
    mem.status = status;
    mem.updatedAt = new Date();
  }

  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await FriendRequestModel.findOneAndUpdate(
        { id: requestId },
        { status, updatedAt: new Date() },
        { returnDocument: 'after' }
      ).lean();
      if (updated) return updated as FriendRequest;
    }
  } catch (err) {
    console.warn("[Database] FriendRequest update fallback to in-memory:", err);
  }
  return mem || null;
}

export async function findFriendRequestById(requestId: string): Promise<FriendRequest | null> {
  const mem = inMemoryFriendRequests.get(requestId);
  if (mem) return mem;
  try {
    if (mongoose.connection.readyState === 1) {
      const doc = await FriendRequestModel.findOne({ id: requestId }).lean();
      if (doc) return doc as FriendRequest;
    }
  } catch (err) {
    console.warn("[Database] FriendRequest findById fallback:", err);
  }
  return null;
}

export function clearInMemoryFriendRequests(): void {
  inMemoryFriendRequests.clear();
}

function databaseUri() {
  const uri = process.env.MONGODB_URI?.trim();
  return uri || "mongodb://127.0.0.1:27017/kelime_patlat";
}

export async function seedDemoUser() {
  // Üretim ortamında bilinen şifreli demo hesabı OLUŞTURULMAZ (güvenlik riski)
  if (process.env.NODE_ENV === "production") {
    return;
  }
  try {
    await UserModel.updateMany({ username: null }, { $unset: { username: 1 } });
    const existing = await UserModel.findOne({ username: "siber_oyuncu" });
    if (!existing) {
      await UserModel.create({
        id: 5002,
        openId: "usr_demo_siber_oyuncu",
        username: "siber_oyuncu",
        passwordHash: hashPassword("siber123"),
        name: "Siber Oyuncu",
        email: "siber@kelimepatlat.com",
        loginMethod: "credentials",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });
      console.log("[Database] Demo hesabı başarıyla oluşturuldu: siber_oyuncu / siber123");
    }
  } catch (err) {
    console.error("[Database] seedDemoUser hatası:", err);
  }
}

let connectionPromise: Promise<typeof mongoose> | null = null;
let hasSeededDemoUser = false;

export async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    if (!hasSeededDemoUser) {
      hasSeededDemoUser = true;
      seedDemoUser().catch(() => {});
    }
    return mongoose;
  }
  if (!connectionPromise || mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    connectionPromise = mongoose.connect(databaseUri(), {
      serverSelectionTimeoutMS: 4000
    }).then((m) => {
      hasSeededDemoUser = true;
      seedDemoUser().catch(() => {});
      return m;
    }).catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }
  return connectionPromise;
}


export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  await connectDb();
  const now = new Date();
  
  const updateData: Partial<User> = {
    updatedAt: now,
  };
  if (user.name !== undefined) updateData.name = user.name;
  if (user.email !== undefined) updateData.email = user.email;
  if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
  if (user.lastSignedIn !== undefined) {
    updateData.lastSignedIn = user.lastSignedIn;
  } else {
    updateData.lastSignedIn = now;
  }
  if (user.role !== undefined) {
    updateData.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    updateData.role = "admin";
  }

  const setOnInsert = {
    id: crypto.randomInt(1, 2_147_483_647),
    openId: user.openId,
    createdAt: now,
    role: user.openId === ENV.ownerOpenId ? "admin" : "user",
  };

  await UserModel.findOneAndUpdate(
    { openId: user.openId },
    {
      $set: updateData,
      $setOnInsert: setOnInsert,
    },
    { upsert: true, returnDocument: 'after' }
  );
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  try {
    await connectDb();
    const doc = await UserModel.findOne({ openId });
    if (!doc) return undefined;
    return doc.toObject();
  } catch (error) {
    console.warn("[Database] Failed to get user by openId (offline fallback):", error);
    return undefined;
  }
}
