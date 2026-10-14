import { styles } from './command-center.styles';
import { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { type LeaderboardEntry } from "@/shared/game";
import { getLeagueTier, getRank, getPlayerLevel, getDailyMysteryWord, getActiveCyberTitle, getActiveCyberTitleObject, AVATARS, getDayId, getCalculatedLives, canSpinLuckyWheel, type PlayerProgress } from "@/shared/progression";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { PROFILE_FRAMES } from "@/shared/store-items";
import { palette } from "@/shared/palette";
import { GameButton, GameGlyph, GameIcon, GemChip, ICONS, JewelTitle, OrnatePanel, SectionLabel } from "@/components/game/game-ui";
import { MatchHistoryModal } from "@/components/match-history/match-history-modal";
import { DailyTreasureModal } from "@/components/modals/daily-treasure-modal";
import { NotificationCenterModal } from "@/components/modals/notification-center-modal";
import { BotPracticeModal } from "./bot-practice-modal";
import { CommandInfoModal } from "./command-info-modal";
import { FRAME_IMAGES } from "@/components/profile/profile-constants";

type NavKey = "home" | "online" | "profile" | "arcade" | "levels" | "store" | "season" | "league" | "missions" | "friends" | "vintage";

type CommandCenterProps = {
  playerName: string;
  progress: PlayerProgress;
  leaderboard: LeaderboardEntry[];
  onPlayBot: (size: 4 | 6 | 8 | 10) => void;
  onSolo: () => void;
  onNavigate: (destination: NavKey) => void;
  onLeaderboard?: () => void;
  onShowGuide: () => void;
  unclaimedMissionsCount?: number;
  unclaimedMilestonesCount?: number;
  onClaimDailyReward?: () => void;
  onShowToast?: (title: string, subtitle: string, icon?: string, accentColor?: string) => void;
  onOpenModeInfo?: (mode: "pvp" | "vintage" | "arcade" | "solo") => void;
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
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const hasAutoOpenedDailyRewardRef = useRef(false);
  const [livesCalc, setLivesCalc] = useState(() => getCalculatedLives(progress));
  const [imgError, setImgError] = useState(false);
  const [displayCoins, setDisplayCoins] = useState(() => progress.coins ?? 0);
  const targetCoinsRef = useRef(progress.coins ?? 0);

  const displayCoinsRef = useRef(displayCoins);
  displayCoinsRef.current = displayCoins;

  useEffect(() => {
    const target = progress.coins ?? 0;
    targetCoinsRef.current = target;
    const start = displayCoinsRef.current;
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
  const leagueProgressPercent = league.tier === "HAKİM"
    ? 100
    : Math.min(100, Math.round((league.currentTierPoints / league.targetTierPoints) * 100));
  const mystery = getDailyMysteryWord();

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
  const activeTitleObj = getActiveCyberTitleObject(progress);

  const [infoModal, setInfoModal] = useState<"shield" | "radar" | "lives" | "rotani" | "mystery" | null>(null);

  const [showBotPracticeModal, setShowBotPracticeModal] = useState(false);

  // PATLAT Harf Taşları Animasyonları (Subtle Bounce & Wiggle Loop)
  const tileAnims = useRef(PATLAT_TILES.map(() => new Animated.Value(0))).current;

  // Staggered dashboard entrance animations (Buttery smooth HUD & card arrival)
  const hudAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const modesAnim = useRef(new Animated.Value(0)).current;

  // Breathing pulse for primary play button
  const playPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(70, [
      Animated.spring(hudAnim, {
        toValue: 1,
        tension: 190,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.spring(quickActionsAnim, {
        toValue: 1,
        tension: 190,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.spring(heroAnim, {
        toValue: 1,
        tension: 190,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.spring(modesAnim, {
        toValue: 1,
        tension: 190,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(playPulseAnim, {
          toValue: 1.035,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(playPulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [hudAnim, quickActionsAnim, heroAnim, modesAnim, playPulseAnim]);

  useEffect(() => {
    const animations = tileAnims.map((anim, i) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(anim, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.delay((PATLAT_TILES.length - i) * 120 + 800),
        ])
      );
    });
    animations.forEach((anim) => anim.start());
    return () => animations.forEach((anim) => anim.stop());
  }, [tileAnims]);

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
      <Animated.View
        style={{
          opacity: hudAnim,
          transform: [
            {
              translateY: hudAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        }}
      >
        <LinearGradient colors={["#FFFFFF", "#FFFDF7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hud}>
          <View style={styles.hudInner}>
            <Pressable onPress={() => onNavigate("profile")} style={({ pressed }) => [styles.identity, pressed && styles.pressed]}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatar, { borderColor: activeFrameColor, backgroundColor: activeAvatar.surface }]}>
                {progress.selectedFrame && FRAME_IMAGES[progress.selectedFrame] ? (
                  <Image
                    source={FRAME_IMAGES[progress.selectedFrame]}
                    style={{ position: "absolute", width: "100%", height: "100%", borderRadius: 24, zIndex: 2 }}
                    resizeMode="cover"
                  />
                ) : null}
                {progress.avatarPhoto && !imgError ? (
                  <Image
                    source={{ uri: progress.avatarPhoto }}
                    style={[
                      styles.avatarImage,
                      progress.selectedFrame && FRAME_IMAGES[progress.selectedFrame] && { width: "84%", height: "84%", borderRadius: 18, zIndex: 1 },
                    ]}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <View
                    style={[
                      { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
                      progress.selectedFrame && FRAME_IMAGES[progress.selectedFrame] && { width: "84%", height: "84%", borderRadius: 18, zIndex: 1 },
                    ]}
                  >
                    <Text style={[styles.avatarText, { color: activeAvatar.color }]}>{activeAvatar.icon}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.identityMeta}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Text numberOfLines={1} style={[styles.name, { flexShrink: 1 }]}>{playerName}</Text>
                {activeTitle ? (
                  <View
                    style={[
                      styles.titlePill,
                      activeTitleObj?.accent
                        ? {
                            backgroundColor: `${activeTitleObj.accent}14`,
                            borderColor: `${activeTitleObj.accent}33`,
                          }
                        : null,
                    ]}
                  >
                    {activeTitleObj?.icon ? (
                      <Text style={styles.titleIcon}>{activeTitleObj.icon}</Text>
                    ) : null}
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.cyberBadge,
                        activeTitleObj?.accent ? { color: activeTitleObj.accent } : null,
                      ]}
                    >
                      {activeTitle.replace(/^\[|\]$/g, "")}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.rankRow}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeIcon}>⚡</Text>
                  <Text style={styles.levelBadgeText}>SV. {getPlayerLevel(progress.xp)}</Text>
                </View>
                <View
                  style={[
                    styles.tierBadge,
                    league?.color
                      ? {
                          backgroundColor: `${league.color}14`,
                          borderColor: `${league.color}40`,
                        }
                      : null,
                  ]}
                >
                  <Text style={styles.tierBadgeIcon}>{league?.icon || "🛡️"}</Text>
                  <Text
                    style={[
                      styles.tierBadgeText,
                      league?.color ? { color: league.color } : null,
                    ]}
                  >
                    {rank}
                  </Text>
                </View>
                {(progress.pvpWinStreak ?? 0) >= 2 && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      triggerHapticSelection();
                      setInfoModal("shield");
                    }}
                    style={styles.flameStreakPill}
                  >
                    <Text style={styles.flameStreakPillText}>
                      🔥 {progress.pvpWinStreak} ZAFER{(progress.streakShields ?? 0) > 0 ? " · 🛡️" : ""}
                    </Text>
                  </Pressable>
                )}
              </View>
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
              <GameGlyph source={ICONS.heart} size={20} />
              <Text style={[styles.livesHeaderValue, livesCalc.isInfinite && styles.livesHeaderValueInfinite]}>
                {livesCalc.isInfinite ? "∞" : `${livesCalc.lives}/5`}
              </Text>
            </Pressable>

            <Pressable
              onPress={onShowGuide}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [styles.topIconBtn, pressed && styles.pressed]}
              accessibilityLabel="Nasıl Oynanır"
            >
              <Text style={styles.topIconText}>💡</Text>
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
              accessibilityLabel="Maç Geçmişi"
            >
              <Image source={ICONS.history} style={{ width: 22, height: 22 }} resizeMode="contain" />
            </Pressable>
          </View>
        </View>
      </LinearGradient>
      </Animated.View>

      <Animated.View
        style={{
          opacity: quickActionsAnim,
          transform: [
            {
              translateY: quickActionsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        }}
      >
        <View style={styles.resourceRow}>
          <GemChip
            iconSource={ICONS.shield}
            iconSize={28}
            label="KALKAN"
            value={progress.streakShields || 0}
            color="#1D4ED8"
            bg="#EFF6FF"
            borderColor="#BFDBFE"
            borderBottomColor="#93C5FD"
            onPress={() => { triggerHapticSelection(); setInfoModal("shield"); }}
          />
          <GemChip
            iconSource={ICONS.radar}
            iconSize={28}
            label="RADAR"
            value={progress.radarChargesBonus || 0}
            color="#047857"
            bg="#ECFDF5"
            borderColor="#A7F3D0"
            borderBottomColor="#6EE7B7"
            onPress={() => { triggerHapticSelection(); setInfoModal("radar"); }}
          />
          <GemChip
            iconSource={ICONS.coin}
            iconSize={26}
            label="ÇİP"
            value={displayCoins}
            color="#B45309"
            bg="#FFFBEB"
            borderColor="#FDE68A"
            borderBottomColor="#F59E0B"
            plus
            badge={!isClaimedToday}
            onPress={() => onNavigate("store")}
          />
        </View>

        {/* Daima dengeli duran Hazine, Çark ve Gizemli Kelime kartları */}
        <View style={styles.quickActionsRow}>
          <Pressable
            onPress={() => {
              triggerHapticSelection();
              setShowDailyRewardModal(true);
            }}
            style={({ pressed }) => [
              styles.quickActionCard,
              {
                backgroundColor: "#FFFBEB",
                borderColor: "#FDE68A",
                borderBottomColor: "#F59E0B",
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: "#FEF3C7" }]}>
              <Image source={ICONS.gift} style={{ width: 20, height: 20 }} resizeMode="contain" />
            </View>
            <View style={styles.quickActionContent}>
              <Text numberOfLines={1} style={[styles.quickActionTitle, { color: "#92400E" }]}>
                GÜN {displayDayNumber}/7
              </Text>
              <Text numberOfLines={1} style={[styles.quickActionSub, { color: "#B45309" }]}>
                {isClaimedToday ? "Giriş Hediyesi" : "Hazineyi Al"}
              </Text>
            </View>
            <View style={[styles.quickActionBadgePill, styles.readyPill]}>
              <Text style={[styles.quickActionBadgeText, styles.readyPillText]}>➔</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHapticSelection();
              onOpenLuckyWheel?.();
            }}
            style={({ pressed }) => [
              styles.quickActionCard,
              {
                backgroundColor: "#F0F9FF",
                borderColor: "#BAE6FD",
                borderBottomColor: "#60A5FA",
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: "#E0F2FE" }]}>
              <Image source={ICONS.wheel} style={{ width: 20, height: 20 }} resizeMode="contain" />
            </View>
            <View style={styles.quickActionContent}>
              <Text numberOfLines={1} style={[styles.quickActionTitle, { color: "#1D4ED8" }]}>
                {canSpinWheel ? "ÇARK HAZIR" : "ŞANS ÇARKI"}
              </Text>
              <Text numberOfLines={1} style={[styles.quickActionSub, { color: "#2563EB" }]}>
                {canSpinWheel ? "Ücretsiz Çevir" : "Hediyeler"}
              </Text>
            </View>
            <View style={[styles.quickActionBadgePill, { backgroundColor: "#DBEAFE", borderColor: "#93C5FD" }]}>
              <Text style={[styles.quickActionBadgeText, { color: "#1D4ED8" }]}>➔</Text>
            </View>
          </Pressable>

          {unclaimedMissionsCount > 0 && (
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                onNavigate("missions");
              }}
              style={({ pressed }) => [
                styles.quickActionCard,
                { backgroundColor: "#EFFBF4", borderColor: "#A2DFBB" },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.quickActionIconWrap, { backgroundColor: "#DCF5E7" }]}>
                <Text style={styles.quickActionIcon}>📜</Text>
              </View>
              <View style={styles.quickActionContent}>
                <Text numberOfLines={1} style={[styles.quickActionTitle, { color: "#166544" }]}>
                  {unclaimedMissionsCount} GÖREV
                </Text>
                <Text numberOfLines={1} style={[styles.quickActionSub, { color: "#15803D" }]}>
                  Ödülü Al
                </Text>
              </View>
              <View style={[styles.quickActionBadgePill, { backgroundColor: "#DCF5E7", borderColor: "#88DFB3" }]}>
                <Text style={[styles.quickActionBadgeText, { color: "#166544" }]}>➔</Text>
              </View>
            </Pressable>
          )}
        </View>
      </Animated.View>

      <Animated.View
        style={{
          opacity: heroAnim,
          transform: [
            {
              translateY: heroAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        }}
      >
        <OrnatePanel accent="sapphire" showJewels={false} style={{ marginTop: 12 }} contentStyle={{ paddingHorizontal: 16, paddingVertical: 18 }}>
        <View style={styles.heroHead}>
          <View style={styles.deckEyebrowPill}>
            <Text style={styles.deckEyebrowText}>BİR KELİMEYLE BAŞLA</Text>
          </View>
          <InfoMini color="#176C97" onPress={() => setInfoModal("rotani")} />
        </View>
        <JewelTitle style={{ fontSize: 26, lineHeight: 30, marginTop: 6 }}>Azıcık mola. {"\n"}Bolca kelime.</JewelTitle>
        <View accessible={false} style={{ flexDirection: "row", gap: 7, marginTop: 14, marginBottom: 12 }}>
          {PATLAT_TILES.map((tile, index) => {
            const anim = tileAnims[index];
            const translateY = anim ? anim.interpolate({
              inputRange: [0, 0.45, 1],
              outputRange: [0, -8, 0],
            }) : 0;
            const scale = anim ? anim.interpolate({
              inputRange: [0, 0.45, 1],
              outputRange: [1, 1.1, 1],
            }) : 1;
            const gentleAngles = [-3, 2, -2, 3, -1, 2];
            const baseRotate = gentleAngles[index] ?? 0;
            const swingRotate = -baseRotate * 1.5;
            const rotate = anim ? anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [`${baseRotate}deg`, `${swingRotate}deg`, `${baseRotate}deg`],
            }) : `${baseRotate}deg`;

            const handleTileTap = () => {
              triggerHapticSelection();
              if (anim) {
                Animated.sequence([
                  Animated.timing(anim, { toValue: 1, duration: 160, useNativeDriver: true }),
                  Animated.spring(anim, { toValue: 0, tension: 260, friction: 6, useNativeDriver: true }),
                ]).start();
              }
            };

            return (
              <Pressable key={`${tile.letter}-${index}`} onPress={handleTileTap} style={{ flex: 1, maxWidth: 44 }}>
                <Animated.View
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: 13,
                    borderWidth: 1.5,
                    borderBottomWidth: 3.5,
                    borderColor: tile.border,
                    backgroundColor: tile.bg,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: tile.border,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.18,
                    shadowRadius: 3,
                    elevation: 3,
                    transform: [{ translateY }, { scale }, { rotate }],
                  }}
                >
                  <View style={styles.tileSheen} />
                  <Text style={{ color: tile.text, fontWeight: "900", fontSize: 22 }}>
                    {tile.letter}
                  </Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.deckBody}>Harfleri birleştir, gizli kelimeleri bul ve rekorunu kır.</Text>

        <Pressable
          onPress={() => {
            triggerHapticSelection();
            onNavigate("league");
          }}
          style={({ pressed }) => [styles.xpPanel, pressed && styles.pressed]}
        >
          <View style={styles.xpHead}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <GameGlyph source={ICONS.trophy} size={16} />
              <Text style={[styles.xpLabel, { color: "#16648B" }]}>LİG · {league.name}</Text>
              <Text style={{ color: "#176C97", fontSize: 11, fontWeight: "900" }}>➔</Text>
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
          <Animated.View style={{ width: "100%", transform: [{ scale: playPulseAnim }] }}>
            <GameButton
              label="Düelloya Başla"
              iconSource={ICONS.duel}
              iconSize={30}
              iconBoxStyle={{ backgroundColor: "transparent" }}
              variant="primary"
              size="lg"
              onPress={() => onNavigate("online")}
              style={{ width: "100%" }}
            />
          </Animated.View>
          
          <View style={styles.secondaryHeroRow}>
            <GameButton
              label="Arkadaşla Oyna"
              icon="👥"
              variant="friend"
              size="md"
              onPress={() => onNavigate("friends")}
              style={{ flex: 1 }}
            />
            <GameButton
              label="Pratik Yap"
              icon="🎯"
              variant="dark"
              size="md"
              onPress={() => {
                triggerHapticSelection();
                setShowBotPracticeModal(true);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </OrnatePanel>
      </Animated.View>

      <Animated.View
        style={{
          opacity: modesAnim,
          transform: [
            {
              translateY: modesAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
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
            colors={["#FFFFFF", "#FFF9F2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.columnCard, { borderColor: "#EAD5C3" }]}
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
              <View style={[styles.cardIconCircle, { borderColor: "#E8C8AE", backgroundColor: "#FFF4EA" }]}>
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
            colors={["#FFFFFF", "#FFF4F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.columnCard, { borderColor: "#F2D0D6" }]}
          >
            <View style={[styles.cardRibbonWrap, { flexDirection: "row", justifyContent: "center", position: "relative" }]}>
              <View style={[styles.cardRibbonAmber, { backgroundColor: "#FFF0F2", borderColor: "#F4B8C1" }]}>
                <Text style={[styles.cardRibbonTextAmber, { color: "#991B1B" }]}>10×10 MATRİS</Text>
              </View>
              {onOpenModeInfo && (
                <View style={{ position: "absolute", right: -2, top: -2, zIndex: 10 }}>
                  <InfoMini color="#991B1B" onPress={() => onOpenModeInfo("vintage")} />
                </View>
              )}
            </View>

            <View style={{ alignItems: "center", marginVertical: 6 }}>
              <View style={[styles.cardIconCircle, { borderColor: "#F2B6C0", backgroundColor: "#FFEBF0" }]}>
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
      </Animated.View>

      <DailyTreasureModal
        visible={showDailyRewardModal}
        onClose={() => setShowDailyRewardModal(false)}
        progress={progress}
        onClaim={() => {
          onClaimDailyReward?.();
        }}
      />

      <MatchHistoryModal
        visible={showHistoryModal}
        progress={progress}
        onClose={() => setShowHistoryModal(false)}
        onPlayNow={() => {
          setShowHistoryModal(false);
          onNavigate("online");
        }}
      />

      <NotificationCenterModal
        visible={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        progress={progress}
        unclaimedMissionsCount={unclaimedMissionsCount}
        isClaimedToday={isClaimedToday}
        canSpinWheel={canSpinWheel}
        lives={livesCalc.lives}
        onNavigate={onNavigate}
        onOpenDailyReward={() => setShowDailyRewardModal(true)}
        onOpenLuckyWheel={onOpenLuckyWheel}
        onOpenLivesModal={onOpenLivesModal}
      />
    </ScrollView>

    {/* Bildirim Çanı Butonu (Büyüteçin Tam Üstünde) */}
    <Pressable
      onPress={() => {
        triggerHapticSelection();
        setShowNotificationCenter(true);
      }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [styles.notificationFab, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Bildirimler"
    >
      <Text style={styles.notificationFabIcon}>🔔</Text>
      {(unclaimedMissionsCount > 0 || !isClaimedToday || canSpinWheel) && (
        <View style={styles.mysteryFabNotifyBadge}>
          <Text style={styles.mysteryFabNotifyText}>
            {unclaimedMissionsCount > 0 ? unclaimedMissionsCount : "!"}
          </Text>
        </View>
      )}
    </Pressable>

    {/* Günün Gizemli Kelimesi Büyüteç Butonu */}
    <Pressable
      onPress={() => {
        triggerHapticSelection();
        setInfoModal("mystery");
      }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [styles.mysteryFab, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Günün Gizemli Kelimesi"
    >
      <Text style={styles.mysteryFabIcon}>🔍</Text>
    </Pressable>
  </>;
}
