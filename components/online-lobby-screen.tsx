import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { haptics } from "../lib/haptics";
import { BoardSize } from "../shared/game";

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
}

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
}) => {
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
        İsmini ve tahta boyutunu seç. Canlı dereceli arenada rakiplerinle hemen eşleş ve lig puanı kazan.
      </Text>

      <View style={styles.nameCard}>
        <Text style={styles.inputLabel}>OYUNCU ADIN</Text>
        <TextInput
          value={playerName}
          onChangeText={onPlayerNameChange}
          maxLength={16}
          autoCapitalize="characters"
          style={styles.nameInput}
          placeholder="OYUNCU"
          placeholderTextColor="#293541"
        />
      </View>

      <Text style={styles.sectionLabel}>TAHTA BOYUTU SEÇİN</Text>
      <View style={styles.sizeRow}>
        {([4, 6, 8, 10] as BoardSize[]).map((size) => {
          const reqLevel = size === 6 ? 5 : size === 8 ? 8 : size === 10 ? 10 : 0;
          const isLocked = size > 4 && currentLevel < reqLevel;
          const isSelected = selectedSize === size;

          return (
            <Pressable
              key={size}
              onPress={() => {
                if (isLocked) {
                  onLockedSize(size, reqLevel);
                  haptics.error();
                } else {
                  haptics.light();
                  onSelectSize(size);
                }
              }}
              style={({ pressed }) => [
                styles.sizeCard,
                isSelected && styles.sizeCardSelected,
                isLocked && { opacity: 0.5 },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.sizeValue, isSelected && styles.sizeValueSelected]}>
                {isLocked ? "🔒" : `${size}×${size}`}
              </Text>
              <Text style={styles.sizeCaption}>
                {size === 4
                  ? "Nabız (Hızlı)"
                  : size === 6
                  ? "Akış (Orta)"
                  : size === 8
                  ? "Derinlik (Zor)"
                  : "Zirve (Usta)"}
              </Text>
              <Text style={styles.sizeDetail}>
                {size === 4
                  ? "3 rota · 55 sn"
                  : size === 6
                  ? "6 rota · 75 sn"
                  : size === 8
                  ? "8 rota · 95 sn"
                  : "12 rota · 125 sn"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => onStartMatchmaking(selectedSize)}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>⚔️ CANLI EŞLEŞMEYE GİR</Text>
        <Text style={styles.primaryButtonArrow}>→</Text>
      </Pressable>

      <Pressable
        onPress={() => onPromptBotDuel(selectedSize)}
        style={({ pressed }) => [
          styles.botButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.botButtonText}>🤖 SİBER BOT İLE ALIŞTIRMA YAP</Text>
        <Text style={styles.botButtonArrow}>→</Text>
      </Pressable>

      {Boolean(notice) && <Text style={styles.notice}>{notice}</Text>}
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
    marginTop: 14,
    marginBottom: 14,
  },
  nameCard: {
    backgroundColor: "#F0F5ED",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    padding: 14,
    borderRadius: 20,
    marginBottom: 16,
  },
  inputLabel: {
    color: "#293541",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  nameInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#293541",
    fontSize: 15,
    fontWeight: "800",
  },
  sectionLabel: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sizeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  sizeCard: {
    flex: 1,
    backgroundColor: "#F0F5ED",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  sizeCardSelected: {
    borderColor: "#F0C855",
    borderWidth: 2,
    backgroundColor: "#FFF9E6",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sizeValue: {
    color: "#293541",
    fontSize: 18,
    fontWeight: "900",
  },
  sizeValueSelected: {
    color: "#293541",
  },
  sizeCaption: {
    color: "#293541",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
  sizeDetail: {
    color: "#718096",
    fontSize: 8,
    marginTop: 2,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#aef5e0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
  botButton: {
    marginTop: 10,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  botButtonText: {
    color: "#2a8fbc",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  botButtonArrow: {
    color: "#2a8fbc",
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
