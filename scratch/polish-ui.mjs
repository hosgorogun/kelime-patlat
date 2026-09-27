import fs from 'node:fs';
for(const file of ['App.tsx',...fs.readdirSync('components').filter(f=>f.endsWith('.tsx')).map(f=>'components/'+f)]) {
 let s=fs.readFileSync(file,'utf8');
 s=s.replace(/textShadowOffset:\s*\{\s*width:\s*[^,]+,\s*height:\s*[^}]+\}/g,'textShadowOffset: { width: 0, height: 0 }');
 s=s.replace(/textShadowColor:\s*"[^"]+"/g,'textShadowColor: "transparent"');
 fs.writeFileSync(file,s);
}
let p='components/screen-container.tsx',s=fs.readFileSync(p,'utf8');s=s.replace(/  content: \{\r?\n    flex: 1,/,'  content: {\n    width: "100%",\n    maxWidth: 560,\n    alignSelf: "center",\n    flex: 1,');fs.writeFileSync(p,s);
