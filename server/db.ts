import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
import { ENV } from "./_core/env";

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
  username: { type: String, unique: true, sparse: true, default: null },
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

function databaseUri() {
  const uri = process.env.MONGODB_URI?.trim();
  return uri || "mongodb://127.0.0.1:27017/kelime_patlat";
}

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (!connectionPromise || mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    connectionPromise = mongoose.connect(databaseUri(), {
      serverSelectionTimeoutMS: 4000
    }).catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }
  return connectionPromise;
}

export async function getDb() {
  try {
    await connectDb();
    return mongoose.connection.db;
  } catch (error) {
    console.warn("[Database] Failed to connect to MongoDB:", error);
    connectionPromise = null;
    return null;
  }
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
    { upsert: true, new: true }
  );
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  await connectDb();
  try {
    const doc = await UserModel.findOne({ openId });
    if (!doc) return undefined;
    return doc.toObject();
  } catch (error) {
    console.error("[Database] Failed to get user by openId:", error);
    return undefined;
  }
}
