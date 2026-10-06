import React from "react";
import { View, Text } from "react-native";
import { styles } from "./solo-challenge.styles";

export type SoloWordTrayProps = {
  status: "playing" | "won" | "lost";
  feedback: "idle" | "invalid" | "accepted" | "bonus";
  selectedLength: number;
  activeWord: string;
  activeTheme: {
    trayBackground: string;
    cellBorder: string;
  };
};

export const SoloWordTray = React.memo(({
  status,
  feedback,
  selectedLength,
  activeWord,
  activeTheme,
}: SoloWordTrayProps) => {
  return (
    <View
      style={[
        styles.tray,
        { backgroundColor: activeTheme.trayBackground, borderColor: activeTheme.cellBorder },
        feedback === "invalid" && styles.trayInvalid,
        (feedback === "accepted" || status === "won") && styles.trayAccepted,
        feedback === "bonus" && styles.trayBonus,
        status === "lost" && styles.trayInvalid,
      ]}
    >
      <Text style={styles.trayLabel}>
        {status === "won"
          ? ">> SEVİYE TAMAMLANDI"
          : status === "lost"
          ? ">> SÜRE BİTTİ"
          : feedback === "bonus"
          ? ">> ✨ GİZLİ BONUS KELİME BULUNDU!"
          : feedback === "invalid"
          ? ">> BAĞLANTI HATASI"
          : feedback === "accepted"
          ? ">> ŞİFRE ÇÖZÜLDÜ"
          : selectedLength >= 3
          ? ">> BAĞLANTI SAĞLANDI"
          : "BİR KELİME BUL"}
      </Text>
      <Text style={styles.word}>
        {status === "won"
          ? "TÜM KELİMELER ÇÖZÜLDÜ"
          : status === "lost"
          ? "SEVİYE TAMAMLANAMADI"
          : selectedLength > 0
          ? `[ ${activeWord.split("").join(" - ")} ]`
          : "—"}
      </Text>
      <Text style={styles.hint}>
        {status === "won"
          ? "Tebrikler! Kelimelere dokunarak rotaları ve sözlük anlamlarını inceleyebilirsin."
          : status === "lost"
          ? "Zaman doldu. Kelimelere dokunarak çözüm rotalarını inceleyebilirsin."
          : feedback === "invalid"
          ? "Kırmızı rota birazdan temizlenecek."
          : "Yalnız yatay ve dikey ilerle; geri dönmek için önceki hücreye sürükle."}
      </Text>
    </View>
  );
});

SoloWordTray.displayName = "SoloWordTray";
