import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { type LeaderboardEntry } from "@/shared/game";
import { getLeagueTier, getRank, getPlayerLevel, getActiveCyberTitle, getDailyMysteryWord, THEME_PACKS, AVATARS, DAILY_LOGIN_REWARDS, getDayId, getCalculatedLives, type DailyChallenge, type PlayerProgress, type ThemePackId } from "@/shared/progression";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { PROFILE_FRAMES } from "@/shared/store-items";
import { palette } from "@/shared/palette";
import { GameButton, GameIcon, GemChip, ICONS, JewelTitle, OrnatePanel, SectionLabel } from "@/components/game-ui";

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
  onShowToast?: (title: string, subtitle: string, icon?: string, accentColor?: string) => void;
  onOpenModeInfo?: (mode: "pvp" | "daily" | "vintage" | "arcade" | "solo") => void;
  onOpenLivesModal?: () => void;
};

function InfoMini({ color, onPress }: { color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation();
        triggerHapticSelection();
        onPress();
      }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={({ pressed }) => [styles.infoMini, { borderColor: color, backgroundColor: `${color}22` }, pressed && { opacity: 0.7 }]}
    >
      <Text style={{ color, fontSize: 11, fontWeight: "900" }}>ⓘ</Text>
    </Pressable>
  );
}

export function CommandCenter({
  playerName,
  progress,
  daily,
  onPlayDaily,
  onPlayBot,
  onSolo,
  onNavigate,
  onShowGuide,
  unclaimedMilestonesCount = 0,
  onClaimDailyReward,
  onShowToast,
  onOpenModeInfo,
  onOpenLivesModal,
}: CommandCenterProps) {
  const orbit = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0.25)).current;
  const dailyRewardClaimingRef = useRef(false);
  const [livesCalc, setLivesCalc] = useState(() => getCalculatedLives(progress));
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [progress.avatarPhoto]);

  useEffect(() => {
    setLivesCalc(getCalculatedLives(progress));
    const interval = setInterval(() => {
      setLivesCalc(getCalculatedLives(progress));
    }, 5000);
    return () => clearInterval(interval);
  }, [progress]);
  const rank = getRank(progress);
  const league = getLeagueTier(progress);
  const leagueProgressPercent = league.tier === "RADIAN"
    ? 100
    : Math.min(100, Math.round((league.currentTierPoints / league.targetTierPoints) * 100));
  const activeTheme = THEME_PACKS.find((pack) => pack.id === (progress.selectedTheme || daily.themeId)) ?? THEME_PACKS[0]!;
  const mystery = getDailyMysteryWord();
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
      case "coins": return "ÇİP";
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
      if (onShowToast) {
        onShowToast(
          `🔒 SEVİYE ${requiredLevel} GEREKLİ`,
          `${size}×${size} modu Seviye ${requiredLevel}'de açılır (Şu an: Seviye ${currentLevel}).`,
          "🔒",
          "#EF4444"
        );
      } else {
        Alert.alert(
          `🔒 Seviye ${requiredLevel} Gerekli`,
          `${size}×${size} modu Seviye ${requiredLevel}'de açılır. Şu anki seviyeniz: ${currentLevel}.`
        );
      }
    } else {
      action();
    }
  };

  const handlePlayBot6 = makeLockedHandler(6, 5, () => onPlayBot(6));
  const handlePlayBot8 = makeLockedHandler(8, 8, () => onPlayBot(8));
  const handlePlayBot10 = makeLockedHandler(10, 10, () => onPlayBot(10));

  const activeAvatar = AVATARS.find((a) => a.id === progress.selectedAvatar) ?? AVATARS[0]!;
  const activeFrame = PROFILE_FRAMES.find((f) => f[0] === progress.selectedFrame);
  const activeFrameColor = activeFrame ? activeFrame[2] : (activeAvatar.color || palette.emerald);

  const [infoModal, setInfoModal] = useState<"shield" | "radar" | "lives" | "rotani" | null>(null);

  return <>
    <Modal
      visible={infoModal !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setInfoModal(null)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setInfoModal(null)}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 340 }}>
          <OrnatePanel contentStyle={{ alignItems: "center", paddingVertical: 22 }}>
            <View style={[
              styles.modalIconBadge,
              infoModal === "shield" ? styles.modalIconBadgeShield : infoModal === "radar" ? styles.modalIconBadgeRadar : infoModal === "lives" ? styles.modalIconBadgeLives : styles.modalIconBadgeRotani
            ]}>
              {infoModal === "shield" ? <Image source={ICONS.shield} style={styles.modalIconImg} /> :
                infoModal === "radar" ? <Image source={ICONS.radar} style={styles.modalIconImg} /> :
                infoModal === "lives" ? <Image source={ICONS.heart} style={styles.modalIconImg} /> :
                <Image source={ICONS.play} style={styles.modalIconImg} />}
            </View>

            <Text style={styles.modalKicker}>
              {infoModal === "shield" ? "SAVUNMA YÜZÜĞÜ" : infoModal === "radar" ? "KEŞİF KRİSTALİ" : infoModal === "lives" ? "YAŞAM ALEVİ" : "MACERA MERKEZİ · SEZON 01"}
            </Text>
            <Text style={styles.modalTitle}>
              {infoModal === "shield" ? "Seri Kalkanı" : infoModal === "radar" ? "Siber Radar" : infoModal === "lives" ? "Siber Can" : "Rotanı Ateşle Nedir?"}
            </Text>

            <View style={styles.modalCountPill}>
              <Text style={styles.modalCountLabel}>
                {infoModal === "rotani" ? "MEVCUT LİG KADEMEN:" : "MEVCUT MİKTAR:"}
              </Text>
              <Text style={[styles.modalCountValue, infoModal === "shield" ? { color: palette.gemBlue } : infoModal === "radar" ? { color: palette.emerald } : infoModal === "lives" ? { color: palette.gemGreen } : { color: league.color }]}>
                {infoModal === "shield" ? (progress.streakShields ?? 1) : infoModal === "radar" ? (3 + (progress.radarChargesBonus ?? 0)) : infoModal === "lives" ? `${livesCalc.lives}/5` : `${league.name} (${league.currentTierPoints} LP)`}
              </Text>
            </View>

            <Text style={styles.modalBody}>
              {infoModal === "shield"
                ? "Oyuna giremediğin veya günlük rotayı tamamlayamadığın günlerde otomatik olarak 1 Seri Kalkanı tüketilir. Böylece günlük galibiyet serin sıfırlanmaz ve korunur."
                : infoModal === "radar"
                ? "Tek oyunculu seviyelerde ve Günlük Rota bulmacalarında tahtadaki gizli kelimelerin baş ve son harflerini tespit eder. Sıkıştığın anlarda doğru rotayı bularak zaman kazandırır."
                : infoModal === "lives"
                ? "Tek oyunculu solo seviyelerde veya zamana karşı denemelerde başarısız olduğunda 1 Can kaybedersin. Canların bittiğinde 15 dakikada bir otomatik dolar veya Çip ile anında yenileyebilirsin."
                : "Rotanı Ateşle güverte kartı, oyunun ana rekabet merkezidir! 4x4 ile 10x10 arası hızlı bot düellolarına girebilir, Günün Rotası sabit tahtasını çözebilir veya Lig & Kademe merdiveninde 3D amblemler kazanmak için LP biriktirebilirsin."}
            </Text>

            <View style={styles.modalTipBox}>
              <Text style={styles.modalTipTitle}>💡 REKABET REHBERİ</Text>
              <Text style={styles.modalTipText}>
                {infoModal === "shield"
                  ? "• Mağaza'dan Çip ile satın alabilirsin.\n• Haftalık görevleri tamamlayarak kazanabilirsin.\n• 7 günlük giriş zincirinin son gününde epik hediye olarak verilir."
                  : infoModal === "radar"
                  ? "• Her seviyede 3 temel hak otomatik verilir.\n• Mağaza ve görevlerden ek kalıcı bonus haklar elde edebilirsin.\n• Seviye içi gizli sandıkları çözerek ekstra hak toplayabilirsin."
                  : infoModal === "lives"
                  ? "• Her 30 dakikada 1 Can otomatik olarak ücretsiz doldurulur (Maks 5).\n• Beklemek istemiyorsan Mağaza'dan Çip ile anında doldurabilirsin.\n• Günlük giriş ve seviye ödüllerinden bedava Can kazanabilirsin."
                  : "• Galibiyet kazanarak lig puanı (LP) topla ve Demir'den Radian'a yüksel.\n• Günün rotasında sabit tahtayı tamamlayarak ekstra Sezon XP elde et.\n• En yüksek kelime temposu (K/DK) yakalayarak liderlik sıralamasına gir."}
              </Text>
            </View>

            <GameButton
              label={infoModal === "shield" || infoModal === "lives" ? "MAĞAZADA İNCELE" : infoModal === "rotani" ? "LİG & KADEMELER" : "ANLADIM"}
              variant={infoModal === "rotani" ? "emerald" : "gold"}
              size="md"
              onPress={() => {
                const target = infoModal;
                setInfoModal(null);
                if (target === "lives") {
                  if (onOpenLivesModal) onOpenLivesModal();
                  else onNavigate("store");
                } else if (target === "shield") {
                  onNavigate("store");
                } else if (target === "rotani") {
                  onNavigate("league");
                }
              }}
              style={{ alignSelf: "stretch" }}
            />

            {(infoModal === "shield" || infoModal === "lives" || infoModal === "rotani") && (
              <Pressable onPress={() => setInfoModal(null)} style={styles.modalSecondaryBtn}>
                <Text style={styles.modalSecondaryBtnText}>KAPAT</Text>
              </Pressable>
            )}
          </OrnatePanel>
        </Pressable>
      </Pressable>
    </Modal>

    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#1A4A38", "#0E2C22"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hud}>
        <View style={styles.hudInner}>
          <Pressable onPress={() => onNavigate("profile")} style={({ pressed }) => [styles.identity, pressed && styles.pressed]}>
            <View style={[styles.avatar, { borderColor: activeFrameColor, backgroundColor: activeAvatar.surface }]}>
              {progress.avatarPhoto && !imgError ? (
                <Image
                  source={{ uri: progress.avatarPhoto }}
                  style={styles.avatarImage}
                  onError={() => setImgError(true)}
                />
              ) : (
                <Text style={[styles.avatarText, { color: activeAvatar.color }]}>{activeAvatar.icon}</Text>
              )}
            </View>
            <View style={styles.identityMeta}>
              <Text numberOfLines={1} style={styles.name}>{playerName}</Text>
              <View style={styles.rankRow}>
                <View style={styles.titlePill}>
                  <Text numberOfLines={1} style={styles.cyberBadge}>{getActiveCyberTitle(progress)}</Text>
                </View>
                <Text numberOfLines={1} style={styles.rank}>Sv. {getPlayerLevel(progress.xp)} · {rank}</Text>
              </View>
            </View>
          </Pressable>

          <View style={styles.topActionsGroup}>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                setInfoModal("lives");
              }}
              style={({ pressed }) => [styles.livesHeaderPill, pressed && styles.pressed]}
            >
              <Image source={ICONS.heart} style={styles.livesHeaderIcon} />
              <Text style={styles.livesHeaderValue}>{livesCalc.lives}/5</Text>
            </Pressable>
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
      </LinearGradient>

      <View style={styles.resourceRow}>
        <GemChip
          iconSource={ICONS.shield}
          label="KALKAN"
          value={progress.streakShields ?? 1}
          color={palette.gemBlue}
          onPress={() => { triggerHapticSelection(); setInfoModal("shield"); }}
        />
        <GemChip
          iconSource={ICONS.radar}
          label="RADAR"
          value={progress.radarChargesBonus ?? 0}
          color={palette.emerald}
          onPress={() => { triggerHapticSelection(); setInfoModal("radar"); }}
        />
        <GemChip
          iconSource={ICONS.coin}
          label="ÇİP"
          value={progress.coins ?? 0}
          color={palette.gold}
          plus
          badge={!isClaimedToday}
          onPress={() => onNavigate("store")}
        />
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

      <OrnatePanel style={{ marginTop: 12 }}>
        <Animated.View style={[styles.orbit, { transform: [{ rotate: orbitSpin }] }]}><View style={styles.orbitNode} /></Animated.View>
        <Animated.View style={[
          styles.radarRing,
          {
            borderColor: palette.gold,
            transform: [
              { scale: shimmer.interpolate({ inputRange: [0.25, 0.86], outputRange: [0.95, 1.55] }) }
            ],
            opacity: shimmer.interpolate({ inputRange: [0.25, 0.86], outputRange: [0.45, 0] })
          }
        ]} />
        <View style={styles.heroHead}>
          <Text style={styles.deckEyebrow}>KELİME MACERASI · SEZON 01</Text>
          <InfoMini color={palette.gold} onPress={() => setInfoModal("rotani")} />
        </View>
        <JewelTitle>ROTANI{"\n"}ATEŞLE</JewelTitle>
        <Text style={styles.deckBody}>Hızlı düello seç, günün rotasını bitir veya lig merdivenine tırman.</Text>

        <View style={styles.xpPanel}>
          <View style={styles.xpHead}>
            <Text style={styles.xpLabel}>LİG · {league.name}</Text>
            <Text style={styles.xpValue}>{league.currentTierPoints} / {league.targetTierPoints} LP</Text>
          </View>
          <View style={styles.track}>
            <LinearGradient
              colors={[league.color, palette.goldHi]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.trackFill, { width: `${Math.max(8, leagueProgressPercent)}%` }]}
            />
          </View>
        </View>

        <View style={styles.heroActions}>
          <GameButton
            label="HIZLI DÜELLO"
            iconSource={ICONS.play}
            onPress={() => onPlayBot(4)}
            style={{ flex: 1.15 }}
          />
          <GameButton
            label="DAVET ET"
            icon="🤝"
            variant="dark"
            onPress={() => onNavigate("online")}
            style={{ flex: 1 }}
          />
        </View>

        <View style={styles.signalFooter}>
          <View style={styles.footerCol}>
            <Text style={styles.signalLabel}>ORT. TEMPO</Text>
            <Text style={styles.signalValue}>{progress.bestTempo || 0} <Text style={styles.signalUnit}>K/DK</Text></Text>
          </View>
          <View style={styles.signalRule} />
          <Pressable onPress={() => onNavigate("league")} style={styles.footerCol}>
            <Text style={styles.signalLabel}>GALİBİYET</Text>
            <Text style={styles.signalValue}>{progress.wins} <Text style={styles.signalUnit}>MAÇ</Text></Text>
          </Pressable>
        </View>
      </OrnatePanel>

      <OrnatePanel style={{ marginTop: 12 }} contentStyle={{ padding: 14 }}>
        <View style={styles.dailyRewardHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.dailyRewardTitle}>🎁 GÜNLÜK HAZİNE</Text>
            <View style={styles.dailyRewardDayPill}>
              <Text style={styles.dailyRewardDayPillText}>GÜN {displayDayNumber}/7</Text>
            </View>
          </View>
          <View style={[styles.dailyStatusBadge, isClaimedToday ? styles.dailyStatusBadgeClaimed : styles.dailyStatusBadgeReady]}>
            <Text style={[styles.dailyStatusBadgeText, isClaimedToday ? { color: palette.emerald } : { color: palette.gold }]}>
              {isClaimedToday ? "✓ ALINDI" : "⚡ HAZIR"}
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
                <Text style={[styles.dailyDayLabel, isTodayClaimable && { color: palette.gold, fontWeight: "900" }]}>
                  {item.day}G
                </Text>
                <Text style={styles.dailyDayIcon}>{item.icon}</Text>
                <Text style={[styles.dailyDayAmount, isEpic && { color: palette.gold }]}>
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
          <GameButton
            label={`ÖDÜLÜ TOPLA  +${todayReward.amount} ${getRewardUnitName(todayReward.rewardType)}`}
            icon="🎁"
            size="md"
            onPress={() => {
              if (dailyRewardClaimingRef.current || isClaimedToday) return;
              dailyRewardClaimingRef.current = true;
              triggerHapticSelection();
              onClaimDailyReward?.();
            }}
            style={{ marginTop: 12 }}
          />
        ) : (
          <View style={styles.dailyClaimedBar}>
            <Text style={styles.dailyClaimedBarText}>
              ✓ Bugünkü ödülünü aldın! Yarın: {nextReward.icon} +{nextReward.amount} {getRewardUnitName(nextReward.rewardType)}
            </Text>
          </View>
        )}
      </OrnatePanel>

      <SectionLabel title="ETKİNLİKLER" meta="ÖZEL GÖREVLER" />

      <OrnatePanel accent="emerald" contentStyle={{ padding: 14 }}>
        <View style={styles.mysteryHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
            <Text style={styles.mysteryKicker}>🔍 GİZEMLİ KELİME</Text>
            <View style={styles.mysteryPill}>
              <Text style={styles.mysteryPillText}>İPUCU</Text>
            </View>
          </View>
          <Text style={styles.mysteryReward}>+{mystery.rewardXp} XP</Text>
        </View>
        <Text style={styles.mysteryDef}>"{mystery.definition}"</Text>
        <Text style={styles.mysteryHint}>
          💡 Bu tanıma uyan kelimeyi herhangi bir tahtada bul ve extra XP kazan!
        </Text>
      </OrnatePanel>

      <View style={styles.cardsRow}>
        <Pressable onPress={onPlayDaily} style={({ pressed }) => [styles.columnCardWrap, pressed && styles.pressed]}>
          <LinearGradient colors={["#1A4A38", "#0C2A20"]} style={[styles.columnCard, { borderColor: dailyDone ? palette.bronzeDark : activeTheme.accent }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <View style={[styles.cardIconCircle, { borderColor: dailyDone ? palette.bronze : activeTheme.accent, backgroundColor: dailyDone ? palette.panelInner : activeTheme.glow }]}>
                <Text style={[styles.cardIconText, { color: dailyDone ? palette.muted : activeTheme.accent }]}>{activeTheme.icon}</Text>
              </View>
              <InfoMini color={activeTheme.accent} onPress={() => onOpenModeInfo?.("daily")} />
            </View>
            <Text style={[styles.cardKicker, { color: dailyDone ? palette.muted : activeTheme.accent }]}>{dailyDone ? "SABİT ROTA" : "BUGÜNÜN ROTASI"}</Text>
            <Text style={styles.cardTitle}>{dailyDone ? "TAMAMLANDI" : daily.title.toLocaleUpperCase("tr-TR")}</Text>
            <Text style={styles.cardBody}>{dailyDone ? "Günün rotasını tekrar incele." : "Kelime paketini seç ve günün rotasını başlat!"}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => onNavigate("arcade")} style={({ pressed }) => [styles.columnCardWrap, pressed && styles.pressed]}>
          <LinearGradient colors={["#3A2A12", "#1A1408"]} style={[styles.columnCard, { borderColor: palette.gold }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <View style={[styles.cardIconCircle, { borderColor: palette.gold, backgroundColor: "rgba(244, 208, 111, 0.16)" }]}>
                <Text style={[styles.cardIconText, { color: palette.gold }]}>⚡</Text>
              </View>
              <InfoMini color={palette.gold} onPress={() => onOpenModeInfo?.("arcade")} />
            </View>
            <Text style={[styles.cardKicker, { color: palette.gold }]}>ARCADE</Text>
            <Text style={styles.cardTitle}>SKOR YARIŞI</Text>
            <Text style={styles.cardBody}>Süre dolmadan en çok kelimeyi bağla ve rekor kır!</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <SectionLabel title="TEK OYUNCU" meta="SEVİYE YOLU" />
      <Pressable onPress={onSolo} style={({ pressed }) => [pressed && styles.pressed]}>
        <OrnatePanel contentStyle={styles.soloSkin}>
          <GameIcon source={ICONS.trophy} size={48} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                <Text style={styles.soloEyebrow}>KLASİK MOD</Text>
                {unclaimedMilestonesCount > 0 && (
                  <View style={styles.milestoneBadgePill}>
                    <Text style={styles.milestoneBadgeText}>🎁 {unclaimedMilestonesCount} SANDIK</Text>
                  </View>
                )}
              </View>
              <InfoMini color={palette.emerald} onPress={() => onOpenModeInfo?.("solo")} />
            </View>
            <Text style={styles.soloHeading}>SEVİYE YOLCULUĞU</Text>
            <Text style={styles.soloDesc}>
              {unclaimedMilestonesCount > 0
                ? `${unclaimedMilestonesCount} adet açılmayı bekleyen ödül sandığı seni bekliyor!`
                : "Seviye seviye zorlaşan kelime operasyonları. Ustalık kazan ve tüm seviyeleri aç."}
            </Text>
          </View>
          <Text style={styles.soloArrow}>›</Text>
        </OrnatePanel>
      </Pressable>

      <SectionLabel title="NOSTALJİ" meta="GAZETE BULMACASI" />
      <Pressable onPress={() => onNavigate("vintage" as any)} style={({ pressed }) => [pressed && styles.pressed]}>
        <OrnatePanel contentStyle={styles.soloSkin}>
          <GameIcon emoji="🗞️" size={48} glow={palette.warning} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                <Text style={[styles.soloEyebrow, { color: palette.warning }]}>KARE BULMACA</Text>
                <View style={[styles.milestoneBadgePill, { backgroundColor: palette.warning }]}>
                  <Text style={styles.milestoneBadgeText}>20 BÖLÜM</Text>
                </View>
              </View>
              <InfoMini color={palette.warning} onPress={() => onOpenModeInfo?.("vintage")} />
            </View>
            <Text style={styles.soloHeading}>GAZETE BULMACASI</Text>
            <Text style={styles.soloDesc}>
              Gazetedeki kare bulmaca ipuçlarını çöz, harf taşlarını 10×10 tahtaya yerleştir ve bonus XP kazan!
            </Text>
          </View>
          <Text style={[styles.soloArrow, { color: palette.warning }]}>›</Text>
        </OrnatePanel>
      </Pressable>

      <SectionLabel title="DERECELİ DÜELLO" />
      <View style={styles.modeGrid}>
        <Pressable onPress={() => onPlayBot(4)} style={({ pressed }) => [styles.modeNodeWrap, pressed && styles.pressed]}>
          <LinearGradient colors={["#165C48", "#0C2A20"]} style={[styles.modeNode, { borderColor: palette.emerald }]}>
            <View style={styles.modeNodeHeader}>
              <Text numberOfLines={1} style={[styles.modeSize, { color: palette.emerald }]}>4×4</Text>
              <View style={[styles.modeMiniDot, { backgroundColor: palette.emerald }]} />
            </View>
            <Text numberOfLines={1} style={styles.modeTitle}>Hızlı</Text>
            <Text numberOfLines={1} style={styles.modeMeta}>55 SN</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handlePlayBot6} style={({ pressed }) => [styles.modeNodeWrap, { opacity: isLocked6 ? 0.75 : 1 }, pressed && styles.pressed]}>
          <LinearGradient colors={["#1E4A3C", "#0C2A20"]} style={[styles.modeNode, { borderColor: isLocked6 ? "#3D5C4A" : palette.gemBlue }]}>
            <View style={styles.modeNodeHeader}>
              <Text numberOfLines={1} style={[styles.modeSize, { color: isLocked6 ? "#6B7280" : palette.gemBlue }]}>{isLocked6 ? "🔒 6×6" : "6×6"}</Text>
              <View style={[styles.modeMiniDot, { backgroundColor: isLocked6 ? "#6B7280" : palette.gemBlue }]} />
            </View>
            <Text numberOfLines={1} style={styles.modeTitle}>{isLocked6 ? "Kilitli" : "Akış"}</Text>
            <Text numberOfLines={1} style={styles.modeMeta}>{isLocked6 ? `Sev. ${currentLevel}/5` : "75 SN"}</Text>
            {isLocked6 && (
              <View style={styles.lockTrack}>
                <View style={{ width: `${Math.min(100, (currentLevel / 5) * 100)}%`, height: "100%", backgroundColor: palette.gemBlue }} />
              </View>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handlePlayBot8} style={({ pressed }) => [styles.modeNodeWrap, { opacity: isLocked8 ? 0.75 : 1 }, pressed && styles.pressed]}>
          <LinearGradient colors={["#3A2A12", "#1A1408"]} style={[styles.modeNode, { borderColor: isLocked8 ? "#3D5C4A" : palette.gold }]}>
            <View style={styles.modeNodeHeader}>
              <Text numberOfLines={1} style={[styles.modeSize, { color: isLocked8 ? "#6B7280" : palette.gold }]}>{isLocked8 ? "🔒 8×8" : "8×8"}</Text>
              <View style={[styles.modeMiniDot, { backgroundColor: isLocked8 ? "#6B7280" : palette.gold }]} />
            </View>
            <Text numberOfLines={1} style={styles.modeTitle}>{isLocked8 ? "Kilitli" : "Derin"}</Text>
            <Text numberOfLines={1} style={styles.modeMeta}>{isLocked8 ? `Sev. ${currentLevel}/8` : "90 SN"}</Text>
            {isLocked8 && (
              <View style={styles.lockTrack}>
                <View style={{ width: `${Math.min(100, (currentLevel / 8) * 100)}%`, height: "100%", backgroundColor: palette.gold }} />
              </View>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handlePlayBot10} style={({ pressed }) => [styles.modeNodeWrap, { opacity: isLocked10 ? 0.75 : 1 }, pressed && styles.pressed]}>
          <LinearGradient colors={["#3A1A22", "#1A0C12"]} style={[styles.modeNode, { borderColor: isLocked10 ? "#3D5C4A" : palette.gemRuby }]}>
            <View style={styles.modeNodeHeader}>
              <Text numberOfLines={1} style={[styles.modeSize, { color: isLocked10 ? "#6B7280" : palette.gemRuby }]}>{isLocked10 ? "🔒 10×10" : "10×10"}</Text>
              <View style={[styles.modeMiniDot, { backgroundColor: isLocked10 ? "#6B7280" : palette.gemRuby }]} />
            </View>
            <Text numberOfLines={1} style={styles.modeTitle}>{isLocked10 ? "Kilitli" : "Usta"}</Text>
            <Text numberOfLines={1} style={styles.modeMeta}>{isLocked10 ? `Sev. ${currentLevel}/10` : "110 SN"}</Text>
            {isLocked10 && (
              <View style={styles.lockTrack}>
                <View style={{ width: `${Math.min(100, (currentLevel / 10) * 100)}%`, height: "100%", backgroundColor: palette.gemRuby }} />
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </ScrollView>
  </>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 148 },
  hud: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: palette.bronzeBorder,
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  hudInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  identity: { flexDirection: "row", gap: 8, alignItems: "center", flex: 1, minWidth: 0 },
  identityMeta: { flex: 1, minWidth: 0 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatarImage: { width: "100%", height: "100%", borderRadius: 18 },
  avatarText: { color: palette.cream, fontWeight: "900", fontSize: 16 },
  name: { color: palette.cream, fontSize: 13, fontWeight: "900", letterSpacing: 0.2 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  titlePill: {
    maxWidth: "46%",
    backgroundColor: "rgba(244, 208, 111, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(244, 208, 111, 0.45)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  cyberBadge: { color: palette.gold, fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
  rank: { flexShrink: 1, color: palette.mutedGold, fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },

  topActionsGroup: { flexDirection: "row", gap: 5, alignItems: "center", flexShrink: 0 },
  topIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(184, 134, 58, 0.2)",
    borderWidth: 1.5,
    borderColor: palette.bronzeBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  topIconText: { fontSize: 13 },
  livesHeaderPill: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255, 107, 129, 0.16)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 107, 129, 0.55)",
    paddingHorizontal: 7,
    borderRadius: 15,
  },
  livesHeaderIcon: { width: 16, height: 16 },
  livesHeaderValue: { color: palette.heart, fontSize: 11, fontWeight: "900" },

  resourceRow: { flexDirection: "row", gap: 7, alignItems: "center", marginTop: 2 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(4, 17, 12, 0.86)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    overflow: "hidden",
  },
  modalIconBadgeShield: { borderColor: palette.gemBlue },
  modalIconBadgeRadar: { borderColor: palette.emerald },
  modalIconBadgeLives: { borderColor: palette.heart },
  modalIconBadgeRotani: { borderColor: palette.gold },
  modalIconImg: { width: 64, height: 64 },
  modalKicker: {
    color: palette.gold,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.1,
    textAlign: "center",
  },
  modalTitle: {
    color: palette.cream,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  modalCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 248, 231, 0.06)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 58, 0.35)",
  },
  modalCountLabel: { color: palette.mutedGold, fontSize: 9.5, fontWeight: "800", letterSpacing: 0.5 },
  modalCountValue: { fontSize: 13, fontWeight: "900" },
  modalBody: {
    color: palette.cream,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 14,
  },
  modalTipBox: {
    width: "100%",
    backgroundColor: "rgba(7, 26, 20, 0.8)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 58, 0.35)",
    marginBottom: 16,
  },
  modalTipTitle: {
    color: palette.gold,
    fontSize: 9.5,
    fontWeight: "900",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalTipText: {
    color: palette.muted,
    fontSize: 10.5,
    lineHeight: 16,
    fontWeight: "600",
  },
  modalSecondaryBtn: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 16 },
  modalSecondaryBtnText: { color: palette.muted, fontSize: 11, fontWeight: "800" },

  heroHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  radarRing: { position: "absolute", right: -18, top: -22, width: 120, height: 120, borderRadius: 60, borderWidth: 1.5, zIndex: 1 },
  orbit: { position: "absolute", right: -18, top: -22, width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: palette.bronze, justifyContent: "flex-start", alignItems: "center", zIndex: 2 },
  orbitNode: { width: 12, height: 12, borderRadius: 6, marginTop: -6, backgroundColor: palette.gold, shadowColor: palette.gold, shadowOpacity: 0.9, shadowRadius: 10, elevation: 5 },
  deckEyebrow: { color: palette.gold, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  deckBody: { color: palette.mutedGold, fontSize: 11, lineHeight: 15, marginTop: 6, maxWidth: 240 },
  xpPanel: { marginTop: 12, borderRadius: 12, backgroundColor: "rgba(7, 26, 20, 0.55)", borderWidth: 1, borderColor: palette.bronzeBorder, padding: 9 },
  xpHead: { flexDirection: "row", justifyContent: "space-between" },
  xpLabel: { color: palette.mutedGold, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  xpValue: { color: palette.cream, fontSize: 8, fontWeight: "900" },
  track: { height: 7, marginTop: 6, borderRadius: 4, overflow: "hidden", backgroundColor: "#1A3328" },
  trackFill: { height: "100%", borderRadius: 4 },
  heroActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  signalFooter: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
  footerCol: { flex: 1, alignItems: "center" },
  signalLabel: { color: palette.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  signalValue: { color: palette.cream, fontSize: 14, fontWeight: "900", marginTop: 2 },
  signalUnit: { color: palette.gold, fontSize: 8 },
  signalRule: { width: 1, height: 18, backgroundColor: palette.bronzeBorder },

  dailyRewardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dailyRewardTitle: { color: palette.cream, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  dailyRewardDayPill: { backgroundColor: "rgba(184, 134, 58, 0.28)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: palette.bronzeBorder },
  dailyRewardDayPillText: { color: palette.gold, fontSize: 8.5, fontWeight: "900" },
  dailyStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  dailyStatusBadgeReady: { backgroundColor: "rgba(244, 208, 111, 0.14)", borderColor: "rgba(244, 208, 111, 0.5)" },
  dailyStatusBadgeClaimed: { backgroundColor: "rgba(62, 232, 181, 0.12)", borderColor: "rgba(62, 232, 181, 0.4)" },
  dailyStatusBadgeText: { fontSize: 8.5, fontWeight: "900", letterSpacing: 0.5 },
  dailyDaysRow: { flexDirection: "row", gap: 5, marginTop: 10, width: "100%" },
  dailyDayCard: {
    flex: 1,
    minHeight: 68,
    borderRadius: 14,
    backgroundColor: palette.panelInner,
    borderWidth: 1.5,
    borderColor: palette.bronzeDark,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    position: "relative",
  },
  dailyDayCardActive: {
    borderColor: palette.gold,
    backgroundColor: "#1A3A20",
    borderWidth: 2,
    shadowColor: palette.gold,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  dailyDayCardPast: { opacity: 0.7, borderColor: "rgba(62, 232, 181, 0.4)", backgroundColor: "#0C221A" },
  dailyDayCardClaimedToday: { borderColor: palette.emerald, backgroundColor: "#0E3330" },
  dailyDayCardEpic: { borderColor: palette.gold },
  epicTag: { position: "absolute", top: -6, backgroundColor: palette.gold, paddingHorizontal: 4, borderRadius: 5 },
  epicTagText: { color: "#3A2408", fontSize: 6.5, fontWeight: "900" },
  dailyDayLabel: { color: palette.muted, fontSize: 8, fontWeight: "800" },
  dailyDayIcon: { fontSize: 14, marginVertical: 2 },
  dailyDayAmount: { color: palette.cream, fontSize: 8.5, fontWeight: "900" },
  dailyDayCheck: { position: "absolute", bottom: 2, right: 3, backgroundColor: palette.emerald, width: 12, height: 12, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  dailyDayCheckText: { color: "#071A14", fontSize: 8, fontWeight: "900", lineHeight: 10 },
  dailyClaimedBar: { marginTop: 10, backgroundColor: "rgba(62, 232, 181, 0.08)", borderWidth: 1, borderColor: "rgba(62, 232, 181, 0.28)", borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10, alignItems: "center" },
  dailyClaimedBarText: { color: palette.mint, fontSize: 8.5, fontWeight: "800", letterSpacing: 0.3 },

  cardsRow: { flexDirection: "row", gap: 10, width: "100%", marginTop: 4 },
  columnCardWrap: { flex: 1 },
  columnCard: {
    minHeight: 148,
    borderRadius: 20,
    borderWidth: 2,
    padding: 12,
  },
  cardIconCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  cardIconText: { fontSize: 18, fontWeight: "900" },
  cardKicker: { fontSize: 8, fontWeight: "900", letterSpacing: 0.8, marginTop: 12 },
  cardTitle: { color: palette.cream, fontSize: 13, fontWeight: "900", marginTop: 4, textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  cardBody: { color: palette.muted, fontSize: 9.5, lineHeight: 13, marginTop: 4 },

  soloSkin: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  soloEyebrow: { color: palette.gold, fontSize: 8, fontWeight: "900", letterSpacing: 0.9 },
  soloHeading: { color: palette.cream, fontSize: 14, fontWeight: "900", marginTop: 2 },
  soloDesc: { color: palette.muted, fontSize: 9.5, lineHeight: 13, marginTop: 3 },
  soloArrow: { color: palette.gold, fontSize: 26, fontWeight: "300" },

  modeGrid: { flexDirection: "row", gap: 6, width: "100%" },
  modeNodeWrap: { flex: 1 },
  modeNode: { minHeight: 100, borderRadius: 16, padding: 8, borderWidth: 2, justifyContent: "space-between" },
  modeNodeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modeSize: { fontSize: 14, fontWeight: "900", textShadowColor: "rgba(0,0,0,0.35)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  modeMiniDot: { width: 7, height: 7, borderRadius: 4, shadowOpacity: 0.8, shadowRadius: 4 },
  modeTitle: { color: palette.cream, fontSize: 11, fontWeight: "900", marginTop: 4 },
  modeMeta: { color: palette.mutedGold, fontSize: 8, fontWeight: "800", marginTop: 1 },
  lockTrack: { width: "100%", height: 3, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 3, overflow: "hidden" },

  streakWarningPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.16)",
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
    backgroundColor: palette.gold,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: palette.gold,
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 3,
  },
  milestoneBadgeText: { color: "#3A2408", fontSize: 9, fontWeight: "900", letterSpacing: 0.3 },

  mysteryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  mysteryKicker: { color: palette.mint, fontSize: 9.5, fontWeight: "900", letterSpacing: 0.8 },
  mysteryPill: {
    backgroundColor: "rgba(62, 232, 181, 0.18)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(62, 232, 181, 0.45)",
  },
  mysteryPillText: { color: palette.mint, fontSize: 7.5, fontWeight: "900", letterSpacing: 0.5 },
  mysteryReward: { color: palette.gold, fontSize: 9.5, fontWeight: "900", letterSpacing: 0.5 },
  mysteryDef: { color: palette.cream, fontSize: 13, fontWeight: "700", fontStyle: "italic", lineHeight: 18 },
  mysteryHint: { color: palette.muted, fontSize: 8.5, fontWeight: "800", marginTop: 6 },

  infoMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },

  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
