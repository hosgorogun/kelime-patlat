import fs from 'node:fs';
let p='components/design-preview.tsx',s=fs.readFileSync(p,'utf8');s=s.replace('const noop = () => {};','const noop = () => {};\nconst excludedWords: string[] = [];').replace('<SoloChallenge level={level}','<SoloChallenge excludeWords={excludedWords} level={level}');fs.writeFileSync(p,s);
for(const file of ['App.tsx','components/solo-challenge.tsx','components/arcade-challenge.tsx']) {let t=fs.readFileSync(file,'utf8').replaceAll('>> TERMİNAL TARANIYOR...','BİR KELİME BUL').replaceAll('TERMİNAL TARANIYOR','BİR KELİME BUL');fs.writeFileSync(file,t);}
p='components/command-center.tsx';s=fs.readFileSync(p,'utf8').replace('ÖZEL Görevler','GÜNLÜK KEŞİFLER');fs.writeFileSync(p,s);
