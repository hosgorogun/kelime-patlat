import {
  createSoloBoard,
  ARCADE_INITIAL_TIME,
  MAX_ARCADE_TIME,
  getNextArcadeSeed,
  getArcadeBoardClearBonus,
  calculateArcadeCombo,
} from "../shared/solo";
import type { BoardSize } from "../shared/game";

interface PlayerProfile {
  name: string;
  // Seconds per word on each board size
  timePerWord: Record<number, { min: number; max: number }>;
}

const PLAYERS: PlayerProfile[] = [
  {
    name: "Usta / Hızlı Oyuncu",
    timePerWord: {
      4: { min: 3.5, max: 6.0 },
      6: { min: 5.5, max: 8.5 },
      8: { min: 7.5, max: 11.0 },
      10: { min: 9.0, max: 13.0 },
    },
  },
  {
    name: "Standart / Ortalama Oyuncu",
    timePerWord: {
      4: { min: 6.0, max: 9.5 },
      6: { min: 9.0, max: 13.5 },
      8: { min: 12.0, max: 17.0 },
      10: { min: 14.0, max: 20.0 },
    },
  },
  {
    name: "Rahat / Yeni Başlayan",
    timePerWord: {
      4: { min: 8.0, max: 13.0 },
      6: { min: 13.0, max: 19.0 },
      8: { min: 16.0, max: 24.0 },
      10: { min: 19.0, max: 28.0 },
    },
  },
];

function getBoardSizeForSeed(seed: number): BoardSize {
  if (seed <= 15) return 4;
  if (seed <= 45) return 6;
  if (seed <= 75) return 8;
  return 10;
}

function simulateArcadeGame(player: PlayerProfile, maxBoards = 30) {
  let seconds = ARCADE_INITIAL_TIME;
  let score = 0;
  let wordsFound = 0;
  let boardsCleared = 0;
  let levelSeed = Math.floor(Math.random() * 15) + 1;
  let variation = 1;
  let totalTimePlayed = 0;

  let comboCount = 0;

  const boardLogs: {
    boardIndex: number;
    size: number;
    words: number;
    scoreAtStart: number;
    secondsAtStart: number;
    secondsAtEnd: number;
    timeSpentOnBoard: number;
    cleared: boolean;
  }[] = [];

  while (seconds > 0 && boardsCleared < maxBoards) {
    const challenge = createSoloBoard(levelSeed, variation, "general");
    const size = challenge.size;
    const words = challenge.words;
    const speed = player.timePerWord[size] || { min: 8, max: 12 };

    const boardStartSeconds = seconds;
    const boardStartScore = score;
    let timeSpentOnBoard = 0;
    let boardCleared = true;

    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      const word = words[wIdx]!;
      const rand = Math.random();
      const timeToFind = speed.min + rand * (speed.max - speed.min);

      if (seconds < timeToFind) {
        totalTimePlayed += seconds;
        timeSpentOnBoard += seconds;
        seconds = 0;
        boardCleared = false;
        break;
      }

      seconds -= timeToFind;
      timeSpentOnBoard += timeToFind;
      totalTimePlayed += timeToFind;

      // Combo check: if found within 7 seconds of previous word, increase combo
      if (timeToFind <= 7.0) {
        comboCount++;
      } else {
        comboCount = 1;
      }

      // Combo bonus
      const comboInfo = calculateArcadeCombo(comboCount);

      // Base word rewards
      const baseScoreGain = word.length * 10;
      const totalScoreGain = baseScoreGain + comboInfo.bonusScore;
      score += totalScoreGain;
      wordsFound++;

      // Time bonus per word: Math.min(8, word.length) + combo bonus
      const wordTimeBonus = Math.min(8, word.length) + comboInfo.bonusSeconds;
      seconds = Math.min(MAX_ARCADE_TIME, seconds + wordTimeBonus);
    }

    if (boardCleared) {
      boardsCleared++;
      const nextSeed = getNextArcadeSeed(score, levelSeed);
      const nextSize = getBoardSizeForSeed(nextSeed);
      const boardClearBonus = getArcadeBoardClearBonus(size, nextSize);

      seconds = Math.min(MAX_ARCADE_TIME, seconds + boardClearBonus);

      boardLogs.push({
        boardIndex: boardsCleared,
        size,
        words: words.length,
        scoreAtStart: boardStartScore,
        secondsAtStart: Math.round(boardStartSeconds),
        secondsAtEnd: Math.round(seconds),
        timeSpentOnBoard: Math.round(timeSpentOnBoard),
        cleared: true,
      });

      levelSeed = nextSeed;
      variation++;
    } else {
      boardLogs.push({
        boardIndex: boardsCleared + 1,
        size,
        words: words.length,
        scoreAtStart: boardStartScore,
        secondsAtStart: Math.round(boardStartSeconds),
        secondsAtEnd: 0,
        timeSpentOnBoard: Math.round(timeSpentOnBoard),
        cleared: false,
      });
      break;
    }
  }

  return {
    player: player.name,
    finalScore: score,
    wordsFound,
    boardsCleared,
    totalTimePlayed: Math.round(totalTimePlayed),
    finalSeconds: Math.round(seconds),
    boardLogs,
  };
}

console.log("===============================================================");
console.log("             ARCADE MODU DETAYLI OYNANIŞ SİMÜLASYONU");
console.log("===============================================================\n");

for (const player of PLAYERS) {
  console.log(`\n-------------------------------------------------------------`);
  console.log(`OYUNCU TİPİ: ${player.name}`);
  console.log(`-------------------------------------------------------------`);
  
  // Run 15 games to get solid averages and distributions
  const games = Array.from({ length: 15 }, () => simulateArcadeGame(player));
  const avgScore = Math.round(games.reduce((a, g) => a + g.finalScore, 0) / games.length);
  const avgBoards = (games.reduce((a, g) => a + g.boardsCleared, 0) / games.length).toFixed(1);
  const avgWords = (games.reduce((a, g) => a + g.wordsFound, 0) / games.length).toFixed(1);
  const avgTime = Math.round(games.reduce((a, g) => a + g.totalTimePlayed, 0) / games.length);

  console.log(`Ortalama Skor: ${avgScore} Puan`);
  console.log(`Ortalama Temizlenen Tahta: ${avgBoards}`);
  console.log(`Ortalama Bulunan Kelime: ${avgWords}`);
  console.log(`Ortalama Hayatta Kalma Süresi: ${avgTime} saniye (${(avgTime / 60).toFixed(1)} dakika)`);

  console.log(`\nÖrnek Maçın Tahta Akışı:`);
  console.log(`Tahta | Izgara | Kelime | Başlangıç Süresi | Kalan Süre | Harcanan Süre | Skor | Durum`);
  console.log(`------+--------+--------+------------------+------------+---------------+------+-------`);
  for (const b of games[0]!.boardLogs.slice(0, 10)) {
    console.log(
      `${String(b.boardIndex).padStart(5)} | ` +
      `${String(b.size + "x" + b.size).padStart(6)} | ` +
      `${String(b.words).padStart(6)} | ` +
      `${String(b.secondsAtStart + "s").padStart(16)} | ` +
      `${String(b.secondsAtEnd + "s").padStart(10)} | ` +
      `${String(b.timeSpentOnBoard + "s").padStart(13)} | ` +
      `${String(b.scoreAtStart).padStart(4)} | ` +
      `${b.cleared ? "Temizlendi" : "SÜRE BİTTİ"}`
    );
  }
}
