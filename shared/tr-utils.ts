/**
 * Türkçe Karakter Normalizasyon ve Karşılaştırma Yardımcıları
 * 
 * Standart toLowerCase()/toUpperCase() metodlarının Türkçe "I/ı" ve "İ/i" 
 * harflerinde oluşturduğu uyuşmazlıkları (I -> i yerine I -> ı) kesin olarak çözer.
 */

export function normalizeTr(text: string | null | undefined): string {
  if (!text) return "";
  return text.trim().toLocaleLowerCase("tr-TR");
}

export function normalizeTrUpper(text: string | null | undefined): string {
  if (!text) return "";
  return text.trim().toLocaleUpperCase("tr-TR");
}

export function isEqualTr(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeTr(a) === normalizeTr(b);
}
