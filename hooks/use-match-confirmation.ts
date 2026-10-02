import { useState } from "react";
import type { BoardSize } from "../shared/game";
import type { ModernAlertData } from "../components/modals/modern-alert-modal";

export interface PendingMatchConfirm {
  size: BoardSize;
  modeTitle: string;
  durationText: string;
  routesText: string;
  isBot?: boolean;
}

export type SelectedModeInfo = "pvp" | "daily" | "vintage" | "arcade" | "solo" | null;

export interface UseMatchConfirmationParams {
  startBotDuel: (size: BoardSize) => Promise<any> | void;
  startMatchmaking: (size: BoardSize) => Promise<any> | void;
  setGlobalAlert: (alert: ModernAlertData | null) => void;
}

export function useMatchConfirmation({
  startBotDuel,
  startMatchmaking,
  setGlobalAlert,
}: UseMatchConfirmationParams) {
  const [pendingMatchConfirm, setPendingMatchConfirm] = useState<PendingMatchConfirm | null>(null);
  const [selectedModeInfo, setSelectedModeInfo] = useState<SelectedModeInfo>(null);

  const promptBotDuel = (size: BoardSize) => {
    const modeTitle =
      size === 4
        ? "4×4 Bot Alıştırması"
        : size === 6
        ? "6×6 Bot Düellosu"
        : size === 8
        ? "8×8 İleri Düzey Bot Maçı"
        : "10×10 Usta Bot Karşılaşması";
    const durationText =
      size === 4 ? "55 Saniye" : size === 6 ? "75 Saniye" : size === 8 ? "95 Saniye" : "125 Saniye";
    const routesText = size === 4 ? "3 Rota" : size === 6 ? "6 Rota" : size === 8 ? "8 Rota" : "12 Rota";

    setPendingMatchConfirm({
      size,
      modeTitle,
      durationText,
      routesText,
      isBot: true,
    });
  };

  const handleConfirmMatch = (info: { size: BoardSize; isBot?: boolean }) => {
    setPendingMatchConfirm(null);
    if (info.isBot) {
      void startBotDuel(info.size);
    } else {
      void startMatchmaking(info.size);
    }
  };

  const watchAd = (onReward: () => void) => {
    setGlobalAlert({
      icon: "📺",
      kicker: "REKLAM ÖDÜLÜ",
      title: "Sponsorlu Reklam İzle",
      message: "Serini korumak için 15 saniyelik sponsorlu ödüllü reklam oynatılacak. Onaylıyor musunuz?",
      accentColor: "#FFC24A",
      primaryButton: {
        text: "İZLE VE KORUMAYI AL",
        color: "#98732c",
        onPress: () => onReward(),
      },
      secondaryButton: {
        text: "VAZGEÇ",
      },
    });
  };

  return {
    pendingMatchConfirm,
    setPendingMatchConfirm,
    selectedModeInfo,
    setSelectedModeInfo,
    promptBotDuel,
    handleConfirmMatch,
    watchAd,
  };
}
