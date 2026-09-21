import { getSoloLevel, createSoloBoard } from "../shared/solo";
import { getDifficultyProfile } from "../shared/difficulty";

console.log("=================================================");
console.log("  SOLO LEVELS 1 - 100 DETAILED AUDIT & SIMULATION");
console.log("=================================================\n");

interface LevelReport {
  level: number;
  size: number;
  wordCount: number;
  timeLimit: number;
  timePerWord: number;
  words: string[];
  boardCellCount: number;
  avgWordLen: number;
  generationSuccess: boolean;
  error?: string;
}

const reports: LevelReport[] = [];

for (let lvl = 1; lvl <= 100; lvl++) {
  const meta = getSoloLevel(lvl);
  const profile = getDifficultyProfile(lvl);
  
  try {
    const board = createSoloBoard(lvl, 42, "general");
    const words = board.words;
    const avgLen = words.reduce((acc, w) => acc + w.length, 0) / words.length;

    // Verify all routes are valid
    let routesValid = true;
    for (const w of words) {
      const route = board.routes[w];
      if (!route || route.length !== w.length) {
        routesValid = false;
        break;
      }
      for (let i = 0; i < route.length; i++) {
        if (board.board[route[i]] !== w[i]) {
          routesValid = false;
          break;
        }
      }
    }

    reports.push({
      level: lvl,
      size: meta.size,
      wordCount: words.length,
      timeLimit: meta.timeLimit,
      timePerWord: Number((meta.timeLimit / words.length).toFixed(1)),
      words,
      boardCellCount: meta.size * meta.size,
      avgWordLen: Number(avgLen.toFixed(1)),
      generationSuccess: routesValid,
    });
  } catch (err: any) {
    reports.push({
      level: lvl,
      size: meta.size,
      wordCount: meta.wordCount,
      timeLimit: meta.timeLimit,
      timePerWord: Number((meta.timeLimit / meta.wordCount).toFixed(1)),
      words: [],
      boardCellCount: meta.size * meta.size,
      avgWordLen: 0,
      generationSuccess: false,
      error: err.message,
    });
  }
}

// Check generation failures
const failed = reports.filter(r => !r.generationSuccess);
console.log(`Tahta Üretim Başarısı: ${100 - failed.length}/100`);
if (failed.length > 0) {
  console.log("Başarısız Seviyeler:", failed.map(f => `Lvl ${f.level}: ${f.error}`).join(", "));
}

// Sample checkpoints
console.log("\n--- ÖRNEK SEVİYE ANALİZLERİ ---");
const checkpoints = [1, 5, 15, 16, 30, 45, 46, 60, 75, 76, 90, 100];
console.log("Lvl | Izgara | Kelime | Süre (sn) | Kelime Başı Süre | Kelimeler");
console.log("----+--------+--------+-----------+------------------+-----------------------------");
for (const cp of checkpoints) {
  const r = reports.find(x => x.level === cp)!;
  const wordsPreview = r.words.slice(0, 3).join(", ") + (r.words.length > 3 ? "..." : "");
  console.log(
    `${String(r.level).padStart(3)} | ` +
    `${String(r.size + "x" + r.size).padStart(6)} | ` +
    `${String(r.wordCount).padStart(6)} | ` +
    `${String(r.timeLimit).padStart(9)} | ` +
    `${String(r.timePerWord + " sn").padStart(16)} | ` +
    `${wordsPreview}`
  );
}

// Detailed analysis of time tiers
console.log("\n--- ZAMAN VE ZORLUK DENGESİ PROBLEM ANALİZİ ---");
const tier1 = reports.filter(r => r.size === 4);
const tier2 = reports.filter(r => r.size === 6);
const tier3 = reports.filter(r => r.size === 8);
const tier4 = reports.filter(r => r.size === 10);

function tierStats(name: string, list: LevelReport[]) {
  const avgTime = (list.reduce((a, b) => a + b.timeLimit, 0) / list.length).toFixed(1);
  const avgTpW = (list.reduce((a, b) => a + b.timePerWord, 0) / list.length).toFixed(1);
  const minTpW = Math.min(...list.map(x => x.timePerWord));
  const maxTpW = Math.max(...list.map(x => x.timePerWord));
  const avgWords = (list.reduce((a, b) => a + b.wordCount, 0) / list.length).toFixed(1);
  console.log(`${name}:`);
  console.log(`  Ortalama Kelime Sayısı: ${avgWords}`);
  console.log(`  Ortalama Toplam Süre: ${avgTime} sn`);
  console.log(`  Kelime Başına Süre: Ortalama ${avgTpW} sn (Min: ${minTpW} sn, Max: ${maxTpW} sn)`);
}

tierStats("Aşama 1 (Seviye 1-15, 4x4 Izgara)", tier1);
tierStats("Aşama 2 (Seviye 16-45, 6x6 Izgara)", tier2);
tierStats("Aşama 3 (Seviye 46-75, 8x8 Izgara)", tier3);
tierStats("Aşama 4 (Seviye 76-100, 10x10 Izgara)", tier4);
