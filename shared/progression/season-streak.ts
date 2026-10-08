import { getLeagueTier } from "../leagues";
import {
  DailyChallenge,
  DailyLoginReward,
  DailyMystery,
  DailyReconciliation,
  PlayerProgress,
  SeasonResetResult,
  StreakReconciliationResult,
  THEME_PACKS,
  DAILY_LOGIN_REWARDS,
} from "./progression.types";
import { reconcileMissions } from "./progression-missions";

import { getDayId, getWeekId, getDiffDays, getPreviousDayId } from "./date-utils";


function seededNumber(input: string) {
  return [...input].reduce((value, char) => ((value * 31) ^ char.charCodeAt(0)) >>> 0, 7_431);
}

export function getDailyChallenge(date = new Date()): DailyChallenge {
  const id = getDayId(date);
  const seed = seededNumber(id);
  const themeId = THEME_PACKS[seed % THEME_PACKS.length]!.id;
  return {
    id,
    variation: seed % 1_000_000,
    level: 20 + (seed % 5),
    themeId,
    title: "GÜNÜN ROTASI",
    rewardXp: 120,
  };
}

export function getDailyMysteryWord(date = new Date()): DailyMystery {
  // Tam 30 günlük bilmeceli gizemli kelime havuzu
  const dayOfMonth = date.getDate(); // 1 - 31
  const mysteryWords: { word: string; definition: string }[] = [
    { word: "ANAFOR", definition: "Görünmez bir el gibi seni derine çekerim; suyun içinde kendi etrafımda dönen gizli bir kapıyım." },
    { word: "ŞİMŞEK", definition: "Gökyüzünde saniyelerce çakan devasa bir kılıcım; arkamdan hemen gök gürültüsü yürür." },
    { word: "YANKI", definition: "Sesini bana verirsin, sana aynısını geri yankılatırım; yalnız kayalıklarda yaşayan gölgeyim." },
    { word: "KİMBİLİR", definition: "Bilinmezin ardındaki soruların cevapsız anahtarıyım; ne zaman gelsen sırrı korurum." },
    { word: "GÖLGE", definition: "Işık varken arkandan ayrılmam, karanlık çökünce aniden ortadan kaybolurum." },
    { word: "PUSULA", definition: "Yolunu kaybettiğinde iğnem hep kuzeyi gösterir, ama sana nereye gideceğini söylemem." },
    { word: "ZAMAN", definition: "Görünmem ama herkesi yaşlandırırım, durduramazsın; sürekli akar ama kabı yoktur." },
    { word: "AYNA", definition: "Bana bakarsan seni gösteririm; ama konuşmam, sır tutarım ve dokunursan soğuğumdur." },
    { word: "KOSMOS", definition: "Sonsuz karanlığın içinde milyarlarca elmas taşıyan devasa gizemli çarkım." },
    { word: "RÜZGAR", definition: "Dokunamazsın ama saçını dalgalandırırım; ağaçları eğip geçerim ama izim görünmez." },
    { word: "SARMAŞIK", definition: "Duvarlara sessizce tırmanır, etrafı kuşatırım; ayaksızım ama her yere sarılırım." },
    { word: "SERAP", definition: "Susuz çölde sana serin bir göl vaat ederim, yaklaştıkça kaybolup seni hayal kırıklığına uğratırım." },
    { word: "TILSIM", definition: "Boynunda taşırsın ya da zihninde saklarsın; kötü gözlerden koruduğuna inanılan gizli güç." },
    { word: "KRİSTAL", definition: "Karanlık mağarada doğarım, ışık vurduğunda rengarenk parlayan geometrik bir mucizeyim." },
    { word: "HAKİKAT", definition: "Herkes beni arar ama kimse bütünüyle kabullenemez; yalanın maskesini düşüren keskin kılıç." },
    { word: "LABİRENT", definition: "Binbir yolum vardır ama sadece biri seni özgürlüğe çıkarır; yanlış adımda başa dönersin." },
    { word: "KEHANET", definition: "Henüz yaşanmamış günlerin üzerindeki sis perdesini aralayan gizemli kehanet fısıltısı." },
    { word: "KIVILCIM", definition: "Küçücük bir temasla doğarım; dikkatsiz olursan koskoca bir ormanı küleye çeviririm." },
    { word: "UFUK", definition: "Bana doğru ne kadar koşarsan koş, aramızdaki mesafe hiç kısalmaz." },
    { word: "EFSANE", definition: "Gerçek mi yalan mı kimse bilmez; dilden dile dolaşarak ölümsüzleşen kadim öykü." },
    { word: "SENTEZ", definition: "Ayrı ayrı parçaları simya gibi eritip yepyeni bir hakikate dönüştüren bağ." },
    { word: "ZİRVE", definition: "Oraya tırmanmak yıllar alır, orada kalmak ise rüzgara karşı amansız bir mücadeledir." },
    { word: "BELLEK", definition: "Gözlerini kapattığında çocukluğunu ve geçmişi sana tekrar yaşatan zihin kütüphanesi." },
    { word: "KİLİT", definition: "Anahtarım olmadan kapıları açamazsın; sırları koruyan dilsiz muhafızım." },
    { word: "RESONANS", definition: "Aynı frekansta atan iki yüreğin veya telin birleşip dünyayı sarsan titreşimi." },
    { word: "DÖNÜŞÜM", definition: "Tırtılın kozadan çıkıp kanat çırpması gibi, eski halinden eser bırakmayan değişim." },
    { word: "KEŞİF", definition: "Karanlık haritalarda ayak basılmamış kara parçalarını gün ışığına çıkarma cesareti." },
    { word: "ÖZELLİK", definition: "Seni sen yapan, eşsiz kılan ve kalabalıklar arasında parlamanı sağlayan gizli imza." },
    { word: "SARMAL", definition: "Kendi etrafında döne döne sonsuzluğa veya merkeze doğru çekilen gizemli çizgi." },
    { word: "MÜCADELE", definition: "Düşsen de defalarca ayağa kalkıp hedefe doğru atılan kararlı adım." },
  ];

  const index = (dayOfMonth - 1) % mysteryWords.length;
  const picked = mysteryWords[index]!;
  return { ...picked, rewardXp: 150 };
}

export function checkDailyLoginReward(progress: PlayerProgress, todayId: string): { reward: DailyLoginReward; updatedProgress: PlayerProgress } | null {
  if (progress.lastLoginDay === todayId) return null;
  const currentCount = (progress.loginDaysCount || 0) % 7;
  const reward = DAILY_LOGIN_REWARDS[currentCount]!;
  
  let xpBonus = reward.rewardType === "xp" ? reward.amount : 0;
  let shieldBonus = reward.rewardType === "shield" ? reward.amount : 0;
  let coinsBonus = reward.rewardType === "coins" ? reward.amount : 0;

  const updatedProgress: PlayerProgress = {
    ...progress,
    xp: progress.xp + xpBonus,
    coins: (progress.coins ?? 0) + coinsBonus,
    streakShields: (progress.streakShields || 0) + shieldBonus,
    lastLoginDay: todayId,
    loginDaysCount: (progress.loginDaysCount || 0) + 1,
  };

  return { reward, updatedProgress };
}

export function reconcileDailyStreak(progress: PlayerProgress, todayId: string): StreakReconciliationResult {
  if (progress.lastStreakCheckDate === todayId) {
    return { updatedProgress: progress, shieldUsed: false, shieldsConsumed: 0, streakReset: false, previousStreak: progress.streak };
  }

  if (!progress.dailyCompletedId || progress.streak === 0) {
    return {
      updatedProgress: { ...progress, lastStreakCheckDate: todayId },
      shieldUsed: false,
      shieldsConsumed: 0,
      streakReset: false,
      previousStreak: progress.streak,
    };
  }

  if (progress.dailyCompletedId === todayId) {
    return {
      updatedProgress: { ...progress, lastStreakCheckDate: todayId },
      shieldUsed: false,
      shieldsConsumed: 0,
      streakReset: false,
      previousStreak: progress.streak,
    };
  }

  const diffDays = getDiffDays(todayId, progress.dailyCompletedId);
  if (isNaN(diffDays)) {
    return {
      updatedProgress: { ...progress, lastStreakCheckDate: todayId },
      shieldUsed: false,
      shieldsConsumed: 0,
      streakReset: false,
      previousStreak: progress.streak,
    };
  }

  if (diffDays <= 1) {
    return {
      updatedProgress: { ...progress, lastStreakCheckDate: todayId },
      shieldUsed: false,
      shieldsConsumed: 0,
      streakReset: false,
      previousStreak: progress.streak,
    };
  }

  const missedDays = diffDays - 1;
  const availableShields = progress.streakShields || 0;

  if (availableShields >= missedDays) {
    const yesterdayId = getPreviousDayId(todayId, 1);
    return {
      updatedProgress: {
        ...progress,
        streakShields: availableShields - missedDays,
        dailyCompletedId: yesterdayId,
        lastStreakCheckDate: todayId,
      },
      shieldUsed: true,
      shieldsConsumed: missedDays,
      streakReset: false,
      previousStreak: progress.streak,
    };
  } else {
    return {
      updatedProgress: {
        ...progress,
        streak: 0,
        dailyCompletedId: null,
        lastStreakCheckDate: todayId,
      },
      shieldUsed: false,
      shieldsConsumed: 0,
      streakReset: true,
      previousStreak: progress.streak,
    };
  }
}

export function getSeasonId(date = new Date()): string {
  const bimonthlySeason = Math.floor(date.getMonth() / 2) + 1;
  return `${date.getFullYear()}-S${String(bimonthlySeason).padStart(2, "0")}`;
}

export function getPreviousSeasonId(date = new Date()): string {
  const currentMonth = date.getMonth();
  const prevDate = new Date(date.getFullYear(), currentMonth - 2, 1);
  return getSeasonId(prevDate);
}

export function getSeasonRemainingTime(date = new Date()): { days: number; hours: number; minutes: number; seconds: number; formatted: string } {
  const currentMonth = date.getMonth();
  const nextSeasonMonth = currentMonth % 2 === 0 ? currentMonth + 2 : currentMonth + 1;
  const nextSeasonDate = new Date(date.getFullYear(), nextSeasonMonth, 1, 0, 0, 0, 0);
  
  const diffMs = Math.max(0, nextSeasonDate.getTime() - date.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  const formatted = days > 0 ? `${days}g ${hours}s` : `${hours}s ${minutes}dk`;
  return { days, hours, minutes, seconds, formatted };
}

export function reconcileSeasonReset(progress: PlayerProgress, date = new Date()): { updatedProgress: PlayerProgress; resetResult: SeasonResetResult } {
  const currentSeasonId = getSeasonId(date);
  const lastReset = progress.lastSeasonResetId;

  if (lastReset === currentSeasonId) {
    return {
      updatedProgress: progress,
      resetResult: { seasonResetPerformed: false, newSeasonId: currentSeasonId },
    };
  }

  const currentLp = progress.lp ?? 0;
  const currentTierInfo = getLeagueTier(currentLp);
  const oldRank = currentTierInfo.tier;

  let newLp = currentLp;
  if (currentLp >= 3600) {
    newLp = 2500;
  } else if (currentLp >= 900) {
    newLp = Math.floor(currentLp * 0.7);
  }

  const previousSeason = lastReset || getPreviousSeasonId(date);
  const newHistoryEntry = {
    seasonId: previousSeason,
    rank: oldRank,
    lp: currentLp,
    date: getDayId(date),
  };

  const updatedProgress: PlayerProgress = {
    ...progress,
    lp: newLp,
    lastSeasonResetId: currentSeasonId,
    seasonHistory: [...(progress.seasonHistory || []), newHistoryEntry],
  };

  return {
    updatedProgress,
    resetResult: {
      seasonResetPerformed: true,
      oldSeasonId: previousSeason,
      newSeasonId: currentSeasonId,
      previousRank: oldRank,
      previousLp: currentLp,
      newLp,
    },
  };
}

export function reconcilePlayerProgress(progress: PlayerProgress, date = new Date()): DailyReconciliation {
  const todayId = getDayId(date);
  const weekId = getWeekId(date);

  const streakRes = reconcileDailyStreak(progress, todayId);
  let currentProgress = streakRes.updatedProgress;

  const missionsNeedReset = currentProgress.missionsDate !== todayId || currentProgress.weeklyMissionsWeek !== weekId;
  currentProgress = reconcileMissions(currentProgress, todayId, weekId);

  // Sezonluk Lig Puanı Soft Reset Kontrolü
  const seasonRes = reconcileSeasonReset(currentProgress, date);
  currentProgress = seasonRes.updatedProgress;

  // Günlük reklamla kurtarma (revive) hakkını yeni günde sıfırla
  if (currentProgress.dailyRevivesDate !== todayId) {
    currentProgress = {
      ...currentProgress,
      dailyRevivesDate: todayId,
      dailyRevivesCount: 0,
    };
  }

  return {
    progress: currentProgress,
    shieldSaved: streakRes.shieldUsed,
    shieldsConsumed: streakRes.shieldsConsumed,
    streakReset: streakRes.streakReset,
    previousStreak: streakRes.previousStreak,
    missionsReset: missionsNeedReset,
    loginReward: null,
    seasonReset: seasonRes.resetResult,
  };
}
