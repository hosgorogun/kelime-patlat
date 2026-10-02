import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import {
  PROFILE_FRAMES,
  VICTORY_EFFECTS,
  BOARD_SKINS,
} from "@/shared/store-items";
import type { PlayerProgress } from "@/shared/progression";
import { STORE_ASSETS } from "./store-assets";
import { styles } from "./cyber-store.styles";

const FRAME_IMAGES: Record<string, any> = {
  signal: require("../../assets/frames/signal.jpg"),
  neon: require("../../assets/frames/neon.jpg"),
  chrome: require("../../assets/frames/chrome.jpg"),
  gold: require("../../assets/frames/gold.jpg"),
  cyber: require("../../assets/frames/cyber.jpg"),
};

export function StoreCosmeticsTab({
  progress,
  onCosmeticPress,
  onSelectFrame,
  onSelectVictoryEffect,
  onSelectBoardSkin,
}: {
  progress?: PlayerProgress;
  onCosmeticPress: (
    kind: "frame" | "effect" | "board",
    id: string,
    label: string,
    color: string,
    cost: number,
    owned: boolean,
    onEquip?: (id: string) => void
  ) => void;
  onSelectFrame?: (frameId: string) => void;
  onSelectVictoryEffect?: (effectId: string) => void;
  onSelectBoardSkin?: (skinId: string) => void;
}) {
  return (
    <>
      <View style={styles.tabIntro}>
        <Text style={styles.tabIntroTitle}>PROFİL SİNYALİNİ KUR</Text>
        <Text style={styles.tabIntroText}>
          Özel avatar çerçevesi, zafer efekti ve neon tahta görünümlerini donan. Arenada tarzını yansıt!
        </Text>
      </View>

      {/* 1. Profil Çerçeveleri */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitleHeader}>✨ PROFİL ÇERÇEVELERİ</Text>
        <Text style={styles.sectionSubHeader}>SİNYAL VİTRİNİ</Text>
      </View>
      <View style={styles.cosmeticGrid}>
        {PROFILE_FRAMES.map(([id, label, color, cost]) => {
          const owned = Boolean(progress?.ownedFrames?.[id]) || cost === 0;
          const isSelected = progress?.selectedFrame === id;
          const isSignal = id === "signal";
          const isNeon = id === "neon";
          const isChrome = id === "chrome";
          const isGold = id === "gold";
          const avatarEmoji = isSignal ? "📡" : isNeon ? "🔮" : isChrome ? "💎" : isGold ? "👑" : "💖";
          const avatarBg = isSignal ? "#F0F5ED" : isNeon ? "#EDF4FC" : isChrome ? "#EDF4FC" : isGold ? "#FFF0E8" : "#FFF0E8";

          return (
            <Pressable
              key={id}
              onPress={() => onCosmeticPress("frame", id, label, color, cost, owned, onSelectFrame)}
              style={({ pressed }) => [
                styles.cosmeticCard,
                isSelected && styles.cosmeticCardSelected,
                { borderColor: isSelected ? color : "#DCE1D7" },
                pressed && { opacity: 0.8 },
              ]}
            >
              {/* Avatar halka önizleme (Üretilen Görsel) */}
              <View style={[styles.cosmeticRing, { borderColor: color, shadowColor: color, overflow: "hidden" }]}>
                {FRAME_IMAGES[id] ? (
                  <Image source={FRAME_IMAGES[id]} style={{ width: "100%", height: "100%", borderRadius: 24 }} resizeMode="cover" />
                ) : (
                  <View style={[styles.cosmeticRingInner, { backgroundColor: avatarBg }]}>
                    <Text style={{ fontSize: 22 }}>{avatarEmoji}</Text>
                  </View>
                )}
              </View>

              <Text numberOfLines={1} style={[styles.cosmeticCardName, { color }]}>{label}</Text>

              <View style={[styles.cosmeticCardBadge,
                isSelected ? { backgroundColor: color } :
                owned ? styles.badgeOwned : styles.badgeCost
              ]}>
                <Text style={[styles.cosmeticBadgeText, isSelected && { color: "#293541" }]}>
                  {isSelected ? "✓ SEÇİLİ" : owned ? "KULLAN" : `🪙 ${cost}`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* 2. Zafer Efektleri */}
      <View style={[styles.sectionHead, { marginTop: 18 }]}>
        <Text style={styles.sectionTitleHeader}>💥 ZAFER VE KUTLAMA EFEKTLERİ</Text>
        <Text style={styles.sectionSubHeader}>BİTİRİŞ PATLAMASI</Text>
      </View>
      <View style={styles.cosmeticGrid}>
        {VICTORY_EFFECTS.map(([id, label, glyph, cost, imageKey]) => {
          const owned = Boolean(progress?.ownedVictoryEffects?.[id]) || cost === 0;
          const isSelected = progress?.selectedVictoryEffect === id;

          const VICTORY_META: Record<string, { color: string; emoji: string }> = {
            pulse: { color: "#2a9c7a", emoji: "🌊" },
            glitch: { color: "#8c7540", emoji: "💻" },
            flare: { color: "#cb5e12", emoji: "💥" },
            lightning: { color: "#967a0d", emoji: "⚡" },
            fireworks: { color: "#ff2a85", emoji: "🎆" },
          };
          const meta = VICTORY_META[id] || { color: "#98732c", emoji: glyph || "🔥" };
          const themeColor = meta.color;

          return (
            <Pressable
              key={id}
              onPress={() => onCosmeticPress("effect", id, label, themeColor, cost, owned, onSelectVictoryEffect)}
              style={({ pressed }) => [
                styles.cosmeticCard,
                isSelected && styles.cosmeticCardSelected,
                { borderColor: isSelected ? themeColor : "#DCE1D7" },
                pressed && { opacity: 0.8 },
              ]}
            >
              {/* Efekt önizleme kutusu (3D Üretilen Görsel) */}
              <View style={[styles.cosmeticEffectBox, {
                borderColor: `${themeColor}70`,
                backgroundColor: `${themeColor}12`,
                overflow: "hidden"
              }]}>
                {imageKey && STORE_ASSETS[imageKey] ? (
                  <Image source={STORE_ASSETS[imageKey]} style={{ width: "100%", height: "100%", borderRadius: 12 }} resizeMode="cover" />
                ) : (
                  <Text style={{ fontSize: 28 }}>{meta.emoji}</Text>
                )}
                <View style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
                  backgroundColor: themeColor, opacity: 0.5,
                  borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
                }} />
              </View>

              <Text numberOfLines={1} style={[styles.cosmeticCardName, { color: themeColor }]}>{label}</Text>

              <View style={[styles.cosmeticCardBadge,
                isSelected ? { backgroundColor: themeColor } :
                owned ? styles.badgeOwned : styles.badgeCost
              ]}>
                <Text style={[styles.cosmeticBadgeText, isSelected && { color: "#293541" }]}>
                  {isSelected ? "✓ SEÇİLİ" : owned ? "KULLAN" : `🪙 ${cost}`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* 3. Tahta Görünümleri */}
      <View style={[styles.sectionHead, { marginTop: 18 }]}>
        <Text style={styles.sectionTitleHeader}>🌌 SİBER TAHTA KAPLAMALARI</Text>
        <Text style={styles.sectionSubHeader}>MATRİS TASARIMI</Text>
      </View>
      <View style={styles.cosmeticGrid}>
        {BOARD_SKINS.map(([id, label, color, cost, imageKey]) => {
          const owned = Boolean(progress?.ownedBoardSkins?.[id]) || cost === 0;
          const isSelected = progress?.selectedBoardSkin === id;
          const isGrid = id === "grid";
          const isNight = id === "night";

          return (
            <Pressable
              key={id}
              onPress={() => onCosmeticPress("board", id, label, color, cost, owned, onSelectBoardSkin)}
              style={({ pressed }) => [
                styles.cosmeticCard,
                isSelected && styles.cosmeticCardSelected,
                { borderColor: isSelected ? color : "#DCE1D7" },
                pressed && { opacity: 0.8 },
              ]}
            >
              {/* Realistic Mini Board Matrix View (3D Üretilen Görsel) */}
              <View style={[styles.realisticBoardWrap, { borderColor: color, backgroundColor: isGrid ? "#EDF4FC" : isNight ? "#EDF4FC" : "#FFF0E8", overflow: "hidden" }]}>
                {imageKey && STORE_ASSETS[imageKey] ? (
                  <Image source={STORE_ASSETS[imageKey]} style={{ width: "100%", height: "100%", borderRadius: 12 }} resizeMode="cover" />
                ) : (
                  <View style={styles.miniBoardGrid}>
                    <View style={[styles.miniCell, { borderColor: `${color}60`, backgroundColor: `${color}20` }]}>
                      <Text style={[styles.miniCellText, { color }]}>K</Text>
                    </View>
                    <View style={[styles.miniCell, { borderColor: `${color}60`, backgroundColor: `${color}35` }]}>
                      <Text style={[styles.miniCellText, { color }]}>P</Text>
                    </View>
                    <View style={[styles.miniCell, { borderColor: `${color}60`, backgroundColor: `${color}20` }]}>
                      <Text style={[styles.miniCellText, { color }]}>⚡</Text>
                    </View>
                    <View style={[styles.miniCell, { borderColor: `${color}60`, backgroundColor: `${color}50` }]}>
                      <Text style={[styles.miniCellText, { color: "#293541" }]}>✦</Text>
                    </View>
                  </View>
                )}
              </View>

              <Text numberOfLines={1} style={[styles.cosmeticCardName, { color }]}>{label}</Text>
              <View style={[styles.cosmeticCardBadge, isSelected ? { backgroundColor: color } : owned ? styles.badgeOwned : styles.badgeCost]}>
                <Text style={[styles.cosmeticBadgeText, isSelected && { color: "#293541" }]}>
                  {isSelected ? "✓ SEÇİLİ" : owned ? "KULLAN" : `🪙 ${cost}`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}
