import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Destination = "home" | "modes" | "online" | "profile";

export function PremiumModeCenter({
  currentLevel,
  onSolo,
  onBot4,
  onBot6,
  onBot8,
  onBot10,
  onOnline,
  onSeason,
  onNavigate
}: {
  currentLevel: number;
  onSolo: () => void;
  onBot4: () => void;
  onBot6: () => void;
  onBot8: () => void;
  onBot10: () => void;
  onOnline: () => void;
  onSeason: () => void;
  onNavigate: (destination: Destination) => void;
}) {
  const isLocked6 = currentLevel < 5;
  const isLocked8 = currentLevel < 8;
  const isLocked10 = currentLevel < 10;

  const handleLocked = (size: 6 | 8 | 10, requiredLevel: number, action: () => void) => {
    if (currentLevel < requiredLevel) {
      Alert.alert(
        `🔒 Seviye ${requiredLevel} Gerekli`,
        `${size}×${size} modu Seviye ${requiredLevel}'de açılır. Şu anki seviyeniz: ${currentLevel}. Daha fazla oyna ve seviye atla!`
      );
    } else {
      action();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => onNavigate("home")} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.overline}>SEZON 01 · OPERASYONLAR</Text>
          <Text style={styles.headerTitle}>OYUN MODLARI</Text>
        </View>
        <View style={styles.count}>
          <Text style={styles.countText}>6</Text>
        </View>
      </View>

      <View style={styles.intro}>
        <Text style={styles.introKicker}>KELİME AVI MERKEZİ</Text>
        <Text style={styles.introTitle}>ROTANI{"\n"}SEÇ</Text>
        <Text style={styles.introBody}>Seviye yolunda tek başına ilerle, botla ısın veya arkadaşına canlı oda kodu gönder.</Text>
      </View>

      <ModeCard index="01" badge="YENİ" label="TEK OYUNCU" title="SEVİYE YOLU" description="Seviye seviye açılan, giderek zorlaşan kelime operasyonları." meta="12 SEVİYE · İLERLEME" tone="gold" onPress={onSolo} />
      <ModeCard index="02" badge="AKTİF" label="HIZLI OYUN" title="4x4" description="4×4 kıvrımlı tahta, otomatik rakip ve hızlı turlar." meta="4 GİZLİ KELİME · ~1 DK" tone="mint" onPress={onBot4} />
      <ModeCard
        index="03"
        badge={isLocked6 ? "🔒 SEVİYE 5" : "DENGELİ"}
        label="ORTA AV"
        title={isLocked6 ? "6×6 KİLİTLİ" : "6×6 ROTASI"}
        description={isLocked6 ? "Seviye 5'e ulaştığında bu mod açılacaktır." : "Altı gizli kelime, daha uzun yollar ve dengeli tempo."}
        meta="6 GİZLİ KELİME · ~1,5 DK"
        tone={isLocked6 ? "gray" : "blue"}
        onPress={() => handleLocked(6, 5, onBot6)}
      />
      <ModeCard
        index="04"
        badge={isLocked8 ? "🔒 SEVİYE 8" : "UZMAN"}
        label="BÜYÜK AV"
        title={isLocked8 ? "8×8 KİLİTLİ" : "8×8 KEŞİF"}
        description={isLocked8 ? "Seviye 8'e ulaştığında bu mod açılacaktır." : "Daha geniş tahta, sekiz kelime ve derin rotalar."}
        meta="8 GİZLİ KELİME · ~2 DK"
        tone={isLocked8 ? "gray" : "blue"}
        onPress={() => handleLocked(8, 8, onBot8)}
      />
      
      {/* 10x10 Mode Card (Locked/Unlocked) */}
      <ModeCard
        index="05"
        badge={isLocked10 ? "🔒 SEVİYE 10" : "EFSANEVİ"}
        label="DEVASA HARF SAVAŞI"
        title={isLocked10 ? "10×10 KİLİTLİ" : "10×10 MASTER"}
        description={isLocked10 ? "Seviye 10'a ulaştığında bu devasa ızgara kilidi açılacaktır." : "100 hücrelik devasa tahta, 10-14 kelime ve efsanevi yollar."}
        meta="10-14 GİZLİ KELİME · ~3 DK"
        tone={isLocked10 ? "gray" : "rose"}
        onPress={() => handleLocked(10, 10, onBot10)}
      />

      <ModeCard index="06" badge="YENİ" label="ANTRENMAN" title="BOT DÜELLOSU" description="İstediğin boyuttaki tahtada bota karşı savaş." meta="4×4 / 6×6 / 8×8 / 10x10 SEÇENEĞİ" tone="rose" onPress={onOnline} />
      
      <Pressable onPress={onSeason} style={({ pressed }) => [styles.seasonPortal, pressed && styles.pressed]}>
        <View>
          <Text style={styles.lockedOverline}>GÜNLÜK ROTA · PAKETLER · SIRALAMA</Text>
          <Text style={styles.lockedTitle}>SEZON MERKEZİNE GİR</Text>
          <Text style={styles.lockedBody}>Bugünün sabit tahtasını, tema paketlerini ve canlı skor hattını keşfet.</Text>
        </View>
        <Text style={styles.portalArrow}>↗</Text>
      </Pressable>
    </ScrollView>
  );
}

function ModeCard({
  index,
  badge,
  label,
  title,
  description,
  meta,
  tone,
  onPress
}: {
  index: string;
  badge: string;
  label: string;
  title: string;
  description: string;
  meta: string;
  tone: "gold" | "mint" | "blue" | "rose" | "gray";
  onPress: () => void;
}) {
  const toneStyle = 
    tone === "gold" ? styles.gold : 
    tone === "mint" ? styles.mint : 
    tone === "blue" ? styles.blue : 
    tone === "gray" ? styles.gray : 
    styles.rose;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.modeCard, toneStyle, pressed && styles.pressed]}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>{index}</Text>
      </View>
      <View style={styles.cardCopy}>
        <View style={styles.cardTop}>
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.cardBadge}>{badge}</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{description}</Text>
        <Text style={styles.cardMeta}>{meta}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 132 },
  header: { flexDirection: "row", alignItems: "center", gap: 11 },
  back: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#211B3D", alignItems: "center", justifyContent: "center" },
  backText: { color: "#FFF9FC", fontSize: 30, lineHeight: 32 },
  headerCopy: { flex: 1 },
  overline: { color: "#B8ADD1", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  headerTitle: { color: "#FFF9FC", fontSize: 20, fontWeight: "900", marginTop: 2 },
  count: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#42376D", borderWidth: 1, borderColor: "#7A62C3", alignItems: "center", justifyContent: "center" },
  countText: { color: "#FFC24A", fontSize: 12, fontWeight: "900" },
  intro: { marginTop: 20, padding: 18, borderRadius: 22, backgroundColor: "#2B2250", borderWidth: 1, borderColor: "#7159B8" },
  introKicker: { color: "#FFC24A", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  introTitle: { color: "#FFF9FC", fontSize: 28, lineHeight: 28, fontWeight: "900", marginTop: 8 },
  introBody: { color: "#D3C9E6", fontSize: 12, lineHeight: 18, marginTop: 10 },
  modeCard: { minHeight: 145, marginTop: 11, padding: 15, borderRadius: 22, borderWidth: 1, flexDirection: "row", gap: 11, alignItems: "center" },
  gold: { backgroundColor: "#4B3A23", borderColor: "#FFC24A" },
  mint: { backgroundColor: "#2B2251", borderColor: "#7E65D4" },
  blue: { backgroundColor: "#30244F", borderColor: "#9A76ED" },
  rose: { backgroundColor: "#52253F", borderColor: "#E4638B" },
  gray: { backgroundColor: "#1D1A2C", borderColor: "#4C4660", opacity: 0.75 },
  icon: { width: 43, height: 43, borderRadius: 14, backgroundColor: "#493878", borderWidth: 1, borderColor: "#FFC24A", alignItems: "center", justifyContent: "center", alignSelf: "flex-start" },
  iconText: { color: "#FFF9FC", fontSize: 10, fontWeight: "900" },
  cardCopy: { flex: 1 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  cardLabel: { color: "#D6CDEE", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  cardBadge: { color: "#FFC24A", fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
  cardTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", marginTop: 5 },
  cardBody: { color: "#DDD4EC", fontSize: 11, lineHeight: 15, marginTop: 5 },
  cardMeta: { color: "#B5A9CD", fontSize: 8, fontWeight: "900", letterSpacing: 0.35, marginTop: 9 },
  arrow: { color: "#FFF9FC", fontSize: 22, fontWeight: "900" },
  seasonPortal: { marginTop: 12, padding: 15, borderRadius: 19, borderWidth: 1, borderColor: "#5D4A90", backgroundColor: "#21193E", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  lockedOverline: { color: "#FFC24A", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  lockedTitle: { color: "#F2EDFB", fontSize: 13, fontWeight: "900", marginTop: 5 },
  lockedBody: { color: "#B9AFCE", fontSize: 11, marginTop: 4, lineHeight: 15, maxWidth: 260 },
  portalArrow: { color: "#55E6B2", fontSize: 24, fontWeight: "900" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
