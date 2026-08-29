import { useState } from "react";
import { Pressable, StyleSheet, Text, View, Modal, Alert } from "react-native";

export function OnboardingGuide({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: "1. BAĞLANTI PROTOKOLÜ 🔗",
      description: "Harfleri birleştirmek için parmağını yatay veya dikey komşu hücrelere sürükle.\n\n⚠️ Çapraz (diyagonal) bağlantılar güvenlik duvarı tarafından engellenmiştir.",
      icon: "⚡",
    },
    {
      title: "2. VERİ DEŞİFRESİ 💾",
      description: "Tahtadaki her bir harf mutlaka gizli kelimelerden birine aittir.\n\nKelimeler kıvrılarak ilerleyebilir. Doğru kelimeyi bağladığında harfler yeşil neonla kilitlenir.",
      icon: "🔓",
    },
    {
      title: "3. RADAR DESTEĞİ 👁",
      description: "Tıkandığında RADAR butonunu aktif et. Radar, kalan hedef kelimelerin başlangıç ve bitiş düğümlerini neon ışıkla işaretler.",
      icon: "👁",
    },
  ];

  const currentSlide = slides[slide]!;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.overline}>SİSTEME GİRİŞ YAPILDI · EĞİTİM MODÜLÜ</Text>
          
          <View style={styles.slideContent}>
            <Text style={styles.icon}>{currentSlide.icon}</Text>
            <Text style={styles.title}>{currentSlide.title}</Text>
            <Text style={styles.description}>{currentSlide.description}</Text>
          </View>

          {/* Carousel Indicators */}
          <View style={styles.indicatorRow}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === slide ? styles.indicatorActive : null
                ]}
              />
            ))}
          </View>

          <View style={styles.buttonRow}>
            {slide > 0 ? (
              <Pressable onPress={() => setSlide(slide - 1)} style={styles.backBtn}>
                <Text style={styles.backBtnText}>GERİ</Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {slide < slides.length - 1 ? (
              <Pressable onPress={() => setSlide(slide + 1)} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>İLERİ →</Text>
              </Pressable>
            ) : (
              <Pressable onPress={onClose} style={[styles.nextBtn, styles.finishBtn]}>
                <Text style={[styles.nextBtnText, { color: "#121025" }]}>TERMİNALİ AÇ</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(10, 8, 22, 0.88)", justifyContent: "center", alignItems: "center" },
  container: { width: "86%", borderRadius: 24, borderWidth: 1.5, borderColor: "#7C5CF6", backgroundColor: "#16122C", padding: 22, alignItems: "center" },
  overline: { color: "#7C5CF6", fontSize: 8, fontWeight: "900", letterSpacing: 1, marginBottom: 16 },
  slideContent: { alignItems: "center", minHeight: 180, justifyContent: "center" },
  icon: { fontSize: 42, marginBottom: 12 },
  title: { color: "#FFF9FC", fontSize: 16, fontWeight: "900", letterSpacing: 0.5, marginBottom: 12, textAlign: "center" },
  description: { color: "#B5A9CD", fontSize: 11, textAlign: "center", lineHeight: 17, paddingHorizontal: 10 },
  indicatorRow: { flexDirection: "row", gap: 6, marginVertical: 20 },
  indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#3D335C" },
  indicatorActive: { width: 16, backgroundColor: "#00F5D4" },
  buttonRow: { flexDirection: "row", gap: 12, width: "100%", marginTop: 8 },
  backBtn: { flex: 1, height: 42, borderRadius: 12, borderWidth: 1, borderColor: "#413660", alignItems: "center", justifyContent: "center" },
  backBtnText: { color: "#B5A9CD", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  nextBtn: { flex: 1, height: 42, borderRadius: 12, backgroundColor: "#7C5CF6", alignItems: "center", justifyContent: "center" },
  nextBtnText: { color: "#FFF9FC", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  finishBtn: { backgroundColor: "#00F5D4" }
});
