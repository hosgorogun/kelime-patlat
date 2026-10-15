import { createSoloBoard, getSoloLevel } from "../shared/solo";
import { wordScoreMultiplier } from "../shared/game";

async function runLiveGame() {
  console.log("\n========================================================");
  console.log("       KELİME PATLAT - CANLI OYNANIŞ DÖNGÜSÜ");
  console.log("========================================================\n");

  // 1. OYUNCU PROFİLİ
  const player = {
    name: "Şampiyon Oyuncu",
    level: 1,
    xp: 0,
    chips: 500,
    lives: 5,
    streak: 3,
  };
  console.log("👤 [1. OYUNCU GİRİŞ YAPTI]:");
  console.log(`   Kullanıcı: ${player.name}`);
  console.log(`   Seviye: ${player.level} | Çip: ${player.chips} 🟡 | Can: ${player.lives}/5 ❤️ | Seri: ${player.streak} Gün 🔥\n`);

  // 2. SEVİYE 1 TAHTASI VE MATRİS ÜRETİMİ
  const config = getSoloLevel(1);
  console.log(`🧩 [2. SOLO SEVİYE 1 YÜKLENİYOR]: "${config.title}"`);
  console.log(`   Izgara: ${config.size}x${config.size} | Hedef: ${config.wordCount} Kelime | Süre: ${config.timeLimit} sn\n`);

  const soloBoard = createSoloBoard(1);
  console.log("📋 [CANLI 4x4 OYUN TAHTASI]:");
  for (let r = 0; r < config.size; r++) {
    const rowLetters = soloBoard.board.slice(r * config.size, (r + 1) * config.size);
    console.log(`      |  ${rowLetters.join("   ")}  |`);
  }
  console.log(`\n   🎯 Tahtada Gizlenmiş Kelimeler: [ ${soloBoard.words.join(", ")} ]\n`);

  // 3. CANLI KELİME PATLATMA ADIMLARI
  console.log("⚡ [3. CANLI OYNANIŞ: OYUNCU KELİMELERİ BULUYOR VE PATLATIYOR]:");
  let totalScore = 0;

  for (let i = 0; i < soloBoard.words.length; i++) {
    const word = soloBoard.words[i];
    const route = soloBoard.routes[word] || [];
    const multiplier = wordScoreMultiplier(word.length);
    const score = word.length * 10 * multiplier;
    totalScore += score;

    console.log(`   ✨ Adım ${i + 1}:`);
    console.log(`      Kelime Seçildi: "${word}" (${word.length} Harf, Çarpan: x${multiplier})`);
    console.log(`      Harf Rota İndeksleri: [${route.join(" -> ")}]`);
    console.log(`      💥 PATLAMA SESİ! Harfler ışıltıyla patladı! Kazanılan: +${score} Puan (Toplam: ${totalScore})\n`);
  }

  // 4. BÖLÜM BİTTİ & SEVİYE ATLAMA
  console.log("🏆 [4. BÖLÜM TAMAMLANDI - ZAFER KUTLAMASI!]:");
  const earnedXp = 150;
  const earnedChips = 75;
  player.xp += earnedXp;
  player.chips += earnedChips;
  player.level += 1;

  console.log(`   Tüm hedefler başarıyla patlatıldı!`);
  console.log(`   Toplam Bölüm Skoru: ${totalScore} Puan`);
  console.log(`   🎁 Seviye Tamamlama Ödülleri: +${earnedXp} XP, +${earnedChips} Çip`);
  console.log(`   🌟 TEBRİKLER! LEVEL ATLADINIZ: Artık Seviye ${player.level} oldunuz!`);
  console.log(`   Güncel Bakiye: ${player.chips} Çip | Can: ${player.lives}/5\n`);

  // 5. PVP 1v1 ÇEVRİMİÇİ DÜELLO SİMÜLASYONU
  console.log("⚔️  [5. PVP 1v1 CANLI REKABET MAÇI]:");
  console.log("   Rakip Aranıyor... Rakip Bulundu: 'Mert_TR' (Gümüş Lig)");
  console.log("   --- RAUNT 1 ---");
  console.log("   Sen: 'GÜNEŞ' (15 Puan)  vs  Mert_TR: 'KUM' (9 Puan)   -> 🟢 1. Raundu Kazandın!");
  console.log("   --- RAUNT 2 ---");
  console.log("   Sen: 'YILDIZ' (28 Puan) vs  Mert_TR: 'AY' (6 Puan)    -> 🟢 2. Raundu Kazandın!");
  console.log("   🎉 MAÇ BİTTİ: 2 - 0 TERTEMİZ GALİBİYET!");
  
  player.chips += 200;
  console.log(`   🏆 Lig Ödülü: +25 Kupa Puanı (LP), +200 Çip`);
  console.log(`   Güncel Bakiye: ${player.chips} Çip\n`);

  console.log("========================================================");
  console.log("   ✅ OYUN BAŞTAN SONA EKSİKSİZ VE HATASIZ TAMAMLANDI");
  console.log("========================================================\n");
}

runLiveGame().catch(console.error);
