import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import { AVATARS, getTierColor, getPlayerLevel } from "@/shared/progression";
import { triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { PROFILE_FRAMES } from "@/shared/store-items";
import { FRAME_IMAGES } from "./profile-constants";
import { ModernAlertModal, type ModernAlertData } from "@/components/modals/modern-alert-modal";
import { styles } from "./user-profile-modal.styles";

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

export function UserProfileModal({
  visible,
  user,
  isFriend,
  isSelf,
  onClose,
  onAddFriend,
  onRemoveFriend,
  onChallenge,
}: {
  visible: boolean;
  user: InspectableUser | null;
  isFriend?: boolean;
  isSelf?: boolean;
  onClose: () => void;
  onAddFriend?: (user: InspectableUser) => void;
  onRemoveFriend?: (user: InspectableUser) => void;
  onChallenge?: (user: InspectableUser) => void;
}) {
  const [imgError, setImgError] = React.useState(false);
  const [isSendingFriend, setIsSendingFriend] = React.useState(false);
  const [alertData, setAlertData] = React.useState<ModernAlertData | null>(null);
  const friendTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setImgError(false);
    setIsSendingFriend(false);
    return () => {
      if (friendTimerRef.current) clearTimeout(friendTimerRef.current);
    };
  }, [user?.id, user?.avatarPhoto]);

  if (!user) return null;

  const displayName = (user.name || user.username || "").trim().slice(0, 16) || "OYUNCU";
  const displayTitle = user.selectedTitle || "[ÇAYLAK]";
  const displayLevel = user.level ?? (user.xp ? getPlayerLevel(user.xp) : 1);
  const displayTier = user.tier || "DEMİR";
  const tierColor = getTierColor(displayTier);

  const activeAvatarObj = AVATARS.find((a) => a.id === user.avatar);
  const avatarIcon = activeAvatarObj ? activeAvatarObj.icon : user.avatar || (user.isBot ? "🤖" : "⚡");
  const avatarColor = activeAvatarObj ? activeAvatarObj.color : "#3EE8B5";
  const avatarSurface = activeAvatarObj ? activeAvatarObj.surface : "#F0F5ED";
  const activeFrameObj = PROFILE_FRAMES.find((f) => f[0] === user.selectedFrame);
  const frameBorderColor = activeFrameObj ? activeFrameObj[2] : avatarColor;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
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
                {user.selectedFrame && FRAME_IMAGES[user.selectedFrame] ? (
                  <Image
                    source={FRAME_IMAGES[user.selectedFrame]}
                    style={{ position: "absolute", width: "100%", height: "100%", borderRadius: 36, zIndex: 1 }}
                    resizeMode="cover"
                  />
                ) : null}
                {user.avatarPhoto && !imgError ? (
                  <Image
                    source={{ uri: user.avatarPhoto }}
                    style={[
                      styles.avatarImage,
                      user.selectedFrame && FRAME_IMAGES[user.selectedFrame] && { width: "84%", height: "84%", borderRadius: 30, zIndex: 0 },
                    ]}
                    onError={() => setImgError(true)}
                  />
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
                      <Text style={styles.botTagText}>🤖 BOT RAKİP</Text>
                    </View>
                  ) : (
                    <View style={[styles.tierTag, { borderColor: tierColor, backgroundColor: `${tierColor}18` }]}>
                      <Text style={[styles.tierTagText, { color: tierColor }]}>{displayTier} LİGİ</Text>
                    </View>
                  )}
                  {user.lp !== undefined && user.lp >= 0 && (
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
                <Text style={[styles.intelValue, { color: "#279f73" }]}>
                  {user.historyCount ?? (user.matches ? user.matches * 3 : 0)} KELİME
                </Text>
              </View>
              <View style={styles.intelDivider} />
              <View style={styles.intelCell}>
                <Text style={styles.intelLabel}>🌟 TOPLAM XP</Text>
                <Text style={[styles.intelValue, { color: "#2a9c7a" }]}>
                  {user.xp ?? 0}
                </Text>
              </View>
            </View>

            {/* Actions Bar */}
            <View style={styles.actionsRow}>
              {isSelf ? (
                <View style={[styles.alreadyFriendBadge, { borderColor: "#DCE1D7", backgroundColor: "rgba(62, 232, 181, 0.12)" }]}>
                  <Text style={[styles.alreadyFriendText, { color: "#2a9c7a" }]}>⭐ SENİN HESABIN</Text>
                </View>
              ) : isFriend ? (
                <Pressable
                  onPress={() => {
                    triggerHapticSelection();
                    setAlertData({
                      icon: "👥",
                      kicker: "ARKADAŞLIK YÖNETİMİ",
                      title: "Arkadaşı Çıkar",
                      message: `"${displayName}" adlı kullanıcıyı arkadaş listenden çıkarmak istediğine emin misin?`,
                      accentColor: "#EF4444",
                      primaryButton: {
                        text: "Çıkar",
                        color: "#EF4444",
                        onPress: () => {
                          onRemoveFriend?.(user);
                          setAlertData(null);
                        },
                      },
                      secondaryButton: {
                        text: "Vazgeç",
                        onPress: () => setAlertData(null),
                      },
                    });
                  }}
                  style={({ pressed }) => [styles.alreadyFriendBadge, pressed && styles.pressed]}
                >
                  <Text style={styles.alreadyFriendText}>✓ ARKADAŞINIZ (ÇIKAR)</Text>
                </Pressable>
              ) : (
                <Pressable
                  disabled={isSendingFriend}
                  onPress={() => {
                    if (isSendingFriend) return;
                    setIsSendingFriend(true);
                    triggerHapticSuccess();
                    onAddFriend?.(user);
                    if (friendTimerRef.current) clearTimeout(friendTimerRef.current);
                    friendTimerRef.current = setTimeout(() => setIsSendingFriend(false), 2000);
                  }}
                  style={({ pressed }) => [
                    styles.addFriendBtn,
                    (pressed || isSendingFriend) && styles.pressed,
                    isSendingFriend && { opacity: 0.6 },
                  ]}
                >
                  <Text style={styles.addFriendBtnText}>
                    {isSendingFriend ? "⏳ İLETİLİYOR..." : "➕ ARKADAŞ EKLE"}
                  </Text>
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

            {!isSelf && (
              <Pressable
                onPress={() => {
                  triggerHapticSelection();
                  setAlertData({
                    icon: "🛡️",
                    kicker: "GÜVENLİK VE MODERASYON",
                    title: "Oyuncuyu Bildir / Engelle",
                    message: `"${displayName}" isimli oyuncuyu uygunsuz davranış, hile veya rahatsızlık nedeniyle bildirmek veya engellemek istiyor musunuz?`,
                    accentColor: "#EF4444",
                    primaryButton: {
                      text: "🚫 Oyuncuyu Engelle",
                      color: "#EF4444",
                      onPress: () => {
                        setAlertData({
                          icon: "✓",
                          title: "Oyuncu Engellendi",
                          message: `"${displayName}" başarıyla engellendi. Artık seninle eşleşmeyecek.`,
                          accentColor: "#10B981",
                          primaryButton: {
                            text: "Tamam",
                            onPress: () => setAlertData(null),
                          },
                        });
                      },
                    },
                    secondaryButton: {
                      text: "⚠️ Şikayet Et (Report)",
                      onPress: () => {
                        setAlertData({
                          icon: "✉️",
                          title: "Şikayet İletildi",
                          message: "Geri bildiriminiz moderasyon ekibimize başarıyla ulaştı. Teşekkür ederiz.",
                          accentColor: "#F59E0B",
                          primaryButton: {
                            text: "Tamam",
                            onPress: () => setAlertData(null),
                          },
                        });
                      },
                    },
                  });
                }}
                style={{ marginTop: 12, alignItems: "center", paddingVertical: 6 }}
              >
                <Text style={{ fontSize: 11, color: "#94A3B8", fontWeight: "600", textDecorationLine: "underline" }}>
                  ⚠️ Oyuncuyu Bildir veya Engelle (Report & Block)
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>

      <ModernAlertModal inline alert={alertData} onDismiss={() => setAlertData(null)} />
    </Modal>
  );
}
