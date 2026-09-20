import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { gameSfx, setSfxEnabled } from "../lib/game-sfx";
export { gameSfx, setSfxEnabled };

export async function initAudio() {
  // Audio uses bundled local audio assets via gameSfx
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

// Sound effects using local bundled assets for 100% offline stability & zero latency
export function playSelectionNote(_index?: number) {
  gameSfx.select();
}

export function playSuccessSound() {
  gameSfx.accepted();
}

export function playErrorSound() {
  gameSfx.rejected();
}
