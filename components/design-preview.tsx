import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ScreenContainer } from "./screen-container";
import { CommandCenter } from "./command-center";
import { PremiumDock, type DockDestination } from "./premium-dock";
import { CyberStore } from "./cyber-store";
import { MissionsScreen } from "./missions-screen";
import { ProfileScreen } from "./profile-screen";
import { SeasonHub } from "./season-hub";
import { SoloLevels } from "./solo-levels";
import { SoloChallenge } from "./solo-challenge";
import { VintagePuzzle } from "./vintage-puzzle";
import { ArcadeChallenge } from "./arcade-challenge";
import {
  DEFAULT_PROGRESS,
  getDailyChallenge,
  getDayId,
} from "@/shared/progression";
import { palette } from "@/shared/palette";
const noop = () => {};
const excludedWords: string[] = [];
// Isolated visual fixtures: no account, purchases, consent changes or server writes.
const progress = {
  ...DEFAULT_PROGRESS,
  coins: 250,
  xp: 640,
  wins: 8,
  matches: 12,
  lastLoginDay: getDayId(),
};
export default function DesignPreview() {
  const [screen, setScreen] = useState<string>("home");
  const [level, setLevel] = useState(1);
  const home = () => setScreen("home");
  const navigate = (next: string) =>
    setScreen(
      next === "online" || next === "friends" || next === "league"
        ? "season"
        : next,
    );
  const dock: DockDestination = [
    "store",
    "missions",
    "profile",
    "season",
  ].includes(screen)
    ? (screen as DockDestination)
    : "home";
  return (
    <SafeAreaProvider>
      <ScreenContainer style={{ padding: 14 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: palette.muted, fontSize: 11 }}>
            Tasarım önizlemesi · örnek veriler
          </Text>
          <Pressable onPress={home}>
            <Text style={{ color: palette.text, fontSize: 11 }}>Ana sayfa</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          {screen === "home" && (
            <CommandCenter
              playerName="Deniz"
              progress={progress}
              daily={getDailyChallenge()}
              leaderboard={[]}
              onPlayDaily={() => setScreen("solo")}
              onPlayBot={() => setScreen("solo")}
              onSolo={() => setScreen("levels")}
              onNavigate={navigate}
              onShowGuide={noop}
            />
          )}
          {screen === "store" && (
            <CyberStore
              coins={250}
              progress={progress}
              hasClaimableDailyReward={false}
              onClaimDailyReward={noop}
              onBuyCoins={noop}
              onBuyRadar={noop}
              onBack={home}
            />
          )}
          {screen === "missions" && (
            <MissionsScreen
              progress={progress}
              onBack={home}
              onPlayDaily={() => setScreen("solo")}
              onNavigate={navigate}
            />
          )}
          {screen === "profile" && (
            <ProfileScreen
              playerName="Deniz"
              onUpdatePlayerName={noop}
              progress={progress}
              sfxOn={false}
              toggleSfx={noop}
              hapticsOn={false}
              toggleHaptics={noop}
              onBack={home}
              onLogout={noop}
            />
          )}
          {screen === "season" && (
            <SeasonHub
              playerId="design-preview"
              playerName="Deniz"
              progress={progress}
              leaderboard={[]}
              onBack={home}
            />
          )}
          {screen === "levels" && (
            <SoloLevels
              unlockedLevel={5}
              onBack={home}
              onSelect={(n) => {
                setLevel(n);
                setScreen("solo");
              }}
            />
          )}
          {screen === "solo" && (
            <SoloChallenge
              excludeWords={excludedWords}
              level={level}
              variationSeed={1}
              lives={5}
              onExit={home}
              onComplete={noop}
              onNext={home}
            />
          )}
          {screen === "vintage" && (
            <VintagePuzzle
              onBack={home}
              lives={5}
              coins={250}
              vintageProgress={{
                maxUnlockedLevel: 1,
                completedLevels: [],
                score: 0,
              }}
              onSaveProgress={noop}
            />
          )}
          {screen === "arcade" && (
            <ArcadeChallenge onExit={home} onComplete={noop} />
          )}
        </View>
        <PremiumDock active={dock} onNavigate={setScreen} />
      </ScreenContainer>
    </SafeAreaProvider>
  );
}
