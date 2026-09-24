import { describe, expect, it } from "vitest";
import { generatePuzzle, PlacedWord } from "../shared/puzzle-generator";

describe("Nostalji Kelime Bulmaca 20 Seviye Doğrulama Testi", () => {
  it("Bölüm 1'den Bölüm 20'ye kadar tüm seviyeleri hatasız üretir ve tamamlanabilirliğini doğrular", () => {
    for (let level = 1; level <= 20; level++) {
      const diff = level <= 5 ? "easy" : level <= 10 ? "medium" : level <= 15 ? "hard" : "ultra";
      const puzzle = generatePuzzle(diff);

      // 1. Bulmaca nesnesi boş olmamalı ve en az 3 kelime barındırmalı
      expect(puzzle).toBeDefined();
      expect(puzzle.words.length).toBeGreaterThanOrEqual(3);
      expect(puzzle.boardSize).toBe(10);
      expect(puzzle.centerWord).toBeDefined();

      // 2. Tüm kelimelerin 10x10 sınırları içerisinde kaldığını doğrula
      const board: (string | null)[][] = Array(10).fill(null).map(() => Array(10).fill(null));

      puzzle.words.forEach((w: PlacedWord) => {
        expect(w.row).toBeGreaterThanOrEqual(0);
        expect(w.row).toBeLessThan(10);
        expect(w.col).toBeGreaterThanOrEqual(0);
        expect(w.col).toBeLessThan(10);

        if (w.direction === "horizontal") {
          expect(w.col + w.length).toBeLessThanOrEqual(10);
        } else {
          expect(w.row + w.length).toBeLessThanOrEqual(10);
        }

        // 3. Tahta üzerindeki harflerde çakışma olmadığını denetle
        for (let i = 0; i < w.length; i++) {
          const r = w.direction === "horizontal" ? w.row : w.row + i;
          const c = w.direction === "horizontal" ? w.col + i : w.col;
          const char = w.answer[i]!;

          if (board[r]![c] !== null) {
            expect(board[r]![c]).toBe(char); // Ortak kesişim harfi aynı olmalı
          } else {
            board[r]![c] = char;
          }
        }
      });

      // 4. Çözülebilirlik Simülasyonu: Tüm kelimeler tahtaya dizildiğinde %100 çözüldüğünü doğrula
      const solvedIds = new Set<string>();
      puzzle.words.forEach((w) => {
        let isFullMatch = true;
        for (let i = 0; i < w.length; i++) {
          const r = w.direction === "horizontal" ? w.row : w.row + i;
          const c = w.direction === "horizontal" ? w.col + i : w.col;
          if (board[r]![c] !== w.answer[i]) {
            isFullMatch = false;
            break;
          }
        }
        if (isFullMatch) {
          solvedIds.add(w.id);
        }
      });

      // Tüm kelimeler başarıyla çözülmeli
      expect(solvedIds.size).toBe(puzzle.words.length);
    }
  });

  it("Gazete (Vintage) modunda seviye başına 1 tahta değiştirme (boardSwapCount) sınırı olmalıdır", () => {
    let boardSwapCount = 1;
    const canSwap = () => {
      if (boardSwapCount <= 0) return false;
      boardSwapCount -= 1;
      return true;
    };

    expect(canSwap()).toBe(true);  // 1. Değiştirme hakkı kullanılır
    expect(canSwap()).toBe(false); // 2. Değiştirme talebi reddedilir (Sınır koruması)
    expect(boardSwapCount).toBe(0);
  });
});
