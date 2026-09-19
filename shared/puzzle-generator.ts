export interface WordEntry {
  id: string;
  answer: string;
  category: string;
  clue: string;
  difficulty: "easy" | "medium" | "hard" | "ultra" | "expert";
  length: number;
}

export interface PlacedWord {
  id: string;
  answer: string;
  category: string;
  clue: string;
  difficulty: "easy" | "medium" | "hard" | "ultra" | "expert";
  length: number;
  row: number;
  col: number;
  direction: "horizontal" | "vertical";
  isCenter: boolean;
  cells: [number, number][];
}

export interface PuzzleResult {
  boardSize: number;
  centerWord: PlacedWord;
  words: PlacedWord[];
  score: number;
}

// Geniş Türkçe İpucu Sözlüğü
export const WORD_DICTIONARY: Omit<WordEntry, "id">[] = [
  { answer: "ELMA", category: "Karma", clue: "Kırmızı veya yeşil olabilen lezzetli bir meyve.", length: 4, difficulty: "easy" },
  { answer: "KALEM", category: "Karma", clue: "Yazı yazmak veya çizim yapmak için kullanılan araç.", length: 5, difficulty: "easy" },
  { answer: "KEDİ", category: "Karma", clue: "Evlerde beslenen sevimli ve çevik evcil hayvan.", length: 4, difficulty: "easy" },
  { answer: "MASA", category: "Karma", clue: "Üzerinde çalışılan veya yemek yenilen ayaklı mobilya.", length: 4, difficulty: "easy" },
  { answer: "DENİZ", category: "Karma", clue: "Yeryüzünün büyük bölümünü kaplayan tuzlu su kütlesi.", length: 5, difficulty: "easy" },
  { answer: "KÖPEK", category: "Karma", clue: "İnsanın sadık dostu olarak bilinen evcil memeli.", length: 5, difficulty: "easy" },
  { answer: "GÜNEŞ", category: "Karma", clue: "Gezegenimizi ısıtan ve aydınlatan dev yıldız.", length: 5, difficulty: "easy" },
  { answer: "KİTAP", category: "Karma", clue: "Ciltli veya ciltsiz yazılı sayfalardan oluşan eser.", length: 5, difficulty: "easy" },
  { answer: "ŞEHİR", category: "Karma", clue: "Nüfusu yoğun büyük yerleşim yeri, kent.", length: 5, difficulty: "easy" },
  { answer: "ARABA", category: "Karma", clue: "Tekerlekli motorlu kara ulaşım taşıtı.", length: 5, difficulty: "easy" },
  { answer: "ŞEKER", category: "Karma", clue: "Yiyecek ve içeceklere tatlılık veren organik madde.", length: 5, difficulty: "easy" },
  { answer: "SAHNE", category: "Karma", clue: "Tiyatro veya konserde sanatçıların çıktığı platform.", length: 5, difficulty: "easy" },
  { answer: "NEHİR", category: "Karma", clue: "Denize veya göle dökülen büyük akarsu, ırmak.", length: 5, difficulty: "easy" },
  { answer: "ROKET", category: "Karma", clue: "Tepki kuvvetiyle uzaya fırlatılan hava aracı.", length: 5, difficulty: "medium" },
  { answer: "TILSIM", category: "Karma", clue: "Doğaüstü güç taşıdığına inanılan büyülü nesne.", length: 6, difficulty: "medium" },
  { answer: "KOSMOS", category: "Karma", clue: "Evren ve gök cisimlerinin oluşturduğu düzenli bütün.", length: 6, difficulty: "medium" },
  { answer: "LEVYE", category: "Karma", clue: "Ağır nesneleri kaldırmaya yarayan dayanıklı metal çubuk.", length: 5, difficulty: "medium" },
  { answer: "ORMAN", category: "Karma", clue: "Ağaçlarla kaplı geniş ve zengin doğal alan.", length: 5, difficulty: "easy" },
  { answer: "KAPLAN", category: "Karma", clue: "Asya ormanlarında yaşayan çizgili büyük yırtıcı kedi.", length: 6, difficulty: "medium" },
  { answer: "BİLGİ", category: "Karma", clue: "Öğrenme, araştırma ve gözlemle elde edilen gerçekler.", length: 5, difficulty: "easy" },
  { answer: "BULUT", category: "Karma", clue: "Gökyüzünde asılı duran su buharı kümesi.", length: 5, difficulty: "easy" },
  { answer: "GİTAR", category: "Karma", clue: "Gövdesi oyuk ve telli popüler müzik aleti.", length: 5, difficulty: "easy" },
  { answer: "RADYO", category: "Karma", clue: "Elektromanyetik dalgalarla ses yayını yapan cihaz.", length: 5, difficulty: "medium" },
  { answer: "RÜZGAR", category: "Karma", clue: "Yüksek basınçtan alçak basınca yönelen hava akımı.", length: 6, difficulty: "medium" },
  { answer: "TOPRAK", category: "Karma", clue: "Bitkilerin kök salıp beslendiği yeryüzü örtüsü.", length: 6, difficulty: "medium" },
  { answer: "YILDIZ", category: "Karma", clue: "Uzayda kendi enerjisiyle ışık saçan gök cismi.", length: 6, difficulty: "easy" },
  { answer: "PENCERE", category: "Karma", clue: "Odalara ışık ve hava girmesini sağlayan camlı açıklık.", length: 7, difficulty: "hard" },
  { answer: "ŞEMSİYE", category: "Karma", clue: "Yağmur ve güneş ışınlarından koruyan taşınabilir siperlik.", length: 7, difficulty: "hard" },
  { answer: "KELEBEK", category: "Karma", clue: "Tırtıldan dönüşen rengarenk kanatlı sevimli böcek.", length: 7, difficulty: "medium" },
  { answer: "PUSULA", category: "Karma", clue: "Manyetik ibresi sayesinde kuzeyi gösteren yön bulucu.", length: 6, difficulty: "medium" },
  { answer: "YUMURTA", category: "Karma", clue: "Kuşların ve sürüngenlerin ürettiği besin deposu.", length: 7, difficulty: "medium" },
  { answer: "ZAMAN", category: "Karma", clue: "Olayların birbirini izlediği kesintisiz akış boyutu.", length: 5, difficulty: "easy" },
  { answer: "SABUN", category: "Karma", clue: "Suyla köpürerek temizlik sağlayan hijyen maddesi.", length: 5, difficulty: "easy" },
  { answer: "LİMON", category: "Karma", clue: "Sarı renkli, ekşi ve C vitamini zengini narenciye.", length: 5, difficulty: "easy" },
  { answer: "DUVAR", category: "Karma", clue: "Bir yapıyı bölümlere ayıran dikey taş veya tuğla örgü.", length: 5, difficulty: "easy" },
  { answer: "AYNA", category: "Karma", clue: "Arka yüzeyi sırlı, ışığı yansıtan parlak cam levha.", length: 4, difficulty: "easy" },
  { answer: "MÜZİK", category: "Karma", clue: "Seslerin kulağa hoş gelen estetik dizilimi ve sanatı.", length: 5, difficulty: "easy" },
  { answer: "BALIK", category: "Karma", clue: "Solungaçlarıyla nefes alıp suda yüzen omurgalı canlı.", length: 5, difficulty: "easy" },
  { answer: "TAVŞAN", category: "Karma", clue: "Uzun kulaklı ve hızlı koşan sevimli otobur memeli.", length: 6, difficulty: "easy" },
  { answer: "FELSEFE", category: "Karma", clue: "Varlık, bilgi ve ahlak üzerine derin düşünme disiplini.", length: 7, difficulty: "hard" },
  { answer: "HAKİKAT", category: "Karma", clue: "Gerçeğin özü, asıl olan hakiki durum.", length: 7, difficulty: "hard" },
  { answer: "ERDEM", category: "Karma", clue: "Ahlaki mükemmellik, dürüstlük ve fazilet hali.", length: 5, difficulty: "medium" },
  { answer: "DÜŞÜNCE", category: "Karma", clue: "Zihinde canlandırılan fikir, kavram veya muhakeme.", length: 7, difficulty: "medium" },
  { answer: "BİLİNÇ", category: "Karma", clue: "Kişinin kendisini ve çevresini algılama yetisi.", length: 6, difficulty: "hard" },
  { answer: "KUBBE", category: "Karma", clue: "Yapıların üstünü örten yarım küre biçimindeki tavan.", length: 5, difficulty: "medium" },
  { answer: "SÜTUN", category: "Karma", clue: "Yapı tavanlarını taşımak için dikilen silindirik direk.", length: 5, difficulty: "medium" },
  { answer: "ŞADIRVAN", category: "Karma", clue: "Genellikle cami avlusunda yer alan havuzlu abdest çeşmesi.", length: 8, difficulty: "hard" },
  { answer: "FOSİL", category: "Karma", clue: "Geçmiş jeolojik çağlardan kalan taşlaşmış canlı izi.", length: 5, difficulty: "medium" },
  { answer: "GÖKADA", category: "Karma", clue: "Milyarlarca yıldızdan oluşan dev gök sistemi, galaksi.", length: 6, difficulty: "hard" },
  { answer: "ATMOSFER", category: "Karma", clue: "Dünyayı çepeçevre saran koruyucu gaz küresi.", length: 8, difficulty: "hard" },
  { answer: "ŞAHESER", category: "Karma", clue: "Sanatçının ustalığını gösteren kusursuz başyapıt.", length: 7, difficulty: "hard" },
  { answer: "EFSANE", category: "Karma", clue: "Halk arasında dilden dile aktarılan olağanüstü hikaye.", length: 6, difficulty: "medium" },
  { answer: "DESTAN", category: "Karma", clue: "Ulusların kahramanlık mücadelelerini anlatan manzum öykü.", length: 6, difficulty: "medium" },
  { answer: "TELESKOP", category: "Karma", clue: "Gök cisimlerini yakından incelemeyi sağlayan optik aygıt.", length: 8, difficulty: "hard" },
  { answer: "LABİRENT", category: "Karma", clue: "Çıkış yolu karmaşık ve bulunması güç koridorlar ağı.", length: 8, difficulty: "medium" },
  { answer: "KİMYA", category: "Karma", clue: "Maddelerin yapı ve özelliklerini inceleyen temel bilim.", length: 5, difficulty: "medium" },
  { answer: "KORİDOR", category: "Karma", clue: "Binalarda odaları birbirine bağlayan uzun ve dar geçit.", length: 7, difficulty: "medium" },
  { answer: "SARAY", category: "Karma", clue: "Hükümdarların oturduğu görkemli ve anıtsal büyük konut.", length: 5, difficulty: "easy" },
  { answer: "HEYKEL", category: "Karma", clue: "Taş, kil veya metal yontularak yapılan üç boyutlu sanat eseri.", length: 6, difficulty: "medium" },
  { answer: "FOTOĞRAF", category: "Karma", clue: "Işığın duyarlı yüzeye düşürülmesiyle çekilen görüntü.", length: 8, difficulty: "hard" },
  { answer: "MANTIK", category: "Karma", clue: "Akıl yürütme ve tutarlı düşünme kuralları bütünü.", length: 6, difficulty: "medium" },
  { answer: "ADALET", category: "Karma", clue: "Hak ve hukuka uygunluk, herkese hakkını verme ilkesi.", length: 6, difficulty: "medium" },
  { answer: "BİLGELİK", category: "Karma", clue: "Derin anlayış, doğru yargılama ve olgun akıl düzeyi.", length: 8, difficulty: "hard" },
  { answer: "HAZİNE", category: "Karma", clue: "Değerli eşya ve altınların saklandığı gizli birikim.", length: 6, difficulty: "medium" },
  { answer: "KAPTAN", category: "Karma", clue: "Gemiyi veya uçağı yöneten en üst düzey yetkili.", length: 6, difficulty: "easy" },
  { answer: "RİTİM", category: "Karma", clue: "Ses veya hareketlerin düzenli ve tekrarlı ahengi.", length: 5, difficulty: "medium" },
  { answer: "FIRTINA", category: "Karma", clue: "Şiddetli esen rüzgar ve fırtınalı hava durumu.", length: 7, difficulty: "medium" },
  { answer: "VOLKAN", category: "Karma", clue: "Yerkabuğundan lav püskürten aktif yanardağ.", length: 6, difficulty: "medium" },
  { answer: "TİYATRO", category: "Karma", clue: "Sahnede izleyiciler önünde sergilenen dramatik sanat.", length: 7, difficulty: "medium" },
  { answer: "PİRAMİT", category: "Karma", clue: "Eski Mısır firavunları için inşa edilen üçgen anıt mezar.", length: 7, difficulty: "hard" },
  { answer: "ÇİÇEK", category: "Karma", clue: "Bitkilerin tohum oluşturan renkli ve kokulu kısmı.", length: 5, difficulty: "easy" },
  { answer: "BAHÇE", category: "Karma", clue: "Çiçek veya sebze yetiştirilen çevrili açık alan.", length: 5, difficulty: "easy" },
  { answer: "SAHİL", category: "Karma", clue: "Deniz veya göl kenarındaki kumlu kıyı şeridi.", length: 5, difficulty: "easy" },
  { answer: "YAPRAK", category: "Karma", clue: "Bitkilerin güneş ışığıyla besin üreten yeşil organı.", length: 6, difficulty: "easy" },
  { answer: "YAĞMUR", category: "Karma", clue: "Bulutlardaki su buharının sıvı damlalar olarak yağması.", length: 6, difficulty: "easy" },
  { answer: "MEVSİM", category: "Karma", clue: "Yılın iklim şartlarına göre ayrılan dört ana dönemi.", length: 6, difficulty: "easy" },
  { answer: "IRMAK", category: "Karma", clue: "Denize veya büyük bir göle dökülen geniş akarsu.", length: 5, difficulty: "easy" },
  { answer: "ŞELALE", category: "Karma", clue: "Suyun yüksek bir kayalıktan döküldüğü çağlayan.", length: 6, difficulty: "medium" },
  { answer: "VADİ", category: "Karma", clue: "İki dağ arasında uzanan tabanı akarsulu çöküntü.", length: 4, difficulty: "easy" },
  { answer: "YAYLA", category: "Karma", clue: "Yazın serinlemek için çıkılan yüksek düzlük alan.", length: 5, difficulty: "easy" },
  { answer: "MAĞARA", category: "Karma", clue: "Yer altında veya dağ yamacında bulunan doğal kovuk.", length: 6, difficulty: "medium" },
  { answer: "KANYON", category: "Karma", clue: "Akarsuların kayaları derinlemesine oymasıyla oluşan dar boğaz.", length: 6, difficulty: "medium" },
  { answer: "GÖLET", category: "Karma", clue: "Yapay veya doğal küçük durgun su birikintisi.", length: 5, difficulty: "easy" },
  { answer: "BATAKLIK", category: "Karma", clue: "Tabanı çamurlu ve sazlıklarla kaplı sığ su alanı.", length: 8, difficulty: "medium" },
  { answer: "BUZUL", category: "Karma", clue: "Kutuplarda ve yüksek dağlarda biriken dev buz kütlesi.", length: 5, difficulty: "medium" },
  { answer: "DALGA", category: "Karma", clue: "Rüzgarın su yüzeyinde meydana getirdiği kıvrımlı hareket.", length: 5, difficulty: "easy" },
  { answer: "DAMLA", category: "Karma", clue: "Yuvarlak biçimli çok küçük sıvı parçacığı.", length: 5, difficulty: "easy" },
  { answer: "KAYALIK", category: "Karma", clue: "Büyük ve sert taş kütlelerinden oluşan dik arazi.", length: 7, difficulty: "medium" },
  { answer: "ORMANLIK", category: "Karma", clue: "Yoğun ağaç örtüsüyle kaplı ağaçlık bölge.", length: 8, difficulty: "medium" },
  { answer: "TOPRAKLI", category: "Karma", clue: "İçinde bol miktarda toprak barındıran yer.", length: 8, difficulty: "easy" },
  { answer: "ŞİMŞEK", category: "Karma", clue: "Bulutlar arasında gerçekleşen elektrik boşalması parıltısı.", length: 6, difficulty: "medium" },
  { answer: "KASIRGA", category: "Karma", clue: "Çok güçlü esen ve yıkıcı etkileri olan dev fırtına.", length: 7, difficulty: "hard" },
  { answer: "KARTAL", category: "Karma", clue: "Gözleri keskin ve avcı büyük yırtıcı kuş.", length: 6, difficulty: "easy" },
  { answer: "ŞAHİN", category: "Karma", clue: "Hızlı uçan ve havada avlanan çevik yırtıcı kuş.", length: 5, difficulty: "easy" },
  { answer: "BAYKUŞ", category: "Karma", clue: "Geceleri avlanan, başını geniş açıyla çeviren kuş.", length: 6, difficulty: "medium" },
  { answer: "LEYLEK", category: "Karma", clue: "Uzun bacaklı ve gagalı, her yıl göç eden büyük kuş.", length: 6, difficulty: "easy" },
  { answer: "ÖRDEK", category: "Karma", clue: "Geniş gagalı ve perde ayaklı sevimli su kuşu.", length: 5, difficulty: "easy" },
  { answer: "KUĞU", category: "Karma", clue: "Uzun ve zarif boyunlu, beyaz tüylü asil su kuşu.", length: 4, difficulty: "easy" },
  { answer: "GÜVERCİN", category: "Karma", clue: "Barışın simgesi sayılan ve şehirlerde yaşayan evcil kuş.", length: 8, difficulty: "medium" },
  { answer: "TİLKİ", category: "Karma", clue: "Kurnazlığıyla bilinen kızıl kürklü vahşi memeli.", length: 5, difficulty: "easy" },
  { answer: "KURT", category: "Karma", clue: "Sürüler halinde avlanan güçlü yabani köpek türü.", length: 4, difficulty: "easy" },
  { answer: "ASLAN", category: "Karma", clue: "Yelesiyle ünlü, ormanların kralı sayılan yırtıcı kedi.", length: 5, difficulty: "easy" },
  { answer: "ZEBRA", category: "Karma", clue: "Siyah beyaz çizgili kürküyle tanınan Afrika otoburu.", length: 5, difficulty: "easy" },
  { answer: "ZÜRAFA", category: "Karma", clue: "Dünyanın en uzun boylu kara hayvanı.", length: 6, difficulty: "medium" },
  { answer: "YUNUS", category: "Karma", clue: "Denizlerde yaşayan son derece zeki ve dost canlısı memeli.", length: 5, difficulty: "medium" },
  { answer: "BALİNA", category: "Karma", clue: "Okyanuslarda yaşayan dünyanın en büyük deniz memelisi.", length: 6, difficulty: "medium" },
  { answer: "AHTAPOT", category: "Karma", clue: "Sekiz kollu ve vantuzlu omurgasız deniz canlısı.", length: 7, difficulty: "medium" },
  { answer: "MERCAN", category: "Karma", clue: "Sıcak denizlerde kayalık resifler oluşturan omurgasız canlı.", length: 6, difficulty: "medium" },
  { answer: "KARINCA", category: "Karma", clue: "Toplu halde yaşayan çok çalışkan küçük böcek.", length: 7, difficulty: "medium" },
  { answer: "SİNCAP", category: "Karma", clue: "Ağaçlarda yaşayan ve ceviz toplayan kuyruklu sevimli kemirgen.", length: 6, difficulty: "medium" },
  { answer: "KUNDUZ", category: "Karma", clue: "Akarsularda ağaç dallarından setler inşa eden usta kemirgen.", length: 6, difficulty: "medium" },
  { answer: "ÇINAR", category: "Karma", clue: "Yüzyıllarca yaşayabilen gölgeli dev yapraklı ulu ağaç.", length: 5, difficulty: "easy" },
  { answer: "MEŞE", category: "Karma", clue: "Palamut veren, kerestesi çok sağlam dayanıklı ağaç.", length: 4, difficulty: "easy" },
  { answer: "ZEYTİN", category: "Karma", clue: "Akdeniz ikliminin simgesi olan yağlı ve şifalı meyve.", length: 6, difficulty: "medium" },
  { answer: "PAPATYA", category: "Karma", clue: "Sarı göbekli ve beyaz taç yapraklı kır çiçeği.", length: 7, difficulty: "medium" },
  { answer: "LALE", category: "Karma", clue: "Soğanlı ve çan biçimli bahar çiçeği, İstanbul simgesi.", length: 4, difficulty: "easy" },
  { answer: "NERGİS", category: "Karma", clue: "Baharın habercisi güzel kokulu sarı beyaz çiçek.", length: 6, difficulty: "medium" },
  { answer: "SÜMBÜL", category: "Karma", clue: "Salkım biçiminde açan çok hoş kokulu soğanlı çiçek.", length: 6, difficulty: "medium" },
  { answer: "MENEKŞE", category: "Karma", clue: "Kadife dokulu ve mor renkli zarif saksı çiçeği.", length: 7, difficulty: "medium" },
  { answer: "ZAMBAK", category: "Karma", clue: "Büyük ve gösterişli çiçekler açan soğanlı süs bitkisi.", length: 6, difficulty: "medium" },
  { answer: "İNSAN", category: "Karma", clue: "Düşünme ve konuşma yeteneği olan en gelişmiş canlı.", length: 5, difficulty: "easy" },
  { answer: "BEBEK", category: "Karma", clue: "Yeni doğmuş veya henüz süt çağındaki küçük çocuk.", length: 5, difficulty: "easy" },
  { answer: "ÇOCUK", category: "Karma", clue: "Bebeklik ile ergenlik arasındaki gelişim çağındaki insan.", length: 5, difficulty: "easy" },
  { answer: "GENÇ", category: "Karma", clue: "Gelişmesini tamamlamış, dinamik ve enerjik kişi.", length: 4, difficulty: "easy" },
  { answer: "DOST", category: "Karma", clue: "Güvenilen, sevilen ve her zaman yanında olunan yakın arkadaş.", length: 4, difficulty: "easy" },
  { answer: "AİLE", category: "Karma", clue: "Toplumu oluşturan en küçük çekirdek birlik, akrabalar.", length: 4, difficulty: "easy" },
  { answer: "KOMŞU", category: "Karma", clue: "Evleri birbirine yakın veya yan yana olan kimseler.", length: 5, difficulty: "easy" },
  { answer: "MİSAFİR", category: "Karma", clue: "Bir eve veya yere kısa süre kalmak için gelen konuk.", length: 7, difficulty: "medium" },
  { answer: "HALK", category: "Karma", clue: "Aynı ülkede yaşayan insanların tümü, ahali.", length: 4, difficulty: "easy" },
  { answer: "MİLLET", category: "Karma", clue: "Aynı dili, tarihi ve kültürü paylaşan büyük insan topluluğu.", length: 6, difficulty: "medium" },
  { answer: "DEVLET", category: "Karma", clue: "Toprak bütünlüğüne bağlı siyasal örgütlü bağımsız güç.", length: 6, difficulty: "medium" },
  { answer: "VATAN", category: "Karma", clue: "Bir milletin hakim olduğu bağımsız yurt toprakları.", length: 5, difficulty: "easy" },
  { answer: "BAYRAK", category: "Karma", clue: "Bir ulusun bağımsızlığını temsil eden renkli kumaş simge.", length: 6, difficulty: "medium" },
  { answer: "SANCAK", category: "Karma", clue: "Törenlerde ve askeri birliklerde taşınan işlemeli bayrak.", length: 6, difficulty: "medium" },
  { answer: "ZAFER", category: "Karma", clue: "Savaşta veya yarışmada kazanılan kesin başarı ve üstünlük.", length: 5, difficulty: "easy" },
  { answer: "BARIŞ", category: "Karma", clue: "Savaş ve çatışmanın olmaması durumu, sulh ve esenlik.", length: 5, difficulty: "easy" },
  { answer: "SEVGİ", category: "Karma", clue: "Bir kimseye veya şeye duyulan derin bağlılık ve yakınlık.", length: 5, difficulty: "easy" },
  { answer: "SAYGI", category: "Karma", clue: "Başkalarının değerine ve hakkına gösterilen hürmet.", length: 5, difficulty: "easy" },
  { answer: "HUZUR", category: "Karma", clue: "Ruhun dinginlik, sakinlik ve güven içinde olma hali.", length: 5, difficulty: "easy" },
  { answer: "UMUT", category: "Karma", clue: "Gelecekte olumlu gelişmelerin gerçekleşmesini bekleme duygusu.", length: 4, difficulty: "easy" },
  { answer: "NEŞE", category: "Karma", clue: "İnsanı mutlu eden coşkulu ve şen ruh durumu.", length: 4, difficulty: "easy" },
  { answer: "SEVİNÇ", category: "Karma", clue: "İstenen bir şeyin gerçekleşmesiyle duyulan ferahlık.", length: 6, difficulty: "medium" },
  { answer: "ŞEFKAT", category: "Karma", clue: "Karşılıksız koruma ve acıma sevgisi, sevecenlik.", length: 6, difficulty: "medium" },
  { answer: "GÜVEN", category: "Karma", clue: "Kuşku duymadan inanma ve sırtını dayayabilme hissi.", length: 5, difficulty: "easy" },
  { answer: "VEFA", category: "Karma", clue: "Yapılan iyilikleri ve dostlukları unutmama erdemi.", length: 4, difficulty: "easy" },
  { answer: "CESARET", category: "Karma", clue: "Güçlükler ve korkular karşısında yılmama yürekliliği.", length: 7, difficulty: "medium" },
  { answer: "SABIR", category: "Karma", clue: "Zorluklar karşısında metanetle bekleme ve dayanma gücü.", length: 5, difficulty: "easy" },
  { answer: "SADAKAT", category: "Karma", clue: "Birine veya bir ideale sarsılmaz bağla bağlı kalma.", length: 7, difficulty: "medium" },
  { answer: "MERHAMET", category: "Karma", clue: "Başkalarının acısını paylaşma ve bağışlayıcı olma.", length: 8, difficulty: "medium" },
  { answer: "GURUR", category: "Karma", clue: "Onurlu olmaktan veya başarıdan duyulan haklı kıvanç.", length: 5, difficulty: "easy" },
  { answer: "ONUR", category: "Karma", clue: "İnsanın kendine duyduğu saygı, haysiyet ve şeref.", length: 4, difficulty: "easy" },
  { answer: "VİCDAN", category: "Karma", clue: "Kişiyi doğru ile yanlışı ayırt etmeye yönelten iç ses.", length: 6, difficulty: "medium" },
  { answer: "KAVRAM", category: "Karma", clue: "Bir nesnenin veya düşüncenin zihindeki genel tasarımı.", length: 6, difficulty: "medium" },
  { answer: "ANLAM", category: "Karma", clue: "Bir sözcüğün veya cümlenin zihinde uyandırdığı mana.", length: 5, difficulty: "easy" },
  { answer: "BİLMECE", category: "Karma", clue: "Bir şeyin adını gizleyerek özelliklerini soran zeka oyunu.", length: 7, difficulty: "medium" },
  { answer: "BULMACA", category: "Karma", clue: "Zekayı ve bilgiyi kullanarak çözülen kare veya bulmaca.", length: 7, difficulty: "medium" },
  { answer: "HAFIZA", category: "Karma", clue: "Yaşananları ve öğrenilen bilgileri saklama yetisi, bellek.", length: 6, difficulty: "medium" },
  { answer: "DİKKAT", category: "Karma", clue: "Zihnin bir konu veya iş üzerinde toplanması.", length: 6, difficulty: "medium" },
  { answer: "YETENEK", category: "Karma", clue: "Bir işi kolaylıkla ve ustalıkla yapabilme kabiliyeti.", length: 7, difficulty: "medium" },
  { answer: "ZEKA", category: "Karma", clue: "Yeni durumları kavrama ve çözüm üretme kapasitesi.", length: 4, difficulty: "easy" },
  { answer: "KENT", category: "Karma", clue: "Gelişmiş altyapıya ve yoğun nüfusa sahip büyük yerleşim yeri.", length: 4, difficulty: "easy" },
  { answer: "CADDE", category: "Karma", clue: "Şehir içindeki geniş, uzun ve ana taşıt yolu.", length: 5, difficulty: "easy" },
  { answer: "SOKAK", category: "Karma", clue: "Şehir ve kasabalarda evlerin dizildiği dar yol.", length: 5, difficulty: "easy" },
  { answer: "MEYDAN", category: "Karma", clue: "Şehirlerde herkesin toplanabildiği geniş açık alan.", length: 6, difficulty: "medium" },
  { answer: "KÖPRÜ", category: "Karma", clue: "İki yakayı veya vadiyi birbirine bağlayan geçiş yapısı.", length: 5, difficulty: "easy" },
  { answer: "BİNA", category: "Karma", clue: "İnsanların oturması veya çalışması için yapılan taş yapı.", length: 4, difficulty: "easy" },
  { answer: "PARK", category: "Karma", clue: "Şehir merkezlerinde dinlenmek için ayrılmış yeşil alan.", length: 4, difficulty: "easy" },
  { answer: "LİMAN", category: "Karma", clue: "Gemilerin yanaştığı ve korunduğu kıyı tesisi.", length: 5, difficulty: "easy" },
  { answer: "İSKELE", category: "Karma", clue: "Gemilerin yolcu ve yük indirdiği ahşap veya beton çıkıntı.", length: 6, difficulty: "medium" },
  { answer: "ÇEŞME", category: "Karma", clue: "Akan suyu olan halka açık mimari su yapısı.", length: 5, difficulty: "easy" },
  { answer: "ÇARŞI", category: "Karma", clue: "Dükkanların bir arada bulunduğu alışveriş mevkii.", length: 5, difficulty: "easy" },
  { answer: "PAZAR", category: "Karma", clue: "Belirli günlerde kurulan açık satış alanı.", length: 5, difficulty: "easy" },
  { answer: "MAHALLE", category: "Karma", clue: "Bir kentin yönetimsel bölümlerinden her biri.", length: 7, difficulty: "medium" },
  { answer: "KONAK", category: "Karma", clue: "Büyük ve gösterişli geleneksel köşk tarzı ev.", length: 5, difficulty: "medium" },
  { answer: "KÖŞK", category: "Karma", clue: "Bahçe içinde özenle yapılmış süslü ve ferah yapı.", length: 4, difficulty: "easy" },
  { answer: "HİSAR", category: "Karma", clue: "Bir kenti korumak amacıyla inşa edilmiş küçük kale.", length: 5, difficulty: "medium" },
  { answer: "KULE", category: "Karma", clue: "Yüksek, dar ve silindirik gözetleme yapısı.", length: 4, difficulty: "easy" },
  { answer: "MÜZE", category: "Karma", clue: "Tarihi ve sanatsal eserlerin sergilendiği mekan.", length: 4, difficulty: "easy" },
  { answer: "ARŞİV", category: "Karma", clue: "Belge ve tarihi vesikaların korunduğu resmi depo.", length: 5, difficulty: "medium" },
  { answer: "TÜNEL", category: "Karma", clue: "Dağların veya yer altından açılan kapalı geçit.", length: 5, difficulty: "easy" },
  { answer: "DURAK", category: "Karma", clue: "Toplu taşıma araçlarının yolcu indirdiği durma yeri.", length: 5, difficulty: "easy" },
  { answer: "İSTASYON", category: "Karma", clue: "Trenlerin durup yolcu aldığı terminal binası.", length: 8, difficulty: "hard" },
  { answer: "KAPI", category: "Karma", clue: "Bir mekana girip çıkmayı sağlayan açılır kapanır kanat.", length: 4, difficulty: "easy" },
  { answer: "BARDAK", category: "Karma", clue: "Su ve meşrubat içmek için kullanılan cam kap.", length: 6, difficulty: "easy" },
  { answer: "ÇANTA", category: "Karma", clue: "Eşyaları taşımaya yarayan deri veya kumaş kap.", length: 5, difficulty: "easy" },
  { answer: "KAŞIK", category: "Karma", clue: "Çorba ve sulu yemekleri yemeye yarayan saplı çukur araç.", length: 5, difficulty: "easy" },
  { answer: "ÇATAL", category: "Karma", clue: "Yiyecekleri batırarak yemeye yarayan uçları sivri araç.", length: 5, difficulty: "easy" },
  { answer: "BIÇAK", category: "Karma", clue: "Kesme ve dilimleme işlemlerinde kullanılan keskin alet.", length: 5, difficulty: "easy" },
  { answer: "TABAK", category: "Karma", clue: "Yemek servisi yapılan yayvan veya çukur servis kabı.", length: 5, difficulty: "easy" },
  { answer: "TENCERE", category: "Karma", clue: "İçinde yemek pişirilen metal veya toprak derin kap.", length: 7, difficulty: "medium" },
  { answer: "TAVA", category: "Karma", clue: "İçinde kızartma veya kavurma yapılan saplı yassı kap.", length: 4, difficulty: "easy" },
  { answer: "HALI", category: "Karma", clue: "Zemini örtmek için yünden dokunan desenli örtü.", length: 4, difficulty: "easy" },
  { answer: "KİLİM", category: "Karma", clue: "Halıdan daha ince, dokuma desenli geleneksel yaygı.", length: 5, difficulty: "easy" },
  { answer: "PERDE", category: "Karma", clue: "Pencereleri örterek içeriyi gizleyen kumaş asma örtü.", length: 5, difficulty: "easy" },
  { answer: "KOLTUK", category: "Karma", clue: "Kolları ve arkalığı olan rahat oturma eşyası.", length: 6, difficulty: "medium" },
  { answer: "SEHPA", category: "Karma", clue: "Koltukların yanına koyulan küçük alçak masa.", length: 5, difficulty: "easy" },
  { answer: "LAMBA", category: "Karma", clue: "Elektrik akımıyla aydınlatma sağlayan ışık kaynağı.", length: 5, difficulty: "easy" },
  { answer: "SANDIK", category: "Karma", clue: "Eşyaları saklamak için kullanılan kapaklı ahşap kutu.", length: 6, difficulty: "medium" },
  { answer: "YASTIK", category: "Karma", clue: "Yatarken başın altına koyulan yumuşak dolgulu kılıf.", length: 6, difficulty: "medium" },
  { answer: "YORGAN", category: "Karma", clue: "Yatakta üstü örtmek için kullanılan sıcak örtü.", length: 6, difficulty: "medium" },
  { answer: "DOLAP", category: "Karma", clue: "Giysi veya eşyaları dizmek için kullanılan raflı mobilya.", length: 5, difficulty: "easy" },
  { answer: "ÇEKMECE", category: "Karma", clue: "Masalarda çekilerek açılan sürgülü bölme.", length: 7, difficulty: "medium" },
  { answer: "TERLİK", category: "Karma", clue: "Evde ayakları rahatlatmak için giyilen hafif ayakkabı.", length: 6, difficulty: "medium" },
  { answer: "FIRÇA", category: "Karma", clue: "Kıllardan yapılan temizleme veya boyama aracı.", length: 5, difficulty: "easy" },
  { answer: "SÜNGER", category: "Karma", clue: "Suyu içine çekebilen gözenekli esnek temizlik gereci.", length: 6, difficulty: "medium" },
  { answer: "SÜRAHİ", category: "Karma", clue: "Su koymaya yarayan kulplu cam şişe kap.", length: 6, difficulty: "medium" },
  { answer: "KAVANOZ", category: "Karma", clue: "Genellikle camdan yapılan yiyecek saklama kabı.", length: 7, difficulty: "medium" },
  { answer: "TABURE", category: "Karma", clue: "Arkalığı olmayan küçük tek kişilik oturak.", length: 6, difficulty: "medium" },
  { answer: "ÇERÇEVE", category: "Karma", clue: "Resim veya aynayı çevreleyen süslü kenarlık.", length: 7, difficulty: "medium" },
  { answer: "ÇORBA", category: "Karma", clue: "Sıcak olarak tüketilen sulu ve besleyici başlangıç yemeği.", length: 5, difficulty: "easy" },
  { answer: "PİLAV", category: "Karma", clue: "Pirinç veya bulgurun kavrulup demlenmesiyle yapılan yemek.", length: 5, difficulty: "easy" },
  { answer: "SEBZE", category: "Karma", clue: "Yemeklerde pişirilen veya salatası yapılan taze bitkisel ürünler.", length: 5, difficulty: "easy" },
  { answer: "MEYVE", category: "Karma", clue: "Ağaçlarda yetişen tatlı veya ekşi sulu lezzetli ürün.", length: 5, difficulty: "easy" },
  { answer: "TATLI", category: "Karma", clue: "Şeker veya bal ile hazırlanan zengin ikramlık lezzetler.", length: 5, difficulty: "easy" },
  { answer: "EKMEK", category: "Karma", clue: "Undan yoğrulan hamurun fırında pişirilmesiyle yapılan temel gıda.", length: 5, difficulty: "easy" },
  { answer: "LEZZET", category: "Karma", clue: "Dilde ve damakta hissedilen tatmin edici hoş tat duyusu.", length: 6, difficulty: "medium" },
  { answer: "KAHVE", category: "Karma", clue: "Kavrulmuş çekirdeklerin kaynatılmasıyla içilen sıcak içecek.", length: 5, difficulty: "easy" },
  { answer: "BÖREK", category: "Karma", clue: "İnce yufkaların arasına harç konularak pişirilen hamur işi.", length: 5, difficulty: "easy" },
  { answer: "KÖFTE", category: "Karma", clue: "Baharatlı kıymanın yoğrulup pişirildiği leziz yemek.", length: 5, difficulty: "easy" },
  { answer: "IZGARA", category: "Karma", clue: "Etlerin doğrudan akkor kömür üzerinde pişirilmesi yöntemi.", length: 6, difficulty: "medium" },
  { answer: "ŞERBET", category: "Karma", clue: "Geleneksel meyve özleri veya şekerle yapılan soğuk tatlı içecek.", length: 6, difficulty: "medium" },
  { answer: "PEYNİR", category: "Karma", clue: "Sütün mayalanması ve pıhtılaşmasıyla elde edilen besin.", length: 6, difficulty: "medium" },
  { answer: "MEZE", category: "Karma", clue: "Ana yemekten önce sofraya getirilen soğuk lezzetler.", length: 4, difficulty: "easy" },
  { answer: "HELVA", category: "Karma", clue: "İrmik veya unun yağda kavrulup şerbetle buluşturulduğu tatlı.", length: 5, difficulty: "easy" },
  { answer: "MANTI", category: "Karma", clue: "Kıymalı küçük hamurların sarımsaklı yoğurtla sunumu.", length: 5, difficulty: "easy" },
  { answer: "MUTFAK", category: "Karma", clue: "Evde yemeklerin hazırlandığı ve ocak bulunan özel oda.", length: 6, difficulty: "medium" },
  { answer: "BAHARAT", category: "Karma", clue: "Yemeklere tat, koku ve renk veren kurutulmuş bitki tozları.", length: 7, difficulty: "medium" },
  { answer: "KAVURMA", category: "Karma", clue: "Etin kendi yağında ağır ateşte pişirilerek saklanması.", length: 7, difficulty: "medium" },
  { answer: "PASTA", category: "Karma", clue: "Özel günlerde kutlama amacıyla kesilen kremalı tatlı.", length: 5, difficulty: "easy" },
  { answer: "REÇEL", category: "Karma", clue: "Meyvelerin şekerle kaynatılarak kıvam aldırılmış hali.", length: 5, difficulty: "easy" },
  { answer: "KAYMAK", category: "Karma", clue: "Sütün kaynatılıp soğutulmasıyla yüzeyinde toplanan yağlı tabaka.", length: 6, difficulty: "medium" },
  { answer: "CEVİZ", category: "Karma", clue: "Sert kabuklu ve içi beyin kıvrımlarını andıran kuruyemiş.", length: 5, difficulty: "easy" },
  { answer: "FINDIK", category: "Karma", clue: "Karadeniz bölgesinde yetişen sert kabuklu lezzetli yemiş.", length: 6, difficulty: "medium" },
  { answer: "BADEM", category: "Karma", clue: "Çağlası da yenen sert kabuklu lezzetli kuru yemiş.", length: 5, difficulty: "easy" },
  { answer: "TURŞU", category: "Karma", clue: "Sebzelerin tuzlu ve sirkeli suda fermente edilmesi.", length: 5, difficulty: "easy" },
  { answer: "CACIK", category: "Karma", clue: "Yoğurt, su ve salatalıkla yapılan ferahlatıcı soğuk meze.", length: 5, difficulty: "easy" },
  { answer: "SALATA", category: "Karma", clue: "Taze yeşillik ve sebzelerin zeytinyağıyla harmanlanması.", length: 6, difficulty: "medium" },
  { answer: "BAKLAVA", category: "Karma", clue: "Kırk kat ince yufkadan yapılan şerbetli Türk tatlısı.", length: 7, difficulty: "hard" },
  { answer: "HAKEM", category: "Karma", clue: "Müsabakaları kurallara göre yöneten tarafsız yetkili kişi.", length: 5, difficulty: "medium" },
  { answer: "KUPA", category: "Karma", clue: "Şampiyonalarda kazanan takıma verilen değerli madeni ödül.", length: 4, difficulty: "easy" },
  { answer: "ATLET", category: "Karma", clue: "Koşu, atlama ve atma dallarında yarışan sporcu.", length: 5, difficulty: "easy" },
  { answer: "GÜREŞ", category: "Karma", clue: "İki sporcunun minderde birbirini tuş etmeye çalıştığı ata sporu.", length: 5, difficulty: "medium" },
  { answer: "YARIŞ", category: "Karma", clue: "Belirli mesafeyi en hızlı bitirmek için yapılan çekişme.", length: 5, difficulty: "easy" },
  { answer: "REKOR", category: "Karma", clue: "Bir alanda kaydedilen en üstün başarı derecesi.", length: 5, difficulty: "medium" },
  { answer: "HÜCUM", category: "Karma", clue: "Rakip kaleye sayı bulmak için yapılan saldırı atağı.", length: 5, difficulty: "medium" },
  { answer: "DEFANS", category: "Karma", clue: "Rakip takımın hücumlarını savuşturmak için kurulan savunma hattı.", length: 6, difficulty: "medium" },
  { answer: "TRİBÜN", category: "Karma", clue: "Stadyumlarda seyircilerin maçı izlediği basamaklı yerler.", length: 6, difficulty: "medium" },
  { answer: "PARKUR", category: "Karma", clue: "Yarışların gerçekleştirildiği engellerle dolu özel rota.", length: 6, difficulty: "medium" },
  { answer: "MARATON", category: "Karma", clue: "Kırk iki kilometrelik en uzun mesafeli koşu.", length: 7, difficulty: "hard" },
  { answer: "PENALTI", category: "Karma", clue: "Ceza sahası içinde yapılan faule verilen on bir metre vuruşu.", length: 7, difficulty: "hard" },
  { answer: "TURNUVA", category: "Karma", clue: "Birçok takımın şampiyonluk için karşılaştığı dizi maçlar.", length: 7, difficulty: "hard" },
  { answer: "RAKET", category: "Karma", clue: "Tenis ve masa tenisinde topa vurmak için kullanılan saplı araç.", length: 5, difficulty: "medium" },
  { answer: "POTA", category: "Karma", clue: "Basketbol topunun içinden geçirilerek sayı alınan çember.", length: 4, difficulty: "easy" },
  { answer: "KALE", category: "Karma", clue: "Futbol ve hentbolda topun ağlarla buluştuğu iki direkli alan.", length: 4, difficulty: "easy" },
  { answer: "FİLE", category: "Karma", clue: "Sahayı ikiye bölen ve üzerinden top geçirilen örgülü ağ.", length: 4, difficulty: "easy" },
  { answer: "BASKET", category: "Karma", clue: "Basketbolda topu potaya sokarak kazanılan sayı.", length: 6, difficulty: "medium" },
  { answer: "TENİS", category: "Karma", clue: "Kortta raketlerle sarı topa vurularak oynanan spor dalı.", length: 5, difficulty: "easy" },
  { answer: "FUTBOL", category: "Karma", clue: "On birer kişilik iki takımın ayakla oynadığı dünya sporu.", length: 6, difficulty: "medium" },
  { answer: "VOLEYBOL", category: "Karma", clue: "Altışar kişilik takımların file üzerinden elle oynadığı spor.", length: 8, difficulty: "hard" },
  { answer: "HENTBOL", category: "Karma", clue: "Yedişer kişilik takımlarla elle oynanan takım oyunu.", length: 7, difficulty: "hard" },
  { answer: "ŞİİR", category: "Karma", clue: "Duygu ve düşünceleri ahenkli dizelerle ifade etme sanatı.", length: 4, difficulty: "easy" },
  { answer: "ROMAN", category: "Karma", clue: "İnsanların yaşamlarını ayrıntılı anlatan uzun edebi tür.", length: 5, difficulty: "medium" },
  { answer: "MASAL", category: "Karma", clue: "Olağanüstü olayları ve kahramanları anlatan eğitici halk öyküsü.", length: 5, difficulty: "medium" },
  { answer: "BESTE", category: "Karma", clue: "Bir müzik eserini oluşturan ezgiler bütünü.", length: 5, difficulty: "medium" },
  { answer: "EZGİ", category: "Karma", clue: "Kulağa hoş gelen melodik ses dizisi, nağme.", length: 4, difficulty: "easy" },
  { answer: "MELODİ", category: "Karma", clue: "Belli bir duygu uyandıran ardışık notalar bütünü.", length: 6, difficulty: "medium" },
  { answer: "TABLO", category: "Karma", clue: "Ressamın tuval üzerine yağlı boyayla yaptığı eser.", length: 5, difficulty: "medium" },
  { answer: "RESİM", category: "Karma", clue: "Çizgiler ve renklerle yapılan görsel sanat.", length: 5, difficulty: "easy" },
  { answer: "PİYANO", category: "Karma", clue: "Tuşlarına basıldığında çekiçlerin tellere vurduğu büyük çalgı.", length: 6, difficulty: "hard" },
  { answer: "KEMAN", category: "Karma", clue: "Dört telli ve yayla çalınan tiz sesli çalgı.", length: 5, difficulty: "medium" },
  { answer: "DAVUL", category: "Karma", clue: "Kasnak üzerine gerilmiş deriye tokmakla vurularak çalınan çalgı.", length: 5, difficulty: "medium" },
  { answer: "FLÜT", category: "Karma", clue: "Yan tutularak üflenen berrak sesli nefesli çalgı.", length: 4, difficulty: "easy" },
  { answer: "ŞAİR", category: "Karma", clue: "Duygu ve imgelerini şiir diliyle yazan sanatçı.", length: 4, difficulty: "easy" },
  { answer: "YAZAR", category: "Karma", clue: "Kitap ve edebi metinler kaleme alan fikir insanı.", length: 5, difficulty: "medium" },
  { answer: "RESSAM", category: "Karma", clue: "Renkleri ve çizgileri tuvale aktaran sanatçı.", length: 6, difficulty: "medium" },
  { answer: "ATOM", category: "Karma", clue: "Maddenin kimyasal özelliklerini taşıyan en küçük temel birimi.", length: 4, difficulty: "easy" },
  { answer: "ENERJİ", category: "Karma", clue: "İş yapabilme yeteneği veya maddede depolanmış hareket gücü.", length: 6, difficulty: "medium" },
  { answer: "KUVVET", category: "Karma", clue: "Cisimlerin hareketini değiştiren fiziksel etki.", length: 6, difficulty: "medium" },
  { answer: "IŞIK", category: "Karma", clue: "Cisimleri görmemizi sağlayan ışıma formu.", length: 4, difficulty: "easy" },
  { answer: "DENEY", category: "Karma", clue: "Bir varsayımı doğrulamak için yapılan kontrollü gözlem.", length: 5, difficulty: "medium" },
  { answer: "TEORİ", category: "Karma", clue: "Gözlemlenen olayları açıklayan kuramsal bilimsel ilkeler.", length: 5, difficulty: "medium" },
  { answer: "KANIT", category: "Karma", clue: "Bir iddia veya gerçeğin doğruluğunu gösteren delil.", length: 5, difficulty: "medium" },
  { answer: "MIKNATIS", category: "Karma", clue: "Demir ve nikel gibi metalleri çeken manyetik cisim.", length: 8, difficulty: "hard" },
  { answer: "MERCEK", category: "Karma", clue: "Işığı kırarak cisimleri büyütüp küçülten optik cam.", length: 6, difficulty: "medium" },
  { answer: "PRİZMA", category: "Karma", clue: "Işığı renklere ayıran geometrik saydam cam kütle.", length: 6, difficulty: "medium" },
  { answer: "RADAR", category: "Karma", clue: "Radyo dalgalarıyla uzak nesneleri tespit eden cihaz.", length: 5, difficulty: "medium" },
  { answer: "MOTOR", category: "Karma", clue: "Herhangi bir enerjiyi mekanik harekete dönüştüren makine.", length: 5, difficulty: "medium" },
  { answer: "DEVRE", category: "Karma", clue: "Elektrik akımının içinden aktığı kapalı iletken yol.", length: 5, difficulty: "medium" },
  { answer: "UÇAK", category: "Karma", clue: "Kanatları sayesinde havada süzülen hızlı ulaşım taşıtı.", length: 4, difficulty: "easy" },
  { answer: "TREN", category: "Karma", clue: "Raylar üzerinde lokomotif tarafından çekilen vagonlar.", length: 4, difficulty: "easy" },
  { answer: "VAPUR", category: "Karma", clue: "Buhar veya motor gücüyle çalışan deniz yolcu gemisi.", length: 5, difficulty: "medium" },
  { answer: "GEMİ", category: "Karma", clue: "Denizlerde yolcu ve yük taşıyan büyük araç.", length: 4, difficulty: "easy" },
  { answer: "TEKNE", category: "Karma", clue: "Deniz ve göllerde kullanılan küçük boyutlu su taşıtı.", length: 5, difficulty: "easy" },
  { answer: "BİSİKLET", category: "Karma", clue: "İki tekerlekli, pedalları ayakla çevrilen taşıt.", length: 8, difficulty: "hard" },
  { answer: "VAGON", category: "Karma", clue: "Tren lokomotifinin arkasına bağlanan taşıma bölmesi.", length: 5, difficulty: "medium" },
  { answer: "KAMYON", category: "Karma", clue: "Ağır yük taşımak için üretilmiş büyük motorlu araç.", length: 6, difficulty: "medium" },
  { answer: "TRAKTÖR", category: "Karma", clue: "Tarımsal işlerde kullanılan çok güçlü çekici araç.", length: 7, difficulty: "hard" },
  { answer: "DOKTOR", category: "Karma", clue: "Hastalıkları teşhis ve tedavi eden tıp uzmanı.", length: 6, difficulty: "medium" },
  { answer: "HEMŞİRE", category: "Karma", clue: "Hastalara bakım veren uzman sağlık personeli.", length: 7, difficulty: "hard" },
  { answer: "AVUKAT", category: "Karma", clue: "Mahkemelerde hak savunan hukuk uzmanı.", length: 6, difficulty: "medium" },
  { answer: "MİMAR", category: "Karma", clue: "Binaların tasarımını estetik ve teknikle çizen uzman.", length: 5, difficulty: "medium" },
  { answer: "AŞÇI", category: "Karma", clue: "Yemekleri lezzetle pişirmeyi meslek edinen usta.", length: 4, difficulty: "easy" },
  { answer: "TERZİ", category: "Karma", clue: "Kumaşları biçip dikerek elbise haline getiren zanaatkar.", length: 5, difficulty: "easy" },
  { answer: "ÇİFTÇİ", category: "Karma", clue: "Toprağı ekip biçerek tarımsal ürün yetiştiren kişi.", length: 6, difficulty: "medium" },
  { answer: "PİLOT", category: "Karma", clue: "Hava araçlarını sevk ve idare eden uçuş kaptanı.", length: 5, difficulty: "medium" },
  { answer: "BALIKÇI", category: "Karma", clue: "Denizlerden ağ veya oltayla balık avlayan kişi.", length: 7, difficulty: "hard" },
  { answer: "MARANGOZ", category: "Karma", clue: "Ağaç ve keresteyi işleyerek mobilya üreten usta.", length: 8, difficulty: "hard" },
  { answer: "TAMİRCİ", category: "Karma", clue: "Bozulan alet ve makineleri onaran usta.", length: 7, difficulty: "hard" },
  { answer: "AHŞAP", category: "Karma", clue: "Ağaçtan yapılmış dayanıklı mobilya ve yapı malzemesi.", length: 5, difficulty: "medium" },
  { answer: "KUMAŞ", category: "Karma", clue: "İpliklerin dokunmasıyla elde edilen giysi malzemesi.", length: 5, difficulty: "medium" },
  { answer: "DERİ", category: "Karma", clue: "Canlıların bedenini örten ve işlenerek giyilen tabaka.", length: 4, difficulty: "easy" },
  { answer: "İPEK", category: "Karma", clue: "İpek böceğinin kozasından elde edilen parlak dokuma.", length: 4, difficulty: "easy" },
  { answer: "PAMUK", category: "Karma", clue: "Kozasından yumuşak beyaz lifler toplanan tarım bitkisi.", length: 5, difficulty: "medium" },
  { answer: "BAKIR", category: "Karma", clue: "Kızıl renkli ve elektriği çok iyi ileten yumuşak metal.", length: 5, difficulty: "medium" },
  { answer: "DEMİR", category: "Karma", clue: "Çelik yapımında kullanılan sert ve dayanıklı metal.", length: 5, difficulty: "medium" },
  { answer: "ALTIN", category: "Karma", clue: "Sararan parlak rengi ve paslanmazlığıyla ünlü değerli maden.", length: 5, difficulty: "easy" },
  { answer: "GÜMÜŞ", category: "Karma", clue: "Beyaz parlak rengiyle takı yapımında kullanılan değerli maden.", length: 5, difficulty: "medium" },
  { answer: "ELMAS", category: "Karma", clue: "Bilinen en sert doğal mineral ve kıymetli mücevher.", length: 5, difficulty: "medium" },
  { answer: "ZÜMRÜT", category: "Karma", clue: "Yeşil renkli, şeffaf ve değerli süs taşı cevheri.", length: 6, difficulty: "medium" },
  { answer: "YAKUT", category: "Karma", clue: "Kırmızı renkli ve çok değerli parlak mücevher taşı.", length: 5, difficulty: "medium" },
  { answer: "KUVARS", category: "Karma", clue: "Saatlerde ve elektronikte kullanılan sert kristal mineral.", length: 6, difficulty: "medium" },
  { answer: "MERMER", category: "Karma", clue: "Mimaride ve heykelde kullanılan damarlı parlak taş.", length: 6, difficulty: "medium" },
  { answer: "KİREÇ", category: "Karma", clue: "Kalker taşının fırınlanmasıyla elde edilen beyaz bağlayıcı.", length: 5, difficulty: "medium" },
  { answer: "KÖMÜR", category: "Karma", clue: "Yer altında fosilleşmiş bitkilerden oluşan siyah yakıt.", length: 5, difficulty: "medium" },
  { answer: "PETROL", category: "Karma", clue: "Yer altından çıkarılan ham sıvı yakıt, enerji kaynağı.", length: 6, difficulty: "medium" },
  { answer: "GAZETE", category: "Karma", clue: "Günlük haberleri ve yazıları basan kağıt yayın.", length: 6, difficulty: "medium" },
  { answer: "DERGİ", category: "Karma", clue: "Belirli aralıklarla çıkan resimli süreli yayın.", length: 5, difficulty: "medium" },
  { answer: "POSTA", category: "Karma", clue: "Mektup ve evrakları alıcısına ulaştıran dağıtım servisi.", length: 5, difficulty: "medium" },
  { answer: "PAKET", category: "Karma", clue: "Eşyaların taşınması için ambalajlanmış korunaklı hali.", length: 5, difficulty: "medium" },
  { answer: "KUTU", category: "Karma", clue: "İçine eşya koyulan mukavva veya ahşap küçük muhafaza.", length: 4, difficulty: "easy" },
  { answer: "TORBA", category: "Karma", clue: "Ağzı büzülebilen kumaş veya plastikten taşıma kabı.", length: 5, difficulty: "easy" },
  { answer: "HALKA", category: "Karma", clue: "Daire biçiminde kıvrılmış metal veya plastik çember.", length: 5, difficulty: "easy" },
  { answer: "ZİNCİR", category: "Karma", clue: "Birbirine geçmiş madeni halkalardan oluşan sağlam bağ.", length: 6, difficulty: "medium" },
  { answer: "KİLİT", category: "Karma", clue: "Anahtarla açılıp kapanan emniyet mekanizması.", length: 5, difficulty: "medium" },
  { answer: "ANAHTAR", category: "Karma", clue: "Kilidi açıp kapamaya yarayan özel profilli madeni araç.", length: 7, difficulty: "medium" },
  { answer: "DÜĞME", category: "Karma", clue: "Giysilerin iki yakasını ilikleyerek birleştiren gereç.", length: 5, difficulty: "medium" },
  { answer: "FERMUAR", category: "Karma", clue: "İki kumaş kenarını birbirine kenetleyen dişli kapama.", length: 7, difficulty: "hard" },
  { answer: "KEMER", category: "Karma", clue: "Pantolonun belden düşmesini önleyen tokalı şerit.", length: 5, difficulty: "easy" },
  { answer: "ŞAPKA", category: "Karma", clue: "Başı güneşten ve soğuktan korumak için giyilen başlık.", length: 5, difficulty: "medium" },
  { answer: "ELDİVEN", category: "Karma", clue: "Elleri soğuktan korumak için giyilen parmaklı örtü.", length: 7, difficulty: "hard" },
  { answer: "ÇORAP", category: "Karma", clue: "Ayakları ayakkabının içinde koruyan pamuklu giysi.", length: 5, difficulty: "medium" },
  { answer: "KAZAK", category: "Karma", clue: "Yünden örülen ve sıcak tutan üst kış giysisi.", length: 5, difficulty: "medium" },
  { answer: "PALTO", category: "Karma", clue: "Kış aylarında soğuktan korunmak için giyilen kalın üstlük.", length: 5, difficulty: "medium" },
  { answer: "YELEK", category: "Karma", clue: "Kolları olmayan, gömlek üstüne giyilen pratik giysi.", length: 5, difficulty: "medium" },
  { answer: "GÖMLEK", category: "Karma", clue: "Üst bedene giyilen, yakalı ve düğmeli kumaş giysi.", length: 6, difficulty: "medium" },
  { answer: "PANTOLON", category: "Karma", clue: "Belden başlayıp iki bacağı ayrı ayrı saran alt giysi.", length: 8, difficulty: "hard" },
  { answer: "AKINTI", category: "Karma", clue: "Deniz ve nehirlerde suyun belirli yöne doğru hareketi.", length: 6, difficulty: "medium" },
  { answer: "ALACAK", category: "Karma", clue: "Bir borç ilişkisinde ödenmesi gereken para veya hak.", length: 6, difficulty: "medium" },
  { answer: "BAĞLAM", category: "Karma", clue: "Bir konunun veya sözün anlam kazandığı ortam ve ilişki.", length: 6, difficulty: "medium" },
  { answer: "BASKIN", category: "Karma", clue: "Beklenmedik bir anda yapılan ani hücum veya teftiş.", length: 6, difficulty: "medium" },
  { answer: "BELLEK", category: "Karma", clue: "Öğrenilen şeyleri saklama ve anımsama gücü, hafıza.", length: 6, difficulty: "medium" },
  { answer: "BÖLÜM", category: "Karma", clue: "Bir bütünü oluşturan parçalardan her biri, kısım.", length: 5, difficulty: "easy" },
  { answer: "CÜZDAN", category: "Karma", clue: "Para ve kartları taşımaya yarayan küçük cep kabı.", length: 6, difficulty: "easy" },
  { answer: "ÇELİK", category: "Karma", clue: "Demir ve karbon alaşımından yapılan çok sert metal.", length: 5, difficulty: "medium" },
  { answer: "ÇEKİÇ", category: "Karma", clue: "Çivi çakmaya veya madenleri dövmeye yarayan saplı alet.", length: 5, difficulty: "easy" },
  { answer: "DEFTER", category: "Karma", clue: "Yazı yazmak için birbirine bağlanmış boş sayfalar.", length: 6, difficulty: "easy" },
  { answer: "DEPREM", category: "Karma", clue: "Yerkabuğunun sarsılmasıyla meydana gelen doğal afet.", length: 6, difficulty: "medium" },
  { answer: "DİREK", category: "Karma", clue: "Tavan veya yelkeni taşımak için dikilen sağlam kalın sırık.", length: 5, difficulty: "easy" },
  { answer: "DURUM", category: "Karma", clue: "Bir şeyin içinde bulunduğu koşullar ve şartlar, hal.", length: 5, difficulty: "easy" },
  { answer: "DUYGU", category: "Karma", clue: "İnsanın iç dünyasında hissettiği ruhsal tepki veya his.", length: 5, difficulty: "easy" },
  { answer: "DÜZEN", category: "Karma", clue: "Uyumlu, planlı ve tertipli olma hali, intizam.", length: 5, difficulty: "easy" },
  { answer: "DÜZEY", category: "Karma", clue: "Bir şeyin ulaştığı nitelik veya nicelik basamağı, seviye.", length: 5, difficulty: "easy" },
  { answer: "EMANET", category: "Karma", clue: "Güvenilerek birine korunması için bırakılan eşya.", length: 6, difficulty: "medium" },
  { answer: "FATURA", category: "Karma", clue: "Satılan mal veya hizmetin bedelini gösteren resmi belge.", length: 6, difficulty: "medium" },
  { answer: "FİDAN", category: "Karma", clue: "Yeni dikilmiş taze ve körpe ağaç fidesi.", length: 5, difficulty: "easy" },
  { answer: "FİNCAN", category: "Karma", clue: "Kahve veya çay içilen kulplu küçük porselen kap.", length: 6, difficulty: "easy" },
  { answer: "GÖLGE", category: "Karma", clue: "Işık almayan yerin arkasında beliren koyu silüet.", length: 5, difficulty: "easy" },
  { answer: "GÖZLÜK", category: "Karma", clue: "Göz kusurlarını düzeltmek veya güneşten korunmak için takılan camlı araç.", length: 6, difficulty: "medium" },
  { answer: "GÖVDE", category: "Karma", clue: "Ağaç veya canlının kollar ve baş dışındaki ana kısmı.", length: 5, difficulty: "easy" },
  { answer: "GÜREŞÇİ", category: "Karma", clue: "Güreş sporunu profesyonel veya amatörce yapan sporcu.", length: 7, difficulty: "medium" },
  { answer: "HABER", category: "Karma", clue: "Bir olay veya durum hakkında iletilen taze bilgi.", length: 5, difficulty: "easy" },
  { answer: "HARİTA", category: "Karma", clue: "Yeryüzünün ölçekli olarak düzleme çizilmiş şekli.", length: 6, difficulty: "easy" },
  { answer: "HAVUÇ", category: "Karma", clue: "Koni biçiminde, turuncu ve A vitamini zengini tatlı kök sebze.", length: 5, difficulty: "easy" },
  { answer: "HAYAT", category: "Karma", clue: "Doğumdan ölüme kadar geçen canlılık süreci, ömür.", length: 5, difficulty: "easy" },
  { answer: "HEDİYE", category: "Karma", clue: "Sevgiyi göstermek için birine karşılıksız verilen armağan.", length: 6, difficulty: "easy" },
  { answer: "HESAP", category: "Karma", clue: "Matematiksel işlem veya bir harcamanın toplam tutarı.", length: 5, difficulty: "easy" },
  { answer: "HİCRAN", category: "Karma", clue: "Ayrılığın veya hasretin verdiği derin iç acısı.", length: 6, difficulty: "hard" },
  { answer: "IHLAMUR", category: "Karma", clue: "Çiçekleri kurutularak sıcak çayı içilen şifalı ağaç.", length: 7, difficulty: "medium" },
  { answer: "ISPANAK", category: "Karma", clue: "Demir ve vitamin zengini, pişirilerek yenen koyu yeşil yapraklı sebze.", length: 7, difficulty: "medium" },
  { answer: "İĞNE", category: "Karma", clue: "Dikiş dikmeye yarayan ince çelik delikli araç.", length: 4, difficulty: "easy" },
  { answer: "İKLİM", category: "Karma", clue: "Bir bölgede uzun yıllar boyunca süregelen ortalama hava koşulları.", length: 5, difficulty: "medium" },
  { answer: "İLHAM", category: "Karma", clue: "Sanatçıya eser üretme coşkusu veren içsel esin kaynağı.", length: 5, difficulty: "medium" },
  { answer: "İNCİR", category: "Karma", clue: "Ballı ve bol çekirdekli lezzetli Ege meyvesi.", length: 5, difficulty: "easy" },
  { answer: "İSİMLİK", category: "Karma", clue: "Masa veya kapı üzerine takılan isim levhası.", length: 7, difficulty: "easy" },
  { answer: "İŞARET", category: "Karma", clue: "Bir şeyi gösteren, belirten veya anlatan simge ve iz.", length: 6, difficulty: "easy" },
  { answer: "KABLO", category: "Karma", clue: "Elektrik veya iletişim sinyallerini ileten korunaklı tel demeti.", length: 5, difficulty: "easy" },
  { answer: "KAFES", category: "Karma", clue: "Kuş veya vahşi hayvanları barındırmak için yapılmış parmaklıklı bölme.", length: 5, difficulty: "easy" },
  { answer: "KAĞIT", category: "Karma", clue: "Ağaç hamurundan yapılan, üzerine yazı yazılan ince tabaka.", length: 5, difficulty: "easy" },
  { answer: "KALKAN", category: "Karma", clue: "Savaşta kılıç ve oklardan korunmak için tutulan koruyucu levha.", length: 6, difficulty: "medium" },
  { answer: "KAMERA", category: "Karma", clue: "Görüntü ve video kaydı yapan optik elektronik cihaz.", length: 6, difficulty: "medium" },
  { answer: "KAMP", category: "Karma", clue: "Doğada çadırlarda kalarak yapılan dinlenme etkinliği.", length: 4, difficulty: "easy" },
  { answer: "KANAT", category: "Karma", clue: "Kuşların ve uçakların havada kalmasını sağlayan organ veya parça.", length: 5, difficulty: "easy" },
  { answer: "KAPAK", category: "Karma", clue: "Bir kabın veya kutunun ağzını örtmeye yarayan parça.", length: 5, difficulty: "easy" },
  { answer: "KARAR", category: "Karma", clue: "Bir konu üzerinde düşünüldükten sonra varılan kesin hüküm.", length: 5, difficulty: "easy" },
  { answer: "KARPUZ", category: "Karma", clue: "Yazın tüketilen, içi kırmızı ve çok sulu büyük bostan meyvesi.", length: 6, difficulty: "easy" },
  { answer: "KAVUN", category: "Karma", clue: "Sarı kabuklu, tatlı kokulu ve sulu bir yaz meyvesi.", length: 5, difficulty: "easy" },
  { answer: "KEMİK", category: "Karma", clue: "İskeleti oluşturan sert ve dayanıklı kalsiyum dokusu.", length: 5, difficulty: "easy" },
  { answer: "KİRAZ", category: "Karma", clue: "Kırmızı renkli, saplı ve tek çekirdekli tatlı yaz meyvesi.", length: 5, difficulty: "easy" },
  { answer: "KÖMÜRLÜK", category: "Karma", clue: "Binalarda yakacak kömürlerin depolandığı kiler bölümü.", length: 8, difficulty: "medium" },
  { answer: "KUMAŞÇI", category: "Karma", clue: "Her türlü dokuma kumaş satan dükkan veya esnaf.", length: 7, difficulty: "medium" },
  { answer: "KULÜP", category: "Karma", clue: "Ortak ilgi ve amaçlara sahip kişilerin oluşturduğu topluluk.", length: 5, difficulty: "easy" },
  { answer: "KUŞAK", category: "Karma", clue: "Bele sarılan uzun ve enli kumaş bağ, nesil.", length: 5, difficulty: "easy" },
  { answer: "KUZEY", category: "Karma", clue: "Güneş doğarken sol tarafta kalan ana yön pusulası.", length: 5, difficulty: "easy" },
  { answer: "KÜMES", category: "Karma", clue: "Tavuk ve kümes hayvanlarının barındığı kapalı yer.", length: 5, difficulty: "easy" },
  { answer: "KÜREK", category: "Karma", clue: "Toprak kazmaya veya kayığı yürütmeye yarayan saplı araç.", length: 5, difficulty: "easy" },
  { answer: "KÜRK", category: "Karma", clue: "Kimi hayvanların işlenmiş kalın ve yumuşak tüylü derisi.", length: 4, difficulty: "medium" },
  { answer: "LİMANLIK", category: "Karma", clue: "Dalgasız ve sakin deniz veya sığınak yeri.", length: 8, difficulty: "medium" },
  { answer: "LOKUM", category: "Karma", clue: "Şeker, nişasta ve gülsuyu ile yapılan geleneksel yumuşak tatlı.", length: 5, difficulty: "easy" },
  { answer: "MACERA", category: "Karma", clue: "Baştan geçen ilginç, heyecanlı ve sürprizli serüven.", length: 6, difficulty: "medium" },
  { answer: "MADALYA", category: "Karma", clue: "Yarışmalarda dereceye girenlere takılan madeni ödül.", length: 7, difficulty: "medium" },
  { answer: "MAKET", category: "Karma", clue: "Bir yapının veya nesnenin ölçekli küçük kopyası.", length: 5, difficulty: "medium" },
  { answer: "MAKARNA", category: "Karma", clue: "İrmik unundan çeşitli şekillerde yapılan haşlamalık hamur ürünü.", length: 7, difficulty: "easy" },
  { answer: "MAKAS", category: "Karma", clue: "İki bıçağın bir eksen etrafında dönmesiyle kesen alet.", length: 5, difficulty: "easy" },
  { answer: "MANAV", category: "Karma", clue: "Taze meyve ve sebze satan dükkan veya esnaf.", length: 5, difficulty: "easy" },
  { answer: "MANDAL", category: "Karma", clue: "Çamaşırları ipe tutturmaya yarayan yaylı kıskaç.", length: 6, difficulty: "easy" },
  { answer: "MARUL", category: "Karma", clue: "Salatalarda çiğ olarak tüketilen gevrek yapraklı yeşil sebze.", length: 5, difficulty: "easy" },
  { answer: "MAVİ", category: "Karma", clue: "Açık gökyüzünün ve berrak denizin ana rengi.", length: 4, difficulty: "easy" },
  { answer: "MAYDANOZ", category: "Karma", clue: "Yemeklere ve salatalara koku veren yeşil yapraklı şifalı bitki.", length: 8, difficulty: "medium" },
  { answer: "MAYMUN", category: "Karma", clue: "Ağaçlarda yaşayan, taklit yeteneği gelişmiş zeki memeli.", length: 6, difficulty: "easy" },
  { answer: "MELTEM", category: "Karma", clue: "Yaz aylarında karadan denize veya denizden karaya esen serin rüzgar.", length: 6, difficulty: "medium" },
  { answer: "MENDİL", category: "Karma", clue: "Burun silmek veya el kurulamak için taşınan küçük bez parçası.", length: 6, difficulty: "easy" },
  { answer: "MENEMEN", category: "Karma", clue: "Domates, biber ve yumurtayla tavada pişirilen kahvaltılık lezzet.", length: 7, difficulty: "medium" },
  { answer: "MERAK", category: "Karma", clue: "Bir şeyi öğrenmek, anlamak veya görmek için duyulan güçlü istek.", length: 5, difficulty: "easy" },
  { answer: "MERDİVEN", category: "Karma", clue: "Basamakları sayesinde yüksek yerlere çıkmayı sağlayan araç veya yapı.", length: 8, difficulty: "medium" },
  { answer: "MESAJ", category: "Karma", clue: "İletişim araçlarıyla birine gönderilen kısa yazılı haber.", length: 5, difficulty: "easy" },
  { answer: "MİNDER", category: "Karma", clue: "Üzerine oturulan veya spor yapılan içi yumuşak dolgulu yaygı.", length: 6, difficulty: "easy" },
  { answer: "MUCİZE", category: "Karma", clue: "İnsan aklının açıklamakta güçlük çektiği olağanüstü olay.", length: 6, difficulty: "medium" },
  { answer: "MUSLUK", category: "Karma", clue: "Borulardaki suyun akışını açıp kapamaya yarayan vana aparatı.", length: 6, difficulty: "easy" },
  { answer: "MÜHÜR", category: "Karma", clue: "Bir belgenin altına basılan resmi damga veya mühür aleti.", length: 5, difficulty: "medium" },
  { answer: "MÜREKKEP", category: "Karma", clue: "Yazı yazmak ve basım işlerinde kullanılan renkli sıvı madde.", length: 8, difficulty: "medium" },
  { answer: "NANE", category: "Karma", clue: "Ferahlatıcı kokusu ve aromasıyla bilinen yeşil yapraklı baharat.", length: 4, difficulty: "easy" },
  { answer: "NAZAR", category: "Karma", clue: "Kimi insanların kıskançlıkla bakmasıyla oluşan olumsuz etki inancı.", length: 5, difficulty: "easy" },
  { answer: "NEFES", category: "Karma", clue: "Akciğerlere çekilen ve dışarı verilen yaşamsal hava akımı.", length: 5, difficulty: "easy" },
  { answer: "NİMET", category: "Karma", clue: "Yaşamı sürdürmek için verilen her türlü iyilik ve rızık.", length: 5, difficulty: "easy" },
  { answer: "NOKTA", category: "Karma", clue: "Cümle sonuna konulan veya geometride boyutsuz yeri belirten işaret.", length: 5, difficulty: "easy" },
  { answer: "NOTA", category: "Karma", clue: "Müzik seslerini ve sürelerini göstermeye yarayan özel işaretler.", length: 4, difficulty: "easy" },
  { answer: "NUMARA", category: "Karma", clue: "Sıralama veya sayma işlemlerinde kullanılan rakamsal değer.", length: 6, difficulty: "easy" },
  { answer: "OCAK", category: "Karma", clue: "Yemek pişirmek için ateş yakılan veya gaz yakan mutfak aleti.", length: 4, difficulty: "easy" },
  { answer: "ODUN", category: "Karma", clue: "Ağaç gövdesinden kesilen ve yakacak olarak kullanılan sert parça.", length: 4, difficulty: "easy" },
  { answer: "OKUL", category: "Karma", clue: "Öğrencilerin eğitim ve öğretim gördüğü resmi kurum.", length: 4, difficulty: "easy" },
  { answer: "OKYANUS", category: "Karma", clue: "Kıtaları birbirinden ayıran devasa büyüklükteki su kütlesi.", length: 7, difficulty: "medium" },
  { answer: "ÖDÜL", category: "Karma", clue: "Bir başarı veya üstünlük karşılığında verilen mükafat.", length: 4, difficulty: "easy" },
  { answer: "ÖĞÜT", category: "Karma", clue: "Doğru yolu göstermek amacıyla verilen yapıcı tavsiye, nasihat.", length: 4, difficulty: "easy" },
  { answer: "ÖLÇÜ", category: "Karma", clue: "Bir şeyin boyutunu, ağırlığını veya miktarını belirleme birimi.", length: 4, difficulty: "easy" },
  { answer: "ÖMÜR", category: "Karma", clue: "Doğumdan ölüme kadar geçen yaşama süresi, hayat.", length: 4, difficulty: "easy" },
  { answer: "ÖZGÜR", category: "Karma", clue: "Herhangi bir kısıtlama veya esarete bağlı olmayan, hür.", length: 5, difficulty: "easy" },
  { answer: "PALMİYE", category: "Karma", clue: "Sıcak iklimlerde yetişen, tepesinde yelpaze yaprakları olan ağaç.", length: 7, difficulty: "medium" },
  { answer: "PANORAMA", category: "Karma", clue: "Yüksek bir yerden bakıldığında görülen geniş manzara açısı.", length: 8, difficulty: "hard" },
  { answer: "PARKE", category: "Karma", clue: "Yer döşemesinde kullanılan cilalı ahşap veya taş kaplama.", length: 5, difficulty: "medium" },
  { answer: "PATATES", category: "Karma", clue: "Toprak altında yumru oluşturan ve çok tüketilen temel sebze.", length: 7, difficulty: "medium" },
  { answer: "PATİKA", category: "Karma", clue: "Dağlarda ve ormanlarda insanların yürümesiyle açılan dar keçi yolu.", length: 6, difficulty: "medium" },
  { answer: "PELİKAN", category: "Karma", clue: "Gagasının altında büyük bir balık kesesi bulunan beyaz su kuşu.", length: 7, difficulty: "medium" },
  { answer: "PETEK", category: "Karma", clue: "Arıların bal doldurmak için balmumundan ördüğü altıgen gözenekler.", length: 5, difficulty: "medium" },
  { answer: "PİSTON", category: "Karma", clue: "Silindir içinde ileri geri hareket ederek güç üreten mekanik parça.", length: 6, difficulty: "medium" },
  { answer: "PLAJ", category: "Karma", clue: "Deniz veya göl kenarında güneşlenilen ve denize girilen kumlu alan.", length: 4, difficulty: "easy" },
  { answer: "POLİS", category: "Karma", clue: "Kamu düzenini ve vatandaşın can güvenliğini sağlayan emniyet görevlisi.", length: 5, difficulty: "medium" },
  { answer: "PORSİYON", category: "Karma", clue: "Bir öğünde bir kişiye servis edilen yemek miktarı.", length: 8, difficulty: "medium" },
  { answer: "RAHMAN", category: "Karma", clue: "Yarattığı tüm varlıklara karşılıksız merhamet ve lütuf gösteren.", length: 6, difficulty: "hard" },
  { answer: "RENK", category: "Karma", clue: "Işığın cisimlere çarptıktan sonra gözde bıraktığı görsel etki.", length: 4, difficulty: "easy" },
  { answer: "ROBOT", category: "Karma", clue: "Önceden programlanarak otomatik işleri yapan mekanik aygıt.", length: 5, difficulty: "medium" },
  { answer: "SAHAF", category: "Karma", clue: "Eski, nadir ve ikinci el kitapların alınıp satıldığı kitapçı.", length: 5, difficulty: "medium" },
  { answer: "SALON", category: "Karma", clue: "Evlerde konukların ağırlandığı en geniş ve ferah oturma odası.", length: 5, difficulty: "easy" },
  { answer: "SAMAN", category: "Karma", clue: "Tahıl saplarının harman sonrasında ufalanmış kuru hali.", length: 5, difficulty: "easy" },
  { answer: "SANAT", category: "Karma", clue: "Güzellik ve duygunun yaratıcı biçimde dışa vurulması uğraşı.", length: 5, difficulty: "easy" },
  { answer: "SARGI", category: "Karma", clue: "Yarayı sarmak ve mikroptan korumak için kullanılan steril tülbent bez.", length: 5, difficulty: "easy" },
  { answer: "SARMAŞIK", category: "Karma", clue: "Duvarlara ve ağaçlara sarılarak tırmanan yeşil yapraklı sarılıcı bitki.", length: 8, difficulty: "medium" },
  { answer: "SAVAŞ", category: "Karma", clue: "Devletler veya toplumlar arasında silahla yapılan kanlı çatışma.", length: 5, difficulty: "easy" },
  { answer: "SEPET", category: "Karma", clue: "Saz, kamış veya plastikten örülen kulplu taşıma kabı.", length: 5, difficulty: "easy" },
  { answer: "SERGİ", category: "Karma", clue: "Sanat eserlerinin veya ürünlerin halka gösterildiği etkinlik.", length: 5, difficulty: "easy" },
  { answer: "SEYYAH", category: "Karma", clue: "Dünyayı gezerek yeni kültürler ve yerler keşfeden gezgin.", length: 6, difficulty: "medium" },
  { answer: "SICAK", category: "Karma", clue: "Isısı yüksek olan, soğuk karşıtı olan hava veya nesne durumu.", length: 5, difficulty: "easy" },
  { answer: "SİHİR", category: "Karma", clue: "Göz bağcılığı veya doğaüstü yöntemlerle yapılan büyü ve gösteri.", length: 5, difficulty: "easy" },
  { answer: "SİLAH", category: "Karma", clue: "Savunma veya saldırı amacıyla kullanılan her türlü aygıt.", length: 5, difficulty: "easy" },
  { answer: "SİNEMA", category: "Karma", clue: "Filmlerin beyaz perdeye yansıtılarak topluca izlendiği salon sanatı.", length: 6, difficulty: "medium" },
  { answer: "SİNYAL", category: "Karma", clue: "Bir durumu veya komutu bildirmek için verilen sesli veya ışıklı işaret.", length: 6, difficulty: "medium" },
  { answer: "SİPER", category: "Karma", clue: "Askerlerin korunmak için kazdığı çukur veya arkasına saklandığı engel.", length: 5, difficulty: "easy" },
  { answer: "SİSTEM", category: "Karma", clue: "Düzenli bir şekilde birbirine bağlı parçaların oluşturduğu bütün.", length: 6, difficulty: "medium" },
  { answer: "SOĞAN", category: "Karma", clue: "Yemeklere lezzet katan kat kat acımsı ve şifalı yumru sebze.", length: 5, difficulty: "easy" },
  { answer: "SOMUN", category: "Karma", clue: "Cıvatanın ucuna takılarak sıkıştırılan dişli madeni parça veya ekmek türü.", length: 5, difficulty: "medium" },
  { answer: "SONBAHAR", category: "Karma", clue: "Yaprakların döküldüğü ve havaların serinlediği güz mevsimi.", length: 8, difficulty: "medium" },
  { answer: "SORU", category: "Karma", clue: "Bir şeyi öğrenmek veya cevap almak için yöneltilen söz.", length: 4, difficulty: "easy" },
  { answer: "SÖZLÜK", category: "Karma", clue: "Kelimelerin anlamlarını alfabetik sırayla açıklayan başvuru kitabı.", length: 6, difficulty: "medium" },
  { answer: "SPORCU", category: "Karma", clue: "Belli bir spor dalında düzenli antrenman yapan ve yarışan kimse.", length: 6, difficulty: "medium" },
  { answer: "SULTAN", category: "Karma", clue: "Eski Doğu hükümdarlarına veya padişahlara verilen unvan.", length: 6, difficulty: "medium" },
  { answer: "SÜNGÜ", category: "Karma", clue: "Tüfeğin namlusuna takılan keskin ve sivri savaş bıçağı.", length: 5, difficulty: "medium" },
  { answer: "SÜREÇ", category: "Karma", clue: "Belli bir sıra ve düzen içinde gelişen olaylar dizisi.", length: 5, difficulty: "medium" },
  { answer: "SÜVARİ", category: "Karma", clue: "At sırtında savaşan veya görev yapan eğitimli atlı asker.", length: 6, difficulty: "medium" },
  { answer: "ŞAFAK", category: "Karma", clue: "Güneş doğmadan önce ufukta beliren ilk aydınlık vakti.", length: 5, difficulty: "medium" },
  { answer: "ŞALTER", category: "Karma", clue: "Elektrik devresini tek hareketle açıp kapamaya yarayan anahtar.", length: 6, difficulty: "medium" },
  { answer: "ŞAMPUAN", category: "Karma", clue: "Saçları temizlemek ve parlatmak için kullanılan köpüklü sıvı.", length: 7, difficulty: "medium" },
  { answer: "ŞARKI", category: "Karma", clue: "Belli bir makam ve ezgiyle seslendirilen müzikli eser.", length: 5, difficulty: "easy" },
  { answer: "ŞART", category: "Karma", clue: "Bir durumun gerçekleşmesi için önceden yerine getirilmesi gereken koşul.", length: 4, difficulty: "easy" },
  { answer: "ŞERİT", category: "Karma", clue: "Yol veya kumaş boyunca uzanan ince uzun çizgi hat.", length: 5, difficulty: "easy" },
  { answer: "ŞÖMİNE", category: "Karma", clue: "Odalarda duvar içine yapılan ve odun yakılan bacalı ocak.", length: 6, difficulty: "medium" },
  { answer: "TABAN", category: "Karma", clue: "Bir şeyin en alt yüzeyi veya ayakların yere basan alt kısmı.", length: 5, difficulty: "easy" },
  { answer: "TAHTA", category: "Karma", clue: "Ağaç kütüğünden biçilen yassı ve düzgün kereste parçası.", length: 5, difficulty: "easy" },
  { answer: "TAKVİM", category: "Karma", clue: "Yılın günlerini, aylarını ve bayramlarını gösteren çizelge.", length: 6, difficulty: "medium" },
  { answer: "TALEP", category: "Karma", clue: "Bir şeye duyulan istek, ihtiyaç veya satın alma arzusu.", length: 5, difficulty: "easy" },
  { answer: "TAMİR", category: "Karma", clue: "Bozuk veya kırık bir eşyayı onararak yeniden çalışır kılma.", length: 5, difficulty: "easy" },
  { answer: "TANIK", category: "Karma", clue: "Bir olayı gözleriyle gören ve doğruluğuna şahitlik eden kişi.", length: 5, difficulty: "easy" },
  { answer: "TARAK", category: "Karma", clue: "Saçları tarayıp düzeltmeye yarayan dişli küçük araç.", length: 5, difficulty: "easy" },
  { answer: "TARİF", category: "Karma", clue: "Bir yemeğin yapılışını veya bir adresin yerini anlatan kılavuz.", length: 5, difficulty: "easy" },
  { answer: "TARİH", category: "Karma", clue: "Geçmişte yaşanan olayları zaman ve yer belirterek inceleyen bilim.", length: 5, difficulty: "easy" },
  { answer: "TARLA", category: "Karma", clue: "Tarımsal ürünler yetiştirmek için sürülen geniş toprak alanı.", length: 5, difficulty: "easy" },
  { answer: "TAŞIT", category: "Karma", clue: "İnsan ve yük taşımaya yarayan motorlu veya motorsuz araç.", length: 5, difficulty: "easy" },
  { answer: "TAVAN", category: "Karma", clue: "Bir odanın üstünü kapatan yatay düz iç yüzey.", length: 5, difficulty: "easy" },
  { answer: "TEBEŞİR", category: "Karma", clue: "Yazı tahtasına yazı yazmak için kullanılan kireçli çubuk.", length: 7, difficulty: "medium" },
  { answer: "TEKNİK", category: "Karma", clue: "Bir sanatı veya mesleği icra ederken uygulanan özel yöntemler bütünü.", length: 6, difficulty: "medium" },
  { answer: "TEMEL", category: "Karma", clue: "Bir yapının üzerine oturduğu yer altındaki en sağlam taban.", length: 5, difficulty: "easy" },
  { answer: "TEMİZ", category: "Karma", clue: "Üzerinde kir, leke veya toz bulunmayan, hijyenik ve pak.", length: 5, difficulty: "easy" },
  { answer: "TEPE", category: "Karma", clue: "Çevresine göre yüksekte kalan küçük dağ yükseltisi.", length: 4, difficulty: "easy" },
  { answer: "TEPKİ", category: "Karma", clue: "Dışarıdan gelen bir etkiye karşı verilen ani karşılık veya yanıt.", length: 5, difficulty: "medium" },
  { answer: "TERCÜME", category: "Karma", clue: "Bir dildeki metni başka bir dile çevirme sanatı.", length: 7, difficulty: "medium" },
  { answer: "TESTİ", category: "Karma", clue: "Topraktan yapılan ve suyu soğuk tutan dar boğazlı kulplu su kabı.", length: 5, difficulty: "medium" },
  { answer: "TEYZE", category: "Karma", clue: "Annenin kız kardeşi olan en yakın kadın akraba.", length: 5, difficulty: "easy" },
  { answer: "TİMSAH", category: "Karma", clue: "Sıcak nehir kıyılarında yaşayan iri çeneli yırtıcı sürüngen.", length: 6, difficulty: "medium" },
  { answer: "TOHUM", category: "Karma", clue: "Bitkilerin üremesini sağlayan ve toprağa ekilen küçük tane.", length: 5, difficulty: "easy" },
  { answer: "TOKA", category: "Karma", clue: "Saçları tutturmaya veya kemeri bağlamaya yarayan kıskaçlı araç.", length: 4, difficulty: "easy" },
  { answer: "TORUN", category: "Karma", clue: "Bir kimsenin çocuğunun çocuğu olan soy devamı.", length: 5, difficulty: "easy" },
  { answer: "TRAFİK", category: "Karma", clue: "Yollardaki taşıtların ve yayaların oluşturduğu hareket akışı.", length: 6, difficulty: "medium" },
  { answer: "TUĞLA", category: "Karma", clue: "Fırınlanmış kilden yapılan dayanıklı duvar örme yapı gereci.", length: 5, difficulty: "easy" },
  { answer: "TULUM", category: "Karma", clue: "Göğsü ve bacakları bir arada örten tek parça koruyucu iş giysisi.", length: 5, difficulty: "medium" },
  { answer: "TURNA", category: "Karma", clue: "Sulak alanlarda yaşayan uzun bacaklı ve zarif göçmen kuş.", length: 5, difficulty: "medium" },
  { answer: "TUTKU", category: "Karma", clue: "Bir şeye karşı duyulan çok güçlü ve dizginlenemez istek.", length: 5, difficulty: "medium" },
  { answer: "TUVAL", category: "Karma", clue: "Ressamların üzerine resim yaptığı kasnağa gerilmiş bez yüzey.", length: 5, difficulty: "medium" },
  { answer: "TUZAK", category: "Karma", clue: "Avı yakalamak veya düşmanı yanıltmak için kurulan hileli düzenek.", length: 5, difficulty: "easy" },
  { answer: "TÜFEK", category: "Karma", clue: "İki elle tutularak ateşlenen namlusu uzun ateşli silah.", length: 5, difficulty: "medium" },
  { answer: "TÜRKÜ", category: "Karma", clue: "Halkın acılarını ve sevinçlerini anlatan geleneksel ezgili şiir.", length: 5, difficulty: "easy" },
  { answer: "UÇURTMA", category: "Karma", clue: "Rüzgarlı havada iple gökyüzünde uçurulan çıtalı kağıt oyuncak.", length: 7, difficulty: "medium" },
  { answer: "UFUK", category: "Karma", clue: "Gökyüzü ile yeryüzünün birleşir gibi göründüğü en uzak sınır çizgisi.", length: 4, difficulty: "medium" },
  { answer: "UĞUR", category: "Karma", clue: "İnsana iyilik ve şans getirdiğine inanılan manevi güç.", length: 4, difficulty: "easy" },
  { answer: "ULAŞIM", category: "Karma", clue: "İnsanların ve malların bir yerden başka bir yere taşınması faaliyeti.", length: 6, difficulty: "medium" },
  { answer: "USTA", category: "Karma", clue: "Bir mesleği veya zanaatı eksiksiz ve en üst düzeyde bilen ehil kişi.", length: 4, difficulty: "easy" },
  { answer: "UYDU", category: "Karma", clue: "Bir gezegenin etrafında dönen gök cismi veya uzay aracı.", length: 4, difficulty: "easy" },
  { answer: "UYARI", category: "Karma", clue: "Bir tehlike veya yanlışı önlemek için yapılan ikaz, tembih.", length: 5, difficulty: "easy" },
  { answer: "UYKU", category: "Karma", clue: "Bedenin ve zihnin dinlendiği doğal ve yaşamsal bilinçsizlik hali.", length: 4, difficulty: "easy" },
  { answer: "UZAY", category: "Karma", clue: "Gök cisimlerini çevreleyen sonsuz ve sınırsız boşluk.", length: 4, difficulty: "easy" },
  { answer: "UZMAN", category: "Karma", clue: "Belli bir bilim veya meslek dalında derin bilgi ve deneyimi olan yetkin kişi.", length: 5, difficulty: "medium" },
  { answer: "ÜCRET", category: "Karma", clue: "Bir iş gücü veya hizmet karşılığında ödenen para hakkı.", length: 5, difficulty: "easy" },
  { answer: "ÜÇGEN", category: "Karma", clue: "Üç kenarı ve üç iç açısı bulunan temel geometrik şekil.", length: 5, difficulty: "easy" },
  { answer: "ÜLKE", category: "Karma", clue: "Bir devletin egemenliği altında bulunan toprakların tümü, memleket.", length: 4, difficulty: "easy" },
  { answer: "ÜMİT", category: "Karma", clue: "Kötü durumlardan kurtulup güzel günlere ulaşma beklentisi, umut.", length: 4, difficulty: "easy" },
  { answer: "ÜNİFORMA", category: "Karma", clue: "Aynı kurumda veya okulda çalışanların giydiği tek tip kıyafet.", length: 8, difficulty: "hard" },
  { answer: "ÜRETİM", category: "Karma", clue: "İnsan ihtiyaçlarını karşılamak için mal ve hizmet yaratma süreci.", length: 6, difficulty: "medium" },
  { answer: "ÜRÜN", category: "Karma", clue: "Tarladan veya fabrikadan elde edilen yararlı her türlü çıktı.", length: 4, difficulty: "easy" },
  { answer: "ÜSTAD", category: "Karma", clue: "Kendi alanında büyük başarılara imza atmış usta sanatçı veya düşünür.", length: 5, difficulty: "medium" },
  { answer: "ÜZÜM", category: "Karma", clue: "Salkım biçiminde yetişen, kurutulan veya taze yenen tatlı meyve.", length: 4, difficulty: "easy" },
  { answer: "VAHŞİ", category: "Karma", clue: "Doğada evcilleştirilmemiş, yırtıcı ve serbest yaşayan canlı.", length: 5, difficulty: "medium" },
  { answer: "VAKİT", category: "Karma", clue: "Zamanın belli bir anı veya olayların gerçekleştiği saat dilimi.", length: 5, difficulty: "easy" },
  { answer: "VALİZ", category: "Karma", clue: "Seyahate çıkarken eşyaların koyulduğu kilitli bavul çanta.", length: 5, difficulty: "medium" },
  { answer: "VARİL", category: "Karma", clue: "Petrol veya sıvı maddelerin saklandığı silindir biçimli büyük madeni kap.", length: 5, difficulty: "medium" },
  { answer: "VAZO", category: "Karma", clue: "İçine su konularak taze çiçekler dikilen dekoratif süs kabı.", length: 4, difficulty: "easy" },
  { answer: "VEZİR", category: "Karma", clue: "Osmanlı Devletinde padişahtan sonraki en yetkili devlet adamı.", length: 5, difficulty: "medium" },
  { answer: "VİRAJ", category: "Karma", clue: "Karayollarında doğrusal gidişatı kıran keskin yol kıvrımı.", length: 5, difficulty: "medium" },
  { answer: "VİTRİN", category: "Karma", clue: "Mağazalarda ürünlerin gelip geçenlere sergilendiği camlı bölme.", length: 6, difficulty: "medium" },
  { answer: "YALAN", category: "Karma", clue: "Gerçeğe aykırı olarak söylenen ve insanları aldatan asılsız söz.", length: 5, difficulty: "easy" },
  { answer: "YALIN", category: "Karma", clue: "Süsten, gösterişten ve karmaşıklıktan uzak, sade ve arı durum.", length: 5, difficulty: "easy" },
  { answer: "YAMAÇ", category: "Karma", clue: "Bir dağın veya tepenin eğimli ve sarp yan yüzeyi.", length: 5, difficulty: "easy" },
  { answer: "YANKI", category: "Karma", clue: "Sesin sert bir kayaya veya duvara çarpıp geri dönmesiyle duyulan seda.", length: 5, difficulty: "easy" },
  { answer: "YARDIM", category: "Karma", clue: "Zor durumda kalmış birine sağlanan destek, imdat ve kolaylık.", length: 6, difficulty: "easy" },
  { answer: "YARGI", category: "Karma", clue: "Mahkemelerin yasalar çerçevesinde verdiği kesin hüküm ve karar.", length: 5, difficulty: "medium" },
  { answer: "YAŞAM", category: "Karma", clue: "Doğum ile ölüm arasında solunan hayat süreci, canlılık.", length: 5, difficulty: "easy" },
  { answer: "YATAK", category: "Karma", clue: "Uyumak ve dinlenmek için üzerine uzanılan yumuşak mobilya eşyası.", length: 5, difficulty: "easy" },
  { answer: "YAYIK", category: "Karma", clue: "Süt ve yoğurdun çalkalanarak tereyağı çıkarıldığı ahşap fıçı alet.", length: 5, difficulty: "medium" },
  { answer: "YAZGI", category: "Karma", clue: "Hayatta gerçekleşecek olayların ilahi takdiri, kader ve talih.", length: 5, difficulty: "medium" },
  { answer: "YELKEN", category: "Karma", clue: "Rüzgar gücüyle teknenin ilerlemesini sağlayan geniş kalın bez kumaş.", length: 6, difficulty: "medium" },
  { answer: "YEMİŞ", category: "Karma", clue: "Yenebilen meyve veya kurutulmuş meyve çerezleri.", length: 5, difficulty: "easy" },
  { answer: "YEŞİL", category: "Karma", clue: "Çimenlerin ve yaprakların taze canlı doğal ana rengi.", length: 5, difficulty: "easy" },
  { answer: "YOLCU", category: "Karma", clue: "Herhangi bir taşıtla bir yerden bir yere seyahat eden kişi.", length: 5, difficulty: "easy" },
  { answer: "YONCA", category: "Karma", clue: "Hayvan yemi olarak yetiştirilen ve bazen dört yapraklı bulunan yeşil ot.", length: 5, difficulty: "medium" },
  { answer: "YORUM", category: "Karma", clue: "Bir olayı veya metni kendi anlayışına göre açıklama ve değerlendirme.", length: 5, difficulty: "medium" },
  { answer: "YURT", category: "Karma", clue: "Bir milletin bağımsız ve hür olarak üzerinde yaşadığı vatan toprağı.", length: 4, difficulty: "easy" },
  { answer: "YÜREK", category: "Karma", clue: "Kanı vücuda pompalayan hayati organ veya cesaret duygusu, kalp.", length: 5, difficulty: "easy" },
  { answer: "YÜZÜK", category: "Karma", clue: "Parmağa takılan değerli taşlı veya taşsız yuvarlak takı halkası.", length: 5, difficulty: "easy" },
  { answer: "ZEHİR", category: "Karma", clue: "Canlıların vücuduna girdiğinde ağır hasar veren veya öldüren zararlı madde.", length: 5, difficulty: "medium" },
  { answer: "ZİRVE", category: "Karma", clue: "Bir dağın en tepe noktası veya bir başarıda ulaşılan en üst seviye.", length: 5, difficulty: "easy" },
  { answer: "ZİYAFET", category: "Karma", clue: "Özel günlerde dostlara verilen zengin ve özenli yemek şöleni.", length: 7, difficulty: "medium" },
  { answer: "FERASAT", category: "Karma", clue: "Olayların ardındaki gerçeği çabucak kavrama yetisi, anlayışlılık, sezgi gücü.", length: 7, difficulty: "ultra" },
  { answer: "BASİRET", category: "Karma", clue: "Geleceği ve doğruyu sezme, uzağı görme, sağgörü ve derin kavrayış.", length: 7, difficulty: "ultra" },
  { answer: "MÜSTESNA", category: "Karma", clue: "Bir kuralın veya benzerlerinin dışında tutulan, kuraldışı, benzersiz ve eşsiz.", length: 8, difficulty: "ultra" },
  { answer: "İSTİARE", category: "Karma", clue: "Bir sözcüğü benzetme amacıyla kendi anlamı dışında kullanma sanatı, eğretileme.", length: 7, difficulty: "ultra" },
  { answer: "İKTİBAS", category: "Karma", clue: "Bir düşünceyi veya edebi metni başka bir kaynaktan aynen aktarma, alıntılama.", length: 7, difficulty: "ultra" },
  { answer: "LİYAKAT", category: "Karma", clue: "Bir göreve veya makama layık olma, uygunluk ve yeterlilik durumu.", length: 7, difficulty: "ultra" },
  { answer: "VAHAMET", category: "Karma", clue: "Bir durumun korkutucu, tehlikeli ve ağır sonuçlar doğuracak boyuta gelmesi.", length: 7, difficulty: "ultra" },
  { answer: "TAHAYYÜL", category: "Karma", clue: "Bir durumu veya varlığı zihinde canlandırma, hayal etme eylemi.", length: 8, difficulty: "ultra" },
  { answer: "MUAMMA", category: "Karma", clue: "Anlaşılması son derece güç, gizemli ve çözümsüz gibi görünen durum, sır.", length: 6, difficulty: "ultra" },
  { answer: "GAYYA", category: "Karma", clue: "İçinden çıkılması olanaksız, karanlık ve karmaşık durum (kuyu metaforu).", length: 5, difficulty: "ultra" },
  { answer: "ESATİR", category: "Karma", clue: "Tarih öncesi dönemlere ait masallar, mitoloji ve efsaneler bütünü.", length: 6, difficulty: "ultra" },
  { answer: "MÜŞKÜLAT", category: "Karma", clue: "Bir işi başarırken karşılaşılan zorluklar, engeller ve pürüzler bütünü.", length: 8, difficulty: "ultra" },
  { answer: "TENASÜP", category: "Karma", clue: "Oran, uyum, birbirine yakışma; edebiyatta anlamca ilişkili sözcükleri bir arada kullanma sanatı.", length: 7, difficulty: "ultra" },
  { answer: "TEKABÜL", category: "Karma", clue: "Karşılık olma, birbirine denk gelme, karşı karşılama durumu.", length: 7, difficulty: "ultra" },
  { answer: "İSTİHKAM", category: "Karma", clue: "Düşman saldırısını durdurmak veya geciktirmek için yapılan askeri savunma yapısı.", length: 8, difficulty: "ultra" },
  { answer: "MÜNECCİM", category: "Karma", clue: "Yıldızların hareketlerine bakarak geleceğe dair kehanette bulunan kişi, astrolog.", length: 8, difficulty: "ultra" },
  { answer: "MÜTALAA", category: "Karma", clue: "Bir konu üzerinde etraflıca düşünme, derinlemesine inceleme ve fikir beyan etme.", length: 7, difficulty: "ultra" },
  { answer: "İNTİBA", category: "Karma", clue: "Bir şeyin, bir olayın veya kişinin zihinde bıraktığı ilk izlenim ve etki.", length: 6, difficulty: "ultra" },
  { answer: "METANET", category: "Karma", clue: "Büyük acılar ve felaketler karşısında sarsılmadan dayanma gücü, metinlik.", length: 7, difficulty: "ultra" },
  { answer: "MÜSEBİP", category: "Karma", clue: "Bir olayın veya kötü durumun ortaya çıkmasına yol açan sebep veya sorumlu kişi.", length: 7, difficulty: "ultra" },
  { answer: "METAFOR", category: "Karma", clue: "Bir kavramı veya durumu başka bir benzerlik üzerinden anlatan mecazi ifade.", length: 7, difficulty: "ultra" },
  { answer: "HÜSNÜZAN", category: "Karma", clue: "Bir kimse veya durum hakkında iyi ve olumlu düşünme, güzel niyet besleme.", length: 8, difficulty: "ultra" },
  { answer: "TEVAZU", category: "Karma", clue: "Alçakgönüllülük, kibirden ve böbürlenmekten uzak durma erdemi.", length: 6, difficulty: "ultra" },
  { answer: "FERAGAT", category: "Karma", clue: "Hakkı olan bir şeyden kendi isteğiyle vazgeçme, haktan el çekme durumu.", length: 7, difficulty: "ultra" },
  { answer: "MUKADDES", category: "Karma", clue: "Kutsal kabul edilen, saygı duyulan ve dokunulmaz kılınan yüce değer.", length: 8, difficulty: "ultra" },
  { answer: "ZİHNİYET", category: "Karma", clue: "Bir toplumun, grubun veya kişinin olaylara bakış ve düşünüş biçimi.", length: 8, difficulty: "ultra" },
  { answer: "MAHZUR", category: "Karma", clue: "Bir işin yapılmasında sakınca görülen veya zarar doğurabilecek engelleyici durum.", length: 6, difficulty: "ultra" },
  { answer: "TEFAVVUK", category: "Karma", clue: "Benzerlerinden veya rakiplerinden üstün olma, üstünlük sağlama hali.", length: 8, difficulty: "ultra" },
  { answer: "TECELLİ", category: "Karma", clue: "Belirme, görünme, ortaya çıkma veya kaderin kendini somut göstermesi.", length: 7, difficulty: "ultra" },
  { answer: "İNZİVA", category: "Karma", clue: "Toplumdan ve dünyevi işlerden uzaklaşıp tek başına köşeye çekilme hali.", length: 6, difficulty: "ultra" },
  { answer: "HİKMET", category: "Karma", clue: "Eşyanın ve olayların arkasındaki gizli ilahi sır ve derin anlam.", length: 6, difficulty: "ultra" },
  { answer: "HAYSİYET", category: "Karma", clue: "Kişinin sahip olduğu onur, saygınlık ve öz saygı değeri.", length: 8, difficulty: "ultra" },
  { answer: "MUTEDİL", category: "Karma", clue: "Aşırılıklardan uzak, ılımlı, itidalli ve ölçülü olan dengeli durum.", length: 7, difficulty: "ultra" },
  { answer: "MÜSTAKİL", category: "Karma", clue: "Bağımsız, tek başına duran, başkasına bağlı olmayan yapı veya durum.", length: 8, difficulty: "ultra" },
  { answer: "BEDBİN", category: "Karma", clue: "Olayların hep kötü yönünü gören, karamsar ve umutsuz kimse.", length: 6, difficulty: "ultra" },
  { answer: "NÜKTE", category: "Karma", clue: "İnce anlamlı, güldürürken düşündüren zekice söylenmiş zarif söz.", length: 5, difficulty: "ultra" },
  { answer: "MÜLAKAT", category: "Karma", clue: "Belli bir konu hakkında iki kişi arasında yapılan görüşme, röportaj.", length: 7, difficulty: "ultra" },
  { answer: "TEKAMÜL", category: "Karma", clue: "Gelişme, olgunlaşma, basitten karmaşığa doğru evrilme ve yetkinleşme süreci.", length: 7, difficulty: "ultra" },
  { answer: "İSTİDAT", category: "Karma", clue: "Doğuştan gelen kavrayış, tabii yetenek ve zihinsel kabiliyet eğilimi.", length: 7, difficulty: "ultra" },
  { answer: "MÜŞFİK", category: "Karma", clue: "Şefkatli, sevecen, merhametle ve sevgiyle yaklaşan nazik kimse.", length: 6, difficulty: "ultra" },
  { answer: "VAKUR", category: "Karma", clue: "Ağırbaşlı, vakar sahibi, onurunu koruyan asil ve saygın duruş.", length: 5, difficulty: "ultra" },
  { answer: "GAYRET", category: "Karma", clue: "Bir amacı gerçekleştirmek için gösterilen yoğun çaba, azim ve çalışma isteği.", length: 6, difficulty: "ultra" },
  { answer: "MEŞVERET", category: "Karma", clue: "Bir konuda doğru karara varmak için danışma, fikir alışverişinde bulunma.", length: 8, difficulty: "ultra" },
];

export function calculateWordConnections(word1: string, word2: string): number {
  let count = 0;
  for (const char of word1) {
    if (word2.includes(char)) count++;
  }
  return count;
}

export function selectCenterWord(wordPool: Omit<WordEntry, "id">[]): Omit<WordEntry, "id"> | null {
  if (wordPool.length === 0) return null;

  let bestWord: Omit<WordEntry, "id"> | null = null;
  let highestScore = -Infinity;

  for (let i = 0; i < wordPool.length; i++) {
    const candidate = wordPool[i]!;
    
    // Ideal merkez kelime uzunluğu 4-7 harf olmalı
    if (candidate.length < 4 || candidate.length > 7) continue;

    let connectionCount = 0;
    for (let j = 0; j < wordPool.length; j++) {
      if (i === j) continue;
      connectionCount += calculateWordConnections(candidate.answer, wordPool[j]!.answer);
    }

    const lengthBonus = candidate.length >= 4 && candidate.length <= 6 ? 10 : 5;
    const centerScore = connectionCount * 5 + candidate.length * 3 + lengthBonus;

    if (centerScore > highestScore) {
      highestScore = centerScore;
      bestWord = candidate;
    }
  }

  // Eğer 4-7 harf arasında bulamadıysa ilk kelimeyi seç
  return bestWord || wordPool[0] || null;
}

interface PlacementCandidate {
  word: Omit<WordEntry, "id">;
  row: number;
  col: number;
  direction: "horizontal" | "vertical";
  intersectionsCount: number;
}

export function findPossiblePlacements(
  board: (string | null)[][],
  word: Omit<WordEntry, "id">
): PlacementCandidate[] {
  const candidates: PlacementCandidate[] = [];
  const W = word.answer;
  const len = W.length;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      // 1. Yatay Deneme
      if (c + len <= 10) {
        let valid = true;
        let intersections = 0;

        for (let i = 0; i < len; i++) {
          const currentCell = board[r]![c + i];
          if (currentCell !== null) {
            if (currentCell === W[i]) {
              intersections++;
            } else {
              valid = false;
              break;
            }
          }
        }

        if (valid && intersections > 0) {
          if (c > 0 && board[r]![c - 1] !== null) valid = false;
          if (c + len < 10 && board[r]![c + len] !== null) valid = false;

          for (let i = 0; i < len; i++) {
            if (board[r]![c + i] === null) {
              if (r > 0 && board[r - 1]![c + i] !== null) valid = false;
              if (r < 9 && board[r + 1]![c + i] !== null) valid = false;
            }
          }
        }

        if (valid && intersections > 0) {
          candidates.push({ word, row: r, col: c, direction: "horizontal", intersectionsCount: intersections });
        }
      }

      // 2. Dikey Deneme
      if (r + len <= 10) {
        let valid = true;
        let intersections = 0;

        for (let i = 0; i < len; i++) {
          const currentCell = board[r + i]![c];
          if (currentCell !== null) {
            if (currentCell === W[i]) {
              intersections++;
            } else {
              valid = false;
              break;
            }
          }
        }

        if (valid && intersections > 0) {
          if (r > 0 && board[r - 1]![c] !== null) valid = false;
          if (r + len < 10 && board[r + len]![c] !== null) valid = false;

          for (let i = 0; i < len; i++) {
            if (board[r + i]![c] === null) {
              if (c > 0 && board[r + i]![c - 1] !== null) valid = false;
              if (c < 9 && board[r + i]![c + 1] !== null) valid = false;
            }
          }
        }

        if (valid && intersections > 0) {
          candidates.push({ word, row: r, col: c, direction: "vertical", intersectionsCount: intersections });
        }
      }
    }
  }

  return candidates;
}

export function placeWordOnBoard(
  board: (string | null)[][],
  word: Omit<WordEntry, "id">,
  row: number,
  col: number,
  direction: "horizontal" | "vertical",
  isCenter: boolean = false
): PlacedWord {
  const cells: [number, number][] = [];
  const len = word.answer.length;
  for (let i = 0; i < len; i++) {
    const r = direction === "horizontal" ? row : row + i;
    const c = direction === "horizontal" ? col + i : col;
    board[r]![c] = word.answer[i]!;
    cells.push([r, c]);
  }

  return {
    id: `pw-${Math.random().toString(36).slice(2, 8)}`,
    answer: word.answer,
    category: word.category,
    clue: word.clue,
    difficulty: word.difficulty,
    length: len,
    row,
    col,
    direction,
    isCenter,
    cells,
  };
}

function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = temp;
  }
  return copy;
}

export function generatePuzzle(difficulty: "easy" | "medium" | "hard" | "expert" | "ultra" = "easy"): PuzzleResult {
  const targetCount = difficulty === "easy" ? 4 : difficulty === "medium" ? 5 : difficulty === "hard" ? 6 : 7;
  const filteredWords = WORD_DICTIONARY.filter((w) => {
    if (difficulty === "easy") return w.length <= 6 && w.difficulty === "easy";
    if (difficulty === "medium") return w.length <= 7 && (w.difficulty === "easy" || w.difficulty === "medium");
    if (difficulty === "hard") return w.length <= 8 && (w.difficulty === "medium" || w.difficulty === "hard");
    if (difficulty === "ultra") return w.length <= 8 && (w.difficulty === "hard" || w.difficulty === "ultra");
    return w.length <= 8; // expert mode max 8 letters
  });

  for (let attempt = 0; attempt < 50; attempt++) {
    const shuffled = shuffleArray(filteredWords);
    const pool = shuffled.slice(0, Math.min(targetCount + 5, shuffled.length));

    const center = selectCenterWord(pool);
    if (!center) continue;

    const board: (string | null)[][] = Array(10).fill(null).map(() => Array(10).fill(null));
    const placedWords: PlacedWord[] = [];

    // Merkez kelimeyi yatay olarak geometri merkezine (row=4, col=3 veya uygun orta) koy
    const startCol = Math.max(0, Math.min(10 - center.length, Math.floor((10 - center.length) / 2)));
    const startRow = 4;

    const centerPlaced = placeWordOnBoard(board, center, startRow, startCol, "horizontal", true);
    placedWords.push(centerPlaced);

    const remainingWords = pool.filter((w) => w.answer !== center.answer);

    const backtrack = (index: number): boolean => {
      if (placedWords.length >= targetCount || index >= remainingWords.length) {
        return placedWords.length >= Math.min(3, targetCount);
      }

      const currentWord = remainingWords[index];
      if (!currentWord) return placedWords.length >= Math.min(3, targetCount);
      const candidates = findPossiblePlacements(board, currentWord);

      candidates.sort((a, b) => b.intersectionsCount - a.intersectionsCount);

      for (const cand of candidates) {
        const boardSnapshot = board.map((row) => [...row]);
        const placed = placeWordOnBoard(board, currentWord, cand.row, cand.col, cand.direction, false);
        placedWords.push(placed);

        if (backtrack(index + 1)) {
          return true;
        }

        placedWords.pop();
        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 10; c++) {
            if (board[r] && boardSnapshot[r]) {
              board[r]![c] = boardSnapshot[r]![c] ?? null;
            }
          }
        }
      }

      return backtrack(index + 1);
    };

    backtrack(0);

    if (placedWords.length >= 3) {
      return {
        boardSize: 10,
        centerWord: centerPlaced,
        words: placedWords,
        score: placedWords.length * 20,
      };
    }
  }

  // Fallback
  const fallbackCenter = { answer: "ELMA", category: "Karma", clue: "Kırmızı veya yeşil olabilen, lezzetli bir meyve.", length: 4, difficulty: "easy" as const };
  const fallbackBoard: (string | null)[][] = Array(10).fill(null).map(() => Array(10).fill(null));
  const fallbackCenterPlaced = placeWordOnBoard(fallbackBoard, fallbackCenter, 4, 3, "horizontal", true);
  const fallbackKalem = placeWordOnBoard(fallbackBoard, { answer: "KALEM", category: "Karma", clue: "Yazı yazmak için kullanılan araç.", length: 5, difficulty: "easy" as const }, 2, 4, "vertical", false);
  const fallbackMasa = placeWordOnBoard(fallbackBoard, { answer: "MASA", category: "Karma", clue: "Üzerinde yemek yediğimiz, ders çalıştığımız mobilya.", length: 4, difficulty: "easy" as const }, 6, 4, "horizontal", false);

  return {
    boardSize: 10,
    centerWord: fallbackCenterPlaced,
    words: [fallbackCenterPlaced, fallbackKalem, fallbackMasa],
    score: 100,
  };
}

/**
 * Yerleştirme Doğrulaması (Frontend için)
 */
export function checkPlacement(
  wordAnswer: string,
  startRow: number,
  startCol: number,
  direction: "horizontal" | "vertical",
  currentBoard: (string | null)[][],
  solutionWords: PlacedWord[]
): { valid: boolean; reason?: string } {
  const len = wordAnswer.length;

  // 1. Sınır kontrolü
  if (direction === "horizontal" && startCol + len > 10) {
    return { valid: false, reason: "Kelime tahta dışına çıkıyor!" };
  }
  if (direction === "vertical" && startRow + len > 10) {
    return { valid: false, reason: "Kelime tahta dışına çıkıyor!" };
  }

  // 2. Çözüm ile uyumluluk kontrolü (Solution Validation)
  const normalizedAnswer = wordAnswer.toLocaleUpperCase("tr-TR");
  const matchingWordExists = solutionWords.some(
    (w) => w.answer.toLocaleUpperCase("tr-TR") === normalizedAnswer
  );

  if (!matchingWordExists) {
    return { valid: false, reason: "Geçersiz kelime!" };
  }

  const targetSolution = solutionWords.find(
    (w) =>
      w.answer.toLocaleUpperCase("tr-TR") === normalizedAnswer &&
      w.row === startRow &&
      w.col === startCol &&
      w.direction === direction
  );

  if (!targetSolution) {
    return { valid: false, reason: "Kelime bu konuma veya yöne yerleştirilemez!" };
  }

  // 3. Mevcut tahta ile çakışma kontrolü
  for (let i = 0; i < len; i++) {
    const r = direction === "horizontal" ? startRow : startRow + i;
    const c = direction === "horizontal" ? startCol + i : startCol;
    const cellChar = currentBoard[r]![c];
    if (cellChar !== null && cellChar !== wordAnswer[i]) {
      return { valid: false, reason: "Ortak hücredeki harf uyuşmuyor!" };
    }
  }

  return { valid: true };
}
