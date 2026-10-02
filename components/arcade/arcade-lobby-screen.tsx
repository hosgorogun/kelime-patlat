import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.subHeaderKicker}>ARCADE MODU</Text>
          <Text style={styles.subHeaderTitle}>ZAMANA KARŞI HÜCUM</Text>
        </View>
        <Pressable
          onPress={onOpenInfo}
          style={({ pressed }) => [
            styles.infoButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.infoIcon}>ℹ️</Text>
        </Pressable>
      </View>

      <View style={styles.arcadeHeroCard}>
        <View style={styles.arcadeHeroTop}>
          <View style={styles.arcadeIconCircle}>
            <Text style={{ fontSize: 32 }}>⚡</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.arcadeHeroKicker}>EN YÜKSEK SKORUN</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <Text style={styles.arcadeHeroScore}>{bestScore}</Text>
              <Text style={styles.arcadeHeroUnit}>PUAN</Text>
            </View>
          </View>
        </View>
        <Text style={styles.arcadeHeroSub}>
          {bestScore >= 500
            ? "🔥 Efsanevi Seviye! Skorunu daha da yukarı taşımaya hazır mısın?"
            : bestScore >= 400
            ? "⭐ Usta Seviyesi! 500 puana ulaşıp Matris Efsanesi unvanını kap!"
            : "⏱️ Hızlı olan kazanır! Kelimeleri buldukça süren uzar, puanın katlanır."}
        </Text>
      </View>

      <View style={styles.arcadeInfoSection}>
        <Text style={styles.sectionLabel}>YARIŞMA KURALLARI VE DİNAMİKLER</Text>
        <View style={styles.arcadeRuleTile}>
          <Text style={styles.arcadeRuleIcon}>⏱️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.arcadeRuleTitle}>45 Saniyelik Hızlı Başlangıç</Text>
            <Text style={styles.arcadeRuleDesc}>
              Zaman durmaksızın akar. Harfleri yatay ve dikey bağlayarak geçerli Türkçe kelimeler oluştur.
            </Text>
          </View>
        </View>
        <View style={styles.arcadeRuleTile}>
          <Text style={styles.arcadeRuleIcon}>⏳</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.arcadeRuleTitle}>Zaman & Ateşli Kombo</Text>
            <Text style={styles.arcadeRuleDesc}>
              Bulduğun her kelime harf sayısı kadar (+4s, +5s...), 5x kombo Fever Modu (+4s) ve tahta temizliği dev bonuslar kazandırır.
            </Text>
          </View>
        </View>
        <View style={styles.arcadeRuleTile}>
          <Text style={styles.arcadeRuleIcon}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.arcadeRuleTitle}>Büyüyen Matris Seviyeleri</Text>
            <Text style={styles.arcadeRuleDesc}>
              4x4 tahtalarla başla, 1.000 puanda 6x6 tahtaya yüksel ve en yüksek skoru elde et!
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => {
          haptics.light();
          gameSfx.tap();
          onStart();
        }}
        style={({ pressed }) => [styles.arcadeStartButton, pressed && styles.pressed]}
      >
        <Text style={styles.arcadeStartButtonText}>⚡ ARCADE YARIŞINI BAŞLAT</Text>
        <Text style={styles.arcadeStartButtonIcon}>→</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    justifyContent: "center",
    alignItems: "center",
  },
  backText: {
    color: "#293541",
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 28,
  },
  headerTitles: {
    flex: 1,
  },
  subHeaderKicker: {
    color: "#293541",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subHeaderTitle: {
    color: "#293541",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 208, 0, 0.12)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    justifyContent: "center",
    alignItems: "center",
  },
  infoIcon: {
    fontSize: 16,
    color: "#987c00",
    fontWeight: "900",
  },
  arcadeHeroCard: {
    backgroundColor: "#F0F5ED",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    padding: 20,
    marginTop: 14,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  arcadeHeroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  arcadeIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255, 208, 0, 0.15)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    justifyContent: "center",
    alignItems: "center",
  },
  arcadeHeroKicker: {
    color: "#293541",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  arcadeHeroScore: {
    color: "#293541",
    fontSize: 32,
    fontWeight: "900",
  },
  arcadeHeroUnit: {
    color: "#987c00",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  arcadeHeroSub: {
    color: "#718096",
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  arcadeInfoSection: {
    marginTop: 20,
    gap: 10,
  },
  sectionLabel: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  arcadeRuleTile: {
    backgroundColor: "#F0F5ED",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  arcadeRuleIcon: {
    fontSize: 22,
  },
  arcadeRuleTitle: {
    color: "#293541",
    fontSize: 12,
    fontWeight: "800",
  },
  arcadeRuleDesc: {
    color: "#718096",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  arcadeStartButton: {
    backgroundColor: "#ffeb94",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 20,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  arcadeStartButtonText: {
    color: "#293541",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  arcadeStartButtonIcon: {
    color: "#293541",
    fontSize: 14,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.8,
  },
});
