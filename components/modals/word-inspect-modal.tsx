import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type WordInspectModalProps = {
  visible: boolean;
  wordInfo: {
    word: string;
    definition: string;
    type?: string;
    example?: string;
    source?: string;
    loading?: boolean;
  } | null;
  inspectedColor?: string;
  onClose: () => void;
};

export const WordInspectModal = React.memo(function WordInspectModal({
  visible,
  wordInfo,
  inspectedColor = "#F59E0B",
  onClose,
}: WordInspectModalProps) {
  if (!visible || !wordInfo) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.headerBadge, { backgroundColor: `${inspectedColor}20`, borderColor: inspectedColor }]}>
            <Text style={[styles.wordText, { color: inspectedColor }]}>{wordInfo.word.toUpperCase()}</Text>
          </View>

          {wordInfo.type && <Text style={styles.typeText}>{wordInfo.type}</Text>}

          <View style={styles.defContainer}>
            <Text style={styles.defText}>{wordInfo.definition}</Text>
            {wordInfo.example && (
              <Text style={styles.exampleText}>&ldquo;{wordInfo.example}&rdquo;</Text>
            )}
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.sourceText}>Kaynak: {wordInfo.source || "TDK Sözlüğü"}</Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: inspectedColor }]}>
              <Text style={styles.closeBtnText}>KAPAT</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#DCE1D7",
    elevation: 5,
  },
  headerBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  wordText: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    fontStyle: "italic",
    marginBottom: 8,
  },
  defContainer: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  defText: {
    fontSize: 13,
    color: "#1e293b",
    lineHeight: 18,
    fontWeight: "500",
  },
  exampleText: {
    fontSize: 11,
    color: "#475569",
    fontStyle: "italic",
    marginTop: 6,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sourceText: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
  },
  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
});
