import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, Modal, ScrollView, useWindowDimensions } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";

type GuideTabKey = "basics" | "modes" | "leagues" | "powers" | "economy" | "tactics";

type GuideSection = {
  key: GuideTabKey;
  tabLabel: string;
  badge: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  blocks: {
    title: string;
    details: string[];
    tag?: string;
    tagColor?: string;
  }[];
  customVisual?: "route" | "modes" | "leagues" | "rewards" | "multipliers";
};

const GUIDE_SECTIONS: GuideSection[] = [
  {
    key: "basics",
    tabLabel: "Oynanış",
    badge: "TEMEL MEKANİK & KURALLAR",
    title: "Harf Bağlama ve Rota Çizimi",
    icon: "⚡",
    color: "#00F5D4",
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
        tagColor: "#00F5D4",
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
    color: "#8B5CF6",
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
        tagColor: "#8B5CF6",
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
        title: "Günün Sabit Rotası (Daily Challenge) 📅",
        details: [
          "Her gün tüm oyuncular için aynı tahta üretilir. Adil şartlarda en yüksek puanı topla.",
          "Günlük rotayı tamamlayarak günlük serini (Streak) koru ve seri bonusları kazan!",
        ],
      },
      {
        title: "Arcade Modu (Zamana Karşı) ⚡",
        details: [
          "Süre geri sayarken bulabildiğin kadar çok kelime türet!",
          "Her bulduğun kelime sürene ek saniyeler ekler ve rekor kırmanı sağlar.",
        ],
        tag: "TEMPO",
        tagColor: "#00F5D4",
      },
    ],
  },
  {
    key: "leagues",
    tabLabel: "Ligler",
    badge: "DERECELİ & PUANLAMA",
    title: "Lig Kademeleri ve Lig Puanı (LP)",
    icon: "👑",
    color: "#FFC24A",
    description: "Her maç lig puanını doğrudan etkiler. Üst liglere tırmanarak prestij kazan.",
    customVisual: "leagues",
    blocks: [
      {
        title: "5 Aşamalı Siber Lig Hiyerarşisi 🛡️",
        details: [
          "🛡️ Bronz Ligi: 0 - 349 LP (Başlangıç arenası)",
          "⚔️ Gümüş Ligi: 350 - 899 LP (Orta kademe mücadele)",
          "👑 Altın Ligi: 900 - 1599 LP (Tecrübeli rota uzmanları)",
          "💎 Elmas Ligi: 1600 - 2499 LP (Elit kelime avcıları)",
          "🌟 Şampiyon Ligi: 2500+ LP (Zirvedeki siber efsaneler)",
        ],
      },
      {
        title: "Maç Sonu LP & XP Hesaplaması 📊",
        details: [
          "PvP Galibiyeti: +25 LP · +65 XP · +25 Siber Çip",
          "PvP Mağlubiyeti: -15 LP · +40 XP",
          "Bot Galibiyeti: +15 LP · +35 XP · +15 Siber Çip",
          "Beraberlik: +5 LP · +40 XP",
        ],
        tag: "ÖDÜL",
        tagColor: "#00F5D4",
      },
      {
        title: "Seri Kalkanı Güvencesi 🛡️",
        details: [
          "Bir gün oyuna giremediğinde otomatik olarak 1 Seri Kalkanı tüketilir ve serin sıfırlanmaz.",
          "Kalkanlarını Mağaza'dan veya günlük giriş zincirinden temin edebilirsin.",
        ],
        tag: "KORUMA",
        tagColor: "#A78BFA",
      },
    ],
  },
  {
    key: "powers",
    tabLabel: "Jokerler",
    badge: "DESTEK & İPUCU SİSTEMİ",
    title: "Siber Radar ve Sözlük İncelemesi",
    icon: "📡",
    color: "#00F5D4",
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
        tagColor: "#00F5D4",
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
    title: "Siber Çipler, Görevler ve Unvanlar",
    icon: "🪙",
    color: "#FFD000",
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
          "Biriktirdiğin Siber Çipler ile özel Avatarlar (Orbit, Bilge, Comet, vb.) satın al.",
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
        tagColor: "#8B5CF6",
      },
    ],
  },
  {
    key: "tactics",
    tabLabel: "Taktikler",
    badge: "USTA OYUNCU REHBERİ",
    title: "Yüksek Skor & Hızlı Tempo Taktikleri",
    icon: "🎯",
    color: "#FF007F",
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
        tagColor: "#FF007F",
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
        tagColor: "#00F5D4",
      },
    ],
  },
];

export function OnboardingGuide({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<GuideTabKey>("basics");

  useEffect(() => {
    if (visible) {
      setActiveTab("basics");
    }
  }, [visible]);

  const currentIndex = GUIDE_SECTIONS.findIndex((s) => s.key === activeTab);
  const currentSection = GUIDE_SECTIONS[currentIndex] || GUIDE_SECTIONS[0]!;

  const handleNext = () => {
    triggerHapticSelection();
    if (currentIndex < GUIDE_SECTIONS.length - 1) {
      setActiveTab(GUIDE_SECTIONS[currentIndex + 1]!.key);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    triggerHapticSelection();
    if (currentIndex > 0) {
      setActiveTab(GUIDE_SECTIONS[currentIndex - 1]!.key);
    }
  };

  const handleSelectTab = (key: GuideTabKey) => {
    triggerHapticSelection();
    setActiveTab(key);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { maxWidth: Math.min(width - 24, 480) }]}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={styles.headerKickerRow}>
                <Text style={[styles.badgeText, { color: currentSection.color }]}>{currentSection.badge}</Text>
                <View style={[styles.sectionPill, { borderColor: currentSection.color }]}>
                  <Text style={[styles.sectionPillText, { color: currentSection.color }]}>
                    {currentIndex + 1} / {GUIDE_SECTIONS.length}
                  </Text>
                </View>
              </View>
              <Text style={styles.headerTitle}>SİBER OYUN KILAVUZU & REHBER</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Quick Category Chips Selector */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {GUIDE_SECTIONS.map((sec) => {
                const isActive = sec.key === activeTab;
                return (
                  <Pressable
                    key={sec.key}
                    onPress={() => handleSelectTab(sec.key)}
                    style={[
                      styles.tabChip,
                      isActive && [styles.tabChipActive, { borderColor: sec.color, backgroundColor: `${sec.color}22` }],
                    ]}
                  >
                    <Text style={styles.tabChipIcon}>{sec.icon}</Text>
                    <Text style={[styles.tabChipText, isActive && { color: sec.color, fontWeight: "900" }]}>
                      {sec.tabLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Main Content Area */}
          <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Title Banner */}
            <View style={[styles.bannerCard, { borderColor: `${currentSection.color}55` }]}>
              <View style={[styles.iconCircle, { borderColor: currentSection.color, backgroundColor: `${currentSection.color}15` }]}>
                <Text style={styles.bannerIcon}>{currentSection.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionHeading, { color: currentSection.color }]}>{currentSection.title}</Text>
                <Text style={styles.sectionDescription}>{currentSection.description}</Text>
              </View>
            </View>

            {/* Visual Examples */}
            {currentSection.customVisual === "route" && (
              <View style={styles.visualCard}>
                <Text style={styles.visualLabel}>ÖRNEK GEÇERLİ VE GEÇERSİZ ROTALAR:</Text>
                <View style={styles.routeExampleRow}>
                  <View style={styles.exampleCol}>
                    <View style={styles.miniBoardRow}>
                      <View style={[styles.miniCell, styles.miniCellActive]}><Text style={styles.miniLetter}>K</Text></View>
                      <Text style={styles.miniArrow}>➔</Text>
                      <View style={[styles.miniCell, styles.miniCellActive]}><Text style={styles.miniLetter}>A</Text></View>
                      <Text style={styles.miniArrow}>➔</Text>
                      <View style={[styles.miniCell, styles.miniCellActive]}><Text style={styles.miniLetter}>P</Text></View>
                      <Text style={styles.miniArrow}>➔</Text>
                      <View style={[styles.miniCell, styles.miniCellActive]}><Text style={styles.miniLetter}>I</Text></View>
                    </View>
                    <Text style={styles.validStatusText}>✓ GEÇERLİ (90° Dik / Yatay)</Text>
                  </View>
                  <View style={styles.exampleDivider} />
                  <View style={styles.exampleCol}>
                    <View style={styles.miniBoardRow}>
                      <View style={[styles.miniCell, styles.miniCellActive]}><Text style={styles.miniLetter}>K</Text></View>
                      <Text style={[styles.miniArrow, { color: "#FF647C" }]}>⤨</Text>
                      <View style={[styles.miniCell, styles.miniCellInvalid]}><Text style={[styles.miniLetter, { color: "#FF647C" }]}>L</Text></View>
                    </View>
                    <Text style={styles.invalidStatusText}>✗ YASAK (Çapraz Bağlantı)</Text>
                  </View>
                </View>
              </View>
            )}

            {currentSection.customVisual === "modes" && (
              <View style={styles.modesPillRow}>
                <View style={[styles.modeMiniBadge, { borderColor: "#00F5D4" }]}>
                  <Text style={[styles.modeMiniBadgeTitle, { color: "#00F5D4" }]}>4×4 MATRİS</Text>
                  <Text style={styles.modeMiniBadgeSub}>16 Harf · 60sn</Text>
                </View>
                <View style={[styles.modeMiniBadge, { borderColor: "#A78BFA" }]}>
                  <Text style={[styles.modeMiniBadgeTitle, { color: "#A78BFA" }]}>6×6 MATRİS</Text>
                  <Text style={styles.modeMiniBadgeSub}>36 Harf · 75sn</Text>
                </View>
                <View style={[styles.modeMiniBadge, { borderColor: "#FFD000" }]}>
                  <Text style={[styles.modeMiniBadgeTitle, { color: "#FFD000" }]}>8×8 MATRİS</Text>
                  <Text style={styles.modeMiniBadgeSub}>64 Harf · 95sn</Text>
                </View>
                <View style={[styles.modeMiniBadge, { borderColor: "#FF007F" }]}>
                  <Text style={[styles.modeMiniBadgeTitle, { color: "#FF007F" }]}>10×10 MATRİS</Text>
                  <Text style={styles.modeMiniBadgeSub}>100 Harf · 125sn</Text>
                </View>
              </View>
            )}

            {currentSection.customVisual === "leagues" && (
              <View style={styles.leaguesRow}>
                <View style={[styles.leagueChip, { borderColor: "#CD7F32" }]}>
                  <Text style={styles.leagueChipIcon}>🛡️</Text>
                  <Text style={[styles.leagueChipTitle, { color: "#CD7F32" }]}>BRONZ</Text>
                  <Text style={styles.leagueChipLp}>0-349 LP</Text>
                </View>
                <View style={[styles.leagueChip, { borderColor: "#C0C0C0" }]}>
                  <Text style={styles.leagueChipIcon}>⚔️</Text>
                  <Text style={[styles.leagueChipTitle, { color: "#E0E0E0" }]}>GÜMÜŞ</Text>
                  <Text style={styles.leagueChipLp}>350-899 LP</Text>
                </View>
                <View style={[styles.leagueChip, { borderColor: "#FFD700" }]}>
                  <Text style={styles.leagueChipIcon}>👑</Text>
                  <Text style={[styles.leagueChipTitle, { color: "#FFD700" }]}>ALTIN</Text>
                  <Text style={styles.leagueChipLp}>900-1599 LP</Text>
                </View>
                <View style={[styles.leagueChip, { borderColor: "#00F5D4" }]}>
                  <Text style={styles.leagueChipIcon}>💎</Text>
                  <Text style={[styles.leagueChipTitle, { color: "#00F5D4" }]}>ELMAS</Text>
                  <Text style={styles.leagueChipLp}>1600-2499</Text>
                </View>
                <View style={[styles.leagueChip, { borderColor: "#FF007F" }]}>
                  <Text style={styles.leagueChipIcon}>🌟</Text>
                  <Text style={[styles.leagueChipTitle, { color: "#FF007F" }]}>ŞAMPİYON</Text>
                  <Text style={styles.leagueChipLp}>2500+ LP</Text>
                </View>
              </View>
            )}

            {currentSection.customVisual === "rewards" && (
              <View style={styles.rewardsStripCard}>
                <Text style={styles.visualLabel}>7 GÜNLÜK ÖDÜL DÖNGÜSÜ:</Text>
                <View style={styles.rewardPillsRow}>
                  <View style={styles.rewardMiniPill}><Text style={styles.rewardMiniIcon}>🪙</Text><Text style={styles.rewardMiniDay}>1G</Text><Text style={styles.rewardMiniAmt}>+25</Text></View>
                  <View style={styles.rewardMiniPill}><Text style={styles.rewardMiniIcon}>⚡</Text><Text style={styles.rewardMiniDay}>2G</Text><Text style={styles.rewardMiniAmt}>+60</Text></View>
                  <View style={styles.rewardMiniPill}><Text style={styles.rewardMiniIcon}>🪙</Text><Text style={styles.rewardMiniDay}>3G</Text><Text style={styles.rewardMiniAmt}>+50</Text></View>
                  <View style={styles.rewardMiniPill}><Text style={styles.rewardMiniIcon}>⚡</Text><Text style={styles.rewardMiniDay}>4G</Text><Text style={styles.rewardMiniAmt}>+100</Text></View>
                  <View style={styles.rewardMiniPill}><Text style={styles.rewardMiniIcon}>🪙</Text><Text style={styles.rewardMiniDay}>5G</Text><Text style={styles.rewardMiniAmt}>+75</Text></View>
                  <View style={styles.rewardMiniPill}><Text style={styles.rewardMiniIcon}>⚡</Text><Text style={styles.rewardMiniDay}>6G</Text><Text style={styles.rewardMiniAmt}>+150</Text></View>
                  <View style={[styles.rewardMiniPill, styles.rewardMiniPillEpic]}><Text style={styles.rewardMiniIcon}>🛡️</Text><Text style={styles.rewardMiniDay}>7G</Text><Text style={styles.rewardMiniAmt}>+1</Text></View>
                </View>
              </View>
            )}

            {currentSection.customVisual === "multipliers" && (
              <View style={styles.multipliersCard}>
                <View style={styles.multiplierItem}>
                  <Text style={styles.multiplierBadge}>3-4 HARF</Text>
                  <Text style={styles.multiplierValue}>×1.0</Text>
                  <Text style={styles.multiplierSub}>Standart Puan</Text>
                </View>
                <View style={[styles.multiplierItem, { borderColor: "#00F5D4" }]}>
                  <Text style={[styles.multiplierBadge, { color: "#00F5D4" }]}>5-6 HARF</Text>
                  <Text style={[styles.multiplierValue, { color: "#00F5D4" }]}>×1.5</Text>
                  <Text style={styles.multiplierSub}>Siber Bonus</Text>
                </View>
                <View style={[styles.multiplierItem, { borderColor: "#FF007F", backgroundColor: "rgba(255, 0, 127, 0.1)" }]}>
                  <Text style={[styles.multiplierBadge, { color: "#FF007F" }]}>7+ HARF</Text>
                  <Text style={[styles.multiplierValue, { color: "#FF007F" }]}>×2.0</Text>
                  <Text style={styles.multiplierSub}>Dev Çarpan!</Text>
                </View>
              </View>
            )}

            {/* Structured Topic Blocks */}
            <View style={styles.blocksList}>
              {currentSection.blocks.map((block, idx) => (
                <View key={idx} style={styles.blockCard}>
                  <View style={styles.blockHead}>
                    <Text style={styles.blockTitle}>{block.title}</Text>
                    {block.tag && (
                      <View style={[styles.blockTag, { borderColor: block.tagColor || currentSection.color, backgroundColor: `${block.tagColor || currentSection.color}20` }]}>
                        <Text style={[styles.blockTagText, { color: block.tagColor || currentSection.color }]}>{block.tag}</Text>
                      </View>
                    )}
                  </View>
                  {block.details.map((detail, dIdx) => (
                    <View key={dIdx} style={styles.detailRow}>
                      <Text style={[styles.detailBullet, { color: currentSection.color }]}>▪</Text>
                      <Text style={styles.detailText}>{detail}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Navigation & Action Footer */}
          <View style={styles.footer}>
            <View style={styles.indicatorRow}>
              {GUIDE_SECTIONS.map((sec, idx) => (
                <Pressable key={sec.key} onPress={() => handleSelectTab(sec.key)}>
                  <View
                    style={[
                      styles.dot,
                      idx === currentIndex && [styles.dotActive, { backgroundColor: currentSection.color }],
                    ]}
                  />
                </Pressable>
              ))}
            </View>

            <View style={styles.footerButtonsRow}>
              {currentIndex > 0 ? (
                <Pressable onPress={handlePrev} style={styles.prevBtn}>
                  <Text style={styles.prevBtnText}>← ÖNCEKİ</Text>
                </Pressable>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              {currentIndex < GUIDE_SECTIONS.length - 1 ? (
                <Pressable onPress={handleNext} style={[styles.nextBtn, { backgroundColor: currentSection.color }]}>
                  <Text style={[styles.nextBtnText, { color: currentSection.color === "#FFD000" || currentSection.color === "#00F5D4" ? "#100C24" : "#FFFFFF" }]}>
                    SONRAKİ BÖLÜM →
                  </Text>
                </Pressable>
              ) : (
                <Pressable onPress={onClose} style={[styles.nextBtn, styles.finishBtn]}>
                  <Text style={styles.finishBtnText}>ANLADIM, OYUNA DÖN 🚀</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(6, 4, 15, 0.94)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  container: {
    width: "100%",
    height: "92%",
    maxHeight: 720,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(124, 92, 246, 0.6)",
    backgroundColor: "#120D26",
    overflow: "hidden",
    shadowColor: "#7C5CF6",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124, 92, 246, 0.2)",
    backgroundColor: "rgba(22, 17, 44, 0.8)",
  },
  headerKickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  sectionPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
  },
  sectionPillText: {
    fontSize: 8.5,
    fontWeight: "900",
  },
  headerTitle: {
    color: "#FFF9FC",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 100, 124, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 100, 124, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#FF647C",
    fontSize: 14,
    fontWeight: "900",
  },

  tabsContainer: {
    backgroundColor: "rgba(16, 11, 34, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124, 92, 246, 0.15)",
    paddingVertical: 8,
  },
  tabsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(28, 21, 55, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.25)",
  },
  tabChipActive: {
    borderWidth: 1.5,
  },
  tabChipIcon: {
    fontSize: 13,
  },
  tabChipText: {
    color: "#A799C7",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  contentScroll: {
    padding: 16,
    gap: 12,
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(28, 20, 56, 0.5)",
    borderWidth: 1,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerIcon: {
    fontSize: 22,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  sectionDescription: {
    color: "#C4B5FD",
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2,
  },

  visualCard: {
    backgroundColor: "rgba(19, 14, 38, 0.75)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.3)",
  },
  visualLabel: {
    color: "#A799C7",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  routeExampleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exampleCol: {
    flex: 1,
    alignItems: "center",
  },
  exampleDivider: {
    width: 1,
    height: 48,
    backgroundColor: "rgba(124, 92, 246, 0.3)",
    marginHorizontal: 8,
  },
  miniBoardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  miniCell: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCellActive: {
    backgroundColor: "rgba(0, 245, 212, 0.15)",
    borderColor: "#00F5D4",
  },
  miniCellInvalid: {
    backgroundColor: "rgba(255, 100, 124, 0.15)",
    borderColor: "#FF647C",
  },
  miniLetter: {
    color: "#00F5D4",
    fontSize: 12,
    fontWeight: "900",
  },
  miniArrow: {
    color: "#00F5D4",
    fontSize: 12,
    fontWeight: "900",
  },
  validStatusText: {
    color: "#00F5D4",
    fontSize: 8.5,
    fontWeight: "900",
  },
  invalidStatusText: {
    color: "#FF647C",
    fontSize: 8.5,
    fontWeight: "900",
  },

  modesPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  modeMiniBadge: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(24, 18, 47, 0.7)",
    borderWidth: 1,
    alignItems: "center",
  },
  modeMiniBadgeTitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  modeMiniBadgeSub: {
    color: "#A799C7",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
  },

  leaguesRow: {
    flexDirection: "row",
    gap: 4,
    width: "100%",
  },
  leagueChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(24, 18, 47, 0.7)",
    borderWidth: 1,
    alignItems: "center",
  },
  leagueChipIcon: {
    fontSize: 13,
  },
  leagueChipTitle: {
    fontSize: 8,
    fontWeight: "900",
    marginTop: 2,
  },
  leagueChipLp: {
    color: "#A799C7",
    fontSize: 7,
    fontWeight: "700",
    marginTop: 1,
  },

  rewardsStripCard: {
    backgroundColor: "rgba(19, 14, 38, 0.75)",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.3)",
  },
  rewardPillsRow: {
    flexDirection: "row",
    gap: 4,
    width: "100%",
  },
  rewardMiniPill: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(27, 21, 52, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.2)",
    alignItems: "center",
  },
  rewardMiniPillEpic: {
    borderColor: "#FFD000",
    backgroundColor: "rgba(255, 208, 0, 0.12)",
  },
  rewardMiniIcon: {
    fontSize: 11,
  },
  rewardMiniDay: {
    color: "#A799C7",
    fontSize: 7.5,
    fontWeight: "800",
    marginTop: 1,
  },
  rewardMiniAmt: {
    color: "#FFF9FC",
    fontSize: 8,
    fontWeight: "900",
  },

  multipliersCard: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  multiplierItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(25, 18, 50, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.3)",
    alignItems: "center",
  },
  multiplierBadge: {
    color: "#A799C7",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  multiplierValue: {
    color: "#FFF9FC",
    fontSize: 16,
    fontWeight: "900",
    marginVertical: 2,
  },
  multiplierSub: {
    color: "#C4B5FD",
    fontSize: 7.5,
    fontWeight: "700",
  },

  blocksList: {
    gap: 10,
    marginTop: 4,
  },
  blockCard: {
    backgroundColor: "rgba(22, 16, 44, 0.65)",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.22)",
  },
  blockHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  blockTitle: {
    color: "#FFF9FC",
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: 0.4,
    flex: 1,
  },
  blockTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  blockTagText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 4,
  },
  detailBullet: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "900",
  },
  detailText: {
    flex: 1,
    color: "#DDD6FE",
    fontSize: 10.5,
    lineHeight: 15.5,
    fontWeight: "500",
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(124, 92, 246, 0.2)",
    backgroundColor: "rgba(18, 13, 38, 0.9)",
  },
  indicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3D335C",
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
  },
  footerButtonsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  prevBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.35)",
    backgroundColor: "rgba(30, 24, 58, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  prevBtnText: {
    color: "#B5A9CD",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  nextBtn: {
    flex: 1.5,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  nextBtnText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  finishBtn: {
    backgroundColor: "#00F5D4",
  },
  finishBtnText: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
});
