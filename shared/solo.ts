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

export type SoloBoard = Pick<SoloLevel, "level" | "size" | "wordCount" | "timeLimit" | "title" | "subtitle"> & {
  board: string[];
  words: string[];
  routes: Record<string, number[]>;
  wordDifficulties: Record<string, WordDifficulty>;
};

export type WordPaletteColor = {
  name: string;
  bg: string;
  border: string;
  tagBg: string;
  tagBorder: string;
  tagText: string;
  letterText: string;
  checkColor: string;
  glow: string;
};

export const APP_WORD_PALETTE: readonly WordPaletteColor[] = [
  {
    name: "emerald",
    bg: "rgba(16, 185, 129, 0.28)",
    border: "#10B981",
    tagBg: "rgba(16, 185, 129, 0.18)",
    tagBorder: "#10B981",
    tagText: "#34D399",
    letterText: "#A7F3D0",
    checkColor: "#6EE7B7",
    glow: "#10B981",
  },
  {
    name: "amber",
    bg: "rgba(245, 158, 11, 0.28)",
    border: "#F59E0B",
    tagBg: "rgba(245, 158, 11, 0.18)",
    tagBorder: "#F59E0B",
    tagText: "#FBBF24",
    letterText: "#FDE68A",
    checkColor: "#FCD34D",
    glow: "#F59E0B",
  },
  {
    name: "cyan",
    bg: "rgba(6, 182, 212, 0.28)",
    border: "#06B6D4",
    tagBg: "rgba(6, 182, 212, 0.18)",
    tagBorder: "#06B6D4",
    tagText: "#22D3EE",
    letterText: "#A5F3FC",
    checkColor: "#67E8F9",
    glow: "#06B6D4",
  },
  {
    name: "purple",
    bg: "rgba(168, 85, 247, 0.28)",
    border: "#A855F7",
    tagBg: "rgba(168, 85, 247, 0.18)",
    tagBorder: "#A855F7",
    tagText: "#C084FC",
    letterText: "#E9D5FF",
    checkColor: "#D8B4FE",
    glow: "#A855F7",
  },
  {
    name: "rose",
    bg: "rgba(244, 63, 94, 0.28)",
    border: "#F43F5E",
    tagBg: "rgba(244, 63, 94, 0.18)",
    tagBorder: "#F43F5E",
    tagText: "#FB7185",
    letterText: "#FECDD3",
    checkColor: "#FDA4AF",
    glow: "#F43F5E",
  },
  {
    name: "blue",
    bg: "rgba(59, 130, 246, 0.28)",
    border: "#3B82F6",
    tagBg: "rgba(59, 130, 246, 0.18)",
    tagBorder: "#3B82F6",
    tagText: "#60A5FA",
    letterText: "#BFDBFE",
    checkColor: "#93C5FD",
    glow: "#3B82F6",
  },
  {
    name: "lime",
    bg: "rgba(132, 204, 22, 0.28)",
    border: "#84CC16",
    tagBg: "rgba(132, 204, 22, 0.18)",
    tagBorder: "#84CC16",
    tagText: "#A3E635",
    letterText: "#D9F99D",
    checkColor: "#BEF264",
    glow: "#84CC16",
  },
  {
    name: "fuchsia",
    bg: "rgba(236, 72, 153, 0.28)",
    border: "#EC4899",
    tagBg: "rgba(236, 72, 153, 0.18)",
    tagBorder: "#EC4899",
    tagText: "#F472B6",
    letterText: "#FBCFE8",
    checkColor: "#F9A8D4",
    glow: "#EC4899",
  },
  {
    name: "indigo",
    bg: "rgba(99, 102, 241, 0.28)",
    border: "#6366F1",
    tagBg: "rgba(99, 102, 241, 0.18)",
    tagBorder: "#6366F1",
    tagText: "#818CF8",
    letterText: "#C7D2FE",
    checkColor: "#A5B4FC",
    glow: "#6366F1",
  },
  {
    name: "teal",
    bg: "rgba(20, 184, 166, 0.28)",
    border: "#14B8A6",
    tagBg: "rgba(20, 184, 166, 0.18)",
    tagBorder: "#14B8A6",
    tagText: "#2DD4BF",
    letterText: "#99F6E4",
    checkColor: "#5EEAD4",
    glow: "#14B8A6",
  },
  {
    name: "orange",
    bg: "rgba(249, 115, 22, 0.28)",
    border: "#F97316",
    tagBg: "rgba(249, 115, 22, 0.18)",
    tagBorder: "#F97316",
    tagText: "#FB923C",
    letterText: "#FED7AA",
    checkColor: "#FDBA74",
    glow: "#F97316",
  },
  {
    name: "pink",
    bg: "rgba(255, 107, 139, 0.28)",
    border: "#FF6B8B",
    tagBg: "rgba(255, 107, 139, 0.18)",
    tagBorder: "#FF6B8B",
    tagText: "#FFA3B8",
    letterText: "#FFE4E9",
    checkColor: "#FFCCD5",
    glow: "#FF6B8B",
  },
] as const;

export const SOLUTION_ROUTE_COLORS = APP_WORD_PALETTE.map((item) => ({
  backgroundColor: item.bg,
  borderColor: item.border,
}));

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
    "YILDIZ HARİTASI", "GÖKKUŞAĞI", "CESARET HATTI", "MUTLULUK BAĞI", "TEKNOLOJİ", "YARATICI ZİHİN", "KARARLI ADIM", "MERAKLI BAKIŞ", "ROTALAR", "SEVİMLİ DOST",
    "GÖLGELİ VADİ", "KIVRIMLI HAT", "OPERASYON", "BİLİMSEL YOL", "HAZİNE SANDIĞI", "SESSİZ ÇIĞLIK", "KUTUP EKSPRESİ", "GİZEMLİ KUTU", "BİLİNEN YOL", "YAPRAK DÖKÜMÜ",
    "YAĞMURLU GÜN", "SAHİL ŞERİDİ", "CESUR YÜREK", "HAYAT YOLU", "HUZURLU LİMAN", "LİDERLİK", "UYUM KÖPRÜSÜ", "VATAN SEVGİSİ", "YALIN ÇÖZÜM", "KOZMOZ SINIRI"
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

function selectWords(config: SoloLevel, variation: number, random: () => number, theme: WordTheme = "general", excludeWords: string[] = []): WordEntry[] {
  const profile = getDifficultyProfile(config.level);
  const targetSum = config.size * config.size;
  const themed = catalogWordsForTheme(config.size, theme, profile.maxWordLength).filter((entry) => entry.word.length >= profile.minWordLength);
  const general = catalogWordsForTheme(config.size, "general", profile.maxWordLength).filter((entry) => entry.word.length >= profile.minWordLength);

  const minWords = config.size === 4 ? 3 : config.size === 6 ? 4 : config.size === 8 ? 7 : 10;
  const maxWords = config.size === 4 ? 3 : config.size === 6 ? 9 : config.size === 8 ? 12 : 14;

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
  const shuffledGeneral = shuffled(general, random);
  for (const entry of shuffledGeneral) {
    if (sum + entry.word.length <= targetSum) {
      const remaining = targetSum - (sum + entry.word.length);
      if (remaining === 0 || remaining >= 2) {
        fallbackList.push(entry);
        sum += entry.word.length;
      }
    }
    if (sum === targetSum) return fallbackList;
  }

  // Deficit fill: if sum is still less than targetSum, pick exact length matching words to guarantee 100% cell coverage
  if (sum < targetSum) {
    const allWords = catalogWordsForTheme(config.size, "general", 12);
    let rem = targetSum - sum;
    let guard = 0;
    while (rem > 0 && guard++ < 50) {
      const exact = allWords.find((e) => e.word.length === rem && !fallbackList.some((f) => f.word === e.word));
      if (exact) {
        fallbackList.push(exact);
        sum += exact.word.length;
        rem = 0;
        break;
      }
      const smaller = allWords.filter((e) => e.word.length <= rem && e.word.length >= 2 && !fallbackList.some((f) => f.word === e.word));
      if (smaller.length > 0) {
        const picked = shuffled(smaller, random)[0];
        if (picked) {
          fallbackList.push(picked);
          sum += picked.word.length;
          rem -= picked.word.length;
          continue;
        }
      }
      if (fallbackList.length > 0) {
        const removed = fallbackList.pop()!;
        sum -= removed.word.length;
        rem = targetSum - sum;
      } else {
        break;
      }
    }
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
      const route = routes[word];
      return route ? countTurns(route) >= requiredTurns : false;
    })) continue;
    const board = Array.from({ length: config.size * config.size }, () => "");
    words.forEach((word) => {
      const route = routes[word];
      if (route) {
        route.forEach((cell, index) => {
          board[cell] = word[index] || "";
        });
      }
    });
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) board[i] = TURKISH_LETTERS[Math.floor(random() * TURKISH_LETTERS.length)] || "A";
    }
    return {
      ...config,
      board,
      words,
      routes,
      wordDifficulties: makeDifficultyMap(entries),
      wordCount: words.length,
      subtitle: `${words.length} kelime · ${config.timeLimit} sn · en az ${config.minTurns} dönüş`
    };
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
  words.forEach((word) => {
    const route = routes[word];
    if (route) {
      route.forEach((cell, index) => {
        board[cell] = word[index] || "";
      });
    }
  });
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) board[i] = TURKISH_LETTERS[Math.floor(random() * TURKISH_LETTERS.length)] || "A";
  }
  return {
    ...config,
    board,
    words,
    routes,
    wordDifficulties: makeDifficultyMap(entries),
    wordCount: words.length,
    subtitle: `${words.length} kelime · ${config.timeLimit} sn · en az ${config.minTurns} dönüş`
  };
}
