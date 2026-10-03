import React, { createContext, useContext } from "react";
import type { ToastData } from "@/components/common/global-game-toast";
import type { ModernAlertData } from "@/components/modals/modern-alert-modal";
import type { InspectableUser } from "@/components/profile/user-profile-modal";

export interface UIFeedbackContextValue {
  globalToast: ToastData | null;
  setGlobalToast: (toast: ToastData | null) => void;
  showToast: (title: string, subtitle: string, icon?: string, accentColor?: string) => void;
  globalAlert: ModernAlertData | null;
  setGlobalAlert: (alert: ModernAlertData | null) => void;
  seasonResetModal: any;
  setSeasonResetModal: (modal: any) => void;
  showGuide: boolean;
  setShowGuide: (show: boolean) => void;
  handleCloseGuide: () => void;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
  isClaimingWelcomeReward: boolean;
  handleClaimWelcomeReward: () => void;
  handleClaimDailyReward: () => void;
  showConsentModal: boolean;
  setShowConsentModal: (show: boolean) => void;
  showLivesModal: boolean;
  setShowLivesModal: (show: boolean) => void;
  showLuckyWheel: boolean;
  setShowLuckyWheel: (show: boolean) => void;
  inspectedUser: InspectableUser | null;
  setInspectedUser: (user: InspectableUser | null) => void;
  openUserProfile: (target: Partial<InspectableUser> & { id: string; name: string }) => Promise<void>;
  sfxOn: boolean;
  toggleSfx: (val: boolean) => void;
  hapticsOn: boolean;
  toggleHaptics: (val: boolean) => void;
}

const UIFeedbackContext = createContext<UIFeedbackContextValue | null>(null);

export function UIFeedbackProvider({
  value,
  children,
}: {
  value: UIFeedbackContextValue;
  children: React.ReactNode;
}) {
  return (
    <UIFeedbackContext.Provider value={value}>
      {children}
    </UIFeedbackContext.Provider>
  );
}

export function useUIFeedback(): UIFeedbackContextValue {
  const ctx = useContext(UIFeedbackContext);
  if (!ctx) {
    throw new Error("useUIFeedback must be used within a UIFeedbackProvider");
  }
  return ctx;
}
