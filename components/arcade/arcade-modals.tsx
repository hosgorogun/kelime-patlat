import React from "react";
import { Modal, View, Text, ScrollView, Pressable } from "react-native";
import { VictoryBanner } from "../game/victory-effect-overlay";
import { styles } from "./arcade.styles";

export interface ArcadeResultModalProps {
  visible: boolean;
  score: number;
  doubled: boolean;
  onDoubleReward: () => void;
  onRestart: () => void;
  onInspectBoard: () => void;
  onExit: () => void;
  onRequestClose: () => void;
}

export function ArcadeResultModal({
  visible,
  score,
  doubled,
  onDoubleReward,
  onRestart,
  onInspectBoard,
  onExit,
  onRequestClose,
}: ArcadeResultModalProps) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.pauseOverlay}>
        <View style={[styles.pauseCard, { maxWidth: 360, paddingVertical: 16, paddingHorizontal: 16 }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ width: "100%" }}
            contentContainerStyle={{ alignItems: "center", paddingBottom: 4 }}
            bounces={false}
          >
            {score > 0 ? (
              <VictoryBanner title="Güzel turdu!" subtitle="Topladığın puanlar ve ödüller burada." />
            ) : (
              <View style={{ alignItems: "center", marginBottom: 6 }}>
                <Text style={{ fontSize: 44, marginBottom: 4 }}>⏱️</Text>
                <Text style={styles.resultTitle}>SÜRE DOLDU!</Text>
              </View>
            )}
            <Text style={styles.resultCopy}>Arcade modunda ulaştığın nihai skor:</Text>
            <Text style={styles.finalScore}>{score}</Text>

            {/* Rewards Breakdown Strip */}
            <View style={styles.arcadeRewardsRow}>
              <View style={styles.arcadeRewardPill}>
                <Text style={styles.arcadeRewardIcon}>⚡</Text>
                <Text style={styles.arcadeRewardText}>
                  +{doubled ? (score > 0 ? Math.max(5, Math.floor(score / 10)) * 2 : 0) : score > 0 ? Math.max(5, Math.floor(score / 10)) : 0} EXP
                </Text>
              </View>
              <View style={[styles.arcadeRewardPill, { borderColor: "#DCE1D7" }]}>
                <Text style={styles.arcadeRewardIcon}>🪙</Text>
                <Text style={[styles.arcadeRewardText, { color: "#98732c" }]}>
                  +{doubled ? Math.floor(score / 40) * 2 : Math.floor(score / 40)} ÇİP
                </Text>
              </View>
            </View>

            {!doubled && score > 0 && (
              <Pressable
                onPress={onDoubleReward}
                style={[
                  styles.action,
                  { backgroundColor: "rgba(255, 208, 0, 0.2)", borderColor: "#DCE1D7", borderWidth: 1.5, marginBottom: 8 },
                ]}
              >
                <Text style={[styles.actionText, { color: "#987c00" }]}>
                  🎁 REKLAM İZLE: KAZANILAN ÖDÜLLERİ 2X YAP 🔥
                </Text>
                <Text style={[styles.actionArrow, { color: "#987c00" }]}>⚡</Text>
              </Pressable>
            )}

            <Pressable
              onPress={onRestart}
              style={[styles.action, { backgroundColor: "#aef5e0", marginBottom: 8 }]}
            >
              <Text style={[styles.actionText, { color: "#293541" }]}>↺ YENİDEN DENE (REKOR KIR)</Text>
              <Text style={[styles.actionArrow, { color: "#293541" }]}>⚡</Text>
            </Pressable>

            <Pressable
              onPress={onInspectBoard}
              style={[
                styles.action,
                { backgroundColor: "#EDF4FC", borderWidth: 1, borderColor: "#DCE1D7", marginBottom: 8 },
              ]}
            >
              <Text style={[styles.actionText, { color: "#293541" }]}>🔍 TAHTAYI & KELİMELERİ İNCELE</Text>
              <Text style={[styles.actionArrow, { color: "#293541", fontSize: 16 }]}>↓</Text>
            </Pressable>

            <Pressable
              onPress={onExit}
              style={[
                styles.action,
                { backgroundColor: "rgba(255, 100, 124, 0.2)", borderWidth: 1, borderColor: "#DCE1D7" },
              ]}
            >
              <Text style={[styles.actionText, { color: "#293541" }]}>KOMUTA MERKEZİNE DÖN</Text>
              <Text style={[styles.actionArrow, { color: "#293541" }]}>→</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export interface ArcadePauseModalProps {
  visible: boolean;
  seconds: number;
  soundOn: boolean;
  onResume: () => void;
  onToggleSound: () => void;
  onExit: () => void;
}

export function ArcadePauseModal({
  visible,
  seconds,
  soundOn,
  onResume,
  onToggleSound,
  onExit,
}: ArcadePauseModalProps) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onResume}>
      <View style={styles.pauseOverlay}>
        <View style={styles.pauseCard}>
          <Text style={{ fontSize: 44, marginBottom: 6 }}>⏸️</Text>
          <Text style={styles.pauseTitle}>ARCADE DURAKLATILDI</Text>
          <Text style={styles.pauseSub}>
            Süren donduruldu. Skoru ve rekor serisini kaybetmeden devam edebilirsin!
          </Text>
          <Pressable onPress={onResume} style={styles.resumeBtn}>
            <Text style={styles.resumeBtnText}>▶️ DEVAM ET ({seconds}s)</Text>
          </Pressable>
          <Pressable onPress={onToggleSound} style={styles.pauseSoundBtn}>
            <Text style={styles.pauseSoundBtnText}>
              {soundOn ? "🔊 OYUN SESİ: AÇIK" : "🔇 OYUN SESİ: KAPALI"}
            </Text>
          </Pressable>
          <Pressable onPress={onExit} style={styles.pauseExitBtn}>
            <Text style={styles.pauseExitBtnText}>‹ MODDAN AYRIL</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
