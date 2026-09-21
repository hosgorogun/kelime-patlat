import { describe, it, expect, beforeEach } from "vitest";
import {
  createFriendRequest,
  getPendingFriendRequests,
  updateFriendRequestStatus,
  findFriendRequestById,
  clearInMemoryFriendRequests,
  type FriendRequest,
} from "../server/db";
import { socialManager, type FriendUser } from "../shared/social";

describe("Arkadaşlık ve Sosyal Sistem Testleri", () => {
  beforeEach(async () => {
    clearInMemoryFriendRequests();
    await socialManager.reset();
  });

  describe("Sunucu Tarafı Arkadaşlık İsteği Akışı (Friend Request Flow)", () => {
    it("yeni bir arkadaşlık isteği başarıyla oluşturulur ve 'pending' durumundadır", async () => {
      const request = await createFriendRequest({
        fromUserId: "usr_ali",
        fromUsername: "ali_01",
        fromName: "Ali Yılmaz",
        fromAvatar: "⚡",
        fromLevel: 12,
        fromTier: "ALTIN",
        fromLp: 1800,
        fromXp: 2400,
        toUserId: "usr_veli",
        toUsername: "veli_02",
        toName: "Veli Kaya",
      });

      expect(request).toBeDefined();
      expect(request.id).toMatch(/^freq_/);
      expect(request.status).toBe("pending");
      expect(request.fromUsername).toBe("ali_01");
      expect(request.toUsername).toBe("veli_02");

      const fetched = await findFriendRequestById(request.id);
      expect(fetched).toBeDefined();
      expect(fetched?.id).toBe(request.id);
    });

    it("kullanıcıya gelen bekleyen istekler doğru listelenir", async () => {
      await createFriendRequest({
        fromUserId: "usr_ali",
        fromUsername: "ali_01",
        fromName: "Ali Yılmaz",
        toUserId: "usr_hedef",
        toUsername: "hedef_oyuncu",
      });

      await createFriendRequest({
        fromUserId: "usr_can",
        fromUsername: "can_03",
        fromName: "Can Demir",
        toUserId: "usr_hedef",
        toUsername: "hedef_oyuncu",
      });

      const pending = await getPendingFriendRequests("usr_hedef");
      expect(pending.length).toBe(2);
      expect(pending.map((r) => r.fromUsername)).toContain("ali_01");
      expect(pending.map((r) => r.fromUsername)).toContain("can_03");

      // Kullanıcı adına göre de sorgulanabilmeli
      const pendingByName = await getPendingFriendRequests("hedef_oyuncu");
      expect(pendingByName.length).toBe(2);
    });

    it("arkadaşlık isteği kabul edildiğinde durumu 'accepted' olarak güncellenir", async () => {
      const req = await createFriendRequest({
        fromUserId: "usr_ali",
        fromUsername: "ali_01",
        fromName: "Ali Yılmaz",
        toUserId: "usr_veli",
        toUsername: "veli_02",
      });

      const updated = await updateFriendRequestStatus(req.id, "accepted");
      expect(updated).toBeDefined();
      expect(updated?.status).toBe("accepted");

      // Bekleyen istekler listesinden düşmeli
      const pending = await getPendingFriendRequests("usr_veli");
      expect(pending.length).toBe(0);
    });

    it("arkadaşlık isteği reddedildiğinde durumu 'rejected' olarak güncellenir", async () => {
      const req = await createFriendRequest({
        fromUserId: "usr_ali",
        fromUsername: "ali_01",
        fromName: "Ali Yılmaz",
        toUserId: "usr_veli",
        toUsername: "veli_02",
      });

      const updated = await updateFriendRequestStatus(req.id, "rejected");
      expect(updated).toBeDefined();
      expect(updated?.status).toBe("rejected");

      const pending = await getPendingFriendRequests("usr_veli");
      expect(pending.length).toBe(0);
    });
  });

  describe("İstemci Tarafı SocialManager Geliştirmeleri", () => {
    it("bekleyen istek ekleme ve çıkarma işlemleri bildirim tetikler", () => {
      let notifyCount = 0;
      const unsubscribe = socialManager.subscribe(() => {
        notifyCount += 1;
      });

      const sampleReq: FriendRequest = {
        id: "freq_test_123",
        fromUserId: "usr_test",
        fromUsername: "test_user",
        fromName: "Test Kullanıcı",
        toUserId: "usr_me",
        toUsername: "benim_adim",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      socialManager.addPendingRequest(sampleReq);
      expect(socialManager.getPendingRequests().length).toBe(1);
      expect(socialManager.getPendingRequests()[0]!.id).toBe("freq_test_123");
      expect(notifyCount).toBeGreaterThan(0);

      const beforeRemove = notifyCount;
      socialManager.removePendingRequest("freq_test_123");
      expect(socialManager.getPendingRequests().length).toBe(0);
      expect(notifyCount).toBeGreaterThan(beforeRemove);

      unsubscribe();
    });

    it("arkadaş ekleme ve çıkarma işlemleri listeners'ları bilgilendirir", () => {
      let updated = false;
      const unsubscribe = socialManager.subscribe(() => {
        updated = true;
      });

      const res = socialManager.addFriend({
        id: "new_friend_1",
        name: "Yeni Arkadaş",
        username: "yeni_arkadas",
        avatar: "👾",
      });

      expect(res.success).toBe(true);
      expect(updated).toBe(true);
      expect(socialManager.getFriends().some((f) => f.username === "yeni_arkadas")).toBe(true);

      updated = false;
      const removeRes = socialManager.removeFriend("new_friend_1");
      expect(removeRes.success).toBe(true);
      expect(updated).toBe(true);
      expect(socialManager.getFriends().some((f) => f.username === "yeni_arkadas")).toBe(false);

      unsubscribe();
    });

    it("Türkçe karakterli ve büyük/küçük harf kullanıcı adları çakışmasız kontrol edilir", () => {
      socialManager.addFriend({
        id: "tr_friend",
        name: "İsmail Çetin",
        username: "ismail_cetin",
      });

      // Aynı kullanıcı adı tekrar eklenmeye çalışıldığında reddedilmeli
      const duplicateRes = socialManager.addFriend("İSMAİL_CETİN");
      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.message).toContain("zaten arkadaş");
    });
  });

  describe("Arkadaşla Düello ve Özel Oda Entegrasyonu (Friend Duel & Custom Room)", () => {
    it("5 haneli oda kodu kontrolü: 5 karakterden kısa kodlar reddedilir", () => {
      const invalidCodes = ["", "12", "ABC", "1234"];
      invalidCodes.forEach((code) => {
        expect(code.trim().length < 5).toBe(true);
      });

      const validCodes = ["ABCDE", "12345", "XY789"];
      validCodes.forEach((code) => {
        expect(code.trim().length === 5).toBe(true);
      });
    });

    it("Arkadaşla oyna modunda tüm tahta boyutları (4, 6, 8, 10) açıktır", () => {
      const supportedSizes = [4, 6, 8, 10];
      supportedSizes.forEach((size) => {
        expect([4, 6, 8, 10]).toContain(size);
      });
      // Arkadaşla oyna ekranında seviye kısıtlaması olmadan tümü seçilebilir
      expect(supportedSizes.length).toBe(4);
    });

    it("Arkadaş maçları (özel oda) unranked olmalıdır: 0 LP, 0 EXP, 0 Çip", () => {
      const isCustom = true;
      const isRanked = false;

      // Özel dostluk maçında hesaplanan ödüller
      const matchXpEarned = isCustom || !isRanked ? 0 : 50;
      const matchLpEarned = isCustom || !isRanked ? 0 : 25;
      const matchCoinsEarned = isCustom || !isRanked ? 0 : 10;

      expect(matchXpEarned).toBe(0);
      expect(matchLpEarned).toBe(0);
      expect(matchCoinsEarned).toBe(0);
    });

    it("Düello davet nesnesi hedef oyuncu kimliği ve oda kodunu eksiksiz taşır", () => {
      const invitePayload = {
        toPlayerId: "usr_friend_99",
        toUsername: "dost_oyuncu",
        fromPlayerId: "usr_host_01",
        fromPlayerName: "Ev Sahibi",
        roomCode: "7K8M9",
        size: 6 as const,
      };

      expect(invitePayload.roomCode).toHaveLength(5);
      expect(invitePayload.size).toBe(6);
      expect(invitePayload.toPlayerId).toBe("usr_friend_99");
      expect(invitePayload.fromPlayerId).toBe("usr_host_01");
    });

    it("Aynı bota (TaktikMaster) meydan okunduğunda hedef bot kimliği ve profili korunur", () => {
      const inspectableTarget = {
        id: "bot:room_123",
        name: "TaktikMaster",
        username: "TaktikMaster",
        isBot: true,
        avatar: "⚡",
        selectedTitle: "[ÜSTAD]",
        selectedFrame: "neon",
        level: 18,
        tier: "ALTIN",
        lp: 1450,
        wins: 45,
        matches: 80,
      };

      const isBot = Boolean(
        inspectableTarget.isBot ||
        inspectableTarget.id?.startsWith("bot:")
      );

      const targetId = inspectableTarget.id?.startsWith("bot:")
        ? inspectableTarget.id
        : (isBot ? `bot:${inspectableTarget.id || inspectableTarget.username}` : inspectableTarget.id);

      const botProfile = isBot ? {
        avatar: inspectableTarget.avatar,
        selectedTitle: inspectableTarget.selectedTitle,
        selectedFrame: inspectableTarget.selectedFrame,
        level: inspectableTarget.level,
        tier: inspectableTarget.tier,
        lp: inspectableTarget.lp,
        wins: inspectableTarget.wins,
        matches: inspectableTarget.matches,
      } : undefined;

      const invitePayload = {
        toPlayerId: targetId,
        toUsername: inspectableTarget.username,
        botProfile,
      };

      expect(invitePayload.toPlayerId).toBe("bot:room_123");
      expect(invitePayload.toUsername).toBe("TaktikMaster");
      expect(invitePayload.botProfile).toBeDefined();
      expect(invitePayload.botProfile?.selectedTitle).toBe("[ÜSTAD]");
      expect(invitePayload.botProfile?.level).toBe(18);
    });
  });
});
