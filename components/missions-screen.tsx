import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import {
  type PlayerProgress,
  getDailyMissions,
  getWeeklyMissions,
  getDayId,
  getWeekId,
  type CatalogMission,
} from "@/shared/progression";
import { haptics } from "@/lib/haptics";
import { gameSfx } from "@/lib/game-sfx";
import { palette } from "@/shared/palette";
import { GameButton, GameIcon, ICONS, JewelTitle, OrnatePanel } from "@/components/game-ui";

const DIFFICULTY_CONFIG = {
  easy: { label: "KOLAY", color: palette.gemGreen, bg: "rgba(74, 222, 128, 0.16)", border: palette.gemGreen },
  medium: { label: "ORTA", color: palette.gold, bg: "rgba(244, 208, 111, 0.16)", border: palette.gold },
  hard: { label: "ZOR", color: palette.danger, bg: "rgba(255, 107, 122, 0.16)", border: palette.danger },
  epic: { label: "DESTANSI", color: "#F0C27A", bg: "rgba(232, 165, 75, 0.18)", border: palette.bronze },
};

function getMissionIcon(actionType: string): string {
  switch (actionType) {
    case "daily_route": return "☀";
    case "duel_play": return "⚔️";
    case "duel_win": return "♕";
    case "word_length": return "✦";
    case "word_count": return "📝";
    case "arcade_score": return "⚡";
    case "vintage_solve": return "📰";
    case "combo_count": return "🔥";
    case "solo_progress": return "🎯";
    case "earn_chips": return "🪙";
    default: return "◈";
  }
}

export function MissionsScreen({
  progress,
  onBack,
  onPlayDaily,
  onClaimDaily,
  onClaimWeekly,
  onNavigate,
}: {
  progress: PlayerProgress;
  onBack: () => void;
  onPlayDaily: () => void;
  onClaimDaily?: (missionId: string, xp: number, coins: number) => void;
  onClaimWeekly?: (missionId: string, xp: number, shield?: number, coins?: number) => void;
  onNavigate?: (destination: any) => void;
}) {
  const [toast, setToast] = useState<{
    title: string;
    desc: string;
    rewards: string[];
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");

  const [todayId, setTodayId] = useState(() => getDayId());
  const [weekId, setWeekId] = useState(() => getWeekId());
  const [timeUntilDailyReset, setTimeUntilDailyReset] = useState("");
  const [timeUntilWeeklyReset, setTimeUntilWeeklyReset] = useState("");

  useEffect(() => {
    function updateTimers() {
      const now = new Date();

      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      const diffDaily = Math.max(0, tomorrow.getTime() - now.getTime());
      const dailyHours = Math.floor(diffDaily / (1000 * 60 * 60));
      const dailyMins = Math.floor((diffDaily % (1000 * 60 * 60)) / (1000 * 60));
      const dailySecs = Math.floor((diffDaily % (1000 * 60)) / 1000);
      setTimeUntilDailyReset(
        `${String(dailyHours).padStart(2, "0")}:${String(dailyMins).padStart(2, "0")}:${String(dailySecs).padStart(2, "0")}`
      );

      const currentTodayId = getDayId(now);
      if (currentTodayId !== todayId) {
        setTodayId(currentTodayId);
      }

      const dayOfWeek = now.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday, 0, 0, 0, 0);
      const diffWeekly = Math.max(0, nextMonday.getTime() - now.getTime());
      const weeklyDays = Math.floor(diffWeekly / (1000 * 60 * 60 * 24));
      const weeklyHours = Math.floor((diffWeekly % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const weeklyMins = Math.floor((diffWeekly % (1000 * 60 * 60)) / (1000 * 60));
      const weeklySecs = Math.floor((diffWeekly % (1000 * 60)) / 1000);
      setTimeUntilWeeklyReset(
        weeklyDays > 0
          ? `${weeklyDays}g ${weeklyHours}sa ${weeklyMins}dk kaldı`
          : `${String(weeklyHours).padStart(2, "0")}:${String(weeklyMins).padStart(2, "0")}:${String(weeklySecs).padStart(2, "0")} kaldı`
      );

      const currentWeekId = getWeekId(now);
      if (currentWeekId !== weekId) {
        setWeekId(currentWeekId);
      }
    }

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [todayId, weekId]);

  const dailyMissions = useMemo(() => getDailyMissions(todayId), [todayId]);
  const weeklyMissions = useMemo(() => getWeeklyMissions(weekId), [weekId]);

  const allActiveMissions = useMemo(() => [...dailyMissions, ...weeklyMissions], [dailyMissions, weeklyMissions]);

  const completedCount = allActiveMissions.filter((m) => {
    const current = progress.missions?.[m.id] ?? 0;
    return current >= m.target;
  }).length;

  const dailyCompletedCount = dailyMissions.filter((m) => (progress.missions?.[m.id] ?? 0) >= m.target).length;
  const weeklyCompletedCount = weeklyMissions.filter((m) => (progress.missions?.[m.id] ?? 0) >= m.target).length;

  const totalPossibleXp = allActiveMissions.reduce((sum, m) => sum + m.rewardXp, 0);
  const claimingRef = useRef<Set<string>>(new Set());
  const progressPct = Math.max(8, Math.round((completedCount / (allActiveMissions.length || 1)) * 100));

  const handleClaimMission = (mission: CatalogMission) => {
    if (claimingRef.current.has(mission.id)) return;
    claimingRef.current.add(mission.id);
    haptics.success();
    gameSfx.victory();

    const isDaily = mission.period === "daily";
    if (isDaily) {
      onClaimDaily?.(mission.id, mission.rewardXp, mission.rewardCoins);
    } else {
      onClaimWeekly?.(mission.id, mission.rewardXp, mission.rewardShields ?? 0, mission.rewardCoins);
    }

    const rewardsList: string[] = [`+${mission.rewardXp} XP`, `+${mission.rewardCoins} Çip 🪙`];
    if (mission.rewardShields && mission.rewardShields > 0) {
      rewardsList.push(`+${mission.rewardShields} Kalkan 🛡️`);
    }

    setToast({
      title: isDaily ? "GÜNLÜK GÖREV ÖDÜLÜ ALINDI!" : "HAFTALIK GÖREV ÖDÜLÜ ALINDI!",
      desc: `"${mission.title}" görevi başarıyla tamamlandı!`,
      rewards: rewardsList,
    });
  };

  const renderMissionCard = (mission: CatalogMission) => {
    const isDaily = mission.period === "daily";
    const current = progress.missions?.[mission.id] ?? 0;
    const isDone = current >= mission.target;
    const isClaimed = isDaily
      ? Boolean(progress.dailyClaimed?.[mission.id])
      : Boolean(progress.weeklyClaimed?.[mission.id]);
    const pct = Math.min(100, Math.round((current / mission.target) * 100));
    const diffConfig = DIFFICULTY_CONFIG[mission.difficulty] || DIFFICULTY_CONFIG.easy;
    const icon = getMissionIcon(mission.actionType);
    const borderColor = isClaimed ? palette.bronzeDark : isDone ? palette.gold : palette.bronzeBorder;

    return (
      <View key={mission.id} style={[styles.missionWrap, isClaimed && { opacity: 0.72 }]}>
        <LinearGradient
          colors={isDone && !isClaimed ? ["#F8E19A", "#C9962A", "#8C5E1C"] : [palette.goldHi, palette.bronze, palette.bronzeDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.missionFrame}
        >
          <LinearGradient colors={["#164536", "#0C2A20"]} style={[styles.missionCard, { borderColor }]}>
            <GameIcon
              emoji={isClaimed ? "✓" : isDone ? "🎁" : icon}
              size={44}
              glow={isDone ? palette.gold : palette.bronze}
            />

            <View style={styles.infoBox}>
              <View style={styles.cardTopRow}>
                <Text style={[styles.missionTitle, isClaimed && { color: palette.muted }]} numberOfLines={1}>
                  {mission.title}
                </Text>
                <View style={[styles.diffBadge, { backgroundColor: diffConfig.bg, borderColor: diffConfig.border }]}>
                  <Text style={[styles.diffBadgeText, { color: diffConfig.color }]}>{diffConfig.label}</Text>
                </View>
              </View>

              <Text style={styles.missionDesc}>{mission.desc}</Text>

              <View style={styles.rewardBadgesRow}>
                <View style={styles.rewardChipPill}>
                  <Text style={styles.rewardChipText}>+{mission.rewardXp} XP</Text>
                </View>
                <View style={styles.rewardChipGold}>
                  <Text style={styles.rewardChipGoldText}>🪙 +{mission.rewardCoins}</Text>
                </View>
                {mission.rewardShields ? (
                  <View style={styles.rewardChipShield}>
                    <Text style={styles.rewardChipShieldText}>🛡️ +{mission.rewardShields}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.cardTrack}>
                <LinearGradient
                  colors={isClaimed ? ["#475569", "#334155"] : isDone ? [palette.goldHi, palette.goldDeep] : [diffConfig.color, palette.emerald]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.cardFill, { width: `${Math.max(8, pct)}%` }]}
                />
              </View>

              <View style={styles.cardFooter}>
                <Text style={[styles.statusText, isDone && !isClaimed && { color: palette.gold }]}>
                  {current}/{mission.target} ({pct}%)
                </Text>

                {isClaimed ? (
                  <View style={styles.claimedBadge}>
                    <Text style={styles.claimedText}>✓ ÖDÜL ALINDI</Text>
                  </View>
                ) : isDone ? (
                  <GameButton
                    label="ÖDÜLÜ TOPLA"
                    icon="🎁"
                    size="sm"
                    onPress={() => handleClaimMission(mission)}
                    style={styles.claimBtn}
                  />
                ) : mission.actionType === "daily_route" ? (
                  <GameButton
                    label="GÜNLÜK ROTA"
                    variant="emerald"
                    size="sm"
                    onPress={onPlayDaily}
                    style={styles.claimBtn}
                  />
                ) : (mission.actionType === "duel_play" || mission.actionType === "duel_win") && onNavigate ? (
                  <GameButton
                    label="DÜELLO"
                    variant="emerald"
                    size="sm"
                    onPress={() => onNavigate("online")}
                    style={styles.claimBtn}
                  />
                ) : mission.actionType === "arcade_score" && onNavigate ? (
                  <GameButton
                    label="ARCADE"
                    variant="emerald"
                    size="sm"
                    onPress={() => onNavigate("arcade")}
                    style={styles.claimBtn}
                  />
                ) : mission.actionType === "vintage_solve" && onNavigate ? (
                  <GameButton
                    label="BULMACA"
                    variant="emerald"
                    size="sm"
                    onPress={() => onNavigate("vintage")}
                    style={styles.claimBtn}
                  />
                ) : mission.actionType === "solo_progress" && onNavigate ? (
                  <GameButton
                    label="SEVİYELER"
                    variant="emerald"
                    size="sm"
                    onPress={() => onNavigate("levels")}
                    style={styles.claimBtn}
                  />
                ) : onNavigate ? (
                  <GameButton
                    label="OYNA"
                    variant="emerald"
                    size="sm"
                    onPress={() => onNavigate("home")}
                    style={styles.claimBtn}
                  />
                ) : (
                  <View style={styles.inProgressPill}>
                    <Text style={styles.inProgressText}>⏳ DEVAM EDİYOR</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.pressed]} hitSlop={8}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.overline}>MACERA PARŞÖMENİ</Text>
          <JewelTitle style={styles.pageTitle}>GÖREVLER</JewelTitle>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeLabel}>TOPLAM</Text>
          <Text style={styles.totalBadgeText}>+{totalPossibleXp} XP</Text>
        </View>
      </View>

      {toast && (
        <LinearGradient colors={["#1A4A38", "#0E2C22"]} style={styles.toastCard}>
          <GameIcon emoji="🎉" size={42} glow={palette.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.toastTitle}>{toast.title}</Text>
            <Text style={styles.toastDesc}>{toast.desc}</Text>
            <View style={styles.toastPillsRow}>
              {toast.rewards.map((r, i) => (
                <View key={i} style={styles.toastRewardPill}>
                  <Text style={styles.toastRewardText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
          <Pressable onPress={() => setToast(null)} hitSlop={10} style={styles.toastCloseBtn}>
            <Text style={styles.toastCloseText}>×</Text>
          </Pressable>
        </LinearGradient>
      )}

      <OrnatePanel contentStyle={styles.summaryInner}>
        <View style={styles.summaryHead}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <GameIcon source={ICONS.trophy} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.summaryKicker}>AKTİF DÖNGÜ</Text>
              <Text style={styles.summaryTitle}>{completedCount}/{allActiveMissions.length} GÖREV TAMAM</Text>
            </View>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[palette.goldHi, palette.goldDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progressPct}%` }]}
          />
        </View>
        <Text style={styles.summaryHint}>
          Görevleri tamamla; Sezon XP, Çip ve Seri Kalkanı kazan. Lig merdivenini daha hızlı tırman!
        </Text>
      </OrnatePanel>

      <View style={styles.tabFrame}>
        <LinearGradient colors={["#1A4A38", "#0A241C"]} style={styles.tabContainer}>
          <Pressable
            onPress={() => {
              haptics.select();
              setActiveTab("daily");
            }}
            style={styles.tabHit}
          >
            {activeTab === "daily" ? (
              <LinearGradient colors={["#FFF1B0", "#F0C24A", "#C48A1C"]} style={styles.tabButtonActive}>
                <Text numberOfLines={1} style={styles.tabButtonTextOn}>☀️ GÜNLÜK</Text>
                <View style={styles.tabBadgeOn}>
                  <Text style={styles.tabBadgeTextOn}>{dailyCompletedCount}/{dailyMissions.length}</Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.tabButton}>
                <Text numberOfLines={1} style={styles.tabButtonText}>☀️ GÜNLÜK</Text>
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{dailyCompletedCount}/{dailyMissions.length}</Text>
                </View>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              haptics.select();
              setActiveTab("weekly");
            }}
            style={styles.tabHit}
          >
            {activeTab === "weekly" ? (
              <LinearGradient colors={["#FFF1B0", "#F0C24A", "#C48A1C"]} style={styles.tabButtonActive}>
                <Text numberOfLines={1} style={styles.tabButtonTextOn}>🏆 HAFTALIK</Text>
                <View style={styles.tabBadgeOn}>
                  <Text style={styles.tabBadgeTextOn}>{weeklyCompletedCount}/{weeklyMissions.length}</Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.tabButton}>
                <Text numberOfLines={1} style={styles.tabButtonText}>🏆 HAFTALIK</Text>
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{weeklyCompletedCount}/{weeklyMissions.length}</Text>
                </View>
              </View>
            )}
          </Pressable>
        </LinearGradient>
      </View>

      {activeTab === "daily" ? (
        <>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>GÜNLÜK GÖREVLER</Text>
            <Text style={styles.sectionMeta}>
              {timeUntilDailyReset ? `⏳ ${timeUntilDailyReset}` : "00:00'DA YENİLENİR"}
            </Text>
          </View>
          <View style={styles.missionList}>
            {dailyMissions.map((m) => renderMissionCard(m))}
          </View>
        </>
      ) : (
        <>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>HAFTALIK MİSYONLAR</Text>
            <Text style={styles.sectionMeta}>
              {timeUntilWeeklyReset ? `⏳ ${timeUntilWeeklyReset}` : "PAZARTESİ YENİLENİR"}
            </Text>
          </View>
          <View style={styles.missionList}>
            {weeklyMissions.map((m) => renderMissionCard(m))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 185 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.panelLift,
    borderWidth: 2,
    borderColor: palette.bronzeBorder,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  backText: { color: palette.goldHi, fontSize: 28, lineHeight: 30, marginTop: -3, fontWeight: "300" },
  overline: { color: palette.gold, fontSize: 8.5, fontWeight: "900", letterSpacing: 1.2 },
  pageTitle: { fontSize: 22, lineHeight: 26, marginTop: 1, textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(244, 208, 111, 0.14)",
    borderWidth: 1.5,
    borderColor: palette.gold,
    alignItems: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  totalBadgeLabel: { color: palette.mutedGold, fontSize: 7, fontWeight: "900", letterSpacing: 0.5 },
  totalBadgeText: { color: palette.goldHi, fontSize: 12, fontWeight: "900" },

  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: palette.gold,
    marginBottom: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  toastTitle: { color: palette.gold, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  toastDesc: { color: palette.cream, fontSize: 12, fontWeight: "800", marginTop: 2 },
  toastPillsRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  toastRewardPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(244, 208, 111, 0.12)",
    borderWidth: 1,
    borderColor: palette.gold,
  },
  toastRewardText: { color: palette.gold, fontSize: 10, fontWeight: "900" },
  toastCloseBtn: { padding: 6 },
  toastCloseText: { color: palette.muted, fontSize: 18, fontWeight: "900" },

  summaryInner: { padding: 14 },
  summaryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  summaryKicker: { color: palette.gold, fontSize: 9, fontWeight: "900", letterSpacing: 0.9 },
  summaryTitle: { color: palette.cream, fontSize: 14, fontWeight: "900", marginTop: 2, textShadowColor: "#000", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#071A14", overflow: "hidden", marginBottom: 10, borderWidth: 1, borderColor: palette.bronzeDark },
  progressFill: { height: "100%", borderRadius: 4 },
  summaryHint: { color: palette.muted, fontSize: 11, lineHeight: 15, fontWeight: "600" },

  tabFrame: {
    marginTop: 14,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: palette.bronzeBorder,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  tabHit: { flex: 1 },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  tabButtonActive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.bronzeDark,
  },
  tabButtonText: { color: palette.muted, fontSize: 11, fontWeight: "900", letterSpacing: 0.3, flexShrink: 1 },
  tabButtonTextOn: { color: "#3A2408", fontSize: 11, fontWeight: "900", letterSpacing: 0.3, flexShrink: 1 },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  tabBadgeOn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(58, 36, 8, 0.18)",
  },
  tabBadgeText: { color: palette.mutedGold, fontSize: 9, fontWeight: "900" },
  tabBadgeTextOn: { color: "#3A2408", fontSize: 9, fontWeight: "900" },

  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 },
  sectionTitle: { color: palette.goldBright, fontSize: 11, fontWeight: "900", letterSpacing: 1.1, textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
  sectionMeta: { color: palette.muted, fontSize: 8.5, fontWeight: "900", letterSpacing: 0.4, flexShrink: 1, textAlign: "right" },

  missionList: { gap: 10, marginBottom: 20 },
  missionWrap: {
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  missionFrame: { borderRadius: 20, padding: 2.5 },
  missionCard: {
    padding: 12,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
  },

  infoBox: { flex: 1, minWidth: 0 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 6 },
  missionTitle: { flex: 1, color: palette.cream, fontSize: 14, fontWeight: "900", letterSpacing: 0.2, textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  diffBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 7, borderWidth: 1 },
  diffBadgeText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  missionDesc: { color: palette.muted, fontSize: 11, marginBottom: 8, lineHeight: 15, fontWeight: "600" },

  rewardBadgesRow: { flexDirection: "row", gap: 6, marginBottom: 10, flexWrap: "wrap" },
  rewardChipPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(62, 232, 181, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(62, 232, 181, 0.4)",
  },
  rewardChipText: { color: palette.emerald, fontSize: 9.5, fontWeight: "900" },
  rewardChipGold: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(244, 208, 111, 0.14)",
    borderWidth: 1,
    borderColor: palette.gold,
  },
  rewardChipGoldText: { color: palette.gold, fontSize: 9.5, fontWeight: "900" },
  rewardChipShield: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(56, 189, 248, 0.14)",
    borderWidth: 1,
    borderColor: palette.gemBlue,
  },
  rewardChipShieldText: { color: palette.gemBlue, fontSize: 9.5, fontWeight: "900" },

  cardTrack: { height: 7, borderRadius: 4, backgroundColor: "#071A14", overflow: "hidden", marginBottom: 8, borderWidth: 1, borderColor: palette.bronzeDark },
  cardFill: { height: "100%", borderRadius: 4 },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  statusText: { color: palette.mutedGold, fontSize: 10, fontWeight: "800" },
  claimedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: palette.bronzeDark,
  },
  claimedText: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  inProgressPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(244, 208, 111, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(184, 134, 58, 0.35)",
  },
  inProgressText: { color: palette.mutedGold, fontSize: 8.5, fontWeight: "800" },
  claimBtn: { minWidth: 128 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});
