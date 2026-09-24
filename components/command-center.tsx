import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { type LeaderboardEntry } from "@/shared/game";
import { getLeagueTier, getRank, getPlayerLevel, getActiveCyberTitle, getDailyMysteryWord, THEME_PACKS, AVATARS, getDayId, getCalculatedLives, type DailyChallenge, type PlayerProgress, type ThemePackId } from "@/shared/progression";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { PROFILE_FRAMES } from "@/shared/store-items";
import { palette } from "@/shared/palette";
import { GameButton, GameIcon, GemChip, ICONS, JewelTitle, OrnatePanel, SectionLabel } from "@/components/game-ui";
import { MatchHistoryModal } from "@/components/match-history-modal";
import { DailyTreasureModal } from "@/components/daily-treasure-modal";

type NavKey = "home" | "online" | "profile" | "arcade" | "levels" | "store" | "season" | "league" | "missions" | "friends" | "vintage";

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
  onOpenHistory?: () => void;
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
  unclaimedMissionsCount = 0,
  unclaimedMilestonesCount = 0,
  onClaimDailyReward,
  onShowToast,
  onOpenModeInfo,
  onOpenLivesModal,
  onOpenHistory,
}: CommandCenterProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDailyRewardModal, setShowDailyRewardModal] = useState(false);
  const hasAutoOpenedDailyRewardRef = useRef(false);
  const orbit = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0.25)).current;
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

  useEffect(() => {
    if (!isClaimedToday && !hasAutoOpenedDailyRewardRef.current) {
      hasAutoOpenedDailyRewardRef.current = true;
      const timer = setTimeout(() => {
        setShowDailyRewardModal(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isClaimedToday]);

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
  const activeAvatar = AVATARS.find((a) => a.id === progress.selectedAvatar) ?? AVATARS[0]!;
  const activeFrame = PROFILE_FRAMES.find((f) => f[0] === progress.selectedFrame);
  const activeFrameColor = activeFrame ? activeFrame[2] : (activeAvatar.color || palette.emerald);

  const [infoModal, setInfoModal] = useState<"shield" | "radar" | "lives" | "rotani" | "mystery" | null>(null);

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
              infoModal === "shield" ? styles.modalIconBadgeShield : infoModal === "radar" ? styles.modalIconBadgeRadar : infoModal === "lives" ? styles.modalIconBadgeLives : infoModal === "mystery" ? styles.modalIconBadgeMystery : styles.modalIconBadgeRotani
            ]}>
              {infoModal === "shield" ? <Image source={ICONS.shield} style={styles.modalIconImg} /> :
                infoModal === "radar" ? <Image source={ICONS.radar} style={styles.modalIconImg} /> :
                infoModal === "lives" ? <Image source={ICONS.heart} style={styles.modalIconImg} /> :
                infoModal === "mystery" ? <Text style={{ fontSize: 24 }}>🔍</Text> :
                <Image source={ICONS.play} style={styles.modalIconImg} />}
            </View>

            <Text style={styles.modalKicker}>
              {infoModal === "shield" ? "SAVUNMA YÜZÜĞÜ" : infoModal === "radar" ? "KEŞİF KRİSTALİ" : infoModal === "lives" ? "YAŞAM ALEVİ" : infoModal === "mystery" ? "GÜNLÜK ÖZEL GÖREV" : "MACERA MERKEZİ · SEZON 01"}
            </Text>
            <Text style={styles.modalTitle}>
              {infoModal === "shield" ? "Seri Kalkanı" : infoModal === "radar" ? "Siber Radar" : infoModal === "lives" ? "Siber Can" : infoModal === "mystery" ? "Gizemli Kelime" : "Rotanı Ateşle Nedir?"}
            </Text>

            <View style={styles.modalCountPill}>
              <Text style={styles.modalCountLabel}>
                {infoModal === "rotani" ? "MEVCUT LİG KADEMEN:" : infoModal === "mystery" ? "GÖREV ÖDÜLÜ:" : "MEVCUT MİKTAR:"}
              </Text>
              <Text style={[styles.modalCountValue, infoModal === "shield" ? { color: palette.gemBlue } : infoModal === "radar" ? { color: palette.emerald } : infoModal === "lives" ? { color: palette.gemGreen } : infoModal === "mystery" ? { color: "#38BDF8" } : { color: league.color }]}>
                {infoModal === "shield" ? (progress.streakShields || 0) : infoModal === "radar" ? (3 + (progress.radarChargesBonus || 0)) : infoModal === "lives" ? `${livesCalc.lives}/5` : infoModal === "mystery" ? `+${mystery.rewardXp} XP` : `${league.name} (${league.currentTierPoints} LP)`}
              </Text>
            </View>

            <Text style={styles.modalBody}>
              {infoModal === "shield"
                ? "Oyuna giremediğin veya günlük rotayı tamamlayamadığın günlerde otomatik olarak 1 Seri Kalkanı tüketilir. Böylece günlük galibiyet serin sıfırlanmaz ve korunur."
                : infoModal === "radar"
                ? "Tek oyunculu seviyelerde ve Günlük Rota bulmacalarında tahtadaki gizli kelimelerin baş ve son harflerini tespit eder. Sıkıştığın anlarda doğru rotayı bularak zaman kazandırır."
                : infoModal === "lives"
                ? "Tek oyunculu solo seviyelerde veya zamana karşı denemelerde başarısız olduğunda 1 Can kaybedersin. Canların bittiğinde 30 dakikada bir otomatik dolar veya Çip ile anında yenileyebilirsin."
                : infoModal === "mystery"
                ? `Günün İpucu: "${mystery.definition}"\n\nBu tanıma uyan kelimeyi herhangi bir oyun tahtasında (Düello, Seviye veya Günün Rotası) bulup bağladığında anında +${mystery.rewardXp} XP kazanırsın!`
                : "Rotanı Ateşle güverte kartı, oyunun ana rekabet merkezidir! Dereceli düelloya katılabilir, arkadaşınla eşleşebilir, Günün Rotası sabit tahtasını çözebilir veya Lig & Kademe merdiveninde LP biriktirebilirsin."}
            </Text>

            <View style={styles.modalTipBox}>
              <Text style={styles.modalTipTitle}>
                {infoModal === "mystery" ? "💡 GİZEMLİ KELİME REHBERİ" : "💡 REKABET REHBERİ"}
              </Text>
              <Text style={styles.modalTipText}>
                {infoModal === "shield"
                  ? "• Mağaza'dan Çip ile satın alabilirsin.\n• Haftalık görevleri tamamlayarak kazanabilirsin.\n• 7 günlük giriş zincirinin son gününde epik hediye olarak verilir."
                  : infoModal === "radar"
                  ? "• Her seviyede 3 temel hak otomatik verilir.\n• Mağaza ve görevlerden ek kalıcı bonus haklar elde edebilirsin.\n• Seviye içi gizli sandıkları çözerek ekstra hak toplayabilirsin."
                  : infoModal === "lives"
                  ? "• Her 30 dakikada 1 Can otomatik olarak ücretsiz doldurulur (Maks 5).\n• Beklemek istemiyorsan Mağaza'dan Çip ile veya reklam izleyerek anında doldurabilirsin.\n• Günlük giriş ve seviye ödüllerinden bedava Can kazanabilirsin."
                  : infoModal === "mystery"
                  ? "• Her gün gece yarısı yeni bir gizemli kelime belirlenir.\n• Kelimeyi herhangi bir oyun modunda bulduğun anda ödül XP hesabına eklenir.\n• İpucunu dikkatle incele ve tahtada harfleri birleştir!"
                  : "• Galibiyet kazanarak lig puanı (LP) topla ve Demir'den Radian'a yüksel.\n• Günün rotasında sabit tahtayı tamamlayarak ekstra Sezon XP elde et.\n• En yüksek kelime temposu (K/DK) yakalayarak liderlik sıralamasına gir."}
              </Text>
            </View>

            <GameButton
              label={infoModal === "lives" ? "CAN MERKEZİ (DOLDUR)" : infoModal === "shield" ? "MAĞAZADA İNCELE" : infoModal === "rotani" ? "LİG & KADEMELER" : "ANLADIM"}
              variant={infoModal === "rotani" || infoModal === "mystery" ? "emerald" : "gold"}
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
      <LinearGradient colors={["#2D2010", "#140D05"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hud, { borderColor: "#D4B45A" }]}>
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text numberOfLines={1} style={[styles.name, { flexShrink: 1 }]}>{playerName}</Text>
                <View style={styles.titlePill}>
                  <Text numberOfLines={1} style={styles.cyberBadge}>{getActiveCyberTitle(progress)}</Text>
                </View>
              </View>
              <Text numberOfLines={1} style={styles.rank}>Sv. {getPlayerLevel(progress.xp)} · {rank}</Text>
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
              onPress={() => {
                triggerHapticSelection();
                setShowDailyRewardModal(true);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [styles.topIconBtn, !isClaimedToday && styles.topIconBtnGlow, pressed && styles.pressed]}
            >
              <Text style={styles.topIconText}>🎁</Text>
              {!isClaimedToday && <View style={styles.topNotificationDot} />}
            </Pressable>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                if (onOpenHistory) {
                  onOpenHistory();
                } else {
                  setShowHistoryModal(true);
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [styles.topIconBtn, pressed && styles.pressed]}
            >
              <Text style={styles.topIconText}>📜</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.resourceRow}>
        <GemChip
          iconSource={ICONS.shield}
          label="KALKAN"
          value={progress.streakShields || 0}
          color={palette.gemBlue}
          onPress={() => { triggerHapticSelection(); setInfoModal("shield"); }}
        />
        <GemChip
          iconSource={ICONS.radar}
          label="RADAR"
          value={3 + (progress.radarChargesBonus || 0)}
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

      {!isClaimedToday && (
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setShowDailyRewardModal(true);
          }}
          style={({ pressed }) => [styles.dailyMiniPill, pressed && styles.pressed]}
        >
          <Text style={styles.dailyMiniIcon}>🎁</Text>
          <Text style={styles.dailyMiniText}>
            GÜNLÜK HAZİNEN HAZIR! · GÜN {displayDayNumber}/7
          </Text>
          <Text style={styles.dailyMiniAction}>TOPLA ➔</Text>
        </Pressable>
      )}

      {unclaimedMissionsCount > 0 && (
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            onNavigate("missions");
          }}
          style={({ pressed }) => [styles.missionsMiniPill, pressed && styles.pressed]}
        >
          <Text style={styles.missionsMiniIcon}>📜</Text>
          <Text style={styles.missionsMiniText}>
            {unclaimedMissionsCount} GÖREVİN ÖDÜLÜ BEKLİYOR!
          </Text>
          <Text style={styles.missionsMiniAction}>TOPLA ➔</Text>
        </Pressable>
      )}

      {progress.streak > 0 && !dailyDone && (
        <Pressable onPress={onPlayDaily} style={({ pressed }) => [styles.streakWarningPill, pressed && styles.pressed]}>
          <Text style={styles.streakWarningIcon}>🔥</Text>
          <Text style={styles.streakWarningText}>
            {progress.streak} GÜNLÜK SERİN TEHLİKEDE · BUGÜNÜN İZİNİ OYNA
          </Text>
          <Text style={styles.streakWarningArrow}>→</Text>
        </Pressable>
      )}

      <OrnatePanel accent="sapphire" showJewels={false} style={{ marginTop: 12 }}>
        <Animated.View style={[styles.orbit, { transform: [{ rotate: orbitSpin }] }]}><View style={styles.orbitNode} /></Animated.View>
        <Animated.View style={[
          styles.radarRing,
          {
            borderColor: palette.gemBlue,
            transform: [
              { scale: shimmer.interpolate({ inputRange: [0.25, 0.86], outputRange: [0.95, 1.55] }) }
            ],
            opacity: shimmer.interpolate({ inputRange: [0.25, 0.86], outputRange: [0.45, 0] })
          }
        ]} />
        <View style={styles.heroHead}>
          <Text style={[styles.deckEyebrow, { color: "#38BDF8" }]}>KELİME MACERASI · SEZON 01</Text>
          <InfoMini color="#38BDF8" onPress={() => setInfoModal("rotani")} />
        </View>
        <JewelTitle>ROTANI{"\n"}ATEŞLE</JewelTitle>
        <Text style={styles.deckBody}>Dereceli düello seç, günün rotasını bitir veya lig merdivenine tırman.</Text>

        <Pressable
          onPress={() => {
            triggerHapticSelection();
            onNavigate("league");
          }}
          style={({ pressed }) => [styles.xpPanel, { borderColor: "rgba(56, 189, 248, 0.35)", backgroundColor: "rgba(8, 20, 36, 0.85)" }, pressed && styles.pressed]}
        >
          <View style={styles.xpHead}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={[styles.xpLabel, { color: "#7DD3FC" }]}>LİG · {league.name}</Text>
              <Text style={{ color: "#38BDF8", fontSize: 10, fontWeight: "900" }}>➔</Text>
            </View>
            <Text style={[styles.xpValue, { color: "#38BDF8" }]}>{league.currentTierPoints} / {league.targetTierPoints} LP</Text>
          </View>
          <View style={styles.track}>
            <LinearGradient
              colors={[league.color, "#38BDF8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.trackFill, { width: `${Math.max(8, leagueProgressPercent)}%` }]}
            />
          </View>
        </Pressable>

        <View style={styles.heroActions}>
          <GameButton
            label="DERECELİ DÜELLO"
            iconSource={ICONS.play}
            variant="gold"
            onPress={() => onNavigate("online")}
            style={{ flex: 1 }}
          />
          <GameButton
            label="ARKADAŞLA OYNA"
            icon="🤝"
            variant="sapphire"
            onPress={() => onNavigate("friends")}
            style={{ flex: 1 }}
          />
        </View>

        <Pressable
          onPress={() => {
            triggerHapticSelection();
            if (onPlayBot) onPlayBot(4);
            else onNavigate("online");
          }}
          style={({ pressed }) => [styles.botPracticeBtn, pressed && styles.pressed]}
        >
          <Text style={styles.botPracticeIcon}>🤖</Text>
          <Text style={styles.botPracticeText}>SİBER BOT İLE HIZLI ALIŞTIRMA YAP</Text>
          <Text style={styles.botPracticeArrow}>➔</Text>
        </Pressable>

        <View style={[styles.signalFooter, { borderTopColor: "rgba(56, 189, 248, 0.2)" }]}>
          <View style={styles.footerCol}>
            <Text style={[styles.signalLabel, { color: "#7DD3FC" }]}>ORT. TEMPO</Text>
            <Text style={styles.signalValue}>{progress.bestTempo || 0} <Text style={styles.signalUnit}>K/DK</Text></Text>
          </View>
          <View style={[styles.signalRule, { backgroundColor: "rgba(56, 189, 248, 0.2)" }]} />
          <Pressable onPress={() => onNavigate("league")} style={styles.footerCol}>
            <Text style={[styles.signalLabel, { color: "#7DD3FC" }]}>GALİBİYET</Text>
            <Text style={styles.signalValue}>{progress.wins} <Text style={styles.signalUnit}>MAÇ</Text></Text>
          </Pressable>
        </View>
      </OrnatePanel>

      <SectionLabel title="ETKİNLİKLER" meta="ÖZEL GÖREVLER" />

      <Pressable
        onPress={() => {
          triggerHapticSelection();
          setInfoModal("mystery");
        }}
        style={({ pressed }) => [styles.mysteryStripWrap, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={["#0C2B47", "#051424"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.mysteryStrip}
        >
          <View style={styles.mysteryStripLeft}>
            <View style={styles.mysteryIconBadge}>
              <Text style={styles.mysteryIconText}>🔍</Text>
            </View>
            <View style={styles.mysteryStripTextCol}>
              <View style={styles.mysteryStripEyebrowRow}>
                <Text style={styles.mysteryStripEyebrow}>GİZEMLİ KELİME</Text>
                <View style={styles.mysteryStripDot} />
                <Text style={styles.mysteryStripReward}>+{mystery.rewardXp} XP</Text>
              </View>
              <Text style={styles.mysteryStripDef}>
                &quot;{mystery.definition}&quot;
              </Text>
            </View>
          </View>

          <View style={styles.mysteryStripInfoBtn}>
            <Text style={styles.mysteryStripInfoIcon}>ℹ️</Text>
          </View>
        </LinearGradient>
      </Pressable>

      <View style={styles.cardsRow}>
        <Pressable onPress={onPlayDaily} style={({ pressed }) => [styles.columnCardWrap, pressed && styles.pressed]}>
          <LinearGradient colors={["#0C382C", "#041C15"]} style={[styles.columnCard, { borderColor: dailyDone ? palette.bronzeDark : "#2DD4BF" }]}>
            <View style={[styles.cardRibbonWrap, { flexDirection: "row", justifyContent: "center", position: "relative" }]}>
              <View style={styles.cardRibbonMint}>
                <Text style={styles.cardRibbonText}>✦ GÜNÜN ROTASI ✦</Text>
              </View>
              {onOpenModeInfo && (
                <View style={{ position: "absolute", right: -2, top: -2, zIndex: 10 }}>
                  <InfoMini color="#2DD4BF" onPress={() => onOpenModeInfo("daily")} />
                </View>
              )}
            </View>
            <View style={{ alignItems: "center", marginVertical: 4 }}>
              <View style={[styles.cardIconCircle, { borderColor: dailyDone ? palette.bronze : "#2DD4BF", backgroundColor: dailyDone ? palette.panelInner : "rgba(45, 212, 191, 0.16)" }]}>
                <Text style={[styles.cardIconText, { color: dailyDone ? palette.muted : "#2DD4BF" }]}>{activeTheme.icon}</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { textAlign: "center" }]}>{dailyDone ? "TAMAMLANDI" : (daily.title || "GÜNÜN ROTASI").toLocaleUpperCase("tr-TR")}</Text>
            <Text style={[styles.cardBody, { textAlign: "center" }]}>{dailyDone ? "Günün rotasını tekrar incele." : "Kelime paketini seç ve rotayı başlat!"}</Text>
            <View style={{ marginTop: "auto", paddingTop: 6, width: "100%" }}>
              <GameButton
                label={dailyDone ? "İNCELE" : "OYNA ▶"}
                size="sm"
                variant="emerald"
                onPress={onPlayDaily}
              />
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => onNavigate("arcade")} style={({ pressed }) => [styles.columnCardWrap, pressed && styles.pressed]}>
          <LinearGradient colors={["#3D1E04", "#1F0E02"]} style={[styles.columnCard, { borderColor: "#FB923C" }]}>
            <View style={[styles.cardRibbonWrap, { flexDirection: "row", justifyContent: "center", position: "relative" }]}>
              <View style={styles.cardRibbonAmber}>
                <Text style={styles.cardRibbonText}>⚡ REKOR YARIŞI ⚡</Text>
              </View>
              {onOpenModeInfo && (
                <View style={{ position: "absolute", right: -2, top: -2, zIndex: 10 }}>
                  <InfoMini color="#FB923C" onPress={() => onOpenModeInfo("arcade")} />
                </View>
              )}
            </View>
            <View style={{ alignItems: "center", marginVertical: 4 }}>
              <View style={[styles.cardIconCircle, { borderColor: "#FB923C", backgroundColor: "rgba(251, 146, 60, 0.16)" }]}>
                <Text style={[styles.cardIconText, { color: "#FB923C" }]}>⚡</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { textAlign: "center" }]}>SKOR HÜCUMU</Text>
            <Text style={[styles.cardBody, { textAlign: "center" }]}>Süre dolmadan en çok kelimeyi bağla ve rekor kır!</Text>
            <View style={{ marginTop: "auto", paddingTop: 6, width: "100%" }}>
              <GameButton
                label="YARIŞ ▶"
                size="sm"
                variant="gold"
                onPress={() => onNavigate("arcade")}
              />
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      <SectionLabel title="TEK OYUNCU" meta="MACERA & BULMACA" />
      <View style={{ gap: 8, width: "100%" }}>
        <Pressable onPress={onSolo} style={({ pressed }) => [pressed && styles.pressed]}>
          <OrnatePanel accent="emerald" showJewels={false} contentStyle={styles.soloHorizontalSkin}>
            <GameIcon source={ICONS.trophy} size={42} glow="#3EE8B5" />
            <View style={styles.soloMetaCol}>
              <View style={styles.soloEyebrowRow}>
                <Text style={[styles.soloEyebrowText, { color: "#3EE8B5" }]}>
                  {unclaimedMilestonesCount > 0 ? `🎁 ${unclaimedMilestonesCount} SANDIK BEKLİYOR` : "✦ 100 SEVİYE · MACERA ✦"}
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.soloHeading}>SEVİYE YOLCULUĞU</Text>
              <Text numberOfLines={1} style={styles.soloDesc}>
                Aşamalı kelime operasyonları
              </Text>
            </View>
            {onOpenModeInfo && (
              <InfoMini color="#3EE8B5" onPress={() => onOpenModeInfo("solo")} />
            )}
            <GameButton label="BAŞLA ▶" size="sm" variant="emerald" onPress={onSolo} style={styles.soloActionBtn} />
          </OrnatePanel>
        </Pressable>

        <Pressable onPress={() => onNavigate("vintage")} style={({ pressed }) => [pressed && styles.pressed]}>
          <OrnatePanel accent="ruby" showJewels={false} contentStyle={styles.soloHorizontalSkin}>
            <GameIcon emoji="🗞️" size={42} glow="#FB7185" />
            <View style={styles.soloMetaCol}>
              <View style={styles.soloEyebrowRow}>
                <Text style={[styles.soloEyebrowText, { color: "#FB7185" }]}>
                  ✦ 20 BÖLÜM · NOSTALJİ ✦
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.soloHeading}>GAZETE BULMACASI</Text>
              <Text numberOfLines={1} style={styles.soloDesc}>
                Kare bulmaca ipuçlarını çöz
              </Text>
            </View>
            {onOpenModeInfo && (
              <InfoMini color="#FB7185" onPress={() => onOpenModeInfo("vintage")} />
            )}
            <GameButton label="ÇÖZ ▶" size="sm" variant="ruby" onPress={() => onNavigate("vintage")} style={styles.soloActionBtn} />
          </OrnatePanel>
        </Pressable>
      </View>

      <MatchHistoryModal
        visible={showHistoryModal}
        progress={progress}
        onClose={() => setShowHistoryModal(false)}
        onPlayNow={() => {
          setShowHistoryModal(false);
          onNavigate("online");
        }}
      />

      <DailyTreasureModal
        visible={showDailyRewardModal}
        onClose={() => setShowDailyRewardModal(false)}
        progress={progress}
        onClaim={() => {
          onClaimDailyReward?.();
        }}
      />
    </ScrollView>
  </>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 170 },
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
    backgroundColor: "rgba(244, 208, 111, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(244, 208, 111, 0.45)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    flexShrink: 1,
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
  topIconBtnGlow: {
    borderColor: "#FFC24A",
    backgroundColor: "rgba(255, 194, 74, 0.25)",
    shadowColor: "#FFC24A",
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  topNotificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#0E2C22",
  },
  dailyMiniPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 194, 74, 0.14)",
    borderWidth: 1.5,
    borderColor: "#FFC24A",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
    shadowColor: "#FFC24A",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  dailyMiniIcon: { fontSize: 15 },
  dailyMiniText: { flex: 1, color: "#FFDF85", fontSize: 10, fontWeight: "900", letterSpacing: 0.4 },
  dailyMiniAction: { color: "#FFC24A", fontSize: 11, fontWeight: "900" },
  missionsMiniPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(62, 232, 181, 0.12)",
    borderWidth: 1.5,
    borderColor: "#3EE8B5",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
    marginBottom: 4,
    gap: 8,
    shadowColor: "#3EE8B5",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  missionsMiniIcon: { fontSize: 15 },
  missionsMiniText: { flex: 1, color: "#A7F3D0", fontSize: 10, fontWeight: "900", letterSpacing: 0.4 },
  missionsMiniAction: { color: "#3EE8B5", fontSize: 11, fontWeight: "900" },
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
  modalIconBadgeMystery: { borderColor: "#38BDF8", backgroundColor: "rgba(56, 189, 248, 0.16)" },
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
  botPracticeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.45)",
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 8,
    gap: 8,
  },
  botPracticeIcon: { fontSize: 14 },
  botPracticeText: { color: "#7DD3FC", fontSize: 10.5, fontWeight: "900", letterSpacing: 0.5 },
  botPracticeArrow: { color: "#38BDF8", fontSize: 11, fontWeight: "900" },
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
    backgroundColor: "rgba(36, 22, 6, 0.85)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 194, 74, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    position: "relative",
  },
  dailyDayCardActive: {
    borderColor: "#FFC24A",
    backgroundColor: "rgba(70, 42, 8, 0.95)",
    borderWidth: 2,
    shadowColor: "#FFC24A",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  dailyDayCardPast: { opacity: 0.7, borderColor: "rgba(255, 194, 74, 0.3)", backgroundColor: "rgba(24, 14, 4, 0.8)" },
  dailyDayCardClaimedToday: { borderColor: "#FBBF24", backgroundColor: "rgba(50, 30, 6, 0.9)" },
  dailyDayCardEpic: { borderColor: "#FFD700" },
  epicTag: { position: "absolute", top: -6, backgroundColor: "#FFD700", paddingHorizontal: 4, borderRadius: 5 },
  epicTagText: { color: "#3A2408", fontSize: 6.5, fontWeight: "900" },
  dailyDayLabel: { color: "#E8D5A3", fontSize: 8, fontWeight: "800" },
  dailyDayIcon: { fontSize: 14, marginVertical: 2 },
  dailyDayAmount: { color: palette.cream, fontSize: 8.5, fontWeight: "900" },
  dailyDayCheck: { position: "absolute", bottom: 2, right: 3, backgroundColor: "#FFC24A", width: 12, height: 12, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  dailyDayCheckText: { color: "#071A14", fontSize: 8, fontWeight: "900", lineHeight: 10 },
  dailyClaimedBar: { marginTop: 10, backgroundColor: "rgba(255, 194, 74, 0.08)", borderWidth: 1, borderColor: "rgba(255, 194, 74, 0.3)", borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10, alignItems: "center" },
  dailyClaimedBarText: { color: "#FFD000", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.3 },

  cardsRow: { flexDirection: "row", gap: 10, width: "100%", marginTop: 4 },
  columnCardWrap: { flex: 1 },
  columnCard: {
    flex: 1,
    minHeight: 160,
    borderRadius: 18,
    borderWidth: 2,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 7,
    elevation: 5,
    position: "relative",
    overflow: "hidden",
  },
  cardRibbonWrap: { width: "100%", alignItems: "center" },
  cardRibbonMint: {
    alignSelf: "center",
    backgroundColor: "rgba(45, 212, 191, 0.2)",
    borderWidth: 1,
    borderColor: "#2DD4BF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  cardRibbonAmber: {
    alignSelf: "center",
    backgroundColor: "rgba(251, 146, 60, 0.2)",
    borderWidth: 1,
    borderColor: "#FB923C",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  cardRibbonText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  cardIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIconText: { fontSize: 16, fontWeight: "900" },
  cardKicker: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 12,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cardTitle: {
    color: palette.cream,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 3,
    letterSpacing: 0.5,
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  cardBody: { color: palette.muted, fontSize: 9, lineHeight: 12, marginTop: 3 },

  soloHorizontalSkin: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  soloMetaCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  soloEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  soloEyebrowText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  soloHeading: {
    color: palette.cream,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2,
  },
  soloDesc: {
    color: palette.muted,
    fontSize: 9.5,
    lineHeight: 13,
    marginTop: 1,
    fontWeight: "600",
  },
  soloActionBtn: {
    minWidth: 80,
    flexShrink: 0,
  },
  soloSkin: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  soloEyebrow: { color: palette.gold, fontSize: 8.5, fontWeight: "900", letterSpacing: 1 },
  soloArrow: { color: palette.gold, fontSize: 26, fontWeight: "900" },

  modeGrid: { flexDirection: "row", gap: 6, width: "100%" },
  modeNodeWrap: { flex: 1 },
  modeNode: {
    minHeight: 106,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  modeNodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: "100%",
  },
  modeSize: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  modeMiniDot: { width: 6, height: 6, borderRadius: 3, shadowOpacity: 0.9, shadowRadius: 4 },
  modeTitle: {
    color: palette.cream,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 3,
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modeMetaPill: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
  },
  modeMeta: { fontSize: 8, fontWeight: "800", textAlign: "center" },
  lockTrack: { width: "90%", height: 4, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 2, marginTop: 4, overflow: "hidden" },

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

  mysteryStripWrap: {
    width: "100%",
    marginBottom: 8,
  },
  mysteryStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  mysteryStripLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  mysteryIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(56, 189, 248, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  mysteryIconText: {
    fontSize: 14,
  },
  mysteryStripTextCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  mysteryStripEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  mysteryStripEyebrow: {
    fontSize: 8,
    fontWeight: "900",
    color: "#38BDF8",
    letterSpacing: 0.8,
  },
  mysteryStripDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#38BDF8",
  },
  mysteryStripReward: {
    fontSize: 8.5,
    fontWeight: "900",
    color: palette.gold,
    letterSpacing: 0.4,
  },
  mysteryStripDef: {
    fontSize: 11.5,
    fontStyle: "italic",
    fontWeight: "700",
    color: palette.cream,
    lineHeight: 16,
    marginTop: 2,
  },
  mysteryStripInfoBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    flexShrink: 0,
  },
  mysteryStripInfoIcon: {
    fontSize: 12,
    color: "#38BDF8",
    fontWeight: "900",
  },

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
