import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { getSoloLevel, MAX_SOLO_LEVEL } from "@/shared/solo";
import { MILESTONE_REWARDS, type MilestoneReward, type PlayerProgress, AVATARS } from "@/shared/progression";
import { gameSfx } from "@/lib/game-sfx";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { LootBoxRevealModal } from "@/components/modals/loot-box-reveal-modal";
import { styles } from "./solo-levels.styles";

// 10'lu Seviye Dünyaları (Bölgeler)
interface WorldChapter {
  id: number;
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
  { id: 1, startLevel: 1, endLevel: 10, title: "Çaylak Bahçesi", subtitle: "1. BÖLGE", icon: "🌱", bg: "#F0FDF4", accent: "#16A34A", borderColor: "#BBF7D0" },
  { id: 2, startLevel: 11, endLevel: 20, title: "Gizemli Labirent", subtitle: "2. BÖLGE", icon: "🧭", bg: "#EFF6FF", accent: "#2563EB", borderColor: "#BFDBFE" },
  { id: 3, startLevel: 21, endLevel: 30, title: "Kozmik Rota", subtitle: "3. BÖLGE", icon: "🌌", bg: "#FAF5FF", accent: "#9333EA", borderColor: "#E9D5FF" },
  { id: 4, startLevel: 31, endLevel: 40, title: "Antik Yazıtlar", subtitle: "4. BÖLGE", icon: "🏛️", bg: "#FFFBEB", accent: "#D97706", borderColor: "#FDE68A" },
  { id: 5, startLevel: 41, endLevel: 50, title: "Sözcük Dağı", subtitle: "5. BÖLGE", icon: "🏔️", bg: "#F8FAFC", accent: "#475569", borderColor: "#CBD5E1" },
  { id: 6, startLevel: 51, endLevel: 60, title: "Ateş Çemberi", subtitle: "6. BÖLGE", icon: "🔥", bg: "#FFF7ED", accent: "#EA580C", borderColor: "#FED7AA" },
  { id: 7, startLevel: 61, endLevel: 70, title: "Zümrüt Vadi", subtitle: "7. BÖLGE", icon: "💎", bg: "#ECFDF5", accent: "#059669", borderColor: "#A7F3D0" },
  { id: 8, startLevel: 71, endLevel: 80, title: "Kutup Fırtınası", subtitle: "8. BÖLGE", icon: "❄️", bg: "#F0F9FF", accent: "#0284C7", borderColor: "#BAE6FD" },
  { id: 9, startLevel: 81, endLevel: 90, title: "Gökkuşağı Geçidi", subtitle: "9. BÖLGE", icon: "🌈", bg: "#FDF4FF", accent: "#C026D3", borderColor: "#F5D0FE" },
  { id: 10, startLevel: 91, endLevel: 100, title: "Mutlak Zirve", subtitle: "10. BÖLGE", icon: "👑", bg: "#FEF2F2", accent: "#DC2626", borderColor: "#FECACA" },
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
  const [selectedLevel, setSelectedLevel] = useState<number>(Math.min(unlockedLevel, MAX_SOLO_LEVEL));
  const [activeLootBox, setActiveLootBox] = useState<MilestoneReward | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const claimingRef = useRef<Set<number>>(new Set());

  // Oyuncu avatar ikonu
  const currentAvatarId = progress?.selectedAvatar || "spark";
  const avatarObj = AVATARS.find((a) => a.id === currentAvatarId);
  const playerAvatarIcon = avatarObj?.icon || "✦";

  // 10'lu Bölgelere göre seviyeleri ve zikzak sıralarını oluştur
  const worldGroups = WORLD_CHAPTERS.map((chapter) => {
    const chapterLevels: number[] = [];
    for (let l = chapter.startLevel; l <= chapter.endLevel; l++) {
      chapterLevels.push(l);
    }
    const rows: number[][] = [];
    for (let i = 0; i < chapterLevels.length; i += 3) {
      const chunk = chapterLevels.slice(i, i + 3);
      const rIdx = i / 3;
      // Zikzak yol: tek satırlarda sağdan sola, çift satırlarda soldan sağa
      if (rIdx % 2 !== 0) {
        chunk.reverse();
      }
      rows.push(chunk);
    }
    return { chapter, rows };
  });

  useEffect(() => {
    const current = Math.min(unlockedLevel, MAX_SOLO_LEVEL);
    setSelectedLevel(current);

    // Auto-scroll to unlocked level position in grid map
    const chapterIdx = Math.floor((current - 1) / 10);
    const inChapterLevel = (current - 1) % 10;
    const inChapterRow = Math.floor(inChapterLevel / 3);
    const targetY = Math.max(0, chapterIdx * 540 + inChapterRow * 115 - 100);
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [unlockedLevel]);

  const selectedData = getSoloLevel(selectedLevel);
  const isSelectedLocked = selectedLevel > unlockedLevel;

  const totalStars = Object.values(progress?.soloLevelStars ?? {}).reduce((acc, s) => acc + s, 0);

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.overline}>HER BÖLÜMDE FARKLI KELİME MACERASI</Text>
          <Text style={styles.title}>Bölümler ve Harita</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {totalStars > 0 && (
            <View style={[styles.livesPill, { borderColor: "#FBBF24", backgroundColor: "#FEF3C7" }]}>
              <Text style={{ fontSize: 13 }}>⭐</Text>
              <Text style={[styles.livesText, { color: "#B45309", fontWeight: "900" }]}>{totalStars}</Text>
            </View>
          )}
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
      </View>

      {/* Cyber Grid Map - Bölge Bölge Düzenli Akış */}
      <View style={styles.gridContainer}>
        {worldGroups.map(({ chapter, rows }) => {
          const chapterCompleted = unlockedLevel > chapter.endLevel;
          const chapterProgress = Math.min(10, Math.max(0, unlockedLevel - chapter.startLevel + 1));

          return (
            <View key={chapter.id} style={styles.chapterSection}>
              {/* World Chapter Header Banner */}
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
                      {chapterCompleted ? "TAMAMLANDI ✓" : `${chapterProgress}/10`}
                    </Text>
                  </View>
                </View>

                {/* Chapter Milestone Chest if this chapter has one (clean, non-intrusive) */}
                {(() => {
                  const chapterMilestone = MILESTONE_REWARDS.find(
                    (m) => m.level >= chapter.startLevel && m.level <= chapter.endLevel
                  );
                  if (!chapterMilestone) return null;
                  const isClaimed = Boolean(claimedMilestones[chapterMilestone.level]);
                  const isUnlocked = unlockedLevel > chapterMilestone.level;
                  const remainingLevels = chapterMilestone.level - unlockedLevel + 1;
                  const lockLabel =
                    remainingLevels <= 5 && remainingLevels > 0
                      ? `🎁 ${remainingLevels} BÖLÜM KALDI!`
                      : `🔒 BÖLÜM ${chapterMilestone.level}`;

                  return (
                    <View
                      style={[
                        styles.chapterMilestoneBox,
                        isUnlocked && !isClaimed && styles.chapterMilestoneBoxReady,
                        isClaimed && styles.chapterMilestoneBoxClaimed,
                      ]}
                    >
                      <View style={styles.chapterMilestoneLeft}>
                        <View style={[styles.chapterMilestoneIconWrap, { borderColor: chapterMilestone.accent }]}>
                          <Text style={styles.chapterMilestoneIcon}>{chapterMilestone.icon}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <Text style={styles.chapterMilestoneTitle}>{chapterMilestone.title}</Text>
                            <View style={{ backgroundColor: `${chapterMilestone.accent}18`, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}>
                              <Text style={{ fontSize: 9, fontWeight: "900", color: chapterMilestone.accent }}>{chapterMilestone.badgeTitle}</Text>
                            </View>
                          </View>
                          <Text style={styles.chapterMilestoneRewardText}>
                            +{chapterMilestone.coins} Çip · +{chapterMilestone.shields} Kalkan · +{chapterMilestone.xp} XP
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => {
                          if (!isUnlocked || isClaimed || claimingRef.current.has(chapterMilestone.level)) return;
                          claimingRef.current.add(chapterMilestone.level);
                          setActiveLootBox(chapterMilestone);
                          onClaimMilestone?.(chapterMilestone);
                        }}
                        disabled={!isUnlocked || isClaimed}
                        style={({ pressed }) => [
                          styles.chapterMilestoneBtn,
                          isUnlocked && !isClaimed && styles.chapterMilestoneBtnReady,
                          isClaimed && styles.chapterMilestoneBtnClaimed,
                          pressed && isUnlocked && !isClaimed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chapterMilestoneBtnText,
                            isUnlocked && !isClaimed && styles.chapterMilestoneBtnTextReady,
                            isClaimed && styles.chapterMilestoneBtnTextClaimed,
                          ]}
                        >
                          {isClaimed ? "ALINDI ✓" : isUnlocked ? `AÇ! ${chapterMilestone.icon}` : lockLabel}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })()}
              </View>

              {/* Rows inside Chapter - Uninterrupted serpentine flow */}
              {rows.map((row, rowIndex) => {
                const isRowEven = rowIndex % 2 === 0;

                return (
                  <View key={rowIndex}>
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
                          const levelData = getSoloLevel(level);

                          // Gerçek kazanılan yıldız sayısı (Varsayılan olarak en az 1, kayıtlı varsa tam değeri)
                          const starsCount = completed ? (progress?.soloLevelStars?.[level] ?? 3) : 0;

                          return (
                            <View key={level} style={styles.nodeWrapper}>
                              {/* Pixel-perfect vertical connector from turning node down to next row */}
                              {isTurnNode && rowIndex < rows.length - 1 && (
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

                              {/* Bölüm Başlığı & Yıldız Rozeti */}
                              {completed ? (
                                <View style={styles.starsRow}>
                                  <Text style={styles.starText}>{starsCount >= 1 ? "⭐" : "☆"}</Text>
                                  <Text style={[styles.starText, { marginTop: -2 }]}>{starsCount >= 2 ? "⭐" : "☆"}</Text>
                                  <Text style={styles.starText}>{starsCount >= 3 ? "⭐" : "☆"}</Text>
                                </View>
                              ) : null}

                              {/* Her seviyenin tematik ismi */}
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.nodeLabel,
                                  isChosen && styles.nodeLabelSelected,
                                  locked && styles.nodeLabelLocked,
                                  current && styles.nodeLabelCurrent,
                                ]}
                              >
                                {levelData.title}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
      </ScrollView>

      {/* Docked Mission Control Deck (Selected Level Details Panel) */}
      <View style={styles.dockedDeck}>
        <View style={styles.deckHead}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.deckKicker}>
              {selectedLevel === unlockedLevel ? "SIRADAKİ HEDEFİN" : selectedLevel < unlockedLevel ? "TAMAMLANAN BÖLÜM" : "KİLİTLİ BÖLÜM"}
            </Text>
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
