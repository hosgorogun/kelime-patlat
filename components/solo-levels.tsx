import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getSoloLevel, MAX_SOLO_LEVEL } from "@/shared/solo";
import { MILESTONE_REWARDS, type MilestoneReward } from "@/shared/progression";
import { gameSfx } from "@/lib/game-sfx";
import { triggerHapticSelection } from "@/shared/audio-haptics";

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
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.overline}>TEKLİ OYUNCU · SİBER AĞ</Text>
          <Text style={styles.title}>OPERASYON MERKEZİ</Text>
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
      <Text style={styles.sectionTitle}>SİBER AĞ HARİTASI</Text>
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
                          triggerHapticSelection();
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
                const isUnlocked = unlockedLevel > milestone.level;

                return (
                  <View style={styles.milestoneWrap}>
                    <View
                      style={[
                        styles.milestoneBox,
                        isUnlocked && !isClaimed && styles.milestoneBoxReady,
                        isClaimed && styles.milestoneBoxClaimed,
                      ]}
                    >
                      <View style={styles.milestoneIconWrap}>
                        <Text style={styles.milestoneIcon}>{milestone.level === 100 ? "👑" : "🎁"}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                          {isClaimed && <Text style={styles.milestoneBadge}>AÇILDI ✓</Text>}
                        </View>
                        <Text style={styles.milestoneDesc}>{milestone.desc}</Text>
                        <Text style={styles.milestoneRewardText}>
                          +{milestone.coins} ÇİP · +{milestone.shields} KALKAN · +{milestone.xp} XP
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          if (!isUnlocked || isClaimed || claimingRef.current.has(milestone.level)) return;
                          claimingRef.current.add(milestone.level);
                          gameSfx.victory();
                          onClaimMilestone?.(milestone);
                        }}
                        disabled={!isUnlocked || isClaimed}
                        style={({ pressed }) => [
                          styles.milestoneBtn,
                          isUnlocked && !isClaimed && styles.milestoneBtnReady,
                          isClaimed && styles.milestoneBtnClaimed,
                          pressed && isUnlocked && !isClaimed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.milestoneBtnText, isUnlocked && !isClaimed && { color: "#071A14" }]}>
                          {isClaimed ? "ALINDI" : isUnlocked ? "AÇ! 🎁" : "🔒 KİLİTLİ"}
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
            <Text style={styles.deckKicker}>SEÇİLİ DÜĞÜM DETAYLARI</Text>
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
          disabled={isSelectedLocked}
          onPress={() => onSelect(selectedLevel)}
          style={({ pressed }) => [
            styles.launchButton,
            isSelectedLocked && styles.launchButtonLocked,
            pressed && !isSelectedLocked && styles.pressed
          ]}
        >
          <Text style={[styles.launchText, isSelectedLocked && styles.launchTextLocked]}>
            {isSelectedLocked ? "🔒 DÜĞÜM ERİŞİMİ ENGELLENDİ" : "SİBER AĞI BAĞLA (BAŞLAT)"}
          </Text>
          {!isSelectedLocked && <Text style={styles.launchArrow}>→</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 140, flexGrow: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  back: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#164036", borderWidth: 1, borderColor: "rgba(212, 180, 90, 0.25)", alignItems: "center", justifyContent: "center" },
  backText: { color: "#FFF9FC", fontSize: 26, lineHeight: 28 },
  overline: { color: "#E8C36A", fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#FFF9FC", fontSize: 18, fontWeight: "900", marginTop: 2, letterSpacing: 0.5, textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },

  sectionTitle: { color: "#DCE8DC", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 10, marginBottom: 16 },

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
    borderColor: "rgba(212, 180, 90, 0.45)",
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
    borderColor: "rgba(212, 180, 90, 0.45)",
    zIndex: 1,
  },
  nodeWrapper: {
    alignItems: "center",
  },
  nodeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#16122C",
    borderWidth: 2,
    borderColor: "#413461",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  nodeCompleted: {
    backgroundColor: "rgba(80, 227, 194, 0.08)",
    borderColor: "#4ADE80",
    shadowColor: "#4ADE80",
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  nodeCurrent: {
    backgroundColor: "rgba(255, 194, 74, 0.1)",
    borderColor: "#FFC24A",
    shadowColor: "#FFC24A",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    transform: [{ scale: 1.05 }],
  },
  nodeSelected: {
    borderColor: "#3EE8B5",
    borderWidth: 3,
    shadowColor: "#3EE8B5",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    transform: [{ scale: 1.1 }],
  },
  nodeLocked: {
    backgroundColor: "#0A0716",
    borderColor: "#26203D",
    opacity: 0.6,
  },
  nodeText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#8FA4CF",
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nodeTextCompleted: {
    color: "#4ADE80",
  },
  nodeTextCurrent: {
    color: "#FFC24A",
  },
  nodeTextSelected: {
    color: "#3EE8B5",
  },
  nodeTextLocked: {
    fontSize: 12,
  },
  nodeLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#E2E8F0",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  nodeLabelSelected: {
    color: "#3EE8B5",
  },
  nodeLabelLocked: {
    color: "#475569",
  },

  // Docked Mission Deck Details Card
  dockedDeck: {
    backgroundColor: "rgba(8, 28, 22, 0.98)",
    borderTopWidth: 1.5,
    borderTopColor: "rgba(212, 180, 90, 0.35)",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 92,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  deckHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  deckKicker: {
    color: "#FFC24A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  deckTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: 0.5,
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeLocked: {
    backgroundColor: "#1E1B2C",
    borderColor: "#4A455E",
  },
  badgeActive: {
    backgroundColor: "#2C2216",
    borderColor: "#FFC24A",
  },
  badgeCompleted: {
    backgroundColor: "#172A25",
    borderColor: "#4ADE80",
  },
  statusBadgeText: {
    fontSize: 7,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  deckInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(12, 8, 37, 0.4)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.15)",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  infoCol: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  infoValue: {
    color: "#FFFFFF",
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
    backgroundColor: "#3EE8B5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#3EE8B5",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  launchButtonLocked: {
    backgroundColor: "rgba(20, 54, 43, 0.6)",
    borderColor: "rgba(87, 69, 141, 0.2)",
    borderWidth: 1.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  launchText: {
    color: "#080612",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textShadowColor: "rgba(255, 255, 255, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  launchTextLocked: {
    color: "#4B445E",
  },
  launchArrow: {
    color: "#080612",
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
    backgroundColor: "rgba(22, 16, 48, 0.7)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.3)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  milestoneBoxReady: {
    borderColor: "#FFC24A",
    backgroundColor: "rgba(255, 194, 74, 0.12)",
    shadowColor: "#FFC24A",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  milestoneBoxClaimed: {
    borderColor: "rgba(80, 227, 194, 0.4)",
    backgroundColor: "rgba(80, 227, 194, 0.06)",
  },
  milestoneIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  milestoneIcon: {
    fontSize: 22,
  },
  milestoneTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  milestoneBadge: {
    color: "#4ADE80",
    fontSize: 9,
    fontWeight: "900",
    backgroundColor: "rgba(80, 227, 194, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  milestoneDesc: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 2,
  },
  milestoneRewardText: {
    color: "#FFC24A",
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
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  milestoneBtnReady: {
    backgroundColor: "#FFC24A",
    borderColor: "#FFC24A",
    shadowColor: "#FFC24A",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  milestoneBtnClaimed: {
    backgroundColor: "rgba(80, 227, 194, 0.1)",
    borderColor: "rgba(80, 227, 194, 0.3)",
  },
  milestoneBtnText: {
    color: "#94A3B8",
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
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  livesIcon: { fontSize: 13 },
  livesText: { color: "#22C55E", fontSize: 12, fontWeight: "900" },
  livesInfoBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  livesInfoText: { color: "#000000", fontSize: 10, fontWeight: "900", marginTop: -1 },
});
