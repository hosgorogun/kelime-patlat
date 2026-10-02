import React from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { styles } from "./solo-challenge.styles";

interface SoloPauseModalProps {
  visible: boolean;
  seconds: number;
  accentColor: string;
  soundOn: boolean;
  onResume: () => void;
  onToggleSound: () => void;
  onExit: () => void;
}

export function SoloPauseModal({
  visible,
  seconds,
  accentColor,
  soundOn,
  onResume,
  onToggleSound,
  onExit,
}: SoloPauseModalProps) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onResume}>
      <View style={styles.pauseOverlay}>
        <View style={styles.pauseCard}>
          <Text style={{ fontSize: 44, marginBottom: 6 }}>⏸️</Text>
          <Text style={styles.pauseTitle}>OYUN DURAKLATILDI</Text>
          <Text style={styles.pauseSub}>
            Süren donduruldu. Rahatça mola verebilirsin, can kaybı yaşamadan devam edebilirsin!
          </Text>
          <Pressable
            onPress={onResume}
            style={[styles.resumeBtn, { backgroundColor: accentColor }]}
          >
            <Text style={styles.resumeBtnText}>▶️ DEVAM ET ({seconds}s)</Text>
          </Pressable>
          <Pressable onPress={onToggleSound} style={styles.pauseSoundBtn}>
            <Text style={styles.pauseSoundBtnText}>
              {soundOn ? "🔊 OYUN SESİ: AÇIK" : "🔇 OYUN SESİ: KAPALI"}
            </Text>
          </Pressable>
          <Pressable onPress={onExit} style={styles.pauseExitBtn}>
            <Text style={styles.pauseExitBtnText}>‹ SEVİYEDEN AYRIL</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
