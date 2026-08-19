import { StyleSheet, Text, View } from "react-native";

export function MatchInsight({ score, opponentScore, words, opponentWords, tempo, opponentTempo, bestScore }: { score: number; opponentScore: number; words: number; opponentWords: number; tempo: number; opponentTempo: number; bestScore: number }) {
  const totalWords = Math.max(1, words + opponentWords);
  const yourShare = `${Math.max(8, Math.round(words / totalWords * 100))}%` as `${number}%`;
  const opponentShare = `${Math.max(8, Math.round(opponentWords / totalWords * 100))}%` as `${number}%`;
  const isRecord = score >= bestScore && score > 0;
  return <View style={styles.card}><View style={styles.head}><View><Text style={styles.kicker}>TUR ANALİZİ</Text><Text style={styles.title}>{isRecord ? "YENİ KİŞİSEL REKOR" : "ROTA RAPORU"}</Text></View><Text style={styles.pulse}>◌</Text></View><View style={styles.bars}><View style={styles.barLine}><Text style={styles.name}>SEN</Text><View style={styles.track}><View style={[styles.youFill, { width: yourShare }]} /></View><Text style={styles.value}>{words}</Text></View><View style={styles.barLine}><Text style={styles.name}>RAKİP</Text><View style={styles.track}><View style={[styles.opponentFill, { width: opponentShare }]} /></View><Text style={styles.value}>{opponentWords}</Text></View></View><View style={styles.metrics}><Metric label="PUAN" value={`${score} · ${opponentScore}`} /><Metric label="TEMPO" value={`${tempo} · ${opponentTempo}`} suffix="K/DK" /><Metric label="FARK" value={`${score - opponentScore >= 0 ? "+" : ""}${score - opponentScore}`} /></View></View>;
}

function Metric({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}<Text style={styles.metricSuffix}>{suffix ? ` ${suffix}` : ""}</Text></Text></View>;
}

const styles = StyleSheet.create({
  card: { marginTop: 10, padding: 13, borderRadius: 18, backgroundColor: "#211A3D", borderWidth: 1, borderColor: "#514073" }, head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, kicker: { color: "#B9ADD2", fontSize: 8, fontWeight: "900", letterSpacing: 1 }, title: { color: "#FFF9FC", fontSize: 13, fontWeight: "900", marginTop: 3 }, pulse: { color: "#55E6B2", fontSize: 22 }, bars: { marginTop: 12, gap: 8 }, barLine: { flexDirection: "row", alignItems: "center", gap: 8 }, name: { width: 32, color: "#C7BDDA", fontSize: 8, fontWeight: "900" }, track: { flex: 1, height: 7, borderRadius: 7, backgroundColor: "#423462", overflow: "hidden" }, youFill: { height: "100%", borderRadius: 7, backgroundColor: "#55E6B2" }, opponentFill: { height: "100%", borderRadius: 7, backgroundColor: "#FF758C" }, value: { width: 16, color: "#FFF9FC", fontSize: 9, fontWeight: "900", textAlign: "right" }, metrics: { marginTop: 14, paddingTop: 11, borderTopWidth: 1, borderTopColor: "#3C305D", flexDirection: "row", justifyContent: "space-between" }, metric: { flex: 1, alignItems: "center" }, metricLabel: { color: "#9589AE", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 }, metricValue: { color: "#FFF9FC", fontSize: 10, fontWeight: "900", marginTop: 3 }, metricSuffix: { color: "#B7ABCA", fontSize: 7 },
});
