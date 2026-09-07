import { useEffect, useRef } from "react";
import { Alert, Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { type LeaderboardEntry } from "@/shared/game";
import { getLeagueTier, getRank, getPlayerLevel, getActiveCyberTitle, THEME_PACKS, AVATARS, DAILY_LOGIN_REWARDS, getDayId, type DailyChallenge, type PlayerProgress, type ThemePackId } from "@/shared/progression";
import { triggerHapticSelection } from "@/shared/audio-haptics";

type NavKey = "home" | "online" | "profile" | "arcade" | "levels" | "store" | "season" | "league" | "missions";

type CommandCenterProps = {
  playerName: string;
  progress: PlayerProgress;
  daily: DailyChallenge;
  leaderboard: LeaderboardEntry[];
  onPlayDaily: () => void;
  onPlayBot: (size: 4 | 6 | 8 | 10) => void;
  onSolo: () => void;
  onNavigate: (destination: NavKey) => void;
  onLeaderboard?: () => void;
  onShowGuide: () => void;
  onSelectTheme?: (themeId: ThemePackId) => void;
  unclaimedMissionsCount?: number;
  unclaimedMilestonesCount?: number;
  onClaimDailyReward?: () => void;
};

export function CommandCenter({
  playerName,
  progress,
  daily,
  leaderboard,
  onPlayDaily,
  onPlayBot,
  onSolo,
  onNavigate,
  onLeaderboard,
  onShowGuide,
  onSelectTheme,
  unclaimedMissionsCount = 0,
  unclaimedMilestonesCount = 0,
  onClaimDailyReward,
}: CommandCenterProps) {
  const orbit = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0.25)).current;
  const rank = getRank(progress);
  const league = getLeagueTier(progress);
  const leagueProgressPercent = league.tier === "RADIAN"
    ? 100
    : Math.min(100, Math.round((league.currentTierPoints / league.targetTierPoints) * 100));
  const activeTheme = THEME_PACKS.find((pack) => pack.id === (progress.selectedTheme || daily.themeId)) ?? THEME_PACKS[0]!;
  const dailyDone = progress.dailyCompletedId === daily.id;

  const todayId = getDayId();
  const isClaimedToday = progress.lastLoginDay === todayId;
  const currentCount = progress.loginDaysCount || 0;
  const activeDayIndex = isClaimedToday ? (((currentCount || 1) - 1) % 7) : (currentCount % 7);
  const displayDayNumber = activeDayIndex + 1;
  const todayReward = DAILY_LOGIN_REWARDS[activeDayIndex]!;
  const nextReward = DAILY_LOGIN_REWARDS[(activeDayIndex + 1) % 7]!;

  const getRewardUnitName = (type: string) => {
    switch (type) {
      case "coins": return "SİBER ÇİP";
      case "shield": return "SERİ KALKANI";
      default: return "SEZON XP";
    }
  };

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
    {/* Cockpit Profile & Control Bar with Realtime Currencies */}
    <View style={styles.topbar}>
      <View style={styles.topbarRow}>
        <Pressable onPress={() => onNavigate("profile")} style={({ pressed }) => [styles.identity, pressed && styles.pressed]}>
          <View style={[styles.avatar, { borderColor: activeAvatar.color, backgroundColor: activeAvatar.surface, borderWidth: 2 }]}>
            {progress.avatarPhoto ? (
              <Image source={{ uri: progress.avatarPhoto }} style={{ width: "100%", height: "100%", borderRadius: 12 }} />
            ) : (
              <Text style={[styles.avatarText, { color: activeAvatar.color, fontSize: 18 }]}>{activeAvatar.icon}</Text>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text numberOfLines={1} style={[styles.name, { flexShrink: 1 }]}>{playerName}</Text>
              <Text numberOfLines={1} style={styles.cyberBadge}>{getActiveCyberTitle(progress)}</Text>
            </View>
            <Text numberOfLines={1} style={styles.rank}>SEVİYE {getPlayerLevel(progress.xp)} · {rank}</Text>
          </View>
        </Pressable>

        <View style={styles.topActionsGroup}>
          <Pressable 
            onPress={onShowGuide} 
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.topIconBtn, pressed && styles.pressed]}
          >
            <Text style={styles.topIconText}>❓</Text>
          </Pressable>
          <Pressable 
            onPress={() => onNavigate("profile")} 
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.topIconBtn, pressed && styles.pressed]}
          >
            <Text style={styles.topIconText}>⚙️</Text>
          </Pressable>
        </View>
      </View>

      {/* Persistent Resource Rail (Shields & Chips with Store Shortcut) */}
      <View style={styles.resourceRow}>
        <View style={styles.resourcePill}>
          <Text style={styles.resourceIcon}>🛡️</Text>
          <Text style={styles.resourceLabel}>KALKAN</Text>
          <Text style={styles.resourceValue}>{progress.streakShields ?? 1}</Text>
        </View>

        <Pressable 
          onPress={() => onNavigate("store")} 
          style={({ pressed }) => [styles.resourcePill, styles.coinPill, pressed && styles.pressed]}
        >
          <Text style={styles.resourceIcon}>🪙</Text>
          <Text style={styles.resourceLabel}>ÇİP</Text>
          <Text style={styles.coinValue}>{progress.coins ?? 50}</Text>
          <View style={styles.plusBadge}>
            <Text style={styles.plusText}>＋</Text>
          </View>
        </Pressable>
      </View>

      {progress.streak > 0 && !dailyDone && (
        <Pressable onPress={onPlayDaily} style={({ pressed }) => [styles.streakWarningPill, pressed && styles.pressed]}>
          <Text style={styles.streakWarningIcon}>🔥</Text>
          <Text style={styles.streakWarningText}>
            {progress.streak} GÜNLÜK SERİN TEHLİKEDE · BUGÜNÜN İZİNİ OYNA
          </Text>
          <Text style={styles.streakWarningArrow}>→</Text>
        </Pressable>
      )}
    </View>

    {/* Radar Signal Deck */}
    <Pressable onPress={() => onNavigate("league")} style={({ pressed }) => [styles.signalDeck, pressed && styles.pressed]}>
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
        <View style={styles.xpHead}><Text style={styles.xpLabel}>LİG İLERLEMESİ · {league.name}</Text><Text style={styles.xpValue}>{league.currentTierPoints} / {league.targetTierPoints} LP</Text></View>
        <View style={styles.track}><View style={[styles.trackFill, { width: `${Math.max(4, leagueProgressPercent)}%`, backgroundColor: league.color }]} /></View>
      </View>
      
      <View style={styles.signalFooter}>
        <View style={styles.footerCol}>
          <Text style={styles.signalLabel}>ORT. TEMPO</Text>
          <Text style={styles.signalValue}>{progress.bestTempo || 0} <Text style={styles.signalUnit}>K/DK</Text></Text>
        </View>
        <View style={styles.signalRule} />
        <View style={styles.footerCol}>
          <Text style={styles.signalLabel}>GALİBİYET</Text>
          <Text style={styles.signalValue}>{progress.wins} <Text style={styles.signalUnit}>MAÇ</Text></Text>
        </View>
      </View>
    </Pressable>

    {/* Günlük Giriş Ödülü (7 Günlük Döngü) */}
    <View style={styles.dailyRewardSection}>
      <View style={styles.dailyRewardHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.dailyRewardTitle}>🎁 GÜNLÜK GİRİŞ ÖDÜLÜ</Text>
          <View style={styles.dailyRewardDayPill}>
            <Text style={styles.dailyRewardDayPillText}>GÜN {displayDayNumber}/7</Text>
          </View>
        </View>
        <View style={[styles.dailyStatusBadge, isClaimedToday ? styles.dailyStatusBadgeClaimed : styles.dailyStatusBadgeReady]}>
          <Text style={[styles.dailyStatusBadgeText, isClaimedToday ? { color: "#50E3C2" } : { color: "#FFD000" }]}>
            {isClaimedToday ? "✓ ALINDI" : "⚡ 1 ÖDÜL HAZIR"}
          </Text>
        </View>
      </View>

      <View style={styles.dailyDaysRow}>
        {DAILY_LOGIN_REWARDS.map((item, index) => {
          const isPast = isClaimedToday ? index <= activeDayIndex : index < activeDayIndex;
          const isToday = index === activeDayIndex;
          const isTodayClaimable = isToday && !isClaimedToday;
          const isEpic = index === 6;

          return (
            <Pressable
              key={item.day}
              onPress={() => {
                if (isTodayClaimable) {
                  triggerHapticSelection();
                  onClaimDailyReward?.();
                }
              }}
              style={[
                styles.dailyDayCard,
                isPast && styles.dailyDayCardPast,
                isTodayClaimable && styles.dailyDayCardActive,
                isToday && isClaimedToday && styles.dailyDayCardClaimedToday,
                isEpic && styles.dailyDayCardEpic,
              ]}
            >
              {isEpic && (
                <View style={styles.epicTag}>
                  <Text style={styles.epicTagText}>EPİK</Text>
                </View>
              )}
              <Text style={[styles.dailyDayLabel, isTodayClaimable && { color: "#00F5D4", fontWeight: "900" }]}>
                {item.day}G
              </Text>
              <Text style={styles.dailyDayIcon}>{item.icon}</Text>
              <Text style={[styles.dailyDayAmount, isEpic && { color: "#FFD000" }]}>
                +{item.amount}
              </Text>
              {isPast && (
                <View style={styles.dailyDayCheck}>
                  <Text style={styles.dailyDayCheckText}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {!isClaimedToday ? (
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            onClaimDailyReward?.();
          }}
          style={({ pressed }) => [styles.dailyClaimBtn, pressed && styles.pressed]}
        >
          <Text style={styles.dailyClaimBtnIcon}>🎁</Text>
          <Text style={styles.dailyClaimBtnText}>
            BUGÜNÜN ÖDÜLÜNÜ TOPLA (+{todayReward.amount} {getRewardUnitName(todayReward.rewardType)})
          </Text>
          <Text style={styles.dailyClaimBtnArrow}>⚡</Text>
        </Pressable>
      ) : (
        <View style={styles.dailyClaimedBar}>
          <Text style={styles.dailyClaimedBarText}>
            ✓ Bugünkü ödülünü aldın! Yarınki ödül: {nextReward.icon} +{nextReward.amount} {getRewardUnitName(nextReward.rewardType)}
          </Text>
        </View>
      )}
    </View>

    {/* Event Hub (Daily Route & Arcade) */}
    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>ETKİNLİK MERKEZİ</Text><Text style={styles.sectionMeta}>ÖZEL GÖREVLER</Text></View>
    <View style={styles.cardsRow}>
      <Pressable onPress={onPlayDaily} style={({ pressed }) => [styles.columnCard, { borderColor: dailyDone ? "#332653" : activeTheme.accent }, pressed && styles.pressed]}>
        <View style={[styles.cardIconCircle, { borderColor: dailyDone ? "#524376" : activeTheme.accent, backgroundColor: dailyDone ? "#201838" : activeTheme.glow }]}>
          <Text style={[styles.cardIconText, { color: dailyDone ? "#82759F" : activeTheme.accent }]}>{activeTheme.icon}</Text>
        </View>
        <Text style={[styles.cardKicker, { color: dailyDone ? "#82759F" : activeTheme.accent }]}>{dailyDone ? "SABİT ROTA" : "BUGÜNÜN ROTASI"}</Text>
        <Text style={styles.cardTitle}>{dailyDone ? "TAMAMLANDI" : daily.title.toLocaleUpperCase("tr-TR")}</Text>
        <Text style={styles.cardBody}>{dailyDone ? "Günün rotasını tekrar incele." : "Kelime paketini seç ve günün rotasını başlat!"}</Text>
      </Pressable>

      <Pressable onPress={() => onNavigate("arcade")} style={({ pressed }) => [styles.columnCard, { borderColor: "#FFD000" }, pressed && styles.pressed]}>
        <View style={[styles.cardIconCircle, { borderColor: "#FFD000", backgroundColor: "rgba(255, 208, 0, 0.12)" }]}>
          <Text style={[styles.cardIconText, { color: "#FFD000" }]}>⚡</Text>
        </View>
        <Text style={[styles.cardKicker, { color: "#FFD000" }]}>ARCADE</Text>
        <Text style={styles.cardTitle}>SKOR YARIŞI</Text>
        <Text style={styles.cardBody}>Süre dolmadan en çok kelimeyi bağla ve rekor kır!</Text>
      </Pressable>
    </View>

    {/* Single Player Journey Card */}
    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>TEK OYUNCU</Text><Text style={styles.sectionMeta}>SEVİYE YOLU</Text></View>
    <Pressable onPress={onSolo} style={({ pressed }) => [styles.soloBanner, pressed && styles.pressed]}>
      <View style={styles.soloSkin}>
        <Text style={styles.soloTrophy}>🏆</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.soloEyebrow}>KLASİK MOD</Text>
            {unclaimedMilestonesCount > 0 && (
              <View style={styles.milestoneBadgePill}>
                <Text style={styles.milestoneBadgeText}>🎁 {unclaimedMilestonesCount} SANDIK HAZIR</Text>
              </View>
            )}
          </View>
          <Text style={styles.soloHeading}>SEVİYE YOLCULUĞU</Text>
          <Text style={styles.soloDesc}>
            {unclaimedMilestonesCount > 0
              ? `${unclaimedMilestonesCount} adet açılmayı bekleyen ödül sandığı seni bekliyor!`
              : "Seviye seviye zorlaşan kelime operasyonları. Ustalık kazan ve tüm seviyeleri aç."}
          </Text>
        </View>
        <Text style={styles.soloArrow}>›</Text>
      </View>
    </Pressable>

    {/* Fast Bot Duels */}
    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>HIZLI ANTRENMAN</Text><Text style={styles.sectionMeta}>BOT DÜELLOSU</Text></View>
    <View style={styles.modeGrid}>
      <Pressable onPress={() => onPlayBot(4)} style={({ pressed }) => [styles.modeNode, { borderColor: "#00F5D4" }, pressed && styles.pressed]}>
        <View style={styles.modeNodeHeader}>
          <Text style={[styles.modeSize, { color: "#00F5D4" }]}>4×4</Text>
          <View style={[styles.modeMiniDot, { backgroundColor: "#00F5D4" }]} />
        </View>
        <Text style={styles.modeTitle}>4x4 Hızlı</Text>
        <Text style={styles.modeMeta}>55 SN</Text>
      </Pressable>

      <Pressable onPress={handlePlayBot6} style={({ pressed }) => [styles.modeNode, { borderColor: isLocked6 ? "#4C4660" : "#A78BFA", opacity: isLocked6 ? 0.65 : 1 }, pressed && styles.pressed]}>
        <View style={styles.modeNodeHeader}>
          <Text style={[styles.modeSize, { color: isLocked6 ? "#6B7280" : "#A78BFA" }]}>{isLocked6 ? "🔒" : "6×6"}</Text>
          <View style={[styles.modeMiniDot, { backgroundColor: isLocked6 ? "#6B7280" : "#A78BFA" }]} />
        </View>
        <Text style={styles.modeTitle}>{isLocked6 ? "6x6 (Sev.5)" : "6x6 Akış"}</Text>
        <Text style={styles.modeMeta}>75 SN</Text>
      </Pressable>

      <Pressable onPress={handlePlayBot8} style={({ pressed }) => [styles.modeNode, { borderColor: isLocked8 ? "#4C4660" : "#F59E0B", opacity: isLocked8 ? 0.65 : 1 }, pressed && styles.pressed]}>
        <View style={styles.modeNodeHeader}>
          <Text style={[styles.modeSize, { color: isLocked8 ? "#6B7280" : "#F59E0B" }]}>{isLocked8 ? "🔒" : "8×8"}</Text>
          <View style={[styles.modeMiniDot, { backgroundColor: isLocked8 ? "#6B7280" : "#F59E0B" }]} />
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

    {/* Quick Hub Jumpers: Görevler & Liderlik */}
    <View style={styles.hubBannersRow}>
      <Pressable 
        onPress={() => onNavigate("missions")} 
        style={({ pressed }) => [styles.hubBanner, styles.missionsBanner, pressed && styles.pressed]}
      >
        <Text style={styles.hubBannerGlyph}>⚡</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.hubBannerTitle}>GÖREVLER</Text>
            {unclaimedMissionsCount > 0 && (
              <View style={styles.hubBadgePill}>
                <Text style={styles.hubBadgePillText}>{unclaimedMissionsCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.hubBannerSub}>
            {unclaimedMissionsCount > 0
              ? `${unclaimedMissionsCount} ödül hazır!`
              : "Haftalık hedefler ve XP"}
          </Text>
        </View>
        <Text style={styles.hubBannerArrow}>→</Text>
      </Pressable>

      <Pressable 
        onPress={() => onNavigate("season")} 
        style={({ pressed }) => [styles.hubBanner, styles.seasonBanner, pressed && styles.pressed]}
      >
        <Text style={styles.hubBannerGlyph}>🏆</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.hubBannerTitle}>LİDER & ARKADAŞ</Text>
          <Text style={styles.hubBannerSub}>Sıralama ve topluluk</Text>
        </View>
        <Text style={styles.hubBannerArrow}>→</Text>
      </Pressable>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 148 }, 
  topbar: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 22, backgroundColor: "rgba(22, 17, 44, 0.9)", borderWidth: 1, borderColor: "rgba(124, 92, 246, 0.35)", marginBottom: 4 }, 
  topbarRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  identity: { flexDirection: "row", gap: 10, alignItems: "center", flex: 1, marginRight: 8 }, 
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, backgroundColor: "#241B47", justifyContent: "center", alignItems: "center" }, 
  avatarText: { color: "#FFF9FC", fontWeight: "900" }, 
  name: { color: "#FFF9FC", fontSize: 14, fontWeight: "900", letterSpacing: 0.4 }, 
  cyberBadge: { color: "#00F5D4", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  rank: { color: "#E9D5FF", fontSize: 8, fontWeight: "800", letterSpacing: 0.6, marginTop: 2 }, 
  
  topActionsGroup: { flexDirection: "row", gap: 6, alignItems: "center" },
  topIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(124, 92, 246, 0.15)", borderWidth: 1, borderColor: "rgba(124, 92, 246, 0.3)", alignItems: "center", justifyContent: "center" },
  topIconText: { fontSize: 14 },
  
  resourceRow: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(124, 92, 246, 0.15)" },
  resourcePill: { flex: 1, flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, backgroundColor: "rgba(23, 17, 43, 0.7)", borderWidth: 1, borderColor: "rgba(124, 92, 246, 0.25)" },
  coinPill: { backgroundColor: "rgba(255, 194, 74, 0.1)", borderColor: "rgba(255, 194, 74, 0.35)" },
  resourceIcon: { fontSize: 14, marginRight: 6 },
  resourceLabel: { color: "#A799C7", fontSize: 9, fontWeight: "900", letterSpacing: 0.5, flex: 1 },
  resourceValue: { color: "#FFF", fontSize: 12, fontWeight: "900" },
  coinValue: { color: "#FFD000", fontSize: 12, fontWeight: "900", marginRight: 6 },
  plusBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#FFD000", alignItems: "center", justifyContent: "center" },
  plusText: { color: "#1A102B", fontSize: 12, fontWeight: "900", lineHeight: 14 },
  
  signalDeck: { minHeight: 185, marginTop: 12, padding: 16, borderRadius: 20, overflow: "hidden", backgroundColor: "rgba(43, 33, 88, 0.5)", borderWidth: 1, borderColor: "rgba(127, 103, 211, 0.35)", position: "relative" }, 
  radarRing: { position: "absolute", right: -25, top: -28, width: 135, height: 135, borderRadius: 70, borderWidth: 1.5, zIndex: 1 }, 
  orbit: { position: "absolute", right: -25, top: -28, width: 135, height: 135, borderRadius: 70, borderWidth: 1, borderColor: "#8E79DF", justifyContent: "flex-start", alignItems: "center", zIndex: 2 }, 
  orbitNode: { width: 12, height: 12, borderRadius: 6, marginTop: -6, backgroundColor: "#FFD000", shadowColor: "#FFD000", shadowOpacity: 0.9, shadowRadius: 10, elevation: 5 }, 
  glow: { position: "absolute", right: 20, bottom: -45, width: 140, height: 110, borderRadius: 80, backgroundColor: "rgba(255, 0, 127, 0.18)" }, 
  deckEyebrow: { color: "#FFD000", fontSize: 7.5, fontWeight: "900", letterSpacing: 1.1 }, 
  deckTitle: { color: "#FFFFFF", fontSize: 24, lineHeight: 27, fontWeight: "900", letterSpacing: -0.5, marginTop: 4, textShadowColor: "rgba(255, 255, 255, 0.35)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }, 
  deckBody: { color: "#F3E8FF", fontSize: 9.5, lineHeight: 13.5, marginTop: 4, maxWidth: 215 }, 
  xpPanel: { marginTop: 10, borderRadius: 12, backgroundColor: "rgba(12, 8, 37, 0.3)", borderWidth: 1, borderColor: "#5A4A93", padding: 9 }, 
  xpHead: { flexDirection: "row", justifyContent: "space-between" }, 
  xpLabel: { color: "#E9D5FF", fontSize: 7.5, fontWeight: "900", letterSpacing: 0.7 }, 
  xpValue: { color: "#FFF9FC", fontSize: 7.5, fontWeight: "900" }, 
  track: { height: 5, marginTop: 6, borderRadius: 2.5, overflow: "hidden", backgroundColor: "#4B3B7C" }, 
  trackFill: { height: "100%", borderRadius: 2.5, backgroundColor: "#FFD000" }, 
  signalFooter: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }, 
  footerCol: { flex: 1, alignItems: "center" },
  signalLabel: { color: "#E9D5FF", fontSize: 7.5, fontWeight: "900", letterSpacing: 0.7 }, 
  signalValue: { color: "#FFF9FC", fontSize: 13.5, fontWeight: "900", marginTop: 2 }, 
  signalUnit: { color: "#D8B4FE", fontSize: 7.5 }, 
  signalRule: { width: 1, height: 18, backgroundColor: "#64519B" },

  dailyRewardSection: { marginTop: 12, borderRadius: 20, backgroundColor: "rgba(25, 20, 48, 0.65)", borderWidth: 1.5, borderColor: "rgba(124, 92, 246, 0.35)", padding: 14 },
  dailyRewardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dailyRewardTitle: { color: "#FFF9FC", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  dailyRewardDayPill: { backgroundColor: "rgba(124, 92, 246, 0.25)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  dailyRewardDayPillText: { color: "#C4B5FD", fontSize: 8.5, fontWeight: "900" },
  dailyStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  dailyStatusBadgeReady: { backgroundColor: "rgba(255, 208, 0, 0.12)", borderColor: "rgba(255, 208, 0, 0.4)" },
  dailyStatusBadgeClaimed: { backgroundColor: "rgba(80, 227, 194, 0.12)", borderColor: "rgba(80, 227, 194, 0.4)" },
  dailyStatusBadgeText: { fontSize: 8.5, fontWeight: "900", letterSpacing: 0.5 },
  dailyDaysRow: { flexDirection: "row", gap: 5, marginTop: 10, width: "100%" },
  dailyDayCard: { flex: 1, minHeight: 64, borderRadius: 12, backgroundColor: "rgba(17, 13, 35, 0.6)", borderWidth: 1, borderColor: "rgba(124, 92, 246, 0.2)", alignItems: "center", justifyContent: "center", paddingVertical: 5, position: "relative" },
  dailyDayCardActive: { borderColor: "#00F5D4", backgroundColor: "rgba(0, 245, 212, 0.12)", borderWidth: 1.5, shadowColor: "#00F5D4", shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  dailyDayCardPast: { opacity: 0.7, borderColor: "rgba(80, 227, 194, 0.3)" },
  dailyDayCardClaimedToday: { borderColor: "rgba(80, 227, 194, 0.5)", backgroundColor: "rgba(80, 227, 194, 0.1)" },
  dailyDayCardEpic: { borderColor: "#FFC24A" },
  epicTag: { position: "absolute", top: -5, backgroundColor: "#FFC24A", paddingHorizontal: 3, borderRadius: 4 },
  epicTagText: { color: "#121025", fontSize: 6.5, fontWeight: "900" },
  dailyDayLabel: { color: "#A799C7", fontSize: 8, fontWeight: "800" },
  dailyDayIcon: { fontSize: 14, marginVertical: 2 },
  dailyDayAmount: { color: "#FFF9FC", fontSize: 8.5, fontWeight: "900" },
  dailyDayCheck: { position: "absolute", bottom: 2, right: 3, backgroundColor: "#50E3C2", width: 12, height: 12, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  dailyDayCheckText: { color: "#121025", fontSize: 8, fontWeight: "900", lineHeight: 10 },
  dailyClaimBtn: { marginTop: 10, backgroundColor: "#00F5D4", borderRadius: 12, paddingVertical: 9, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#00F5D4", shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  dailyClaimBtnIcon: { fontSize: 14 },
  dailyClaimBtnText: { color: "#121025", fontSize: 10.5, fontWeight: "900", letterSpacing: 0.5 },
  dailyClaimBtnArrow: { color: "#121025", fontSize: 12, fontWeight: "900" },
  dailyClaimedBar: { marginTop: 9, backgroundColor: "rgba(80, 227, 194, 0.08)", borderWidth: 1, borderColor: "rgba(80, 227, 194, 0.25)", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, alignItems: "center" },
  dailyClaimedBarText: { color: "#D1FAE5", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.3 },
  
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 8 }, 
  sectionTitle: { color: "#FFF9FC", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, 
  sectionMeta: { color: "#D8B4FE", fontSize: 8, fontWeight: "900", letterSpacing: 0.65 }, 
  
  cardsRow: { flexDirection: "row", gap: 10, width: "100%" },
  columnCard: { flex: 1, minHeight: 135, borderRadius: 20, borderWidth: 1.5, padding: 14, backgroundColor: "rgba(33, 26, 61, 0.4)" },
  cardIconCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cardIconText: { fontSize: 18, fontWeight: "900" },
  cardKicker: { fontSize: 8, fontWeight: "900", letterSpacing: 0.8, marginTop: 12 },
  cardTitle: { color: "#FFF9FC", fontSize: 13, fontWeight: "900", marginTop: 4, textShadowColor: "rgba(255, 255, 255, 0.15)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }, 
  cardBody: { color: "#E9D5FF", fontSize: 9, lineHeight: 13, marginTop: 4 },
  
  soloBanner: { borderRadius: 20, borderWidth: 1.5, borderColor: "rgba(124, 92, 246, 0.45)", backgroundColor: "rgba(31, 23, 60, 0.5)", overflow: "hidden", marginTop: 2 },
  soloSkin: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  soloTrophy: { fontSize: 26 },
  soloEyebrow: { color: "#FFD000", fontSize: 8, fontWeight: "900", letterSpacing: 0.9 },
  soloHeading: { color: "#FFF", fontSize: 13, fontWeight: "900", marginTop: 2 },
  soloDesc: { color: "#C4B5FD", fontSize: 9, lineHeight: 13, marginTop: 3 },
  soloArrow: { color: "#A78BFA", fontSize: 22, fontWeight: "300" },
  
  modeGrid: { flexDirection: "row", gap: 10 }, 
  modeNode: { flex: 1, minHeight: 110, borderRadius: 20, padding: 12, backgroundColor: "rgba(32, 26, 57, 0.4)", borderWidth: 1.5, justifyContent: "space-between" }, 
  modeNodeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modeSize: { fontSize: 18, fontWeight: "900", textShadowColor: "rgba(255, 255, 255, 0.1)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }, 
  modeMiniDot: { width: 8, height: 8, borderRadius: 4 },
  modeTitle: { color: "#FFF9FC", fontSize: 12, fontWeight: "900", marginTop: 8 }, 
  modeMeta: { color: "#DDD6FE", fontSize: 9, fontWeight: "800", marginTop: 2 },
  
  hubBannersRow: { flexDirection: "row", gap: 10, marginTop: 22, width: "100%" },
  hubBanner: { flex: 1, flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 18, borderWidth: 1, gap: 8 },
  missionsBanner: { backgroundColor: "rgba(255, 208, 0, 0.08)", borderColor: "rgba(255, 208, 0, 0.3)" },
  seasonBanner: { backgroundColor: "rgba(0, 245, 212, 0.08)", borderColor: "rgba(0, 245, 212, 0.3)" },
  hubBannerGlyph: { fontSize: 20 },
  hubBannerTitle: { color: "#FFF", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  hubBannerSub: { color: "#A799C7", fontSize: 8, marginTop: 2 },
  hubBannerArrow: { color: "#A799C7", fontSize: 14, fontWeight: "900" },
  hubBadgePill: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#EF4444",
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 4,
  },
  hubBadgePillText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  streakWarningPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1.5,
    borderColor: "#EF4444",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    gap: 8,
    shadowColor: "#EF4444",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  streakWarningIcon: { fontSize: 14 },
  streakWarningText: { flex: 1, color: "#FECACA", fontSize: 9.5, fontWeight: "900", letterSpacing: 0.3 },
  streakWarningArrow: { color: "#EF4444", fontSize: 13, fontWeight: "900" },

  milestoneBadgePill: {
    backgroundColor: "#FFC24A",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: "#FFC24A",
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 3,
  },
  milestoneBadgeText: { color: "#121025", fontSize: 9, fontWeight: "900", letterSpacing: 0.3 },

  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
