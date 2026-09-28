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
import { VictoryBanner, VictoryEffectOverlay } from "./victory-effect-overlay";

const celebrationSamples = [
  { mode: "Solo", title: "Seviye senin!", subtitle: "4 kelimeyi de buldun. Harika iş!" },
  { mode: "Günlük", title: "Günlük rota tamam!", subtitle: "Bugünün kelimelerini buldun. Harika iş!" },
  { mode: "Arcade", title: "Güzel turdu!", subtitle: "840 puan topladın. Bir tur daha?" },
  { mode: "Bulmaca", title: "Hepsi yerine oturdu!", subtitle: "3. bölüm tamamlandı. Ellerine sağlık!" },
  { mode: "Düello / Bot", title: "Kazandın!", subtitle: "320 puan · 8 kelime. Bu tur senin!" },
];
function CelebrationPreview() {
  const [selected, setSelected] = useState(0);
  const [replay, setReplay] = useState(0);
  const sample = celebrationSamples[selected]!;
  return (
    <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
      <Text style={{ color: palette.text, fontSize: 25, fontWeight: "900" }}>Biraz kutlayalım!</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {celebrationSamples.map((item, index) => (
          <Pressable key={item.mode} accessibilityRole="button" onPress={() => { setSelected(index); setReplay(n => n + 1); }}
            style={{ padding: 12, borderRadius: 14, backgroundColor: selected === index ? "#FFD66E" : "#FFFFFF" }}>
            <Text style={{ color: palette.text, fontWeight: "800" }}>{item.mode}</Text>
          </Pressable>
        ))}
      </View>
      <VictoryBanner title={sample.title} subtitle={sample.subtitle} />
      <Pressable accessibilityRole="button" onPress={() => setReplay(n => n + 1)} style={{ padding: 16, backgroundColor: "#A5E4BE", borderRadius: 16 }}>
        <Text style={{ color: palette.text, textAlign: "center", fontWeight: "900" }}>Kutlamayı tekrar oynat</Text>
      </Pressable>
      <VictoryEffectOverlay key={replay} {...sample} effectId="fireworks" />
    </View>
  );
}
const noop = () => {};
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
          <Pressable accessibilityRole="button" onPress={() => setScreen("celebration")}>
            <Text style={{ color: palette.text, fontSize: 11 }}>Kutlamalar</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          {screen === "celebration" && <CelebrationPreview />}
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
