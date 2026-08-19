import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { type LeaderboardEntry } from "@/shared/game";
import { getRank, missionProgress, SEASON_MISSIONS, THEME_PACKS, AVATARS, type DailyChallenge, type PlayerProgress } from "@/shared/progression";

type NavKey = "home" | "modes" | "online" | "profile" | "arcade";

type CommandCenterProps = {
  playerName: string;
  progress: PlayerProgress;
  daily: DailyChallenge;
  leaderboard: LeaderboardEntry[];
  onPlayDaily: () => void;
  onPlayBot: (size: 4 | 6 | 8) => void;
  onNavigate: (destination: NavKey) => void;
  onLeaderboard: () => void;
};

function percent(current: number, target: number): `${number}%` {
  return `${Math.min(100, Math.round(current / target * 100))}%`;
}

export function CommandCenter({ playerName, progress, daily, leaderboard, onPlayDaily, onPlayBot, onNavigate, onLeaderboard }: CommandCenterProps) {
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

  const activeAvatar = AVATARS.find((a) => a.id === progress.selectedAvatar) ?? AVATARS[0]!;

  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.topbar}>
      <Pressable onPress={() => onNavigate("profile")} style={({ pressed }) => [styles.identity, pressed && styles.pressed]}>
        <View style={[styles.avatar, { borderColor: activeAvatar.color, backgroundColor: activeAvatar.surface, borderWidth: 1.5 }]}><Text style={[styles.avatarText, { color: activeAvatar.color, fontSize: 16 }]}>{activeAvatar.icon}</Text></View>
        <View><Text style={styles.name}>{playerName}</Text><Text style={styles.rank}>{rank} AVCI · {progress.xp} XP</Text></View>
      </Pressable>
      <Pressable onPress={onLeaderboard} style={({ pressed }) => [styles.livePill, pressed && styles.pressed]}><View style={styles.liveDot} /><Text style={styles.liveText}>SEZON</Text></Pressable>
    </View>

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
      <View style={styles.xpPanel}><View style={styles.xpHead}><Text style={styles.xpLabel}>SIRADAKİ RÜTBE</Text><Text style={styles.xpValue}>{progress.xp % 350} / 350 XP</Text></View><View style={styles.track}><View style={[styles.trackFill, { width: xpProgress }]} /></View></View>
      <View style={styles.signalFooter}><View><Text style={styles.signalLabel}>EN İYİ TEMPO</Text><Text style={styles.signalValue}>{progress.bestTempo || "—"}<Text style={styles.signalUnit}> K/DK</Text></Text></View><View style={styles.signalRule} /><View><Text style={styles.signalLabel}>GALİBİYET</Text><Text style={styles.signalValue}>{progress.wins}<Text style={styles.signalUnit}> MAÇ</Text></Text></View></View>
    </View>

    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>BUGÜNÜN AKIŞI</Text><Text style={styles.sectionMeta}>SABİT TAHTA</Text></View>
    <Pressable onPress={onPlayDaily} style={({ pressed }) => [styles.dailyCard, { borderColor: activeTheme.accent }, pressed && styles.pressed]}>
      <View style={[styles.dailyIcon, { backgroundColor: activeTheme.glow, borderColor: activeTheme.accent }]}><Text style={[styles.dailyIconText, { color: activeTheme.accent }]}>{activeTheme.icon}</Text></View>
      <View style={styles.dailyCopy}><Text style={[styles.dailyKicker, { color: activeTheme.accent }]}>{activeTheme.label} PAKETİ · +{daily.rewardXp} XP</Text><Text style={styles.dailyTitle}>{dailyDone ? "GÜNÜN ROTASI TAMAMLANDI" : daily.title}</Text><Text style={styles.dailyBody}>{dailyDone ? `Serin ${progress.streak} gün · yarın yeni rota açılır.` : `${daily.level <= 7 ? "6×6" : "8×8"} sabit tahta · herkes aynı kelimeleri avlıyor.`}</Text></View>
      <View style={[styles.dailyAction, { backgroundColor: activeTheme.accent }]}><Text style={styles.dailyActionText}>{dailyDone ? "✓" : "→"}</Text></View>
    </Pressable>

    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>ARCADE HEYECANI</Text><Text style={styles.sectionMeta}>ZAMANA KARŞISkor Yarışı</Text></View>
    <Pressable onPress={() => onNavigate("arcade")} style={({ pressed }) => [styles.arcadeCard, pressed && styles.pressed]}>
      <View style={styles.arcadeIcon}><Text style={styles.arcadeIconText}>⚡</Text></View>
      <View style={styles.dailyCopy}><Text style={styles.arcadeKicker}>ZAMANA KARŞI HÜCUM · EN İYİ SKOR: {progress.bestArcadeScore || 0}</Text><Text style={styles.dailyTitle}>SKOR YARIŞI</Text><Text style={styles.dailyBody}>30 saniye ile başla, kelime buldukça süreyi uzat ve rekor kır!</Text></View>
      <View style={styles.arcadeAction}><Text style={styles.dailyActionText}>→</Text></View>
    </Pressable>

    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>HIZLI SIÇRAMA</Text><Pressable onPress={() => onNavigate("modes")}><Text style={styles.sectionLink}>TÜM MODLAR</Text></Pressable></View>
    <View style={styles.modeRail}>
      <ModeNode size={4} title="NABIZ" meta="55 SN" accent="#FF758C" onPress={() => onPlayBot(4)} />
      <ModeNode size={6} title="AKIŞ" meta="75 SN" accent="#6CA8FF" onPress={() => onPlayBot(6)} />
      <ModeNode size={8} title="DERİNLİK" meta="90 SN" accent="#A78BFA" onPress={() => onPlayBot(8)} />
    </View>

    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>SEZON GÖREVLERİ</Text><Text style={styles.sectionMeta}>{progress.xp} XP TOPLANDI</Text></View>
    <View style={styles.missionStack}>{SEASON_MISSIONS.map((mission) => {
      const current = missionProgress(progress, mission);
      return <View key={mission.id} style={styles.mission}><View style={styles.missionIcon}><Text style={styles.missionIconText}>{mission.icon}</Text></View><View style={styles.missionCopy}><View style={styles.missionTop}><Text style={styles.missionTitle}>{mission.title}</Text><Text style={styles.missionReward}>+{mission.rewardXp} XP</Text></View><Text style={styles.missionBody}>{mission.description}</Text><View style={styles.missionProgress}><View style={styles.missionTrack}><View style={[styles.missionFill, { width: percent(current, mission.target) }]} /></View><Text style={styles.missionCount}>{current}/{mission.target}</Text></View></View></View>;
    })}</View>

    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>SEZONUN NABZI</Text><Pressable onPress={onLeaderboard}><Text style={styles.sectionLink}>SIRALAMA</Text></Pressable></View>
    <Pressable onPress={onLeaderboard} style={({ pressed }) => [styles.leaderStrip, pressed && styles.pressed]}>
      <View style={styles.leaderTop}><Text style={styles.leaderTitle}>CANLI LİDERLİK</Text><Text style={styles.leaderArrow}>↗</Text></View>
      {leaderboard.length ? leaderboard.slice(0, 3).map((entry, index) => <View key={entry.id} style={styles.leaderRow}><Text style={styles.leaderRank}>0{index + 1}</Text><Text numberOfLines={1} style={styles.leaderName}>{entry.name}</Text><Text style={styles.leaderScore}>{entry.score}</Text></View>) : <Text style={styles.leaderEmpty}>Sezonun ilk puanını sen yaz.</Text>}
    </Pressable>
  </ScrollView>;
}

function ModeNode({ size, title, meta, accent, onPress }: { size: 4 | 6 | 8; title: string; meta: string; accent: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.modeNode, { borderColor: accent }, pressed && styles.pressed]}><Text style={[styles.modeSize, { color: accent }]}>{size}×{size}</Text><Text style={styles.modeTitle}>{title}</Text><Text style={styles.modeMeta}>{meta}</Text><View style={[styles.modeDot, { backgroundColor: accent }]} /></Pressable>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 136 }, topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, identity: { flexDirection: "row", gap: 10, alignItems: "center" }, avatar: { width: 43, height: 43, borderRadius: 16, borderWidth: 2, backgroundColor: "#241B47", justifyContent: "center", alignItems: "center" }, avatarText: { color: "#FFF9FC", fontSize: 11, fontWeight: "900" }, name: { color: "#FFF9FC", fontSize: 14, fontWeight: "900" }, rank: { color: "#BFB2D8", fontSize: 8, fontWeight: "900", letterSpacing: 0.8, marginTop: 3 }, livePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 99, backgroundColor: "#1D1837", borderWidth: 1, borderColor: "#4C3E73" }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#55E6B2" }, liveText: { color: "#D7CEE8", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  signalDeck: { minHeight: 292, marginTop: 20, padding: 19, borderRadius: 30, overflow: "hidden", backgroundColor: "#2B2158", borderWidth: 1, borderColor: "#7F67D3" }, radarRing: { position: "absolute", right: -35, top: -42, width: 190, height: 190, borderRadius: 100, borderWidth: 1.5, zIndex: 1 }, orbit: { position: "absolute", right: -35, top: -42, width: 190, height: 190, borderRadius: 100, borderWidth: 1, borderColor: "#8E79DF", justifyContent: "flex-start", alignItems: "center", zIndex: 2 }, orbitNode: { width: 16, height: 16, borderRadius: 9, marginTop: -8, backgroundColor: "#FFC24A", shadowColor: "#FFC24A", shadowOpacity: 0.9, shadowRadius: 12, elevation: 6 }, glow: { position: "absolute", right: 25, bottom: -65, width: 180, height: 150, borderRadius: 100, backgroundColor: "#FF647C" }, deckEyebrow: { color: "#FFD37F", fontSize: 8, fontWeight: "900", letterSpacing: 1.2 }, deckTitle: { color: "#FFFFFF", fontSize: 37, lineHeight: 41, fontWeight: "900", letterSpacing: -1.5, marginTop: 13 }, deckBody: { color: "#DFD6F0", fontSize: 12, lineHeight: 18, marginTop: 12, maxWidth: 255 }, xpPanel: { marginTop: 17, borderRadius: 15, backgroundColor: "rgba(12, 8, 37, 0.42)", borderWidth: 1, borderColor: "#5A4A93", padding: 11 }, xpHead: { flexDirection: "row", justifyContent: "space-between" }, xpLabel: { color: "#C9BEE4", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 }, xpValue: { color: "#FFF9FC", fontSize: 8, fontWeight: "900" }, track: { height: 7, marginTop: 8, borderRadius: 7, overflow: "hidden", backgroundColor: "#4B3B7C" }, trackFill: { height: "100%", borderRadius: 7, backgroundColor: "#FFC24A" }, signalFooter: { marginTop: 14, flexDirection: "row", alignItems: "center" }, signalLabel: { color: "#BDB0D7", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 }, signalValue: { color: "#FFF9FC", fontSize: 18, fontWeight: "900", marginTop: 2 }, signalUnit: { color: "#C7BAE0", fontSize: 8 }, signalRule: { width: 1, height: 30, backgroundColor: "#64519B", marginHorizontal: 25 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 21, marginBottom: 9 }, sectionTitle: { color: "#FFF9FC", fontSize: 10, fontWeight: "900", letterSpacing: 1.05 }, sectionMeta: { color: "#9185AB", fontSize: 8, fontWeight: "900", letterSpacing: 0.65 }, sectionLink: { color: "#FFC24A", fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  dailyCard: { minHeight: 111, padding: 13, borderRadius: 22, borderWidth: 1, backgroundColor: "#211A3D", flexDirection: "row", alignItems: "center", gap: 11 }, dailyIcon: { width: 45, height: 45, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" }, dailyIconText: { fontSize: 23, fontWeight: "900" }, dailyCopy: { flex: 1 }, dailyKicker: { fontSize: 8, fontWeight: "900", letterSpacing: 0.75 }, dailyTitle: { color: "#FFF9FC", fontSize: 14, fontWeight: "900", marginTop: 4 }, dailyBody: { color: "#C9BEDD", fontSize: 10, lineHeight: 14, marginTop: 4 }, dailyAction: { width: 31, height: 31, borderRadius: 11, justifyContent: "center", alignItems: "center" }, dailyActionText: { color: "#2B1730", fontSize: 18, fontWeight: "900" },
  arcadeCard: { minHeight: 111, padding: 13, borderRadius: 22, borderWidth: 1, borderColor: "#FFC24A", backgroundColor: "#151324", flexDirection: "row", alignItems: "center", gap: 11 }, arcadeIcon: { width: 45, height: 45, borderRadius: 15, borderWidth: 1, borderColor: "#FFC24A", backgroundColor: "#332612", alignItems: "center", justifyContent: "center" }, arcadeIconText: { fontSize: 23, fontWeight: "900", color: "#FFC24A" }, arcadeKicker: { fontSize: 8, fontWeight: "900", letterSpacing: 0.75, color: "#FFC24A" }, arcadeAction: { width: 31, height: 31, borderRadius: 11, backgroundColor: "#FFC24A", justifyContent: "center", alignItems: "center" },
  modeRail: { flexDirection: "row", gap: 8 }, modeNode: { flex: 1, minHeight: 112, borderRadius: 19, padding: 11, backgroundColor: "#201A39", borderWidth: 1, overflow: "hidden" }, modeSize: { fontSize: 16, fontWeight: "900" }, modeTitle: { color: "#FFF9FC", fontSize: 11, fontWeight: "900", marginTop: 8 }, modeMeta: { color: "#AAA0BF", fontSize: 8, fontWeight: "800", marginTop: 3 }, modeDot: { width: 16, height: 3, borderRadius: 3, marginTop: 8 },
  missionStack: { gap: 8 }, mission: { padding: 12, borderRadius: 17, backgroundColor: "#1D1835", borderWidth: 1, borderColor: "#3D315E", flexDirection: "row", gap: 10 }, missionIcon: { width: 31, height: 31, borderRadius: 11, backgroundColor: "#332653", justifyContent: "center", alignItems: "center" }, missionIconText: { color: "#FFC24A", fontSize: 15 }, missionCopy: { flex: 1 }, missionTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 }, missionTitle: { color: "#F6F1FF", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }, missionReward: { color: "#FFC24A", fontSize: 8, fontWeight: "900" }, missionBody: { color: "#B9AECD", fontSize: 9, marginTop: 3 }, missionProgress: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 7 }, missionTrack: { flex: 1, height: 5, borderRadius: 4, backgroundColor: "#413461", overflow: "hidden" }, missionFill: { height: "100%", backgroundColor: "#55E6B2", borderRadius: 4 }, missionCount: { color: "#D7CEE8", fontSize: 8, fontWeight: "900" },
  leaderStrip: { padding: 14, borderRadius: 20, backgroundColor: "#251D49", borderWidth: 1, borderColor: "#57458D" }, leaderTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }, leaderTitle: { color: "#FFF9FC", fontSize: 11, fontWeight: "900", letterSpacing: 0.7 }, leaderArrow: { color: "#55E6B2", fontSize: 15, fontWeight: "900" }, leaderRow: { height: 26, flexDirection: "row", alignItems: "center", gap: 9 }, leaderRank: { color: "#A79ABD", width: 19, fontSize: 8, fontWeight: "900" }, leaderName: { flex: 1, color: "#E9E1F7", fontSize: 10, fontWeight: "800" }, leaderScore: { color: "#FFC24A", fontSize: 10, fontWeight: "900" }, leaderEmpty: { color: "#B8ADD1", fontSize: 10 }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
