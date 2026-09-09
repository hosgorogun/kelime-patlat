import fs from 'fs';

// Scaled rewards:
// Kolay: XP 20-30, Çip 8-12 (Çok azaltıldı)
// Orta: XP 50-70, Çip 25-35 (Orta azaltıldı)
// Zor: XP 120-150, Çip 70-90 (Az azaltıldı)
// Haftalık Orta: XP 300-350, Çip 150-200
// Haftalık Zor: XP 450-550, Çip 250-320
// Haftalık Destansı: XP 650-800, Çip 400-500, Kalkan 1-3

const dailyEasy = [
  { id: 'd_easy_01', title: 'Güne Merhaba', desc: '1 Günlük Gizemli Kelime veya meydan okuma oyna', actionType: 'daily_route', target: 1, rewardXp: 20, rewardCoins: 8 },
  { id: 'd_easy_02', title: 'Hızlı Başlangıç', desc: 'Herhangi bir düelloyu tamamla', actionType: 'duel_play', target: 1, rewardXp: 20, rewardCoins: 8 },
  { id: 'd_easy_03', title: 'İlk Galibiyet', desc: '1 düello kazan', actionType: 'duel_win', target: 1, rewardXp: 25, rewardCoins: 10 },
  { id: 'd_easy_04', title: 'Kelime Avcısı', desc: 'Herhangi bir modda 5 kelime bul', actionType: 'word_count', target: 5, rewardXp: 20, rewardCoins: 8 },
  { id: 'd_easy_05', title: 'Harf Ustası', desc: 'En az 5 harfli 1 kelime bul', actionType: 'word_length', target: 1, param: 5, rewardXp: 22, rewardCoins: 9 },
  { id: 'd_easy_06', title: 'Gazete Merakı', desc: '1 Gazete Eki (Vintage) bulmacası çöz', actionType: 'vintage_solve', target: 1, rewardXp: 25, rewardCoins: 10 },
  { id: 'd_easy_07', title: 'Arcade Isınması', desc: 'Arcade modunda en az 300 puan yap', actionType: 'arcade_score', target: 300, rewardXp: 25, rewardCoins: 10 },
  { id: 'd_easy_08', title: 'Küçük Seri', desc: '2 seri (combo) kelime yap', actionType: 'combo_count', target: 2, rewardXp: 22, rewardCoins: 8 },
  { id: 'd_easy_09', title: 'Tek Başına', desc: '1 Solo Klasik seviye geç', actionType: 'solo_progress', target: 1, rewardXp: 20, rewardCoins: 8 },
  { id: 'd_easy_10', title: 'Kasa Girişi', desc: 'Oyunlardan 15 Çip kazan', actionType: 'earn_chips', target: 15, rewardXp: 22, rewardCoins: 9 },
  { id: 'd_easy_11', title: '4x4 Arenası', desc: '1 adet 4x4 Mini Düello oyna', actionType: 'duel_play', target: 1, param: 4, rewardXp: 22, rewardCoins: 9 },
  { id: 'd_easy_12', title: '6x6 Arenası', desc: '1 adet 6x6 Klasik Düello oyna', actionType: 'duel_play', target: 1, param: 6, rewardXp: 22, rewardCoins: 9 },
  { id: 'd_easy_13', title: 'Harf Yağmuru', desc: 'Toplam 8 kelime patlat', actionType: 'word_count', target: 8, rewardXp: 24, rewardCoins: 10 },
  { id: 'd_easy_14', title: '5 Harf Sanatı', desc: 'En az 5 harfli 2 kelime bul', actionType: 'word_length', target: 2, param: 5, rewardXp: 25, rewardCoins: 10 },
  { id: 'd_easy_15', title: 'İki Katı Zafer', desc: '2 düello oyna', actionType: 'duel_play', target: 2, rewardXp: 25, rewardCoins: 10 },
  { id: 'd_easy_16', title: 'Günün Yıldızı', desc: 'Günlük Kelimeyi başarıyla tamamla', actionType: 'daily_route', target: 1, rewardXp: 26, rewardCoins: 10 },
  { id: 'd_easy_17', title: 'Arcade Koşusu', desc: 'Arcade modunda en az 400 puan al', actionType: 'arcade_score', target: 400, rewardXp: 26, rewardCoins: 10 },
  { id: 'd_easy_18', title: 'Çip Avı', desc: 'Oyunlardan 25 Çip topla', actionType: 'earn_chips', target: 25, rewardXp: 25, rewardCoins: 10 },
  { id: 'd_easy_19', title: 'Hızlı Eşleşme', desc: '3 ardışık kelime kombolaması yap', actionType: 'combo_count', target: 3, rewardXp: 26, rewardCoins: 10 },
  { id: 'd_easy_20', title: 'Klasik Adım', desc: '2 Solo Klasik seviye tamamla', actionType: 'solo_progress', target: 2, rewardXp: 25, rewardCoins: 10 },
  { id: 'd_easy_21', title: 'Nostalji Saati', desc: '2 Vintage Gazete Eki bulmacası tamamla', actionType: 'vintage_solve', target: 2, rewardXp: 28, rewardCoins: 11 },
  { id: 'd_easy_22', title: 'Temel Kelimeler', desc: 'Toplam 10 kelime bul', actionType: 'word_count', target: 10, rewardXp: 26, rewardCoins: 10 },
  { id: 'd_easy_23', title: 'Uzun Düşünce', desc: 'En az 6 harfli 1 kelime üret', actionType: 'word_length', target: 1, param: 6, rewardXp: 26, rewardCoins: 10 },
  { id: 'd_easy_24', title: '8x8 Meydanı', desc: '1 adet 8x8 Büyük Düello oyna', actionType: 'duel_play', target: 1, param: 8, rewardXp: 26, rewardCoins: 10 },
  { id: 'd_easy_25', title: 'Taktik Galibiyet', desc: '1 düello kazan', actionType: 'duel_win', target: 1, rewardXp: 28, rewardCoins: 11 },
  { id: 'd_easy_26', title: 'Arcade Çırağı', desc: 'Arcade modunda en az 500 puan kazan', actionType: 'arcade_score', target: 500, rewardXp: 28, rewardCoins: 11 },
  { id: 'd_easy_27', title: 'Altın Avı', desc: 'Toplam 30 Çip kazan', actionType: 'earn_chips', target: 30, rewardXp: 26, rewardCoins: 11 },
  { id: 'd_easy_28', title: 'Hızlı Düşün', desc: '4 kombo gerçekleştir', actionType: 'combo_count', target: 4, rewardXp: 28, rewardCoins: 12 },
  { id: 'd_easy_29', title: 'Mini Sefer', desc: '2 adet 4x4 Mini Düello tamamla', actionType: 'duel_play', target: 2, param: 4, rewardXp: 26, rewardCoins: 11 },
  { id: 'd_easy_30', title: 'Günü Başlat', desc: 'Günün kelimesini oyna ve 1 düello tamamla', actionType: 'daily_route', target: 1, rewardXp: 30, rewardCoins: 12 },
];

const dailyMed = [
  { id: 'd_med_01', title: 'Kelime Fırtınası', desc: 'Toplam 15 kelime bul', actionType: 'word_count', target: 15, rewardXp: 50, rewardCoins: 25 },
  { id: 'd_med_02', title: 'Zafer Yolu', desc: '2 düello kazan', actionType: 'duel_win', target: 2, rewardXp: 60, rewardCoins: 30 },
  { id: 'd_med_03', title: 'Büyük Tahta', desc: '2 adet 8x8 Düello oyna', actionType: 'duel_play', target: 2, param: 8, rewardXp: 55, rewardCoins: 28 },
  { id: 'd_med_04', title: 'Uzun Kelimeler', desc: 'En az 6 harfli 2 kelime patlat', actionType: 'word_length', target: 2, param: 6, rewardXp: 60, rewardCoins: 30 },
  { id: 'd_med_05', title: 'Arcade Heyecanı', desc: 'Arcade modunda 750 puana ulaş', actionType: 'arcade_score', target: 750, rewardXp: 55, rewardCoins: 28 },
  { id: 'd_med_06', title: 'Kombo Kralı', desc: '5 kelimelik seri yap', actionType: 'combo_count', target: 5, rewardXp: 62, rewardCoins: 30 },
  { id: 'd_med_07', title: 'Klasik Yolculuk', desc: '3 Solo Klasik seviye bitir', actionType: 'solo_progress', target: 3, rewardXp: 50, rewardCoins: 25 },
  { id: 'd_med_08', title: 'Arşiv Çözücü', desc: '3 Vintage Gazete bulmacası çöz', actionType: 'vintage_solve', target: 3, rewardXp: 60, rewardCoins: 30 },
  { id: 'd_med_09', title: 'Çip Dalgası', desc: 'Oyunlardan 50 Çip kazan', actionType: 'earn_chips', target: 50, rewardXp: 58, rewardCoins: 28 },
  { id: 'd_med_10', title: 'Düello Ustası', desc: '3 düello tamamla', actionType: 'duel_play', target: 3, rewardXp: 52, rewardCoins: 26 },
  { id: 'd_med_11', title: '6x6 Hükümdarı', desc: '2 adet 6x6 Düello kazan', actionType: 'duel_win', target: 2, param: 6, rewardXp: 65, rewardCoins: 32 },
  { id: 'd_med_12', title: 'Zengin Kelimeler', desc: 'En az 7 harfli 1 kelime bul', actionType: 'word_length', target: 1, param: 7, rewardXp: 65, rewardCoins: 32 },
  { id: 'd_med_13', title: 'Arcade Uzmanı', desc: 'Arcade modunda 1.000 puan topla', actionType: 'arcade_score', target: 1000, rewardXp: 68, rewardCoins: 35 },
  { id: 'd_med_14', title: 'Hızlı Hamleler', desc: '6 ardışık kombo oluştur', actionType: 'combo_count', target: 6, rewardXp: 65, rewardCoins: 32 },
  { id: 'd_med_15', title: 'Kelime Tarlası', desc: 'Toplam 20 kelime bul', actionType: 'word_count', target: 20, rewardXp: 58, rewardCoins: 28 },
  { id: 'd_med_16', title: 'Dev Arenası', desc: '1 adet 10x10 Devasa Düello tamamla', actionType: 'duel_play', target: 1, param: 10, rewardXp: 60, rewardCoins: 30 },
  { id: 'd_med_17', title: 'Üst Üste Galibiyet', desc: '2 düello kazan', actionType: 'duel_win', target: 2, rewardXp: 62, rewardCoins: 30 },
  { id: 'd_med_18', title: 'Kasa Doldurucu', desc: 'Oyunlardan 60 Çip elde et', actionType: 'earn_chips', target: 60, rewardXp: 65, rewardCoins: 32 },
  { id: 'd_med_19', title: 'Gazete Koleksiyonu', desc: '4 Gazete Eki bulmacası bitir', actionType: 'vintage_solve', target: 4, rewardXp: 68, rewardCoins: 35 },
  { id: 'd_med_20', title: 'Solo Serisi', desc: '4 Solo Klasik seviye geç', actionType: 'solo_progress', target: 4, rewardXp: 60, rewardCoins: 30 },
  { id: 'd_med_21', title: 'Mini Şampiyon', desc: '3 adet 4x4 Mini Düello tamamla', actionType: 'duel_play', target: 3, param: 4, rewardXp: 55, rewardCoins: 28 },
  { id: 'd_med_22', title: '7 Harfli Başarı', desc: 'En az 7 harfli 2 kelime üret', actionType: 'word_length', target: 2, param: 7, rewardXp: 70, rewardCoins: 35 },
  { id: 'd_med_23', title: 'Arcade Koşucusu', desc: 'Arcade modunda 1.200 puan yap', actionType: 'arcade_score', target: 1200, rewardXp: 70, rewardCoins: 35 },
  { id: 'd_med_24', title: 'Kelime Sağanağı', desc: 'Toplam 25 kelime patlat', actionType: 'word_count', target: 25, rewardXp: 62, rewardCoins: 30 },
  { id: 'd_med_25', title: 'Çifte Şampiyonluk', desc: '3 düello kazan', actionType: 'duel_win', target: 3, rewardXp: 68, rewardCoins: 35 },
  { id: 'd_med_26', title: 'Günün İkilisi', desc: 'Günün Gizemli Kelimesi ve 2 düello tamamla', actionType: 'daily_route', target: 1, rewardXp: 58, rewardCoins: 28 },
  { id: 'd_med_27', title: 'Büyük Tahta Zaferi', desc: '1 adet 8x8 Düello kazan', actionType: 'duel_win', target: 1, param: 8, rewardXp: 65, rewardCoins: 32 },
  { id: 'd_med_28', title: 'Süper Kombo', desc: '7 kombo başarısı yakala', actionType: 'combo_count', target: 7, rewardXp: 70, rewardCoins: 35 },
  { id: 'd_med_29', title: 'Altın Yağmuru', desc: '75 Çip kazanımı sağla', actionType: 'earn_chips', target: 75, rewardXp: 68, rewardCoins: 35 },
  { id: 'd_med_30', title: 'Klasik Fatih', desc: '5 Solo Klasik seviye geç', actionType: 'solo_progress', target: 5, rewardXp: 70, rewardCoins: 35 },
];

const dailyHard = [
  { id: 'd_hard_01', title: 'Kelime Canavarı', desc: 'Toplam 35 kelime patlat', actionType: 'word_count', target: 35, rewardXp: 130, rewardCoins: 75 },
  { id: 'd_hard_02', title: 'Büyük Zaferler', desc: '4 düello kazan', actionType: 'duel_win', target: 4, rewardXp: 140, rewardCoins: 80 },
  { id: 'd_hard_03', title: 'Devasa Mücadele', desc: '2 adet 10x10 Devasa Düello tamamla', actionType: 'duel_play', target: 2, param: 10, rewardXp: 135, rewardCoins: 78 },
  { id: 'd_hard_04', title: 'Usta Sözlükçü', desc: 'En az 7 harfli 3 kelime bul', actionType: 'word_length', target: 3, param: 7, rewardXp: 145, rewardCoins: 85 },
  { id: 'd_hard_05', title: 'Arcade Efsanesi', desc: 'Arcade modunda 1.800 puana ulaş', actionType: 'arcade_score', target: 1800, rewardXp: 145, rewardCoins: 85 },
  { id: 'd_hard_06', title: 'Kombo Sanatı', desc: '8 kelimelik seri yakala', actionType: 'combo_count', target: 8, rewardXp: 140, rewardCoins: 80 },
  { id: 'd_hard_07', title: 'Solo Hükümdar', desc: '6 Solo Klasik seviye bitir', actionType: 'solo_progress', target: 6, rewardXp: 130, rewardCoins: 75 },
  { id: 'd_hard_08', title: 'Vintage Bilgini', desc: '5 Vintage Gazete bulmacası çöz', actionType: 'vintage_solve', target: 5, rewardXp: 135, rewardCoins: 78 },
  { id: 'd_hard_09', title: 'Zenginlik Yolu', desc: 'Oyunlardan 100 Çip topla', actionType: 'earn_chips', target: 100, rewardXp: 140, rewardCoins: 80 },
  { id: 'd_hard_10', title: 'Yenilmez Savaşçı', desc: '5 düello oyna', actionType: 'duel_play', target: 5, rewardXp: 125, rewardCoins: 70 },
  { id: 'd_hard_11', title: '8 Harfli Mucize', desc: 'En az 8 harfli 1 kelime bul', actionType: 'word_length', target: 1, param: 8, rewardXp: 150, rewardCoins: 90 },
  { id: 'd_hard_12', title: '8x8 Şampiyonu', desc: '2 adet 8x8 Düello kazan', actionType: 'duel_win', target: 2, param: 8, rewardXp: 145, rewardCoins: 85 },
  { id: 'd_hard_13', title: 'Devasa Zafer', desc: '1 adet 10x10 Düello kazan', actionType: 'duel_win', target: 1, param: 10, rewardXp: 150, rewardCoins: 90 },
  { id: 'd_hard_14', title: 'Arcade Yıldızı', desc: 'Arcade modunda 2.200 puana ulaş', actionType: 'arcade_score', target: 2200, rewardXp: 150, rewardCoins: 90 },
  { id: 'd_hard_15', title: 'Kelime Tufanı', desc: 'Toplam 45 kelime bul', actionType: 'word_count', target: 45, rewardXp: 140, rewardCoins: 80 },
  { id: 'd_hard_16', title: 'Hazine Avcısı', desc: 'Oyunlardan 130 Çip kazan', actionType: 'earn_chips', target: 130, rewardXp: 145, rewardCoins: 85 },
  { id: 'd_hard_17', title: 'Kombo Canavarı', desc: '10 seri kombo yakala', actionType: 'combo_count', target: 10, rewardXp: 150, rewardCoins: 90 },
  { id: 'd_hard_18', title: 'Gazete Profesörü', desc: '6 Gazete Eki bulmacası tamamla', actionType: 'vintage_solve', target: 6, rewardXp: 145, rewardCoins: 85 },
  { id: 'd_hard_19', title: 'Klasik Maratonu', desc: '8 Solo Klasik seviye geç', actionType: 'solo_progress', target: 8, rewardXp: 148, rewardCoins: 88 },
  { id: 'd_hard_20', title: 'Düello Fatihi', desc: '6 düello tamamla', actionType: 'duel_play', target: 6, rewardXp: 130, rewardCoins: 75 },
  { id: 'd_hard_21', title: '8 Harfli Deha', desc: 'En az 8 harfli 2 kelime oluştur', actionType: 'word_length', target: 2, param: 8, rewardXp: 150, rewardCoins: 90 },
  { id: 'd_hard_22', title: 'Sonsuz Zafer', desc: '5 düello kazan', actionType: 'duel_win', target: 5, rewardXp: 148, rewardCoins: 88 },
  { id: 'd_hard_23', title: 'Arcade Rekortmeni', desc: 'Arcade modunda 2.500 puan topla', actionType: 'arcade_score', target: 2500, rewardXp: 150, rewardCoins: 90 },
  { id: 'd_hard_24', title: 'Harf Üstadı', desc: 'En az 6 harfli 5 kelime bul', actionType: 'word_length', target: 5, param: 6, rewardXp: 145, rewardCoins: 85 },
  { id: 'd_hard_25', title: 'Çip Zirvesi', desc: 'Toplam 150 Çip kazan', actionType: 'earn_chips', target: 150, rewardXp: 150, rewardCoins: 90 },
  { id: 'd_hard_26', title: 'Tahta Terörü', desc: '3 adet 8x8 veya 10x10 Düello tamamla', actionType: 'duel_play', target: 3, param: 8, rewardXp: 140, rewardCoins: 80 },
  { id: 'd_hard_27', title: 'Büyük Kombo Resitali', desc: '12 kombo serisi yakala', actionType: 'combo_count', target: 12, rewardXp: 150, rewardCoins: 90 },
  { id: 'd_hard_28', title: '9 Harfli Efsane', desc: 'En az 9 harfli 1 kelime patlat', actionType: 'word_length', target: 1, param: 9, rewardXp: 150, rewardCoins: 90 },
  { id: 'd_hard_29', title: 'Vintage Şampiyonu', desc: '8 Gazete Eki bulmacası bitir', actionType: 'vintage_solve', target: 8, rewardXp: 150, rewardCoins: 90 },
  { id: 'd_hard_30', title: 'Günün Zirvesi', desc: 'Toplam 50 kelime bul', actionType: 'word_count', target: 50, rewardXp: 150, rewardCoins: 90 },
];

const weekly = [
  { id: 'w_01', title: 'Haftalık Maraton', desc: 'Hafta boyunca 15 düello tamamla', actionType: 'duel_play', target: 15, rewardXp: 300, rewardCoins: 160, difficulty: 'medium' },
  { id: 'w_02', title: 'Büyük Zaferler', desc: 'Hafta boyunca 8 düello kazan', actionType: 'duel_win', target: 8, rewardXp: 480, rewardCoins: 260, rewardShields: 1, difficulty: 'hard' },
  { id: 'w_03', title: 'Kelime Fabrikası', desc: 'Toplam 120 kelime patlat', actionType: 'word_count', target: 120, rewardXp: 320, rewardCoins: 180, difficulty: 'medium' },
  { id: 'w_04', title: 'Sözlük Dehası', desc: 'En az 7 harfli 10 kelime bul', actionType: 'word_length', target: 10, param: 7, rewardXp: 500, rewardCoins: 280, rewardShields: 1, difficulty: 'hard' },
  { id: 'w_05', title: 'Arcade Şöleni', desc: 'Arcade modunda 5.000 kümülatif puan kazan', actionType: 'arcade_score', target: 5000, rewardXp: 460, rewardCoins: 250, difficulty: 'hard' },
  { id: 'w_06', title: 'Vintage Arşiv Müfettişi', desc: '15 Gazete Eki bulmacası çöz', actionType: 'vintage_solve', target: 15, rewardXp: 320, rewardCoins: 180, difficulty: 'medium' },
  { id: 'w_07', title: 'Altın Haftası', desc: 'Oyunlardan 400 Çip topla', actionType: 'earn_chips', target: 400, rewardXp: 480, rewardCoins: 260, rewardShields: 1, difficulty: 'hard' },
  { id: 'w_08', title: 'Klasik Fatih', desc: '15 Solo Klasik seviye geç', actionType: 'solo_progress', target: 15, rewardXp: 300, rewardCoins: 160, difficulty: 'medium' },
  { id: 'w_09', title: 'Devasa Tahta Hakimi', desc: '10x10 Devasa Arenada 5 düello oyna', actionType: 'duel_play', target: 5, param: 10, rewardXp: 460, rewardCoins: 250, difficulty: 'hard' },
  { id: 'w_10', title: 'Büyük Kombo Resitali', desc: 'Toplam 25 seri (combo) yap', actionType: 'combo_count', target: 25, rewardXp: 480, rewardCoins: 260, difficulty: 'hard' },
  { id: 'w_11', title: 'Haftalık Meydan Okuma', desc: 'Hafta boyunca 20 düello tamamla', actionType: 'duel_play', target: 20, rewardXp: 480, rewardCoins: 260, difficulty: 'hard' },
  { id: 'w_12', title: 'Yenilmez Lig Şampiyonu', desc: 'Hafta boyunca 12 düello kazan', actionType: 'duel_win', target: 12, rewardXp: 650, rewardCoins: 380, rewardShields: 2, difficulty: 'epic' },
  { id: 'w_13', title: 'Kelime Çağlayanı', desc: 'Toplam 180 kelime patlat', actionType: 'word_count', target: 180, rewardXp: 520, rewardCoins: 280, difficulty: 'hard' },
  { id: 'w_14', title: '8 Harflik Şaheserler', desc: 'En az 8 harfli 5 kelime bul', actionType: 'word_length', target: 5, param: 8, rewardXp: 680, rewardCoins: 400, rewardShields: 1, difficulty: 'epic' },
  { id: 'w_15', title: 'Arcade Ustası', desc: 'Arcade modunda 8.000 puan topla', actionType: 'arcade_score', target: 8000, rewardXp: 520, rewardCoins: 280, difficulty: 'hard' },
  { id: 'w_16', title: 'Vintage Koleksiyoneri', desc: '25 Gazete Eki bulmacası çöz', actionType: 'vintage_solve', target: 25, rewardXp: 520, rewardCoins: 280, rewardShields: 1, difficulty: 'hard' },
  { id: 'w_17', title: 'Milyonerler Kulübü', desc: 'Oyunlardan 600 Çip topla', actionType: 'earn_chips', target: 600, rewardXp: 700, rewardCoins: 420, rewardShields: 2, difficulty: 'epic' },
  { id: 'w_18', title: 'Solo Kaşif', desc: '25 Solo Klasik seviye geç', actionType: 'solo_progress', target: 25, rewardXp: 480, rewardCoins: 260, difficulty: 'hard' },
  { id: 'w_19', title: '8x8 Hakimiyeti', desc: '8x8 Arenada 8 düello kazan', actionType: 'duel_win', target: 8, param: 8, rewardXp: 680, rewardCoins: 400, rewardShields: 1, difficulty: 'epic' },
  { id: 'w_20', title: 'Devasa Seri', desc: 'Toplam 40 seri kombo oluştur', actionType: 'combo_count', target: 40, rewardXp: 520, rewardCoins: 280, difficulty: 'hard' },
  { id: 'w_21', title: 'Haftalık Sadakat', desc: '4 farklı gün Günün Gizemli Kelimesini çöz', actionType: 'daily_route', target: 4, rewardXp: 500, rewardCoins: 270, rewardShields: 1, difficulty: 'hard' },
  { id: 'w_22', title: 'Mini Tahta Ustası', desc: '4x4 Mini Düelloda 10 galibiyet al', actionType: 'duel_win', target: 10, param: 4, rewardXp: 350, rewardCoins: 190, difficulty: 'medium' },
  { id: 'w_23', title: 'Kelime Okyanusu', desc: 'Toplam 250 kelime bul', actionType: 'word_count', target: 250, rewardXp: 720, rewardCoins: 440, rewardShields: 2, difficulty: 'epic' },
  { id: 'w_24', title: '9 Harfli Devler', desc: 'En az 9 harfli 3 kelime üret', actionType: 'word_length', target: 3, param: 9, rewardXp: 720, rewardCoins: 440, rewardShields: 2, difficulty: 'epic' },
  { id: 'w_25', title: 'Arcade Şampiyonlar Ligi', desc: 'Arcade modunda 12.000 puana ulaş', actionType: 'arcade_score', target: 12000, rewardXp: 750, rewardCoins: 460, rewardShields: 2, difficulty: 'epic' },
  { id: 'w_26', title: 'Eski Gazete Duayeni', desc: '35 Gazete Eki bulmacası tamamla', actionType: 'vintage_solve', target: 35, rewardXp: 720, rewardCoins: 440, rewardShields: 2, difficulty: 'epic' },
  { id: 'w_27', title: 'Hazine Sandığı', desc: 'Oyunlardan 900 Çip elde et', actionType: 'earn_chips', target: 900, rewardXp: 780, rewardCoins: 480, rewardShields: 3, difficulty: 'epic' },
  { id: 'w_28', title: 'Solo Efsane', desc: '35 Solo Klasik seviye geç', actionType: 'solo_progress', target: 35, rewardXp: 720, rewardCoins: 440, rewardShields: 2, difficulty: 'epic' },
  { id: 'w_29', title: 'Düello Fırtınası', desc: 'Hafta boyunca 30 düello tamamla', actionType: 'duel_play', target: 30, rewardXp: 750, rewardCoins: 460, rewardShields: 2, difficulty: 'epic' },
  { id: 'w_30', title: 'Büyük Tahta İmparatoru', desc: '10x10 Devasa Düelloda 5 galibiyet al', actionType: 'duel_win', target: 5, param: 10, rewardXp: 800, rewardCoins: 500, rewardShields: 3, difficulty: 'epic' },
];

const fileContent = `// Dynamic Catalog of 90 Daily Missions and 30 Weekly Missions
// Deterministically rotated using PRNG based on Date / ISO Week

export type MissionActionType =
  | 'daily_route'
  | 'duel_play'
  | 'duel_win'
  | 'word_length'
  | 'word_count'
  | 'arcade_score'
  | 'vintage_solve'
  | 'combo_count'
  | 'solo_progress'
  | 'earn_chips';

export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'epic';

export interface CatalogMission {
  id: string;
  title: string;
  desc: string;
  period: 'daily' | 'weekly';
  difficulty: MissionDifficulty;
  actionType: MissionActionType;
  target: number;
  param?: number;
  rewardXp: number;
  rewardCoins: number;
  rewardShields?: number;
}

export const DAILY_EASY_POOL: CatalogMission[] = ` + JSON.stringify(dailyEasy.map(m => ({ ...m, period: 'daily', difficulty: 'easy' })), null, 2) + `;\n
export const DAILY_MEDIUM_POOL: CatalogMission[] = ` + JSON.stringify(dailyMed.map(m => ({ ...m, period: 'daily', difficulty: 'medium' })), null, 2) + `;\n
export const DAILY_HARD_POOL: CatalogMission[] = ` + JSON.stringify(dailyHard.map(m => ({ ...m, period: 'daily', difficulty: 'hard' })), null, 2) + `;\n
export const WEEKLY_POOL: CatalogMission[] = ` + JSON.stringify(weekly.map(m => ({ period: 'weekly', ...m })), null, 2) + `;\n

export const ALL_MISSIONS: CatalogMission[] = [
  ...DAILY_EASY_POOL,
  ...DAILY_MEDIUM_POOL,
  ...DAILY_HARD_POOL,
  ...WEEKLY_POOL,
];

export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Returns 3 daily missions for a given day (1 Easy, 1 Medium, 1 Hard)
 * Deterministic based on todayId (e.g. '2026-09-09')
 */
export function getDailyMissions(todayId: string): CatalogMission[] {
  const seed = stringToSeed('daily_' + todayId);
  const rng = seededRandom(seed);

  const easyIdx = Math.floor(rng() * DAILY_EASY_POOL.length);
  const medIdx = Math.floor(rng() * DAILY_MEDIUM_POOL.length);
  const hardIdx = Math.floor(rng() * DAILY_HARD_POOL.length);

  return [
    DAILY_EASY_POOL[easyIdx],
    DAILY_MEDIUM_POOL[medIdx],
    DAILY_HARD_POOL[hardIdx],
  ];
}

/**
 * Returns 3 unique weekly missions for a given ISO week
 * Deterministic based on weekId (e.g. '2026-W37')
 */
export function getWeeklyMissions(weekId: string): CatalogMission[] {
  const seed = stringToSeed('weekly_' + weekId);
  const rng = seededRandom(seed);

  const pool = [...WEEKLY_POOL];
  const selected: CatalogMission[] = [];

  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    selected.push(pool.splice(idx, 1)[0]);
  }

  return selected;
}

export function findMissionById(id: string): CatalogMission | undefined {
  return ALL_MISSIONS.find((m) => m.id === id);
}
`;

fs.writeFileSync('shared/missions-catalog.ts', fileContent, 'utf-8');
console.log('RE-SCALED_MISSION_REWARDS_SUCCESSFULLY');
