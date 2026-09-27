# Kelime Patlat — Hypercasual arayüz

## Tasarım dili
Sıcak krem zemin (#F7F5EE), koyu mürekkep metin (#293541), sarı ana eylemler, mint başarı ve mercan geri bildirimleri. Oyun hissi harf taşları, basılınca alçalan düğmeler ve net ilerleme göstergelerinden gelir. Orman arka planı, metalik çerçeveler, dekoratif mücevherler ve sürekli parıltılar kullanılmaz.

## Ortak bileşenler
- `shared/palette.ts`: uygulama yüzeyleri, metinler ve vurgu renkleri.
- `components/game-ui.tsx`: sade panel, düğme, kaynak sayacı, bölüm başlığı ve bağlantı çizgisi.
- `components/premium-dock.tsx`: beş sekmeli, seçimi sarı zeminle gösteren gezinme.
- `components/screen-container.tsx`: güvenli alanlar ve geniş ekranlarda en fazla 560 px içerik.
- `shared/themes.ts`: dört açık oyun tahtası teması.
- `shared/solo.ts`: bulunan kelimeler için okunabilir harf ve etiket renkleri.

## Kapsam
Ana sayfa, giriş, günlük bulmaca, çevrim içi düello ve oda, arkadaşlar, seviye seçimi, solo, arcade, gazete bulmacası, mağaza, görevler, profil, lig ve sezon; ayrıca başlangıç, rehber, sonuç, can, ödül, sandık, davet, eşleştirme, bildirim, hata ve koşul pencereleri aynı açık tasarım dilini kullanır. Mevcut kozmetik koleksiyonların ürün kimlikleri ve seçilmiş görselleri korunur.

## Önizleme ve kontrol
Geliştirme sunucusunda `/?preview=design` yolu örnek verilerle ayrı bir görsel inceleme alanı açar. Bu yol yalnızca `__DEV__` modunda etkindir. Hesap veya onay akışına dokunmadan ana sayfa, mağaza, görevler, profil, lig, seviyeler ve oyun tahtaları incelenebilir. Önizleme içindeki satın alma/ödül callbacks hesap verisi değiştirmez. Normal uygulama `/` adresindedir.

390 px mobil genişlikte ana sayfa, mağaza, görevler, profil ve solo tahtası görsel olarak kontrol edildi. Lig kartları ekran genişliği değişince yeniden ölçülür. TypeScript ve ilgili oyun/tema testleri doğrulama için kullanılır. Fiziksel Android/iOS cihaz doğrulaması ayrıca yapılmalıdır.
