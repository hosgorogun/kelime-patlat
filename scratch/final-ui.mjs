import fs from 'node:fs';
let p='components/league-hub.tsx',s=fs.readFileSync(p,'utf8').replace('Image, Pressable','Pressable').replace(/const RANK_IMAGES:[\s\S]*?\n};\r?\n/,'').replace(/\s*const imgSource = RANK_IMAGES\[item.tier\];/,'').replace('color: isUnlocked ? item.color : "#293541"','color: "#293541"');fs.writeFileSync(p,s);
p='components/solo-challenge.tsx';s=fs.readFileSync(p,'utf8').replace('SİBER DEŞİFRE KUTUSU','SÜRPRİZ KUTUSU');fs.writeFileSync(p,s);
