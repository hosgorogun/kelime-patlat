import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { styles } from "./arcade.styles";

export type ArcadeRouteInspectorProps = {
  selectedWordInfo: {
    word: string;
    definition: string;
    type?: string;
    example?: string;
    source?: string;
    loading?: boolean;
  } | null;
  inspectedPath: number[] | null;
  inspectedColor: string | null;
  onClose: () => void;
};

export const ArcadeRouteInspector = React.memo(({
  selectedWordInfo,
  inspectedPath,
  inspectedColor,
  onClose,
}: ArcadeRouteInspectorProps) => {
  if (!selectedWordInfo || !inspectedPath) return null;

  return (
    <View style={[styles.activeRouteCard, { borderColor: inspectedColor || "#DCE1D7" }]}>
      <View style={styles.activeRouteHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 14 }}>🧭</Text>
          <Text style={styles.activeRouteTitle}>KELİME ROTASI & YÖNÜ</Text>
          <View
            style={[
              styles.activeRouteBadge,
              { backgroundColor: inspectedColor ? `${inspectedColor}25` : "rgba(255, 194, 74, 0.2)" },
            ]}
          >
            <Text style={[styles.activeRouteBadgeText, { color: inspectedColor || "#98732c" }]}>
              {selectedWordInfo.word.length} HARF
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            onClose();
          }}
          style={({ pressed }) => [styles.activeRouteClose, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.activeRouteCloseText}>✕ Rotayı Kapat</Text>
        </Pressable>
      </View>

      {/* Harf akışı ve oklar */}
      <View style={styles.activeRouteFlow}>
        {selectedWordInfo.word.split("").map((ch, idx, arr) => (
          <React.Fragment key={`route-ch-${idx}`}>
            <View
              style={[
                styles.activeRouteChip,
                idx === 0 && styles.activeRouteChipStart,
                idx === arr.length - 1 && styles.activeRouteChipEnd,
              ]}
            >
              <Text
                style={[
                  styles.activeRouteChipText,
                  idx === 0 && styles.activeRouteChipTextStart,
                  idx === arr.length - 1 && styles.activeRouteChipTextEnd,
                ]}
              >
                {ch}
              </Text>
              <Text
                style={[
                  styles.activeRouteChipSub,
                  idx === 0 && { color: "#279f73" },
                  idx === arr.length - 1 && { color: "#bf5757" },
                ]}
              >
                {idx === 0 ? "BAŞLANGIÇ" : idx === arr.length - 1 ? "BİTİŞ" : idx + 1}
              </Text>
            </View>
            {idx < arr.length - 1 && (
              <Text style={[styles.activeRouteArrow, { color: inspectedColor || "#98732c" }]}>➔</Text>
            )}
          </React.Fragment>
        ))}
      </View>

      <View style={styles.activeRouteDefBox}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 13 }}>📖</Text>
            <Text style={[styles.activeRouteDefLabel, { color: inspectedColor || "#98732c" }]}>TDK SÖZLÜK ANLAMI</Text>
            {selectedWordInfo.type ? (
              <View
                style={{
                  backgroundColor: "rgba(212, 180, 90, 0.2)",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#DCE1D7",
                }}
              >
                <Text style={{ color: "#8c7540", fontSize: 9, fontWeight: "800" }}>{selectedWordInfo.type}</Text>
              </View>
            ) : null}
          </View>
          {selectedWordInfo.loading && (
            <ActivityIndicator size="small" color={inspectedColor || "#98732c"} style={{ transform: [{ scale: 0.7 }] }} />
          )}
        </View>
        <Text style={styles.activeRouteDefText}>{selectedWordInfo.definition}</Text>
        {selectedWordInfo.example ? (
          <View
            style={{
              marginTop: 6,
              padding: 6,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 8,
              borderLeftWidth: 3,
              borderLeftColor: inspectedColor || "#DCE1D7",
            }}
          >
            <Text style={{ color: "#293541", fontSize: 11, fontStyle: "italic" }}>
              Örnek: &quot;{selectedWordInfo.example}&quot;
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

ArcadeRouteInspector.displayName = "ArcadeRouteInspector";
