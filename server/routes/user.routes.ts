import { Router } from "express";
import { UserModel, connectDb } from "../db";
import { ProfileModel } from "../game/mongo-store";
import { normalizeTr } from "../../shared/tr-utils";
import { getLeagueTier, getPlayerLevel, type PlayerProgress } from "../../shared/progression";

export const userRouter = Router();

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

userRouter.get("/profile/:idOrName", async (req, res) => {
  try {
    const idOrName = req.params.idOrName?.trim();
    if (!idOrName || idOrName.length > 64) return res.status(400).json({ error: "Geçersiz arama parametresi." });

    if (idOrName.startsWith("bot:") || normalizeTr(idOrName).includes("bot")) {
      return res.json({
        id: idOrName,
        name: "KELİME BOT",
        username: "kelime_bot",
        isBot: true,
        avatar: "🤖",
        selectedTitle: "[KELİME İZCİSİ]",
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
    const user = await UserModel.findOne({
      $or: [
        { openId: idOrName },
        { username: normalizeTr(idOrName) },
        { name: new RegExp(`^${escapeRegex(idOrName)}$`, "i") },
      ],
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
        selectedFrame: prog.selectedFrame || "signal",
        level: getPlayerLevel(prog.xp || 0),
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

    const profile = await ProfileModel.findOne({
      $or: [
        { playerId: idOrName },
        { name: new RegExp(`^${escapeRegex(idOrName)}$`, "i") },
      ],
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
        selectedFrame: prog.selectedFrame || "signal",
        level: getPlayerLevel(prog.xp || 0),
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
