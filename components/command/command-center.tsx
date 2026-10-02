import { styles } from './command-center.styles';
import { useEffect, useRef, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { type LeaderboardEntry } from "@/shared/game";
import { getLeagueTier, getRank, getPlayerLevel, getDailyMysteryWord, THEME_PACKS, AVATARS, getDayId, getCalculatedLives, canSpinLuckyWheel, type DailyChallenge, type PlayerProgress, type ThemePackId } from "@/shared/progression";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { PROFILE_FRAMES } from "@/shared/store-items";
import { palette } from "@/shared/palette";
import { GameButton, GameGlyph, GameIcon, GemChip, ICONS, JewelTitle, OrnatePanel, SectionLabel } from "@/components/game/game-ui";
import { MatchHistoryModal } from "@/components/match-history/match-history-modal";
import { DailyTreasureModal } from "@/components/modals/daily-treasure-modal";
import { BotPracticeModal } from "./bot-practice-modal";
import { CommandInfoModal, type InfoModalType } from "./command-info-modal";

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

  const [infoModal, setInfoModal] = useState<"shield" | "radar" | "lives" | "rotani" | "mystery" | null>(null);

  const [showBotPracticeModal, setShowBotPracticeModal] = useState(false);

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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text numberOfLines={1} style={[styles.name, { flexShrink: 1 }]}>{playerName}</Text>
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

      {/* Siber Şans Çarkı Banner */}
      <Pressable
        onPress={() => {
          triggerHapticSelection();
          onOpenLuckyWheel?.();
        }}
        style={({ pressed }) => [styles.luckyWheelBanner, pressed && styles.pressed]}
      >
        <Text style={styles.luckyWheelIcon}>🎡</Text>
        <Text style={styles.luckyWheelText}>
          {canSpinWheel ? "ŞANS ÇARKI · ÜCRETSİZ ÇEVİRME HAZIR!" : "ŞANS ÇARKI · GÜNLÜK HEDİYE ÇARKI"}
        </Text>
        <Text style={styles.luckyWheelAction}>{canSpinWheel ? "ÇEVİR ➔" : "AÇ ➔"}</Text>
      </Pressable>

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

      <SectionLabel title="ETKİNLİKLER" meta="GÜNLÜK KEŞİFLER" />

      <Pressable
        onPress={() => {
          triggerHapticSelection();
          setInfoModal("mystery");
        }}
        style={({ pressed }) => [styles.mysteryStripWrap, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={["#EAF3FD", "#D8EAFB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
          <LinearGradient
            colors={dailyDone ? ["#F4F6F2", "#E5ECE2"] : ["#E7F7EE", "#D3F2E0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.columnCard, { borderColor: dailyDone ? "#CBD6C6" : "#99DFC1" }]}
          >
            <View style={[styles.cardRibbonWrap, { flexDirection: "row", justifyContent: "center", position: "relative" }]}>
              <View style={styles.cardRibbonMint}>
                <Text style={styles.cardRibbonText}>GÜNÜN BULMACASI</Text>
              </View>
              {onOpenModeInfo && (
                <View style={{ position: "absolute", right: -2, top: -2, zIndex: 10 }}>
                  <InfoMini color="#147A57" onPress={() => onOpenModeInfo("daily")} />
                </View>
              )}
            </View>
            <View style={{ alignItems: "center", marginVertical: 4 }}>
              <View style={[styles.cardIconCircle, { borderColor: dailyDone ? "#CBD6C6" : "#7ED8AA", backgroundColor: dailyDone ? "#E6EDE3" : "#D0F4E1" }]}>
                <Text style={[styles.cardIconText, { color: dailyDone ? palette.muted : "#127552" }]}>{activeTheme.icon}</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { textAlign: "center" }]}>{dailyDone ? "TAMAMLANDI" : (daily.title || "GÜNÜN ROTASI").toLocaleUpperCase("tr-TR")}</Text>
            <Text style={[styles.cardBodyMint, { textAlign: "center" }]}>{dailyDone ? "Günün rotasını tekrar incele." : "Kelime paketini seç ve rotayı başlat!"}</Text>
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
          <LinearGradient
            colors={["#FFF4EA", "#FFE2CC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.columnCard, { borderColor: "#F7BE93" }]}
          >
            <View style={[styles.cardRibbonWrap, { flexDirection: "row", justifyContent: "center", position: "relative" }]}>
              <View style={styles.cardRibbonAmber}>
                <Text style={styles.cardRibbonTextAmber}>REKOR YARIŞI</Text>
              </View>
              {onOpenModeInfo && (
                <View style={{ position: "absolute", right: -2, top: -2, zIndex: 10 }}>
                  <InfoMini color="#B25610" onPress={() => onOpenModeInfo("arcade")} />
                </View>
              )}
            </View>
            <View style={{ alignItems: "center", marginVertical: 4 }}>
              <View style={[styles.cardIconCircle, { borderColor: "#F4AF79", backgroundColor: "#FFE0C0" }]}>
                <Text style={[styles.cardIconText, { color: "#B25610" }]}>⚡</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { textAlign: "center" }]}>SKOR HÜCUMU</Text>
            <Text style={[styles.cardBodyAmber, { textAlign: "center" }]}>Süre dolmadan en çok kelimeyi bağla ve rekor kır!</Text>
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
                <Text style={[styles.soloEyebrowText, { color: "#117753" }]}>
                  {unclaimedMilestonesCount > 0 ? `🎁 ${unclaimedMilestonesCount} SANDIK BEKLİYOR` : "100 SEVİYE"}
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.soloHeading}>SEVİYE YOLCULUĞU</Text>
              <Text numberOfLines={1} style={styles.soloDescEmerald}>
                Her bölümde yeni kelimeler
              </Text>
            </View>
            {onOpenModeInfo && (
              <InfoMini color="#117753" onPress={() => onOpenModeInfo("solo")} />
            )}
            <GameButton label="BAŞLA ▶" size="sm" variant="emerald" onPress={onSolo} style={styles.soloActionBtn} />
          </OrnatePanel>
        </Pressable>

        <Pressable onPress={() => onNavigate("vintage")} style={({ pressed }) => [pressed && styles.pressed]}>
          <OrnatePanel accent="ruby" showJewels={false} contentStyle={styles.soloHorizontalSkin}>
            <GameIcon emoji="🗞️" size={42} glow="#FB7185" />
            <View style={styles.soloMetaCol}>
              <View style={styles.soloEyebrowRow}>
                <Text style={[styles.soloEyebrowText, { color: "#B73F50" }]}>
                  20 BÖLÜM
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.soloHeading}>GAZETE BULMACASI</Text>
              <Text numberOfLines={1} style={styles.soloDescRuby}>
                Kare bulmaca ipuçlarını çöz
              </Text>
            </View>
            {onOpenModeInfo && (
              <InfoMini color="#B73F50" onPress={() => onOpenModeInfo("vintage")} />
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
