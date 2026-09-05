import { Platform } from "react-native";
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

// Sound players cache
let pianoPlayers: AudioPlayer[] = [];
let successPlayer: AudioPlayer | null = null;
let errorPlayer: AudioPlayer | null = null;
let tickingPlayer: AudioPlayer | null = null;

// Initial state
let soundEnabled = true;

// Piano frequencies notes mapping: Do, Re, Mi, Fa, Sol, La, Si, Do
const PIANO_NOTES = [
  'https://www.soundjay.com/button/sounds/button-10.mp3', // 1
  'https://www.soundjay.com/button/sounds/button-20.mp3', // 2
  'https://www.soundjay.com/button/sounds/button-21.mp3', // 3
  'https://www.soundjay.com/button/sounds/button-22.mp3', // 4
  'https://www.soundjay.com/button/sounds/button-23.mp3', // 5
  'https://www.soundjay.com/button/sounds/button-24.mp3', // 6
  'https://www.soundjay.com/button/sounds/button-25.mp3', // 7
  'https://www.soundjay.com/button/sounds/button-26.mp3'  // 8
];

const SUCCESS_SOUND = 'https://www.soundjay.com/button/sounds/button-09.mp3';
const ERROR_SOUND = 'https://www.soundjay.com/button/sounds/button-11.mp3';
const TICK_SOUND = 'https://www.soundjay.com/button/sounds/button-16.mp3';

export async function initAudio() {
  try {
    // Lazy-load players to prevent blocking startup
    if (pianoPlayers.length === 0) {
      pianoPlayers = PIANO_NOTES.map(uri => createAudioPlayer({ uri }));
      successPlayer = createAudioPlayer({ uri: SUCCESS_SOUND });
      errorPlayer = createAudioPlayer({ uri: ERROR_SOUND });
      tickingPlayer = createAudioPlayer({ uri: TICK_SOUND });
    }
  } catch (e) {
    console.warn('Audio initialization failed:', e);
  }
}

let hapticsEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function getSoundEnabled() {
  return soundEnabled;
}

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

export function getHapticsEnabled() {
  return hapticsEnabled;
}

// Haptics
export function triggerHapticSelection() {
  if (!hapticsEnabled || Platform.OS === "web") return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export function triggerHapticSuccess() {
  if (!hapticsEnabled || Platform.OS === "web") return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

export function triggerHapticError() {
  if (!hapticsEnabled || Platform.OS === "web") return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
}

export function triggerHapticLongWord() {
  if (!hapticsEnabled || Platform.OS === "web") return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
}

// Sound effects
export function playSelectionNote(index: number) {
  if (!soundEnabled || pianoPlayers.length === 0) return;
  try {
    const playerIndex = Math.min(index, pianoPlayers.length - 1);
    const player = pianoPlayers[playerIndex];
    if (player) {
      player.seekTo(0);
      player.play();
    }
  } catch (e) {}
}

export function playSuccessSound() {
  if (!soundEnabled || !successPlayer) return;
  try {
    successPlayer.seekTo(0);
    successPlayer.play();
  } catch (e) {}
}

export function playErrorSound() {
  if (!soundEnabled || !errorPlayer) return;
  try {
    errorPlayer.seekTo(0);
    errorPlayer.play();
  } catch (e) {}
}

export function playTickingSound() {
  if (!soundEnabled || !tickingPlayer) return;
  try {
    tickingPlayer.seekTo(0);
    tickingPlayer.play();
  } catch (e) {}
}
