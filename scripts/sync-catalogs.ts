import * as fs from "fs";
import * as path from "path";
import { WORD_CATALOG_DATA } from "../shared/word-catalog";

const words = Array.from(new Set(WORD_CATALOG_DATA.words.map((w) => w.word))).sort((a, b) =>
  a.localeCompare(b, "tr")
);

console.log(`Yeni aktif kelime sayısı: ${words.length}`);

// 1. kelimeler.txt ve kelimeler_virgullu.txt güncelle (Yatay & Virgüllü Blok Formatı)
const lettersList = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");
let blockText = "===================================================\n";
blockText += `  KELİME PATLAT - AKTİF KELİME HAVUZU (${words.length.toLocaleString("tr-TR")} KELİME)\n`;
blockText += "===================================================\n\n";

for (const l of lettersList) {
  const group = words.filter((w) => w.startsWith(l));
  if (group.length > 0) {
    blockText += `--- ${l} (${group.length} Kelime) ---\n`;
    blockText += group.join(", ") + "\n\n";
  }
}

fs.writeFileSync(path.resolve("kelimeler.txt"), blockText, "utf8");
fs.writeFileSync(path.resolve("kelimeler_virgullu.txt"), words.join(", "), "utf8");
console.log(`✅ kelimeler.txt ve kelimeler_virgullu.txt yatay formatta yazıldı (${words.length} kelime)`);

// 2. kelimeler.html güncelle
const htmlPath = path.resolve("kelimeler.html");
let htmlContent = fs.readFileSync(htmlPath, "utf8");

// Başlıktaki ve metindeki sayıları güncelle
htmlContent = htmlContent.replace(
  /<title>Kelime Patlat - Tüm Kelime Havuzu \([\d.]+ Kelime\)<\/title>/,
  `<title>Kelime Patlat - Tüm Kelime Havuzu (${words.length.toLocaleString("tr-TR")} Kelime)</title>`
);
htmlContent = htmlContent.replace(
  /<p class="sub">Aktif Kullanılan Tam ve Temiz Türkçe Kelimeler \(Toplam [\d.]+ Adet\)<\/p>/,
  `<p class="sub">Aktif Kullanılan Tam ve Temiz Türkçe Kelimeler (Toplam ${words.length.toLocaleString("tr-TR")} Adet)</p>`
);
htmlContent = htmlContent.replace(
  /<div id="stats">[\d.]+ kelime listeleniyor<\/div>/,
  `<div id="stats">${words.length.toLocaleString("tr-TR")} kelime listeleniyor</div>`
);

// const allWords = [...] dizisini güncelle
const wordsJson = JSON.stringify(words);
htmlContent = htmlContent.replace(
  /const allWords = \[.*?\];/s,
  `const allWords = ${wordsJson};`
);

fs.writeFileSync(htmlPath, htmlContent, "utf8");
console.log(`✅ kelimeler.html güncellendi`);

// 3. Artifact kelime_havuzu.md güncelle
const artifactPath = "C:\\Users\\ogo77\\.gemini\\antigravity\\brain\\fe152968-50ca-4b9f-864b-78c47ed3780c\\kelime_havuzu.md";
if (fs.existsSync(artifactPath)) {
  const letters = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");
  let md = `# Kelime Patlat - Güncel ve Temizlenmiş Kelime Havuzu\n\n`;
  md += `Toplam **${words.length.toLocaleString("tr-TR")}** adet temiz, doğal Türkçe kelime bulunmaktadır.\n\n`;
  md += `Her kelime kontrol edilmiş; argo, müstehcen, yapay çekimler, ölü Osmanlıca ve özel isimler ayıklanmıştır.\n\n`;

  for (const letter of letters) {
    const list = words.filter((w) => w.startsWith(letter));
    if (list.length > 0) {
      md += `## ${letter} (${list.length} kelime)\n`;
      md += `${list.join(", ")}\n\n`;
    }
  }

  fs.writeFileSync(artifactPath, md, "utf8");
  console.log(`✅ kelime_havuzu.md güncellendi`);
}
