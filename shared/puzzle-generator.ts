export interface WordEntry {
  id: string;
  answer: string;
  category: string;
  clue: string;
  difficulty: "easy" | "medium" | "hard";
  length: number;
}

export interface PlacedWord {
  id: string;
  answer: string;
  category: string;
  clue: string;
  difficulty: "easy" | "medium" | "hard";
  length: number;
  row: number;
  col: number;
  direction: "horizontal" | "vertical";
  isCenter: boolean;
  cells: [number, number][];
}

export interface PuzzleResult {
  boardSize: number;
  centerWord: PlacedWord;
  words: PlacedWord[];
  score: number;
}

// Geniş Türkçe İpucu Sözlüğü
export const WORD_DICTIONARY: Omit<WordEntry, "id">[] = [
  { answer: "ELMA", category: "Meyve", clue: "Kırmızı veya yeşil olabilen, lezzetli bir meyve.", length: 4, difficulty: "easy" },
  { answer: "KALEM", category: "Eşya", clue: "Yazı yazmak için kullanılan araç.", length: 5, difficulty: "easy" },
  { answer: "KEDİ", category: "Hayvan", clue: "Evde beslenebilen sevimli hayvan.", length: 4, difficulty: "easy" },
  { answer: "MASA", category: "Eşya", clue: "Üzerinde yemek yediğimiz, ders çalıştığımız mobilya.", length: 4, difficulty: "easy" },
  { answer: "DENİZ", category: "Doğa", clue: "Tuzlu sudan oluşan büyük su kütlesi.", length: 5, difficulty: "easy" },
  { answer: "KÖPEK", category: "Hayvan", clue: "İnsanın en sadık dostu olarak bilinen havlayan hayvan.", length: 5, difficulty: "easy" },
  { answer: "GÜNEŞ", category: "Uzay", clue: "Dünyamızı ısıtan ve aydınlatan dev yıldız.", length: 5, difficulty: "easy" },
  { answer: "KİTAP", category: "Eğitim", clue: "Sayfalardan oluşan okuma kaynağı.", length: 5, difficulty: "easy" },
  { answer: "ŞEHİR", category: "Coğrafya", clue: "Büyük yerleşim yeri, kent.", length: 5, difficulty: "easy" },
  { answer: "ARABA", category: "Taşıt", clue: "Dört tekerlekli motorlu kara taşıtı.", length: 5, difficulty: "easy" },
  { answer: "ŞEKER", category: "Gıda", clue: "Yiyeceklere tatlılık veren kristal madde.", length: 5, difficulty: "easy" },
  { answer: "SAHNE", category: "Sanat", clue: "Tiyatro ve konserlerde oyuncuların çıktığı alan.", length: 5, difficulty: "easy" },
  { answer: "NEHİR", category: "Doğa", clue: "Denize veya göle dökülen büyük akarsu.", length: 5, difficulty: "easy" },
  { answer: "ROKET", category: "Uzay", clue: "Uzaya fırlatılan yüksek hızlı araç.", length: 5, difficulty: "medium" },
  { answer: "TILSIM", category: "Gizem", clue: "Büyülü koruyucu nesne, muska.", length: 6, difficulty: "medium" },
  { answer: "KOSMOS", category: "Uzay", clue: "Evren ve gök cisimlerinin bütünü.", length: 6, difficulty: "medium" },
  { answer: "LEVYE", category: "Alet", clue: "Kaldıraç olarak kullanılan dayanıklı metal çubuk.", length: 5, difficulty: "medium" },
  { answer: "ORMAN", category: "Doğa", clue: "Ağaçlarla kaplı geniş doğal alan.", length: 5, difficulty: "easy" },
  { answer: "KAPLAN", category: "Hayvan", clue: "Çizgili kürkleri olan büyük yırtıcı kedi.", length: 6, difficulty: "medium" },
  { answer: "BİLGİ", category: "Kavram", clue: "Öğrenme ve deneyim sonucu elde edilen unsur.", length: 5, difficulty: "easy" },
  { answer: "BULUT", category: "Doğa", clue: "Gökyüzünde toplanan su buharı kümesi.", length: 5, difficulty: "easy" },
  { answer: "GİTAR", category: "Müzik", clue: "Telleri parmakla veya mızrapla çalınan enstrüman.", length: 5, difficulty: "easy" },
  { answer: "RADYO", category: "Elektronik", clue: "Ses dalgalarını yayınlayan iletişim aracı.", length: 5, difficulty: "medium" },
  { answer: "RÜZGAR", category: "Doğa", clue: "Havanın yer değiştirmesiyle oluşan esinti.", length: 6, difficulty: "medium" },
  { answer: "TOPRAK", category: "Doğa", clue: "Bitkilerin kök saldığı yeryüzü katmanı.", length: 6, difficulty: "medium" },
  { answer: "YILDIZ", category: "Uzay", clue: "Gökyüzünde geceleri parlayan gök cismi.", length: 6, difficulty: "easy" },
  { answer: "PENCERE", category: "Mimari", clue: "Odaya ışık ve hava girmesini sağlayan camlı çerçeve.", length: 7, difficulty: "hard" },
  { answer: "ŞEMSİYE", category: "Eşya", clue: "Yağmurdan ve güneşten koruyan açılır kapanır araç.", length: 7, difficulty: "hard" },
  { answer: "KELEBEK", category: "Hayvan", clue: "Rengarenk kanatları olan uçan böcek.", length: 7, difficulty: "medium" },
  { answer: "PUSULA", category: "Alet", clue: "Yön göstermeye yarayan mıknatıslı cihaz.", length: 6, difficulty: "medium" },
  { answer: "YUMURTA", category: "Gıda", clue: "Tavuğun ürettiği besleyici temel gıda.", length: 7, difficulty: "medium" },
  { answer: "ZAMAN", category: "Kavram", clue: "Geçmişten geleceğe kesintisiz akan süreç.", length: 5, difficulty: "easy" },
  { answer: "SABUN", category: "Temizlik", clue: "Köpürerek kirleri temizleyen hijyen ürünü.", length: 5, difficulty: "easy" },
  { answer: "LİMON", category: "Meyve", clue: "Sarı renkli ve çok ekşi narenciye meyvesi.", length: 5, difficulty: "easy" },
  { answer: "DUVAR", category: "Mimari", clue: "Yapıları bölmeye yarayan dikey yüzey.", length: 5, difficulty: "easy" },
  { answer: "AYNA", category: "Eşya", clue: "Görüntüyü yansıtan parlak cam yüzey.", length: 4, difficulty: "easy" },
  { answer: "MÜZİK", category: "Sanat", clue: "Seslerin ritmik ve harmonik düzeni.", length: 5, difficulty: "easy" },
  { answer: "BALIK", category: "Hayvan", clue: "Suda yüzgeçleriyle yüzen solungaçlı canlı.", length: 5, difficulty: "easy" },
  { answer: "TAVŞAN", category: "Hayvan", clue: "Uzun kulakları ve havuç sevgisiyle bilinen sevimli hayvan.", length: 6, difficulty: "easy" },

  // ZOR VE ORTA SEVİYE YENİ KELİMELER
  { answer: "FELSEFE", category: "Felsefe", clue: "Varlık, bilgi ve değer üzerine derin düşünce alanı.", length: 7, difficulty: "hard" },
  { answer: "HAKİKAT", category: "Kavram", clue: "Gerçeğin ta kendisi, asıl olan hakiki durum.", length: 7, difficulty: "hard" },
  { answer: "ERDEM", category: "Kavram", clue: "Ahlaki aydınlanma, dürüstlük ve iyilik niteliği.", length: 5, difficulty: "medium" },
  { answer: "DÜŞÜNCE", category: "Kavram", clue: "Zihinde üretilen akılcı fikir veya imge.", length: 7, difficulty: "medium" },
  { answer: "BİLİNÇ", category: "Felsefe", clue: "İnsanın kendisini ve çevresini algılama farkındalığı.", length: 5, difficulty: "hard" },
  { answer: "KUBBE", category: "Mimari", clue: "Yarım küre biçimindeki çatı mimari yapısı.", length: 5, difficulty: "medium" },
  { answer: "SÜTUN", category: "Mimari", clue: "Tavanı ve yapıyı taşıyan dikey silindirik direk.", length: 5, difficulty: "medium" },
  { answer: "ŞADIRVAN", category: "Mimari", clue: "Cami avlularında bulunan abdest çeşmeli su yapısı.", length: 8, difficulty: "hard" },
  { answer: "FOSİL", category: "Bilim", clue: "Taşlaşmış eski zaman canlı kalıntısı.", length: 5, difficulty: "medium" },
  { answer: "GÖKADA", category: "Uzay", clue: "Milyarlarca yıldızdan oluşan dev sistem, galaksi.", length: 6, difficulty: "hard" },
  { answer: "ATMOSFER", category: "Bilim", clue: "Dünyayı çevreleyen yaşam kaynağı gaz tabakası.", length: 8, difficulty: "hard" },
  { answer: "EKOSİSTEM", category: "Doğa", clue: "Canlıların çevreleriyle oluşturduğu yaşam dengesi.", length: 9, difficulty: "hard" },
  { answer: "KÜTÜPHANE", category: "Eğitim", clue: "Binlerce kitabın korunduğu bilgi ocağı.", length: 9, difficulty: "hard" },
  { answer: "ŞAHESER", category: "Sanat", clue: "Bir sanatçının yarattığı en mükemmel başyapıt.", length: 7, difficulty: "hard" },
  { answer: "EFSANE", category: "Edebiyat", clue: "Kuşaktan kuşağa anlatılan olağanüstü öykü.", length: 6, difficulty: "medium" },
  { answer: "DESTAN", category: "Edebiyat", clue: "Milletlerin kahramanlıklarını anlatan uzun şiirsel öykü.", length: 6, difficulty: "medium" },
  { answer: "TELESKOP", category: "Uzay", clue: "Uzak gök cisimlerini detaylı gözlemleme cihazı.", length: 8, difficulty: "hard" },
  { answer: "LABİRENT", category: "Gizem", clue: "Çıkışı bulunması zor, karmaşık yollar bütünü.", length: 8, difficulty: "medium" },
  { answer: "KİMYA", category: "Bilim", clue: "Maddelerin yapısını ve tepkimelerini inceleyen bilim.", length: 5, difficulty: "medium" },
  { answer: "KORİDOR", category: "Mimari", clue: "Odaları birbirine bağlayan uzun dar geçit.", length: 7, difficulty: "medium" },
  { answer: "SARAY", category: "Mimari", clue: "Hükümdarların ve kralların yaşadığı görkemli yapı.", length: 5, difficulty: "easy" },
  { answer: "HEYKEL", category: "Sanat", clue: "Taş, mermer veya metalden yapılan yontu eser.", length: 6, difficulty: "medium" },
  { answer: "FOTOĞRAF", category: "Sanat", clue: "Işıkla görüntü kaydetme ve dondurma sanatı.", length: 8, difficulty: "hard" },
  { answer: "TEKNOLOJİ", category: "Bilim", clue: "İnsanın hayatını kolaylaştıran teknik imkanlar bütünü.", length: 10, difficulty: "hard" },
  { answer: "MANTIK", category: "Felsefe", clue: "Doğru düşünme kural ve ilkesi.", length: 6, difficulty: "medium" },
  { answer: "ADALET", category: "Kavram", clue: "Hakkı gözetme, doğruluk ve hakkaniyet.", length: 6, difficulty: "medium" },
  { answer: "BİLGELİK", category: "Felsefe", clue: "Derin kavrayış ve olgun akıl düzeyi.", length: 8, difficulty: "hard" },
  { answer: "HAZİNE", category: "Gizem", clue: "Toprak altına gizlenmiş değerli eşya birikimi.", length: 6, difficulty: "medium" },
  { answer: "KAPTAN", category: "Meslek", clue: "Gemi veya uçağı sevk ve idare eden yönetici.", length: 6, difficulty: "easy" },
  { answer: "RİTİM", category: "Müzik", clue: "Seslerin ve vuruşların düzenli tekrarlanışı.", length: 5, difficulty: "medium" },
  { answer: "FIRTINA", category: "Doğa", clue: "Şiddetli rüzgar ve yağmurla gelişen hava olayı.", length: 7, difficulty: "medium" },
  { answer: "VOLKAN", category: "Doğa", clue: "Magmanın yeryüzüne püskürdüğü yanardağ.", length: 6, difficulty: "medium" },
  { answer: "TİYATRO", category: "Sanat", clue: "Sahnede canlı sergilenen oyun sanatı.", length: 7, difficulty: "medium" },
  { answer: "PİRAMİT", category: "Mimari", clue: "Eski Mısır'da inşa edilen üçgen yüzeyli anıt yapı.", length: 7, difficulty: "hard" },
];

export function calculateWordConnections(word1: string, word2: string): number {
  let count = 0;
  for (const char of word1) {
    if (word2.includes(char)) count++;
  }
  return count;
}

export function selectCenterWord(wordPool: Omit<WordEntry, "id">[]): Omit<WordEntry, "id"> | null {
  if (wordPool.length === 0) return null;

  let bestWord: Omit<WordEntry, "id"> | null = null;
  let highestScore = -Infinity;

  for (let i = 0; i < wordPool.length; i++) {
    const candidate = wordPool[i]!;
    
    // Ideal merkez kelime uzunluğu 4-7 harf olmalı
    if (candidate.length < 4 || candidate.length > 7) continue;

    let connectionCount = 0;
    for (let j = 0; j < wordPool.length; j++) {
      if (i === j) continue;
      connectionCount += calculateWordConnections(candidate.answer, wordPool[j]!.answer);
    }

    const lengthBonus = candidate.length >= 4 && candidate.length <= 6 ? 10 : 5;
    const centerScore = connectionCount * 5 + candidate.length * 3 + lengthBonus;

    if (centerScore > highestScore) {
      highestScore = centerScore;
      bestWord = candidate;
    }
  }

  // Eğer 4-7 harf arasında bulamadıysa ilk kelimeyi seç
  return bestWord || wordPool[0] || null;
}

interface PlacementCandidate {
  word: Omit<WordEntry, "id">;
  row: number;
  col: number;
  direction: "horizontal" | "vertical";
  intersectionsCount: number;
}

export function findPossiblePlacements(
  board: (string | null)[][],
  word: Omit<WordEntry, "id">
): PlacementCandidate[] {
  const candidates: PlacementCandidate[] = [];
  const W = word.answer;
  const len = W.length;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      // 1. Yatay Deneme
      if (c + len <= 10) {
        let valid = true;
        let intersections = 0;

        for (let i = 0; i < len; i++) {
          const currentCell = board[r]![c + i];
          if (currentCell !== null) {
            if (currentCell === W[i]) {
              intersections++;
            } else {
              valid = false;
              break;
            }
          }
        }

        if (valid && intersections > 0) {
          if (c > 0 && board[r]![c - 1] !== null) valid = false;
          if (c + len < 10 && board[r]![c + len] !== null) valid = false;

          for (let i = 0; i < len; i++) {
            if (board[r]![c + i] === null) {
              if (r > 0 && board[r - 1]![c + i] !== null) valid = false;
              if (r < 9 && board[r + 1]![c + i] !== null) valid = false;
            }
          }
        }

        if (valid && intersections > 0) {
          candidates.push({ word, row: r, col: c, direction: "horizontal", intersectionsCount: intersections });
        }
      }

      // 2. Dikey Deneme
      if (r + len <= 10) {
        let valid = true;
        let intersections = 0;

        for (let i = 0; i < len; i++) {
          const currentCell = board[r + i]![c];
          if (currentCell !== null) {
            if (currentCell === W[i]) {
              intersections++;
            } else {
              valid = false;
              break;
            }
          }
        }

        if (valid && intersections > 0) {
          if (r > 0 && board[r - 1]![c] !== null) valid = false;
          if (r + len < 10 && board[r + len]![c] !== null) valid = false;

          for (let i = 0; i < len; i++) {
            if (board[r + i]![c] === null) {
              if (c > 0 && board[r + i]![c - 1] !== null) valid = false;
              if (c < 9 && board[r + i]![c + 1] !== null) valid = false;
            }
          }
        }

        if (valid && intersections > 0) {
          candidates.push({ word, row: r, col: c, direction: "vertical", intersectionsCount: intersections });
        }
      }
    }
  }

  return candidates;
}

export function placeWordOnBoard(
  board: (string | null)[][],
  word: Omit<WordEntry, "id">,
  row: number,
  col: number,
  direction: "horizontal" | "vertical",
  isCenter: boolean = false
): PlacedWord {
  const cells: [number, number][] = [];
  for (let i = 0; i < word.length; i++) {
    const r = direction === "horizontal" ? row : row + i;
    const c = direction === "horizontal" ? col + i : col;
    board[r]![c] = word.answer[i]!;
    cells.push([r, c]);
  }

  return {
    id: `pw-${Math.random().toString(36).slice(2, 8)}`,
    answer: word.answer,
    category: word.category,
    clue: word.clue,
    difficulty: word.difficulty,
    length: word.length,
    row,
    col,
    direction,
    isCenter,
    cells,
  };
}

export function generatePuzzle(difficulty: "easy" | "medium" | "hard" | "expert" = "easy"): PuzzleResult {
  const targetCount = difficulty === "easy" ? 4 : difficulty === "medium" ? 5 : difficulty === "hard" ? 6 : 7;
  const filteredWords = WORD_DICTIONARY.filter((w) => {
    if (difficulty === "easy") return w.length <= 6 && w.difficulty === "easy";
    if (difficulty === "medium") return w.length <= 7 && (w.difficulty === "easy" || w.difficulty === "medium");
    if (difficulty === "hard") return w.length <= 8 && (w.difficulty === "medium" || w.difficulty === "hard");
    return w.length <= 8; // expert mode max 8 letters
  });

  for (let attempt = 0; attempt < 50; attempt++) {
    const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);
    const pool = shuffled.slice(0, Math.min(targetCount + 5, shuffled.length));

    const center = selectCenterWord(pool);
    if (!center) continue;

    const board: (string | null)[][] = Array(10).fill(null).map(() => Array(10).fill(null));
    const placedWords: PlacedWord[] = [];

    // Merkez kelimeyi yatay olarak geometri merkezine (row=4, col=3 veya uygun orta) koy
    const startCol = Math.max(0, Math.min(10 - center.length, Math.floor((10 - center.length) / 2)));
    const startRow = 4;

    const centerPlaced = placeWordOnBoard(board, center, startRow, startCol, "horizontal", true);
    placedWords.push(centerPlaced);

    const remainingWords = pool.filter((w) => w.answer !== center.answer);

    const backtrack = (index: number): boolean => {
      if (placedWords.length >= targetCount || index >= remainingWords.length) {
        return placedWords.length >= Math.min(3, targetCount);
      }

      const currentWord = remainingWords[index]!;
      const candidates = findPossiblePlacements(board, currentWord);

      candidates.sort((a, b) => b.intersectionsCount - a.intersectionsCount);

      for (const cand of candidates) {
        const boardSnapshot = board.map((row) => [...row]);
        const placed = placeWordOnBoard(board, currentWord, cand.row, cand.col, cand.direction, false);
        placedWords.push(placed);

        if (backtrack(index + 1)) {
          return true;
        }

        placedWords.pop();
        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 10; c++) {
            board[r]![c] = boardSnapshot[r]![c]!;
          }
        }
      }

      return backtrack(index + 1);
    };

    backtrack(0);

    if (placedWords.length >= 3) {
      return {
        boardSize: 10,
        centerWord: centerPlaced,
        words: placedWords,
        score: placedWords.length * 20,
      };
    }
  }

  // Fallback
  const fallbackCenter = { answer: "ELMA", category: "Meyve", clue: "Kırmızı veya yeşil olabilen, lezzetli bir meyve.", length: 4, difficulty: "easy" as const };
  const fallbackBoard: (string | null)[][] = Array(10).fill(null).map(() => Array(10).fill(null));
  const fallbackCenterPlaced = placeWordOnBoard(fallbackBoard, fallbackCenter, 4, 3, "horizontal", true);
  const fallbackKalem = placeWordOnBoard(fallbackBoard, { answer: "KALEM", category: "Eşya", clue: "Yazı yazmak için kullanılan araç.", length: 5, difficulty: "easy" as const }, 2, 4, "vertical", false);

  return {
    boardSize: 10,
    centerWord: fallbackCenterPlaced,
    words: [fallbackCenterPlaced, fallbackKalem],
    score: 100,
  };
}

/**
 * Yerleştirme Doğrulaması (Frontend için)
 */
export function checkPlacement(
  wordAnswer: string,
  startRow: number,
  startCol: number,
  direction: "horizontal" | "vertical",
  currentBoard: (string | null)[][],
  solutionWords: PlacedWord[]
): { valid: boolean; reason?: string } {
  const len = wordAnswer.length;

  // 1. Sınır kontrolü
  if (direction === "horizontal" && startCol + len > 10) {
    return { valid: false, reason: "Kelime tahta dışına çıkıyor!" };
  }
  if (direction === "vertical" && startRow + len > 10) {
    return { valid: false, reason: "Kelime tahta dışına çıkıyor!" };
  }

  // 2. Çözüm ile uyumluluk kontrolü (Solution Validation)
  const targetSolution = solutionWords.find(
    (w) => w.answer.toLocaleUpperCase("tr-TR") === wordAnswer.toLocaleUpperCase("tr-TR")
  );

  if (!targetSolution) {
    return { valid: false, reason: "Geçersiz kelime!" };
  }

  if (
    targetSolution.row !== startRow ||
    targetSolution.col !== startCol ||
    targetSolution.direction !== direction
  ) {
    return { valid: false, reason: "Kelime bu konuma veya yöne yerleştirilemez!" };
  }

  // 3. Mevcut tahta ile çakışma kontrolü
  for (let i = 0; i < len; i++) {
    const r = direction === "horizontal" ? startRow : startRow + i;
    const c = direction === "horizontal" ? startCol + i : startCol;
    const cellChar = currentBoard[r]![c];
    if (cellChar !== null && cellChar !== wordAnswer[i]) {
      return { valid: false, reason: "Ortak hücredeki harf uyuşmuyor!" };
    }
  }

  return { valid: true };
}
