import { describe, it, expect, vi } from "vitest";

// Mock React Native & Expo Haptics & Expo Audio for node unit testing
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn().mockResolvedValue(undefined),
  notificationAsync: vi.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: "light", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Error: "error" },
}));

vi.mock("expo-audio", () => ({
  createAudioPlayer: vi.fn().mockReturnValue({
    seekTo: vi.fn(),
    play: vi.fn(),
  }),
  setAudioModeAsync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../assets/sounds/select.wav", () => ({ default: 1 }));
vi.mock("../assets/sounds/accepted.wav", () => ({ default: 2 }));
vi.mock("../assets/sounds/rejected.wav", () => ({ default: 3 }));
vi.mock("../assets/sounds/victory.wav", () => ({ default: 4 }));

import {
  gameSfx,
  triggerHapticSelection,
  triggerHapticSuccess,
  triggerHapticError,
  triggerHapticLongWord,
  setSfxEnabled,
  setHapticsEnabled,
} from "../shared/audio-haptics";
import * as Haptics from "expo-haptics";

describe("Audio & Haptics System Unit Tests", () => {
  it("should trigger haptic selection", () => {
    setHapticsEnabled(true);
    triggerHapticSelection();
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it("should trigger haptic success and error", () => {
    triggerHapticSuccess();
    expect(Haptics.notificationAsync).toHaveBeenCalled();

    triggerHapticError();
    expect(Haptics.notificationAsync).toHaveBeenCalled();
  });

  it("should trigger heavy haptics on long word", () => {
    triggerHapticLongWord();
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it("should handle gameSfx calls safely without crashing", () => {
    setSfxEnabled(true);
    expect(() => {
      gameSfx.select();
      gameSfx.accepted();
      gameSfx.rejected();
      gameSfx.victory();
    }).not.toThrow();
  });

  it("should respect disable toggle for SFX and Haptics", () => {
    setHapticsEnabled(false);
    vi.clearAllMocks();
    triggerHapticSelection();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();

    setSfxEnabled(false);
    expect(() => gameSfx.select()).not.toThrow();
  });
});
