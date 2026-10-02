import React from "react";
import { View, Text } from "react-native";
import { onboardingStyles as styles } from "./onboarding.styles";

export const RouteVisual = React.memo(() => {
  return (
    <View style={styles.visualCard}>
      <Text style={styles.visualLabel}>ÖRNEK GEÇERLİ VE GEÇERSİZ ROTALAR:</Text>
      <View style={styles.routeExampleRow}>
        <View style={styles.exampleCol}>
          <View style={styles.miniBoardRow}>
            <View style={[styles.miniCell, styles.miniCellActive]}><Text style={styles.miniLetter}>K</Text></View>
            <Text style={styles.miniArrow}>➔</Text>
            <View style={[styles.miniCell, styles.miniCellActive]}><Text style={styles.miniLetter}>A</Text></View>
            <Text style={styles.miniArrow}>➔</Text>
            <View style={[styles.miniCell, styles.miniCellActive]}><Text style={styles.miniLetter}>P</Text></View>
            <Text style={styles.miniArrow}>➔</Text>
            <View style={[styles.miniCell, styles.miniCellActive]}><Text style={styles.miniLetter}>I</Text></View>
          </View>
          <Text style={styles.validStatusText}>✓ GEÇERLİ (90° Dik / Yatay)</Text>
        </View>
        <View style={styles.exampleDivider} />
        <View style={styles.exampleCol}>
          <View style={styles.miniBoardRow}>
            <View style={[styles.miniCell, styles.miniCellActive]}><Text style={styles.miniLetter}>K</Text></View>
            <Text style={[styles.miniArrow, { color: "#ca4f62" }]}>⤨</Text>
            <View style={[styles.miniCell, styles.miniCellInvalid]}><Text style={[styles.miniLetter, { color: "#ca4f62" }]}>L</Text></View>
          </View>
          <Text style={styles.invalidStatusText}>✗ YASAK (Çapraz Bağlantı)</Text>
        </View>
      </View>
    </View>
  );
});
RouteVisual.displayName = "RouteVisual";

export const ModesVisual = React.memo(() => {
  return (
    <View style={styles.modesPillRow}>
      <View style={[styles.modeMiniBadge, { borderColor: "#DCE1D7" }]}>
        <Text style={[styles.modeMiniBadgeTitle, { color: "#2a9c7a" }]}>4×4 MATRİS</Text>
        <Text style={styles.modeMiniBadgeSub}>16 Harf · 60sn</Text>
      </View>
      <View style={[styles.modeMiniBadge, { borderColor: "#DCE1D7" }]}>
        <Text style={[styles.modeMiniBadgeTitle, { color: "#8c7540" }]}>6×6 MATRİS</Text>
        <Text style={styles.modeMiniBadgeSub}>36 Harf · 75sn</Text>
      </View>
      <View style={[styles.modeMiniBadge, { borderColor: "#DCE1D7" }]}>
        <Text style={[styles.modeMiniBadgeTitle, { color: "#987c00" }]}>8×8 MATRİS</Text>
        <Text style={styles.modeMiniBadgeSub}>64 Harf · 95sn</Text>
      </View>
      <View style={[styles.modeMiniBadge, { borderColor: "#DCE1D7" }]}>
        <Text style={[styles.modeMiniBadgeTitle, { color: "#9d6f33" }]}>10×10 MATRİS</Text>
        <Text style={styles.modeMiniBadgeSub}>100 Harf · 125sn</Text>
      </View>
    </View>
  );
});
ModesVisual.displayName = "ModesVisual";

export const LeaguesVisual = React.memo(() => {
  return (
    <View style={styles.leaguesRow}>
      <View style={[styles.leagueChip, { borderColor: "#DCE1D7" }]}>
        <Text style={styles.leagueChipIcon}>🛡️</Text>
        <Text style={[styles.leagueChipTitle, { color: "#ab6a2a" }]}>BRONZ</Text>
        <Text style={styles.leagueChipLp}>0-349 LP</Text>
      </View>
      <View style={[styles.leagueChip, { borderColor: "#DCE1D7" }]}>
        <Text style={styles.leagueChipIcon}>⚔️</Text>
        <Text style={[styles.leagueChipTitle, { color: "#293541" }]}>GÜMÜŞ</Text>
        <Text style={styles.leagueChipLp}>350-899 LP</Text>
      </View>
      <View style={[styles.leagueChip, { borderColor: "#DCE1D7" }]}>
        <Text style={styles.leagueChipIcon}>👑</Text>
        <Text style={[styles.leagueChipTitle, { color: "#957d00" }]}>ALTIN</Text>
        <Text style={styles.leagueChipLp}>900-1599 LP</Text>
      </View>
      <View style={[styles.leagueChip, { borderColor: "#DCE1D7" }]}>
        <Text style={styles.leagueChipIcon}>💎</Text>
        <Text style={[styles.leagueChipTitle, { color: "#2a9c7a" }]}>ELMAS</Text>
        <Text style={styles.leagueChipLp}>1600-2499</Text>
      </View>
      <View style={[styles.leagueChip, { borderColor: "#DCE1D7" }]}>
        <Text style={styles.leagueChipIcon}>🌟</Text>
        <Text style={[styles.leagueChipTitle, { color: "#9d6f33" }]}>ŞAMPİYON</Text>
        <Text style={styles.leagueChipLp}>2500+ LP</Text>
      </View>
    </View>
  );
});
LeaguesVisual.displayName = "LeaguesVisual";

export const RewardsVisual = React.memo(() => {
  return (
    <View style={styles.rewardsStripCard}>
      <Text style={styles.visualLabel}>7 GÜNLÜK ÖDÜL DÖNGÜSÜ:</Text>
      <View style={styles.rewardPillsRow}>
        <View style={styles.rewardMiniPill}><Text style={styles.rewardMiniIcon}>🪙</Text><Text style={styles.rewardMiniDay}>1G</Text><Text style={styles.rewardMiniAmt}>+25</Text></View>
        <View style={styles.rewardMiniPill}><Text style={styles.rewardMiniIcon}>⚡</Text><Text style={styles.rewardMiniDay}>2G</Text><Text style={styles.rewardMiniAmt}>+60</Text></View>
        <View style={styles.rewardMiniPill}><Text style={styles.rewardMiniIcon}>🪙</Text><Text style={styles.rewardMiniDay}>3G</Text><Text style={styles.rewardMiniAmt}>+50</Text></View>
        <View style={styles.rewardMiniPill}><Text style={styles.rewardMiniIcon}>⚡</Text><Text style={styles.rewardMiniDay}>4G</Text><Text style={styles.rewardMiniAmt}>+100</Text></View>
        <View style={styles.rewardMiniPill}><Text style={styles.rewardMiniIcon}>🪙</Text><Text style={styles.rewardMiniDay}>5G</Text><Text style={styles.rewardMiniAmt}>+75</Text></View>
        <View style={styles.rewardMiniPill}><Text style={styles.rewardMiniIcon}>⚡</Text><Text style={styles.rewardMiniDay}>6G</Text><Text style={styles.rewardMiniAmt}>+150</Text></View>
        <View style={[styles.rewardMiniPill, styles.rewardMiniPillEpic]}><Text style={styles.rewardMiniIcon}>🛡️</Text><Text style={styles.rewardMiniDay}>7G</Text><Text style={styles.rewardMiniAmt}>+1</Text></View>
      </View>
    </View>
  );
});
RewardsVisual.displayName = "RewardsVisual";

export const MultipliersVisual = React.memo(() => {
  return (
    <View style={styles.multipliersCard}>
      <View style={styles.multiplierItem}>
        <Text style={styles.multiplierBadge}>3-4 HARF</Text>
        <Text style={styles.multiplierValue}>×1.0</Text>
        <Text style={styles.multiplierSub}>Standart Puan</Text>
      </View>
      <View style={[styles.multiplierItem, { borderColor: "#DCE1D7" }]}>
        <Text style={[styles.multiplierBadge, { color: "#2a9c7a" }]}>5-6 HARF</Text>
        <Text style={[styles.multiplierValue, { color: "#2a9c7a" }]}>×1.5</Text>
        <Text style={styles.multiplierSub}>Siber Bonus</Text>
      </View>
      <View style={[styles.multiplierItem, { borderColor: "#DCE1D7", backgroundColor: "rgba(255, 0, 127, 0.1)" }]}>
        <Text style={[styles.multiplierBadge, { color: "#9d6f33" }]}>7+ HARF</Text>
        <Text style={[styles.multiplierValue, { color: "#9d6f33" }]}>×2.0</Text>
        <Text style={styles.multiplierSub}>Dev Çarpan!</Text>
      </View>
    </View>
  );
});
MultipliersVisual.displayName = "MultipliersVisual";
