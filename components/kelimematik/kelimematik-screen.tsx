import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useProgression } from "@/context";
import {
  KelimematikState,
  KelimematikTile,
  createInitialKelimematik,
  dropKelimematikLetter,
  popKelimematikWord,
  applyTornadoBooster,
  applyVowelShowerBooster,
} from "@/shared/kelimematik";
import { isValidKelimematikWord } from "@/shared/kelimematik-dict";
import { applyKelimematikProgress } from "@/shared/progression/match-progress";
import { GameCountdownOverlay } from "@/components/game/game-countdown-overlay";
import { GameModeInfoModal } from "@/components/modals/game-mode-info-modal";
import { ModernAlertModal, type ModernAlertData } from "@/components/modals/modern-alert-modal";
import { haptics } from "@/lib/haptics";
import { gameSfx } from "@/lib/game-sfx";

export function KelimematikScreen() {
  const insets = useSafeAreaInsets();
  const { setScreen } = useNavigation();
  const { setProgress } = useProgression();

  const [gameState, setGameState] = useState<KelimematikState>(() =>
    createInitialKelimematik(5, 8)
  );
  const [selectedTiles, setSelectedTiles] = useState<{ col: number; row: number; letter: string }[]>([]);
  const [wordFeedback, setWordFeedback] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [cascadeToast, setCascadeToast] = useState<string | null>(null);
  const [exitAlert, setExitAlert] = useState<ModernAlertData | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [tornadoCharges, setTornadoCharges] = useState(2);
  const [vowelCharges, setVowelCharges] = useState(2);
  const [rewardSummary, setRewardSummary] = useState<{
    xpGained: number;
    coinsGained: number;
    isNewHighScore: boolean;
  } | null>(null);
  const wordsFoundListRef = useRef<string[]>([]);
  const progressAppliedRef = useRef(false);

  // Çıkış onay diyaloğu
  const handleExitPress = useCallback(() => {
    // Oyun zaten bitmişse direkt çık
    if (gameState.gameOver) {
      setScreen("home");
      return;
    }

    haptics.light();
    setExitAlert({
      icon: "⚠️",
      kicker: "OYUNDAN AYRIL",
      title: "Oyundan çıkmak istiyor musunuz?",
      message: `Şu ana kadar ${gameState.score} puan topladınız. Çıkarsanız mevcut oyununuz sonlanacak.`,
      accentColor: "#F43F5E",
      primaryButton: {
        text: "Evet, Çık",
        color: "#EF4444",
        icon: "🚪",
        onPress: () => {
          setExitAlert(null);
          setScreen("home");
        },
      },
      secondaryButton: {
        text: "Oynamaya Devam Et",
        onPress: () => setExitAlert(null),
      },
      onDismiss: () => setExitAlert(null),
    });
  }, [gameState.gameOver, gameState.score, setScreen]);

  // Donanım geri tuşu desteği (Android BackHandler)
  useEffect(() => {
    const onBackPress = () => {
      handleExitPress();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [handleExitPress]);

  // Screen Shake Animasyonu (5+ harf ve bombalarda ekranda sarsıntı)
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const triggerScreenShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 3, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 30, useNativeDriver: true }),
    ]).start();
  };

  // Geri Sayım Döngüsü
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 900);
      return () => clearTimeout(timer);
    } else {
      const finishTimer = setTimeout(() => {
        setCountdown(null);
      }, 700);
      return () => clearTimeout(finishTimer);
    }
  }, [countdown]);

  // Emniyet zamanlayıcısı: Geri sayım asla 4.5 saniyeden uzun ekranda asılı kalamaz
  useEffect(() => {
    if (countdown === null) return;
    const safetyTimer = setTimeout(() => {
      setCountdown(null);
    }, 4500);
    return () => clearTimeout(safetyTimer);
  }, []);

  // Harf Düşme Döngüsü (Wave ve kelime sayısına göre hızlanan dinamik tetris)
  useEffect(() => {
    if (countdown !== null || gameState.gameOver) return;

    // Dalga arttıkça harfler daha hızlı ve heyecanlı düşer
    const baseSpeed = Math.max(1500, 3500 - (gameState.wave - 1) * 350);
    const timer = setInterval(() => {
      setGameState((prev) => dropKelimematikLetter(prev));
    }, baseSpeed);

    return () => clearInterval(timer);
  }, [countdown, gameState.gameOver, gameState.wave, gameState.freezeSecondsRemaining]);

  // Hücre seçimi (kelime oluşturma)
  const handleTilePress = (col: number, row: number, tile: KelimematikTile) => {
    if (gameState.gameOver || countdown !== null) return;
    setWordFeedback(null);

    // Geri alma: Son seçilen taşa tekrar basılırsa çıkar
    const existingIndex = selectedTiles.findIndex((t) => t.col === col && t.row === row);
    if (existingIndex !== -1) {
      if (existingIndex === selectedTiles.length - 1) {
        haptics.light();
        setSelectedTiles((prev) => prev.slice(0, -1));
      }
      return;
    }

    haptics.light();
    setSelectedTiles((prev) => [...prev, { col, row, letter: tile?.letter || "" }]);
  };

  const currentWord = selectedTiles.map((t) => t?.letter || "").join("");
  const isValidWord = isValidKelimematikWord(currentWord);

  // Kelimeyi patlat
  const handlePopWord = () => {
    if (currentWord.length < 3) {
      haptics.error();
      setWordFeedback("En az 3 harfli bir sözcük oluşturmalısın!");
      return;
    }

    // Gerçek Türkçe Sözlük Doğrulaması
    if (!isValidWord) {
      haptics.error();
      gameSfx.rejected();
      setWordFeedback(`"${currentWord}" sözlükte bulunamadı!`);
      setGameState((prev) => ({ ...prev, combo: 0 }));
      return;
    }

    haptics.success();
    gameSfx.accepted(currentWord.length);

    // Uzun kelimelerde ekranda tatmin edici sarsıntı
    if (currentWord.length >= 5) {
      triggerScreenShake();
    }

    setWordFeedback(null);

    wordsFoundListRef.current.push(currentWord);

    setGameState((prev) => {
      const next = popKelimematikWord(
        prev,
        currentWord,
        selectedTiles.map((t) => ({ col: t.col, row: t.row }))
      );

      // Zincirleme reaksiyon olduysa bildir ve kelimeleri kaydet
      if (next.lastCascadeWords.length > 0) {
        wordsFoundListRef.current.push(...next.lastCascadeWords);
        setCascadeToast(`⚡ ZİNCİRLEME REAKSİYON: "${next.lastCascadeWords[0]}" (+Bonus Puan!)`);
        setTimeout(() => setCascadeToast(null), 2500);
      }
      return next;
    });

    setSelectedTiles([]);
  };

  // Oyun Bittiğinde (Game Over) İlerleme ve Ödülleri Uygula
  useEffect(() => {
    if (gameState.gameOver && !progressAppliedRef.current) {
      progressAppliedRef.current = true;
      haptics.victory();

      setProgress((prevProgress) => {
        const { updatedProgress, xpGained, coinsGained, isNewHighScore } = applyKelimematikProgress(
          prevProgress,
          gameState.score,
          gameState.wordsFound,
          gameState.wave,
          wordsFoundListRef.current
        );
        setRewardSummary({ xpGained, coinsGained, isNewHighScore });
        return updatedProgress;
      });
    }
  }, [gameState.gameOver, gameState.score, gameState.wordsFound, gameState.wave, setProgress]);

  const handleClearSelection = () => {
    haptics.light();
    setSelectedTiles([]);
    setWordFeedback(null);
  };

  const handleRestart = () => {
    haptics.select();
    progressAppliedRef.current = false;
    wordsFoundListRef.current = [];
    setRewardSummary(null);
    setTornadoCharges(2);
    setVowelCharges(2);
    setCountdown(3);
    setGameState(createInitialKelimematik(5, 8));
    setSelectedTiles([]);
    setWordFeedback(null);
  };

  // Güçlendirici: Tornado (En dolu sütunu süpür)
  const handleUseTornado = () => {
    if (gameState.gameOver || countdown !== null) return;
    if (tornadoCharges <= 0) {
      haptics.error();
      setCascadeToast("⚠️ Süpürge hakkınız bitti!");
      setTimeout(() => setCascadeToast(null), 1800);
      return;
    }
    haptics.select();
    triggerScreenShake();
    setTornadoCharges((prev) => prev - 1);
    setGameState((prev) => applyTornadoBooster(prev));
    setCascadeToast("🌪️ TORNADO: Sütun tamamen süpürüldü!");
    setTimeout(() => setCascadeToast(null), 2000);
  };

  // Güçlendirici: Sesli Harf Yağmuru
  const handleUseVowels = () => {
    if (gameState.gameOver || countdown !== null) return;
    if (vowelCharges <= 0) {
      haptics.error();
      setCascadeToast("⚠️ Sesli harf hakkınız bitti!");
      setTimeout(() => setCascadeToast(null), 1800);
      return;
    }
    haptics.select();
    setVowelCharges((prev) => prev - 1);
    setGameState((prev) => applyVowelShowerBooster(prev));
    setCascadeToast("💧 SESLİ YAĞMURU: Tahtaya sesli harfler eklendi!");
    setTimeout(() => setCascadeToast(null), 2000);
  };

  return (
    <Animated.View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          transform: [{ translateX: shakeAnim }],
        },
      ]}
    >
      {/* 1. ÜST HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.exitPill} onPress={handleExitPress}>
          <Text style={styles.exitPillText}>‹ Ana Menü</Text>
        </TouchableOpacity>

        <View style={styles.titleCenter}>
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeIcon}>⚡</Text>
            <Text style={styles.titleBadgeText}>KELİMEMATİK</Text>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                setShowInfoModal(true);
              }}
              style={styles.infoBadge}
            >
              <Text style={styles.infoBadgeText}>ⓘ</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.titleTagline}>DALGA {gameState.wave} · HAYATTA KAL</Text>
        </View>

        <TouchableOpacity style={styles.restartPill} onPress={handleRestart}>
          <Text style={styles.restartPillText}>↺ Yenile</Text>
        </TouchableOpacity>
      </View>

      {/* 2. STATS & GÖSTERGE DASHBOARD */}
      <View style={styles.statsCard}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>SKOR</Text>
          <Text style={styles.statValue}>{gameState.score}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCell}>
          <Text style={styles.statLabel}>DALGA</Text>
          <Text style={[styles.statValue, { color: "#0284C7" }]}>W{gameState.wave}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCell}>
          <Text style={styles.statLabel}>KOMBO</Text>
          <Text style={[styles.statValue, { color: gameState.combo >= 2 ? "#D97706" : "#0F172A" }]}>
            {gameState.combo > 0 ? `${gameState.combo}x 🔥` : "1x"}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCell}>
          <Text style={styles.statLabel}>TEHLİKE</Text>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  gameState.dangerLevel > 75
                    ? "#DC2626"
                    : gameState.dangerLevel > 45
                    ? "#D97706"
                    : "#059669",
              },
            ]}
          >
            %{gameState.dangerLevel}
          </Text>
        </View>

        {gameState.freezeSecondsRemaining > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>DONMA</Text>
              <Text style={[styles.statValue, { color: "#0284C7" }]}>
                ❄️ {gameState.freezeSecondsRemaining}s
              </Text>
            </View>
          </>
        )}
      </View>

      {/* 3. OYUN TAHTASI */}
      <View style={styles.boardFrame}>
        {/* Tavan Sınırı Çizgisi */}
        <View style={styles.limitHeader}>
          <View style={styles.limitDash} />
          <Text style={styles.limitLabel}>▲ TAVAN SINIRI ▲</Text>
          <View style={styles.limitDash} />
        </View>

        {/* Dikey Harf Sütunları */}
        <View style={styles.columnsWrapper}>
          {gameState.columns.map((col, colIdx) => (
            <View key={`col_${colIdx}`} style={styles.column}>
              <View style={{ flex: 1 }} />
              {col.map((tile, rowIdx) => {
                const isSelected = selectedTiles.some((t) => t.col === colIdx && t.row === rowIdx);
                const isBomb = tile.isSpecial === "bomb";
                const isFreeze = tile.isSpecial === "freeze";
                const isGold = tile.isSpecial === "gold";

                return (
                  <TouchableOpacity
                    key={tile.id || `tile_${colIdx}_${rowIdx}`}
                    activeOpacity={0.75}
                    onPress={() => handleTilePress(colIdx, rowIdx, tile)}
                    style={[
                      styles.tile,
                      isBomb && styles.tileBomb,
                      isFreeze && styles.tileFreeze,
                      isGold && styles.tileGold,
                      isSelected && styles.tileSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tileLetter,
                        isSelected && styles.tileLetterSelected,
                        isBomb && styles.tileLetterBomb,
                        isFreeze && styles.tileLetterFreeze,
                        isGold && styles.tileLetterGold,
                      ]}
                    >
                      {tile.letter}
                    </Text>
                    {isBomb && <Text style={styles.badge}>💣</Text>}
                    {isFreeze && <Text style={styles.badge}>❄️</Text>}
                    {isGold && <Text style={styles.badge}>⭐</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Zincirleme & Hata Toast Bildirimi */}
      {cascadeToast ? (
        <View style={styles.cascadeBanner}>
          <Text style={styles.cascadeBannerText}>{cascadeToast}</Text>
        </View>
      ) : wordFeedback ? (
        <View style={styles.feedbackToast}>
          <Text style={styles.feedbackToastText}>{wordFeedback}</Text>
        </View>
      ) : null}

      {/* 4. TAKTİKSEL GÜÇLENDİRİCİLER & BOOSTER ÇUBUĞU */}
      <View style={styles.boosterRow}>
        <TouchableOpacity
          style={[styles.boosterBtn, tornadoCharges <= 0 && { opacity: 0.45 }]}
          onPress={handleUseTornado}
          disabled={tornadoCharges <= 0}
        >
          <Text style={styles.boosterIcon}>🌪️</Text>
          <Text style={styles.boosterText}>Süpürge ({tornadoCharges})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boosterBtn, vowelCharges <= 0 && { opacity: 0.45 }]}
          onPress={handleUseVowels}
          disabled={vowelCharges <= 0}
        >
          <Text style={styles.boosterIcon}>💧</Text>
          <Text style={styles.boosterText}>Sesli Harf ({vowelCharges})</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {selectedTiles.length > 0 && (
          <TouchableOpacity onPress={handleClearSelection} style={styles.clearSelectionBtn}>
            <Text style={styles.clearSelectionText}>Temizle ✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 5. ALT DOCK (Kelime Göstergesi ve Patlat Butonu) */}
      <View style={styles.dockWrapper}>
        <View style={[styles.wordDisplay, isValidWord && styles.wordDisplayValid]}>
          <Text
            numberOfLines={1}
            style={[styles.wordDisplayText, isValidWord && styles.wordDisplayTextValid]}
          >
            {currentWord || "Harflere dokunarak sözcük oluştur..."}
          </Text>
        </View>

        <TouchableOpacity
          disabled={!isValidWord || gameState.gameOver}
          onPress={handlePopWord}
          activeOpacity={0.85}
          style={[
            styles.actionButton,
            isValidWord ? styles.actionButtonValid : styles.actionButtonDisabled,
          ]}
        >
          <Text style={styles.actionButtonText}>
            {isValidWord
              ? `PATLAT ▶  (+${currentWord.length * 20 * (gameState.combo > 0 ? 1.5 : 1)})`
              : currentWord.length >= 3
              ? "SÖZLÜKTE YOK ✕"
              : "KELİME OLUŞTURUN"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 6. GAME OVER PENCERESİ */}
      {gameState.gameOver && (
        <View style={styles.gameOverBackdrop}>
          <View style={styles.gameOverDialog}>
            <Text style={styles.gameOverIcon}>💥</Text>
            <Text style={styles.gameOverTitle}>TAVAN AŞILDI!</Text>
            <Text style={styles.gameOverDesc}>
              Harfler tavan sınırına ulaştı ve oyun sonlandı.
            </Text>

            <View style={styles.gameOverStatBox}>
              {rewardSummary?.isNewHighScore && (
                <View style={styles.newRecordBadge}>
                  <Text style={styles.newRecordBadgeText}>🏆 YENİ REKOR!</Text>
                </View>
              )}
              <Text style={styles.gameOverStatLabel}>TOPLAM SKOR</Text>
              <Text style={styles.gameOverStatValue}>{gameState.score}</Text>
              <Text style={styles.gameOverSubStat}>
                Dalga: {gameState.wave} · Bulunan: {gameState.wordsFound} Kelime
              </Text>

              {rewardSummary && (
                <View style={styles.rewardBadgesRow}>
                  <View style={styles.rewardPill}>
                    <Text style={styles.rewardPillIcon}>⚡</Text>
                    <Text style={styles.rewardPillText}>+{rewardSummary.xpGained} XP</Text>
                  </View>
                  <View style={[styles.rewardPill, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
                    <Text style={styles.rewardPillIcon}>🪙</Text>
                    <Text style={[styles.rewardPillText, { color: "#B45309" }]}>+{rewardSummary.coinsGained} Çip</Text>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.dialogButton} onPress={handleRestart}>
              <Text style={styles.dialogButtonText}>YENİDEN DENE ↺</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dialogButton, { backgroundColor: "#F1F5F9", borderColor: "#CBD5E1", borderBottomColor: "#94A3B8", marginTop: 8 }]}
              onPress={() => setScreen("home")}
            >
              <Text style={[styles.dialogButtonText, { color: "#475569" }]}>ANA MENÜYE DÖN</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 7. GERİ SAYIM ANİMASYONU */}
      <GameCountdownOverlay
        countdown={countdown}
        title="KELİMEMATİK BAŞLIYOR"
        subtitle="Düşen harfleri patlat, tavanı aşma!"
        icon="⚡"
      />

      {/* 8. ÇIKIŞ ONAY MODALI */}
      <ModernAlertModal
        alert={exitAlert}
        onDismiss={() => setExitAlert(null)}
      />

      {/* 9. NASIL OYNANIR? INFO MODAL */}
      <GameModeInfoModal
        visible={showInfoModal}
        mode="kelimematik"
        onClose={() => setShowInfoModal(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  exitPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  exitPillText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
  },
  titleCenter: {
    alignItems: "center",
  },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  titleBadgeIcon: {
    fontSize: 18,
  },
  titleBadgeText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.6,
  },
  infoBadge: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.3)",
  },
  infoBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0284C7",
  },
  titleTagline: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0284C7",
    marginTop: 1,
    letterSpacing: 0.5,
  },
  restartPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  restartPillText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 8,
  },
  statCell: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#E2E8F0",
  },
  boardFrame: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    padding: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: "relative",
  },
  limitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: "#FECDD3",
    marginBottom: 4,
  },
  limitDash: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#FECDD3",
  },
  limitLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#E11D48",
    letterSpacing: 1,
  },
  columnsWrapper: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
    marginHorizontal: 2.5,
    justifyContent: "flex-end",
  },
  tile: {
    height: 52,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    borderBottomWidth: 3.5,
    position: "relative",
  },
  tileLetter: {
    fontSize: 23,
    fontWeight: "900",
    color: "#1E293B",
  },
  tileSelected: {
    backgroundColor: "#0284C7",
    borderColor: "#0369A1",
    borderBottomWidth: 2,
    transform: [{ translateY: 1.5 }],
  },
  tileLetterSelected: {
    color: "#FFFFFF",
  },
  tileBomb: {
    backgroundColor: "#FFF1F2",
    borderColor: "#F43F5E",
  },
  tileLetterBomb: {
    color: "#E11D48",
  },
  tileFreeze: {
    backgroundColor: "#F0F9FF",
    borderColor: "#38BDF8",
  },
  tileLetterFreeze: {
    color: "#0284C7",
  },
  tileGold: {
    backgroundColor: "#FFFBEB",
    borderColor: "#F59E0B",
  },
  tileLetterGold: {
    color: "#B45309",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 3,
    fontSize: 10,
  },
  cascadeBanner: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    alignItems: "center",
    marginVertical: 4,
  },
  cascadeBannerText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#B45309",
  },
  feedbackToast: {
    backgroundColor: "#FFF1F2",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#FECDD3",
    alignItems: "center",
    marginVertical: 4,
  },
  feedbackToastText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E11D48",
  },
  boosterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  boosterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 5,
  },
  boosterIcon: {
    fontSize: 14,
  },
  boosterText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
  },
  clearSelectionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
  },
  clearSelectionText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },
  dockWrapper: {
    marginTop: 6,
    gap: 8,
  },
  wordDisplay: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  wordDisplayValid: {
    borderColor: "#059669",
    backgroundColor: "#ECFDF5",
  },
  wordDisplayText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 2,
  },
  wordDisplayTextValid: {
    color: "#059669",
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 4,
  },
  actionButtonValid: {
    backgroundColor: "#059669",
    borderBottomColor: "#047857",
  },
  actionButtonDisabled: {
    backgroundColor: "#CBD5E1",
    borderBottomColor: "#94A3B8",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  gameOverBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  gameOverDialog: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  gameOverIcon: {
    fontSize: 44,
    marginBottom: 6,
  },
  gameOverTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#E11D48",
  },
  gameOverDesc: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  gameOverStatBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  gameOverStatLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
  },
  gameOverStatValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
  },
  gameOverSubStat: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    marginTop: 4,
  },
  dialogButton: {
    width: "100%",
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderBottomWidth: 3.5,
    borderBottomColor: "#047857",
  },
  dialogButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  newRecordBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F59E0B",
    marginBottom: 6,
  },
  newRecordBadgeText: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "900",
  },
  rewardBadgesRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  rewardPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  rewardPillIcon: {
    fontSize: 12,
  },
  rewardPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#047857",
  },
});
