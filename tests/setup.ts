import { vi } from "vitest";

// Mock require for asset files
if (typeof require !== "undefined" && (require as any).extensions) {
  const handler = (module: any) => {
    module.exports = { uri: "mock-asset.png" };
  };
  [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".wav", ".mp3"].forEach((ext) => {
    (require as any).extensions[ext] = handler;
  });
}

// Setup global expo object for expo-modules-core
(global as any).expo = {
  EventEmitter: class MockEventEmitter {
    addListener() { return { remove: () => {} }; }
    removeListener() {}
    emit() {}
  },
  NativeModulesProxy: {},
  modules: {},
};

// Mock expo modules
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

import React from "react";

const createModalMock = (actual: any) => ({
  ...actual,
  Modal: ({ visible = true, children }: any) => {
    if (!visible) return null;
    return children;
  },
  Image: (props: any) => React.createElement("div", { "data-image": true }),
  ImageBackground: ({ children, ...props }: any) =>
    React.createElement("div", { "data-image-bg": true, ...props }, children),
});

vi.mock("react-native-web", async (importOriginal) => {
  const actual: any = await importOriginal();
  return createModalMock(actual);
});

vi.mock("react-native", async (importOriginal) => {
  const actual: any = await importOriginal();
  return createModalMock(actual);
});

vi.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

vi.mock("expo-linking", () => ({
  createURL: vi.fn((path) => `kelimepatlat://${path}`),
  openURL: vi.fn(),
  canOpenURL: vi.fn().mockResolvedValue(true),
  addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  useURL: vi.fn(() => null),
}));

vi.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {},
  },
}));

vi.mock("expo-audio", () => ({
  Audio: {
    Sound: class {
      loadAsync = vi.fn();
      playAsync = vi.fn();
      unloadAsync = vi.fn();
    },
  },
  createAudioPlayer: vi.fn(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    remove: vi.fn(),
  })),
  setAudioModeAsync: vi.fn(),
}));

vi.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: vi.fn().mockResolvedValue({ canceled: true, assets: [] }),
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  MediaTypeOptions: { Images: "Images" },
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(null),
    removeItem: vi.fn().mockResolvedValue(null),
    clear: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

let _hapticsEnabled = true;
vi.mock("@/lib/haptics", () => ({
  haptics: {
    select: vi.fn(),
    light: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    victory: vi.fn(),
  },
  hapticFeedback: {
    selection: vi.fn(),
    impact: vi.fn(),
    notification: vi.fn(),
  },
  setHapticsEnabled: vi.fn((enabled: boolean) => {
    _hapticsEnabled = enabled;
  }),
  getHapticsEnabled: vi.fn(() => _hapticsEnabled),
}));

vi.mock("@/lib/game-sfx", () => ({
  gameSfx: {
    select: vi.fn(),
    accepted: vi.fn(),
    rejected: vi.fn(),
    victory: vi.fn(),
    combo: vi.fn(),
    tick: vi.fn(),
    powerup: vi.fn(),
    playLetter: vi.fn(),
    playCelebrationCascade: vi.fn(),
    startAmbientBgm: vi.fn(),
    stopAmbientBgm: vi.fn(),
    play: vi.fn(),
    playSfx: vi.fn(),
    init: vi.fn(),
  },
  setSfxEnabled: vi.fn(),
  getSfxEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/game-socket", () => ({
  getSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: true,
  })),
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));
