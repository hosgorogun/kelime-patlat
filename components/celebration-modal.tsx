import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getTierColor, LEAGUE_TIERS } from "@/shared/progression";
import { haptics } from "@/lib/haptics";
import { gameSfx } from "@/lib/game-sfx";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const RANK_IMAGES: Record<string, any> = {
  DEMİR: require("../assets/ranks/iron.jpg"),
  BRONZ: require("../assets/ranks/bronze.jpg"),
  GÜMÜŞ: require("../assets/ranks/silver.jpg"),
  ALTIN: require("../assets/ranks/gold.jpg"),
  PLATİN: require("../assets/ranks/platinum.jpg"),
  ELMAS: require("../assets/ranks/diamond.jpg"),
  YÜCELİK: require("../assets/ranks/ascendant.jpg"),
  ÖLÜMSÜZLÜK: require("../assets/ranks/immortal.jpg"),
  RADIAN: require("../assets/ranks/radian.jpg"),
};

export type CelebrationModalData =
  | {
      type: "level-up";
      level: number;
      unlockHint?: string;
      bonusCoins?: number;
    }
  | {
      type: "league-promotion";
      previousTier: string;
      newTier: string;
      newLp: number;
    };

interface CelebrationModalProps {
  data: CelebrationModalData | null;
  onClose: () => void;
}

export function getLevelUpDetails(level: number) {
  if (level === 2) {
    return {
      title: "ÇAYLAK ADIMI",
      unlocks: ["Temel Düellolar", "+15 Çip Ödülü", "Canlar Yenilendi 💚"],
      coins: 15,
    };
  }
  if (level === 3) {
    return {
      title: "ROTA MİMARI",
      unlocks: ["Yeni Avatar: Orbit 🪐", "Yeni Unvan: [MİMAR]", "+25 Çip Ödülü"],
      coins: 25,
    };
  }
  if (level === 4) {
    return {
      title: "STRATEJİ USTASI",
      unlocks: ["Hızlı Eşleşme Önceliği", "+15 Çip Ödülü", "Canlar Yenilendi 💚"],
      coins: 15,
    };
  }
  if (level === 5) {
    return {
      title: "MATRİS GENİŞLEMESİ",
      unlocks: ["6×6 Matris Düello Modu ⚡", "Gelişmiş Harita Kilitleri", "+35 Çip Ödülü"],
      coins: 35,
    };
  }
  if (level === 6) {
    return {
      title: "BİLGE MATRİS",
      unlocks: ["Yeni Avatar: Bilge Sage 🧙", "Yeni Unvan: [KOD BİLGE]", "+25 Çip Ödülü"],
      coins: 25,
    };
  }
  if (level === 7) {
    return {
      title: "DÜELLO KIDEMLİSİ",
      unlocks: ["Özel Zafer Rozeti", "+20 Çip Ödülü", "Canlar Yenilendi 💚"],
      coins: 20,
    };
  }
  if (level === 8) {
    return {
      title: "BÜYÜK TAHTA",
      unlocks: ["8×8 Matris Düello Modu 🏆", "Usta Seviye Kilitleri", "+40 Çip Ödülü"],
      coins: 40,
    };
  }
  if (level === 9) {
    return {
      title: "ELİT KELİME AVCISI",
      unlocks: ["Gelişmiş İpucu Avantajı", "+20 Çip Ödülü", "Canlar Yenilendi 💚"],
      coins: 20,
    };
  }
  if (level === 10) {
    return {
      title: "MATRİS EFSANESİ",
      unlocks: ["10×10 Matris Düello Modu 👑", "Yeni Unvan: [MATRİS EFSANESİ]", "+50 Çip Ödülü"],
      coins: 50,
    };
  }
  if (level === 15) {
    return {
      title: "SİBER OVERLORD",
      unlocks: ["Yeni Unvan: [SİBER HAKİM] 🌌", "+75 Çip Ödülü", "Maksimum Prestij Rozeti"],
      coins: 75,
    };
  }
  const coins = level % 5 === 0 ? 50 : 15;
  return {
    title: `SEVİYE ${level}`,
    unlocks: ["Profil Rozet Seviyesi Arttı ⭐", `+${coins} Çip Ödülü`, "Canlar Yenilendi 💚"],
    coins,
  };
}

export function getLeaguePromotionDetails(tierName: string) {
  const found = LEAGUE_TIERS.find((t) => t.tier === tierName);
  const color = found?.color || getTierColor(tierName);

  switch (tierName) {
    case "BRONZ":
      return { perk: "Bronz Sezon Rozeti Açıldı", multiplier: "+%10 Çip", color, icon: "🛡️" };
    case "GÜMÜŞ":
      return { perk: "Gümüş Sezon Sonu Sandığı", multiplier: "+%20 Çip", color, icon: "🛡️" };
    case "ALTIN":
      return { perk: "Nadir Profil Çerçevesi & Altın Kartal Rozeti", multiplier: "+%35 Çip", color, icon: "🦅" };
    case "PLATİN":
      return { perk: "Özel Zafer Efekti & Platin Çerçeve", multiplier: "+%50 Çip", color, icon: "🪽" };
    case "ELMAS":
      return { perk: "Epik Elmas Profil Teması", multiplier: "+%75 Çip", color, icon: "💎" };
    case "YÜCELİK":
      return { perk: "Efsanevi Kristal Amblem & VIP Eşleşme", multiplier: "+%100 Çip", color, icon: "🔮" };
    case "ÖLÜMSÜZLÜK":
      return { perk: "Ölümsüzlük Alevi & Şampiyonlar Kulübü", multiplier: "+%150 Çip", color, icon: "🔥" };
    case "RADIAN":
      return { perk: "Zirve Radian Tacı & Hologram Prestij Rozeti", multiplier: "+%200 Çip", color, icon: "👑" };
    default:
      return { perk: "Kademeli Sıralama Mücadelesi", multiplier: "Standart", color, icon: "🛡️" };
  }
}

// 12 adet konfeti parçacığı için rastgele değerler
const CONFETTI_PIECES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: (i * (SCREEN_WIDTH / 14)) + (Math.random() * 15 - 7),
  size: 7 + (i % 5) * 2,
  color: ["#FFD66E", "#38BDF8", "#34D399", "#F472B6", "#FB923C", "#A78BFA"][i % 6]!,
  delay: (i * 70) % 500,
}));

export function CelebrationModal({ data, onClose }: CelebrationModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!data) return;

    // Zafer sesi ve titreşim
    try {
      gameSfx.victory();
      haptics.success();
    } catch {
      // ignore
    }

    // Modal açılış animasyonu
    scaleAnim.setValue(0.75);
    opacityAnim.setValue(0);
    confettiAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 14,
        stiffness: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: true,
      }),
    ]).start();

    // Nabız parlaması
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [data, confettiAnim, opacityAnim, pulseAnim, scaleAnim]);

  if (!data) return null;

  const isLevelUp = data.type === "level-up";
  const levelDetails = isLevelUp ? getLevelUpDetails(data.level) : null;
  const leagueDetails = !isLevelUp ? getLeaguePromotionDetails(data.newTier) : null;
  const rankImage = !isLevelUp ? RANK_IMAGES[data.newTier] : null;

  const handleConfirm = () => {
    haptics.light();
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleConfirm}>
      <View style={styles.overlay}>
        {/* Konfeti Parçacıkları */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {CONFETTI_PIECES.map((p) => {
            const translateY = confettiAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-40, 600 + p.id * 15],
            });
            const rotate = confettiAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", `${360 + p.id * 45}deg`],
            });
            return (
              <Animated.View
                key={p.id}
                style={[
                  styles.confettiItem,
                  {
                    left: p.x,
                    width: p.size,
                    height: p.size * 1.4,
                    backgroundColor: p.color,
                    transform: [{ translateY }, { rotate }],
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Ana Modal Kartı */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Işıltılı Arka Plan Efekti */}
          <Animated.View
            style={[
              styles.glowOrb,
              {
                backgroundColor: isLevelUp ? "rgba(255, 214, 110, 0.25)" : `${leagueDetails?.color}35`,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Rozet / Amblem Alanı */}
          <View style={styles.badgeContainer}>
            {isLevelUp ? (
              <View style={styles.levelBadgeCircle}>
                <Text style={styles.levelBadgeStar}>⭐</Text>
                <Text style={styles.levelBadgeNum}>{data.level}</Text>
                <Text style={styles.levelBadgeLabel}>SEVİYE</Text>
              </View>
            ) : (
              <View style={[styles.leagueImgWrap, { borderColor: leagueDetails?.color || "#F0C855" }]}>
                {rankImage ? (
                  <Image source={rankImage} style={styles.leagueImg} resizeMode="cover" />
                ) : (
                  <Text style={styles.leagueIconText}>{leagueDetails?.icon || "🏆"}</Text>
                )}
              </View>
            )}
          </View>

          {/* Kicker & Başlık */}
          <View style={styles.headerTextBox}>
            <View
              style={[
                styles.kickerTag,
                {
                  backgroundColor: isLevelUp ? "#FFF9E6" : `${leagueDetails?.color}18`,
                  borderColor: isLevelUp ? "#F0C855" : `${leagueDetails?.color}44`,
                },
              ]}
            >
              <Text
                style={[
                  styles.kickerText,
                  { color: isLevelUp ? "#98732c" : leagueDetails?.color || "#293541" },
                ]}
              >
                {isLevelUp ? "🎉 TEBRİKLER! YENİ SEVİYE" : `🏆 LİG TERFİSİ: ${data.previousTier} ➔ ${data.newTier}`}
              </Text>
            </View>

            <Text style={styles.mainTitle}>
              {isLevelUp ? `${data.level}. SEVİYEYE ULAŞTIN!` : `${data.newTier} LİGİNE YÜKSELDİN!`}
            </Text>

            <Text style={styles.subTitle}>
              {isLevelUp
                ? data.unlockHint || "Yeni yetenekler, avatarlar ve kilitli özellikler açıldı!"
                : `Üstün maç performansınla ${data.newLp} LP barajını aştın ve yeni kademeye terfi ettin.`}
            </Text>
          </View>

          {/* Açılan Yenilikler & Ödüller Kartı */}
          <View style={styles.perksCard}>
            <Text style={styles.perksTitle}>
              {isLevelUp ? "KAZANILAN ÖDÜLLER VE YENİLİKLER" : "KADEME AVANTAJLARI VE ÖDÜLLER"}
            </Text>

            {isLevelUp ? (
              <View style={styles.perksList}>
                {levelDetails?.unlocks.map((item, idx) => (
                  <View key={idx} style={styles.perkRow}>
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                    <Text style={styles.perkText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.perksList}>
                <View style={styles.perkRow}>
                  <View style={[styles.checkCircle, { backgroundColor: "#FFF9E6" }]}>
                    <Text style={[styles.checkMark, { color: "#98732c" }]}>🎖️</Text>
                  </View>
                  <Text style={styles.perkText}>{leagueDetails?.perk}</Text>
                </View>
                <View style={styles.perkRow}>
                  <View style={[styles.checkCircle, { backgroundColor: "#E6F9F0" }]}>
                    <Text style={[styles.checkMark, { color: "#16a34a" }]}>⚡</Text>
                  </View>
                  <Text style={styles.perkText}>Maç Başı Çip Çarpanı: {leagueDetails?.multiplier}</Text>
                </View>
                <View style={styles.perkRow}>
                  <View style={[styles.checkCircle, { backgroundColor: "#EFF6FF" }]}>
                    <Text style={[styles.checkMark, { color: "#2563eb" }]}>🛡️</Text>
                  </View>
                  <Text style={styles.perkText}>Profil ve Liderlik Tablosunda Yeni Amblem</Text>
                </View>
              </View>
            )}
          </View>

          {/* Aksiyon Butonu */}
          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          >
            <Text style={styles.actionButtonText}>
              {isLevelUp ? "HARİKA, DEVAM ET ➔" : "KADEMEYE BAŞLA 🚀"}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(35, 48, 59, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confettiItem: {
    position: "absolute",
    borderRadius: 3,
    top: 0,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#DCE1D7",
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
    position: "relative",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  glowOrb: {
    position: "absolute",
    top: 14,
    width: 140,
    height: 140,
    borderRadius: 70,
    zIndex: 0,
  },
  badgeContainer: {
    zIndex: 1,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadgeCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFF9E6",
    borderWidth: 3,
    borderColor: "#F0C855",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F0C855",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  levelBadgeStar: {
    fontSize: 16,
    marginBottom: -2,
  },
  levelBadgeNum: {
    fontSize: 32,
    fontWeight: "900",
    color: "#293541",
    lineHeight: 36,
  },
  levelBadgeLabel: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: "#98732c",
  },
  leagueImgWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 3,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F5ED",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  leagueImg: {
    width: "100%",
    height: "100%",
  },
  leagueIconText: {
    fontSize: 42,
  },
  headerTextBox: {
    alignItems: "center",
    zIndex: 1,
    marginBottom: 16,
  },
  kickerTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  kickerText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  mainTitle: {
    color: "#293541",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  subTitle: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 8,
    fontWeight: "700",
  },
  perksCard: {
    width: "100%",
    backgroundColor: "#F8FAF5",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    padding: 14,
    marginBottom: 18,
    zIndex: 1,
  },
  perksTitle: {
    color: "#8c7540",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
    textAlign: "center",
  },
  perksList: {
    gap: 8,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E6F9F0",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: "#16a34a",
    fontSize: 11,
    fontWeight: "900",
  },
  perkText: {
    flex: 1,
    color: "#293541",
    fontSize: 11.5,
    fontWeight: "800",
  },
  actionButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#FFD66E",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#F0C855",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  actionButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    color: "#293541",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
