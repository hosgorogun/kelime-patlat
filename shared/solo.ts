import { TURKISH_LETTERS, type BoardSize, type WordDifficulty, type WordEntry } from "./game";
import { catalogWordsForTheme, type WordTheme } from "./word-catalog";
import { getDifficultyProfile } from "./difficulty";

export type SoloLevel = {
  level: number;
  size: BoardSize;
  wordCount: number;
  timeLimit: number;
  minTurns: number;
  title: string;
  subtitle: string;
};

export type SoloBoard = Pick<SoloLevel, "level" | "size" | "timeLimit" | "title" | "subtitle"> & {
  board: string[];
  words: string[];
  routes: Record<string, number[]>;
  wordDifficulties: Record<string, WordDifficulty>;
};

export const SOLUTION_ROUTE_COLORS = [
  { backgroundColor: "#287B70", borderColor: "#A3E635" },
  { backgroundColor: "#276FA7", borderColor: "#7DD3FC" },
  { backgroundColor: "#7655B8", borderColor: "#C4B5FD" },
  { backgroundColor: "#B86527", borderColor: "#FCD34D" },
  { backgroundColor: "#A33D76", borderColor: "#FDA4AF" },
  { backgroundColor: "#4A8492", borderColor: "#67E8F9" },
] as const;

export const MAX_SOLO_LEVEL = 100;

export function getSoloLevel(level: number): SoloLevel {
  const safeLevel = Math.min(Math.max(Math.floor(level), 1), MAX_SOLO_LEVEL);
  const profile = getDifficultyProfile(safeLevel);
  const { size, wordCount, timeLimit, minTurns } = profile;
  const titles = [
    "İLK İZ", "KIVRIMLI YOL", "DAR KÖŞE", "GENİŞ AV", "GİZLİ HAT", "KARMAŞIK BAĞ", "KESKİN DÖNÜŞ", "DERİN ROTA", "KELİME FIRTINASI", "USTA AVCI",
    "GÖLGE HARİTA", "SON OPERASYON", "GİZLİ LABİRENT", "SESSİZ SOKAK", "ÇELİK DUVAR", "ALTIN KİLİT", "KARA KUTU", "ZAMAN BÜKÜCÜ", "GECE YARISI", "GİZEMLİ GEÇİT",
    "EFSANE YOLU", "KRONOS KAPISI", "KOZMOZ ODASI", "MUTLAK SON", "İKİLİ GİRDAP", "SİSLİ ZİRVE", "NEON PARILTISI", "ANTİK YAZIT", "KRİPTOLU HAT", "KAYIP ŞEHİR",
    "DERİN LABİRENT", "KIVILCIM", "YÖRÜNGE", "BİLGE ADIMI", "KOR PARÇASI", "GECE NÖBETİ", "AKIL OYUNU", "KIRIK PUSULA", "SESSİZ LİMAN", "KARA DELİK",
    "FIRTINA ÖNCESİ", "KANYON DUVARI", "ÖZGÜR HAVA", "BEDEL", "SİNYAL", "ATEŞ HESABI", "TELSİZ SESİ", "PUSLU GÖL", "KUTUP YILDIZI", "SONSUZ KÖPRÜ",
    "ALTIN TAPINAK", "KRONOMETRE", "KİLİT AÇICI", "DERİN KUYU", "GÜNEŞ SAATİ", "MAVİ IŞIK", "KÖŞE VURUŞU", "KAYIP BELGE", "GİZEMLİ NEHİR", "ÇATI KATI",
    "ZİHNİN SINIRI", "BİLİM KASASI", "MANTIK AĞI", "PROGRAMCI", "DEPREM DALGASI", "KESKİN KILINÇ", "BİLGE YOLU", "VOLKAN AĞZI", "ŞELALE DÜŞÜ", "KÖRFEZ ESİNTİSİ",
    "YILDIZ HARİTASI", "GÖKKUŞAĞI", "CESARET HATTI", "MUTLULUK BAĞI", "TEKNOLOJİ", "YARATICI ZİHN", "KARARLI ADIM", "MERAKLI BAKIŞ", "ROTALAR", "SEVİMLİ DOST",
    "GÖLGELİ VADİ", "KIVRIMLI HAT", "OPERASYON", "BİLİMSEL YOL", "HAZİNE SANDI", "SESSİZ ÇIĞLIK", "KUTUP EKSPRE", "GİZEMLİ KUTU", "BİLİNEN YOL", "YAPRAK DÖKÜM",
    "YAĞMURLU GÜN", "SAHİL ŞERİDİ", "CESUR YÜREK", "HAYAT YOLU", "HUZURLU LİMA", "LİDERLİK", "UYUM KÖPRÜSÜ", "VATAN SEVGİSİ", "YALIN ÇÖZÜM", "KOZMOZ SINIRI"
  ];
  return {
    level: safeLevel,
    size,
    wordCount,
    timeLimit,
    minTurns,
    title: titles[safeLevel - 1]!,
    subtitle: `${wordCount} kelime · ${timeLimit} sn · en az ${minTurns} dönüş`,
  };
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], random: () => number) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [copy[index], copy[next]] = [copy[next]!, copy[index]!];
  }
  return copy;
}

function neighbors(index: number, size: BoardSize) {
  const row = Math.floor(index / size);
  const column = index % size;
  return [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1]].flatMap(([nextRow, nextColumn]) => (
    nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size ? [nextRow * size + nextColumn] : []
  ));
}

function countTurns(path: number[]) {
  let turns = 0;
  for (let index = 2; index < path.length; index += 1) {
    if (path[index]! - path[index - 1]! !== path[index - 1]! - path[index - 2]!) turns += 1;
  }
  return turns;
}

function difficultyWeights(level: number) {
  return getDifficultyProfile(level).mix;
}

function pickDifficulty(level: number, random: () => number): WordDifficulty {
  const weights = difficultyWeights(level);
  const roll = random();
  if (roll < weights.easy) return "easy";
  if (roll < weights.easy + weights.medium) return "medium";
  return "hard";
}

function selectWords(config: SoloLevel, variation: number, random: () => number, theme: WordTheme = "general", excludeWords: string[] = []): WordEntry[] {
  const profile = getDifficultyProfile(config.level);
  const targetSum = config.size * config.size;
  const themed = catalogWordsForTheme(config.size, theme, profile.maxWordLength).filter((entry) => entry.word.length >= profile.minWordLength);
  const general = catalogWordsForTheme(config.size, "general", profile.maxWordLength).filter((entry) => entry.word.length >= profile.minWordLength);

  const minWords = config.size === 4 ? 3 : config.size === 6 ? 4 : 7;
  const maxWords = config.size === 4 ? 3 : config.size === 6 ? 9 : 12;

  const adjustedMinLen = Math.max(profile.minWordLength, Math.floor(targetSum / maxWords) - 1);
  const themedFiltered = themed.filter((entry) => entry.word.length >= adjustedMinLen && !excludeWords.includes(entry.word));
  const themedAll = themed.filter((entry) => entry.word.length >= adjustedMinLen);
  const generalAll = general.filter((entry) => entry.word.length >= adjustedMinLen);

  const pools = [
    themedFiltered,
    themedAll,
    generalAll,
    general
  ];

  for (const pool of pools) {
    if (pool.length < minWords) continue;
    for (let attempt = 0; attempt < 600; attempt++) {
      const selected: WordEntry[] = [];
      let currentSum = 0;
      const shuffledEntries = shuffled(pool, random);
      for (const entry of shuffledEntries) {
        if (selected.some((e) => e.word === entry.word)) continue;
        const len = entry.word.length;
        if (currentSum + len <= targetSum) {
          const remaining = targetSum - (currentSum + len);
          if (remaining === 0 || remaining >= profile.minWordLength) {
            selected.push(entry);
            currentSum += len;
          }
        }
        if (currentSum === targetSum) {
          const diffs = new Set(selected.map((e) => e.difficulty));
          const passesDiversity = config.size !== 4 || diffs.size >= 2;
          if (selected.length >= minWords && selected.length <= maxWords && passesDiversity) {
            return selected;
          }
          break;
        }
      }
    }
  }

  // Absolute fallback: try to get exact sum using general pool with standard minWordLength to guarantee completion
  const fallbackList: WordEntry[] = [];
  let sum = 0;
  for (const entry of general) {
    if (sum + entry.word.length <= targetSum) {
      const remaining = targetSum - (sum + entry.word.length);
      if (remaining === 0 || remaining >= profile.minWordLength) {
        fallbackList.push(entry);
        sum += entry.word.length;
      }
    }
    if (sum === targetSum) return fallbackList;
  }
  return fallbackList;
}

function makeDifficultyMap(entries: WordEntry[]) {
  return Object.fromEntries(entries.map((entry) => [entry.word, entry.difficulty])) as Record<string, WordDifficulty>;
}

export function solutionColorByCell(challenge: Pick<SoloBoard, "words" | "routes">) {
  const colors = new Map<number, number>();
  challenge.words.forEach((word, wordIndex) => {
    challenge.routes[word]?.forEach((cell) => colors.set(cell, wordIndex));
  });
  return colors;
}

function findRoute(occupied: Set<number>, size: BoardSize, length: number, minTurns: number, random: () => number) {
  let budget = 9_000;
  const visit = (index: number, path: number[]): number[] | null => {
    if (budget-- <= 0) return null;
    const nextPath = [...path, index];
    if (nextPath.length === length) return countTurns(nextPath) >= Math.min(minTurns, length - 2) ? nextPath : null;
    const options = shuffled(neighbors(index, size), random).filter((next) => !occupied.has(next) && !nextPath.includes(next));
    for (const next of options) {
      const route = visit(next, nextPath);
      if (route) return route;
    }
    return null;
  };
  const starts = shuffled(Array.from({ length: size * size }, (_, index) => index).filter((index) => !occupied.has(index)), random);
  for (const start of starts) {
    const route = visit(start, []);
    if (route) return route;
  }
  return null;
}

function serpentinePath(size: BoardSize): number[] {
  const path: number[] = [];
  for (let r = 0; r < size; r++) {
    const rowCells = Array.from({ length: size }, (_, c) => r * size + c);
    if (r % 2 !== 0) {
      rowCells.reverse();
    }
    path.push(...rowCells);
  }
  return path;
}

function fullBoardPath(size: BoardSize, random: () => number) {
  let steps = 0;
  const visit = (index: number, path: number[]): number[] | null => {
    steps++;
    if (steps > 40000) return null;
    const nextPath = [...path, index];
    if (nextPath.length === size * size) return nextPath;
    
    const unvisitedNeighbors = (cell: number) => {
      return neighbors(cell, size).filter(n => !nextPath.includes(n) && n !== index).length;
    };

    const options = shuffled(neighbors(index, size), random).filter((next) => !nextPath.includes(next));
    options.sort((a, b) => unvisitedNeighbors(a) - unvisitedNeighbors(b));

    for (const next of options) {
      const pathResult = visit(next, nextPath);
      if (pathResult) return pathResult;
    }
    return null;
  };
  const starts = shuffled(Array.from({ length: size * size }, (_, index) => index), random);
  for (const start of starts) {
    steps = 0;
    const path = visit(start, []);
    if (path) return path;
  }
  return serpentinePath(size);
}

export function createSoloBoard(level: number, variation = 0, theme: WordTheme = "general", excludeWords: string[] = []): SoloBoard {
  const config = getSoloLevel(level);
  const entries = selectWords(config, variation, seededRandom(config.level * 23_917 + variation * 433), theme, excludeWords);
  const words = entries.map((entry) => entry.word);
  
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const random = seededRandom(config.level * 13_337 + variation * 211 + attempt * 31);
    const fullPath = fullBoardPath(config.size, random);
    let cursor = 0;
    const routes = Object.fromEntries(words.map((word) => {
      const route = fullPath.slice(cursor, cursor + word.length);
      cursor += word.length;
      return [word, route];
    }));
    if (!words.every((word) => {
      const requiredTurns = Math.min(config.size === 4 ? config.minTurns : 1, word.length - 2);
      return countTurns(routes[word]!) >= requiredTurns;
    })) continue;
    const board = Array.from({ length: config.size * config.size }, () => "");
    words.forEach((word) => routes[word]!.forEach((cell, index) => { board[cell] = word[index]!; }));
    return { ...config, board, words, routes, wordDifficulties: makeDifficultyMap(entries) };
  }
  
  const random = seededRandom(config.level * 17_729 + variation * 257);
  const fullPath = fullBoardPath(config.size, random);
  let cursor = 0;
  const routes = Object.fromEntries(words.map((word) => {
    const route = fullPath.slice(cursor, cursor + word.length);
    cursor += word.length;
    return [word, route];
  }));
  const board = Array.from({ length: config.size * config.size }, () => "");
  words.forEach((word) => routes[word]!.forEach((cell, index) => { board[cell] = word[index]!; }));
  return { ...config, board, words, routes, wordDifficulties: makeDifficultyMap(entries) };
}
