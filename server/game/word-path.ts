import type { BoardSize } from "../../shared/game";

export function findWordPath(board: string[], size: BoardSize, word: string): number[] | null {
  const visit = (index: number, offset: number, used: number[]): number[] | null => {
    if (board[index] !== word[offset]) return null;
    const nextUsed = [...used, index];
    if (offset === word.length - 1) return nextUsed;
    const row = Math.floor(index / size);
    const column = index % size;
    const neighbors = [
      [row - 1, column],
      [row + 1, column],
      [row, column - 1],
      [row, column + 1],
    ];
    for (const [nextRow, nextColumn] of neighbors) {
      const nextIndex = nextRow * size + nextColumn;
      if (
        nextRow >= 0 &&
        nextRow < size &&
        nextColumn >= 0 &&
        nextColumn < size &&
        !nextUsed.includes(nextIndex)
      ) {
        const path = visit(nextIndex, offset + 1, nextUsed);
        if (path) return path;
      }
    }
    return null;
  };

  for (let index = 0; index < board.length; index += 1) {
    const path = visit(index, 0, []);
    if (path) return path;
  }
  return null;
}
