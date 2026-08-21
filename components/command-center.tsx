import { useEffect, useRef } from "react";
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { type LeaderboardEntry } from "@/shared/game";
import { getRank, getPlayerLevel, missionProgress, SEASON_MISSIONS, THEME_PACKS, AVATARS, type DailyChallenge, type PlayerProgress } from "@/shared/progression";

type NavKey = "home" | "online" | "profile" | "arcade" | "levels";

type CommandCenterProps = {
  playerName: string;
  progress: PlayerProgress;
  daily: DailyChallenge;
  leaderboard: LeaderboardEntry[];
  onPlayDaily: () => void;
  onPlayBot: (size: 4 | 6 | 8 | 10) => void;
  onSolo: () => void;
  onNavigate: (destination: NavKey) => void;
  onLeaderboard: () => void;
};

function percent(current: number, target: number): `${number}%` {
  return `${Math.min(100, Math.round(current / target * 100))}%`;
}

export function CommandCenter({ playerName, progress, daily, leaderboard, onPlayDaily, onPlayBot, onSolo, onNavigate, onLeaderboard }: CommandCenterProps) {
  const orbit = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0.25)).current;
  const rank = getRank(progress);
  const activeTheme = THEME_PACKS.find((pack) => pack.id === daily.themeId) ?? THEME_PACKS[0]!;
  const dailyDone = progress.dailyCompletedId === daily.id;

  useEffect(() => {
    const orbitLoop = Animated.loop(Animated.timing(orbit, { toValue: 1, duration: 7_500, easing: Easing.linear, useNativeDriver: true }));
    const shimmerLoop = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 0.86, duration: 1_250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0.25, duration: 1_250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    orbitLoop.start();
    shimmerLoop.start();
    return () => { orbitLoop.stop(); shimmerLoop.stop(); };
  }, [orbit, shimmer]);

  const orbitSpin = orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const xpProgress = `${Math.min(100, progress.xp % 350 / 3.5)}%` as `${number}%`;
  const currentLevel = getPlayerLevel(progress.xp);
  const isLocked6 = currentLevel < 5;
  const isLocked8 = currentLevel < 8;
  const isLocked10 = currentLevel < 10;

  const makeLockedHandler = (size: 6 | 8 | 10, requiredLevel: number, action: () => void) => () => {
    if (currentLevel < requiredLevel) {
      Alert.alert(
        `🔒 Seviye ${requiredLevel} Gerekli`,
        `${size}×${size} modu Seviye ${requiredLevel}'de açılır. Şu anki seviyeniz: ${currentLevel}. Daha fazla kelime bul ve seviye atla!`
      );
    } else {
      action();
    }
  };

  const handlePlayBot6 = makeLockedHandler(6, 5, () => onPlayBot(6));
  const handlePlayBot8 = makeLockedHandler(8, 8, () => onPlayBot(8));
  const handlePlayBot10 = makeLockedHandler(10, 10, () => onPlayBot(10));

  const activeAvatar = AVATARS.find((a) => a.id === progress.selectedAvatar) ?? AVATARS[0]!;

  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    {/* Cockpit Profile Widget */}
    <View style={styles.topbar}>
      <Pressable onPress={() => onNavigate("profile")} style={({ pressed }) => [styles.identity, pressed && styles.pressed]}>
        <View style={[styles.avatar, { borderColor: activeAvatar.color, backgroundColor: activeAvatar.surface, borderWidth: 2 }]}><Text style={[styles.avatarText, { color: activeAvatar.color, fontSize: 18 }]}>{activeAvatar.icon}</Text></View>
        <View style={{ marginLeft: 4 }}><Text style={styles.name}>{playerName}</Text><Text style={styles.rank}>SEVİYE {getPlayerLevel(progress.xp)} · {rank} · {progress.xp} XP</Text></View>
      </Pressable>
      <Pressable onPress={onLeaderboard} style={({ pressed }) => [styles.livePill, pressed && styles.pressed]}><View style={styles.liveDot} /><Text style={styles.liveText}>LİDERLİK</Text></Pressable>
    </View>

    {/* Radar Signal Deck */}
    <View style={styles.signalDeck}>
      <Animated.View style={[styles.orbit, { transform: [{ rotate: orbitSpin }] }]}><View style={styles.orbitNode} /></Animated.View>
      <Animated.View style={[
        styles.radarRing,
        {
          borderColor: activeTheme.accent,
          transform: [
            { scale: shimmer.interpolate({ inputRange: [0.25, 0.86], outputRange: [0.95, 1.6] }) }
          ],
          opacity: shimmer.interpolate({ inputRange: [0.25, 0.86], outputRange: [0.45, 0] })
        }
      ]} />
      <Animated.View style={[styles.glow, { opacity: shimmer }]} />
      <Text style={styles.deckEyebrow}>CANLI KELİME AĞI · SEZON 01</Text>
      <Text style={styles.deckTitle}>ROTANI{`\n`}ATEŞLE</Text>
      <Text style={styles.deckBody}>Hızlı bir düello seç, günün sabit tahtasını bitir veya liderlik hattına çık.</Text>
      
      <View style={styles.xpPanel}>
        <View style={styles.xpHead}><Text style={styles.xpLabel}>SEZON İLERLEMESİ</Text><Text style={styles.xpValue}>{progress.xp % 350} / 350 XP</Text></View>
        <View style={styles.track}><View style={[styles.trackFill, { width: xpProgress }]} /></View>
      </View>
      
      <View style={styles.signalFooter}>
        <View style={styles.footerCol}><Text style={styles.signalLabel}>ORT. TEMPO</Text><Text style={styles.signalValue}>{progress.bestTempo || "—"}<Text style={styles.signalUnit}> K/DK</Text></Text></View>
        <View style={styles.signalRule} />
        <View style={styles.footerCol}><Text style={styles.signalLabel}>GALİBİYET</Text><Text style={styles.signalValue}>{progress.wins}<Text style={styles.signalUnit}> MAÇ</Text></Text></View>
      </View>
    </View>

    {/* Split Row for Daily and Arcade Challenges */}
    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>ETKİNLİK MERKEZİ</Text><Text style={styles.sectionMeta}>ÖZEL GÖREVLER</Text></View>
    <View style={styles.cardsRow}>
      <Pressable onPress={onPlayDaily} style={({ pressed }) => [styles.columnCard, { borderColor: activeTheme.accent }, pressed && styles.pressed]}>
        <View style={[styles.cardIconCircle, { backgroundColor: activeTheme.glow, borderColor: activeTheme.accent }]}><Text style={[styles.cardIconText, { color: activeTheme.accent }]}>{activeTheme.icon}</Text></View>
        <Text style={[styles.cardKicker, { color: activeTheme.accent }]}>SABİT ROTA</Text>
        <Text style={styles.cardTitle}>{dailyDone ? "TAMAMLANDI" : daily.title}</Text>
        <Text numberOfLines={3} style={styles.cardBody}>{dailyDone ? `Yarın yeni günlük rota açılır.` : `${daily.level <= 7 ? "6×6" : "8×8"} sabit tahtada yarış.`}</Text>
      </Pressable>

      <Pressable onPress={() => onNavigate("arcade")} style={({ pressed }) => [styles.columnCard, { borderColor: "#FFD000" }, pressed && styles.pressed]}>
        <View style={[styles.cardIconCircle, { backgroundColor: "rgba(255, 208, 0, 0.15)", borderColor: "#FFD000" }]}><Text style={[styles.cardIconText, { color: "#FFD000" }]}>⚡</Text></View>
        <Text style={[styles.cardKicker, { color: "#FFD000" }]}>ARCADE</Text>
        <Text style={styles.cardTitle}>SKOR YARIŞI</Text>
        <Text numberOfLines={3} style={styles.cardBody}>Süre dolmadan en çok kelimeyi bağla ve rekor kır!</Text>
      </Pressable>
    </View>

    {/* Tek Oyuncu Banner */}
    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>TEK OYUNCU</Text><Text style={styles.sectionMeta}>SEVİYE YOLU</Text></View>
    <Pressable onPress={onSolo} style={({ pressed }) => [styles.soloCard, pressed && styles.pressed]}>
      <View style={styles.soloLeft}>
        <View style={styles.soloIconWrap}><Text style={styles.soloIcon}>🏆</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.soloKicker}>KLASİK MOD</Text>
          <Text style={styles.soloTitle}>SEVİYE YOLCULUĞU</Text>
          <Text style={styles.soloBody}>Seviye seviye zorlaşan kelime operasyonları. Ustalaş ve tüm seviyeleri aç.</Text>
        </View>
      </View>
      <View style={styles.soloChevron}><Text style={styles.soloChevronText}>›</Text></View>
    </Pressable>

    {/* Bot Duel Grid */}
    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>HIZLI OYUN</Text><Text style={styles.sectionMeta}>IZGARA SEÇ</Text></View>
    <View style={styles.modeGrid}>
      <Pressable onPress={() => onPlayBot(4)} style={({ pressed }) => [styles.modeNode, { borderColor: "#FF758C" }, pressed && styles.pressed]}>
        <View style={styles.modeNodeHeader}>
          <Text style={[styles.modeSize, { color: "#FF758C" }]}>4×4</Text>
          <View style={[styles.modeMiniDot, { backgroundColor: "#FF758C" }]} />
        </View>
        <Text style={styles.modeTitle}>4x4</Text>
        <Text style={styles.modeMeta}>55 SN</Text>
      </Pressable>

      <Pressable onPress={handlePlayBot6} style={({ pressed }) => [styles.modeNode, { borderColor: isLocked6 ? "#4C4660" : "#38BDF8", opacity: isLocked6 ? 0.65 : 1 }, pressed && styles.pressed]}>
        <View style={styles.modeNodeHeader}>
          <Text style={[styles.modeSize, { color: isLocked6 ? "#6B7280" : "#38BDF8" }]}>{isLocked6 ? "🔒" : "6×6"}</Text>
          <View style={[styles.modeMiniDot, { backgroundColor: isLocked6 ? "#6B7280" : "#38BDF8" }]} />
        </View>
        <Text style={styles.modeTitle}>{isLocked6 ? "6x6 (Sev.5)" : "6x6"}</Text>
        <Text style={styles.modeMeta}>75 SN</Text>
      </Pressable>
    </View>

    <View style={[styles.modeGrid, { marginTop: 10 }]}>
      <Pressable onPress={handlePlayBot8} style={({ pressed }) => [styles.modeNode, { borderColor: isLocked8 ? "#4C4660" : "#A78BFA", opacity: isLocked8 ? 0.65 : 1 }, pressed && styles.pressed]}>
        <View style={styles.modeNodeHeader}>
          <Text style={[styles.modeSize, { color: isLocked8 ? "#6B7280" : "#A78BFA" }]}>{isLocked8 ? "🔒" : "8×8"}</Text>
          <View style={[styles.modeMiniDot, { backgroundColor: isLocked8 ? "#6B7280" : "#A78BFA" }]} />
        </View>
        <Text style={styles.modeTitle}>{isLocked8 ? "8x8 (Sev.8)" : "8x8"}</Text>
        <Text style={styles.modeMeta}>90 SN</Text>
      </Pressable>

      <Pressable onPress={handlePlayBot10} style={({ pressed }) => [styles.modeNode, { borderColor: isLocked10 ? "#4C4660" : "#F472B6", opacity: isLocked10 ? 0.65 : 1 }, pressed && styles.pressed]}>
        <View style={styles.modeNodeHeader}>
          <Text style={[styles.modeSize, { color: isLocked10 ? "#6B7280" : "#F472B6" }]}>{isLocked10 ? "🔒" : "10×10"}</Text>
          <View style={[styles.modeMiniDot, { backgroundColor: isLocked10 ? "#6B7280" : "#F472B6" }]} />
        </View>
        <Text style={styles.modeTitle}>{isLocked10 ? "10x10 (Sev.10)" : "10x10 Master"}</Text>
        <Text style={styles.modeMeta}>110 SN</Text>
      </Pressable>
    </View>

    {/* Season Missions */}
    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>SEZON GÖREVLERİ</Text><Text style={styles.sectionMeta}>ÖDÜLLER</Text></View>
    <View style={styles.missionStack}>{SEASON_MISSIONS.map((mission) => {
      const current = missionProgress(progress, mission);
      return <View key={mission.id} style={styles.mission}><View style={styles.missionIcon}><Text style={styles.missionIconText}>{mission.icon}</Text></View><View style={styles.missionCopy}><View style={styles.missionTop}><Text style={styles.missionTitle}>{mission.title}</Text><Text style={styles.missionReward}>+{mission.rewardXp} XP</Text></View><Text style={styles.missionBody}>{mission.description}</Text><View style={styles.missionProgress}><View style={styles.missionTrack}><View style={[styles.missionFill, { width: percent(current, mission.target) }]} /></View><Text style={styles.missionCount}>{current}/{mission.target}</Text></View></View></View>;
    })}</View>

    {/* Season Pulse Leaderboard Strip */}
    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>SEZONUN EN İYİLERİ</Text><Pressable onPress={onLeaderboard}><Text style={styles.sectionLink}>TÜM LİSTE</Text></Pressable></View>
    <Pressable onPress={onLeaderboard} style={({ pressed }) => [styles.leaderStrip, pressed && styles.pressed]}>
      <View style={styles.leaderTop}><Text style={styles.leaderTitle}>CANLI LİDERLİK TABLOSU</Text><Text style={styles.leaderArrow}>↗</Text></View>
      {leaderboard.length ? leaderboard.slice(0, 3).map((entry, index) => <View key={entry.id} style={styles.leaderRow}><Text style={styles.leaderRank}>0{index + 1}</Text><Text numberOfLines={1} style={styles.leaderName}>{entry.name}</Text><Text style={styles.leaderScore}>{entry.score}</Text></View>) : <Text style={styles.leaderEmpty}>Sezonun ilk puanını sen yaz.</Text>}
    </Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 136 }, 
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }, 
  identity: { flexDirection: "row", gap: 12, alignItems: "center" }, 
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, backgroundColor: "#241B47", justifyContent: "center", alignItems: "center" }, 
  avatarText: { color: "#FFF9FC", fontWeight: "900" }, 
  name: { color: "#FFF9FC", fontSize: 16, fontWeight: "900", letterSpacing: 0.5, textShadowColor: "rgba(255, 255, 255, 0.25)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }, 
  rank: { color: "#BFB2D8", fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginTop: 2 }, 
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(29, 24, 55, 0.7)", borderWidth: 1, borderColor: "rgba(76, 62, 115, 0.4)" }, 
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#00F5D4" }, 
  liveText: { color: "#D7CEE8", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  
  signalDeck: { minHeight: 280, marginTop: 16, padding: 22, borderRadius: 24, overflow: "hidden", backgroundColor: "rgba(43, 33, 88, 0.5)", borderWidth: 1, borderColor: "rgba(127, 103, 211, 0.35)", position: "relative" }, 
  radarRing: { position: "absolute", right: -35, top: -42, width: 190, height: 190, borderRadius: 100, borderWidth: 1.5, zIndex: 1 }, 
  orbit: { position: "absolute", right: -35, top: -42, width: 190, height: 190, borderRadius: 100, borderWidth: 1, borderColor: "#8E79DF", justifyContent: "flex-start", alignItems: "center", zIndex: 2 }, 
  orbitNode: { width: 16, height: 16, borderRadius: 9, marginTop: -8, backgroundColor: "#FFD000", shadowColor: "#FFD000", shadowOpacity: 0.9, shadowRadius: 12, elevation: 6 }, 
  glow: { position: "absolute", right: 25, bottom: -65, width: 180, height: 150, borderRadius: 100, backgroundColor: "#FF007F" }, 
  deckEyebrow: { color: "#FFD000", fontSize: 8, fontWeight: "900", letterSpacing: 1.2 }, 
  deckTitle: { color: "#FFFFFF", fontSize: 34, lineHeight: 38, fontWeight: "900", letterSpacing: -1, marginTop: 10, textShadowColor: "rgba(255, 255, 255, 0.35)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }, 
  deckBody: { color: "#DFD6F0", fontSize: 11, lineHeight: 16, marginTop: 10, maxWidth: 225 }, 
  xpPanel: { marginTop: 16, borderRadius: 16, backgroundColor: "rgba(12, 8, 37, 0.3)", borderWidth: 1, borderColor: "#5A4A93", padding: 12 }, 
  xpHead: { flexDirection: "row", justifyContent: "space-between" }, 
  xpLabel: { color: "#C9BEE4", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 }, 
  xpValue: { color: "#FFF9FC", fontSize: 8, fontWeight: "900" }, 
  track: { height: 6, marginTop: 8, borderRadius: 3, overflow: "hidden", backgroundColor: "#4B3B7C" }, 
  trackFill: { height: "100%", borderRadius: 3, backgroundColor: "#FFD000" }, 
  signalFooter: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }, 
  footerCol: { flex: 1, alignItems: "center" },
  signalLabel: { color: "#BDB0D7", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 }, 
  signalValue: { color: "#FFF9FC", fontSize: 16, fontWeight: "900", marginTop: 2 }, 
  signalUnit: { color: "#C7BAE0", fontSize: 8 }, 
  signalRule: { width: 1, height: 24, backgroundColor: "#64519B" },
  
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 8 }, 
  sectionTitle: { color: "#FFF9FC", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, 
  sectionMeta: { color: "#9185AB", fontSize: 8, fontWeight: "900", letterSpacing: 0.65 }, 
  sectionLink: { color: "#FFD000", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  
  cardsRow: { flexDirection: "row", gap: 10, width: "100%" },
  columnCard: { flex: 1, minHeight: 180, borderRadius: 20, borderWidth: 1.5, padding: 14, backgroundColor: "rgba(33, 26, 61, 0.4)" },
  cardIconCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cardIconText: { fontSize: 18, fontWeight: "900" },
  cardKicker: { fontSize: 8, fontWeight: "900", letterSpacing: 0.8, marginTop: 12 },
  cardTitle: { color: "#FFF9FC", fontSize: 13, fontWeight: "900", marginTop: 4, textShadowColor: "rgba(255, 255, 255, 0.15)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }, 
  cardBody: { color: "#C9BEDD", fontSize: 9, lineHeight: 13, marginTop: 4 },
  
  modeGrid: { flexDirection: "row", gap: 10 }, 
  modeNode: { flex: 1, minHeight: 110, borderRadius: 20, padding: 12, backgroundColor: "rgba(32, 26, 57, 0.4)", borderWidth: 1.5, justifyContent: "space-between" }, 
  modeNodeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modeSize: { fontSize: 18, fontWeight: "900", textShadowColor: "rgba(255, 255, 255, 0.1)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }, 
  modeMiniDot: { width: 8, height: 8, borderRadius: 4 },
  modeTitle: { color: "#FFF9FC", fontSize: 12, fontWeight: "900", marginTop: 8 }, 
  modeMeta: { color: "#AAA0BF", fontSize: 9, fontWeight: "800", marginTop: 2 },
  
  missionStack: { gap: 8 }, 
  mission: { padding: 12, borderRadius: 17, backgroundColor: "rgba(29, 24, 53, 0.4)", borderWidth: 1, borderColor: "rgba(61, 49, 94, 0.35)", flexDirection: "row", gap: 10 }, 
  missionIcon: { width: 31, height: 31, borderRadius: 11, backgroundColor: "#332653", justifyContent: "center", alignItems: "center" }, 
  missionIconText: { color: "#FFD000", fontSize: 15 }, 
  missionCopy: { flex: 1 }, 
  missionTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 }, 
  missionTitle: { color: "#F6F1FF", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }, 
  missionReward: { color: "#FFD000", fontSize: 8, fontWeight: "900" }, 
  missionBody: { color: "#B9AECD", fontSize: 9, marginTop: 3 }, 
  missionProgress: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 7 }, 
  missionTrack: { flex: 1, height: 5, borderRadius: 4, backgroundColor: "#413461", overflow: "hidden" }, 
  missionFill: { height: "100%", backgroundColor: "#00F5D4", borderRadius: 4 }, 
  missionCount: { color: "#D7CEE8", fontSize: 8, fontWeight: "900" },
  
  leaderStrip: { padding: 16, borderRadius: 20, backgroundColor: "rgba(37, 29, 73, 0.4)", borderWidth: 1.5, borderColor: "rgba(87, 69, 141, 0.3)" }, 
  leaderTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }, 
  leaderTitle: { color: "#FFF9FC", fontSize: 12, fontWeight: "900", letterSpacing: 0.7 }, 
  leaderArrow: { color: "#00F5D4", fontSize: 15, fontWeight: "900" }, 
  leaderRow: { height: 28, flexDirection: "row", alignItems: "center", gap: 9 }, 
  leaderRank: { color: "#A79ABD", width: 19, fontSize: 8, fontWeight: "900" }, 
  leaderName: { flex: 1, color: "#E9E1F7", fontSize: 11, fontWeight: "800" }, 
  leaderScore: { color: "#FFD000", fontSize: 11, fontWeight: "900" }, 
  leaderEmpty: { color: "#B8ADD1", fontSize: 10 }, 
  soloCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 22, backgroundColor: "rgba(30, 18, 70, 0.55)", borderWidth: 1.5, borderColor: "#7C3AED", shadowColor: "#7C3AED", shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  soloLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  soloIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(124, 58, 237, 0.2)", borderWidth: 1.5, borderColor: "#8B5CF6", alignItems: "center", justifyContent: "center" },
  soloIcon: { fontSize: 26 },
  soloKicker: { color: "#A78BFA", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  soloTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", letterSpacing: 0.3, marginTop: 2 },
  soloBody: { color: "#C4B5FD", fontSize: 9, lineHeight: 13, marginTop: 4, marginRight: 8 },
  soloChevron: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(124, 58, 237, 0.25)", alignItems: "center", justifyContent: "center" },
  soloChevronText: { color: "#A78BFA", fontSize: 22, fontWeight: "900", lineHeight: 28 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
