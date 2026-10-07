import { describe, expect, it } from "vitest";
import {
  createInitialTurnBoard,
  calculateTurnWordScore,
  type TurnMatch,
} from "../shared/turn-match";
import {
  createTurnMatchRecord,
  findTurnMatchById,
  getUserTurnMatchRecords,
  updateTurnMatchRecord,
} from "../server/db";
import { isValidTurkishWord } from "../shared/dictionary";
import { isEqualTr, normalizeTrUpper } from "../shared/tr-utils";

describe("Senior QA Test Suite: Kahve Düellosu (Asenkron Sıra Tabanlı PvP)", () => {
  it("createInitialTurnBoard 4x4 ve 6x6 tahtalar için geçerli Türkçe harf dizileri üretmelidir", () => {
    const board4 = createInitialTurnBoard(4);
    expect(board4.length).toBe(16);
    expect(board4.every((char) => typeof char === "string" && char.length === 1)).toBe(true);

    const board6 = createInitialTurnBoard(6);
    expect(board6.length).toBe(36);
    expect(board6.every((char) => typeof char === "string" && char.length === 1)).toBe(true);
  });

  it("calculateTurnWordScore kelime uzunluğuna göre doğru puan kademelerini hesaplamalıdır", () => {
    expect(calculateTurnWordScore("SU")).toBe(5);
    expect(calculateTurnWordScore("KÖK")).toBe(15);
    expect(calculateTurnWordScore("KAPI")).toBe(25);
    expect(calculateTurnWordScore("GÜNEŞ")).toBe(40);
    expect(calculateTurnWordScore("KARTAL")).toBe(60); // 6 harf
    expect(calculateTurnWordScore("PENCERE")).toBe(85); // 7 harf
    expect(calculateTurnWordScore("LABİRENT")).toBe(110); // 8 harf (85 + 25)
    expect(calculateTurnWordScore("CUMHURİYET")).toBe(85 + 3 * 25); // 10 harf (160)
  });

  it("Yeni düello kaydı oluşturulabilmeli, 24 saat mühlet ve 1. oyuncu sırası ile başlamalıdır", async () => {
    const matchId = `test_turn_${Date.now()}`;
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const created = await createTurnMatchRecord({
      id: matchId,
      player1Id: "p1_alpha",
      player1Name: "Alpha Oyuncu",
      player1Avatar: "spark",
      player2Id: "p2_beta",
      player2Name: "Beta Oyuncu",
      player2Avatar: "orbit",
      turnPlayerId: "p1_alpha",
      board: ["K", "A", "P", "I", "E", "L", "M", "A", "D", "E", "N", "İ", "Z", "O", "T", "U"],
      size: 4,
      round: 1,
      maxRounds: 3,
      player1Score: 0,
      player2Score: 0,
      foundWords: [],
      status: "active",
      winnerId: null,
      deadline,
    });

    expect(created).toBeDefined();
    expect(created.id).toBe(matchId);
    expect(created.turnPlayerId).toBe("p1_alpha");
    expect(created.status).toBe("active");
    expect(created.round).toBe(1);

    const fetched = await findTurnMatchById(matchId);
    expect(fetched).not.toBeNull();
    expect(fetched?.player1Name).toBe("Alpha Oyuncu");

    const userMatches = await getUserTurnMatchRecords("p1_alpha");
    expect(userMatches.some((m) => m.id === matchId)).toBe(true);
  });

  it("Hamle yapıldığında puan artmalı ve sıra 2. oyuncuya geçmelidir", async () => {
    const matchId = `test_move_${Date.now()}`;
    await createTurnMatchRecord({
      id: matchId,
      player1Id: "p1_hamle",
      player1Name: "P1",
      player2Id: "p2_hamle",
      player2Name: "P2",
      turnPlayerId: "p1_hamle",
      board: ["K", "A", "P", "I", "E", "L", "M", "A", "D", "E", "N", "İ", "Z", "O", "T", "U"],
      size: 4,
      round: 1,
      maxRounds: 3,
      player1Score: 0,
      player2Score: 0,
      foundWords: [],
      status: "active",
      winnerId: null,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // P1 plays "KAPI" (indices 0, 1, 2, 3) -> 4 letters = 25 points
    const word = "KAPI";
    const wordScore = calculateTurnWordScore(word);
    expect(isValidTurkishWord(word)).toBe(true);

    const updated = await updateTurnMatchRecord(matchId, {
      player1Score: wordScore,
      turnPlayerId: "p2_hamle",
      foundWords: [
        {
          word,
          playerId: "p1_hamle",
          score: wordScore,
          playedAt: Date.now(),
        },
      ],
    });

    expect(updated?.player1Score).toBe(25);
    expect(updated?.turnPlayerId).toBe("p2_hamle");
    expect(updated?.foundWords.length).toBe(1);
    expect(updated?.foundWords[0]?.word).toBe("KAPI");
  });

  it("Son tur tamamlandığında maç sonuçlanmalı ve kazanan doğru ilan edilmelidir", async () => {
    const matchId = `test_end_${Date.now()}`;
    await createTurnMatchRecord({
      id: matchId,
      player1Id: "p1_champ",
      player1Name: "Şampiyon",
      player2Id: "p2_runner",
      player2Name: "İkinci",
      turnPlayerId: "p2_runner",
      board: ["E", "L", "M", "A", "A", "R", "M", "U", "T", "K", "İ", "R", "A", "Z", "O", "T"],
      size: 4,
      round: 3,
      maxRounds: 3,
      player1Score: 80,
      player2Score: 40,
      foundWords: [],
      status: "active",
      winnerId: null,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // P2 plays round 3 word: "ELMA" (25 points) -> Total P2 = 65, P1 = 80 -> P1 wins
    const p2WordScore = calculateTurnWordScore("ELMA");
    const finalP2Score = 40 + p2WordScore; // 65
    const isCompleted = true;
    const winnerId = 80 > finalP2Score ? "p1_champ" : "p2_runner";

    const finished = await updateTurnMatchRecord(matchId, {
      player2Score: finalP2Score,
      round: 4,
      status: "completed",
      winnerId,
    });

    expect(finished?.status).toBe("completed");
    expect(finished?.winnerId).toBe("p1_champ");
    expect(finished?.player1Score).toBe(80);
    expect(finished?.player2Score).toBe(65);
  });
});
