import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { haptics } from "@/lib/haptics";
import {
  DailyChallenge,
  PlayerProgress,
  THEME_PACKS,
  ThemePackId,
} from "@/shared/progression";

interface DailyLobbyScreenProps {
  daily: DailyChallenge;
  progress: PlayerProgress;
  onBack: () => void;
  onOpenInfo: () => void;
  onSelectTheme: (themeId: ThemePackId) => void;
  onStartDaily: () => void;
  onLockedNotice: () => void;
}

export const DailyLobbyScreen: React.FC<DailyLobbyScreenProps> = ({
  daily,
  progress,
  onBack,
  onOpenInfo,
  onSelectTheme,
  onStartDaily,
  onLockedNotice,
}) => {
  const dailyDone = progress.dailyCompletedId === daily.id;
  const activePack = THEME_PACKS.find((p) => p.id === progress.selectedTheme);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.subHeaderKicker}>ETKİNLİK MERKEZİ</Text>
          <Text style={styles.subHeaderTitle}>SABİT ROTA SEÇİMİ</Text>
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

      <Text style={styles.modeIntro}>
        Bugünkü günlük rota için oynamak istediğin kelime paketini seç. Günlük sadece 1 kez oynamaya hakkın var! Başarırsan XP ödülü senin, kaybedersen kilitlenir.
      </Text>

      <View style={styles.themesList}>
        {THEME_PACKS.map((pack) => {
          const isSelected = progress.selectedTheme === pack.id;
          return (
            <Pressable
              key={pack.id}
              onPress={() => {
                if (dailyDone) {
                  onLockedNotice();
                  return;
                }
                haptics.light();
                onSelectTheme(pack.id);
              }}
              style={({ pressed }) => [
                styles.dailyThemeCard,
                { borderColor: pack.accent },
                isSelected && {
                  backgroundColor: pack.glow,
                  borderColor: pack.accent,
                  shadowColor: pack.accent,
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 4,
                },
                dailyDone && { opacity: 0.5 },
                pressed && !dailyDone && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.packIconBox,
                  { borderColor: pack.accent },
                  isSelected && styles.packIconBoxSelected,
                ]}
              >
                <Text style={[styles.packEmoji, { color: pack.accent }]}>{pack.icon}</Text>
              </View>
              <View style={styles.packContent}>
                <View style={styles.packLabelRow}>
                  <Text style={[styles.packLabel, isSelected && { color: "#FFFFFF" }]}>{pack.label}</Text>
                  {isSelected && (
                    <View style={[styles.activeTagBadge, { borderColor: `${pack.accent}80` }]}>
                      <Text style={[styles.packActiveTag, { color: pack.accent }]}>
                        ✓ AKTİF SEÇİM
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.packTitle, isSelected && { color: "#FFFFFF" }]}>{pack.title}</Text>
                <Text style={[styles.packDesc, isSelected && { color: "rgba(255, 255, 255, 0.85)" }]}>{pack.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => {
          if (dailyDone) {
            onLockedNotice();
            return;
          }
          onStartDaily();
        }}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: activePack?.accent ?? "#aef5e0" },
          dailyDone && styles.disabledButton,
          pressed && !dailyDone && styles.pressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>
          {dailyDone ? "BUGÜNLÜK HAKKIN BİTTİ" : "BUGÜNKÜ ROTAYI BAŞLAT"}
        </Text>
        <Text style={styles.primaryButtonArrow}>→</Text>
      </Pressable>

      <Text style={styles.notice}>
        Süre sınırını yetiştiremezseniz ödül kazanamazsınız ve rota kilitlenir. Başarılar!
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 165,
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
    backgroundColor: "rgba(232, 195, 106, 0.12)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    justifyContent: "center",
    alignItems: "center",
  },
  infoIcon: {
    fontSize: 16,
    color: "#8c7540",
    fontWeight: "900",
  },
  modeIntro: {
    color: "#293541",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
    marginBottom: 14,
  },
  themesList: {
    gap: 12,
  },
  dailyThemeCard: {
    width: "100%",
    backgroundColor: "#F0F5ED",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  packIconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "rgba(35,48,59,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  packIconBoxSelected: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  packEmoji: {
    fontSize: 22,
  },
  packContent: {
    flex: 1,
  },
  packLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  packLabel: {
    color: "#293541",
    fontSize: 14,
    fontWeight: "900",
  },
  packActiveTag: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  activeTagBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  packTitle: {
    color: "#293541",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  packDesc: {
    color: "#293541",
    fontSize: 10,
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 18,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: "#293541",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  primaryButtonArrow: {
    color: "#293541",
    fontSize: 14,
    fontWeight: "900",
  },
  notice: {
    color: "#718096",
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});
