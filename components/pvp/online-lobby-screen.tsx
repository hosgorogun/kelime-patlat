import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { haptics } from "@/lib/haptics";
import { BoardSize } from "@/shared/game";

interface OnlineLobbyScreenProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  selectedSize: BoardSize;
  onSelectSize: (size: BoardSize) => void;
  currentLevel: number;
  notice?: string | null;
  onBack: () => void;
  onOpenInfo: () => void;
  onStartMatchmaking: (size: BoardSize) => void;
  onPromptBotDuel: (size: BoardSize) => void;
  onLockedSize: (size: number, requiredLevel: number) => void;
  onOpenTurnMatches?: () => void;
}

const BOARD_SIZE_CONFIGS: Record<
  BoardSize,
  { name: string; tag: string; icon: string; routes: string; time: string; reqLevel: number; accent: string }
> = {
  4: { name: "Nabız", tag: "Hızlı Dövüş", icon: "⚡", routes: "3 Rota", time: "55 sn", reqLevel: 0, accent: "#10B981" },
  6: { name: "Akış", tag: "Dengeli", icon: "🌀", routes: "6 Rota", time: "75 sn", reqLevel: 5, accent: "#06B6D4" },
  8: { name: "Derinlik", tag: "Taktiksel", icon: "🎯", routes: "8 Rota", time: "95 sn", reqLevel: 8, accent: "#F59E0B" },
  10: { name: "Zirve", tag: "Usta Maraton", icon: "👑", routes: "12 Rota", time: "125 sn", reqLevel: 10, accent: "#EC4899" },
};

export const OnlineLobbyScreen: React.FC<OnlineLobbyScreenProps> = ({
  playerName,
  onPlayerNameChange,
  selectedSize,
  onSelectSize,
  currentLevel,
  notice,
  onBack,
  onOpenInfo,
  onStartMatchmaking,
  onPromptBotDuel,
  onLockedSize,
  onOpenTurnMatches,
}) => {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Sub Header */}
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.subHeaderKicker}>DERECELİ ARENA</Text>
          <Text style={styles.subHeaderTitle}>DERECELİ DÜELLO</Text>
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
        Tahta boyutunu seç. Canlı dereceli arenada rakiplerinle hemen eşleş ve lig puanı kazan.
      </Text>

      {/* Board Size Selector Title */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>TAHTA BOYUTU SEÇİN</Text>
        <Text style={styles.sectionSubLabel}>MODUNUZA UYGUN IZGARAYI SEÇİN</Text>
      </View>

      {/* 2x2 Grid Layout for Board Sizes */}
      <View style={styles.sizeGrid}>
        {([4, 6, 8, 10] as BoardSize[]).map((size) => {
          const cfg = BOARD_SIZE_CONFIGS[size];
          const isLocked = size > 4 && currentLevel < cfg.reqLevel;
          const isSelected = selectedSize === size;

          return (
            <Pressable
              key={size}
              onPress={() => {
                if (isLocked) {
                  onLockedSize(size, cfg.reqLevel);
                  haptics.error();
                } else {
                  haptics.light();
                  onSelectSize(size);
                }
              }}
              style={({ pressed }) => [
                styles.gridCard,
                { borderColor: isSelected ? cfg.accent : "#DCE1D7" },
                isSelected && {
                  backgroundColor: "#FFFFFF",
                  borderWidth: 2,
                  borderColor: cfg.accent,
                  shadowColor: cfg.accent,
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 4,
                },
                isLocked && styles.gridCardLocked,
                pressed && !isLocked && styles.pressed,
              ]}
            >
              {/* Card Header Tag / Badge */}
              <View style={styles.cardHeaderRow}>
                <Text style={{ fontSize: 16 }}>{cfg.icon}</Text>
                {isSelected ? (
                  <View style={[styles.selectedPill, { backgroundColor: cfg.accent }]}>
                    <Text style={styles.selectedPillText}>✓ SEÇİLİ</Text>
                  </View>
                ) : isLocked ? (
                  <View style={styles.lockedPill}>
                    <Text style={styles.lockedPillText}>🔒 SV. {cfg.reqLevel}</Text>
                  </View>
                ) : (
                  <Text style={[styles.cardTagText, { color: cfg.accent }]}>{cfg.tag}</Text>
                )}
              </View>

              {/* Big Size Title */}
              <View style={styles.sizeTitleRow}>
                <Text style={[styles.sizeNumber, isSelected && { color: cfg.accent }]}>
                  {size}×{size}
                </Text>
                <Text style={styles.sizeName}>{cfg.name}</Text>
              </View>

              {/* Detail Pill Footer */}
              <View style={styles.cardFooterRow}>
                <View style={styles.detailPill}>
                  <Text style={styles.detailPillText}>{cfg.routes}</Text>
                </View>
                <View style={styles.detailPill}>
                  <Text style={styles.detailPillText}>⏱ {cfg.time}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsCol}>
        <Pressable
          onPress={() => onStartMatchmaking(selectedSize)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>⚔️ CANLI EŞLEŞMEYE GİR</Text>
          <Text style={styles.primaryButtonArrow}>→</Text>
        </Pressable>

        <Pressable
          onPress={() => onPromptBotDuel(selectedSize)}
          style={({ pressed }) => [styles.botButton, pressed && styles.pressed]}
        >
          <Text style={styles.botButtonText}>🤖 BOT İLE ALIŞTIRMA YAP</Text>
          <Text style={styles.botButtonArrow}>→</Text>
        </Pressable>

        {onOpenTurnMatches && (
          <Pressable
            onPress={onOpenTurnMatches}
            style={({ pressed }) => [
              styles.botButton,
              { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.botButtonText, { color: "#92400E" }]}>
              ☕ KAHVE DÜELLOSU (24S SIRA TABANLI)
            </Text>
            <Text style={[styles.botButtonArrow, { color: "#92400E" }]}>→</Text>
          </Pressable>
        )}
      </View>

      {Boolean(notice) && <Text style={styles.notice}>{notice}</Text>}
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
    backgroundColor: "rgba(62, 232, 181, 0.12)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    justifyContent: "center",
    alignItems: "center",
  },
  infoIcon: {
    fontSize: 16,
    color: "#2a9c7a",
    fontWeight: "900",
  },
  modeIntro: {
    color: "#293541",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    marginBottom: 14,
  },
  nameCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    padding: 14,
    borderRadius: 20,
    marginBottom: 18,
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nameCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  nameCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputLabel: {
    color: "#293541",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  nameEditHint: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "900",
  },
  inputWrapper: {
    width: "100%",
  },
  nameInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionLabel: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  sectionSubLabel: {
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "800",
  },
  sizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  gridCard: {
    width: "48%",
    minHeight: 115,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    borderRadius: 18,
    padding: 12,
    justifyContent: "space-between",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  gridCardLocked: {
    backgroundColor: "#F1F5F9",
    opacity: 0.75,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  selectedPillText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  lockedPill: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockedPillText: {
    color: "#475569",
    fontSize: 8,
    fontWeight: "900",
  },
  cardTagText: {
    fontSize: 9,
    fontWeight: "900",
  },
  sizeTitleRow: {
    marginVertical: 4,
  },
  sizeNumber: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },
  sizeName: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 1,
  },
  cardFooterRow: {
    flexDirection: "row",
    gap: 4,
  },
  detailPill: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  detailPillText: {
    color: "#64748B",
    fontSize: 7.5,
    fontWeight: "800",
  },
  actionButtonsCol: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#10B981",
    height: 52,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  primaryButtonArrow: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  botButton: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    height: 48,
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  botButtonText: {
    color: "#0284C7",
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  botButtonArrow: {
    color: "#0284C7",
    fontSize: 14,
    fontWeight: "900",
  },
  notice: {
    color: "#718096",
    fontSize: 11,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
