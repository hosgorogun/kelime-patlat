import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Share,
} from "react-native";
import { haptics } from "@/lib/haptics";
import {
  DailyChallenge,
  PlayerProgress,
  THEME_PACKS,
  ThemePackId,
} from "@/shared/progression";
import { WeekendHuntCard } from "./weekend-hunt-card";
import type { WeekendHuntTierReward } from "@/shared/weekend-hunt";

interface DailyLobbyScreenProps {
  daily: DailyChallenge;
  progress: PlayerProgress;
  setProgress?: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  onBack: () => void;
  onOpenInfo: () => void;
  onSelectTheme: (themeId: ThemePackId) => void;
  onStartDaily: () => void;
  onLockedNotice: () => void;
  onBuyShield?: () => void;
  onRewardClaimed?: (reward: WeekendHuntTierReward) => void;
}

export const DailyLobbyScreen: React.FC<DailyLobbyScreenProps> = ({
  daily,
  progress,
  setProgress,
  onBack,
  onOpenInfo,
  onSelectTheme,
  onStartDaily,
  onLockedNotice,
  onBuyShield,
  onRewardClaimed,
}) => {
  const dailyDone = progress.dailyCompletedId === daily.id;
  const activePack = THEME_PACKS.find((p) => p.id === progress.selectedTheme);
  const streakCount = progress.streak || 0;
  const shieldsCount = progress.streakShields || 0;

  const handleShareResult = async () => {
    try {
      haptics.success();
      const todayStr = daily.id || new Date().toISOString().slice(0, 10);
      const emojiGrid = "🟩🟩🟩🟩\n🟩🟩🟩🟩🟩\n🟩🟩🟩🟩🟩🟩";
      const message =
        `💥 Kelime Patlat · Günün Rotası\n` +
        `📅 ${todayStr} | 🔥 ${streakCount} Günlük Seri!\n\n` +
        `${emojiGrid}\n\n` +
        `Sen de kelime dehanı sına 👉 https://kelimepatlat.com`;

      await Share.share({
        message,
        title: "Kelime Patlat Günün Rotası",
      });
    } catch {
      // ignore
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Navigation Header */}
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.subHeaderKicker}>ETKİNLİK MERKEZİ</Text>
          <Text style={styles.subHeaderTitle}>GÜNLÜK ROTA & ETKİNLİKLER</Text>
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

      {/* Daily Streak & Shield Status Deck */}
      <View style={styles.streakShieldDeck}>
        {/* Streak Pillar */}
        <View style={styles.streakCol}>
          <View style={styles.streakIconRow}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakNumber}>{streakCount}</Text>
          </View>
          <Text style={styles.streakLabel}>GÜNLÜK SERİ</Text>
          <Text style={[styles.streakSub, dailyDone && { color: "#10B981" }]}>
            {dailyDone ? "Bugün korundu ✓" : "Bugünkü rota bekliyor"}
          </Text>
        </View>

        <View style={styles.deckDivider} />

        {/* Shield Pillar */}
        <View style={styles.shieldCol}>
          <View style={styles.shieldIconRow}>
            <Text style={styles.shieldEmoji}>🛡️</Text>
            <Text style={styles.shieldNumber}>{shieldsCount}</Text>
          </View>
          <Text style={styles.shieldLabel}>SERİ KALKANI</Text>
          {shieldsCount > 0 ? (
            <Text style={styles.shieldActiveSub}>1 gün koruma aktif</Text>
          ) : (
            <Pressable
              onPress={onBuyShield}
              style={({ pressed }) => [
                styles.buyShieldBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.buyShieldBtnText}>+ Kalkan Al (120 🪙)</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Completed Banner & Wordle Share Card */}
      {dailyDone && (
        <View style={styles.dailyDoneCard}>
          <View style={styles.dailyDoneHead}>
            <Text style={styles.dailyDoneIcon}>🌟</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dailyDoneTitle}>GÜNÜN ROTASINI TAMAMLADIN!</Text>
              <Text style={styles.dailyDoneSub}>
                Tebrikler! Bugünün ödülü hanene eklendi. Yarının rotası gece 00:00'da açılacak.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleShareResult}
            style={({ pressed }) => [
              styles.shareCardBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.shareCardBtnIcon}>📤</Text>
            <Text style={styles.shareCardBtnText}>GÜNÜN SKORUNU PAYLAŞ</Text>
          </Pressable>
        </View>
      )}

      {/* Theme Packs Selection Section */}
      <Text style={styles.modeIntro}>
        {dailyDone
          ? "Yarın oynayacağın tema paketini şimdiden seçebilirsin:"
          : "Bugünkü günlük rota için oynamak istediğin kelime paketini seç. Günlük sadece 1 kez oynamaya hakkın var!"}
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
                dailyDone && { opacity: 0.65 },
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

      {/* Weekend Themed Word Hunt Widget */}
      {setProgress && (
        <WeekendHuntCard
          progress={progress}
          setProgress={setProgress}
          onRewardClaimed={onRewardClaimed}
        />
      )}
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
    marginBottom: 12,
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
    fontSize: 18,
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

  /* Streak and Shield Deck */
  streakShieldDeck: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    alignItems: "center",
  },
  streakCol: {
    flex: 1,
    alignItems: "center",
  },
  streakIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streakEmoji: {
    fontSize: 22,
  },
  streakNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#EA580C",
  },
  streakLabel: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#64748B",
    marginTop: 2,
    letterSpacing: 0.4,
  },
  streakSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    marginTop: 1,
  },
  deckDivider: {
    width: 1,
    height: 44,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  shieldCol: {
    flex: 1,
    alignItems: "center",
  },
  shieldIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  shieldEmoji: {
    fontSize: 20,
  },
  shieldNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#3B82F6",
  },
  shieldLabel: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#64748B",
    marginTop: 2,
    letterSpacing: 0.4,
  },
  shieldActiveSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
    marginTop: 1,
  },
  buyShieldBtn: {
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3B82F6",
    marginTop: 3,
  },
  buyShieldBtnText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#2563EB",
  },

  /* Daily Done & Share Card */
  dailyDoneCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#10B981",
    padding: 14,
    marginBottom: 14,
  },
  dailyDoneHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  dailyDoneIcon: {
    fontSize: 26,
  },
  dailyDoneTitle: {
    color: "#065F46",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  dailyDoneSub: {
    color: "#047857",
    fontSize: 10.5,
    marginTop: 2,
    lineHeight: 15,
  },
  shareCardBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  shareCardBtnIcon: {
    fontSize: 15,
  },
  shareCardBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  modeIntro: {
    color: "#293541",
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
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
    marginBottom: 8,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});
