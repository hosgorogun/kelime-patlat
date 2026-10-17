import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { TURKISH_CITIES, type CityStanding, type TurkishRegion } from "@/shared/cities";
import { triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { normalizeTr, isEqualTr } from "@/shared/tr-utils";

type CityLeagueModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedCity?: string;
  standings?: CityStanding[];
  onSelectCity: (cityName: string) => Promise<void> | void;
  isLoading?: boolean;
};

const REGIONS: Array<{ id: "ALL" | TurkishRegion; label: string }> = [
  { id: "ALL", label: "TÜMÜ (81)" },
  { id: "Marmara", label: "Marmara" },
  { id: "İç Anadolu", label: "İç Anadolu" },
  { id: "Ege", label: "Ege" },
  { id: "Akdeniz", label: "Akdeniz" },
  { id: "Karadeniz", label: "Karadeniz" },
  { id: "Güneydoğu Anadolu", label: "Güneydoğu" },
  { id: "Doğu Anadolu", label: "Doğu" },
];

export function CityLeagueModal({
  visible,
  onClose,
  selectedCity,
  standings = [],
  onSelectCity,
  isLoading = false,
}: CityLeagueModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<"ALL" | TurkishRegion>("ALL");
  const [savingCity, setSavingCity] = useState<string | null>(null);

  // Merge standings with all 81 cities if standings list is partial
  const mergedStandings = useMemo(() => {
    const map = new Map<string, CityStanding>();
    for (const s of standings) {
      map.set(s.city.toLowerCase(), s);
    }

    const list: CityStanding[] = TURKISH_CITIES.map((c, index) => {
      const found = map.get(c.name.toLowerCase());
      if (found) return found;
      return {
        city: c.name,
        plate: c.plate,
        region: c.region,
        totalScore: 0,
        weeklyScore: 0,
        playerCount: 0,
        rank: index + 1,
      };
    });

    if (standings.length > 0) {
      list.sort((a, b) => b.weeklyScore - a.weeklyScore);
      list.forEach((item, idx) => {
        item.rank = idx + 1;
      });
    }

    return list;
  }, [standings]);

  // Current user's city standing
  const userCityStanding = useMemo(() => {
    if (!selectedCity) return null;
    return mergedStandings.find((s) => isEqualTr(s.city, selectedCity)) ?? null;
  }, [selectedCity, mergedStandings]);

  // Filtered cities
  const filteredCities = useMemo(() => {
    const q = normalizeTr(searchQuery.trim().toLowerCase());
    return mergedStandings.filter((item) => {
      if (selectedRegion !== "ALL" && item.region !== selectedRegion) {
        return false;
      }
      if (!q) return true;
      const nameMatch = normalizeTr(item.city.toLowerCase()).includes(q);
      const plateMatch = String(item.plate).padStart(2, "0").includes(q);
      return nameMatch || plateMatch;
    });
  }, [mergedStandings, searchQuery, selectedRegion]);

  // Top 3 Podium
  const top3 = useMemo(() => {
    return mergedStandings.slice(0, 3);
  }, [mergedStandings]);

  const handleCityPick = async (cityName: string) => {
    if (savingCity) return;
    setSavingCity(cityName);
    triggerHapticSuccess();
    try {
      await onSelectCity(cityName);
    } finally {
      setSavingCity(null);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.flagIconRing}>
                <Text style={styles.headerIcon}>🇹🇷</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.headerBadgeRow}>
                  <Text style={styles.headerTitle}>81 İL LİGİ</Text>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>CANLI</Text>
                  </View>
                </View>
                <Text style={styles.headerSub}>Şehrin İçin Yarış • Zirveye Taşı</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              onPress={() => {
                triggerHapticSelection();
                onClose();
              }}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Active Player City Banner / Callout */}
          <View style={styles.myCityCardWrapper}>
            {userCityStanding ? (
              <View style={styles.myCityCardActive}>
                <View style={styles.myCityRow}>
                  {/* Authentic Turkish License Plate */}
                  <View style={styles.plateBadge}>
                    <View style={styles.plateTrSection}>
                      <Text style={styles.plateTrText}>TR</Text>
                    </View>
                    <Text style={styles.plateNumber}>
                      {String(userCityStanding.plate).padStart(2, "0")}
                    </Text>
                  </View>

                  <View style={styles.myCityInfo}>
                    <View style={styles.myCityTitleRow}>
                      <Text style={styles.myCityName}>{userCityStanding.city}</Text>
                      <View style={styles.rankPill}>
                        <Text style={styles.rankPillText}>#{userCityStanding.rank}. Sırada</Text>
                      </View>
                    </View>
                    <Text style={styles.myCityScoreText}>
                      ⚡ {userCityStanding.weeklyScore.toLocaleString("tr-TR")} Puan • 👥 {userCityStanding.playerCount} Oyuncu
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noCityNotice}>
                <View style={styles.noCityIconWrapper}>
                  <Text style={styles.noCityIcon}>📍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noCityTitle}>Henüz Şehrini Seçmedin!</Text>
                  <Text style={styles.noCitySub}>
                    Aşağıdan şehrini seç; her bulduğun kelime memleketinin puanına eklensin!
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 3D Olympic Stepped Podium for Top 3 */}
          {top3.length >= 3 && !searchQuery && selectedRegion === "ALL" && (
            <View style={styles.podiumSection}>
              <View style={styles.podiumContainer}>
                {/* 2nd Place (Silver - Left) */}
                <View style={[styles.podiumColumn, styles.podiumColSilver]}>
                  <View style={[styles.podiumMedalRing, styles.silverMedalRing]}>
                    <Text style={styles.podiumMedal}>🥈</Text>
                  </View>
                  <View style={[styles.podiumPedestal, styles.silverPedestal]}>
                    <Text style={styles.podiumRankLabel}>#2</Text>
                    <Text style={styles.podiumCityName} numberOfLines={1}>{top3[1]?.city}</Text>
                    <View style={styles.podiumScoreBadge}>
                      <Text style={styles.podiumScoreText}>
                        ⚡ {top3[1]?.weeklyScore.toLocaleString("tr-TR")}p
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 1st Place (Gold Champion - Center, Elevated) */}
                <View style={[styles.podiumColumn, styles.podiumColGold]}>
                  <Text style={styles.podiumCrown}>👑</Text>
                  <View style={[styles.podiumMedalRing, styles.goldMedalRing]}>
                    <Text style={styles.podiumMedal}>🥇</Text>
                  </View>
                  <View style={[styles.podiumPedestal, styles.goldPedestal]}>
                    <Text style={styles.podiumGoldRankLabel}>#1 ŞAMPİYON</Text>
                    <Text style={[styles.podiumCityName, styles.podiumGoldName]} numberOfLines={1}>
                      {top3[0]?.city}
                    </Text>
                    <View style={styles.podiumGoldScoreBadge}>
                      <Text style={styles.podiumGoldScoreText}>
                        ⚡ {top3[0]?.weeklyScore.toLocaleString("tr-TR")}p
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 3rd Place (Bronze - Right) */}
                <View style={[styles.podiumColumn, styles.podiumColBronze]}>
                  <View style={[styles.podiumMedalRing, styles.bronzeMedalRing]}>
                    <Text style={styles.podiumMedal}>🥉</Text>
                  </View>
                  <View style={[styles.podiumPedestal, styles.bronzePedestal]}>
                    <Text style={styles.podiumRankLabel}>#3</Text>
                    <Text style={styles.podiumCityName} numberOfLines={1}>{top3[2]?.city}</Text>
                    <View style={styles.podiumScoreBadge}>
                      <Text style={styles.podiumScoreText}>
                        ⚡ {top3[2]?.weeklyScore.toLocaleString("tr-TR")}p
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Şehir adı veya plaka ara (örn: 34, İzmir)..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Region Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.regionTabsScroll}
            style={styles.regionTabsWrapper}
          >
            {REGIONS.map((r) => {
              const active = selectedRegion === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => {
                    triggerHapticSelection();
                    setSelectedRegion(r.id);
                  }}
                  style={({ pressed }) => [
                    styles.regionTab,
                    active && styles.regionTabActive,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[styles.regionTabText, active && styles.regionTabTextActive]}>
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Standings List */}
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>Şehir ligi sıralaması yükleniyor...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {filteredCities.map((item) => {
                const isSelected = selectedCity && isEqualTr(item.city, selectedCity);
                const isSaving = savingCity === item.city;
                const isTop1 = item.rank === 1;
                const isTop2 = item.rank === 2;
                const isTop3 = item.rank === 3;

                return (
                  <View
                    key={item.city}
                    style={[
                      styles.cityRow,
                      isSelected && styles.cityRowSelected,
                      isTop1 && styles.cityRowTop1,
                    ]}
                  >
                    {/* Rank Badge */}
                    <View
                      style={[
                        styles.cityRankBox,
                        isTop1 && styles.rankBoxGold,
                        isTop2 && styles.rankBoxSilver,
                        isTop3 && styles.rankBoxBronze,
                      ]}
                    >
                      <Text
                        style={[
                          styles.cityRankText,
                          (isTop1 || isTop2 || isTop3) && styles.cityRankTopText,
                        ]}
                      >
                        {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `#${item.rank}`}
                      </Text>
                    </View>

                    {/* Realistic Turkish Plate Badge */}
                    <View style={styles.cityPlateBadge}>
                      <View style={styles.cityPlateTr}>
                        <Text style={styles.cityPlateTrText}>TR</Text>
                      </View>
                      <Text style={styles.cityPlateNumber}>
                        {String(item.plate).padStart(2, "0")}
                      </Text>
                    </View>

                    {/* City Info */}
                    <View style={styles.cityInfoBox}>
                      <View style={styles.cityNameLine}>
                        <Text
                          style={[
                            styles.cityNameText,
                            isSelected && styles.cityNameSelected,
                            isTop1 && styles.cityNameTop1,
                          ]}
                          numberOfLines={1}
                        >
                          {item.city}
                        </Text>
                        <View style={styles.cityRegionCapsule}>
                          <Text style={styles.cityRegionTag}>{item.region}</Text>
                        </View>
                      </View>
                      <Text style={styles.cityPointsText}>
                        ⚡ <Text style={styles.cityPointsHighlight}>{item.weeklyScore.toLocaleString("tr-TR")}</Text> Puan • 👥 {item.playerCount}
                      </Text>
                    </View>

                    {/* Selection Action Button */}
                    <Pressable
                      disabled={isSelected || isSaving}
                      onPress={() => handleCityPick(item.city)}
                      style={({ pressed }) => [
                        styles.selectBtn,
                        isSelected && styles.selectBtnActive,
                        isSaving && styles.selectBtnLoading,
                        pressed && !isSelected && styles.selectBtnPressed,
                      ]}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : isSelected ? (
                        <Text style={styles.selectBtnActiveText}>✓ ŞEHRİM</Text>
                      ) : (
                        <Text style={styles.selectBtnText}>SEÇ</Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Tournament Footer Note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ⏱ Her hafta Pazar 23:59&apos;da haftalık şehir sıralaması sıfırlanır ve şampiyon il ödüllendirilir!
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "92%",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    width: "100%",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  flagIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF1F2",
    borderWidth: 2,
    borderColor: "#FECDD3",
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 22,
  },
  headerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#059669",
  },
  liveBadgeText: {
    color: "#059669",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerSub: {
    color: "#64748B",
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnPressed: {
    backgroundColor: "#E2E8F0",
    transform: [{ scale: 0.95 }],
  },
  closeBtnText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "900",
  },
  myCityCardWrapper: {
    width: "100%",
    marginBottom: 10,
  },
  myCityCardActive: {
    backgroundColor: "#ECFDF5",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
  },
  myCityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  plateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#0F172A",
    overflow: "hidden",
    height: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  plateTrSection: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 5,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  plateTrText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  plateNumber: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    paddingHorizontal: 8,
    letterSpacing: 0.5,
  },
  myCityInfo: {
    flex: 1,
  },
  myCityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  myCityName: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  rankPill: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#059669",
  },
  rankPillText: {
    color: "#065F46",
    fontSize: 10,
    fontWeight: "900",
  },
  myCityScoreText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  noCityNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFBEB",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  noCityIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  noCityIcon: {
    fontSize: 20,
  },
  noCityTitle: {
    color: "#B45309",
    fontSize: 13.5,
    fontWeight: "900",
  },
  noCitySub: {
    color: "#78350F",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  podiumSection: {
    width: "100%",
    marginBottom: 10,
  },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  podiumColumn: {
    flex: 1,
    alignItems: "center",
  },
  podiumColGold: {
    transform: [{ translateY: -4 }],
  },
  podiumColSilver: {},
  podiumColBronze: {},
  podiumCrown: {
    fontSize: 16,
    marginBottom: -4,
  },
  podiumMedalRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderWidth: 1.5,
  },
  goldMedalRing: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  silverMedalRing: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  bronzeMedalRing: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FDBA74",
  },
  podiumMedal: {
    fontSize: 16,
  },
  podiumPedestal: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
  },
  goldPedestal: {
    minHeight: 84,
    backgroundColor: "#FFFBEB",
    borderColor: "#F59E0B",
    borderBottomColor: "#D97706",
  },
  silverPedestal: {
    minHeight: 74,
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderBottomColor: "#94A3B8",
  },
  bronzePedestal: {
    minHeight: 68,
    backgroundColor: "#FFF7ED",
    borderColor: "#FDBA74",
    borderBottomColor: "#EA580C",
  },
  podiumRankLabel: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "900",
    marginBottom: 1,
  },
  podiumGoldRankLabel: {
    color: "#B45309",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  podiumCityName: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  podiumGoldName: {
    color: "#B45309",
    fontSize: 13,
  },
  podiumScoreBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  podiumScoreText: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "800",
  },
  podiumGoldScoreBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 3,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  podiumGoldScoreText: {
    color: "#B45309",
    fontSize: 10,
    fontWeight: "900",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    height: 42,
    marginBottom: 8,
    width: "100%",
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#0F172A",
    fontSize: 12.5,
    fontWeight: "600",
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "bold",
  },
  regionTabsWrapper: {
    maxHeight: 34,
    marginBottom: 8,
    width: "100%",
  },
  regionTabsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  regionTab: {
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  regionTabActive: {
    backgroundColor: "#059669",
    borderColor: "#047857",
    borderBottomWidth: 3,
  },
  regionTabText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
  },
  regionTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  listScroll: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingBottom: 16,
    gap: 7,
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  cityRowSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  cityRowTop1: {
    borderColor: "#FDE68A",
  },
  cityRankBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  rankBoxGold: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  rankBoxSilver: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  rankBoxBronze: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FDBA74",
  },
  cityRankText: {
    color: "#64748B",
    fontSize: 10.5,
    fontWeight: "900",
  },
  cityRankTopText: {
    fontSize: 13,
  },
  cityPlateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#0F172A",
    overflow: "hidden",
    height: 22,
  },
  cityPlateTr: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 3,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cityPlateTrText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "900",
  },
  cityPlateNumber: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 4,
  },
  cityInfoBox: {
    flex: 1,
  },
  cityNameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cityNameText: {
    color: "#0F172A",
    fontSize: 13.5,
    fontWeight: "900",
  },
  cityNameSelected: {
    color: "#059669",
  },
  cityNameTop1: {
    color: "#B45309",
  },
  cityRegionCapsule: {
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  cityRegionTag: {
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "700",
  },
  cityPointsText: {
    color: "#64748B",
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 1,
  },
  cityPointsHighlight: {
    color: "#D97706",
    fontWeight: "800",
  },
  selectBtn: {
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "#047857",
  },
  selectBtnPressed: {
    borderBottomWidth: 1,
    transform: [{ translateY: 2 }],
  },
  selectBtnActive: {
    backgroundColor: "#0284C7",
    borderBottomColor: "#0369A1",
  },
  selectBtnLoading: {
    backgroundColor: "#94A3B8",
    borderBottomColor: "#64748B",
  },
  selectBtnText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  selectBtnActiveText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  footer: {
    paddingVertical: 8,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    width: "100%",
  },
  footerText: {
    color: "#64748B",
    fontSize: 9.5,
    textAlign: "center",
    lineHeight: 13,
    fontWeight: "600",
  },
});
