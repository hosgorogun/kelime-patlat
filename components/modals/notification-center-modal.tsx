import React from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { ICONS } from "@/components/game/game-ui";
import type { PlayerProgress } from "@/shared/progression";

export type NotificationItem = {
  id: string;
  icon: any; // Image source or emoji string
  isEmoji?: boolean;
  kicker: string;
  title: string;
  description: string;
  badge?: string;
  accentColor: string;
  actionLabel?: string;
  onPressAction?: () => void;
  isPriority?: boolean;
};

export type NotificationCenterModalProps = {
  visible: boolean;
  onClose: () => void;
  progress: PlayerProgress;
  unclaimedMissionsCount: number;
  isClaimedToday: boolean;
  canSpinWheel: boolean;
  lives: number;
  onNavigate: (screen: any) => void;
  onOpenDailyReward: () => void;
  onOpenLuckyWheel?: () => void;
  onOpenLivesModal?: () => void;
};

export function NotificationCenterModal({
  visible,
  onClose,
  progress,
  unclaimedMissionsCount,
  isClaimedToday,
  canSpinWheel,
  lives,
  onNavigate,
  onOpenDailyReward,
  onOpenLuckyWheel,
  onOpenLivesModal,
}: NotificationCenterModalProps) {
  if (!visible) return null;

  const notifications: NotificationItem[] = [];

  // 1. Günlük Giriş Ödülü Bildirimi
  if (!isClaimedToday) {
    notifications.push({
      id: "daily_reward",
      icon: ICONS.gift,
      kicker: "GÜNLÜK HEDİYE",
      title: "Günün Giriş Ödülü Hazır!",
      description: "Bugünkü ücretsiz çip ve takviye ödüllerini henüz toplamadın.",
      badge: "BEKLİYOR",
      accentColor: "#F59E0B",
      actionLabel: "Ödülü Topla",
      isPriority: true,
      onPressAction: () => {
        onClose();
        onOpenDailyReward();
      },
    });
  }

  // 2. Tamamlanan Görev Bildirimi
  if (unclaimedMissionsCount > 0) {
    notifications.push({
      id: "missions",
      icon: ICONS.missions,
      kicker: "GÖREV MERKEZİ",
      title: `${unclaimedMissionsCount} Görevin Ödülü Hazır!`,
      description: "Tamamladığın görevlerden kazanılan XP, çip ve kalkan ödüllerini al.",
      badge: `${unclaimedMissionsCount} ÖDÜL`,
      accentColor: "#10B981",
      actionLabel: "Görevlere Git",
      isPriority: true,
      onPressAction: () => {
        onClose();
        onNavigate("missions");
      },
    });
  }

  // 3. Şans Çarkı Bildirimi
  if (canSpinWheel) {
    notifications.push({
      id: "lucky_wheel",
      icon: ICONS.wheel,
      kicker: "ŞANS ÇARKI",
      title: "Ücretsiz Çevirme Hakkı!",
      description: "Siber şans çarkında joker ve çip ödülleri seni bekliyor.",
      badge: "ÜCRETSİZ",
      accentColor: "#8B5CF6",
      actionLabel: "Çarkı Çevir",
      isPriority: true,
      onPressAction: () => {
        onClose();
        if (onOpenLuckyWheel) {
          onOpenLuckyWheel();
        } else {
          onNavigate("home");
        }
      },
    });
  }

  // 4. Can Durumu Bildirimi
  if (lives < 5) {
    notifications.push({
      id: "lives_status",
      icon: ICONS.heart,
      kicker: "ENERJİ DURUMU",
      title: `Can Seviyesi: ${lives}/5`,
      description: "Canların her 30 dakikada bir otomatik yenilenir.",
      badge: "DOLUYOR",
      accentColor: "#EF4444",
      actionLabel: "Can Doldur",
      onPressAction: () => {
        onClose();
        if (onOpenLivesModal) {
          onOpenLivesModal();
        }
      },
    });
  } else {
    notifications.push({
      id: "lives_full",
      icon: ICONS.heart,
      kicker: "ENERJİ TAM",
      title: "Tüm Canların Dolu (5/5)",
      description: "Arenaya çıkmaya hazırsın. Yeni bir düello maçı başlatabilirsin.",
      accentColor: "#10B981",
      actionLabel: "Hemen Oyna",
      onPressAction: () => {
        onClose();
        onNavigate("online");
      },
    });
  }

  // 5. Dereceli Sezon Bilgisi
  notifications.push({
    id: "ranked_season",
    icon: ICONS.trophy,
    kicker: "SEZON LİGLERİ",
    title: "1. Sezon Dereceli Mücadelesi",
    description: "Lig kademelerinde yükselerek Demir'den Hakim ligine terfi et.",
    accentColor: "#0284C7",
    actionLabel: "Lider Tablosu",
    onPressAction: () => {
      onClose();
      onNavigate("season");
    },
  });

  const priorityCount = notifications.filter((n) => n.isPriority).length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={["#aef5e0", "#50E3C2", "#38BDF8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topGlowBar}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <Text style={styles.headerEmojiIcon}>🔔</Text>
              </View>
              <View>
                <Text style={styles.headerKicker}>BİLDİRİM MERKEZİ</Text>
                <Text style={styles.headerTitle}>Duyurular ve Hatırlatmalar</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                onClose();
              }}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Quick Summary Pill Bar */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>BEKLEYEN EYLEMLER</Text>
              <Text style={[styles.summaryValue, { color: priorityCount > 0 ? "#E11D48" : "#10B981" }]}>
                {priorityCount > 0 ? `${priorityCount} Eylem Bekliyor` : "Hepsi Tamam ✓"}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>MEVCUT CAN</Text>
              <Text style={styles.summaryValue}>{lives}/5 💚</Text>
            </View>
          </View>

          {/* List of Notifications */}
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.notificationItem,
                  { borderLeftColor: item.accentColor, borderLeftWidth: 4 },
                  item.isPriority && styles.priorityItem,
                ]}
              >
                <View style={styles.itemHeaderRow}>
                  <View style={styles.itemLeftGroup}>
                    <View style={[styles.itemIconBadge, { backgroundColor: `${item.accentColor}14` }]}>
                      {item.isEmoji ? (
                        <Text style={styles.itemEmoji}>{item.icon}</Text>
                      ) : (
                        <Image source={item.icon} style={styles.itemIconImg} resizeMode="contain" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemKicker, { color: item.accentColor }]}>{item.kicker}</Text>
                      <Text numberOfLines={1} style={styles.itemTitle}>
                        {item.title}
                      </Text>
                    </View>
                  </View>

                  {item.badge && (
                    <View
                      style={[
                        styles.badgePill,
                        { backgroundColor: `${item.accentColor}18`, borderColor: `${item.accentColor}44` },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: item.accentColor }]}>
                        {item.badge}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.itemDescription}>{item.description}</Text>

                {item.actionLabel && (
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => {
                        triggerHapticSelection();
                        item.onPressAction?.();
                      }}
                      style={({ pressed }) => [
                        styles.actionButton,
                        { borderColor: item.accentColor, backgroundColor: `${item.accentColor}12` },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.actionButtonText, { color: item.accentColor }]}>
                        {item.actionLabel} ➔
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                onClose();
              }}
              style={({ pressed }) => [styles.bottomBtn, pressed && styles.pressed]}
            >
              <Text style={styles.bottomBtnText}>KAPAT</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    height: 520,
    maxHeight: "84%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
    display: "flex",
    flexDirection: "column",
  },
  topGlowBar: {
    height: 3,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  headerEmojiIcon: {
    fontSize: 18,
  },
  headerKicker: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#2563EB",
    marginBottom: 1,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
    color: "#0F172A",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "800",
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E2E8F0",
  },
  listScroll: {
    flex: 1,
    paddingHorizontal: 14,
  },
  listContent: {
    paddingVertical: 8,
    gap: 8,
  },
  notificationItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  priorityItem: {
    backgroundColor: "#FAFAFA",
  },
  itemHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  itemIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIconImg: {
    width: 20,
    height: 20,
  },
  itemEmoji: {
    fontSize: 16,
  },
  itemKicker: {
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  itemTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.1,
    marginTop: 1,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  itemDescription: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 6,
    paddingLeft: 40,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 7,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  bottomBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  bottomBtn: {
    width: "100%",
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBtnText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
