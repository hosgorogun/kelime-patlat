import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { gameSfx, setSfxEnabled, getSfxEnabled } from "@/lib/game-sfx";
export { gameSfx, setSfxEnabled, getSfxEnabled };

export async function initAudio() {
  // Audio uses bundled local audio assets via gameSfx
}

export function setSoundEnabled(enabled: boolean) {
  setSfxEnabled(enabled);
}

export function getSoundEnabled() {
  return getSfxEnabled();
}

let hapticsEnabled = true;

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

export function playTickingSound() {
  gameSfx.select();
}
