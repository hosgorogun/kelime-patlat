import fs from 'node:fs';
let p='shared/themes.ts', s=fs.readFileSync(p,'utf8');
const themes={standard:['Kelime Bahçesi','#F7F5EE','#FFFFFF','#B9EDD0','#CED8C9','#293541','#E9EFE3','#626F73','#167653'],space:['Gökyüzü','#F0F6FD','#FFFFFF','#B6DCFF','#C9DAE8','#293541','#E2EEFA','#526C81','#216A9F'],cyber:['Şeker Molası','#FBF2F6','#FFFFFF','#F4BED4','#E3CED8','#293541','#F5E3EC','#78596B','#A3396A'],retro:['Gün Işığı','#FFF8E8','#FFFFFF','#FFD66E','#E1D5B8','#293541','#F4EBD0','#786941','#996000']};
for(const [key,v] of Object.entries(themes)) { const fields=['name','background','surface','surfaceSelected','cellBorder','text','trayBackground','headerText','accentColor']; s=s.replace(new RegExp(`  ${key}: \\{[\\s\\S]*?\\n  \\}`), `  ${key}: {\n    id: "${key}",\n${fields.map((f,i)=>`    ${f}: "${v[i]}"`).join(',\n')}\n  }`); }
fs.writeFileSync(p,s);
p='theme.config.js';s=fs.readFileSync(p,'utf8');for(const [a,b] of Object.entries({'#3EE8B5':'#167653','#06140F':'#F7F5EE','#0E2C22':'#FFFFFF','#FFF8E7':'#293541','#A8C5B5':'#626F73','#8C6A2E':'#DFE3D8','#F4D06F':'#996000','#FF6B7A':'#BA354A'}))s=s.replaceAll(a,b);fs.writeFileSync(p,s);
