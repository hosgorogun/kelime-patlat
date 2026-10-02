import { useEffect } from "react";
import { BackHandler } from "react-native";
import type { RoomSnapshot } from "../shared/game";
import type { ModernAlertData } from "../components/modals/modern-alert-modal";
import type { Screen } from "@/components/shell/types";

interface UseAndroidBackHandlerParams {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  showGuide: boolean;
  setShowGuide: (val: boolean) => void;
  selectedWordInfo: unknown;
  setSelectedWordInfo: (val: null) => void;
  inspectedPath: number[] | null;
  setInspectedPath: (val: null) => void;
  selectedModeInfo: unknown;
  setSelectedModeInfo: (val: null) => void;
  pendingMatchConfirm: unknown;
  setPendingMatchConfirm: (val: null) => void;
  showLivesModal: boolean;
  setShowLivesModal: (val: boolean) => void;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (val: boolean) => void;
  showResultModal: boolean;
  setShowResultModal: (val: boolean) => void;
  showLeaveDuelModal: boolean;
  setShowLeaveDuelModal: (val: boolean) => void;
  seasonResetModal: unknown;
  setSeasonResetModal: (val: null) => void;
  globalAlert: ModernAlertData | null;
  setGlobalAlert: (val: ModernAlertData | null) => void;
  room: RoomSnapshot | null;
  leaveRoom: () => void;
  dailySession: unknown;
  setDailySession: (val: null) => void;
  soloLevel: number;
  completeSoloLevel: (level: number, words?: string[], won?: boolean) => void;
}

export function useAndroidBackHandler({
  screen,
  setScreen,
  showGuide,
  setShowGuide,
  selectedWordInfo,
  setSelectedWordInfo,
  inspectedPath,
  setInspectedPath,
  selectedModeInfo,
  setSelectedModeInfo,
  pendingMatchConfirm,
  setPendingMatchConfirm,
  showLivesModal,
  setShowLivesModal,
  showWelcomeModal,
  setShowWelcomeModal,
  showResultModal,
  setShowResultModal,
  showLeaveDuelModal,
  setShowLeaveDuelModal,
  seasonResetModal,
  setSeasonResetModal,
  globalAlert,
  setGlobalAlert,
  room,
  leaveRoom,
  dailySession,
  setDailySession,
  soloLevel,
  completeSoloLevel,
}: UseAndroidBackHandlerParams) {
  useEffect(() => {
    const onBackPress = () => {
      if (showGuide) {
        setShowGuide(false);
        return true;
      }
      if (selectedWordInfo) {
        setSelectedWordInfo(null);
        return true;
      }
      if (inspectedPath) {
        setInspectedPath(null);
        return true;
      }
      if (selectedModeInfo !== null) {
        setSelectedModeInfo(null);
        return true;
      }
      if (pendingMatchConfirm !== null) {
        setPendingMatchConfirm(null);
        return true;
      }
      if (showLivesModal) {
        setShowLivesModal(false);
        return true;
      }
      if (showWelcomeModal) {
        setShowWelcomeModal(false);
        return true;
      }
      if (showResultModal) {
        setShowResultModal(false);
        return true;
      }
      if (showLeaveDuelModal) {
        setShowLeaveDuelModal(false);
        return true;
      }
      if (seasonResetModal !== null) {
        setSeasonResetModal(null);
        return true;
      }
      if (globalAlert !== null) {
        setGlobalAlert(null);
        return true;
      }
      if (screen === "room" || screen === "game") {
        if (room?.status === "finished") {
          leaveRoom();
          return true;
        }
        setGlobalAlert({
          icon: "⚔️",
          kicker: "DÜELLODAN AYRIL",
          title: "Maçtan Ayrılmak İstiyor Musunuz?",
          message: "Mevcut odadan ve maçtan ayrılmak istediğinize emin misiniz?",
          accentColor: "#FF647C",
          primaryButton: {
            text: "AYRIL",
            color: "#ca4f62",
            onPress: () => leaveRoom(),
          },
          secondaryButton: {
            text: "VAZGEÇ",
          },
        });
        return true;
      }
      if (screen === "solo") {
        setGlobalAlert({
          icon: "⚠️",
          kicker: dailySession ? "GÜNÜN ROTASI" : "TEK OYUNCULU MOD",
          title: dailySession ? "Günün Rotasından Ayrıl" : "Bölümden Ayrıl (-1 Can)",
          message: dailySession
            ? "Günün rotasından çıkmak istediğinize emin misiniz? Günlük tek oynama hakkınızı korumak için oyunu tamamlamayı deneyin."
            : "Mevcut seviyeden ayrılmak istediğinize emin misiniz? Oyunu terk ederseniz 1 Can kaybedersiniz.",
          accentColor: "#FF647C",
          primaryButton: {
            text: dailySession ? "AYRIL" : "AYRIL (-1 CAN)",
            color: "#ca4f62",
            onPress: () => {
              if (!dailySession) {
                completeSoloLevel(soloLevel, [], false);
              }
              const destination = dailySession ? "home" : "levels";
              setDailySession(null);
              setScreen(destination);
            },
          },
          secondaryButton: {
            text: "DEVAM ET",
          },
        });
        return true;
      }
      if (
        screen === "arcade" ||
        screen === "daily-lobby" ||
        screen === "levels" ||
        screen === "season" ||
        screen === "league" ||
        screen === "missions" ||
        screen === "profile" ||
        screen === "online" ||
        screen === "friends" ||
        screen === "auth" ||
        screen === "store" ||
        screen === "vintage"
      ) {
        setScreen("home");
        return true;
      }
      return false; // Exit app if already on home screen
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [
    screen,
    showGuide,
    selectedWordInfo,
    inspectedPath,
    selectedModeInfo,
    pendingMatchConfirm,
    showLivesModal,
    showWelcomeModal,
    showResultModal,
    showLeaveDuelModal,
    seasonResetModal,
    globalAlert,
    dailySession,
    soloLevel,
    room,
  ]);
}
