import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  getWeekendHuntEvent,
  isWeekendActive,
  claimWeekendHuntReward,
  type WeekendHuntEvent,
  type WeekendHuntTierReward,
} from "@/shared/weekend-hunt";
import type { PlayerProgress } from "@/shared/progression";
import { haptics } from "@/lib/haptics";
import { isEqualTr } from "@/shared/tr-utils";

interface WeekendHuntCardProps {
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  onRewardClaimed?: (reward: WeekendHuntTierReward) => void;
}

export const WeekendHuntCard: React.FC<WeekendHuntCardProps> = ({
  progress,
  setProgress,
  onRewardClaimed,
}) => {
  const active = isWeekendActive();
  const event: WeekendHuntEvent = getWeekendHuntEvent();
  const huntData = progress.weekendHunt?.eventId === event.eventId
    ? progress.weekendHunt
    : { eventId: event.eventId, foundWords: [], claimedTiers: [] };

  const [inspectedWord, setInspectedWord] = useState<string | null>(null);

  const foundCount = huntData.foundWords.length;
  const totalCount = event.targetWords.length;

  const handleClaim = (tierIdx: number) => {
    haptics.success();
    const result = claimWeekendHuntReward(progress, tierIdx, event);
    if (result) {
      setProgress(result.updatedProgress);
      onRewardClaimed?.(result.reward);
    }
  };

  return (
    <View style={[styles.container, { borderColor: event.accent }]}>
      {/* Event Header Banner */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { borderColor: event.accent }]}>
          <Text style={styles.icon}>{event.icon}</Text>
        </View>
        <View style={styles.headerTitles}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: active ? "#10B98122" : "#64748B22", borderColor: active ? "#10B981" : "#64748B" }]}>
              <Text style={[styles.statusText, { color: active ? "#059669" : "#64748B" }]}>
                {active ? "● HAFTA SONU ETKİNLİĞİ AKTİF" : "⏳ YAKINDA: CUMA 12:00"}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{event.themeTitle.toLocaleUpperCase("tr-TR")}</Text>
          <Text style={styles.subtitle}>{event.subtitle}</Text>
        </View>
      </View>

      {/* Target Words Grid */}
      <View style={styles.wordsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>AVLANACAK GİZLİ KELİMELER</Text>
          <Text style={[styles.countBadge, { color: event.accent }]}>
            {foundCount} / {totalCount} BULUNDU
          </Text>
        </View>

        <View style={styles.wordsGrid}>
          {event.targetWords.map((target) => {
            const isFound = huntData.foundWords.some((w) => isEqualTr(w, target));
            const isInspected = inspectedWord ? isEqualTr(inspectedWord, target) : false;
            const hint = event.hints[target] || "Temaya uygun özel kelime.";

            return (
              <Pressable
                key={target}
                onPress={() => {
                  haptics.select();
                  setInspectedWord(isInspected ? null : target);
                }}
                style={({ pressed }) => [
                  styles.wordPill,
                  isFound && styles.wordPillFound,
                  isInspected && styles.wordPillInspected,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.wordPillText, isFound && styles.wordPillTextFound]}>
                  {isFound ? `✓ ${target}` : `? ${target.length} Harfli`}
                </Text>
                {!isFound && <Text style={styles.hintIcon}>💡</Text>}
              </Pressable>
            );
          })}
        </View>

        {inspectedWord && !huntData.foundWords.some((w) => isEqualTr(w, inspectedWord)) && (
          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>İPUCU ({inspectedWord.length} Harfli):</Text>
            <Text style={styles.hintContent}>{event.hints[inspectedWord]}</Text>
            <Text style={styles.hintFoot}>Tüm oyun modlarında (Solo, Günlük, Düello) bu kelimeyi bularak avlayabilirsin!</Text>
          </View>
        )}
      </View>

      {/* Milestone Tier Rewards */}
      <View style={styles.rewardsSection}>
        <Text style={styles.rewardsTitle}>KADEME ÖDÜLLERİ</Text>
        <View style={styles.tiersList}>
          {event.tierRewards.map((tier, idx) => {
            const isReached = foundCount >= tier.count;
            const isClaimed = huntData.claimedTiers.includes(idx);

            return (
              <View
                key={idx}
                style={[
                  styles.tierCard,
                  isReached && !isClaimed && styles.tierCardReady,
                  isClaimed && styles.tierCardClaimed,
                ]}
              >
                <View style={styles.tierInfo}>
                  <Text style={styles.tierRequirement}>
                    {tier.count} Kelime
                  </Text>
                  <Text style={styles.tierPrizes}>
                    +{tier.xp} XP · +{tier.coins} Çip{tier.shields ? ` · +${tier.shields} 🛡️` : ""}
                  </Text>
                </View>

                <Pressable
                  disabled={!isReached || isClaimed || !active}
                  onPress={() => handleClaim(idx)}
                  style={({ pressed }) => [
                    styles.claimBtn,
                    isReached && !isClaimed && active && styles.claimBtnReady,
                    isClaimed && styles.claimBtnClaimed,
                    pressed && isReached && !isClaimed && { opacity: 0.8 },
                  ]}
                >
                  <Text
                    style={[
                      styles.claimBtnText,
                      isReached && !isClaimed && active && styles.claimBtnTextReady,
                      isClaimed && styles.claimBtnTextClaimed,
                    ]}
                  >
                    {isClaimed ? "ALINDI ✓" : isReached && active ? "ÖDÜLÜ AL" : `${tier.count} KELİME`}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F0F5ED",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 26,
  },
  headerTitles: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  title: {
    color: "#293541",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: "#4A5568",
    fontSize: 11,
    marginTop: 1,
  },
  wordsSection: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#293541",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  countBadge: {
    fontSize: 11,
    fontWeight: "900",
  },
  wordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  wordPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  wordPillFound: {
    backgroundColor: "#DCFCE7",
    borderColor: "#10B981",
  },
  wordPillInspected: {
    borderColor: "#8B5CF6",
    backgroundColor: "#F5F3FF",
  },
  wordPillText: {
    color: "#475569",
    fontSize: 11.5,
    fontWeight: "800",
  },
  wordPillTextFound: {
    color: "#059669",
    fontWeight: "900",
  },
  hintIcon: {
    fontSize: 10,
  },
  hintBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  hintTitle: {
    color: "#7C3AED",
    fontSize: 10,
    fontWeight: "900",
  },
  hintContent: {
    color: "#4C1D95",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  hintFoot: {
    color: "#6B7280",
    fontSize: 9.5,
    marginTop: 4,
  },
  rewardsSection: {
    gap: 8,
  },
  rewardsTitle: {
    color: "#293541",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  tiersList: {
    gap: 8,
  },
  tierCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tierCardReady: {
    backgroundColor: "#FEF9C3",
    borderColor: "#FACC15",
  },
  tierCardClaimed: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderColor: "#E2E8F0",
    opacity: 0.7,
  },
  tierInfo: {
    flex: 1,
  },
  tierRequirement: {
    color: "#1E293B",
    fontSize: 12,
    fontWeight: "900",
  },
  tierPrizes: {
    color: "#64748B",
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 1,
  },
  claimBtn: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  claimBtnReady: {
    backgroundColor: "#10B981",
  },
  claimBtnClaimed: {
    backgroundColor: "#F1F5F9",
  },
  claimBtnText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
  },
  claimBtnTextReady: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  claimBtnTextClaimed: {
    color: "#94A3B8",
    fontWeight: "700",
  },
});
