import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gameSfx } from "@/lib/game-sfx";
import { haptics } from "@/lib/haptics";

interface ArcadeLobbyScreenProps {
  bestScore: number;
  onBack: () => void;
  onOpenInfo: () => void;
  onStart: () => void;
}

export const ArcadeLobbyScreen: React.FC<ArcadeLobbyScreenProps> = ({
  bestScore,
  onBack,
  onOpenInfo,
  onStart,
}) => {
  const getRankBadge = (score: number) => {
    if (score >= 1000) return { title: "MATRİS EFSANESİ", color: "#8B5CF6", bg: "#F3E8FF", border: "#DDD6FE" };
    if (score >= 500) return { title: "HIZ ŞAMPİYONU", color: "#DC2626", bg: "#FEE2E2", border: "#FECACA" };
    if (score >= 300) return { title: "UZMAN AVCI", color: "#D97706", bg: "#FEF3C7", border: "#FDE68A" };
    return { title: "ACEMİ ŞİMŞEK", color: "#059669", bg: "#D1FAE5", border: "#A7F3D0" };
  };

  const rank = getRankBadge(bestScore);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Üst Navigasyon Çubuğu */}
      <View style={styles.subHeader}>
        <Pressable
          onPress={() => {
            haptics.light();
            onBack();
          }}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.subHeaderKicker}>HIZ VE REFLEKS MODU</Text>
          <Text style={styles.subHeaderTitle}>ZAMANA KARŞI HÜCUM</Text>
        </View>
        <Pressable
          onPress={() => {
            haptics.light();
            onOpenInfo();
          }}
          style={({ pressed }) => [
            styles.infoButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.infoIcon}>ℹ️</Text>
        </Pressable>
      </View>

      {/* Hero Skor Kartı - Degrade Arka Plan ve Modern Tipografi */}
      <View style={styles.arcadeHeroWrapper}>
        <LinearGradient
          colors={["#FFFFFF", "#FFFBEB", "#FEF3C7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.arcadeHeroCard}
        >
          <View style={styles.arcadeHeroTop}>
            <View style={styles.arcadeIconCircle}>
              <Text style={styles.boltIcon}>⚡</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.scoreHeaderRow}>
                <Text style={styles.arcadeHeroKicker}>EN YÜKSEK SKORUN</Text>
                <View style={[styles.rankBadge, { backgroundColor: rank.bg, borderColor: rank.border }]}>
                  <Text style={[styles.rankBadgeText, { color: rank.color }]}>{rank.title}</Text>
                </View>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.arcadeHeroScore}>{bestScore}</Text>
                <Text style={styles.arcadeHeroUnit}>PUAN</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <Text style={styles.arcadeHeroSub}>
            {bestScore >= 500
              ? "🔥 Efsanevi Seviye! Skorunu daha da yukarı taşımaya hazır mısın?"
              : bestScore >= 400
              ? "⭐ Usta Seviyesi! 500 puana ulaşıp Matris Efsanesi unvanını kap!"
              : "⏱️ Hızlı olan kazanır! Kelimeleri buldukça süren uzar, puanın katlanır."}
          </Text>
        </LinearGradient>
      </View>

      {/* Kurallar ve Dinamikler */}
      <View style={styles.arcadeInfoSection}>
        <Text style={styles.sectionLabel}>YARIŞMA KURALLARI VE DİNAMİKLER</Text>

        <View style={styles.arcadeRuleTile}>
          <View style={[styles.ruleIconContainer, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
            <Text style={styles.arcadeRuleIcon}>⏱️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.arcadeRuleTitle}>45 Saniyelik Hızlı Başlangıç</Text>
            <Text style={styles.arcadeRuleDesc}>
              Zaman durmaksızın akar. Harfleri yatay ve dikey bağlayarak geçerli Türkçe kelimeler oluştur.
            </Text>
          </View>
        </View>

        <View style={styles.arcadeRuleTile}>
          <View style={[styles.ruleIconContainer, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
            <Text style={styles.arcadeRuleIcon}>🔥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.arcadeRuleTitle}>Zaman & Ateşli Kombo</Text>
            <Text style={styles.arcadeRuleDesc}>
              Bulduğun her kelime harf sayısı kadar (+4s, +5s...), 5x kombo Fever Modu (+4s) ve tahta temizliği dev bonuslar kazandırır.
            </Text>
          </View>
        </View>

        <View style={styles.arcadeRuleTile}>
          <View style={[styles.ruleIconContainer, { backgroundColor: "#FEFCE8", borderColor: "#FDE047" }]}>
            <Text style={styles.arcadeRuleIcon}>🏆</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.arcadeRuleTitle}>Büyüyen Matris Seviyeleri</Text>
            <Text style={styles.arcadeRuleDesc}>
              4x4 tahtalarla başla, 1.000 puanda 6x6 tahtaya yüksel ve en yüksek skoru elde et!
            </Text>
          </View>
        </View>
      </View>

      {/* Büyük Harekete Geçirici Başla Butonu */}
      <Pressable
        onPress={() => {
          haptics.select();
          gameSfx.tap();
          onStart();
        }}
        style={({ pressed }) => [styles.arcadeStartButton, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={["#F59E0B", "#D97706"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.arcadeStartButtonGradient}
        >
          <Text style={styles.startBolt}>⚡</Text>
          <Text style={styles.arcadeStartButtonText}>ARCADE YARIŞINI BAŞLAT</Text>
          <Text style={styles.arcadeStartButtonIcon}>➔</Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 230,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backText: {
    color: "#0F172A",
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 30,
    marginTop: -2,
  },
  headerTitles: {
    flex: 1,
  },
  subHeaderKicker: {
    color: "#D97706",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  subHeaderTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: 0.4,
  },
  infoButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoIcon: {
    fontSize: 16,
  },
  arcadeHeroWrapper: {
    marginTop: 10,
    borderRadius: 22,
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  arcadeHeroCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    padding: 18,
  },
  arcadeHeroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  arcadeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#FDE047",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  boltIcon: {
    fontSize: 30,
  },
  scoreHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arcadeHeroKicker: {
    color: "#78350F",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  rankBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 2,
  },
  arcadeHeroScore: {
    color: "#0F172A",
    fontSize: 34,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  arcadeHeroUnit: {
    color: "#D97706",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "#FDE68A",
    opacity: 0.7,
    marginTop: 14,
    marginBottom: 10,
  },
  arcadeHeroSub: {
    color: "#78350F",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  arcadeInfoSection: {
    marginTop: 20,
    gap: 10,
  },
  sectionLabel: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  arcadeRuleTile: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  ruleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  arcadeRuleIcon: {
    fontSize: 20,
  },
  arcadeRuleTitle: {
    color: "#0F172A",
    fontSize: 12.5,
    fontWeight: "800",
  },
  arcadeRuleDesc: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
    fontWeight: "600",
  },
  arcadeStartButton: {
    marginTop: 22,
    borderRadius: 18,
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  arcadeStartButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "#FBBF24",
  },
  startBolt: {
    fontSize: 18,
  },
  arcadeStartButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  arcadeStartButtonIcon: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});

