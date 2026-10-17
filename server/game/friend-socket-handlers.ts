import type { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import { z } from "zod";
import type { BoardSize } from "../../shared/game";
import { normalizeTr, isEqualTr } from "../../shared/tr-utils";
import {
  UserModel,
  createFriendRequest,
  getPendingFriendRequests,
  updateFriendRequestStatus,
  findFriendRequestById,
} from "../db";
import { registerUserSocket, getSocketsForUser, isUserOnline } from "./user-socket-registry";
import type { Room } from "./types";
import { emitRoom } from "./room-snapshot";
import type { playerProfileSchema } from "./schemas";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const pendingDuelInvites = new Map<string, { fromPlayerId: string; roomCode: string; expiresAt: number }>();

export function registerFriendSocketHandlers(
  io: Server,
  socket: Socket,
  ownsPlayerId: (playerId: string) => boolean,
  rooms: Map<string, Room>
) {
  socket.on("player:identify", (payload: { playerId: string; username?: string }) => {
    if (payload?.playerId && ownsPlayerId(payload.playerId)) {
      registerUserSocket(payload.playerId, socket.id);
    }
    if (payload?.username && ownsPlayerId(payload.username)) {
      registerUserSocket(payload.username, socket.id);
    }
  });

  socket.on(
    "friend:request:send",
    async (payload: {
      toUsername: string;
      fromPlayerId: string;
      fromPlayerName: string;
      profile?: any;
    }) => {
      try {
        const toUsername = payload?.toUsername?.trim();
        if (!toUsername) {
          return socket.emit("friend:error", { message: "Geçerli bir kullanıcı adı girin." });
        }
        if (!ownsPlayerId(payload.fromPlayerId)) {
          return socket.emit("friend:error", { message: "Oyuncu kimliği bu oturuma ait değil." });
        }
        const fromId = payload.fromPlayerId;
        const fromName = payload.fromPlayerName || "OYUNCU";
        const fromUsername = payload.profile?.username || fromName;

        registerUserSocket(fromId, socket.id);
        registerUserSocket(fromUsername, socket.id);

        if (isEqualTr(toUsername, fromName) || isEqualTr(toUsername, fromUsername)) {
          return socket.emit("friend:error", { message: "Kendinize arkadaşlık isteği gönderemezsiniz." });
        }

        let targetUser: any = null;
        if (mongoose.connection.readyState === 1) {
          try {
            targetUser = await UserModel.findOne({
              $or: [
                { username: normalizeTr(toUsername) },
                { openId: toUsername },
                { name: new RegExp(`^${escapeRegex(toUsername)}$`, "i") },
              ],
            }).lean();
          } catch (e) {
            console.warn("[Friend] UserModel.findOne error:", e);
          }
        }

        const targetUserId = targetUser?.openId || toUsername;
        const targetUsernameClean = targetUser?.username || targetUser?.name || toUsername;
        const targetNameClean = targetUser?.name || targetUser?.username || toUsername;

        if (targetUser?.progress?.friends && Array.isArray(targetUser.progress.friends)) {
          const isAlreadyFriend = targetUser.progress.friends.some(
            (f: any) =>
              typeof f === "string" ? f === fromId : f.id === fromId || isEqualTr(f.username, fromUsername)
          );
          if (isAlreadyFriend) {
            return socket.emit("friend:error", { message: "Bu kullanıcı zaten arkadaş listenizde." });
          }
        }

        const existingRequests = await getPendingFriendRequests(targetUserId);
        const alreadyPending = existingRequests.some(
          (r) => (r.fromUserId === fromId || isEqualTr(r.fromUsername, fromUsername)) && r.status === "pending"
        );
        if (alreadyPending) {
          return socket.emit("friend:error", { message: "Bu kullanıcıya daha önce istek gönderilmiş." });
        }

        const incomingRequests = [
          ...(await getPendingFriendRequests(fromId)),
          ...(fromUsername ? await getPendingFriendRequests(fromUsername) : []),
          ...(fromName ? await getPendingFriendRequests(fromName) : []),
        ];
        const existingReverseReq = incomingRequests.find(
          (r) =>
            (r.fromUserId === targetUserId ||
              isEqualTr(r.fromUsername, toUsername) ||
              isEqualTr(r.fromUsername, targetUsernameClean) ||
              isEqualTr(r.fromName, toUsername) ||
              isEqualTr(r.fromName, targetNameClean)) &&
            r.status === "pending"
        );
        if (existingReverseReq) {
          await updateFriendRequestStatus(existingReverseReq.id, "accepted");
          const friendForAcceptor = {
            id: existingReverseReq.fromUserId || targetUserId,
            name: existingReverseReq.fromName || targetNameClean,
            username: existingReverseReq.fromUsername || targetUsernameClean,
            avatar: existingReverseReq.fromAvatar || targetUser?.progress?.selectedAvatar || "🎮",
            avatarPhoto: existingReverseReq.fromAvatarPhoto || targetUser?.progress?.avatarPhoto,
            selectedTitle: existingReverseReq.fromSelectedTitle || targetUser?.progress?.selectedTitle || "[ÇAYLAK]",
            level: existingReverseReq.fromLevel || targetUser?.progress?.level || 1,
            tier: existingReverseReq.fromTier || targetUser?.progress?.tier || "DEMİR",
            lp: existingReverseReq.fromLp || targetUser?.progress?.lp || 0,
            xp: existingReverseReq.fromXp || targetUser?.progress?.xp || 0,
            isOnline: isUserOnline(existingReverseReq.fromUserId) || isUserOnline(targetUserId),
          };
          const friendForRequester = {
            id: fromId,
            name: fromName,
            username: fromUsername,
            avatar: payload.profile?.avatar || "spark",
            avatarPhoto: payload.profile?.avatarPhoto,
            selectedTitle: payload.profile?.selectedTitle || "[ÇAYLAK]",
            level: payload.profile?.level || 1,
            tier: payload.profile?.tier || "DEMİR",
            lp: payload.profile?.lp || 0,
            xp: payload.profile?.xp || 0,
            isOnline: true,
          };

          if (mongoose.connection.readyState === 1) {
            try {
              await UserModel.findOneAndUpdate(
                { openId: fromId },
                { $pull: { "progress.friends": { id: friendForAcceptor.id } } }
              );
              await UserModel.findOneAndUpdate(
                { openId: fromId },
                { $push: { "progress.friends": friendForAcceptor } }
              );
              await UserModel.findOneAndUpdate(
                { openId: targetUserId },
                { $pull: { "progress.friends": { id: friendForRequester.id } } }
              );
              await UserModel.findOneAndUpdate(
                { openId: targetUserId },
                { $push: { "progress.friends": friendForRequester } }
              );
            } catch (e) {
              console.warn("[Friend] Mutual accept DB update error:", e);
            }
          }

          const acceptorSockets = [
            ...getSocketsForUser(fromId),
            ...getSocketsForUser(fromUsername),
          ];
          for (const sId of Array.from(new Set(acceptorSockets))) {
            io.to(sId).emit("friend:request:accepted", {
              requestId: existingReverseReq.id,
              newFriend: friendForAcceptor,
              message: `${friendForAcceptor.name} ile karşılıklı arkadaş oldunuz! 🎉`,
            });
          }

          const requesterSockets = [
            ...getSocketsForUser(existingReverseReq.fromUserId),
            ...getSocketsForUser(existingReverseReq.fromUsername),
            ...getSocketsForUser(targetUserId),
            ...getSocketsForUser(targetUsernameClean),
          ];
          for (const sId of Array.from(new Set(requesterSockets))) {
            io.to(sId).emit("friend:request:accepted", {
              requestId: existingReverseReq.id,
              newFriend: friendForRequester,
              message: `${friendForRequester.name} arkadaşlık isteğinizi kabul etti! 🎉`,
            });
          }
          return;
        }

        const newRequest = await createFriendRequest({
          fromUserId: fromId,
          fromUsername: fromUsername,
          fromName: fromName,
          fromAvatar: payload.profile?.avatar || "spark",
          fromAvatarPhoto: payload.profile?.avatarPhoto,
          fromSelectedTitle: payload.profile?.selectedTitle || "[ÇAYLAK]",
          fromLevel: payload.profile?.level || 1,
          fromTier: payload.profile?.tier || "DEMİR",
          fromLp: payload.profile?.lp || 0,
          fromXp: payload.profile?.xp || 0,
          toUserId: targetUserId,
          toUsername: targetUsernameClean,
          toName: targetNameClean,
        });

        socket.emit("friend:request:sent", {
          success: true,
          message: `${targetNameClean} kullanıcısına arkadaşlık isteği gönderildi!`,
          request: newRequest,
        });

        const targetSockets = [
          ...getSocketsForUser(targetUserId),
          ...getSocketsForUser(targetUsernameClean),
          ...getSocketsForUser(toUsername),
        ];
        const uniqueTargetSockets = Array.from(new Set(targetSockets));
        for (const sId of uniqueTargetSockets) {
          io.to(sId).emit("friend:request:received", newRequest);
        }
      } catch (err: any) {
        socket.emit("friend:error", { message: err?.message || "İstek gönderilemedi." });
      }
    }
  );

  socket.on("friend:requests:get", async (payload: { playerId: string; username?: string }) => {
    try {
      if (!payload?.playerId) return;
      if (!ownsPlayerId(payload.playerId)) {
        return socket.emit("friend:error", { message: "Oyuncu kimliği bu oturuma ait değil." });
      }
      registerUserSocket(payload.playerId, socket.id);
      if (payload.username && ownsPlayerId(payload.username)) registerUserSocket(payload.username, socket.id);

      const requestsByUserId = await getPendingFriendRequests(payload.playerId);
      let requestsByUsername: any[] = [];
      if (payload.username) {
        requestsByUsername = await getPendingFriendRequests(payload.username);
      }

      const map = new Map<string, any>();
      requestsByUserId.forEach((r) => map.set(r.id, r));
      requestsByUsername.forEach((r) => map.set(r.id, r));

      socket.emit("friend:requests:list", Array.from(map.values()));
    } catch {
      socket.emit("friend:requests:list", []);
    }
  });

  socket.on(
    "friend:request:respond",
    async (payload: {
      requestId: string;
      action: "accept" | "reject";
      playerId: string;
      playerName?: string;
      profile?: any;
    }) => {
      try {
        const { requestId, action, playerId } = payload;
        if (!ownsPlayerId(playerId)) {
          return socket.emit("friend:error", { message: "Oyuncu kimliği bu oturuma ait değil." });
        }
        const req = await findFriendRequestById(requestId);
        if (!req) {
          return socket.emit("friend:error", { message: "İstek bulunamadı." });
        }
        const isAuthorized =
          req.toUserId === playerId ||
          isEqualTr(req.toUserId, playerId) ||
          isEqualTr(req.toUsername, playerId) ||
          getSocketsForUser(req.toUserId).includes(socket.id) ||
          getSocketsForUser(req.toUsername).includes(socket.id) ||
          (payload.playerName && (isEqualTr(req.toUserId, payload.playerName) || isEqualTr(req.toUsername, payload.playerName))) ||
          (payload.profile?.username && (isEqualTr(req.toUserId, payload.profile.username) || isEqualTr(req.toUsername, payload.profile.username)));

        if (!isAuthorized) {
          return socket.emit("friend:error", { message: "Bu isteği yanıtlama yetkiniz yok." });
        }
        if (req.status !== "pending") {
          return socket.emit("friend:error", { message: "Bu istek zaten işlenmiş." });
        }

        if (action === "reject") {
          await updateFriendRequestStatus(requestId, "rejected");
          const acceptorSockets = [
            ...getSocketsForUser(playerId),
            ...(payload.playerName ? getSocketsForUser(payload.playerName) : []),
            ...(payload.profile?.username ? getSocketsForUser(payload.profile.username) : []),
          ];
          for (const sId of Array.from(new Set(acceptorSockets))) {
            io.to(sId).emit("friend:request:rejected", { requestId, success: true });
          }
          return;
        }

        if (action === "accept") {
          await updateFriendRequestStatus(requestId, "accepted");

          const friendForAcceptor = {
            id: req.fromUserId,
            name: req.fromName,
            username: req.fromUsername,
            avatar: req.fromAvatar || "spark",
            avatarPhoto: req.fromAvatarPhoto,
            selectedTitle: req.fromSelectedTitle || "[ÇAYLAK]",
            level: req.fromLevel || 1,
            tier: req.fromTier || "DEMİR",
            lp: req.fromLp || 0,
            xp: req.fromXp || 0,
            isOnline: true,
          };

          const friendForRequester = {
            id: playerId,
            name: payload.playerName || req.toName || "OYUNCU",
            username: req.toUsername,
            avatar: payload.profile?.avatar || "spark",
            avatarPhoto: payload.profile?.avatarPhoto,
            selectedTitle: payload.profile?.selectedTitle || "[ÇAYLAK]",
            level: payload.profile?.level || 1,
            tier: payload.profile?.tier || "DEMİR",
            lp: payload.profile?.lp || 0,
            xp: payload.profile?.xp || 0,
            isOnline: true,
          };

          if (mongoose.connection.readyState === 1) {
            try {
              await UserModel.findOneAndUpdate(
                { openId: playerId },
                { $pull: { "progress.friends": { id: friendForAcceptor.id } } }
              );
              await UserModel.findOneAndUpdate(
                { openId: playerId },
                { $push: { "progress.friends": friendForAcceptor } }
              );
              await UserModel.findOneAndUpdate(
                { openId: req.fromUserId },
                { $pull: { "progress.friends": { id: friendForRequester.id } } }
              );
              await UserModel.findOneAndUpdate(
                { openId: req.fromUserId },
                { $push: { "progress.friends": friendForRequester } }
              );
            } catch (e) {
              console.warn("[Friend] DB update friends error:", e);
            }
          }

          const acceptorSockets = [
            ...getSocketsForUser(playerId),
            ...(payload.playerName ? getSocketsForUser(payload.playerName) : []),
            ...(payload.profile?.username ? getSocketsForUser(payload.profile.username) : []),
          ];
          for (const sId of Array.from(new Set(acceptorSockets))) {
            io.to(sId).emit("friend:request:accepted", {
              requestId,
              newFriend: friendForAcceptor,
              message: `${friendForAcceptor.name} ile artık arkadaşsınız!`,
            });
          }

          const requesterSockets = [
            ...getSocketsForUser(req.fromUserId),
            ...getSocketsForUser(req.fromUsername),
          ];
          const uniqueRequesterSockets = Array.from(new Set(requesterSockets));
          for (const sId of uniqueRequesterSockets) {
            io.to(sId).emit("friend:request:accepted", {
              requestId,
              newFriend: friendForRequester,
              message: `${friendForRequester.name} arkadaşlık isteğinizi kabul etti!`,
            });
          }
        }
      } catch (err: any) {
        socket.emit("friend:error", { message: err?.message || "İşlem gerçekleştirilemedi." });
      }
    }
  );

  socket.on("friend:remove", async (payload: { friendId: string; playerId: string }) => {
    try {
      const { friendId, playerId } = payload;
      if (!ownsPlayerId(playerId)) {
        return socket.emit("friend:error", { message: "Oyuncu kimliği bu oturuma ait değil." });
      }

      let targetOpenId = friendId;
      let targetUsername = friendId;
      if (mongoose.connection.readyState === 1) {
        try {
          const friendUser = await UserModel.findOne({
            $or: [{ openId: friendId }, { username: normalizeTr(friendId) }],
          }).lean();
          if (friendUser?.openId) targetOpenId = friendUser.openId;
          if (friendUser?.username) targetUsername = friendUser.username;

          await UserModel.findOneAndUpdate(
            { openId: playerId },
            { $pull: { "progress.friends": { $or: [{ id: { $in: [friendId, targetOpenId] } }, { username: { $in: [friendId, targetUsername] } }] } as any } }
          );
          await UserModel.findOneAndUpdate(
            { openId: targetOpenId },
            { $pull: { "progress.friends": { $or: [{ id: playerId }, { username: playerId }] } as any } }
          );
        } catch (e) {
          console.warn("[Friend] DB remove friend error:", e);
        }
      }

      const mySockets = getSocketsForUser(playerId);
      for (const sId of mySockets) {
        io.to(sId).emit("friend:removed", { friendId, success: true });
      }

      const friendSockets = [
        ...getSocketsForUser(friendId),
        ...getSocketsForUser(targetOpenId),
        ...getSocketsForUser(targetUsername),
      ];
      for (const sId of Array.from(new Set(friendSockets))) {
        io.to(sId).emit("friend:removed", { friendId: playerId, success: true });
      }
    } catch (err: any) {
      socket.emit("friend:error", { message: err?.message || "Arkadaş silinemedi." });
    }
  });

  socket.on(
    "friend:duel:invite",
    async (payload: {
      toPlayerId: string;
      toUsername?: string;
      fromPlayerId: string;
      fromPlayerName: string;
      roomCode: string;
      size: BoardSize;
      botProfile?: z.infer<typeof playerProfileSchema>;
    }) => {
      const { toPlayerId, toUsername, fromPlayerId, fromPlayerName, roomCode, size, botProfile } = payload;
      if (!ownsPlayerId(fromPlayerId)) {
        return socket.emit("friend:duel:failed", { message: "Oyuncu kimliği bu oturuma ait değil." });
      }
      const targetSockets = [
        ...getSocketsForUser(toPlayerId),
        ...(toUsername ? getSocketsForUser(toUsername) : []),
      ];
      const uniqueSockets = Array.from(new Set(targetSockets));

      let isTargetBusy = false;
      for (const r of rooms.values()) {
        if (r.status === "playing" && (r.host.id === toPlayerId || r.guest?.id === toPlayerId)) {
          isTargetBusy = true;
          break;
        }
      }
      if (isTargetBusy) {
        return socket.emit("friend:duel:failed", {
          message: `${toUsername || "Arkadaşınız"} şu anda başka bir canlı düelloda oynuyor.`,
        });
      }

      if (uniqueSockets.length === 0) {
        const isMockFriend =
          /^f\d+$/.test(toPlayerId) || toPlayerId.startsWith("mock") || toPlayerId.startsWith("bot");
        if (isMockFriend) {
          const room = rooms.get(roomCode);
          if (room && room.status === "waiting" && !room.guest) {
            socket.emit("friend:duel:sent", {
              success: true,
              message: `${toUsername || "Arkadaşınız"} daveti aldı, katılıyor...`,
            });
            setTimeout(() => {
              const currentRoom = rooms.get(roomCode);
              if (currentRoom && currentRoom.status === "waiting" && !currentRoom.guest) {
                const friendName = toUsername || "Arkadaş";
                const bp = botProfile;
                currentRoom.guest = {
                  id: toPlayerId.startsWith("bot:")
                    ? toPlayerId
                    : toPlayerId.startsWith("friend:")
                    ? toPlayerId
                    : `friend:${toPlayerId}`,
                  name: friendName,
                  isBot: true,
                  socketId: null,
                  connected: true,
                  ready: true,
                  rematch: false,
                  selectedTitle: bp?.selectedTitle || "[DÜELLOCU]",
                  avatar: bp?.avatar || "⚡",
                  avatarPhoto: bp?.avatarPhoto,
                  selectedFrame: bp?.selectedFrame || "signal",
                  level: bp?.level || 15,
                  tier: bp?.tier || "BRONZ",
                  lp: bp?.lp || 100,
                  wins: bp?.wins || 10,
                  matches: bp?.matches || 20,
                  streak: bp?.streak || 0,
                  bestScore: bp?.bestScore || 200,
                  bestTempo: bp?.bestTempo || 20,
                };
                currentRoom.status = "lobby";
                currentRoom.message = `${friendName} düello davetini kabul etti!`;
                socket.emit("friend:duel:accepted", { fromPlayerName: friendName, roomCode });
                emitRoom(io, currentRoom);
              }
            }, 1600);
            return;
          }
        }

        if (mongoose.connection.readyState === 1) {
          try {
            const targetUser = await UserModel.findOne({
              $or: [{ openId: toPlayerId }, { username: normalizeTr(toUsername || toPlayerId) }],
            }).lean();
            if (targetUser?.pushToken) {
              fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: targetUser.pushToken,
                  sound: "default",
                  title: "⚔️ YENİ DÜELLO DAVETİ!",
                  body: `${fromPlayerName} seni Kelime Patlat düellosuna davet etti! Oda Kodu: ${roomCode}`,
                  data: { screen: "friends", roomCode },
                }),
              }).catch((e) => console.warn("[FriendPush] Push dispatch error:", e));

              socket.emit("friend:duel:sent", {
                success: true,
                message: `${toUsername || "Arkadaşınız"} çevrim dışı ancak telefonuna anlık düello bildirimi gönderildi! 📲`,
              });
              return;
            }
          } catch (e) {
            console.warn("[FriendPush] DB lookup error:", e);
          }
        }

        socket.emit("friend:duel:failed", { message: "Arkadaşınız şu an çevrim dışı görünüyor." });
        return;
      }

      // Prune expired invites if memory grows
      if (pendingDuelInvites.size > 200) {
        const now = Date.now();
        for (const [k, v] of pendingDuelInvites) {
          if (v.expiresAt < now) pendingDuelInvites.delete(k);
        }
      }

      for (const sId of uniqueSockets) {
        pendingDuelInvites.set(sId, { fromPlayerId, roomCode, expiresAt: Date.now() + 60_000 });
        io.to(sId).emit("friend:duel:incoming", {
          fromPlayerId,
          fromPlayerName,
          roomCode,
          size,
        });
      }

      socket.emit("friend:duel:sent", { success: true, message: "Düello daveti gönderildi!" });
    }
  );

  socket.on(
    "friend:duel:respond",
    (payload: {
      toPlayerId: string;
      fromPlayerName: string;
      roomCode: string;
      accepted: boolean;
    }) => {
      const { toPlayerId, fromPlayerName, roomCode, accepted } = payload;
      const pendingInvite = pendingDuelInvites.get(socket.id);
      const room = rooms.get(roomCode);
      const isAuthorized =
        (pendingInvite && pendingInvite.fromPlayerId === toPlayerId && pendingInvite.roomCode === roomCode) ||
        (room && (room.status === "waiting" || room.status === "lobby") && room.host.id === toPlayerId);

      if (!isAuthorized) {
        return socket.emit("friend:duel:failed", { message: "Bu daveti yanıtlama yetkiniz yok." });
      }
      if (pendingInvite && pendingInvite.expiresAt < Date.now()) {
        pendingDuelInvites.delete(socket.id);
        return socket.emit("friend:duel:failed", { message: "Bu davetin süresi dolmuş." });
      }
      pendingDuelInvites.delete(socket.id);
      const targetSockets = getSocketsForUser(toPlayerId);
      for (const sId of targetSockets) {
        if (accepted) {
          io.to(sId).emit("friend:duel:accepted", { fromPlayerName, roomCode });
        } else {
          io.to(sId).emit("friend:duel:rejected", { fromPlayerName, roomCode });
        }
      }
    }
  );

  socket.on("friends:status:get", (payload: { userIds: string[] }) => {
    if (!payload?.userIds || !Array.isArray(payload.userIds)) return;
    const statuses: Record<string, boolean> = {};
    for (const id of payload.userIds) {
      if (id) {
        statuses[id] = isUserOnline(id);
      }
    }
    socket.emit("friends:status:update", { statuses });
  });

  socket.on("disconnect", () => {
    pendingDuelInvites.delete(socket.id);
  });
}
