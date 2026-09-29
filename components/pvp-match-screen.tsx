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
import { ScreenContainer } from "./screen-container";
import { BoardCell, type CellColorConfig } from "./board-cell";
import { ScoreBadge } from "./score-badge";
import { ConnectLine, BoardCountdownShield } from "./game-ui";
import { MatchResultModal } from "./match-result-modal";
import { LeaveDuelModal } from "./leave-duel-modal";
import { GameModeInfoModal } from "./game-mode-info-modal";
import { GameCountdownOverlay } from "./game-countdown-overlay";
import { UserProfileModal, type InspectableUser } from "./user-profile-modal";
import { APP_WORD_PALETTE } from "../shared/solo";
import { triggerHapticSelection, triggerHapticSuccess } from "../shared/audio-haptics";
import { haptics } from "../lib/haptics";
import { gameSfx } from "../lib/game-sfx";
import { socialManager } from "../shared/social";
import type { BoardSize, RoomSnapshot } from "../shared/game";
import type { PlayerProgress } from "../shared/progression";
import type { ToastData } from "./global-game-toast";

const WORD_PALETTE = APP_WORD_PALETTE;

export interface FinishedWordInfo {
  word: string;
  path: number[];
  color: string;
  isMissed: boolean;
}

export interface SelectedWordDetail {
  word: string;
  definition: string;
  type?: string;
  example?: string;
  source?: string;
  loading?: boolean;
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

  return (
    <ScreenContainer style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20 }}>
      <StatusBar style="dark" />
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

        <View style={[styles.statusRail, isFinalPush && styles.statusRailFinal]}>
          <View>
            <Text style={styles.railLabel}>{isFinalPush ? "SON HAMLE" : "TUR SÜRESİ"}</Text>
            <Text style={[styles.timerValue, isFinalPush && styles.timerValueFinal]}>
              {room.status === "playing" ? `00:${String(remainingSeconds).padStart(2, "0")}` : "00:00"}
            </Text>
          </View>
          <View style={styles.battleBadges}>
            {myMultiplier > 1 && (
              <View style={styles.multiplierBadge}>
                <Text style={styles.multiplierText}>×{myMultiplier} UZUN KELİME</Text>
              </View>
            )}
            {myWordCount >= 2 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>{myWordCount} SERİ</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.scoreRow, { position: "relative" }]}>
          {activeEmote && (
            <View
              style={[
                styles.floatingEmoteBadge,
                activeEmote.playerId === playerId ? { left: 16 } : { right: 16 },
              ]}
            >
              <Text style={styles.floatingEmoteText}>{activeEmote.emote}</Text>
              <Text style={{ color: "#2a9c7a", fontSize: 10, fontWeight: "900" }}>
                {activeEmote.playerName}
              </Text>
            </View>
          )}
          <ScoreBadge
            name={me?.name ?? safeName}
            score={myScore}
            words={myWordCount}
            total={room.wordsTotal}
            active={!room.winnerId || iWon}
            won={iWon}
            accent="#2DD4BF"
            combo={room.combos?.[playerId]}
            avatar={me?.avatar || (progress.selectedAvatar ? String(progress.selectedAvatar) : "🎮")}
            avatarPhoto={me?.avatarPhoto || progress.avatarPhoto}
            selectedFrame={me?.selectedFrame || progress.selectedFrame || "signal"}
          />
          <View style={styles.vsMark}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <ScoreBadge
            name={opponent?.name ?? "RAKİP"}
            score={opponentScore}
            words={opponentWordCount}
            total={room.wordsTotal}
            active={!room.winnerId || !iWon}
            won={Boolean(room.winnerId && !iWon)}
            accent="#FB7185"
            combo={opponent ? room.combos?.[opponent.id] : undefined}
            avatar={opponent?.avatar || (opponent?.isBot ? "🤖" : "👤")}
            avatarPhoto={opponent?.avatarPhoto}
            selectedFrame={opponent?.selectedFrame || "signal"}
            onPress={
              opponent
                ? () => {
                    triggerHapticSelection();
                    onOpenUserProfile(opponent);
                  }
                : undefined
            }
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>PUAN FARKI</Text>
            <Text
              style={[
                styles.statValue,
                scoreDifference > 0 && styles.statValuePositive,
                scoreDifference < 0 && styles.statValueNegative,
              ]}
            >
              {scoreLeadLabel}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>TEMPO</Text>
            <Text style={styles.statValue}>
              {myTempo} · {opponentTempo} K/DK
            </Text>
          </View>
        </View>

        {room.status === "playing" && (
          <View style={styles.emoteBar}>
            {["🔥", "👏", "⚡", "😱", "🤝", "😎"].map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => onSendEmote(emoji)}
                style={({ pressed }) => [styles.emoteBtn, pressed && styles.pressed]}
              >
                <Text style={styles.emoteBtnText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.targetCard}>
          <Text style={styles.targetLabel}>
            {room.status === "finished" ? "TUR TAMAMLANDI" : "GİZLİ KELİMELERİ BUL"}
          </Text>
          <Text style={styles.targetWord}>{room.wordsTotal} KELİME</Text>
          {disconnectRemainingSeconds > 0 ? (
            <View style={styles.disconnectBox}>
              <Text style={{ color: "#ed4343", fontSize: 11, fontWeight: "900" }}>
                ⚠️ RAKİBİN BAĞLANTISI KOPTU ({disconnectRemainingSeconds}s)
              </Text>
              <Text style={{ color: "#9c6666", fontSize: 9, fontWeight: "800", marginTop: 2 }}>
                Geri dönmezse hükmen galip sayılacaksın.
              </Text>
            </View>
          ) : (
            <Text style={styles.targetTip}>
              {room.status === "playing"
                ? "Parmağını/mouse'u basılı tutarak yatay/dikey komşu harfleri bağla."
                : room.message}
            </Text>
          )}
        </View>

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
            ]}
          >
            <Text style={styles.wordLabel}>
              {selectionFeedback === "invalid"
                ? "GEÇERSİZ KELİME"
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
        {selectedWordInfo && inspectedPath && (
          <View style={styles.activeRouteCard}>
            <View style={styles.activeRouteHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 14 }}>🧭</Text>
                <Text style={styles.activeRouteTitle}>KELİME ROTASI & YÖNÜ</Text>
                <View
                  style={[
                    styles.activeRouteBadge,
                    {
                      backgroundColor: inspectedColor
                        ? `${inspectedColor}25`
                        : "rgba(45, 212, 191, 0.2)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.activeRouteBadgeText,
                      { color: inspectedColor || "#219d8d" },
                    ]}
                  >
                    {selectedWordInfo.word.length} HARF
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  triggerHapticSelection();
                  setSelectedWordInfo(null);
                  setInspectedPath(null);
                }}
                style={({ pressed }) => [styles.activeRouteClose, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.activeRouteCloseText}>✕ Rotayı Kapat</Text>
              </Pressable>
            </View>

            {/* Harf akışı ve oklar */}
            <View style={styles.activeRouteFlow}>
              {selectedWordInfo.word.split("").map((ch, idx, arr) => (
                <React.Fragment key={`route-ch-${idx}`}>
                  <View
                    style={[
                      styles.activeRouteChip,
                      idx === 0 && styles.activeRouteChipStart,
                      idx === arr.length - 1 && styles.activeRouteChipEnd,
                    ]}
                  >
                    <Text
                      style={[
                        styles.activeRouteChipText,
                        idx === 0 && styles.activeRouteChipTextStart,
                        idx === arr.length - 1 && styles.activeRouteChipTextEnd,
                      ]}
                    >
                      {ch}
                    </Text>
                    <Text
                      style={[
                        styles.activeRouteChipSub,
                        idx === 0 && { color: "#279f73" },
                        idx === arr.length - 1 && { color: "#bf5757" },
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  </View>
                  {idx < arr.length - 1 && (
                    <Text
                      style={[
                        styles.activeRouteArrow,
                        { color: inspectedColor || "#219d8d" },
                      ]}
                    >
                      ➔
                    </Text>
                  )}
                </React.Fragment>
              ))}
            </View>

            {selectedWordInfo ? (
              <View style={styles.activeRouteDefBox}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 13 }}>📖</Text>
                    <Text style={styles.activeRouteDefLabel}>TDK SÖZLÜK ANLAMI</Text>
                    {selectedWordInfo.type ? (
                      <View
                        style={{
                          backgroundColor: "rgba(212, 180, 90, 0.2)",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: "#DCE1D7",
                        }}
                      >
                        <Text
                          style={{
                            color: "#8c7540",
                            fontSize: 9,
                            fontWeight: "800",
                          }}
                        >
                          {selectedWordInfo.type}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {selectedWordInfo.loading && (
                    <ActivityIndicator
                      size="small"
                      color="#219d8d"
                      style={{ transform: [{ scale: 0.7 }] }}
                    />
                  )}
                </View>
                <Text style={styles.activeRouteDefText}>{selectedWordInfo.definition}</Text>
                {selectedWordInfo.example ? (
                  <View
                    style={{
                      marginTop: 6,
                      padding: 6,
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: "#DCE1D7",
                    }}
                  >
                    <Text style={{ color: "#293541", fontSize: 11, fontStyle: "italic" }}>
                      Örnek: "{selectedWordInfo.example}"
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        )}

        <View style={styles.foundPanel}>
          <Text style={styles.foundLabel}>
            {room.status === "finished"
              ? "OYUNDAKİ TÜM KELİMELER (SÖZLÜK VE ROTA İÇİN DOKUN)"
              : "BULDUĞUN KELİMELER"}
          </Text>
          {room.status === "finished" && !inspectedPath && (
            <Text style={styles.routeExploreHint}>
              👆 Harflerin başlangıç ve bitiş oklarını tahtada görmek için bir kelimeye dokun.
            </Text>
          )}

          <View style={{ marginTop: 6 }}>
            <Text
              style={{
                color: "#219d8d",
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              ✓ BULDUKLARIN ({myFoundWords.length} / {room.wordsTotal})
            </Text>
            <View style={styles.foundTags}>
              {myFoundWords.length ? (
                myFoundWords.map((entry, index) => {
                  const palette = WORD_PALETTE[index % WORD_PALETTE.length]!;
                  return (
                    <Pressable
                      key={`mine-${index}`}
                      onPress={() => {
                        inspectWord(entry.word, entry.path, palette.border);
                      }}
                      style={({ pressed }) => [
                        styles.foundTag,
                        {
                          backgroundColor: palette.tagBg,
                          borderColor: palette.tagBorder,
                          borderWidth: 1.5,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={[styles.foundTagText, { color: palette.tagText }]}>
                        ✓ {entry.word}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <Text style={styles.foundEmpty}>Henüz kelime bulunmadı.</Text>
              )}
            </View>
          </View>

          {room.status === "finished" && room.missedWords && room.missedWords.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text
                style={{
                  color: "#bd5564",
                  fontSize: 10,
                  fontWeight: "800",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                ✗ BULAMADIĞIN KELİMELER ({room.missedWords.length})
              </Text>
              <View style={styles.foundTags}>
                {room.missedWords.map((entry, index) => {
                  const colorIndex = (myFoundWords.length + index) % WORD_PALETTE.length;
                  const palette = WORD_PALETTE[colorIndex]!;
                  return (
                    <Pressable
                      key={`missed-${index}`}
                      onPress={() => {
                        inspectWord(entry.word, entry.path, palette.border);
                      }}
                      style={({ pressed }) => [
                        styles.foundTag,
                        {
                          backgroundColor: palette.tagBg,
                          borderColor: palette.tagBorder,
                          borderWidth: 1.5,
                          borderStyle: "dashed",
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={[styles.foundTagMissedText, { color: palette.tagText }]}>
                        ✗ {entry.word}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {room.status === "finished" ? (
          <View style={styles.resultPanel}>
            <Text style={styles.resultTitle}>
              {isDraw
                ? "BERABERE BİTTİ!"
                : iWon
                ? `TUR SENİN! ${activeVictoryEffect}`
                : "TUR RAKİBİNİN"}
            </Text>
            <Text style={styles.resultCopy}>
              {isDraw
                ? "İki taraf da eşit puan topladı! Rövanşla kazananı belirle."
                : iWon
                ? "En yüksek puanı sen topladın."
                : "Rövanşta daha fazla kelime bul."}
            </Text>
            <Pressable
              onPress={() => setShowResultModal(true)}
              style={({ pressed }) => [styles.viewResultsButton, pressed && styles.pressed]}
            >
              <Text style={styles.viewResultsButtonText}>📊 SONUÇ VE DETAY KARTINI GÖR</Text>
            </Pressable>
            <Pressable
              onPress={onRequestRematch}
              style={({ pressed }) => [styles.primaryButton, styles.rematchButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>
                {me?.rematch ? "RAKİP BEKLENİYOR" : "↻ RÖVANŞ İSTE"}
              </Text>
              <Text style={styles.primaryButtonArrow}>↻</Text>
            </Pressable>
            <Pressable
              onPress={onLeaveRoom}
              style={({ pressed }) => [styles.returnHomeButton, pressed && styles.pressed]}
            >
              <Text style={styles.returnHomeButtonText}>🏠 ANA MENÜYE DÖN</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.notice}>{notice}</Text>
        )}
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
        selectedWordInfo={selectedWordInfo}
        rematchPending={Boolean(me?.rematch)}
        isFriend={
          opponent
            ? socialManager
                .getFriends()
                .some(
                  (f) =>
                    f.username.toLocaleLowerCase("tr-TR") === opponent.name.toLocaleLowerCase("tr-TR")
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
              (inspectedUser.username || inspectedUser.name).toLocaleLowerCase("tr-TR") ===
                safeName.toLocaleLowerCase("tr-TR")
            : false
        }
        isFriend={
          inspectedUser
            ? socialManager
                .getFriends()
                .some(
                  (f) =>
                    f.username.toLocaleLowerCase("tr-TR") ===
                    (inspectedUser.username || inspectedUser.name).toLocaleLowerCase("tr-TR")
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

const styles = StyleSheet.create({
  gameScroll: { flexGrow: 1, paddingBottom: 50 },
  gameHeader: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  exitButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F5ED",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  soundToggleBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F5ED",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  exitText: { color: "#293541", fontSize: 25, lineHeight: 25 },
  gameMode: { color: "#293541", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  gameCode: { color: "#293541", fontSize: 9, marginTop: 2, fontWeight: "800", letterSpacing: 0.5 },
  liveChip: {
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  liveDot: { width: 6, height: 6, borderRadius: 5, backgroundColor: "#F0F5ED" },
  liveText: { color: "#2a9c7a", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  offlineBanner: {
    marginTop: 6,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  offlineText: { color: "#9c6666", fontSize: 11, fontWeight: "900" },
  statusRail: {
    marginTop: 7,
    minHeight: 48,
    backgroundColor: "#F0F5ED",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusRailFinal: { backgroundColor: "#FFF0E8", borderColor: "#DCE1D7" },
  railLabel: { color: "#293541", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  timerValue: {
    color: "#293541",
    fontSize: 19,
    lineHeight: 21,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  timerValueFinal: { color: "#9c656c" },
  battleBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 5,
    maxWidth: "64%",
  },
  multiplierBadge: {
    backgroundColor: "rgba(234, 179, 8, 0.15)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  multiplierText: { color: "#817a46", fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
  streakBadge: {
    backgroundColor: "#F0F5ED",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  streakText: { color: "#5b8571", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 7 },
  floatingEmoteBadge: {
    position: "absolute",
    zIndex: 99,
    top: -14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "#F0F5ED",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  floatingEmoteText: { fontSize: 22 },
  vsMark: { width: 28, alignItems: "center" },
  vsText: { color: "#293541", fontSize: 10, fontWeight: "900" },
  statsRow: {
    minHeight: 47,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "#F0F5ED",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  statCell: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 24, backgroundColor: "rgba(148, 163, 184, 0.15)" },
  statLabel: { color: "#293541", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  statValue: { color: "#293541", fontSize: 11, fontWeight: "900", marginTop: 2 },
  statValuePositive: { color: "#0faa77" },
  statValueNegative: { color: "#ed4343" },
  emoteBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F0F5ED",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    marginVertical: 6,
  },
  emoteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  emoteBtnText: { fontSize: 20 },
  targetCard: { alignItems: "center", paddingTop: 15, paddingBottom: 11 },
  targetLabel: { color: "#293541", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  targetWord: {
    color: "#0faa77",
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  disconnectBox: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    alignItems: "center",
  },
  targetTip: {
    color: "#293541",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
    maxWidth: "100%",
    paddingHorizontal: 12,
    textAlign: "center",
  },
  board: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#F0F5ED",
    borderRadius: 26,
    padding: 4,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    overflow: "hidden",
    userSelect: "none",
    touchAction: "none",
  } as any,
  wordTray: {
    minHeight: 82,
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: "#F0F5ED",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  wordTrayInvalid: { borderColor: "#DCE1D7", backgroundColor: "#FFF0E8" },
  wordTrayAccepted: { borderColor: "#DCE1D7", backgroundColor: "#F0F5ED" },
  wordLabel: { color: "#293541", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  drawnWord: {
    color: "#293541",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 3,
  },
  drawnWordEmpty: { color: "#293541", fontSize: 10, letterSpacing: 0.5 },
  routeHint: { color: "#293541", fontSize: 8, fontWeight: "800", marginTop: 3 },
  wordActions: { position: "absolute", right: 10, top: 19, gap: 8, alignItems: "flex-end" },
  clearWord: { paddingVertical: 2 },
  clearWordText: { color: "#ef3e5c", fontSize: 9, fontWeight: "900" },
  submitWord: {
    backgroundColor: "#aef5e0",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  submitWordText: { color: "#293541", fontSize: 9, fontWeight: "900" },
  disabledButton: { opacity: 0.46 },
  activeRouteCard: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: "#F0F5ED",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    padding: 14,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  activeRouteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  activeRouteTitle: { color: "#293541", fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  activeRouteBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  activeRouteBadgeText: { fontSize: 10, fontWeight: "900" },
  activeRouteClose: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeRouteCloseText: { color: "#9c6666", fontSize: 10, fontWeight: "800" },
  activeRouteFlow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  activeRouteChip: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF4FC",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 10,
    minWidth: 36,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  activeRouteChipStart: { backgroundColor: "#F0F5ED", borderColor: "#DCE1D7", borderWidth: 1.5 },
  activeRouteChipEnd: {
    backgroundColor: "rgba(220, 38, 38, 0.25)",
    borderColor: "#DCE1D7",
    borderWidth: 1.5,
  },
  activeRouteChipText: { color: "#293541", fontSize: 14, fontWeight: "900" },
  activeRouteChipTextStart: { color: "#279f73" },
  activeRouteChipTextEnd: { color: "#bf5757" },
  activeRouteChipSub: { color: "#293541", fontSize: 8, fontWeight: "800", marginTop: 1 },
  activeRouteArrow: { fontSize: 14, fontWeight: "900", marginHorizontal: 1 },
  activeRouteDefBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#DCE1D7",
  },
  activeRouteDefLabel: {
    color: "#219d8d",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  activeRouteDefText: {
    color: "#293541",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
    fontWeight: "500",
  },
  foundPanel: {
    marginTop: 9,
    borderRadius: 16,
    backgroundColor: "#F0F5ED",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    padding: 12,
  },
  foundLabel: { color: "#293541", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  routeExploreHint: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 2,
    textAlign: "center",
  },
  foundTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  foundTag: {
    backgroundColor: "#EDF4FC",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  foundTagText: { color: "#293541", fontSize: 11, fontWeight: "900" },
  foundTagMissedText: { color: "#9c6666", fontSize: 11, fontWeight: "900" },
  foundEmpty: { color: "#293541", fontSize: 11 },
  resultPanel: { alignItems: "center", marginTop: 10 },
  resultTitle: { color: "#293541", fontSize: 17, fontWeight: "900", letterSpacing: 0.2 },
  resultCopy: { color: "#293541", fontSize: 12, marginTop: 3 },
  viewResultsButton: {
    marginTop: 10,
    marginBottom: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(62, 232, 181, 0.15)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    alignItems: "center",
    alignSelf: "stretch",
  },
  viewResultsButtonText: {
    color: "#2a9c7a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  primaryButton: {
    marginTop: 18,
    height: 58,
    backgroundColor: "#faebc3",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#DCE1D7",
  },
  rematchButton: { alignSelf: "stretch", marginTop: 8, height: 46 },
  primaryButtonText: { color: "#293541", fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
  primaryButtonArrow: { color: "#293541", fontSize: 24, fontWeight: "600" },
  returnHomeButton: {
    marginTop: 10,
    height: 48,
    alignSelf: "stretch",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  returnHomeButtonText: {
    color: "#293541",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  notice: {
    color: "#293541",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 15,
    paddingHorizontal: 15,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
