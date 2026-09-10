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
