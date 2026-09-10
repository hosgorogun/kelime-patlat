import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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

const DIFFICULTY_CONFIG = {
  easy: { label: "KOLAY", color: "#50E3C2", bg: "rgba(80, 227, 194, 0.15)", border: "#50E3C2" },
  medium: { label: "ORTA", color: "#FFC24A", bg: "rgba(255, 194, 74, 0.15)", border: "#FFC24A" },
  hard: { label: "ZOR", color: "#FF647C", bg: "rgba(255, 100, 124, 0.15)", border: "#FF647C" },
  epic: { label: "DESTANSI", color: "#D946EF", bg: "rgba(217, 70, 239, 0.2)", border: "#D946EF" },
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
}: {
  progress: PlayerProgress;
  onBack: () => void;
  onPlayDaily: () => void;
  onClaimDaily?: (missionId: string, xp: number, coins: number) => void;
  onClaimWeekly?: (missionId: string, xp: number, shield?: number, coins?: number) => void;
}) {
  const [toast, setToast] = useState<{
    title: string;
    desc: string;
    rewards: string[];
  } | null>(null);

  // Auto-dismiss toast after 6 seconds
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

      // Daily reset: next midnight local time
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

      // Weekly reset: next Monday 00:00:00 local time
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

    Alert.alert(
      "🎉 Görev Ödülü Alındı!",
      `Tebrikler! "${mission.title}" görevini tamamladın.\n\nKazanılan Ödüller:\n` +
      rewardsList.map((r) => `• ${r}`).join("\n") +
      `\n\nÖdüller profilinize başarıyla eklendi!`
    );
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

    return (
      <View key={mission.id} style={[styles.missionCard, isDone && styles.missionDone, isClaimed && styles.missionClaimed]}>
        <View style={[styles.iconBox, isDone && styles.iconBoxDone, isClaimed && styles.iconBoxClaimed]}>
          <Text style={[styles.iconText, isDone && { color: "#00F5D4" }, isClaimed && { color: "#64748B" }]}>{isClaimed ? "✓" : isDone ? "🎁" : icon}</Text>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.cardTopRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1, flexWrap: "wrap" }}>
              <Text style={[styles.missionTitle, isDone && { color: "#00F5D4" }, isClaimed && { color: "#94A3B8" }]}>{mission.title}</Text>
              <View style={[styles.diffBadge, { backgroundColor: diffConfig.bg, borderColor: diffConfig.border }]}>
                <Text style={[styles.diffBadgeText, { color: diffConfig.color }]}>{diffConfig.label}</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.missionDesc}>{mission.desc}</Text>

          {/* Reward Badges Row */}
          <View style={styles.rewardBadgesRow}>
            <View style={styles.rewardChipPill}>
              <Text style={styles.rewardChipText}>+{mission.rewardXp} XP</Text>
            </View>
            <View style={styles.rewardChipPill}>
              <Text style={styles.rewardChipText}>🪙 +{mission.rewardCoins}</Text>
            </View>
            {mission.rewardShields ? (
              <View style={[styles.rewardChipPill, { borderColor: "#38BDF855", backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
                <Text style={[styles.rewardChipText, { color: "#38BDF8" }]}>🛡️ +{mission.rewardShields}</Text>
              </View>
            ) : null}
          </View>

          {/* Progress bar */}
          <View style={styles.cardTrack}>
            <View
              style={[
                styles.cardFill,
                { width: `${Math.max(4, pct)}%`, backgroundColor: diffConfig.color },
                isDone && { backgroundColor: "#00F5D4" },
                isClaimed && { backgroundColor: "#475569" },
              ]}
            />
          </View>

          <View style={styles.cardFooter}>
            <Text style={[styles.statusText, isDone && { color: "#00F5D4" }]}>
              {current}/{mission.target} ({pct}%)
            </Text>

            {isClaimed ? (
              <View style={styles.claimedBadge}>
                <Text style={styles.claimedText}>✓ ÖDÜL ALINDI</Text>
              </View>
            ) : isDone ? (
              <Pressable
                onPress={() => handleClaimMission(mission)}
                style={({ pressed }) => [styles.actionButton, styles.claimButtonGold, pressed && { opacity: 0.8 }]}
              >
                <Text style={[styles.actionText, { color: "#121025" }]}>ÖDÜLÜ TOPLA 🎁</Text>
              </Pressable>
            ) : mission.actionType === "daily_route" ? (
              <Pressable onPress={onPlayDaily} style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}>
                <Text style={styles.actionText}>OYNAT →</Text>
              </Pressable>
            ) : (
              <View style={styles.inProgressPill}>
                <Text style={styles.inProgressText}>⏳ DEVAM EDİYOR</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.overline}>GÖREV MERKEZİ</Text>
          <Text style={styles.title}>GÖREV PANOSU</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeLabel}>TOPLAM KAZANÇ</Text>
          <Text style={styles.totalBadgeText}>+{totalPossibleXp} XP</Text>
        </View>
      </View>

      {/* Reward Claimed Notification Toast */}
      {toast && (
        <View style={styles.toastCard}>
          <View style={styles.toastIconBox}>
            <Text style={styles.toastIcon}>🎉</Text>
          </View>
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
        </View>
      )}

      {/* Mission Summary Banner */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHead}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 14 }}>⚡</Text>
            <Text style={styles.summaryKicker}>AKTİF DÖNGÜ İLERLEMESİ</Text>
          </View>
          <Text style={styles.summaryTitle}>
            {completedCount}/{allActiveMissions.length} GÖREV TAMAM
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(6, Math.round((completedCount / (allActiveMissions.length || 1)) * 100))}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.summaryHint}>
          {"💡 Görevleri tamamlayarak Sezon XP'si, Siber Çip ve Seri Kalkanı kazan, kademeleri daha hızlı tırman!"}
        </Text>
      </View>

      {/* Tab Selector Buttons */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => {
            haptics.select();
            setActiveTab("daily");
          }}
          style={[styles.tabButton, activeTab === "daily" && styles.tabButtonActive]}
        >
          <Text numberOfLines={1} style={[styles.tabButtonText, activeTab === "daily" && styles.tabButtonTextActive]}>
            ☀️ GÜNLÜK
          </Text>
          <View style={[styles.tabBadge, activeTab === "daily" && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === "daily" && styles.tabBadgeTextActive]}>
              {dailyCompletedCount}/{dailyMissions.length}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            haptics.select();
            setActiveTab("weekly");
          }}
          style={[styles.tabButton, activeTab === "weekly" && styles.tabButtonActive]}
        >
          <Text numberOfLines={1} style={[styles.tabButtonText, activeTab === "weekly" && styles.tabButtonTextActive]}>
            🏆 HAFTALIK
          </Text>
          <View style={[styles.tabBadge, activeTab === "weekly" && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === "weekly" && styles.tabBadgeTextActive]}>
              {weeklyCompletedCount}/{weeklyMissions.length}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Daily or Weekly Missions Section */}
      {activeTab === "daily" ? (
        <>
          <View style={styles.sectionHead}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.sectionIcon}>☀️</Text>
              <Text style={styles.sectionTitle}>GÜNLÜK GÖREVLER</Text>
            </View>
            <Text style={styles.sectionMeta}>
              {timeUntilDailyReset ? `⏳ SIFIRLANMA: ${timeUntilDailyReset}` : "HER GÜN 00:00'DA YENİLENİR"}
            </Text>
          </View>

          <View style={styles.missionList}>
            {dailyMissions.map((m) => renderMissionCard(m))}
          </View>
        </>
      ) : (
        <>
          <View style={styles.sectionHead}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.sectionIcon}>🏆</Text>
              <Text style={styles.sectionTitle}>HAFTALIK MİSYONLAR</Text>
            </View>
            <Text style={styles.sectionMeta}>
              {timeUntilWeeklyReset ? `⏳ SIFIRLANMA: ${timeUntilWeeklyReset}` : "HER PAZARTESİ YENİLENİR"}
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
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 136, backgroundColor: "#0C081A" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#1C1538", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.15)", alignItems: "center", justifyContent: "center" },
  backText: { color: "#FFF9FC", fontSize: 28, lineHeight: 30, marginTop: -3 },
  overline: { color: "#A78BFA", fontSize: 8.5, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#FFF9FC", fontSize: 19, fontWeight: "900", marginTop: 1, letterSpacing: 0.3 },
  totalBadge: { marginLeft: "auto", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: "rgba(0, 245, 212, 0.12)", borderWidth: 1.5, borderColor: "#00F5D4", alignItems: "flex-end" },
  totalBadgeLabel: { color: "#A78BFA", fontSize: 7, fontWeight: "900", letterSpacing: 0.5 },
  totalBadgeText: { color: "#00F5D4", fontSize: 11.5, fontWeight: "900" },

  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1.5,
    borderColor: "#00F5D4",
    marginBottom: 16,
    gap: 12,
    shadowColor: "#00F5D4",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  toastIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(0, 245, 212, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  toastIcon: { fontSize: 22 },
  toastTitle: { color: "#00F5D4", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  toastDesc: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", marginTop: 2 },
  toastPillsRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  toastRewardPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#1E1838",
    borderWidth: 1,
    borderColor: "#FFC24A",
  },
  toastRewardText: { color: "#FFC24A", fontSize: 10, fontWeight: "900" },
  toastCloseBtn: { padding: 6 },
  toastCloseText: { color: "#A49BBF", fontSize: 18, fontWeight: "900" },

  summaryCard: { padding: 16, borderRadius: 20, backgroundColor: "#171033", borderWidth: 1.5, borderColor: "#7C5CF6", marginBottom: 18, shadowColor: "#7C5CF6", shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  summaryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  summaryKicker: { color: "#FFC86A", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  summaryTitle: { color: "#FFF9FC", fontSize: 13, fontWeight: "900" },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#0C071C", overflow: "hidden", marginBottom: 10 },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#00F5D4" },
  summaryHint: { color: "#CBD5E1", fontSize: 10, lineHeight: 15, fontWeight: "600" },

  tabContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
    padding: 4,
    borderRadius: 16,
    backgroundColor: "#140E2A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  tabButtonActive: {
    backgroundColor: "#7C3AED",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  tabButtonText: {
    color: "#94A3B8",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  tabBadgeActive: {
    backgroundColor: "rgba(0, 245, 212, 0.25)",
  },
  tabBadgeText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "900",
  },
  tabBadgeTextActive: {
    color: "#00F5D4",
  },

  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 4, paddingRight: 40 },
  sectionIcon: { fontSize: 13 },
  sectionTitle: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  sectionMeta: { color: "#94A3B8", fontSize: 8.5, fontWeight: "900", letterSpacing: 0.5 },

  missionList: { gap: 12, marginBottom: 20 },
  missionCard: { padding: 14, borderRadius: 20, backgroundColor: "#140E2A", borderWidth: 1.5, borderColor: "rgba(255, 255, 255, 0.08)", flexDirection: "row", gap: 12 },
  missionDone: { borderColor: "#00F5D4", backgroundColor: "rgba(0, 245, 212, 0.08)", shadowColor: "#00F5D4", shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  missionClaimed: { opacity: 0.65, borderColor: "rgba(255,255,255,0.05)" },

  iconBox: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#1E163B", borderWidth: 1.5, borderColor: "#3D3163", alignItems: "center", justifyContent: "center" },
  iconBoxDone: { backgroundColor: "rgba(0, 245, 212, 0.15)", borderColor: "#00F5D4" },
  iconBoxClaimed: { backgroundColor: "#17112C", borderColor: "#33294E" },
  iconText: { color: "#A78BFA", fontSize: 22, fontWeight: "900" },

  infoBox: { flex: 1 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  missionTitle: { color: "#FFF9FC", fontSize: 14, fontWeight: "900", letterSpacing: 0.2 },
  diffBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  diffBadgeText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  missionDesc: { color: "#CBD5E1", fontSize: 11, marginTop: 2, marginBottom: 8, lineHeight: 15, fontWeight: "600" },

  rewardBadgesRow: { flexDirection: "row", gap: 6, marginBottom: 10, flexWrap: "wrap" },
  rewardChipPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: "rgba(0, 245, 212, 0.1)", borderWidth: 1, borderColor: "rgba(0, 245, 212, 0.3)" },
  rewardChipText: { color: "#00F5D4", fontSize: 9.5, fontWeight: "900" },

  cardTrack: { height: 6, borderRadius: 3, backgroundColor: "#0C071C", overflow: "hidden", marginBottom: 8 },
  cardFill: { height: "100%", borderRadius: 3, backgroundColor: "#8B5CF6" },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusText: { color: "#94A3B8", fontSize: 10, fontWeight: "800" },
  claimedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.05)" },
  claimedText: { color: "#64748B", fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  inProgressPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: "rgba(255, 255, 255, 0.04)" },
  inProgressText: { color: "#94A3B8", fontSize: 8.5, fontWeight: "800" },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: "#7C3AED" },
  claimButtonGold: {
    backgroundColor: "#FFC24A",
    shadowColor: "#FFC24A",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: { color: "#FFFFFF", fontSize: 9.5, fontWeight: "900", letterSpacing: 0.4 },
});
