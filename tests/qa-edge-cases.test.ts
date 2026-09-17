import { describe, expect, it, beforeEach } from "vitest";
import { socialManager } from "../shared/social";
import { getDayId, getWeekId, getSeasonId, getLeagueTier } from "../shared/progression";

describe("Senior QA Edge Case Test Suiti - Sosyal Sistem & Tarih Tutarlılığı", () => {
  beforeEach(async () => {
    // Sosyal yöneticiyi sıfırla
    await socialManager.init();
  });

  it("Arkadaş eklerken Türkçe büyük/küçük İ ve I harflerini aynı kullanıcı olarak algılamalıdır", () => {
    // "İSMAİL" kullanıcısı ile "ismail" veya "ısmail" aynı kişi kabul edilmeli
    const res1 = socialManager.addFriend({ username: "İsmail", name: "İsmail" });
    expect(res1.success).toBe(true);

    // Aynı ismi küçük Türkçe karakterle eklemeye çalışınca çift kayıt engellenmeli
    const res2 = socialManager.addFriend({ username: "ismail", name: "ismail" });
    expect(res2.success).toBe(false);
    expect(res2.message).toContain("zaten arkadaş");
  });

  it("Boş veya yalnızca boşluk içeren kullanıcı adlarını reddetmelidir", () => {
    const resEmpty = socialManager.addFriend("   ");
    expect(resEmpty.success).toBe(false);
    expect(resEmpty.message).toBe("Geçerli bir kullanıcı adı girin.");
  });

  it("Arkadaş silme işlemi mevcut arkadaşı listeden çıkarmalıdır", () => {
    const friendListBefore = socialManager.getFriends().length;
    const addRes = socialManager.addFriend({ id: "qa_test_usr", username: "qa_user", name: "QA Tester" });
    expect(addRes.success).toBe(true);

    const removeRes = socialManager.removeFriend(addRes.friend!.id);
    expect(removeRes.success).toBe(true);
    expect(socialManager.getFriends().length).toBe(friendListBefore);
  });

  it("Olmayan bir arkadaş ID'si silinmek istendiğinde hata mesajı dönmelidir", () => {
    const removeRes = socialManager.removeFriend("non_existing_id_9999");
    expect(removeRes.success).toBe(false);
    expect(removeRes.message).toBe("Arkadaş bulunamadı.");
  });

  it("Tarih ve Sezon formatları (getDayId, getWeekId, getSeasonId) geçerli ISO ve bimonthly kalıbında olmalıdır", () => {
    const today = getDayId();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD

    const currentWeek = getWeekId();
    expect(currentWeek).toMatch(/^\d{4}-W\d{2}$/); // YYYY-Www

    const currentSeason = getSeasonId();
    expect(currentSeason).toMatch(/^\d{4}-S0[1-6]$/); // YYYY-S0X (Bimonthly 1-6)
  });

  it("Lig tier aşamaları (getLeagueTier) LP sınır değerlerini tam doğrulamalıdır", () => {
    expect(getLeagueTier(0).tier).toBe("DEMİR");
    expect(getLeagueTier(349).tier).toBe("DEMİR");
    expect(getLeagueTier(350).tier).toBe("BRONZ");
    expect(getLeagueTier(899).tier).toBe("BRONZ");
    expect(getLeagueTier(900).tier).toBe("GÜMÜŞ");
    expect(getLeagueTier(1599).tier).toBe("GÜMÜŞ");
    expect(getLeagueTier(1600).tier).toBe("ALTIN");
    expect(getLeagueTier(2499).tier).toBe("ALTIN");
    expect(getLeagueTier(2500).tier).toBe("PLATİN");
    expect(getLeagueTier(3599).tier).toBe("PLATİN");
    expect(getLeagueTier(3600).tier).toBe("ELMAS");
    expect(getLeagueTier(4999).tier).toBe("ELMAS");
    expect(getLeagueTier(5000).tier).toBe("YÜCELİK");
    expect(getLeagueTier(99999).tier).toBe("RADIAN");
  });

  it("Arkadaş listesindeki tüm arkadaşlar silindiğinde liste boş [] kalmalı ve mock veriler geri gelmemelidir", async () => {
    const friends = socialManager.getFriends();
    const ids = friends.map((f) => f.id);
    ids.forEach((id) => socialManager.removeFriend(id));

    expect(socialManager.getFriends().length).toBe(0);
    const reInited = await socialManager.init();
    expect(reInited.length).toBe(0);
  });
});
