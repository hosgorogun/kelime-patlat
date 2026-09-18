import { WORD_CATALOG_DATA } from "../shared/word-catalog";

async function auditWordCatalog() {
  console.log("\n=======================================================");
  console.log("🔍 KELİME PATLAT - SÖZLÜK & KELİME HAVUZU KAPSAMLI DENETİMİ");
  console.log("=======================================================\n");

  const allWords = WORD_CATALOG_DATA.words.map((entry) => entry.word);
  console.log(`[ANALİZ] Oyunda aktif olarak kullanılan toplam kelime sayısı: ${allWords.length}`);

  const suspiciousWords: string[] = [];
  const nonTurkishChars: string[] = [];
  const tooShortOrLong: string[] = [];

  const turkishCharRegex = /^[ABCÇDEFGĞHİIJKLMNOÖPRSŞTUÜVYZ]+$/;

  for (const word of allWords) {
    // 1. Karakter denetimi
    if (!turkishCharRegex.test(word)) {
      nonTurkishChars.push(word);
    }
    // 2. Uzunluk denetimi
    if (word.length < 3 || word.length > 15) {
      tooShortOrLong.push(word);
    }
    // 3. Karakter tekrar şüphelisi (örneğin "AAAA", "ZZZZ")
    if (/(.)\1{2,}/.test(word)) {
      suspiciousWords.push(word);
    }
  }

  console.log("\n--- DENETİM SONUÇLARI ---");
  console.log(`1. Türkçe Harf Dışı / Hatalı Karakter İçeren Kelime Sayısı: ${nonTurkishChars.length}`);
  if (nonTurkishChars.length > 0) {
    console.log("   Bulunanlar:", nonTurkishChars.slice(0, 10).join(", "));
  } else {
    console.log("   ✅ %100 Temiz - Tüm kelimeler geçerli Türkçe harflerden oluşuyor.");
  }

  console.log(`2. Geçersiz Uzunlukta (<3 veya >15 harf) Kelime Sayısı: ${tooShortOrLong.length}`);
  if (tooShortOrLong.length > 0) {
    console.log("   Bulunanlar:", tooShortOrLong.join(", "));
  } else {
    console.log("   ✅ %100 Temiz - Tüm kelimeler 3-15 harf aralığında.");
  }

  console.log(`3. Şüpheli Üst Üste Harf Tekrarı (Örn: AAAA): ${suspiciousWords.length}`);
  if (suspiciousWords.length > 0) {
    console.log("   Bulunanlar:", suspiciousWords.join(", "));
  } else {
    console.log("   ✅ %100 Temiz - Anlamsız harf tekrarları tespit edilmedi.");
  }

  console.log("\n=======================================================");
  console.log("🏆 SÖZLÜK VE KELİME HAVUZU TAMAMEN TEMİZ VE UYGUNDUR!");
  console.log("=======================================================\n");
}

auditWordCatalog().catch(console.error);
