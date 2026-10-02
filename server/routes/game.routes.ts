import { Router } from "express";
import { z } from "zod";
import { sdk } from "../_core/sdk";
import { UserModel, connectDb } from "../db";
import { loadLeaderboard } from "../game/mongo-store";
import {
  AVATARS,
  applyArcadeProgress,
  applyMatchProgress,
  applyVintageProgress,
  completeDailyProgress,
  DEFAULT_PROGRESS,
  getDailyChallenge,
  SEASON_MISSIONS,
  findMissionById,
  getLeagueTier,
  buyLives,
  getCalculatedLives,
  MAX_LIVES,
  MILESTONE_REWARDS,
  checkDailyLoginReward,
  getDayId,
  type PlayerProgress,
} from "../../shared/progression";
import { CHIP_EQUIPMENT_ITEMS, PROFILE_FRAMES, VICTORY_EFFECTS, BOARD_SKINS } from "../../shared/store-items";
import type { LeaderboardEntry } from "../../shared/game";

export const gameRouter = Router();

gameRouter.post("/daily-login", async (req, res) => {
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

gameRouter.post(["/award", "/reward"], async (req, res) => {
  const payload = z.object({
    awardId: z.string().trim().min(8).max(128),
    kind: z.enum(["solo", "arcade", "vintage"]),
    level: z.number().int().min(1).max(100).optional(),
    score: z.number().int().min(0).max(50000).optional(),
    foundWords: z.array(z.string().max(32)).max(64).optional(),
    daily: z.boolean().optional(),
    dailyId: z.string().max(32).optional(),
    wordsCount: z.number().int().min(0).max(1000).optional(),
    comboCount: z.number().int().min(0).max(500).optional(),
    isDoubled: z.boolean().optional(),
  }).safeParse(req.body);
  if (!payload.success) return res.status(400).json({ error: "Geçersiz ödül isteği." });
  try {
    await connectDb();
    const user = await sdk.authenticateRequest(req);
    const dbUser = await UserModel.findOneAndUpdate(
      { openId: user.openId, processedAwardIds: { $ne: payload.data.awardId } },
      { $push: { processedAwardIds: { $each: [payload.data.awardId], $slice: -200 } } },
      { returnDocument: "after" }
    );
    if (!dbUser) return res.status(409).json({ error: "Bu ödül isteği daha önce işlendi." });
    const current = { ...DEFAULT_PROGRESS, ...(dbUser?.progress ?? {}) } as PlayerProgress;

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

    if (payload.data.daily) {
      const todayId = getDayId();
      if (payload.data.dailyId && current.dailyCompletedId === payload.data.dailyId) {
        return res.status(409).json({ error: "Bu günlük ödülü zaten işlendi." });
      }
      if (payload.data.dailyId && payload.data.dailyId === todayId && current.dailyCompletedId === todayId) {
        return res.status(409).json({ error: "Bugünün günlük ödülü zaten işlendi." });
      }
    }

    const SCORE_CAPS: Record<string, number> = { solo: 5000, arcade: 50000, vintage: 20000 };
    const scoreCap = SCORE_CAPS[payload.data.kind] ?? 5000;
    if ((payload.data.score ?? 0) > scoreCap) {
      return res.status(400).json({ error: "Geçersiz ödül isteği." });
    }

    const score = payload.data.score ?? ((payload.data.level ?? 1) * 14);
    const foundWords = payload.data.foundWords ?? [];
    const wordsCount = payload.data.wordsCount ?? foundWords.length;
    const dailyDate = payload.data.dailyId ? new Date(`${payload.data.dailyId}T12:00:00Z`) : new Date();
    const next = payload.data.kind === "arcade"
      ? applyArcadeProgress(current, payload.data.score ?? 0, wordsCount, payload.data.isDoubled, payload.data.comboCount, foundWords)
      : payload.data.kind === "vintage"
      ? applyVintageProgress(current, payload.data.level ?? 1, payload.data.score ?? 30, wordsCount || 5, foundWords)
      : payload.data.daily
      ? completeDailyProgress(
          {
            ...current,
            history: Array.from(new Set([...(current.history || []), ...foundWords])).slice(-150),
          },
          getDailyChallenge(isNaN(dailyDate.getTime()) ? new Date() : dailyDate),
          score,
          wordsCount,
          foundWords
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

gameRouter.post("/claim", async (req, res) => {
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

gameRouter.post("/milestone", async (req, res) => {
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

gameRouter.post("/shop-buy", async (req, res) => {
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
      return res.status(400).json({ error: `Yetersiz çip! Bu ürün için ${item.cost} altın çip gerekiyor.` });
    }

    let next = { ...current, coins: currentCoins - item.cost };
    if (item.rewardType === "lives") {
      const calc = getCalculatedLives(current);
      if (calc.isInfinite) {
        return res.status(400).json({ error: "Sonsuz can süreniz devam ediyor!" });
      }
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

gameRouter.post(["/buy-lives", "/lives"], async (req, res) => {
  const payload = z.object({ option: z.enum(["one", "all", "ad"]) }).safeParse(req.body);
  if (!payload.success) return res.status(400).json({ error: "Geçersiz can alma isteği." });
  try {
    await connectDb();
    const user = await sdk.authenticateRequest(req);
    const dbUser = await UserModel.findOne({ openId: user.openId });
    if (!dbUser) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    const current = { ...DEFAULT_PROGRESS, ...(dbUser.progress ?? {}) } as PlayerProgress;
    const result = buyLives(current, payload.data.option);
    if (!result.success) return res.status(400).json({ error: result.message });
    dbUser.progress = result.updatedProgress;
    dbUser.updatedAt = new Date();
    await dbUser.save();
    res.json({ success: true, message: result.message, progress: result.updatedProgress });
  } catch (err: any) {
    res.status(err?.status === 403 ? 401 : 500).json({ error: err?.message || "Can işlemi başarısız." });
  }
});

gameRouter.post("/spend-coins", async (req, res) => {
  const payload = z.object({ amount: z.number().int().min(1).max(5000), reason: z.string().max(64).optional() }).safeParse(req.body);
  if (!payload.success) return res.status(400).json({ error: "Geçersiz harcama miktarı." });
  try {
    await connectDb();
    const user = await sdk.authenticateRequest(req);
    const dbUser = await UserModel.findOne({ openId: user.openId });
    if (!dbUser) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    const current = { ...DEFAULT_PROGRESS, ...(dbUser.progress ?? {}) } as PlayerProgress;
    const currentCoins = current.coins ?? 0;
    if (currentCoins < payload.data.amount) {
      return res.status(400).json({ error: "Yetersiz çip!" });
    }
    const nextProgress = { ...current, coins: currentCoins - payload.data.amount };
    dbUser.progress = nextProgress;
    dbUser.updatedAt = new Date();
    await dbUser.save();
    res.json({ success: true, progress: nextProgress });
  } catch (err: any) {
    res.status(err?.status === 403 ? 401 : 500).json({ error: err?.message || "Harcama işlemi başarısız." });
  }
});

gameRouter.post("/cosmetic-buy", async (req, res) => {
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
      return res.status(400).json({ error: `Yetersiz çip! Bu kozmetik için ${effectiveCost} altın çip gerekiyor.` });
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

gameRouter.get("/leaderboard", async (_req, res) => {
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
  } catch (_err: any) {
    try {
      const fallback = await loadLeaderboard();
      return res.json({ leaderboard: fallback });
    } catch {
      res.status(500).json({ error: "Liderlik tablosu alınamadı." });
    }
  }
});
