import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { MainShell } from "../shell/main-shell";
import { CyberStore } from "./cyber-store";
import { SESSION_TOKEN_KEY, getApiBaseUrl } from "../../constants/oauth";
import { getCalculatedLives, MAX_LIVES, type PlayerProgress } from "../../shared/progression";
import type { ToastData } from "../common/global-game-toast";

import { useProgression, useNavigation, useUIFeedback } from "@/context";

export interface CyberStoreScreenContainerProps {
  progress?: PlayerProgress;
  progressRef?: React.RefObject<PlayerProgress>;
  setProgress?: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud?: (next: PlayerProgress) => Promise<void>;
  unclaimedMissions?: number;
  hasClaimableDailyReward?: boolean;
  setGlobalToast?: (toast: ToastData | null) => void;
  onNavigate?: (destination: any) => void;
  onClaimDailyReward?: () => void;
}

export function CyberStoreScreenContainer(props: CyberStoreScreenContainerProps) {
  const progression = useProgression();
  const navigation = useNavigation();
  const uiFeedback = useUIFeedback();

  const progress = props.progress ?? progression.progress;
  const progressRef = props.progressRef ?? progression.progressRef;
  const setProgress = props.setProgress ?? progression.setProgress;
  const syncProgressToCloud = props.syncProgressToCloud ?? progression.syncProgressToCloud;
  const unclaimedMissions = props.unclaimedMissions ?? progression.unclaimedMissions;
  const hasClaimableDailyReward = props.hasClaimableDailyReward ?? progression.hasClaimableDailyReward;
  const setGlobalToast = props.setGlobalToast ?? uiFeedback.setGlobalToast;
  const onNavigate = props.onNavigate ?? navigation.setScreen;
  const onClaimDailyReward = props.onClaimDailyReward ?? uiFeedback.handleClaimDailyReward;
  return (
    <MainShell
      active="store"
      onNavigate={onNavigate}
      missionsBadgeCount={unclaimedMissions}
      storeBadgeCount={hasClaimableDailyReward ? 1 : undefined}
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
            if (calc.isInfinite) {
              setGlobalToast({
                id: `lives-infinite-${Date.now()}`,
                title: "SONSUZ CAN AKTİF! ⚡",
                subtitle: "Şu an zaten sınırsız can süreniz devam ediyor. Çipleriniz korunuyor.",
                icon: "⚡",
                accentColor: "#F59E0B",
              });
              return false;
            }
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
        onSelectTitle={(selectedTitle) => {
          setProgress((current) => {
            const next = { ...current, selectedTitle };
            void syncProgressToCloud(next);
            return next;
          });
          setGlobalToast({
            id: `title-${Date.now()}`,
            title: "UNVAN KUŞANILDI",
            subtitle: `${selectedTitle} unvanı aktif edildi.`,
            icon: "👑",
            accentColor: "#FFC24A",
          });
        }}
        onOpenMysteryChest={async () => {
          const currentCoins = progressRef.current.coins ?? 0;
          if (currentCoins < 100) {
            setGlobalToast({
              id: `chest-err-${Date.now()}`,
              title: "YETERSİZ ÇİP",
              subtitle: "Gizemli Sandık için 100 altın çip gerekiyor.",
              icon: "⚠️",
              accentColor: "#FF647C",
            });
            return null;
          }

          const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
          if (token && token !== "guest") {
            try {
              const res = await fetch(`${getApiBaseUrl()}/api/game/mystery-chest`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (res.ok && data.progress && data.reward) {
                setProgress(data.progress);
                return data.reward;
              } else if (res.status === 400) {
                setGlobalToast({
                  id: `chest-err-${Date.now()}`,
                  title: "AÇILAMADI",
                  subtitle: data.error || "Sandık açılamadı.",
                  icon: "⚠️",
                  accentColor: "#FF647C",
                });
                return null;
              }
            } catch {
              // Fallback to local
            }
          }

          // Local fallback (offline or guest)
          const pool: {
            type: "coins" | "lives" | "radar" | "shield" | "title";
            weight: number;
            val: number | string;
            label: string;
            icon: string;
            category: "consolation" | "common" | "rare" | "jackpot";
            detail?: string;
          }[] = [
            { type: "coins", weight: 20, val: 15, label: "15 Teselli Çipi 🪙", icon: "🪙", category: "consolation", detail: "Sandıktan 15 çip teselli ödülü çıktı." },
            { type: "coins", weight: 15, val: 25, label: "25 Teselli Çipi 🪙", icon: "🪙", category: "consolation", detail: "Sandıktan 25 çip teselli ödülü çıktı." },
            { type: "lives", weight: 15, val: 1, label: "1x Can Takviyesi 💚", icon: "💚", category: "common", detail: "1 canın anında yenilendi!" },
            { type: "radar", weight: 15, val: 1, label: "1x Radar Şifresi 👁", icon: "👁", category: "common", detail: "1 adet radar ipucu envanterine eklendi." },
            { type: "coins", weight: 15, val: 50, label: "50 Çip İadesi 🪙", icon: "🪙", category: "consolation", detail: "Sandık maliyetinin yarısı (50 çip) iade edildi." },
            { type: "shield", weight: 8, val: 1, label: "1x Seri Kalkanı! 🛡️", icon: "🛡️", category: "rare", detail: "Galibiyet serilerini yenilgilere karşı korur." },
            { type: "radar", weight: 6, val: 5, label: "5x Büyük Radar Paketi! 👁", icon: "👁", category: "rare", detail: "5 adet radar ipucu envanterine eklendi." },
            { type: "title", weight: 4, val: "speedster", label: "[HIZLI PARMAK] Unvanı! ⚡", icon: "⚡", category: "rare", detail: "Nadir mağaza unvanı profilinize tanımlandı." },
            { type: "coins", weight: 2, val: 250, label: "250 ÇİP BÜYÜK İKRAMİYE! 🏆", icon: "👑", category: "jackpot", detail: "Büyük ikramiyeyi vurdun! 250 altın çip hesabına yüklendi." },
          ];

          const totalWeight = pool.reduce((acc, it) => acc + it.weight, 0);
          let randomVal = Math.random() * totalWeight;
          let picked = pool[0]!;
          for (const item of pool) {
            if (randomVal < item.weight) {
              picked = item;
              break;
            }
            randomVal -= item.weight;
          }

          setProgress((current) => {
            let nextCoins = (current.coins ?? 0) - 100;
            let next = { ...current, coins: nextCoins };
            if (picked.type === "coins") {
              next.coins = (next.coins ?? 0) + (picked.val as number);
            } else if (picked.type === "lives") {
              const calc = getCalculatedLives(current);
              if (!calc.isInfinite) {
                next.lives = Math.min(99, calc.lives + (picked.val as number));
                next.lastLifeRegenTimestamp = Date.now();
              }
            } else if (picked.type === "radar") {
              next.radarChargesBonus = (current.radarChargesBonus || 0) + (picked.val as number);
            } else if (picked.type === "shield") {
              next.streakShields = (current.streakShields || 0) + (picked.val as number);
            } else if (picked.type === "title") {
              next.selectedTitle = "[HIZLI PARMAK]";
              next.ownedTitles = { ...(current.ownedTitles ?? {}), [picked.val as string]: true };
            }
            void syncProgressToCloud(next);
            return next;
          });

          return {
            type: picked.type,
            label: picked.label,
            icon: picked.icon,
            category: picked.category,
            detail: picked.detail,
          };
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
            } else if (kind === "title") {
              next = {
                ...next,
                selectedTitle: id,
                ownedTitles: { ...(next.ownedTitles ?? {}), [id]: true },
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
