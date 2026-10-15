import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { isValidTurkishWord } from "@/shared/dictionary";
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
  const trayScale = useRef(new Animated.Value(1)).current;

  const isValidWord = useMemo(() => {
    return status === "playing" && feedback === "idle" && selectedLength >= 3 && isValidTurkishWord(activeWord);
  }, [status, feedback, selectedLength, activeWord]);

  useEffect(() => {
    if (feedback === "invalid") {
      Animated.sequence([
        Animated.timing(trayScale, { toValue: 1.05, duration: 60, useNativeDriver: true }),
        Animated.spring(trayScale, { toValue: 1, friction: 3, tension: 160, useNativeDriver: true }),
      ]).start();
    } else if (feedback === "accepted" || feedback === "bonus" || status === "won") {
      Animated.sequence([
        Animated.timing(trayScale, { toValue: 1.08, duration: 80, useNativeDriver: true }),
        Animated.spring(trayScale, { toValue: 1, friction: 3.5, tension: 140, useNativeDriver: true }),
      ]).start();
    }
  }, [feedback, status, trayScale]);

  return (
    <Animated.View
      style={[
        styles.tray,
        { backgroundColor: activeTheme.trayBackground, borderColor: activeTheme.cellBorder, transform: [{ scale: trayScale }] },
        isValidWord && { borderColor: "#10B981", backgroundColor: "rgba(16, 185, 129, 0.08)" },
        feedback === "invalid" && styles.trayInvalid,
        (feedback === "accepted" || status === "won") && styles.trayAccepted,
        feedback === "bonus" && styles.trayBonus,
        status === "lost" && styles.trayInvalid,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor:
              feedback === "invalid" || status === "lost"
                ? "#EF4444"
                : feedback === "accepted" || status === "won" || isValidWord
                ? "#10B981"
                : feedback === "bonus"
                ? "#F59E0B"
                : selectedLength > 0
                ? "#3B82F6"
                : "#94A3B8",
          }}
        />
        <Text style={[styles.trayLabel, isValidWord && { color: "#059669", fontWeight: "800" }]}>
          {status === "won"
            ? "SEVİYE TAMAMLANDI"
            : status === "lost"
            ? "SÜRE BİTTİ"
            : feedback === "bonus"
            ? "✨ GİZLİ BONUS KELİME BULUNDU!"
            : feedback === "invalid"
            ? "GEÇERSİZ KELİME YA DA YOL"
            : feedback === "accepted"
            ? "TEBRİKLER! KELİME ÇÖZÜLDÜ"
            : isValidWord
            ? "✓ GEÇERLİ SÖZCÜK · BIRAK"
            : selectedLength >= 3
            ? "BAĞLANTI HAZIR · BIRAK"
            : selectedLength > 0
            ? "HARFLERİ BİRLEŞTİR..."
            : "BİR KELİME OLUŞTUR"}
        </Text>
      </View>

      <Text style={[styles.word, isValidWord && { color: "#065F46" }]}>
        {status === "won"
          ? "TÜM KELİMELER ÇÖZÜLDÜ"
          : status === "lost"
          ? "SEVİYE TAMAMLANAMADI"
          : selectedLength > 0
          ? activeWord.split("").join(" · ")
          : "—"}
      </Text>

      <Text style={[styles.hint, isValidWord && { color: "#047857" }]}>
        {status === "won"
          ? "Tebrikler! Kelimelere dokunarak rotaları ve sözlük anlamlarını inceleyebilirsin."
          : status === "lost"
          ? "Zaman doldu. Kelimelere dokunarak çözüm rotalarını inceleyebilirsin."
          : feedback === "invalid"
          ? "Kırmızı rota birazdan temizlenecek."
          : isValidWord
          ? "Sözlükte onaylandı! Puanı almak için parmağını kaldır."
          : selectedLength > 0
          ? "Geri dönmek için önceki harfin üzerine kaydır."
          : "Parmağını komşu harflere kaydırarak kelimeleri bağla."}
      </Text>
    </Animated.View>
  );
});

SoloWordTray.displayName = "SoloWordTray";
