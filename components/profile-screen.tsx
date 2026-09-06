import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AVATARS,
  badgesFor,
  getActiveCyberTitle,
  getPlayerLevel,
  isAvatarUnlocked,
  type AvatarId,
  type PlayerProgress,
  type ThemePackId,
} from "@/shared/progression";
import { triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";

export function ProfileScreen({
  playerName,
  onUpdatePlayerName,
  progress,
  onSelectAvatar,
  sfxOn,
  toggleSfx,
  hapticsOn,
  toggleHaptics,
  onLogout,
}: {
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  progress: PlayerProgress;
  onSelectAvatar: (avatar: AvatarId) => void;
  onSelectTheme?: (theme: ThemePackId) => void;
  sfxOn: boolean;
  toggleSfx: (val: boolean) => void;
  hapticsOn: boolean;
  toggleHaptics: (val: boolean) => void;
  onBack?: () => void;
  onLogout: () => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  const safeName = playerName.trim().slice(0, 16) || "OYUNCU";
  const activeAvatar = AVATARS.find((a) => a.id === progress.selectedAvatar) ?? AVATARS[0]!;
  const currentLevel = getPlayerLevel(progress.xp);
  const currentLevelXp = progress.xp % 200;
  const nextLevelXp = 200;
  const progressRatio = Math.min(1, Math.max(0.04, currentLevelXp / nextLevelXp));
  const activeTitle = getActiveCyberTitle(progress);
  const badges = badgesFor(progress);
  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  const longestWord =
    progress.history && progress.history.length
      ? [...progress.history].sort((a, b) => b.length - a.length)[0]
      : "—";

  const handleSaveName = () => {
    const trimmed = nameInput.trim().toUpperCase().slice(0, 16);
    if (trimmed) {
      onUpdatePlayerName(trimmed);
      triggerHapticSuccess();
    }
    setIsEditingName(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. HERO OYUNCU KARTI (Full Width Player Identity) */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          {/* Avatar with Level Badge */}
          <View style={styles.avatarWrapper}>
            <View
              style={[
                styles.avatarRing,
                {
                  backgroundColor: activeAvatar.surface,
                  borderColor: activeAvatar.color,
                  shadowColor: activeAvatar.color,
                },
              ]}
            >
              <Text style={[styles.avatarGlyph, { color: activeAvatar.color }]}>
                {activeAvatar.icon}
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LV.{currentLevel}</Text>
            </View>
          </View>

          {/* Name & Title */}
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              {isEditingName ? (
                <View style={styles.nameEditWrap}>
                  <TextInput
                    value={nameInput}
                    onChangeText={setNameInput}
                    maxLength={16}
                    autoCapitalize="characters"
                    autoFocus
                    onBlur={handleSaveName}
                    onSubmitEditing={handleSaveName}
                    style={styles.nameTextInput}
                  />
                  <Pressable onPress={handleSaveName} style={styles.saveNameBtn}>
                    <Text style={styles.saveNameBtnText}>✓</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setNameInput(safeName);
                    setIsEditingName(true);
                  }}
                  style={styles.namePressable}
                >
                  <Text numberOfLines={1} style={styles.heroName}>
                    {safeName}
                  </Text>
                  <Text style={styles.editPen}>✏️</Text>
                </Pressable>
              )}
            </View>

            {/* Cyber Title & Rank Badge */}
            <View style={styles.titleBadgeRow}>
              <View style={styles.titleBadge}>
                <Text style={styles.titleBadgeText}>{activeTitle}</Text>
              </View>
              <Text style={styles.heroSubtitle}>SİBER OYUNCU</Text>
            </View>
          </View>
        </View>

        {/* Level XP Progress Bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeaderRow}>
            <Text style={styles.xpLabel}>SEVİYE İLERLEMESİ</Text>
            <Text style={styles.xpValues}>
              <Text style={styles.xpCurrent}>{currentLevelXp}</Text> / {nextLevelXp} XP
            </Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${progressRatio * 100}%` }]} />
          </View>
          <Text style={styles.xpNextHint}>
            Seviye {currentLevel + 1}'e {nextLevelXp - currentLevelXp} XP kaldı
          </Text>
        </View>
      </View>

      {/* 2. KARİYER İSTATİSTİKLERİ (2x2 Balanced Grid) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📊 KARİYER İSTATİSTİKLERİ</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statTile}>
          <View style={styles.statIconBox}>
            <Text style={styles.statIcon}>🏆</Text>
          </View>
          <Text style={styles.statNumber}>{progress.wins}</Text>
          <Text style={styles.statCaption}>GALİBİYET</Text>
        </View>

        <View style={styles.statTile}>
          <View style={styles.statIconBox}>
            <Text style={styles.statIcon}>⚡</Text>
          </View>
          <Text style={styles.statNumber}>{progress.bestScore}</Text>
          <Text style={styles.statCaption}>EN İYİ SKOR</Text>
        </View>

        <View style={styles.statTile}>
          <View style={styles.statIconBox}>
            <Text style={styles.statIcon}>📚</Text>
          </View>
          <Text style={styles.statNumber}>
            {progress.history ? progress.history.length : 0}
          </Text>
          <Text style={styles.statCaption}>ÇÖZÜLEN KELİME</Text>
        </View>

        <View style={styles.statTile}>
          <View style={styles.statIconBox}>
            <Text style={styles.statIcon}>🔥</Text>
          </View>
          <Text style={styles.statNumber}>{progress.streak} GÜN</Text>
          <Text style={styles.statCaption}>GÜNLÜK SERİ</Text>
        </View>
      </View>

      {/* Mini Intel Strip */}
      <View style={styles.intelStrip}>
        <View style={styles.intelCell}>
          <Text style={styles.intelLabel}>En İyi Tempo</Text>
          <Text style={styles.intelValue}>{progress.bestTempo || "—"} K/D</Text>
        </View>
        <View style={styles.intelDivider} />
        <View style={styles.intelCell}>
          <Text style={styles.intelLabel}>En Uzun Rota</Text>
          <Text style={[styles.intelValue, { color: "#FFC24A" }]}>{longestWord}</Text>
        </View>
        <View style={styles.intelDivider} />
        <View style={styles.intelCell}>
          <Text style={styles.intelLabel}>Toplam XP</Text>
          <Text style={[styles.intelValue, { color: "#50E3C2" }]}>{progress.xp}</Text>
        </View>
      </View>

      {/* 3. KİMLİK KASASI: AVATARLAR (Horizontal Carousel) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎭 KİMLİK KASASI (AVATARLAR)</Text>
        <Text style={styles.sectionMeta}>DOKUN VE SEÇ</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalRow}
      >
        {AVATARS.map((avatar) => {
          const isSelected = avatar.id === progress.selectedAvatar;
          const unlocked = isAvatarUnlocked(avatar.id, progress);
          return (
            <Pressable
              key={avatar.id}
              onPress={() => {
                if (!unlocked) {
                  Alert.alert(`🔒 ${avatar.label} KİLİTLİ`, avatar.unlockHint);
                } else {
                  triggerHapticSuccess();
                  onSelectAvatar(avatar.id);
                }
              }}
              style={({ pressed }) => [
                styles.avatarTile,
                {
                  backgroundColor: unlocked ? avatar.surface : "rgba(22, 17, 40, 0.6)",
                  borderColor: isSelected
                    ? avatar.color
                    : unlocked
                    ? "#3D3160"
                    : "#2A2146",
                },
                isSelected && {
                  shadowColor: avatar.color,
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  elevation: 4,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.avatarTileGlyph, { color: unlocked ? avatar.color : "#665E77" }]}>
                {unlocked ? avatar.icon : "🔒"}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.avatarTileLabel,
                  isSelected && { color: avatar.color, fontWeight: "900" },
                  !unlocked && { color: "#7B748C" },
                ]}
              >
                {avatar.label}
              </Text>
              {isSelected && (
                <View style={[styles.activeDotBadge, { backgroundColor: avatar.color }]}>
                  <Text style={styles.activeDotCheck}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 4. BAŞARI ROZETLERİ (Horizontal Carousel) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏆 BAŞARI ROZETLERİ</Text>
        <Text style={styles.sectionMeta}>
          {unlockedBadgesCount}/{badges.length} AÇILDI
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalRow}
      >
        {badges.map((badge) => {
          const unlocked = badge.unlocked;
          return (
            <Pressable
              key={badge.id}
              onPress={() => {
                Alert.alert(
                  unlocked ? `🏆 ${badge.title} (KAZANILDI)` : `🔒 ${badge.title} (KİLİTLİ)`,
                  unlocked
                    ? `${badge.description}\n\nTebrikler, bu başarıyı kazandın!`
                    : `${badge.description}\n\nBu rozeti kazanmak için görevi tamamla.`
                );
              }}
              style={({ pressed }) => [
                styles.badgeTile,
                unlocked
                  ? { borderColor: badge.accent, backgroundColor: "rgba(33, 26, 61, 0.6)" }
                  : styles.badgeTileLocked,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.badgeIconBubble,
                  unlocked
                    ? { backgroundColor: "rgba(255,255,255,0.08)", borderColor: badge.accent }
                    : { backgroundColor: "rgba(0,0,0,0.2)", borderColor: "#393151" },
                ]}
              >
                <Text
                  style={[
                    styles.badgeIconText,
                    { color: unlocked ? badge.accent : "#766D89" },
                  ]}
                >
                  {unlocked ? badge.icon : "🔒"}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[styles.badgeTileTitle, !unlocked && { color: "#8E889C" }]}
              >
                {badge.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 5. OYUN AYARLARI & OTURUM */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⚙️ OYUN VE HESAP AYARLARI</Text>
      </View>

      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>SES EFEKTLERİ</Text>
          <Switch
            value={sfxOn}
            onValueChange={(val) => {
              triggerHapticSelection();
              toggleSfx(val);
            }}
            trackColor={{ false: "#2A214A", true: "#00F5D4" }}
            thumbColor="#FFF"
          />
        </View>

        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.settingLabel}>TİTREŞİM (HAPTICS)</Text>
          <Switch
            value={hapticsOn}
            onValueChange={(val) => {
              triggerHapticSelection();
              toggleHaptics(val);
            }}
            trackColor={{ false: "#2A214A", true: "#00F5D4" }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.footerActions}>
        <Pressable
          onPress={() => {
            Alert.alert(
              "⚠️ HESAP ÇIKIŞI & SIFIRLAMA",
              "Hesabınızdan çıkış yapmak ve oturumu sıfırlamak istediğinize emin misiniz?",
              [
                { text: "VAZGEÇ", style: "cancel" },
                { text: "ÇIKIŞ YAP", style: "destructive", onPress: onLogout },
              ]
            );
          }}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutBtnText}>HESAPTAN ÇIKIŞ YAP</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Alert.alert(
              "🔒 GİZLİLİK POLİTİKASI",
              "Kelime Patlat, kullanıcı verilerini en yüksek güvenlik standartlarında korur. Hesabınız ve maç ilerlemeniz yalnızca sıralama ve senkronizasyon için saklanır.\n\nİletişim: destek@kelimepatlat.app",
              [{ text: "TAMAM" }]
            );
          }}
          style={styles.privacyBtn}
        >
          <Text style={styles.privacyBtnText}>🔒 GİZLİLİK POLİTİKASI (PRIVACY POLICY)</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 4,
    paddingBottom: 130,
  },

  /* 1. HERO OYUNCU KARTI */
  heroCard: {
    backgroundColor: "rgba(23, 17, 44, 0.95)",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "rgba(124, 92, 246, 0.35)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 14,
  },
  avatarRing: {
    width: 66,
    height: 66,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarGlyph: {
    fontSize: 30,
  },
  levelBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  levelBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  namePressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroName: {
    color: "#FFF",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  editPen: {
    fontSize: 14,
  },
  nameEditWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  nameTextInput: {
    flex: 1,
    backgroundColor: "#1D1636",
    color: "#00F5D4",
    fontSize: 17,
    fontWeight: "900",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#00F5D4",
  },
  saveNameBtn: {
    backgroundColor: "#00F5D4",
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveNameBtnText: {
    color: "#121025",
    fontWeight: "900",
    fontSize: 16,
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  titleBadge: {
    backgroundColor: "rgba(124, 92, 246, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  titleBadgeText: {
    color: "#C4B5FD",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroSubtitle: {
    color: "#8E82A8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  /* XP Progress */
  xpSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(124, 92, 246, 0.15)",
  },
  xpHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  xpLabel: {
    color: "#8E82A8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  xpValues: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "800",
  },
  xpCurrent: {
    color: "#00F5D4",
    fontWeight: "900",
  },
  xpTrack: {
    height: 8,
    backgroundColor: "#16112C",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2B214D",
  },
  xpFill: {
    height: "100%",
    backgroundColor: "#00F5D4",
    borderRadius: 6,
  },
  xpNextHint: {
    color: "#6F638A",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "right",
  },

  /* Section Headers */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  sectionMeta: {
    color: "#7C3AED",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  /* 2. STATS GRID (2x2) */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  statTile: {
    width: "48%",
    backgroundColor: "rgba(23, 17, 44, 0.85)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2C2250",
    alignItems: "center",
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(124, 92, 246, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statIcon: {
    fontSize: 16,
  },
  statNumber: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  statCaption: {
    color: "#8E82A8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginTop: 2,
  },

  /* Mini Intel Strip */
  intelStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(19, 14, 38, 0.9)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#2A204B",
    marginTop: 10,
    alignItems: "center",
  },
  intelCell: {
    flex: 1,
    alignItems: "center",
  },
  intelLabel: {
    color: "#7C7094",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  intelValue: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  intelDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#2B214D",
  },

  /* Horizontal Row (Carousels) */
  horizontalRow: {
    gap: 10,
    paddingVertical: 4,
  },

  /* 3. AVATARS */
  avatarTile: {
    width: 78,
    height: 86,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    position: "relative",
  },
  avatarTileGlyph: {
    fontSize: 26,
    marginBottom: 4,
  },
  avatarTileLabel: {
    color: "#A79BBF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  activeDotBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeDotCheck: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
  },

  /* 4. BADGES */
  badgeTile: {
    width: 84,
    height: 86,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  badgeTileLocked: {
    backgroundColor: "rgba(18, 14, 34, 0.5)",
    borderColor: "#281F42",
    opacity: 0.65,
  },
  badgeIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  badgeIconText: {
    fontSize: 16,
  },
  badgeTileTitle: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  /* 5. SETTINGS & DANGER ZONE */
  settingsCard: {
    backgroundColor: "rgba(22, 16, 42, 0.85)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2C2250",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#281E48",
  },
  settingLabel: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  footerActions: {
    marginTop: 18,
    gap: 10,
  },
  logoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.4)",
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
  },
  logoutBtnText: {
    color: "#F87171",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  privacyBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  privacyBtnText: {
    color: "#7C7094",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
