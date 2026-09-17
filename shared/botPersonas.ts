import { getLeagueTier, CYBER_TITLES } from "./progression";
import type { GamePlayer } from "./game";

export const BOT_USERNAMES = [
  "SiberKaptan",
  "Zeynep_99",
  "CyberBerk",
  "KelimeAvcısı",
  "MelisWord",
  "NeonGamer34",
  "EfeTeknoloji",
  "HarfUstası",
  "Selin_Pro",
  "Mert_Cyber",
  "VipGamer06",
  "GeceKuşu",
  "KuantumKelime",
  "Buse_Cyber",
  "MatrixOyuncu",
  "DerinKelime",
  "Kaan_Vip",
  "AlfaBulmaca",
  "PixelKraliçe",
  "TaktikMaster",
] as const;

export const BOT_AVATARS = [
  "🤖", "👾", "⚡", "🔥", "🔮", "👑", "🛡️", "🎯", "🚀", "💻", "🕶️", "🌟"
] as const;

export function getRandomBotPersona(hostPlayer?: Partial<GamePlayer>): GamePlayer {
  const nameIndex = Math.floor(Math.random() * BOT_USERNAMES.length);
  const name = BOT_USERNAMES[nameIndex] || "SiberKaptan";
  
  const hostLp = hostPlayer?.lp ?? 100;
  // Match player LP with a +/- 120 range, minimum 0
  const lpOffset = Math.floor(Math.random() * 240) - 120;
  const lp = Math.max(0, hostLp + lpOffset);
  const tier = getLeagueTier(lp).name;

  const hostLevel = hostPlayer?.level ?? 15;
  const levelOffset = Math.floor(Math.random() * 10) - 5;
  const level = Math.max(1, hostLevel + levelOffset);

  const avatar = BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)] || "🤖";
  
  // Pick a title from CYBER_TITLES array or default
  const titleObj = CYBER_TITLES[Math.floor(Math.random() * CYBER_TITLES.length)];
  const selectedTitle = titleObj ? titleObj.badge : "[ÇAYLAK]";

  const matches = Math.floor(20 + Math.random() * 180);
  const winRate = 0.48 + Math.random() * 0.22; // 48% to 70% win rate
  const wins = Math.floor(matches * winRate);
  const streak = Math.floor(Math.random() * 5);

  return {
    id: `bot:${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    isBot: true,
    connected: true,
    ready: true,
    rematch: false,
    avatar,
    selectedTitle,
    level,
    tier,
    lp,
    wins,
    matches,
    streak,
    bestScore: Math.floor(180 + Math.random() * 320),
    bestTempo: Math.floor(15 + Math.random() * 25),
  };
}
