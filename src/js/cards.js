'use strict';
/* ---------- cards as a map: characters, places and lore, fed by the text ---------- */
const CKC={personaje:['#fde4de','#f2553d'],lugar:['#e2e9fb','#4a78e0'],lore:['#efe6fa','#8b62c9']};
const KORD=['personaje','lugar','lore'];
let CV={x:0,y:0,k:1},cSel=null,cRel=null,cAct=null,cConn=null,cPend=null,cSeenP=null,cUndo=[],cLast={id:'',t:0},cKind='all',cAISugg=[],cAIBusy=false;
const cCard=id=>P.cards.find(c=>c.id===id);
const cVis=c=>cKind==='all'||c.kind===cKind;
function cDims(c){cx.font='600 15px Inter, system-ui, sans-serif';const nm=trunc(c.name||'Sin nombre',26);return{nm,w:Math.max(120,Math.min(230,cx.measureText(nm).width+44)),h:c.role?60:44}}
function cooc(){const m=new Map();for(const ids of Object.values(appear().byScene))for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const k=ids[i]<ids[j]?ids[i]+'|'+ids[j]:ids[j]+'|'+ids[i];m.set(k,(m.get(k)||0)+1)}return m}
function cPlace(){KORD.forEach((k,ki)=>{let n=P.cards.filter(c=>c.kind===k&&c.x!==undefined).length;P.cards.filter(c=>c.kind===k&&(c.x===undefined||c.y===undefined)).forEach(c=>{c.x=ki*760+(n%3)*230;c.y=Math.floor(n/3)*130;n++})})}
function cLayout(){
  const ns=P.cards.filter(cVis);if(ns.length<2)return;const co=cooc(),idx=new Map(ns.map((c,i)=>[c.id,i]));
  const pos=ns.map(c=>({x:c.x||0,y:c.y||0,vx:0,vy:0})),springs=[];
  (P.rels||[]).forEach(r=>{if(idx.has(r.a)&&idx.has(r.b))springs.push([idx.get(r.a),idx.get(r.b),230,.06])});
  co.forEach((n,k)=>{const [a,b]=k.split('|');if(idx.has(a)&&idx.has(b))springs.push([idx.get(a),idx.get(b),300,Math.min(.05,.008*n)])});
  const cxk=c=>KORD.indexOf(c.kind)*700;
  for(let it=0;it<350;it++){
    for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){const dx=pos[j].x-pos[i].x,dy=pos[j].y-pos[i].y,d2=Math.max(400,dx*dx+dy*dy),f=60000/d2,d=Math.sqrt(d2);pos[i].vx-=f*dx/d;pos[i].vy-=f*dy/d;pos[j].vx+=f*dx/d;pos[j].vy+=f*dy/d}
    for(const [a,b,L,k] of springs){const dx=pos[b].x-pos[a].x,dy=pos[b].y-pos[a].y,d=Math.max(1,Math.hypot(dx,dy)),f=k*(d-L);pos[a].vx+=f*dx/d;pos[a].vy+=f*dy/d;pos[b].vx-=f*dx/d;pos[b].vy-=f*dy/d}
    ns.forEach((c,i)=>{pos[i].vx+=(cxk(c)-pos[i].x)*.004;pos[i].vy+=(0-pos[i].y)*.004;pos[i].x+=Math.max(-40,Math.min(40,pos[i].vx));pos[i].y+=Math.max(-40,Math.min(40,pos[i].vy));pos[i].vx*=.6;pos[i].vy*=.6})}
  ns.forEach((c,i)=>{c.x=Math.round(pos[i].x);c.y=Math.round(pos[i].y)});
}
function drawCM(){
  if(!isView('cards'))return;const s=$('#csvg'),ap=appear(),vis=P.cards.filter(cVis),vid=new Set(vis.map(c=>c.id));let g='';
  if($('#cCo').checked){const mx=Math.max(1,...P.chapters.map(()=>1));cooc().forEach((n,k)=>{const [a,b]=k.split('|');if(!vid.has(a)||!vid.has(b))return;const A=cCard(a),B=cCard(b);
    g+=`<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="var(--mut)" stroke-opacity=".35" stroke-width="${1+Math.min(n,8)*.7}" stroke-dasharray="2 6" stroke-linecap="round"><title>Aparecen juntos en ${n} ${n>1?U().many:U().one}</title></line>`})}
  (P.rels||[]).forEach(r=>{if(!vid.has(r.a)||!vid.has(r.b))return;const A=cCard(r.a),B=cCard(r.b),sel=cRel===r.id,mx=(A.x+B.x)/2,my=(A.y+B.y)/2;
    g+=`<g data-r="${r.id}"><line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="transparent" stroke-width="16"/><line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${sel?'#f2553d':'#9093a3'}" stroke-width="${sel?2.6:1.8}"/>`;
    if(r.label){cx.font='12px Inter, sans-serif';const lw=cx.measureText(r.label).width+16;g+=`<rect x="${mx-lw/2}" y="${my-11}" width="${lw}" height="22" rx="11" fill="var(--bg)" stroke="${sel?'#f2553d':'#d0cdc6'}"/><text x="${mx}" y="${my+4}" text-anchor="middle" font-size="12" fill="var(--ink)" font-family="Inter, sans-serif">${esc(r.label)}</text>`}
    g+='</g>'});
  if(cConn){const a=cCard(cConn.a);if(a)g+=`<line x1="${a.x}" y1="${a.y}" x2="${cConn.p.x}" y2="${cConn.p.y}" stroke="#f2553d" stroke-width="2" stroke-dasharray="6 5"/>`}
  vis.forEach(c=>{const {nm,w,h}=cDims(c),col=CKC[c.kind]||CKC.personaje,sel=cSel===c.id,n=(ap.byCard[c.id]||[]).length;
    g+=`<g data-cn="${c.id}" transform="translate(${c.x},${c.y})"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="12" fill="${col[0]}" stroke="${sel?'#f2553d':col[1]}" stroke-width="${sel?3:1.4}"/>`+
      `<text x="0" y="${c.role?-4:5}" text-anchor="middle" font-size="15" font-weight="600" fill="#1b1c22" font-family="Inter, system-ui, sans-serif">${esc(nm)}</text>`+
      (c.role?`<text x="0" y="15" text-anchor="middle" font-size="12" fill="#55565f" font-family="Inter, sans-serif">${esc(trunc(c.role,30))}</text>`:'')+
      `<rect x="${w/2-34}" y="${-h/2-10}" width="38" height="20" rx="10" fill="${n?col[1]:'#b8b6b0'}"/><text x="${w/2-15}" y="${-h/2+4}" text-anchor="middle" font-size="11" font-weight="600" fill="#fff" font-family="Inter, sans-serif">${n}</text>`+
      (sel?`<circle data-ch="${c.id}" cx="${w/2}" cy="0" r="9" fill="#f2553d" stroke="#ffffff" stroke-width="2"/>`:'')+'</g>'});
  s.innerHTML=`<g transform="translate(${CV.x},${CV.y}) scale(${CV.k})">${g}</g>`;
  $('#cempty').hidden=P.cards.length>0;
}
function fitCM(){const s=$('#csvg'),W=s.clientWidth,H=s.clientHeight;if(!W){drawCM();return}const vis=P.cards.filter(cVis);const side=W>700?310:0,bot=W<=700?H*.44:0,aw=W-side-40,ah=H-bot-40;
  if(!vis.length){CV={x:aw/2+20,y:ah/2+20,k:1};drawCM();return}
  let a=1e9,b=1e9,c=-1e9,d=-1e9;vis.forEach(n=>{const q=cDims(n);a=Math.min(a,n.x-q.w/2);b=Math.min(b,n.y-q.h/2-12);c=Math.max(c,n.x+q.w/2);d=Math.max(d,n.y+q.h/2)});
  const k=Math.max(.25,Math.min(1.3,aw/(c-a),ah/(d-b)));CV={k,x:20+(aw-(c-a)*k)/2-a*k,y:20+(ah-(d-b)*k)/2-b*k};drawCM()}
function cSnap(){cUndo.push(JSON.stringify({cards:P.cards,rels:P.rels}));if(cUndo.length>40)cUndo.shift()}
function cUndoDo(){const s=cUndo.pop();if(!s)return;const o=JSON.parse(s);P.cards=o.cards;P.rels=o.rels;cSel=cRel=null;appearMemo=null;touch();drawCM();renderCInsp();renderCards()}
function cNew(x,y,o={}){cSnap();const c={id:nid(),kind:o.kind||'personaje',name:o.name||'',alias:o.alias||'',role:o.role||'',notes:o.notes||'',x:Math.round(x),y:Math.round(y)};P.cards.push(c);appearMemo=null;cSel=c.id;cRel=null;touch();drawCM();renderCInsp();renderCards();if(!o.name)setTimeout(()=>{const i=$('#ciName');if(i)i.focus()},0);return c}
function cLink(a,b){if(a===b||(P.rels||[]).some(r=>(r.a===a&&r.b===b)||(r.a===b&&r.b===a)))return;cSnap();const r={id:nid(),a,b,label:''};P.rels.push(r);cSel=null;cRel=r.id;touch();drawCM();renderCInsp();setTimeout(()=>{const i=$('#crL');if(i)i.focus()},0)}
const cViewC=()=>{const s=$('#csvg'),W=s.clientWidth||900,H=s.clientHeight||600;return{x:(W*(W>700?.4:.5)-CV.x)/CV.k,y:(H*.45-CV.y)/CV.k}};

/* names that show up in the text but have no card yet */
const STOP=new Set('El La Los Las Lo Le Les Un Una Unos Unas Y E O U Pero Que Qué Cuando Cuándo Donde Dónde Como Cómo Si Sí No Ni Por Para Con Sin En De Del Al A Ante Tras Mi Tu Su Sus Mis Tus Yo Él Ella Ellos Ellas Usted Ustedes Nosotros Nosotras Vos Me Te Se Nos Este Esta Esto Estos Estas Ese Esa Eso Esos Esas Aquel Aquella Ahí Allí Allá Aquí Acá Entonces Después Antes Luego Mientras Ya Todo Todos Toda Todas Nada Nadie Alguien Algo Hay Había Era Fue Es Son Está Estaba Señor Señora Don Doña Capítulo Quién Quien Cuál Cual Porque Pues Bueno Claro Sólo Solo Tal Tan Tanto Muy Más Menos Otra Otro Otros Cada Algún Alguna Ningún Ninguna Siempre Nunca Hoy Ayer Mañana Ahora Así Aunque Hasta Desde Sobre Bajo Entre Hacia Según Durante Mediante Gracias Dios'.split(' '));
function cSuggest(){
  const known=new Set(P.cards.flatMap(c=>cardTerms(c).map(t=>t.toLowerCase())).concat(P.cards.map(c=>(c.name||'').toLowerCase())));
  const ign=new Set((P.ignored||[]).map(x=>x.toLowerCase())),cnt=new Map();
  const add=(name,mid,sid)=>{if(name.length<3)return;const k=name.toLowerCase();if(known.has(k)||ign.has(k))return;const o=cnt.get(k)||{name,n:0,mid:0,sc:new Set()};o.n++;if(mid)o.mid++;o.sc.add(sid);cnt.set(k,o)};
  for(const {s} of allScenes())for(const para of parasOf(T[s.id])){
    const toks=[...para.matchAll(/[\p{L}][\p{L}'’-]*/gu)].map(m=>({w:m[0],i:m.index}));let seq=[],start=false;
    const flush=()=>{while(seq.length&&STOP.has(seq[0].w)){seq.shift();start=false}while(seq.length&&/^(de|del|la|las|los|y)$/.test(seq[seq.length-1].w))seq.pop();if(seq.length){const nm=seq.map(x=>x.w).join(' ');if(!(seq.length===1&&STOP.has(nm)))add(nm,!start,s.id)}seq=[]};
    toks.forEach((t,k)=>{const prev=toks[k-1],gap=prev?para.slice(prev.i+prev.w.length,t.i):para.slice(0,t.i),boundary=!prev||/[.!?¡¿—:«"“…]/.test(gap);
      const cap=/^\p{Lu}/u.test(t.w),conn=/^(de|del|la|las|los|y)$/.test(t.w)&&seq.length&&!/[,;.]/.test(gap);
      if(cap&&seq.length&&!/[,;.!?¡¿—:«"“…()]/.test(gap))seq.push(t);
      else if(conn)seq.push(t);
      else{flush();if(cap){seq=[t];start=boundary}}});
    flush()}
  return[...cnt.values()].filter(o=>o.n>=2&&o.mid>=1).sort((a,b)=>b.n-a.n).slice(0,15);
}

function renderCInsp(){
  const el=$('#cinsp'),c=cSel&&cCard(cSel),r=cRel&&(P.rels||[]).find(x=>x.id===cRel),ap=appear();
  if(c){const sc=(ap.byCard[c.id]||[]).map(findScene).filter(Boolean),rels=(P.rels||[]).filter(x=>x.a===c.id||x.b===c.id);
    el.innerHTML=`<h3>${esc(c.name||'Ficha nueva')}</h3>
    <div class="stat2">${sc.length?`${fmt(ap.count[c.id]||0)} menciones en ${sc.length} ${sc.length>1?U().many:U().one} · primera vez en ${esc(whereOf(sc[0].c,sc[0].s))}`:'Todavía no aparece en el texto.'}</div>
    <label for="ciName">Nombre</label><input id="ciName" data-f="name" value="${esc(c.name)}">
    <label for="ciAl">También llamado</label><input id="ciAl" data-f="alias" value="${esc(c.alias)}" placeholder="apodos, títulos, separados por comas">
    <div class="two"><div><label for="ciK">Tipo</label><select id="ciK" data-f="kind">${Object.entries(KINDS).map(([v,l])=>`<option value="${v}" ${c.kind===v?'selected':''}>${l}</option>`).join('')}</select></div><div><label for="ciR">Rol</label><input id="ciR" data-f="role" value="${esc(c.role)}"></div></div>
    <label for="ciN">Notas</label><textarea id="ciN" data-f="notes" rows="5">${esc(c.notes)}</textarea>
    ${rels.length?`<label>Relaciones</label><div class="links">${rels.map(x=>{const o=cCard(x.a===c.id?x.b:x.a);return`<button data-rel="${x.id}">${x.a===c.id?'':'← '}${esc(x.label||'(sin etiqueta)')} ${x.a===c.id?'→ ':'· '}${esc(o?o.name:'')}</button>`}).join('')}</div>`:''}
    ${sc.length?`<label>Aparece en</label><div class="links">${sc.slice(0,12).map(f=>`<button data-go="${f.s.id}">${esc(whereOf(f.c,f.s))}</button>`).join('')}${sc.length>12?`<span class="note" style="margin:0">y ${sc.length-12} más</span>`:''}</div>`:''}
    <div class="acts"><button data-x="conn">${cPend?'Elegí con quién…':'Conectar con…'}</button>${SAMPLE?`<button data-x="ai" ${sc.length?'':'disabled'} title="${sc.length?'':'Primero tiene que aparecer en el texto'}">Completar con Claude</button>`:''}<button data-x="del">Borrar ficha</button></div><div id="ciMsg" class="note"></div>`;return}
  if(r){const A=cCard(r.a),B=cCard(r.b);el.innerHTML=`<h3>Relación</h3><p class="note" style="margin:0">${esc(A?A.name:'')} → ${esc(B?B.name:'')}</p><label for="crL">Cómo se relacionan</label><input id="crL" value="${esc(r.label)}" placeholder="hermano de, le debe dinero, la traiciona…"><div class="acts"><button data-x="flip">Invertir</button><button data-x="rdel">Borrar relación</button></div>`;return}
  const sg=cSuggest();
  el.innerHTML=`<h3>Fichas</h3><label>Sugeridas por el texto</label>${sg.length?'<div class="sug">'+sg.map(o=>`<div class="sg" data-name="${esc(o.name)}"><b>${esc(o.name)}</b><small>${o.n} menciones en ${o.sc.size} ${o.sc.size>1?U().many:U().one}</small><div class="acts2"><button data-mk="personaje">+ Personaje</button><button data-mk="lugar">+ Lugar</button><button data-mk="lore">+ Lore</button><button data-ign>Ignorar</button></div></div>`).join('')+'</div>':'<p class="note" style="margin:0">No encontré nombres nuevos que se repitan en el texto.</p>'}
  ${cAISugg.length?'<label>Detectadas por Claude</label><div class="sug">'+cAISugg.map((o,i)=>`<div class="sg"><b>${esc(o.name)}</b><small>${KINDS[o.kind]||'Personaje'}${o.role?' · '+esc(o.role):''}</small>${o.notes?`<small style="color:var(--ink)">${esc(o.notes)}</small>`:''}<div class="acts2"><button data-ai="${i}">+ Crear ficha</button><button data-aix="${i}">Descartar</button></div></div>`).join('')+'</div>':''}
  <div id="ciMsg" class="note"></div>
  <ul><li>El número en cada ficha es en cuántos ${U().many} aparece</li><li>Las líneas punteadas unen a quienes aparecen juntos; más gruesa, más veces</li><li>Arrastrá el punto coral de una ficha a otra para escribir su relación</li><li>Doble clic en el fondo: ficha nueva</li></ul>`;
}
function renderCM(){$('#cKinds').innerHTML=[['all','Todas'],...Object.entries(KINDS)].map(([v,l])=>`<button data-k="${v}" class="${cKind===v?'on':''}">${l}</button>`).join('');$('#cAI').hidden=!SAMPLE;cPlace();renderCInsp();if(cSeenP!==P.id){cSeenP=P.id;cSel=cRel=null;cUndo=[];requestAnimationFrame(fitCM)}else drawCM()}
$('#cKinds').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;cKind=b.dataset.k;renderCM();requestAnimationFrame(fitCM)});
$('#cCo').addEventListener('change',drawCM);
$('#cAdd').onclick=()=>{const p=cViewC();cNew(p.x,p.y,{kind:cKind==='all'?'personaje':cKind})};
$('#cLay').onclick=e=>busy(e.currentTarget,'Ordenando fichas…',async()=>{cSnap();cLayout();touch();fitCM()});
$('#cUndoB').onclick=cUndoDo;
$('#czIn').onclick=()=>{const W=$('#csvg').clientWidth/2,H=$('#csvg').clientHeight/2,k=Math.min(2.5,CV.k*1.25);CV.x=W-(W-CV.x)*k/CV.k;CV.y=H-(H-CV.y)*k/CV.k;CV.k=k;drawCM()};
$('#czOut').onclick=()=>{const W=$('#csvg').clientWidth/2,H=$('#csvg').clientHeight/2,k=Math.max(.25,CV.k*.8);CV.x=W-(W-CV.x)*k/CV.k;CV.y=H-(H-CV.y)*k/CV.k;CV.k=k;drawCM()};
$('#czFit').onclick=fitCM;
const csvg=$('#csvg');
const toWC=e=>{const r=csvg.getBoundingClientRect();return{x:(e.clientX-r.left-CV.x)/CV.k,y:(e.clientY-r.top-CV.y)/CV.k}};
csvg.addEventListener('pointerdown',e=>{
  const h=e.target.closest('[data-ch]'),g=e.target.closest('[data-cn]'),rl=e.target.closest('[data-r]'),now=Date.now(),key=g?g.dataset.cn:rl?'r':h?'h':'bg',dbl=cLast.id===key&&now-cLast.t<350;cLast={id:key,t:now};
  try{csvg.setPointerCapture(e.pointerId);csvg.focus({preventScroll:true})}catch(err){}
  const p=toWC(e);
  if(h){cAct={t:'conn',a:h.dataset.ch};cConn={a:h.dataset.ch,p};return}
  if(g){const id=g.dataset.cn;if(cPend&&cPend!==id){const a=cPend;cPend=null;cLink(a,id);cAct=null;return}
    if(cSel!==id||cRel){cSel=id;cRel=null;renderCInsp()}const c=cCard(id);cAct={t:'drag',c,dx:p.x-c.x,dy:p.y-c.y,moved:false};drawCM();if(dbl)setTimeout(()=>{const i=$('#ciName');if(i){i.focus();i.select()}},0);return}
  if(rl){cRel=rl.dataset.r;cSel=null;cPend=null;cAct=null;renderCInsp();drawCM();return}
  cPend=null;if(dbl){cNew(p.x,p.y,{kind:cKind==='all'?'personaje':cKind});cAct=null;return}
  if(cSel||cRel){cSel=cRel=null;renderCInsp()}cAct={t:'pan',sx:e.clientX,sy:e.clientY,vx:CV.x,vy:CV.y};drawCM();
});
csvg.addEventListener('pointermove',e=>{if(!cAct)return;const a=cAct;
  if(a.t==='pan'){CV.x=a.vx+e.clientX-a.sx;CV.y=a.vy+e.clientY-a.sy;drawCM();return}
  const p=toWC(e);if(a.t==='conn'){cConn.p=p;drawCM();return}
  if(!a.moved){if(Math.hypot(p.x-a.dx-a.c.x,p.y-a.dy-a.c.y)<3)return;cSnap();a.moved=true}
  a.c.x=Math.round(p.x-a.dx);a.c.y=Math.round(p.y-a.dy);drawCM()});
csvg.addEventListener('pointerup',e=>{const a=cAct;cAct=null;if(!a)return;
  if(a.t==='conn'){const el=document.elementFromPoint(e.clientX,e.clientY),g=el&&el.closest&&el.closest('[data-cn]');cConn=null;if(g&&g.dataset.cn!==a.a)cLink(a.a,g.dataset.cn);else drawCM();return}
  if(a.moved)touch()});
csvg.addEventListener('pointercancel',()=>{cAct=null;cConn=null;drawCM()});
csvg.addEventListener('wheel',e=>{e.preventDefault();const r=csvg.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,k=Math.max(.25,Math.min(2.5,CV.k*Math.exp(-e.deltaY*.0015)));CV.x=px-(px-CV.x)*k/CV.k;CV.y=py-(py-CV.y)*k/CV.k;CV.k=k;drawCM()},{passive:false});
new ResizeObserver(()=>drawCM()).observe(csvg);
$('#cinsp').addEventListener('input',e=>{const f=e.target.dataset.f,c=cSel&&cCard(cSel);
  if(f&&c){c[f]=e.target.value;if(f==='name'||f==='alias')appearMemo=null;if(f==='name')$('#cinsp h3').textContent=c.name||'Ficha nueva';touch();drawCM();return}
  if(e.target.id==='crL'){const r=P.rels.find(x=>x.id===cRel);if(r){r.label=e.target.value;touch();drawCM()}}});
$('#cinsp').addEventListener('change',e=>{if(e.target.dataset.f==='kind'||e.target.dataset.f==='name'||e.target.dataset.f==='alias'){renderCInsp();renderCards();renderAppear();drawCM()}});
$('#cinsp').addEventListener('click',async e=>{
  const go=e.target.closest('[data-go]');if(go){select(go.dataset.go);return}
  const rb=e.target.closest('[data-rel]');if(rb){cRel=rb.dataset.rel;cSel=null;renderCInsp();drawCM();return}
  const mk=e.target.closest('[data-mk]');if(mk){const nm=mk.closest('.sg').dataset.name,p=cViewC();cNew(p.x,p.y,{kind:mk.dataset.mk,name:nm});$('#ciMsg')&&($('#ciMsg').textContent='Ficha creada. Completá el rol y las notas, o pedile a Claude que la complete.');return}
  const ig=e.target.closest('[data-ign]');if(ig){P.ignored=P.ignored||[];P.ignored.push(ig.closest('.sg').dataset.name);touch();renderCInsp();return}
  const ai=e.target.closest('[data-ai]');if(ai){const o=cAISugg[+ai.dataset.ai],p=cViewC();cAISugg.splice(+ai.dataset.ai,1);cNew(p.x,p.y,{kind:KINDS[o.kind]?o.kind:'personaje',name:o.name,alias:o.alias||'',role:o.role||'',notes:o.notes||''});return}
  const ax=e.target.closest('[data-aix]');if(ax){cAISugg.splice(+ax.dataset.aix,1);renderCInsp();return}
  const b=e.target.closest('[data-x]');if(!b)return;const x=b.dataset.x;
  if(x==='conn'){cPend=cPend?null:cSel;renderCInsp()}
  if(x==='del')confirm2(b,()=>{cSnap();const id=cSel;P.cards=P.cards.filter(c=>c.id!==id);P.rels=P.rels.filter(r=>r.a!==id&&r.b!==id);cSel=null;appearMemo=null;touch();drawCM();renderCInsp();renderCards();renderAppear()});
  if(x==='rdel')confirm2(b,()=>{cSnap();P.rels=P.rels.filter(r=>r.id!==cRel);cRel=null;touch();drawCM();renderCInsp()});
  if(x==='flip'){const r=P.rels.find(z=>z.id===cRel);if(r){cSnap();[r.a,r.b]=[r.b,r.a];touch();drawCM();renderCInsp()}}
  if(x==='ai')busy(b,'Claude está leyendo…',()=>cComplete(cSel));
});
function aiErr(e){const c=e&&e.code;return c==='rate_limited'?'Llegaste al límite de uso de Claude por ahora.':c==='invalid_json'?'Claude respondió en un formato inesperado. Probá de nuevo.':c==='prompt_too_large'?'El texto es demasiado largo para leerlo de una vez.':c==='not_granted'?'Claude no tiene permiso en esta página.':'No se pudo completar. Probá de nuevo.'}
async function cComplete(id){
  const c=cCard(id);if(!c||!SAMPLE)return;const re=new RegExp('(?<![\\p{L}\\p{N}])(?:'+cardTerms(c).map(escRe).join('|')+')(?![\\p{L}\\p{N}])','iu');
  let ctx='';for(const {c:ch,s} of allScenes()){const ps=parasOf(T[s.id]).filter(p=>re.test(p));if(ps.length)ctx+='\n['+whereOf(ch,s)+']\n'+ps.join('\n')+'\n';if(ctx.length>25000)break}
  const others=P.cards.filter(x=>x.id!==id).map(x=>x.name).join(', ');
  try{const o=await SAMPLE.json(`Sos asistente de un novelista argentino. A partir SOLO de estos fragmentos de su novela, armá la ficha de "${c.name}" (${KINDS[c.kind]}). No inventes nada que no esté en el texto.
Respondé solo con JSON: {"rol":"una línea","alias":"otras formas en que lo nombran, separadas por comas","notas":"3 a 6 oraciones con lo que el texto muestra: rasgos, lo que hace, lo que se sabe","relaciones":[{"con":"nombre de otra ficha","relacion":"cómo se relacionan, en pocas palabras"}]}
Para "relaciones" usá solo estas fichas existentes: ${others||'(ninguna)'}.
Lo que ya tiene la ficha — rol: ${c.role||'(vacío)'}; notas: ${c.notes||'(vacío)'}.
FRAGMENTOS:
${ctx.slice(0,25000)}`);
    cSnap();if(o.rol&&!c.role)c.role=String(o.rol);
    if(o.alias){const cur=new Set(String(c.alias||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));const add=String(o.alias).split(',').map(x=>x.trim()).filter(x=>x&&!cur.has(x.toLowerCase())&&x.toLowerCase()!==c.name.toLowerCase());if(add.length)c.alias=[c.alias,...add].filter(Boolean).join(', ')}
    if(o.notas)c.notes=(c.notes?c.notes+'\n\n':'')+'Según el texto: '+String(o.notas);
    let nr=0;(Array.isArray(o.relaciones)?o.relaciones:[]).forEach(r=>{const t=P.cards.find(x=>x.id!==id&&x.name&&String(r.con||'').toLowerCase().includes(x.name.toLowerCase().split(' ')[0]));if(t&&!P.rels.some(z=>(z.a===id&&z.b===t.id)||(z.a===t.id&&z.b===id))){P.rels.push({id:nid(),a:id,b:t.id,label:String(r.relacion||'')});nr++}});
    appearMemo=null;touch();drawCM();renderCInsp();renderCards();$('#ciMsg').textContent='Listo: completé lo que estaba vacío y sumé lo que dice el texto'+(nr?' y '+nr+' relación'+(nr>1?'es':''):'')+'. Podés deshacer.';
  }catch(e){const m=$('#ciMsg');if(m)m.textContent=aiErr(e)}
}
$('#cAI').onclick=e=>busy(e.currentTarget,'Claude está leyendo la obra…',async()=>{
  if(!SAMPLE)return;let txt='';for(const {c,s} of allScenes()){const t=plainOf(T[s.id]);if(t)txt+='\n['+whereOf(c,s)+']\n'+t+'\n';if(txt.length>150000)break}
  if(!txt.trim()){cAISugg=[];renderCInsp();$('#ciMsg').textContent='Todavía no hay texto para leer.';return}
  try{const r=await SAMPLE.json(`Leé este texto de una obra de ficción y listá los personajes, lugares y elementos de lore (objetos, organizaciones, conceptos del mundo) importantes que aparecen y NO están en esta lista de fichas existentes: ${P.cards.map(c=>c.name).join(', ')||'(ninguna)'}.
No inventes: basate solo en el texto. Máximo 15.
Respondé solo con un JSON array: [{"name":"","kind":"personaje|lugar|lore","alias":"","role":"una línea","notes":"1 a 3 oraciones según el texto"}]
TEXTO:
${txt.slice(0,150000)}`);
    const have=new Set(P.cards.map(c=>(c.name||'').toLowerCase()));cAISugg=(Array.isArray(r)?r:[]).filter(o=>o&&o.name&&!have.has(String(o.name).toLowerCase())).map(o=>({name:String(o.name),kind:String(o.kind||'personaje'),alias:String(o.alias||''),role:String(o.role||''),notes:String(o.notes||'')}));
    cSel=cRel=null;renderCInsp();$('#ciMsg').textContent=cAISugg.length?'Claude encontró '+cAISugg.length+'. Creá las que quieras.':'Claude no encontró nada nuevo.';
  }catch(err){renderCInsp();$('#ciMsg').textContent=aiErr(err)}});
document.addEventListener('keydown',e=>{if(!isView('cards')||e.target.closest('input,textarea,select,dialog,button'))return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();cUndoDo();return}
  if((e.key==='Delete'||e.key==='Backspace')&&(cSel||cRel)){e.preventDefault();cSnap();if(cSel){const id=cSel;P.cards=P.cards.filter(c=>c.id!==id);P.rels=P.rels.filter(r=>r.a!==id&&r.b!==id);appearMemo=null}else P.rels=P.rels.filter(r=>r.id!==cRel);cSel=cRel=null;touch();drawCM();renderCInsp();renderCards()}
  else if(e.key==='Escape'){cSel=cRel=cPend=null;renderCInsp();drawCM()}});
