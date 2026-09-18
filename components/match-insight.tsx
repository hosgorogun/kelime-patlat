import { StyleSheet, Text, View } from "react-native";

export function MatchInsight({
  score,
  opponentScore,
  words,
  opponentWords,
  tempo,
  opponentTempo,
  bestScore,
}: {
  score: number;
  opponentScore: number;
  words: number;
  opponentWords: number;
  tempo: number;
  opponentTempo: number;
  bestScore: number;
}) {
  const totalWords = Math.max(1, words + opponentWords);
  const yourPercent = Math.round((words / totalWords) * 100);
  const opponentPercent = 100 - yourPercent;
  const yourShare = words === 0 ? "0%" : (`${Math.max(10, yourPercent)}%` as `${number}%`);
  const opponentShare = opponentWords === 0 ? "0%" : (`${Math.max(10, opponentPercent)}%` as `${number}%`);
  const isRecord = score >= bestScore && score > 0;
  const scoreDiff = score - opponentScore;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.kicker}>PERFORMANS</Text>
        <Text style={styles.title}>
          {isRecord ? "🏆 YENİ KİŞİSEL REKOR" : "📊 ROTA VE TEMPO ANALİZİ"}
        </Text>
      </View>

      {/* Kelime Dağılım Çubukları */}
      <View style={styles.barsContainer}>
        <View style={styles.barRow}>
          <Text style={styles.barNameYou}>SEN</Text>
          <View style={styles.track}>
            <View style={[styles.youFill, { width: yourShare }]} />
          </View>
          <Text style={styles.barValYou}>{words} kelime (%{yourPercent})</Text>
        </View>

        <View style={styles.barRow}>
          <Text style={styles.barNameOpp}>RAKİP</Text>
          <View style={styles.track}>
            <View style={[styles.opponentFill, { width: opponentShare }]} />
          </View>
          <Text style={styles.barValOpp}>{opponentWords} kelime (%{opponentPercent})</Text>
        </View>
      </View>

      {/* Metrikler */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>PUAN</Text>
          <Text style={styles.metricValue}>{score} · {opponentScore}</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>TEMPO</Text>
          <Text style={styles.metricValue}>
            {tempo} · {opponentTempo} <Text style={styles.metricUnit}>K/DK</Text>
          </Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>FARK</Text>
          <Text
            style={[
              styles.metricValue,
              scoreDiff > 0 ? styles.textGreen : scoreDiff < 0 ? styles.textRed : null,
            ]}
          >
            {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
          </Text>
        </View>
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
    borderColor: "rgba(212, 180, 90, 0.25)",
  },
  header: {
    marginBottom: 8,
  },
  kicker: {
    color: "#E8C36A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 1,
    letterSpacing: 0.3,
  },
  barsContainer: {
    marginBottom: 10,
    gap: 6,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barNameYou: {
    width: 38,
    color: "#2DD4BF",
    fontSize: 9,
    fontWeight: "900",
  },
  barNameOpp: {
    width: 38,
    color: "#FB7185",
    fontSize: 9,
    fontWeight: "900",
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 5,
    backgroundColor: "#2E2450",
    overflow: "hidden",
  },
  youFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#2DD4BF",
  },
  opponentFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#FB7185",
  },
  barValYou: {
    width: 88,
    color: "#2DD4BF",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "right",
  },
  barValOpp: {
    width: 88,
    color: "#FB7185",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "right",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 180, 90, 0.2)",
  },
  metricBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(30, 24, 60, 0.6)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.15)",
  },
  metricLabel: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  metricUnit: {
    color: "#CBD5E1",
    fontSize: 8,
    fontWeight: "700",
  },
  textGreen: {
    color: "#34D399",
  },
  textRed: {
    color: "#FB7185",
  },
});
