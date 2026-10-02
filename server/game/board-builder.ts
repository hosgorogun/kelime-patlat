import type { BoardSize } from "../../shared/game";
import { createSoloBoard } from "../../shared/solo";

export function makeUniqueCode(isCodeExisting: (code: string) => boolean): string {
  let code = "";
  do {
    code = Math.random().toString(36).slice(2, 7).toUpperCase();
  } while (isCodeExisting(code));
  return code;
}

export function buildGameBoard(size: BoardSize) {
  // 100% Tam Hücre Dolumu Garantisi:
  // Rastgele dolgu harf yok, boşta kalan kutucuk yok.
  // 4x4 (16 hücre), 6x6 (36 hücre), 8x8 (64 hücre), 10x10 (100 hücre)
  const representativeLevel = size === 4 ? 5 : size === 6 ? 25 : size === 8 ? 55 : 85;
  const variation = Math.floor(Math.random() * 1_000_000);
  const solo = createSoloBoard(representativeLevel, variation, "general");
  return {
    board: solo.board,
    words: solo.words,
    routes: solo.routes,
  };
}
