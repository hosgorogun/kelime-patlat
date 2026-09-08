import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  AVATARS,
  CYBER_TITLES,
  badgesFor,
  getActiveCyberTitle,
  getPlayerLevel,
  isAvatarUnlocked,
  THEME_PACKS,
  type AvatarId,
  type GenderType,
  type PlayerProgress,
  type ThemePackId,
} from "@/shared/progression";
import {
  triggerHapticError,
  triggerHapticSelection,
  triggerHapticSuccess,
} from "@/shared/audio-haptics";

export function ProfileScreen({
  playerName,
  onUpdatePlayerName,
  progress,
  onSelectAvatar,
  onSelectTheme,
  onSelectTitle,
  onUpdateGender,
  onUpdateAvatarPhoto,
  sfxOn,
  toggleSfx,
  hapticsOn,
  toggleHaptics,
  onBack,
  onLogout,
  onDeleteAccount,
  onShowToast,
}: {
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  progress: PlayerProgress;
  onSelectAvatar: (avatar: AvatarId) => void;
  onSelectTheme?: (theme: ThemePackId) => void;
  onSelectTitle?: (titleBadge: string) => void;
  onUpdateGender?: (gender: GenderType) => void;
  onUpdateAvatarPhoto?: (photoUrl?: string) => void;
  sfxOn: boolean;
  toggleSfx: (val: boolean) => void;
  hapticsOn: boolean;
  toggleHaptics: (val: boolean) => void;
  onBack?: () => void;
  onLogout: () => void;
  onDeleteAccount?: () => void;
  onShowToast?: (title: string, subtitle: string, icon?: string, accentColor?: string) => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

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
    const trimmed = nameInput.trim().toLocaleUpperCase("tr-TR").slice(0, 16);
    if (trimmed) {
      onUpdatePlayerName(trimmed);
      triggerHapticSuccess();
    }
    setIsEditingName(false);
  };

  const handlePickPhoto = async () => {
    triggerHapticSelection();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "İzin Gerekli",
        "Profil fotoğrafı seçmek için fotoğraf galerisine erişim izni vermeniz gerekmektedir. Ayarlar'dan izin verebilirsiniz."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      triggerHapticSuccess();
      onUpdateAvatarPhoto?.(result.assets[0].uri);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Top Header */}
      <View style={styles.header}>
        {onBack && (
          <Pressable onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        )}
        <View>
          <Text style={styles.overline}>OPERATÖR PROFİLİ</Text>
          <Text style={styles.title}>KULLANICI VE AYARLAR</Text>
        </View>
      </View>

      {/* 1. HERO OYUNCU KARTI (Full Width Player Identity) */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          {/* Avatar with Level Badge & Camera Edit */}
          <View style={styles.avatarWrapper}>
            <Pressable
              onPress={handlePickPhoto}
              style={({ pressed }) => [
                styles.avatarRing,
                {
                  backgroundColor: activeAvatar.surface,
                  borderColor: activeAvatar.color,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              {progress.avatarPhoto ? (
                <Image source={{ uri: progress.avatarPhoto }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarGlyph, { color: activeAvatar.color }]}>
                  {activeAvatar.icon}
                </Text>
              )}
              <View style={styles.cameraIconBtn}>
                <Text style={styles.cameraIconText}>📷</Text>
              </View>
            </Pressable>
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

            {/* Cyber Title & Gender Badge */}
            <View style={styles.titleBadgeRow}>
              <View style={styles.titleBadge}>
                <Text style={styles.titleBadgeText}>{activeTitle}</Text>
              </View>
              <Pressable
                onPress={() => {
                  triggerHapticSelection();
                  const nextGender = progress.gender === "male" ? "female" : progress.gender === "female" ? "unspecified" : "male";
                  onUpdateGender?.(nextGender);
                }}
                style={[
                  styles.genderBadge,
                  progress.gender === "male" && styles.genderBadgeMale,
                  progress.gender === "female" && styles.genderBadgeFemale,
                ]}
              >
                <Text
                  style={[
                    styles.genderBadgeText,
                    progress.gender === "male" && { color: "#38BDF8" },
                    progress.gender === "female" && { color: "#F472B6" },
                  ]}
                >
                  {progress.gender === "male" ? "♂ ERKEK" : progress.gender === "female" ? "♀ KADIN" : "🧑 BELİRTİLMEDİ"}
                </Text>
              </Pressable>
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
            Seviye {currentLevel + 1}&apos;e {nextLevelXp - currentLevelXp} XP kaldı
          </Text>
        </View>

        {/* Quick Gender Picker Buttons */}
        {onUpdateGender && (
          <View style={styles.genderQuickRow}>
            {(["male", "female", "unspecified"] as const).map((g) => {
              const active = progress.gender === g || (!progress.gender && g === "unspecified");
              const isM = g === "male";
              const isF = g === "female";
              return (
                <Pressable
                  key={g}
                  onPress={() => {
                    triggerHapticSelection();
                    onUpdateGender(g);
                  }}
                  style={[
                    styles.genderQuickBtn,
                    active && (isM ? styles.genderQuickBtnM : isF ? styles.genderQuickBtnF : styles.genderQuickBtnU),
                  ]}
                >
                  <Text style={styles.genderQuickIcon}>{isM ? "♂" : isF ? "♀" : "✦"}</Text>
                  <Text style={[styles.genderQuickLabel, active && { color: "#FFF", fontWeight: "900" }]}>
                    {isM ? "Erkek" : isF ? "Kadın" : "Gizli"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
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
          <Text style={styles.intelValue}>{progress.bestTempo || "—"} K/DK</Text>
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

      {/* 4. KİMLİK KASASI: AVATARLAR */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎭 KİMLİK KASASI (AVATARLAR)</Text>
        <Text style={styles.sectionMeta}>DOKUN VE SEÇ</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
        {[...AVATARS.filter((a) => isAvatarUnlocked(a.id, progress)), ...AVATARS.filter((a) => !isAvatarUnlocked(a.id, progress))].map((avatar) => {
          const isSelected = avatar.id === progress.selectedAvatar;
          const unlocked = isAvatarUnlocked(avatar.id, progress);
          return (
            <Pressable
              key={avatar.id}
              onPress={() => {
                if (!unlocked) {
                  if (onShowToast) {
                    onShowToast(`🔒 ${avatar.label.toUpperCase()} KİLİTLİ`, avatar.unlockHint, "🔒", "#EF4444");
                  } else {
                    Alert.alert(`🔒 ${avatar.label} KİLİTLİ`, avatar.unlockHint);
                  }
                } else {
                  triggerHapticSuccess();
                  onSelectAvatar(avatar.id);
                }
              }}
              style={({ pressed }) => [
                styles.avatarTile,
                {
                  backgroundColor: isSelected
                    ? "rgba(35, 26, 65, 0.95)"
                    : unlocked
                    ? "rgba(22, 16, 42, 0.75)"
                    : "rgba(16, 12, 30, 0.55)",
                  borderColor: isSelected ? avatar.color : unlocked ? "rgba(124, 92, 246, 0.25)" : "rgba(50, 40, 75, 0.5)",
                },
                pressed && styles.pressed,
              ]}
            >
              <View style={[
                styles.avatarIconWrapper,
                isSelected && { backgroundColor: `${avatar.color}25`, borderColor: avatar.color }
              ]}>
                <Text style={[styles.avatarTileGlyph, { color: unlocked ? (isSelected ? avatar.color : "#DDD6FE") : "#665E77" }]}>
                  {unlocked ? avatar.icon : "🔒"}
                </Text>
              </View>
              <Text numberOfLines={1} style={[styles.avatarTileLabel, isSelected && { color: avatar.color, fontWeight: "900" }, !unlocked && { color: "#7B748C" }]}>
                {avatar.label}
              </Text>
              {isSelected && (
                <View style={[styles.activePillBadge, { backgroundColor: `${avatar.color}25`, borderColor: avatar.color }]}>
                  <Text style={[styles.activePillText, { color: avatar.color }]}>✓ AKTİF</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 5. SİBER UNVANLAR */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏷️ SİBER UNVANLAR</Text>
        <Text style={styles.sectionMeta}>DOKUN VE KUŞAN</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
        {[...CYBER_TITLES.filter((t) => t.unlocked(progress)), ...CYBER_TITLES.filter((t) => !t.unlocked(progress))].map((title) => {
          const unlocked = title.unlocked(progress);
          const isSelected = activeTitle === title.badge;
          return (
            <Pressable
              key={title.id}
              onPress={() => {
                if (!unlocked) {
                  if (onShowToast) {
                    onShowToast(`🔒 ${title.name.toUpperCase()} KİLİTLİ`, title.unlockHint, "🔒", "#EF4444");
                  } else {
                    Alert.alert(`🔒 ${title.name} KİLİTLİ`, title.unlockHint);
                  }
                } else {
                  triggerHapticSuccess();
                  onSelectTitle?.(title.badge);
                }
              }}
              style={({ pressed }) => [
                styles.titleTile,
                unlocked ? styles.titleTileUnlocked : styles.titleTileLocked,
                isSelected && styles.titleTileSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.titleTopRow}>
                <View style={[styles.titleIconCircle, isSelected && styles.titleIconCircleSelected, !unlocked && styles.titleIconCircleLocked]}>
                  <Text style={styles.titleIconEmoji}>{unlocked ? (isSelected ? "⚡" : "🎖️") : "🔒"}</Text>
                </View>
                <View style={[
                  styles.titleStatusChip,
                  isSelected && styles.titleStatusChipSelected,
                  (!unlocked) && styles.titleStatusChipLocked,
                ]}>
                  <Text style={[
                    styles.titleStatusText,
                    isSelected && { color: "#00F5D4" },
                    (!unlocked) && { color: "#7B748C" },
                  ]}>
                    {isSelected ? "✓ KUŞANILDI" : unlocked ? "SEÇ" : "KİLİTLİ"}
                  </Text>
                </View>
              </View>

              <Text numberOfLines={1} style={[styles.titleTileBadgeText, isSelected && { color: "#00F5D4" }, !unlocked && { color: "#8E889C" }]}>
                {title.badge}
              </Text>

              <Text numberOfLines={1} style={[styles.titleTileName, isSelected && { color: "#F1F5F9" }]}>
                {title.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 6. BAŞARI ROZETLERİ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏆 BAŞARI ROZETLERİ</Text>
        <Text style={styles.sectionMeta}>{unlockedBadgesCount}/{badges.length} AÇILDI</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
        {[...badges.filter((b) => b.unlocked), ...badges.filter((b) => !b.unlocked)].map((badge) => {
          const unlocked = badge.unlocked;
          return (
            <Pressable
              key={badge.id}
              onPress={() => Alert.alert(
                unlocked ? `🏆 ${badge.title} (KAZANILDI)` : `🔒 ${badge.title} (KİLİTLİ)`,
                unlocked ? `${badge.description}\n\nTebrikler, bu başarıyı kazandın!` : `${badge.description}\n\nBu rozeti kazanmak için görevi tamamla.`
              )}
              style={({ pressed }) => [
                styles.badgeTile,
                unlocked ? { borderColor: badge.accent, backgroundColor: "rgba(33, 26, 61, 0.6)" } : styles.badgeTileLocked,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.badgeIconBubble, unlocked ? { backgroundColor: "rgba(255,255,255,0.08)", borderColor: badge.accent } : { backgroundColor: "rgba(0,0,0,0.2)", borderColor: "#393151" }]}>
                <Text style={[styles.badgeIconText, { color: unlocked ? badge.accent : "#766D89" }]}>{unlocked ? badge.icon : "🔒"}</Text>
              </View>
              <Text numberOfLines={1} style={[styles.badgeTileTitle, !unlocked && { color: "#8E889C" }]}>{badge.title}</Text>
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
            triggerHapticError();
            setShowLogoutModal(true);
          }}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutBtnText}>HESAPTAN ÇIKIŞ YAP</Text>
        </Pressable>

        {/* Logout Modal */}
        <Modal
          visible={showLogoutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={[styles.deleteModalCard, { borderColor: "#9A76ED" }]}>
              <Text style={[styles.deleteModalTitle, { color: "#FFF" }]}>⚠️ HESAP ÇIKIŞI & SIFIRLAMA</Text>
              <Text style={styles.deleteModalDesc}>
                Hesabınızdan çıkış yapmak ve oturumu sıfırlamak istediğinize emin misiniz?
              </Text>
              <View style={styles.deleteModalActions}>
                <Pressable
                  onPress={() => setShowLogoutModal(false)}
                  style={styles.deleteModalCancelBtn}
                >
                  <Text style={styles.deleteModalCancelText}>VAZGEÇ</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowLogoutModal(false);
                    onLogout();
                  }}
                  style={[styles.deleteModalConfirmBtn, { backgroundColor: "#9A76ED" }]}
                >
                  <Text style={[styles.deleteModalConfirmText, { color: "#FFF" }]}>ÇIKIŞ YAP</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {onDeleteAccount && (
          <Pressable
            onPress={() => {
              triggerHapticError();
              setDeleteConfirmInput("");
              setShowDeleteModal(true);
            }}
            style={[styles.logoutBtn, { backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "#EF4444", marginTop: 10 }]}
          >
            <Text style={[styles.logoutBtnText, { color: "#EF4444" }]}>🗑️ HESABIMI KALICI OLARAK SİL</Text>
          </Pressable>
        )}

        {/* Text Confirmation Delete Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalCard}>
              <Text style={styles.deleteModalTitle}>🚨 HESAP SİLME DOĞRULAMASI</Text>
              <Text style={styles.deleteModalDesc}>
                Hesabınız ve tüm kayıtlı verileriniz (XP, Çip, Seviye İlerlemesi) kalıcı olarak silinecektir. Bu işlem <Text style={{ fontWeight: "900", color: "#EF4444" }}>GERİ ALINAMAZ</Text>.
              </Text>
              <Text style={styles.deleteModalPrompt}>
                Onaylamak için aşağıya büyük harflerle <Text style={{ fontWeight: "900", color: "#EF4444" }}>SİL</Text> yazın:
              </Text>
              <TextInput
                value={deleteConfirmInput}
                onChangeText={setDeleteConfirmInput}
                placeholder="SİL"
                placeholderTextColor="rgba(239, 68, 68, 0.4)"
                autoCapitalize="characters"
                style={styles.deleteModalInput}
              />
              <View style={styles.deleteModalActions}>
                <Pressable
                  onPress={() => setShowDeleteModal(false)}
                  style={styles.deleteModalCancelBtn}
                >
                  <Text style={styles.deleteModalCancelText}>VAZGEÇ</Text>
                </Pressable>
                <Pressable
                  disabled={deleteConfirmInput.trim().toLocaleUpperCase("tr-TR") !== "SİL"}
                  onPress={() => {
                    if (deleteConfirmInput.trim().toLocaleUpperCase("tr-TR") === "SİL") {
                      setShowDeleteModal(false);
                      onDeleteAccount?.();
                    }
                  }}
                  style={[
                    styles.deleteModalConfirmBtn,
                    deleteConfirmInput.trim().toLocaleUpperCase("tr-TR") !== "SİL" && styles.deleteModalConfirmDisabled
                  ]}
                >
                  <Text style={styles.deleteModalConfirmText}>EVET, SİL</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

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

  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  back: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#1E1838", borderWidth: 1, borderColor: "rgba(124, 92, 246, 0.25)", alignItems: "center", justifyContent: "center" },
  backText: { color: "#FFF9FC", fontSize: 26, lineHeight: 28 },
  overline: { color: "#A78BFA", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  title: { color: "#FFF9FC", fontSize: 18, fontWeight: "900", marginTop: 2, letterSpacing: 0.3 },

  /* 1. HERO OYUNCU KARTI */
  heroCard: {
    backgroundColor: "rgba(23, 17, 44, 0.95)",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "rgba(124, 92, 246, 0.35)",
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
    borderRadius: 33,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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

  /* Quick Gender Switcher */
  genderQuickRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(124, 92, 246, 0.15)",
  },
  genderQuickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(16, 11, 34, 0.7)",
    borderWidth: 1,
    borderColor: "#2B214D",
  },
  genderQuickBtnM: {
    borderColor: "#38BDF8",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },
  genderQuickBtnF: {
    borderColor: "#F472B6",
    backgroundColor: "rgba(244, 114, 182, 0.15)",
  },
  genderQuickBtnU: {
    borderColor: "#A78BFA",
    backgroundColor: "rgba(167, 139, 250, 0.15)",
  },
  genderQuickIcon: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
  },
  genderQuickLabel: {
    color: "#8E82A8",
    fontSize: 10,
    fontWeight: "800",
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

  /* Grid Layout (açık/kilitli yan yana dizim) */
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 6,
  },
  lockedSubLabel: {
    color: "#665E77",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
  },

  /* 3. AVATARS */
  avatarTile: {
    width: 82,
    height: 98,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    position: "relative",
  },
  avatarTileLocked: {
    backgroundColor: "rgba(22, 17, 40, 0.6)",
    borderColor: "#2A2146",
  },
  avatarIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 6,
  },
  avatarTileGlyph: {
    fontSize: 20,
  },
  avatarTileLabel: {
    color: "#A79BBF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  activePillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  activePillText: {
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  /* THEME TILES */
  themeTile: {
    width: 104,
    height: 104,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    position: "relative",
  },
  themeIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 5,
  },
  themeTileIcon: {
    fontSize: 18,
  },
  themeTileTitle: {
    color: "#E2D9F3",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  themeTileSub: {
    color: "#8E82A8",
    fontSize: 7.5,
    fontWeight: "700",
    marginTop: 1,
    marginBottom: 2,
    textAlign: "center",
  },

  /* TITLE TILES - MODERN CYBER BADGE */
  titleTile: {
    width: 148,
    height: 100,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(124, 92, 246, 0.2)",
    backgroundColor: "rgba(19, 14, 38, 0.75)",
    padding: 12,
    justifyContent: "space-between",
    position: "relative",
  },
  titleTileUnlocked: {
    borderColor: "rgba(124, 92, 246, 0.35)",
    backgroundColor: "rgba(24, 18, 46, 0.85)",
  },
  titleTileLocked: {
    borderColor: "rgba(50, 40, 75, 0.5)",
    backgroundColor: "rgba(16, 12, 30, 0.55)",
    opacity: 0.75,
  },
  titleTileSelected: {
    borderColor: "#00F5D4",
    backgroundColor: "rgba(0, 245, 212, 0.08)",
  },
  titleTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  titleIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(124, 92, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleIconCircleSelected: {
    backgroundColor: "rgba(0, 245, 212, 0.15)",
    borderColor: "#00F5D4",
  },
  titleIconCircleLocked: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderColor: "rgba(80, 70, 105, 0.4)",
  },
  titleIconEmoji: {
    fontSize: 12,
  },
  titleStatusChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: "rgba(124, 92, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.3)",
  },
  titleStatusChipSelected: {
    backgroundColor: "rgba(0, 245, 212, 0.12)",
    borderColor: "rgba(0, 245, 212, 0.4)",
  },
  titleStatusChipLocked: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderColor: "rgba(60, 50, 85, 0.4)",
  },
  titleStatusText: {
    color: "#C4B5FD",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  titleTileBadgeText: {
    color: "#E2D9F3",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  titleTileName: {
    color: "#8E82A8",
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  /* 5. BADGES */
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

  /* Camera edit badge on Hero avatar */
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 33,
    resizeMode: "cover",
  },
  cameraIconBtn: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#0F0B1E",
    borderWidth: 1.5,
    borderColor: "#00F5D4",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIconText: {
    fontSize: 11,
  },

  /* Gender Badge on Hero Card */
  genderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  genderBadgeMale: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  genderBadgeFemale: {
    backgroundColor: "rgba(244, 114, 182, 0.15)",
    borderColor: "rgba(244, 114, 182, 0.4)",
  },
  genderBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#A78BFA",
    letterSpacing: 0.5,
  },

  /* Delete Confirmation Modal Styles */
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 6, 22, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  deleteModalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#16102B",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    padding: 22,
    shadowColor: "#EF4444",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  deleteModalTitle: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 12,
  },
  deleteModalDesc: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 12,
  },
  deleteModalPrompt: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
  },
  deleteModalInput: {
    backgroundColor: "rgba(15, 11, 30, 0.9)",
    borderWidth: 1.5,
    borderColor: "#EF4444",
    borderRadius: 14,
    color: "#EF4444",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    paddingVertical: 10,
    letterSpacing: 4,
    marginBottom: 18,
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: 10,
  },
  deleteModalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
  },
  deleteModalCancelText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  deleteModalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  deleteModalConfirmDisabled: {
    opacity: 0.35,
    backgroundColor: "rgba(239, 68, 68, 0.3)",
  },
  deleteModalConfirmText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
