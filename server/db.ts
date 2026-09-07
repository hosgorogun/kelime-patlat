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

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
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

export const UserModel = mongoose.models.User || mongoose.model<User>("User", UserSchema);

function databaseUri() {
  const uri = process.env.MONGODB_URI?.trim();
  if (process.env.NODE_ENV === "production" && !uri) {
    throw new Error("MONGODB_URI must be configured in production.");
  }
  return uri || "mongodb://127.0.0.1:27017/kelime_patlat";
}

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDb() {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(databaseUri(), {
      serverSelectionTimeoutMS: 4000
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

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
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
    id: hashCode(user.openId),
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
