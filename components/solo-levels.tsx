import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getSoloLevel, MAX_SOLO_LEVEL } from "@/shared/solo";
import { MILESTONE_REWARDS, type MilestoneReward } from "@/shared/progression";
import { gameSfx } from "@/lib/game-sfx";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { LootBoxRevealModal } from "@/components/loot-box-reveal-modal";

export function SoloLevels({
  unlockedLevel,
  claimedMilestones = {},
  onBack,
  onSelect,
  onClaimMilestone,
  lives = 5,
  onOpenLivesModal,
}: {
  unlockedLevel: number;
  claimedMilestones?: Record<number, boolean>;
  onBack: () => void;
  onSelect: (level: number) => void;
  onClaimMilestone?: (milestone: MilestoneReward) => void;
  lives?: number;
  onOpenLivesModal?: () => void;
}) {
  const levels = Array.from({ length: MAX_SOLO_LEVEL }, (_, index) => index + 1);
  const [selectedLevel, setSelectedLevel] = useState<number>(Math.min(unlockedLevel, MAX_SOLO_LEVEL));
  const [activeLootBox, setActiveLootBox] = useState<MilestoneReward | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const claimingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const current = Math.min(unlockedLevel, MAX_SOLO_LEVEL);
    setSelectedLevel(current);

    // Auto-scroll to unlocked level position in grid map
    const targetRow = Math.floor((current - 1) / 3);
    const targetY = Math.max(0, targetRow * 82 - 100);
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [unlockedLevel]);

  // Group levels into rows of 3 to build a serpentine grid path
  const gridRows: number[][] = [];
  for (let i = 0; i < MAX_SOLO_LEVEL; i += 3) {
    const chunk = levels.slice(i, i + 3);
    const rowIndex = i / 3;
    // serpentine path: reverse order on odd rows
    if (rowIndex % 2 !== 0) {
      chunk.reverse();
    }
    gridRows.push(chunk);
  }

  const selectedData = getSoloLevel(selectedLevel);
  const isSelectedLocked = selectedLevel > unlockedLevel;

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.overline}>HER BÖLÜMDE YENİ KELİMELER</Text>
          <Text style={styles.title}>Seviyeler</Text>
        </View>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            onOpenLivesModal?.();
          }}
          style={({ pressed }) => [styles.livesPill, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.livesIcon}>💚</Text>
          <Text style={styles.livesText}>{lives}/5</Text>
          <View style={styles.livesInfoBadge}>
            <Text style={styles.livesInfoText}>+</Text>
          </View>
        </Pressable>
      </View>

      {/* Cyber Grid Map */}
      <Text style={styles.sectionTitle}>Kelime yolculuğun</Text>
      <View style={styles.gridContainer}>
        {gridRows.map((row, rowIndex) => {
          const isRowEven = rowIndex % 2 === 0;

          return (
            <View key={rowIndex} style={styles.gridRowWrap}>
              {/* Row connector line */}
              <View style={styles.rowConnector} />

              <View style={styles.gridRow}>
                {row.map((level, colIndex) => {
                  const locked = level > unlockedLevel;
                  const current = level === unlockedLevel;
                  const completed = level < unlockedLevel;
                  const isChosen = level === selectedLevel;
                  const isTurnNode = isRowEven ? colIndex === row.length - 1 : colIndex === 0;

                  return (
                    <View key={level} style={styles.nodeWrapper}>
                      {/* Pixel-perfect vertical connector from turning node down to next row */}
                      {isTurnNode && rowIndex < gridRows.length - 1 && (
                        <View style={styles.verticalConnector} pointerEvents="none" />
                      )}
                      <Pressable
                        onPress={() => {
                          if (locked) {
                            gameSfx.rejected();
                          } else {
                            triggerHapticSelection();
                          }
                          if (isChosen && !locked) {
                            onSelect(level);
                          } else {
                            setSelectedLevel(level);
                          }
                        }}
                        style={({ pressed }) => [
                          styles.nodeCircle,
                          completed && styles.nodeCompleted,
                          current && styles.nodeCurrent,
                          locked && styles.nodeLocked,
                          isChosen && styles.nodeSelected,
                          pressed && styles.pressed
                        ]}
                      >
                        <Text
                          style={[
                            styles.nodeText,
                            completed && styles.nodeTextCompleted,
                            current && styles.nodeTextCurrent,
                            locked && styles.nodeTextLocked,
                            isChosen && styles.nodeTextSelected
                          ]}
                        >
                          {locked ? "🔒" : level}
                        </Text>
                      </Pressable>
                      <Text style={[styles.nodeLabel, isChosen && styles.nodeLabelSelected, locked && styles.nodeLabelLocked]}>
                        N-{level}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Milestone Chest Banner if this row contains a milestone */}
              {(() => {
                const milestone = MILESTONE_REWARDS.find((m) => row.includes(m.level));
                if (!milestone) return null;
                const isClaimed = Boolean(claimedMilestones[milestone.level]);
                const isUnlocked = unlockedLevel >= milestone.level;

                return (
                  <View style={styles.milestoneWrap}>
                    <View
                      style={[
                        styles.milestoneBox,
                        { borderColor: milestone.accent },
                        isUnlocked && !isClaimed && { backgroundColor: "#F0F5ED" },
                        isClaimed && styles.milestoneBoxClaimed,
                      ]}
                    >
                      <View style={[styles.milestoneIconWrap, { borderColor: milestone.accent }]}>
                        <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                          <View style={{ backgroundColor: `${milestone.accent}22`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: `${milestone.accent}66` }}>
                            <Text style={{ fontSize: 9, fontWeight: "900", color: milestone.accent }}>{milestone.badge}</Text>
                          </View>
                          {isClaimed && <Text style={styles.milestoneBadge}>AÇILDI ✓</Text>}
                        </View>
                        <Text style={styles.milestoneDesc}>{milestone.desc}</Text>
                        <Text style={[styles.milestoneRewardText, { color: milestone.accent }]}>
                          {milestone.badgeIcon} {milestone.badgeTitle} · +{milestone.coins} ÇİP · +{milestone.shields} KALKAN · +{milestone.xp} XP
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          if (!isUnlocked || isClaimed || claimingRef.current.has(milestone.level)) return;
                          claimingRef.current.add(milestone.level);
                          setActiveLootBox(milestone);
                          onClaimMilestone?.(milestone);
                        }}
                        disabled={!isUnlocked || isClaimed}
                        style={({ pressed }) => [
                          styles.milestoneBtn,
                          isUnlocked && !isClaimed && { backgroundColor: milestone.accent, borderColor: milestone.accent },
                          isClaimed && styles.milestoneBtnClaimed,
                          pressed && isUnlocked && !isClaimed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.milestoneBtnText, isUnlocked && !isClaimed && { color: "#293541", fontWeight: "900" }]}>
                          {isClaimed ? "ALINDI" : isUnlocked ? `AÇ! ${milestone.icon}` : "🔒 KİLİTLİ"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })()}
            </View>
          );
        })}
      </View>
      </ScrollView>

      {/* Docked Mission Control Deck (Selected Level Details Panel) */}
      <View style={styles.dockedDeck}>
        <View style={styles.deckHead}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.deckKicker}>SIRADAKİ HEDEFİN</Text>
            <Text numberOfLines={1} style={styles.deckTitle}>SEVİYE {selectedLevel}: {selectedData.title.toLocaleUpperCase("tr-TR")}</Text>
          </View>
          <View style={[styles.statusBadge, isSelectedLocked ? styles.badgeLocked : selectedLevel === unlockedLevel ? styles.badgeActive : styles.badgeCompleted]}>
            <Text style={styles.statusBadgeText}>
              {isSelectedLocked ? "KİLİTLİ" : selectedLevel === unlockedLevel ? "AKTİF" : "TAMAMLANDI"}
            </Text>
          </View>
        </View>

        <View style={styles.deckInfoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>IZGARA</Text>
            <Text style={styles.infoValue}>{selectedData.size}×{selectedData.size}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>HEDEF</Text>
            <Text style={styles.infoValue}>{selectedData.wordCount}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>SÜRE</Text>
            <Text style={styles.infoValue}>{selectedData.timeLimit} sn</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isSelectedLocked ? `Önce seviye ${selectedLevel - 1}'i tamamla` : `Seviye ${selectedLevel}'i oyna`}
          accessibilityState={{ disabled: isSelectedLocked }}
          disabled={isSelectedLocked}
          onPress={() => onSelect(selectedLevel)}
          style={({ pressed }) => [
            styles.launchButton,
            isSelectedLocked && styles.launchButtonLocked,
            pressed && !isSelectedLocked && styles.pressed
          ]}
        >
          <Text style={[styles.launchText, isSelectedLocked && styles.launchTextLocked]}>
            {isSelectedLocked ? `🔒 SEVİYE ${selectedLevel - 1}'İ TAMAMLA` : "Hadi oynayalım"}
          </Text>
          {!isSelectedLocked && <Text style={styles.launchArrow}>→</Text>}
        </Pressable>
      </View>

      {/* Interactive LootBox Tap-to-Open Reveal Modal */}
      <LootBoxRevealModal
        reward={activeLootBox}
        visible={Boolean(activeLootBox)}
        onClose={() => setActiveLootBox(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 210, flexGrow: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  back: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#F0F5ED", borderWidth: 1, borderColor: "#DCE1D7", alignItems: "center", justifyContent: "center" },
  backText: { color: "#293541", fontSize: 26, lineHeight: 28 },
  overline: { color: "#8c7540", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  title: { color: "#293541", fontSize: 26, fontWeight: "900", marginTop: 2, letterSpacing: 0.5, textShadowColor: "transparent", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 0 },

  sectionTitle: { color: "#293541", fontSize: 12, fontWeight: "900", letterSpacing: 0.5, marginTop: 10, marginBottom: 16 },

  // Grid Map
  gridContainer: {
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  gridRowWrap: {
    position: "relative",
    marginBottom: 28,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    zIndex: 10,
  },
  rowConnector: {
    position: "absolute",
    left: 40,
    right: 40,
    top: 25,
    height: 2,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    zIndex: 1,
  },
  verticalConnector: {
    position: "absolute",
    top: 25,
    bottom: -32,
    width: 2,
    left: "50%",
    marginLeft: -1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    zIndex: 1,
  },
  nodeWrapper: {
    alignItems: "center",
  },
  nodeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EDF4FC",
    borderWidth: 2,
    borderColor: "#DCE1D7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 5,
  },
  nodeCompleted: {
    backgroundColor: "rgba(80, 227, 194, 0.08)",
    borderColor: "#DCE1D7",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  nodeCurrent: {
    backgroundColor: "rgba(255, 194, 74, 0.1)",
    borderColor: "#DCE1D7",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    transform: [{ scale: 1.05 }],
  },
  nodeSelected: {
    borderColor: "#DCE1D7",
    borderWidth: 3,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    transform: [{ scale: 1.1 }],
  },
  nodeLocked: {
    backgroundColor: "#EDF4FC",
    borderColor: "#DCE1D7",
    opacity: 0.6,
  },
  nodeText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#687796",
    textShadowColor: "transparent",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  nodeTextCompleted: {
    color: "#349d5a",
  },
  nodeTextCurrent: {
    color: "#98732c",
  },
  nodeTextSelected: {
    color: "#2a9c7a",
  },
  nodeTextLocked: {
    fontSize: 12,
  },
  nodeLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#293541",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  nodeLabelSelected: {
    color: "#2a9c7a",
  },
  nodeLabelLocked: {
    color: "#293541",
  },

  // Docked Mission Deck Details Card
  dockedDeck: {
    backgroundColor: "#F0F5ED",
    borderTopWidth: 1.5,
    borderTopColor: "#DCE1D7",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 92,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  deckHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  deckKicker: {
    color: "#98732c",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  deckTitle: {
    color: "#293541",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: 0.5,
    textShadowColor: "transparent",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeLocked: {
    backgroundColor: "#EDF4FC",
    borderColor: "#DCE1D7",
  },
  badgeActive: {
    backgroundColor: "#FFF0E8",
    borderColor: "#DCE1D7",
  },
  badgeCompleted: {
    backgroundColor: "#F0F5ED",
    borderColor: "#DCE1D7",
  },
  statusBadgeText: {
    fontSize: 7,
    fontWeight: "900",
    color: "#293541",
    letterSpacing: 0.5,
  },
  deckInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  infoCol: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    color: "#293541",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  infoValue: {
    color: "#293541",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  infoDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(212, 180, 90, 0.2)",
  },
  launchButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#aef5e0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  launchButtonLocked: {
    backgroundColor: "#F0F5ED",
    borderColor: "#DCE1D7",
    borderWidth: 1.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  launchText: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "transparent",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  launchTextLocked: {
    color: "#293541",
  },
  launchArrow: {
    color: "#293541",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  milestoneWrap: {
    marginVertical: 10,
    width: "100%",
  },
  milestoneBox: {
    backgroundColor: "#EDF4FC",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneBoxReady: {
    borderColor: "#F0C855",
    backgroundColor: "#FFF9E6",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneBoxClaimed: {
    borderColor: "#A7F3D0",
    backgroundColor: "#E8F8F0",
  },
  milestoneIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F7F5EE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 0,
  },
  milestoneIcon: {
    fontSize: 22,
  },
  milestoneTitle: {
    color: "#293541",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "transparent",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  milestoneBadge: {
    color: "#349d5a",
    fontSize: 9,
    fontWeight: "900",
    backgroundColor: "rgba(80, 227, 194, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  milestoneDesc: {
    color: "#293541",
    fontSize: 10,
    marginTop: 2,
  },
  milestoneRewardText: {
    color: "#98732c",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },
  milestoneBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  milestoneBtnReady: {
    backgroundColor: "#ffe5b3",
    borderColor: "#DCE1D7",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneBtnClaimed: {
    backgroundColor: "rgba(80, 227, 194, 0.1)",
    borderColor: "#DCE1D7",
  },
  milestoneBtnText: {
    color: "#293541",
    fontSize: 10,
    fontWeight: "900",
  },

  livesPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
  },
  livesIcon: { fontSize: 13 },
  livesText: { color: "#1daa51", fontSize: 12, fontWeight: "900" },
  livesInfoBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#a2e7bb",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  livesInfoText: { color: "#293541", fontSize: 10, fontWeight: "900", marginTop: -1 },
});
