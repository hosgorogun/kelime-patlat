import { useState, useEffect } from "react";
import { consentManager, notificationManager } from "../lib/engagement";

export function useEngagementLifecycle() {
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    let active = true;
    consentManager.isConsentAccepted().then((accepted) => {
      if (active && !accepted) {
        setShowConsentModal(true);
      }
    });
    void notificationManager.initAndScheduleReminders();
    return () => {
      active = false;
    };
  }, []);

  return {
    showConsentModal,
    setShowConsentModal,
  };
}
