'use strict';
/* ---------- Google Drive sync (web/installed version): each work lives in Escritura/<obra>/ and follows you across devices ---------- */
const GCLIENT='471807213057-faq4329spp81fjq7kmqspch983gnc7aa.apps.googleusercontent.com';
const GS={tok:null,exp:0,busy:false,last:0,pending:null};
const gsOk=()=>IS_WEBAPP&&!!GCLIENT;
const gsOn=()=>gsOk()&&!!(L.gsync&&L.gsync.on);
const DAPI='https://www.googleapis.com/drive/v3/files',UAPI='https://www.googleapis.com/upload/drive/v3/files',GFOLDER='application/vnd.google-apps.folder';
const gqs=s=>String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
function gsLib(){return new Promise((res,rej)=>{if(window.google&&google.accounts&&google.accounts.oauth2)return res();const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=()=>res();s.onerror=()=>rej({code:'offline'});document.head.appendChild(s)})}
const gsHasTok=()=>!!GS.tok&&Date.now()<GS.exp-60e3;
async function gsToken(interactive){
  if(gsHasTok())return GS.tok;if(!interactive)throw{code:'needs_click'};
  await gsLib();
  return new Promise((res,rej)=>{const c=google.accounts.oauth2.initTokenClient({client_id:GCLIENT,scope:'https://www.googleapis.com/auth/drive',
    hint:(L.gsync&&L.gsync.email)||undefined,callback:r=>{if(r.error)return rej({code:r.error});GS.tok=r.access_token;GS.exp=Date.now()+(+r.expires_in||3600)*1000;res(GS.tok)},
    error_callback:e=>rej({code:(e&&e.type)||'popup'})});c.requestAccessToken({prompt:L.gsync&&L.gsync.on?'':'consent'})})}
async function gfetch(url,opt={},interactive){const t=await gsToken(interactive);const r=await fetch(url,{...opt,headers:{...(opt.headers||{}),Authorization:'Bearer '+t}});
  if(r.status===401){GS.tok=null;throw{code:'needs_click'}}if(!r.ok)throw{code:'http'+r.status,message:await r.text().catch(()=>'')};return r}
async function gq(q,fields){const r=await gfetch(DAPI+'?q='+encodeURIComponent(q)+'&fields='+encodeURIComponent('files('+(fields||'id,name,modifiedTime,appProperties')+')')+'&pageSize=200&spaces=drive');return(await r.json()).files||[]}
async function gmk(name,parent){const r=await gfetch(DAPI+'?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,mimeType:GFOLDER,parents:parent?[parent]:['root']})});return(await r.json()).id}
async function gup(id,meta,body){const b='esc'+Date.now(),parts=`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--`;
  const r=await gfetch((id?UAPI+'/'+id:UAPI)+'?uploadType=multipart&fields=id,modifiedTime,appProperties',{method:id?'PATCH':'POST',headers:{'Content-Type':'multipart/related; boundary='+b},body:parts});return r.json()}
async function gget(id){const r=await gfetch(DAPI+'/'+id+'?alt=media');return r.json()}
async function gmeta(id){try{const r=await gfetch(DAPI+'/'+id+'?fields=id,trashed,appProperties,modifiedTime');const m=await r.json();return m.trashed?null:m}catch(e){if(e.code==='http404')return null;throw e}}
async function gsRoot(){if(L.gsync.root){const m=await gmeta(L.gsync.root);if(m)return L.gsync.root}
  const f=(await gq(`name='Escritura' and mimeType='${GFOLDER}' and 'root' in parents and trashed=false`,'id'))[0];L.gsync.root=f?f.id:await gmk('Escritura');dirtyLib=true;return L.gsync.root}
async function gsFolder(){const g=P.gsync=P.gsync||{};if(g.folder&&await gmeta(g.folder))return g.folder;const root=await gsRoot(),name=(P.title||'Sin título').trim()||'Sin título';
  const f=(await gq(`name='${gqs(name)}' and mimeType='${GFOLDER}' and '${root}' in parents and trashed=false`,'id'))[0];g.folder=f?f.id:await gmk(name,root);return g.folder}
async function gsFindFile(pid){return(await gq(`appProperties has { key='pid' and value='${gqs(pid)}' } and trashed=false`,'id,name,appProperties'))[0]||null}
const gsName=()=>((P.title||'Obra').replace(/[\\/:*?"<>|]/g,'').trim().slice(0,80)||'Obra');
async function gsUpload(){const g=P.gsync=P.gsync||{};const folder=await gsFolder();g.base=P.updated;const body=backup();
  const meta={appProperties:{escritorio:'1',pid:P.id,upd:String(P.updated)}};
  if(g.file){const r=await gup(g.file,{...meta,name:gsName()+'.escritorio.json'},body);g.file=r.id}else{const r=await gup(null,{...meta,name:gsName()+'.escritorio.json',parents:[folder]},body);g.file=r.id;await gup(g.file,meta,backup())}
  if(g.bak!==today()){let rb=(await gq(`name='Respaldos' and mimeType='${GFOLDER}' and '${folder}' in parents and trashed=false`,'id'))[0];const rid=rb?rb.id:await gmk('Respaldos',folder);
    const ex=(await gq(`name='${gqs(gsName()+' - '+today()+'.json')}' and '${rid}' in parents and trashed=false`,'id'))[0];await gup(ex?ex.id:null,ex?{}:{name:gsName()+' - '+today()+'.json',parents:[rid]},body);g.bak=today()}
  lsSet(LSP(P.id),{P,T});}
/* apply what came from Drive without marking it as a local change */
function gsApply(d){const v=document.body.dataset.view||'ms';setData({P:d.P,T:d.T,H:d.H||{}});syncLib();lsSet(LSP(P.id),{P,T});lsSet(LSH(P.id),H);lsSet(LSL,L);renderAll();if(typeof mapReset==='function')mapReset();setView(v)}
async function gsSync(interactive){
  if(!gsOn()||GS.busy)return;GS.busy=true;
  try{
    if(interactive)await gsToken(true);else if(!gsHasTok()){status('Drive: tocá Guardar para sincronizar');return}
    if(P.sample){status('La novela de ejemplo no se sube a Drive');return}
    status('Sincronizando con Drive…');await flush();
    const g=P.gsync=P.gsync||{};let meta=g.file?await gmeta(g.file):null;if(!meta){const f=await gsFindFile(P.id);if(f){g.file=f.id;meta=f}else g.file=null}
    const rUpd=meta?+(meta.appProperties&&meta.appProperties.upd||0):0,base=+(g.base||0),localChanged=(P.updated||0)>base;
    if(meta&&rUpd>base){const remote=await gget(meta.id);
      if(!localChanged){remote.P.gsync=Object.assign({},remote.P.gsync,{file:meta.id,base:rUpd});gsApply(remote)}
      else{GS.busy=false;return gsConflict(remote,meta)}}
    else if(!meta||localChanged)await gsUpload();
    GS.last=Date.now();status('Sincronizado con Drive '+new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}));
  }catch(e){status(e&&e.code==='needs_click'?'Drive: tocá Guardar para sincronizar':e&&e.code==='offline'?'Sin internet: quedó guardado acá y se sube después':'No se pudo sincronizar con Drive ('+(e&&e.code||'error')+')')}
  finally{GS.busy=false}
}
function gsConflict(remote,meta){
  GS.pending={remote,meta};const rd=new Date(+(meta.appProperties.upd||0)),ld=new Date(P.updated);
  $('#syncMsg').textContent=`Hay cambios guardados en Drive desde otro dispositivo (${rd.toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'})}) y también cambios acá (${ld.toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'})}). La versión que no elijas queda guardada como copia en Respaldos.`;
  $('#dSync').showModal();status('Drive: elegí qué versión conservar');
}
async function gsKeepCopy(data,label){const folder=await gsFolder();let rb=(await gq(`name='Respaldos' and mimeType='${GFOLDER}' and '${folder}' in parents and trashed=false`,'id'))[0];const rid=rb?rb.id:await gmk('Respaldos',folder);
  await gup(null,{name:gsName()+' - '+label+' '+stamp()+'.json',parents:[rid]},JSON.stringify(data))}
$('#syncDrive').onclick=e=>busy(e.currentTarget,'Trayendo de Drive…',async()=>{const p=GS.pending;if(!p)return;try{await gsKeepCopy({app:'escritorio-novelas',v:2,P,T,H},'conflicto (esta compu)');const r=p.remote;r.P.gsync=Object.assign({},r.P.gsync,{file:p.meta.id,base:+p.meta.appProperties.upd});gsApply(r);GS.pending=null;$('#dSync').close();status('Sincronizado con Drive')}catch(err){$('#syncMsg').textContent='No se pudo: '+(err.code||'error')}});
$('#syncLocal').onclick=e=>busy(e.currentTarget,'Subiendo a Drive…',async()=>{const p=GS.pending;if(!p)return;try{await gsKeepCopy(p.remote,'conflicto (otro dispositivo)');P.gsync.file=p.meta.id;await gsUpload();GS.pending=null;$('#dSync').close();status('Sincronizado con Drive')}catch(err){$('#syncMsg').textContent='No se pudo: '+(err.code||'error')}});
/* the library also lists works that are in Drive but not on this device */
async function gsLibrary(interactive){if(!gsOn())return;try{if(!interactive&&!gsHasTok())return;await gsToken(interactive);const fs=await gq(`appProperties has { key='escritorio' and value='1' } and trashed=false`,'id,name,appProperties');let ch=false;
  for(const f of fs){const pid=f.appProperties.pid,upd=+(f.appProperties.upd||0),e=L.list.find(x=>x.id===pid);if(!e){L.list.push({id:pid,title:f.name.replace(/\.escritorio\.json$/,''),type:'novela',updated:upd,words:0,drive:f.id});ch=true}else if(!e.drive){e.drive=f.id;ch=true}}
  if(ch){dirtyLib=true;lsSet(LSL,L)}}catch(e){}}
async function gsFetchProject(id){if(!gsOn())return null;const e=L.list.find(x=>x.id===id);try{await gsToken(true);let fid=e&&e.drive;if(!fid){const f=await gsFindFile(id);fid=f&&f.id}if(!fid)return null;const m=await gmeta(fid);const d=await gget(fid);d.P.gsync=Object.assign({},d.P.gsync,{file:fid,base:+(m&&m.appProperties&&m.appProperties.upd||d.P.updated||0)});return{P:d.P,T:d.T,H:d.H||{}}}catch(err){return null}}
/* settings in Exportar */
function gsUI(){const box=$('#gsBox');box.hidden=!gsOk();if(!gsOk())return;const on=gsOn();
  $('#gsInfo').innerHTML=on?`Conectado${L.gsync.email?' como <b>'+esc(L.gsync.email)+'</b>':''}. Esta obra se guarda en <b>Escritura / ${esc((P.gsync&&P.gsync.folder&&P.title)||P.title)}</b> y se actualiza en cada dispositivo donde la abras.${GS.last?' Última sincronización: '+new Date(GS.last).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})+'.':''}`:'Guardá tus obras directamente en tu Google Drive y seguí escribiendo desde cualquier compu o celular.';
  $('#gsConnect').hidden=on;$('#gsNow').hidden=!on;$('#gsOff').hidden=!on}
$('#gsConnect').onclick=e=>busy(e.currentTarget,'Conectando con Google…',async()=>{try{L.gsync=Object.assign({},L.gsync,{on:true});await gsToken(true);
  try{const r=await gfetch('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)');L.gsync.email=(await r.json()).user.emailAddress}catch(err){}
  dirtyLib=true;await gsLibrary(false);
  if(P.sample){const e=L.list.filter(x=>x.drive&&x.id!==P.id).sort((a,b)=>(b.updated||0)-(a.updated||0))[0];if(e){await openProject(e.id);gsUI();return}}
  await gsSync(true);gsUI()}catch(err){L.gsync.on=false;$('#expMsg').textContent=err.code==='popup_closed'||err.code==='access_denied'?'Conexión cancelada.':'No se pudo conectar ('+(err.code||'error')+').';gsUI()}});
$('#gsNow').onclick=e=>busy(e.currentTarget,'Sincronizando…',async()=>{await gsSync(true);gsUI()});
$('#gsOff').onclick=e=>confirm2(e.currentTarget,()=>{L.gsync={on:false};GS.tok=null;dirtyLib=true;flush();gsUI();status(savedLabel())},'Confirmar');
setInterval(()=>{if(gsOn()&&gsHasTok()&&P&&(P.updated||0)>+((P.gsync&&P.gsync.base)||0)&&!document.hidden)gsSync(false)},90e3);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&gsOn()&&gsHasTok())gsSync(false)});
$('#saveSt').addEventListener('click',()=>{if(gsOn()&&!gsHasTok())gsSync(true)});
