import fs from 'node:fs';
let p='components/command-center.tsx',s=fs.readFileSync(p,'utf8');
s=s.replace(/\s*<View style=\{styles.titlePill\}>[\s\S]*?<\/View>/,'');
s=s.replace('getActiveCyberTitle, ','');
fs.writeFileSync(p,s);
const copy={
'SİBER MAĞAZA':'Mağaza','EKİPMAN & BAKİYE MERKEZİ':'BİRAZ DESTEK, BOLCA EĞLENCE',
'OPERATÖR MERKEZİ':'SENİN OYUNUN','KİMLİK & AYARLAR':'Profil',
'📊 GENEL BAKIŞ & ÖZELLEŞTİRME':'Genel bakış','⚙️ SİSTEM VE AYARLAR':'Ayarlar',
'📊 OPERATÖR KARİYER VERİLERİ':'Oyun istatistiklerin','CANLI KAYITLAR':'BUGÜNE KADAR',
'⚙️ ENVENTER VE ÖZELLEŞTİRME':'Kendine göre seç','MACERA PARŞÖMENİ':'KÜÇÜK HEDEFLER, GÜZEL ÖDÜLLER',
'GÖREVLER':'Görevler','Siber Çip':'Çip','SİBER ÇİP':'ÇİP',
'Aşamalı kelime operasyonları':'Her bölümde yeni kelimeler',
'✦ GÜNÜN ROTASI ✦':'GÜNÜN BULMACASI','⚡ REKOR YARIŞI ⚡':'REKOR YARIŞI',
'✦ 100 SEVİYE · MACERA ✦':'100 SEVİYE','✦ 20 BÖLÜM · NOSTALJİ ✦':'20 BÖLÜM',
'Siber Arena Sezonu Başladı!':'Yeni sezon başladı!', 'MACERAYA KATIL':'Bir kelimeyle başla',
};
for(const file of ['App.tsx',...fs.readdirSync('components').filter(f=>f.endsWith('.tsx')).map(f=>'components/'+f)]) {
 let text=fs.readFileSync(file,'utf8');for(const [a,b] of Object.entries(copy))text=text.replaceAll(a,b);
 text=text.replaceAll('flex: 1, backgroundColor: "#F0F5ED", justifyContent: "center", alignItems: "center", padding:', 'flex: 1, backgroundColor: "rgba(35,48,59,0.42)", justifyContent: "center", alignItems: "center", padding:');
 fs.writeFileSync(file,text);
}
p='components/cyber-store.tsx';s=fs.readFileSync(p,'utf8');
s=s.replace(/\{item.imageKey && STORE_ASSETS\[item.imageKey\] \? \([\s\S]*?\) : \([\s\S]*?\)\}/, '<View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: "#FFF0C7", alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 27 }}>{item.icon}</Text></View>');
s=s.replace('BİRAZ DESTEK, BOLCA EĞLENCE','OYUNUNA RENK KAT');fs.writeFileSync(p,s);
p='components/design-preview.tsx';s=fs.readFileSync(p,'utf8').replace('ScrollView, ','');fs.writeFileSync(p,s);
