import fs from 'node:fs';
for(const file of ['App.tsx','components/solo-challenge.tsx','components/arcade-challenge.tsx']) {
 let s=fs.readFileSync(file,'utf8').replace('cell: { flex: 1, borderRadius: 99,','cell: { flex: 1, borderRadius: 12, borderBottomWidth: 4,');
 fs.writeFileSync(file,s);
}
let p='components/league-hub.tsx',s=fs.readFileSync(p,'utf8').replaceAll('color: item.color','color: "#293541"').replaceAll('color: selectedLeague.color','color: "#293541"');fs.writeFileSync(p,s);
