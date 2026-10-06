export type MissionActionType =
  | 'daily_route'
  | 'daily_mystery'
  | 'duel_play'
  | 'duel_win'
  | 'word_length'
  | 'word_count'
  | 'arcade_score'
  | 'vintage_solve'
  | 'combo_count'
  | 'solo_progress'
  | 'earn_chips';

export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'epic';

export interface CatalogMission {
  id: string;
  title: string;
  desc: string;
  period: 'daily' | 'weekly';
  difficulty: MissionDifficulty;
  actionType: MissionActionType;
  target: number;
  param?: number;
  rewardXp: number;
  rewardCoins: number;
  rewardShields?: number;
}
