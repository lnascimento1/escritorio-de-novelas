'use strict';
/* ---------- export ---------- */
let scope='all',dl=null;
const part=()=>{if(scope==='chap'){const k=cur();return k?[k.c]:[]}return P.chapters};
const fname=ext=>(P.title||'obra').replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,60)+(scope==='chap'?' - capitulo':'')+'.'+ext;
const multi=()=>P.chapters.length>1||P.type!=='cuento';
function asText(mdown){let o=mdown?'# '+P.title+'\n\n':P.title.toUpperCase()+'\n\n';
  part().forEach(c=>{if(multi())o+=(mdown?'## ':'\n\n')+c.title+'\n\n';c.scenes.forEach((s,i)=>{if(i)o+='\n* * *\n\n';
    o+=(mdown?runsOf(T[s.id]).map(r=>r.map(x=>{let t=x.t.replace(/\n/g,'  \n');if(!t.trim())return t;const m=/^(\s*)(.*?)(\s*)$/s.exec(t);let c=m[2];if(x.i)c='*'+c+'*';if(x.b)c='**'+c+'**';return m[1]+c+m[3]}).join('')):parasOf(T[s.id])).join('\n\n')+'\n'})});return o.trim()+'\n'}
const asTextAll=()=>{const s=scope;scope='all';const t=asText(false);scope=s;return t};
const xe=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function wr(t,o={}){return`<w:r><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>${o.b?'<w:b/>':''}${o.i?'<w:i/>':''}<w:sz w:val="${o.sz||24}"/></w:rPr>${t.split('\n').map(x=>`<w:t xml:space="preserve">${xe(x)}</w:t>`).join('<w:br/>')}</w:r>`}
function wp(runs,o={}){return`<w:p><w:pPr>${o.br?'<w:pageBreakBefore/>':''}<w:spacing w:before="${o.before||0}" w:after="${o.after||0}" w:line="360" w:lineRule="auto"/>${o.c?'<w:jc w:val="center"/>':`<w:ind w:firstLine="${o.first?0:567}"/><w:jc w:val="both"/>`}</w:pPr>${runs}</w:p>`}
async function makeDocx(){
  if(!window.JSZip)throw new Error('lib');
  let b=wp(wr(P.title,{b:1,sz:48}),{c:1,before:3600,after:400});let first=true;
  part().forEach(c=>{if(multi())b+=wp(wr(c.title,{b:1,sz:32}),{br:1,c:1,before:1200,after:600});else if(first)b+=wp('',{br:1});first=false;
    c.scenes.forEach((s,i)=>{if(i)b+=wp(wr('*  *  *'),{c:1,before:240,after:240});runsOf(T[s.id]).forEach((p,j)=>b+=wp(p.map(r=>wr(r.t,r)).join(''),{first:j===0}))})});
  const z=new JSZip();
  z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/document.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+b+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>');
  return z.generateAsync({type:'blob'});
}
function makePdf(){
  if(!window.jspdf)throw new Error('lib');
  const d=new window.jspdf.jsPDF({unit:'pt',format:'a4'}),W=d.internal.pageSize.getWidth(),H2=d.internal.pageSize.getHeight(),M=72,lw=W-2*M,lh=18;let y;
  const st=r=>r.b&&r.i?'bolditalic':r.b?'bold':r.i?'italic':'normal';
  const nl=()=>{y+=lh;if(y>H2-M){d.addPage();y=M}};
  d.setFont('times','bold');d.setFontSize(26);y=H2/3;d.splitTextToSize(P.title,lw).forEach(t=>{d.text(t,W/2,y,{align:'center'});y+=32});
  let first=true;
  part().forEach(c=>{if(multi()||first){d.addPage();y=M+(multi()?60:0)}first=false;
    if(multi()){d.setFont('times','bold');d.setFontSize(18);d.splitTextToSize(c.title,lw).forEach(t=>{d.text(t,W/2,y,{align:'center'});y+=24});y+=24}
    d.setFontSize(12);
    c.scenes.forEach((s,i)=>{if(i){y+=6;d.setFont('times','normal');d.text('*   *   *',W/2,y,{align:'center'});nl();y+=6}
      runsOf(T[s.id]).forEach((p,j)=>{let x=M+(j?24:0);
        for(const r of p){d.setFont('times',st(r));for(const tok of r.t.split(/(\s+)/)){if(!tok)continue;if(tok.includes('\n')){nl();x=M;continue}const w=d.getTextWidth(tok);
          if(/^\s+$/.test(tok)){if(x>M)x+=w;continue}if(x+w>M+lw&&x>M){nl();x=M}d.text(tok,x,y);x+=w}}
        nl()})})});
  const n=d.getNumberOfPages();d.setFont('times','normal');d.setFontSize(10);for(let i=2;i<=n;i++){d.setPage(i);d.text(String(i-1),W/2,H2-36,{align:'center'})}
  return d.output('blob');
}
const backup=()=>JSON.stringify({app:'escritorio-novelas',v:2,P,T,H});
async function doExport(f){
  const m=$('#expMsg');m.textContent='Preparando…';
  try{
    if(f==='copy'){await copyText(asText(false));m.textContent='Texto copiado. Pegalo en Word o donde quieras.';return}
    if(!canSave()){m.textContent='Las descargas no están disponibles en esta vista. Usá "Copiar texto" o abrí la página en claude.ai.';return}
    let data;if(f==='docx')data=await makeDocx();else if(f==='pdf')data=makePdf();else if(f==='md')data=asText(true);else if(f==='txt')data=asText(false);else{scope='all';data=backup()}
    const r=await saveFile(fname(f),data);m.textContent=r&&r.path?'Guardado en '+r.path:'Listo.';
  }catch(e){m.textContent=e&&e.code==='declined'?'Descarga cancelada.':e&&e.message==='lib'?'No se pudo cargar el generador de este formato. Probá de nuevo en un rato.':'No se pudo exportar ('+(e&&(e.code||e.message)||'error')+').'}
}
async function importData(o){if(!o||!o.P||!o.T||!Array.isArray(o.P.chapters))throw{code:'bad'};const d={P:o.P,T:o.T,H:o.H||{}};d.P.id=d.P.id||nid();delete d.P.sample;await openProject(d.P.id,d)}
$('#bExp').onclick=()=>{$('#expMsg').textContent='';if(IS_APP)abkUI();else gUI();$('#dExp').showModal()};
/* app backups: Windows writes to a chosen folder (your Google Drive folder works), Android sends the file wherever you pick */
async function abkUI(){$('#gd').hidden=true;$('#abk').hidden=false;if(IS_WEBAPP)$('#abkShare').innerHTML='Descargar respaldo<small>un archivo .json</small>';$('#abkFolder').hidden=!hasFolderPicker();
  if(hasFolderPicker()){const f=ELEC?await ELEC.getFolder():(await FSA.load())&&FSA.h.name;$('#abkPath').textContent=f||'por ejemplo, tu carpeta de Google Drive';$('#abkInfo').textContent=f?'Cada vez que tocás Guardar, se escribe una copia en esa carpeta y una por día en Respaldos.':'Elegí una carpeta y cada Guardar va a dejar ahí una copia. Si usás Google Drive para escritorio, elegí tu carpeta de Drive y se sube sola.'}
  else $('#abkInfo').textContent='Tu obra se guarda en el teléfono. Para tener copia en Google Drive, tocá "Enviar respaldo" y elegí Drive.'}
$('#abkFolder').onclick=e=>busy(e.currentTarget,'Eligiendo carpeta…',async()=>{let f=null;try{f=ELEC?await ELEC.chooseFolder():await FSA.choose()}catch(err){}if(f){await appBackup(true);abkUI();$('#expMsg').textContent='Listo: ya guardé una copia en '+f}});
$('#abkShare').onclick=e=>busy(e.currentTarget,'Preparando respaldo…',async()=>{try{await saveFile((P.title||'obra').replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,60)+' - respaldo '+today()+'.json',backup());$('#expMsg').textContent='Respaldo listo.'}catch(err){$('#expMsg').textContent=err&&err.code==='declined'?'Cancelado.':'No se pudo preparar el respaldo.'}});
$('#xClose').onclick=()=>$('#dExp').close();
$('#scope').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;scope=b.dataset.v;$$('#scope button').forEach(x=>x.classList.toggle('on',x===b))});
$('#fmts').addEventListener('click',e=>{const b=e.target.closest('button');if(b)busy(b,'Exportando…',()=>doExport(b.dataset.f))});
$('#imp').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{busyOn('Leyendo respaldo…');await importData(JSON.parse(await f.text()));$('#expMsg').textContent='Respaldo abierto.'}catch(err){$('#expMsg').textContent='Ese archivo no es un respaldo válido.'}busyOff();e.target.value=''});

/* ---------- Google Drive: Escritura / <obra> / Respaldos ---------- */
const GD='Google Drive';let mcpx=null,gBusy=false,mcpState=window.claude&&window.claude.use?'cargando':'sin-claude';
function gStateMsg(){return mcpx?'':mcpState==='cargando'?'Conectando con Google Drive…':mcpState==='sin-claude'?'Drive solo funciona abriendo la página desde su link de claude.ai (no como archivo suelto).':mcpState==='null'?'Esta vista no tiene acceso a tus conectores. Abrí la página desde el link de claude.ai en la compu, con tu sesión iniciada, y recargala.':'No se pudo cargar la conexión con Drive ('+esc(mcpState)+'). Recargá la página.'}
const gmsg=t=>{$('#gRes').innerHTML=t};
const stamp=()=>{const d=new Date();return dkey(d)+' '+String(d.getHours()).padStart(2,'0')+'.'+String(d.getMinutes()).padStart(2,'0')};
async function gcall(tool,input){const r=await mcpx.callTool(GD,tool,input,{cache:false});return r.payload}
function gErr(e){const c=e&&e.code;
  if(c==='needs_reauth')return'Tu conexión con Google Drive venció. Reconectala en claude.ai → Configuración → Conectores.';
  if(c==='server_not_connected')return'Google Drive no está conectado. Agregalo en claude.ai → Configuración → Conectores.';
  if(c==='not_in_manifest'||c==='approval_required'||c==='consent_required')return'Hace falta que permitas el acceso a Google Drive para esta página. Volvé a tocar el botón y aceptá el aviso.';
  if(c==='selection_required')return'Tenés más de una conexión de Google Drive: elegí cuál usar en el aviso de claude.ai.';
  if(c==='blocked_by_policy')return'Tu organización no permite usar Google Drive desde esta página.';
  if(c==='server_unavailable'||c==='upstream_error')return'Google Drive no respondió. Puede que la copia se haya guardado igual: revisá la carpeta antes de reintentar.';
  if(c==='tool_error')return'Google Drive rechazó la operación: '+esc(e.message||'');
  return'No se pudo completar con Google Drive ('+esc(c||'error')+').'}
const qs=s=>String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const FOLDER='application/vnd.google-apps.folder';
async function gFind(q){const r=await gcall('search_files',{query:q,excludeContentSnippets:true,pageSize:1});return r&&r.files&&r.files[0]}
async function gMk(title,parentId){const i={title,contentMimeType:FOLDER};if(parentId)i.parentId=parentId;const f=await gcall('create_file',i);if(!f||!f.id)throw{code:'tool_error',message:'no se pudo crear la carpeta '+title};return f}
async function gRoot(){if(L.driveRoot)return L.driveRoot;
  const f=await gFind(`title = 'Escritura' and mimeType = '${FOLDER}' and trashed = false and parentId = 'root'`)||await gFind(`title = 'Escritura' and mimeType = '${FOLDER}' and trashed = false`)||await gMk('Escritura');
  L.driveRoot=f.id;dirtyLib=true;return f.id}
async function gProj(){P.drive=P.drive||{};if(P.drive.projId)return P.drive.projId;const root=await gRoot(),name=(P.title||'Sin título').trim()||'Sin título';
  const f=await gFind(`title = '${qs(name)}' and mimeType = '${FOLDER}' and trashed = false and parentId = '${root}'`)||await gMk(name,root);
  P.drive.projId=f.id;P.drive.projName=name;return f.id}
async function gBk(){P.drive=P.drive||{};if(P.drive.bkId)return P.drive.bkId;const pj=await gProj();
  const f=await gFind(`title = 'Respaldos' and mimeType = '${FOLDER}' and trashed = false and parentId = '${pj}'`)||await gMk('Respaldos',pj);
  P.drive.bkId=f.id;return f.id}
const gReset=()=>{delete L.driveRoot;if(P.drive){delete P.drive.projId;delete P.drive.bkId}};
const gWhere=()=>'Escritura / '+((P.drive&&P.drive.projName)||P.title||'Sin título');
function gLast(){const t=P.drive&&P.drive.lastAt;$('#gLast').textContent=t?'Última copia: '+new Date(t).toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'}):'en '+gWhere()}
async function gSave(auto,quick){
  if(!mcpx||gBusy)return false;gBusy=true;if(!auto)gmsg('Guardando en Drive…');
  try{
    const bk=await gBk(),pj=P.drive.projId,base=(P.title||'Obra').slice(0,80)+' – ',st=stamp();
    await gcall('create_file',{title:base+'respaldo '+st+'.json',textContent:backup(),contentMimeType:'application/json',disableConversionToGoogleType:true,parentId:bk});
    let doc=null;if(!auto&&!quick&&$('#gDoc').checked)doc=await gcall('create_file',{title:base+'manuscrito '+st,textContent:asTextAll(),contentMimeType:'text/plain',parentId:pj});
    touch();P.drive.lastAt=P.updated;gLast();
    gmsg((auto?'Copia automática guardada en ':'Copia guardada en ')+esc(gWhere())+'. <a href="https://drive.google.com/drive/folders/'+esc(pj)+'" target="_blank" rel="noopener">Abrir la carpeta</a>'+(doc&&doc.viewUrl?' · <a href="'+esc(doc.viewUrl)+'" target="_blank" rel="noopener">Abrir el manuscrito</a>':''));
    gBusy=false;return true;
  }catch(e){if(e&&e.code==='tool_error')gReset();gmsg(gErr(e))}
  gBusy=false;return false;
}
function gDecode(p){
  if(p&&p.P&&p.T)return p;
  const strs=[];(function walk(o){if(typeof o==='string')strs.push(o);else if(o&&typeof o==='object')Object.values(o).forEach(walk)})(p);
  strs.sort((a,b)=>b.length-a.length);
  for(const s of strs){try{const o=JSON.parse(s);if(o&&o.P&&o.T)return o}catch(e){}
    try{const b=atob(s.replace(/\s/g,'')),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);const o=JSON.parse(new TextDecoder().decode(u));if(o&&o.P&&o.T)return o}catch(e){}}
  return null}
async function gList(){
  if(!mcpx||gBusy)return;gBusy=true;gmsg('Buscando copias en Drive…');
  try{const root=await gRoot();
    const r=await gcall('search_files',{query:`'${root}' in ancestors and title contains 'respaldo' and title contains '.json' and trashed = false`,orderBy:'modifiedTime desc',pageSize:20,excludeContentSnippets:true});
    const fs=(r&&r.files)||[];
    gmsg(fs.length?'<div class="glist">'+fs.map(f=>`<button data-gid="${esc(f.id)}">${esc(f.title)}<small>${f.modifiedTime?new Date(f.modifiedTime).toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'}):''} · se abre en la app</small></button>`).join('')+'</div>':'Todavía no hay copias en tu Drive.');
  }catch(e){if(e&&e.code==='tool_error')gReset();gmsg(gErr(e))}gBusy=false}
$('#gSave').onclick=e=>busy(e.currentTarget,'Guardando en Drive…',()=>gSave(false));$('#gList').onclick=e=>busy(e.currentTarget,'Buscando en Drive…',gList);
$('#gRes').addEventListener('click',async e=>{const b=e.target.closest('[data-gid]');if(!b||gBusy)return;
  if(!b.dataset.armed){b.dataset.armed=1;b.querySelector('small').textContent='Tocá de nuevo para abrir esta copia (reemplaza esa obra en la app)';return}
  gBusy=true;b.disabled=true;b.classList.add('loading');busyOn('Abriendo desde Drive…');
  try{const o=gDecode(await gcall('download_file_content',{fileId:b.dataset.gid}));if(!o)throw{code:'bad'};gBusy=false;await importData(o);gLast();gmsg('Copia abierta desde Drive.')}
  catch(err){gmsg(err&&err.code==='bad'?'Ese archivo no es un respaldo válido de la app.':gErr(err))}busyOff();b.classList.remove('loading');b.disabled=false;gBusy=false});
$('#gAuto').addEventListener('change',e=>{P.drive=P.drive||{};P.drive.auto=e.target.checked;if(!P.drive.lastAt){touch();P.drive.lastAt=P.updated}touch()});
setInterval(()=>{const d=P&&P.drive;if(mcpx&&d&&d.auto&&(P.updated||0)>(d.lastAt||0)&&Date.now()-(d.lastAt||0)>30*60e3)gSave(true)},60e3);
function gUI(){const ok=!!mcpx;['#gSave','#gList','#gAuto'].forEach(s=>$(s).disabled=!ok);$('#gAuto').checked=!!(P.drive&&P.drive.auto);gLast();$('#gState').innerHTML=gStateMsg()}
$('#gTest').onclick=e=>busy(e.currentTarget,'Probando Drive…',async()=>{
  if(!mcpx){gmsg('<b>Sin conexión.</b> '+gStateMsg());return}
  try{const l=await mcpx.listTools(GD);const s=(l.servers||[]).find(x=>x.server===GD);
    if(!s){gmsg('Google Drive no aparece entre tus conectores. Agregalo en claude.ai → Configuración → Conectores.');return}
    if(s.authStatus==='needs_reauth'){gmsg(gErr({code:'needs_reauth'}));return}
    const r=await gRoot();gmsg('Conexión correcta: la app ve tu carpeta Escritura. <a href="https://drive.google.com/drive/folders/'+esc(r)+'" target="_blank" rel="noopener">Abrirla</a>')}
  catch(err){gmsg(gErr(err)+' <span style="opacity:.7">(código: '+esc(err&&err.code||'desconocido')+')</span>')}});

async function saveNow(){
  const b=$('#bSave');if(b.disabled)return;
  if(IS_APP){b.disabled=true;busyOn('Guardando…');try{const k=cur();if(k)autoSnap(k.s.id);await flush();const f=await appBackup(true).catch(()=>null);
    status(f?'Guardado en tu carpeta de respaldo '+new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}):savedLabel()+(hasFolderPicker()?' · elegí una carpeta de respaldo en Exportar':''))}finally{busyOff();b.disabled=false}return}
  b.disabled=true;b.textContent='Guardando…';busyOn('Guardando…');try{
  const k=cur();if(k)autoSnap(k.s.id);
  await flush();
  if(mcpx){status('Guardando en Drive…');const ok=await gSave(false,true);
    if(ok){status('Guardado en Drive '+new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}));b.textContent='Guardado'}
    else{status('No se pudo guardar en Drive');b.textContent='Guardar';$('#expMsg').textContent='';const msg=$('#gRes').innerHTML;gUI();$('#gRes').innerHTML=msg;$('#dExp').showModal()}}
  else{status(savedLabel()+' · Drive sin conectar');b.textContent='Guardado';$('#expMsg').textContent='';gUI();gmsg('<b>No se guardó en Drive.</b> '+gStateMsg());$('#dExp').showModal()}
  }finally{busyOff()}
  setTimeout(()=>{b.textContent='Guardar';b.disabled=false},1500);
}
$('#bSave').onclick=saveNow;
