import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AVATARS, badgesFor, isAvatarUnlocked, type AvatarId, type PlayerProgress } from "@/shared/progression";

export function PlayerCollection({ progress, onSelectAvatar }: { progress: PlayerProgress; onSelectAvatar: (avatar: AvatarId) => void }) {
  const badges = badgesFor(progress);
  return <View style={styles.root}>
    <View style={styles.sectionTop}><View><Text style={styles.kicker}>KİMLİK KASASI</Text><Text style={styles.title}>AVATARIN</Text></View><Text style={styles.count}>{badges.filter((badge) => badge.unlocked).length}/{badges.length} ROZET</Text></View>
    <View style={styles.avatarGrid}>{AVATARS.map((avatar) => {
      const selected = avatar.id === progress.selectedAvatar;
      const unlocked = isAvatarUnlocked(avatar.id, progress);
      return (
        <Pressable
          key={avatar.id}
          onPress={() => {
            if (!unlocked) {
              Alert.alert(`🔒 ${avatar.label} KİLİTLİ`, avatar.unlockHint);
            } else {
              onSelectAvatar(avatar.id);
            }
          }}
          style={({ pressed }) => [
            styles.avatarCard,
            { backgroundColor: unlocked ? avatar.surface : "rgba(25, 21, 45, 0.4)", borderColor: selected ? avatar.color : unlocked ? "#403664" : "#2E264E" },
            !unlocked && { opacity: 0.65 },
            selected && { shadowColor: avatar.color, shadowOpacity: 0.38, shadowRadius: 10, elevation: 5 },
            pressed && styles.pressed
          ]}
        >
          <Text style={[styles.avatarGlyph, { color: unlocked ? avatar.color : "#665E77" }]}>
            {unlocked ? avatar.icon : "🔒"}
          </Text>
          <Text style={[styles.avatarLabel, selected && { color: avatar.color }, !unlocked && { color: "#7B748C" }]}>
            {avatar.label}
          </Text>
          {selected && <View style={[styles.check, { backgroundColor: avatar.color }]}><Text style={styles.checkText}>✓</Text></View>}
        </Pressable>
      );
    })}</View>
    <Text style={[styles.kicker, { marginTop: 12 }]}>BAŞARI ROZETLERİ (DETAY İÇİN DOKUN)</Text>
    <View style={styles.badgeGrid}>
      {badges.map((badge) => {
        const unlocked = badge.unlocked;
        return (
          <Pressable
            key={badge.id}
            onPress={() => {
              Alert.alert(
                unlocked ? `🏆 ${badge.title} (AÇILDI)` : `🔒 ${badge.title} (KİLİTLİ)`,
                unlocked 
                  ? `${badge.description}\n\nTebrikler, bu başarıyı kazandın!` 
                  : `${badge.description}\n\nBu rozeti kazanmak için görevi tamamlamalısın.`
              );
            }}
            style={({ pressed }) => [
              styles.badgeCard,
              unlocked 
                ? { borderColor: badge.accent, backgroundColor: "rgba(33, 26, 61, 0.4)" } 
                : styles.badgeCardLocked,
              pressed && styles.pressed
            ]}
          >
            <View style={[
              styles.badgeIconCircle, 
              unlocked 
                ? { backgroundColor: "rgba(255,255,255,0.06)", borderColor: badge.accent }
                : { backgroundColor: "rgba(0,0,0,0.15)", borderColor: "#393151" }
            ]}>
              <Text style={[
                styles.badgeIconText, 
                { color: unlocked ? badge.accent : "#766D89" }
              ]}>
                {unlocked ? badge.icon : "🔒"}
              </Text>
            </View>
            <Text numberOfLines={2} style={[styles.badgeCardTitle, !unlocked && { color: "#8E889C" }]}>
              {badge.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { marginTop: 14 }, 
  sectionTop: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }, 
  kicker: { color: "#D8B4FE", fontSize: 8, fontWeight: "900", letterSpacing: 1.1 }, 
  title: { color: "#FFF9FC", fontSize: 17, fontWeight: "900", marginTop: 3 }, 
  count: { color: "#00F5D4", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }, 
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 17 }, 
  avatarCard: { width: "31.6%", minHeight: 83, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", position: "relative" }, 
  avatarGlyph: { fontSize: 25, fontWeight: "900" }, 
  avatarLabel: { color: "#FFFFFF", fontSize: 7, fontWeight: "900", letterSpacing: 0.5, marginTop: 6 }, 
  check: { position: "absolute", top: 6, right: 6, width: 15, height: 15, borderRadius: 7.5, alignItems: "center", justifyContent: "center" }, 
  checkText: { color: "#121025", fontSize: 9, fontWeight: "900" }, 
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 9, width: "100%" }, 
  badgeCard: { width: "31.6%", minHeight: 100, borderRadius: 16, borderWidth: 1.5, padding: 8, alignItems: "center", justifyContent: "center" }, 
  badgeCardLocked: { backgroundColor: "rgba(25, 21, 45, 0.4)", borderColor: "#393151", opacity: 0.65 }, 
  badgeIconCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 6 }, 
  badgeIconText: { fontSize: 16, fontWeight: "900" }, 
  badgeCardTitle: { color: "#FFF9FC", fontSize: 8, fontWeight: "900", letterSpacing: 0.4, textAlign: "center", lineHeight: 11 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
});
