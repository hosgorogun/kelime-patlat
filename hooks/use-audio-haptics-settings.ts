import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setHapticsEnabled } from "../lib/haptics";
import { setSfxEnabled } from "../lib/game-sfx";
import { setHapticsEnabled as setSoloHapticsEnabled, startAmbientBgm, stopAmbientBgm } from "../shared/audio-haptics";
import type { PlayerProgress } from "../shared/progression";

export interface UseAudioHapticsSettingsParams {
  progress: PlayerProgress;
  progressReady: boolean;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
}

export function useAudioHapticsSettings({
  progress,
  progressReady,
  setProgress,
}: UseAudioHapticsSettingsParams) {
  const [sfxOn, setSfxOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);

  // Initial load from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem("kelime-patlat:sfx-enabled").then((val) => {
      const enabled = val !== "false";
      setSfxOn(enabled);
      setSfxEnabled(enabled);
    }).catch(() => undefined);
    AsyncStorage.getItem("kelime-patlat:haptics-enabled").then((val) => {
      const enabled = val !== "false";
      setHapticsOn(enabled);
      setHapticsEnabled(enabled);
      setSoloHapticsEnabled(enabled);
    }).catch(() => undefined);
  }, []);

  // Sync from cloud progress once ready
  useEffect(() => {
    if (!progressReady) return;
    if (typeof progress.sfxEnabled === "boolean") {
      setSfxOn(progress.sfxEnabled);
      setSfxEnabled(progress.sfxEnabled);
    }
    if (typeof progress.hapticsEnabled === "boolean") {
      setHapticsOn(progress.hapticsEnabled);
      setHapticsEnabled(progress.hapticsEnabled);
      setSoloHapticsEnabled(progress.hapticsEnabled);
    }
  }, [progress.sfxEnabled, progress.hapticsEnabled, progressReady]);

  useEffect(() => {
    if (sfxOn) {
      startAmbientBgm();
    } else {
      stopAmbientBgm();
    }
    return () => {
      stopAmbientBgm();
    };
  }, [sfxOn]);

  const toggleSfx = (val: boolean) => {
    setSfxOn(val);
    setSfxEnabled(val);
    AsyncStorage.setItem("kelime-patlat:sfx-enabled", String(val)).catch(() => undefined);
    setProgress((curr) => ({ ...curr, sfxEnabled: val }));
  };

  const toggleHaptics = (val: boolean) => {
    setHapticsOn(val);
    setHapticsEnabled(val);
    setSoloHapticsEnabled(val);
    AsyncStorage.setItem("kelime-patlat:haptics-enabled", String(val)).catch(() => undefined);
    setProgress((curr) => ({ ...curr, hapticsEnabled: val }));
  };

  return {
    sfxOn,
    hapticsOn,
    toggleSfx,
    toggleHaptics,
    setSfxOn,
    setHapticsOn,
  };
}
