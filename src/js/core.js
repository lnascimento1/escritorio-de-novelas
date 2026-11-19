'use strict';
/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);
const WRE=/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const wc=t=>(String(t||'').match(WRE)||[]).length;
const fmt=n=>Math.round(n||0).toLocaleString('es-AR');
const dkey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>dkey(new Date());
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const KINDS={personaje:'Personaje',lugar:'Lugar',lore:'Lore'};
const STAT={idea:'Idea',borrador:'Borrador',revision:'Revisión',lista:'Lista'};
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const pd=s=>{const m=/^(\d{1,4})-(\d{2})-(\d{2})$/.exec(s||'');return m?{y:+m[1],m:+m[2],d:+m[3]}:null};
const fdate=s=>{const p=pd(s);return p?p.d+' de '+MESES[p.m-1]+' de '+p.y:''};
const fdShort=s=>{const p=pd(s);return p?p.d+' '+MESES[p.m-1].slice(0,3):''};
const isView=v=>document.body.dataset.view===v;

/* ---------- rich text: stored as <p> with <strong>/<em>/<br> ---------- */
const tpl=document.createElement('template');
const BLOCK=/^(P|DIV|H[1-6]|LI|BLOCKQUOTE|UL|OL|SECTION|ARTICLE|PRE|HEADER|FOOTER)$/;
function inl(n){
  if(n.nodeType===3)return esc(n.nodeValue.replace(/ /g,' '));
  if(n.nodeType!==1)return'';
  const t=n.tagName,k=[...n.childNodes].map(inl).join('');
  if(t==='BR')return'<br>';
  if(t==='B'||t==='STRONG')return k.trim()?'<strong>'+k+'</strong>':k;
  if(t==='I'||t==='EM')return k.trim()?'<em>'+k+'</em>':k;
  if(t==='MARK')return k;
  const st=(n.getAttribute&&n.getAttribute('style'))||'';let r=k;
  if(/font-style:\s*italic/.test(st)&&r.trim())r='<em>'+r+'</em>';
  if(/font-weight:\s*(bold|[6-9]00)/.test(st)&&r.trim())r='<strong>'+r+'</strong>';
  return r;
}
function clean(html){
  tpl.innerHTML=html;const out=[];let cur='';
  const push=()=>{const c=cur.replace(/(<br>)+$/,'').trim();if(c.replace(/<br>/g,'').trim())out.push('<p>'+c+'</p>');cur=''};
  const walk=n=>{for(const c of [...n.childNodes]){
    if(c.nodeType===1&&BLOCK.test(c.tagName)){push();if([...c.children].some(x=>BLOCK.test(x.tagName)))walk(c);else{cur=[...c.childNodes].map(inl).join('');push()}}
    else cur+=inl(c)}};
  walk(tpl.content);push();return out.join('');
}
function toHTML(s){s=String(s||'');if(!s.trim())return'';if(/^\s*</.test(s))return clean(s);return s.split(/\n+/).map(p=>p.trim()).filter(Boolean).map(p=>'<p>'+esc(p)+'</p>').join('')}
function plainOf(h){h=String(h||'');if(!/^\s*</.test(h))return h;
  return h.replace(/<br\s*\/?>/gi,'\n').replace(/<\/(p|div|h\d|li)>/gi,'\n\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/\n{3,}/g,'\n\n').trim()}
const parasOf=h=>plainOf(h).split(/\n\n+/).map(x=>x.trim()).filter(Boolean);
/* paragraphs as runs [{t,b,i}] for exports */
function runsOf(h){tpl.innerHTML=toHTML(h);const P=[];
  for(const p of tpl.content.children){const runs=[];const walk=(n,b,i)=>{for(const c of n.childNodes){if(c.nodeType===3){if(c.nodeValue)runs.push({t:c.nodeValue,b,i})}else if(c.tagName==='BR')runs.push({t:'\n',b,i});else walk(c,b||c.tagName==='STRONG',i||c.tagName==='EM')}};walk(p,false,false);if(runs.length)P.push(runs)}
  return P}

/* ---------- state ---------- */
let L={list:[],cur:null};          // library
let P=null,T={},H={};               // current project, scene html, scene versions
let DB=null,UID=null,C=null,mode='local',lsOK=true;
let dirtyS=new Set(),dirtyH=new Set(),delS=new Set(),dirtyM=false,dirtyLib=false,tm=null,saving=false;
let appearMemo=null;
const LSL='en-lib',LSP=id=>'en-p-'+id,LSH=id=>'en-h-'+id,OLD='escritorio-novelas-v1';
const MEM=new Map(); // in-memory copy, used when the browser keeps nothing
function lsGet(k){const m=MEM.get(k);if(m)return JSON.parse(m);try{const r=localStorage.getItem(k);if(r)return JSON.parse(r)}catch(e){}return null}
function lsSet(k,v){const s=JSON.stringify(v);MEM.set(k,s);IDB.put(k,s);try{localStorage.setItem(k,s);return true}catch(e){if(!IDB.db)lsOK=false;return false}}
function lsDel(k){MEM.delete(k);IDB.del(k);try{localStorage.removeItem(k)}catch(e){}}

const allScenes=()=>P.chapters.flatMap(c=>c.scenes.map(s=>({c,s})));
const cur=()=>{for(const c of P.chapters)for(const s of c.scenes)if(s.id===P.cur)return{c,s};const c=P.chapters.find(x=>x.scenes.length);return c?{c,s:c.scenes[0]}:null};
function findScene(id){for(const c of P.chapters){const i=c.scenes.findIndex(s=>s.id===id);if(i>-1)return{c,i,s:c.scenes[i]}}return null}
const wcache=new Map();
function sw(id){const h=T[id]||'';const k=wcache.get(id);if(k&&k.h===h)return k.n;const n=wc(plainOf(h));wcache.set(id,{h,n});return n}
const chapWords=c=>c.scenes.reduce((a,s)=>a+sw(s.id),0);
const totalWords=()=>P.chapters.reduce((a,c)=>a+chapWords(c),0);
const typeName=p=>p.type==='cuento'?'Cuento':'Novela';
const U=()=>P.simple?{one:'capítulo',One:'Capítulo',many:'capítulos',Many:'Capítulos'}:{one:'escena',One:'Escena',many:'escenas',Many:'Escenas'};
const whereOf=(c,s)=>P.simple?c.title:c.title+' · '+(s.title||'Sin título');
const chapNo=sid=>{let n=0;for(const c of P.chapters){n++;if(c.scenes.some(s=>s.id===sid))return n}return 0};

function newProject(type,title){
  const s=nid(),c=nid(),cu=type==='cuento';
  return{P:{id:nid(),title:title||(cu?'Cuento sin título':'Novela sin título'),type:cu?'cuento':'novela',simple:true,updated:Date.now(),goal:{daily:cu?500:1000,total:cu?8000:80000},
    chapters:[{id:c,title:cu?'Inicio':'Capítulo 1',open:true,scenes:[{id:s,title:cu?'Inicio':'Capítulo 1',status:'idea',pov:'',syn:'',notes:''}]}],
    cards:[],log:{},cur:s,maps:null,tl:newTL()},T:{[s]:''},H:{}};
}
function newTL(){return{lanes:[{id:'l1',name:'Trama'},{id:'l2',name:'Historia real'}],items:[],eras:[],showOrder:true}}
function migrateTL(p){const tl=newTL(),ent=[];
  (p.timeline||[]).forEach(e=>{if(e.date)ent.push({date:e.date,lane:e.kind==='historia'?'l2':'l1',label:e.label||'',notes:e.notes||'',ref:''})});
  p.chapters.forEach(c=>c.scenes.forEach(s=>{if(s.when)ent.push({date:s.when,lane:'l1',label:'',notes:'',ref:'s:'+s.id});delete s.when}));
  ent.sort((a,b)=>a.date.localeCompare(b.date)).forEach((e,i)=>tl.items.push({id:nid(),lane:e.lane,x:i*220,when:fdate(e.date),label:e.label,notes:e.notes,ref:e.ref}));
  delete p.timeline;return tl}
function norm(p){
  p.id=p.id||nid();p.type=p.type||'novela';p.rels=p.rels||[];p.ignored=p.ignored||[];p.goal=p.goal||{daily:1000,total:80000};p.cards=p.cards||[];p.log=p.log||{};
  p.chapters=p.chapters||[];p.chapters.forEach(c=>{c.scenes=c.scenes||[];if(!c.scenes.length)c.scenes.push({id:nid(),title:c.title,status:'idea',pov:'',syn:'',notes:''});c.scenes.forEach(s=>{s.syn=s.syn||'';s.notes=s.notes||'';s.pov=s.pov||'';s.status=s.status||'idea'})});
  if(p.simple===undefined)p.simple=p.chapters.every(c=>c.scenes.length<=1);
  if(p.simple)p.chapters.forEach(c=>{if(c.scenes.length===1)c.scenes[0].title=c.title});
  if(!p.tl)p.tl=migrateTL(p);p.tl.lanes=p.tl.lanes&&p.tl.lanes.length?p.tl.lanes:newTL().lanes;p.tl.items=p.tl.items||[];p.tl.eras=p.tl.eras||[];
  p.chapters.forEach(c=>c.scenes.forEach(s=>{delete s.when}));
  p.cards.forEach(c=>{c.alias=c.alias||''});
  if(p.drive)delete p.drive.folderId;
  return p;
}
function setData(d){
  P=norm(d.P);T=d.T||{};H=d.H||{};wcache.clear();appearMemo=null;
  for(const k of Object.keys(T)){const h=toHTML(T[k]);if(h!==T[k]){T[k]=h;dirtyS.add(k)}}
  if(typeof ensureMaps==='function')ensureMaps();
}
function libEntry(){return{id:P.id,title:P.title,type:P.type,updated:P.updated||Date.now(),words:totalWords()}}
function syncLib(){const e=libEntry(),i=L.list.findIndex(x=>x.id===P.id);if(i>-1){const o=L.list[i];if(o.title!==e.title||o.words!==e.words||o.updated!==e.updated||o.type!==e.type){L.list[i]=e;dirtyLib=true}}else{L.list.push(e);dirtyLib=true}if(L.cur!==P.id){L.cur=P.id;dirtyLib=true}}

/* ---------- saving ---------- */
function status(t){const s=$('#saveSt');s.textContent=t;s.classList.toggle('working',/…$/.test(t))}
/* busy indicator: header pill + spinner on the button, which is locked until the action ends */
let busyN=0;
function busyOn(t){busyN++;$('#busyT').textContent=t||'Procesando…';$('#busy').hidden=false}
function busyOff(){busyN=Math.max(0,busyN-1);if(!busyN)$('#busy').hidden=true}
const paint=()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
async function busy(btn,label,fn){
  if(btn){if(btn.dataset.busy)return;btn.dataset.busy=1;btn.disabled=true;btn.classList.add('loading')}
  busyOn(label);await paint();
  try{return await fn()}finally{busyOff();if(btn){delete btn.dataset.busy;btn.disabled=false;btn.classList.remove('loading')}}
}
function savedLabel(){return mode==='cuenta'?'Guardado en tu cuenta':IS_APP?(IS_ANDROID?'Guardado en el teléfono':'Guardado en esta compu'):(lsOK||IDB.db)?'Guardado en este navegador':'Sin guardado automático: guardá en Drive'}
function touch(sid){if(sid){dirtyS.add(sid);appearMemo=null}dirtyM=true;P.updated=Date.now();clearTimeout(tm);tm=setTimeout(flush,1200);status('Guardando…')}
const projCol=id=>DB.collection('data/users/'+UID+'/p-'+id+'/d');
const libDoc=()=>DB.collection('data/users/'+UID).doc('lib');
async function flush(){
  clearTimeout(tm);if(!P)return;syncLib();
  lsSet(LSP(P.id),{P,T});lsSet(LSH(P.id),H);lsSet(LSL,L);
  if(!C){status(savedLabel());return}
  if(saving){tm=setTimeout(flush,700);return}
  saving=true;const col=C,ds=[...dirtyS],dh=[...dirtyH],dd=[...delS],m=dirtyM,lb=dirtyLib;dirtyS.clear();dirtyH.clear();delS.clear();dirtyM=false;dirtyLib=false;
  try{
    for(const id of ds)if(T[id]!==undefined)await col.doc('s-'+id).set({t:T[id]||''});
    for(const id of dh)if(H[id])await col.doc('h-'+id).set({j:JSON.stringify(H[id])});
    for(const id of dd){await col.doc('s-'+id).delete();await col.doc('h-'+id).delete()}
    if(m)await col.doc('meta').set({j:JSON.stringify(P)});
    if(lb)await libDoc().set({j:JSON.stringify(L)});
    status(savedLabel());
  }catch(e){ds.forEach(i=>dirtyS.add(i));dh.forEach(i=>dirtyH.add(i));dd.forEach(i=>delS.add(i));dirtyM=dirtyM||m;dirtyLib=dirtyLib||lb;
    status(e&&e.code==='quota_exceeded'?'Tu cuenta llegó al límite: guardá en Drive':'No se pudo guardar en tu cuenta; quedó en este navegador')}
  saving=false;
}
function markAllDirty(){Object.keys(T).forEach(k=>dirtyS.add(k));Object.keys(H).forEach(k=>dirtyH.add(k));dirtyM=true;dirtyLib=true}
async function loadRemote(id){
  const s=await projCol(id).get();const d={};s.docs.forEach(x=>{d[x.id]=x.data()});
  if(!d.meta||!d.meta.j)return null;
  const p=JSON.parse(d.meta.j),t={},h={};
  p.chapters.forEach(c=>c.scenes.forEach(sc=>{t[sc.id]=(d['s-'+sc.id]||{}).t||'';const hv=d['h-'+sc.id];if(hv&&hv.j)try{h[sc.id]=JSON.parse(hv.j)}catch(e){}}));
  return{P:p,T:t,H:h};
}
async function uploadProject(d){const pc=projCol(d.P.id);
  for(const k of Object.keys(d.T||{}))await pc.doc('s-'+k).set({t:d.T[k]||''});
  for(const k of Object.keys(d.H||{}))await pc.doc('h-'+k).set({j:JSON.stringify(d.H[k])});
  await pc.doc('meta').set({j:JSON.stringify(d.P)})}
function localData(id){const l=lsGet(LSP(id));return l&&l.P?{P:l.P,T:l.T||{},H:lsGet(LSH(id))||{}}:null}
async function openProject(id,data){busyOn('Abriendo…');await paint();try{await openProject_(id,data)}finally{busyOff()}if(typeof gsOn==='function'&&gsOn()&&gsHasTok())gsSync(false)}
async function openProject_(id,data){
  if(P)await flush();
  let d=data||localData(id),push=false;
  if(!d&&typeof gsFetchProject==='function')d=await gsFetchProject(id);
  if(!data&&DB){try{const r=await loadRemote(id);if(r&&(!d||(r.P.updated||0)>=(d.P.updated||0)))d=r;else if(d)push=true}catch(e){}}
  if(!d){d=newProject('novela');push=true}
  setData(d);if(typeof mapReset==='function')mapReset();if(DB)C=projCol(P.id);if(push||data)markAllDirty();
  syncLib();renderAll();if(typeof setView==='function')setView(document.body.dataset.view||'ms');
  const insync=P.gsync&&+(P.gsync.base||0)>=+(P.updated||0);touch();if(insync)P.gsync.base=P.updated;
}
async function deleteProject(id){
  L.list=L.list.filter(x=>x.id!==id);dirtyLib=true;lsDel(LSP(id));lsDel(LSH(id));
  if(DB){try{const pc=projCol(id),s=await pc.get();for(const x of s.docs)await pc.doc(x.id).delete()}catch(e){}}
  if(P&&P.id===id){P=null;C=null;if(L.list.length)await openProject(L.list[0].id);else{const n=newProject('novela');await openProject(n.P.id,n)}}
  else{lsSet(LSL,L);if(DB)try{await libDoc().set({j:JSON.stringify(L)})}catch(e){}}
}

/* ---------- appearances: which cards show up in which scenes ---------- */
function cardTerms(c){const t=[c.name,...String(c.alias||'').split(',')].map(x=>x.trim()).filter(x=>x.length>=3);
  if(c.kind==='personaje'&&c.name){const f=c.name.trim().split(/\s+/)[0];if(f.length>=4)t.push(f)}return[...new Set(t)]}
function appear(){
  if(appearMemo)return appearMemo;
  const byScene={},byCard={},count={};
  const res=P.cards.map(c=>{const t=cardTerms(c);return t.length?{c,re:new RegExp('(?<![\\p{L}\\p{N}])(?:'+t.map(escRe).join('|')+')(?![\\p{L}\\p{N}])','giu')}:null}).filter(Boolean);
  for(const {s} of allScenes()){const txt=plainOf(T[s.id]);byScene[s.id]=[];for(const r of res){const n=(txt.match(r.re)||[]).length;if(n){byScene[s.id].push(r.c.id);(byCard[r.c.id]=byCard[r.c.id]||[]).push(s.id);count[r.c.id]=(count[r.c.id]||0)+n}}}
  return appearMemo={byScene,byCard,count};
}

/* ---------- sample project ---------- */
function sample(){
  const S=[0,1,2,3,4,5].map(()=>nid()),CH=[0,1,2,3,4,5].map(()=>nid()),K={ines:nid(),bas:nid(),tom:nid(),isla:nid(),reloj:nid(),faro:nid()};
  const mk=(i,title,status,pov,syn,notes)=>({id:CH[i],title,open:true,scenes:[{id:S[i],title,status,pov,syn,notes}]});
  const P={id:nid(),title:'El faro de las horas',type:'novela',simple:true,sample:true,updated:0,goal:{daily:800,total:60000},
  chapters:[
    mk(0,'1. La llegada','lista','Inés','Inés llega a la isla con el encargo de reparar el reloj del faro.','Plantar la carta sin firma.'),
    mk(1,'2. El farero','revision','Inés','Primer cruce con Bastián. Él miente sobre el último relojero.','Que el café sea un gesto de control, no de amabilidad.'),
    mk(2,'3. El mecanismo','borrador','Inés','Inés abre el reloj y descubre que alguien lo detuvo a propósito.',''),
    mk(3,'4. Noche de niebla','borrador','Bastián','Salto atrás: la noche en que desapareció Tomás.','Única vez que el lector está dentro de Bastián antes del final.'),
    mk(4,'5. La carta sin firma','borrador','Inés','Amalia Correa le entrega a Inés una carta que llegó para el relojero anterior.','¿Quién la escribió? Dejarlo abierto hasta el 9.'),
    mk(5,'6. Las cuatro y diez','idea','Bastián','Bastián sube a la linterna y decide qué contarle a Inés.','')],
  cards:[
    {id:K.ines,kind:'personaje',name:'Inés Arriaga',alias:'la relojera',role:'Relojera, 34 años',notes:'Llega a la isla por dinero, se queda por la verdad. Desconfía de todo lo que funciona demasiado bien.',x:0,y:0},
    {id:K.bas,kind:'personaje',name:'Bastián',alias:'el farero',role:'Farero',notes:'Vive solo desde que su hermano desapareció. Miente con calma.',x:300,y:-60},
    {id:K.tom,kind:'personaje',name:'Tomás',alias:'',role:'Hermano de Bastián, desaparecido',notes:'',x:560,y:60},
    {id:K.isla,kind:'lugar',name:'Isla Tormenta',alias:'la isla',role:'Donde transcurre la novela',notes:'Una sola calle, un muelle, el faro. La niebla llega a las cinco.',x:-60,y:260},
    {id:K.faro,kind:'lugar',name:'El faro',alias:'la linterna',role:'Casa y trabajo de Bastián',notes:'',x:260,y:250},
    {id:K.reloj,kind:'lore',name:'El reloj del faro',alias:'el reloj',role:'Objeto central',notes:'Marca la hora del pueblo. Si se detiene, nadie sabe qué día es.',x:520,y:300}],
  rels:[{id:nid(),a:K.bas,b:K.tom,label:'hermano de'},{id:nid(),a:K.ines,b:K.bas,label:'desconfía de'},{id:nid(),a:K.reloj,b:K.faro,label:'está en'},{id:nid(),a:K.tom,b:K.reloj,label:'lo detuvo'}],
  ignored:[],log:{},cur:S[0],maps:null,
  tl:{lanes:[{id:'l1',name:'Inés'},{id:'l2',name:'Bastián'},{id:'l3',name:'La isla'}],showOrder:true,
    eras:[{id:nid(),x1:-130,x2:330,label:'Antes de Inés'},{id:nid(),x1:400,x2:1500,label:'La semana del reloj'}],
    items:[
      {id:nid(),lane:'l2',x:0,when:'Un otoño antes',label:'',notes:'Nadie lo vio subir a ninguna lancha.',ref:'s:'+S[3]},
      {id:nid(),lane:'l3',x:200,when:'Principios de marzo',label:'Se detiene el reloj del faro',notes:'Marca las cuatro y diez.',ref:''},
      {id:nid(),lane:'l1',x:520,when:'Día 1, al amanecer',label:'',notes:'',ref:'s:'+S[0]},
      {id:nid(),lane:'l1',x:720,when:'Día 1, mediodía',label:'',notes:'',ref:'s:'+S[1]},
      {id:nid(),lane:'l1',x:920,when:'Día 2',label:'',notes:'',ref:'s:'+S[2]},
      {id:nid(),lane:'l1',x:1120,when:'Día 3, en el almacén',label:'',notes:'',ref:'s:'+S[4]},
      {id:nid(),lane:'l2',x:1320,when:'Día 3, de noche',label:'',notes:'',ref:'s:'+S[5]}]}};
  [620,0,1240,880,1010,450,0,1320,960,1100,700,1050,830].forEach((v,i)=>{const d=new Date();d.setDate(d.getDate()-(13-i));if(v)P.log[dkey(d)]=v});
  const T={};
  T[S[0]]='<p>La lancha la dejó en el muelle cuando el sol todavía no había decidido salir. Inés bajó con la valija de herramientas apretada contra el pecho, como si alguien fuera a quitársela.</p><p>Desde ahí se veía el faro: blanco, alto, con el reloj incrustado a media altura. Las agujas marcaban las cuatro y diez. Eran casi las siete.</p><p>—Está parado desde marzo —dijo el lanchero, sin que ella preguntara—. Desde que se fue el otro.</p><p>—¿Qué otro?</p><p>El hombre ya estaba soltando la amarra. En la isla, pensó Inés, <em>nadie termina las frases</em>. Subió la cuesta despacio, contando las casas: once, todas con las persianas cerradas, y un almacén con un cartel despintado donde se leía, todavía, el nombre de Amalia Correa.</p>';
  T[S[1]]='<p>Bastián la esperaba en la puerta del faro con una taza en cada mano. Le ofreció una sin decir su nombre, como si ya se conocieran, como si la hubiera estado esperando desde marzo.</p><p>—El último relojero se cansó de la niebla —dijo—. Se volvió al continente.</p><p>Inés aceptó el café. No le creyó. Había algo en la manera en que Bastián miraba hacia arriba, hacia el reloj, que no era cansancio sino cuidado. Como se mira a un perro que alguna vez mordió.</p><p>—Amalia Correa me dijo que usted lo conocía bien —probó ella.</p><p>—En la isla todos nos conocemos bien —dijo él—. Por eso nadie habla.</p>';
  T[S[2]]='<p>El mecanismo estaba limpio. Demasiado limpio. Alguien había aceitado cada engranaje y después había metido un clavo entre los dientes de la rueda de escape, con la precisión de quien sabe exactamente dónde duele.</p><p>Inés sacó el clavo con la pinza y lo sostuvo contra la luz. Era nuevo. No tenía óxido, y en la isla <strong>todo</strong> tenía óxido, hasta las promesas.</p><p>El reloj del faro tembló, como si quisiera arrancar, y se quedó quieto otra vez.</p>';
  T[S[3]]='<p>Esa noche la niebla llegó antes de las cinco. Bastián lo recuerda porque Tomás se rió de eso, dijo que la isla estaba apurada, que algo iba a pasar.</p><p>Subieron juntos a la linterna. Tomás tenía las manos manchadas de aceite y un clavo entre los dientes, como un carpintero de película. Bastián no preguntó para qué era. Esa fue la última vez que no preguntó nada.</p>';
  T[S[4]]='<p>Amalia Correa la atendió sin levantar la vista de la balanza. Cuando Inés pidió fósforos, la mujer abrió un cajón y sacó, junto con la caja, un sobre amarillento.</p><p>—Llegó para el relojero. El de antes —dijo—. Nadie vino a buscarla.</p><p>El sobre no tenía remitente. Adentro había una sola línea, escrita con letra apretada: <em>No lo arregles.</em></p>';
  T[S[5]]='';
  const H={};H[S[0]]=[{at:Date.now()-3*864e5,html:'<p>La lancha la dejó en el muelle al amanecer. Inés bajó con la valija de herramientas.</p><p>Desde ahí se veía el faro. El reloj marcaba las cuatro y diez.</p>',words:24,note:'Primer borrador',auto:false}];
  return{P,T,H};
}
