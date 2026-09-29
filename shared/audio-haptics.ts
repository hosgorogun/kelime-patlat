import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { gameSfx, setSfxEnabled, getSfxEnabled } from "../lib/game-sfx";
export { gameSfx, setSfxEnabled, getSfxEnabled };

export async function initAudio() {
  // Audio uses bundled local audio assets and Web Audio synth via gameSfx
}

import { getHapticsEnabled, setHapticsEnabled } from "../lib/haptics";
export { getHapticsEnabled, setHapticsEnabled };

// Haptics
export function triggerHapticSelection() {
  if (!getHapticsEnabled() || Platform.OS === "web") return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export function triggerHapticSuccess() {
  if (!getHapticsEnabled() || Platform.OS === "web") return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

export function triggerHapticError() {
  if (!getHapticsEnabled() || Platform.OS === "web") return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
}

export function triggerHapticLongWord() {
  if (!getHapticsEnabled() || Platform.OS === "web") return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
}

// Sound effects: Musical progression & tiered feedback
export function playSelectionNote(index: number = 0) {
  gameSfx.select(index);
}

export function playSuccessSound(wordLength: number = 4) {
  gameSfx.accepted(wordLength);
}

export function playErrorSound() {
  gameSfx.rejected();
}

export function playComboSound(streak: number = 2) {
  gameSfx.combo(streak);
}

export function playTimerTick(urgent: boolean = false) {
  gameSfx.tick(urgent);
}
