import { StyleSheet, Text, View } from "react-native";
import { getLeagueTier, type PlayerProgress } from "../shared/progression";

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
            <Text style={styles.coinsText}>🪙 +{coinsEarned} ÇİP</Text>
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
            <View style={[styles.badge, styles.expBadge]}>
              <View style={styles.badgeTop}>
                <Text style={styles.badgeIcon}>⚡</Text>
                <Text style={styles.expLabel}>KAZANILAN EXP</Text>
              </View>
              <Text style={styles.expValue}>+{xpEarned} EXP</Text>
              <Text style={styles.badgeSub}>Profil seviyene eklendi</Text>
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
                {isLpGain ? `+${lpEarned} LP` : isLpLoss ? `${lpEarned} LP` : "0 LP"}
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
    backgroundColor: "rgba(12, 42, 34, 0.9)",
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.3)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    color: "#CBD5E1",
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
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  coinsText: {
    color: "#FBBF24",
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
    borderColor: "rgba(245, 158, 11, 0.35)",
  },
  lpGainBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.35)",
  },
  lpLossBadge: {
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderColor: "rgba(244, 63, 94, 0.35)",
  },
  lpNeutralBadge: {
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    borderColor: "rgba(148, 163, 184, 0.2)",
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
    color: "#FBBF24",
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
    color: "#FDE047",
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
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
  },
  leagueFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 180, 90, 0.18)",
    gap: 6,
  },
  leagueIcon: {
    fontSize: 13,
  },
  leagueName: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  leagueDot: {
    color: "#64748B",
    fontSize: 10,
  },
  leagueTotal: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },
  leagueTotalBold: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  textGreen: {
    color: "#34D399",
  },
  textRed: {
    color: "#FB7185",
  },
  textGray: {
    color: "#CBD5E1",
  },
  customMatchBox: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.35)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginVertical: 6,
  },
  customMatchTitle: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  customMatchSub: {
    color: "#94A3B8",
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
    borderColor: "rgba(245, 158, 11, 0.45)",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: "#F59E0B",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
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
    color: "#FBBF24",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  streakBannerSub: {
    color: "#FDE68A",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 1,
  },
  streakLpPill: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  streakLpPillText: {
    color: "#051A14",
    fontSize: 11,
    fontWeight: "900",
  },
  crushingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.4)",
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
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  crushingBannerSub: {
    color: "#BAE6FD",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 1,
  },
  crushingPill: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderWidth: 1,
    borderColor: "#38BDF8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  crushingPillText: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "900",
  },
});
