import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getLeagueTier, type PlayerProgress } from "../shared/progression";

function useAnimatedCounter(targetValue: number, duration: number = 700) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (targetValue === 0) {
      setDisplayValue(0);
      return;
    }
    let startTimestamp: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(easeProgress * targetValue));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [targetValue, duration]);

  return displayValue;
}

export function MatchRewardsCard({
  progress,
  xpEarned = 0,
  lpEarned = 0,
  currentLp,
  coinsEarned,
  isCustom = false,
  pvpWinStreak,
  streakBonus,
  isCrushingWin,
}: {
  progress?: PlayerProgress;
  xpEarned: number;
  lpEarned: number;
  currentLp?: number;
  coinsEarned?: number;
  isCustom?: boolean;
  pvpWinStreak?: number;
  streakBonus?: number;
  isCrushingWin?: boolean;
}) {
  const league = getLeagueTier(progress ?? currentLp ?? 0);
  const isLpGain = lpEarned > 0;
  const isLpLoss = lpEarned < 0;

  const animatedXp = useAnimatedCounter(xpEarned, 700);
  const animatedLp = useAnimatedCounter(Math.abs(lpEarned), 700);
  const animatedCoins = useAnimatedCounter(coinsEarned ?? 0, 600);

  const winStreak = pvpWinStreak ?? progress?.lastMatchReward?.pvpWinStreak ?? progress?.pvpWinStreak ?? 0;
  const streakBonusLp = streakBonus ?? progress?.lastMatchReward?.streakBonus ?? 0;
  const crushing = isCrushingWin ?? progress?.lastMatchReward?.isCrushingWin ?? false;

  return (
    <View style={styles.card}>
      {/* Başlık ve Çip Bilgisi */}
      <View style={styles.header}>
        <Text style={styles.title}>{isCustom ? "🤝 DOSTLUK MAÇI" : "🎖️ MAÇ SONU KAZANIMLARI"}</Text>
        {!isCustom && coinsEarned !== undefined && coinsEarned > 0 && (
          <View style={styles.coinsBadge}>
            <Text style={styles.coinsText}>🪙 +{animatedCoins} ÇİP</Text>
          </View>
        )}
      </View>

      {/* Özel / Arkadaş Odası: Unranked Banner */}
      {isCustom ? (
        <View style={styles.customMatchBox}>
          <Text style={styles.customMatchTitle}>DOSTLUK DÜELLOSU · DERECESİZ</Text>
          <Text style={styles.customMatchSub}>
            Arkadaşlarla oynanan özel odalarda ve davet maçlarında lig puanı (LP) ve deneyim puanı (EXP) kazanılmaz.
          </Text>
        </View>
      ) : (
        <>
          {/* Galibiyet Serisi Bandı */}
          {winStreak >= 2 && isLpGain && (
            <View style={styles.streakBanner}>
              <View style={styles.streakBannerLeft}>
                <Text style={styles.streakBannerFire}>🔥</Text>
                <View>
                  <Text style={styles.streakBannerTitle}>{winStreak} MAÇLIK GALİBİYET SERİSİ!</Text>
                  <Text style={styles.streakBannerSub}>
                    {streakBonusLp > 0 ? `+${streakBonusLp} LP Ekstra Seri Bonusu Uygulandı!` : "Serini koruyorsun, devam et!"}
                  </Text>
                </View>
              </View>
              {streakBonusLp > 0 && (
                <View style={styles.streakLpPill}>
                  <Text style={styles.streakLpPillText}>+{streakBonusLp} LP</Text>
                </View>
              )}
            </View>
          )}

          {/* Ezici Galibiyet Bandı */}
          {crushing && isLpGain && (
            <View style={styles.crushingBanner}>
              <View style={styles.crushingBannerLeft}>
                <Text style={styles.crushingBannerIcon}>⚡</Text>
                <View>
                  <Text style={styles.crushingBannerTitle}>EZİCİ GALİBİYET!</Text>
                  <Text style={styles.crushingBannerSub}>Yüksek tempo ve skor üstünlüğü ödülü</Text>
                </View>
              </View>
              <View style={styles.crushingPill}>
                <Text style={styles.crushingPillText}>+5 LP · +5 🪙</Text>
              </View>
            </View>
          )}

          {/* İki Ayrı Kart: EXP ve LİG PUANI */}
          <View style={styles.badgesRow}>
            {/* EXP Kartı */}
            <View style={[styles.badge, xpEarned > 0 ? styles.expBadge : styles.expZeroBadge]}>
              <View style={styles.badgeTop}>
                <Text style={styles.badgeIcon}>⚡</Text>
                <Text style={[styles.expLabel, xpEarned === 0 && styles.textGray]}>KAZANILAN EXP</Text>
              </View>
              <Text style={[styles.expValue, xpEarned === 0 && styles.textGray]}>
                {xpEarned > 0 ? `+${animatedXp} EXP` : "0 EXP"}
              </Text>
              <Text style={styles.badgeSub}>
                {xpEarned > 0 ? "Profil seviyene eklendi" : "Kelime bulunamadı"}
              </Text>
            </View>

            {/* LP Kartı */}
            <View
              style={[
                styles.badge,
                isLpGain ? styles.lpGainBadge : isLpLoss ? styles.lpLossBadge : styles.lpNeutralBadge,
              ]}
            >
              <View style={styles.badgeTop}>
                <Text style={styles.badgeIcon}>{isLpGain ? "▲" : isLpLoss ? "▼" : "▪"}</Text>
                <Text
                  style={[
                    styles.lpLabel,
                    isLpGain ? styles.textGreen : isLpLoss ? styles.textRed : styles.textGray,
                  ]}
                >
                  {isLpGain ? "KAZANILAN LİG" : isLpLoss ? "KAYBEDİLEN LİG" : "LİG DEĞİŞİMİ"}
                </Text>
              </View>
              <Text
                style={[
                  styles.lpValue,
                  isLpGain ? styles.textGreen : isLpLoss ? styles.textRed : styles.textGray,
                ]}
              >
                {isLpGain ? `+${animatedLp} LP` : isLpLoss ? `-${animatedLp} LP` : "0 LP"}
              </Text>
              <Text style={styles.badgeSub}>
                {isLpGain ? "Liginde yükseliyorsun!" : isLpLoss ? "Rövanşla puanı geri al!" : "Puanın korundu"}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Lig Derecesi Satırı */}
      <View style={styles.leagueFooter}>
        <Text style={styles.leagueIcon}>{league.icon}</Text>
        <Text style={[styles.leagueName, { color: league.color }]}>{league.name}</Text>
        <Text style={styles.leagueDot}>•</Text>
        <Text style={styles.leagueTotal}>
          Toplam: <Text style={styles.leagueTotalBold}>{league.totalPoints} LP</Text>
          {` (${league.currentTierPoints}/${league.targetTierPoints} LP)`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    alignSelf: "stretch",
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  coinsBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  coinsText: {
    color: "#9b7616",
    fontSize: 10,
    fontWeight: "900",
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1.5,
  },
  expBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "#DCE1D7",
  },
  expZeroBadge: {
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    borderColor: "#DCE1D7",
  },
  lpGainBadge: {
    backgroundColor: "#F0F5ED",
    borderColor: "#DCE1D7",
  },
  lpLossBadge: {
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderColor: "#DCE1D7",
  },
  lpNeutralBadge: {
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    borderColor: "#DCE1D7",
  },
  badgeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeIcon: {
    fontSize: 11,
  },
  expLabel: {
    color: "#9b7616",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  lpLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  expValue: {
    color: "#8b7b27",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: 0.4,
  },
  lpValue: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: 0.4,
  },
  badgeSub: {
    color: "#293541",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
  },
  leagueFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#DCE1D7",
    gap: 6,
  },
  leagueIcon: {
    fontSize: 13,
  },
  leagueName: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  leagueDot: {
    color: "#293541",
    fontSize: 10,
  },
  leagueTotal: {
    color: "#293541",
    fontSize: 10,
    fontWeight: "700",
  },
  leagueTotalBold: {
    color: "#293541",
    fontWeight: "900",
  },
  textGreen: {
    color: "#279f73",
  },
  textRed: {
    color: "#bd5564",
  },
  textGray: {
    color: "#293541",
  },
  customMatchBox: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginVertical: 6,
  },
  customMatchTitle: {
    color: "#2a8fbc",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  customMatchSub: {
    color: "#293541",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
    fontWeight: "600",
  },
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  streakBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  streakBannerFire: {
    fontSize: 20,
  },
  streakBannerTitle: {
    color: "#9b7616",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  streakBannerSub: {
    color: "#847848",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 1,
  },
  streakLpPill: {
    backgroundColor: "#fbd699",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  streakLpPillText: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
  },
  crushingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  crushingBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  crushingBannerIcon: {
    fontSize: 18,
  },
  crushingBannerTitle: {
    color: "#2a8fbc",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  crushingBannerSub: {
    color: "#293541",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 1,
  },
  crushingPill: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  crushingPillText: {
    color: "#2a8fbc",
    fontSize: 10,
    fontWeight: "900",
  },
});
