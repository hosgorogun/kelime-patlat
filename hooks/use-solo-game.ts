import { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  applyMatchProgress,
  completeDailyProgress,
  deductLife,
  getCalculatedLives,
  MAX_LIVES,
  type DailyChallenge,
  type MatchHistoryEntry,
  type PlayerProgress,
} from "../shared/progression";
import { MAX_SOLO_LEVEL } from "../shared/solo";
import { monetizationManager } from "../shared/monetization";
import type { ToastData } from "../components/common/global-game-toast";
import { SOLO_UNLOCK_KEY } from "./use-player-progression";

export interface UseSoloGameParams {
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  soloUnlockedLevel: number;
  setSoloUnlockedLevel: (level: number) => void;
  daily: DailyChallenge;
  setScreen: (screen: any) => void;
  setGlobalToast: (toast: ToastData | null) => void;
  setShowLivesModal: (show: boolean) => void;
  syncProgressToCloud: (progress: PlayerProgress) => Promise<void>;
  awardProgressOnServer: (
    award: any,
    fallback?: (current: PlayerProgress) => PlayerProgress
  ) => Promise<void>;
}

export function useSoloGame({
  progress,
  setProgress,
  soloUnlockedLevel,
  setSoloUnlockedLevel,
  daily,
  setScreen,
  setGlobalToast,
  setShowLivesModal,
  syncProgressToCloud,
  awardProgressOnServer,
}: UseSoloGameParams) {
  const [soloLevel, setSoloLevel] = useState(1);
  const [dailySession, setDailySession] = useState<DailyChallenge | null>(null);
  const [recentSoloWords, setRecentSoloWords] = useState<string[]>([]);

  const openSoloLevel = useCallback(
    (level: number) => {
      const calc = getCalculatedLives(progress);
      if (calc.lives <= 0) {
        setGlobalToast({
          id: `no-lives-${Date.now()}`,
          title: "CANIN KALMADI! 💔",
          subtitle: "Solo moda girmek için en az 1 Can gereklidir. Bekleyebilir veya Can satın alabilirsin.",
          icon: "💚",
          accentColor: "#EF4444",
        });
        setShowLivesModal(true);
        return;
      }
      setDailySession(null);
      setSoloLevel(Math.min(level, MAX_SOLO_LEVEL));
      setScreen("solo");
    },
    [progress, setGlobalToast, setShowLivesModal, setScreen]
  );

  const completeSoloLevel = useCallback(
    (level: number, foundWords: string[] = [], won = true) => {
      if (!won) {
        const soloLossItem: MatchHistoryEntry = {
          id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          mode: "solo",
          won: false,
          myScore: Math.max(10, (foundWords || []).length * 10),
          wordsCount: (foundWords || []).length,
          date: Date.now(),
        };
        setProgress((curr) => {
          const withLoss = {
            ...curr,
            matchHistory: [soloLossItem, ...(curr.matchHistory || [])].slice(0, 50),
          };
          const updated = deductLife(withLoss);
          void syncProgressToCloud(updated);
          const calc = getCalculatedLives(updated);
          if (calc.lives <= 0) {
            setGlobalToast({
              id: `life-lost-${Date.now()}`,
              title: "CAN KAYBEDİLDİ 💔",
              subtitle: "Son canını tükettin! Canların 30 dakikada bir otomatik dolar veya çiple yenileyebilirsin.",
              icon: "💔",
              accentColor: "#EF4444",
            });
            setShowLivesModal(true);
          } else {
            setGlobalToast({
              id: `life-deducted-${Date.now()}`,
              title: "1 CAN KAYBEDİLDİ 💔",
              subtitle: `Kalan Can: ${calc.lives}/${MAX_LIVES}`,
              icon: "💔",
              accentColor: "#EF4444",
            });
          }
          return updated;
        });
        return;
      }

      if (foundWords && foundWords.length > 0) {
        setRecentSoloWords((prev) => Array.from(new Set([...foundWords, ...prev])).slice(0, 80));
      }
      const next = Math.min(MAX_SOLO_LEVEL + 1, Math.max(soloUnlockedLevel, level + 1));
      setSoloUnlockedLevel(next);
      AsyncStorage.setItem(SOLO_UNLOCK_KEY, String(next)).catch(() => undefined);
      setProgress((curr) => {
        const localProgress = applyMatchProgress(
          curr,
          { score: level * 14, tempo: Math.max(1, level / 2), won: true, longWord: level >= 5, foundWords },
          "solo"
        );
        const updated = {
          ...localProgress,
          soloUnlockedLevel: next,
        };
        void syncProgressToCloud(updated);
        return updated;
      });
      void awardProgressOnServer(
        { kind: "solo", level, foundWords },
        (current) => ({
          ...applyMatchProgress(
            current,
            { score: level * 14, tempo: Math.max(1, level / 2), won: true, longWord: level >= 5, foundWords },
            "solo"
          ),
          soloUnlockedLevel: Math.min(MAX_SOLO_LEVEL + 1, Math.max(current.soloUnlockedLevel ?? 1, next)),
        })
      );
      const { shouldShowInterstitial } = monetizationManager.recordMatchFinished(true);
      if (shouldShowInterstitial) {
        void monetizationManager.showInterstitialAd();
      }
    },
    [
      soloUnlockedLevel,
      setSoloUnlockedLevel,
      setProgress,
      syncProgressToCloud,
      setGlobalToast,
      setShowLivesModal,
      awardProgressOnServer,
    ]
  );

  const completeDailyChallenge = useCallback(
    (level: number, foundWords: string[] = [], won = true) => {
      if (won) {
        const dailyScore = Math.max(level * 14, (foundWords || []).length * 15, daily.targetScore || 100);
        setProgress((current) => {
          const updated = completeDailyProgress(current, daily, dailyScore, (foundWords || []).length, foundWords);
          const withWords = {
            ...updated,
            history: Array.from(new Set([...(updated.history || []), ...(foundWords || [])])).slice(-150),
          };
          void syncProgressToCloud(withWords);
          return withWords;
        });
        void awardProgressOnServer({
          kind: "solo",
          level,
          foundWords,
          daily: true,
          score: dailyScore,
          dailyId: daily.id,
        });
      } else {
        const dailyLossItem: MatchHistoryEntry = {
          id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          mode: "daily",
          won: false,
          myScore: Math.max(10, (foundWords || []).length * 10),
          wordsCount: (foundWords || []).length,
          date: Date.now(),
        };
        setProgress((current) => {
          const availableShields = current.streakShields || 0;
          if (availableShields >= 1) {
            setGlobalToast({
              id: `shield-used-${Date.now()}`,
              title: "🛡️ SERİ KALKANI KULLANILDI!",
              subtitle: "Günlük rotayı tamamlayamadın ancak 1 Seri Kalkanın harcanarak galibiyet serin korundu!",
              icon: "🛡️",
              accentColor: "#E8C36A",
            });
            const updated = {
              ...current,
              dailyCompletedId: daily.id,
              streakShields: availableShields - 1,
              lastStreakCheckDate: daily.id,
              matchHistory: [dailyLossItem, ...(current.matchHistory || [])].slice(0, 50),
            };
            void syncProgressToCloud(updated);
            return updated;
          }
          const updated = {
            ...current,
            dailyCompletedId: daily.id,
            streak: 0,
            lastStreakCheckDate: daily.id,
            matchHistory: [dailyLossItem, ...(current.matchHistory || [])].slice(0, 50),
          };
          void syncProgressToCloud(updated);
          return updated;
        });
      }
    },
    [daily, setProgress, awardProgressOnServer, setGlobalToast, syncProgressToCloud]
  );

  return {
    soloLevel,
    setSoloLevel,
    dailySession,
    setDailySession,
    recentSoloWords,
    openSoloLevel,
    completeSoloLevel,
    completeDailyChallenge,
  };
}
