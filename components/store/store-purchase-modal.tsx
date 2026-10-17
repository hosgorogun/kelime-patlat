import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { triggerHapticSuccess } from "@/shared/audio-haptics";
import { styles } from "./cyber-store.styles";

export type ConfirmPurchaseData = {
  title: string;
  description: string;
  cost: number;
  icon: string;
  onConfirm: () => void;
};

export function StorePurchaseModal({
  confirmPurchase,
  coins,
  onClose,
}: {
  confirmPurchase: ConfirmPurchaseData | null;
  coins: number;
  onClose: () => void;
}) {
  if (!confirmPurchase) return null;

  return (
    <Modal
      visible={confirmPurchase !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.confirmOverlay} onPress={onClose}>
        <Pressable style={styles.confirmCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.confirmBadge}>
            <Text style={styles.confirmBadgeIcon}>{confirmPurchase.icon}</Text>
          </View>

          <Text style={styles.confirmKicker}>İŞLEMİ ONAYLIYOR MUSUNUZ?</Text>
          <Text numberOfLines={2} style={styles.confirmTitle}>
            {confirmPurchase.title}
          </Text>

          <View style={styles.confirmCostPill}>
            <Text style={styles.confirmCostLabel}>ÖDENECEK TUTAR:</Text>
            <Text style={styles.confirmCostValue}>🪙 {confirmPurchase.cost} ÇİP</Text>
          </View>

          <Text style={styles.confirmDesc}>{confirmPurchase.description}</Text>

          <View style={styles.confirmBalanceInfo}>
            {coins < confirmPurchase.cost ? (
              <Text style={styles.confirmBalanceText}>
                Mevcut Bakiye:{" "}
                <Text style={{ color: "#DC2626", fontWeight: "900" }}>{coins} Çip</Text> •{" "}
                <Text style={{ color: "#DC2626", fontWeight: "900" }}>
                  {confirmPurchase.cost - coins} Çip Eksik!
                </Text>
              </Text>
            ) : (
              <Text style={styles.confirmBalanceText}>
                Mevcut Bakiye:{" "}
                <Text style={{ color: "#98732c", fontWeight: "900" }}>{coins} Çip</Text> →{" "}
                Kalan:{" "}
                <Text style={{ color: "#2a9c7a", fontWeight: "900" }}>
                  {Math.max(0, coins - confirmPurchase.cost)} Çip
                </Text>
              </Text>
            )}
          </View>

          <View style={styles.confirmActionsRow}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.confirmCancelBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.confirmCancelText}>VAZGEÇ</Text>
            </Pressable>

            <Pressable
              disabled={coins < confirmPurchase.cost}
              onPress={() => {
                triggerHapticSuccess();
                const action = confirmPurchase.onConfirm;
                onClose();
                action();
              }}
              style={({ pressed }) => [
                styles.confirmAcceptBtn,
                coins < confirmPurchase.cost && { backgroundColor: "#F1F5F9", shadowOpacity: 0, elevation: 0 },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={[
                  styles.confirmAcceptText,
                  coins < confirmPurchase.cost && { color: "#94A3B8" },
                ]}
              >
                {coins < confirmPurchase.cost ? "Yetersiz Çip" : "✓ SATIN AL"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
