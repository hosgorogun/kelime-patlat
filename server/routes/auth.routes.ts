import { Router } from "express";
import { z } from "zod";
import { randomUUID, randomInt } from "node:crypto";
import { sdk } from "../_core/sdk";
import { UserModel, hashPassword, verifyPassword, connectDb } from "../db";
import { deletePlayerProfile } from "../game/mongo-store";
import {
  DEFAULT_PROGRESS,
  mergePlayerProgress,
  backfillMatchHistoryIfEmpty,
  findMissionById,
  reconcilePlayerProgress,
  MAX_LIVES,
  checkDailyLoginReward,
  getDayId,
  type PlayerProgress,
  type GenderType,
} from "../../shared/progression";
import { PROFILE_FRAMES, VICTORY_EFFECTS, BOARD_SKINS } from "../../shared/store-items";
import { normalizeTr, normalizeTrUpper, isEqualTr } from "../../shared/tr-utils";

export const authRouter = Router();

authRouter.post("/guest", async (_req, res) => {
  try {
    const openId = `guest_${randomUUID()}`;
    const guestNumber = Math.floor(1000 + Math.random() * 9000);
    const guestName = `Misafir #${guestNumber}`;
    const now = new Date();
    try {
      await connectDb();
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
    } catch (dbErr) {
      console.warn("[Auth] Misafir kullanıcı veritabanı çevrimdışı fallback:", dbErr);
    }
    const token = await sdk.createSessionToken(openId, { name: guestName });
    res.json({ success: true, token, user: { openId, name: guestName, progress: DEFAULT_PROGRESS } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Misafir oturumu oluşturulamadı." });
  }
});

const signupSchema = z.object({
  username: z.string().trim().min(4, "Kullanıcı adı en az 4 karakter olmalıdır.").max(32).regex(/^[a-zA-Z0-9._-]+$/, "Kullanıcı adı yalnızca harf, rakam, nokta ve alt çizgi içerebilir."),
  password: z.string().min(6, "Şifre min 6 karakter olmalıdır.").max(128),
  email: z.string().trim().email("Geçerli bir e-posta adresi gereklidir.").max(128),
  fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalıdır.").max(64),
  gender: z.enum(["male", "female", "unspecified"]).optional(),
});

authRouter.post("/signup", async (req, res) => {
  try {
    await connectDb();
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Geçersiz kayıt bilgileri." });
    }
    const { username, password, email, fullName, gender } = parsed.data;
    const lowerUsername = normalizeTr(username);
    const lowerEmail = normalizeTr(email);
    const existingUser = await UserModel.findOne({
      $or: [{ username: lowerUsername }, { email: lowerEmail }],
    });
    if (existingUser) {
      if (isEqualTr(existingUser.username, lowerUsername)) {
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
      progress: initialProgress,
    });

    await user.save();
    const token = await sdk.createSessionToken(openId, { name: fullName.trim() });
    res.json({ success: true, token, user: { openId, name: fullName.trim(), username: lowerUsername, progress: initialProgress } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Kayıt işlemi başarısız." });
  }
});

authRouter.get("/check-username", async (req, res) => {
  try {
    const rawUsername = typeof req.query?.username === "string" ? req.query.username.trim() : "";
    if (!rawUsername || rawUsername.length < 4) {
      return res.status(400).json({ available: false, error: "Kullanıcı adı en az 4 karakter olmalıdır." });
    }
    await connectDb();
    const lowerUsername = normalizeTr(rawUsername);
    const existing = await UserModel.findOne({ username: lowerUsername });
    res.json({ available: !existing });
  } catch (err: any) {
    res.status(500).json({ available: false, error: "Kontrol edilemedi." });
  }
});

authRouter.post("/claim-guest", async (req, res) => {
  try {
    await connectDb();
    const user = await sdk.authenticateRequest(req);
    const guestToken = typeof req.body?.guestToken === "string" ? req.body.guestToken : "";
    const guestSession = await sdk.verifySession(guestToken);
    if (!guestSession?.openId.startsWith("guest_")) return res.status(400).json({ error: "Geçerli bir misafir oturumu bulunamadı." });
    const guest = await UserModel.findOneAndUpdate(
      { openId: guestSession.openId, guestClaimedBy: null },
      { $set: { guestClaimedBy: user.openId, updatedAt: new Date() } },
      { returnDocument: "before" }
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

authRouter.post("/login", async (req, res) => {
  try {
    await connectDb();
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Geçersiz giriş bilgileri." });
    }
    const { username, password } = parsed.data;
    const lowerIdentifier = normalizeTr(username);
    const user = await UserModel.findOne({
      $or: [{ username: lowerIdentifier }, { email: lowerIdentifier }],
    });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });
    }

    user.lastSignedIn = new Date();
    await user.save();

    const displayName = user.name || normalizeTrUpper(user.username || lowerIdentifier);
    const token = await sdk.createSessionToken(user.openId, { name: displayName });
    res.json({ success: true, token, user: { openId: user.openId, name: displayName, username: user.username, progress: user.progress } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Giriş işlemi başarısız." });
  }
});

authRouter.get("/me", async (req, res) => {
  try {
    await connectDb();
    const user = await sdk.authenticateRequest(req);
    if (!user) return res.status(401).json({ error: "Yetkisiz işlem." });
    const dbUser = await UserModel.findOne({ openId: user.openId });
    if (!dbUser) {
      return res.json({
        success: true,
        user: {
          openId: user.openId,
          name: user.name || "OYUNCU",
          username: user.name || "OYUNCU",
          progress: DEFAULT_PROGRESS,
        },
      });
    }
    if (dbUser.progress && (!Array.isArray(dbUser.progress.matchHistory) || dbUser.progress.matchHistory.length === 0)) {
      dbUser.progress.matchHistory = backfillMatchHistoryIfEmpty({ ...DEFAULT_PROGRESS, ...dbUser.progress });
      dbUser.updatedAt = new Date();
      await dbUser.save();
    }
    const displayName = dbUser.name || normalizeTrUpper(dbUser.username || "") || "OYUNCU";
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

authRouter.post("/sync-progress", async (req, res) => {
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
      const incomingShields = typeof progress.streakShields === "number" && Number.isFinite(progress.streakShields)
        ? Math.max(0, Math.min(99, progress.streakShields))
        : (currentProg.streakShields ?? 0);
      const incomingRadar = typeof progress.radarChargesBonus === "number" && Number.isFinite(progress.radarChargesBonus)
        ? Math.max(0, Math.min(99, progress.radarChargesBonus))
        : (currentProg.radarChargesBonus ?? 0);

      const nextCoins = currentProg.coins ?? 0;
      const nextShields = Math.max(currentProg.streakShields ?? 0, incomingShields);
      const nextRadar = Math.max(currentProg.radarChargesBonus ?? 0, incomingRadar);

      const isClaimingWelcome = !currentProg.welcomeRewardClaimed && Boolean(progress.welcomeRewardClaimed);
      const missingWelcomeCoins = isClaimingWelcome ? 50 : 0;
      const missingWelcomeShields = isClaimingWelcome ? 1 : 0;
      const missingWelcomeRadar = isClaimingWelcome ? 5 : 0;

      const todayId = getDayId();
      const isClaimingDailyLogin = Boolean(
        progress.lastLoginDay &&
        progress.lastLoginDay !== currentProg.lastLoginDay &&
        progress.lastLoginDay === todayId
      );
      let dailyLoginXpBonus = 0;
      if (isClaimingDailyLogin) {
        const dlResult = checkDailyLoginReward(currentProg, progress.lastLoginDay!);
        if (dlResult && dlResult.reward.rewardType === "xp") {
          dailyLoginXpBonus = dlResult.reward.amount;
        }
      }

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
        friends: currentProg.friends,
        welcomeRewardClaimed: currentProg.welcomeRewardClaimed || Boolean(progress.welcomeRewardClaimed),
        claimedMilestones: {
          ...(currentProg.claimedMilestones || {}),
          ...(progress.claimedMilestones || {}),
        },
        coins: Math.max(0, Math.min(2_000_000, nextCoins + missingWelcomeCoins)),
        streakShields: Math.max(0, Math.min(99, nextShields + missingWelcomeShields)),
        radarChargesBonus: Math.max(0, Math.min(99, nextRadar + missingWelcomeRadar)),
        lives: (() => {
          if (typeof progress.lives !== "number") return currentProg.lives;
          return Math.min(MAX_LIVES, Math.max(0, progress.lives));
        })(),
        lastLifeRegenTimestamp: typeof progress.lastLifeRegenTimestamp === "number" ? progress.lastLifeRegenTimestamp : currentProg.lastLifeRegenTimestamp,
        dailyCompletedId: progress.dailyCompletedId || currentProg.dailyCompletedId,
        lastStreakCheckDate: progress.lastStreakCheckDate || currentProg.lastStreakCheckDate,
        lastLoginDay: progress.lastLoginDay || currentProg.lastLoginDay,
        loginDaysCount: typeof progress.loginDaysCount === "number"
          ? Math.max(currentProg.loginDaysCount || 0, progress.loginDaysCount)
          : currentProg.loginDaysCount,
        dailyClaimed: { ...(currentProg.dailyClaimed || {}), ...(progress.dailyClaimed || {}) },
        weeklyClaimed: { ...(currentProg.weeklyClaimed || {}), ...(progress.weeklyClaimed || {}) },
        missions: (() => {
          const merged = { ...(currentProg.missions || {}) };
          const incoming = progress.missions || {};
          for (const [mId, val] of Object.entries(incoming)) {
            if (typeof val !== "number" || val < 0) continue;
            const catalogMission = findMissionById(mId);
            const cap = catalogMission ? catalogMission.target : (merged[mId] ?? 0);
            merged[mId] = Math.min(Math.max(merged[mId] ?? 0, Math.min(val, cap)), cap);
          }
          return merged;
        })(),
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
        xp: currentProg.xp + dailyLoginXpBonus,
        lp: currentProg.lp,
        wins: currentProg.wins,
        matches: currentProg.matches,
        streak: typeof progress.streak === "number" && Number.isFinite(progress.streak)
          ? Math.max(0, Math.min(3650, Math.floor(progress.streak)))
          : (currentProg.streak ?? 0),
        pvpWinStreak: currentProg.pvpWinStreak ?? 0,
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

authRouter.post("/delete-account", async (req, res) => {
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

authRouter.get("/get-progress", async (req, res) => {
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
