import fs from 'node:fs';
import ts from 'typescript';
const files = ['App.tsx', ...fs.readdirSync('components').filter(f => f.endsWith('.tsx') && !['game-ui.tsx','brand-logos.tsx','premium-dock.tsx'].includes(f)).map(f => `components/${f}`)];
const parse = s => {
  const hex = /^#([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.exec(s);
  if (hex) { const h = hex[1].length === 3 ? [...hex[1]].map(c=>c+c).join('') : hex[1]; return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16), h.length === 8 ? parseInt(h.slice(6),16)/255 : 1]; }
  const rgb = /^rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)$/.exec(s);
  return rgb ? [+rgb[1],+rgb[2],+rgb[3], rgb[4] === undefined ? 1 : +rgb[4]] : null;
};
function role(n) {
  for(let p=n.parent;p;p=p.parent) {
    if(ts.isPropertyAssignment(p)) return p.name.getText().replace(/['"]/g,'');
    if(ts.isJsxAttribute(p)) return p.name.getText();
    if(ts.isVariableDeclaration(p)) return p.name.getText();
  }
  return '';
}
function recolor(s, r) {
  const c=parse(s); if(!c) return s;
  const [red,g,b,a]=c, max=Math.max(red,g,b), min=Math.min(red,g,b), light=(max+min)/510;
  if(/shadow/i.test(r)) return '#293541';
  const fg=/^(color|text|textColor|titleColor|labelColor|placeholderTextColor|tintColor|headerText)$/.test(r);
  if(fg) {
    if(max-min < 45 || light > .84 || light < .32) return '#293541';
    const factor=Math.min(1, 118 / Math.max(1, (red*.299+g*.587+b*.114)));
    return '#'+[red,g,b].map(v=>Math.round(v*factor).toString(16).padStart(2,'0')).join('');
  }
  if(/border/i.test(r)) return a < .05 ? 'transparent' : '#DCE1D7';
  if(light < .42) {
    if(a < .8 && max < 45 && /background|overlay/i.test(r)) return `rgba(35,48,59,${a < .3 ? .05 : .42})`;
    if(b > red*1.2 && b > g) return '#EDF4FC';
    if(red > g*1.25) return '#FFF0E8';
    return '#F0F5ED';
  }
  if(a < 1) return s;
  if(/colors|gradient|bg|background|fill/i.test(r)) return '#'+[red,g,b].map(v=>Math.round(v*.42+255*.58).toString(16).padStart(2,'0')).join('');
  return s;
}
for(const file of files) {
 const source=fs.readFileSync(file,'utf8'); const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX); const edits=[];
 function visit(n) {
   const r=role(n);
   if(ts.isStringLiteral(n)) { const next=recolor(n.text,r); if(next!==n.text) edits.push([n.getStart(sf),n.end,JSON.stringify(next)]); }
   if(ts.isPropertyAssignment(n) && ts.isNumericLiteral(n.initializer)) {
     const key=n.name.getText(sf), val=+n.initializer.text;
     const value = key==='shadowOpacity' ? Math.min(val,.08) : key==='textShadowRadius' ? 0 : key==='shadowRadius' ? Math.min(val,4) : key==='elevation' ? Math.min(val,2) : key==='letterSpacing' ? Math.min(val,.5) : null;
     if(value!==null && value!==val) edits.push([n.initializer.getStart(sf),n.initializer.end,String(value)]);
   }
   if(ts.isPropertyAccessExpression(n) && n.getText(sf)==='palette.cream' && r==='color') edits.push([n.getStart(sf),n.end,'palette.text']);
   ts.forEachChild(n,visit);
 }
 visit(sf); let result=source; for(const [start,end,text] of edits.sort((a,b)=>b[0]-a[0])) result=result.slice(0,start)+text+result.slice(end);
 result=result.replaceAll('<StatusBar style="light"','<StatusBar style="dark"').replaceAll('barStyle="light-content"','barStyle="dark-content"');
 fs.writeFileSync(file,result);
 console.log(`${file}: ${edits.length} style updates`);
}
