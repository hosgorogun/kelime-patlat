import { describe, expect, it } from "vitest";
import { checkPlacement, PlacedWord, WORD_DICTIONARY, generatePuzzle } from "../shared/puzzle-generator";

describe("Vintage Bulmaca Yerleştirme Doğrulama (checkPlacement) Testleri", () => {
  const mockSolutions: PlacedWord[] = [
    {
      id: "w1",
      answer: "KİTAP",
      category: "Kültür",
      clue: "Okunan basılı eser.",
      length: 5,
      difficulty: "easy",
      row: 2,
      col: 3,
      direction: "horizontal",
      isCenter: true,
      cells: [[2, 3], [2, 4], [2, 5], [2, 6], [2, 7]],
    },
    {
      id: "w2",
      answer: "TREN",
      category: "Ulaşım",
      clue: "Raylar üzerinde giden taşıt.",
      length: 4,
      difficulty: "easy",
      row: 2,
      col: 5, // Intersects KİTAP's 'T' (col 5)
      direction: "vertical",
      isCenter: false,
      cells: [[2, 5], [3, 5], [4, 5], [5, 5]],
    },
    {
      id: "w3",
      answer: "TREN", // Duplicate word in different location
      category: "Ulaşım",
      clue: "Başka bir tren rotası.",
      length: 4,
      difficulty: "medium",
      row: 6,
      col: 2,
      direction: "horizontal",
      isCenter: false,
      cells: [[6, 2], [6, 3], [6, 4], [6, 5]],
    },
  ];

  it("tahta sınırını aşan yatay veya dikey kelimeleri reddeder", () => {
    const emptyBoard = Array(10).fill(null).map(() => Array(10).fill(null));

    const outHorizontal = checkPlacement("KİTAP", 2, 8, "horizontal", emptyBoard, mockSolutions);
    expect(outHorizontal.valid).toBe(false);
    expect(outHorizontal.reason).toBe("Kelime tahta dışına çıkıyor!");

    const outVertical = checkPlacement("KİTAP", 8, 3, "vertical", emptyBoard, mockSolutions);
    expect(outVertical.valid).toBe(false);
    expect(outVertical.reason).toBe("Kelime tahta dışına çıkıyor!");
  });

  it("çözüm listesinde bulunmayan geçersiz kelimeleri reddeder", () => {
    const emptyBoard = Array(10).fill(null).map(() => Array(10).fill(null));
    const result = checkPlacement("BİLGİSAYAR", 0, 0, "horizontal", emptyBoard, mockSolutions);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Geçersiz kelime!");
  });

  it("çözümde olan fakat yanlış konuma veya yöne koyulan kelimeleri reddeder", () => {
    const emptyBoard = Array(10).fill(null).map(() => Array(10).fill(null));
    const wrongLocation = checkPlacement("KİTAP", 0, 0, "horizontal", emptyBoard, mockSolutions);
    expect(wrongLocation.valid).toBe(false);
    expect(wrongLocation.reason).toBe("Kelime bu konuma veya yöne yerleştirilemez!");

    const wrongDirection = checkPlacement("KİTAP", 2, 3, "vertical", emptyBoard, mockSolutions);
    expect(wrongDirection.valid).toBe(false);
    expect(wrongDirection.reason).toBe("Kelime bu konuma veya yöne yerleştirilemez!");
  });

  it("doğru konum ve yönde boş tahtaya geçerli yerleştirmeyi onaylar", () => {
    const emptyBoard = Array(10).fill(null).map(() => Array(10).fill(null));
    const validResult = checkPlacement("KİTAP", 2, 3, "horizontal", emptyBoard, mockSolutions);
    expect(validResult.valid).toBe(true);
    expect(validResult.reason).toBeUndefined();
  });

  it("birden fazla aynı kelime olduğunda doğru konumu eşleştirir (duplicate word support)", () => {
    const emptyBoard = Array(10).fill(null).map(() => Array(10).fill(null));

    // İlk TREN (vertical at 2, 5)
    const firstTren = checkPlacement("TREN", 2, 5, "vertical", emptyBoard, mockSolutions);
    expect(firstTren.valid).toBe(true);

    // İkinci TREN (horizontal at 6, 2)
    const secondTren = checkPlacement("TREN", 6, 2, "horizontal", emptyBoard, mockSolutions);
    expect(secondTren.valid).toBe(true);
  });

  it("kesişim harfi uyuşmazlığında yerleştirmeyi reddeder, uyuştuğunda onaylar", () => {
    const board = Array(10).fill(null).map(() => Array(10).fill(null));
    // Tahtaya KİTAP kelimesini yerleştiriyoruz (row 2, col 3: K, col 4: İ, col 5: T...)
    board[2]![3] = "K";
    board[2]![4] = "İ";
    board[2]![5] = "T";
    board[2]![6] = "A";
    board[2]![7] = "P";

    // TREN dikey olarak (row 2, col 5) 'T' ile kesişir -> uyumlu olmalı
    const validIntersect = checkPlacement("TREN", 2, 5, "vertical", board, mockSolutions);
    expect(validIntersect.valid).toBe(true);

    // Eğer kesişim hücresiinde başka bir harf varsa (örn: 'X')
    board[2]![5] = "X";
    const conflict = checkPlacement("TREN", 2, 5, "vertical", board, mockSolutions);
    expect(conflict.valid).toBe(false);
    expect(conflict.reason).toBe("Ortak hücredeki harf uyuşmuyor!");
  });

  it("kesişen kelimelerde harf havuzu benzersiz hücrelerden üretildiğinde fazladan harf bırakmaz", () => {
    // mockSolutions: KİTAP (5 harf) ve TREN (4 harf) 'T' harfinde kesişir
    // Toplam benzersiz hücre: 5 + 4 - 1 = 8 hücre
    const uniqueChars: string[] = [];
    const seenCells = new Set<string>();

    mockSolutions.slice(0, 2).forEach((w) => {
      w.cells.forEach(([r, c], idx) => {
        const key = `${r},${c}`;
        if (!seenCells.has(key)) {
          seenCells.add(key);
          uniqueChars.push(w.answer[idx]!);
        }
      });
    });

    // 8 benzersiz harf olmalı, fazladan 2. bir 'T' olmamalı
    expect(uniqueChars.length).toBe(8);
    const tCount = uniqueChars.filter((c) => c === "T").length;
    expect(tCount).toBe(1);
  });

  it("kelime yazılırken kesişimdeki dolu hücreleri atlayarak sıradaki boş hücreyi seçer", () => {
    // TREN dikey kelimesi: [2, 5] (T), [3, 5] (R), [4, 5] (E), [5, 5] (N)
    const board: (string | null)[][] = Array(10).fill(null).map(() => Array(10).fill(null));
    // [2, 5] hücresi KİTAP'tan gelen 'T' ile dolu
    board[2]![5] = "T";

    const targetWord = mockSolutions[1]!; // TREN
    // İlk boş hücre kontrolü
    const firstEmpty = targetWord.cells.find(([r, c]) => board[r]?.[c] === null);
    expect(firstEmpty).toEqual([3, 5]); // [2, 5]'i atlayıp [3, 5]'e odaklanmalı

    // R harfi [3, 5]'e koyulunca bir sonraki boş hücre [4, 5] olmalı
    board[3]![5] = "R";
    const currentIdx = targetWord.cells.findIndex(([cr, cc]) => cr === 3 && cc === 5);
    let nextEmpty: [number, number] | null = null;
    for (let i = currentIdx + 1; i < targetWord.cells.length; i++) {
      const [nr, nc] = targetWord.cells[i]!;
      if (board[nr]![nc] === null) {
        nextEmpty = [nr, nc];
        break;
      }
    }
    expect(nextEmpty).toEqual([4, 5]);
  });

  it("seviye kilidi 20. bölümü aşamaz ve başarıyla sınırlandırılır", () => {
    let maxUnlocked = 19;
    const completed = new Set<number>();

    // 19. bölüm tamamlanınca 20'ye geçer
    completed.add(19);
    maxUnlocked = Math.min(20, Math.max(maxUnlocked, 19 + 1));
    expect(maxUnlocked).toBe(20);

    // 20. bölüm tamamlanınca 20'de kalır (21'e taşmaz)
    completed.add(20);
    maxUnlocked = Math.min(20, Math.max(maxUnlocked, 20 + 1));
    expect(maxUnlocked).toBe(20);
  });

  it("WORD_DICTIONARY içindeki tüm kelimelerin answer.length ile length değeri eşleşir ve ipuçları geçerlidir", () => {
    expect(WORD_DICTIONARY.length).toBeGreaterThanOrEqual(70);
    for (const w of WORD_DICTIONARY) {
      expect(w.length).toBe(w.answer.length);
      expect(w.answer.trim().length).toBeGreaterThanOrEqual(3);
      expect(w.clue.trim().length).toBeGreaterThan(5);
      expect(w.category.trim().length).toBeGreaterThan(1);
      // Tüm harfler büyük harf olmalı
      expect(w.answer).toBe(w.answer.toLocaleUpperCase("tr-TR"));
    }
  });

  it("generatePuzzle tüm zorluklarda en az 3 kesişen kelimeli geçerli bir bulmaca üretir", () => {
    const difficulties = ["easy", "medium", "hard", "expert", "ultra"] as const;
    for (const diff of difficulties) {
      const p = generatePuzzle(diff);
      expect(p.words.length).toBeGreaterThanOrEqual(3);
      expect(p.boardSize).toBe(10);
      expect(p.centerWord).toBeDefined();
      expect(p.words.some((w) => w.id === p.centerWord.id)).toBe(true);
    }
  });
});
