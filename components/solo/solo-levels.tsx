import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { getSoloLevel, MAX_SOLO_LEVEL } from "@/shared/solo";
import { MILESTONE_REWARDS, type MilestoneReward, type PlayerProgress, AVATARS } from "@/shared/progression";
import { gameSfx } from "@/lib/game-sfx";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { LootBoxRevealModal } from "@/components/modals/loot-box-reveal-modal";
import { styles } from "./solo-levels.styles";

// 10'lu Seviye Dünyaları (Biyomlar)
interface WorldChapter {
  startLevel: number;
  endLevel: number;
  title: string;
  subtitle: string;
  icon: string;
  bg: string;
  accent: string;
  borderColor: string;
}

const WORLD_CHAPTERS: WorldChapter[] = [
  { startLevel: 1, endLevel: 10, title: "Çaylak Bahçesi", subtitle: "BÖLÜM 1", icon: "🌱", bg: "#F0FDF4", accent: "#16A34A", borderColor: "#BBF7D0" },
  { startLevel: 11, endLevel: 20, title: "Gizemli Labirent", subtitle: "BÖLÜM 2", icon: "🧭", bg: "#EFF6FF", accent: "#2563EB", borderColor: "#BFDBFE" },
  { startLevel: 21, endLevel: 30, title: "Kozmik Rota", subtitle: "BÖLÜM 3", icon: "🌌", bg: "#FAF5FF", accent: "#9333EA", borderColor: "#E9D5FF" },
  { startLevel: 31, endLevel: 40, title: "Antik Yazıtlar", subtitle: "BÖLÜM 4", icon: "🏛️", bg: "#FFFBEB", accent: "#D97706", borderColor: "#FDE68A" },
  { startLevel: 41, endLevel: 50, title: "Sözcük Dağı", subtitle: "BÖLÜM 5", icon: "🏔️", bg: "#F8FAFC", accent: "#475569", borderColor: "#CBD5E1" },
  { startLevel: 51, endLevel: 60, title: "Ateş Çemberi", subtitle: "BÖLÜM 6", icon: "🔥", bg: "#FFF7ED", accent: "#EA580C", borderColor: "#FED7AA" },
  { startLevel: 61, endLevel: 70, title: "Zümrüt Vadi", subtitle: "BÖLÜM 7", icon: "💎", bg: "#ECFDF5", accent: "#059669", borderColor: "#A7F3D0" },
  { startLevel: 71, endLevel: 80, title: "Kutup Fırtınası", subtitle: "BÖLÜM 8", icon: "❄️", bg: "#F0F9FF", accent: "#0284C7", borderColor: "#BAE6FD" },
  { startLevel: 81, endLevel: 90, title: "Gökkuşağı Geçidi", subtitle: "BÖLÜM 9", icon: "🌈", bg: "#FDF4FF", accent: "#C026D3", borderColor: "#F5D0FE" },
  { startLevel: 91, endLevel: 100, title: "Mutlak Zirve", subtitle: "BÖLÜM 10", icon: "👑", bg: "#FEF2F2", accent: "#DC2626", borderColor: "#FECACA" },
];

export function SoloLevels({
  unlockedLevel,
  progress,
  claimedMilestones = {},
  onBack,
  onSelect,
  onClaimMilestone,
  lives = 5,
  onOpenLivesModal,
}: {
  unlockedLevel: number;
  progress?: PlayerProgress;
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

  // Oyuncu avatar ikonu
  const currentAvatarId = progress?.selectedAvatar || "spark";
  const avatarObj = AVATARS.find((a) => a.id === currentAvatarId);
  const playerAvatarIcon = avatarObj?.icon || "✦";

  useEffect(() => {
    const current = Math.min(unlockedLevel, MAX_SOLO_LEVEL);
    setSelectedLevel(current);

    // Auto-scroll to unlocked level position in grid map
    const targetRow = Math.floor((current - 1) / 3);
    const targetY = Math.max(0, targetRow * 95 - 120);
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
      <View style={styles.gridContainer}>
        {gridRows.map((row, rowIndex) => {
          const isRowEven = rowIndex % 2 === 0;
          const minLevelInRow = Math.min(...row);

          // Check if this row starts a new world chapter
          const chapter = WORLD_CHAPTERS.find((c) => minLevelInRow === c.startLevel || (minLevelInRow - 1) % 10 === 0 && row.includes(c.startLevel));

          return (
            <View key={rowIndex}>
              {/* World Chapter Header Banner */}
              {chapter && (
                <View style={[styles.chapterCard, { backgroundColor: chapter.bg, borderColor: chapter.borderColor }]}>
                  <View style={styles.chapterTopRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={[styles.chapterIconWrap, { backgroundColor: chapter.borderColor }]}>
                        <Text style={styles.chapterIcon}>{chapter.icon}</Text>
                      </View>
                      <View>
                        <Text style={[styles.chapterSubtitle, { color: chapter.accent }]}>{chapter.subtitle}</Text>
                        <Text style={[styles.chapterTitle, { color: "#1E293B" }]}>{chapter.title}</Text>
                      </View>
                    </View>
                    <View style={[styles.chapterProgressPill, { backgroundColor: `${chapter.accent}18`, borderColor: `${chapter.accent}44` }]}>
                      <Text style={[styles.chapterProgressText, { color: chapter.accent }]}>
                        {Math.min(chapter.endLevel, Math.max(0, unlockedLevel - chapter.startLevel + 1))}/10
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.gridRowWrap}>
                {/* Row connector line */}
                <View style={[styles.rowConnector, row.some((l) => l <= unlockedLevel) && styles.rowConnectorActive]} />

                <View style={styles.gridRow}>
                  {row.map((level, colIndex) => {
                    const locked = level > unlockedLevel;
                    const current = level === unlockedLevel;
                    const completed = level < unlockedLevel;
                    const isChosen = level === selectedLevel;
                    const isTurnNode = isRowEven ? colIndex === row.length - 1 : colIndex === 0;

                    // Yıldız mantığı: Tamamlanan bölümler için 3 yıldız
                    const starsCount = completed ? (level % 3 === 0 ? 3 : level % 2 === 0 ? 3 : 2) : 0;

                    return (
                      <View key={level} style={styles.nodeWrapper}>
                        {/* Pixel-perfect vertical connector from turning node down to next row */}
                        {isTurnNode && rowIndex < gridRows.length - 1 && (
                          <View
                            style={[
                              styles.verticalConnector,
                              level < unlockedLevel && styles.verticalConnectorActive,
                            ]}
                            pointerEvents="none"
                          />
                        )}

                        {/* Aktif Seviyede Zıplayan Oyuncu Avatarı Pini */}
                        {current && (
                          <View style={styles.playerPinWrapper} pointerEvents="none">
                            <View style={styles.playerPinBadge}>
                              <Text style={styles.playerPinAvatar}>{playerAvatarIcon}</Text>
                              <Text style={styles.playerPinText}>BURADASIN</Text>
                            </View>
                            <View style={styles.playerPinPointer} />
                          </View>
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
                            styles.nodeBaseShadow,
                            pressed && styles.pressed,
                          ]}
                        >
                          <View
                            style={[
                              styles.nodeCircle,
                              completed && styles.nodeCompleted,
                              current && styles.nodeCurrent,
                              locked && styles.nodeLocked,
                              isChosen && styles.nodeSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.nodeText,
                                completed && styles.nodeTextCompleted,
                                current && styles.nodeTextCurrent,
                                locked && styles.nodeTextLocked,
                                isChosen && styles.nodeTextSelected,
                              ]}
                            >
                              {locked ? "🔒" : level}
                            </Text>
                          </View>
                        </Pressable>

                        {/* Tamamlanan Seviyeler İçin 3 Yıldız Rozeti */}
                        {completed ? (
                          <View style={styles.starsRow}>
                            <Text style={styles.starText}>{starsCount >= 1 ? "⭐" : "☆"}</Text>
                            <Text style={[styles.starText, { marginTop: -2 }]}>{starsCount >= 2 ? "⭐" : "☆"}</Text>
                            <Text style={styles.starText}>{starsCount >= 3 ? "⭐" : "☆"}</Text>
                          </View>
                        ) : (
                          <Text style={[styles.nodeLabel, isChosen && styles.nodeLabelSelected, locked && styles.nodeLabelLocked]}>
                            {current ? "BAŞLA" : `BÖLÜM ${level}`}
                          </Text>
                        )}
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
                          isUnlocked && !isClaimed && { backgroundColor: "#FFFBEB", borderColor: "#F59E0B" },
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
                            isUnlocked && !isClaimed && { backgroundColor: "#F59E0B", borderColor: "#D97706" },
                            isClaimed && styles.milestoneBtnClaimed,
                            pressed && isUnlocked && !isClaimed && styles.pressed,
                          ]}
                        >
                          <Text style={[styles.milestoneBtnText, isUnlocked && !isClaimed && { color: "#FFFFFF", fontWeight: "900" }]}>
                            {isClaimed ? "ALINDI" : isUnlocked ? `AÇ! ${milestone.icon}` : "🔒 KİLİTLİ"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })()}
              </View>
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
          onPress={() => {
            if (!isSelectedLocked) {
              triggerHapticSelection();
              gameSfx.tap();
            }
            onSelect(selectedLevel);
          }}
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
