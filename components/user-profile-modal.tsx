import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import { AVATARS } from "@/shared/progression";
import { triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { PROFILE_FRAMES } from "@/shared/store-items";

export type InspectableUser = {
  id: string;
  name: string;
  username?: string;
  isBot?: boolean;
  avatar?: string;
  avatarPhoto?: string;
  selectedTitle?: string;
  selectedFrame?: string;
  level?: number;
  tier?: string;
  lp?: number;
  wins?: number;
  matches?: number;
  streak?: number;
  bestScore?: number;
  bestTempo?: number;
  xp?: number;
  historyCount?: number;
};

const TIER_COLORS: Record<string, string> = {
  DEMİR: "#94A3B8",
  BRONZ: "#CD7F32",
  GÜMÜŞ: "#CBD5E1",
  ALTIN: "#F59E0B",
  PLATİN: "#38BDF8",
  ELMAS: "#818CF8",
  YÜCELİK: "#C084FC",
  ÖLÜMSÜZLÜK: "#F43F5E",
  RADIAN: "#FBBF24",
};

export function UserProfileModal({
  visible,
  user,
  isFriend,
  isSelf,
  onClose,
  onAddFriend,
  onChallenge,
}: {
  visible: boolean;
  user: InspectableUser | null;
  isFriend?: boolean;
  isSelf?: boolean;
  onClose: () => void;
  onAddFriend?: (user: InspectableUser) => void;
  onChallenge?: (user: InspectableUser) => void;
}) {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [user?.avatarPhoto]);

  if (!user) return null;

  const displayName = (user.name || user.username || "").trim().slice(0, 16) || "OYUNCU";
  const displayTitle = user.selectedTitle || "[ÇAYLAK]";
  const displayLevel = user.level ?? (user.xp ? Math.floor(user.xp / 200) + 1 : 1);
  const displayTier = user.tier || "DEMİR";
  const tierColor = TIER_COLORS[displayTier] || "#94A3B8";

  const activeAvatarObj = AVATARS.find((a) => a.id === user.avatar);
  const avatarIcon = activeAvatarObj ? activeAvatarObj.icon : user.avatar || (user.isBot ? "🤖" : "⚡");
  const avatarColor = activeAvatarObj ? activeAvatarObj.color : "#3EE8B5";
  const avatarSurface = activeAvatarObj ? activeAvatarObj.surface : "#0E2C22";
  const activeFrameObj = PROFILE_FRAMES.find((f) => f[0] === user.selectedFrame);
  const frameBorderColor = activeFrameObj ? activeFrameObj[2] : avatarColor;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.cardContainer} onPress={(e) => e.stopPropagation()}>
          {/* Neon Header Accent */}
          <View style={styles.accentLine} />

          {/* Close Button */}
          <Pressable
            onPress={() => {
              triggerHapticSelection();
              onClose();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeBtn}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Top Identity Block */}
            <View style={styles.identityRow}>
              <View style={[styles.avatarBox, { borderColor: frameBorderColor, backgroundColor: avatarSurface }]}>
                {user.avatarPhoto && !imgError ? (
                  <Image source={{ uri: user.avatarPhoto }} style={styles.avatarImage} onError={() => setImgError(true)} />
                ) : (
                  <Text style={[styles.avatarIconText, { color: avatarColor }]}>{avatarIcon}</Text>
                )}
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>LV.{displayLevel}</Text>
                </View>
              </View>

              <View style={styles.nameBlock}>
                <View style={styles.titleBadge}>
                  <Text style={styles.titleBadgeIcon}>🎖️</Text>
                  <Text numberOfLines={1} style={styles.titleBadgeText}>{displayTitle}</Text>
                </View>

                <Text numberOfLines={1} style={styles.userNameText}>{displayName}</Text>

                <View style={styles.subMetaRow}>
                  {user.isBot ? (
                    <View style={styles.botTag}>
                      <Text style={styles.botTagText}>🤖 SİBER BOT</Text>
                    </View>
                  ) : (
                    <View style={[styles.tierTag, { borderColor: tierColor, backgroundColor: `${tierColor}18` }]}>
                      <Text style={[styles.tierTagText, { color: tierColor }]}>{displayTier} LİGİ</Text>
                    </View>
                  )}
                  {user.lp !== undefined && user.lp > 0 && (
                    <Text style={styles.lpText}>{user.lp} LP</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Career Stats 2x2 */}
            <View style={styles.statsContainer}>
              <Text style={styles.sectionHeader}>📊 KARİYER KAYITLARI</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statTile}>
                  <Text style={styles.statIcon}>🏆</Text>
                  <View>
                    <Text style={styles.statNumber}>{user.wins ?? 0}</Text>
                    <Text style={styles.statCaption}>GALİBİYET</Text>
                  </View>
                </View>

                <View style={styles.statTile}>
                  <Text style={styles.statIcon}>⚔️</Text>
                  <View>
                    <Text style={styles.statNumber}>{user.matches ?? 0}</Text>
                    <Text style={styles.statCaption}>TOPLAM MAÇ</Text>
                  </View>
                </View>

                <View style={styles.statTile}>
                  <Text style={styles.statIcon}>⚡</Text>
                  <View>
                    <Text style={styles.statNumber}>{user.bestScore ?? 0}</Text>
                    <Text style={styles.statCaption}>EN İYİ SKOR</Text>
                  </View>
                </View>

                <View style={styles.statTile}>
                  <Text style={styles.statIcon}>🔥</Text>
                  <View>
                    <Text style={styles.statNumber}>{user.streak ?? 0} GÜN</Text>
                    <Text style={styles.statCaption}>AKTİF SERİ</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Tactical Intel Strip */}
            <View style={styles.intelStrip}>
              <View style={styles.intelCell}>
                <Text style={styles.intelLabel}>⚡ EN İYİ TEMPO</Text>
                <Text style={styles.intelValue}>
                  {user.bestTempo ? `${user.bestTempo} K/DK` : "—"}
                </Text>
              </View>
              <View style={styles.intelDivider} />
              <View style={styles.intelCell}>
                <Text style={styles.intelLabel}>📚 KELİME HAVUZU</Text>
                <Text style={[styles.intelValue, { color: "#34D399" }]}>
                  {user.historyCount ?? (user.matches ? user.matches * 3 : 0)} KELİME
                </Text>
              </View>
              <View style={styles.intelDivider} />
              <View style={styles.intelCell}>
                <Text style={styles.intelLabel}>🌟 TOPLAM XP</Text>
                <Text style={[styles.intelValue, { color: "#3EE8B5" }]}>
                  {user.xp ?? 0}
                </Text>
              </View>
            </View>

            {/* Actions Bar */}
            <View style={styles.actionsRow}>
              {isSelf ? (
                <View style={[styles.alreadyFriendBadge, { borderColor: "#3EE8B5", backgroundColor: "rgba(62, 232, 181, 0.12)" }]}>
                  <Text style={[styles.alreadyFriendText, { color: "#3EE8B5" }]}>⭐ SENİN HESABIN</Text>
                </View>
              ) : isFriend ? (
                <View style={styles.alreadyFriendBadge}>
                  <Text style={styles.alreadyFriendText}>✓ ARKADAŞINIZ</Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    triggerHapticSuccess();
                    onAddFriend?.(user);
                  }}
                  style={({ pressed }) => [styles.addFriendBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.addFriendBtnText}>➕ ARKADAŞ EKLE</Text>
                </Pressable>
              )}

              {!isSelf && onChallenge && (
                <Pressable
                  onPress={() => {
                    triggerHapticSelection();
                    onChallenge(user);
                  }}
                  style={({ pressed }) => [styles.challengeBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.challengeBtnText}>⚔️ MEYDAN OKU</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(4, 17, 12, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0E2C22",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.4)",
    padding: 18,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
  },
  accentLine: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 3,
    backgroundColor: "#3EE8B5",
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeBtnText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "900",
  },
  scrollContent: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  avatarBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  avatarIconText: {
    fontSize: 28,
  },
  levelBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    backgroundColor: "#D4B45A",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "#C5D9C8",
  },
  levelBadgeText: {
    color: "#FFF",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  nameBlock: {
    flex: 1,
  },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(62, 232, 181, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(62, 232, 181, 0.3)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
    marginBottom: 4,
  },
  titleBadgeIcon: {
    fontSize: 10,
  },
  titleBadgeText: {
    color: "#3EE8B5",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  userNameText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  subMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tierTag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tierTagText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  botTag: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#EF4444",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  botTagText: {
    color: "#EF4444",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  lpText: {
    color: "#CBD5E1",
    fontSize: 9.5,
    fontWeight: "800",
  },
  sectionHeader: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  statsContainer: {
    marginBottom: 12,
  },
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
    borderRadius: 12,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  statIcon: {
    fontSize: 18,
  },
  statNumber: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statCaption: {
    color: "#8FBAAB",
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  intelStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(14, 44, 34, 0.95)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.25)",
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  intelCell: {
    flex: 1,
    alignItems: "center",
  },
  intelLabel: {
    color: "#8FBAAB",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  intelValue: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  intelDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(212, 180, 90, 0.2)",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  addFriendBtn: {
    flex: 1,
    backgroundColor: "#D4B45A",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  addFriendBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  alreadyFriendBadge: {
    flex: 1,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderColor: "#34D399",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  alreadyFriendText: {
    color: "#34D399",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  challengeBtn: {
    flex: 1,
    backgroundColor: "rgba(62, 232, 181, 0.15)",
    borderColor: "#3EE8B5",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3EE8B5",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  challengeBtnText: {
    color: "#3EE8B5",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
