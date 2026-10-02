import React from "react";
import { View, Text, Pressable, ScrollView, Image, Alert } from "react-native";
import {
  AVATARS,
  CYBER_TITLES,
  isAvatarUnlocked,
  type AvatarId,
  type PlayerProgress,
  type Badge,
} from "@/shared/progression";
import { triggerHapticError, triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { PROFILE_FRAMES } from "@/shared/store-items";
import { FRAME_IMAGES } from "./profile-constants";
import { styles } from "./profile.styles";

export type ProfileCustomizerProps = {
  customizerTab: "frames" | "avatars" | "titles" | "badges";
  setCustomizerTab: (tab: "frames" | "avatars" | "titles" | "badges") => void;
  unlockedFramesCount: number;
  unlockedAvatarsCount: number;
  unlockedTitlesCount: number;
  unlockedBadgesCount: number;
  progress: PlayerProgress;
  activeTitle: string;
  badges: Badge[];
  onSelectFrame?: (frameId: string) => void;
  onSelectAvatar?: (avatar: AvatarId) => void;
  onSelectTitle?: (titleBadge: string) => void;
  onUpdateAvatarPhoto?: (photoUrl?: string) => void;
  onShowToast?: (title: string, subtitle: string, icon?: string, accentColor?: string) => void;
};

export const ProfileCustomizer = React.memo(({
  customizerTab,
  setCustomizerTab,
  unlockedFramesCount,
  unlockedAvatarsCount,
  unlockedTitlesCount,
  unlockedBadgesCount,
  progress,
  activeTitle,
  badges,
  onSelectFrame,
  onSelectAvatar,
  onSelectTitle,
  onUpdateAvatarPhoto,
  onShowToast,
}: ProfileCustomizerProps) => {
  return (
    <>
      {/* 3. PROFİL ÖZELLEŞTİRME MERKEZİ */}
      <View style={[styles.sectionHeader, { marginTop: 22 }]}>
        <Text style={styles.sectionTitle}>Kendine göre seç</Text>
        <Text style={styles.sectionMeta}>KOLEKSİYON</Text>
      </View>

      {/* Customizer Sub-Tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#FFFFFF",
          padding: 4,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: "#DCE1D7",
          marginBottom: 14,
        }}
      >
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setCustomizerTab("frames");
          }}
          style={[
            { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
            customizerTab === "frames" && { backgroundColor: "#FFD66E", borderWidth: 1, borderColor: "#F0C855" },
          ]}
        >
          <Text
            style={[
              { fontSize: 10, fontWeight: "800", color: "#64748B" },
              customizerTab === "frames" && { color: "#293541", fontWeight: "900" },
            ]}
          >
            🖼️ ÇERÇEVE ({unlockedFramesCount})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setCustomizerTab("avatars");
          }}
          style={[
            { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
            customizerTab === "avatars" && { backgroundColor: "#FFD66E", borderWidth: 1, borderColor: "#F0C855" },
          ]}
        >
          <Text
            style={[
              { fontSize: 10, fontWeight: "800", color: "#64748B" },
              customizerTab === "avatars" && { color: "#293541", fontWeight: "900" },
            ]}
          >
            🤖 AVATAR ({unlockedAvatarsCount})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setCustomizerTab("titles");
          }}
          style={[
            { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
            customizerTab === "titles" && { backgroundColor: "#FFD66E", borderWidth: 1, borderColor: "#F0C855" },
          ]}
        >
          <Text
            style={[
              { fontSize: 10, fontWeight: "800", color: "#64748B" },
              customizerTab === "titles" && { color: "#293541", fontWeight: "900" },
            ]}
          >
            🎖️ UNVAN ({unlockedTitlesCount})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setCustomizerTab("badges");
          }}
          style={[
            { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
            customizerTab === "badges" && { backgroundColor: "#FFD66E", borderWidth: 1, borderColor: "#F0C855" },
          ]}
        >
          <Text
            style={[
              { fontSize: 10, fontWeight: "800", color: "#64748B" },
              customizerTab === "badges" && { color: "#293541", fontWeight: "900" },
            ]}
          >
            🏆 ROZET ({unlockedBadgesCount})
          </Text>
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
                  isSelected && { borderColor: fColor, backgroundColor: "#F0FAF5", borderWidth: 2 },
                  !isUnlocked && styles.frameTileLocked,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.framePreviewCircle, { borderColor: fColor }]}>
                  {FRAME_IMAGES[fId] ? (
                    <Image
                      source={FRAME_IMAGES[fId]}
                      style={{ width: 34, height: 34, borderRadius: 17, opacity: isUnlocked ? 1 : 0.45 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.framePreviewInner, { backgroundColor: isSelected ? fColor : "#F0FAF5" }]}>
                      <Text style={{ fontSize: 13 }}>{isUnlocked ? "✦" : "🔒"}</Text>
                    </View>
                  )}
                  {!isUnlocked && (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.35)",
                        borderRadius: 17,
                      }}
                    >
                      <Text style={{ fontSize: 11 }}>🔒</Text>
                    </View>
                  )}
                </View>

                <Text
                  numberOfLines={1}
                  style={[styles.badgeTileTitle, isSelected && { color: fColor }, !isUnlocked && { color: "#64748B" }]}
                >
                  {fName}
                </Text>

                <View
                  style={[
                    styles.titleMiniStatusPill,
                    isSelected && styles.titleMiniStatusSelected,
                    !isUnlocked && styles.titleMiniStatusLocked,
                  ]}
                >
                  <Text
                    style={[
                      styles.titleMiniStatusText,
                      isSelected && { color: "#293541" },
                      !isUnlocked && { color: "#64748B" },
                    ]}
                  >
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
                  isSelected && { borderColor: avatar.color || "#2A9C7A", backgroundColor: "#F0FAF5", borderWidth: 2 },
                  !unlocked && styles.badgeTileLocked,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.badgeIconBubble,
                    isSelected
                      ? { backgroundColor: "#E6F7F0", borderColor: avatar.color || "#2A9C7A" }
                      : unlocked
                      ? { backgroundColor: "#F7F5EE", borderColor: avatar.color || "#DCE1D7" }
                      : { backgroundColor: "#EDECE8", borderColor: "#DCE1D7" },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeIconText,
                      { color: isSelected ? avatar.color || "#2a9c7a" : unlocked ? avatar.color || "#8c7540" : "#64748B" },
                    ]}
                  >
                    {unlocked ? avatar.icon : "🔒"}
                  </Text>
                </View>

                <Text
                  numberOfLines={1}
                  style={[styles.badgeTileTitle, isSelected && { color: avatar.color || "#2a9c7a" }, !unlocked && { color: "#64748B" }]}
                >
                  {avatar.label}
                </Text>

                <View
                  style={[
                    styles.titleMiniStatusPill,
                    isSelected && styles.titleMiniStatusSelected,
                    !unlocked && styles.titleMiniStatusLocked,
                  ]}
                >
                  <Text
                    style={[
                      styles.titleMiniStatusText,
                      isSelected && { color: "#293541" },
                      !unlocked && { color: "#64748B" },
                    ]}
                  >
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
          {[...CYBER_TITLES.filter((t) => t.unlocked(progress)), ...CYBER_TITLES.filter((t) => !t.unlocked(progress))].map(
            (title) => {
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
                  <View
                    style={[
                      styles.badgeIconBubble,
                      isSelected
                        ? { backgroundColor: "#E6F7F0", borderColor: "#2A9C7A" }
                        : unlocked
                        ? { backgroundColor: "#F7F5EE", borderColor: title.accent || "#DCE1D7" }
                        : { backgroundColor: "#EDECE8", borderColor: "#DCE1D7" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeIconText,
                        { color: isSelected ? "#2a9c7a" : unlocked ? title.accent || "#8c7540" : "#64748B" },
                      ]}
                    >
                      {unlocked ? title.icon || "🎖️" : "🔒"}
                    </Text>
                  </View>

                  <Text
                    numberOfLines={1}
                    style={[styles.badgeTileTitle, isSelected && { color: "#2a9c7a" }, !unlocked && { color: "#64748B" }]}
                  >
                    {title.badge}
                  </Text>

                  <View
                    style={[
                      styles.titleMiniStatusPill,
                      isSelected && styles.titleMiniStatusSelected,
                      !unlocked && styles.titleMiniStatusLocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.titleMiniStatusText,
                        isSelected && { color: "#293541" },
                        !unlocked && { color: "#64748B" },
                      ]}
                    >
                      {isSelected ? "SEÇİLİ" : unlocked ? "SEÇ" : "KİLİTLİ"}
                    </Text>
                  </View>
                </Pressable>
              );
            }
          )}
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
                      unlocked
                        ? `${badge.description}\n\nTebrikler, bu başarıyı kazandın!`
                        : `${badge.description}\n\nBu rozeti kazanmak için görevi tamamla.`
                    );
                  }
                }}
                style={({ pressed }) => [
                  styles.badgeTile,
                  unlocked ? { borderColor: badge.accent, backgroundColor: "#FFFFFF" } : styles.badgeTileLocked,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.badgeIconBubble,
                    unlocked
                      ? { backgroundColor: "#F0FAF5", borderColor: badge.accent }
                      : { backgroundColor: "#EDECE8", borderColor: "#DCE1D7" },
                  ]}
                >
                  <Text style={[styles.badgeIconText, { color: unlocked ? badge.accent : "#64748B" }]}>
                    {unlocked ? badge.icon : "🔒"}
                  </Text>
                </View>
                <Text numberOfLines={1} style={[styles.badgeTileTitle, !unlocked && { color: "#64748B" }]}>
                  {badge.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </>
  );
});

ProfileCustomizer.displayName = "ProfileCustomizer";
