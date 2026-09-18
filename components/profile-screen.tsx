import { useState, useEffect } from "react";
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
import { PROFILE_FRAMES } from "@/shared/store-items";

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
  onSelectAvatar?: (avatar: AvatarId) => void;
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
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [progress.avatarPhoto]);

  const safeName = playerName.trim().slice(0, 16) || "OYUNCU";
  const activeAvatar = AVATARS.find((a) => a.id === progress.selectedAvatar) ?? AVATARS[0]!;
  const activeFrame = PROFILE_FRAMES.find((f) => f[0] === progress.selectedFrame);
  const activeFrameColor = activeFrame ? activeFrame[2] : (activeAvatar.color || "#00F5D4");
  const currentLevel = getPlayerLevel(progress.xp);
  const currentLevelXp = progress.xp % 200;
  const nextLevelXp = 200;
  const progressRatio = Math.min(1, Math.max(0.04, currentLevelXp / nextLevelXp));
  const activeTitle = getActiveCyberTitle(progress);
  const badges = badgesFor(progress);
  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;
  const unlockedTitlesCount = CYBER_TITLES.filter((t) => t.unlocked(progress)).length;
  const unlockedAvatarsCount = AVATARS.filter((a) => isAvatarUnlocked(a.id, progress)).length;

  const longestWord =
    progress.history && progress.history.length
      ? [...progress.history].sort((a, b) => b.length - a.length)[0]
      : "—";

  const handleSaveName = () => {
    const trimmed = nameInput.trim().toLocaleUpperCase("tr-TR").slice(0, 16);
    if (trimmed.length >= 3) {
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
      {/* Top Bar Header */}
      <View style={styles.header}>
        {onBack && (
          <Pressable onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        )}
        <View style={styles.headerTextWrap}>
          <Text style={styles.overline}>OPERATÖR MERKEZİ</Text>
          <Text style={styles.title}>KİMLİK & AYARLAR</Text>
        </View>
        <View style={styles.headerChipsBadge}>
          <Text style={styles.headerChipsIcon}>🪙</Text>
          <Text style={styles.headerChipsVal}>{progress.coins ?? 0}</Text>
        </View>
      </View>

      {/* 1. HERO OPERATÖR KARTI (Futuristic Cyber ID) */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          {/* Avatar Ring with Camera & Level Badge */}
          <View style={styles.avatarWrapper}>
            <Pressable
              onPress={handlePickPhoto}
              style={({ pressed }) => [
                styles.avatarRing,
                {
                  borderColor: activeFrameColor,
                  shadowColor: activeFrameColor,
                  shadowOpacity: 0.45,
                  shadowRadius: 10,
                  elevation: 6,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              {progress.avatarPhoto && !imgError ? (
                <Image source={{ uri: progress.avatarPhoto }} style={styles.avatarImage} onError={() => setImgError(true)} />
              ) : (
                <View style={[styles.avatarInnerFallback, { backgroundColor: activeAvatar.surface || "#153E3A" }]}>
                  <Text style={[styles.avatarGlyph, { color: activeAvatar.color || "#50E3C2" }]}>
                    {activeAvatar.icon}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Change Photo Pill */}
            <Pressable onPress={handlePickPhoto} style={styles.cameraIconBtn}>
              <Text style={styles.cameraIconText}>📷 DEĞİŞTİR</Text>
            </Pressable>

            {/* Level Badge in a clean corner */}
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
                  <View style={styles.editPenBox}>
                    <Text style={styles.editPen}>✏️</Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Cyber Hologram Title */}
            <View style={styles.titleBadgeRow}>
              <View style={styles.titleBadge}>
                <Text style={styles.titleBadgeIcon}>🎖️</Text>
                <Text style={styles.titleBadgeText}>{activeTitle}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Level XP Progress Bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeaderRow}>
            <View style={styles.xpTagWrap}>
              <Text style={styles.xpTagIcon}>⚡</Text>
              <Text style={styles.xpLabel}>SEVİYE DENEYİMİ</Text>
            </View>
            <Text style={styles.xpValues}>
              <Text style={styles.xpCurrent}>{currentLevelXp}</Text>
              <Text style={styles.xpTotal}> / {nextLevelXp} XP</Text>
            </Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${progressRatio * 100}%` }]} />
          </View>
          <View style={styles.xpFooterRow}>
            <Text style={styles.xpPercentText}>%{Math.round(progressRatio * 100)} Tamamlandı</Text>
            <Text style={styles.xpNextHint}>
              Lv.{currentLevel + 1}&apos;e son {nextLevelXp - currentLevelXp} XP
            </Text>
          </View>
        </View>
      </View>

      {/* TABS SELECTOR (Genel Bakış vs Ayarlar) */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setActiveTab("overview");
          }}
          style={[styles.tabBtn, activeTab === "overview" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === "overview" && styles.tabBtnTextActive]}>
            📊 GENEL BAKIŞ & ÜNVANLAR
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setActiveTab("settings");
          }}
          style={[styles.tabBtn, activeTab === "settings" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === "settings" && styles.tabBtnTextActive]}>
            ⚙️ SİSTEM VE AYARLAR
          </Text>
        </Pressable>
      </View>

      {activeTab === "overview" ? (
        <>
          {/* 2. KARİYER İSTATİSTİKLERİ (2x2 Balanced Futuristic Grid) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 OPERATÖR KARİYER VERİLERİ</Text>
            <Text style={styles.sectionMeta}>CANLI KAYITLAR</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statTile, styles.statTileWins]}>
              <View style={[styles.statIconBox, { backgroundColor: "rgba(255, 194, 74, 0.12)", borderColor: "#FFC24A" }]}>
                <Text style={styles.statIcon}>🏆</Text>
              </View>
              <View style={styles.statDataWrap}>
                <Text style={styles.statNumber}>{progress.wins}</Text>
                <Text style={styles.statCaption}>GALİBİYET</Text>
              </View>
            </View>

            <View style={[styles.statTile, styles.statTileScore]}>
              <View style={[styles.statIconBox, { backgroundColor: "rgba(0, 245, 212, 0.12)", borderColor: "#00F5D4" }]}>
                <Text style={styles.statIcon}>⚡</Text>
              </View>
              <View style={styles.statDataWrap}>
                <Text style={styles.statNumber}>{progress.bestScore}</Text>
                <Text style={styles.statCaption}>EN İYİ SKOR</Text>
              </View>
            </View>

            <View style={[styles.statTile, styles.statTileWords]}>
              <View style={[styles.statIconBox, { backgroundColor: "rgba(167, 139, 250, 0.12)", borderColor: "#A78BFA" }]}>
                <Text style={styles.statIcon}>📚</Text>
              </View>
              <View style={styles.statDataWrap}>
                <Text style={styles.statNumber}>
                  {progress.history ? progress.history.length : 0}
                </Text>
                <Text style={styles.statCaption}>KELİME</Text>
              </View>
            </View>

            <View style={[styles.statTile, styles.statTileStreak]}>
              <View style={[styles.statIconBox, { backgroundColor: "rgba(244, 114, 182, 0.12)", borderColor: "#F472B6" }]}>
                <Text style={styles.statIcon}>🔥</Text>
              </View>
              <View style={styles.statDataWrap}>
                <Text style={styles.statNumber}>{progress.streak} <Text style={styles.statUnit}>GÜN</Text></Text>
                <Text style={styles.statCaption}>SERİ</Text>
              </View>
            </View>
          </View>

          {/* Mini Intel HUD Strip */}
          <View style={styles.intelStrip}>
            <View style={styles.intelCell}>
              <Text style={styles.intelLabel}>⚡ EN İYİ TEMPO</Text>
              <Text style={styles.intelValue}>{progress.bestTempo || "—"} <Text style={styles.intelSub}>K/DK</Text></Text>
            </View>
            <View style={styles.intelDivider} />
            <View style={styles.intelCell}>
              <Text style={styles.intelLabel}>🎯 EN UZUN ROTA</Text>
              <Text numberOfLines={1} style={[styles.intelValue, { color: "#FFC24A" }]}>{longestWord}</Text>
            </View>
            <View style={styles.intelDivider} />
            <View style={styles.intelCell}>
              <Text style={styles.intelLabel}>🌟 TOPLAM XP</Text>
              <Text style={[styles.intelValue, { color: "#00F5D4" }]}>{progress.xp}</Text>
            </View>
          </View>

          {/* 3. SİBER AVATARLAR */}
          <View style={[styles.sectionHeader, { marginTop: 18 }]}>
            <Text style={styles.sectionTitle}>🤖 SİBER AVATARLAR</Text>
            <View style={styles.badgeCounterWrap}>
              <Text style={styles.sectionMeta}>{unlockedAvatarsCount} / {AVATARS.length} AÇIK</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
            {AVATARS.map((avatar) => {
              const unlocked = isAvatarUnlocked(avatar.id, progress);
              const isSelected = (progress.selectedAvatar ?? "spark") === avatar.id && !progress.avatarPhoto;
              return (
                <Pressable
                  key={avatar.id}
                  onPress={() => {
                    if (!unlocked) {
                      triggerHapticError();
                      if (onShowToast) {
                        onShowToast(`🔒 ${avatar.label} KİLİTLİ`, avatar.unlockHint, "🔒", "#EF4444");
                      } else {
                        Alert.alert(`🔒 ${avatar.label} KİLİTLİ`, avatar.unlockHint);
                      }
                    } else {
                      triggerHapticSuccess();
                      if (progress.avatarPhoto) {
                        onUpdateAvatarPhoto?.("");
                      }
                      onSelectAvatar?.(avatar.id);
                      if (onShowToast) {
                        onShowToast(`🤖 ${avatar.label}`, "Avatar profilinde aktif edildi.", avatar.icon, avatar.color);
                      }
                    }
                  }}
                  style={({ pressed }) => [
                    styles.badgeTile,
                    isSelected && { borderColor: avatar.color || "#00F5D4", backgroundColor: "rgba(0, 245, 212, 0.12)" },
                    !unlocked && styles.badgeTileLocked,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[
                    styles.badgeIconBubble,
                    isSelected
                      ? { backgroundColor: "rgba(0, 245, 212, 0.18)", borderColor: avatar.color || "#00F5D4" }
                      : unlocked
                      ? { backgroundColor: avatar.surface || "rgba(255, 255, 255, 0.08)", borderColor: avatar.color || "#A78BFA" }
                      : { backgroundColor: "rgba(0,0,0,0.3)", borderColor: "#393151" }
                  ]}>
                    <Text style={[styles.badgeIconText, { color: isSelected ? (avatar.color || "#00F5D4") : unlocked ? (avatar.color || "#A78BFA") : "#766D89" }]}>
                      {unlocked ? avatar.icon : "🔒"}
                    </Text>
                  </View>

                  <Text numberOfLines={1} style={[styles.badgeTileTitle, isSelected && { color: avatar.color || "#00F5D4" }, !unlocked && { color: "#8E889C" }]}>
                    {avatar.label}
                  </Text>

                  <View style={[
                    styles.titleMiniStatusPill,
                    isSelected && styles.titleMiniStatusSelected,
                    !unlocked && styles.titleMiniStatusLocked,
                  ]}>
                    <Text style={[
                      styles.titleMiniStatusText,
                      isSelected && { color: "#00F5D4" },
                      !unlocked && { color: "#7B748C" },
                    ]}>
                      {isSelected ? "SEÇİLİ" : unlocked ? "SEÇ" : "KİLİTLİ"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 4. OYUNCU UNVANLARI */}
          <View style={[styles.sectionHeader, { marginTop: 18 }]}>
            <Text style={styles.sectionTitle}>🎖️ OYUNCU UNVANLARI</Text>
            <View style={styles.badgeCounterWrap}>
              <Text style={styles.sectionMeta}>{unlockedTitlesCount} / {CYBER_TITLES.length} KAZANILDI</Text>
            </View>
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
                  <View style={[
                    styles.badgeIconBubble,
                    isSelected
                      ? { backgroundColor: "rgba(0, 245, 212, 0.15)", borderColor: "#00F5D4" }
                      : unlocked
                      ? { backgroundColor: "rgba(255, 255, 255, 0.08)", borderColor: title.accent || "rgba(167, 139, 250, 0.4)" }
                      : { backgroundColor: "rgba(0,0,0,0.3)", borderColor: "#393151" }
                  ]}>
                    <Text style={[styles.badgeIconText, { color: isSelected ? "#00F5D4" : unlocked ? (title.accent || "#A78BFA") : "#766D89" }]}>
                      {unlocked ? (title.icon || "🎖️") : "🔒"}
                    </Text>
                  </View>

                  <Text numberOfLines={1} style={[styles.badgeTileTitle, isSelected && { color: "#00F5D4" }, !unlocked && { color: "#8E889C" }]}>
                    {title.badge}
                  </Text>

                  <View style={[
                    styles.titleMiniStatusPill,
                    isSelected && styles.titleMiniStatusSelected,
                    (!unlocked) && styles.titleMiniStatusLocked,
                  ]}>
                    <Text style={[
                      styles.titleMiniStatusText,
                      isSelected && { color: "#00F5D4" },
                      (!unlocked) && { color: "#7B748C" },
                    ]}>
                      {isSelected ? "SEÇİLİ" : unlocked ? "SEÇ" : "KİLİTLİ"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 4. BAŞARI ROZETLERİ (Trophy Showcase) */}
          <View style={[styles.sectionHeader, { marginTop: 22 }]}>
            <Text style={styles.sectionTitle}>🏆 BAŞARI ROZETLERİ</Text>
            <View style={styles.badgeCounterWrap}>
              <Text style={styles.sectionMeta}>{unlockedBadgesCount} / {badges.length} KAZANILDI</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
            {[...badges.filter((b) => b.unlocked), ...badges.filter((b) => !b.unlocked)].map((badge) => {
              const unlocked = badge.unlocked;
              return (
                <Pressable
                  key={badge.id}
                  onPress={() => {
                    triggerHapticSelection();
                    if (onShowToast) {
                      onShowToast(
                        unlocked ? `🏆 ${badge.title}` : `🔒 ${badge.title} KİLİTLİ`,
                        unlocked ? `${badge.description} (Kazanıldı)` : badge.description,
                        unlocked ? "🏆" : "🔒",
                        unlocked ? badge.accent : "#EF4444"
                      );
                    } else {
                      Alert.alert(
                        unlocked ? `🏆 ${badge.title} (KAZANILDI)` : `🔒 ${badge.title} (KİLİTLİ)`,
                        unlocked ? `${badge.description}\n\nTebrikler, bu başarıyı kazandın!` : `${badge.description}\n\nBu rozeti kazanmak için görevi tamamla.`
                      );
                    }
                  }}
                  style={({ pressed }) => [
                    styles.badgeTile,
                    unlocked ? { borderColor: badge.accent, backgroundColor: "rgba(33, 26, 61, 0.75)" } : styles.badgeTileLocked,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.badgeIconBubble, unlocked ? { backgroundColor: "rgba(255,255,255,0.08)", borderColor: badge.accent } : { backgroundColor: "rgba(0,0,0,0.3)", borderColor: "#393151" }]}>
                    <Text style={[styles.badgeIconText, { color: unlocked ? badge.accent : "#766D89" }]}>{unlocked ? badge.icon : "🔒"}</Text>
                  </View>
                  <Text numberOfLines={1} style={[styles.badgeTileTitle, !unlocked && { color: "#8E889C" }]}>{badge.title}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : (
        <>
          {/* 5. AYARLAR & SİSTEM KONTROLLERİ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚙️ SES VE GERİ BİLDİRİM</Text>
            <Text style={styles.sectionMeta}>TERCİHLER</Text>
          </View>

          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.settingIconCircle, { backgroundColor: "rgba(0, 245, 212, 0.12)" }]}>
                  <Text style={styles.settingRowIcon}>🔊</Text>
                </View>
                <View>
                  <Text style={styles.settingLabel}>SES EFEKTLERİ</Text>
                  <Text style={styles.settingSubLabel}>Patlama, eşleşme ve zafer sesleri</Text>
                </View>
              </View>
              <Switch
                value={sfxOn}
                onValueChange={(val) => {
                  triggerHapticSelection();
                  toggleSfx(val);
                }}
                trackColor={{ false: "#251D42", true: "#00F5D4" }}
                thumbColor="#FFF"
              />
            </View>

            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.settingIconCircle, { backgroundColor: "rgba(167, 139, 250, 0.12)" }]}>
                  <Text style={styles.settingRowIcon}>📳</Text>
                </View>
                <View>
                  <Text style={styles.settingLabel}>HAPTİK TİTREŞİM</Text>
                  <Text style={styles.settingSubLabel}>Dokunma ve patlama titreşim tepkileri</Text>
                </View>
              </View>
              <Switch
                value={hapticsOn}
                onValueChange={(val) => {
                  triggerHapticSelection();
                  toggleHaptics(val);
                }}
                trackColor={{ false: "#251D42", true: "#00F5D4" }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* Danger Zone & Account Management */}
          <View style={[styles.sectionHeader, { marginTop: 22 }]}>
            <Text style={styles.sectionTitle}>🛡️ HESAP VE GÜVENLİK</Text>
            <Text style={[styles.sectionMeta, { color: "#F87171" }]}>GÜVENLİ BÖLGE</Text>
          </View>

          <View style={styles.dangerZoneCard}>
            <Pressable
              onPress={() => {
                triggerHapticError();
                setShowLogoutModal(true);
              }}
              style={({ pressed }) => [styles.actionButtonSecondary, pressed && styles.pressed]}
            >
              <Text style={styles.actionBtnIcon}>🚪</Text>
              <Text style={styles.actionBtnSecondaryText}>HESAPTAN ÇIKIŞ YAP</Text>
            </Pressable>

            {onDeleteAccount && (
              <Pressable
                onPress={() => {
                  triggerHapticError();
                  setDeleteConfirmInput("");
                  setShowDeleteModal(true);
                }}
                style={({ pressed }) => [styles.actionButtonDanger, pressed && styles.pressed]}
              >
                <Text style={styles.actionBtnIcon}>🗑️</Text>
                <Text style={styles.actionBtnDangerText}>HESABIMI KALICI OLARAK SİL</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => setShowPrivacyModal(true)}
            style={styles.privacyBtn}
          >
            <Text style={styles.privacyBtnText}>🔒 GİZLİLİK POLİTİKASI (PRIVACY POLICY)</Text>
          </Pressable>
        </>
      )}

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalCard, { borderColor: "#A78BFA" }]}>
            <View style={styles.modalIconTopWrap}>
              <Text style={styles.modalIconTop}>🚪</Text>
            </View>
            <Text style={[styles.deleteModalTitle, { color: "#FFF" }]}>HESAP ÇIKIŞI</Text>
            <Text style={styles.deleteModalDesc}>
              Hesabınızdan çıkış yapmak ve oturumu sıfırlamak istediğinize emin misiniz? Tekrar giriş yaparak verilerinize erişebilirsiniz.
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
                style={[styles.deleteModalConfirmBtn, { backgroundColor: "#7C3AED" }]}
              >
                <Text style={[styles.deleteModalConfirmText, { color: "#FFF" }]}>ÇIKIŞ YAP</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalCard}>
            <View style={[styles.modalIconTopWrap, { backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "#EF4444" }]}>
              <Text style={styles.modalIconTop}>🚨</Text>
            </View>
            <Text style={styles.deleteModalTitle}>HESAP SİLME İŞLEMİ</Text>
            <Text style={styles.deleteModalDesc}>
              Hesabınız ve tüm kayıtlı ilerlemeniz (XP, Çip, Seviye, Başarılar) kalıcı olarak silinecektir. Bu işlem <Text style={{ fontWeight: "900", color: "#EF4444" }}>GERİ ALINAMAZ</Text>.
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

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalCard, { borderColor: "#00F5D4" }]}>
            <Text style={{ fontSize: 40, marginBottom: 6 }}>🔒</Text>
            <Text style={[styles.deleteModalTitle, { color: "#00F5D4" }]}>GİZLİLİK POLİTİKASI</Text>
            <Text style={[styles.deleteModalDesc, { color: "#CBD5E1", lineHeight: 20 }]}>
              Kelime Patlat, kullanıcı verilerini en yüksek güvenlik standartlarında korur. Hesabınız ve maç ilerlemeniz yalnızca sıralama ve senkronizasyon için saklanır.
              {"\n\n"}
              İletişim: destek@kelimepatlat.app
            </Text>
            <Pressable
              onPress={() => setShowPrivacyModal(false)}
              style={[styles.deleteModalCancelBtn, { backgroundColor: "#00F5D4", borderColor: "#00F5D4", marginTop: 12 }]}
            >
              <Text style={[styles.deleteModalCancelText, { color: "#0C091C", fontWeight: "900" }]}>ANLADIM</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 4,
    paddingBottom: 160,
    paddingHorizontal: 2,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#1E1838",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#FFF9FC", fontSize: 26, lineHeight: 28 },
  headerTextWrap: { flex: 1, marginLeft: 10 },
  overline: { color: "#A78BFA", fontSize: 8.5, fontWeight: "900", letterSpacing: 1 },
  title: { color: "#FFF9FC", fontSize: 18, fontWeight: "900", marginTop: 2, letterSpacing: 0.3 },
  headerChipsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(35, 27, 62, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FFC24A",
    gap: 4,
  },
  headerChipsIcon: { fontSize: 13 },
  headerChipsVal: { color: "#FFC24A", fontSize: 13, fontWeight: "900" },

  /* Tab Navigation */
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#16112C",
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: "#2B2046",
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: "#2B2150",
    borderWidth: 1,
    borderColor: "#00F5D4",
  },
  tabBtnText: {
    color: "#8E82A8",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  tabBtnTextActive: {
    color: "#00F5D4",
  },

  /* 1. HERO OPERATÖR KARTI */
  heroCard: {
    backgroundColor: "#16112C",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#2C2250",
    marginBottom: 12,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#16102B",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 34,
    resizeMode: "cover",
  },
  avatarInnerFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGlyph: {
    fontSize: 32,
    fontWeight: "900",
  },
  levelBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    backgroundColor: "#7C3AED",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 1.5,
    borderColor: "#16112C",
  },
  levelBadgeText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cameraIconBtn: {
    position: "absolute",
    bottom: -6,
    backgroundColor: "#120D24",
    borderWidth: 1,
    borderColor: "#00F5D4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  cameraIconText: {
    color: "#00F5D4",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.4,
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
  editPenBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "rgba(124, 92, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  editPen: {
    fontSize: 11,
  },
  nameEditWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  nameTextInput: {
    flex: 1,
    backgroundColor: "#120D24",
    color: "#00F5D4",
    fontSize: 16,
    fontWeight: "900",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1.5,
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
    marginTop: 5,
  },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 92, 246, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#7C3AED",
    gap: 4,
  },
  titleBadgeIcon: { fontSize: 10 },
  titleBadgeText: {
    color: "#D8B4FE",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  /* XP Progress */
  xpSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(124, 92, 246, 0.15)",
  },
  xpHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  xpTagWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  xpTagIcon: { fontSize: 11 },
  xpLabel: {
    color: "#8E82A8",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  xpValues: {
    fontSize: 10.5,
    fontWeight: "900",
  },
  xpCurrent: {
    color: "#00F5D4",
  },
  xpTotal: {
    color: "#64748B",
  },
  xpTrack: {
    height: 7,
    backgroundColor: "#100B20",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2B2046",
  },
  xpFill: {
    height: "100%",
    backgroundColor: "#00F5D4",
    borderRadius: 6,
  },
  xpFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  xpPercentText: {
    color: "#00F5D4",
    fontSize: 8.5,
    fontWeight: "800",
  },
  xpNextHint: {
    color: "#6B6084",
    fontSize: 8.5,
    fontWeight: "700",
  },

  /* Section Headers */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  sectionMeta: {
    color: "#A78BFA",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  badgeCounterWrap: {
    backgroundColor: "rgba(124, 92, 246, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.3)",
  },

  /* 2. STATS GRID (Compact 2x2 with horizontal content) */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  statTile: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16112C",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#2B2046",
    gap: 8,
  },
  statTileWins: { borderColor: "rgba(255, 194, 74, 0.25)" },
  statTileScore: { borderColor: "rgba(0, 245, 212, 0.25)" },
  statTileWords: { borderColor: "rgba(167, 139, 250, 0.25)" },
  statTileStreak: { borderColor: "rgba(244, 114, 182, 0.25)" },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statIcon: {
    fontSize: 15,
  },
  statDataWrap: {
    flex: 1,
  },
  statNumber: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  statUnit: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F472B6",
  },
  statCaption: {
    color: "#7E7597",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 1,
  },

  /* Mini Intel HUD Strip */
  intelStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(19, 14, 38, 0.95)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: "#2B214D",
    marginTop: 10,
    alignItems: "center",
  },
  intelCell: {
    flex: 1,
    alignItems: "center",
  },
  intelLabel: {
    color: "#7C7094",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  intelValue: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 3,
  },
  intelSub: {
    fontSize: 8,
    color: "#8E82A8",
  },
  intelDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#2E2452",
  },

  /* Horizontal Row (Carousels) */
  horizontalRow: {
    gap: 10,
    paddingVertical: 4,
  },

  /* 3. OYUNCU UNVANLARI (Square Tiles) */
  titleTile: {
    width: 88,
    height: 92,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#2B2046",
    backgroundColor: "#16112C",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  titleTileUnlocked: {
    borderColor: "rgba(124, 92, 246, 0.4)",
    backgroundColor: "#1A1333",
  },
  titleTileLocked: {
    borderColor: "#281F42",
    backgroundColor: "rgba(18, 14, 34, 0.5)",
    opacity: 0.6,
  },
  titleTileSelected: {
    borderColor: "#00F5D4",
    backgroundColor: "rgba(0, 245, 212, 0.08)",
  },
  titleMiniStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    backgroundColor: "rgba(124, 92, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.3)",
    marginTop: 3,
  },
  titleMiniStatusSelected: {
    backgroundColor: "rgba(0, 245, 212, 0.15)",
    borderColor: "#00F5D4",
  },
  titleMiniStatusLocked: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderColor: "rgba(60, 50, 85, 0.4)",
  },
  titleMiniStatusText: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: "#C4B5FD",
  },

  /* 4. TROPHY BADGES */
  badgeTile: {
    width: 88,
    height: 90,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  badgeTileLocked: {
    backgroundColor: "rgba(18, 14, 34, 0.5)",
    borderColor: "#281F42",
    opacity: 0.6,
  },
  badgeIconBubble: {
    width: 38,
    height: 38,
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
    backgroundColor: "rgba(22, 16, 42, 0.9)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#2C2250",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#281E48",
  },
  settingLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  settingRowIcon: {
    fontSize: 16,
  },
  settingLabel: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  settingSubLabel: {
    color: "#7E7597",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },

  dangerZoneCard: {
    backgroundColor: "rgba(22, 16, 42, 0.9)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#2C2250",
    gap: 10,
  },
  actionButtonSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124, 92, 246, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(124, 92, 246, 0.3)",
    paddingVertical: 13,
    borderRadius: 16,
    gap: 8,
  },
  actionBtnSecondaryText: {
    color: "#C4B5FD",
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  actionButtonDanger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.4)",
    paddingVertical: 13,
    borderRadius: 16,
    gap: 8,
  },
  actionBtnDangerText: {
    color: "#F87171",
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  actionBtnIcon: { fontSize: 13 },
  privacyBtn: {
    marginTop: 14,
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

  /* Modals */
  modalIconTopWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(124, 92, 246, 0.15)",
    borderWidth: 1.5,
    borderColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  modalIconTop: {
    fontSize: 20,
  },
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
    marginBottom: 10,
  },
  deleteModalDesc: {
    color: "#E2E8F0",
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 12,
  },
  deleteModalPrompt: {
    color: "#94A3B8",
    fontSize: 11.5,
    textAlign: "center",
    marginBottom: 10,
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
    marginBottom: 16,
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
