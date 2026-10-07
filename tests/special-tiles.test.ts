import { describe, expect, it } from "vitest";
import { createSoloBoard, generateSpecialTiles, getSoloLevel } from "../shared/solo";
import { isAdjacent } from "../shared/game";

describe("Senior QA Test Suite: Özel Tahta Hücreleri (Special Tiles: Buz 🧊, Bomba 💣, Altın 🪙)", () => {
  it("Seviye 16 altındaki seviyelerde özel hücre üretilmemelidir", () => {
    for (let lvl = 1; lvl < 16; lvl += 3) {
      const config = getSoloLevel(lvl);
      const mockRoutes = { "KELİME": [0, 1, 2, 3] };
      const tiles = generateSpecialTiles(lvl, mockRoutes, config.size, () => 0.5);
      expect(Object.keys(tiles).length).toBe(0);

      const board = createSoloBoard(lvl, 42);
      expect(board.specialTiles === undefined || Object.keys(board.specialTiles).length === 0).toBe(true);
    }
  });

  it("Seviye 16-29 arasında yalnızca Buz (ice) hücreleri üretilmelidir", () => {
    const config = getSoloLevel(20);
    const mockRoutes = { "ELMA": [0, 1, 2, 3], "ARMUT": [4, 5, 6, 7, 8] };
    const tiles = generateSpecialTiles(20, mockRoutes, config.size, () => 0.1);
    const tileValues = Object.values(tiles);

    expect(tileValues.length).toBeGreaterThan(0);
    tileValues.forEach((tile) => {
      expect(tile.type).toBe("ice");
      expect(tile.index).toBeGreaterThanOrEqual(0);
      expect(tile.index).toBeLessThan(config.size * config.size);
    });
  });

  it("Seviye 30-44 arasında Buz ve Bomba hücreleri birlikte bulunabilmelidir", () => {
    const config = getSoloLevel(35);
    const mockRoutes = {
      "KİTAP": [0, 1, 2, 3, 4],
      "DEFTER": [5, 6, 7, 8, 9, 10],
      "KALEM": [11, 12, 13, 14, 15],
    };
    const tiles = generateSpecialTiles(35, mockRoutes, config.size, () => 0.5);
    const tileValues = Object.values(tiles);

    expect(tileValues.length).toBeGreaterThan(0);
    const types = tileValues.map((t) => t.type);
    expect(types).toContain("ice");
    expect(types).toContain("bomb");

    const bombTile = tileValues.find((t) => t.type === "bomb");
    expect(bombTile?.counter).toBe(4);
  });

  it("Seviye 45 ve üzerinde Altın (gold) hücreleri de havuza eklenmelidir", () => {
    const config = getSoloLevel(50);
    const mockRoutes = {
      "KİTAP": [0, 1, 2, 3, 4],
      "DEFTER": [5, 6, 7, 8, 9, 10],
      "KALEM": [11, 12, 13, 14, 15],
      "SÖZLÜK": [16, 17, 18, 19, 20, 21],
    };
    const tiles = generateSpecialTiles(50, mockRoutes, config.size, () => 0.5);
    const tileValues = Object.values(tiles);

    expect(tileValues.length).toBeGreaterThan(0);
    const types = tileValues.map((t) => t.type);
    expect(types).toContain("ice");
    expect(types).toContain("bomb");
    expect(types).toContain("gold");

    const goldTile = tileValues.find((t) => t.type === "gold");
    expect(goldTile?.bonusChips).toBe(15);
  });

  it("createSoloBoard fonksiyonu üretilen tahta üzerinde özel hücreleri doğru indekslerle bağlamalıdır", () => {
    const board = createSoloBoard(32, 9999);
    expect(board.specialTiles).toBeDefined();

    const specialIndices = Object.keys(board.specialTiles!).map(Number);
    specialIndices.forEach((idx) => {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(board.size * board.size);
      // İlgili hücrede bir harf bulunmalıdır
      expect(board.board[idx]).toBeTruthy();
      expect(typeof board.board[idx]).toBe("string");
    });
  });

  it("Bomba patlaması tüm komşu hücrelerle dik açılı komşuluk (orthogonal adjacency) kurmalıdır", () => {
    const size = 6;
    const bombIndex = 14; // row 2, col 2

    // Check adjacent indices to bomb
    const expectedNeighbors = [
      bombIndex - size, // 8 (yukarı)
      bombIndex + size, // 20 (aşağı)
      bombIndex - 1,    // 13 (sol)
      bombIndex + 1,    // 15 (sağ)
    ];

    expectedNeighbors.forEach((neighbor) => {
      expect(isAdjacent(bombIndex, neighbor, size)).toBe(true);
    });

    // Çapraz hücreler dik açılı kural gereği komşu olmamalıdır
    expect(isAdjacent(bombIndex, bombIndex - size - 1, size)).toBe(false);
    expect(isAdjacent(bombIndex, bombIndex + size + 1, size)).toBe(false);
  });
});
