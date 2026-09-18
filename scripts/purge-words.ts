/**
 * Basit kelime temizleme scripti
 * - 1000 tahta simüle eder
 * - Şüpheli kelimeleri tespit eder
 * - --purge flag'i ile word-catalog.json'dan siler
 */
import fs from "fs";
import path from "path";
import { createSoloBoard } from "../shared/solo";
import { type WordTheme } from "../shared/word-catalog";

const SUSPICIOUS_PATTERNS = [
  // Gerçekten nadir / ölü Osmanlıca kalıplar (sadece çok spesifik önekler)
  /^(MÜTEKELLİM|MÜTEVEFFİ|MÜSTEHCENİ|MÜSTEKBERL|MÜSTEVLİ|MÜTEAHHİT|MÜTECAVİZ|MÜTEFEKKİR)$/,
  /^(İSTİBDAT|İSTİKRAH|İSTİSMAR|İSTİSKA)$/,
  // Geçersiz karakter kontrolü (harf dışı)
  /[^A-ZÇĞİIÖŞÜ]/,
  // Gerçekten ölü şiirsel kalıplar
  /(MAŞUK|MEYUS|MEBZUL|MÜZEYYEN|MÜLHEM)/,
];

const args = process.argv.slice(2);
const countArg = args.find((a) => a.startsWith("--count="));
const iterations = countArg ? parseInt(countArg.split("=")[1]!, 10) : 1000;
const autoPurge = args.includes("--purge");

console.log(`\n🚀 ${iterations} tahta simüle ediliyor... (purge: ${autoPurge})\n`);

const wordFrequency = new Map<string, number>();
const themes: WordTheme[] = ["general", "nature", "city", "mind", "space", "sports", "food"];
const levels = [1, 2, 3, 4, 5, 8, 12, 16, 22, 30, 45, 60];


let errors = 0;
for (let i = 0; i < iterations; i++) {
  const level = levels[i % levels.length]!;
  const theme = themes[i % themes.length]!;
  const variation = Math.floor(Math.random() * 999999);
  try {
    const board = createSoloBoard(level, variation, theme);
    for (const word of board.words) {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
    }
  } catch {
    errors++;
  }

  if ((i + 1) % 100 === 0) {
    console.log(`  ▶ ${i + 1}/${iterations} tahta tamamlandı (${wordFrequency.size} benzersiz kelime bulundu)`);
  }
}

console.log(`\n✅ Simülasyon tamamlandı. ${errors} hata, ${wordFrequency.size} benzersiz kelime.\n`);

// Şüpheli kelimeleri bul
const flagged: string[] = [];
for (const [word] of wordFrequency.entries()) {
  if (word.length < 3) { flagged.push(word); continue; }
  for (const p of SUSPICIOUS_PATTERNS) {
    if (p.test(word)) { flagged.push(word); break; }
  }
}

console.log(`⚠️  ${flagged.length} şüpheli kelime:\n`);
flagged.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));

if (autoPurge && flagged.length > 0) {
  console.log(`\n🧹 word-catalog.json temizleniyor...`);
  const catalogPath = path.join(process.cwd(), "data/word-catalog.json");
  const raw = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as { words: { word: string }[] };
  const flaggedSet = new Set(flagged);
  const before = raw.words.length;
  raw.words = raw.words.filter((e) => !flaggedSet.has(e.word));
  const after = raw.words.length;
  fs.writeFileSync(catalogPath, JSON.stringify(raw, null, 2), "utf8");
  console.log(`✅ ${before - after} kelime silindi. Katalog: ${before} → ${after} kelime.`);
} else if (!autoPurge) {
  console.log(`\nℹ️  Temizlemek için --purge flag'i ekleyin.`);
}

console.log("\n🎯 Tamamlandı!\n");
