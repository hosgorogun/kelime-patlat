import React from "react";
import { Modal, Pressable, View, Text } from "react-native";
import { BOARD_SIZES, type BoardSize } from "@/shared/game";
import type { FriendUser } from "@/shared/social";
import { styles } from "./season-hub.styles";

export const SIZE_LABELS: Record<BoardSize, { label: string; desc: string; color: string }> = {
  4: { label: "4×4", desc: "Hızlı Av · 50 sn", color: "#389674" },
  6: { label: "6×6", desc: "Klasik · 75 sn", color: "#2a8fbc" },
  8: { label: "8×8", desc: "Usta · 100 sn", color: "#6a5acd" },
  10: { label: "10×10", desc: "Efsane · 125 sn", color: "#98732c" },
};

interface BoardSizePickerModalProps {
  target: FriendUser | null;
  onSelectSize: (size: BoardSize) => void;
  onClose: () => void;
}

export function BoardSizePickerModal({
  target,
  onSelectSize,
  onClose,
}: BoardSizePickerModalProps) {
  if (!target) return null;

  return (
    <Modal visible={target !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalKicker}>DÜELLO GÖNDERİLİYOR</Text>
          <Text style={styles.modalTitle} numberOfLines={1}>
            {target.name}
          </Text>
          <Text style={styles.modalSubtitle}>Tahta boyutunu seç</Text>
          <View style={styles.sizeGrid}>
            {(BOARD_SIZES as readonly BoardSize[]).map((size) => {
              const info = SIZE_LABELS[size];
              return (
                <Pressable
                  key={size}
                  style={({ pressed }) => [
                    styles.sizeBtn,
                    { borderColor: info.color },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => onSelectSize(size)}
                >
                  <Text style={[styles.sizeBtnLabel, { color: info.color }]}>{info.label}</Text>
                  <Text style={styles.sizeBtnDesc}>{info.desc}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={onClose} style={styles.modalCancel}>
            <Text style={styles.modalCancelText}>İPTAL</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
