'use strict';
// ---------- mapa: mapa mental + diagrama ----------
const KC={centro:['#f2553d','#f2553d','#ffffff'],idea:['#ffffff','#bdb9b1','#1b1c22'],personaje:['#fde4de','#f2553d','#1b1c22'],lugar:['#e2e9fb','#4a78e0','#1b1c22'],lore:['#efe6fa','#8b62c9','#1b1c22'],escena:['#dff3e9','#2f9e6a','#1b1c22'],capitulo:['#1d2029','#1d2029','#ffffff']};
const KN={centro:'Centro',idea:'Idea',personaje:'Personaje',lugar:'Lugar',lore:'Lore',escena:'Escena',capitulo:'Capítulo'};
const cx=document.createElement('canvas').getContext('2d')||{measureText:t=>({width:t.length*7.5}),font:''};
let V={x:0,y:0,k:1},selN=null,selE=null,conn=null,pend=null,act=null,mUndo=[],last={id:'',t:0};
const M=()=>P.maps.find(m=>m.id===P.curMap)||P.maps[0];
const nodeOf=id=>M().nodes.find(n=>n.id===id);
function refT(ref){if(!ref)return null;const [t,id]=ref.split(':');if(t==='s'){const f=findScene(id);return f?{o:f.c.scenes[f.i],k:'title',kind:'escena'}:null}const c=P.cards.find(x=>x.id===id);return c?{o:c,k:'name',kind:c.kind}:null}
const txtOf=n=>{const r=refT(n.ref);return r?r.o[r.k]:n.t};
function wrapT(t){cx.font='500 14px Inter, system-ui, sans-serif';const ws=String(t||'Sin texto').split(/\s+/),L=[];let l='';for(const w of ws){const s=l?l+' '+w:w;if(cx.measureText(s).width>170&&l){L.push(l);l=w}else l=s}L.push(l);if(L.length>4){L.length=4;L[3]+='…'}return L}
function dims(n){const L=wrapT(txtOf(n));cx.font='500 14px Inter, system-ui, sans-serif';return{L,w:Math.max(70,Math.max(...L.map(s=>cx.measureText(s).width))+30)+(n.ref?16:0),h:L.length*18+18}}
function mapInner(exp){
  const m=M(),by=Object.fromEntries(m.nodes.map(n=>[n.id,n])),D=Object.fromEntries(m.nodes.map(n=>[n.id,dims(n)]));
  const bg=exp?'#ffffff':'var(--bg)',mu=exp?'#686a74':'var(--mut)';
  const E=m.edges.map(e=>{const a=by[e.a],b=by[e.b];if(!a||!b)return'';const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,d=`M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`,s=!exp&&selE===e.id;let lab='';
    if(e.label){cx.font='12px Inter, sans-serif';const lw=cx.measureText(e.label).width+14;lab=`<rect x="${mx-lw/2}" y="${my-11}" width="${lw}" height="22" rx="11" fill="${bg}" stroke="#d0cdc6"/><text x="${mx}" y="${my+4}" text-anchor="middle" font-size="12" fill="${mu}" font-family="Inter, sans-serif">${esc(e.label)}</text>`}
    return`<g data-e="${e.id}"><path d="${d}" fill="none" stroke="transparent" stroke-width="16"/><path d="${d}" fill="none" stroke="${s?'#f2553d':'#9093a3'}" stroke-width="${s?2.6:1.6}"${e.dash?' stroke-dasharray="5 5"':''}/>${lab}</g>`}).join('');
  const N=m.nodes.map(n=>{const {L,w,h}=D[n.id],c=KC[n.kind]||KC.idea,s=!exp&&selN===n.id,bold=n.kind==='centro'||n.kind==='capitulo';
    return`<g data-n="${n.id}" transform="translate(${n.x},${n.y})"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${n.kind==='idea'||n.kind==='centro'?Math.min(h/2,18):8}" fill="${c[0]}" stroke="${s?'#f2553d':c[1]}" stroke-width="${s?3:1.4}"/>${L.map((l,i)=>`<text x="${n.ref?-8:0}" y="${-h/2+22+i*18}" text-anchor="middle" fill="${c[2]}" font-size="14" font-weight="${bold?600:500}" font-family="Inter, system-ui, sans-serif">${esc(l)}</text>`).join('')}${n.ref?`<text x="${w/2-15}" y="5" font-size="13" fill="${c[2]}" opacity=".6" font-family="Inter, sans-serif">↗</text>`:''}${s?`<circle data-h="${n.id}" cx="${w/2}" cy="0" r="9" fill="#f2553d" stroke="#ffffff" stroke-width="2"/>`:''}</g>`}).join('');
  let tmp='';if(!exp&&conn){const a=by[conn.a];if(a)tmp=`<path d="M${a.x},${a.y} L${conn.p.x},${conn.p.y}" stroke="#f2553d" stroke-width="2" stroke-dasharray="6 5" fill="none"/>`}
  return E+tmp+N;
}
function drawMap(){const s=$('#msvg');if(!isView('map'))return;s.innerHTML=`<g transform="translate(${V.x},${V.y}) scale(${V.k})">${mapInner(false)}</g>`;$('#mempty').hidden=M().nodes.length>0}
function bbox(m){if(!m.nodes.length)return{x:0,y:0,w:0,h:0};let a=1e9,b=1e9,c=-1e9,d=-1e9;m.nodes.forEach(n=>{const q=dims(n);a=Math.min(a,n.x-q.w/2);b=Math.min(b,n.y-q.h/2);c=Math.max(c,n.x+q.w/2);d=Math.max(d,n.y+q.h/2)});return{x:a,y:b,w:c-a,h:d-b}}
function fitMap(){const s=$("#msvg"),W=s.clientWidth,H=s.clientHeight;if(!W){drawMap();return}const b=bbox(M()),side=W>700?310:0,bot=W<=700?H*.44:0,aw=W-side-40,ah=H-bot-40;
  if(!b.w){V={x:aw/2+20,y:ah/2+20,k:1};drawMap();return}
  const k=Math.max(.25,Math.min(1.3,aw/b.w,ah/b.h));V={k,x:20+(aw-b.w*k)/2-b.x*k,y:20+(ah-b.h*k)/2-b.y*k};drawMap()}
function mSnap(){mUndo.push(JSON.stringify(M()));if(mUndo.length>40)mUndo.shift()}
function mUndoDo(){const s=mUndo.pop();if(!s)return;const i=P.maps.findIndex(m=>m.id===P.curMap);P.maps[i]=JSON.parse(s);selN=selE=null;touch();drawMap();renderInsp()}
function link(a,b,o={}){const m=M();if(a===b||m.edges.some(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a)))return;mSnap();m.edges.push({id:nid(),a,b,label:'',...o});touch();drawMap()}
function addNode(x,y,from){mSnap();const n={id:nid(),t:'Idea nueva',kind:'idea',ref:'',x,y};const m=M();m.nodes.push(n);if(from)m.edges.push({id:nid(),a:from,b:n.id,label:''});selN=n.id;selE=null;touch();drawMap();renderInsp();setTimeout(()=>{const t=$('#iT');if(t){t.focus();t.select()}},0);return n}
function addChild(pid){const p=nodeOf(pid);if(!p)return;const kids=M().edges.filter(e=>e.a===pid&&!e.dash).map(e=>nodeOf(e.b)).filter(Boolean);const y=kids.length?Math.max(...kids.map(k=>k.y))+70:p.y;addNode(p.x+dims(p).w/2+150,y,pid)}
function addSib(id){const pe=M().edges.find(e=>e.b===id&&!e.dash);if(pe)addChild(pe.a);else{const n=nodeOf(id);addNode(n.x,n.y+dims(n).h+50)}}
function delSel(){const m=M();mSnap();if(selN){m.nodes=m.nodes.filter(n=>n.id!==selN);m.edges=m.edges.filter(e=>e.a!==selN&&e.b!==selN)}else if(selE)m.edges=m.edges.filter(e=>e.id!==selE);selN=selE=null;touch();drawMap();renderInsp()}
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
  const m=M(),el=$('#insp');
  if(selN){const n=nodeOf(selN);if(!n){selN=null;return renderInsp()}
    const opts=P.chapters.map(c=>`<optgroup label="${esc(c.title)}">${c.scenes.map(s=>`<option value="s:${s.id}" ${n.ref==='s:'+s.id?'selected':''}>${esc(s.title||'Sin título')}</option>`).join('')}</optgroup>`).join('')+(P.cards.length?`<optgroup label="Fichas">${P.cards.map(c=>`<option value="c:${c.id}" ${n.ref==='c:'+c.id?'selected':''}>${esc(c.name||'Sin nombre')} (${KINDS[c.kind]})</option>`).join('')}</optgroup>`:'');
    el.innerHTML=`<h3>Nodo</h3><label for="iT">Texto${n.ref?' (también renombra lo vinculado)':''}</label><textarea id="iT" rows="2">${esc(txtOf(n))}</textarea><div class="two"><div><label for="iK">Tipo</label><select id="iK">${Object.entries(KN).map(([v,l])=>`<option value="${v}" ${n.kind===v?'selected':''}>${l}</option>`).join('')}</select></div><div><label for="iR">Vínculo</label><select id="iR"><option value="">Ninguno</option>${opts}</select></div></div>
    <div class="acts"><button data-x="child">+ Hijo <small>(Tab)</small></button><button data-x="sib">+ Hermano <small>(Enter)</small></button><button data-x="conn">${pend?'Elegí el destino…':'Conectar con…'}</button><button data-x="open" ${n.ref&&refT(n.ref)?'':'disabled'}>Abrir vínculo</button><button data-x="lay">Ordenar desde acá</button><button data-x="del">Borrar nodo</button></div>`}
  else if(selE){const e=m.edges.find(x=>x.id===selE);if(!e){selE=null;return renderInsp()}
    el.innerHTML=`<h3>Conexión</h3><p class="note" style="margin:0">${esc(txtOf(nodeOf(e.a)||{}))} → ${esc(txtOf(nodeOf(e.b)||{}))}</p><label for="iL">Etiqueta</label><input id="iL" value="${esc(e.label)}" placeholder="por ejemplo: traiciona a, vive en"><label class="chk"><input type="checkbox" id="iD" ${e.dash?'checked':''}> Línea punteada (relación, no rama)</label><div class="acts"><button data-x="del">Borrar conexión</button></div>`}
  else el.innerHTML=`<h3>${esc(m.name)}</h3><label for="iM">Nombre del mapa</label><input id="iM" value="${esc(m.name)}"><ul><li>Doble clic en el fondo: idea nueva</li><li>Arrastrá el punto coral de un nodo hasta otro para conectarlos</li><li>Tab crea un hijo, Enter un hermano</li><li>Vinculá nodos a escenas o fichas: el nombre queda sincronizado</li><li>Arrastrá el fondo para moverte, rueda para zoom</li></ul><p class="note">${m.nodes.length} nodos · ${m.edges.length} conexiones</p>`;
}
function renderMapUI(fit){$('#mSel').innerHTML=P.maps.map(m=>`<option value="${m.id}" ${m.id===P.curMap?'selected':''}>${esc(m.name)}</option>`).join('');renderInsp();if(fit)requestAnimationFrame(fitMap);else drawMap()}
let mapSeen=false;
function openRef(ref){const [t,id]=ref.split(':');if(t==='s')select(id);else openCard(id)}

const svg=$('#msvg');
const toW=e=>{const r=svg.getBoundingClientRect();return{x:(e.clientX-r.left-V.x)/V.k,y:(e.clientY-r.top-V.y)/V.k}};
svg.addEventListener('pointerdown',e=>{
  const h=e.target.closest('[data-h]'),g=e.target.closest('[data-n]'),ed=e.target.closest('[data-e]'),now=Date.now(),key=g?g.dataset.n:h?'h':ed?'e':'bg',dbl=last.id===key&&now-last.t<350;last={id:key,t:now};
  try{svg.setPointerCapture(e.pointerId);svg.focus({preventScroll:true})}catch(err){}
  if(h){act={t:'conn',a:h.dataset.h};conn={a:h.dataset.h,p:toW(e)};return}
  if(g){const id=g.dataset.n;if(pend&&pend!==id){const a=pend;pend=null;link(a,id);renderInsp();act=null;return}
    if(selN!==id||selE){selN=id;selE=null;renderInsp()}const n=nodeOf(id),p=toW(e);act={t:'drag',n,dx:p.x-n.x,dy:p.y-n.y,moved:false};drawMap();
    if(dbl)setTimeout(()=>{const t=$('#iT');if(t){t.focus();t.select()}},0);return}
  if(ed){selE=ed.dataset.e;selN=null;pend=null;act=null;renderInsp();drawMap();return}
  pend=null;if(dbl){const p=toW(e);addNode(p.x,p.y);act=null;return}
  if(selN||selE){selN=selE=null;renderInsp()}act={t:'pan',sx:e.clientX,sy:e.clientY,vx:V.x,vy:V.y};drawMap();
});
svg.addEventListener('pointermove',e=>{if(!act)return;if(act.t==='drag'){const p=toW(e);if(!act.moved){if(Math.hypot(p.x-act.dx-act.n.x,p.y-act.dy-act.n.y)<3)return;mSnap();act.moved=true}act.n.x=Math.round(p.x-act.dx);act.n.y=Math.round(p.y-act.dy);drawMap()}else if(act.t==='pan'){V.x=act.vx+e.clientX-act.sx;V.y=act.vy+e.clientY-act.sy;drawMap()}else if(act.t==='conn'){conn.p=toW(e);drawMap()}});
svg.addEventListener('pointerup',e=>{if(act&&act.t==='conn'){const el=document.elementFromPoint(e.clientX,e.clientY),g=el&&el.closest&&el.closest('[data-n]');const a=act.a;conn=null;if(g&&g.dataset.n!==a)link(a,g.dataset.n);else drawMap()}else if(act&&act.t==='drag'&&act.moved)touch();act=null});
svg.addEventListener('pointercancel',()=>{act=null;conn=null;drawMap()});
svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,k=Math.max(.25,Math.min(2.5,V.k*Math.exp(-e.deltaY*.0015)));V.x=px-(px-V.x)*k/V.k;V.y=py-(py-V.y)*k/V.k;V.k=k;drawMap()},{passive:false});
const zoomBy=f=>{const W=svg.clientWidth/2,H=svg.clientHeight/2,k=Math.max(.25,Math.min(2.5,V.k*f));V.x=W-(W-V.x)*k/V.k;V.y=H-(H-V.y)*k/V.k;V.k=k;drawMap()};
$('#zIn').onclick=()=>zoomBy(1.25);$('#zOut').onclick=()=>zoomBy(.8);$('#zFit').onclick=fitMap;
new ResizeObserver(()=>drawMap()).observe(svg);

$('#insp').addEventListener('input',e=>{const m=M(),id=e.target.id;
  if(id==='iT'){const n=nodeOf(selN),r=refT(n.ref);if(r){r.o[r.k]=e.target.value;if(P.simple&&n.ref.startsWith('s:')){const f=findScene(n.ref.slice(2));if(f)f.c.title=e.target.value}renderBinder();renderCards()}else n.t=e.target.value}
  else if(id==='iL'){m.edges.find(x=>x.id===selE).label=e.target.value}
  else if(id==='iM'){m.name=e.target.value;$('#mSel').selectedOptions[0].textContent=m.name||'Sin nombre'}
  else return;touch();drawMap()});
$('#insp').addEventListener('change',e=>{const m=M(),id=e.target.id;mSnap();
  if(id==='iK')nodeOf(selN).kind=e.target.value;
  else if(id==='iR'){const n=nodeOf(selN),cur=txtOf(n);n.ref=e.target.value;const r=refT(n.ref);if(r){n.t=cur;if(n.kind==='idea')n.kind=r.kind}else n.t=cur;renderInsp()}
  else if(id==='iD')m.edges.find(x=>x.id===selE).dash=e.target.checked;
  else{mUndo.pop();return}touch();drawMap()});
$('#insp').addEventListener('keydown',e=>{if(e.target.id!=='iT')return;if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();addChild(selN)}else if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addSib(selN)}});
$('#insp').addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;const x=b.dataset.x;
  if(x==='child')addChild(selN);if(x==='sib')addSib(selN);if(x==='conn'){pend=pend?null:selN;renderInsp()}if(x==='open'){const n=nodeOf(selN);if(n.ref)openRef(n.ref)}
  if(x==='lay'){mSnap();layout(M(),selN);touch();fitMap()}if(x==='del')delSel()});
$('#mSel').addEventListener('change',e=>{P.curMap=e.target.value;selN=selE=pend=null;mUndo=[];touch();renderMapUI(true)});
$('#mNew').onclick=()=>{const m={id:nid(),name:'Mapa '+(P.maps.length+1),nodes:[{id:nid(),t:'Idea central',kind:'centro',ref:'',x:0,y:0}],edges:[]};P.maps.push(m);P.curMap=m.id;selN=m.nodes[0].id;selE=null;mUndo=[];touch();renderMapUI(true);setTimeout(()=>{const t=$('#iT');if(t){t.focus();t.select()}},60)};
$('#mGen').onclick=e=>busy(e.currentTarget,'Generando mapa…',async()=>{const m=genMap('Obra al '+new Date().toLocaleDateString('es-AR'));P.maps.push(m);P.curMap=m.id;selN=selE=null;mUndo=[];touch();renderMapUI(true)});
$('#mLay').onclick=e=>busy(e.currentTarget,'Ordenando…',async()=>{mSnap();layout(M(),selN);touch();fitMap()});
$('#mUndo').onclick=mUndoDo;
$('#mDel').onclick=e=>confirm2(e.currentTarget,()=>{P.maps=P.maps.filter(m=>m.id!==P.curMap);ensureMaps();selN=selE=null;mUndo=[];touch();renderMapUI(true)});
$('#mSvg').onclick=async()=>{const m=M(),b=bbox(m),pad=40,str=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x-pad} ${b.y-pad} ${b.w+pad*2} ${b.h+pad*2}" width="${Math.round(b.w+pad*2)}" height="${Math.round(b.h+pad*2)}"><rect x="${b.x-pad}" y="${b.y-pad}" width="${b.w+pad*2}" height="${b.h+pad*2}" fill="#ffffff"/>${mapInner(true)}</svg>`;
  const el=$('#insp');try{if(!dl)throw{code:'unavailable'};await dl.save({filename:(m.name||'mapa').replace(/[^\p{L}\p{N} _-]/gu,'').trim()+'.svg',data:str})}catch(err){if(err&&err.code==='declined')return;try{await navigator.clipboard.writeText(str);el.insertAdjacentHTML('beforeend','<p class="note">Las descargas no están disponibles acá: copié el SVG al portapapeles.</p>')}catch(e2){el.insertAdjacentHTML('beforeend','<p class="note">No se pudo exportar el mapa en esta vista.</p>')}}};
document.addEventListener('keydown',e=>{if(!isView('map')||e.target.closest('input,textarea,select,dialog,button'))return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();mUndoDo();return}
  if(e.key==='Tab'&&selN){e.preventDefault();addChild(selN)}else if(e.key==='Enter'&&selN){e.preventDefault();addSib(selN)}else if((e.key==='Delete'||e.key==='Backspace')&&(selN||selE)){e.preventDefault();delSel()}else if(e.key==='Escape'){selN=selE=pend=null;renderInsp();drawMap()}});

