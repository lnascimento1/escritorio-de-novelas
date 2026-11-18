'use strict';
/* ---------- board ---------- */
let bStat='all',bdrag=null;
function bcard(c,s,no,ap,k){return`<div class="bc ${s.status}${k&&k.s.id===s.id?' cur':''}" data-s="${s.id}" draggable="true"><b>${no?no+'. ':''}${esc(P.simple?c.title:(s.title||'Sin título'))}</b>${s.syn?`<p>${esc(s.syn)}</p>`:''}<div class="bm">${P.simple?'':`<span>${STAT[s.status]}</span>`}${s.pov?`<span>PdV: ${esc(s.pov)}</span>`:''}<span>${fmt(sw(s.id))} pal.</span>${(ap[s.id]||[]).length?`<span>${ap[s.id].length} ficha${ap[s.id].length>1?'s':''}</span>`:''}</div></div>`}
function renderBoard(){
  const povs=[...new Set(allScenes().map(x=>x.s.pov).filter(Boolean))],pv=$('#bPov').value||'';
  $('#bPov').innerHTML='<option value="">Todos los puntos de vista</option>'+povs.map(p=>`<option ${p===pv?'selected':''}>${esc(p)}</option>`).join('');
  const k=cur(),ap=appear().byScene;
  $('#bStat').hidden=P.simple;
  if(P.simple){ // chapters as cards, columns by state: dragging a card changes its state
    const cs=P.chapters.map((c,i)=>({c,s:c.scenes[0],no:i+1})).filter(x=>!pv||x.s.pov===pv);
    $('#board').innerHTML=Object.entries(STAT).map(([v,l])=>{const xs=cs.filter(x=>x.s.status===v);return`<div class="col" data-st="${v}"><h3>${l}</h3><div class="cm">${xs.length} capítulo${xs.length===1?'':'s'} · ${fmt(xs.reduce((a,x)=>a+sw(x.s.id),0))} palabras</div><div class="cl">${xs.map(x=>bcard(x.c,x.s,x.no,ap,k)).join('')}</div>${v==='idea'?'<button class="addsc" data-a="adds">+ Capítulo</button>':''}</div>`}).join('');
    return}
  $('#bStat').innerHTML=[['all','Todas'],...Object.entries(STAT)].map(([v,l])=>`<button data-s="${v}" class="${bStat===v?'on':''}">${l}</button>`).join('');
  const ok=s=>(bStat==='all'||s.status===bStat)&&(!pv||s.pov===pv);
  $('#board').innerHTML=P.chapters.map(c=>{const sc=c.scenes.filter(ok);return`<div class="col" data-c="${c.id}"><h3>${esc(c.title)}</h3><div class="cm">${c.scenes.length} escena${c.scenes.length===1?'':'s'} · ${fmt(chapWords(c))} palabras</div><div class="cl">${sc.map(s=>bcard(c,s,0,ap,k)).join('')}</div><button class="addsc" data-a="adds">+ Escena</button></div>`}).join('')+'<button class="addcol" id="bAddCol">+ Capítulo</button>';
}
$('#bStat').addEventListener('click',e=>{const b=e.target.closest('button');if(b){bStat=b.dataset.s;renderBoard()}});
$('#bPov').addEventListener('change',renderBoard);
$('#board').addEventListener('click',e=>{
  if(e.target.id==='bAddCol'){const n={id:nid(),title:'Capítulo '+(P.chapters.length+1),open:true,scenes:[{id:nid(),title:'Escena 1',status:'idea',pov:'',syn:'',notes:''}]};T[n.scenes[0].id]='';P.chapters.push(n);touch();renderBinder();renderBoard();return}
  const a=e.target.closest('[data-a=adds]');if(a){if(P.simple)addChapter();else addScene(P.chapters.find(x=>x.id===a.closest('.col').dataset.c));return}
  const c=e.target.closest('.bc');if(c)select(c.dataset.s)});
$('#board').addEventListener('dragstart',e=>{const c=e.target.closest('.bc');if(c){bdrag=c.dataset.s;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',bdrag)}});
$('#board').addEventListener('dragover',e=>{const col=e.target.closest('.col');if(bdrag&&col){e.preventDefault();$$('.col.over').forEach(x=>x!==col&&x.classList.remove('over'));col.classList.add('over')}});
$('#board').addEventListener('drop',e=>{const col=e.target.closest('.col');if(!bdrag||!col)return;e.preventDefault();
  if(col.dataset.st){const f=findScene(bdrag);if(f){f.s.status=col.dataset.st;touch();renderBinder();renderBoard()}}
  else{const t=e.target.closest('.bc');moveSceneTo(bdrag,col.dataset.c,t&&t.dataset.s)}bdrag=null});
$('#board').addEventListener('dragend',()=>{bdrag=null;$$('.over').forEach(x=>x.classList.remove('over'))});

/* ---------- timeline as metro lines: characters are lines, chapters are stations in story order ---------- */
const trunc=(s,n)=>(s=String(s||'')).length>n?s.slice(0,n-1)+'…':s;
const MG=150,MR=58,MT=96,MCOL=['#f2553d','#4a78e0','#8b62c9','#2f9e6a','#d08a12','#1d9bb0','#d4537e','#5f5e5a'];
let MV={x:190,y:0,k:1},mSelS=null,mSelL=null,mAct=null,mSeenP=null,mUndo2=[],mLast={id:'',t:0};
function migrateMetro(){
  const M={order:[],st:{},lines:[],showBack:true},tl=P.tl,seen=new Set();
  if(tl&&tl.items&&tl.items.length)tl.items.slice().sort((a,b)=>a.x-b.x).forEach(it=>{
    if(it.ref&&it.ref.startsWith('s:')){if(findScene(it.ref.slice(2))&&!seen.has(it.ref)){seen.add(it.ref);M.order.push(it.ref);M.st[it.ref]={when:it.when||''}}}
    else{const id='e:'+it.id;M.order.push(id);M.st[id]={when:it.when||'',label:it.label||'Hecho',notes:it.notes||''}}});
  const ap=appear().byCard;
  P.cards.filter(c=>c.kind==='personaje'&&(ap[c.id]||[]).length).sort((a,b)=>(ap[b.id]||[]).length-(ap[a.id]||[]).length).slice(0,6).forEach((c,i)=>M.lines.push({id:nid(),card:c.id,name:'',color:MCOL[i%MCOL.length],add:[],rem:[]}));
  return M}
function metro(){
  if(!P.metro)P.metro=migrateMetro();const M=P.metro;M.st=M.st||{};M.lines=M.lines||[];M.order=M.order||[];
  const sc=allScenes().map(x=>'s:'+x.s.id),scs=new Set(sc);
  M.order=M.order.filter((id,i,a)=>a.indexOf(id)===i&&(id.startsWith('e:')?!!M.st[id]:scs.has(id)));
  const have=new Set(M.order);
  sc.forEach((id,i)=>{if(have.has(id))return;const prev=sc.slice(0,i).reverse().find(p=>M.order.includes(p));M.order.splice(prev?M.order.indexOf(prev)+1:0,0,id)});
  M.order.forEach(id=>{M.st[id]=M.st[id]||{when:''}});
  M.lines=M.lines.filter(l=>!l.card||P.cards.some(c=>c.id===l.card));
  return M}
const lineName=l=>{const c=l.card&&P.cards.find(x=>x.id===l.card);return c?c.name:(l.name||'Hilo')};
function autoStop(l,id){if(!id.startsWith('s:')||!l.card)return false;if((appear().byScene[id.slice(2)]||[]).includes(l.card))return true;
  const f=findScene(id.slice(2)),c=P.cards.find(x=>x.id===l.card),pv=f&&(f.s.pov||'').trim().toLowerCase().split(/\s+/)[0];return!!(pv&&c&&(c.name||'').toLowerCase().split(/\s+/)[0]===pv)}
function stops(l){return metro().order.filter(id=>{if((l.rem||[]).includes(id))return false;if((l.add||[]).includes(id))return true;return autoStop(l,id)})}
function stLabel(id){if(id.startsWith('e:'))return{a:'Hecho',b:metro().st[id].label||'Sin título'};const f=findScene(id.slice(2));return f?{a:'Cap. '+chapNo(f.s.id),b:P.simple?f.c.title.replace(/^\d+[.)]\s*/,''):whereOf(f.c,f.s)}:{a:'',b:''}}
function backSet(){const M=metro(),pos=new Map(M.order.map((id,i)=>[id,i])),sc=allScenes().map(x=>'s:'+x.s.id),out=new Set();for(let k=1;k<sc.length;k++)if(pos.get(sc[k])<pos.get(sc[k-1]))out.add(sc[k]);return out}
function drawTL(){
  if(!isView('time'))return;const M=metro(),s=$('#tsvg'),L=M.lines.filter(l=>!l.hidden),pos=new Map(M.order.map((id,i)=>[id,i]));
  const X=i=>i*MG,rowY=i=>MT+i*MR,nR=Math.max(1,L.length),bottom=rowY(nR-1),st=L.map(stops),back=M.showBack?backSet():new Set();
  let g='';const xEnd=X(Math.max(0,M.order.length-1));
  L.forEach((l,i)=>{g+=`<line x1="${-MG/2}" x2="${xEnd+MG/2}" y1="${rowY(i)}" y2="${rowY(i)}" stroke="var(--line)" stroke-dasharray="2 7"/>`});
  L.forEach((l,i)=>{const xs=st[i].map(id=>X(pos.get(id))).sort((a,b)=>a-b);if(!xs.length)return;const sel=mSelL===l.id;
    g+=`<g data-ml="${l.id}"><line x1="${xs[0]}" x2="${xs[xs.length-1]}" y1="${rowY(i)}" y2="${rowY(i)}" stroke="transparent" stroke-width="24"/><line x1="${xs[0]}" x2="${xs[xs.length-1]}" y1="${rowY(i)}" y2="${rowY(i)}" stroke="${l.color}" stroke-width="${sel?12:8}" stroke-linecap="round"/></g>`});
  M.order.forEach((id,k)=>{const x=X(k),rows=L.map((l,i)=>st[i].includes(id)?i:-1).filter(i=>i>=0),sel=mSelS===id,ev=id.startsWith('e:'),lab=stLabel(id),w=M.st[id].when;
    const y1=rows.length?rowY(Math.min(...rows)):rowY(0),y2=rows.length?rowY(Math.max(...rows)):rowY(0),top=y1-16,bot=Math.max(bottom,y2)+34;
    g+=`<g data-ms="${id}"><rect x="${x-MG/2+8}" y="${top-50}" width="${MG-16}" height="${bot-top+72}" fill="transparent"/>`;
    if(rows.length)g+=`<rect x="${x-15}" y="${y1-15}" width="30" height="${y2-y1+30}" rx="15" fill="var(--bg)" stroke="${sel?'#f2553d':'var(--ink)'}" stroke-width="${sel?3.5:2.6}"/>`+rows.map(i=>`<circle cx="${x}" cy="${rowY(i)}" r="5" fill="${L[i].color}"/>`).join('');
    else g+=`<circle cx="${x}" cy="${rowY(0)}" r="11" fill="var(--bg)" stroke="${sel?'#f2553d':'var(--mut)'}" stroke-width="2.5" stroke-dasharray="4 3"/>`;
    if(w)g+=`<text x="${x}" y="${top-10}" text-anchor="middle" font-size="12" fill="var(--mut)" font-family="Inter, sans-serif">${esc(trunc(w,22))}</text>`;
    if(back.has(id))g+=`<rect x="${x-40}" y="${top-(w?46:32)}" width="80" height="20" rx="10" fill="#f2553d"/><text x="${x}" y="${top-(w?32:18)}" text-anchor="middle" font-size="11" font-weight="600" fill="#ffffff" font-family="Inter, sans-serif">salto atrás</text>`;
    g+=`<text x="${x}" y="${bot}" text-anchor="middle" font-size="13" font-weight="600" fill="${ev?'var(--mut)':'var(--ink)'}" font-family="Inter, sans-serif">${esc(lab.a)}</text><text x="${x}" y="${bot+17}" text-anchor="middle" font-size="12" fill="var(--mut)" font-family="Inter, sans-serif">${esc(trunc(lab.b,19))}</text></g>`});
  cx.font='600 12px Inter, sans-serif';
  const labels=L.map((l,i)=>{const sy=MV.y+rowY(i)*MV.k-12,w=Math.min(150,cx.measureText(trunc(lineName(l),18)).width+30),sel=mSelL===l.id;return`<g data-ml="${l.id}" style="cursor:pointer"><rect x="8" y="${sy}" width="${w}" height="24" rx="12" fill="${l.color}" stroke="${sel?'var(--ink)':'none'}" stroke-width="2"/><text x="20" y="${sy+16}" font-size="12" font-weight="600" fill="#ffffff" font-family="Inter, sans-serif">${esc(trunc(lineName(l),18))}</text></g>`}).join('');
  s.innerHTML=`<g transform="translate(${MV.x},${MV.y}) scale(${MV.k})">${g}</g>${labels}`;
  $('#tempty').hidden=L.length>0;
  const nb=back.size;$('#tInfo').textContent=`${L.length} línea${L.length===1?'':'s'} · ${M.order.length} estacion${M.order.length===1?'':'es'}${M.showBack&&nb?' · '+nb+' salto'+(nb>1?'s':'')+' atrás':''}`;
}
function fitTL(){const s=$('#tsvg'),W=s.clientWidth,H=s.clientHeight;if(!W){drawTL();return}const M=metro(),n=Math.max(1,M.lines.filter(l=>!l.hidden).length),side=W>700?310:0,bot=W<=700?H*.44:0,aw=W-side-190,ah=H-bot-20;
  const bw=Math.max(MG,(M.order.length-1)*MG+MG),bh=MT+(n-1)*MR+80;const k=Math.max(.35,Math.min(1.15,aw/bw,ah/bh));MV={k,x:180+MG/2*k+Math.max(0,(aw-bw*k)/2),y:Math.max(10,(ah-bh*k)/2)};drawTL()}
function mSnap2(){mUndo2.push(JSON.stringify(P.metro));if(mUndo2.length>40)mUndo2.shift()}
function mUndoDo2(){const s=mUndo2.pop();if(!s)return;P.metro=JSON.parse(s);mSelS=mSelL=null;touch();drawTL();renderTInsp()}
function renderTInsp(){
  const M=metro(),el=$('#tinsp');
  if(mSelS&&M.st[mSelS]){const id=mSelS,ev=id.startsWith('e:'),s=M.st[id],lab=stLabel(id),L=M.lines;
    el.innerHTML=`<h3>${esc(ev?(s.label||'Hecho'):lab.a+' · '+lab.b)}</h3>
    ${ev?`<label for="msL">Qué pasa</label><input id="msL" value="${esc(s.label||'')}" placeholder="Desaparece Tomás">`:''}
    <label for="msW">Cuándo</label><input id="msW" value="${esc(s.when||'')}" placeholder="Mayo de 1810, tres años antes, la noche del incendio…">
    ${ev?`<label for="msN">Notas</label><textarea id="msN" rows="3">${esc(s.notes||'')}</textarea>`:''}
    <label>Quiénes están acá</label>${L.length?`<div class="links">${L.map(l=>{const on=stops(l).includes(id),au=autoStop(l,id);return`<label class="chk" style="margin:4px 0"><input type="checkbox" data-stop="${l.id}" ${on?'checked':''}><span style="display:inline-block;width:12px;height:12px;border-radius:6px;background:${l.color}"></span> ${esc(lineName(l))}${au?' <span class="note" style="margin:0">(automático)</span>':''}</label>`}).join('')}</div>`:'<p class="note" style="margin:0">Agregá líneas para tus personajes.</p>'}
    <div class="acts">${ev?'<button data-x="sdel">Borrar hecho</button>':'<button data-x="open">Abrir capítulo</button>'}<button data-x="left">← Antes</button><button data-x="right">Después →</button></div>`;return}
  if(mSelL){const l=M.lines.find(x=>x.id===mSelL);if(l){const c=l.card&&P.cards.find(x=>x.id===l.card),n=stops(l).length;
    el.innerHTML=`<h3>${esc(lineName(l))}</h3><p class="note" style="margin:0">Para en ${n} estacion${n===1?'':'es'}.</p>
    ${c?'':`<label for="mlN">Nombre del hilo</label><input id="mlN" value="${esc(l.name||'')}">`}
    <label>Color</label><div class="chips">${MCOL.map(col=>`<button data-col="${col}" aria-label="Color" style="width:34px;min-height:34px;padding:0;background:${col};border:${l.color===col?'3px solid var(--ink)':'0'}"></button>`).join('')}</div>
    <div class="acts">${c?'<button data-x="card">Abrir ficha</button>':''}<button data-x="lup">Subir</button><button data-x="ldn">Bajar</button><button data-x="lhide">Ocultar</button><button data-x="ldel">Quitar línea</button></div>`;return}}
  const avail=P.cards.filter(c=>!M.lines.some(l=>l.card===c.id));
  el.innerHTML=`<h3>Líneas</h3>${M.lines.length?M.lines.map(l=>`<label class="chk" style="margin:6px 0"><input type="checkbox" data-vis="${l.id}" ${l.hidden?'':'checked'}><span style="display:inline-block;width:12px;height:12px;border-radius:6px;background:${l.color}"></span> ${esc(lineName(l))}</label>`).join(''):'<p class="note" style="margin:0">Todavía no hay líneas.</p>'}
  <label for="mAddSel">Agregar línea</label><div class="vnew"><select id="mAddSel"><option value="">Elegí una ficha…</option>${avail.map(c=>`<option value="${c.id}">${esc(c.name)} (${KINDS[c.kind]})</option>`).join('')}<option value="__free">Hilo libre (sin ficha)</option></select><button data-x="ladd">Agregar</button></div>
  <ul><li>Cada línea es un personaje o un hilo; para sola en los capítulos donde aparece en el texto o es el punto de vista, y podés corregirlo</li><li>Los capítulos están ordenados según cuándo pasan, no según cuándo se leen: arrastralos para cambiarlos de momento</li><li>"Salto atrás" marca un capítulo que vuelve a un momento anterior</li><li>Doble clic en el fondo: hecho suelto (algo que pasa fuera de los capítulos)</li></ul>`;
}
function renderTL(){$('#tOrder').checked=metro().showBack!==false;renderTInsp();if(mSeenP!==P.id){mSeenP=P.id;mSelS=mSelL=null;mUndo2=[];requestAnimationFrame(fitTL)}else drawTL()}
const tsvg=$('#tsvg');
const toWT=e=>{const r=tsvg.getBoundingClientRect();return{x:(e.clientX-r.left-MV.x)/MV.k,y:(e.clientY-r.top-MV.y)/MV.k}};
const idxAt=x=>Math.max(0,Math.min(metro().order.length-1,Math.round(x/MG)));
tsvg.addEventListener('pointerdown',e=>{
  const sn=e.target.closest('[data-ms]'),ln=e.target.closest('[data-ml]'),now=Date.now(),key=sn?sn.dataset.ms:ln?'l':'bg',dbl=mLast.id===key&&now-mLast.t<350;mLast={id:key,t:now};
  try{tsvg.setPointerCapture(e.pointerId);tsvg.focus({preventScroll:true})}catch(err){}
  if(sn){const id=sn.dataset.ms;if(mSelS!==id||mSelL){mSelS=id;mSelL=null;renderTInsp()}mAct={t:'drag',id,moved:false,sx:e.clientX};drawTL();if(dbl&&!id.startsWith('e:'))select(id.slice(2));return}
  if(ln){mSelL=ln.dataset.ml;mSelS=null;mAct=null;renderTInsp();drawTL();return}
  if(dbl){const p=toWT(e);mNewEvent(Math.round(p.x/MG));mAct=null;return}
  if(mSelS||mSelL){mSelS=mSelL=null;renderTInsp()}mAct={t:'pan',sx:e.clientX,sy:e.clientY,vx:MV.x,vy:MV.y};drawTL();
});
tsvg.addEventListener('pointermove',e=>{const a=mAct;if(!a)return;
  if(a.t==='pan'){MV.x=a.vx+e.clientX-a.sx;MV.y=a.vy+e.clientY-a.sy;drawTL();return}
  if(!a.moved&&Math.abs(e.clientX-a.sx)<6)return;
  const M=metro(),from=M.order.indexOf(a.id),to=idxAt(toWT(e).x);if(!a.moved){mSnap2();a.moved=true}
  if(to!==from){M.order.splice(from,1);M.order.splice(to,0,a.id);drawTL()}});
tsvg.addEventListener('pointerup',()=>{const a=mAct;mAct=null;if(a&&a.moved){touch();renderTInsp();drawTL()}});
tsvg.addEventListener('pointercancel',()=>{mAct=null});
tsvg.addEventListener('wheel',e=>{e.preventDefault();const r=tsvg.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;
  if(!e.ctrlKey&&Math.abs(e.deltaX)>Math.abs(e.deltaY)){MV.x-=e.deltaX;drawTL();return}
  const k=Math.max(.3,Math.min(2.2,MV.k*Math.exp(-e.deltaY*.0015)));MV.x=px-(px-MV.x)*k/MV.k;MV.y=py-(py-MV.y)*k/MV.k;MV.k=k;drawTL()},{passive:false});
const tZoom=f=>{const W=tsvg.clientWidth/2,H=tsvg.clientHeight/2,k=Math.max(.3,Math.min(2.2,MV.k*f));MV.x=W-(W-MV.x)*k/MV.k;MV.y=H-(H-MV.y)*k/MV.k;MV.k=k;drawTL()};
$('#tzIn').onclick=()=>tZoom(1.25);$('#tzOut').onclick=()=>tZoom(.8);$('#tzFit').onclick=fitTL;
new ResizeObserver(()=>drawTL()).observe(tsvg);
function mNewEvent(at){mSnap2();const M=metro(),id='e:'+nid();M.st[id]={when:'',label:'Nuevo hecho',notes:''};M.order.splice(Math.max(0,Math.min(M.order.length,at)),0,id);mSelS=id;mSelL=null;touch();drawTL();renderTInsp();setTimeout(()=>{const i=$('#msL');if(i){i.focus();i.select()}},0)}
$('#tinsp').addEventListener('input',e=>{const M=metro(),id=e.target.id,s=mSelS&&M.st[mSelS],l=mSelL&&M.lines.find(x=>x.id===mSelL);
  if(id==='msW'&&s)s.when=e.target.value;else if(id==='msL'&&s)s.label=e.target.value;else if(id==='msN'&&s)s.notes=e.target.value;else if(id==='mlN'&&l)l.name=e.target.value;else return;touch();drawTL()});
$('#tinsp').addEventListener('change',e=>{const M=metro(),t=e.target;
  if(t.dataset.stop){mSnap2();const l=M.lines.find(x=>x.id===t.dataset.stop),id=mSelS,au=autoStop(l,id);l.add=(l.add||[]).filter(x=>x!==id);l.rem=(l.rem||[]).filter(x=>x!==id);if(t.checked&&!au)l.add.push(id);if(!t.checked&&au)l.rem.push(id);touch();drawTL();renderTInsp();return}
  if(t.dataset.vis){const l=M.lines.find(x=>x.id===t.dataset.vis);l.hidden=!t.checked;touch();drawTL()}});
$('#tinsp').addEventListener('click',e=>{const b=e.target.closest('[data-x],[data-col]');if(!b)return;const M=metro(),l=mSelL&&M.lines.find(x=>x.id===mSelL),x=b.dataset.x;
  if(b.dataset.col&&l){l.color=b.dataset.col;touch();drawTL();renderTInsp();return}
  if(x==='open')select(mSelS.slice(2));
  if(x==='left'||x==='right'){mSnap2();const i=M.order.indexOf(mSelS),j=i+(x==='left'?-1:1);if(j>=0&&j<M.order.length){M.order.splice(i,1);M.order.splice(j,0,mSelS);touch();drawTL()}}
  if(x==='sdel')confirm2(b,()=>{mSnap2();M.order=M.order.filter(i=>i!==mSelS);delete M.st[mSelS];M.lines.forEach(l=>{l.add=(l.add||[]).filter(i=>i!==mSelS);l.rem=(l.rem||[]).filter(i=>i!==mSelS)});mSelS=null;touch();drawTL();renderTInsp()});
  if(x==='card'&&l)openCard(l.card);
  if((x==='lup'||x==='ldn')&&l){mSnap2();const i=M.lines.indexOf(l),j=i+(x==='lup'?-1:1);if(j>=0&&j<M.lines.length){M.lines.splice(i,1);M.lines.splice(j,0,l);touch();drawTL()}}
  if(x==='lhide'&&l){l.hidden=true;mSelL=null;touch();drawTL();renderTInsp()}
  if(x==='ldel'&&l)confirm2(b,()=>{mSnap2();M.lines=M.lines.filter(z=>z!==l);mSelL=null;touch();drawTL();renderTInsp()});
  if(x==='ladd'){const v=$('#mAddSel').value;if(!v)return;mSnap2();const used=new Set(M.lines.map(z=>z.color)),col=MCOL.find(c=>!used.has(c))||MCOL[M.lines.length%MCOL.length];
    const nl={id:nid(),card:v==='__free'?'':v,name:v==='__free'?'Hilo nuevo':'',color:col,add:[],rem:[]};M.lines.push(nl);mSelL=nl.id;touch();fitTL();renderTInsp();if(v==='__free')setTimeout(()=>{const i=$('#mlN');if(i){i.focus();i.select()}},0)}
});
$('#tAdd').onclick=()=>{const M=metro(),i=mSelS?M.order.indexOf(mSelS)+1:M.order.length;mNewEvent(i)};
$('#tLine').onclick=()=>{mSelS=mSelL=null;renderTInsp();drawTL();const s=$('#mAddSel');if(s)s.focus()};
$('#tBook').onclick=e=>confirm2(e.currentTarget,()=>{mSnap2();const M=metro(),ev=M.order.filter(i=>i.startsWith('e:'));M.order=allScenes().map(x=>'s:'+x.s.id);ev.forEach(i=>M.order.unshift(i));touch();fitTL()},'Confirmar');
$('#tUndo').onclick=mUndoDo2;
$('#tOrder').addEventListener('change',e=>{metro().showBack=e.target.checked;touch();drawTL()});
document.addEventListener('keydown',e=>{if(!isView('time')||e.target.closest('input,textarea,select,dialog,button'))return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();mUndoDo2();return}
  if(mSelS&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();mSnap2();const M=metro(),i=M.order.indexOf(mSelS),j=i+(e.key==='ArrowLeft'?-1:1);if(j>=0&&j<M.order.length){M.order.splice(i,1);M.order.splice(j,0,mSelS);touch();drawTL()}}
  else if((e.key==='Delete'||e.key==='Backspace')&&mSelS&&mSelS.startsWith('e:')){e.preventDefault();mSnap2();const M=metro();M.order=M.order.filter(i=>i!==mSelS);delete M.st[mSelS];mSelS=null;touch();drawTL();renderTInsp()}
  else if(e.key==='Escape'){mSelS=mSelL=null;renderTInsp();drawTL()}});

/* ---------- library ---------- */
function renderLib(){
  const list=L.list.slice().sort((a,b)=>(b.updated||0)-(a.updated||0));
  $('#libList').innerHTML='<div class="lib">'+list.map(x=>`<div class="li ${x.id===P.id?'cur':''}" data-id="${x.id}"><div><b>${esc(x.title||'Sin título')}</b><small>${x.type==='cuento'?'Cuento':'Novela'} · ${fmt(x.words)} palabras${x.updated?' · editado '+new Date(x.updated).toLocaleDateString('es-AR'):''}${x.id===P.id?' · abierto':''}</small></div>${x.id===P.id?'':`<button data-a="open">Abrir</button>`}<button class="ib bord" data-a="del" title="Borrar">✕</button></div>`).join('')+'</div>';
}
$('#bLib').onclick=()=>{syncLib();renderLib();$('#dLib').showModal()};
$('#libClose').onclick=()=>$('#dLib').close();
$('#libList').addEventListener('click',async e=>{const b=e.target.closest('[data-a]');if(!b)return;const id=b.closest('.li').dataset.id;
  if(b.dataset.a==='open'){$('#dLib').close();await openProject(id)}
  if(b.dataset.a==='del')confirm2(b,()=>busy(b,'Borrando…',async()=>{await deleteProject(id);renderLib()}))});
async function newFromLib(type){const n=newProject(type);$('#dLib').close();await openProject(n.P.id,n);setView('ms');$('#ptitle').focus();$('#ptitle').select()}
$('#libSample').onclick=async()=>{const d=sample();$('#dLib').close();await openProject(d.P.id,d);setView('ms')};
$('#libNovela').onclick=()=>newFromLib('novela');$('#libCuento').onclick=()=>newFromLib('cuento');
