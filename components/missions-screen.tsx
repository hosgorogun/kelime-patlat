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

  const todayId = useMemo(() => getDayId(), []);
  const weekId = useMemo(() => getWeekId(), []);

  const dailyMissions = useMemo(() => getDailyMissions(todayId), [todayId]);
  const weeklyMissions = useMemo(() => getWeeklyMissions(weekId), [weekId]);

  const allActiveMissions = useMemo(() => [...dailyMissions, ...weeklyMissions], [dailyMissions, weeklyMissions]);

  const completedCount = allActiveMissions.filter((m) => {
    const isDaily = m.period === "daily";
    const current = progress.missions?.[m.id] ?? 0;
    return current >= m.target;
  }).length;

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

    const rewardsList: string[] = [`+${mission.rewardXp} XP`, `+${mission.rewardCoins} Siber Çip 🪙`];
    if (mission.rewardShields && mission.rewardShields > 0) {
      rewardsList.push(`+${mission.rewardShields} Seri Kalkanı 🛡️`);
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
      <View key={mission.id} style={[styles.missionCard, isDone && styles.missionDone]}>
        <View style={[styles.iconBox, isDone && styles.iconBoxDone]}>
          <Text style={[styles.iconText, isDone && { color: "#00F5D4" }]}>{isDone ? "✓" : icon}</Text>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.cardTopRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
              <Text style={[styles.missionTitle, isDone && { color: "#00F5D4" }]}>{mission.title}</Text>
              <View style={[styles.diffBadge, { backgroundColor: diffConfig.bg, borderColor: diffConfig.border }]}>
                <Text style={[styles.diffBadgeText, { color: diffConfig.color }]}>{diffConfig.label}</Text>
              </View>
            </View>
            <Text style={styles.rewardTag}>
              +{mission.rewardXp} XP · 🪙 {mission.rewardCoins}
              {mission.rewardShields ? ` · 🛡️ ${mission.rewardShields}` : ""}
            </Text>
          </View>
          <Text style={styles.missionDesc}>{mission.desc}</Text>

          {/* Progress bar */}
          <View style={styles.cardTrack}>
            <View
              style={[
                styles.cardFill,
                { width: `${pct}%`, backgroundColor: diffConfig.color },
                isDone && { backgroundColor: "#00F5D4" },
              ]}
            />
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.statusText}>
              {current}/{mission.target} ({pct}%)
            </Text>

            {isClaimed ? (
              <View style={styles.claimedBadge}>
                <Text style={styles.claimedText}>✓ ALINDI</Text>
              </View>
            ) : isDone ? (
              <Pressable
                onPress={() => handleClaimMission(mission)}
                style={({ pressed }) => [styles.actionButton, styles.claimButtonGold, pressed && { opacity: 0.8 }]}
              >
                <Text style={[styles.actionText, { color: "#121025" }]}>ÖDÜLÜ AL 🎁</Text>
              </Pressable>
            ) : mission.actionType === "daily_route" ? (
              <Pressable onPress={onPlayDaily} style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}>
                <Text style={styles.actionText}>OYNAT →</Text>
              </Pressable>
            ) : (
              <Text style={styles.inProgressText}>DEVAM EDİYOR</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.overline}>SİBER GÖREV MERKEZİ</Text>
          <Text style={styles.title}>DİNAMİK GÖREV PANOSU</Text>
        </View>
        <View style={styles.totalBadge}>
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
          <Text style={styles.summaryKicker}>AKTİF DÖNGÜ İLERLEMESİ</Text>
          <Text style={styles.summaryTitle}>
            {completedCount}/{allActiveMissions.length} GÖREV TAMAMLANDI
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round((completedCount / (allActiveMissions.length || 1)) * 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.summaryHint}>
          💡 90 Günlük ve 30 Haftalık devasa havuzdan her gün ve her pazartesi yepyeni görevler ve zorluk dereceleri seni bekliyor!
        </Text>
      </View>

      {/* Daily Missions Section */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>⚡ GÜNLÜK GÖREVLER (3 ADET)</Text>
        <Text style={styles.sectionMeta}>HER GÜN 00:00'DA YENİLENİR</Text>
      </View>

      <View style={styles.missionList}>
        {dailyMissions.map((m) => renderMissionCard(m))}
      </View>

      {/* Weekly Season Missions Section */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>🏆 HAFTALIK MİSYONLAR (3 ADET)</Text>
        <Text style={styles.sectionMeta}>HER PAZARTESİ YENİLENİR</Text>
      </View>

      <View style={styles.missionList}>
        {weeklyMissions.map((m) => renderMissionCard(m))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 0, paddingTop: 4, paddingBottom: 136 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  back: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#1E1838", borderWidth: 1, borderColor: "rgba(124, 92, 246, 0.25)", alignItems: "center", justifyContent: "center" },
  backText: { color: "#FFF9FC", fontSize: 26, lineHeight: 28 },
  overline: { color: "#A78BFA", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  title: { color: "#FFF9FC", fontSize: 18, fontWeight: "900", marginTop: 2, letterSpacing: 0.3 },
  totalBadge: { marginLeft: "auto", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: "rgba(0, 245, 212, 0.12)", borderWidth: 1.5, borderColor: "#00F5D4" },
  totalBadgeText: { color: "#00F5D4", fontSize: 12, fontWeight: "900" },

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

  summaryCard: { padding: 16, borderRadius: 20, backgroundColor: "rgba(30, 23, 56, 0.95)", borderWidth: 1.5, borderColor: "#7C5CF6", marginBottom: 16, shadowColor: "#7C5CF6", shadowOpacity: 0.15, shadowRadius: 10 },
  summaryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  summaryKicker: { color: "#FFC86A", fontSize: 8.5, fontWeight: "900", letterSpacing: 0.8 },
  summaryTitle: { color: "#FFF9FC", fontSize: 13, fontWeight: "900" },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#322756", overflow: "hidden", marginBottom: 10 },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#00F5D4" },
  summaryHint: { color: "#C4B5FD", fontSize: 9.5, lineHeight: 14 },

  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 4 },
  sectionTitle: { color: "#E9D5FF", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  sectionMeta: { color: "#766D89", fontSize: 8, fontWeight: "900" },

  missionList: { gap: 10, marginBottom: 18 },
  missionCard: { padding: 14, borderRadius: 18, backgroundColor: "rgba(24, 19, 45, 0.9)", borderWidth: 1, borderColor: "#372B5E", flexDirection: "row", gap: 12 },
  missionDone: { borderColor: "#00F5D4", backgroundColor: "rgba(0, 245, 212, 0.05)" },
  iconBox: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#2A204C", borderWidth: 1, borderColor: "#4C3B82", alignItems: "center", justifyContent: "center" },
  iconBoxDone: { backgroundColor: "rgba(0, 245, 212, 0.15)", borderColor: "#00F5D4" },
  iconText: { color: "#A78BFA", fontSize: 20, fontWeight: "900" },

  infoBox: { flex: 1 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  missionTitle: { color: "#FFF9FC", fontSize: 13, fontWeight: "900" },
  diffBadge: { paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 5, borderWidth: 1 },
  diffBadgeText: { fontSize: 7.5, fontWeight: "900", letterSpacing: 0.5 },
  rewardTag: { color: "#00F5D4", fontSize: 9.5, fontWeight: "900" },
  missionDesc: { color: "#A49BBF", fontSize: 10, marginTop: 2, marginBottom: 8, lineHeight: 14 },

  cardTrack: { height: 6, borderRadius: 3, backgroundColor: "#2B224A", overflow: "hidden", marginBottom: 8 },
  cardFill: { height: "100%", borderRadius: 3, backgroundColor: "#8B5CF6" },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusText: { color: "#C4B5FD", fontSize: 9, fontWeight: "800" },
  claimedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(0, 245, 212, 0.12)", borderWidth: 1, borderColor: "#00F5D4" },
  claimedText: { color: "#00F5D4", fontSize: 9.5, fontWeight: "900" },
  inProgressText: { color: "#8E82A8", fontSize: 8.5, fontWeight: "800" },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: "#7C3AED" },
  claimButtonGold: {
    backgroundColor: "#FFC24A",
    shadowColor: "#FFC24A",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  claimButtonCyan: {
    backgroundColor: "#00F5D4",
    shadowColor: "#00F5D4",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
});
