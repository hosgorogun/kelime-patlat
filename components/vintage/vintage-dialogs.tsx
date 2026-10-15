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
  earnedStars?: number;
  elapsedSeconds?: number;
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
  earnedStars = 3,
  elapsedSeconds = 0,
  isInfiniteLives,
  lives,
  onOpenLivesModal,
  onNextLevel,
  onReturnToMap,
  onInspectBoard,
}: VintageVictoryModalProps) => {
  if (!visible) return null;

  const min = Math.floor(elapsedSeconds / 60);
  const sec = elapsedSeconds % 60;
  const timeFormatted = `${min} dk ${sec} sn`;

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

          {/* Kazanılan Yıldızlar & Süre Rozeti */}
          <View style={styles.winStarsRow}>
            <Text style={styles.winStarsText}>{"⭐".repeat(earnedStars)}</Text>
            <Text style={styles.winStarsSub}>
              {earnedStars === 3 ? "🏆 Kusursuz Hız! (3 Yıldız)" : earnedStars === 2 ? "⚡ Harika Performans! (2 Yıldız)" : "👍 Başarılı Çözüm! (1 Yıldız)"}
            </Text>
          </View>

          <View style={styles.winTimeContainer}>
            <Text style={styles.winTimeLabel}>Çözüm Süresi: </Text>
            <Text style={styles.winTimeValue}>{timeFormatted}</Text>
          </View>

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

export type VintageLevelPreviewModalProps = {
  visible: boolean;
  levelIndex: number | null;
  bestStars?: number;
  onDismiss: () => void;
  onStartLevel: (level: number) => void;
};

export const VintageLevelPreviewModal = React.memo(({
  visible,
  levelIndex,
  bestStars = 0,
  onDismiss,
  onStartLevel,
}: VintageLevelPreviewModalProps) => {
  if (!visible || !levelIndex) return null;

  const difficultyText =
    levelIndex <= 5
      ? "KOLAY (1.5 dk Hedef)"
      : levelIndex <= 10
      ? "ORTA (2 dk Hedef)"
      : levelIndex <= 15
      ? "ZOR (2.6 dk Hedef)"
      : "USTA (3.5 dk Hedef)";

  const starsBadge = bestStars > 0 ? "⭐".repeat(bestStars) : "Henüz Yıldız Yok";

  return (
    <ModernAlertModal
      alert={{
        icon: "📰",
        kicker: `NOSTALJİ GAZETE • SEVİYE ${levelIndex}`,
        title: `Bölüm ${levelIndex}`,
        message: `Zorluk: ${difficultyText}\nEn İyi Derece: ${starsBadge}\n\n10x10 Gazete bulmacasını çözmeye başlamak istiyor musunuz?`,
        accentColor: "#0F766E",
        primaryButton: {
          text: "BAŞLA ➔",
          color: "#0F766E",
          onPress: () => {
            onDismiss();
            onStartLevel(levelIndex);
          },
        },
        secondaryButton: {
          text: "KAPAT",
          onPress: onDismiss,
        },
      }}
      onDismiss={onDismiss}
    />
  );
});

VintageLevelPreviewModal.displayName = "VintageLevelPreviewModal";

