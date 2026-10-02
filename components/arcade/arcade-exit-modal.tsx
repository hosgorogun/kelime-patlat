import React from "react";
import { ModernAlertModal } from "../modals/modern-alert-modal";

export type ArcadeExitModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onConfirmExit: () => void;
};

export const ArcadeExitModal = React.memo(({
  visible,
  onDismiss,
  onConfirmExit,
}: ArcadeExitModalProps) => {
  return (
    <ModernAlertModal
      alert={
        visible
          ? {
              icon: "⚡",
              kicker: "ARCADE HÜCUMU",
              title: "Yarıştan Ayrıl",
              message:
                "Zamana karşı hücum devam ediyor. Çıkmak istediğinize emin misiniz? (Şu ana kadar kazandığınız skor kaydedilecektir)",
              accentColor: "#FF647C",
              primaryButton: {
                text: "DEVAM ET",
                color: "#2a9c7a",
                onPress: onDismiss,
              },
              secondaryButton: {
                text: "AYRIL",
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

ArcadeExitModal.displayName = "ArcadeExitModal";
