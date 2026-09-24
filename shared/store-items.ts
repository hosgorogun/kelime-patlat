export type ChipEquipmentItem = {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  imageKey?: string;
  rewardType: "radar" | "shield" | "xp" | "lives";
};

const safeRequire = (path: string) => {
  try {
    // Standard Node/Metro require check
    const r = typeof require !== "undefined" ? require : null;
    return r ? r(path) : null;
  } catch {
    return null;
  }
};

export const STORE_ASSETS: Record<string, any> = {
  lives: safeRequire("../assets/store-assets/lives.jpg"),
  radar: safeRequire("../assets/store-assets/radar.jpg"),
  shield: safeRequire("../assets/store-assets/shield.jpg"),
  xp: safeRequire("../assets/store-assets/xp.jpg"),
  effect_pulse: safeRequire("../assets/store-assets/effect_pulse.jpg"),
  effect_glitch: safeRequire("../assets/store-assets/effect_glitch.jpg"),
  effect_flare: safeRequire("../assets/store-assets/effect_flare.jpg"),
  effect_lightning: safeRequire("../assets/store-assets/effect_lightning.jpg"),
  effect_fireworks: safeRequire("../assets/store-assets/effect_fireworks.jpg"),
  skin_grid: safeRequire("../assets/store-assets/skin_grid.jpg"),
  skin_night: safeRequire("../assets/store-assets/skin_night.jpg"),
  skin_ember: safeRequire("../assets/store-assets/skin_ember.jpg"),
  skin_gold_grid: safeRequire("../assets/store-assets/skin_gold_grid.jpg"),
};

export const CHIP_EQUIPMENT_ITEMS: ChipEquipmentItem[] = [
  {
    id: "lives_refill",
    name: "5x Tam Can Doldurma",
    description: "Can sayacını anında yeniler ve 5/5 tam hakka ulaştırır.",
    cost: 75,
    icon: "💚",
    imageKey: "lives",
    rewardType: "lives",
  },
  {
    id: "radar_5",
    name: "5x Radar Şifre Çözücü",
    description: "Tüm solo ve günlük oyunlarda kelimelerin baş/son harflerini aydınlatır.",
    cost: 75,
    icon: "👁",
    imageKey: "radar",
    rewardType: "radar",
  },
  {
    id: "shield_1",
    name: "Seri Kalkanı",
    description: "Bir gün oyuna giremesen bile günlük serini (streak) korur.",
    cost: 120,
    icon: "🛡️",
    imageKey: "shield",
    rewardType: "shield",
  },
  {
    id: "xp_250",
    name: "Kozmik XP Kapsülü (+250 XP)",
    description: "Sezon sıralamasında anında yükselmeni sağlayan saf XP paketi.",
    cost: 150,
    icon: "⚡",
    imageKey: "xp",
    rewardType: "xp",
  },
];

export const PROFILE_FRAMES = [
  ["signal", "SİNYAL", "#3EE8B5", 0],
  ["neon", "NEON MOR", "#A78BFA", 140],
  ["chrome", "KROM GÜMÜŞ", "#CBD5E1", 220],
  ["gold", "ALTIN KRAL", "#FFC24A", 350],
  ["cyber", "SİBERPUNK", "#FF2A85", 500],
] as const;

export const VICTORY_EFFECTS = [
  ["pulse", "PULSE", "🌊", 0, "effect_pulse"],
  ["glitch", "GLITCH", "💻", 160, "effect_glitch"],
  ["flare", "FLARE", "💥", 240, "effect_flare"],
  ["lightning", "ŞİMŞEK", "⚡", 380, "effect_lightning"],
  ["fireworks", "KUTLAMA", "🎆", 450, "effect_fireworks"],
] as const;

export const BOARD_SKINS = [
  ["grid", "MATRİS", "#3EE8B5", 0, "skin_grid"],
  ["night", "GECE SİNYALİ", "#818CF8", 120, "skin_night"],
  ["ember", "KOR HATTI", "#FB7185", 180, "skin_ember"],
  ["gold_grid", "ALTIN IZGARA", "#FFC24A", 300, "skin_gold_grid"],
  ["cyber_pink", "NEON PEMBE", "#FF2A85", 420, "skin_grid"],
] as const;
