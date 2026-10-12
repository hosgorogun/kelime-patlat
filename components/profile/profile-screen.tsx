import React, { useState, useEffect } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  AVATARS,
  CYBER_TITLES,
  badgesFor,
  getActiveCyberTitle,
  getLevelProgress,
  getLeagueTier,
  isAvatarUnlocked,
  type AvatarId,
  type GenderType,
  type PlayerProgress,
} from "@/shared/progression";
import {
  triggerHapticError,
  triggerHapticSelection,
  triggerHapticSuccess,
} from "@/shared/audio-haptics";
import { normalizeTrUpper } from "@/shared/tr-utils";
import { PROFILE_FRAMES } from "@/shared/store-items";
import { styles } from "./profile.styles";
import { ProfileHeroCard } from "./profile-hero-card";
import { ProfileStatsGrid } from "./profile-stats-grid";
import { ProfileCustomizer } from "./profile-customizer";
import { ProfileSettingsTab } from "./profile-settings-tab";
import {
  ProfileLogoutModal,
  ProfileDeleteModal,
  ProfilePrivacyModal,
} from "./profile-modals";
import { WordBookModal } from "./word-book-modal";
import { CoinCascadeOverlay } from "@/components/game/coin-cascade";

export function ProfileScreen({
  playerName,
  onUpdatePlayerName,
  progress,
  setProgress,
  onSelectAvatar,
  onSelectTitle,
  onSelectFrame,
  onUpdateGender,
  onUpdateAvatarPhoto,
  sfxOn,
  toggleSfx,
  hapticsOn,
  toggleHaptics,
  onBack,
  isGuest,
  onOpenAuth,
  onLogout,
  onDeleteAccount,
  onShowToast,
  syncProgressToCloud,
}: {
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  progress: PlayerProgress;
  setProgress?: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud?: (progress: PlayerProgress) => Promise<void>;
  onSelectAvatar?: (avatar: AvatarId) => void;
  onSelectTitle?: (titleBadge: string) => void;
  onSelectFrame?: (frameId: string) => void;
  onUpdateGender?: (gender: GenderType) => void;
  onUpdateAvatarPhoto?: (photoUrl?: string) => void;
  sfxOn: boolean;
  toggleSfx: (val: boolean) => void;
  hapticsOn: boolean;
  toggleHaptics: (val: boolean) => void;
  onBack?: () => void;
  isGuest?: boolean;
  onOpenAuth?: () => void;
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
  const [showWordBookModal, setShowWordBookModal] = useState(false);
  const [wordRewardCascade, setWordRewardCascade] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [progress.avatarPhoto]);

  const safeName = playerName.trim().slice(0, 16) || "OYUNCU";
  const activeAvatar = AVATARS.find((a) => a.id === progress.selectedAvatar) ?? AVATARS[0]!;
  const currentFrameId = progress.selectedFrame || "signal";
  const activeFrame = PROFILE_FRAMES.find((f) => f[0] === currentFrameId);
  const activeFrameColor = activeFrame ? activeFrame[2] : activeAvatar.color || "#3EE8B5";

  const levelInfo = getLevelProgress(progress.xp);
  const currentLevel = levelInfo.level;
  const currentLevelXp = levelInfo.currentLevelXp;
  const nextLevelXp = levelInfo.nextLevelXp;
  const progressRatio = levelInfo.progressRatio;

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
    const trimmed = normalizeTrUpper(nameInput.trim()).slice(0, 16);
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

  const handlePickFromLibrary = async () => {
    try {
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
    } catch {
      triggerHapticError();
      Alert.alert("Fotoğraf Seçilemedi", "Fotoğraf galerisinden seçim yapılırken bir sorun oluştu.");
    }
  };

  const handleTakePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Kamera İzni Gerekli",
          "Profil fotoğrafı çekmek için kamera izni vermeniz gerekmektedir."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        triggerHapticSuccess();
        onUpdateAvatarPhoto?.(result.assets[0].uri);
      }
    } catch {
      triggerHapticError();
      Alert.alert("Fotoğraf Çekilemedi", "Kamera ile fotoğraf çekilirken bir sorun oluştu.");
    }
  };

  const handlePickPhoto = () => {
    triggerHapticSelection();
    Alert.alert(
      "Profil Fotoğrafı",
      "Yeni bir profil fotoğrafı belirlemek için seçim yapın:",
      [
        {
          text: "📷 Fotoğraf Çek",
          onPress: () => {
            void handleTakePhotoWithCamera();
          },
        },
        {
          text: "🖼️ Galeriden Seç",
          onPress: () => {
            void handlePickFromLibrary();
          },
        },
        {
          text: "İptal",
          style: "cancel",
        },
      ]
    );
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
          <Text style={styles.overline}>SENİN OYUNUN</Text>
          <Text style={styles.title}>Profil</Text>
        </View>
        <View style={styles.headerChipsBadge}>
          <Text style={styles.headerChipsIcon}>🪙</Text>
          <Text style={styles.headerChipsVal}>{progress.coins ?? 0}</Text>
        </View>
      </View>

      {/* 1. HERO OPERATÖR KARTI */}
      <ProfileHeroCard
        safeName={safeName}
        activeAvatar={activeAvatar}
        currentFrameId={currentFrameId}
        activeFrameColor={activeFrameColor}
        progress={progress}
        imgError={imgError}
        setImgError={setImgError}
        isEditingName={isEditingName}
        setIsEditingName={setIsEditingName}
        nameInput={nameInput}
        setNameInput={setNameInput}
        handleSaveName={handleSaveName}
        handlePickPhoto={handlePickPhoto}
        handleResetToGlyph={handleResetToGlyph}
        currentLevel={currentLevel}
        currentLevelXp={currentLevelXp}
        nextLevelXp={nextLevelXp}
        progressRatio={progressRatio}
        activeTitle={activeTitle}
        currentLeague={currentLeague}
      />

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
            Genel bakış
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
            Ayarlar
          </Text>
        </Pressable>
      </View>

      {activeTab === "overview" ? (
        <>
          {/* Kelime Defteri / Lügat Müzesi Banner */}
          <Pressable
            onPress={() => {
              triggerHapticSelection();
              setShowWordBookModal(true);
            }}
            style={({ pressed }) => [
              {
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 14,
                borderWidth: 1.5,
                borderBottomWidth: 3.5,
                borderColor: "#CBD5E1",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
                shadowColor: "#293541",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.07,
                shadowRadius: 5,
                elevation: 3,
              },
              pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#ECFDF5", justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: "#A7F3D0" }}>
                <Text style={{ fontSize: 24 }}>📖</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontWeight: "900", color: "#0F172A", letterSpacing: 0.3 }}>LÜGAT MÜZESİ & DEFTERİ</Text>
                <Text style={{ fontSize: 11, color: "#475569", marginTop: 2, fontWeight: "600" }}>
                  {progress.discoveredWords?.length || 0} Kelime Keşfedildi · TDK Tanımları & Hediyeler
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: "#0F172A", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "#334155" }}>
              <Text style={{ color: "#FFFFFF", fontSize: 11.5, fontWeight: "900" }}>AÇ ›</Text>
            </View>
          </Pressable>

          <ProfileStatsGrid
            progress={progress}
            totalMatches={totalMatches}
            winRate={winRate}
            wordPoolCount={wordPoolCount}
            longestWord={longestWord}
          />

          <ProfileCustomizer
            customizerTab={customizerTab}
            setCustomizerTab={setCustomizerTab}
            unlockedFramesCount={unlockedFramesCount}
            unlockedAvatarsCount={unlockedAvatarsCount}
            unlockedTitlesCount={unlockedTitlesCount}
            unlockedBadgesCount={unlockedBadgesCount}
            progress={progress}
            activeTitle={activeTitle}
            badges={badges}
            onSelectFrame={onSelectFrame}
            onSelectAvatar={onSelectAvatar}
            onSelectTitle={onSelectTitle}
            onUpdateAvatarPhoto={onUpdateAvatarPhoto}
            onShowToast={onShowToast}
          />
        </>
      ) : (
        <ProfileSettingsTab
          sfxOn={sfxOn}
          toggleSfx={toggleSfx}
          hapticsOn={hapticsOn}
          toggleHaptics={toggleHaptics}
          notificationsOn={progress.notificationsEnabled !== false}
          toggleNotifications={(val) => {
            if (setProgress) {
              setProgress((prev) => {
                const next = { ...prev, notificationsEnabled: val };
                void syncProgressToCloud?.(next);
                return next;
              });
            }
          }}
          progress={progress}
          onUpdateGender={onUpdateGender}
          isGuest={isGuest}
          onOpenAuth={onOpenAuth}
          onOpenLogoutModal={() => setShowLogoutModal(true)}
          onOpenDeleteModal={() => {
            setDeleteConfirmInput("");
            setShowDeleteModal(true);
          }}
          onOpenPrivacyModal={() => setShowPrivacyModal(true)}
          hasDeleteAccount={Boolean(onDeleteAccount)}
          onShowToast={onShowToast}
        />
      )}

      {/* Confirmation Modals */}
      <ProfileLogoutModal
        visible={showLogoutModal}
        onDismiss={() => setShowLogoutModal(false)}
        onConfirmLogout={onLogout}
      />

      <ProfileDeleteModal
        visible={showDeleteModal}
        deleteConfirmInput={deleteConfirmInput}
        setDeleteConfirmInput={setDeleteConfirmInput}
        onDismiss={() => setShowDeleteModal(false)}
        onConfirmDelete={() => onDeleteAccount?.()}
      />

      <ProfilePrivacyModal
        visible={showPrivacyModal}
        onDismiss={() => setShowPrivacyModal(false)}
      />

      <WordBookModal
        visible={showWordBookModal}
        onDismiss={() => setShowWordBookModal(false)}
        progress={progress}
        setProgress={setProgress || (() => {})}
        onClaimMilestone={(m) => {
          setWordRewardCascade(true);
          setTimeout(() => setWordRewardCascade(false), 1600);
          onShowToast?.("LÜGAT ÖDÜLÜ ALINDI", `${m.count} kelime başarısı: +${m.rewardCoins} Çip!`, "📖", "#10B981");
          if (syncProgressToCloud && setProgress) {
            setProgress((curr) => {
              const updated = {
                ...curr,
                coins: (curr.coins ?? 0) + m.rewardCoins,
                wordBookClaimedMilestones: {
                  ...(curr.wordBookClaimedMilestones || {}),
                  [m.count]: true,
                },
              };
              void syncProgressToCloud(updated);
              return updated;
            });
          }
        }}
      />
      <CoinCascadeOverlay trigger={wordRewardCascade} count={10} icon="🪙" />
    </ScrollView>
  );
}
