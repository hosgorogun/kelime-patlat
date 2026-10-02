import React from "react";
import { StyleSheet, View } from "react-native";
import { ScreenContainer } from "../common/screen-container";
import { CyberBannerAd } from "../common/cyber-banner-ad";
import { PremiumDock, type DockDestination } from "../common/premium-dock";
import { OnboardingGuide } from "../onboarding/onboarding-guide";

export interface MainShellProps {
  active: DockDestination;
  children: React.ReactNode;
  onNavigate: (destination: DockDestination) => void;
  showGuide?: boolean;
  onCloseGuide?: () => void;
  missionsBadgeCount?: number;
  storeBadgeCount?: number;
}

export function MainShell({
  active,
  children,
  onNavigate,
  showGuide,
  onCloseGuide,
  missionsBadgeCount,
  storeBadgeCount,
}: MainShellProps) {
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} style={{ paddingHorizontal: 14, paddingTop: 6 }}>
      <View style={styles.shell}>
        {children}
        <View style={styles.fixedDock}>
          <CyberBannerAd />
          <PremiumDock active={active} onNavigate={onNavigate} missionsBadgeCount={missionsBadgeCount} storeBadgeCount={storeBadgeCount} />
        </View>
      </View>
      {showGuide !== undefined && onCloseGuide && (
        <OnboardingGuide visible={showGuide} onClose={onCloseGuide} />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, userSelect: "none", touchAction: "none" } as any,
  fixedDock: { position: "absolute", left: 0, right: 0, bottom: 8 },
});
