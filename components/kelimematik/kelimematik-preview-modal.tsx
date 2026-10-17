import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { GameButton } from "@/components/game/game-ui";
import type { PlayerProgress } from "@/shared/progression";

interface KelimematikPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onStart?: () => void;
  progress?: PlayerProgress;
}

export function KelimematikPreviewModal({
  visible,
  onClose,
}: KelimematikPreviewModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header Icon Ring */}
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🔒</Text>
          </View>

          {/* Kicker & Title */}
          <View style={styles.kickerBadge}>
            <Text style={styles.kickerText}>✦ ÇOK YAKINDA ✦</Text>
          </View>
          <Text style={styles.title}>KELİMEMATİK</Text>
          <Text style={styles.subtitle}>
            Tetris mekaniğiyle harfleri birleştirip hayatta kalacağın yeni oyun modu çok yakında sizlerle!
          </Text>

          {/* Under Development Teaser Banner */}
          <View style={styles.teaserNotice}>
            <View style={styles.teaserIconWrap}>
              <Text style={styles.teaserIcon}>🚧</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.teaserNoticeTitle}>GELİŞTİRME AŞAMASINDA</Text>
              <Text style={styles.teaserNoticeSub}>
                Kelimematik modu şu anda son test ve dengeleme aşamasındadır. Çok yakında yeni güncellemeyle tüm oyunculara açılacaktır!
              </Text>
            </View>
          </View>

          {/* Features Sneak Peek Card */}
          <View style={styles.featuresCard}>
            <Text style={styles.featuresHeader}>Neler Geliyor?</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🧱</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureBold}>5×8 Tetris Izgarası:</Text> Düşen harfler tavana ulaşmadan sözcükleri patlat.
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🌪️</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureBold}>Süpürge:</Text> En yüksek sütunu tek hamlede anında temizle.
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureBold}>Zincirleme Kombo:</Text> Düşen harfler yeni kelime oluşturursa ekstra puan patlaması!
                </Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.buttonGroup}>
            <GameButton
              label="TAMAM, ANLADIM"
              variant="emerald"
              size="lg"
              onPress={() => {
                triggerHapticSelection();
                onClose();
              }}
              style={{ width: "100%" }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  icon: {
    fontSize: 26,
  },
  kickerBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  kickerText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#B45309",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 17,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  teaserNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    width: "100%",
    marginTop: 14,
    marginBottom: 12,
  },
  teaserIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  teaserIcon: {
    fontSize: 18,
  },
  teaserNoticeTitle: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  teaserNoticeSub: {
    color: "#78350F",
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 2,
  },
  featuresCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 16,
  },
  featuresHeader: {
    color: "#0F172A",
    fontSize: 11.5,
    fontWeight: "900",
    marginBottom: 8,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  featureIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontSize: 11,
    color: "#475569",
    lineHeight: 15,
  },
  featureBold: {
    fontWeight: "800",
    color: "#0F172A",
  },
  buttonGroup: {
    width: "100%",
    alignItems: "center",
  },
});
