import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { palette } from "@/shared/palette";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { GameButton, OrnatePanel } from "@/components/game/game-ui";
import { styles } from "./command-center.styles";

export function BotPracticeModal({
  visible,
  onClose,
  onPlayBot,
  onNavigateOnline,
}: {
  visible: boolean;
  onClose: () => void;
  onPlayBot?: (size: 4 | 6 | 8 | 10) => void;
  onNavigateOnline: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "90%", maxWidth: 360, alignSelf: "center" }}>
          <OrnatePanel accent="gold" contentStyle={{ padding: 20 }}>
            <Text style={[styles.modalTitle, { textAlign: "center", marginBottom: 6 }]}>🤖 BOT İLE PRATİK YAP</Text>
            <Text style={[styles.modalBody, { textAlign: "center", marginBottom: 16 }]}>
              Oynamak istediğin tahta boyutunu seç:
            </Text>

            {[
              { size: 4 as const, label: "4×4 Nabız", desc: "3 Rota · 55 sn", icon: "⚡" },
              { size: 6 as const, label: "6×6 Akış", desc: "6 Rota · 75 sn", icon: "🌀" },
              { size: 8 as const, label: "8×8 Derinlik", desc: "8 Rota · 95 sn", icon: "🎯" },
              { size: 10 as const, label: "10×10 Zirve", desc: "12 Rota · 125 sn", icon: "👑" },
            ].map((option) => (
              <Pressable
                key={option.size}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: palette.panelInner,
                    borderWidth: 1,
                    borderColor: palette.line,
                    marginBottom: 10,
                  },
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  triggerHapticSelection();
                  onClose();
                  if (onPlayBot) onPlayBot(option.size);
                  else onNavigateOnline();
                }}
              >
                <Text style={{ fontSize: 24, marginRight: 12 }}>{option.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.text, fontWeight: "800", fontSize: 15 }}>{option.label}</Text>
                  <Text style={{ color: palette.muted, fontSize: 12, marginTop: 2 }}>{option.desc}</Text>
                </View>
                <Text style={{ color: palette.gemAmber, fontWeight: "900", fontSize: 16 }}>➔</Text>
              </Pressable>
            ))}

            <GameButton
              label="Kapat"
              variant="dark"
              onPress={onClose}
              style={{ marginTop: 6 }}
            />
          </OrnatePanel>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
