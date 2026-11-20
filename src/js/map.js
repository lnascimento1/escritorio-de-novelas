'use strict';
// ---------- mapa: mapa mental + diagrama ----------
const KC={centro:['#f2553d','#f2553d','#ffffff'],idea:['#ffffff','#bdb9b1','#1b1c22'],personaje:['#fde4de','#f2553d','#1b1c22'],lugar:['#e2e9fb','#4a78e0','#1b1c22'],lore:['#efe6fa','#8b62c9','#1b1c22'],escena:['#dff3e9','#2f9e6a','#1b1c22'],capitulo:['#1d2029','#1d2029','#ffffff']};
const KN={centro:'Centro',idea:'Idea',personaje:'Personaje',lugar:'Lugar',lore:'Lore',escena:'Escena',capitulo:'Capítulo'};
const cx=document.createElement('canvas').getContext('2d')||{measureText:t=>({width:t.length*7.5}),font:''};
let V={x:0,y:0,k:1},selN=null,selE=null,selL=null,selB=null,selF=null,conn=null,pend=null,act=null,mUndo=[],last={id:'',t:0};
const clrSel=()=>{selN=selE=selL=selB=selF=null};
/* shapes (style A), timelines with balloons, and translucent frames */
const SHAPE={personaje:'circle',lugar:'pin',lore:'diamond'};
const SH={personaje:['#FAECE7','#D85A30','#712B13'],lugar:['#E1F5EE','#1D9E75','#085041'],lore:['#EEEDFE','#7F77DD','#3C3489']};
const FC={pur:['#7F77DD','#EEEDFE','#3C3489'],coral:['#D85A30','#FAECE7','#712B13'],teal:['#1D9E75','#E1F5EE','#085041'],amber:['#BA7517','#FAEEDA','#633806'],gray:['#888780','#F1EFE8','#444441']};
const initials=t=>String(t||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?';
const ML=m=>{m.lines=m.lines||[];m.frames=m.frames||[];return m};
const lineOf=id=>ML(M()).lines.find(l=>l.id===id);
const frameOf=id=>ML(M()).frames.find(f=>f.id===id);
const balOf=key=>{if(!key)return null;const [li,bi]=key.split(':'),l=lineOf(li);return l?{l,b:(l.bs||[]).find(b=>b.id===bi)}:null};
const lineEnd=l=>l.dir==='v'?{x:l.x,y:l.y+l.len}:{x:l.x+l.len,y:l.y};
const balPt=(l,b)=>l.dir==='v'?{x:l.x,y:l.y+b.pos}:{x:l.x+b.pos,y:l.y};
const M=()=>P.maps.find(m=>m.id===P.curMap)||P.maps[0];
const nodeOf=id=>M().nodes.find(n=>n.id===id);
function refT(ref){if(!ref)return null;const [t,id]=ref.split(':');if(t==='s'){const f=findScene(id);return f?{o:f.c.scenes[f.i],k:'title',kind:'escena'}:null}const c=P.cards.find(x=>x.id===id);return c?{o:c,k:'name',kind:c.kind}:null}
const txtOf=n=>{const r=refT(n.ref);return r?r.o[r.k]:n.t};
function wrapT(t){cx.font='500 14px Inter, system-ui, sans-serif';const ws=String(t||'Sin texto').split(/\s+/),L=[];let l='';for(const w of ws){const s=l?l+' '+w:w;if(cx.measureText(s).width>170&&l){L.push(l);l=w}else l=s}L.push(l);if(L.length>4){L.length=4;L[3]+='…'}return L}
function dims(n){const L=wrapT(txtOf(n));cx.font='500 14px Inter, system-ui, sans-serif';if(SHAPE[n.kind]){const lw=Math.max(...L.map(s=>cx.measureText(s).width));return{L,w:Math.max(64,lw+8),h:66+L.length*17,shape:SHAPE[n.kind]}}return{L,w:Math.max(70,Math.max(...L.map(s=>cx.measureText(s).width))+30)+(n.ref?16:0),h:L.length*18+18}}
function mapInner(exp){
  const m=M(),by=Object.fromEntries(m.nodes.map(n=>[n.id,n])),D=Object.fromEntries(m.nodes.map(n=>[n.id,dims(n)]));
  const bg=exp?'#ffffff':'var(--bg)',mu=exp?'#686a74':'var(--mut)';
  const E=m.edges.map(e=>{const a=by[e.a],b=by[e.b];if(!a||!b)return'';const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,d=`M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`,s=!exp&&selE===e.id;let lab='';
    if(e.label){cx.font='12px Inter, sans-serif';const lw=cx.measureText(e.label).width+14;lab=`<rect x="${mx-lw/2}" y="${my-11}" width="${lw}" height="22" rx="11" fill="${bg}" stroke="#d0cdc6"/><text x="${mx}" y="${my+4}" text-anchor="middle" font-size="12" fill="${mu}" font-family="Inter, sans-serif">${esc(e.label)}</text>`}
    return`<g data-e="${e.id}"><path d="${d}" fill="none" stroke="transparent" stroke-width="16"/><path d="${d}" fill="none" stroke="${s?'#f2553d':'#9093a3'}" stroke-width="${s?2.6:1.6}"${e.dash?' stroke-dasharray="5 5"':''}/>${lab}</g>`}).join('');
  const ink=exp?'#1b1c22':'var(--ink)';
  const N=m.nodes.map(n=>{const {L,w,h,shape}=D[n.id],c=KC[n.kind]||KC.idea,s=!exp&&selN===n.id,bold=n.kind==='centro'||n.kind==='capitulo';
    if(shape){const k=SH[n.kind],R=28;let body;
      if(shape==='circle')body=`<circle r="${R}" fill="${k[0]}" stroke="${s?'#f2553d':k[1]}" stroke-width="${s?3.4:2}"/><text y="5" text-anchor="middle" font-size="15" font-weight="600" fill="${k[2]}" font-family="Inter, sans-serif">${esc(initials(txtOf(n)))}</text>`;
      else if(shape==='pin')body=`<path d="M0,-30 a22,22 0 0 1 22,22 c0,17 -22,38 -22,38 c0,0 -22,-21 -22,-38 a22,22 0 0 1 22,-22z" fill="${k[0]}" stroke="${s?'#f2553d':k[1]}" stroke-width="${s?3.4:2}"/><circle cy="-8" r="7" fill="${k[1]}"/>`;
      else body=`<path d="M0,-${R} L${R},0 L0,${R} L-${R},0z" fill="${k[0]}" stroke="${s?'#f2553d':k[1]}" stroke-width="${s?3.4:2}" stroke-linejoin="round"/>`;
      return`<g data-n="${n.id}" transform="translate(${n.x},${n.y})">${body}${L.map((l,i)=>`<text y="${R+18+i*17}" text-anchor="middle" fill="${ink}" font-size="13" font-weight="600" font-family="Inter, system-ui, sans-serif" style="paint-order:stroke;stroke:${exp?'#ffffff':'var(--bg)'};stroke-width:4px">${esc(l)}</text>`).join('')}${s?`<circle data-h="${n.id}" cx="${R+4}" cy="0" r="9" fill="#f2553d" stroke="#ffffff" stroke-width="2"/>`:''}</g>`}
    return`<g data-n="${n.id}" transform="translate(${n.x},${n.y})"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${n.kind==='idea'||n.kind==='centro'?Math.min(h/2,18):8}" fill="${c[0]}" stroke="${s?'#f2553d':c[1]}" stroke-width="${s?3:1.4}"/>${L.map((l,i)=>`<text x="${n.ref?-8:0}" y="${-h/2+22+i*18}" text-anchor="middle" fill="${c[2]}" font-size="14" font-weight="${bold?600:500}" font-family="Inter, system-ui, sans-serif">${esc(l)}</text>`).join('')}${n.ref?`<text x="${w/2-15}" y="5" font-size="13" fill="${c[2]}" opacity=".6" font-family="Inter, sans-serif">↗</text>`:''}${s?`<circle data-h="${n.id}" cx="${w/2}" cy="0" r="9" fill="#f2553d" stroke="#ffffff" stroke-width="2"/>`:''}</g>`}).join('');
  let tmp='';if(!exp&&conn){const a=by[conn.a];if(a)tmp=`<path d="M${a.x},${a.y} L${conn.p.x},${conn.p.y}" stroke="#f2553d" stroke-width="2" stroke-dasharray="6 5" fill="none"/>`}
  ML(m);
  const F=m.frames.map(f=>{const c=FC[f.color]||FC.pur,s=!exp&&selF===f.id;cx.font='600 12px Inter, sans-serif';const tw=Math.min(f.w,cx.measureText(f.label||'Recuadro').width+24);
    return`<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="14" fill="${c[0]}" fill-opacity=".10" stroke="${s?'#f2553d':c[0]}" stroke-opacity="${s?1:.55}" stroke-width="${s?2:1.4}" stroke-dasharray="6 5" pointer-events="none"/>`+
      `<g data-ft="${f.id}"><rect x="${f.x}" y="${f.y}" width="${tw}" height="24" rx="12" fill="${c[1]}" stroke="${s?'#f2553d':'none'}"/><text x="${f.x+12}" y="${f.y+16}" font-size="12" font-weight="600" fill="${c[2]}" font-family="Inter, sans-serif">${esc(f.label||'Recuadro')}</text></g>`+
      (s?`<path data-fc="${f.id}" d="M${f.x+f.w},${f.y+f.h-18} L${f.x+f.w},${f.y+f.h} L${f.x+f.w-18},${f.y+f.h}z" fill="#f2553d"/>`:'')}).join('');
  const TL=m.lines.map(l=>{const e=lineEnd(l),s=!exp&&selL===l.id,col=s?'#f2553d':(exp?'#5f5e5a':'var(--ink)');
    let g=`<g data-tl="${l.id}"><line x1="${l.x}" y1="${l.y}" x2="${e.x}" y2="${e.y}" stroke="transparent" stroke-width="20"/><line x1="${l.x}" y1="${l.y}" x2="${e.x}" y2="${e.y}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`+
      (l.dir==='v'?`<path d="M${e.x-7},${e.y-10} L${e.x},${e.y+2} L${e.x+7},${e.y-10}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`:`<path d="M${e.x-10},${e.y-7} L${e.x+2},${e.y} L${e.x-10},${e.y+7}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`)+'</g>';
    if(s)g+=`<circle data-tlh="${l.id}" cx="${e.x}" cy="${e.y}" r="8" fill="#f2553d" stroke="#ffffff" stroke-width="2"/>`;
    const bs=(l.bs||[]).slice().sort((a,b)=>a.pos-b.pos);
    bs.forEach((b,i)=>{const p=balPt(l,b),side=i%2?1:-1,sb=!exp&&selB===l.id+':'+b.id,lab=b.label||'Cuándo…';cx.font='600 11px Inter, sans-serif';const w=cx.measureText(lab).width+20,fill=b.link?'#D85A30':'#5F5E5A',tc=b.link?'#FAECE7':'#F1EFE8';
      let px,py,sx,sy;if(l.dir==='v'){px=p.x+side*(20+w/2);py=p.y;sx=p.x+side*20;sy=p.y}else{px=p.x;py=p.y+side*31;sx=p.x;sy=p.y+side*20}
      const ln=b.link&&by[b.link];if(ln)g+=`<path d="M${px},${py} L${ln.x},${ln.y}" fill="none" stroke="#D85A30" stroke-width="1.4" stroke-dasharray="3 4" pointer-events="none"/>`;
      g+=`<g data-tb="${l.id}:${b.id}"><line x1="${p.x}" y1="${p.y}" x2="${sx}" y2="${sy}" stroke="${fill}" stroke-width="1.5"/><circle cx="${p.x}" cy="${p.y}" r="6" fill="${exp?'#ffffff':'var(--bg)'}" stroke="${fill}" stroke-width="2.5"/><rect x="${px-w/2}" y="${py-11}" width="${w}" height="22" rx="11" fill="${fill}" stroke="${sb?'#f2553d':'none'}" stroke-width="${sb?3:0}"${sb?' stroke-opacity=".5"':''}/><text x="${px}" y="${py+4}" text-anchor="middle" font-size="11" font-weight="600" fill="${tc}" font-family="Inter, sans-serif">${esc(lab)}</text></g>`});
    return g}).join('');
  return F+E+TL+tmp+N;
}
function drawMap(){const s=$('#msvg');if(!isView('map'))return;s.innerHTML=`<g transform="translate(${V.x},${V.y}) scale(${V.k})">${mapInner(false)}</g>`;const m=ML(M());$('#mempty').hidden=m.nodes.length+m.lines.length+m.frames.length>0}
function bbox(m){ML(m);if(!m.nodes.length&&!m.lines.length&&!m.frames.length)return{x:0,y:0,w:0,h:0};let a=1e9,b=1e9,c=-1e9,d=-1e9;const add=(x1,y1,x2,y2)=>{a=Math.min(a,x1);b=Math.min(b,y1);c=Math.max(c,x2);d=Math.max(d,y2)};m.nodes.forEach(n=>{const q=dims(n);add(n.x-q.w/2,n.y-(q.shape?32:q.h/2),n.x+q.w/2,n.y+(q.shape?q.h-32:q.h/2))});m.lines.forEach(l=>{const e=lineEnd(l);add(Math.min(l.x,e.x)-(l.dir==='v'?140:20),Math.min(l.y,e.y)-(l.dir==='v'?20:46),Math.max(l.x,e.x)+(l.dir==='v'?140:20),Math.max(l.y,e.y)+(l.dir==='v'?20:46))});m.frames.forEach(f=>add(f.x,f.y,f.x+f.w,f.y+f.h));return{x:a,y:b,w:c-a,h:d-b}}
function fitMap(){const s=$("#msvg"),W=s.clientWidth,H=s.clientHeight;if(!W){drawMap();return}const b=bbox(M()),side=W>700?310:0,bot=W<=700?H*.44:0,aw=W-side-40,ah=H-bot-40;
  if(!b.w){V={x:aw/2+20,y:ah/2+20,k:1};drawMap();return}
  const k=Math.max(.25,Math.min(1.3,aw/b.w,ah/b.h));V={k,x:20+(aw-b.w*k)/2-b.x*k,y:20+(ah-b.h*k)/2-b.y*k};drawMap()}
function mSnap(){mUndo.push(JSON.stringify(M()));if(mUndo.length>40)mUndo.shift()}
function mUndoDo(){const s=mUndo.pop();if(!s)return;const i=P.maps.findIndex(m=>m.id===P.curMap);P.maps[i]=JSON.parse(s);clrSel();touch();drawMap();renderInsp()}
function link(a,b,o={}){const m=M();if(a===b||m.edges.some(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a)))return;mSnap();m.edges.push({id:nid(),a,b,label:'',...o});touch();drawMap()}
function addNode(x,y,from){mSnap();const n={id:nid(),t:'Idea nueva',kind:'idea',ref:'',x,y};const m=M();m.nodes.push(n);if(from)m.edges.push({id:nid(),a:from,b:n.id,label:''});selN=n.id;selE=null;touch();drawMap();renderInsp();setTimeout(()=>{const t=$('#iT');if(t){t.focus();t.select()}},0);return n}
function addChild(pid){const p=nodeOf(pid);if(!p)return;const kids=M().edges.filter(e=>e.a===pid&&!e.dash).map(e=>nodeOf(e.b)).filter(Boolean);const y=kids.length?Math.max(...kids.map(k=>k.y))+70:p.y;addNode(p.x+dims(p).w/2+150,y,pid)}
function addSib(id){const pe=M().edges.find(e=>e.b===id&&!e.dash);if(pe)addChild(pe.a);else{const n=nodeOf(id);addNode(n.x,n.y+dims(n).h+50)}}
function delSel(){const m=ML(M());mSnap();if(selN){m.nodes=m.nodes.filter(n=>n.id!==selN);m.edges=m.edges.filter(e=>e.a!==selN&&e.b!==selN);m.lines.forEach(l=>(l.bs||[]).forEach(b=>{if(b.link===selN)b.link=''}))}else if(selE)m.edges=m.edges.filter(e=>e.id!==selE);else if(selL)m.lines=m.lines.filter(l=>l.id!==selL);else if(selB){const x=balOf(selB);if(x)x.l.bs=x.l.bs.filter(b=>b!==x.b)}else if(selF)m.frames=m.frames.filter(f=>f.id!==selF);clrSel();touch();drawMap();renderInsp()}
function layout(m,rootId){
  const ad={};m.nodes.forEach(n=>ad[n.id]=[]);m.edges.forEach(e=>{if(!e.dash&&ad[e.a]&&ad[e.b]){ad[e.a].push(e.b);ad[e.b].push(e.a)}});
  const root=m.nodes.find(n=>n.id===rootId)||m.nodes.find(n=>n.kind==='centro')||m.nodes[0];if(!root)return;
  const by=Object.fromEntries(m.nodes.map(n=>[n.id,n])),D=Object.fromEntries(m.nodes.map(n=>[n.id,dims(n)]));
  const kids={},dep={[root.id]:0},q=[root.id],seen=new Set([root.id]);
  while(q.length){const id=q.shift();kids[id]=[];for(const j of ad[id])if(!seen.has(j)){seen.add(j);kids[id].push(j);dep[j]=dep[id]+1;q.push(j)}}
  const mw=[];Object.keys(dep).forEach(id=>{mw[dep[id]]=Math.max(mw[dep[id]]||0,D[id].w)});
  const col=[root.x];for(let d=1;d<mw.length;d++)col[d]=col[d-1]+mw[d-1]/2+80+mw[d]/2;
  const memo={},hOf=id=>memo[id]??(memo[id]=kids[id].length?kids[id].reduce((a,k)=>a+hOf(k),0):D[id].h+20);
  const place=(id,top)=>{const n=by[id];n.x=col[dep[id]];if(!kids[id].length){n.y=top+hOf(id)/2;return}let t=top;for(const k of kids[id]){place(k,t);t+=hOf(k)}n.y=(by[kids[id][0]].y+by[kids[id].at(-1)].y)/2};
  const ry=root.y;place(root.id,0);const off=ry-root.y;seen.forEach(id=>by[id].y+=off);
  const rest=m.nodes.filter(n=>!seen.has(n.id));if(rest.length){const by2=Math.max(...[...seen].map(id=>by[id].y+D[id].h/2))+90;rest.forEach((n,i)=>{n.x=root.x+i*210;n.y=by2})}
}
function genMap(name){
  const m={id:nid(),name,nodes:[],edges:[]},add=(t,kind,ref)=>{const n={id:nid(),t,kind,ref:ref||'',x:0,y:0};m.nodes.push(n);return n},ln=(a,b,o)=>m.edges.push({id:nid(),a:a.id,b:b.id,label:'',...o});
  const root=add(P.title||'Mi obra','centro'),chars=[],cardNodes={};
  [['personaje','Personajes'],['lugar','Lugares'],['lore','Lore']].forEach(([k,l])=>{const cs=P.cards.filter(c=>c.kind===k);if(!cs.length)return;const g=add(l,'idea');ln(root,g);cs.forEach(c=>{const n=add(c.name,k,'c:'+c.id);cardNodes[c.id]=n;ln(g,n);if(k==='personaje')chars.push([c.name.toLowerCase().split(/\s+/)[0],n])})});
  if(P.chapters.length){const g=add(P.type==='cuento'?'Partes':'Capítulos','idea');ln(root,g);const ap=appear().byScene;P.chapters.forEach(c=>{const ch=add(c.title,'capitulo',P.simple?'s:'+c.scenes[0].id:'');ln(g,ch);c.scenes.forEach(s=>{if(P.simple){const pv=(s.pov||'').toLowerCase().split(/\s+/)[0];const hit=pv&&chars.find(x=>x[0]===pv);if(hit)ln(ch,hit[1],{label:'PdV',dash:true});(ap[s.id]||[]).forEach(cid=>{const cn=cardNodes[cid];if(cn&&!(hit&&hit[1]===cn))ln(ch,cn,{dash:true})});return}const n=add(s.title,'escena','s:'+s.id);ln(ch,n);const pv=(s.pov||'').toLowerCase().split(/\s+/)[0];const hit=pv&&chars.find(x=>x[0]===pv);if(hit)ln(n,hit[1],{label:'PdV',dash:true});(ap[s.id]||[]).forEach(cid=>{const cn=cardNodes[cid];if(cn&&!(hit&&hit[1]===cn))ln(n,cn,{dash:true})})})})}
  layout(m,root.id);return m;
}
function ensureMaps(){if(!Array.isArray(P.maps)||!P.maps.length){P.maps=[genMap('Mapa de la obra')];P.curMap=P.maps[0].id}if(!P.maps.some(m=>m.id===P.curMap))P.curMap=P.maps[0].id}
function renderInsp(){
  const m=ML(M()),el=$('#insp');
  if(selL){const l=lineOf(selL);if(!l){selL=null;return renderInsp()}const n=(l.bs||[]).length;
    el.innerHTML=`<h3>Línea de tiempo</h3><p class="note" style="margin:0">${n} globito${n===1?'':'s'}. Doble clic sobre la línea para sumar otro; arrastralos para moverlos.</p><label>Orientación</label><div class="chips"><button data-dir="h" class="${l.dir!=='v'?'on':''}">Horizontal</button><button data-dir="v" class="${l.dir==='v'?'on':''}">Vertical</button></div><div class="acts"><button data-x="addb">+ Globito</button><button data-x="del">Borrar línea</button></div>`;return}
  if(selB){const x=balOf(selB);if(!x||!x.b){selB=null;return renderInsp()}const b=x.b;
    el.innerHTML=`<h3>Globito</h3><label for="ibL">Cuándo</label><input id="ibL" value="${esc(b.label)}" placeholder="Mayo de 1810, tres años antes, la noche del incendio…"><label for="ibK">Unir a</label><select id="ibK"><option value="">Nada</option>${m.nodes.map(nn=>`<option value="${nn.id}" ${b.link===nn.id?'selected':''}>${esc(txtOf(nn)||'Sin texto')}</option>`).join('')}</select><div class="acts"><button data-x="del">Borrar globito</button></div>`;return}
  if(selF){const f=frameOf(selF);if(!f){selF=null;return renderInsp()}
    el.innerHTML=`<h3>Recuadro</h3><label for="ifL">Nombre</label><input id="ifL" value="${esc(f.label)}" placeholder="La semana del reloj, los hermanos, 1810…"><label>Color</label><div class="chips">${Object.keys(FC).map(k=>`<button data-fcol="${k}" aria-label="Color" style="width:34px;min-height:34px;padding:0;background:${FC[k][1]};border:${f.color===k?'3px solid '+FC[k][0]:'1px solid var(--line)'}"></button>`).join('')}</div><p class="note">Arrastrá la etiqueta para moverlo con todo lo que tiene adentro, y la esquina coral para agrandarlo.</p><div class="acts"><button data-x="del">Borrar recuadro</button></div>`;return}
  if(selN){const n=nodeOf(selN);if(!n){selN=null;return renderInsp()}
    const opts=P.chapters.map(c=>`<optgroup label="${esc(c.title)}">${c.scenes.map(s=>`<option value="s:${s.id}" ${n.ref==='s:'+s.id?'selected':''}>${esc(s.title||'Sin título')}</option>`).join('')}</optgroup>`).join('')+(P.cards.length?`<optgroup label="Fichas">${P.cards.map(c=>`<option value="c:${c.id}" ${n.ref==='c:'+c.id?'selected':''}>${esc(c.name||'Sin nombre')} (${KINDS[c.kind]})</option>`).join('')}</optgroup>`:'');
    el.innerHTML=`<h3>Nodo</h3><label for="iT">Texto${n.ref?' (también renombra lo vinculado)':''}</label><textarea id="iT" rows="2">${esc(txtOf(n))}</textarea><div class="two"><div><label for="iK">Tipo</label><select id="iK">${Object.entries(KN).map(([v,l])=>`<option value="${v}" ${n.kind===v?'selected':''}>${l}</option>`).join('')}</select></div><div><label for="iR">Vínculo</label><select id="iR"><option value="">Ninguno</option>${opts}</select></div></div>
    <div class="acts"><button data-x="child">+ Hijo <small>(Tab)</small></button><button data-x="sib">+ Hermano <small>(Enter)</small></button><button data-x="conn">${pend?'Elegí el destino…':'Conectar con…'}</button><button data-x="open" ${n.ref&&refT(n.ref)?'':'disabled'}>Abrir vínculo</button><button data-x="lay">Ordenar desde acá</button><button data-x="del">Borrar nodo</button></div>`}
  else if(selE){const e=m.edges.find(x=>x.id===selE);if(!e){selE=null;return renderInsp()}
    el.innerHTML=`<h3>Conexión</h3><p class="note" style="margin:0">${esc(txtOf(nodeOf(e.a)||{}))} → ${esc(txtOf(nodeOf(e.b)||{}))}</p><label for="iL">Etiqueta</label><input id="iL" value="${esc(e.label)}" placeholder="por ejemplo: traiciona a, vive en"><label class="chk"><input type="checkbox" id="iD" ${e.dash?'checked':''}> Línea punteada (relación, no rama)</label><div class="acts"><button data-x="del">Borrar conexión</button></div>`}
  else el.innerHTML=`<h3>${esc(m.name)}</h3><label for="iM">Nombre del mapa</label><input id="iM" value="${esc(m.name)}"><ul><li>Doble clic en el fondo: idea nueva</li><li>Arrastrá el punto coral de un nodo hasta otro para conectarlos</li><li>Tab crea un hijo, Enter un hermano</li><li>Vinculá nodos a escenas o fichas: el nombre queda sincronizado</li><li>Arrastrá el fondo para moverte, rueda para zoom</li><li>Las formas de personaje, lugar y lore son tus fichas: renombrarlas acá las renombra en todos lados</li></ul>${P.cards.length?`<label for="iAddC">Agregar una ficha existente</label><div class="vnew"><select id="iAddC">${P.cards.map(c=>`<option value="${c.id}">${esc(c.name||'Sin nombre')} (${KINDS[c.kind]})</option>`).join('')}</select><button data-x="addcard">Agregar</button></div>`:''}<p class="note">${m.nodes.length} nodos · ${m.edges.length} conexiones · ${m.lines.length} líneas · ${m.frames.length} recuadros</p>`;
}
function renderMapUI(fit){$('#mSel').innerHTML=P.maps.map(m=>`<option value="${m.id}" ${m.id===P.curMap?'selected':''}>${esc(m.name)}</option>`).join('');renderInsp();if(fit)requestAnimationFrame(fitMap);else drawMap()}
let mapSeen=false;
function openRef(ref){const [t,id]=ref.split(':');if(t==='s')select(id);else openCard(id)}

const svg=$('#msvg');
const toW=e=>{const r=svg.getBoundingClientRect();return{x:(e.clientX-r.left-V.x)/V.k,y:(e.clientY-r.top-V.y)/V.k}};
const projPos=(l,p)=>Math.max(0,Math.min(l.len,Math.round(l.dir==='v'?p.y-l.y:p.x-l.x)));
const inF=(f,x,y)=>x>=f.x&&x<=f.x+f.w&&y>=f.y&&y<=f.y+f.h;
svg.addEventListener('pointerdown',e=>{
  const T=s=>e.target.closest(s),h=T('[data-h]'),g=T('[data-n]'),tb=T('[data-tb]'),tlh=T('[data-tlh]'),tl=T('[data-tl]'),ed=T('[data-e]'),fc=T('[data-fc]'),ft=T('[data-ft]');
  const now=Date.now(),key=g?g.dataset.n:tb?tb.dataset.tb:tl?'tl'+tl.dataset.tl:h?'h':ed?'e':ft?'f':'bg',dbl=last.id===key&&now-last.t<350;last={id:key,t:now};
  try{svg.setPointerCapture(e.pointerId);svg.focus({preventScroll:true})}catch(err){}
  const p=toW(e),m=ML(M());
  if(h){act={t:'conn',a:h.dataset.h};conn={a:h.dataset.h,p};return}
  if(g){const id=g.dataset.n;if(pend&&pend!==id){const a=pend;pend=null;link(a,id);renderInsp();act=null;return}
    if(selN!==id){clrSel();selN=id;renderInsp()}const n=nodeOf(id);act={t:'drag',n,dx:p.x-n.x,dy:p.y-n.y,moved:false};drawMap();
    if(dbl)setTimeout(()=>{const t=$('#iT');if(t){t.focus();t.select()}},0);return}
  if(tb){const x=balOf(tb.dataset.tb);if(selB!==tb.dataset.tb){clrSel();selB=tb.dataset.tb;renderInsp()}act={t:'bal',l:x.l,b:x.b,moved:false};drawMap();if(dbl)setTimeout(()=>{const i=$('#ibL');if(i){i.focus();i.select()}},0);return}
  if(tlh){const l=lineOf(tlh.dataset.tlh);act={t:'tlh',l,moved:false};return}
  if(tl){const l=lineOf(tl.dataset.tl);if(dbl){mSnap();const b={id:nid(),pos:projPos(l,p),label:'',link:''};(l.bs=l.bs||[]).push(b);clrSel();selB=l.id+':'+b.id;touch();drawMap();renderInsp();setTimeout(()=>{const i=$('#ibL');if(i)i.focus()},0);act=null;return}
    if(selL!==l.id){clrSel();selL=l.id;renderInsp()}act={t:'tl',l,dx:p.x-l.x,dy:p.y-l.y,moved:false};drawMap();return}
  if(ed){clrSel();selE=ed.dataset.e;pend=null;act=null;renderInsp();drawMap();return}
  if(fc){const f=frameOf(fc.dataset.fc);act={t:'fc',f,moved:false};return}
  if(ft){const f=frameOf(ft.dataset.ft);if(selF!==f.id){clrSel();selF=f.id;renderInsp()}
    const ns=m.nodes.filter(n=>inF(f,n.x,n.y)).map(n=>({o:n,x:n.x,y:n.y})),ls=m.lines.filter(l=>inF(f,l.x,l.y)).map(l=>({o:l,x:l.x,y:l.y})),fs=m.frames.filter(o=>o!==f&&inF(f,o.x,o.y)&&inF(f,o.x+o.w,o.y+o.h)).map(o=>({o,x:o.x,y:o.y}));
    act={t:'ft',f,sx:p.x,sy:p.y,fx:f.x,fy:f.y,items:[...ns,...ls,...fs],moved:false};drawMap();if(dbl)setTimeout(()=>{const i=$('#ifL');if(i){i.focus();i.select()}},0);return}
  pend=null;if(dbl){addNode(p.x,p.y);act=null;return}
  if(selN||selE||selL||selB||selF){clrSel();renderInsp()}act={t:'pan',sx:e.clientX,sy:e.clientY,vx:V.x,vy:V.y};drawMap();
});
svg.addEventListener('pointermove',e=>{if(!act)return;const a=act;
  if(a.t==='pan'){V.x=a.vx+e.clientX-a.sx;V.y=a.vy+e.clientY-a.sy;drawMap();return}
  const p=toW(e);if(a.t==='conn'){conn.p=p;drawMap();return}
  if(!a.moved){if(a.t==='drag'&&Math.hypot(p.x-a.dx-a.n.x,p.y-a.dy-a.n.y)<3)return;mSnap();a.moved=true}
  if(a.t==='drag'){a.n.x=Math.round(p.x-a.dx);a.n.y=Math.round(p.y-a.dy)}
  else if(a.t==='bal')a.b.pos=projPos(a.l,p);
  else if(a.t==='tl'){a.l.x=Math.round(p.x-a.dx);a.l.y=Math.round(p.y-a.dy)}
  else if(a.t==='tlh'){a.l.len=Math.max(120,Math.round(a.l.dir==='v'?p.y-a.l.y:p.x-a.l.x));(a.l.bs||[]).forEach(b=>{b.pos=Math.min(b.pos,a.l.len)})}
  else if(a.t==='fc'){a.f.w=Math.max(100,Math.round(p.x-a.f.x));a.f.h=Math.max(70,Math.round(p.y-a.f.y))}
  else if(a.t==='ft'){const dx=Math.round(p.x-a.sx),dy=Math.round(p.y-a.sy);a.f.x=a.fx+dx;a.f.y=a.fy+dy;a.items.forEach(it=>{it.o.x=it.x+dx;it.o.y=it.y+dy})}
  drawMap()});
svg.addEventListener('pointerup',e=>{const a=act;act=null;if(!a)return;
  if(a.t==='conn'){const el=document.elementFromPoint(e.clientX,e.clientY),g=el&&el.closest&&el.closest('[data-n]');conn=null;if(g&&g.dataset.n!==a.a)link(a.a,g.dataset.n);else drawMap();return}
  if(a.moved)touch()});
svg.addEventListener('pointercancel',()=>{act=null;conn=null;drawMap()});
svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,k=Math.max(.25,Math.min(2.5,V.k*Math.exp(-e.deltaY*.0015)));V.x=px-(px-V.x)*k/V.k;V.y=py-(py-V.y)*k/V.k;V.k=k;drawMap()},{passive:false});
const zoomBy=f=>{const W=svg.clientWidth/2,H=svg.clientHeight/2,k=Math.max(.25,Math.min(2.5,V.k*f));V.x=W-(W-V.x)*k/V.k;V.y=H-(H-V.y)*k/V.k;V.k=k;drawMap()};
$('#zIn').onclick=()=>zoomBy(1.25);$('#zOut').onclick=()=>zoomBy(.8);$('#zFit').onclick=fitMap;
new ResizeObserver(()=>drawMap()).observe(svg);

$('#insp').addEventListener('input',e=>{const m=M(),id=e.target.id;
  if(id==='iT'){const n=nodeOf(selN),r=refT(n.ref);if(r){r.o[r.k]=e.target.value;if(P.simple&&n.ref.startsWith('s:')){const f=findScene(n.ref.slice(2));if(f)f.c.title=e.target.value}renderBinder();renderCards()}else n.t=e.target.value}
  else if(id==='iL'){m.edges.find(x=>x.id===selE).label=e.target.value}
  else if(id==='iM'){m.name=e.target.value;$('#mSel').selectedOptions[0].textContent=m.name||'Sin nombre'}
  else if(id==='ibL'){const x=balOf(selB);if(x)x.b.label=e.target.value}
  else if(id==='ifL'){const f=frameOf(selF);if(f)f.label=e.target.value}
  else return;touch();drawMap()});
$('#insp').addEventListener('change',e=>{const m=M(),id=e.target.id;mSnap();
  if(id==='iK'){const n=nodeOf(selN);n.kind=e.target.value;const r=n.ref&&n.ref.startsWith('c:')&&P.cards.find(c=>c.id===n.ref.slice(2));if(r&&KINDS[n.kind]){r.kind=n.kind;appearMemo=null;renderCards()}}
  else if(id==='ibK'){const x=balOf(selB);if(x)x.b.link=e.target.value}
  else if(id==='iAddC'){mUndo.pop();return}
  else if(id==='iR'){const n=nodeOf(selN),cur=txtOf(n);n.ref=e.target.value;const r=refT(n.ref);if(r){n.t=cur;if(n.kind==='idea')n.kind=r.kind}else n.t=cur;renderInsp()}
  else if(id==='iD')m.edges.find(x=>x.id===selE).dash=e.target.checked;
  else{mUndo.pop();return}touch();drawMap()});
$('#insp').addEventListener('keydown',e=>{if(e.target.id!=='iT')return;if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();addChild(selN)}else if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addSib(selN)}});
$('#insp').addEventListener('click',e=>{
  const dirB=e.target.closest('[data-dir]');if(dirB){const l=lineOf(selL);if(l&&l.dir!==dirB.dataset.dir){mSnap();l.dir=dirB.dataset.dir;touch();drawMap();renderInsp()}return}
  const colB=e.target.closest('[data-fcol]');if(colB){const f=frameOf(selF);if(f){mSnap();f.color=colB.dataset.fcol;touch();drawMap();renderInsp()}return}
  const b=e.target.closest('[data-x]');if(!b)return;const x=b.dataset.x;
  if(x==='addb'){const l=lineOf(selL);if(!l)return;mSnap();const ps=(l.bs||[]).map(z=>z.pos),pos=ps.length?Math.min(l.len,Math.max(...ps)+90):Math.round(l.len/2);const nb={id:nid(),pos,label:'',link:''};(l.bs=l.bs||[]).push(nb);clrSel();selB=l.id+':'+nb.id;touch();drawMap();renderInsp();setTimeout(()=>{const i=$('#ibL');if(i)i.focus()},0);return}
  if(x==='addcard'){const c=P.cards.find(z=>z.id===$('#iAddC').value);if(!c)return;const v=mViewC();mSnap();const n={id:nid(),t:c.name,kind:c.kind,ref:'c:'+c.id,x:Math.round(v.x),y:Math.round(v.y)};M().nodes.push(n);clrSel();selN=n.id;touch();drawMap();renderInsp();return}
  if(x==='child')addChild(selN);if(x==='sib')addSib(selN);if(x==='conn'){pend=pend?null:selN;renderInsp()}if(x==='open'){const n=nodeOf(selN);if(n.ref)openRef(n.ref)}
  if(x==='lay'){mSnap();layout(M(),selN);touch();fitMap()}if(x==='del')delSel()});
$('#mSel').addEventListener('change',e=>{P.curMap=e.target.value;clrSel();pend=null;mUndo=[];touch();renderMapUI(true)});
$('#mNew').onclick=()=>{const m={id:nid(),name:'Mapa '+(P.maps.length+1),nodes:[{id:nid(),t:'Idea central',kind:'centro',ref:'',x:0,y:0}],edges:[]};P.maps.push(m);P.curMap=m.id;selN=m.nodes[0].id;selE=null;mUndo=[];touch();renderMapUI(true);setTimeout(()=>{const t=$('#iT');if(t){t.focus();t.select()}},60)};
$('#mGen').onclick=e=>busy(e.currentTarget,'Generando mapa…',async()=>{const m=genMap('Obra al '+new Date().toLocaleDateString('es-AR'));P.maps.push(m);P.curMap=m.id;selN=selE=null;mUndo=[];touch();renderMapUI(true)});
$('#mLay').onclick=e=>busy(e.currentTarget,'Ordenando…',async()=>{mSnap();layout(M(),selN);touch();fitMap()});
$('#mUndo').onclick=mUndoDo;
$('#mDel').onclick=e=>confirm2(e.currentTarget,()=>{P.maps=P.maps.filter(m=>m.id!==P.curMap);ensureMaps();selN=selE=null;mUndo=[];touch();renderMapUI(true)});
$('#mSvg').onclick=async()=>{const m=M(),b=bbox(m),pad=40,str=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x-pad} ${b.y-pad} ${b.w+pad*2} ${b.h+pad*2}" width="${Math.round(b.w+pad*2)}" height="${Math.round(b.h+pad*2)}"><rect x="${b.x-pad}" y="${b.y-pad}" width="${b.w+pad*2}" height="${b.h+pad*2}" fill="#ffffff"/>${mapInner(true)}</svg>`;
  const el=$('#insp');try{if(!dl)throw{code:'unavailable'};await dl.save({filename:(m.name||'mapa').replace(/[^\p{L}\p{N} _-]/gu,'').trim()+'.svg',data:str})}catch(err){if(err&&err.code==='declined')return;try{await navigator.clipboard.writeText(str);el.insertAdjacentHTML('beforeend','<p class="note">Las descargas no están disponibles acá: copié el SVG al portapapeles.</p>')}catch(e2){el.insertAdjacentHTML('beforeend','<p class="note">No se pudo exportar el mapa en esta vista.</p>')}}};
document.addEventListener('keydown',e=>{if(!isView('map')||(e.target.closest&&e.target.closest('input,textarea,select,dialog,button')))return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();mUndoDo();return}
  if(e.key==='Tab'&&selN){e.preventDefault();addChild(selN)}else if(e.key==='Enter'&&selN){e.preventDefault();addSib(selN)}else if((e.key==='Delete'||e.key==='Backspace')&&(selN||selE||selL||selB||selF)){e.preventDefault();delSel()}else if(e.key==='Escape'){clrSel();pend=null;renderInsp();drawMap()}});


const mViewC=()=>{const W=svg.clientWidth||900,H=svg.clientHeight||600;return{x:(W*(W>700?.4:.5)-V.x)/V.k,y:(H*.42-V.y)/V.k}};
const KNEW={personaje:'Personaje nuevo',lugar:'Lugar nuevo',lore:'Lore nuevo'};
function mAddKind(kind){const v=mViewC();mSnap();const c={id:nid(),kind,name:KNEW[kind],alias:'',role:'',notes:''};P.cards.push(c);appearMemo=null;
  const n={id:nid(),t:c.name,kind,ref:'c:'+c.id,x:Math.round(v.x+(Math.random()*60-30)),y:Math.round(v.y+(Math.random()*60-30))};M().nodes.push(n);clrSel();selN=n.id;touch();drawMap();renderInsp();renderCards();setTimeout(()=>{const t=$('#iT');if(t){t.focus();t.select()}},0)}
$('#mAddP').onclick=()=>mAddKind('personaje');$('#mAddL').onclick=()=>mAddKind('lugar');$('#mAddO').onclick=()=>mAddKind('lore');
$('#mAddT').onclick=()=>{const v=mViewC(),m=ML(M());mSnap();const l={id:nid(),x:Math.round(v.x-260),y:Math.round(v.y+120),len:520,dir:'h',bs:[]};m.lines.push(l);clrSel();selL=l.id;touch();drawMap();renderInsp()};
$('#mAddF').onclick=()=>{const v=mViewC(),m=ML(M());mSnap();const f={id:nid(),x:Math.round(v.x-200),y:Math.round(v.y-140),w:400,h:280,label:'Período',color:'pur'};m.frames.push(f);clrSel();selF=f.id;touch();drawMap();renderInsp();setTimeout(()=>{const i=$('#ifL');if(i){i.focus();i.select()}},0)};
