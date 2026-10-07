import { TURKISH_LETTERS, fillBoardBlanks, isAdjacent, wordFromSelection } from "./game";
import { normalizeTr, normalizeTrUpper, isEqualTr } from "./tr-utils";

export type TurnMatchWord = {
  word: string;
  playerId: string;
  score: number;
  playedAt: number;
};

export type TurnMatch = {
  id: string;
  player1Id: string;
  player1Name: string;
  player1Avatar?: string;
  player2Id: string;
  player2Name: string;
  player2Avatar?: string;
  turnPlayerId: string;
  board: string[];
  size: number;
  round: number;
  maxRounds: number;
  player1Score: number;
  player2Score: number;
  foundWords: TurnMatchWord[];
  status: "active" | "completed" | "expired";
  winnerId?: string | null;
  deadline: number;
  createdAt: number;
  updatedAt: number;
};

export function createInitialTurnBoard(size = 4, random = Math.random): string[] {
  const commonTurkishLetters = [
    "A", "E", "İ", "K", "L", "M", "N", "R", "S", "T",
    "A", "E", "İ", "O", "U", "B", "D", "Y", "Z", "P",
  ];
  const board: string[] = [];
  for (let i = 0; i < size * size; i++) {
    board.push(commonTurkishLetters[Math.floor(random() * commonTurkishLetters.length)]!);
  }
  return board;
}

export function calculateTurnWordScore(word: string): number {
  const len = word.length;
  if (len < 3) return 5;
  if (len === 3) return 15;
  if (len === 4) return 25;
  if (len === 5) return 40;
  if (len === 6) return 60;
  return 85 + (len - 7) * 25;
}
