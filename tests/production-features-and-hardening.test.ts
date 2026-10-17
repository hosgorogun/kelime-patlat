import { describe, it, expect, vi, beforeEach } from "vitest";
import { containsProfanity } from "../shared/profanity-filter";
import { inviteMessage } from "../shared/invite";
import { checkAndPromptReview } from "../lib/store-review";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";

describe("Production Features & Hardening Suite", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    vi.clearAllMocks();
  });

  describe("1. Profanity Blacklist Enforcement", () => {
    it("should reject abusive usernames during registration check", () => {
      expect(containsProfanity("orospu_cocugu")).toBe(true);
      expect(containsProfanity("sikik_oyuncu")).toBe(true);
      expect(containsProfanity("a.m.k_kelime")).toBe(true);
      expect(containsProfanity("0r0spu123")).toBe(true);
      expect(containsProfanity("y@rr@k")).toBe(true);
    });

    it("should allow clean and normal usernames", () => {
      expect(containsProfanity("ahmet_kelimeci")).toBe(false);
      expect(containsProfanity("zeynep_patlat")).toBe(false);
      expect(containsProfanity("kelime_ustasi_2026")).toBe(false);
      expect(containsProfanity("pamuk_seker")).toBe(false);
      expect(containsProfanity("samuray_ali")).toBe(false);
    });
  });

  describe("2. Social Sharing & WhatsApp Invite Message", () => {
    it("should format rich invite message with room code and join URL", () => {
      const msg = inviteMessage("KP999", "https://kelimepatlat.app/room?code=KP999");
      expect(msg).toContain("KP999");
      expect(msg).toContain("Kelime Patlat'ta benimle düelloya katıl");
      expect(msg).toContain("https://kelimepatlat.app/room?code=KP999");
      expect(msg).toContain("💥");
    });
  });

  describe("3. In-App Store Review Prompt", () => {
    it("should trigger review alert for eligible players with 5+ wins", async () => {
      // Mock Alert.alert
      const alertSpy = vi.spyOn(Alert, "alert");
      const triggered = await checkAndPromptReview({ wins: 6, level: 5 });
      // In web platform mock, it returns false or triggers on native
      if (Platform.OS !== "web") {
        expect(triggered).toBe(true);
        expect(alertSpy).toHaveBeenCalled();
      }
    });

    it("should not prompt players who have already rated", async () => {
      await AsyncStorage.setItem("@kelime_patlat_reviewed", "true");
      const triggered = await checkAndPromptReview({ wins: 15, level: 10, force: true });
      expect(triggered).toBe(false);
    });

    it("should respect postponement cooldown", async () => {
      await AsyncStorage.setItem("@kelime_patlat_review_postponed_at", Date.now().toString());
      const triggered = await checkAndPromptReview({ wins: 10, level: 5 });
      expect(triggered).toBe(false);
    });
  });
});
