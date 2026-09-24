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
  THEME_PACKS,
  badgesFor,
  getActiveCyberTitle,
  getPlayerLevel,
  getLeagueTier,
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

const FRAME_IMAGES: Record<string, any> = {
  signal: require("../assets/frames/signal.jpg"),
  neon: require("../assets/frames/neon.jpg"),
  chrome: require("../assets/frames/chrome.jpg"),
  gold: require("../assets/frames/gold.jpg"),
  cyber: require("../assets/frames/cyber.jpg"),
};

export function ProfileScreen({
  playerName,
  onUpdatePlayerName,
  progress,
  onSelectAvatar,
  onSelectTheme,
  onSelectTitle,
  onSelectFrame,
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
  onSelectFrame?: (frameId: string) => void;
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
  const [customizerTab, setCustomizerTab] = useState<"frames" | "avatars" | "titles" | "badges">("frames");
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
  const currentFrameId = progress.selectedFrame || "signal";
  const activeFrame = PROFILE_FRAMES.find((f) => f[0] === currentFrameId);
  const activeFrameColor = activeFrame ? activeFrame[2] : (activeAvatar.color || "#3EE8B5");

  const currentLevel = getPlayerLevel(progress.xp);
  const currentLevelXp = progress.xp % 200;
  const nextLevelXp = 200;
  const progressRatio = Math.min(1, Math.max(0.04, currentLevelXp / nextLevelXp));

  const currentLeague = getLeagueTier(progress);
  const activeTitle = getActiveCyberTitle(progress);
  const badges = badgesFor(progress);
  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;
  const unlockedTitlesCount = CYBER_TITLES.filter((t) => t.unlocked(progress)).length;
  const unlockedAvatarsCount = AVATARS.filter((a) => isAvatarUnlocked(a.id, progress)).length;
  const unlockedFramesCount = PROFILE_FRAMES.filter(
    (f) => f[3] === 0 || progress.ownedFrames?.[f[0]] || progress.selectedFrame === f[0]
  ).length;

  const totalMatches = progress.matches ?? 0;
  const winRate = totalMatches > 0 ? Math.round(((progress.wins ?? 0) / totalMatches) * 100) : 0;
  const wordPoolCount = Math.max(
    progress.history ? progress.history.length : 0,
    totalMatches > 0 ? totalMatches * 3 : 0
  );

  const longestWord =
    progress.history && progress.history.length
      ? [...progress.history].sort((a, b) => b.length - a.length)[0]
      : "—";

  const handleSaveName = () => {
    const trimmed = nameInput.trim().toLocaleUpperCase("tr-TR").slice(0, 16);
    if (trimmed.length < 3) {
      triggerHapticError();
      if (onShowToast) {
        onShowToast("GEÇERSİZ İSİM", "Kullanıcı adı en az 3 karakter olmalıdır.", "⚠️", "#EF4444");
      } else {
        Alert.alert("Geçersiz İsim", "Kullanıcı adı en az 3 karakter olmalıdır.");
      }
      setNameInput(playerName);
      setIsEditingName(false);
      return;
    }
    onUpdatePlayerName(trimmed);
    triggerHapticSuccess();
    if (onShowToast) {
      onShowToast("İSİM GÜNCELLENDİ", `Kullanıcı adınız "${trimmed}" olarak kaydedildi.`, "✓", "#3EE8B5");
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

  const handleResetToGlyph = () => {
    triggerHapticSelection();
    onUpdateAvatarPhoto?.("");
    if (onShowToast) {
      onShowToast("GLİF AVATARINA GEÇİLDİ", "Klasik siber karakter simgenize dönüldü.", "🤖", "#3EE8B5");
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
          <Pressable onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
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

      {/* 1. HERO OPERATÖR KARTI (Futuristic Cyber ID with 3D Press Tilt) */}
      <Pressable style={({ pressed }) => [styles.heroCard, pressed && { transform: [{ rotateX: "-3deg" }, { scale: 0.985 }] }]}>
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
                  shadowOpacity: 0.65,
                  shadowRadius: 14,
                  elevation: 8,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              {FRAME_IMAGES[currentFrameId] ? (
                <Image source={FRAME_IMAGES[currentFrameId]} style={{ position: "absolute", width: "100%", height: "100%", borderRadius: 44, zIndex: 1 }} resizeMode="cover" />
              ) : null}
              {progress.avatarPhoto && !imgError ? (
                <Image source={{ uri: progress.avatarPhoto }} style={[styles.avatarImage, FRAME_IMAGES[currentFrameId] && { width: "84%", height: "84%", borderRadius: 36, zIndex: 0 }]} onError={() => setImgError(true)} />
              ) : (
                <View style={[styles.avatarInnerFallback, { backgroundColor: activeAvatar.surface || "#153E3A" }, FRAME_IMAGES[currentFrameId] && { width: "84%", height: "84%", borderRadius: 36, zIndex: 0 }]}>
                  <Text style={[styles.avatarGlyph, { color: activeAvatar.color || "#4ADE80" }]}>
                    {activeAvatar.icon}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Photo Action Buttons */}
            <View style={styles.avatarActionsRow}>
              <Pressable onPress={handlePickPhoto} style={styles.cameraIconBtn}>
                <Text style={styles.cameraIconText}>📷 FOTOĞRAF</Text>
              </Pressable>
              {Boolean(progress.avatarPhoto) && (
                <Pressable onPress={handleResetToGlyph} style={styles.resetGlyphBtn}>
                  <Text style={styles.resetGlyphText}>✕ GLİF</Text>
                </Pressable>
              )}
            </View>

            {/* Level Badge */}
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LV.{currentLevel}</Text>
            </View>
          </View>

          {/* Name & Badges */}
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

            {/* Title & League Badges Row */}
            <View style={styles.metaBadgesRow}>
              {/* Active Cyber Hologram Title */}
              <View style={styles.titleBadge}>
                <Text style={styles.titleBadgeIcon}>🎖️</Text>
                <Text numberOfLines={1} style={styles.titleBadgeText}>{activeTitle}</Text>
              </View>

              {/* League Tier Badge */}
              <View style={[styles.leagueBadge, { borderColor: currentLeague.color, backgroundColor: `${currentLeague.color}15` }]}>
                <Text style={styles.leagueBadgeIcon}>{currentLeague.icon}</Text>
                <Text style={[styles.leagueBadgeText, { color: currentLeague.color }]}>
                  {currentLeague.name} · {progress.lp ?? 0} LP
                </Text>
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
      </Pressable>

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
            📊 GENEL BAKIŞ & ÖZELLEŞTİRME
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
                <Text style={styles.statNumber}>{progress.wins ?? 0}</Text>
                <Text style={styles.statCaption}>GALİBİYET</Text>
              </View>
            </View>

            <View style={[styles.statTile, styles.statTileMatches]}>
              <View style={[styles.statIconBox, { backgroundColor: "rgba(56, 189, 248, 0.12)", borderColor: "#38BDF8" }]}>
                <Text style={styles.statIcon}>⚔️</Text>
              </View>
              <View style={styles.statDataWrap}>
                <Text style={styles.statNumber}>{totalMatches}</Text>
                <Text style={styles.statCaption}>TOPLAM MAÇ</Text>
              </View>
            </View>

            <View style={[styles.statTile, styles.statTileWinRate]}>
              <View style={[styles.statIconBox, { backgroundColor: "rgba(192, 132, 252, 0.12)", borderColor: "#C084FC" }]}>
                <Text style={styles.statIcon}>📈</Text>
              </View>
              <View style={styles.statDataWrap}>
                <Text style={styles.statNumber}>%{winRate}</Text>
                <Text style={styles.statCaption}>KAZANMA ORANI</Text>
              </View>
            </View>

            <View style={[styles.statTile, styles.statTileScore]}>
              <View style={[styles.statIconBox, { backgroundColor: "rgba(62, 232, 181, 0.12)", borderColor: "#3EE8B5" }]}>
                <Text style={styles.statIcon}>⚡</Text>
              </View>
              <View style={styles.statDataWrap}>
                <Text style={styles.statNumber}>{progress.bestScore ?? 0}</Text>
                <Text style={styles.statCaption}>EN İYİ SKOR</Text>
              </View>
            </View>
          </View>

          {/* Mini Intel HUD Strip */}
          <View style={styles.intelStrip}>
            <View style={styles.intelCell}>
              <Text style={styles.intelLabel}>🔥 AKTİF SERİ</Text>
              <Text style={[styles.intelValue, { color: "#FB7185" }]}>
                {progress.streak ?? 0} <Text style={styles.intelSub}>GÜN</Text>
              </Text>
            </View>
            <View style={styles.intelDivider} />
            <View style={styles.intelCell}>
              <Text style={styles.intelLabel}>⚡ TEMPO</Text>
              <Text style={styles.intelValue}>
                {progress.bestTempo || "—"} <Text style={styles.intelSub}>K/DK</Text>
              </Text>
            </View>
            <View style={styles.intelDivider} />
            <View style={styles.intelCell}>
              <Text style={styles.intelLabel}>📚 KELİMELER</Text>
              <Text style={[styles.intelValue, { color: "#34D399" }]}>{wordPoolCount}</Text>
            </View>
            <View style={styles.intelDivider} />
            <View style={styles.intelCell}>
              <Text style={styles.intelLabel}>🎯 EN UZUN</Text>
              <Text numberOfLines={1} style={[styles.intelValue, { color: "#FFC24A" }]}>
                {longestWord}
              </Text>
            </View>
            <View style={styles.intelDivider} />
            <View style={styles.intelCell}>
              <Text style={styles.intelLabel}>🌟 TOPLAM XP</Text>
              <Text style={[styles.intelValue, { color: "#3EE8B5" }]}>{progress.xp}</Text>
            </View>
          </View>

          {/* 3. PROFİL ÖZELLEŞTİRME MERKEZİ (Clean Tabbed Sub-Bar) */}
          <View style={[styles.sectionHeader, { marginTop: 22 }]}>
            <Text style={styles.sectionTitle}>⚙️ ENVENTER VE ÖZELLEŞTİRME</Text>
            <Text style={styles.sectionMeta}>KOLEKSİYON</Text>
          </View>

          {/* Customizer Sub-Tabs */}
          <View style={{ flexDirection: "row", backgroundColor: "rgba(5, 17, 12, 0.7)", padding: 4, borderRadius: 14, borderWidth: 1, borderColor: "rgba(244, 208, 111, 0.25)", marginBottom: 14 }}>
            <Pressable
              onPress={() => { triggerHapticSelection(); setCustomizerTab("frames"); }}
              style={[{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 }, customizerTab === "frames" && { backgroundColor: "rgba(244, 208, 111, 0.22)", borderWidth: 1, borderColor: "#D4B45A" }]}
            >
              <Text style={[{ fontSize: 10, fontWeight: "900", color: "#8E889C" }, customizerTab === "frames" && { color: "#F4D06F" }]}>🖼️ ÇERÇEVE ({unlockedFramesCount})</Text>
            </Pressable>
            <Pressable
              onPress={() => { triggerHapticSelection(); setCustomizerTab("avatars"); }}
              style={[{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 }, customizerTab === "avatars" && { backgroundColor: "rgba(244, 208, 111, 0.22)", borderWidth: 1, borderColor: "#D4B45A" }]}
            >
              <Text style={[{ fontSize: 10, fontWeight: "900", color: "#8E889C" }, customizerTab === "avatars" && { color: "#F4D06F" }]}>🤖 AVATAR ({unlockedAvatarsCount})</Text>
            </Pressable>
            <Pressable
              onPress={() => { triggerHapticSelection(); setCustomizerTab("titles"); }}
              style={[{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 }, customizerTab === "titles" && { backgroundColor: "rgba(244, 208, 111, 0.22)", borderWidth: 1, borderColor: "#D4B45A" }]}
            >
              <Text style={[{ fontSize: 10, fontWeight: "900", color: "#8E889C" }, customizerTab === "titles" && { color: "#F4D06F" }]}>🎖️ UNVAN ({unlockedTitlesCount})</Text>
            </Pressable>
            <Pressable
              onPress={() => { triggerHapticSelection(); setCustomizerTab("badges"); }}
              style={[{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 }, customizerTab === "badges" && { backgroundColor: "rgba(244, 208, 111, 0.22)", borderWidth: 1, borderColor: "#D4B45A" }]}
            >
              <Text style={[{ fontSize: 10, fontWeight: "900", color: "#8E889C" }, customizerTab === "badges" && { color: "#F4D06F" }]}>🏆 ROZET ({unlockedBadgesCount})</Text>
            </Pressable>
          </View>

          {/* Sub-Tab 1: ÇERÇEVELER */}
          {customizerTab === "frames" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
              {PROFILE_FRAMES.map(([fId, fName, fColor, fCost]) => {
                const isUnlocked = fCost === 0 || Boolean(progress.ownedFrames?.[fId]) || progress.selectedFrame === fId;
                const isSelected = (progress.selectedFrame || "signal") === fId;

                return (
                  <Pressable
                    key={fId}
                    onPress={() => {
                      if (!isUnlocked) {
                        triggerHapticError();
                        if (onShowToast) {
                          onShowToast("🔒 ÇERÇEVE KİLİTLİ", `"${fName}" çerçevesini Siber Mağaza'dan açabilirsiniz.`, "🔒", "#EF4444");
                        } else {
                          Alert.alert("🔒 Kilitli Çerçeve", `"${fName}" çerçevesini Siber Mağaza'dan edinebilirsiniz.`);
                        }
                      } else {
                        triggerHapticSuccess();
                        onSelectFrame?.(fId);
                        if (onShowToast) {
                          onShowToast("🖼️ ÇERÇEVE KUŞANILDI", `"${fName}" çerçevesi aktif edildi.`, "✓", fColor);
                        }
                      }
                    }}
                    style={({ pressed }) => [
                      styles.frameTile,
                      isSelected && { borderColor: fColor, backgroundColor: "rgba(62, 232, 181, 0.12)" },
                      !isUnlocked && styles.frameTileLocked,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.framePreviewCircle, { borderColor: fColor }]}>
                      <View style={[styles.framePreviewInner, { backgroundColor: isSelected ? fColor : "transparent" }]}>
                        <Text style={{ fontSize: 13 }}>{isUnlocked ? "✦" : "🔒"}</Text>
                      </View>
                    </View>

                    <Text numberOfLines={1} style={[styles.badgeTileTitle, isSelected && { color: fColor }, !isUnlocked && { color: "#8E889C" }]}>
                      {fName}
                    </Text>

                    <View style={[
                      styles.titleMiniStatusPill,
                      isSelected && { backgroundColor: `${fColor}25`, borderColor: fColor },
                      !isUnlocked && styles.titleMiniStatusLocked,
                    ]}>
                      <Text style={[
                        styles.titleMiniStatusText,
                        isSelected && { color: fColor },
                        !isUnlocked && { color: "#7B748C" },
                      ]}>
                        {isSelected ? "SEÇİLİ" : isUnlocked ? "SEÇ" : `${fCost} ÇİP`}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Sub-Tab 2: SİBER AVATARLAR */}
          {customizerTab === "avatars" && (
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
                      isSelected && { borderColor: avatar.color || "#3EE8B5", backgroundColor: "rgba(62, 232, 181, 0.12)" },
                      !unlocked && styles.badgeTileLocked,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[
                      styles.badgeIconBubble,
                      isSelected
                        ? { backgroundColor: "rgba(62, 232, 181, 0.18)", borderColor: avatar.color || "#3EE8B5" }
                        : unlocked
                        ? { backgroundColor: avatar.surface || "rgba(255, 255, 255, 0.08)", borderColor: avatar.color || "#E8C36A" }
                        : { backgroundColor: "rgba(0,0,0,0.3)", borderColor: "#393151" }
                    ]}>
                      <Text style={[styles.badgeIconText, { color: isSelected ? (avatar.color || "#3EE8B5") : unlocked ? (avatar.color || "#E8C36A") : "#766D89" }]}>
                        {unlocked ? avatar.icon : "🔒"}
                      </Text>
                    </View>

                    <Text numberOfLines={1} style={[styles.badgeTileTitle, isSelected && { color: avatar.color || "#3EE8B5" }, !unlocked && { color: "#8E889C" }]}>
                      {avatar.label}
                    </Text>

                    <View style={[
                      styles.titleMiniStatusPill,
                      isSelected && styles.titleMiniStatusSelected,
                      !unlocked && styles.titleMiniStatusLocked,
                    ]}>
                      <Text style={[
                        styles.titleMiniStatusText,
                        isSelected && { color: "#3EE8B5" },
                        !unlocked && { color: "#7B748C" },
                      ]}>
                        {isSelected ? "SEÇİLİ" : unlocked ? "SEÇ" : "KİLİTLİ"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Sub-Tab 3: OYUNCU UNVANLARI */}
          {customizerTab === "titles" && (
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
                        ? { backgroundColor: "rgba(62, 232, 181, 0.15)", borderColor: "#3EE8B5" }
                        : unlocked
                        ? { backgroundColor: "rgba(255, 255, 255, 0.08)", borderColor: title.accent || "rgba(167, 139, 250, 0.4)" }
                        : { backgroundColor: "rgba(0,0,0,0.3)", borderColor: "#393151" }
                    ]}>
                      <Text style={[styles.badgeIconText, { color: isSelected ? "#3EE8B5" : unlocked ? (title.accent || "#E8C36A") : "#766D89" }]}>
                        {unlocked ? (title.icon || "🎖️") : "🔒"}
                      </Text>
                    </View>

                    <Text numberOfLines={1} style={[styles.badgeTileTitle, isSelected && { color: "#3EE8B5" }, !unlocked && { color: "#8E889C" }]}>
                      {title.badge}
                    </Text>

                    <View style={[
                      styles.titleMiniStatusPill,
                      isSelected && styles.titleMiniStatusSelected,
                      !unlocked && styles.titleMiniStatusLocked,
                    ]}>
                      <Text style={[
                        styles.titleMiniStatusText,
                        isSelected && { color: "#3EE8B5" },
                        !unlocked && { color: "#7B748C" },
                      ]}>
                        {isSelected ? "SEÇİLİ" : unlocked ? "SEÇ" : "KİLİTLİ"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Sub-Tab 4: BAŞARI ROZETLERİ */}
          {customizerTab === "badges" && (
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
                      unlocked ? { borderColor: badge.accent, backgroundColor: "rgba(20, 54, 43, 0.75)" } : styles.badgeTileLocked,
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
          )}
        </>
      ) : (
        <>
          {/* 8. AYARLAR & SİSTEM KONTROLLERİ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚙️ SES VE GERİ BİLDİRİM</Text>
            <Text style={styles.sectionMeta}>TERCİHLER</Text>
          </View>

          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <View style={[styles.settingIconCircle, { backgroundColor: "rgba(62, 232, 181, 0.12)" }]}>
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
                trackColor={{ false: "#251D42", true: "#3EE8B5" }}
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
                trackColor={{ false: "#251D42", true: "#3EE8B5" }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* Cinsiyet ve Hitap Tercihi */}
          <View style={[styles.sectionHeader, { marginTop: 18 }]}>
            <Text style={styles.sectionTitle}>👤 HİTAP VE KİMLİK</Text>
            <Text style={styles.sectionMeta}>PROFİL TERCİHİ</Text>
          </View>

          <View style={styles.settingsCard}>
            <Text style={styles.genderTitle}>OYUN İÇİ HİTAP ŞEKLİ</Text>
            <Text style={styles.genderSub}>Profilinizde ve zafer duyurularında kullanılacak hitap tarzı</Text>

            <View style={styles.genderRow}>
              {[
                { id: "unspecified", label: "Belirtilmemiş", icon: "🌐" },
                { id: "male", label: "Erkek", icon: "♂️" },
                { id: "female", label: "Kadın", icon: "♀️" },
              ].map((item) => {
                const isSelected = (progress.gender || "unspecified") === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      triggerHapticSelection();
                      onUpdateGender?.(item.id as GenderType);
                      if (onShowToast) {
                        onShowToast("HİTAP GÜNCELLENDİ", `Hitap tercihi "${item.label}" olarak belirlendi.`, item.icon, "#3EE8B5");
                      }
                    }}
                    style={[
                      styles.genderPill,
                      isSelected && styles.genderPillSelected,
                    ]}
                  >
                    <Text style={{ fontSize: 13, marginRight: 4 }}>{item.icon}</Text>
                    <Text style={[styles.genderPillText, isSelected && styles.genderPillTextSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Hızlı Tema Tercihi */}
          <View style={[styles.sectionHeader, { marginTop: 18 }]}>
            <Text style={styles.sectionTitle}>🎨 OYUN TEMASI</Text>
            <Text style={styles.sectionMeta}>GÖRSEL TEMA</Text>
          </View>

          <View style={styles.settingsCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {THEME_PACKS.map((theme) => {
                const isSelected = (progress.selectedTheme || "classic") === theme.id;
                return (
                  <Pressable
                    key={theme.id}
                    onPress={() => {
                      triggerHapticSelection();
                      onSelectTheme?.(theme.id as ThemePackId);
                      if (onShowToast) {
                        onShowToast("TEMA GÜNCELLENDİ", `"${theme.label}" teması kuşanıldı.`, "🎨", "#3EE8B5");
                      }
                    }}
                    style={[
                      styles.themePill,
                      isSelected && styles.themePillSelected,
                    ]}
                  >
                    <Text style={[styles.themePillText, isSelected && styles.themePillTextSelected]}>
                      {theme.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Sistem Bilgisi */}
          <View style={styles.appInfoCard}>
            <Text style={styles.appInfoTitle}>KELİME PATLAT CYBER EDITION</Text>
            <Text style={styles.appInfoSub}>Versiyon 1.0.0 · Build 2026.09 · Çevrim İçi Motor Etkin</Text>
          </View>

          {/* Danger Zone & Account Management */}
          <View style={[styles.sectionHeader, { marginTop: 18 }]}>
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
          <View style={[styles.deleteModalCard, { borderColor: "#E8C36A" }]}>
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
                style={[styles.deleteModalConfirmBtn, { backgroundColor: "#C9A227" }]}
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
          <View style={[styles.deleteModalCard, { borderColor: "#3EE8B5" }]}>
            <Text style={{ fontSize: 40, marginBottom: 6 }}>🔒</Text>
            <Text style={[styles.deleteModalTitle, { color: "#3EE8B5" }]}>GİZLİLİK POLİTİKASI</Text>
            <Text style={[styles.deleteModalDesc, { color: "#CBD5E1", lineHeight: 20 }]}>
              Kelime Patlat, kullanıcı verilerini en yüksek güvenlik standartlarında korur. Hesabınız ve maç ilerlemeniz yalnızca sıralama ve senkronizasyon için saklanır.
              {"\n\n"}
              İletişim: destek@kelimepatlat.app
            </Text>
            <Pressable
              onPress={() => setShowPrivacyModal(false)}
              style={[styles.deleteModalCancelBtn, { backgroundColor: "#3EE8B5", borderColor: "#3EE8B5", marginTop: 12 }]}
            >
              <Text style={[styles.deleteModalCancelText, { color: "#06140F", fontWeight: "900" }]}>ANLADIM</Text>
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
    backgroundColor: "#164036",
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#FFF9FC", fontSize: 26, lineHeight: 28 },
  headerTextWrap: { flex: 1, marginLeft: 10 },
  overline: { color: "#E8C36A", fontSize: 8.5, fontWeight: "900", letterSpacing: 1 },
  title: { color: "#FFF9FC", fontSize: 18, fontWeight: "900", marginTop: 2, letterSpacing: 0.3 },
  headerChipsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 36, 28, 0.95)",
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
    backgroundColor: "#0E2C22",
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.25)",
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
    backgroundColor: "#164536",
    borderWidth: 1,
    borderColor: "#3EE8B5",
  },
  tabBtnText: {
    color: "#8FBAAB",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  tabBtnTextActive: {
    color: "#3EE8B5",
  },

  /* 1. HERO OPERATÖR KARTI */
  heroCard: {
    backgroundColor: "rgba(10, 32, 25, 0.95)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#C9A227",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
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
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#0E2C22",
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
    backgroundColor: "#C9A227",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 1.5,
    borderColor: "#0E2C22",
  },
  levelBadgeText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  avatarActionsRow: {
    flexDirection: "row",
    gap: 4,
    position: "absolute",
    bottom: -8,
  },
  cameraIconBtn: {
    backgroundColor: "#0A241C",
    borderWidth: 1,
    borderColor: "#3EE8B5",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIconText: {
    color: "#3EE8B5",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  resetGlyphBtn: {
    backgroundColor: "#0A241C",
    borderWidth: 1,
    borderColor: "#FF647C",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  resetGlyphText: {
    color: "#FF647C",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.3,
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
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  editPenBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "rgba(212, 180, 90, 0.2)",
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
    backgroundColor: "#0A241C",
    color: "#3EE8B5",
    fontSize: 16,
    fontWeight: "900",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: "#3EE8B5",
  },
  saveNameBtn: {
    backgroundColor: "#3EE8B5",
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveNameBtnText: {
    color: "#071A14",
    fontWeight: "900",
    fontSize: 16,
  },
  metaBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 180, 90, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C9A227",
    gap: 4,
  },
  titleBadgeIcon: { fontSize: 10 },
  titleBadgeText: {
    color: "#C8D9C0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  leagueBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  leagueBadgeIcon: { fontSize: 10 },
  leagueBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  /* XP Progress */
  xpSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 180, 90, 0.15)",
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
    color: "#8FBAAB",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  xpValues: {
    fontSize: 10.5,
    fontWeight: "900",
  },
  xpCurrent: {
    color: "#3EE8B5",
  },
  xpTotal: {
    color: "#64748B",
  },
  xpTrack: {
    height: 7,
    backgroundColor: "#0A241C",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.2)",
  },
  xpFill: {
    height: "100%",
    backgroundColor: "#3EE8B5",
    borderRadius: 6,
  },
  xpFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  xpPercentText: {
    color: "#3EE8B5",
    fontSize: 8.5,
    fontWeight: "800",
  },
  xpNextHint: {
    color: "#8FBAAB",
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
    color: "#E8C36A",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  badgeCounterWrap: {
    backgroundColor: "rgba(212, 180, 90, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.3)",
  },

  /* 2. STATS GRID (Compact 2x2) */
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
    backgroundColor: "rgba(10, 36, 28, 0.95)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.25)",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  statTileWins: { borderColor: "#FFC24A", backgroundColor: "rgba(42, 29, 7, 0.85)" },
  statTileMatches: { borderColor: "#38BDF8", backgroundColor: "rgba(7, 28, 42, 0.85)" },
  statTileWinRate: { borderColor: "#C084FC", backgroundColor: "rgba(32, 14, 42, 0.85)" },
  statTileScore: { borderColor: "#3EE8B5", backgroundColor: "rgba(7, 36, 28, 0.85)" },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: { fontSize: 15 },
  statDataWrap: { flex: 1 },
  statNumber: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.3,
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  statCaption: {
    color: "#8FBAAB",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 1,
  },

  /* Mini Intel HUD Strip */
  intelStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(14, 38, 30, 0.95)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.35)",
    marginTop: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  intelCell: { flex: 1, alignItems: "center" },
  intelLabel: {
    color: "#8FBAAB",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  intelValue: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 3,
    textAlign: "center",
  },
  intelSub: { fontSize: 8, color: "#8FBAAB" },
  intelDivider: { width: 1, height: 24, backgroundColor: "rgba(212, 180, 90, 0.2)" },

  /* Horizontal Row (Carousels) */
  horizontalRow: {
    gap: 10,
    paddingVertical: 4,
  },

  /* Profile Frames Showcase */
  frameTile: {
    width: 90,
    height: 98,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.25)",
    backgroundColor: "#0E2C22",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  frameTileLocked: {
    borderColor: "rgba(212, 180, 90, 0.15)",
    backgroundColor: "rgba(10, 36, 28, 0.5)",
    opacity: 0.6,
  },
  framePreviewCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    backgroundColor: "#0A241C",
  },
  framePreviewInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Titles & Badges Tiles */
  titleTile: {
    width: 88,
    height: 92,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.25)",
    backgroundColor: "#0E2C22",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  titleTileUnlocked: {
    borderColor: "rgba(212, 180, 90, 0.4)",
    backgroundColor: "#164536",
  },
  titleTileLocked: {
    borderColor: "rgba(212, 180, 90, 0.15)",
    backgroundColor: "rgba(10, 36, 28, 0.5)",
    opacity: 0.6,
  },
  titleTileSelected: {
    borderColor: "#3EE8B5",
    backgroundColor: "rgba(62, 232, 181, 0.08)",
  },
  titleMiniStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    backgroundColor: "rgba(212, 180, 90, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.3)",
    marginTop: 3,
  },
  titleMiniStatusSelected: {
    backgroundColor: "rgba(62, 232, 181, 0.15)",
    borderColor: "#3EE8B5",
  },
  titleMiniStatusLocked: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderColor: "rgba(212, 180, 90, 0.2)",
  },
  titleMiniStatusText: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: "#C5D9C8",
  },

  badgeTile: {
    width: 88,
    height: 90,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  badgeTileLocked: {
    backgroundColor: "rgba(10, 36, 28, 0.5)",
    borderColor: "rgba(212, 180, 90, 0.15)",
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
  badgeIconText: { fontSize: 16 },
  badgeTileTitle: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  /* Settings & Danger Zone */
  settingsCard: {
    backgroundColor: "#0E2C22",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 180, 90, 0.15)",
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
  settingRowIcon: { fontSize: 16 },
  settingLabel: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  settingSubLabel: {
    color: "#8FBAAB",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },

  genderTitle: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  genderSub: {
    color: "#8FBAAB",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 10,
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A241C",
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.25)",
    borderRadius: 12,
    paddingVertical: 9,
  },
  genderPillSelected: {
    backgroundColor: "rgba(62, 232, 181, 0.15)",
    borderColor: "#3EE8B5",
  },
  genderPillText: {
    color: "#8FBAAB",
    fontSize: 9.5,
    fontWeight: "800",
  },
  genderPillTextSelected: {
    color: "#3EE8B5",
    fontWeight: "900",
  },

  themePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#0A241C",
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.25)",
  },
  themePillSelected: {
    backgroundColor: "rgba(62, 232, 181, 0.15)",
    borderColor: "#3EE8B5",
  },
  themePillText: {
    color: "#8FBAAB",
    fontSize: 10,
    fontWeight: "800",
  },
  themePillTextSelected: {
    color: "#3EE8B5",
    fontWeight: "900",
  },

  appInfoCard: {
    backgroundColor: "rgba(10, 36, 28, 0.6)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.2)",
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  appInfoTitle: {
    color: "#E8C36A",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  appInfoSub: {
    color: "#8FBAAB",
    fontSize: 8.5,
    fontWeight: "700",
    marginTop: 2,
  },

  dangerZoneCard: {
    backgroundColor: "#0E2C22",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.25)",
    gap: 10,
    marginBottom: 10,
  },
  actionButtonSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212, 180, 90, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.3)",
    paddingVertical: 13,
    borderRadius: 16,
    gap: 8,
  },
  actionBtnSecondaryText: {
    color: "#C5D9C8",
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
    marginTop: 4,
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
    backgroundColor: "rgba(212, 180, 90, 0.15)",
    borderWidth: 1.5,
    borderColor: "#C9A227",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  modalIconTop: { fontSize: 20 },
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
    backgroundColor: "#0E2C22",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    padding: 22,
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
