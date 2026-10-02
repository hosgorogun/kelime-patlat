import { Router } from "express";
import { z } from "zod";
import { sdk } from "../_core/sdk";
import {
  UserModel,
  connectDb,
  createFriendRequest,
  getPendingFriendRequests,
  updateFriendRequestStatus,
  findFriendRequestById,
} from "../db";
import { normalizeTr, isEqualTr } from "../../shared/tr-utils";

export const friendsRouter = Router();

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

friendsRouter.get("/requests/:userIdOrUsername", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const target = req.params.userIdOrUsername?.trim();
    if (!target) return res.status(400).json({ error: "Geçersiz parametre." });
    if (target !== user.openId && target !== user.username) {
      return res.status(403).json({ error: "Sadece kendi arkadaşlık isteklerinizi görebilirsiniz." });
    }
    await connectDb();
    const requests = await getPendingFriendRequests(target);
    res.json({ requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "İstekler alınamadı." });
  }
});

friendsRouter.post("/request", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const payload = z.object({
      toUsername: z.string().trim().min(1).max(64),
      fromPlayerId: z.string().trim().min(1).max(128),
      fromPlayerName: z.string().trim().min(1).max(64),
      profile: z.any().optional(),
    }).safeParse(req.body);

    if (!payload.success) return res.status(400).json({ error: "Geçersiz istek parametreleri." });
    const { toUsername, fromPlayerId, fromPlayerName, profile } = payload.data;

    if (fromPlayerId !== user.openId) {
      return res.status(403).json({ error: "Oyuncu kimliği bu oturuma ait değil." });
    }

    if (isEqualTr(toUsername, fromPlayerName) || isEqualTr(toUsername, profile?.username)) {
      return res.status(400).json({ error: "Kendinize arkadaşlık isteği gönderemezsiniz." });
    }

    await connectDb();
    const targetUser = await UserModel.findOne({
      $or: [
        { username: normalizeTr(toUsername) },
        { openId: toUsername },
        { name: new RegExp(`^${escapeRegex(toUsername)}$`, "i") },
      ],
    }).lean();

    const targetUserId = targetUser?.openId || toUsername;
    const targetUsernameClean = targetUser?.username || targetUser?.name || toUsername;
    const targetNameClean = targetUser?.name || targetUser?.username || toUsername;

    if (targetUser?.progress?.friends && Array.isArray(targetUser.progress.friends)) {
      const isAlreadyFriend = targetUser.progress.friends.some(
        (f: any) => (typeof f === "string" ? f === fromPlayerId : f.id === fromPlayerId || isEqualTr(f.username, profile?.username || fromPlayerName))
      );
      if (isAlreadyFriend) {
        return res.status(400).json({ error: "Bu kullanıcı zaten arkadaş listenizde." });
      }
    }

    const existingRequests = await getPendingFriendRequests(targetUserId);
    const alreadyPending = existingRequests.some(
      (r) => (r.fromUserId === fromPlayerId || isEqualTr(r.fromUsername, profile?.username || fromPlayerName)) && r.status === "pending"
    );
    if (alreadyPending) {
      return res.status(400).json({ error: "Bu kullanıcıya daha önce istek gönderilmiş." });
    }

    const newRequest = await createFriendRequest({
      fromUserId: fromPlayerId,
      fromUsername: profile?.username || fromPlayerName,
      fromName: fromPlayerName,
      fromAvatar: profile?.avatar || "spark",
      fromAvatarPhoto: profile?.avatarPhoto,
      fromSelectedTitle: profile?.selectedTitle || "[ÇAYLAK]",
      fromLevel: profile?.level || 1,
      fromTier: profile?.tier || "DEMİR",
      fromLp: profile?.lp || 0,
      fromXp: profile?.xp || 0,
      toUserId: targetUserId,
      toUsername: targetUsernameClean,
      toName: targetNameClean,
    });

    res.json({ success: true, message: `${targetNameClean} kullanıcısına arkadaşlık isteği gönderildi!`, request: newRequest });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "İstek oluşturulamadı." });
  }
});

friendsRouter.post("/respond", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const payload = z.object({
      requestId: z.string().trim().min(1),
      action: z.enum(["accept", "reject"]),
      playerId: z.string().trim().min(1),
      playerName: z.string().trim().optional(),
      profile: z.any().optional(),
    }).safeParse(req.body);

    if (!payload.success) return res.status(400).json({ error: "Geçersiz parametreler." });
    const { requestId, action, playerId, playerName, profile } = payload.data;

    if (playerId !== user.openId) {
      return res.status(403).json({ error: "Oyuncu kimliği bu oturuma ait değil." });
    }

    await connectDb();
    const reqDoc = await findFriendRequestById(requestId);
    if (!reqDoc) return res.status(404).json({ error: "İstek bulunamadı." });

    if (reqDoc.toUserId !== playerId) {
      return res.status(403).json({ error: "Bu isteği yanıtlama yetkiniz yok." });
    }
    if (reqDoc.status !== "pending") {
      return res.status(400).json({ error: "Bu istek zaten işlenmiş." });
    }

    if (action === "reject") {
      await updateFriendRequestStatus(requestId, "rejected");
      return res.json({ success: true, message: "İstek reddedildi." });
    }

    await updateFriendRequestStatus(requestId, "accepted");

    const friendForAcceptor = {
      id: reqDoc.fromUserId,
      name: reqDoc.fromName,
      username: reqDoc.fromUsername,
      avatar: reqDoc.fromAvatar || "spark",
      avatarPhoto: reqDoc.fromAvatarPhoto,
      selectedTitle: reqDoc.fromSelectedTitle || "[ÇAYLAK]",
      level: reqDoc.fromLevel || 1,
      tier: reqDoc.fromTier || "DEMİR",
      lp: reqDoc.fromLp || 0,
      xp: reqDoc.fromXp || 0,
      isOnline: true,
    };

    const friendForRequester = {
      id: playerId,
      name: playerName || reqDoc.toName || "OYUNCU",
      username: reqDoc.toUsername,
      avatar: profile?.avatar || "spark",
      avatarPhoto: profile?.avatarPhoto,
      selectedTitle: profile?.selectedTitle || "[ÇAYLAK]",
      level: profile?.level || 1,
      tier: profile?.tier || "DEMİR",
      lp: profile?.lp || 0,
      xp: profile?.xp || 0,
      isOnline: true,
    };

    await UserModel.findOneAndUpdate(
      { openId: reqDoc.toUserId },
      { $push: { "progress.friends": friendForAcceptor } }
    );
    await UserModel.findOneAndUpdate(
      { openId: reqDoc.fromUserId },
      { $push: { "progress.friends": friendForRequester } }
    );

    res.json({
      success: true,
      message: `${friendForAcceptor.name} ile artık arkadaşsınız!`,
      newFriend: friendForAcceptor,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "İşlem gerçekleştirilemedi." });
  }
});
