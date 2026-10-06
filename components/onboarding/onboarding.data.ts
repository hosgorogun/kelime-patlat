import { GuideSection } from "./onboarding.types";

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    key: "basics",
    tabLabel: "Oynanış",
    badge: "TEMEL MEKANİK & KURALLAR",
    title: "Harf Bağlama ve Rota Çizimi",
    icon: "⚡",
    color: "#2a9c7a",
    description: "Kelime Patlat'ta kelimeler parmağını harfler üzerinde sürükleyerek bulunur.",
    customVisual: "route",
    blocks: [
      {
        title: "Sürükleyerek Bağla 🔗",
        details: [
          "Parmağını ilk harfin üzerine basılı tut ve elini kaldırmadan komşu harflere doğru sürükle.",
          "Kelimenin son harfine ulaştığında parmağını kaldır; kelime geçerliyse anında patlar ve puan kazandırır.",
        ],
        tag: "TEMEL",
        tagColor: "#3EE8B5",
      },
      {
        title: "Sadece 90° Dik ve Yatay Hareket 📐",
        details: [
          "Harfler yalnızca yukarı, aşağı, sağa ve sola bağlanabilir.",
          "⚠️ Çapraz (diyagonal) bağlantılar kesinlikle yasaktır ve geçersiz sayılır.",
        ],
        tag: "KURAL",
        tagColor: "#FF647C",
      },
      {
        title: "Kıvrılan Rotalar & Geri Alma ↺",
        details: [
          "Kelimeler düz bir çizgide olmak zorunda değildir; S, L, U veya zikzak şeklinde kıvrılabilir.",
          "Yanlış harfe kaydıysan parmağını kaldırmadan bir önceki harfe geri kaydırarak seçimi geri alabilirsin.",
        ],
      },
      {
        title: "%100 Tahta Kapsamı (0 Boş Kutu) 🎯",
        details: [
          "Tahtadaki tüm harfler bir kelimenin parçasıdır! Çözülmemiş hiçbir harf boşta kalmaz.",
        ],
        tag: "GARANTİ",
        tagColor: "#FFC24A",
      },
    ],
  },
  {
    key: "modes",
    tabLabel: "Modlar",
    badge: "ARENA & SEVİYE SİSTEMİ",
    title: "Oyun Modları ve Kuralları",
    icon: "🗺️",
    color: "#8c763b",
    description: "Farklı ızgara boyutlarında ve oyun türlerinde yarışarak ustalığını kanıtla.",
    customVisual: "modes",
    blocks: [
      {
        title: "Canlı Online Düello (PvP & Bot) ⚔️",
        details: [
          "4×4 Matris: 16 harf, 60 saniye süre. Hızlı refleksler ve seri kelime avı.",
          "6×6 Matris: 36 harf, 75 saniye süre. Orta uzunlukta kelimeler ve taktiksel rota derinliği.",
          "8×8 Matris: 64 harf, 95 saniye süre. Seviye 8'de açılan geniş strateji tahtası.",
          "10×10 Matris: 100 harf, 125 saniye süre. Seviye 10'da açılan devasa ustalık alanı.",
        ],
        tag: "DÜELLO",
        tagColor: "#D4B45A",
      },
      {
        title: "Solo Seviye Yolculuğu (100 Seviye) 🏆",
        details: [
          "Seviye 1'den 100'e kadar ilerleyen zengin solo operasyon seferi.",
          "Her 15 seviyede bir (15, 30, 45, 60, 75, 100) dev ödül sandıkları seni bekler!",
        ],
        tag: "SEFER",
        tagColor: "#FFC24A",
      },

      {
        title: "Arcade Modu (Zamana Karşı) ⚡",
        details: [
          "Süre geri sayarken bulabildiğin kadar çok kelime türet!",
          "Her bulduğun kelime sürene ek saniyeler ekler ve rekor kırmanı sağlar.",
        ],
        tag: "TEMPO",
        tagColor: "#3EE8B5",
      },
    ],
  },
  {
    key: "leagues",
    tabLabel: "Ligler",
    badge: "DERECELİ & PUANLAMA",
    title: "Lig Kademeleri ve Lig Puanı (LP)",
    icon: "👑",
    color: "#98732c",
    description: "Her maç lig puanını doğrudan etkiler. Üst liglere tırmanarak prestij kazan.",
    customVisual: "leagues",
    blocks: [
      {
        title: "9 Aşamalı Siber Lig Hiyerarşisi 🛡️",
        details: [
          "🛡️ Demir Ligi: 0 - 349 LP (Başlangıç arenası)",
          "🛡️ Bronz Ligi: 350 - 899 LP (Temel lig)",
          "🛡️ Gümüş Ligi: 900 - 1599 LP (Orta kademe mücadele)",
          "🦅 Altın Ligi: 1600 - 2499 LP (Tecrübeli rota uzmanları)",
          "🪽 Platin Ligi: 2500 - 3599 LP (İleri seviye strateji)",
          "💎 Elmas Ligi: 3600 - 4999 LP (Elit kelime avcıları)",
          "🔮 Yücelik Ligi: 5000 - 6999 LP (Üstatlar ligi)",
          "🔥 Ölümsüzlük Ligi: 7000 - 9999 LP (Efsanevi oyuncular)",
          "👑 Radian Ligi: 10000+ LP (Zirvedeki siber hükümdarlar)",
        ],
      },
      {
        title: "Maç Sonu LP & XP Hesaplaması 📊",
        details: [
          "PvP Galibiyeti: +25 LP · +60 XP · +10 Çip",
          "PvP Mağlubiyeti: -20 LP · +35 XP · +1 Çip",
          "Bot Galibiyeti: +15 LP · +35 XP · +4 Çip",
          "Bot Mağlubiyeti: -10 LP · +20 XP · +1 Çip",
          "Beraberlik: 0 LP · +40 XP (PvP) / +20 XP (Bot)",
        ],
        tag: "ÖDÜL",
        tagColor: "#3EE8B5",
      },
      {
        title: "Seri Kalkanı Güvencesi 🛡️",
        details: [
          "Bir gün oyuna giremediğinde otomatik olarak 1 Seri Kalkanı tüketilir ve serin sıfırlanmaz.",
          "Kalkanlarını Mağaza'dan veya günlük giriş zincirinden temin edebilirsin.",
        ],
        tag: "KORUMA",
        tagColor: "#E8C36A",
      },
    ],
  },
  {
    key: "powers",
    tabLabel: "Jokerler",
    badge: "DESTEK & İPUCU SİSTEMİ",
    title: "Siber Radar ve Sözlük İncelemesi",
    icon: "📡",
    color: "#2a9c7a",
    description: "Zorlandığın anlarda destek jokerlerini kullanarak avantaj yakala.",
    blocks: [
      {
        title: "Siber Radar (İpucu Butonu) 👁️",
        details: [
          "Tahtada hiçbir kelime göremediğinde ekranın üstündeki Radar butonuna dokun.",
          "Radar, kalan gizli kelimelerin ilk ve son harflerini parlak sarı renkle işaretler.",
          "Radarı kullanmak artık süre cezası vermez; rahatça stratejine odaklan!",
        ],
        tag: "JOKER",
        tagColor: "#3EE8B5",
      },
      {
        title: "İnteraktif Rota İnceleme 🎨",
        details: [
          "Bulduğun veya maç sonunda kaçırdığın kelimelerin etiketine dokun.",
          "Tahtadaki harflerin hangi yoldan bağlandığını canlı renkli çizgiyle incele.",
        ],
      },
      {
        title: "Entegre TDK Kelime Sözlüğü 📖",
        details: [
          "Tıkladığın her kelimenin resmi Türkçe sözlük tanımı modal pencerede açılır.",
          "Oynarken hem eğlen hem de kelime dağarcığını zenginleştir!",
        ],
        tag: "SÖZLÜK",
        tagColor: "#FFC24A",
      },
      {
        title: "Süre Kurtarma & 2X Reklam Bonusu 🎁",
        details: [
          "Süre bittiğinde tek dokunuşla ek +20 saniye süre alarak oyunu tamamlayabilirsin.",
          "Solo bölümler bittiğinde ödülünü 2 katına çıkarma fırsatını değerlendirebilirsin.",
        ],
      },
    ],
  },
  {
    key: "economy",
    tabLabel: "Ekonomi",
    badge: "MAĞAZA & ÖDÜLLER",
    title: "Çipler, Görevler ve Unvanlar",
    icon: "🪙",
    color: "#987c00",
    description: "Kazandığın kaynaklarla profilini özelleştir ve gücünü artır.",
    customVisual: "rewards",
    blocks: [
      {
        title: "7 Günlük Giriş Ödül Zinciri 🎁",
        details: [
          "Her gün ana menüden günün ödülünü topla (Çip, XP ve 7. günde Seri Kalkanı!).",
          "Her 7 günde bir döngü yenilenir ve düzenli oynayanlar büyük avantaj sağlar.",
        ],
        tag: "GÜNLÜK",
        tagColor: "#FFD000",
      },
      {
        title: "Görev Merkezi & Rozet Sayacı 📋",
        details: [
          "Günlük 3 dinamik görev ve haftalık şampiyonluk görevlerini tamamla.",
          "Ödülü hazır olan görevlerin sayısı menüde kırmızı yanan sayaç rozetinde gösterilir.",
        ],
      },
      {
        title: "Siber Mağaza & Kozmetikler 🛍️",
        details: [
          "Biriktirdiğin Çipler ile özel Avatarlar (Orbit, Bilge, Comet, vb.) satın al.",
          "Göz zevkine göre Kozmik Uzay, Retro Arcade veya Siberpunk Tahta Temalarını aç.",
        ],
      },
      {
        title: "Siber Unvan Kuşanma Vitrini 🏷️",
        details: [
          "[ÇAYLAK], [İZCİ], [MİMAR], [NEON HAKİMİ] ve [MATRİS EFSANESİ] unvanlarını aç.",
          "Profil ekranından istediğin unvana dokunarak kuşan; unvanın maçlarda rakiplerine görünsün.",
        ],
        tag: "PRESTİJ",
        tagColor: "#D4B45A",
      },
    ],
  },
  {
    key: "tactics",
    tabLabel: "Taktikler",
    badge: "USTA OYUNCU REHBERİ",
    title: "Yüksek Skor & Hızlı Tempo Taktikleri",
    icon: "🎯",
    color: "#9d6f33",
    description: "Sıradan bir oyuncudan matris ustasına dönüşmeni sağlayacak stratejiler.",
    customVisual: "multipliers",
    blocks: [
      {
        title: "Uzun Kelime Çarpanı (Combo XP) 💥",
        details: [
          "3-4 Harfli Kelimeler: Normal puan.",
          "5-6 Harfli Kelimeler: ×1.5 Ekstra Puan ve tempo avantajı.",
          "7+ Harfli Uzun Kelimeler: ×2 Katı Puan ve özel 'Uzun Usta' rozeti kazandırır!",
        ],
        tag: "BONUS",
        tagColor: "#E8A54B",
      },
      {
        title: "Köşe ve Kenar Harf Önceliği 📐",
        details: [
          "Köşelerdeki harflerin sadece 2 olası bağlantı yönü vardır.",
          "Bulmacayı çözerken önce köşelerdeki harflere odaklanarak seçenekleri daralt.",
        ],
      },
      {
        title: "Tempo (K/DK) Yönetimi ⏱️",
        details: [
          "Dakikadaki Kelime Temponu (K/DK) 12 ve üzerine çıkararak liderlik tablosunun zirvesine adını yazdır!",
        ],
        tag: "PRO",
        tagColor: "#3EE8B5",
      },
    ],
  },
];
