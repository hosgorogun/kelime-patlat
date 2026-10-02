import React from "react";
import { View, Text, Pressable } from "react-native";
import { VictoryBanner } from "../game/victory-effect-overlay";
import { MAX_SOLO_LEVEL, APP_WORD_PALETTE } from "@/shared/solo";
import { gameSfx } from "@/lib/game-sfx";
import { triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { styles } from "./solo-challenge.styles";

const DIFFICULTY_LABEL = { easy: "KOLAY", medium: "ORTA", hard: "ZOR" } as const;

export interface SoloWonViewProps {
  daily: boolean;
  level: number;
  foundCount: number;
  seconds: number;
  boardSkinColor?: string;
  accentColor: string;
  handleShareDaily: () => void;
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
        title={daily ? "Günün yıldızı sensin!" : "Seviye senin!"}
        subtitle={`${foundCount} kelime buldun · ${seconds} saniye artırdın`}
      />

      {daily && (
        <Pressable
          onPress={handleShareDaily}
          style={({ pressed }) => [
            {
              backgroundColor: "#E8F7EE",
              borderWidth: 1.5,
              borderColor: "#349d5a",
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 16,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 10,
              width: "100%",
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={{ color: "#167653", fontWeight: "900", fontSize: 13, letterSpacing: 0.4 }}>
            📤 GÜNÜN SKORUNU PAYLAŞ (WORDLE FORMATI)
          </Text>
        </Pressable>
      )}

      {daily && (
        <View style={[styles.chestCard, { borderColor: accentColor }]}>
          {chestState === "closed" && (
            <>
              <Text style={styles.chestIcon}>🎁</Text>
              <Text style={styles.chestTitle}>GÜNÜN ÖDÜL SANDIĞI</Text>
              <Text style={styles.chestCopy}>Günün özel hazinesi açılmaya hazır. Sandığı aç ve ödülü topla!</Text>
              <Pressable onPress={startDecryption} style={[styles.chestButton, { backgroundColor: accentColor }]}>
                <Text style={styles.chestButtonText}>SANDIĞI AÇ ➔</Text>
              </Pressable>
            </>
          )}
          {chestState === "decrypting" && (
            <>
              <Text style={styles.chestIcon}>✨</Text>
              <Text style={styles.chestTitle}>{decryptText}</Text>
              <Text style={styles.chestProgress}>
                [{"=".repeat(Math.floor(decryptProgress / 10)) + " ".repeat(10 - Math.floor(decryptProgress / 10))}] {decryptProgress}%
              </Text>
            </>
          )}
          {chestState === "opened" && (
            <>
              <Text style={styles.chestIcon}>🎁</Text>
              <Text style={[styles.chestTitle, { color: "#349d5a" }]}>SANDIK AÇILDI!</Text>
              <Text style={styles.chestSuccessReward}>
                {doubleXpEarned
                  ? "ÖDÜL KATLANDI: +300 SEZON XP & +1 RADAR HAKKI!"
                  : "ÖDÜL KAZANILDI: +150 SEZON XP & +1 RADAR HAKKI!"}
              </Text>
              {!doubleXpEarned && (
                <Pressable
                  onPress={() =>
                    safeWatchAd(() => {
                      setDoubleXpEarned(true);
                      gameSfx.victory();
                      triggerHapticSuccess();
                      onBonusReward?.(150, 1);
                    })
                  }
                  style={[styles.chestButton, { backgroundColor: "#ffeb94", marginTop: 8 }]}
                >
                  <Text style={styles.chestButtonText}>🎁 REKLAMLA ÖDÜLÜ 2X YAP</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      )}

      <View style={{ width: "100%", gap: 8, marginTop: 12 }}>
        {!daily && level < MAX_SOLO_LEVEL && (
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
  onReviveWithAd: () => void;
  daily: boolean;
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

      {!revived && (
        <Pressable
          onPress={onReviveWithAd}
          style={[styles.action, { backgroundColor: "#aef5e0", marginTop: 12 }]}
        >
          <Text style={[styles.actionText, { color: "#293541" }]}>💾 SÜREYİ KURTAR (+20sn REKLAM)</Text>
          <Text style={[styles.actionArrow, { color: "#293541" }]}>⚡</Text>
        </Pressable>
      )}

      {daily ? (
        <Pressable onPress={onExit} style={[styles.action, { backgroundColor: accentColor }]}>
          <Text style={styles.actionText}>KOMUTA MERKEZİNE DÖN</Text>
          <Text style={styles.actionArrow}>→</Text>
        </Pressable>
      ) : (
        <>
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
        </>
      )}
    </View>
  );
}
