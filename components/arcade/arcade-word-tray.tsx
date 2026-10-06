import React from "react";
import { View, Text } from "react-native";
import { styles } from "./arcade.styles";

export type ArcadeWordTrayProps = {
  feedback: "idle" | "invalid" | "accepted" | "bonus";
  selectedLength: number;
  activeWord: string;
};

export const ArcadeWordTray = React.memo(({
  feedback,
  selectedLength,
  activeWord,
}: ArcadeWordTrayProps) => {
  return (
    <View style={[
      styles.wordTray,
      feedback === "invalid" && styles.trayInvalid,
      feedback === "accepted" && styles.trayAccepted,
      feedback === "bonus" && styles.trayBonus,
    ]}>
      <Text style={styles.trayLabel}>
        {feedback === "bonus"
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
        {selectedLength > 0 ? `[ ${activeWord.split("").join(" - ")} ]` : "—"}
      </Text>
    </View>
  );
});

ArcadeWordTray.displayName = "ArcadeWordTray";
