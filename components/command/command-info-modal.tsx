import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { palette } from "@/shared/palette";
import { GameButton, GameGlyph, ICONS, OrnatePanel } from "@/components/game/game-ui";
import { type LeagueTierInfo, type PlayerProgress } from "@/shared/progression";
import { styles } from "./command-center.styles";

export type InfoModalType = "shield" | "radar" | "lives" | "rotani" | "mystery" | null;

export function CommandInfoModal({
  infoModal,
  onClose,
  progress,
  livesCalc,
  league,
  mystery,
  onOpenLivesModal,
  onNavigate,
}: {
  infoModal: InfoModalType;
  onClose: () => void;
  progress: PlayerProgress;
  livesCalc: { lives: number; isInfinite?: boolean; infiniteRemainingSeconds?: number };
  league: LeagueTierInfo;
  mystery: { word: string; definition: string; rewardXp: number };
  onOpenLivesModal?: () => void;
  onNavigate: (destination: any) => void;
}) {
  if (!infoModal) return null;

  return (
    <Modal
      visible={infoModal !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 340 }}>
          <OrnatePanel contentStyle={{ alignItems: "center", paddingVertical: 22 }}>
            <View style={[
              styles.modalIconBadge,
              infoModal === "shield" ? styles.modalIconBadgeShield : infoModal === "radar" ? styles.modalIconBadgeRadar : infoModal === "lives" ? styles.modalIconBadgeLives : infoModal === "mystery" ? styles.modalIconBadgeMystery : styles.modalIconBadgeRotani
            ]}>
              {infoModal === "shield" ? <GameGlyph source={ICONS.shield} size={22} /> :
                infoModal === "radar" ? <GameGlyph source={ICONS.radar} size={22} /> :
                infoModal === "lives" ? <GameGlyph source={ICONS.heart} size={22} /> :
                infoModal === "mystery" ? <Text style={{ fontSize: 24 }}>🔍</Text> :
                <GameGlyph source={ICONS.play} size={22} />}
            </View>

            <Text style={styles.modalKicker}>
              {infoModal === "shield" ? "SAVUNMA YÜZÜĞÜ" : infoModal === "radar" ? "KEŞİF KRİSTALİ" : infoModal === "lives" ? "YAŞAM ALEVİ" : infoModal === "mystery" ? "GÜNLÜK ÖZEL GÖREV" : "MACERA MERKEZİ · SEZON 01"}
            </Text>
            <Text style={styles.modalTitle}>
              {infoModal === "shield" ? "Seri Kalkanı" : infoModal === "radar" ? "Kelime Radarı" : infoModal === "lives" ? "Can" : infoModal === "mystery" ? "Gizemli Kelime" : "Nereden başlayayım?"}
            </Text>

            <View style={styles.modalCountPill}>
              <Text style={styles.modalCountLabel}>
                {infoModal === "shield" ? "KALKAN & SERİ:" : infoModal === "rotani" ? "MEVCUT LİG KADEMEN:" : infoModal === "mystery" ? "GÖREV ÖDÜLÜ:" : "MEVCUT MİKTAR:"}
              </Text>
              <Text style={[styles.modalCountValue, infoModal === "shield" ? { color: palette.gemBlue } : infoModal === "radar" ? { color: palette.emerald } : infoModal === "lives" ? { color: palette.gemGreen } : infoModal === "mystery" ? { color: "#2a8fbc" } : { color: league.color }]}>
                {infoModal === "shield" ? `${progress.streakShields || 0} Kalkan · 🔥 ${progress.pvpWinStreak || 0} Seri` : infoModal === "radar" ? (progress.radarChargesBonus || 0) : infoModal === "lives" ? (livesCalc.isInfinite ? `SONSUZ CAN (${Math.ceil((livesCalc.infiniteRemainingSeconds || 0) / 60)} dk)` : `${livesCalc.lives}/5`) : infoModal === "mystery" ? `+${mystery.rewardXp} XP` : `${league.name} (${league.currentTierPoints} LP)`}
              </Text>
            </View>

            <Text style={styles.modalBody}>
              {infoModal === "shield"
                ? "Üst üste galibiyetlerde profilinde yanan alevli zafer serini (🔥 Win Streak) korur.\n\nBir düelloda mağlup olduğunda otomatik olarak 1 Seri Kalkanı harcanır; böylece alevli serin ve seriden gelen yüksek LP çarpanların sıfırlanmadan korunur!"
                : infoModal === "radar"
                ? "Tek oyunculu seviyelerde ve bulmacalarda tahtadaki gizli kelimelerin baş ve son harflerini tespit eder. Sıkıştığın anlarda doğru rotayı bularak zaman kazandırır."
                : infoModal === "lives"
                ? "Tek oyunculu solo seviyelerde veya zamana karşı denemelerde başarısız olduğunda 1 Can kaybedersin. Canların bittiğinde 30 dakikada bir otomatik dolar veya Çip ile anında yenileyebilirsin."
                : infoModal === "mystery"
                ? `Günün İpucu: "${mystery.definition}"\n\nBu tanıma uyan kelimeyi herhangi bir oyun tahtasında (Düello, Seviye veya Gazete Bulmacası) bulup bağladığında anında +${mystery.rewardXp} XP kazanırsın!`
                : "Buradan istediğin oyunu seçebilirsin. Dereceli düelloya katılabilir, arkadaşınla eşleşebilir, seviyeleri çözebilir veya Lig & Kademe merdiveninde LP biriktirebilirsin."}
            </Text>

            <View style={styles.modalTipBox}>
              <Text style={styles.modalTipTitle}>
                {infoModal === "mystery" ? "💡 GİZEMLİ KELİME REHBERİ" : "💡 REKABET REHBERİ"}
              </Text>
              <Text style={styles.modalTipText}>
                {infoModal === "shield"
                  ? "• Mağaza'dan Çip ile satın alabilirsin.\n• Haftalık görevleri ve seviye dönüm noktalarını tamamlayarak kazanabilirsin.\n• Profilindeki alevli zafer serisini mağlubiyetlere karşı korur."
                  : infoModal === "radar"
                  ? "• Her seviyede 3 temel hak otomatik verilir.\n• Mağaza ve görevlerden ek kalıcı bonus haklar elde edebilirsin.\n• Seviye içi gizli sandıkları çözerek ekstra hak toplayabilirsin."
                  : infoModal === "lives"
                  ? "• Her 30 dakikada 1 Can otomatik olarak ücretsiz doldurulur (Maks 5).\n• Beklemek istemiyorsan Mağaza'dan Çip ile veya reklam izleyerek anında doldurabilirsin.\n• Günlük giriş ve seviye ödüllerinden bedava Can kazanabilirsin."
                  : infoModal === "mystery"
                  ? "• Her gün gece yarısı yeni bir gizemli kelime belirlenir.\n• Kelimeyi herhangi bir oyun modunda bulduğun anda ödül XP hesabına eklenir.\n• İpucunu dikkatle incele ve tahtada harfleri birleştir!"
                  : "• Galibiyet kazanarak lig puanı (LP) topla ve Demir'den Radian'a yüksel.\n• Seviye ve bulmacaları tamamlayarak ekstra Sezon XP elde et.\n• En yüksek kelime temposu (K/DK) yakalayarak liderlik sıralamasına gir."}
              </Text>
            </View>

            <GameButton
              label={infoModal === "lives" ? "CAN MERKEZİ (DOLDUR)" : infoModal === "shield" ? "MAĞAZADA İNCELE" : infoModal === "rotani" ? "LİG & KADEMELER" : "ANLADIM"}
              variant={infoModal === "rotani" || infoModal === "mystery" ? "emerald" : "gold"}
              size="md"
              onPress={() => {
                const target = infoModal;
                onClose();
                if (target === "lives") {
                  if (onOpenLivesModal) onOpenLivesModal();
                  else onNavigate("store");
                } else if (target === "shield") {
                  onNavigate("store");
                } else if (target === "rotani") {
                  onNavigate("league");
                }
              }}
              style={{ alignSelf: "stretch" }}
            />

            {(infoModal === "shield" || infoModal === "lives" || infoModal === "rotani") && (
              <Pressable onPress={onClose} style={styles.modalSecondaryBtn}>
                <Text style={styles.modalSecondaryBtnText}>KAPAT</Text>
              </Pressable>
            )}
          </OrnatePanel>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
