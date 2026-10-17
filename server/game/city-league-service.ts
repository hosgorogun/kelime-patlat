import { TURKISH_CITIES, type CityStanding, getCityByName } from "../../shared/cities";

// In-memory store for city scores (resilient & instant fallback)
const cityScores = new Map<string, { totalScore: number; weeklyScore: number; playerCount: number }>();

// Initial realistic baseline seeding for 81 cities so the map and leaderboard look lively from day 1
function initCityBaselines() {
  const initialPopularCities: Record<string, { total: number; weekly: number; players: number }> = {
    "İstanbul": { total: 124500, weekly: 18400, players: 412 },
    "Ankara": { total: 98200, weekly: 14200, players: 305 },
    "İzmir": { total: 87400, weekly: 12900, players: 268 },
    "Bursa": { total: 54100, weekly: 8700, players: 154 },
    "Trabzon": { total: 52300, weekly: 9100, players: 148 },
    "Antalya": { total: 48900, weekly: 7800, players: 139 },
    "Adana": { total: 45200, weekly: 7400, players: 131 },
    "Konya": { total: 41800, weekly: 6300, players: 119 },
    "Gaziantep": { total: 39500, weekly: 5900, players: 112 },
    "Eskişehir": { total: 36200, weekly: 5400, players: 98 },
    "Samsun": { total: 31400, weekly: 4800, players: 84 },
    "Diyarbakır": { total: 29800, weekly: 4300, players: 79 },
    "Kayseri": { total: 27500, weekly: 4100, players: 73 },
  };

  for (const city of TURKISH_CITIES) {
    const pop = initialPopularCities[city.name];
    if (pop) {
      cityScores.set(city.name, { totalScore: pop.total, weeklyScore: pop.weekly, playerCount: pop.players });
    } else {
      const seed = (city.plate * 7919) % 15000 + 4000;
      const weekly = Math.floor(seed * 0.18);
      const players = Math.max(8, Math.floor(weekly / 80));
      cityScores.set(city.name, { totalScore: seed, weeklyScore: weekly, playerCount: players });
    }
  }
}

initCityBaselines();

export function addCityScore(cityName: string, points: number): void {
  if (!cityName || points <= 0) return;
  const match = getCityByName(cityName);
  if (!match) return;

  const current = cityScores.get(match.name) ?? { totalScore: 0, weeklyScore: 0, playerCount: 1 };
  current.totalScore += points;
  current.weeklyScore += points;
  cityScores.set(match.name, current);
}

export function registerCityPlayer(cityName: string): void {
  if (!cityName) return;
  const match = getCityByName(cityName);
  if (!match) return;

  const current = cityScores.get(match.name) ?? { totalScore: 0, weeklyScore: 0, playerCount: 0 };
  current.playerCount += 1;
  cityScores.set(match.name, current);
}

export function getCityStandings(): CityStanding[] {
  const standings: CityStanding[] = TURKISH_CITIES.map((city) => {
    const data = cityScores.get(city.name) ?? { totalScore: 0, weeklyScore: 0, playerCount: 0 };
    return {
      city: city.name,
      plate: city.plate,
      region: city.region,
      totalScore: data.totalScore,
      weeklyScore: data.weeklyScore,
      playerCount: data.playerCount,
      rank: 1, // Will be updated below
    };
  });

  // Sort by weeklyScore descending
  standings.sort((a, b) => b.weeklyScore - a.weeklyScore);
  standings.forEach((item, index) => {
    item.rank = index + 1;
  });

  return standings;
}

export function getPlayerCityStanding(cityName?: string): CityStanding | undefined {
  if (!cityName) return undefined;
  const all = getCityStandings();
  const match = getCityByName(cityName);
  if (!match) return undefined;
  return all.find((s) => s.city.toLowerCase() === match.name.toLowerCase());
}
