/**
 * Kelimematik - Zamana Karşı Hayatta Kalma (Survival Tetris / Flow Modu)
 * v3.0 Master Engine:
 * - Sesli/Sessiz Harf Dengeleyicisi (Vowel Injector)
 * - Özel Güçlendiriciler (Tornado Sütun Süpürme, Sesli Yağmuru, Zaman Dondurma)
 * - Zincirleme Reaksiyon & Dinamik Dalga (Wave System)
 * - Kombo & Çarpan Hesabı
 */

import { normalizeTrUpper } from "./tr-utils";
import { isValidKelimematikWord } from "./kelimematik-dict";

export type KelimematikTile = {
  id: string;
  letter: string;
  isSpecial?: "bomb" | "gold" | "freeze";
};

export type KelimematikState = {
  columns: KelimematikTile[][];
  width: number;
  maxHeight: number;
  score: number;
  wordsFound: number;
  wave: number;
  combo: number;
  freezeSecondsRemaining: number;
  dangerLevel: number;
  lastCascadeWords: string[];
  gameOver: boolean;
};

const VOWELS = ["A", "E", "I", "İ", "O", "Ö", "U", "Ü"];
const CONSONANTS = [
  "B", "C", "Ç", "D", "F", "G", "Ğ", "H", "J", "K", "L", "M", "N", "P", "R", "S", "Ş", "T", "V", "Y", "Z",
];

const BALANCED_TURKISH_POOL = [
  "A", "A", "A", "A", "A", "A",
  "E", "E", "E", "E", "E", "E",
  "İ", "İ", "İ", "İ",
  "K", "K", "K", "K",
  "L", "L", "L", "L",
  "M", "M", "M",
  "R", "R", "R", "R",
  "T", "T", "T",
  "N", "N", "N",
  "S", "S", "S",
  "B", "B",
  "D", "D",
  "O", "O",
  "U", "U",
  "Y", "Y",
  "Ç", "Ç",
  "Ş", "Ş",
  "G", "G",
  "Ü", "Ü",
  "Ö", "Ö",
  "P",
  "H",
  "Z",
  "V",
  "C",
  "I", "I",
  "F",
  "Ğ",
  "J",
];

let tileIdSeq = 0;
function createTile(letter: string, specialChance = 0.08): KelimematikTile {
  tileIdSeq++;
  const roll = Math.random();
  let isSpecial: KelimematikTile["isSpecial"] = undefined;
  if (roll < specialChance) {
    isSpecial = roll < 0.03 ? "bomb" : roll < 0.06 ? "freeze" : "gold";
  }
  return {
    id: `kt_${tileIdSeq}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    letter,
    isSpecial,
  };
}

function getRandomLetter(stateColumns: KelimematikTile[][], random = Math.random): string {
  // Akıllı Sesli Harf Dengeleyicisi: Tahtadaki toplam sesli oranı %28'in altına düşerse garanti sesli at!
  let vowelCount = 0;
  let totalTiles = 0;
  for (const col of stateColumns) {
    for (const t of col) {
      totalTiles++;
      if (VOWELS.includes(t.letter)) vowelCount++;
    }
  }

  if (totalTiles > 6 && vowelCount / totalTiles < 0.28) {
    return VOWELS[Math.floor(random() * VOWELS.length)]!;
  }

  return BALANCED_TURKISH_POOL[Math.floor(random() * BALANCED_TURKISH_POOL.length)]!;
}

export function createInitialKelimematik(width = 5, maxHeight = 8): KelimematikState {
  const columns: KelimematikTile[][] = [];
  for (let c = 0; c < width; c++) {
    const col: KelimematikTile[] = [];
    const initialCount = 4; // Başlangıçta dolu ve tok bir zemin (4 sıra)
    for (let r = 0; r < initialCount; r++) {
      const letter = BALANCED_TURKISH_POOL[Math.floor(Math.random() * BALANCED_TURKISH_POOL.length)]!;
      col.push(createTile(letter, 0.05));
    }
    columns.push(col);
  }

  return {
    columns,
    width,
    maxHeight,
    score: 0,
    wordsFound: 0,
    wave: 1,
    combo: 0,
    freezeSecondsRemaining: 0,
    dangerLevel: 0,
    lastCascadeWords: [],
    gameOver: false,
  };
}

export function dropKelimematikLetter(state: KelimematikState, random = Math.random): KelimematikState {
  if (state.gameOver) return state;

  if (state.freezeSecondsRemaining > 0) {
    return {
      ...state,
      freezeSecondsRemaining: state.freezeSecondsRemaining - 1,
    };
  }

  const newColumns = state.columns.map((col) => [...col]);
  
  // En az dolu olan sütunlara öncelik ver
  const sortedColIndices = Array.from({ length: state.width }, (_, i) => i)
    .sort((a, b) => newColumns[a]!.length - newColumns[b]!.length);
  
  const targetCol = random() < 0.65 ? sortedColIndices[0]! : Math.floor(random() * state.width);
  const newLetter = getRandomLetter(newColumns, random);
  newColumns[targetCol]!.push(createTile(newLetter));

  let maxColHeight = 0;
  for (let c = 0; c < state.width; c++) {
    if (newColumns[c]!.length > maxColHeight) {
      maxColHeight = newColumns[c]!.length;
    }
  }

  const isGameOver = maxColHeight > state.maxHeight;
  const danger = Math.min(100, Math.round((maxColHeight / state.maxHeight) * 100));

  return {
    ...state,
    columns: newColumns,
    dangerLevel: danger,
    gameOver: isGameOver,
  };
}

/**
 * Kelime patlatma, yerçekimi düşüşü ve otomatik zincirleme reaksiyon kontrolü
 */
export function popKelimematikWord(
  state: KelimematikState,
  word: string,
  tiles: { col: number; row: number }[]
): KelimematikState {
  if (state.gameOver) return state;

  const newColumns = state.columns.map((col) => [...col]);

  let bombTriggered = false;
  let freezeGained = 0;
  let goldMultiplier = 1;

  for (const tile of tiles) {
    const tileItem = newColumns[tile.col]?.[tile.row];
    if (tileItem?.isSpecial === "bomb") bombTriggered = true;
    if (tileItem?.isSpecial === "freeze") freezeGained += 5;
    if (tileItem?.isSpecial === "gold") goldMultiplier *= 2;
  }

  // Seçilen taşları kaldır (Yukarıdan aşağı silerek indeks kaymasını önle)
  const sortedTiles = [...tiles].sort((a, b) => b.row - a.row);
  for (const tile of sortedTiles) {
    if (newColumns[tile.col] && newColumns[tile.col]![tile.row] !== undefined) {
      newColumns[tile.col]!.splice(tile.row, 1);
    }
  }

  // Bomba patladıysa en yüksek sütunun tepesini süpür
  if (bombTriggered) {
    const highestCol = Array.from({ length: state.width }, (_, i) => i)
      .sort((a, b) => newColumns[b]!.length - newColumns[a]!.length)[0]!;
    newColumns[highestCol] = newColumns[highestCol]!.slice(0, Math.max(0, newColumns[highestCol]!.length - 3));
  }

  // Zincirleme Reaksiyon (Cascade): Harfler düştükten sonra yan yana oluşan 4+ harfli otomatik kelimeleri kontrol et
  const cascadeWords: string[] = [];
  let cascadeBonusScore = 0;

  // Yatay otomatik kelime taraması (taban sıralardan yukarıya doğru kontrollü silme)
  for (let r = 2; r >= 0; r--) {
    let horizontalStr = "";
    for (let c = 0; c < state.width; c++) {
      horizontalStr += newColumns[c]?.[r]?.letter || " ";
    }
    const cleanWord = horizontalStr.trim();
    if (cleanWord.length >= 4 && isValidKelimematikWord(cleanWord)) {
      cascadeWords.push(cleanWord);
      cascadeBonusScore += cleanWord.length * 50;
      // Otomatik patlat ve yerçekiminin doğal akmasını sağla
      for (let c = 0; c < state.width; c++) {
        if (newColumns[c] && newColumns[c]![r] !== undefined) {
          newColumns[c]!.splice(r, 1);
        }
      }
    }
  }

  const nextCombo = state.combo + 1 + cascadeWords.length;
  const comboMultiplier = Math.min(4.0, 1 + nextCombo * 0.25);
  const baseScore = word.length * 20 * (word.length >= 5 ? 2 : 1);
  const finalWordScore = Math.round(baseScore * comboMultiplier * goldMultiplier) + cascadeBonusScore;

  const nextWordsFound = state.wordsFound + 1 + cascadeWords.length;
  const nextWave = Math.floor(nextWordsFound / 5) + 1; // Her 5 kelimede yeni dalga
  const nextScore = state.score + finalWordScore;

  let maxColHeight = 0;
  for (let c = 0; c < state.width; c++) {
    if (newColumns[c]!.length > maxColHeight) {
      maxColHeight = newColumns[c]!.length;
    }
  }
  const danger = Math.min(100, Math.round((maxColHeight / state.maxHeight) * 100));

  return {
    ...state,
    columns: newColumns,
    score: nextScore,
    wordsFound: nextWordsFound,
    wave: nextWave,
    combo: nextCombo,
    freezeSecondsRemaining: state.freezeSecondsRemaining + freezeGained,
    dangerLevel: danger,
    lastCascadeWords: cascadeWords,
    gameOver: false,
  };
}

/**
 * Taktiksel Güçlendirici: SÜPÜRGE / TORNADO (En yüksek sütunu tamamen temizler)
 */
export function applyTornadoBooster(state: KelimematikState): KelimematikState {
  if (state.gameOver) return state;

  const newColumns = state.columns.map((col) => [...col]);
  const highestCol = Array.from({ length: state.width }, (_, i) => i)
    .sort((a, b) => newColumns[b]!.length - newColumns[a]!.length)[0]!;

  newColumns[highestCol] = []; // Sütunu sıfırla

  let maxColHeight = 0;
  for (let c = 0; c < state.width; c++) {
    if (newColumns[c]!.length > maxColHeight) {
      maxColHeight = newColumns[c]!.length;
    }
  }
  const danger = Math.min(100, Math.round((maxColHeight / state.maxHeight) * 100));

  return {
    ...state,
    columns: newColumns,
    dangerLevel: danger,
  };
}

/**
 * Taktiksel Güçlendirici: SESLİ YAĞMURU (Rastgele 3 harfi sesli harfe çevirir)
 */
export function applyVowelShowerBooster(state: KelimematikState): KelimematikState {
  if (state.gameOver) return state;

  const newColumns = state.columns.map((col) => [...col]);
  let changed = 0;

  for (let c = 0; c < state.width && changed < 3; c++) {
    for (let r = 0; r < newColumns[c]!.length && changed < 3; r++) {
      if (!VOWELS.includes(newColumns[c]![r]!.letter)) {
        newColumns[c]![r] = {
          ...newColumns[c]![r]!,
          letter: VOWELS[Math.floor(Math.random() * VOWELS.length)]!,
        };
        changed++;
      }
    }
  }

  return {
    ...state,
    columns: newColumns,
  };
}

// Backward compatible aliases
export const useTornadoBooster = applyTornadoBooster;
export const useVowelShowerBooster = applyVowelShowerBooster;
