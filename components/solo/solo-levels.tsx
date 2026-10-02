import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { getSoloLevel, MAX_SOLO_LEVEL } from "@/shared/solo";
import { MILESTONE_REWARDS, type MilestoneReward } from "@/shared/progression";
import { gameSfx } from "@/lib/game-sfx";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { LootBoxRevealModal } from "@/components/modals/loot-box-reveal-modal";
import { styles } from "./solo-levels.styles";

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
                const isUnlocked = unlockedLevel > milestone.level;

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
