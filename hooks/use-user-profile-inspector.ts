import { useState, useCallback } from "react";
import type { InspectableUser } from "../components/user-profile-modal";
import { getApiBaseUrl } from "../constants/oauth";

export function useUserProfileInspector() {
  const [inspectedUser, setInspectedUser] = useState<InspectableUser | null>(null);

  const openUserProfile = useCallback(async (target: Partial<InspectableUser> & { id: string; name: string }) => {
    // Önce eldeki hazır bilgileri anında göster
    const base: InspectableUser = {
      id: target.id,
      name: target.name,
      username: target.username || target.name,
      isBot: target.isBot ?? target.id.startsWith("bot:"),
      avatar: target.avatar,
      avatarPhoto: target.avatarPhoto,
      selectedTitle: target.selectedTitle || "[ÇAYLAK]",
      selectedFrame: target.selectedFrame || "signal",
      level: target.level || 1,
      tier: target.tier || "DEMİR",
      lp: target.lp ?? 0,
      wins: target.wins ?? 0,
      matches: target.matches ?? 0,
      streak: target.streak ?? 0,
      bestScore: target.bestScore ?? 0,
      bestTempo: target.bestTempo ?? 0,
      xp: target.xp ?? 0,
      historyCount: target.historyCount ?? (target.matches ? target.matches * 3 : 0),
    };
    setInspectedUser(base);

    // Eğer bot değilse sunucudan en güncel detayları arka planda çek
    if (!base.isBot) {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/user/profile/${encodeURIComponent(target.id || target.name)}`);
        if (res.ok) {
          const fresh = await res.json();
          setInspectedUser((current) => (current && current.id === target.id ? { ...current, ...fresh } : current));
        }
      } catch {
        // Çevrimdışı veya hata durumunda base bilgiler görünmeye devam eder
      }
    }
  }, []);

  return {
    inspectedUser,
    setInspectedUser,
    openUserProfile,
  };
}
