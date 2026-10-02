import React from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { getLeagueTier } from "@/shared/progression";

const RANK_IMAGES: Record<string, any> = {
  DEMİR: require("../../assets/ranks/iron.jpg"),
  BRONZ: require("../../assets/ranks/bronze.jpg"),
  GÜMÜŞ: require("../../assets/ranks/silver.jpg"),
  ALTIN: require("../../assets/ranks/gold.jpg"),
  PLATİN: require("../../assets/ranks/platinum.jpg"),
  ELMAS: require("../../assets/ranks/diamond.jpg"),
  YÜCELİK: require("../../assets/ranks/ascendant.jpg"),
  ÖLÜMSÜZLÜK: require("../../assets/ranks/immortal.jpg"),
  RADIAN: require("../../assets/ranks/radian.jpg"),
};

export type SeasonResetModalData = {
  newSeasonId: string;
  previousRank: string;
  previousLp: number;
  newLp: number;
};

export function SeasonResetModal({
  data,
  onClose,
}: {
  data: SeasonResetModalData;
  onClose: () => void;
}) {
  const prevTier = getLeagueTier(data.previousLp);
  const newTier = getLeagueTier(data.newLp);

  const prevImg = RANK_IMAGES[prevTier.tier];
  const newImg = RANK_IMAGES[newTier.tier];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header Trophy Circle */}
          <View style={styles.trophyCircle}>
            <Text style={{ fontSize: 36 }}>🏆</Text>
          </View>

          <View style={styles.seasonTag}>
            <Text style={styles.seasonTagText}>SEZON {data.newSeasonId}</Text>
          </View>

          <Text style={styles.title}>YENİ SEZON BAŞLADI!</Text>

          {/* Rank comparison cards */}
          <View style={styles.compareRow}>
            {/* Previous season */}
            <View style={styles.tierCardPrev}>
              <Text style={styles.tierKickerPrev}>ÖNCEKİ SEZON</Text>
              <View style={[styles.tierImgBox, { borderColor: prevTier.color }]}>
                {prevImg ? (
                  <Image source={prevImg} style={styles.tierImg} resizeMode="cover" />
                ) : (
                  <Text style={{ color: prevTier.color, fontSize: 20, fontWeight: "900" }}>{prevTier.icon}</Text>
                )}
              </View>
              <Text style={[styles.tierName, { color: prevTier.color }]}>{data.previousRank}</Text>
              <Text style={styles.tierLp}>{data.previousLp} LP</Text>
            </View>

            {/* Arrow icon */}
            <View style={styles.arrowBox}>
              <Text style={{ color: "#8c7540", fontSize: 13, fontWeight: "900" }}>➔</Text>
            </View>

            {/* New season */}
            <View style={styles.tierCardNew}>
              <Text style={styles.tierKickerNew}>YENİ DERECE</Text>
              <View style={[styles.tierImgBoxNew, { borderColor: newTier.color }]}>
                {newImg ? (
                  <Image source={newImg} style={styles.tierImg} resizeMode="cover" />
                ) : (
                  <Text style={{ color: newTier.color, fontSize: 20, fontWeight: "900" }}>{newTier.icon}</Text>
                )}
              </View>
              <Text style={styles.tierNameNew}>{newTier.tier}</Text>
              <Text style={styles.tierLpNew}>{data.newLp} LP</Text>
            </View>
          </View>

          <Text style={styles.descText}>
            Kademeli lig puanı sıfırlaması uygulandı. Yeni sezonda liderlik sıralamasında zirveye tırmanmak için hemen yarışmaya katıl!
          </Text>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Text style={styles.actionBtnText}>YENİ SEZONA BAŞLA 🚀</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(35,48,59,0.42)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#F0F5ED",
    borderColor: "#DCE1D7",
    borderWidth: 2,
    width: "90%",
    maxWidth: 390,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 28,
    alignItems: "center",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  trophyCircle: {
    width: 72,
    height: 72,
    borderRadius: 26,
    backgroundColor: "#FFF9E6",
    borderWidth: 2,
    borderColor: "#F0C855",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  seasonTag: {
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0C855",
    marginBottom: 8,
  },
  seasonTagText: {
    color: "#98732c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  title: {
    color: "#293541",
    textAlign: "center",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 18,
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    marginBottom: 20,
  },
  tierCardPrev: {
    flex: 1,
    backgroundColor: "#F0F5ED",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  tierKickerPrev: {
    color: "#293541",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tierImgBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  tierImg: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  tierName: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  tierLp: {
    color: "#293541",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
  arrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(201, 162, 39, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  tierCardNew: {
    flex: 1,
    backgroundColor: "rgba(6, 182, 212, 0.14)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#DCE1D7",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tierKickerNew: {
    color: "#2a9c7a",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tierImgBoxNew: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "rgba(62, 232, 181, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  tierNameNew: {
    color: "#293541",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  tierLpNew: {
    color: "#2a9c7a",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2,
  },
  descText: {
    color: "#293541",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  actionButton: {
    alignSelf: "stretch",
    height: 52,
    borderRadius: 18,
    backgroundColor: "#aef5e0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    color: "#293541",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
