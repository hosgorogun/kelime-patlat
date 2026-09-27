import fs from 'node:fs';
import ts from 'typescript';
const files=['App.tsx',...fs.readdirSync('components').filter(f=>f.endsWith('.tsx')).map(f=>'components/'+f)];
for(const file of files) {
 const s=fs.readFileSync(file,'utf8'), sf=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function visit(n) {
   if(ts.isPropertyAssignment(n)) {
    const key=n.name.getText(sf); const parent=n.parent.parent; const styleName=ts.isPropertyAssignment(parent)? parent.name.getText(sf):'';
    let next=null;
    if(key==='backgroundColor' && /^(overlay|modalOverlay|matchmakingOverlay|confirmOverlay|adOverlay|leaveOverlay|backdrop)$/i.test(styleName)) next='"rgba(35,48,59,0.42)"';
    if(key==='backgroundColor' && /^(card|modalCard|matchmakingCard|confirmCard)$/.test(styleName)) next='"#FFFFFF"';
    if(key==='fontSize' && ts.isNumericLiteral(n.initializer)) {
      const size=+n.initializer.text;
      if(/^(title|headerTitle|pageTitle)$/.test(styleName) && size>=16 && size<26) next='26';
      if(/^(sectionTitle|tabText|label)$/.test(styleName) && size<12) next='12';
      if(/^(body|description|subtitle|messageText)$/.test(styleName) && size<14) next='14';
    }
    if(next) edits.push([n.initializer.getStart(sf),n.initializer.end,next]);
   }
   ts.forEachChild(n,visit);
 }
 visit(sf);let out=s;for(const [a,b,v] of edits.sort((a,b)=>b[0]-a[0]))out=out.slice(0,a)+v+out.slice(b);fs.writeFileSync(file,out);
}
let p='shared/solo.ts',s=fs.readFileSync(p,'utf8');
s=s.replace(/(tagText|letterText|checkColor): "#[\da-f]+"/gi,'$1: "#293541"');fs.writeFileSync(p,s);
