'use strict';
/* ---------- pomodoro: a quiet timer in the header and in the focus bar ---------- */
let POM={work:25,brk:5,phase:'idle',end:0,left:25*60,paused:false,count:{}},pomAC=null,pomT=null;
try{const s=JSON.parse(localStorage.getItem('en-pom')||'null');if(s)POM=Object.assign(POM,s)}catch(e){}
if(POM.phase!=='idle'&&!POM.paused&&POM.end<Date.now()){POM.phase='idle';POM.left=POM.work*60}
const pomSave=()=>{try{localStorage.setItem('en-pom',JSON.stringify(POM))}catch(e){}};
const pomLeft=()=>POM.phase==='idle'?POM.work*60:POM.paused?POM.left:Math.max(0,Math.round((POM.end-Date.now())/1000));
const mmss=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
function pomRing(frac,col){const r=6.5,c=2*Math.PI*r;return`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="${r}" fill="none" stroke="var(--line)" stroke-width="2"/><circle cx="8" cy="8" r="${r}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="${c*frac} ${c}" transform="rotate(-90 8 8)" stroke-linecap="round"/></svg>`}
function pomDraw(){
  const l=pomLeft(),tot=(POM.phase==='break'?POM.brk:POM.work)*60,frac=POM.phase==='idle'?0:1-l/tot,col=POM.phase==='break'?'var(--grn)':'var(--acc)';
  const txt=POM.phase==='idle'?mmss(l):(POM.paused?'‖ ':'')+(POM.phase==='break'?'Pausa ':'')+mmss(l);
  $$('[data-pom]').forEach(b=>{b.innerHTML=pomRing(frac,col)+'<span>'+txt+'</span>';b.classList.toggle('run',POM.phase==='work');b.classList.toggle('brk',POM.phase==='break')});
  if(!$('#pomPop').hidden)pomPop();
}
function pomChime(){try{if(!pomAC)return;const t=pomAC.currentTime;[0,.35].forEach((d,i)=>{const o=pomAC.createOscillator(),g=pomAC.createGain();o.type='sine';o.frequency.value=i?880:660;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.18,t+d+.03);g.gain.exponentialRampToValueAtTime(.001,t+d+.9);o.connect(g);g.connect(pomAC.destination);o.start(t+d);o.stop(t+d+1)})}catch(e){}}
function pomDing(){pomChime();$$('[data-pom]').forEach(b=>{b.classList.remove('ding');void b.offsetWidth;b.classList.add('ding')})}
function pomTick(){
  clearTimeout(pomT);if(POM.phase==='idle'||POM.paused){pomDraw();return}
  if(pomLeft()<=0){
    if(POM.phase==='work'){const t=today();POM.count[t]=(POM.count[t]||0)+1;POM.phase='break';POM.end=Date.now()+POM.brk*60e3}
    else{POM.phase='idle';POM.left=POM.work*60}
    pomSave();pomDing()}
  pomDraw();if(POM.phase!=='idle')pomT=setTimeout(pomTick,1000);
}
function pomStart(){try{pomAC=pomAC||new (window.AudioContext||window.webkitAudioContext)();pomAC.resume&&pomAC.resume()}catch(e){}
  if(POM.phase==='idle'){POM.phase='work';POM.end=Date.now()+POM.work*60e3;POM.paused=false}
  else if(POM.paused){POM.end=Date.now()+POM.left*1000;POM.paused=false}
  else{POM.left=pomLeft();POM.paused=true}
  pomSave();pomTick()}
function pomReset(){POM.phase='idle';POM.paused=false;POM.left=POM.work*60;pomSave();pomTick()}
function pomPop(){const p=$('#pomPop'),l=pomLeft(),n=POM.count[today()]||0;
  p.innerHTML=`<div class="pt">${mmss(l)}</div><div class="ps">${POM.phase==='work'?(POM.paused?'En pausa':'Escribiendo'):POM.phase==='break'?(POM.paused?'Descanso en pausa':'Descanso'):'Listo para empezar'} · hoy ${n} pomodoro${n===1?'':'s'}</div>
  <div class="pr"><button class="pri" data-p="go">${POM.phase==='idle'?'Empezar':POM.paused?'Seguir':'Pausar'}</button>${POM.phase!=='idle'?'<button data-p="reset">Reiniciar</button>':''}${POM.phase==='break'?'<button data-p="skip">Saltar descanso</button>':''}</div>
  <label>Escritura</label><div class="chips">${[15,25,45,60].map(m=>`<button data-w="${m}" class="${POM.work===m?'on':''}">${m} min</button>`).join('')}</div>
  <label>Descanso</label><div class="chips">${[5,10,15].map(m=>`<button data-b="${m}" class="${POM.brk===m?'on':''}">${m} min</button>`).join('')}</div>`}
function pomOpen(btn){const p=$('#pomPop');if(!p.hidden&&p.dataset.from===btn.id){p.hidden=true;return}p.dataset.from=btn.id;pomPop();p.hidden=false;
  const r=btn.getBoundingClientRect(),w=260;p.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+'px';p.style.top=(r.bottom+8)+'px'}
$$('[data-pom]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();pomOpen(b)}));
$('#pomPop').addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('button');if(!b)return;
  if(b.dataset.p==='go')pomStart();else if(b.dataset.p==='reset')pomReset();else if(b.dataset.p==='skip'){POM.end=Date.now();pomTick()}
  else if(b.dataset.w){POM.work=+b.dataset.w;if(POM.phase==='idle')POM.left=POM.work*60;pomSave()}else if(b.dataset.b){POM.brk=+b.dataset.b;pomSave()}
  pomDraw()});
document.addEventListener('click',e=>{const p=$('#pomPop');if(!p.hidden&&!e.target.closest('#pomPop,[data-pom]'))p.hidden=true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#pomPop').hidden){$('#pomPop').hidden=true;e.stopPropagation()}},true);
pomTick();
