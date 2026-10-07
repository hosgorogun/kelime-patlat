import { styles } from './command-center.styles';
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Image, PanResponder, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { type LeaderboardEntry } from "@/shared/game";
import { getLeagueTier, getRank, getPlayerLevel, getDailyMysteryWord, getActiveCyberTitle, THEME_PACKS, AVATARS, getDayId, getCalculatedLives, canSpinLuckyWheel, type DailyChallenge, type PlayerProgress, type ThemePackId } from "@/shared/progression";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { PROFILE_FRAMES } from "@/shared/store-items";
import { palette } from "@/shared/palette";
import { GameButton, GameGlyph, GameIcon, GemChip, ICONS, JewelTitle, OrnatePanel, SectionLabel } from "@/components/game/game-ui";
import { MatchHistoryModal } from "@/components/match-history/match-history-modal";
import { DailyTreasureModal } from "@/components/modals/daily-treasure-modal";
import { BotPracticeModal } from "./bot-practice-modal";
import { CommandInfoModal } from "./command-info-modal";

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
  unclaimedMissionsCount?: number;
  unclaimedMilestonesCount?: number;
  onClaimDailyReward?: () => void;
  onShowToast?: (title: string, subtitle: string, icon?: string, accentColor?: string) => void;
  onOpenModeInfo?: (mode: "pvp" | "daily" | "vintage" | "arcade" | "solo") => void;
  onOpenLivesModal?: () => void;
  onOpenHistory?: () => void;
  onOpenLuckyWheel?: () => void;
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

const PATLAT_TILES = [
  { letter: "P", bg: "#FF6B8B", border: "#D84265", text: "#FFFFFF" },
  { letter: "A", bg: "#FFB703", border: "#D48B00", text: "#293541" },
  { letter: "T", bg: "#2EC4B6", border: "#1B9A8E", text: "#FFFFFF" },
  { letter: "L", bg: "#3A86FF", border: "#1E65DE", text: "#FFFFFF" },
  { letter: "A", bg: "#A06CD5", border: "#7B46B0", text: "#FFFFFF" },
  { letter: "T", bg: "#FB8500", border: "#CF6200", text: "#FFFFFF" },
];

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
  onOpenLuckyWheel,
}: CommandCenterProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDailyRewardModal, setShowDailyRewardModal] = useState(false);
  const hasAutoOpenedDailyRewardRef = useRef(false);
  const [isMysteryExpanded, setIsMysteryExpanded] = useState(false);
  const [livesCalc, setLivesCalc] = useState(() => getCalculatedLives(progress));
  const [imgError, setImgError] = useState(false);
  const [displayCoins, setDisplayCoins] = useState(() => progress.coins ?? 0);
  const targetCoinsRef = useRef(progress.coins ?? 0);

  useEffect(() => {
    const target = progress.coins ?? 0;
    targetCoinsRef.current = target;
    const start = displayCoins;
    if (start === target) return;

    const diff = target - start;
    const steps = Math.min(20, Math.max(5, Math.abs(diff)));
    const stepDuration = Math.min(40, Math.max(16, 500 / steps));
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      if (stepCount >= steps) {
        setDisplayCoins(targetCoinsRef.current);
        clearInterval(timer);
      } else {
        const nextVal = Math.round(start + (diff * (stepCount / steps)));
        setDisplayCoins(nextVal);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [progress.coins]);

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
  const { canSpin: canSpinWheel } = canSpinLuckyWheel(progress);

  useEffect(() => {
    if (!isClaimedToday && !hasAutoOpenedDailyRewardRef.current && progress.welcomeRewardClaimed) {
      hasAutoOpenedDailyRewardRef.current = true;
      const timer = setTimeout(() => {
        setShowDailyRewardModal(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isClaimedToday, progress.welcomeRewardClaimed]);

  const activeAvatar = AVATARS.find((a) => a.id === progress.selectedAvatar) ?? AVATARS[0]!;
  const activeFrame = PROFILE_FRAMES.find((f) => f[0] === progress.selectedFrame);
  const activeFrameColor = activeFrame ? activeFrame[2] : (activeAvatar.color || palette.emerald);
  const activeTitle = getActiveCyberTitle(progress);

  const [infoModal, setInfoModal] = useState<"shield" | "radar" | "lives" | "rotani" | "mystery" | null>(null);

  const [showBotPracticeModal, setShowBotPracticeModal] = useState(false);

  // Serbest sürüklenebilir Büyüteç Rozeti (Draggable Floating FAB)
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4;
      },
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({
          x: panOffset.current.x,
          y: panOffset.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6) {
          isDragging.current = true;
        }
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        panOffset.current = {
          x: panOffset.current.x + gesture.dx,
          y: panOffset.current.y + gesture.dy,
        };
        // Eğer sürükleme yapılmadıysa tıklama say ve modalı aç
        if (!isDragging.current) {
          triggerHapticSelection();
          setInfoModal("mystery");
        }
      },
    })
  ).current;

  return <>
    <BotPracticeModal
      visible={showBotPracticeModal}
      onClose={() => setShowBotPracticeModal(false)}
      onPlayBot={onPlayBot}
      onNavigateOnline={() => onNavigate("online")}
    />

    <CommandInfoModal
      infoModal={infoModal}
      onClose={() => setInfoModal(null)}
      progress={progress}
      livesCalc={livesCalc}
      league={league}
      mystery={mystery}
      onOpenLivesModal={onOpenLivesModal}
      onNavigate={onNavigate}
    />

    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#FFFFFF", "#FAF4EC"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hud, { borderColor: "#DED6C7" }]}>
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Text numberOfLines={1} style={[styles.name, { flexShrink: 1 }]}>{playerName}</Text>
                {activeTitle ? (
                  <View style={styles.titlePill}>
                    <Text numberOfLines={1} style={styles.cyberBadge}>{activeTitle}</Text>
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={1} style={styles.rank}>Sv. {getPlayerLevel(progress.xp)} · {rank}</Text>
            </View>
          </Pressable>

          <View style={styles.topActionsGroup}>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                if (onOpenLivesModal) {
                  onOpenLivesModal();
                } else {
                  setInfoModal("lives");
                }
              }}
              style={({ pressed }) => [
                styles.livesHeaderPill,
                livesCalc.isInfinite && styles.livesHeaderPillInfinite,
                pressed && styles.pressed,
              ]}
            >
              <GameGlyph source={ICONS.heart} size={22} />
              <Text style={[styles.livesHeaderValue, livesCalc.isInfinite && styles.livesHeaderValueInfinite]}>
                {livesCalc.isInfinite ? "∞" : `${livesCalc.lives}/5`}
              </Text>
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
          value={progress.radarChargesBonus || 0}
          color={palette.emerald}
          onPress={() => { triggerHapticSelection(); setInfoModal("radar"); }}
        />
        <GemChip
          iconSource={ICONS.coin}
          label="ÇİP"
          value={displayCoins}
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

      {/* Daima 2'li yan yana duran Hazine ve Çark kartları */}
      <View style={styles.quickActionsRow}>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setShowDailyRewardModal(true);
          }}
          style={({ pressed }) => [
            styles.quickActionCard,
            { backgroundColor: isClaimedToday ? "#F3F5EE" : "#FFF5D6", borderColor: isClaimedToday ? "#DDE3D6" : "#F3D267" },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.quickActionIcon}>🎁</Text>
          <View style={styles.quickActionContent}>
            <Text numberOfLines={1} style={[styles.quickActionTitle, { color: isClaimedToday ? "#62737D" : "#7A5910" }]}>
              GÜN {displayDayNumber}/7
            </Text>
            <Text numberOfLines={1} style={[styles.quickActionSub, { color: isClaimedToday ? "#85959F" : "#925D00" }]}>
              {isClaimedToday ? "Toplandı ✓" : "Hazineyi Al"}
            </Text>
          </View>
          <Text style={[styles.quickActionArrow, { color: isClaimedToday ? "#85959F" : "#925D00" }]}>
            {isClaimedToday ? "✓" : "➔"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            triggerHapticSelection();
            onOpenLuckyWheel?.();
          }}
          style={({ pressed }) => [
            styles.quickActionCard,
            { backgroundColor: "#EFF6FF", borderColor: "#93C5FD" },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.quickActionIcon}>🎡</Text>
          <View style={styles.quickActionContent}>
            <Text numberOfLines={1} style={[styles.quickActionTitle, { color: "#1E40AF" }]}>
              {canSpinWheel ? "ÇARK HAZIR" : "ŞANS ÇARKI"}
            </Text>
            <Text numberOfLines={1} style={[styles.quickActionSub, { color: "#2563EB" }]}>
              {canSpinWheel ? "Ücretsiz Çevir" : "Hediyeler"}
            </Text>
          </View>
          <Text style={[styles.quickActionArrow, { color: "#2563EB" }]}>➔</Text>
        </Pressable>

        {unclaimedMissionsCount > 0 && (
          <Pressable
            onPress={() => {
              triggerHapticSelection();
              onNavigate("missions");
            }}
            style={({ pressed }) => [
              styles.quickActionCard,
              { backgroundColor: "#DEF7EC", borderColor: "#88DFB3" },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.quickActionIcon}>📜</Text>
            <View style={styles.quickActionContent}>
              <Text numberOfLines={1} style={[styles.quickActionTitle, { color: "#166544" }]}>
                {unclaimedMissionsCount} GÖREV
              </Text>
              <Text numberOfLines={1} style={[styles.quickActionSub, { color: "#15803D" }]}>
                Ödülü Al
              </Text>
            </View>
            <Text style={[styles.quickActionArrow, { color: "#15803D" }]}>➔</Text>
          </Pressable>
        )}
      </View>

      <OrnatePanel accent="sapphire" showJewels={false} style={{ marginTop: 12 }}>
        <View style={styles.heroHead}>
          <Text style={[styles.deckEyebrow, { color: "#176C97" }]}>BİR KELİMEYLE BAŞLA</Text>
          <InfoMini color="#176C97" onPress={() => setInfoModal("rotani")} />
        </View>
        <JewelTitle>Azıcık mola. {"\n"}Bolca kelime.</JewelTitle>
        <View accessible={false} style={{ flexDirection: "row", gap: 6, marginTop: 16, marginBottom: 4 }}>
          {PATLAT_TILES.map((tile, index) => (
            <View
              key={`${tile.letter}-${index}`}
              style={{
                width: 38,
                height: 44,
                borderRadius: 12,
                borderWidth: 1.5,
                borderBottomWidth: 4,
                borderColor: tile.border,
                backgroundColor: tile.bg,
                alignItems: "center",
                justifyContent: "center",
                transform: [{ rotate: index % 2 ? "5deg" : "-5deg" }],
              }}
            >
              <Text style={{ color: tile.text, fontWeight: "900", fontSize: 22 }}>
                {tile.letter}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.deckBody}>Harfleri birleştir. Kelimeleri bul. Kendi rekorunu geç.</Text>

        <Pressable
          onPress={() => {
            triggerHapticSelection();
            onNavigate("league");
          }}
          style={({ pressed }) => [styles.xpPanel, { borderColor: "#BCD8F0", backgroundColor: "#FFFFFF" }, pressed && styles.pressed]}
        >
          <View style={styles.xpHead}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={[styles.xpLabel, { color: "#2C6B8D" }]}>LİG · {league.name}</Text>
              <Text style={{ color: "#176C97", fontSize: 10, fontWeight: "900" }}>➔</Text>
            </View>
            <Text style={[styles.xpValue, { color: "#16648B" }]}>{league.currentTierPoints} / {league.targetTierPoints} LP</Text>
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
            label="Düelloya başla"
            iconSource={ICONS.play}
            variant="gold"
            onPress={() => onNavigate("online")}
            style={{ flex: 1 }}
          />
          <GameButton
            label="Arkadaşla oyna"
            icon="🤝"
            variant="sapphire"
            onPress={() => onNavigate("friends")}
            style={{ flex: 1 }}
          />
        </View>

        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setShowBotPracticeModal(true);
          }}
          style={({ pressed }) => [styles.botPracticeBtn, pressed && styles.pressed]}
        >
          <Text style={styles.botPracticeIcon}>🤖</Text>
          <Text style={styles.botPracticeText}>Önce biraz pratik yap</Text>
          <Text style={styles.botPracticeArrow}>➔</Text>
        </Pressable>

        <View style={[styles.signalFooter, { borderTopColor: "rgba(33, 106, 159, 0.2)" }]}>
          <View style={styles.footerCol}>
            <Text style={[styles.signalLabel, { color: "#466E85" }]}>ORT. TEMPO</Text>
            <Text style={styles.signalValue}>{progress.bestTempo || 0} <Text style={styles.signalUnit}>K/DK</Text></Text>
          </View>
          <View style={[styles.signalRule, { backgroundColor: "rgba(33, 106, 159, 0.25)" }]} />
          <Pressable onPress={() => onNavigate("league")} style={styles.footerCol}>
            <Text style={[styles.signalLabel, { color: "#466E85" }]}>GALİBİYET</Text>
            <Text style={styles.signalValue}>{progress.wins} <Text style={styles.signalUnit}>MAÇ</Text></Text>
          </Pressable>
        </View>
      </OrnatePanel>

      <SectionLabel title="OYUN MODLARI" meta="MACERA & REKOR" />

      {/* 2. ANA MACERA: SEVİYE YOLCULUĞU (Öne Çıkan Geniş Prestij Kartı) */}
      <Pressable onPress={onSolo} style={({ pressed }) => [{ width: "100%", marginBottom: 8 }, pressed && styles.pressed]}>
        <OrnatePanel accent="emerald" showJewels={false} contentStyle={styles.soloHorizontalSkin}>
          <GameIcon source={ICONS.trophy} size={42} glow="#3EE8B5" />
          <View style={styles.soloMetaCol}>
            <View style={styles.soloEyebrowRow}>
              <Text style={[styles.soloEyebrowText, { color: "#117753" }]}>
                {unclaimedMilestonesCount > 0 ? `🎁 ${unclaimedMilestonesCount} SANDIK BEKLİYOR` : `SEVİYE ${progress.soloUnlockedLevel ?? 1}/100`}
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.soloHeading}>SEVİYE YOLCULUĞU</Text>
            <Text numberOfLines={1} style={styles.soloDescEmerald}>
              100 kademeli sözcük macerası
            </Text>
          </View>
          {onOpenModeInfo && (
            <InfoMini color="#117753" onPress={() => onOpenModeInfo("solo")} />
          )}
          <GameButton label="BAŞLA ▶" size="sm" variant="emerald" onPress={onSolo} style={styles.soloActionBtn} />
        </OrnatePanel>
      </Pressable>

      {/* 3. DİĞER MODLAR: 2 SÜTUN YAN YANA EŞİT DENGELİ KARTLAR */}
      <View style={styles.cardsRow}>
        {/* SOL: SKOR HÜCUMU */}
        <Pressable onPress={() => onNavigate("arcade")} style={({ pressed }) => [styles.columnCardWrap, pressed && styles.pressed]}>
          <LinearGradient
            colors={["#FFF6ED", "#FFE6D1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.columnCard, { borderColor: "#F7BE93" }]}
          >
            <View style={[styles.cardRibbonWrap, { flexDirection: "row", justifyContent: "center", position: "relative" }]}>
              <View style={styles.cardRibbonAmber}>
                <Text style={styles.cardRibbonTextAmber}>ZAMANA KARŞI</Text>
              </View>
              {onOpenModeInfo && (
                <View style={{ position: "absolute", right: -2, top: -2, zIndex: 10 }}>
                  <InfoMini color="#B25610" onPress={() => onOpenModeInfo("arcade")} />
                </View>
              )}
            </View>

            <View style={{ alignItems: "center", marginVertical: 6 }}>
              <View style={[styles.cardIconCircle, { borderColor: "#F4AF79", backgroundColor: "#FFE0C0" }]}>
                <Text style={[styles.cardIconText, { color: "#B25610" }]}>⚡</Text>
              </View>
            </View>

            <Text style={[styles.cardTitle, { textAlign: "center" }]}>SKOR HÜCUMU</Text>
            <Text numberOfLines={2} style={[styles.cardBodyAmber, { textAlign: "center", fontSize: 10, lineHeight: 14 }]}>
              {progress.bestArcadeScore ? `En İyi: ${progress.bestArcadeScore} Puan` : "Süre bitmeden rekor kır!"}
            </Text>

            <View style={{ marginTop: "auto", paddingTop: 8, width: "100%" }}>
              <GameButton
                label="YARIŞ ▶"
                size="sm"
                variant="gold"
                onPress={() => onNavigate("arcade")}
              />
            </View>
          </LinearGradient>
        </Pressable>

        {/* SAĞ: GAZETE BULMACASI */}
        <Pressable onPress={() => onNavigate("vintage")} style={({ pressed }) => [styles.columnCardWrap, pressed && styles.pressed]}>
          <LinearGradient
            colors={["#FFF1F3", "#FDE0E4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.columnCard, { borderColor: "#FCA5A5" }]}
          >
            <View style={[styles.cardRibbonWrap, { flexDirection: "row", justifyContent: "center", position: "relative" }]}>
              <View style={[styles.cardRibbonAmber, { backgroundColor: "#FFE4E8", borderColor: "#F87171" }]}>
                <Text style={[styles.cardRibbonTextAmber, { color: "#991B1B" }]}>10×10 MATRİS</Text>
              </View>
              {onOpenModeInfo && (
                <View style={{ position: "absolute", right: -2, top: -2, zIndex: 10 }}>
                  <InfoMini color="#991B1B" onPress={() => onOpenModeInfo("vintage")} />
                </View>
              )}
            </View>

            <View style={{ alignItems: "center", marginVertical: 6 }}>
              <View style={[styles.cardIconCircle, { borderColor: "#F87171", backgroundColor: "#FEE2E2" }]}>
                <Text style={[styles.cardIconText, { color: "#991B1B" }]}>🗞️</Text>
              </View>
            </View>

            <Text style={[styles.cardTitle, { textAlign: "center" }]}>GAZETE BULMACASI</Text>
            <Text numberOfLines={2} style={[styles.cardBodyAmber, { textAlign: "center", color: "#7F1D1D", fontSize: 10, lineHeight: 14 }]}>
              20 özel klasik kare bulmaca
            </Text>

            <View style={{ marginTop: "auto", paddingTop: 8, width: "100%" }}>
              <GameButton
                label="ÇÖZ ▶"
                size="sm"
                variant="ruby"
                onPress={() => onNavigate("vintage")}
              />
            </View>
          </LinearGradient>
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

    {/* Ekran Üzerinde İstenilen Yere Serbestçe Taşınabilen Büyüteç Rozeti (Draggable Floating FAB) */}
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.mysteryFab,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
    >
      <Text style={styles.mysteryFabIcon}>🔍</Text>
    </Animated.View>
  </>;
}
