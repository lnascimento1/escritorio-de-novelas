'use strict';
/* ---------- views ---------- */
function setView(v){
  document.body.dataset.view=v;layout();$$('#views button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));document.body.classList.remove('sp');
  if(v==='map'){renderMapUI(!mapSeen);mapSeen=true}else if(v==='cards')renderCM();else if(v==='board')renderBoard();else if(v==='time')renderTL();else renderEditor();
}
$('#views').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setView(b.dataset.v)});
$('#fbar').addEventListener('mousedown',e=>{if(e.target.closest('[data-fcmd]'))e.preventDefault()});
$('#fbar').addEventListener('click',e=>{const b=e.target.closest('[data-fcmd]');if(!b)return;restoreSel();document.execCommand(b.dataset.fcmd)});
/* theme: auto follows the viewer, or fixed light/dark */
const TNAME={auto:'auto',light:'claro',dark:'oscuro'};
let themePref='auto',viewerTheme=document.documentElement.getAttribute('data-theme');
try{themePref=localStorage.getItem('en-theme')||'auto'}catch(e){}
function applyTheme(){const r=document.documentElement;if(themePref==='auto'){if(viewerTheme)r.setAttribute('data-theme',viewerTheme);else r.removeAttribute('data-theme')}else r.setAttribute('data-theme',themePref);$('#bTheme').textContent='Tema: '+TNAME[themePref];if(isView('map'))drawMap();if(isView('cards'))drawCM();if(isView('time'))drawTL()}
new MutationObserver(()=>{const v=document.documentElement.getAttribute('data-theme');if(themePref==='auto')viewerTheme=v;else if(v!==themePref){viewerTheme=v;document.documentElement.setAttribute('data-theme',themePref)}}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
$('#bTheme').onclick=()=>{themePref={auto:'dark',dark:'light',light:'auto'}[themePref];try{localStorage.setItem('en-theme',themePref)}catch(e){}L.theme=themePref;dirtyLib=true;touch();applyTheme()};
$('#bGoals').onclick=()=>{renderGoals();$('#dGoals').showModal()};
$('#goalsClose').onclick=()=>$('#dGoals').close();
/* show/hide the chapter list and the right panel; on phones they open as drawers */
let LAY={nobinder:false,nopanel:false};try{Object.assign(LAY,JSON.parse(localStorage.getItem('en-layout')||'{}'))}catch(e){}
function layout(){const wide=innerWidth>900,b=document.body;b.classList.toggle('nobinder',wide&&LAY.nobinder);b.classList.toggle('nopanel',wide&&LAY.nopanel);
  const cols=[];if(!(wide&&LAY.nobinder))cols.push(innerWidth<=1100?'230px':'260px');cols.push('minmax(0,1fr)');if(isView('ms')&&!(wide&&LAY.nopanel))cols.push(innerWidth<=1100?'290px':'330px');
  $('main').style.gridTemplateColumns=wide?cols.join(' '):'';$('#bIdx').classList.toggle('off',wide&&LAY.nobinder);$('#bNotes').classList.toggle('off',wide&&LAY.nopanel);
  if(isView('map'))drawMap();if(isView('cards'))drawCM();if(isView('time'))drawTL()}
const saveLay=()=>{try{localStorage.setItem('en-layout',JSON.stringify(LAY))}catch(e){}};
$('#bIdx').onclick=()=>{if(innerWidth<=900){document.body.classList.toggle('sb');return}LAY.nobinder=!LAY.nobinder;saveLay();layout()};
$('#bNotes').onclick=()=>{if(!isView('ms'))setView('ms');if(innerWidth<=900){document.body.classList.toggle('sp');return}if(LAY.nopanel){LAY.nopanel=false}else LAY.nopanel=true;saveLay();layout()};
addEventListener('resize',layout);
$('#closeP').onclick=()=>document.body.classList.remove('sp');
document.addEventListener('click',e=>{if(innerWidth<=900&&(document.body.classList.contains('sb')||document.body.classList.contains('sp'))&&!e.target.closest('#binder,#panel,#bIdx,#bNotes,dialog'))document.body.classList.remove('sb','sp')});
document.addEventListener('keydown',e=>{
  const mod=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(e.key==='Escape'&&document.body.classList.contains('focus')){focusOn(false);return}
  if(mod&&k==='s'){e.preventDefault();saveNow();return}
  if(mod&&e.key==='\\'){e.preventDefault();$('#bIdx').click();return}
  if(mod&&e.shiftKey&&k==='f'){e.preventDefault();setView('ms');focusOn(!document.body.classList.contains('focus'));return}
  if(mod&&!e.shiftKey&&k==='f'&&!isView('map')){e.preventDefault();if(!isView('ms'))setView('ms');setTab('bus');if(innerWidth<=900)document.body.classList.add('sp');const s=getSelection();if(selInEd()&&String(s).trim()&&String(s).length<60)$('#sq').value=String(s).trim();$('#sq').focus();$('#sq').select();renderSearch()}
});
addEventListener('beforeunload',()=>{try{lsSet(LSP(P.id),{P,T});lsSet(LSH(P.id),H);lsSet(LSL,L)}catch(e){}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});

/* ---------- boot ---------- */
function mapReset(){selN=selE=pend=null;mUndo=[];mapSeen=false}
function bootLocal(){
  L=lsGet(LSL)||{list:[],cur:null};if(!Array.isArray(L.list))L.list=[];
  if(!L.list.length){
    const old=lsGet(OLD);let d;
    if(old&&old.P){d={P:old.P,T:old.T||{},H:{}};d.P.id=d.P.id||'v1main'}else d=sample();
    lsSet(LSP(d.P.id),{P:d.P,T:d.T});L.list=[{id:d.P.id,title:d.P.title,type:d.P.type||'novela',updated:d.P.updated||0,words:0}];L.cur=d.P.id;lsSet(LSL,L);
  }
  const id=L.list.some(x=>x.id===L.cur)?L.cur:L.list[0].id;
  let d=localData(id);if(!d){d=sample();L.list=L.list.filter(x=>x.id!==id)}
  setData(d);syncLib();renderAll();status(savedLabel());
}
async function bootRemote(){
  const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]);if(!db||!user)return;
  const uid=await user.id();if(!uid)return;
  DB=db;UID=uid;const base=DB.collection('data/users/'+UID);
  const timeout=p=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),12000))]);
  const lib=await timeout(base.doc('lib').get());
  if(lib.exists&&lib.data().j){
    const R=JSON.parse(lib.data().j),map=new Map();
    for(const x of [...(R.list||[]),...L.list]){const o=map.get(x.id);if(!o||(x.updated||0)>(o.updated||0))map.set(x.id,x)}
    L.list=[...map.values()];L.driveRoot=L.driveRoot||R.driveRoot;if(R.theme&&R.theme!==themePref){L.theme=themePref=R.theme;try{localStorage.setItem('en-theme',themePref)}catch(e){}applyTheme()}
    for(const x of L.list)if(!(R.list||[]).some(r=>r.id===x.id)&&x.id!==P.id){const d=localData(x.id);if(d)try{await uploadProject(d)}catch(e){}}
    if(P.sample&&R.cur&&R.cur!==P.id&&L.list.some(x=>x.id===R.cur)){const sid=P.id;if(!(R.list||[]).some(r=>r.id===sid)){L.list=L.list.filter(x=>x.id!==sid);lsDel(LSP(sid));lsDel(LSH(sid))}P=null;mapReset();await openProject(R.cur)}
    else{mapReset();await openProject(P.id)}
  }else{
    // first time on this layout: bring the single-project data from the first version, if any
    const all=await timeout(base.get()),docs={};all.docs.forEach(x=>{docs[x.id]=x.data()});
    if(docs.meta&&docs.meta.j){try{const p=JSON.parse(docs.meta.j),t={};p.chapters.forEach(c=>c.scenes.forEach(s=>{t[s.id]=(docs['s-'+s.id]||{}).t||''}));p.id=p.id||'v1main';
      if(!L.list.some(x=>x.id===p.id)){await uploadProject({P:norm(p),T:t,H:{}});L.list.push({id:p.id,title:p.title,type:p.type||'novela',updated:p.updated||0,words:0});lsSet(LSP(p.id),{P:p,T:t});
        if(P.sample){const sid=P.id;L.list=L.list.filter(x=>x.id!==sid);lsDel(LSP(sid));lsDel(LSH(sid));P=null;mapReset();await openProject(p.id)}}}catch(e){}}
    for(const x of L.list)if(x.id!==P.id){const d=localData(x.id);if(d)try{await uploadProject(d)}catch(e){}}
    C=projCol(P.id);markAllDirty();
  }
  C=projCol(P.id);mode='cuenta';dirtyLib=true;await flush();status(savedLabel());
}
(async()=>{
  await IDB.open();const all=await IDB.all();for(const k of Object.keys(all))if(typeof all[k]==='string')MEM.set(k,all[k]);
  bootLocal();
  if(L.theme&&L.theme!==themePref)themePref=L.theme;applyTheme();
  if(gsOn())status('Drive: tocá Guardar para traer lo último');
  if(IS_APP){TTS=makeTTS();if(TTS)hookVoice('t');$('#revBox').hidden=false;$('#revGo').textContent='Copiar pedido';renderReviews();
    if(window.Capacitor&&CAP&&CAP.App)CAP.App.addListener('pause',()=>flush());
    if(IS_WEBAPP&&'serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('sw.js').catch(()=>{});let had=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had)status('Hay una versión nueva: cerrá y volvé a abrir la app');had=true})}}
  if(window.claude&&claude.use){
    claude.use('downloads').then(d=>{dl=d}).catch(()=>{});
    claude.use('mcp').then(m=>{mcpx=m;mcpState=m?'ok':'null';if($('#dExp').open)gUI()}).catch(e=>{mcpState=(e&&e.code)||'error'});
    claude.use('sample').then(s=>{SAMPLE=s;$('#revBox').hidden=!s;renderReviews()}).catch(()=>{});
    claude.use('dictation').then(d=>{DICT=d;hookVoice('d')}).catch(()=>{});
    claude.use('tts').then(t=>{TTS=t;hookVoice('t')}).catch(()=>{});
    bootRemote().catch(()=>status(savedLabel()+' (tu cuenta no respondió)'));
  }
})();
