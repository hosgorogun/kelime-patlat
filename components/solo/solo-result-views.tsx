import React from "react";
import { View, Text, Pressable } from "react-native";
import { VictoryBanner } from "../game/victory-effect-overlay";
import { CoinCascadeOverlay } from "../game/coin-cascade";
import { MAX_SOLO_LEVEL, APP_WORD_PALETTE } from "@/shared/solo";
import { gameSfx } from "@/lib/game-sfx";
import { triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { styles } from "./solo-challenge.styles";

const DIFFICULTY_LABEL = { easy: "KOLAY", medium: "ORTA", hard: "ZOR" } as const;

export interface SoloWonViewProps {
  daily?: boolean;
  level: number;
  foundCount: number;
  seconds: number;
  boardSkinColor?: string;
  accentColor: string;
  handleShareDaily?: () => void;
  chestState: "closed" | "decrypting" | "opened";
  decryptText: string;
  decryptProgress: number;
  doubleXpEarned: boolean;
  startDecryption: () => void;
  safeWatchAd: (cb: () => void) => void;
  setDoubleXpEarned: (val: boolean) => void;
  onBonusReward?: (xp: number, radar: number) => void;
  onAdvanceLevel?: () => void;
  onNext: () => void;
  onExit: () => void;
}

export function SoloWonView({
  daily,
  level,
  foundCount,
  seconds,
  boardSkinColor,
  accentColor,
  handleShareDaily,
  chestState,
  decryptText,
  decryptProgress,
  doubleXpEarned,
  startDecryption,
  safeWatchAd,
  setDoubleXpEarned,
  onBonusReward,
  onAdvanceLevel,
  onNext,
  onExit,
}: SoloWonViewProps) {
  return (
    <View style={[styles.result, boardSkinColor && { borderColor: `${boardSkinColor}88`, shadowColor: boardSkinColor }]}>
      <VictoryBanner
        title="Seviye senin!"
        subtitle={`${foundCount} kelime buldun · ${seconds} saniye artırdın`}
      />

      <View style={{ width: "100%", gap: 8, marginTop: 12 }}>
        {level < MAX_SOLO_LEVEL && (
          <Pressable
            onPress={() => {
              triggerHapticSelection();
              if (onAdvanceLevel) onAdvanceLevel();
              else onNext();
            }}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: accentColor, marginTop: 0 },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.actionText}>▶️ SONRAKİ BÖLÜM (BÖLÜM {level + 1})</Text>
            <Text style={styles.actionArrow}>→</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => {
            triggerHapticSelection();
            if (daily) onExit();
            else onNext();
          }}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              borderWidth: 1,
              borderColor: "#DCE1D7",
              marginTop: 0,
            },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={[styles.actionText, { color: "#293541" }]}>
            {daily ? "🏠 KOMUTA MERKEZİNE DÖN" : "🗺️ SEVİYE HARİTASINA DÖN"}
          </Text>
          <Text style={[styles.actionArrow, { color: "#293541" }]}>‹</Text>
        </Pressable>
      </View>
    </View>
  );
}

export interface SoloLostViewProps {
  words: string[];
  routes: Record<string, number[]>;
  wordDifficulties: Record<string, "easy" | "medium" | "hard">;
  inspectWord: (word: string, path: number[] | null, border: string) => void;
  revived: boolean;
  remainingRevives?: number;
  onReviveWithAd: () => void;
  daily?: boolean;
  accentColor: string;
  onRetry: () => void;
  onExit: () => void;
}

export function SoloLostView({
  words,
  routes,
  wordDifficulties,
  inspectWord,
  revived,
  remainingRevives = 3,
  onReviveWithAd,
  daily,
  accentColor,
  onRetry,
  onExit,
}: SoloLostViewProps) {
  return (
    <View style={styles.result}>
      <Text style={styles.resultTitle}>SÜRE DOLDU</Text>
      <Text style={styles.resultCopy}>Her renk ayrı bir kelimenin yolunu gösterir.</Text>
      <View style={styles.solutionLegend}>
        {words.map((word, index) => {
          const palette = APP_WORD_PALETTE[index % APP_WORD_PALETTE.length]!;
          const path = routes[word];
          return (
            <Pressable
              key={word}
              onPress={() => {
                inspectWord(word, path || null, palette.border);
              }}
              style={[
                styles.solutionTag,
                {
                  backgroundColor: palette.tagBg,
                  borderColor: palette.tagBorder,
                  borderWidth: 1.5,
                },
              ]}
            >
              <Text style={[styles.solutionTagText, { color: palette.tagText }]}>
                {word} · {DIFFICULTY_LABEL[wordDifficulties[word] ?? "medium"]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!revived && remainingRevives > 0 && (
        <Pressable
          onPress={onReviveWithAd}
          style={[styles.action, { backgroundColor: "#aef5e0", marginTop: 12 }]}
        >
          <Text style={[styles.actionText, { color: "#293541" }]}>
            💾 SÜREYİ KURTAR (+20sn REKLAM) · KALAN: {remainingRevives}/3
          </Text>
          <Text style={[styles.actionArrow, { color: "#293541" }]}>⚡</Text>
        </Pressable>
      )}

      {!revived && remainingRevives <= 0 && (
        <View style={{ marginTop: 10, padding: 10, backgroundColor: "#F3F4F6", borderRadius: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#6B7280" }}>
            🔒 Bugünlük reklamla kurtarma hakkın tükendi (3/3).
          </Text>
        </View>
      )}

      <Pressable
        onPress={onRetry}
        style={[styles.action, { backgroundColor: accentColor, marginBottom: 8 }]}
      >
        <Text style={styles.actionText}>↺ YENİ IZGARA İLE TEKRAR DENE</Text>
        <Text style={styles.actionArrow}>↺</Text>
      </Pressable>
      <Pressable
        onPress={onExit}
        style={[
          styles.action,
          { backgroundColor: "rgba(255, 100, 124, 0.2)", borderWidth: 1, borderColor: "#DCE1D7" },
        ]}
      >
        <Text style={[styles.actionText, { color: "#293541" }]}>HARİTAYA DÖN</Text>
        <Text style={[styles.actionArrow, { color: "#293541" }]}>→</Text>
      </Pressable>
    </View>
  );
}
