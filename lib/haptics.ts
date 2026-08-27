import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

export function getHapticsEnabled() {
  return hapticsEnabled;
}

function nativeOnly(action: () => Promise<void>) {
  if (hapticsEnabled && Platform.OS !== "web") void action();
}

export const haptics = {
  select: () => nativeOnly(() => Haptics.selectionAsync()),
  light: () => nativeOnly(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => nativeOnly(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => nativeOnly(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  victory: () => {
    nativeOnly(async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    });
  },
};
