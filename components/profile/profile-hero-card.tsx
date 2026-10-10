import React from "react";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import type { PlayerProgress, AvatarDefinition, LeagueTier } from "@/shared/progression";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { FRAME_IMAGES } from "./profile-constants";
import { styles } from "./profile.styles";

export type ProfileHeroCardProps = {
  safeName: string;
  activeAvatar: AvatarDefinition;
  currentFrameId: string;
  activeFrameColor: string;
  progress: PlayerProgress;
  imgError: boolean;
  setImgError: (val: boolean) => void;
  isEditingName: boolean;
  setIsEditingName: (val: boolean) => void;
  nameInput: string;
  setNameInput: (val: string) => void;
  handleSaveName: () => void;
  handlePickPhoto: () => void;
  handleResetToGlyph: () => void;
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressRatio: number;
  activeTitle: string;
  currentLeague: LeagueTier;
};

export const ProfileHeroCard = React.memo(({
  safeName,
  activeAvatar,
  currentFrameId,
  activeFrameColor,
  progress,
  imgError,
  setImgError,
  isEditingName,
  setIsEditingName,
  nameInput,
  setNameInput,
  handleSaveName,
  handlePickPhoto,
  handleResetToGlyph,
  currentLevel,
  currentLevelXp,
  nextLevelXp,
  progressRatio,
  activeTitle,
  currentLeague,
}: ProfileHeroCardProps) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.heroCard,
        pressed && { transform: [{ rotateX: "-3deg" }, { scale: 0.985 }] },
      ]}
    >
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
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            {FRAME_IMAGES[currentFrameId] ? (
              <Image
                source={FRAME_IMAGES[currentFrameId]}
                style={{ position: "absolute", width: "100%", height: "100%", borderRadius: 44, zIndex: 1 }}
                resizeMode="cover"
              />
            ) : null}
            {progress.avatarPhoto && !imgError ? (
              <Image
                source={{ uri: progress.avatarPhoto }}
                style={[
                  styles.avatarImage,
                  FRAME_IMAGES[currentFrameId] && { width: "84%", height: "84%", borderRadius: 36, zIndex: 0 },
                ]}
                onError={() => setImgError(true)}
              />
            ) : (
              <View
                style={[
                  styles.avatarInnerFallback,
                  { backgroundColor: activeAvatar.surface || "#F0F5ED" },
                  FRAME_IMAGES[currentFrameId] && { width: "84%", height: "84%", borderRadius: 36, zIndex: 0 },
                ]}
              >
                <Text style={[styles.avatarGlyph, { color: activeAvatar.color || "#349d5a" }]}>
                  {activeAvatar.icon}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Photo Action Buttons */}
          <View style={styles.avatarActionsRow}>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                handlePickPhoto();
              }}
              style={styles.cameraIconBtn}
            >
              <Text style={styles.cameraIconText}>📷 FOTOĞRAF</Text>
            </Pressable>
            {Boolean(progress.avatarPhoto) && (
              <Pressable
                onPress={() => {
                  triggerHapticSelection();
                  handleResetToGlyph();
                }}
                style={styles.resetGlyphBtn}
              >
                <Text style={styles.resetGlyphText}>✕ GLİF</Text>
              </Pressable>
            )}
          </View>

          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>LV.{currentLevel}</Text>
          </View>

          {/* Alevli Zafer Serisi Rozeti */}
          {(progress.pvpWinStreak ?? 0) >= 2 && (
            <View style={styles.flameBadge}>
              <Text style={{ fontSize: 9.5, marginRight: 2 }}>🔥</Text>
              <Text style={styles.flameBadgeText}>
                {progress.pvpWinStreak}{(progress.streakShields ?? 0) > 0 ? " 🛡️" : ""}
              </Text>
            </View>
          )}
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

            {/* Alevli Zafer Serisi Rozeti */}
            {(progress.pvpWinStreak ?? 0) >= 2 && (
              <View style={[styles.leagueBadge, { borderColor: "#F97316", backgroundColor: "#FFF7ED" }]}>
                <Text style={{ fontSize: 11, marginRight: 2 }}>🔥</Text>
                <Text style={[styles.leagueBadgeText, { color: "#C2410C" }]}>
                  {progress.pvpWinStreak} Zafer{(progress.streakShields ?? 0) > 0 ? " · 🛡️ Korumalı" : ""}
                </Text>
              </View>
            )}
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
  );
});

ProfileHeroCard.displayName = "ProfileHeroCard";
