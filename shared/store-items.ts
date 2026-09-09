// Mağaza ekipman ürünleri — React Native bağımlılığı olmayan saf veri katmanı

export type ChipEquipmentItem = {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  rewardType: "radar" | "shield" | "xp" | "avatar";
};

export const CHIP_EQUIPMENT_ITEMS: ChipEquipmentItem[] = [
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
