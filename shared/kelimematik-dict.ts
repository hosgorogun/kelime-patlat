/**
 * Kelimematik Türkçe Sözlük Doğrulama Motoru
 * Kelimematik modunda oyuncunun sadece gerçek Türkçe sözlük kelimelerini patlatmasını sağlar.
 */

import { WORD_CATALOG_DATA, WORD_BANK } from "./word-catalog";
import { normalizeTrUpper } from "./tr-utils";

const dictionarySet = new Set<string>();

// 1. Tüm ana katalogdaki kelimeleri ekle
for (const entry of WORD_CATALOG_DATA.words) {
  if (entry.word) {
    dictionarySet.add(normalizeTrUpper(entry.word));
  }
}

// 2. Tüm board word bank kelimelerini ekle
const allBanks = [
  ...WORD_BANK[4],
  ...WORD_BANK[6],
  ...WORD_BANK[8],
  ...WORD_BANK[10],
];
for (const w of allBanks) {
  if (w) {
    dictionarySet.add(normalizeTrUpper(w));
  }
}

/**
 * Kelimenin geçerli bir Türkçe kelime olup olmadığını doğrular.
 */
export function isValidKelimematikWord(word: string): boolean {
  if (!word || word.trim().length < 3) return false;
  const upper = normalizeTrUpper(word);
  return dictionarySet.has(upper);
}
