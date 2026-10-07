import React from "react";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "../shell/main-shell";
import { DailyLobbyScreen } from "./daily-lobby-screen";
import { useProgression, useNavigation, useUIFeedback, usePvP } from "@/context";
import type { DailyChallenge, PlayerProgress } from "@/shared/progression";
import type { ToastData } from "../common/global-game-toast";
import { haptics } from "@/lib/haptics";

export interface DailyLobbyContainerProps {
  daily?: DailyChallenge;
  progress?: PlayerProgress;
  setProgress?: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  setDailySession: (session: DailyChallenge | null) => void;
  setSoloLevel: (level: number) => void;
  setScreen?: (screen: any) => void;
  setSelectedModeInfo?: (mode: "pvp" | "daily" | "vintage" | "arcade" | "solo" | null) => void;
  unclaimedMissions?: number;
  hasClaimableDailyReward?: boolean;
  setGlobalToast?: (toast: ToastData | null) => void;
}

export function DailyLobbyContainer(props: DailyLobbyContainerProps) {
  const progression = useProgression();
  const navigation = useNavigation();
  const uiFeedback = useUIFeedback();
  const pvp = usePvP();

  const daily = props.daily ?? progression.daily;
  const progress = props.progress ?? progression.progress;
  const setProgress = props.setProgress ?? progression.setProgress;
  const setScreen = props.setScreen ?? navigation.setScreen;
  const unclaimedMissions = props.unclaimedMissions ?? progression.unclaimedMissions;
  const hasClaimableDailyReward = props.hasClaimableDailyReward ?? progression.hasClaimableDailyReward;
  const setGlobalToast = props.setGlobalToast ?? uiFeedback.setGlobalToast;
  const setSelectedModeInfo = props.setSelectedModeInfo ?? ((mode) => pvp.setSelectedModeInfo(mode));

  const handleBuyShield = () => {
    const SHIELD_COST = 120;
    const curCoins = progress.coins ?? 0;
    if (curCoins < SHIELD_COST) {
      haptics.error();
      setGlobalToast({
        id: `shield-fail-${Date.now()}`,
        title: "YETERSİZ ÇİP",
        subtitle: `Seri Kalkanı için ${SHIELD_COST} çip gerekli. Mevcut bakiyen: ${curCoins} çip.`,
        icon: "🪙",
        accentColor: "#EF4444",
      });
      return;
    }

    haptics.success();
    setProgress((curr) => ({
      ...curr,
      coins: (curr.coins ?? 0) - SHIELD_COST,
      streakShields: (curr.streakShields ?? 0) + 1,
    }));
    setGlobalToast({
      id: `shield-success-${Date.now()}`,
      title: "SERİ KALKANI ALINDI!",
      subtitle: "1x Seri Kalkanı envanterine eklendi. Günlük serin güvende!",
      icon: "🛡️",
      accentColor: "#10B981",
    });
  };

  return (
    <MainShell
      active="home"
      onNavigate={(destination) => setScreen(destination)}
      missionsBadgeCount={unclaimedMissions}
      storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
    >
      <StatusBar style="dark" />
      <DailyLobbyScreen
        daily={daily}
        progress={progress}
        setProgress={setProgress}
        onBack={() => setScreen("home")}
        onOpenInfo={() => setSelectedModeInfo("daily")}
        onSelectTheme={(themeId) => setProgress((curr) => ({ ...curr, selectedTheme: themeId }))}
        onBuyShield={handleBuyShield}
        onRewardClaimed={(reward) => {
          setGlobalToast({
            id: `weekend-claim-${Date.now()}`,
            title: "HAFTA SONU ÖDÜLÜ ALINDI!",
            subtitle: `+${reward.xp} XP, +${reward.coins} Çip${reward.shields ? ` ve +${reward.shields} 🛡️ Kalkan` : ""} hesabına eklendi!`,
            icon: "🎁",
            accentColor: "#8B5CF6",
          });
        }}
        onStartDaily={() => {
          props.setDailySession({
            ...daily,
            themeId: progress.selectedTheme,
          });
          props.setSoloLevel(daily.level ?? 20);
          setScreen("solo");
        }}
        onLockedNotice={() => {
          setGlobalToast({
            id: `daily-done-${Date.now()}`,
            title: "GÜNLÜK ROTA KİLİTLİ",
            subtitle: "Bugünkü sabit rotayı zaten tamamladın! Yarın yeni bir hak kazanacaksın.",
            icon: "🔒",
            accentColor: "#E8C36A",
          });
        }}
      />
    </MainShell>
  );
}
