import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

type EffectName = "select" | "accepted" | "rejected" | "victory";

let SOURCES: Record<EffectName, any> = { select: "select", accepted: "accepted", rejected: "rejected", victory: "victory" };
try {
  SOURCES = {
    select: require("../assets/sounds/select.wav"),
    accepted: require("../assets/sounds/accepted.wav"),
    rejected: require("../assets/sounds/rejected.wav"),
    victory: require("../assets/sounds/victory.wav"),
  };
} catch {
  // Unit test ESM environment fallback
}

type Player = ReturnType<typeof createAudioPlayer>;
const players: Partial<Record<EffectName, Player>> = {};
let sfxEnabled = true;
let audioConfigured = false;

export function setSfxEnabled(enabled: boolean) {
  sfxEnabled = enabled;
}

function playerFor(effect: EffectName) {
  if (!players[effect]) players[effect] = createAudioPlayer(SOURCES[effect]);
  return players[effect]!;
}

function play(effect: EffectName) {
  if (!sfxEnabled) return;
  try {
    if (!audioConfigured) {
      audioConfigured = true;
      void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    }
    const player = playerFor(effect);
    try {
      const seekRes: any = player.seekTo(0);
      if (seekRes && typeof seekRes.catch === "function") {
        seekRes.catch(() => undefined);
      }
    } catch {
      // Ignore seek error
    }
    try {
      const playRes: any = player.play();
      if (playRes && typeof playRes.catch === "function") {
        playRes.catch(() => undefined);
      }
    } catch {
      // Ignore play error
    }
  } catch {
    // Ses cihazda kullanılamadığında görsel ve haptik geri bildirim sürer.
  }
}

export const gameSfx = {
  select: () => play("select"),
  tap: () => play("select"),
  accepted: () => play("accepted"),
  rejected: () => play("rejected"),
  victory: () => play("victory"),
};
