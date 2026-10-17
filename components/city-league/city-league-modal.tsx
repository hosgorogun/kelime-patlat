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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>🇹🇷</Text>
              <View>
                <Text style={styles.headerTitle}>81 İL LİGİ</Text>
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
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Active Player City Banner */}
          <View style={styles.myCityCard}>
            {userCityStanding ? (
              <View style={styles.myCityRow}>
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
                    ⚡ {userCityStanding.weeklyScore.toLocaleString("tr-TR")} Puan • {userCityStanding.playerCount} Oyuncu
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.noCityNotice}>
                <Text style={styles.noCityIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noCityTitle}>Henüz Şehrini Seçmedin!</Text>
                  <Text style={styles.noCitySub}>
                    Aşağıdan şehrini seç; her bulduğun kelime memleketinin puanına eklensin!
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Top 3 Podium Cards */}
          {top3.length >= 3 && !searchQuery && selectedRegion === "ALL" && (
            <View style={styles.podiumContainer}>
              {/* 2nd Place */}
              <View style={[styles.podiumItem, styles.podiumSilver]}>
                <Text style={styles.podiumMedal}>🥈</Text>
                <Text style={styles.podiumCityName} numberOfLines={1}>{top3[1]?.city}</Text>
                <Text style={styles.podiumScore}>{top3[1]?.weeklyScore.toLocaleString("tr-TR")}p</Text>
              </View>

              {/* 1st Place */}
              <View style={[styles.podiumItem, styles.podiumGold]}>
                <Text style={styles.podiumCrown}>👑</Text>
                <Text style={styles.podiumMedal}>🥇</Text>
                <Text style={[styles.podiumCityName, styles.podiumGoldName]} numberOfLines={1}>
                  {top3[0]?.city}
                </Text>
                <Text style={[styles.podiumScore, styles.podiumGoldScore]}>
                  {top3[0]?.weeklyScore.toLocaleString("tr-TR")}p
                </Text>
              </View>

              {/* 3rd Place */}
              <View style={[styles.podiumItem, styles.podiumBronze]}>
                <Text style={styles.podiumMedal}>🥉</Text>
                <Text style={styles.podiumCityName} numberOfLines={1}>{top3[2]?.city}</Text>
                <Text style={styles.podiumScore}>{top3[2]?.weeklyScore.toLocaleString("tr-TR")}p</Text>
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
              placeholderTextColor="#64748B"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchBtn}
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
                  style={[styles.regionTab, active && styles.regionTabActive]}
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
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Şehir ligi yükleniyor...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            >
              {filteredCities.map((item) => {
                const isSelected = selectedCity && isEqualTr(item.city, selectedCity);
                const isSaving = savingCity === item.city;

                return (
                  <View
                    key={item.city}
                    style={[
                      styles.cityRow,
                      isSelected && styles.cityRowSelected,
                    ]}
                  >
                    {/* Rank */}
                    <View style={styles.cityRankBox}>
                      <Text style={[styles.cityRankText, item.rank <= 3 && styles.cityRankTopText]}>
                        #{item.rank}
                      </Text>
                    </View>

                    {/* Plate */}
                    <View style={styles.cityPlateBox}>
                      <Text style={styles.cityPlateText}>
                        {String(item.plate).padStart(2, "0")}
                      </Text>
                    </View>

                    {/* City Info */}
                    <View style={styles.cityInfoBox}>
                      <View style={styles.cityNameLine}>
                        <Text style={[styles.cityNameText, isSelected && styles.cityNameSelected]}>
                          {item.city}
                        </Text>
                        <Text style={styles.cityRegionTag}>{item.region}</Text>
                      </View>
                      <Text style={styles.cityPointsText}>
                        ⚡ {item.weeklyScore.toLocaleString("tr-TR")} Puan • 👥 {item.playerCount}
                      </Text>
                    </View>

                    {/* Selection Action Button */}
                    <Pressable
                      disabled={isSelected || isSaving}
                      onPress={() => handleCityPick(item.city)}
                      style={[
                        styles.selectBtn,
                        isSelected && styles.selectBtnActive,
                        isSaving && styles.selectBtnLoading,
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

          {/* Footer Note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Her hafta Pazar 23:59&apos;da haftalık şehir sıralaması sıfırlanır ve şampiyon il ödüllendirilir!
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#0B1120",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
    height: "92%",
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  headerSub: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "bold",
  },
  myCityCard: {
    backgroundColor: "#131C31",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#223555",
    marginBottom: 10,
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
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "900",
  },
  rankPill: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  rankPillText: {
    color: "#34D399",
    fontSize: 10,
    fontWeight: "800",
  },
  myCityScoreText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  noCityNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noCityIcon: {
    fontSize: 24,
  },
  noCityTitle: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "800",
  },
  noCitySub: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 15,
  },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 6,
  },
  podiumItem: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
  },
  podiumGold: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "#F59E0B",
    transform: [{ translateY: -6 }],
  },
  podiumSilver: {
    backgroundColor: "rgba(148, 163, 184, 0.12)",
    borderColor: "#94A3B8",
  },
  podiumBronze: {
    backgroundColor: "rgba(205, 127, 50, 0.12)",
    borderColor: "#CD7F32",
  },
  podiumCrown: {
    fontSize: 14,
    marginBottom: -4,
  },
  podiumMedal: {
    fontSize: 18,
    marginBottom: 2,
  },
  podiumCityName: {
    color: "#F1F5F9",
    fontSize: 12,
    fontWeight: "800",
  },
  podiumGoldName: {
    color: "#FBBF24",
    fontSize: 13,
  },
  podiumScore: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  podiumGoldScore: {
    color: "#FDE68A",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131C31",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    height: 42,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    color: "#64748B",
    fontSize: 14,
  },
  regionTabsWrapper: {
    maxHeight: 34,
    marginBottom: 8,
  },
  regionTabsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  regionTab: {
    backgroundColor: "#131C31",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  regionTabActive: {
    backgroundColor: "#065F46",
    borderColor: "#10B981",
  },
  regionTabText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },
  regionTabTextActive: {
    color: "#FFFFFF",
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
    gap: 6,
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
    gap: 8,
  },
  cityRowSelected: {
    backgroundColor: "#064E3B",
    borderColor: "#10B981",
  },
  cityRankBox: {
    width: 28,
    alignItems: "center",
  },
  cityRankText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
  },
  cityRankTopText: {
    color: "#FBBF24",
  },
  cityPlateBox: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cityPlateText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "900",
  },
  cityInfoBox: {
    flex: 1,
  },
  cityNameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cityNameText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
  },
  cityNameSelected: {
    color: "#34D399",
  },
  cityRegionTag: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "600",
  },
  cityPointsText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },
  selectBtn: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  selectBtnActive: {
    backgroundColor: "#10B981",
  },
  selectBtnLoading: {
    backgroundColor: "#334155",
  },
  selectBtnText: {
    color: "#F1F5F9",
    fontSize: 11,
    fontWeight: "800",
  },
  selectBtnActiveText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  footer: {
    paddingVertical: 8,
    alignItems: "center",
  },
  footerText: {
    color: "#475569",
    fontSize: 9.5,
    textAlign: "center",
    lineHeight: 13,
  },
});
