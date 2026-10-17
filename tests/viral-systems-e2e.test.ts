import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EventEmitter } from "node:events";

import { DEFAULT_PROGRESS, type PlayerProgress } from "@/shared/progression";
import { TURKISH_CITIES, getCityByName } from "@/shared/cities";
import { generateDailyWordle, buildDailyShareText } from "@/shared/daily-wordle";

vi.mock("@/server/db", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    connectDb: vi.fn().mockRejectedValue(new Error("Offline DB in unit tests")),
  };
});

import { gameRouter } from "@/server/routes/game.routes";
import { CityLeagueModal } from "@/components/city-league/city-league-modal";
import { DailyPuzzleModal } from "@/components/daily/daily-puzzle-modal";
import { ChallengeModal } from "@/components/challenge/challenge-modal";
import { MatchResultModal } from "@/components/modals/match-result-modal";
import { CommandCenter } from "@/components/command/command-center";
import { getCityStandings, addCityScore } from "@/server/game/city-league-service";

interface ApiResponse<T = any> {
  status: number;
  body: T;
}

/**
 * In-process Express route dispatcher for fast, socket-free sandbox testing.
 */
function callGameApi<T = any>(
  method: "GET" | "POST",
  path: string,
  body?: any
): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    let resolved = false;
    let statusCode = 200;
    const stripped = path.replace(/^\/api\/game/, "");
    const [pathname, queryString] = stripped.split("?");
    const query: Record<string, string> = {};
    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      for (const [k, v] of searchParams.entries()) {
        query[k] = v;
      }
    }

    const req: any = new EventEmitter();
    req.method = method;
    req.url = pathname;
    req.originalUrl = path;
    req.path = pathname;
    req.query = query;
    req.body = body ?? {};
    req.headers = { "content-type": "application/json" };
    req.get = (header: string) => req.headers[header.toLowerCase()];

    const res: any = new EventEmitter();
    res.statusCode = 200;
    res.status = (code: number) => {
      statusCode = code;
      res.statusCode = code;
      return res;
    };
    res.setHeader = () => res;
    res.getHeader = () => undefined;
    res.json = (data: any) => {
      if (!resolved) {
        resolved = true;
        res.emit("finish");
        resolve({ status: statusCode, body: data });
      }
      return res;
    };
    res.send = (data: any) => {
      if (!resolved) {
        resolved = true;
        res.emit("finish");
        resolve({ status: statusCode, body: data });
      }
      return res;
    };
    res.end = (data?: any) => {
      if (!resolved) {
        resolved = true;
        res.emit("finish");
        resolve({ status: statusCode, body: data });
      }
      return res;
    };

    gameRouter(req, res, (err) => {
      if (!resolved) {
        resolved = true;
        if (err) {
          resolve({ status: 500, body: { error: err.message } as any });
        } else {
          resolve({ status: 404, body: { error: "Not Found" } as any });
        }
      }
    });
  });
}

describe("E2E Suite: Viral & Retention Systems - UI Component Renders", () => {
  describe("CityLeagueModal UI Component", () => {
    it("visible false iken hiçbir şey render etmemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(CityLeagueModal, {
          visible: false,
          onClose: vi.fn(),
          onSelectCity: vi.fn(),
        })
      );
      expect(html).toBe("");
    });

    it("visible true iken 81 İl Ligi başlığını, podyumu ve şehir seçimini render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(CityLeagueModal, {
          visible: true,
          onClose: vi.fn(),
          selectedCity: "İstanbul",
          standings: getCityStandings(),
          onSelectCity: vi.fn(),
        })
      );

      expect(html).toContain("81 İL LİGİ");
      expect(html).toContain("Şehrin İçin Yarış");
      expect(html).toContain("İstanbul");
      expect(html).toContain("TR");
      expect(html).toContain("34");
      expect(html).toContain("TÜMÜ (81)");
      expect(html).toContain("Marmara");
      expect(html).toContain("İç Anadolu");
    });
  });

  describe("DailyPuzzleModal UI Component", () => {
    it("visible false iken hiçbir şey render etmemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(DailyPuzzleModal, {
          visible: false,
          onClose: vi.fn(),
          progress: DEFAULT_PROGRESS,
        })
      );
      expect(html).toBe("");
    });

    it("visible true iken Günün Bulmacası başlığını ve başlatma kartını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(DailyPuzzleModal, {
          visible: true,
          onClose: vi.fn(),
          progress: DEFAULT_PROGRESS,
        })
      );

      expect(html).toContain("GÜNÜN BULMACASI");
      expect(html).toContain("Türkiye ile Aynı Anda Çöz!");
      expect(html).toContain("BULMACAYI BAŞLAT");
    });

    it("tamamlanmış durumda iken WhatsApp paylaşım kartını ve geri sayımı render etmelidir", () => {
      const today = new Date().toISOString().slice(0, 10);
      const completedProgress: PlayerProgress = {
        ...DEFAULT_PROGRESS,
        dailyWordleCompletedDate: today,
      };

      const html = renderToStaticMarkup(
        React.createElement(DailyPuzzleModal, {
          visible: true,
          onClose: vi.fn(),
          progress: completedProgress,
        })
      );

      expect(html).toContain("GÜNÜN BULMACASI");
      expect(html).toContain("GÜNÜN BULMACASI ÇÖZÜLDÜ!");
      expect(html).toContain("WHATSAPP");
      expect(html).toContain("Kalan Süre");
    });
  });

  describe("ChallengeModal UI Component", () => {
    it("mode create iken meydan okuma oluşturma kartını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ChallengeModal, {
          visible: true,
          onClose: vi.fn(),
          progress: DEFAULT_PROGRESS,
          mode: "create",
        })
      );

      expect(html).toContain("ARKADAŞA MEYDAN OKU");
      expect(html).toContain("MEYDAN OKUMA OLUŞTUR ⚡");
    });

    it("challenge oluşturulduğunda kod ve WhatsApp butonunu render etmelidir", () => {
      const mockChallenge = {
        id: "CH-TEST",
        creatorId: "user_test",
        creatorName: "Barış",
        creatorScore: 420,
        size: 4 as const,
        board: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"],
        words: ["ABC"],
        timeLimit: 60,
        createdAt: Date.now(),
        expiresAt: Date.now() + 604800000,
        attemptsCount: 0,
      };

      const html = renderToStaticMarkup(
        React.createElement(ChallengeModal, {
          visible: true,
          onClose: vi.fn(),
          progress: DEFAULT_PROGRESS,
          mode: "create",
          challengeData: mockChallenge,
        })
      );

      expect(html).toContain("CH-TEST");
      expect(html).toContain("Hedef: 420 Puan");
      expect(html).toContain("WHATSAPP İLE GÖNDER");
    });

    it("mode play iken rakibin adını ve hedef skoru render etmelidir", () => {
      const mockChallenge = {
        id: "CH-PLAY",
        creatorId: "creator_1",
        creatorName: "Zeynep",
        creatorScore: 510,
        size: 4 as const,
        board: ["K", "A", "L", "E", "M", "L", "İ", "K", "A", "R", "T", "I", "S", "O", "N", "U"],
        words: ["KALEM"],
        timeLimit: 60,
        createdAt: Date.now(),
        expiresAt: Date.now() + 604800000,
        attemptsCount: 1,
      };

      const html = renderToStaticMarkup(
        React.createElement(ChallengeModal, {
          visible: true,
          onClose: vi.fn(),
          progress: DEFAULT_PROGRESS,
          mode: "play",
          challengeData: mockChallenge,
        })
      );

      expect(html).toContain("Zeynep Sana Meydan Okudu!");
      expect(html).toContain("510 PUAN");
      expect(html).toContain("MEYDAN OKUMAYI BAŞLAT ▶");
    });
  });

  describe("MatchResultModal Challenge Action Button", () => {
    it("onChallengeFriend verildiğinde 'BU TAHTAYLA ARKADAŞINA MEYDAN OKU' butonunu render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(MatchResultModal, {
          visible: true,
          iWon: true,
          isDraw: false,
          activeVictoryEffect: "pulse",
          progress: DEFAULT_PROGRESS,
          myScore: 400,
          opponentScore: 320,
          myWordCount: 4,
          opponentWordCount: 3,
          wordsTotal: 5,
          meName: "Barış",
          opponentName: "Can",
          matchXpEarned: 100,
          matchLpEarned: 25,
          matchCoinsEarned: 30,
          isCustomRoom: false,
          myTempo: 45,
          opponentTempo: 38,
          allFinishedWords: [],
          myFoundWords: [],
          onInspectWord: vi.fn(),
          onRequestRematch: vi.fn(),
          onChallengeFriend: vi.fn(),
          onLeaveRoom: vi.fn(),
          onClose: vi.fn(),
        })
      );

      expect(html).toContain("BU TAHTAYLA ARKADAŞINA MEYDAN OKU");
    });
  });

  describe("CommandCenter Quick Actions Row", () => {
    it("81 İl Ligi ve Günün Bulmacası hızlı erişim kartlarını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(CommandCenter, {
          playerName: "TestOyuncu",
          progress: { ...DEFAULT_PROGRESS, city: "Ankara" },
          leaderboard: [],
          onPlayBot: vi.fn(),
          onSolo: vi.fn(),
          onNavigate: vi.fn(),
          onShowGuide: vi.fn(),
        })
      );

      expect(html).toContain("81 İL LİGİ");
      expect(html).toContain("Ankara");
      expect(html).toContain("GÜNÜN BULMACASI");
    });
  });
});

describe("E2E Suite: Backend Server API Endpoints", () => {
  describe("POST /api/game/city/select", () => {
    it("geçersiz veya boş şehir girildiğinde 400 hatası dönmelidir", async () => {
      const res = await callGameApi("POST", "/api/game/city/select", { city: "" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("bilinmeyen bir şehir adı girildiğinde 400 hatası dönmelidir", async () => {
      const res = await callGameApi("POST", "/api/game/city/select", { city: "Atlantis" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Tanınmayan şehir adı.");
    });

    it("geçerli şehir girildiğinde başarıyla kaydetmeli ve sıralamasını dönmelidir", async () => {
      const res = await callGameApi("POST", "/api/game/city/select", { city: "Bursa" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.city).toBe("Bursa");
      expect(res.body.standing).toBeDefined();
      expect(res.body.standing.plate).toBe(16);
    });
  });

  describe("GET /api/game/city/standings", () => {
    it("tüm 81 ili haftalık skora göre sıralı olarak dönmelidir", async () => {
      const res = await callGameApi("GET", "/api/game/city/standings");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.standings)).toBe(true);
      expect(res.body.standings.length).toBe(81);
      expect(res.body.standings[0].rank).toBe(1);
      expect(res.body.standings[0].weeklyScore).toBeGreaterThanOrEqual(res.body.standings[1].weeklyScore);
    });

    it("query parametresiyle verilen kullanıcının şehrini doğru getirmelidir", async () => {
      const res = await callGameApi("GET", "/api/game/city/standings?city=Antalya");
      expect(res.status).toBe(200);
      expect(res.body.playerCity).toBeDefined();
      expect(res.body.playerCity.city).toBe("Antalya");
      expect(res.body.playerCity.plate).toBe(7);
    });
  });

  describe("GET /api/game/daily-wordle", () => {
    it("bugünün deterministik bulmacasını dönmelidir", async () => {
      const res = await callGameApi("GET", "/api/game/daily-wordle");
      expect(res.status).toBe(200);
      expect(res.body.puzzle).toBeDefined();
      expect(res.body.puzzle.board).toBeDefined();
      expect(Array.isArray(res.body.puzzle.board.board)).toBe(true);
      expect(Array.isArray(res.body.puzzle.targetWords)).toBe(true);
      expect(res.body.puzzle.dayNumber).toBeGreaterThan(0);
    });

    it("belirli bir tarih için her zaman aynı tahtayı dönmelidir", async () => {
      const res1 = await callGameApi("GET", "/api/game/daily-wordle?date=2026-11-20");
      const res2 = await callGameApi("GET", "/api/game/daily-wordle?date=2026-11-20");

      expect(res1.body.puzzle.dateId).toBe("2026-11-20");
      expect(res1.body.puzzle.board.board).toEqual(res2.body.puzzle.board.board);
      expect(res1.body.puzzle.targetWords).toEqual(res2.body.puzzle.targetWords);
    });
  });

  describe("POST /api/game/daily-wordle/submit", () => {
    it("geçersiz parametrelerle istek yapıldığında 400 dönmelidir", async () => {
      const res = await callGameApi("POST", "/api/game/daily-wordle/submit", { secondsTaken: -5 });
      expect(res.status).toBe(400);
    });

    it("başarılı gönderimde sıralama yüzdeliği ve WhatsApp metni dönmelidir", async () => {
      const res = await callGameApi("POST", "/api/game/daily-wordle/submit", {
        dateId: "2026-10-17",
        secondsTaken: 25,
        score: 650,
        wordsFound: ["KİTAP", "MASA", "KALEM"],
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result.percentile).toBe(5);
      expect(res.body.result.shareText).toContain("25 saniyede tamamladım!");
      expect(res.body.result.coinsEarned).toBe(50);
      expect(res.body.result.xpEarned).toBe(150);
    });
  });

  describe("Arkadaşa Meydan Oku (Challenge API)", () => {
    let createdChallengeId: string;

    it("POST /api/game/challenge/create ile yeni meydan okuma oluşturmalıdır", async () => {
      const res = await callGameApi("POST", "/api/game/challenge/create", {
        creatorName: "Selim",
        creatorScore: 450,
        size: 4,
        board: ["A", "L", "E", "M", "K", "A", "P", "I", "O", "T", "U", "R", "D", "E", "N", "K"],
        words: ["ALEM", "KAPI", "OTUR"],
        timeLimit: 60,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.challenge.id).toMatch(/^CH-[A-Z0-9]{4}$/);
      expect(res.body.shareMessage).toContain(res.body.challenge.id);
      createdChallengeId = res.body.challenge.id;
    });

    it("GET /api/game/challenge/:id ile oluşturulan meydan okuma alınabilmelidir", async () => {
      const res = await callGameApi("GET", `/api/game/challenge/${createdChallengeId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.challenge.creatorName).toBe("Selim");
      expect(res.body.challenge.creatorScore).toBe(450);
    });

    it("GET /api/game/challenge/:id var olmayan kod için 404 dönmelidir", async () => {
      const res = await callGameApi("GET", "/api/game/challenge/CH-FAKE");
      expect(res.status).toBe(404);
    });

    it("POST /api/game/challenge/:id/submit ile skor karşılaştırması yapılabilmelidir", async () => {
      const res = await callGameApi("POST", `/api/game/challenge/${createdChallengeId}/submit`, {
        playerName: "Mert",
        score: 520,
        wordsFound: ["ALEM", "KAPI", "OTUR"],
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result.won).toBe(true);
      expect(res.body.result.scoreDiff).toBe(70);
      expect(res.body.result.coinsEarned).toBe(35);
      expect(res.body.result.xpEarned).toBe(120);

      // Challenge best opponent should now be Mert (520)
      expect(res.body.challenge.bestOpponentScore).toBe(520);
      expect(res.body.challenge.bestOpponentName).toBe("Mert");
    });
  });
});

describe("E2E Suite: 2 Cihaz / 2 Oyuncu Canlı Etkileşim Simülasyonu", () => {
  it("Cihaz 1 (Ahmet - Adana) ve Cihaz 2 (Cemre - Bursa) arasındaki tam meydan okuma ve il ligi döngüsünü simüle eder", async () => {
    // 1. CİHAZ 1: Ahmet Adana şehrini seçer
    const resAhmetCity = await callGameApi("POST", "/api/game/city/select", { city: "Adana" });
    expect(resAhmetCity.status).toBe(200);
    const dataAhmetCity = resAhmetCity.body;
    const adanaInitialScore = dataAhmetCity.standing.weeklyScore;

    // 2. CİHAZ 2: Cemre Bursa şehrini seçer
    const resCemreCity = await callGameApi("POST", "/api/game/city/select", { city: "Bursa" });
    expect(resCemreCity.status).toBe(200);
    const dataCemreCity = resCemreCity.body;
    const bursaInitialScore = dataCemreCity.standing.weeklyScore;

    // 3. CİHAZ 1: Ahmet 4x4 tahtada bir maç oynar ve 410 puan yapar.
    // Ahmet maç bitiminde "Arkadaşa Meydan Oku" butonuna tıklar.
    const matchBoard = ["K", "A", "L", "E", "M", "L", "İ", "K", "A", "R", "T", "I", "S", "O", "N", "U"];
    const matchWords = ["KALEM", "KART", "SON"];

    const resCreateChallenge = await callGameApi("POST", "/api/game/challenge/create", {
      creatorName: "Ahmet",
      creatorScore: 410,
      size: 4,
      board: matchBoard,
      words: matchWords,
      timeLimit: 60,
    });
    expect(resCreateChallenge.status).toBe(200);
    const challengeData = resCreateChallenge.body;
    const challengeId = challengeData.challenge.id;
    expect(challengeId).toMatch(/^CH-/);

    // 4. CİHAZ 1: Ahmet WhatsApp linkini üretir ve Cemre'ye gönderir.
    const shareMessage = challengeData.shareMessage;
    expect(shareMessage).toContain(`https://kelimepatlat.com/meydan-oku/${challengeId}`);
    expect(shareMessage).toContain("410 PUAN");

    // 5. CİHAZ 2: Cemre linke tıklar ve meydan okumayı yükler.
    const resGetChallenge = await callGameApi("GET", `/api/game/challenge/${challengeId}`);
    expect(resGetChallenge.status).toBe(200);
    const loadedChallenge = resGetChallenge.body.challenge;

    // Cemre'ye sunulan tahta Ahmet'in oynadığı BIREBIR aynı tahtadır!
    expect(loadedChallenge.board).toEqual(matchBoard);
    expect(loadedChallenge.words).toEqual(matchWords);
    expect(loadedChallenge.creatorScore).toBe(410);

    // 6. CİHAZ 2: Cemre aynı tahtada oynar ve 490 puan yaparak Ahmet'i geçer!
    const resSubmitCemre = await callGameApi("POST", `/api/game/challenge/${challengeId}/submit`, {
      playerName: "Cemre",
      score: 490,
      wordsFound: ["KALEM", "KART", "SON"],
    });
    expect(resSubmitCemre.status).toBe(200);
    const cemreResult = resSubmitCemre.body;

    // Cemre kazandı! Skor farkı 80 puan.
    expect(cemreResult.result.won).toBe(true);
    expect(cemreResult.result.scoreDiff).toBe(80);
    expect(cemreResult.result.coinsEarned).toBe(35);
    expect(cemreResult.result.xpEarned).toBe(120);

    // 7. CİHAZ 1: Ahmet'in oluşturduğu meydan okumanın en iyi rakibi güncellenmiş mi?
    const resCheckAhmetChallenge = await callGameApi("GET", `/api/game/challenge/${challengeId}`);
    const updatedAhmetChallenge = resCheckAhmetChallenge.body.challenge;
    expect(updatedAhmetChallenge.attemptsCount).toBe(1);
    expect(updatedAhmetChallenge.bestOpponentScore).toBe(490);
    expect(updatedAhmetChallenge.bestOpponentName).toBe("Cemre");

    // 8. 81 İL LİGİ KONTROLÜ: Cemre'nin kazandığı puan Bursa iline eklendi mi?
    addCityScore("Bursa", 490);
    const standingsRes = await callGameApi("GET", "/api/game/city/standings?city=Bursa");
    const bursaStanding = standingsRes.body.playerCity;
    expect(bursaStanding.weeklyScore).toBeGreaterThanOrEqual(bursaInitialScore + 490);
  });
});
