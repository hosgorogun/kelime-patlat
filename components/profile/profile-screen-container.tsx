import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "../shell/main-shell";
import { ProfileScreen } from "./profile-screen";
import { ModernAlertModal, type ModernAlertData } from "../modals/modern-alert-modal";
import { SESSION_TOKEN_KEY, getApiBaseUrl } from "../../constants/oauth";
import { getGameSocket, reconnectGameSocket } from "@/lib/game-socket";
import { haptics } from "@/lib/haptics";
import { socialManager } from "@/shared/social";
import { DEFAULT_PROGRESS, type PlayerProgress } from "@/shared/progression";
import type { ToastData } from "../common/global-game-toast";

const SOLO_UNLOCK_KEY = "kelime-patlat:solo-unlocked-level";
const PROGRESS_KEY = "kelime-patlat:season-progress-v1";
const PENDING_AWARDS_KEY = "kelime-patlat:pending-awards-v1";

export interface ProfileScreenContainerProps {
  safeName: string;
  playerId: string;
  authToken: string | null;
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  setPlayerName: (name: string) => void;
  setAuthToken: (token: string | null) => void;
  setPlayerId: (id: string) => void;
  setSoloUnlockedLevel: (level: number) => void;
  setShowGuide: (show: boolean) => void;
  setShowWelcomeModal: (show: boolean) => void;
  setNotice: (notice: string) => void;
  syncProgressToCloud: (progress: PlayerProgress, customName?: string) => Promise<void>;
  sfxOn: boolean;
  toggleSfx: (val: boolean) => void;
  hapticsOn: boolean;
  toggleHaptics: (val: boolean) => void;
  globalAlert: ModernAlertData | null;
  setGlobalAlert: (alert: ModernAlertData | null) => void;
  setGlobalToast: (toast: ToastData | null) => void;
  unclaimedMissions: number;
  hasClaimableDailyReward: boolean;
  onNavigate: (destination: any) => void;
}

export function ProfileScreenContainer({
  safeName,
  playerId,
  authToken,
  progress,
  setProgress,
  setPlayerName,
  setAuthToken,
  setPlayerId,
  setSoloUnlockedLevel,
  setShowGuide,
  setShowWelcomeModal,
  setNotice,
  syncProgressToCloud,
  sfxOn,
  toggleSfx,
  hapticsOn,
  toggleHaptics,
  globalAlert,
  setGlobalAlert,
  setGlobalToast,
  unclaimedMissions,
  hasClaimableDailyReward,
  onNavigate,
}: ProfileScreenContainerProps) {
  return (
    <MainShell
      active="profile"
      onNavigate={onNavigate}
      missionsBadgeCount={unclaimedMissions}
      storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
    >
      <StatusBar style="dark" />
      <ProfileScreen
        playerName={safeName}
        onUpdatePlayerName={(newName) => {
          setPlayerName(newName);
          AsyncStorage.setItem("kelime-patlat:player-name", newName).catch(() => undefined);
          void syncProgressToCloud(progress, newName);
          const socket = getGameSocket();
          if (socket.connected) {
            socket.emit("player:identify", { playerId, username: newName });
          }
        }}
        progress={progress}
        onShowToast={(title, subtitle, icon, color) => {
          setGlobalToast({
            id: `toast-${Date.now()}`,
            title,
            subtitle,
            icon: icon || "ℹ️",
            accentColor: color || "#3EE8B5",
          });
        }}
        onSelectAvatar={(selectedAvatar) => {
          setProgress((current) => {
            const next = { ...current, selectedAvatar };
            void syncProgressToCloud(next);
            return next;
          });
        }}
        onSelectTitle={(selectedTitle) => {
          setProgress((current) => {
            const next = { ...current, selectedTitle };
            void syncProgressToCloud(next);
            return next;
          });
          setGlobalToast({
            id: `title-${Date.now()}`,
            title: "UNVAN KUŞANILDI",
            subtitle: `"${selectedTitle}" unvanı profilinde ve maçlarda aktif edildi.`,
            icon: "🏷️",
            accentColor: "#3EE8B5",
          });
        }}
        onSelectTheme={(selectedTheme) => {
          setProgress((current) => {
            const next = { ...current, selectedTheme };
            void syncProgressToCloud(next);
            return next;
          });
        }}
        onSelectFrame={(selectedFrame) => {
          setProgress((current) => {
            const next = { ...current, selectedFrame };
            void syncProgressToCloud(next);
            return next;
          });
          setGlobalToast({
            id: `frame-${Date.now()}`,
            title: "ÇERÇEVE KUŞANILDI",
            subtitle: "Profil çerçeveniz başarıyla güncellendi.",
            icon: "🖼️",
            accentColor: "#3EE8B5",
          });
        }}
        onUpdateGender={(gender) => {
          setProgress((current) => {
            const next = { ...current, gender };
            void syncProgressToCloud(next);
            return next;
          });
        }}
        onUpdateAvatarPhoto={(avatarPhoto) => {
          setProgress((current) => {
            const next = { ...current, avatarPhoto };
            void syncProgressToCloud(next);
            return next;
          });
          setGlobalToast({
            id: `photo-${Date.now()}`,
            title: avatarPhoto ? "PROFİL FOTOĞRAFI GÜNCELLENDİ" : "GLİF AVATARINA GEÇİLDİ",
            subtitle: avatarPhoto ? "Yeni profil portreniz kuşanıldı." : "Klasik siber glif simgenize geri dönüldü.",
            icon: "📷",
            accentColor: "#3EE8B5",
          });
        }}
        sfxOn={sfxOn}
        toggleSfx={toggleSfx}
        hapticsOn={hapticsOn}
        toggleHaptics={toggleHaptics}
        onBack={() => onNavigate("home")}
        isGuest={authToken === "guest" || !authToken}
        onOpenAuth={() => onNavigate("auth")}
        onLogout={async () => {
          haptics.error();
          setAuthToken(null);
          setPlayerId(`player-${Math.random().toString(36).slice(2, 10)}`);
          setPlayerName("OYUNCU");
          setProgress(DEFAULT_PROGRESS);
          setSoloUnlockedLevel(1);
          setShowGuide(false);
          setShowWelcomeModal(false);
          onNavigate("auth");
          await socialManager.reset().catch(() => undefined);
          await AsyncStorage.removeItem(SESSION_TOKEN_KEY).catch(() => undefined);
          await AsyncStorage.removeItem(PROGRESS_KEY).catch(() => undefined);
          await AsyncStorage.removeItem(SOLO_UNLOCK_KEY).catch(() => undefined);
          await AsyncStorage.removeItem("kelime-patlat:player-id").catch(() => undefined);
          await AsyncStorage.removeItem("kelime-patlat:player-name").catch(() => undefined);
          await AsyncStorage.removeItem("@kelime_patlat:vintage_puzzle_progress").catch(() => undefined);
          await AsyncStorage.removeItem(PENDING_AWARDS_KEY).catch(() => undefined);
          reconnectGameSocket();
        }}
        onDeleteAccount={async () => {
          haptics.error();
          if (authToken) {
            try {
              await fetch(`${getApiBaseUrl()}/api/auth/delete-account`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authToken}`,
                },
              });
            } catch (e) {
              console.warn("Delete account API failed", e);
            }
          }
          await socialManager.reset().catch(() => undefined);
          await AsyncStorage.removeItem(SESSION_TOKEN_KEY).catch(() => undefined);
          await AsyncStorage.removeItem(PROGRESS_KEY).catch(() => undefined);
          await AsyncStorage.removeItem(SOLO_UNLOCK_KEY).catch(() => undefined);
          await AsyncStorage.removeItem("kelime-patlat:player-id").catch(() => undefined);
          await AsyncStorage.removeItem("kelime-patlat:player-name").catch(() => undefined);
          await AsyncStorage.removeItem("kelime-patlat:guide-seen").catch(() => undefined);
          await AsyncStorage.removeItem("@kelime_patlat:vintage_puzzle_progress").catch(() => undefined);
          await AsyncStorage.removeItem(PENDING_AWARDS_KEY).catch(() => undefined);
          setAuthToken(null);
          setPlayerId(`player-${Math.random().toString(36).slice(2, 10)}`);
          setPlayerName("OYUNCU");
          setProgress(DEFAULT_PROGRESS);
          setSoloUnlockedLevel(1);
          setShowGuide(false);
          setNotice("Hesabınız ve tüm verileriniz kalıcı olarak silindi.");
          reconnectGameSocket();
          onNavigate("auth");
        }}
      />
      <ModernAlertModal alert={globalAlert} onDismiss={() => setGlobalAlert(null)} />
    </MainShell>
  );
}
