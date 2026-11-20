'use strict';
/* ---------- binder ---------- */
let cardKind='all',edScene=null,lastRange=null,lastAuto=0;
const ed=$('#txt');
try{document.execCommand('defaultParagraphSeparator',false,'p')}catch(e){}

function renderAll(){$('#ptitle').value=P.title;renderBinder();renderEditor(true);renderCards();renderGoals();counts();gLastSafe()}
function gLastSafe(){if(typeof gLast==='function')gLast()}
function renderBinder(){
  const k=cur(),head='<div class="lab"><span>'+(P.type==='cuento'?'Cuento':'Manuscrito')+'</span><span class="cn">'+fmt(totalWords())+' pal.</span></div>';
  const tog=`<label class="bchk"><input type="checkbox" id="simpleT" ${P.simple?'':'checked'}> Usar escenas dentro de los capítulos</label>`;
  const note=P.sample?'<p class="sample">Novela de ejemplo para que veas la app funcionando. Para la tuya: Biblioteca → + Novela.</p>':'';
  if(P.simple){
    $('#binder').innerHTML=head+'<ul class="flat">'+P.chapters.map((c,i)=>{const s=c.scenes[0];return`<li class="sc ${k&&k.c.id===c.id?'cur':''}" data-s="${s.id}" data-c="${c.id}" draggable="true"><span class="num">${i+1}</span><span class="dot st-${s.status}"></span><span class="sn">${esc(c.title||'Sin título')}</span><span class="cn">${fmt(chapWords(c))}</span></li>`}).join('')+'</ul><button class="addch" data-a="addc">+ Capítulo</button>'+tog+note;
    return}
  $('#binder').innerHTML=head+P.chapters.map((c,ci)=>`<div class="chap" data-c="${c.id}"><div class="crow"><button class="ib" data-a="tog" title="Plegar">${c.open?'▾':'▸'}</button><input value="${esc(c.title)}" data-a="ct" aria-label="Título del capítulo"><span class="cn">${fmt(chapWords(c))}</span><button class="ib" data-a="cup" title="Subir capítulo" ${ci?'':'disabled'}>↑</button><button class="ib" data-a="cdel" title="Borrar capítulo">✕</button></div>${c.open?`<ul>${c.scenes.map(s=>`<li class="sc ${k&&k.s.id===s.id?'cur':''}" data-s="${s.id}" draggable="true"><span class="dot st-${s.status}"></span><span class="sn">${esc(s.title||'Sin título')}</span><span class="cn">${fmt(sw(s.id))}</span></li>`).join('')}</ul><button class="addsc" data-a="adds">+ Escena</button>`:''}</div>`).join('')+'<button class="addch" data-a="addc">+ Capítulo</button>'+tog+note;
}
function setSimple(on){
  if(on){const nc=[];P.chapters.forEach(c=>{if(c.scenes.length<=1){if(c.scenes[0])c.scenes[0].title=c.title;nc.push(c)}else c.scenes.forEach((s,i)=>nc.push({id:i?nid():c.id,title:i?(s.title||c.title+' ('+(i+1)+')'):c.title,open:true,scenes:[s]}))});
    P.chapters=nc;P.chapters.forEach(c=>{c.scenes[0].title=c.title})}
  P.simple=on;touch();renderAll();if(!isView('ms'))setView(document.body.dataset.view)}
function select(id){
  const k=cur();if(k&&k.s.id!==id)autoSnap(k.s.id);
  P.cur=id;touch();if(!isView('ms'))setView('ms');renderBinder();renderEditor();document.body.classList.remove('sb');$('#sheet').scrollTop=0;
}
function addChapter(){const t='Capítulo '+(P.chapters.length+1),s={id:nid(),title:t,status:'idea',pov:'',syn:'',notes:''};P.chapters.push({id:nid(),title:t,open:true,scenes:[s]});T[s.id]='';P.cur=s.id;touch(s.id);renderBinder();if(isView('board'))renderBoard();else{if(!isView('ms'))setView('ms');renderEditor();$('#stitle').select()}}
function addScene(c){if(P.simple){addChapter();return}const s={id:nid(),title:'Escena nueva',status:'idea',pov:'',syn:'',notes:''};c.scenes.push(s);c.open=true;T[s.id]='';P.cur=s.id;touch(s.id);renderBinder();if(isView('board'))renderBoard();else{if(!isView('ms'))setView('ms');renderEditor();$('#stitle').select()}}
function delScene(id){const f=findScene(id);if(!f)return;if(P.simple||f.c.scenes.length===1){const i=P.chapters.indexOf(f.c);f.c.scenes.forEach(s=>{delete T[s.id];delete H[s.id];delS.add(s.id)});P.chapters.splice(i,1);const n=P.chapters[Math.max(0,i-1)];P.cur=n?n.scenes[0].id:null;touch();renderAll();return}f.c.scenes.splice(f.i,1);delete T[id];delete H[id];dirtyS.delete(id);delS.add(id);if(P.cur===id){const n=f.c.scenes[Math.max(0,f.i-1)]||allScenes()[0];P.cur=n?(n.s||n).id:null}touch();renderAll()}
function confirm2(btn,fn,label){if(btn.dataset.armed){fn();return}btn.dataset.armed=1;const o=btn.innerHTML;btn.textContent=label||'¿Borrar?';btn.classList.add('warn');setTimeout(()=>{if(btn.isConnected){delete btn.dataset.armed;btn.innerHTML=o;btn.classList.remove('warn')}},3000)}
let drag=null;
$('#binder').addEventListener('click',e=>{
  const a=e.target.closest('[data-a]'),li=e.target.closest('.sc'),ch=e.target.closest('.chap'),c=ch&&P.chapters.find(x=>x.id===ch.dataset.c);
  if(a){const v=a.dataset.a;
    if(v==='addc'){addChapter();return}
    if(v==='tog'){c.open=!c.open;touch();renderBinder()}
    if(v==='adds')addScene(c);
    if(v==='cup'){const i=P.chapters.indexOf(c);if(i>0){P.chapters.splice(i,1);P.chapters.splice(i-1,0,c);touch();renderBinder();if(isView('board'))renderBoard()}}
    if(v==='cdel')confirm2(a,()=>{c.scenes.forEach(s=>{delete T[s.id];delete H[s.id];delS.add(s.id)});const had=c.scenes.some(s=>s.id===P.cur);P.chapters.splice(P.chapters.indexOf(c),1);if(had||!cur()){const f=allScenes()[0];P.cur=f?f.s.id:null}touch();renderAll();if(!isView('ms'))setView(document.body.dataset.view)});
    return}
  if(li)select(li.dataset.s);
});
$('#binder').addEventListener('change',e=>{if(e.target.id==='simpleT')setSimple(!e.target.checked)});
$('#binder').addEventListener('input',e=>{if(e.target.dataset.a==='ct'){const c=P.chapters.find(x=>x.id===e.target.closest('.chap').dataset.c);c.title=e.target.value;const k=cur();if(k&&k.c===c)$('#schap').textContent=c.title;touch()}});
function moveSceneTo(id,chapId,beforeId){const f=findScene(id);if(!f)return;const s=f.c.scenes.splice(f.i,1)[0],c=P.chapters.find(x=>x.id===chapId);let i=c.scenes.length;if(beforeId&&beforeId!==id){const j=c.scenes.findIndex(x=>x.id===beforeId);if(j>-1)i=j}c.scenes.splice(i,0,s);c.open=true;touch();renderBinder();if(isView('board'))renderBoard();else renderEditor()}
$('#binder').addEventListener('dragstart',e=>{const li=e.target.closest('.sc');if(li){drag=li.dataset.s;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',drag)}});
$('#binder').addEventListener('dragover',e=>{if(P.simple){const li=e.target.closest('.sc');if(drag&&li){e.preventDefault();$$('.sc.over').forEach(x=>x!==li&&x.classList.remove('over'));li.classList.add('over')}return}const ch=e.target.closest('.chap');if(drag&&ch){e.preventDefault();$$('.chap.over').forEach(x=>x!==ch&&x.classList.remove('over'));ch.classList.add('over')}});
function moveChapter(cid,beforeCid){const i=P.chapters.findIndex(c=>c.id===cid);if(i<0||cid===beforeCid)return;const [c]=P.chapters.splice(i,1);let j=beforeCid?P.chapters.findIndex(x=>x.id===beforeCid):P.chapters.length;if(j<0)j=P.chapters.length;P.chapters.splice(j,0,c);touch();renderBinder();if(isView('board'))renderBoard();else if(isView('time'))drawTL()}
$('#binder').addEventListener('drop',e=>{if(P.simple){const li=e.target.closest('.sc');if(!drag||!li)return;e.preventDefault();const f=findScene(drag);moveChapter(f.c.id,li.dataset.c);drag=null;return}const ch=e.target.closest('.chap');if(!drag||!ch)return;e.preventDefault();const li=e.target.closest('.sc');moveSceneTo(drag,ch.dataset.c,li&&li.dataset.s);drag=null});
$('#binder').addEventListener('dragend',()=>{drag=null;$$('.over').forEach(x=>x.classList.remove('over'))});

/* ---------- editor ---------- */
function renderEditor(force){
  const k=cur();
  if(!k){$('#stitle').value='';ed.innerHTML='';ed.contentEditable='false';$('#schap').textContent='Agregá un capítulo para empezar';edScene=null;return}
  ed.contentEditable='true';
  $('#stitle').value=P.simple?k.c.title:k.s.title;$('#sstat').value=k.s.status;$('#spov').value=k.s.pov||'';$('#schap').textContent=k.c.title;$('#schap').hidden=P.simple;
  $('#tabEsc').textContent=U().One;$('#lS').textContent='en '+(P.simple?'el capítulo':'la escena');$('#fC').hidden=P.simple;
  if(force||edScene!==k.s.id){ed.innerHTML=T[k.s.id]||'';edScene=k.s.id;lastRange=null}
  $('#syn').value=k.s.syn||'';$('#nts').value=k.s.notes||'';
  renderAppear();renderVers();renderReviews();counts();if(typeof navSync==='function')navSync();
}
function counts(){
  const k=cur();const td=Math.max(0,P.log[today()]||0),g=P.goal.daily||1;
  $('#wS').textContent=k?fmt(sw(k.s.id)):0;$('#wC').textContent=k?fmt(chapWords(k.c)):0;$('#wT').textContent=fmt(totalWords());
  $('#tNum').textContent=fmt(td)+' / '+fmt(g);$('#tBar').style.width=Math.min(100,td/g*100)+'%';
}
let rbT=null;
ed.addEventListener('beforeinput',()=>{if(!ed.firstElementChild&&!ed.textContent.trim()){ed.innerHTML='<p><br></p>';placeCaret(ed.firstChild,0)}});
ed.addEventListener('input',()=>{
  const k=cur();if(!k)return;const id=k.s.id,b=sw(id);let h=ed.innerHTML;if(h==='<br>'||h==='<p><br></p>')h='';T[id]=h;
  const d=sw(id)-b;if(d){const t=today();P.log[t]=(P.log[t]||0)+d}
  counts();touch(id);
  if(Date.now()-lastAuto>10*60e3){lastAuto=Date.now();autoSnap(id)}
  clearTimeout(rbT);rbT=setTimeout(()=>{renderBinder();renderAppear();if($('#dGoals').open)renderGoals()},900);
});
ed.addEventListener('paste',e=>{
  e.preventDefault();const cd=e.clipboardData;if(!cd)return;const h=cd.getData('text/html'),t=cd.getData('text/plain');
  if(h){const c=clean(h);if(c){document.execCommand('insertHTML',false,c);return}}
  if(!t)return;const ps=t.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(ps.length<=1)document.execCommand('insertText',false,t.replace(/\s*\r?\n\s*/g,' '));
  else document.execCommand('insertHTML',false,ps.map(p=>'<p>'+esc(p)+'</p>').join(''));
});
function placeCaret(node,off){const r=document.createRange();r.setStart(node,off);r.collapse(true);const s=getSelection();s.removeAllRanges();s.addRange(r)}
const selInEd=()=>{const s=getSelection();return s&&s.rangeCount&&ed.contains(s.getRangeAt(0).commonAncestorContainer)};
document.addEventListener('selectionchange',()=>{if(selInEd()){lastRange=getSelection().getRangeAt(0).cloneRange();$$('#etools [data-cmd],#fbar [data-fcmd]').forEach(b=>{let on=false;try{on=document.queryCommandState(b.dataset.cmd||b.dataset.fcmd)}catch(e){}b.classList.toggle('on',on)})}});
function restoreSel(){if(selInEd())return;ed.focus();const s=getSelection();s.removeAllRanges();if(lastRange&&ed.contains(lastRange.startContainer))s.addRange(lastRange);else{const r=document.createRange();r.selectNodeContents(ed);r.collapse(false);s.addRange(r)}}
$('#etools').addEventListener('mousedown',e=>{if(e.target.closest('[data-cmd]'))e.preventDefault()});
$('#etools').addEventListener('click',e=>{const b=e.target.closest('[data-cmd]');if(!b)return;restoreSel();document.execCommand(b.dataset.cmd)});
$('#stitle').addEventListener('input',e=>{const k=cur();if(k){k.s.title=e.target.value;if(P.simple)k.c.title=e.target.value;touch();renderBinder()}});
$('#sstat').addEventListener('change',e=>{const k=cur();if(k){k.s.status=e.target.value;touch();renderBinder()}});
$('#spov').addEventListener('input',e=>{const k=cur();if(k){k.s.pov=e.target.value;touch()}});
$('#syn').addEventListener('input',e=>{const k=cur();if(k){k.s.syn=e.target.value;touch()}});
$('#nts').addEventListener('input',e=>{const k=cur();if(k){k.s.notes=e.target.value;touch()}});
$('#ptitle').addEventListener('input',e=>{P.title=e.target.value;touch()});
function moveScene(dir){const k=cur();if(!k)return;if(P.simple){const i=P.chapters.indexOf(k.c),j=i+dir;if(j<0||j>=P.chapters.length)return;P.chapters.splice(i,1);P.chapters.splice(j,0,k.c);touch();renderBinder();return}const f=findScene(k.s.id),ni=f.i+dir;
  if(ni>=0&&ni<f.c.scenes.length){const [s]=f.c.scenes.splice(f.i,1);f.c.scenes.splice(ni,0,s)}
  else{const t=P.chapters[P.chapters.indexOf(f.c)+dir];if(!t)return;const [s]=f.c.scenes.splice(f.i,1);dir<0?t.scenes.push(s):t.scenes.unshift(s);t.open=true}
  touch();renderBinder();renderEditor()}
$('#sUp').onclick=()=>moveScene(-1);$('#sDn').onclick=()=>moveScene(1);
$('#sDel').onclick=e=>{const k=cur();if(k)confirm2(e.currentTarget,()=>delScene(k.s.id))};

/* ---------- panel tabs ---------- */
function setTab(t){$$('.tabs button').forEach(x=>x.classList.toggle('on',x.dataset.t===t));$$('#panel .pane').forEach(p=>p.classList.toggle('on',p.id==='p-'+t));if(t==='fic')renderCards();if(t==='bus')renderSearch()}
$('.tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setTab(b.dataset.t)});

/* ---------- appearances ---------- */
function renderAppear(){const k=cur(),el=$('#appear');if(!k){el.innerHTML='';return}
  const ids=appear().byScene[k.s.id]||[];
  el.innerHTML=ids.length?ids.map(id=>{const c=P.cards.find(x=>x.id===id);return`<button class="k-${c.kind}" data-card="${id}">${esc(c.name)}</button>`}).join(''):'<span class="note" style="margin:0">Ninguna ficha aparece todavía. Se detectan por nombre o por "también llamado".</span>'}
$('#appear').addEventListener('click',e=>{const b=e.target.closest('[data-card]');if(b)openCard(b.dataset.card)});
function openCard(id){if(!isView('ms'))setView('ms');setTab('fic');cardKind='all';$('#fq').value='';renderCards();const d=document.querySelector(`.card[data-id="${id}"]`);if(d){d.open=true;d.scrollIntoView({block:'nearest'})}if(innerWidth<=900)document.body.classList.add('sp')}

/* ---------- cards ---------- */
function renderCards(){
  $('#fk').innerHTML=[['all','Todas'],...Object.entries(KINDS)].map(([v,l])=>`<button data-k="${v}" class="${cardKind===v?'on':''}">${l}${v==='all'?'':' · '+P.cards.filter(c=>c.kind===v).length}</button>`).join('');
  const q=$('#fq').value.trim().toLowerCase(),ap=appear().byCard;
  const list=P.cards.filter(c=>(cardKind==='all'||c.kind===cardKind)&&(!q||(c.name+' '+c.alias+' '+c.role+' '+c.notes).toLowerCase().includes(q)));
  $('#cards').innerHTML=list.length?list.map(c=>{const sc=(ap[c.id]||[]).map(findScene).filter(Boolean);
    return`<details class="card" data-id="${c.id}"><summary><div><b>${esc(c.name||'Sin nombre')}</b><em>${esc(c.role)}</em></div><span>${KINDS[c.kind]} · ${sc.length} esc.</span></summary><div class="cb">
    <label>Nombre</label><input data-f="name" value="${esc(c.name)}">
    <label>También llamado (separado por comas)</label><input data-f="alias" value="${esc(c.alias)}" placeholder="apodos, títulos, formas de nombrarlo">
    <label>Tipo</label><select data-f="kind">${Object.entries(KINDS).map(([v,l])=>`<option value="${v}" ${c.kind===v?'selected':''}>${l}</option>`).join('')}</select>
    <label>Rol o resumen</label><input data-f="role" value="${esc(c.role)}">
    <label>Notas</label><textarea data-f="notes" rows="5">${esc(c.notes)}</textarea>
    <label>Aparece en</label><div class="links">${sc.length?sc.map(f=>`<button data-go="${f.s.id}">${esc(whereOf(f.c,f.s))}</button>`).join(''):'<span class="note" style="margin:0">Todavía no aparece en el texto.</span>'}</div>
    <button class="ib bord" data-a="cardDel" style="margin-top:10px;padding:0 10px">Borrar ficha</button></div></details>`}).join(''):'<p class="note">No hay fichas'+(q?' que coincidan con la búsqueda':' de este tipo')+'.</p>';
}
$('#fk').addEventListener('click',e=>{const b=e.target.closest('button');if(b){cardKind=b.dataset.k;renderCards()}});
$('#fq').addEventListener('input',renderCards);
$('#addCard').onclick=()=>{const c={id:nid(),kind:cardKind==='all'?'personaje':cardKind,name:'',alias:'',role:'',notes:''};P.cards.unshift(c);$('#fq').value='';touch();renderCards();const d=document.querySelector(`.card[data-id="${c.id}"]`);d.open=true;d.querySelector('input').focus()};
$('#cards').addEventListener('input',e=>{const f=e.target.dataset.f,d=e.target.closest('.card');if(!f||!d)return;const c=P.cards.find(x=>x.id===d.dataset.id);c[f]=e.target.value;touch();if(f==='name'||f==='alias')appearMemo=null;if(f==='name')d.querySelector('summary b').textContent=c.name||'Sin nombre';if(f==='role')d.querySelector('summary em').textContent=c.role});
$('#cards').addEventListener('change',e=>{const f=e.target.dataset.f;if(f==='kind'||f==='name'||f==='alias'){const open=e.target.closest('.card').dataset.id;renderCards();renderAppear();const d=document.querySelector(`.card[data-id="${open}"]`);if(d)d.open=true}});
$('#cards').addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){select(g.dataset.go);return}const a=e.target.closest('[data-a=cardDel]');if(a)confirm2(a,()=>{const id=a.closest('.card').dataset.id;P.cards=P.cards.filter(x=>x.id!==id);P.rels=(P.rels||[]).filter(r=>r.a!==id&&r.b!==id);appearMemo=null;touch();renderCards();renderAppear()})});

/* ---------- goals ---------- */
function renderGoals(){
  const g=P.goal,td=Math.max(0,P.log[today()]||0),tot=totalWords();
  const days=[...Array(14)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(13-i));return{d,v:Math.max(0,P.log[dkey(d)]||0)}});
  const mx=Math.max(g.daily,...days.map(x=>x.v));
  let streak=0;for(let i=13;i>=0;i--){if(days[i].v>=g.daily)streak++;else if(i===13)continue;else break}
  const avg=days.slice(7).reduce((a,x)=>a+x.v,0)/7,left=Math.max(0,g.total-tot);
  const eta=left===0?'¡Meta cumplida!':avg>0?fmt(Math.ceil(left/avg))+' días':'—';
  const sc=allScenes();
  $('#p-met').innerHTML=`<div class="big">${fmt(td)} <small>de ${fmt(g.daily)} palabras hoy</small></div><div class="meter"><i style="width:${Math.min(100,td/g.daily*100)}%"></i></div><div class="note" style="margin-top:2px">${td>=g.daily?'Meta del día cumplida.':'Te faltan '+fmt(g.daily-td)+' para la meta de hoy.'}</div>
  <label>Últimos 14 días</label><div class="strip">${days.map(x=>`<div title="${x.d.toLocaleDateString('es-AR')}: ${fmt(x.v)}"><i class="${x.v>=g.daily?'ok':''}" style="height:${x.v/mx*100}%"></i><span>${'DLMMJVS'[x.d.getDay()]}</span></div>`).join('')}</div>
  <label>${typeName(P)}</label><div class="big" style="font-size:32px">${fmt(tot)} <small>de ${fmt(g.total)}</small></div><div class="meter b"><i style="width:${Math.min(100,tot/g.total*100)}%"></i></div>
  <div class="facts"><div><b>${streak}</b>días seguidos cumpliendo</div><div><b>${fmt(avg)}</b>promedio diario (7 días)</div><div><b>${eta}</b>para terminar a este ritmo</div><div><b>${sc.filter(x=>x.s.status==='lista').length} / ${sc.length}</b>${P.simple?'capítulos listos':'escenas listas'}</div></div>
  <div class="two"><div><label for="gD">Meta diaria</label><input id="gD" type="number" min="50" step="50" value="${g.daily}"></div><div><label for="gT">Meta total</label><input id="gT" type="number" min="500" step="500" value="${g.total}"></div></div>`;
}
$('#p-met').addEventListener('change',e=>{if(e.target.id==='gD')P.goal.daily=Math.max(50,+e.target.value||1000);if(e.target.id==='gT')P.goal.total=Math.max(500,+e.target.value||80000);touch();renderGoals();counts()});

/* ---------- search & replace ---------- */
let sUndo=null,sScope='all';
const sScenes=()=>{if(sScope==='all')return allScenes();const k=cur();return k?(P.simple?[{c:k.c,s:k.s}]:k.c.scenes.map(s=>({c:k.c,s}))):[]};
$('#sScope').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sScope=b.dataset.s;$$('#sScope button').forEach(x=>x.classList.toggle('on',x===b));renderSearch()});
function sRe(){const q=$('#sq').value;if(!q)return null;const pat=$('#sWord').checked?'(?<![\\p{L}\\p{N}])'+escRe(q)+'(?![\\p{L}\\p{N}])':escRe(q);return new RegExp(pat,'gu'+($('#sCase').checked?'':'i'))}
function renderSearch(){
  const re=sRe(),el=$('#sRes');if(!re){el.innerHTML='<p class="note">'+(sScope==='all'?'Busca en todos los capítulos de la obra.':'Busca solo en el capítulo abierto.')+' Ctrl+F te trae acá.</p>';return}
  let tot=0,n=0;const out=[];
  for(const {c,s} of sScenes()){const txt=plainOf(T[s.id]);const ms=[...txt.matchAll(re)];if(!ms.length)continue;tot+=ms.length;n++;
    const snip=ms.slice(0,2).map(m=>{const a=Math.max(0,m.index-40),b=Math.min(txt.length,m.index+m[0].length+40);return(a?'…':'')+esc(txt.slice(a,m.index))+'<mark>'+esc(m[0])+'</mark>'+esc(txt.slice(m.index+m[0].length,b))+(b<txt.length?'…':'')}).join('<br>');
    out.push(`<button data-go="${s.id}"><small>${esc(whereOf(c,s))} · ${ms.length}</small>${snip}</button>`)}
  el.innerHTML=`<p class="note">${tot?fmt(tot)+' coincidencia'+(tot>1?'s':'')+' en '+n+' '+(n>1?U().many:U().one):'Sin coincidencias.'}</p><div class="sres">${out.join('')}</div>`;
}
let sT=null;['#sq','#sCase','#sWord'].forEach(s=>$(s).addEventListener('input',()=>{clearTimeout(sT);sT=setTimeout(renderSearch,200)}));
$('#sRes').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b)return;select(b.dataset.go);setTimeout(()=>findInEd(sRe()),30)});
function findInEd(re){if(!re)return;const w=document.createTreeWalker(ed,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){re.lastIndex=0;const m=re.exec(n.nodeValue);if(m){const r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);ed.focus();const s=getSelection();s.removeAllRanges();s.addRange(r);n.parentElement.scrollIntoView({block:'center'});return}}}
function replaceInHTML(h,re,rep){tpl.innerHTML=h;let c=0;const w=document.createTreeWalker(tpl.content,NodeFilter.SHOW_TEXT);const ns=[];let n;while(n=w.nextNode())ns.push(n);for(const x of ns){re.lastIndex=0;const v=x.nodeValue.replace(re,()=>{c++;return rep});if(c)x.nodeValue=v}return{h:tpl.innerHTML,c}}
$('#sRep').onclick=e=>{const re=sRe();if(!re)return;const rep=$('#sr').value,btn=e.currentTarget;if(btn.dataset.busy)return;
  let n=0;for(const {s} of sScenes())n+=(plainOf(T[s.id]).match(re)||[]).length;
  if(!n){$('#sRes').insertAdjacentHTML('afterbegin','<p class="note">No hay nada para reemplazar.</p>');return}
  confirm2(btn,()=>busy(btn,'Reemplazando…',async()=>{const old={};let tot=0;
    for(const {s} of sScenes()){const r=replaceInHTML(T[s.id]||'',re,rep);if(r.c){old[s.id]=T[s.id];snap(s.id,'Antes de reemplazar «'+$('#sq').value+'»',true);T[s.id]=r.h;tot+=r.c;touch(s.id)}}
    sUndo=Object.keys(old).length?old:null;$('#sUndo').disabled=!sUndo;renderEditor(true);renderBinder();renderSearch();
    $('#sRes').insertAdjacentHTML('afterbegin',`<p class="note">Reemplacé ${fmt(tot)} coincidencia${tot===1?'':'s'}.</p>`)}),'Confirmar ('+n+')');
};
$('#sUndo').onclick=e=>{if(!sUndo)return;busy(e.currentTarget,'Deshaciendo…',async()=>{for(const id of Object.keys(sUndo)){T[id]=sUndo[id];touch(id)}sUndo=null;renderEditor(true);renderBinder();renderSearch()}).then(()=>{$('#sUndo').disabled=!sUndo})};

/* ---------- versions ---------- */
function snap(sid,note,auto){const html=T[sid]||'';if(!html)return false;const a=H[sid]=H[sid]||[];const last=a[a.length-1];if(last&&last.html===html)return false;
  a.push({at:Date.now(),html,words:sw(sid),note:note||'',auto:!!auto});while(a.length>25){const i=a.findIndex(v=>v.auto);a.splice(i>-1?i:0,1)}dirtyH.add(sid);touch();return true}
function autoSnap(sid){const html=T[sid]||'';if(!html)return;const a=H[sid]||[],last=a[a.length-1];
  if(!last){if(sw(sid)>=50)snap(sid,'Automática',true);return}
  if(last.html===html)return;
  if(Math.abs(sw(sid)-last.words)>=25||Math.abs(html.length-last.html.length)>=300||Date.now()-last.at>20*60e3)snap(sid,'Automática',true)}
const fdt=t=>new Date(t).toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
function renderVers(){const k=cur(),el=$('#vers');if(!k){el.innerHTML='';return}const a=(H[k.s.id]||[]).slice().reverse(),now=sw(k.s.id);
  el.innerHTML=`<div class="vnew"><input id="vNote" placeholder="Nota (opcional)"><button id="vSave">Guardar</button></div>`+(a.length?'<div class="vlist">'+a.map(v=>{const d=v.words-now;return`<button data-at="${v.at}">${fdt(v.at)} · ${fmt(v.words)} pal.${d?` <span style="color:var(--mut)">(${d>0?'+':''}${fmt(d)} vs. ahora)</span>`:''}<small>${esc(v.note||'')}</small></button>`}).join('')+'</div>':'<p class="note" style="margin:0">Todavía no hay versiones. Se guardan solas cuando cambiás mucho el texto.</p>')}
function manualSnap(){const k=cur();if(!k)return;const n=($('#vNote')&&$('#vNote').value)||'Manual';const ok=snap(k.s.id,n,false);renderVers();const b=$('#bVer');b.textContent=ok?'Versión guardada':'Sin cambios';setTimeout(()=>b.textContent='Guardar versión',1500)}
$('#bVer').onclick=manualSnap;
$('#vers').addEventListener('click',e=>{if(e.target.id==='vSave'){manualSnap();return}const b=e.target.closest('[data-at]');if(b)openVer(+b.dataset.at)});
let verAt=null;
function lcsDiff(a,b){const n=a.length,m=b.length;if(n*m>300000)return null;const t=Array.from({length:n+1},()=>new Uint16Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)t[i][j]=a[i]===b[j]?t[i+1][j+1]+1:Math.max(t[i+1][j],t[i][j+1]);
  const out=[];let i=0,j=0;while(i<n&&j<m){if(a[i]===b[j]){out.push(['=',a[i]]);i++;j++}else if(t[i+1][j]>=t[i][j+1])out.push(['-',a[i++]]);else out.push(['+',b[j++]])}
  while(i<n)out.push(['-',a[i++]]);while(j<m)out.push(['+',b[j++]]);return out}
function openVer(at){const k=cur(),v=(H[k.s.id]||[]).find(x=>x.at===at);if(!v)return;verAt=at;
  const a=parasOf(v.html),b=parasOf(T[k.s.id]),d=lcsDiff(a,b);
  $('#verT').textContent='Versión del '+fdt(v.at);
  if(d){const ch=d.filter(x=>x[0]!=='=').length;$('#verS').textContent=fmt(v.words)+' palabras · '+(v.note||'')+' · '+(ch?ch+' párrafo'+(ch>1?'s':'')+' distinto'+(ch>1?'s':'')+' respecto de ahora':'igual al texto actual');
    $('#verBody').innerHTML=d.map(([o,p])=>o==='='?`<p>${esc(p)}</p>`:o==='-'?`<p class="del"><span class="tag">Solo en esta versión</span>${esc(p)}</p>`:`<p class="add"><span class="tag">Agregado después</span>${esc(p)}</p>`).join('')}
  else{$('#verS').textContent=fmt(v.words)+' palabras · '+(v.note||'');$('#verBody').innerHTML=v.html}
  $('#dVer').showModal()}
$('#verClose').onclick=()=>$('#dVer').close();
$('#verRes').onclick=e=>busy(e.currentTarget,'Restaurando versión…',async()=>{const k=cur(),v=(H[k.s.id]||[]).find(x=>x.at===verAt);if(!v)return;snap(k.s.id,'Antes de restaurar',true);T[k.s.id]=v.html;touch(k.s.id);renderEditor(true);renderBinder();$('#dVer').close()});
$('#verDel').onclick=e=>confirm2(e.currentTarget,()=>{const k=cur();H[k.s.id]=(H[k.s.id]||[]).filter(x=>x.at!==verAt);dirtyH.add(k.s.id);touch();renderVers();$('#dVer').close()});

/* ---------- Claude: critique ---------- */
let SAMPLE=null,revCtl=null;
const FOCUS={general:'una lectura general del texto: qué logra, qué le falta, si cumple su función en la obra',ritmo:'el ritmo y la tensión: dónde se estanca, dónde corre demasiado, cómo terminan los párrafos y la escena',dialogos:'los diálogos: naturalidad, voz propia de cada personaje, subtexto, acotaciones',continuidad:'la continuidad con las fichas de personajes, lugares y lore y con la línea de tiempo: contradicciones, cambios de carácter no justificados, datos que no cierran',estilo:'el estilo y la prosa: repeticiones, muletillas, adjetivación, imágenes gastadas, frases que se pueden ajustar',historia:'la verosimilitud histórica respecto del momento en que transcurre: anacronismos de lenguaje, objetos, costumbres o hechos. Distinguí lo que es seguro de lo que es dudoso'};
function cardLine(c){return'- '+c.name+' ('+KINDS[c.kind]+(c.alias?'; también: '+c.alias:'')+'): '+(c.role||'')+(c.notes?'. '+c.notes:'')}
function revPrompt(focus){const k=cur(),sc=allScenes(),i=sc.findIndex(x=>x.s.id===k.s.id),prev=sc[i-1],next=sc[i+1];
  const ids=appear().byScene[k.s.id]||[];let cards=P.cards.filter(c=>ids.includes(c.id)||(k.s.pov&&c.name.toLowerCase().includes(k.s.pov.toLowerCase().split(' ')[0])));
  if(focus==='continuidad')cards=P.cards.slice(0,40);
  const MM=metro(),mine={when:(MM.st['s:'+k.s.id]||{}).when||''};
  const tl=(focus==='continuidad'||focus==='historia')&&MM.order.length?'\nCronología de la obra (en el orden en que pasan los hechos, no en el que se leen):\n'+MM.order.map(id=>{const s=MM.st[id],lb=stLabel(id),who=MM.lines.filter(l=>stops(l).includes(id)).map(lineName);return'- '+(s.when||'momento sin definir')+': '+lb.a+' '+lb.b+(who.length?' (con '+who.join(', ')+')':'')+(s.notes?'. '+s.notes:'')}).join('\n'):'';
  return`Sos un editor literario exigente y generoso que trabaja con un autor argentino. Escribí en español rioplatense.
Foco pedido: ${FOCUS[focus]}.
Devolvé la crítica en Markdown con estas secciones:
## Lo que funciona
(2 o 3 puntos concretos)
## Problemas
(los más importantes primero; citá frases breves del texto entre comillas y explicá por qué fallan)
## Sugerencias
(acciones concretas para la próxima revisión)
## Una pregunta para el autor
No reescribas el texto entero. Sé específico; nada de elogios genéricos.

Obra: "${P.title}" (${typeName(P).toLowerCase()}). ${P.simple?'Capítulo '+chapNo(k.s.id)+': '+k.c.title:'Capítulo: '+k.c.title+'. Escena: '+(k.s.title||'sin título')}. Punto de vista: ${k.s.pov||'sin definir'}. Momento en la historia: ${mine&&mine.when||'sin definir'}.
Sinopsis: ${k.s.syn||'(sin sinopsis)'}
${prev?'Anterior: '+whereOf(prev.c,prev.s)+(prev.s.syn?' — '+prev.s.syn:''):'Es el comienzo de la obra.'}
${next?'Siguiente: '+whereOf(next.c,next.s)+(next.s.syn?' — '+next.s.syn:''):'Es lo último escrito.'}
${cards.length?'Fichas relevantes:\n'+cards.map(cardLine).join('\n'):'No hay fichas relevantes.'}${tl}

TEXTO A REVISAR:
"""
${plainOf(T[k.s.id]).slice(0,60000)}
"""`}
function md(s){const e=esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>');const out=[];let ul=false;
  for(const ln of e.split('\n')){const h=/^#{1,4}\s+(.*)/.exec(ln),li=/^\s*(?:[-*]|\d+\.)\s+(.*)/.exec(ln);
    if(li){if(!ul){out.push('<ul>');ul=true}out.push('<li>'+li[1]+'</li>');continue}if(ul){out.push('</ul>');ul=false}
    if(h)out.push('<h3>'+h[1]+'</h3>');else if(ln.trim())out.push('<p>'+ln+'</p>')}
  if(ul)out.push('</ul>');return out.join('')}
const FNAME={general:'Lectura general',ritmo:'Ritmo y tensión',dialogos:'Diálogos',continuidad:'Personajes y continuidad',estilo:'Estilo y prosa',historia:'Verosimilitud histórica'};
function renderReviews(live){const k=cur(),el=$('#revOut');if(!k||(!SAMPLE&&!IS_APP)){el.innerHTML='';return}if(!SAMPLE&&$('#revIn'))return;if(revCtl&&!live)return;
  const r=k.s.reviews||[];el.innerHTML=r.length?`<div class="rev"><div class="rh"><span>${FNAME[r[0].focus]||''}</span><span>${fdt(r[0].at)}</span></div>${md(r[0].text)}</div>`+(r.length>1?`<details class="old"><summary>Críticas anteriores (${r.length-1})</summary>${r.slice(1).map(x=>`<div class="rev"><div class="rh"><span>${FNAME[x.focus]||''}</span><span>${fdt(x.at)}</span></div>${md(x.text)}</div>`).join('')}</details>`:''):'<p class="note">Pedile a Claude una devolución de editor sobre este '+(P.simple?'capítulo':'texto')+', con el foco que elijas.</p>'}
$('#revGo').onclick=async()=>{
  if(revCtl){revCtl.abort();return}
  if(!SAMPLE&&IS_APP){const k=cur();if(!k)return;if(!plainOf(T[k.s.id]).trim()){$('#revOut').innerHTML='<p class="note">Todavía no hay texto: escribí algo primero.</p>';return}
    const focus=$('#revFocus').value,sid=k.s.id;try{await copyText(revPrompt(focus))}catch(e){}
    $('#revOut').innerHTML='<p class="note">Copié el pedido. Abrí un chat con Claude, pegalo, y pegá acá la respuesta:</p><textarea id="revIn" rows="6" style="width:100%;border:1px solid var(--line);border-radius:8px;background:var(--bg);padding:8px 10px;font-size:15px"></textarea><div class="two" style="margin-top:8px"><button id="revSave" class="pri">Guardar crítica</button><button id="revCancel">Cancelar</button></div>';
    $('#revSave').onclick=()=>{const t=$('#revIn').value.trim();if(!t)return;const f=findScene(sid);if(f){f.s.reviews=[{at:Date.now(),focus,text:t},...(f.s.reviews||[])].slice(0,5);touch()}$('#revOut').innerHTML='';renderReviews()};
    $('#revCancel').onclick=()=>{$('#revOut').innerHTML='';renderReviews()};return}
  const k=cur();if(!k||!SAMPLE)return;if(!plainOf(T[k.s.id]).trim()){$('#revOut').innerHTML='<p class="note">Todavía no hay texto: escribí algo primero.</p>';return}
  const focus=$('#revFocus').value,sid=k.s.id;revCtl=new AbortController();busyOn('Claude está revisando…');const btn=$('#revGo');btn.textContent='Detener';btn.classList.remove('pri');
  $('#revOut').innerHTML='<div class="rev" id="revLive"><p class="note" style="margin:0">Claude está leyendo…</p></div>';
  try{const {text,truncated}=await SAMPLE(revPrompt(focus),{signal:revCtl.signal,onText:({text})=>{const l=$('#revLive');if(l&&P.cur===sid)l.innerHTML=md(text)}});
    const f=findScene(sid);if(f){f.s.reviews=[{at:Date.now(),focus,text:text+(truncated?'\n\n(La crítica quedó cortada.)':'')},...(f.s.reviews||[])].slice(0,5);touch()}
  }catch(e){const c=e&&e.code;
    if(c==='not_granted'||c==='sampling_disabled'||c==='not_declared'||c==='capability_disabled'){$('#revBox').hidden=true;SAMPLE=null}
    const msg=c==='cancelled'?'':c==='rate_limited'?'Llegaste al límite de uso de Claude por ahora. Probá más tarde.':c==='session_expired'?'Tu sesión venció: volvé a iniciar sesión en claude.ai.':c==='prompt_too_large'?'La escena es demasiado larga para una sola crítica.':c==='refused'?'Claude no pudo hacer esta crítica.':'No se pudo completar la crítica. Probá de nuevo.';
    revCtl=null;renderReviews();if(msg)$('#revOut').insertAdjacentHTML('afterbegin','<p class="note">'+msg+'</p>');if(e&&e.text&&c!=='refused')$('#revOut').insertAdjacentHTML('afterbegin','<div class="rev">'+md(e.text)+'</div>')}
  busyOff();revCtl=null;btn.textContent='Pedir crítica';btn.classList.add('pri');renderReviews();
};

/* ---------- dictation & reading aloud ---------- */
let DICT=null,TTS=null,dictLang=true,ttsParas=[];
function insertAtCaret(text){restoreSel();if(!ed.textContent.trim())text=text.replace(/^\s+/,'');if(!ed.firstElementChild){ed.innerHTML='<p><br></p>';placeCaret(ed.firstChild,0)}document.execCommand('insertText',false,text)}
$('#bDict').onclick=()=>{if(!DICT)return;if(DICT.active()){DICT.stop().catch(()=>{});return}
  restoreSel();DICT.start(dictLang?{language:'es'}:undefined).catch(e=>{const c=e&&e.code;
    if(c==='unavailable'&&dictLang){dictLang=false;$('#partial').textContent='Tocá Dictar de nuevo para probar con el idioma de tu navegador.';return}
    if(c==='not_granted'||c==='unavailable'){$('#bDict').hidden=true}
    $('#partial').textContent=c==='not_granted'?'El dictado está desactivado para esta página.':c==='dismissed'||c==='stopped'?'':c==='rate_limited'?'Demasiados dictados a la vez; probá en un momento.':c==='unavailable'?'':'No se pudo iniciar el dictado.'})};
$('#bTts').onclick=()=>{if(!TTS)return;if(TTS.active()){TTS.stop().catch(()=>{});return}
  ttsParas=[...ed.querySelectorAll('p')];if(!ttsParas.length)return;let i=0;
  if(selInEd()){const n=getSelection().getRangeAt(0).startContainer;const p=(n.nodeType===1?n:n.parentElement).closest('p');const j=ttsParas.indexOf(p);if(j>0)i=j}
  const lines=[];for(let j=i;j<ttsParas.length&&lines.length<100;j++){const t=ttsParas[j].textContent.trim();if(t)lines.push({text:t.slice(0,2000),id:String(j)})}
  if(!lines.length)return;TTS.speak(lines,{language:'es'}).catch(e=>{const c=e&&e.code;if(c==='not_granted'||c==='unavailable')$('#bTts').hidden=true;else if(c==='rate_limited')$('#partial').textContent='Mucha lectura por ahora; probá en un rato.'})};
function hookVoice(w){
  if(w==='d'&&DICT){$('#bDict').hidden=false;
    DICT.onFinal(({text})=>{$('#partial').textContent='';insertAtCaret(text)});
    DICT.onPartial(({text})=>{$('#partial').textContent=text});
    DICT.onState(({state,reason})=>{$('#bDict').textContent=state==='idle'?'Dictar':'Detener dictado';$('#bDict').classList.toggle('on',state!=='idle');if(state==='idle'){if(reason==='not_granted'||reason==='unavailable')$('#bDict').hidden=true}})}
  if(w==='t'&&TTS){$('#bTts').hidden=false;
    TTS.onLine(({id})=>{ttsParas.forEach(p=>p.classList.remove('reading'));const p=ttsParas[+id];if(p&&p.isConnected){p.classList.add('reading');p.scrollIntoView({block:'center',behavior:'smooth'})}});
    TTS.onState(({state,reason})=>{$('#bTts').textContent=state==='idle'?'Escuchar':'Detener lectura';$('#bTts').classList.toggle('on',state!=='idle');if(state==='idle'){ttsParas.forEach(p=>p.classList.remove('reading'));if(reason==='not_granted'||reason==='unavailable')$('#bTts').hidden=true}})}
}

/* ---------- focus ---------- */
function focusOn(on){document.body.classList.toggle('focus',on);try{if(on)document.documentElement.requestFullscreen?.().catch(()=>{});else if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}catch(e){}if(on)setTimeout(()=>restoreSel(),60)}
$('#bFocus').onclick=()=>{setView('ms');focusOn(true)};$('#fOut').onclick=()=>focusOn(false);
