import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "./main-shell";
import { CyberStore } from "./cyber-store";
import { SESSION_TOKEN_KEY, getApiBaseUrl } from "../constants/oauth";
import { getCalculatedLives, MAX_LIVES, type PlayerProgress } from "../shared/progression";
import type { ToastData } from "./global-game-toast";
import type { BoardSize } from "../shared/game";

export interface CyberStoreScreenContainerProps {
  progress: PlayerProgress;
  progressRef: React.RefObject<PlayerProgress>;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud: (next: PlayerProgress) => Promise<void>;
  unclaimedMissions: number;
  hasClaimableDailyReward: boolean;
  globalToast: ToastData | null;
  setGlobalToast: (toast: ToastData | null) => void;
  incomingDuelInvite: { fromPlayerId: string; fromPlayerName: string; roomCode: string; size: BoardSize } | null;
  onAcceptDuel: () => void;
  onRejectDuel: () => void;
  livesModalElement: React.ReactNode;
  celebrationModalElement: React.ReactNode;
  onNavigate: (destination: any) => void;
  onClaimDailyReward: () => void;
}

export function CyberStoreScreenContainer({
  progress,
  progressRef,
  setProgress,
  syncProgressToCloud,
  unclaimedMissions,
  hasClaimableDailyReward,
  globalToast,
  setGlobalToast,
  incomingDuelInvite,
  onAcceptDuel,
  onRejectDuel,
  livesModalElement,
  celebrationModalElement,
  onNavigate,
  onClaimDailyReward,
}: CyberStoreScreenContainerProps) {
  return (
    <MainShell
      active="store"
      onNavigate={onNavigate}
      missionsBadgeCount={unclaimedMissions}
      storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
      toast={globalToast}
      onDismissToast={() => setGlobalToast(null)}
      duelInvite={incomingDuelInvite}
      onAcceptDuel={onAcceptDuel}
      onRejectDuel={onRejectDuel}
      livesModal={livesModalElement}
      celebrationModal={celebrationModalElement}
    >
      <StatusBar style="dark" />
      <CyberStore
        coins={progress.coins ?? 0}
        progress={progress}
        hasClaimableDailyReward={hasClaimableDailyReward}
        onClaimDailyReward={onClaimDailyReward}
        onBuyCoins={(amount) => {
          setProgress((current) => {
            const next = { ...current, coins: (current.coins ?? 0) + amount };
            void syncProgressToCloud(next);
            return next;
          });
        }}
        onBuyRadar={() => {
          setProgress((current) => {
            const next = {
              ...current,
              xp: current.xp + 200,
              radarChargesBonus: (current.radarChargesBonus || 0) + 10,
            };
            void syncProgressToCloud(next);
            return next;
          });
        }}
        onSpendCoins={async (item) => {
          // Bayat closure yerine ref üzerinden güncel bakiye okunur
          const currentCoins = progressRef.current.coins ?? 0;
          if (currentCoins < item.cost) {
            setGlobalToast({
              id: `store-err-${Date.now()}`,
              title: "YETERSİZ ÇİP",
              subtitle: `${item.cost} çip gerekiyor.`,
              icon: "⚠️",
              accentColor: "#FF647C",
            });
            return false;
          }
          if (item.rewardType === "lives") {
            const calc = getCalculatedLives(progressRef.current);
            if (calc.lives >= MAX_LIVES) {
              setGlobalToast({
                id: `lives-full-${Date.now()}`,
                title: "CANLARIN DOLU! 💚",
                subtitle: "Tüm canların zaten tam kapasite dolu (5/5). Çiplerin korunuyor.",
                icon: "💚",
                accentColor: "#22C55E",
              });
              return false;
            }
          }

          const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
          if (token && token !== "guest") {
            try {
              const res = await fetch(`${getApiBaseUrl()}/api/game/shop-buy`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ itemId: item.id }),
              });
              const data = await res.json();
              if (res.ok && data.progress) {
                setProgress(data.progress);
                setGlobalToast({
                  id: `item-bought-${Date.now()}`,
                  title: "SATIN ALINDI!",
                  subtitle: `${item.name} envanterinize eklendi.`,
                  icon: item.icon,
                  accentColor: "#3EE8B5",
                });
                return true;
              } else if (res.status === 400) {
                setGlobalToast({
                  id: `item-err-${Date.now()}`,
                  title: "SATIN ALINAMADI",
                  subtitle: data.error || "İşlem gerçekleştirilemedi.",
                  icon: "⚠️",
                  accentColor: "#FF647C",
                });
                return false;
              }
            } catch {
              // Fallback to local
            }
          }

          // Local fallback (offline or guest)
          setProgress((current) => {
            const curCoins = current.coins ?? 0;
            if (curCoins < item.cost) return current;
            let next = { ...current, coins: curCoins - item.cost };
            if (item.rewardType === "lives") {
              next = { ...next, lives: MAX_LIVES, lastLifeRegenTimestamp: Date.now() };
            } else if (item.rewardType === "radar") {
              next = { ...next, radarChargesBonus: (current.radarChargesBonus || 0) + 5 };
            } else if (item.rewardType === "shield") {
              next = { ...next, streakShields: (current.streakShields || 0) + 1 };
            } else if (item.rewardType === "xp") {
              next = { ...next, xp: current.xp + 250 };
            }
            void syncProgressToCloud(next);
            return next;
          });
          setGlobalToast({
            id: `item-bought-${Date.now()}`,
            title: "SATIN ALINDI!",
            subtitle: `${item.name} envanterinize eklendi.`,
            icon: item.icon,
            accentColor: "#3EE8B5",
          });
          return true;
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
            subtitle: "Profil sinyalin güncellendi.",
            icon: "✨",
            accentColor: "#3EE8B5",
          });
        }}
        onSelectVictoryEffect={(selectedVictoryEffect) => {
          setProgress((current) => {
            const next = { ...current, selectedVictoryEffect };
            void syncProgressToCloud(next);
            return next;
          });
          setGlobalToast({
            id: `effect-${Date.now()}`,
            title: "ZAFER EFEKTİ SEÇİLDİ",
            subtitle: "Bitiriş kutlama efekti aktif.",
            icon: "💥",
            accentColor: "#E8C36A",
          });
        }}
        onSelectBoardSkin={(selectedBoardSkin) => {
          setProgress((current) => {
            const next = { ...current, selectedBoardSkin };
            void syncProgressToCloud(next);
            return next;
          });
          setGlobalToast({
            id: `skin-${Date.now()}`,
            title: "TAHTA GÖRÜNÜMÜ DEĞİŞTİ",
            subtitle: "Matris arka planın güncellendi.",
            icon: "🎨",
            accentColor: "#FFC24A",
          });
        }}
        onBuyCosmetic={async (kind, id, cost) => {
          // Bayat closure yerine ref üzerinden güncel bakiye okunur
          const currentCoins = progressRef.current.coins ?? 0;
          if (cost > 0 && currentCoins < cost) {
            setGlobalToast({
              id: `store-${Date.now()}`,
              title: "YETERSİZ ÇİP",
              subtitle: `${cost} çip gerekiyor.`,
              icon: "⚠️",
              accentColor: "#FF647C",
            });
            return false;
          }

          const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
          if (token && token !== "guest" && cost > 0) {
            try {
              const res = await fetch(`${getApiBaseUrl()}/api/game/cosmetic-buy`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ kind, id }),
              });
              const data = await res.json();
              if (res.ok && data.progress) {
                setProgress(data.progress);
                setGlobalToast({
                  id: `buy-${Date.now()}`,
                  title: "KOZMETİK KAZANILDI",
                  subtitle: "Yeni ürün envanterine eklendi ve kuşanıldı!",
                  icon: "🎉",
                  accentColor: "#3EE8B5",
                });
                return true;
              } else if (res.status === 400) {
                setGlobalToast({
                  id: `buy-err-${Date.now()}`,
                  title: "SATIN ALINAMADI",
                  subtitle: data.error || "İşlem gerçekleştirilemedi.",
                  icon: "⚠️",
                  accentColor: "#FF647C",
                });
                return false;
              }
            } catch {
              // Fallback to local
            }
          }

          setProgress((current) => {
            const curCoins = current.coins ?? 0;
            if (cost > 0 && curCoins < cost) return current;
            let next = { ...current, coins: Math.max(0, curCoins - cost) };
            if (kind === "avatar") {
              next = {
                ...next,
                selectedAvatar: id as PlayerProgress["selectedAvatar"],
                purchasedAvatars: { ...(next.purchasedAvatars ?? {}), [id]: true },
              };
            } else if (kind === "frame") {
              next = { ...next, selectedFrame: id, ownedFrames: { ...(next.ownedFrames ?? {}), [id]: true } };
            } else if (kind === "board") {
              next = {
                ...next,
                selectedBoardSkin: id,
                ownedBoardSkins: { ...(next.ownedBoardSkins ?? {}), [id]: true },
              };
            } else {
              next = {
                ...next,
                selectedVictoryEffect: id,
                ownedVictoryEffects: { ...(next.ownedVictoryEffects ?? {}), [id]: true },
              };
            }
            void syncProgressToCloud(next);
            return next;
          });
          setGlobalToast({
            id: `buy-${Date.now()}`,
            title: "KOZMETİK KAZANILDI",
            subtitle: "Yeni ürün envanterine eklendi ve kuşanıldı!",
            icon: "🎉",
            accentColor: "#3EE8B5",
          });
          return true;
        }}
        onBack={() => onNavigate("home")}
      />
    </MainShell>
  );
}
