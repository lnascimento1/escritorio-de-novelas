'use strict';
/* ---------- platform: the same page runs inside claude.ai, as an Android app (Capacitor) and as a Windows app (Electron) ---------- */
const IS_APP=!!window.ESCRITORIO_APP;
const CAP=(window.Capacitor&&window.Capacitor.Plugins)||null;
const IS_ANDROID=!!(window.Capacitor&&window.Capacitor.getPlatform&&window.Capacitor.getPlatform()==='android');
const ELEC=window.electronAPI||null;
/* IndexedDB mirror of the key/value store, so long novels are not limited by localStorage */
const IDB={db:null,
  open(){return new Promise(res=>{try{const r=indexedDB.open('escritorio-novelas',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>{this.db=r.result;res(true)};r.onerror=()=>res(false);setTimeout(()=>res(false),4000)}catch(e){res(false)}})},
  all(){return new Promise(res=>{if(!this.db)return res({});const out={};try{const rq=this.db.transaction('kv').objectStore('kv').openCursor();rq.onsuccess=()=>{const c=rq.result;if(c){out[c.key]=c.value;c.continue()}else res(out)};rq.onerror=()=>res(out)}catch(e){res(out)}})},
  put(k,v){if(!this.db)return;try{this.db.transaction('kv','readwrite').objectStore('kv').put(v,k)}catch(e){}},
  del(k){if(!this.db)return;try{this.db.transaction('kv','readwrite').objectStore('kv').delete(k)}catch(e){}}};
const blobB64=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(b)});
const toBlob=d=>d instanceof Blob?d:new Blob([d],{type:'text/plain;charset=utf-8'});
/* save a file: claude.ai downloads, Windows save dialog, Android share sheet (Drive, WhatsApp, Archivos…) */
async function saveFile(name,data){
  if(typeof dl!=='undefined'&&dl)return dl.save({filename:name,data});
  const blob=toBlob(data);
  if(ELEC&&ELEC.saveFile){const p=await ELEC.saveFile(name,new Uint8Array(await blob.arrayBuffer()));if(!p)throw{code:'declined'};return{status:'saved',path:p}}
  if(CAP&&CAP.Filesystem){const r=await CAP.Filesystem.writeFile({path:'exportes/'+name,data:await blobB64(blob),directory:'CACHE',recursive:true});
    if(CAP.Share){try{await CAP.Share.share({title:name,files:[r.uri],dialogTitle:'Guardar o enviar'})}catch(e){try{await CAP.Share.share({title:name,url:r.uri,dialogTitle:'Guardar o enviar'})}catch(e2){throw{code:'declined'}}}}
    return{status:'saved'}}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},3000);return{status:'saved'};
}
const canSave=()=>IS_APP||(typeof dl!=='undefined'&&!!dl);
async function copyText(t){if(CAP&&CAP.Clipboard){await CAP.Clipboard.write({string:t});return}await navigator.clipboard.writeText(t)}
/* reading aloud with the device's own voices */
function makeTTS(){
  const ss=window.speechSynthesis,nat=CAP&&CAP.TextToSpeech;if(!nat&&!ss)return null;
  let st='idle',stop=false;const hs={state:[],line:[]};const emit=(t,e)=>hs[t].forEach(f=>{try{f(e)}catch(x){}});const set=(s,reason)=>{st=s;emit('state',reason?{state:s,reason}:{state:s})};
  const one=t=>nat?nat.speak({text:t,lang:'es-AR',rate:1,category:'playback'}).catch(()=>{}):new Promise(r=>{const u=new SpeechSynthesisUtterance(t);u.lang='es-AR';const v=ss.getVoices().find(x=>/^es/i.test(x.lang));if(v)u.voice=v;u.onend=r;u.onerror=r;ss.speak(u)});
  return{active:()=>st!=='idle',onState(f){hs.state.push(f);return()=>{}},onLine(f){hs.line.push(f);return()=>{}},
    async stop(){stop=true;try{ss&&ss.cancel()}catch(e){}try{nat&&await nat.stop()}catch(e){}set('idle','stopped')},
    async speak(lines){stop=false;set('speaking');for(let i=0;i<lines.length;i++){if(stop)return;emit('line',{line:i,id:lines[i].id});await one(lines[i].text)}if(!stop)set('idle','completed')}};
}
/* automatic backup folder (Windows): pick your Google Drive folder and every Guardar writes there */
async function appBackup(){
  if(!ELEC||!ELEC.writeBackup)return null;const folder=await ELEC.getFolder();if(!folder)return null;
  const base=(P.title||'Obra').replace(/[\\/:*?"<>|]/g,'').trim().slice(0,80)||'Obra',d=today();
  const bytes=new TextEncoder().encode(backup());
  await ELEC.writeBackup(base+'.json',bytes);await ELEC.writeBackup('Respaldos/'+base+' - '+d+'.json',bytes);return folder;
}
