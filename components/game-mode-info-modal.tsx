import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type GameModeInfoType = "pvp" | "daily" | "solo" | "vintage" | "arcade" | string | null;

interface GameModeInfoModalProps {
  visible: boolean;
  mode: GameModeInfoType;
  onClose: () => void;
}

export const GameModeInfoModal: React.FC<GameModeInfoModalProps> = ({
  visible,
  mode,
  onClose,
}) => {
  if (!visible || !mode) return null;

  const getAccentColor = () => {
    switch (mode) {
      case "arcade":
        return "#987c00";
      case "vintage":
        return "#98732c";
      case "solo":
        return "#2a8fbc";
      case "daily":
        return "#8c7540";
      default:
        return "#2a9c7a";
    }
  };

  const getButtonBgColor = () => {
    switch (mode) {
      case "arcade":
        return "#ffeb94";
      case "vintage":
        return "#ffe5b3";
      case "solo":
        return "#abe3fc";
      case "daily":
        return "#f5e6c0";
      default:
        return "#aef5e0";
    }
  };

  const getIconBgColor = () => {
    switch (mode) {
      case "arcade":
        return "rgba(255, 208, 0, 0.15)";
      case "vintage":
        return "rgba(255, 194, 74, 0.15)";
      case "solo":
        return "rgba(56, 189, 248, 0.15)";
      case "daily":
        return "rgba(167, 139, 250, 0.15)";
      default:
        return "rgba(62, 232, 181, 0.15)";
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case "pvp":
        return "⚔️";
      case "daily":
        return "🗓️";
      case "solo":
        return "🏆";
      case "vintage":
        return "🗞️";
      default:
        return "⚡";
    }
  };

  const getModeTag = () => {
    switch (mode) {
      case "pvp":
        return "ÇOK OYUNCULU DÜELLO";
      case "daily":
        return "ETKİNLİK MODU";
      case "solo":
        return "KLASİK TEK OYUNCU";
      case "vintage":
        return "NOSTALJİ MİNİ OYUN";
      default:
        return "ZAMANA KARŞI YARIŞ";
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case "pvp":
        return "Canlı Kelime Düellosu";
      case "daily":
        return "Günün Sabit Rotası";
      case "solo":
        return "Seviye Yolculuğu";
      case "vintage":
        return "Gazete Kare Bulmacası";
      default:
        return "Zamanda Yarış Arcade";
    }
  };

  const getModeTypeLabel = () => {
    switch (mode) {
      case "pvp":
        return "1v1 Canlı Rakip";
      case "daily":
        return "Günlük Özel Tahta";
      case "solo":
        return "Bölüm İlerleme Sistemi";
      case "vintage":
        return "10×10 Gazete Matrisi";
      default:
        return "Süreli Rekor Modu";
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case "pvp":
        return "Gerçek bir rakiple aynı anda yarışırsın. Izgaradaki harfleri parmağınla bağlayarak geçerli kelimeler üret. Ne kadar uzun kelime bulursan puan çarpanın o kadar katlanır!";
      case "daily":
        return "Her gün yenilenen sabit bulmaca rotasında kelimeleri tamamla. Günlük rotayı bitirmek galibiyet serini (Streak) korur ve ekstra seri puanı kazandırır.";
      case "solo":
        return "1. seviyeden başlayarak Seviye Yolculuğu'nda ilerle! Izgaradaki hedef kelimeleri bularak seviyeleri tamamla, ustalık kazan ve kilitli ızgara boyutlarını aç.";
      case "vintage":
        return "Nostaljik gazete bulmacası keyfi! İpuçlarını çözerek harf taşlarını 10×10 matrise yerleştir, kare bulmacayı tamamla ve nostalji bonus XP'lerini topla.";
      default:
        return "Zamansız akış! Belirlenen süre bitmeden olabildiğince çok kelime bul, kombo puanlarını katla ve liderlik tablosundaki rekorunu kır.";
    }
  };

  const getModeTips = () => {
    switch (mode) {
      case "pvp":
        return "• 5+ harfli kelimeler ×2, 7+ harfli kelimeler ×3 bonus puan verir.\n• Siber Radar jokeri ile harf rotalarını anında gör.";
      case "daily":
        return "• Her gün 1 defa oynama hakkın vardır.\n• Tamamlayamadığın günlerde Seri Kalkanı otomatik devreye girer.";
      case "solo":
        return "• Seviye atladıkça 6×6, 8×8 ve 10×10 düello modları açılır.\n• Belirli seviyelerde sürpriz ödül sandıkları kazanırsın.\n• Sıkıştığın anlarda Siber Radar jokeri kullan.";
      case "vintage":
        return "• 20 özel nostaljik bulmaca bölümü içerir.\n• Kesişen harfler doğru kelimeleri bulmayı kolaylaştırır.\n• Günlük girişlerde ekstra ipucu hakkı kazanabilirsin.";
      default:
        return "• Hızlı kombolar süre bonusu kazandırır.\n• Sıkıştığında Siber Radar jokeri ile gizli rotaları aç.";
    }
  };

  const accentColor = getAccentColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconContainer, { backgroundColor: getIconBgColor() }]}>
            <Text style={styles.iconText}>{getModeIcon()}</Text>
          </View>

          <Text style={[styles.tagText, { color: accentColor }]}>
            {getModeTag()}
          </Text>

          <Text style={styles.titleText}>{getModeTitle()}</Text>

          <View style={styles.badgeRow}>
            <Text style={styles.badgeLabel}>OYUN TİPİ:</Text>
            <Text style={[styles.badgeValue, { color: accentColor }]}>
              {getModeTypeLabel()}
            </Text>
          </View>

          <Text style={styles.descriptionText}>{getModeDescription()}</Text>

          <View style={styles.tipsBox}>
            <Text style={styles.tipsHeader}>💡 STRATEJİ VE İPUCU</Text>
            <Text style={styles.tipsContent}>{getModeTips()}</Text>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: getButtonBgColor(), opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.actionButtonText}>ANLADIM</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(35,48,59,0.42)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#F0F5ED",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    padding: 24,
    alignItems: "center",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconText: {
    fontSize: 24,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: "center",
  },
  titleText: {
    color: "#293541",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    gap: 6,
  },
  badgeLabel: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  badgeValue: {
    fontSize: 12,
    fontWeight: "900",
  },
  descriptionText: {
    color: "#293541",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  tipsBox: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    padding: 14,
    marginBottom: 20,
  },
  tipsHeader: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tipsContent: {
    color: "#293541",
    fontSize: 12,
    lineHeight: 18,
  },
  actionButton: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#293541",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
