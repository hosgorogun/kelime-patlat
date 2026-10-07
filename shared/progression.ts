// Master progression barrel entry point
// 100% backward compatible re-exports from modular domain services

export * from "./missions-catalog";
export * from "./leagues";
export * from "./lives-economy";
export * from "./lucky-wheel";
export * from "./badges";
export * from "./level-curves";

export * from "./progression/progression.types";
export * from "./progression/date-utils";
export * from "./progression/season-streak";
export * from "./progression/progression-missions";
export * from "./progression/match-progress";
export * from "./progression/merge-progress";
export * from "./progression/cosmetics";
export * from "./weekend-hunt";

export type { AvatarOption as AvatarDefinition } from "./progression/progression.types";
export type { LeagueTierInfo as LeagueTier } from "./leagues";
