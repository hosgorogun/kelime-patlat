# Kelime Patlat — Mobil Arayüz Tasarım Planı

## Ürün yönü

Kelime Patlat, iki oyuncunun aynı harf tahtasında birbirinden hızlı kelime bulmaya çalıştığı, tek elle rahatça oynanabilen bir mobil düello oyunudur. Tasarım dili Patlat'ın koyu, enerjik ve rekabetçi atmosferini taşır; ancak sayı kutuları yerine dokunarak iz çizilen harf taşları merkezdedir. Arayüz 9:16 dikey ekranı, başparmak erişimini ve kısa oyun oturumlarını önceliklendirir.

## Ekran listesi

| Ekran | Ana içerik | İşlev |
|---|---|---|
| Ana sayfa | Günlük seri, oyuncu seviyesi, 4×4 ve 8×8 mod kartları | Hızlı maç, özel oda oluşturma ve oyun boyutu seçme |
| Oda ekranı | Oda kodu, oyuncu kartları, tahta boyutu seçimi ve hazır durumu | Davet kodu paylaşma, kodla katılma ve iki oyuncunun maça hazır olması |
| Maç ekranı | Süre, iki oyuncunun skorları, harf tahtası, aktif kelime şeridi ve bulunan kelimeler | Komşu harfleri sürükleyerek bağlama, kelimeyi bırakınca gönderme ve canlı skor güncellemesi |
| Tur sonucu | Kazanan, skor karşılaştırması, en uzun kelime ve rövanş düğmesi | Maç sonucunu göstermek, rövanş istemek veya ana sayfaya dönmek |
| Nasıl oynanır sayfası | Kısa kural kartları ve görsel yönlendirme | Harflerin yatay, dikey ve çapraz komşulukla birleştirildiğini açıklamak |

## Ana kullanıcı akışları

1. Oyuncu ana sayfadan **Hızlı Maç** veya **Oda Oluştur** seçer.
2. Oyuncu 4×4 hızlı tahta ya da 8×8 uzun maç seçeneğini belirler.
3. Özel odada sistem bir davet kodu üretir; rakip aynı kodla katılır ve iki oyuncu hazır olur.
4. Maç başladığında her iki oyuncu aynı harf tahtasını görür. Oyuncu parmağını bir harften başlayarak yalnızca bitişik harfler üzerinden hareket ettirir.
5. Oyuncu parmağını kaldırdığında kelime doğrulanır. Geçerli ve daha önce alınmamış kelime puan kazandırır; ilk geçerli kelimeyi bulan oyuncu erken zafer bonusu alır.
6. Süre bittiğinde sonuç ekranı açılır. Oyuncular rövanş isteyebilir veya ana sayfaya dönebilir.

## Tahta ve etkileşim ilkeleri

Harf tahtası ekranın orta bölümünde, 4×4 için geniş ve rahat dokunulabilir; 8×8 için ise taş boyutları kontrollü biçimde küçülen ancak erişilebilir kalan kare bir grid olarak yer alır. Seçilen taşlar parlak turkuaz konturla, aralarındaki rota ince neon çizgiyle gösterilir. Aktif kelime ekranın üst kısmındaki şeritte büyük harflerle görünür. Geçerli kelime için başarı, geçersiz kelime için hata dokunsal geri bildirimi verilir; hiçbir geri bildirim yalnızca titreşime bağlı değildir.

## Renk seçimleri

| Kullanım | Renk | Gerekçe |
|---|---|---|
| Arka plan | `#08121E` gece laciverti | Patlat benzeri derin, odaklayıcı oyun alanı |
| Ana vurgu | `#2DD4BF` turkuaz | Seçili harfler, ana eylemler ve canlı rekabet hissi |
| İkincil vurgu | `#A3E635` lime | Skor artışı, geçerli kelime ve kazanma anları |
| Rakip vurgusu | `#FB7185` mercan pembe | Rakip skorları ve rekabet sinyalleri |
| Taş yüzeyi | `#14273A` arduvaz mavisi | Harflerin koyu zeminde okunabilir ve dokunulabilir görünmesi |
| Metin | `#F4FBFF` açık buz beyazı | Yüksek kontrast ve oyun içi okunabilirlik |

## İlk sürüm sınırları

İlk sürümde Türkçe kelime doğrulama, iki tahtadan birini seçme, dokunarak kelime oluşturma, oda kodu ve iki oyunculu sonuç akışı bulunacaktır. Oyuncu profili, kozmetik mağaza, lig, görev ve turnuva gibi Patlat'taki metagame özellikleri sonraki iterasyonlara bırakılacaktır.
