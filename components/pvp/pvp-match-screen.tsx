import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { ScreenContainer } from "../common/screen-container";
import { BoardCell, type CellColorConfig } from "../game/board-cell";
import { ScoreBadge } from "../game/score-badge";
import { ConnectLine, BoardCountdownShield } from "../game/game-ui";
import { MatchResultModal } from "../modals/match-result-modal";
import { LeaveDuelModal } from "../friends/leave-duel-modal";
import { GameModeInfoModal } from "../modals/game-mode-info-modal";
import { GameCountdownOverlay } from "../game/game-countdown-overlay";
import { UserProfileModal, type InspectableUser } from "../profile/user-profile-modal";
import { APP_WORD_PALETTE } from "@/shared/solo";
import { triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { isEqualTr } from "@/shared/tr-utils";
import { haptics } from "@/lib/haptics";
import { gameSfx } from "@/lib/game-sfx";
import { socialManager } from "@/shared/social";
import { styles } from "./pvp.styles";
import { FloatingCombo } from "../game/game-boosters";
import {
  PvpRouteInspectorCard,
  type SelectedWordDetail,
} from "./pvp-route-inspector";
import { PvpFoundWordsPanel } from "./pvp-found-words-panel";
import { PvpResultPanel } from "./pvp-result-panel";
import type { BoardSize, RoomSnapshot } from "@/shared/game";
import type { PlayerProgress } from "@/shared/progression";
import type { ToastData } from "../common/global-game-toast";

export { type SelectedWordDetail } from "./pvp-route-inspector";

const WORD_PALETTE = APP_WORD_PALETTE;

export interface FinishedWordInfo {
  word: string;
  path: number[];
  color: string;
  isMissed: boolean;
}

export interface PvpMatchScreenProps {
  room: RoomSnapshot;
  playerId: string;
  safeName: string;
  sfxOn: boolean;
  toggleSfx: (val: boolean) => void;
  isSocketConnected: boolean;
  remainingSeconds: number;
  isFinalPush: boolean;
  myMultiplier: number;
  myWordCount: number;
  opponentWordCount: number;
  myScore: number;
  opponentScore: number;
  scoreDifference: number;
  scoreLeadLabel: string;
  myTempo: number;
  opponentTempo: number;
  disconnectRemainingSeconds: number;
  activeEmote: { id?: string; playerId: string; playerName: string; emote: string } | null;
  onSendEmote: (emoji: string) => void;
  progress: PlayerProgress;
  activeBoardSkinColor?: string;
  activeVictoryEffect: string;
  matchXpEarned: number;
  matchLpEarned: number;
  matchCoinsEarned: number;
  isCustomRoom: boolean;
  gameCountdown: number | null;
  selectedCells: number[];
  selectionFeedback: string;
  activeWord: string;
  isSelecting: boolean;
  setIsSelecting: (val: boolean) => void;
  getCellCenter: (cellIndex: number) => { x: number; y: number };
  allFinishedWords: FinishedWordInfo[];
  inspectedPath: number[] | null;
  setInspectedPath: (path: number[] | null) => void;
  inspectedColor: string;
  particles: { id: number; x: number; y: number; color: string; anim: Animated.ValueXY }[];
  boardRef: React.RefObject<any>;
  measureBoard: () => void;
  boardWidth: number;
  handleGestureStart: (e: any) => void;
  handleGestureMove: (e: any) => void;
  handleGestureEnd: () => void;
  selectionActiveRef: React.MutableRefObject<boolean>;
  clearSelection: () => void;
  submitSelection: () => void;
  pendingWordRef: React.MutableRefObject<string | null>;
  selectedWordInfo: SelectedWordDetail | null;
  setSelectedWordInfo: (info: SelectedWordDetail | null) => void;
  inspectWord: (word: string, path: number[] | null, color: string) => void;
  notice: string;
  showResultModal: boolean;
  setShowResultModal: (show: boolean) => void;
  showLeaveDuelModal: boolean;
  setShowLeaveDuelModal: (show: boolean) => void;
  selectedModeInfo: any;
  setSelectedModeInfo: (mode: any) => void;
  onRequestRematch: () => void;
  onLeaveRoom: () => void;
  onOpenUserProfile: (user: any) => void;
  onWatchAd: (cb: () => void) => void;
  onSetGlobalToast: (toast: ToastData) => void;
  inspectedUser: InspectableUser | null;
  setInspectedUser: (user: InspectableUser | null) => void;
  onAddFriendTarget: (target: InspectableUser) => void;
  onChallengeTarget: (userOrSize?: any, size?: BoardSize) => void;
  livesModalElement?: React.ReactNode;
  celebrationModalElement?: React.ReactNode;
  onLiveGameExitPress: () => void;
  gameScrollRef: React.RefObject<ScrollView | null>;
  pvpCombo?: number;
}

export function PvpMatchScreen({
  room,
  playerId,
  safeName,
  sfxOn,
  toggleSfx,
  isSocketConnected,
  remainingSeconds,
  isFinalPush,
  myMultiplier,
  myWordCount,
  pvpCombo = 0,
  opponentWordCount,
  myScore,
  opponentScore,
  scoreDifference,
  scoreLeadLabel,
  myTempo,
  opponentTempo,
  disconnectRemainingSeconds,
  activeEmote,
  onSendEmote,
  progress,
  activeBoardSkinColor,
  activeVictoryEffect,
  matchXpEarned,
  matchLpEarned,
  matchCoinsEarned,
  isCustomRoom,
  gameCountdown,
  selectedCells,
  selectionFeedback,
  activeWord,
  isSelecting,
  setIsSelecting,
  getCellCenter,
  allFinishedWords,
  inspectedPath,
  setInspectedPath,
  inspectedColor,
  particles,
  boardRef,
  measureBoard,
  boardWidth,
  handleGestureStart,
  handleGestureMove,
  handleGestureEnd,
  selectionActiveRef,
  clearSelection,
  submitSelection,
  pendingWordRef,
  selectedWordInfo,
  setSelectedWordInfo,
  inspectWord,
  notice,
  showResultModal,
  setShowResultModal,
  showLeaveDuelModal,
  setShowLeaveDuelModal,
  selectedModeInfo,
  setSelectedModeInfo,
  onRequestRematch,
  onLeaveRoom,
  onOpenUserProfile,
  onWatchAd,
  onSetGlobalToast,
  inspectedUser,
  setInspectedUser,
  onAddFriendTarget,
  onChallengeTarget,
  livesModalElement,
  celebrationModalElement,
  onLiveGameExitPress,
  gameScrollRef,
}: PvpMatchScreenProps) {
  const me = room.players.find((player) => player.id === playerId) ?? null;
  const opponent = room.players.find((player) => player.id !== playerId) ?? null;
  const iWon = room.winnerId === playerId;
  const isDraw = Boolean(room.status === "finished" && !room.winnerId);

  const selectionSet = useMemo(() => new Set(selectedCells), [selectedCells]);
  const myFoundWords = useMemo(
    () => room.foundWords.filter((entry) => entry.playerId === playerId),
    [room.foundWords, playerId]
  );

  const { foundCellOwners, foundCellColors } = useMemo(() => {
    const owners = new Map<number, string>();
    const colors = new Map<number, CellColorConfig>();

    myFoundWords.forEach((entry, wordIndex) => {
      const palette = WORD_PALETTE[wordIndex % WORD_PALETTE.length]!;
      entry.path.forEach((cell) => {
        owners.set(cell, entry.playerId);
        colors.set(cell, {
          bg: palette.bg,
          border: palette.border,
          letterText: palette.letterText,
          checkColor: palette.checkColor,
          glow: palette.glow,
          isMissed: false,
        });
      });
    });

    if (room.status === "finished" && room.missedWords) {
      room.missedWords.forEach((entry, missedIndex) => {
        const colorIndex = (myFoundWords.length + missedIndex) % WORD_PALETTE.length;
        const palette = WORD_PALETTE[colorIndex]!;
        entry.path.forEach((cell) => {
          if (!owners.has(cell)) {
            owners.set(cell, "missed");
            colors.set(cell, {
              bg: palette.bg,
              border: palette.border,
              letterText: palette.letterText,
              checkColor: palette.checkColor,
              glow: palette.glow,
              isMissed: true,
            });
          }
        });
      });
    }

    return { foundCellOwners: owners, foundCellColors: colors };
  }, [room.status, room.missedWords, myFoundWords]);

  const opponentFlashAnim = React.useRef(new Animated.Value(0)).current;
  const prevOpponentWordsCount = React.useRef(opponentWordCount);

  React.useEffect(() => {
    if (opponentWordCount > prevOpponentWordsCount.current && room.status === "playing") {
      haptics.light();
      Animated.sequence([
        Animated.timing(opponentFlashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(opponentFlashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
    prevOpponentWordsCount.current = opponentWordCount;
  }, [opponentWordCount, room.status, opponentFlashAnim]);

  return (
    <ScreenContainer style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20 }}>
      <StatusBar style="dark" />
      <FloatingCombo comboCount={pvpCombo} />
      <ScrollView
        ref={gameScrollRef}
        contentContainerStyle={styles.gameScroll}
        scrollEnabled={!isSelecting}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gameHeader}>
          <Pressable onPress={onLiveGameExitPress} style={styles.exitButton}>
            <Text style={styles.exitText}>×</Text>
          </Pressable>
          <View>
            <Text style={styles.gameMode}>CANLI KELİME DÜELLOSU</Text>
            <Text style={styles.gameCode}>ODA {room.code}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                toggleSfx(!sfxOn);
              }}
              style={styles.soundToggleBtn}
            >
              <Text style={{ fontSize: 14 }}>{sfxOn ? "🔊" : "🔇"}</Text>
            </Pressable>
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{room.status === "playing" ? "CANLI" : "SONUÇ"}</Text>
            </View>
          </View>
        </View>

        {!isSocketConnected && room.status === "playing" && (
          <View style={styles.offlineBanner}>
            <ActivityIndicator size="small" color="#ed4343" style={{ marginRight: 8 }} />
            <Text style={styles.offlineText}>
              📡 Bağlantın kesildi, tekrar bağlanılıyor...
            </Text>
          </View>
        )}

        {/* Canlı Düello Arena Kartı (Modern, Dinamik ve Kompakt) */}
        <View style={styles.duelBattleHeader}>
          {/* Sol: Benim Oyuncu Kartım */}
          <View style={[styles.duelPlayerBadge, styles.duelPlayerBadgeMe]}>
            <View style={[styles.duelAvatarCircle, { borderColor: "#2DD4BF" }]}>
              <Text style={styles.duelAvatarEmoji}>
                {me?.avatar && me.avatar.length <= 3 ? me.avatar : "✨"}
              </Text>
            </View>
            <View style={styles.duelPlayerInfo}>
              <Text numberOfLines={1} style={styles.duelPlayerName}>{me?.name ?? safeName}</Text>
              <View style={styles.duelScoreRow}>
                <Text style={[styles.duelScoreText, { color: "#0F766E" }]}>{myScore}</Text>
                <Text style={styles.duelWordBadge}>
                  {myWordCount}/{room.wordsTotal} kelime
                  {room.bonusWords?.[playerId]?.length ? ` (+${room.bonusWords[playerId]!.length}✨)` : ""}
                </Text>
              </View>
            </View>
          </View>

          {/* Orta: VS & Süre & Puan Durumu Rozeti */}
          <View style={styles.duelCenterHub}>
            <View style={[styles.duelTimerPill, isFinalPush && styles.duelTimerPillFinal]}>
              <Text style={styles.duelTimerIcon}>{isFinalPush ? "⚡" : "⏱️"}</Text>
              <Text style={[styles.duelTimerValue, isFinalPush && styles.duelTimerValueFinal]}>
                {room.status === "playing" ? `00:${String(remainingSeconds).padStart(2, "0")}` : "00:00"}
              </Text>
            </View>
            <View style={[
              styles.duelLeadBadge,
              scoreDifference > 0 && styles.duelLeadAhead,
              scoreDifference < 0 && styles.duelLeadBehind,
            ]}>
              <Text style={[
                styles.duelLeadText,
                scoreDifference > 0 && { color: "#059669" },
                scoreDifference < 0 && { color: "#DC2626" },
              ]}>
                {scoreLeadLabel}
              </Text>
            </View>
          </View>

          {/* Sağ: Rakip Oyuncu Kartı */}
          <Pressable
            disabled={!opponent}
            onPress={opponent ? () => { triggerHapticSelection(); onOpenUserProfile(opponent); } : undefined}
            style={({ pressed }) => [
              styles.duelPlayerBadge,
              styles.duelPlayerBadgeOpponent,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.duelPlayerInfoRight}>
              <Text numberOfLines={1} style={styles.duelPlayerName}>{opponent?.name ?? "RAKİP"}</Text>
              <View style={styles.duelScoreRow}>
                <Text style={styles.duelWordBadge}>{opponentWordCount}/{room.wordsTotal} kelime</Text>
                <Text style={[styles.duelScoreText, { color: "#BE123C" }]}>{opponentScore}</Text>
              </View>
            </View>
            <View style={[styles.duelAvatarCircle, { borderColor: "#FB7185" }]}>
              <Text style={styles.duelAvatarEmoji}>
                {opponent?.avatar && opponent.avatar.length <= 3 ? opponent.avatar : (opponent?.isBot ? "🤖" : "👤")}
              </Text>
            </View>
          </Pressable>
        </View>

        {activeEmote && (
          <View style={[styles.floatingEmoteBadge, activeEmote.playerId === playerId ? { left: 24 } : { right: 24 }]}>
            <Text style={styles.floatingEmoteText}>{activeEmote.emote}</Text>
            <Text style={{ color: "#2a9c7a", fontSize: 10, fontWeight: "900" }}>{activeEmote.playerName}</Text>
          </View>
        )}

        {/* Canlı Hedef & Reaksiyon Şeridi */}
        <View style={styles.duelSubBar}>
          <View style={styles.duelTargetPill}>
            <Text style={styles.duelTargetIcon}>🎯</Text>
            <Text style={styles.duelTargetText}>HEDEF: <Text style={{ color: "#0F766E", fontWeight: "900" }}>{room.wordsTotal} KELİME</Text></Text>
          </View>

          {room.status === "playing" && (
            <View style={styles.compactEmoteMiniBar}>
              {["🔥", "👏", "⚡", "😎"].map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => onSendEmote(emoji)}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  style={({ pressed }) => [styles.miniEmoteBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.miniEmoteText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {disconnectRemainingSeconds > 0 && (
          <View style={styles.disconnectBox}>
            <Text style={{ color: "#ed4343", fontSize: 11, fontWeight: "900" }}>
              ⚠️ RAKİBİN BAĞLANTISI KOPTU ({disconnectRemainingSeconds}s)
            </Text>
          </View>
        )}

        <View
          ref={boardRef}
          onLayout={measureBoard}
          style={[
            styles.board,
            {
              width: boardWidth,
              height: boardWidth,
              position: "relative",
              borderColor: activeBoardSkinColor ? `${activeBoardSkinColor}66` : "#DCE1D7",
              shadowColor: activeBoardSkinColor || "#293541",
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
        >
          {/* Countdown Blur Shield to prevent pre-reading letters */}
          <BoardCountdownShield countdown={gameCountdown} theme="light" />

          {/* Canlı seçim rotası ve okları */}
          {selectedCells.slice(0, -1).map((cellIdx, i) => {
            const nextCellIdx = selectedCells[i + 1]!;
            const start = getCellCenter(cellIdx);
            const end = getCellCenter(nextCellIdx);
            return (
              <ConnectLine
                key={`line-${i}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                color={activeBoardSkinColor || "#219d8d"}
                showArrow
              />
            );
          })}

          {/* Oyun bittiğinde: Tahtadaki TÜM kelimelerin rotalarını ve yön oklarını hemen çiz */}
          {room.status === "finished" &&
            allFinishedWords.map((fw, fwIdx) => {
              const isCurrentInspected = Boolean(
                inspectedPath &&
                  inspectedPath.length === fw.path.length &&
                  inspectedPath.every((c, ci) => c === fw.path[ci])
              );
              const lineOpacity = inspectedPath ? (isCurrentInspected ? 1 : 0.4) : 0.92;
              return fw.path.slice(0, -1).map((cellIdx, i) => {
                const nextCellIdx = fw.path[i + 1]!;
                const start = getCellCenter(cellIdx);
                const end = getCellCenter(nextCellIdx);
                return (
                  <ConnectLine
                    key={`finished-line-${fwIdx}-${i}`}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    color={fw.color}
                    opacity={lineOpacity}
                    showArrow
                  />
                );
              });
            })}

          {room.board.map((letter, index) => {
            const order = selectedCells.indexOf(index);
            const selected = selectionSet.has(index);
            const isTail = selectedCells.at(-1) === index;
            const foundBy = foundCellOwners.get(index);
            const isFound = foundBy !== undefined;
            const cellColor = foundCellColors.get(index);

            let inspectedOrder =
              room.status === "finished" && inspectedPath ? inspectedPath.indexOf(index) : -1;
            let isInspectedStart =
              room.status === "finished" && inspectedPath !== null && inspectedOrder === 0;
            let isInspectedEnd =
              room.status === "finished" && inspectedPath
                ? inspectedOrder === inspectedPath.length - 1
                : false;
            let isInspected =
              room.status === "finished" && inspectedPath !== null && inspectedOrder >= 0;

            return (
              <BoardCell
                key={`${letter}-${index}`}
                letter={letter}
                index={index}
                order={order}
                selected={selected}
                isTail={isTail}
                foundBy={foundBy}
                isFound={isFound}
                size={room.size}
                selectionFeedback={selectionFeedback}
                playerId={playerId}
                status={room.status}
                isBotSelected={false}
                botOrder={-1}
                isBotTail={false}
                isInspected={isInspected}
                inspectedOrder={inspectedOrder}
                isInspectedStart={isInspectedStart}
                isInspectedEnd={isInspectedEnd}
                cellColor={cellColor}
                isCountingDown={gameCountdown !== null && gameCountdown > 0}
              />
            );
          })}

          {particles.map((p) => (
            <Animated.View
              key={p.id}
              style={{
                position: "absolute",
                left: p.x - 4,
                top: p.y - 4,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: p.color,
                transform: p.anim.getTranslateTransform(),
              }}
            />
          ))}

          {/* Absolute touch/pointer overlay to intercept gestures relative to board cleanly */}
          <View
            pointerEvents={room.status === "playing" && gameCountdown === null ? "auto" : "none"}
            onStartShouldSetResponder={() => room.status === "playing" && gameCountdown === null}
            onMoveShouldSetResponder={() => room.status === "playing" && gameCountdown === null}
            onResponderTerminationRequest={() => false}
            onPointerDown={(e: any) => {
              if (e.target?.setPointerCapture)
                e.target.setPointerCapture(e.pointerId ?? e.nativeEvent?.pointerId);
              handleGestureStart(e);
            }}
            onPointerMove={handleGestureMove}
            onPointerUp={handleGestureEnd}
            onPointerCancel={() => {
              selectionActiveRef.current = false;
              clearSelection();
              setIsSelecting(false);
            }}
            onTouchStart={handleGestureStart}
            onTouchMove={handleGestureMove}
            onTouchEnd={handleGestureEnd}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {room.status === "playing" && (
          <View
            style={[
              styles.wordTray,
              selectionFeedback === "invalid" && styles.wordTrayInvalid,
              selectionFeedback === "accepted" && styles.wordTrayAccepted,
              selectionFeedback === "bonus" && styles.wordTrayBonus,
            ]}
          >
            <Text style={styles.wordLabel}>
              {selectionFeedback === "invalid"
                ? "GEÇERSİZ KELİME"
                : selectionFeedback === "bonus"
                ? "✨ GİZLİ BONUS KELİME BULUNDU!"
                : selectionFeedback === "accepted"
                ? "KELİME KABUL EDİLDİ"
                : selectedCells.length >= 2
                ? "ROTA SEÇİLDİ · DOĞRULAMAK İÇİN GÖNDER"
                : "SEÇTİĞİN KELİME"}
            </Text>
            <Text style={[styles.drawnWord, !activeWord && styles.drawnWordEmpty]}>
              {activeWord || "HARFLERİ BİRLEŞTİR"}
            </Text>
            <Text style={styles.routeHint}>
              {selectionFeedback === "invalid"
                ? "Kırmızı rota birazdan temizlenecek."
                : selectionFeedback === "bonus"
                ? "+10 Bonus Puan & +2 Çip Kazanıldı!"
                : selectedCells.length > 1
                ? "Mavi önizleme · yeşil yalnız kabul edilince görünür."
                : "Yalnız yatay ve dikey ilerle"}
            </Text>
            <View style={styles.wordActions}>
              {selectedCells.length > 0 && (
                <Pressable onPress={clearSelection} style={styles.clearWord}>
                  <Text style={styles.clearWordText}>TEMİZLE</Text>
                </Pressable>
              )}
              <Pressable
                disabled={selectedCells.length < 2 || Boolean(pendingWordRef.current)}
                onPress={submitSelection}
                style={[
                  styles.submitWord,
                  (selectedCells.length < 2 || Boolean(pendingWordRef.current)) && styles.disabledButton,
                ]}
              >
                <Text style={styles.submitWordText}>GÖNDER</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Aktif Kelime Rotası ve Harf Yön Akışı Kartı */}
        <PvpRouteInspectorCard
          selectedWordInfo={selectedWordInfo}
          inspectedPath={inspectedPath}
          inspectedColor={inspectedColor}
          onClose={() => {
            setSelectedWordInfo(null);
            setInspectedPath(null);
          }}
        />

        {/* Bulunan ve Kaçırılan Kelimeler Paneli */}
        <PvpFoundWordsPanel
          status={room.status}
          wordsTotal={room.wordsTotal}
          myFoundWords={myFoundWords}
          bonusWords={room.bonusWords?.[playerId]}
          missedWords={room.missedWords}
          inspectedPath={inspectedPath}
          onInspectWord={(word, path, color) => {
            inspectWord(word, path, color);
          }}
        />

        {/* Sonuç Paneli veya Bilgi Bildirimi */}
        <PvpResultPanel
          isFinished={room.status === "finished"}
          isDraw={isDraw}
          iWon={iWon}
          activeVictoryEffect={activeVictoryEffect}
          rematchPending={Boolean(me?.rematch)}
          notice={notice}
          onShowResultsModal={() => setShowResultModal(true)}
          onRequestRematch={onRequestRematch}
          onLeaveRoom={onLeaveRoom}
        />
      </ScrollView>

      {/* Game Over / Match Result Modal */}
      <MatchResultModal
        visible={Boolean(room.status === "finished" && showResultModal)}
        iWon={iWon}
        isDraw={isDraw}
        activeVictoryEffect={activeVictoryEffect}
        progress={progress}
        myScore={myScore}
        opponentScore={opponentScore}
        myWordCount={myWordCount}
        opponentWordCount={opponentWordCount}
        wordsTotal={room.wordsTotal}
        meName={me?.name ?? safeName}
        opponentName={opponent?.name ?? "RAKİP"}
        opponent={opponent}
        matchXpEarned={matchXpEarned}
        matchLpEarned={matchLpEarned}
        matchCoinsEarned={matchCoinsEarned}
        isCustomRoom={isCustomRoom}
        myTempo={myTempo}
        opponentTempo={opponentTempo}
        allFinishedWords={allFinishedWords}
        myFoundWords={myFoundWords}
        bonusWords={room.bonusWords?.[playerId]}
        selectedWordInfo={selectedWordInfo}
        rematchPending={Boolean(me?.rematch)}
        isFriend={
          opponent
            ? socialManager
                .getFriends()
                .some(
                  (f) =>
                    isEqualTr(f.username, opponent.name)
                )
            : false
        }
        onInspectWord={(word, path, color) => inspectWord(word, path, color || "#219d8d")}
        onOpenUserProfile={(opp) => {
          triggerHapticSelection();
          onOpenUserProfile(opp);
        }}
        onAddFriend={(opp) => {
          triggerHapticSuccess();
          const res = socialManager.addFriend({
            id: opp.id,
            name: opp.name,
            username: opp.name,
            avatar: opp.avatar || (opp.isBot ? "🤖" : "🎮"),
            avatarPhoto: opp.avatarPhoto,
            selectedTitle: opp.selectedTitle,
            level: opp.level,
            tier: opp.tier,
            lp: opp.lp,
            wins: opp.wins,
            matches: opp.matches,
            streak: opp.streak,
            bestScore: opp.bestScore,
            bestTempo: opp.bestTempo,
          });
          onSetGlobalToast({
            id: `friend-${Date.now()}`,
            title: res.success ? "ARKADAŞ EKLENDİ" : "BİLGİ",
            subtitle: res.message,
            icon: res.success ? "👥" : "ℹ️",
            accentColor: res.success ? "#3EE8B5" : "#FFC24A",
          });
        }}
        onWatchAdStreakSave={() => {
          onWatchAd(() => {
            haptics.success();
            gameSfx.victory();
            onSetGlobalToast({
              id: `streak-save-${Date.now()}`,
              title: "🛡️ SERİ KORUNDU!",
              subtitle: "Reklam izlendi! Günlük seriniz mağlubiyetten etkilenmedi ve korundu.",
              icon: "🔥",
              accentColor: "#FFD000",
            });
          });
        }}
        onRequestRematch={onRequestRematch}
        onLeaveRoom={onLeaveRoom}
        onClose={() => setShowResultModal(false)}
      />

      {/* Düellodan Ayrılma Siber Modalı */}
      <LeaveDuelModal
        visible={showLeaveDuelModal}
        onStay={() => setShowLeaveDuelModal(false)}
        onLeave={() => {
          setShowLeaveDuelModal(false);
          onLeaveRoom();
        }}
      />

      {/* Oyun Modları Bilgi Modalı */}
      <GameModeInfoModal
        visible={selectedModeInfo !== null}
        mode={selectedModeInfo}
        onClose={() => setSelectedModeInfo(null)}
      />

      <GameCountdownOverlay
        countdown={gameCountdown}
        title="CANLI DÜELLO"
        subtitle="Gizli kelimeleri rakibinden önce bul ve kazan!"
        icon="⚔️"
      />

      <UserProfileModal
        visible={inspectedUser !== null}
        user={inspectedUser}
        isSelf={
          inspectedUser
            ? inspectedUser.id === playerId ||
              isEqualTr(inspectedUser.username || inspectedUser.name, safeName)
            : false
        }
        isFriend={
          inspectedUser
            ? socialManager
                .getFriends()
                .some(
                  (f) =>
                    isEqualTr(f.username, inspectedUser.username || inspectedUser.name)
                )
            : false
        }
        onClose={() => setInspectedUser(null)}
        onAddFriend={onAddFriendTarget}
        onChallenge={onChallengeTarget}
      />

      {livesModalElement}
      {celebrationModalElement}
    </ScreenContainer>
  );
}

