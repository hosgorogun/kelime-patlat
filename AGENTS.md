# Kelime Patlat - Codebase Guide & Agent Rules

## Project Overview
Kelime Patlat is a real-time multiplayer & single-player Turkish word puzzle application built with Expo / React Native, TypeScript, Socket.IO, and Express.

## File Organization & Key Modules

### Frontend Components (`components/`)
- `cyber-store.tsx`: Cosmetic store, chip shop, frames & victory effects.
- `vintage-puzzle.tsx`: Gazete Mode (10x10 Crossword & Center Word Puzzle).
- `lives-modal.tsx`: Life recharge and purchase center (30-min timer).
- `cyber-banner-ad.tsx` & `match-rewards.tsx`: Ads and rewards layout.
- `game-ui.tsx` & `game-countdown-overlay.tsx`: Gameplay overlays and shields.
- `celebration-modal.tsx`: Level-up and league promotion modal.

### Shared Logic (`shared/`)
- `progression.ts`: Player progress state, levels, XP, chips, lives calculation (`getCalculatedLives`, `buyLives`).
- `game.ts`: Core game board logic, adjacency checks, score multipliers, round durations.
- `tr-utils.ts`: Robust Turkish letter normalization (`normalizeTr`, `normalizeTrUpper`, `isEqualTr`).
- `solo.ts` & `puzzle-generator.ts`: Single player matrix levels and crossword dictionary generator.
- `audio-haptics.ts`: Audio synthesis and tactile haptic feedback helpers.

### Backend (`server/`)
- `server/game/rooms.ts`: Socket.IO room management, matchmaking queue, bot fills, authoritative score/leaderboard records.
- `server/db.ts` & `mongo-store.ts`: MongoDB user progress and leaderboard persistence.

## Development Rules for AI Agents
1. **Always Use `isEqualTr`**: For Turkish letter string comparisons, never use strict `===` or standard `.toLowerCase()` because of `I/ı/İ/i` unicode edge cases.
2. **Keep State Synchronized**: When updating progress, always use `progressRef.current` inside async closures to prevent stale state bugs.
3. **Never Swallow Errors**: Always catch background promises in server handlers (`.catch(console.error)`).
