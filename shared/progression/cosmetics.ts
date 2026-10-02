import { getPlayerLevel } from "../level-curves";
import { AvatarId, PlayerProgress, CYBER_TITLES } from "./progression.types";

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

export function getActiveCyberTitle(progress: PlayerProgress): string {
  const available = CYBER_TITLES.filter((t) => t.unlocked(progress));
  if (progress.selectedTitle && available.some((t) => t.badge === progress.selectedTitle)) {
    return progress.selectedTitle;
  }
  return available.at(-1)?.badge || "[ÇAYLAK]";
}
