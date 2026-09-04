import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, Modal, ScrollView } from "react-native";

export function OnboardingGuide({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (visible) {
      setSlide(0);
    }
  }, [visible]);

  const slides = [
    {
      badge: "TEMEL MEKANİK",
      title: "1. HARF BAĞLANTI SİSTEMİ 🔗",
      icon: "⚡",
      color: "#00F5D4",
      highlights: [
        { label: "Sürükleyerek Bağla:", detail: "Parmağını basılı tutarak komşu harfler üzerinde kaydır." },
        { label: "Sadece Dik & Yatay:", detail: "Bağlantılar yalnızca yukarı, aşağı, sağa ve sola yapılabilir." },
        { label: "Çapraz Yasak ⚠️:", detail: "Diyagonal (çapraz) hareketler güvenlik kuralı gereği geçersizdir." }
      ]
    },
    {
      badge: "GİZLİ KELİMELER",
      title: "2. BULMACA DEŞİFRESİ 💾",
      icon: "🔓",
      color: "#FF007F",
      highlights: [
        { label: "Tam Kapsama:", detail: "Tahtadaki her bir harf mutlaka en az 1 hedef kelimenin parçasıdır." },
        { label: "Kıvrılan Yollar:", detail: "Kelimeler düz olmak zorunda değildir; S veya L şeklinde kıvrılabilir." },
        { label: "Yeşil Neon Kilidi:", detail: "Doğru kelimeyi bulduğunda harfler yeşile döner ve kilitlenir." }
      ]
    },
    {
      badge: "DESTEK SİSTEMİ",
      title: "3. TIKANINCA RADAR KULLAN 👁",
      icon: "📡",
      color: "#FFD000",
      highlights: [
        { label: "Radar Butonu 👁:", detail: "Ekranın üstündeki Radar butonuna basarak yardım alabilirsin." },
        { label: "Başlangıç ve Bitiş:", detail: "Radar, kalan gizli kelimelerin ilk ve son harflerini parlatır." },
        { label: "Stratejik İpucu:", detail: "Sıkıştığında hamle hakkını harcamadan ipucunu takip et." }
      ]
    },
    {
      badge: "OYUN MODLARI",
      title: "4. MODLAR VE SEVİYELER 🏆",
      icon: "🗺️",
      color: "#8B5CF6",
      highlights: [
        { label: "Seviye Yolculuğu:", detail: "100 benzersiz solo seviyeyi tamamla, zorlu tahtaları çöz." },
        { label: "Günün Rotası:", detail: "6×6 sabit günlük tahtada yarış, günün galibi sen ol." },
        { label: "Arcade Skor Yarışı:", detail: "Süreye karşı yarış; süre bitmeden en çok kelimeyi türet!" }
      ]
    },
    {
      badge: "İLERLEME VE ÖDÜLLER",
      title: "5. SEVİYE ATLAMA VE UNVANLAR ⭐",
      icon: "🌟",
      color: "#00F5D4",
      highlights: [
        { label: "XP Kazancı:", detail: "Tamamladığın her maç ve bulduğun her kelime sana XP kazandırır." },
        { label: "Rütbe Atlama:", detail: "XP topladıkça Seviye 1'den Seviye 100'e kadar rütben yükselir." },
        { label: "Cyber Unvanlar:", detail: "Çaylak, Veri Avcısı ve Siber Efsane gibi unvanları aç." }
      ]
    },
    {
      badge: "İPUÇLARI VE TAKTİKLER",
      title: "6. USTA OYUNCU TAKTİKLERİ 💡",
      icon: "🎯",
      color: "#FFD000",
      highlights: [
        { label: "Uzun Kelimeler:", detail: "5+ harfli kelimeler ekstra bonus puan ve tempo kazandırır." },
        { label: "Köşeleri Temizle:", detail: "Önce köşelerde sıkışan harfleri birleştirerek alanı rahatlat." },
        { label: "Hızlı Ol:", detail: "Ne kadar hızlı kelime bulursan Dakikadaki Kelime (K/DK) tempon o kadar artar." }
      ]
    }
  ];

  const currentSlide = slides[slide]!;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.badgeText, { color: currentSlide.color }]}>{currentSlide.badge}</Text>
              <Text style={styles.overline}>REHBER & OYUN KILAVUZU · {slide + 1} / {slides.length}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {/* Slide Content */}
          <View style={{ flex: 1, width: "100%" }}>
            <ScrollView contentContainerStyle={styles.slideScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{currentSlide.icon}</Text>
              </View>
              <Text style={styles.title}>{currentSlide.title}</Text>

              {/* Structured Highlights */}
              <View style={styles.highlightList}>
                {currentSlide.highlights.map((item, idx) => (
                  <View key={idx} style={styles.highlightRow}>
                    <Text style={[styles.highlightBullet, { color: currentSlide.color }]}>▪</Text>
                    <Text style={styles.highlightText}>
                      <Text style={[styles.highlightLabel, { color: currentSlide.color }]}>{item.label} </Text>
                      {item.detail}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Carousel Indicators */}
          <View style={styles.indicatorRow}>
            {slides.map((_, index) => (
              <Pressable key={index} onPress={() => setSlide(index)}>
                <View
                  style={[
                    styles.indicator,
                    index === slide ? [styles.indicatorActive, { backgroundColor: currentSlide.color }] : null
                  ]}
                />
              </Pressable>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {slide > 0 ? (
              <Pressable onPress={() => setSlide(slide - 1)} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← GERİ</Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {slide < slides.length - 1 ? (
              <Pressable onPress={() => setSlide(slide + 1)} style={[styles.nextBtn, { backgroundColor: currentSlide.color }]}>
                <Text style={[styles.nextBtnText, { color: currentSlide.color === "#FFD000" || currentSlide.color === "#00F5D4" ? "#100C24" : "#FFFFFF" }]}>
                  İLERİ →
                </Text>
              </Pressable>
            ) : (
              <Pressable onPress={onClose} style={[styles.nextBtn, styles.finishBtn]}>
                <Text style={styles.finishBtnText}>ANLADIM, OYUNA BAŞLA 🚀</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(8, 6, 18, 0.92)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20, paddingVertical: 40 },
  container: { width: "100%", height: 480, maxHeight: "85%", borderRadius: 24, borderWidth: 1.5, borderColor: "#7C5CF6", backgroundColor: "#141029", padding: 18, alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", width: "100%", marginBottom: 12 },
  badgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  overline: { color: "#8E79DF", fontSize: 9, fontWeight: "800", letterSpacing: 0.5, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(124, 92, 246, 0.2)", alignItems: "center", justifyContent: "center" },
  closeText: { color: "#FFF9FC", fontSize: 20, lineHeight: 22, fontWeight: "900" },
  slideScroll: { alignItems: "center", paddingVertical: 4 },
  iconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(22, 17, 44, 0.9)", borderWidth: 1, borderColor: "rgba(124, 92, 246, 0.4)", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  icon: { fontSize: 28 },
  title: { color: "#FFF9FC", fontSize: 15, fontWeight: "900", letterSpacing: 0.5, marginBottom: 12, textAlign: "center" },
  highlightList: { width: "100%", gap: 8, backgroundColor: "rgba(22, 17, 44, 0.6)", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(124, 92, 246, 0.25)" },
  highlightRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  highlightBullet: { fontSize: 12, lineHeight: 16, fontWeight: "900" },
  highlightText: { flex: 1, color: "#D1C4E9", fontSize: 11, lineHeight: 16 },
  highlightLabel: { fontWeight: "900" },
  indicatorRow: { flexDirection: "row", gap: 6, marginTop: 12, marginBottom: 12, alignItems: "center" },
  indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3D335C" },
  indicatorActive: { width: 22, height: 8, borderRadius: 4 },
  buttonRow: { flexDirection: "row", gap: 10, width: "100%" },
  backBtn: { flex: 1, height: 42, borderRadius: 14, borderWidth: 1, borderColor: "#413660", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(30, 24, 58, 0.5)" },
  backBtnText: { color: "#B5A9CD", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  nextBtn: { flex: 1, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  nextBtnText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  finishBtn: { backgroundColor: "#00F5D4" },
  finishBtnText: { color: "#0F172A", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
});
