import { getPlayerLevel } from "../level-curves";
import { AvatarId, PlayerProgress, CYBER_TITLES, AVATARS } from "./progression.types";
import { isEqualTr } from "../tr-utils";

export function isAvatarUnlocked(avatarId: AvatarId, progress: PlayerProgress): boolean {
  if (progress.purchasedAvatars?.[avatarId]) return true;
  if (progress.selectedAvatar === avatarId) return true;
  const currentLevel = getPlayerLevel(progress.xp);
  if (avatarId === "spark") return true;
  if (avatarId === "orbit") return currentLevel >= 3;
  if (avatarId === "sage") return currentLevel >= 6;
  if (avatarId === "comet") return (progress.bestArcadeScore || 0) >= 400;
  if (avatarId === "ember") return progress.streak >= 5;
  return true;
}

export function isTitleAvailable(title: (typeof CYBER_TITLES)[number], progress: PlayerProgress): boolean {
  if (progress.ownedTitles?.[title.id]) return true;
  return title.unlocked(progress);
}

export function getActiveCyberTitle(progress: PlayerProgress): string {
  const available = CYBER_TITLES.filter((t) => isTitleAvailable(t, progress));
  if (progress.selectedTitle && available.some((t) => t.badge === progress.selectedTitle)) {
    return progress.selectedTitle;
  }
  return available.at(-1)?.badge || "[ÇAYLAK]";
}

export function getActiveCyberTitleObject(progress: PlayerProgress): (typeof CYBER_TITLES)[number] {
  const available = CYBER_TITLES.filter((t) => isTitleAvailable(t, progress));
  if (progress.selectedTitle) {
    const found = available.find((t) => t.badge === progress.selectedTitle);
    if (found) return found;
  }
  return available.at(-1) || CYBER_TITLES[0]!;
}

export function resolveAvatarDisplay(avatar?: string | null): string {
  if (!avatar || !avatar.trim()) return "✦";
  const trimmed = avatar.trim();
  const matched = AVATARS.find((a) => isEqualTr(a.id, trimmed));
  if (matched) return matched.icon;
  // If it's a short string (like emoji or symbol <= 2 chars), return it as is
  if (trimmed.length <= 2) return trimmed;
  // Default fallback for any unrecognised long string identifier
  return "✦";
}

