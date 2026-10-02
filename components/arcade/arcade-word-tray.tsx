import React from "react";
import { View, Text } from "react-native";
import { styles } from "./arcade.styles";

export type ArcadeWordTrayProps = {
  feedback: "idle" | "invalid" | "accepted";
  selectedLength: number;
  activeWord: string;
};

export const ArcadeWordTray = React.memo(({
  feedback,
  selectedLength,
  activeWord,
}: ArcadeWordTrayProps) => {
  return (
    <View style={[styles.wordTray, feedback === "invalid" && styles.trayInvalid, feedback === "accepted" && styles.trayAccepted]}>
      <Text style={styles.trayLabel}>
        {feedback === "invalid"
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
