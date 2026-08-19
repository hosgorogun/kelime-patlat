import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

type EffectName = "select" | "accepted" | "rejected" | "victory";

const SOURCES = {
  select: require("@/assets/sounds/select.wav"),
  accepted: require("@/assets/sounds/accepted.wav"),
  rejected: require("@/assets/sounds/rejected.wav"),
  victory: require("@/assets/sounds/victory.wav"),
} as const;

type Player = ReturnType<typeof createAudioPlayer>;
const players: Partial<Record<EffectName, Player>> = {};
let audioConfigured = false;

function playerFor(effect: EffectName) {
  if (!players[effect]) players[effect] = createAudioPlayer(SOURCES[effect]);
  return players[effect]!;
}

function play(effect: EffectName) {
  try {
    if (!audioConfigured) {
      audioConfigured = true;
      void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    }
    const player = playerFor(effect);
    player.seekTo(0);
    player.play();
  } catch {
    // Ses cihazda kullanılamadığında görsel ve haptik geri bildirim sürer.
  }
}

export const gameSfx = {
  select: () => play("select"),
  accepted: () => play("accepted"),
  rejected: () => play("rejected"),
  victory: () => play("victory"),
};
