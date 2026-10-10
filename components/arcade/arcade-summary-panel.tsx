import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { VictoryBanner } from "../game/victory-effect-overlay";
import { CoinCascadeOverlay } from "../game/coin-cascade";
import { styles } from "./arcade.styles";

export type ArcadeSummaryPanelProps = {
  score: number;
  doubled: boolean;
  boardSkinColor?: string;
  watchAd?: (onReward: () => void) => void;
  onDoubleReward: () => void;
  onOpenResultModal: () => void;
  onRestart: () => void;
  onExit: () => void;
};

export const ArcadeSummaryPanel = React.memo(({
  score,
  doubled,
  boardSkinColor,
  watchAd,
  onDoubleReward,
  onOpenResultModal,
  onRestart,
  onExit,
}: ArcadeSummaryPanelProps) => {
  const handleDoublePress = () => {
    if (watchAd) {
      watchAd(onDoubleReward);
    } else {
      Alert.alert(
        "📺 Ödülü 2X Yap",
        "15 saniyelik sponsorlu reklam izleyerek bu turdaki XP ve Çip ödülünü 2 katına çıkarmak ister misin?",
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "İzle ve 2X Yap",
            onPress: onDoubleReward,
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.result, boardSkinColor ? { borderColor: `${boardSkinColor}88`, shadowColor: boardSkinColor } : null]}>
      {score > 0 ? (
        <VictoryBanner title="Güzel turdu!" subtitle="Topladığın puanlar ve ödüller burada." />
      ) : (
        <Text style={styles.resultTitle}>SÜRE DOLDU!</Text>
      )}
      <Text style={styles.resultCopy}>Arcade modunda ulaştığın nihai skor:</Text>
      <Text style={styles.finalScore}>{score}</Text>

      <CoinCascadeOverlay trigger={score > 0} count={8} icon="🪙" />
      <CoinCascadeOverlay
        trigger={score > 0}
        count={6}
        icon="⚡"
        badgeText={`+${doubled ? Math.max(5, Math.floor(score / 10)) * 2 : Math.max(5, Math.floor(score / 10))} XP`}
      />

      {/* Rewards Breakdown Strip */}
      <View style={styles.arcadeRewardsRow}>
        <View style={styles.arcadeRewardPill}>
          <Text style={styles.arcadeRewardIcon}>⚡</Text>
          <Text style={styles.arcadeRewardText}>
            +{doubled ? (score > 0 ? Math.max(5, Math.floor(score / 10)) * 2 : 0) : (score > 0 ? Math.max(5, Math.floor(score / 10)) : 0)} EXP
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
          onPress={handleDoublePress}
          style={[styles.action, { backgroundColor: "rgba(255, 208, 0, 0.2)", borderColor: "#DCE1D7", borderWidth: 1.5, marginBottom: 8 }]}
        >
          <Text style={[styles.actionText, { color: "#987c00" }]}>🎁 REKLAM İZLE: KAZANILAN ÖDÜLLERİ 2X YAP 🔥</Text>
          <Text style={[styles.actionArrow, { color: "#987c00" }]}>⚡</Text>
        </Pressable>
      )}

      <Pressable
        onPress={onOpenResultModal}
        style={[styles.action, { backgroundColor: "#EDF4FC", borderWidth: 1, borderColor: "#DCE1D7", marginBottom: 8 }]}
      >
        <Text style={[styles.actionText, { color: "#293541" }]}>📊 SKOR VE ÖDÜL KARTINI AÇ</Text>
        <Text style={[styles.actionArrow, { color: "#293541" }]}>↗</Text>
      </Pressable>

      <Pressable
        onPress={onRestart}
        style={[styles.action, { backgroundColor: "#aef5e0", marginBottom: 8 }]}
      >
        <Text style={[styles.actionText, { color: "#293541" }]}>↺ YENİDEN DENE (REKOR KIR)</Text>
        <Text style={[styles.actionArrow, { color: "#293541" }]}>⚡</Text>
      </Pressable>

      <Pressable
        onPress={onExit}
        style={[styles.action, { backgroundColor: "rgba(255, 100, 124, 0.2)", borderWidth: 1, borderColor: "#DCE1D7" }]}
      >
        <Text style={[styles.actionText, { color: "#293541" }]}>KOMUTA MERKEZİNE DÖN</Text>
        <Text style={[styles.actionArrow, { color: "#293541" }]}>→</Text>
      </Pressable>
    </View>
  );
});

ArcadeSummaryPanel.displayName = "ArcadeSummaryPanel";
