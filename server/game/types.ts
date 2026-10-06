import type { BoardSize, FoundWord, GamePlayer, RoomStatus } from "../../shared/game";
import type { z } from "zod";
import type { playerProfileSchema } from "./schemas";

export type PlayerRecord = GamePlayer & { socketId: string | null };

export type Room = {
  code: string;
  size: BoardSize;
  status: RoomStatus;
  board: string[];
  words: string[];
  routes: Record<string, number[]>;
  foundWords: FoundWord[];
  bonusWords?: Record<string, string[]>;
  scores: Record<string, number>;
  host: PlayerRecord;
  guest: PlayerRecord | null;
  winnerId: string | null;
  startedAt: number | null;
  message: string;
  touchedAt: number;
  botFillToken: number;
  roundToken: number;
  botSelection?: number[];
  lastWordFoundTime?: Record<string, number>;
  comboCount?: Record<string, number>;
  disconnectTimer?: NodeJS.Timeout | null;
  disconnectPlayerId?: string | null;
  disconnectExpiresAt?: number | null;
  rematchTimer?: NodeJS.Timeout | null;
  botTurnTimer?: NodeJS.Timeout | null;
  roundEndTimer?: NodeJS.Timeout | null;
  botFillTimer?: NodeJS.Timeout | null;
  isCustom?: boolean;
  isRanked?: boolean;
};

export type QueueEntry = {
  playerId: string;
  playerName: string;
  socketId: string;
  profile?: z.infer<typeof playerProfileSchema>;
};
