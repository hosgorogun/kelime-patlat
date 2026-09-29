import React from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ScreenContainer } from "./screen-container";
import { SoloLevels } from "./solo-levels";
import { CyberBannerAd } from "./cyber-banner-ad";
import { PremiumDock } from "./premium-dock";
import { GlobalGameToast, type ToastData } from "./global-game-toast";
import { haptics } from "../lib/haptics";
import type { PlayerProgress } from "../shared/progression";

export interface SoloLevelsScreenProps {
  soloUnlockedLevel: number;
  progress: PlayerProgress;
  lives: number;
  unclaimedMissions: number;
  hasClaimableDailyReward: boolean;
  globalToast: ToastData | null;
  setGlobalToast: (toast: ToastData | null) => void;
  onOpenLivesModal: () => void;
  onNavigate: (destination: any) => void;
  onSelectLevel: (level: number) => void;
  claimMilestoneOnServer: (level: number, updater: (curr: PlayerProgress) => PlayerProgress) => void;
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
}

export function SoloLevelsScreen({
  soloUnlockedLevel,
  progress,
  lives,
  unclaimedMissions,
  hasClaimableDailyReward,
  globalToast,
  setGlobalToast,
  onOpenLivesModal,
  onNavigate,
  onSelectLevel,
  claimMilestoneOnServer,
  livesModalElement,
  celebrationModalElement,
}: SoloLevelsScreenProps) {
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} style={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <StatusBar style="dark" />
      <GlobalGameToast toast={globalToast} onDismiss={() => setGlobalToast(null)} />
      <SoloLevels
        unlockedLevel={soloUnlockedLevel}
        claimedMilestones={progress.claimedMilestones ?? {}}
        lives={lives}
        onOpenLivesModal={onOpenLivesModal}
        onBack={() => onNavigate("home")}
        onSelect={onSelectLevel}
        onClaimMilestone={(milestone) => {
          haptics.success();
          claimMilestoneOnServer(milestone.level, (curr) => ({
            ...curr,
            coins: (curr.coins ?? 0) + milestone.coins,
            streakShields: (curr.streakShields ?? 1) + milestone.shields,
            xp: curr.xp + milestone.xp,
            claimedMilestones: {
              ...(curr.claimedMilestones ?? {}),
              [milestone.level]: true,
            },
          }));
          setGlobalToast({
            id: `milestone-${milestone.level}-${Date.now()}`,
            title: `SANDIK AÇILDI: ${milestone.title}`,
            subtitle: `+${milestone.coins} Çip, +${milestone.shields} Kalkan, +${milestone.xp} XP hesabına eklendi!`,
            icon: "🎁",
            accentColor: "#FFC24A",
            badge: `LVL ${milestone.level}`,
          });
        }}
      />
      <View style={{ position: "absolute", bottom: 8, left: 14, right: 14 }}>
        <CyberBannerAd />
        <PremiumDock
          active="home"
          onNavigate={onNavigate}
          missionsBadgeCount={unclaimedMissions}
          storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
        />
      </View>
      {livesModalElement}
      {celebrationModalElement}
    </ScreenContainer>
  );
}
