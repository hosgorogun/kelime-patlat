import { generatePuzzle, checkPlacement, WORD_DICTIONARY } from "../shared/puzzle-generator";

console.log("=== VINTAGE PUZZLE CANLI SİSTEM TESTİ ===");
console.log(`Toplam Sözlük Kelime Sayısı: ${WORD_DICTIONARY.length}`);

const difficulties = ["easy", "medium", "hard", "ultra"] as const;
let totalGenerated = 0;
let totalErrors = 0;

for (const diff of difficulties) {
  console.log(`\n--- Zorluk Derecesi: ${diff.toUpperCase()} ---`);
  const wordsInTier = WORD_DICTIONARY.filter(w => w.difficulty === diff);
  console.log(`Bu zorluktaki kelime sayısı: ${wordsInTier.length}`);

  for (let i = 0; i < 5; i++) {
    totalGenerated++;
    try {
      const puzzle = generatePuzzle(diff as any);
      if (!puzzle || !puzzle.words || puzzle.words.length === 0) {
        console.error(`[HATA] ${diff} seviyesinde boş bulmaca üretildi!`);
        totalErrors++;
        continue;
      }

      // Check center word
      if (!puzzle.centerWord) {
        console.error(`[HATA] ${diff} seviyesinde merkez kelime eksik!`);
        totalErrors++;
        continue;
      }

      // Create an empty board to test placements
      const board: (string | null)[][] = Array.from({ length: 10 }, () => Array(10).fill(null));

      // Place center word first
      for (const [r, c] of puzzle.centerWord.cells) {
        if (r < 0 || r >= 10 || c < 0 || c >= 10) {
          console.error(`[HATA] Merkez kelime sınır dışı: [${r}, ${c}]`);
          totalErrors++;
        }
      }

      // Test every word
      let wordErrors = 0;
      for (const w of puzzle.words) {
        if (!w.answer || !w.clue) {
          console.error(`[HATA] Kelime cevabı veya ipucu boş: ${w.answer}`);
          wordErrors++;
        }
        for (let idx = 0; idx < w.cells.length; idx++) {
          const [r, c] = w.cells[idx]!;
          if (r < 0 || r >= 10 || c < 0 || c >= 10) {
            console.error(`[HATA] Kelime hücresi sınır dışı: ${w.answer} -> [${r}, ${c}]`);
            wordErrors++;
          } else {
            const letter = w.answer[idx];
            if (board[r]![c] !== null && board[r]![c] !== letter) {
              console.error(`[HATA] Harf çakışması: [${r}, ${c}] hücrede '${board[r]![c]}' vardı, '${letter}' gelmeye çalıştı (${w.answer})`);
              wordErrors++;
            } else {
              board[r]![c] = letter!;
            }
          }
        }
      }

      if (wordErrors === 0) {
        console.log(`  ✓ Test #${i + 1} Başarılı: ${puzzle.words.length} kelime yerleştirildi (Merkez: ${puzzle.centerWord.answer})`);
      } else {
        totalErrors += wordErrors;
      }
    } catch (e: any) {
      console.error(`[HATA] ${diff} bulmaca üretiminde istisna:`, e.message);
      totalErrors++;
    }
  }
}

console.log("\n=================================");
if (totalErrors === 0) {
  console.log(`✅ TÜM ${totalGenerated} BULMACA CANLI TESTİ BAŞARIYLA TAMAMLANDI! Hata: 0`);
} else {
  console.error(`❌ TESTLERDE ${totalErrors} HATA BULUNDU!`);
  process.exit(1);
}
