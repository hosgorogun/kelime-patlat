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

export function getSfxEnabled(): boolean {
  return sfxEnabled;
}

// ----------------------------------------------------
// Web Audio Synthesizer (Zero-latency Musical Engine)
// ----------------------------------------------------
let webAudioCtx: any = null;

function getWebAudioContext(): any {
  if (typeof window === "undefined") return null;
  const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    if (!webAudioCtx) {
      webAudioCtx = new AudioCtx();
    }
    if (webAudioCtx.state === "suspended") {
      void webAudioCtx.resume().catch(() => undefined);
    }
    return webAudioCtx;
  } catch {
    return null;
  }
}

// Musical scale: Do-Re-Mi-Fa-Sol-La-Si-Do (C4, D4, E4, F4, G4, A4, B4, C5, D5, E5, G5, C6)
const PENTATONIC_SCALE = [
  261.63, // C4 (Do)
  293.66, // D4 (Re)
  329.63, // E4 (Mi)
  349.23, // F4 (Fa)
  392.00, // G4 (Sol)
  440.00, // A4 (La)
  493.88, // B4 (Si)
  523.25, // C5 (Do)
  587.33, // D5 (Re)
  659.25, // E5 (Mi)
  783.99, // G5 (Sol)
  1046.50, // C6 (Do)
];

function playSynthTone(freq: number, duration: number, type: OscillatorType = "sine", gainLevel = 0.22, delay = 0) {
  const ctx = getWebAudioContext();
  if (!ctx) return false;
  try {
    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    return true;
  } catch {
    return false;
  }
}

// Marimba bell chime (fundamental + 2nd harmonic for crisp casual game feedback)
function playSynthMarimba(freq: number, duration = 0.16) {
  const ctx = getWebAudioContext();
  if (!ctx) return false;
  try {
    playSynthTone(freq, duration, "sine", 0.24);
    playSynthTone(freq * 2, duration * 0.7, "triangle", 0.08);
    return true;
  } catch {
    return false;
  }
}

function playerFor(effect: EffectName) {
  if (!players[effect]) {
    try {
      players[effect] = createAudioPlayer(SOURCES[effect]);
    } catch {
      return null;
    }
  }
  return players[effect] || null;
}

function play(effect: EffectName, playbackRate = 1.0) {
  if (!sfxEnabled) return;
  try {
    if (!audioConfigured) {
      audioConfigured = true;
      void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    }
    const player = playerFor(effect);
    if (!player) return;
    try {
      if (player && "playbackRate" in (player as any)) {
        (player as any).playbackRate = playbackRate;
      }
    } catch {
      // Ignore playback rate error
    }
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
  select: (index: number = 0) => {
    if (!sfxEnabled) return;
    const noteIdx = Math.min(Math.max(0, index), PENTATONIC_SCALE.length - 1);
    const freq = PENTATONIC_SCALE[noteIdx]!;
    const playedSynth = playSynthMarimba(freq, 0.16);
    if (!playedSynth) {
      const rate = 1.0 + Math.min(index, 7) * 0.08;
      play("select", rate);
    }
  },
  tap: () => {
    if (!sfxEnabled) return;
    const playedSynth = playSynthTone(440, 0.06, "triangle", 0.15);
    if (!playedSynth) {
      play("select", 1.0);
    }
  },
  accepted: (wordLength: number = 4) => {
    if (!sfxEnabled) return;
    const ctx = getWebAudioContext();
    if (ctx) {
      if (wordLength <= 3) {
        // 3-letter word: 2-tone pleasant major third
        playSynthTone(523.25, 0.22, "sine", 0.22, 0); // C5
        playSynthTone(659.25, 0.32, "triangle", 0.24, 0.08); // E5
      } else if (wordLength <= 5) {
        // 4-5 letter word: major triad chord
        playSynthTone(523.25, 0.25, "sine", 0.20, 0); // C5
        playSynthTone(659.25, 0.28, "sine", 0.22, 0.07); // E5
        playSynthTone(783.99, 0.38, "triangle", 0.25, 0.14); // G5
      } else {
        // 6+ letter word: glorious fanfare arpeggio
        playSynthTone(523.25, 0.2, "sine", 0.18, 0); // C5
        playSynthTone(659.25, 0.2, "sine", 0.20, 0.06); // E5
        playSynthTone(783.99, 0.25, "sine", 0.22, 0.12); // G5
        playSynthTone(1046.50, 0.45, "triangle", 0.28, 0.18); // C6
      }
      return;
    }
    play("accepted");
  },
  rejected: () => {
    if (!sfxEnabled) return;
    const ctx = getWebAudioContext();
    if (ctx) {
      // Low descending two-tone buzz
      playSynthTone(180, 0.12, "sawtooth", 0.18, 0);
      playSynthTone(130, 0.16, "sawtooth", 0.18, 0.08);
      return;
    }
    play("rejected");
  },
  victory: () => {
    if (!sfxEnabled) return;
    const ctx = getWebAudioContext();
    if (ctx) {
      // Victory fanfare chords
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((f, i) => {
        playSynthTone(f, 0.35 + i * 0.08, "triangle", 0.22, i * 0.07);
      });
      // Final triumphant chord
      setTimeout(() => {
        if (!sfxEnabled) return;
        playSynthTone(523.25, 0.6, "sine", 0.2, 0);
        playSynthTone(659.25, 0.6, "sine", 0.2, 0);
        playSynthTone(783.99, 0.6, "sine", 0.22, 0);
        playSynthTone(1046.50, 0.7, "triangle", 0.25, 0);
      }, 420);
      return;
    }
    play("victory");
  },
  combo: (streak: number = 2) => {
    if (!sfxEnabled) return;
    const ctx = getWebAudioContext();
    if (ctx) {
      const baseFreq = 587.33 * Math.min(1.5, 1 + streak * 0.08);
      playSynthTone(baseFreq, 0.18, "sine", 0.22, 0);
      playSynthTone(baseFreq * 1.25, 0.26, "triangle", 0.25, 0.06);
      return;
    }
    play("accepted", 1.2);
  },
  tick: (urgent: boolean = false) => {
    if (!sfxEnabled) return;
    const ctx = getWebAudioContext();
    if (ctx) {
      playSynthTone(urgent ? 880 : 540, 0.04, "square", urgent ? 0.12 : 0.06, 0);
      return;
    }
    play("select", urgent ? 1.4 : 0.9);
  },
  powerup: () => {
    if (!sfxEnabled) return;
    const ctx = getWebAudioContext();
    if (ctx) {
      // Ascending energetic laser chime
      playSynthTone(440, 0.08, "sine", 0.2, 0);
      playSynthTone(554.37, 0.09, "sine", 0.2, 0.05);
      playSynthTone(659.25, 0.12, "triangle", 0.22, 0.1);
      playSynthTone(880, 0.2, "sine", 0.25, 0.15);
      return;
    }
    play("select", 1.5);
  },
  startAmbientBgm: () => {
    startAmbientBgm();
  },
  stopAmbientBgm: () => {
    stopAmbientBgm();
  },
};

let ambientBgmTimer: any = null;
let bgmStep = 0;

// Relaxing, warm acoustic Lo-Fi jazz chords (Cmaj7 -> Am7 -> Dm7 -> G7)
const BGM_CHORDS = [
  [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C4, E4, G4, B4)
  [220.00, 261.63, 329.63, 392.00], // Am7 (A3, C4, E4, G4)
  [293.66, 349.23, 440.00, 523.25], // Dm7 (D4, F4, A4, C5)
  [196.00, 246.94, 293.66, 349.23], // G7 (G3, B3, D4, F4)
];

function playAmbientChord() {
  if (!sfxEnabled) return;
  const ctx = getWebAudioContext();
  if (!ctx) return;
  try {
    const chord = BGM_CHORDS[bgmStep % BGM_CHORDS.length]!;
    bgmStep++;
    chord.forEach((freq, idx) => {
      playSynthTone(freq, 2.8, "sine", 0.022, idx * 0.09);
    });
  } catch {
    // ignore
  }
}

export function startAmbientBgm() {
  if (ambientBgmTimer) return;
  playAmbientChord();
  ambientBgmTimer = setInterval(() => {
    if (sfxEnabled) {
      playAmbientChord();
    }
  }, 4500);
}

export function stopAmbientBgm() {
  if (ambientBgmTimer) {
    clearInterval(ambientBgmTimer);
    ambientBgmTimer = null;
  }
}

