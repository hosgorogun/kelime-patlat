import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import {
  createTurnMatchRecord,
  getUserTurnMatchRecords,
  findTurnMatchById,
  updateTurnMatchRecord,
  type TurnMatchDocument,
} from "../db";
import {
  createInitialTurnBoard,
  calculateTurnWordScore,
  type TurnMatch,
} from "../../shared/turn-match";
import { normalizeTr, normalizeTrUpper, isEqualTr } from "../../shared/tr-utils";
import { isValidTurkishWord } from "../../shared/dictionary";

export const turnMatchRouter = Router();

const createSchema = z.object({
  player1Id: z.string().min(1),
  player1Name: z.string().min(1),
  player1Avatar: z.string().optional(),
  player2Id: z.string().min(1),
  player2Name: z.string().min(1),
  player2Avatar: z.string().optional(),
  size: z.union([z.literal(4), z.literal(6)]).default(4),
});

const playSchema = z.object({
  playerId: z.string().min(1),
  word: z.string().min(2),
  selection: z.array(z.number().int()).min(2),
});

// 1. Yeni Asenkron Düello Başlat
turnMatchRouter.post("/create", async (req, res) => {
  try {
    const parse = createSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Geçersiz istek parametreleri." });
    }
    const { player1Id, player1Name, player1Avatar, player2Id, player2Name, player2Avatar, size } = parse.data;

    const board = createInitialTurnBoard(size);
    const matchId = `turn_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat hamle süresi

    const record: Omit<TurnMatchDocument, "createdAt" | "updatedAt"> = {
      id: matchId,
      player1Id,
      player1Name,
      player1Avatar: player1Avatar || "spark",
      player2Id,
      player2Name,
      player2Avatar: player2Avatar || "orbit",
      turnPlayerId: player1Id,
      board,
      size,
      round: 1,
      maxRounds: 5,
      player1Score: 0,
      player2Score: 0,
      foundWords: [],
      status: "active",
      winnerId: null,
      deadline,
    };

    const created = await createTurnMatchRecord(record);
    res.json({ success: true, match: created });
  } catch (err: any) {
    console.error("[TurnMatch] create error:", err);
    res.status(500).json({ error: "Maç oluşturulamadı." });
  }
});

// 2. Kullanıcının Aktif ve Tamamlanan Maçlarını Listele
turnMatchRouter.get("/my-matches", async (req, res) => {
  try {
    const userId = (req.query.userId as string)?.trim();
    if (!userId) {
      return res.status(400).json({ error: "Kullanıcı ID gereklidir." });
    }
    const matches = await getUserTurnMatchRecords(userId);
    res.json({ success: true, matches });
  } catch (err: any) {
    console.error("[TurnMatch] my-matches error:", err);
    res.status(500).json({ error: "Maçlar yüklenemedi." });
  }
});

// 3. Tek Maç Detayı Getir
turnMatchRouter.get("/:id", async (req, res) => {
  try {
    const matchId = req.params.id;
    const match = await findTurnMatchById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Maç bulunamadı." });
    }
    res.json({ success: true, match });
  } catch (err: any) {
    console.error("[TurnMatch] get by id error:", err);
    res.status(500).json({ error: "Maç detayı alınamadı." });
  }
});

// 4. Hamle Yap (Sıradaki Kelimeyi Oyna)
turnMatchRouter.post("/:id/play", async (req, res) => {
  try {
    const matchId = req.params.id;
    const parse = playSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Geçersiz hamle parametreleri." });
    }
    const { playerId, word, selection } = parse.data;

    const match = await findTurnMatchById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Maç bulunamadı." });
    }
    if (match.status !== "active") {
      return res.status(400).json({ error: "Bu maç tamamlanmış veya süresi dolmuş." });
    }
    if (match.turnPlayerId !== playerId) {
      return res.status(403).json({ error: "Sıra sizde değil!" });
    }

    // Tahta harf doğrulaması
    const constructedWord = selection.map((idx) => match.board[idx] || "").join("");
    const upperWord = normalizeTrUpper(word.trim());
    if (!isEqualTr(constructedWord, upperWord)) {
      return res.status(400).json({ error: "Kelime tahtadaki seçimle uyuşmuyor." });
    }

    // Kelime geçerlilik doğrulaması (Sözlük)
    if (!isValidTurkishWord(upperWord)) {
      return res.status(400).json({ error: "Geçerli bir Türkçe kelime değil." });
    }

    const wordScore = calculateTurnWordScore(upperWord);
    const isPlayer1 = match.player1Id === playerId;

    const nextP1Score = isPlayer1 ? match.player1Score + wordScore : match.player1Score;
    const nextP2Score = !isPlayer1 ? match.player2Score + wordScore : match.player2Score;

    const newFoundWords = [
      ...(match.foundWords || []),
      {
        word: upperWord,
        playerId,
        score: wordScore,
        playedAt: Date.now(),
      },
    ];

    let nextRound = match.round;
    let nextTurnPlayerId = isPlayer1 ? match.player2Id : match.player1Id;
    let nextStatus: "active" | "completed" = "active";
    let winnerId: string | null = null;

    if (!isPlayer1) {
      // 2. oyuncu hamlesini bitirdiğinde tur ilerler
      nextRound += 1;
    }

    if (nextRound > match.maxRounds) {
      nextStatus = "completed";
      if (nextP1Score > nextP2Score) {
        winnerId = match.player1Id;
      } else if (nextP2Score > nextP1Score) {
        winnerId = match.player2Id;
      } else {
        winnerId = "draw";
      }
    }

    const nextDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let updated = await updateTurnMatchRecord(matchId, {
      player1Score: nextP1Score,
      player2Score: nextP2Score,
      foundWords: newFoundWords,
      round: nextRound,
      turnPlayerId: nextTurnPlayerId,
      status: nextStatus,
      winnerId,
      deadline: nextDeadline,
    });

    // Otomatik Bot Hamlesi (Eğer rakip botsa ve maç bitmediyse)
    if (nextStatus === "active" && (nextTurnPlayerId.startsWith("bot_") || match.player2Name.includes("Bot"))) {
      const botScore = 15 + Math.floor(Math.random() * 25);
      const botWords = ["KARA", "MASA", "YOL", "KENT", "ZAMAN", "KUTU"];
      const botWord = botWords[Math.floor(Math.random() * botWords.length)]!;
      
      const finalFoundWords = [
        ...(updated?.foundWords || []),
        {
          word: botWord,
          playerId: nextTurnPlayerId,
          score: botScore,
          playedAt: Date.now() + 1000,
        },
      ];
      const finalRound = nextRound + 1;
      let finalStatus: "active" | "completed" = "active";
      let finalWinner: string | null = null;
      const finalP2Score = nextP2Score + botScore;

      if (finalRound > match.maxRounds) {
        finalStatus = "completed";
        finalWinner = nextP1Score > finalP2Score ? match.player1Id : finalP2Score > nextP1Score ? match.player2Id : "draw";
      }

      updated = await updateTurnMatchRecord(matchId, {
        player2Score: finalP2Score,
        foundWords: finalFoundWords,
        round: finalRound,
        turnPlayerId: match.player1Id,
        status: finalStatus,
        winnerId: finalWinner,
      });
    }

    res.json({ success: true, match: updated, scoreEarned: wordScore });
  } catch (err: any) {
    console.error("[TurnMatch] play turn error:", err);
    res.status(500).json({ error: "Hamle kaydedilemedi." });
  }
});
