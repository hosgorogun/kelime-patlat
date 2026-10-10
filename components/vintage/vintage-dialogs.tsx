import React from "react";
import { View, Text, Pressable } from "react-native";
import {
  triggerHapticSelection,
  triggerHapticError,
  playSuccessSound,
  playErrorSound,
} from "@/shared/audio-haptics";
import { VictoryBanner, VictoryEffectOverlay } from "../game/victory-effect-overlay";
import { ModernAlertModal } from "../modals/modern-alert-modal";
import { vintageStyles as styles } from "./vintage.styles";

export type VintageVictoryModalProps = {
  visible: boolean;
  selectedVictoryEffect?: string;
  levelIndex: number;
  isInfiniteLives?: boolean;
  lives?: number;
  onOpenLivesModal?: () => void;
  onNextLevel: () => void;
  onReturnToMap: () => void;
  onInspectBoard?: () => void;
};

export const VintageVictoryModal = React.memo(({
  visible,
  selectedVictoryEffect,
  levelIndex,
  isInfiniteLives,
  lives,
  onOpenLivesModal,
  onNextLevel,
  onReturnToMap,
  onInspectBoard,
}: VintageVictoryModalProps) => {
  if (!visible) return null;

  return (
    <>
      <VictoryEffectOverlay
        effectId={selectedVictoryEffect}
        visible={visible}
        title="Hepsi yerine oturdu!"
        subtitle={`${levelIndex}. bölüm tamamlandı. Ellerine sağlık!`}
      />
      <View style={styles.winOverlay}>
        <View style={styles.winCard}>
          <VictoryBanner
            title="Bulmaca tamam!"
            subtitle={`${levelIndex}. bölümde bütün kelimeleri yerleştirdin.`}
          />
          <Text style={styles.winReward}>
            +{levelIndex <= 3 ? 30 : levelIndex <= 7 ? 50 : levelIndex <= 12 ? 75 : 100} XP KAZANILDI
          </Text>

          {levelIndex < 20 ? (
            <Pressable
              onPress={() => {
                if (!isInfiniteLives && typeof lives === "number" && lives <= 0) {
                  triggerHapticError();
                  playErrorSound();
                  onOpenLivesModal?.();
                  return;
                }
                triggerHapticSelection();
                playSuccessSound();
                onNextLevel();
              }}
              style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.nextBtnText}>SONRAKİ BÖLÜM ({levelIndex + 1}) ➔</Text>
            </Pressable>
          ) : (
            <View style={styles.completedAllBanner}>
              <Text style={styles.completedAllText}>🏆 TEBRİKLER! TÜM BÖLÜMLERİ TAMAMLADINIZ! 🏆</Text>
            </View>
          )}

          {onInspectBoard && (
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                onInspectBoard();
              }}
              style={({ pressed }) => [styles.inspectBoardBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.inspectBoardBtnText}>BULMACAYI İNCELE 🔍</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              triggerHapticSelection();
              onReturnToMap();
            }}
            style={({ pressed }) => [styles.mapReturnBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.mapReturnBtnText}>SEVİYE HARİTASI 🗞️</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
});

VintageVictoryModal.displayName = "VintageVictoryModal";

export type VintageExitModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
};

export const VintageExitModal = React.memo(({
  visible,
  onDismiss,
  onConfirm,
}: VintageExitModalProps) => {
  return (
    <ModernAlertModal
      alert={
        visible
          ? {
              icon: "🗞️",
              kicker: "NOSTALJİ GAZETE",
              title: "Bulmacadan Ayrıl",
              message:
                "Mevcut bulmacadan ayrılmak istediğinize emin misiniz? İlerlemeniz ve yerleştirilen harfler sıfırlanacaktır.",
              accentColor: "#FF647C",
              primaryButton: {
                text: "DEVAM ET",
                color: "#2a9c7a",
                onPress: onDismiss,
              },
              secondaryButton: {
                text: "AYRIL",
                onPress: () => {
                  onDismiss();
                  onConfirm();
                },
              },
            }
          : null
      }
      onDismiss={onDismiss}
    />
  );
});

VintageExitModal.displayName = "VintageExitModal";

export type VintageResetModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
};

export const VintageResetModal = React.memo(({
  visible,
  onDismiss,
  onConfirm,
}: VintageResetModalProps) => {
  return (
    <ModernAlertModal
      alert={
        visible
          ? {
              icon: "🔄",
              kicker: "BÖLÜMÜ SIFIRLA",
              title: "Bulmacayı Baştan Başlat",
              message:
                "Bu bölümü baştan başlatmak istediğinize emin misiniz? Tahtadaki tüm yerleştirilmiş harfler silinecek ve yeni bir bulmaca yüklenecektir.",
              accentColor: "#F59E0B",
              primaryButton: {
                text: "DEVAM ET",
                color: "#2a9c7a",
                onPress: onDismiss,
              },
              secondaryButton: {
                text: "SIFIRLA",
                onPress: () => {
                  onDismiss();
                  onConfirm();
                },
              },
            }
          : null
      }
      onDismiss={onDismiss}
    />
  );
});

VintageResetModal.displayName = "VintageResetModal";
