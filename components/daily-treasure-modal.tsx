import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@/shared/palette";
import { GameButton, OrnatePanel } from "@/components/game-ui";
import { DAILY_LOGIN_REWARDS, getDayId, type PlayerProgress } from "@/shared/progression";
import { triggerHapticSelection } from "@/shared/audio-haptics";

type DailyTreasureModalProps = {
  visible: boolean;
  onClose: () => void;
  progress: PlayerProgress;
  onClaim: () => void;
};

export function DailyTreasureModal({
  visible,
  onClose,
  progress,
  onClaim,
}: DailyTreasureModalProps) {
  const [isClaiming, setIsClaiming] = React.useState(false);
  const claimTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (claimTimerRef.current) clearTimeout(claimTimerRef.current);
    };
  }, []);
  const todayId = getDayId();
  const isClaimedToday = progress.lastLoginDay === todayId;
  const currentCount = progress.loginDaysCount || 0;
  const activeDayIndex = isClaimedToday ? (((currentCount || 1) - 1) % 7) : (currentCount % 7);
  const displayDayNumber = activeDayIndex + 1;
  const todayReward = DAILY_LOGIN_REWARDS[activeDayIndex]!;
  const nextReward = DAILY_LOGIN_REWARDS[(activeDayIndex + 1) % 7]!;

  const getRewardUnitName = (type: string) => {
    switch (type) {
      case "coins":
        return "ÇİP";
      case "shield":
        return "SERİ KALKANI";
      default:
        return "SEZON XP";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalCardWrapper}>
          <OrnatePanel accent="amber" showJewels contentStyle={styles.panelContent}>
            {/* Kapat Çarpısı */}
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                onClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>

            {/* Başlık ve İkon */}
            <View style={styles.headerIconRing}>
              <Text style={styles.headerEmoji}>🎁</Text>
            </View>

            <Text style={styles.kicker}>7 GÜNLÜK SERİ ÖDÜLÜ</Text>
            <Text style={styles.title}>GÜNLÜK HAZİNE</Text>
            <Text style={styles.subtitle}>
              Her gün oyuna giriş yap, zinciri kırma ve 7. günde epik Seri Kalkanlarını topla!
            </Text>

            {/* Durum Rozeti */}
            <View style={styles.statusPill}>
              <Text style={styles.statusPillDay}>GÜN {displayDayNumber} / 7</Text>
              <View style={styles.statusPillDivider} />
              <Text style={[styles.statusPillState, isClaimedToday ? styles.statusClaimed : styles.statusReady]}>
                {isClaimedToday ? "✓ BUGÜN ALINDI" : "⚡ ÖDÜL HAZIR"}
              </Text>
            </View>

            {/* 7 Günlük Takvim Izgarası (4 + 3 Yerleşim) */}
            <View style={styles.daysGrid}>
              {/* İlk 4 Gün (Üst Satır) */}
              <View style={styles.daysRow}>
                {DAILY_LOGIN_REWARDS.slice(0, 4).map((item, index) => {
                  const isPast = index < activeDayIndex;
                  const isToday = index === activeDayIndex;
                  const isTodayClaimable = isToday && !isClaimedToday;
                  const isTodayClaimed = isToday && isClaimedToday;

                  return (
                    <Pressable
                      key={item.day}
                      disabled={!isTodayClaimable || isClaiming}
                      onPress={() => {
                        if (isClaiming || isClaimedToday) return;
                        setIsClaiming(true);
                        triggerHapticSelection();
                        onClaim();
                        if (claimTimerRef.current) clearTimeout(claimTimerRef.current);
                        claimTimerRef.current = setTimeout(() => setIsClaiming(false), 2000);
                      }}
                      style={[
                        styles.dayCard,
                        isPast && styles.dayCardPast,
                        isTodayClaimable && styles.dayCardClaimable,
                        isTodayClaimed && styles.dayCardClaimed,
                      ]}
                    >
                      <Text style={[styles.dayLabel, isTodayClaimable && styles.dayLabelActive]}>
                        {item.day}. GÜN
                      </Text>
                      <Text style={styles.dayIcon}>{item.icon}</Text>
                      <Text style={[styles.dayAmount, isTodayClaimable && styles.dayAmountActive]}>
                        +{item.amount}
                      </Text>
                      <Text style={styles.dayUnit}>{getRewardUnitName(item.rewardType)}</Text>

                      {isPast && (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      )}
                      {isTodayClaimed && (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Son 3 Gün (Alt Satır, 7. Gün Epik ve Genişletilmiş) */}
              <View style={styles.daysRow}>
                {DAILY_LOGIN_REWARDS.slice(4, 6).map((item, sliceIdx) => {
                  const index = 4 + sliceIdx;
                  const isPast = index < activeDayIndex;
                  const isToday = index === activeDayIndex;
                  const isTodayClaimable = isToday && !isClaimedToday;
                  const isTodayClaimed = isToday && isClaimedToday;

                  return (
                    <Pressable
                      key={item.day}
                      disabled={!isTodayClaimable}
                      onPress={() => {
                        triggerHapticSelection();
                        onClaim();
                      }}
                      style={[
                        styles.dayCard,
                        isPast && styles.dayCardPast,
                        isTodayClaimable && styles.dayCardClaimable,
                        isTodayClaimed && styles.dayCardClaimed,
                      ]}
                    >
                      <Text style={[styles.dayLabel, isTodayClaimable && styles.dayLabelActive]}>
                        {item.day}. GÜN
                      </Text>
                      <Text style={styles.dayIcon}>{item.icon}</Text>
                      <Text style={[styles.dayAmount, isTodayClaimable && styles.dayAmountActive]}>
                        +{item.amount}
                      </Text>
                      <Text style={styles.dayUnit}>{getRewardUnitName(item.rewardType)}</Text>

                      {(isPast || isTodayClaimed) && (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}

                {/* 7. Gün - EPİK GÜN */}
                {(() => {
                  const item = DAILY_LOGIN_REWARDS[6]!;
                  const index = 6;
                  const isPast = index < activeDayIndex;
                  const isToday = index === activeDayIndex;
                  const isTodayClaimable = isToday && !isClaimedToday;
                  const isTodayClaimed = isToday && isClaimedToday;

                  return (
                    <Pressable
                      key={item.day}
                      disabled={!isTodayClaimable || isClaiming}
                      onPress={() => {
                        if (isClaiming || isClaimedToday) return;
                        setIsClaiming(true);
                        triggerHapticSelection();
                        onClaim();
                        if (claimTimerRef.current) clearTimeout(claimTimerRef.current);
                        claimTimerRef.current = setTimeout(() => setIsClaiming(false), 2000);
                      }}
                      style={[
                        styles.dayCard,
                        styles.dayCardEpic,
                        isPast && styles.dayCardPast,
                        isTodayClaimable && styles.dayCardClaimable,
                        isTodayClaimed && styles.dayCardClaimed,
                      ]}
                    >
                      <View style={styles.epicTag}>
                        <Text style={styles.epicTagText}>✦ EPİK ✦</Text>
                      </View>
                      <Text style={[styles.dayLabel, styles.dayLabelEpic, isTodayClaimable && styles.dayLabelActive]}>
                        7. GÜN
                      </Text>
                      <Text style={styles.dayIconEpic}>{item.icon}</Text>
                      <Text style={[styles.dayAmount, styles.dayAmountEpic]}>
                        +{item.amount}
                      </Text>
                      <Text style={styles.dayUnitEpic}>{getRewardUnitName(item.rewardType)}</Text>

                      {(isPast || isTodayClaimed) && (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })()}
              </View>
            </View>

            {/* Aksiyon Alanı */}
            {!isClaimedToday ? (
              <GameButton
                label={isClaiming ? "ÖDÜL ALINIYOR..." : `ÖDÜLÜ TOPLA  (+${todayReward.amount} ${getRewardUnitName(todayReward.rewardType)})`}
                icon={isClaiming ? "⏳" : "🎁"}
                size="lg"
                variant="gold"
                disabled={isClaiming || isClaimedToday}
                onPress={() => {
                  if (isClaiming || isClaimedToday) return;
                  setIsClaiming(true);
                  triggerHapticSelection();
                  onClaim();
                  if (claimTimerRef.current) clearTimeout(claimTimerRef.current);
                  claimTimerRef.current = setTimeout(() => setIsClaiming(false), 2000);
                }}
                style={styles.claimButton}
              />
            ) : (
              <View style={styles.claimedContainer}>
                <View style={styles.claimedBanner}>
                  <Text style={styles.claimedBannerText}>
                    ✓ Bugünkü ödülünü başarıyla topladın!
                  </Text>
                  <Text style={styles.claimedNextText}>
                    Yarınki Ödül: {nextReward.icon} +{nextReward.amount} {getRewardUnitName(nextReward.rewardType)}
                  </Text>
                </View>

                <GameButton
                  label="HARİKA!"
                  size="md"
                  variant="emerald"
                  onPress={() => {
                    triggerHapticSelection();
                    onClose();
                  }}
                  style={styles.closeActionBtn}
                />
              </View>
            )}
          </OrnatePanel>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(35,48,59,0.42)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalCardWrapper: {
    width: "100%",
    maxWidth: 380,
  },
  panelContent: {
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 16,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeBtnText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: "900",
  },
  headerIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 194, 74, 0.16)",
    borderWidth: 2,
    borderColor: "#DCE1D7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerEmoji: {
    fontSize: 28,
  },
  kicker: {
    color: "#98732c",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  title: {
    color: palette.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 2,
    textShadowColor: "transparent",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  subtitle: {
    color: palette.mutedGold,
    fontSize: 14,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F5ED",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
    gap: 8,
  },
  statusPillDay: {
    color: "#98732c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  statusPillDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255, 194, 74, 0.3)",
  },
  statusPillState: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  statusReady: {
    color: palette.gold,
  },
  statusClaimed: {
    color: palette.emerald,
  },
  daysGrid: {
    width: "100%",
    gap: 8,
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: "row",
    gap: 6,
    width: "100%",
  },
  dayCard: {
    flex: 1,
    minHeight: 82,
    borderRadius: 14,
    backgroundColor: "#F0F5ED",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
    position: "relative",
  },
  dayCardPast: {
    backgroundColor: "rgba(35,48,59,0.42)",
    borderColor: "#DCE1D7",
    opacity: 0.7,
  },
  dayCardClaimable: {
    backgroundColor: "#FFF0E8",
    borderColor: "#DCE1D7",
    borderWidth: 2,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    transform: [{ scale: 1.03 }],
  },
  dayCardClaimed: {
    backgroundColor: "#F0F5ED",
    borderColor: palette.emerald,
  },
  dayCardEpic: {
    flex: 1.4,
    backgroundColor: "#FFF0E8",
    borderColor: "#DCE1D7",
    borderWidth: 2,
  },
  epicTag: {
    position: "absolute",
    top: -8,
    backgroundColor: "#ffee94",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  epicTagText: {
    color: "#293541",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  dayLabel: {
    color: "#293541",
    fontSize: 8.5,
    fontWeight: "800",
    marginBottom: 2,
  },
  dayLabelActive: {
    color: "#98732c",
    fontWeight: "900",
  },
  dayLabelEpic: {
    color: "#957d00",
    marginTop: 2,
  },
  dayIcon: {
    fontSize: 18,
    marginVertical: 2,
  },
  dayIconEpic: {
    fontSize: 20,
    marginVertical: 2,
  },
  dayAmount: {
    color: palette.text,
    fontSize: 11,
    fontWeight: "900",
  },
  dayAmountActive: {
    color: "#98732c",
  },
  dayAmountEpic: {
    color: "#957d00",
    fontSize: 12,
  },
  dayUnit: {
    color: palette.muted,
    fontSize: 7.5,
    fontWeight: "700",
    marginTop: 1,
  },
  dayUnitEpic: {
    color: "#8a773e",
    fontSize: 7.5,
    fontWeight: "800",
    marginTop: 1,
  },
  checkBadge: {
    position: "absolute",
    bottom: 3,
    right: 3,
    backgroundColor: palette.emerald,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#293541",
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 11,
  },
  claimButton: {
    width: "100%",
    marginTop: 4,
  },
  claimedContainer: {
    width: "100%",
    alignItems: "center",
  },
  claimedBanner: {
    width: "100%",
    backgroundColor: "rgba(62, 232, 181, 0.12)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  claimedBannerText: {
    color: palette.emerald,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  claimedNextText: {
    color: palette.text,
    fontSize: 9.5,
    fontWeight: "700",
    marginTop: 3,
  },
  closeActionBtn: {
    width: "100%",
  },
});
