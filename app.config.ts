// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const bundleId = "com.kelimepatlat.app";

const env = {
  // App branding
  appName: "Kelime Patlat",
  appSlug: "kelime-patlat",
  scheme: "kelimepatlat",
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    buildNumber: "1",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: "Profil fotoğrafı çekmek ve avatarınızı güncellemek için kamera erişimi gereklidir.",
      NSPhotoLibraryUsageDescription: "Profil fotoğrafı seçmek ve profilinizi kişiselleştirmek için galeri erişimi gereklidir."
    }
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#01031E",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    versionCode: 1,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-font",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash.png",
        resizeMode: "cover",
        backgroundColor: "#050B14",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/icon.png",
        color: "#38BDF8",
      },
    ],
    [
      "expo-audio",
      {
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Profil fotoğrafı seçmek için galeri erişimi gereklidir.",
        cameraPermission: "Profil fotoğrafı çekmek için kamera erişimi gereklidir."
      }
    ],

    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
          compileSdkVersion: 36,
          targetSdkVersion: 35,
        },
      },
    ],
    [
      "react-native-google-mobile-ads",
      {
        androidSdk: "classic",
        androidAppId:
          process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
          process.env.ADMOB_ANDROID_APP_ID ||
          "ca-app-pub-3940256099942544~3347511713",
        iosAppId:
          process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ||
          process.env.ADMOB_IOS_APP_ID ||
          "ca-app-pub-3940256099942544~1458002511",
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "a7875821-ef27-48a6-a5dd-c14d18d963bd",
    },
    admob: {
      androidAppId:
        process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
        process.env.ADMOB_ANDROID_APP_ID ||
        "ca-app-pub-3940256099942544~3347511713",
      iosAppId:
        process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ||
        process.env.ADMOB_IOS_APP_ID ||
        "ca-app-pub-3940256099942544~1458002511",
      bannerIdAndroid:
        process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID ||
        "ca-app-pub-3940256099942544/6300978111",
      bannerIdIos:
        process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_IOS ||
        "ca-app-pub-3940256099942544/2934735716",
      interstitialIdAndroid:
        process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID ||
        "ca-app-pub-3940256099942544/1033173712",
      interstitialIdIos:
        process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS ||
        "ca-app-pub-3940256099942544/4411468910",
      rewardedIdAndroid:
        process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID ||
        "ca-app-pub-3940256099942544/5224354917",
      rewardedIdIos:
        process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS ||
        "ca-app-pub-3940256099942544/1712485313",
      testMode: process.env.EXPO_PUBLIC_ADMOB_TEST_MODE !== "false",
    },
  },
  experiments: {
    reactCompiler: true,
  },
};

export default config;
