import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PlayerProgress } from "../shared/progression";
import { MatchInsight } from "./match-insight";
import { MatchRewardsCard } from "./match-rewards";
import { VictoryBanner, VictoryEffectOverlay } from "./victory-effect-overlay";
import { isEqualTr } from "@/shared/tr-utils";

export interface MatchResultModalProps {
  visible: boolean;
  iWon: boolean;
  isDraw: boolean;
  activeVictoryEffect: string;
  progress: PlayerProgress;
  myScore: number;
  opponentScore: number;
  myWordCount: number;
  opponentWordCount: number;
  wordsTotal: number;
  meName: string;
  opponentName: string;
  opponent?: {
    id?: string;
    name?: string;
    avatar?: string;
    avatarPhoto?: string;
    selectedTitle?: string;
    level?: number;
    tier?: string;
    lp?: number;
    wins?: number;
    matches?: number;
    streak?: number;
    bestScore?: number;
    bestTempo?: number;
    isBot?: boolean;
  } | null;
  matchXpEarned: number;
  matchLpEarned: number;
  matchCoinsEarned: number;
  isCustomRoom: boolean;
  myTempo: number;
  opponentTempo: number;
  allFinishedWords: Array<{ word: string; path: number[]; color: string }>;
  myFoundWords: Array<{ word: string; path: number[] }>;
  selectedWordInfo?: {
    word: string;
    definition: string;
    example?: string;
    type?: string;
    loading?: boolean;
  } | null;
  rematchPending?: boolean;
  isFriend?: boolean;
  onInspectWord: (word: string, path: number[], color?: string) => void;
  onOpenUserProfile?: (opponent: any) => void;
  onAddFriend?: (opponent: any) => void;
  onWatchAdStreakSave?: () => void;
  onRequestRematch: () => void;
  onLeaveRoom: () => void;
  onClose: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  visible,
  iWon,
  isDraw,
  activeVictoryEffect,
  progress,
  myScore,
  opponentScore,
  myWordCount,
  opponentWordCount,
  wordsTotal,
  meName,
  opponentName,
  opponent,
  matchXpEarned,
  matchLpEarned,
  matchCoinsEarned,
  isCustomRoom,
  myTempo,
  opponentTempo,
  allFinishedWords,
  myFoundWords,
  selectedWordInfo,
  rematchPending,
  isFriend,
  onInspectWord,
  onOpenUserProfile,
  onAddFriend,
  onWatchAdStreakSave,
  onRequestRematch,
  onLeaveRoom,
  onClose,
}) => {
  if (!visible) return null;

  const handleShareResult = async () => {
    try {
      const outcome = iWon ? "🏆 Maçı Kazandım!" : isDraw ? "🤝 Berabere Kaldık!" : "⚡ Kıran kırana maç!";
      const shareMessage =
        `Kelime Patlat ⚔️ ${meName} vs ${opponentName}\n` +
        `${outcome}\n\n` +
        `📊 Benim Skorum: ${myScore} Puan (${myWordCount} Kelime)\n` +
        `🎯 Rakip Skor: ${opponentScore} Puan (${opponentWordCount} Kelime)\n\n` +
        `Sen kaç kelime bulabilirsin? Hemen oyna 👉 https://kelimepatlat.com`;

      await Share.share({
        message: shareMessage,
        title: "Kelime Patlat Maç Sonucu",
      });
    } catch {
      // ignore
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        {iWon && (
          <VictoryEffectOverlay
            effectId={progress.selectedVictoryEffect}
            visible={iWon}
            title="Kazandın!"
            subtitle={`${myScore} puan · ${myWordCount} kelime. Bu tur senin!`}
          />
        )}
        <Pressable
          style={styles.modalCard}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.resultModalHeader}>
              {iWon && <VictoryBanner title="Bu tur senin!" subtitle={`${myScore} puanla zirvedesin.`} />}
              <Text style={styles.resultModalIcon}>
                {isDraw ? "⚔️" : iWon ? `${activeVictoryEffect} 🏆 ${activeVictoryEffect}` : "💔"}
              </Text>
              <Text style={[styles.resultModalTitle, { color: isDraw ? "#8c7540" : iWon ? "#219d8d" : "#bd5564" }]}>
                {isDraw ? "BERABERE BİTTİ!" : iWon ? `TUR SENİN! ${activeVictoryEffect}` : "TUR RAKİBİNİN"}
              </Text>
              <Text style={styles.resultModalSub}>
                {isDraw
                  ? "İki taraf da eşit puan topladı! Rövanşla kazananı belirle."
                  : iWon
                  ? "Tebrikler! En yüksek puanı toplayarak turu kazandın."
                  : "Rakip bu tur daha hızlı davrandı. Rövanşla puanları geri al!"}
              </Text>
            </View>

            {/* Match Scoreboard Summary */}
            <View style={styles.resultScoreRow}>
              <View style={[styles.resultScoreCol, iWon && styles.resultScoreWinner]}>
                <Text style={styles.resultScorePlayerName}>{meName} (SEN)</Text>
                <Text style={[styles.resultScoreNumber, { color: "#219d8d" }]}>{myScore}</Text>
                <Text style={styles.resultScoreWords}>{myWordCount}/{wordsTotal} Kelime</Text>
              </View>
              <View style={styles.resultVsBox}><Text style={styles.resultVsText}>VS</Text></View>
              <View style={[styles.resultScoreCol, (!isDraw && !iWon) && styles.resultScoreWinner]}>
                <Text style={styles.resultScorePlayerName}>{opponentName}</Text>
                <Text style={[styles.resultScoreNumber, { color: "#bd5564" }]}>{opponentScore}</Text>
                <Text style={styles.resultScoreWords}>{opponentWordCount}/{wordsTotal} Kelime</Text>
                {opponent && (
                  <View style={styles.opponentActionsRow}>
                    {onOpenUserProfile && (
                      <Pressable
                        onPress={() => onOpenUserProfile(opponent)}
                        style={({ pressed }) => [
                          styles.opponentActionBtn,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text style={styles.opponentActionText}>👤 PROFİL</Text>
                      </Pressable>
                    )}
                    {!isFriend && onAddFriend && (
                      <Pressable
                        onPress={() => onAddFriend(opponent)}
                        style={({ pressed }) => [
                          styles.opponentActionAddBtn,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text style={styles.opponentActionAddText}>➕ EKLE</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* 1. Ayrılmış Özel Kazanımlar & Lig Puanı Kartı */}
            <MatchRewardsCard
              progress={progress}
              xpEarned={matchXpEarned}
              lpEarned={matchLpEarned}
              coinsEarned={matchCoinsEarned}
              isCustom={isCustomRoom}
              streakBonus={progress.lastMatchReward?.streakBonus}
              pvpWinStreak={progress.lastMatchReward?.pvpWinStreak ?? progress.pvpWinStreak}
              isCrushingWin={progress.lastMatchReward?.isCrushingWin}
            />

            {/* 2. Ayrılmış Rota ve Performans Analizi Kartı */}
            <MatchInsight
              score={myScore}
              opponentScore={opponentScore}
              words={myWordCount}
              opponentWords={opponentWordCount}
              tempo={myTempo}
              opponentTempo={opponentTempo}
              bestScore={progress.bestScore}
            />

            {/* 3. Maç Kelimeleri & TDK Anlamları Kartı */}
            {allFinishedWords.length > 0 && (
              <View style={styles.tdkCard}>
                <View style={styles.tdkHeaderRow}>
                  <Text style={{ fontSize: 13 }}>📖</Text>
                  <Text style={styles.tdkHeaderText}>
                    MAÇTAKİ TÜM KELİMELER & TDK ANLAMLARI
                  </Text>
                </View>
                <Text style={styles.tdkSubText}>
                  TDK sözlük anlamını ve tahtadaki rotasını görmek için bir kelimeye dokun:
                </Text>

                <View style={styles.wordsWrap}>
                  {allFinishedWords.map((item, idx) => {
                    const isMine = myFoundWords.some((m) => isEqualTr(m.word, item.word));
                    const isSelected = selectedWordInfo ? isEqualTr(selectedWordInfo.word, item.word) : false;
                    return (
                      <Pressable
                        key={`modal-w-${idx}`}
                        onPress={() => {
                          onInspectWord(item.word, item.path, item.color);
                        }}
                        style={({ pressed }) => [
                          styles.wordPill,
                          {
                            backgroundColor: isSelected
                              ? "rgba(45, 212, 191, 0.25)"
                              : isMine
                              ? "rgba(45, 212, 191, 0.12)"
                              : "rgba(251, 113, 133, 0.12)",
                          },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text style={[styles.wordPillText, { color: isMine ? "#219d8d" : "#bd5564" }]}>
                          {isMine ? "✓" : "✗"} {item.word}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {selectedWordInfo ? (
                  <View style={styles.wordDetailBox}>
                    <View style={styles.wordDetailHeader}>
                      <View style={styles.wordDetailTitleRow}>
                        <Text style={styles.wordDetailTitle}>
                          {selectedWordInfo.word}
                        </Text>
                        {selectedWordInfo.type ? (
                          <View style={styles.wordDetailTypeBadge}>
                            <Text style={styles.wordDetailTypeText}>{selectedWordInfo.type}</Text>
                          </View>
                        ) : null}
                      </View>
                      {selectedWordInfo.loading && (
                        <ActivityIndicator size="small" color="#219d8d" style={{ transform: [{ scale: 0.7 }] }} />
                      )}
                    </View>
                    <Text style={styles.wordDetailDef}>
                      {selectedWordInfo.definition}
                    </Text>
                    {selectedWordInfo.example ? (
                      <View style={styles.wordDetailExampleBox}>
                        <Text style={styles.wordDetailExampleText}>
                          Örnek: "{selectedWordInfo.example}"
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            )}

            {/* Action Buttons */}
            {!iWon && !isDraw && onWatchAdStreakSave && (
              <Pressable
                onPress={onWatchAdStreakSave}
                style={({ pressed }) => [
                  styles.adStreakBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.adStreakBtnText}>
                  🎬 REKLAM İZLE: GÜNLÜK SERİNİ KORU 🔥
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleShareResult}
              style={({ pressed }) => [
                styles.shareBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.shareBtnText}>
                📤 SKORU PAYLAŞ & MEYDAN OKU
              </Text>
            </Pressable>

            <Pressable
              onPress={onRequestRematch}
              disabled={rematchPending}
              style={({ pressed }) => [
                styles.rematchBtn,
                rematchPending && { opacity: 0.6 },
                pressed && !rematchPending && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.rematchBtnText}>
                {rematchPending ? "RAKİP BEKLENİYOR..." : "↻ RÖVANŞ İSTE"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onLeaveRoom}
              style={({ pressed }) => [
                styles.leaveBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.leaveBtnText}>
                🏠 ANA MENÜYE DÖN
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.inspectBoardBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.inspectBoardBtnText}>
                🔍 TAHTAYI VE KELİMELERİ İNCELE
              </Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(35,48,59,0.42)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    height: "88%",
    maxHeight: 740,
    backgroundColor: "#F0F5ED",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#DCE1D7",
    overflow: "hidden",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    alignItems: "stretch",
    width: "100%",
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 24,
  },
  resultModalHeader: {
    alignItems: "center",
    marginBottom: 6,
  },
  resultModalIcon: {
    fontSize: 30,
    marginBottom: 2,
  },
  resultModalTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  resultModalSub: {
    color: "#293541",
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 15,
  },
  resultScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginVertical: 6,
    backgroundColor: "#EDF4FC",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  resultScoreCol: {
    flex: 1,
    alignItems: "center",
  },
  resultScoreWinner: {
    transform: [{ scale: 1.04 }],
  },
  resultScorePlayerName: {
    color: "#293541",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  resultScoreNumber: {
    fontSize: 22,
    fontWeight: "900",
    marginVertical: 1,
  },
  resultScoreWords: {
    color: "#293541",
    fontSize: 9,
    fontWeight: "800",
  },
  resultVsBox: {
    paddingHorizontal: 6,
  },
  resultVsText: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
  },
  opponentActionsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    justifyContent: "center",
  },
  opponentActionBtn: {
    backgroundColor: "rgba(212, 180, 90, 0.2)",
    borderColor: "#DCE1D7",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  opponentActionText: {
    color: "#293541",
    fontSize: 9,
    fontWeight: "900",
  },
  opponentActionAddBtn: {
    backgroundColor: "rgba(62, 232, 181, 0.2)",
    borderColor: "#DCE1D7",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  opponentActionAddText: {
    color: "#2a9c7a",
    fontSize: 9,
    fontWeight: "900",
  },
  tdkCard: {
    width: "100%",
    marginTop: 12,
    backgroundColor: "#F0F5ED",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
  },
  tdkHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  tdkHeaderText: {
    color: "#8c7540",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  tdkSubText: {
    color: "#293541",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 8,
  },
  wordsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  wordPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
  },
  wordPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  wordDetailBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#DCE1D7",
  },
  wordDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  wordDetailTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  wordDetailTitle: {
    color: "#219d8d",
    fontSize: 13,
    fontWeight: "900",
  },
  wordDetailTypeBadge: {
    backgroundColor: "rgba(212, 180, 90, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  wordDetailTypeText: {
    color: "#8c7540",
    fontSize: 9,
    fontWeight: "800",
  },
  wordDetailDef: {
    color: "#293541",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  wordDetailExampleBox: {
    marginTop: 6,
    padding: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#DCE1D7",
  },
  wordDetailExampleText: {
    color: "#293541",
    fontSize: 11,
    fontStyle: "italic",
  },
  adStreakBtn: {
    width: "100%",
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255, 208, 0, 0.15)",
    borderColor: "#DCE1D7",
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginTop: 10,
  },
  adStreakBtnText: {
    color: "#987c00",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  shareBtn: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#38bdf8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#0284c7",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  shareBtnText: {
    color: "#041527",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  rematchBtn: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#aef5e0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  rematchBtnText: {
    color: "#293541",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  leaveBtn: {
    width: "100%",
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  leaveBtnText: {
    color: "#293541",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  inspectBoardBtn: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  inspectBoardBtnText: {
    color: "#2a9c7a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
