import React from "react";
import { ModernAlertModal } from "../modals/modern-alert-modal";

export type SoloExitModalProps = {
  visible: boolean;
  daily?: boolean;
  accentColor: string;
  onDismiss: () => void;
  onConfirmExit: () => void;
};

export const SoloExitModal = React.memo(({
  visible,
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
              kicker: "TEK OYUNCULU MOD",
              title: "Seviyeden Ayrıl (-1 Can)",
              message: "Mevcut seviyeden ayrılmak istediğinize emin misiniz? Oyunu terk ederseniz 1 Can kaybedersiniz.",
              accentColor: "#FF647C",
              primaryButton: {
                text: "DEVAM ET",
                color: accentColor || "#2a9c7a",
                onPress: onDismiss,
              },
              secondaryButton: {
                text: "AYRIL (-1 CAN)",
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
