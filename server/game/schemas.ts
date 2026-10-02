import { z } from "zod";

export function cleanCode(code: string): string {
  return code.trim().replace(/i/g, "I").replace(/ı/g, "I").replace(/İ/g, "I").toUpperCase();
}

export const playerIdSchema = z.string().trim().min(1).max(128);
export const playerNameSchema = z.string().max(100);
export const codeSchema = z.string().trim().min(1).max(16);
export const sizeSchema = z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10)]);

export const playerProfileSchema = z.object({
  avatar: z.string().optional(),
  avatarPhoto: z.string().max(250_000).optional(),
  selectedTitle: z.string().optional(),
  selectedFrame: z.string().optional(),
  level: z.number().optional(),
  tier: z.string().optional(),
  lp: z.number().optional(),
  wins: z.number().optional(),
  matches: z.number().optional(),
  streak: z.number().optional(),
  bestScore: z.number().optional(),
  bestTempo: z.number().optional(),
}).optional();

export const matchmakingJoinSchema = z.object({
  playerId: playerIdSchema,
  playerName: playerNameSchema,
  size: sizeSchema,
  profile: playerProfileSchema,
});

export const matchmakingLeaveSchema = z.object({
  playerId: playerIdSchema,
  size: sizeSchema,
});

export const roomCreateSchema = z.object({
  playerId: playerIdSchema,
  playerName: playerNameSchema,
  size: sizeSchema,
  immediateBot: z.boolean().optional(),
  profile: playerProfileSchema,
  inviteTarget: z.object({
    toPlayerId: z.string(),
    toUsername: z.string().optional(),
    botProfile: playerProfileSchema.optional(),
  }).optional(),
});

export const roomJoinSchema = z.object({
  code: codeSchema,
  playerId: playerIdSchema,
  playerName: playerNameSchema,
  profile: playerProfileSchema,
});

export const roomPlayerActionSchema = z.object({
  code: codeSchema,
  playerId: playerIdSchema,
});

export const roomEmoteSchema = z.object({
  code: codeSchema,
  playerId: playerIdSchema,
  emote: z.string().min(1).max(10),
});

export const wordSubmitSchema = z.object({
  code: codeSchema,
  playerId: playerIdSchema,
  selection: z.array(z.number().int().min(0).max(99)).min(2).max(100),
});

export function isValidPayload<T>(schema: z.ZodType<T>, payload: unknown): payload is T {
  return schema.safeParse(payload).success;
}
