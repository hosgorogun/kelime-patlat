import { WORD_BANK, WORD_CATALOG, WORD_CATALOG_DATA, type WordDifficulty, type WordEntry } from "./word-catalog";

export { WORD_BANK, WORD_CATALOG, WORD_CATALOG_DATA, type WordDifficulty, type WordEntry } from "./word-catalog";

export const BOARD_SIZES = [4, 6, 8, 10] as const;
export type BoardSize = (typeof BOARD_SIZES)[number];

export const LIVE_FOUR_WORD_LENGTH_PATTERNS = [
  [3, 3, 4, 5],
  [3, 3, 5, 5],
  [3, 4, 4, 5],
  [3, 3, 4, 6],
] as const;

export function pickLiveFourWordLengths(random = Math.random) {
  return [...LIVE_FOUR_WORD_LENGTH_PATTERNS[Math.floor(random() * LIVE_FOUR_WORD_LENGTH_PATTERNS.length)]!];
}

export function getRoundDurationMs(size: BoardSize) {
  return size === 4 ? 55_000 : size === 6 ? 75_000 : size === 8 ? 90_000 : 110_000;
}

export function wordScoreMultiplier(length: number) {
  return length >= 7 ? 3 : length >= 5 ? 2 : 1;
}

export function botThinkDelayMs(size: BoardSize, random = Math.random) {
  const minimum = size === 4 ? 11_000 : size === 6 ? 12_000 : size === 8 ? 10_000 : 9_000;
  const spread = size === 4 ? 6_000 : size === 6 ? 6_000 : size === 8 ? 6_000 : 5_000;
  return minimum + Math.floor(random() * spread);
}

export type RoomStatus = "waiting" | "lobby" | "playing" | "finished";

export type GamePlayer = {
  id: string;
  name: string;
  isBot?: boolean;
  connected: boolean;
  ready: boolean;
  rematch: boolean;
};

export type FoundWord = {
  word: string;
  playerId: string;
  path: number[];
  hidden?: boolean;
};

export function maskOpponentFoundWords(foundWords: FoundWord[], viewerId: string, revealAll = false) {
  if (revealAll) return foundWords.map((entry) => ({ ...entry, hidden: false }));
  return foundWords.map((entry) => entry.playerId === viewerId ? entry : { ...entry, word: "", path: [], hidden: true });
}

export type RoomSnapshot = {
  code: string;
  size: BoardSize;
  status: RoomStatus;
  board: string[];
  wordsTotal: number;
  foundWords: FoundWord[];
  scores: Record<string, number>;
  players: GamePlayer[];
  winnerId: string | null;
  startedAt: number | null;
  message: string;
  botSelection?: number[];
  combos?: Record<string, number>;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  wins: number;
  matches: number;
  bestRound: number;
};

export const TURKISH_LETTERS = [
  "A", "B", "C", "Ç", "D", "E", "F", "G", "Ğ", "H", "I", "İ", "J", "K", "L", "M", "N", "O", "Ö", "P", "R", "S", "Ş", "T", "U", "Ü", "V", "Y", "Z",
];

export function fillBoardBlanks(board: string[], random = Math.random) {
  return board.map((letter) => letter || TURKISH_LETTERS[Math.floor(random() * TURKISH_LETTERS.length)]!);
}

export function isAdjacent(a: number, b: number, size: BoardSize) {
  const rowDistance = Math.abs(Math.floor(a / size) - Math.floor(b / size));
  const columnDistance = Math.abs((a % size) - (b % size));
  return rowDistance + columnDistance === 1;
}

export function advanceSelection(selection: number[], index: number, size: BoardSize) {
  const last = selection.at(-1);
  if (last === index) return selection;
  if (selection.length > 1 && selection.at(-2) === index) return selection.slice(0, -1);
  if (selection.includes(index) || last === undefined) return selection.includes(index) ? selection : [...selection, index];
  if (isAdjacent(last, index, size)) return [...selection, index];

  const lastRow = Math.floor(last / size);
  const lastColumn = last % size;
  const nextRow = Math.floor(index / size);
  const nextColumn = index % size;
  const sameRowWithOneGap = lastRow === nextRow && Math.abs(lastColumn - nextColumn) === 2;
  const sameColumnWithOneGap = lastColumn === nextColumn && Math.abs(lastRow - nextRow) === 2;
  if (sameRowWithOneGap || sameColumnWithOneGap) {
    const bridge = Math.floor((last + index) / 2);
    if (!selection.includes(bridge)) return [...selection, bridge, index];
  }
  return selection;
}

export function wordFromSelection(board: string[], selection: number[]) {
  return selection.map((index) => board[index] ?? "").join("");
}
