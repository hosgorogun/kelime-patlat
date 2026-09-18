import mongoose, { Schema } from "mongoose";
import { connectDb } from "../db";
import type { LeaderboardEntry } from "../../shared/game";
import { DEFAULT_PROGRESS, type PlayerProgress } from "../../shared/progression";

type ProfileDocument = {
  playerId: string;
  name: string;
  progress: PlayerProgress;
  createdAt: Date;
  updatedAt: Date;
};

type LeaderboardDocument = LeaderboardEntry & { updatedAt: Date };
type RoundEntry = { id: string; name: string; score: number; won: boolean; lp?: number; tier?: string; avatar?: string; avatarPhoto?: string; selectedTitle?: string; selectedFrame?: string };

const ProfileSchema = new Schema<ProfileDocument>({
  playerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  progress: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const LeaderboardSchema = new Schema<LeaderboardDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  score: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  matches: { type: Number, default: 0 },
  bestRound: { type: Number, default: 0 },
  lp: { type: Number, default: 0 },
  tier: { type: String, default: "DEMİR" },
  avatar: { type: String, default: "spark" },
  avatarPhoto: { type: String },
  selectedTitle: { type: String },
  selectedFrame: { type: String, default: "signal" },
  updatedAt: { type: Date, default: Date.now }
});

LeaderboardSchema.index({ score: -1, wins: -1, bestRound: -1 });

export const ProfileModel = mongoose.models.PlayerProfile || mongoose.model<ProfileDocument>("PlayerProfile", ProfileSchema, "player_profiles");
export const LeaderboardModel = mongoose.models.SeasonLeaderboard || mongoose.model<LeaderboardDocument>("SeasonLeaderboard", LeaderboardSchema, "season_leaderboard");

let lastConnectionWarning = 0;

function normalizedProgress(progress: Partial<PlayerProgress>): PlayerProgress {
  return {
    ...DEFAULT_PROGRESS,
    ...progress,
    missions: { ...DEFAULT_PROGRESS.missions, ...progress.missions },
  };
}

async function safely<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    await connectDb();
    return await operation();
  } catch (error) {
    if (Date.now() - lastConnectionWarning > 30_000) {
      lastConnectionWarning = Date.now();
      console.warn("[MongoDB] Kalıcı oyun verisi kullanılamıyor; bellek içi akış sürüyor.", error instanceof Error ? error.message : error);
    }
    return fallback;
  }
}

export async function loadPlayerProfile(playerId: string) {
  return safely(async () => {
    const doc = await ProfileModel.findOne({ playerId });
    return doc ? doc.toObject() : null;
  }, null);
}

export async function savePlayerProfile(playerId: string, name: string, progress: Partial<PlayerProgress>) {
  const now = new Date();
  const nextProgress = normalizedProgress(progress);
  const cleanName = name.trim().slice(0, 16) || "OYUNCU";
  
  return safely(async () => {
    await ProfileModel.updateOne(
      { playerId },
      { 
        $set: { name: cleanName, progress: nextProgress, updatedAt: now }, 
        $setOnInsert: { createdAt: now } 
      },
      { upsert: true },
    );
    return { playerId, name: cleanName, progress: nextProgress };
  }, null);
}

export async function deletePlayerProfile(playerId: string) {
  return safely(async () => {
    await ProfileModel.deleteOne({ playerId });
    await LeaderboardModel.deleteOne({ id: playerId });
    return true;
  }, false);
}

export async function loadLeaderboard() {
  return safely(async () => {
    const entries = await LeaderboardModel.find({}, { _id: 0, id: 1, name: 1, score: 1, wins: 1, matches: 1, bestRound: 1, lp: 1, tier: 1, avatar: 1, avatarPhoto: 1, selectedTitle: 1, selectedFrame: 1 })
      .sort({ score: -1, wins: -1, bestRound: -1 })
      .limit(50)
      .lean();
    return entries as LeaderboardEntry[];
  }, null);
}

export async function recordLeaderboardRounds(rounds: RoundEntry[]) {
  return safely(async () => {
    const now = new Date();
    await Promise.all(rounds.map((round) => {
      const setFields: Record<string, any> = { name: round.name, updatedAt: now };
      if (round.lp !== undefined) setFields.lp = round.lp;
      if (round.tier !== undefined) setFields.tier = round.tier;
      if (round.avatar !== undefined) setFields.avatar = round.avatar;
      if (round.avatarPhoto !== undefined) setFields.avatarPhoto = round.avatarPhoto;
      if (round.selectedTitle !== undefined) setFields.selectedTitle = round.selectedTitle;
      if (round.selectedFrame !== undefined) setFields.selectedFrame = round.selectedFrame;

      return LeaderboardModel.updateOne(
        { id: round.id },
        {
          $set: setFields,
          $setOnInsert: { id: round.id },
          $inc: { score: round.score, wins: round.won ? 1 : 0, matches: 1 },
          $max: { bestRound: round.score },
        },
        { upsert: true },
      );
    }));
    return loadLeaderboard();
  }, null);
}

export function normalizeStoredProgress(progress: Partial<PlayerProgress>) {
  return normalizedProgress(progress);
}
