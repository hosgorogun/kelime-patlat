export type ChipEquipmentItem = {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  rewardType: "radar" | "shield" | "xp" | "lives";
};

export const CHIP_EQUIPMENT_ITEMS: ChipEquipmentItem[] = [
  {
    id: "lives_refill",
    name: "5x Tam Can Doldurma",
    description: "Can sayacını anında yeniler ve 5/5 tam hakka ulaştırır.",
    cost: 50,
    icon: "💚",
    rewardType: "lives",
  },
  {
    id: "radar_5",
    name: "5x Radar Şifre Çözücü",
    description: "Tüm solo ve günlük oyunlarda kelimelerin baş/son harflerini aydınlatır.",
    cost: 75,
    icon: "👁",
    rewardType: "radar",
  },
  {
    id: "shield_1",
    name: "Seri Kalkanı",
    description: "Bir gün oyuna giremesen bile günlük serini (streak) korur.",
    cost: 120,
    icon: "🛡️",
    rewardType: "shield",
  },
  {
    id: "xp_250",
    name: "Kozmik XP Kapsülü (+250 XP)",
    description: "Sezon sıralamasında anında yükselmeni sağlayan saf XP paketi.",
    cost: 150,
    icon: "⚡",
    rewardType: "xp",
  },
];

export const PROFILE_FRAMES = [
  ["signal", "SİNYAL", "#00F5D4", 0],
  ["neon", "NEON MOR", "#A78BFA", 140],
  ["chrome", "KROM GÜMÜŞ", "#CBD5E1", 220],
  ["gold", "ALTIN KRAL", "#FFC24A", 350],
  ["cyber", "SİBERPUNK", "#FF2A85", 500],
] as const;

export const VICTORY_EFFECTS = [
  ["pulse", "PULSE", "🌊", 0],
  ["glitch", "GLITCH", "💻", 160],
  ["flare", "FLARE", "💥", 240],
  ["lightning", "ŞİMŞEK", "⚡", 380],
  ["fireworks", "KUTLAMA", "🎆", 450],
] as const;

export const BOARD_SKINS = [
  ["grid", "MATRİS", "#00F5D4", 0],
  ["night", "GECE SİNYALİ", "#818CF8", 120],
  ["ember", "KOR HATTI", "#FB7185", 180],
  ["gold_grid", "ALTIN IZGARA", "#FFC24A", 300],
  ["cyber_pink", "NEON PEMBE", "#FF2A85", 420],
] as const;
