// Assembles www/ (the app) from src/: one HTML file with styles and scripts inlined,
// fonts and libraries copied locally so the app works without internet.
const fs=require('fs'),path=require('path');
const S=p=>path.join(__dirname,'src',p),N=p=>path.join(__dirname,'node_modules',p),W=p=>path.join(__dirname,'www',p);
fs.rmSync(W(''),{recursive:true,force:true});fs.mkdirSync(W('fonts'),{recursive:true});fs.mkdirSync(W('lib'),{recursive:true});
const fonts=[['Inter','normal',400,'@fontsource/inter/files/inter-latin-400-normal.woff2'],['Inter','normal',500,'@fontsource/inter/files/inter-latin-500-normal.woff2'],['Inter','normal',600,'@fontsource/inter/files/inter-latin-600-normal.woff2'],
  ['Literata','normal',400,'@fontsource/literata/files/literata-latin-400-normal.woff2'],['Literata','normal',600,'@fontsource/literata/files/literata-latin-600-normal.woff2'],['Literata','italic',400,'@fontsource/literata/files/literata-latin-400-italic.woff2'],['Literata','italic',600,'@fontsource/literata/files/literata-latin-600-italic.woff2']];
let ff='';for(const [fam,st,w,f] of fonts){const name=path.basename(f);fs.copyFileSync(N(f),W('fonts/'+name));ff+=`@font-face{font-family:${fam};font-style:${st};font-weight:${w};font-display:swap;src:url(fonts/${name}) format('woff2')}\n`}
fs.copyFileSync(N('jszip/dist/jszip.min.js'),W('lib/jszip.min.js'));fs.copyFileSync(N('jspdf/dist/jspdf.umd.min.js'),W('lib/jspdf.umd.min.js'));
let h=fs.readFileSync(S('index.html'),'utf8');
h=h.replace(/<link rel="preconnect"[^>]*>\n?/,'').replace(/<link href="https:\/\/fonts.googleapis.com[^>]*>\n?/,'');
const css=fs.readFileSync(S('app.css'),'utf8');h=h.replace('<link rel="stylesheet" href="app.css">',()=>'<style>\n'+ff+css+'\n</style>');
h=h.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>','<script src="lib/jszip.min.js"></script>');
h=h.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>','<script src="lib/jspdf.umd.min.js"></script>');
const order=['platform.js','core.js','editor.js','views.js','map.js','cards.js','io.js','pom.js','main.js'];
h=h.replace(/<script src="js\/[^"]+"><\/script>\n?/g,'');
const js=order.map(f=>fs.readFileSync(S('js/'+f),'utf8').replace("'use strict';\n",'')).join('\n');h=h.replace('</body>',()=>'<script>window.ESCRITORIO_APP=true</script>\n<script>\n'+js+'\n</script>\n</body>');
h=h.replace('<meta name="viewport" content="width=device-width, initial-scale=1">','<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">');
fs.writeFileSync(W('index.html'),h);
console.log('www/ listo:',Math.round(h.length/1024)+' KB');
