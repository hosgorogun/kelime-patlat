import React from "react";
import { ModernAlertModal } from "../modals/modern-alert-modal";

export type SoloExitModalProps = {
  visible: boolean;
  daily: boolean;
  accentColor: string;
  onDismiss: () => void;
  onConfirmExit: () => void;
};

export const SoloExitModal = React.memo(({
  visible,
  daily,
  accentColor,
  onDismiss,
  onConfirmExit,
}: SoloExitModalProps) => {
  return (
    <ModernAlertModal
      alert={
        visible
          ? {
              icon: "⚠️",
              kicker: daily ? "GÜNÜN ROTASI" : "TEK OYUNCULU MOD",
              title: daily ? "Günün Rotasından Ayrıl" : "Seviyeden Ayrıl (-1 Can)",
              message: daily
                ? "Günün rotasından çıkmak istediğinize emin misiniz? Günlük tek oynama hakkınızı korumak için oyunu tamamlamayı deneyin."
                : "Mevcut seviyeden ayrılmak istediğinize emin misiniz? Oyunu terk ederseniz 1 Can kaybedersiniz.",
              accentColor: "#FF647C",
              primaryButton: {
                text: "DEVAM ET",
                color: accentColor || "#2a9c7a",
                onPress: onDismiss,
              },
              secondaryButton: {
                text: daily ? "AYRIL" : "AYRIL (-1 CAN)",
                onPress: () => {
                  onDismiss();
                  onConfirmExit();
                },
              },
            }
          : null
      }
      onDismiss={onDismiss}
    />
  );
});

SoloExitModal.displayName = "SoloExitModal";
