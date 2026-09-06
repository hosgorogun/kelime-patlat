import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { missionProgress, SEASON_MISSIONS, type PlayerProgress, type SeasonMission } from "@/shared/progression";

export function MissionsScreen({
  progress,
  onBack,
  onPlayDaily,
  onClaimWeekly,
}: {
  progress: PlayerProgress;
  onBack: () => void;
  onPlayDaily: () => void;
  onClaimWeekly?: (missionId: "victoryStreak" | "speedDemon", xp: number, shield?: number) => void;
}) {
  const completedCount = SEASON_MISSIONS.filter((m) => (progress.missions[m.id] ?? 0) >= m.target).length;
  const totalXp = SEASON_MISSIONS.reduce((sum, m) => sum + ((progress.missions[m.id] ?? 0) >= m.target ? m.rewardXp : 0), 0);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.overline}>SİBER GÖREV MERKEZİ</Text>
          <Text style={styles.title}>GÖREV PANOSU</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>+{totalXp} XP</Text>
        </View>
      </View>

      {/* Mission Summary Banner */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHead}>
          <Text style={styles.summaryKicker}>SEZON 01 İLERLEMESİ</Text>
          <Text style={styles.summaryTitle}>{completedCount + (progress.wins >= 3 ? 1 : 0) + ((progress.bestArcadeScore || 0) >= 400 ? 1 : 0)}/{SEASON_MISSIONS.length + 2} GÖREV TAMAMLANDI</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(((completedCount + (progress.wins >= 3 ? 1 : 0) + ((progress.bestArcadeScore || 0) >= 400 ? 1 : 0)) / (SEASON_MISSIONS.length + 2)) * 100)}%` }]} />
        </View>
        <Text style={styles.summaryHint}>💡 Görevleri tamamlayarak ekstra XP kazanın ve Siber Unvanların kilidini açın!</Text>
      </View>

      {/* Daily Missions Section */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>⚡ GÜNLÜK GÖREVLER</Text>
        <Text style={styles.sectionMeta}>HER GÜN YENİLENİR</Text>
      </View>

      <View style={styles.missionList}>
        {SEASON_MISSIONS.map((mission) => {
          const current = progress.missions[mission.id] ?? 0;
          const isDone = current >= mission.target;
          const pct = Math.min(100, Math.round((current / mission.target) * 100));

          return (
            <View key={mission.id} style={[styles.missionCard, isDone && styles.missionDone]}>
              <View style={[styles.iconBox, isDone && styles.iconBoxDone]}>
                <Text style={[styles.iconText, isDone && { color: "#00F5D4" }]}>{isDone ? "✓" : mission.icon}</Text>
              </View>

              <View style={styles.infoBox}>
                <View style={styles.cardTopRow}>
                  <Text style={[styles.missionTitle, isDone && { color: "#00F5D4" }]}>{mission.title}</Text>
                  <Text style={styles.rewardTag}>+{mission.rewardXp} XP</Text>
                </View>
                <Text style={styles.missionDesc}>{mission.description}</Text>

                {/* Progress bar */}
                <View style={styles.cardTrack}>
                  <View style={[styles.cardFill, { width: `${pct}%` }, isDone && { backgroundColor: "#00F5D4" }]} />
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.statusText}>{current}/{mission.target} ({pct}%)</Text>

                  {isDone ? (
                    <Text style={styles.claimedText}>✓ TAMAMLANDI</Text>
                  ) : mission.id === "daily" ? (
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
        })}
      </View>

      {/* Weekly Season Missions Section */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>🏆 HAFTALIK MİSYONLAR</Text>
        <Text style={styles.sectionMeta}>ÖZEL ÖDÜLLER</Text>
      </View>

      <View style={styles.missionList}>
        <View style={styles.missionCard}>
          <View style={styles.iconBox}><Text style={styles.iconText}>♕</Text></View>
          <View style={styles.infoBox}>
            <View style={styles.cardTopRow}>
              <Text style={styles.missionTitle}>ZAFER SERİSİ</Text>
              <Text style={styles.rewardTag}>+250 XP · 🛡️ 1 KALKAN</Text>
            </View>
            <Text style={styles.missionDesc}>Canlı düellolarda 3 galibiyet elde et.</Text>
            <View style={styles.cardTrack}>
              <View style={[styles.cardFill, { width: `${Math.min(100, Math.round((progress.wins / 3) * 100))}%` }]} />
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.statusText}>{progress.wins}/3 Galibiyet</Text>
              {progress.weeklyClaimed?.victoryStreak ? (
                <Text style={styles.claimedText}>✓ ALINDI</Text>
              ) : progress.wins >= 3 ? (
                <Pressable
                  onPress={() => onClaimWeekly?.("victoryStreak", 250, 1)}
                  style={({ pressed }) => [styles.actionButton, { backgroundColor: "#FFC24A" }, pressed && { opacity: 0.8 }]}
                >
                  <Text style={[styles.actionText, { color: "#121025" }]}>ÖDÜLÜ AL 🎁</Text>
                </Pressable>
              ) : (
                <Text style={styles.inProgressText}>DEVAM EDİYOR</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.missionCard}>
          <View style={styles.iconBox}><Text style={styles.iconText}>⚡</Text></View>
          <View style={styles.infoBox}>
            <View style={styles.cardTopRow}>
              <Text style={styles.missionTitle}>HIZ CANAVARI</Text>
              <Text style={styles.rewardTag}>+200 XP</Text>
            </View>
            <Text style={styles.missionDesc}>Zamana Karşı (Arcade) modunda 400 skoru aş.</Text>
            <View style={styles.cardTrack}>
              <View style={[styles.cardFill, { width: `${Math.min(100, Math.round(((progress.bestArcadeScore || 0) / 400) * 100))}%` }]} />
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.statusText}>{progress.bestArcadeScore || 0}/400 Puan</Text>
              {progress.weeklyClaimed?.speedDemon ? (
                <Text style={styles.claimedText}>✓ ALINDI</Text>
              ) : (progress.bestArcadeScore || 0) >= 400 ? (
                <Pressable
                  onPress={() => onClaimWeekly?.("speedDemon", 200)}
                  style={({ pressed }) => [styles.actionButton, { backgroundColor: "#00F5D4" }, pressed && { opacity: 0.8 }]}
                >
                  <Text style={[styles.actionText, { color: "#121025" }]}>ÖDÜLÜ AL 🎁</Text>
                </Pressable>
              ) : (
                <Text style={styles.inProgressText}>DEVAM EDİYOR</Text>
              )}
            </View>
          </View>
        </View>
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
  rewardTag: { color: "#00F5D4", fontSize: 9.5, fontWeight: "900" },
  missionDesc: { color: "#A49BBF", fontSize: 10, marginTop: 2, marginBottom: 8, lineHeight: 14 },

  cardTrack: { height: 6, borderRadius: 3, backgroundColor: "#2B224A", overflow: "hidden", marginBottom: 8 },
  cardFill: { height: "100%", borderRadius: 3, backgroundColor: "#8B5CF6" },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusText: { color: "#C4B5FD", fontSize: 9, fontWeight: "800" },
  claimedText: { color: "#00F5D4", fontSize: 9.5, fontWeight: "900" },
  inProgressText: { color: "#8E82A8", fontSize: 8.5, fontWeight: "800" },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: "#7C3AED" },
  actionText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
});
