/**
 * Kelime Kartları & Tematik Albümler (Lügat Koleksiyoncusu)
 * Monopoly Go / Coin Master tarzı kart tamamlama mekaniği.
 */

export type CardRarity = "common" | "rare" | "epic" | "legendary";

export type WordCard = {
  id: string;
  setId: string;
  name: string;
  meaning: string;
  rarity: CardRarity;
  stars: number;
};

export type WordCardSet = {
  id: string;
  title: string;
  icon: string;
  description: string;
  rewardChips: number;
  rewardFrame?: string;
  rewardTitle?: string;
  cards: WordCard[];
};

export const WORD_CARD_ALBUMS: WordCardSet[] = [
  {
    id: "eski_turkce",
    title: "Eski Türkçe Nadir Sözler",
    icon: "📜",
    description: "Geçmişin zarafetini taşıyan unutulmaz kelimeler.",
    rewardChips: 500,
    rewardFrame: "gold",
    rewardTitle: "LÜGAT HÂKİMİ",
    cards: [
      { id: "et_1", setId: "eski_turkce", name: "Letafet", meaning: "Güzellik, hoşluk, incelik", rarity: "common", stars: 1 },
      { id: "et_2", setId: "eski_turkce", name: "Safderun", meaning: "İçi temiz, art niyetsiz, saf kalpli", rarity: "common", stars: 1 },
      { id: "et_3", setId: "eski_turkce", name: "Müşkülpesent", meaning: "Zor beğenen, titiz", rarity: "rare", stars: 2 },
      { id: "et_4", setId: "eski_turkce", name: "Şikemperver", meaning: "Yemek yemeyi çok seven, boğazına düşkün", rarity: "rare", stars: 2 },
      { id: "et_5", setId: "eski_turkce", name: "Mütebessim", meaning: "Gülümseyen, tebessüm eden", rarity: "epic", stars: 3 },
      { id: "et_6", setId: "eski_turkce", name: "Hissikablelvuku", meaning: "Bir şeyi olmadan önce hissetme, önsezi", rarity: "legendary", stars: 4 },
    ],
  },
  {
    id: "dogadaki_mucizeler",
    title: "Doğadaki Gizemler",
    icon: "🌿",
    description: "Doğanın en büyüleyici manzaraları ve terimleri.",
    rewardChips: 400,
    rewardFrame: "cyber",
    rewardTitle: "DOĞA BİLGESİ",
    cards: [
      { id: "dm_1", setId: "dogadaki_mucizeler", name: "Yakamoz", meaning: "Denizde ışık saçan canlıların oluşturduğu parıltı", rarity: "common", stars: 1 },
      { id: "dm_2", setId: "dogadaki_mucizeler", name: "Petrikor", meaning: "Yağmurdan sonraki toprak kokusu", rarity: "common", stars: 1 },
      { id: "dm_3", setId: "dogadaki_mucizeler", name: "Serap", meaning: "Çölde görülen ışık yanılsaması", rarity: "rare", stars: 2 },
      { id: "dm_4", setId: "dogadaki_mucizeler", name: "Bora", meaning: "Fırtınalı ve sert esen rüzgar", rarity: "rare", stars: 2 },
      { id: "dm_5", setId: "dogadaki_mucizeler", name: "Şafak", meaning: "Güneş doğmadan önceki kırmızılık", rarity: "epic", stars: 3 },
      { id: "dm_6", setId: "dogadaki_mucizeler", name: "Kutup Işığı", meaning: "Kuzey göklerinde dans eden manyetik ışıma", rarity: "legendary", stars: 4 },
    ],
  },
  {
    id: "gokyuzu_ve_uzay",
    title: "Kozmik Ufuklar",
    icon: "🪐",
    description: "Yıldızların ve evrenin derinliklerindeki kelimeler.",
    rewardChips: 600,
    rewardFrame: "aurora",
    rewardTitle: "KOZMİK KÂŞİF",
    cards: [
      { id: "gu_1", setId: "gokyuzu_ve_uzay", name: "Nebula", meaning: "Uzaydaki devasa gaz ve toz bulutu", rarity: "common", stars: 1 },
      { id: "gu_2", setId: "gokyuzu_ve_uzay", name: "Kuyruklu Yıldız", meaning: "Buz ve tozdan oluşan göktaşı", rarity: "common", stars: 1 },
      { id: "gu_3", setId: "gokyuzu_ve_uzay", name: "Güneş Patlaması", meaning: "Güneş yüzeyindeki devasa enerji çıkışı", rarity: "rare", stars: 2 },
      { id: "gu_4", setId: "gokyuzu_ve_uzay", name: "Süpernova", meaning: "Büyük bir yıldızın patlaması", rarity: "rare", stars: 2 },
      { id: "gu_5", setId: "gokyuzu_ve_uzay", name: "Karadelik", meaning: "Işığın bile kaçamadığı çekim alanı", rarity: "epic", stars: 3 },
      { id: "gu_6", setId: "gokyuzu_ve_uzay", name: "Işık Yılı", meaning: "Işığın bir yılda aldığı kozmik mesafe", rarity: "legendary", stars: 4 },
    ],
  },
];

export function openCardPack(packType: "standard" | "gold" | "mythic", random = Math.random): WordCard[] {
  const allCards = WORD_CARD_ALBUMS.flatMap((set) => set.cards);
  const cardCount = packType === "mythic" ? 4 : packType === "gold" ? 3 : 2;
  const drawn: WordCard[] = [];

  for (let i = 0; i < cardCount; i++) {
    const roll = random();
    let targetRarity: CardRarity = "common";
    if (packType === "mythic") {
      targetRarity = roll < 0.35 ? "legendary" : roll < 0.7 ? "epic" : "rare";
    } else if (packType === "gold") {
      targetRarity = roll < 0.15 ? "legendary" : roll < 0.5 ? "epic" : "rare";
    } else {
      targetRarity = roll < 0.05 ? "epic" : roll < 0.3 ? "rare" : "common";
    }

    const matching = allCards.filter((c) => c.rarity === targetRarity);
    const pool = matching.length > 0 ? matching : allCards;
    const picked = pool[Math.floor(random() * pool.length)]!;
    drawn.push(picked);
  }

  return drawn;
}

export function checkSetCompleted(setId: string, ownedCardIds: string[]): boolean {
  const set = WORD_CARD_ALBUMS.find((s) => s.id === setId);
  if (!set) return false;
  const ownedSet = new Set(ownedCardIds);
  return set.cards.every((c) => ownedSet.has(c.id));
}
