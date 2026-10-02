import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { styles } from "./solo-challenge.styles";

export interface SelectedWordInfo {
  word: string;
  definition: string;
  type?: string;
  example?: string;
  source?: string;
  loading?: boolean;
}

interface SoloWordRouteCardProps {
  selectedWordInfo: SelectedWordInfo | null;
  inspectedPath: number[] | null;
  inspectedColor: string | null;
  accentColor: string;
  onClose: () => void;
}

export function SoloWordRouteCard({
  selectedWordInfo,
  inspectedPath,
  inspectedColor,
  accentColor,
  onClose,
}: SoloWordRouteCardProps) {
  if (!selectedWordInfo || !inspectedPath) {
    return null;
  }

  const themeColor = inspectedColor || accentColor;

  return (
    <View style={[styles.activeRouteCard, { borderColor: themeColor }]}>
      <View style={styles.activeRouteHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 14 }}>🧭</Text>
          <Text style={styles.activeRouteTitle}>KELİME ROTASI & YÖNÜ</Text>
          <View
            style={[
              styles.activeRouteBadge,
              { backgroundColor: inspectedColor ? `${inspectedColor}25` : "rgba(45, 212, 191, 0.2)" },
            ]}
          >
            <Text style={[styles.activeRouteBadgeText, { color: themeColor }]}>
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
              <Text style={[styles.activeRouteArrow, { color: themeColor }]}>➔</Text>
            )}
          </React.Fragment>
        ))}
      </View>

      <View style={styles.activeRouteDefBox}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 13 }}>📖</Text>
            <Text style={[styles.activeRouteDefLabel, { color: themeColor }]}>
              TDK SÖZLÜK ANLAMI
            </Text>
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
                <Text style={{ color: "#8c7540", fontSize: 9, fontWeight: "800" }}>
                  {selectedWordInfo.type}
                </Text>
              </View>
            ) : null}
          </View>
          {selectedWordInfo.loading && (
            <ActivityIndicator
              size="small"
              color={themeColor}
              style={{ transform: [{ scale: 0.7 }] }}
            />
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
              borderLeftColor: themeColor,
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
}
