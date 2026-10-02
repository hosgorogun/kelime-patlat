import React from "react";
import { View, Text, Pressable } from "react-native";
import { styles } from "./pvp.styles";

export type PvpResultPanelProps = {
  isFinished: boolean;
  isDraw: boolean;
  iWon: boolean;
  activeVictoryEffect: string;
  rematchPending: boolean;
  notice: string;
  onShowResultsModal: () => void;
  onRequestRematch: () => void;
  onLeaveRoom: () => void;
};

export const PvpResultPanel = React.memo(({
  isFinished,
  isDraw,
  iWon,
  activeVictoryEffect,
  rematchPending,
  notice,
  onShowResultsModal,
  onRequestRematch,
  onLeaveRoom,
}: PvpResultPanelProps) => {
  if (!isFinished) {
    return <Text style={styles.notice}>{notice}</Text>;
  }

  return (
    <View style={styles.resultPanel}>
      <Text style={styles.resultTitle}>
        {isDraw
          ? "BERABERE BİTTİ!"
          : iWon
          ? `TUR SENİN! ${activeVictoryEffect}`
          : "TUR RAKİBİNİN"}
      </Text>
      <Text style={styles.resultCopy}>
        {isDraw
          ? "İki taraf da eşit puan topladı! Rövanşla kazananı belirle."
          : iWon
          ? "En yüksek puanı sen topladın."
          : "Rövanşta daha fazla kelime bul."}
      </Text>
      <Pressable
        onPress={onShowResultsModal}
        style={({ pressed }) => [styles.viewResultsButton, pressed && styles.pressed]}
      >
        <Text style={styles.viewResultsButtonText}>📊 SONUÇ VE DETAY KARTINI GÖR</Text>
      </Pressable>
      <Pressable
        onPress={onRequestRematch}
        style={({ pressed }) => [styles.primaryButton, styles.rematchButton, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>
          {rematchPending ? "RAKİP BEKLENİYOR" : "↻ RÖVANŞ İSTE"}
        </Text>
        <Text style={styles.primaryButtonArrow}>↻</Text>
      </Pressable>
      <Pressable
        onPress={onLeaveRoom}
        style={({ pressed }) => [styles.returnHomeButton, pressed && styles.pressed]}
      >
        <Text style={styles.returnHomeButtonText}>🏠 ANA MENÜYE DÖN</Text>
      </Pressable>
    </View>
  );
});

PvpResultPanel.displayName = "PvpResultPanel";
