import fs from "fs";
import path from "path";
import { createSoloBoard } from "../shared/solo";
import { WORD_CATALOG_DATA, type WordTheme } from "../shared/word-catalog";

interface AuditOptions {
  iterations?: number;
  autoPurge?: boolean;
}

// Bilinen saçma/arkaik veya kafa karıştırıcı kalıplar için sezgisel filtre
const SUSPICIOUS_PATTERNS = [
  // Gerçekten nadir / ölü Osmanlıca kelimeler (spesifik liste)
  /^(MÜTEKELLİM|MÜTEVEFFİ|MÜSTEHCENİ|MÜSTEVLİ|MÜTEAHHİT|MÜTECAVİZ|MÜTEFEKKİR)$/,
  /^(İSTİBDAT|İSTİKRAH|İSTİSMAR|İSTİSKA)$/,
  // Geçersiz karakter (Türkçe büyük harf dışı)
  /[^A-ZÇĞİIÖŞÜ]/,
  // Gerçekten ölü şiirsel kalıplar
  /(MAŞUK|MEYUS|MEBZUL|MÜZEYYEN|MÜLHEM)/,
];

export async function runInfiniteBoardAuditor(options: AuditOptions = {}) {
  const iterations = options.iterations ?? 1000;
  const autoPurge = options.autoPurge ?? false;

  console.log("=======================================================================");
  console.log(`🚀 KELİME PATLAT - OTOMATİK TAHTA SİMÜLASYON VE DENETİM MOTORU`);
  console.log(`   Simülasyon Sayısı: ${iterations} Tahta | Otomatik Temizleme: ${autoPurge ? "AÇIK" : "KAPALI"}`);
  console.log("=======================================================================\n");

  const wordFrequency = new Map<string, number>();
  const themes: WordTheme[] = ["general", "nature", "city", "mind", "space", "sports", "food"];
  const levels = [1, 2, 3, 4, 5, 8, 12, 16, 22, 30, 45, 60, 80, 100];

  console.log("⏳ Tahtalar üretiliyor ve çıkan kelimeler taranıyor...");
  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    const level = levels[i % levels.length]!;
    const theme = themes[i % themes.length]!;
    const variation = Math.floor(Math.random() * 1000000);

    try {
      const board = createSoloBoard(level, variation, theme);
      for (const word of board.words) {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      }
    } catch {
      // Tolerans
    }

    if ((i + 1) % 500 === 0 || i + 1 === iterations) {
      process.stdout.write(`   ▶ ${i + 1}/${iterations} tahta üretildi...\r`);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n\n✅ ${iterations} tahta ${durationSec} saniyede başarıyla simüle edildi.`);
  console.log(`📊 Tahtalarda toplam ${wordFrequency.size} farklı benzersiz kelime kullanıldı.\n`);

  // Şüpheli kelimeleri inceleme
  const flaggedWords: { word: string; count: number; reason: string }[] = [];

  for (const [word, count] of wordFrequency.entries()) {
    if (!/^[ABCÇDEFGĞHİIJKLMNOÖPRSŞTUÜVYZ]+$/.test(word)) {
      flaggedWords.push({ word, count, reason: "Geçersiz karakter" });
      continue;
    }
    if (word.length < 3) {
      flaggedWords.push({ word, count, reason: "Aşırı kısa (<3)" });
      continue;
    }
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(word)) {
        flaggedWords.push({ word, count, reason: "Arkaik/Aşırı Ekli Kalıp" });
        break;
      }
    }
  }

  console.log("--- 📋 ŞÜPHELİ / DENETLENEBİLİR KELİMELER ---");
  if (flaggedWords.length === 0) {
    console.log("   🎉 Harika! Simüle edilen tüm kelimeler kurallara %100 uygundur.");
  } else {
    console.log(`   ⚠️ Toplam ${flaggedWords.length} şüpheli kelime tespit edildi:\n`);
    flaggedWords.forEach((item, idx) => {
      console.log(`   ${idx + 1}. [${item.word}] - Tahtalarda çıkma sıklığı: ${item.count} kez (${item.reason})`);
    });

    if (autoPurge) {
      console.log("\n🧹 Otomatik temizleme devrede: Şüpheli kelimeler katalogdan ve koddan temizleniyor...");
      const catalogPath = path.join(process.cwd(), "data/word-catalog.json");
      const catalogRaw = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
      const flaggedSet = new Set(flaggedWords.map((f) => f.word));

      const filteredWords = catalogRaw.words.filter((entry: { word: string }) => !flaggedSet.has(entry.word));
      fs.writeFileSync(catalogPath, JSON.stringify({ ...catalogRaw, words: filteredWords }, null, 2), "utf8");
      console.log(`   ✅ ${flaggedWords.length} kelime word-catalog.json içinden kalıcı olarak silindi!`);
    }
  }

  console.log("\n=======================================================================");
  console.log("🎯 İnceleme tamamlandı. İstediğiniz an sınırsız çalıştırabilirsiniz!");
  console.log("=======================================================================\n");

  return {
    totalBoards: iterations,
    uniqueWords: wordFrequency.size,
    flaggedCount: flaggedWords.length,
    flaggedWords,
  };
}

const isDirectRun = process.argv[1] && (process.argv[1].endsWith("continuous-word-auditor.ts") || process.argv[1].endsWith("continuous-word-auditor.js"));
if (isDirectRun) {
  const args = process.argv.slice(2);
  const countArg = args.find((a) => a.startsWith("--count="));
  const iterations = countArg ? parseInt(countArg.split("=")[1]!, 10) : 2000;
  const autoPurge = args.includes("--clean") || args.includes("--purge");

  runInfiniteBoardAuditor({ iterations, autoPurge }).catch(console.error);
}
