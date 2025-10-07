/* ===== Core helpers ===== */
const $ = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
const store = {
  get(k, f) { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
const fmtDate = d => new Date(d).toLocaleDateString();

/* ===== App shell: tabs, theme, export/import ===== */
const tabs = ["home","wheels","watch","todo","mem","study"];
const tabBtns = $$('.tab-btn');
const sections = tabs.map(id => $(`#tab-${id}`));
function showTab(id){
  sections.forEach(sec => sec.classList.add('hidden'));
  $(`#tab-${id}`).classList.remove('hidden');
  tabBtns.forEach(b => b.setAttribute('aria-selected', b.dataset.tab===id?'true':'false'));
  store.set('ui_tab', id);
}
tabBtns.forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
$$('.go-tab').forEach(b => b.addEventListener('click', () => showTab(b.dataset.go)));
showTab(store.get('ui_tab','home'));
$('#yr').textContent = new Date().getFullYear();

/* Theme (light/glass default; optional deep navy) */
const themeToggle = $('#themeToggle');
function applyTheme(t){
  if (t==='navy') document.body.style.background = 'linear-gradient(180deg,#0A1530 0%, #0A1530 40%, #0d1f45 100%)';
  else document.body.style.background = 'var(--off)';
  store.set('ui_theme', t);
}
applyTheme(store.get('ui_theme','light'));
themeToggle.addEventListener('click', () => {
  const t = store.get('ui_theme','light') === 'light' ? 'navy' : 'light';
  applyTheme(t);
});

/* Export / Import ALL data (one JSON) */
$('#exportAll').addEventListener('click', () => {
  const keys = ['wheels','wheel_presets','watch_list','todos','memories','study_sets','email_notes'];
  const all = {};
  keys.forEach(k => all[k] = store.get(k, null));
  const blob = new Blob([JSON.stringify(all,null,2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'us.two-backup.json'; a.click();
});
$('#importAll').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    Object.entries(data).forEach(([k,v]) => localStorage.setItem(k, JSON.stringify(v)));
    location.reload();
  } catch { alert('Invalid backup file.'); }
});

/* ===== Quick add widgets on Home ===== */
$('#qTodoAdd').addEventListener('click', () => {
  const v = $('#qTodo').value.trim(); if (!v) return;
  todos.push({ text:v, priority:'Med', due:null, done:false });
  store.set('todos', todos); $('#qTodo').value=''; renderTodos();
});
$('#qWatchAdd').addEventListener('click', () => {
  const title = $('#qWatchTitle').value.trim(); if (!title) return;
  watchList.push({ title, type:$('#qWatchType').value, platform:$('#qWatchPlatform').value.trim(), status:'To Watch', notes:'' });
  store.set('watch_list', watchList);
  $('#qWatchTitle').value=''; $('#qWatchPlatform').value=''; renderWatchList();
});

/* ===== Confetti (for wheels) ===== */
const confetti = (() => {
  const canvas = $('#confettiCanvas'); if (!canvas) return { burst(){} };
  const ctx = canvas.getContext('2d'); let W,H, parts=[], running=false;
  const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; };
  addEventListener('resize', resize, {passive:true}); resize();
  const spawn = (n=120)=>{ for(let i=0;i<n;i++) parts.push({x:Math.random()*W,y:-20-Math.random()*80,s:4+Math.random()*6,v:2+Math.random()*3,a:Math.random()*6.28,c:Math.random()<.5?'#19A974':'#CFFAEA'})); };
  const step = () => {
    ctx.clearRect(0,0,W,H);
    parts.forEach(p=>{ p.y+=p.v; p.x+=Math.sin(p.a+=.05); ctx.fillStyle=p.c; ctx.fillRect(p.x,p.y,p.s,p.s); });
    parts = parts.filter(p=>p.y<H+10);
    if (parts.length || running) requestAnimationFrame(step);
  };
  return { burst(){ spawn(); if(!running){ running=true; requestAnimationFrame(step); setTimeout(()=>running=false,1500);} } };
})();

/* ===== Spin Wheels ===== */
const wheelEl = $('#wheel'), resultEl = $('#wheelResult');
const entryInput = $('#entryInput'), addEntryBtn = $('#addEntry'), entriesList = $('#entriesList');
const spinBtn = $('#spinBtn'), pickAgainBtn = $('#pickAgain'), shuffleBtn = $('#shuffleEntries');
const wheelSelect = $('#wheelSelect'), addWheelBtn = $('#addWheel');
const savePresetBtn = $('#saveWheelPreset'), loadPresetBtn = $('#loadWheelPreset');

const wheels = store.get('wheels', {
  Games:['Mario Kart','Stardew','Overcooked','Apex','Minecraft'],
  Movies:['Rom-Com','Action','Sci-Fi','Animated','Mystery']
});
let currentWheel = 'Games', spinning=false;

function renderEntries(){
  const arr = wheels[currentWheel] ?? [];
  entriesList.innerHTML = '';
  arr.forEach((name, i) => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between gap-2 bg-white rounded-xl border px-3 py-2';
    li.innerHTML = `<span class="truncate">${name}</span>
    <div class="flex gap-1">
      <button class="px-2 py-1 rounded-lg border bg-white text-xs">Edit</button>
      <button class="px-2 py-1 rounded-lg border bg-white text-xs">Remove</button>
    </div>`;
    const [editBtn, delBtn] = li.querySelectorAll('button');
    editBtn.addEventListener('click', ()=>{ const v=prompt('Edit entry:',name); if(v&&v.trim()){ arr[i]=v.trim(); store.set('wheels', wheels); renderEntries(); }});
    delBtn.addEventListener('click', ()=>{ arr.splice(i,1); store.set('wheels', wheels); renderEntries(); });
    entriesList.appendChild(li);
  });
}
function spinWheel(){
  if (spinning) return;
  const arr = wheels[currentWheel] ?? [];
  if (!arr.length) { alert('Add entries first!'); return; }
  spinning=true;
  const choice = arr[Math.floor(Math.random()*arr.length)];
  const turns = 360*(4+Math.floor(Math.random()*2)) + Math.floor(Math.random()*360);
  wheelEl.style.transform = `rotate(${turns}deg)`;
  setTimeout(()=>{ resultEl.textContent = `Result: ${choice}`; confetti.burst(); spinning=false; }, 4200);
}
addEntryBtn.addEventListener('click',()=>{ const v=entryInput.value.trim(); if(!v) return; wheels[currentWheel]=wheels[currentWheel]||[]; wheels[currentWheel].push(v); store.set('wheels',wheels); entryInput.value=''; renderEntries(); });
entryInput.addEventListener('keydown',e=>{ if(e.key==='Enter') addEntryBtn.click(); });
spinBtn.addEventListener('click',spinWheel);
pickAgainBtn.addEventListener('click',()=>{ resultEl.textContent=''; spinWheel(); });
shuffleBtn.addEventListener('click',()=>{ const a=wheels[currentWheel]||[]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } store.set('wheels',wheels); renderEntries(); });
wheelSelect.addEventListener('change',()=>{ currentWheel=wheelSelect.value; renderEntries(); });
addWheelBtn.addEventListener('click',()=>{ const name=prompt('New wheel name:'); if(!name) return; if(!wheels[name]) wheels[name]=[]; const opt=document.createElement('option'); opt.textContent=opt.value=name; wheelSelect.appendChild(opt); wheelSelect.value=name; currentWheel=name; store.set('wheels',wheels); renderEntries(); });
savePresetBtn.addEventListener('click',()=>{ const label=prompt('Save preset as:'); if(!label) return; const presets=store.get('wheel_presets',{}); presets[label]=wheels; store.set('wheel_presets',presets); alert('Saved!'); });
loadPresetBtn.addEventListener('click',()=>{ const presets=store.get('wheel_presets',{}); const keys=Object.keys(presets); if(!keys.length) return alert('No presets saved.'); const pick=prompt(`Load which preset?\n${keys.join(', ')}`); if(!pick||!presets[pick]) return; const loaded=JSON.parse(JSON.stringify(presets[pick])); Object.assign(wheels,loaded); // ensure options exist
  Object.keys(wheels).forEach(k=>{ if(![...wheelSelect.options].some(o=>o.value===k)){ const o=document.createElement('option'); o.value=o.textContent=k; wheelSelect.appendChild(o);} });
  currentWheel=Object.keys(wheels)[0]; wheelSelect.value=currentWheel; store.set('wheels',wheels); renderEntries();
});
renderEntries();

/* ===== Watch List ===== */
const wlAdd=$('#wlAdd'), wlExport=$('#wlExport'), wlImport=$('#wlImport');
const wlTitle=$('#wlTitle'), wlType=$('#wlType'), wlPlatform=$('#wlPlatform'), wlStatus=$('#wlStatus'), wlNotes=$('#wlNotes');
const watchListEl=$('#watchList');
const filterPlatform=$('#filterPlatform'), filterStatus=$('#filterStatus');
let watchList = store.get('watch_list', []);
function renderWatchList(){
  const fp=filterPlatform.value, fs=filterStatus.value;
  watchListEl.innerHTML='';
  watchList.filter(i => (!fp || i.platform===fp) && (!fs || i.status===fs)).forEach((item,idx)=>{
    const card=document.createElement('div'); card.className='glass rounded-2xl p-4 hover:shadow-soft transition';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <h4 class="font-semibold">${item.title} <span class="text-xs text-slate-500">(${item.type})</span></h4>
        <span class="text-xs px-2 py-1 rounded-full border bg-white">${item.status}</span>
      </div>
      <p class="text-sm text-slate-700 mt-1"><span class="text-slate-500">Platform:</span> ${item.platform||'-'}</p>
      ${item.notes?`<p class="text-sm text-slate-700 mt-1">${item.notes}</p>`:''}
      <div class="mt-3 flex gap-2">
        <button class="px-3 py-1.5 rounded-xl border bg-white text-xs">Toggle Finished</button>
        <button class="px-3 py-1.5 rounded-xl border bg-white text-xs">Delete</button>
      </div>`;
    const [toggle,del]=card.querySelectorAll('button');
    toggle.addEventListener('click',()=>{ item.status=item.status==='Finished'?'To Watch':'Finished'; store.set('watch_list',watchList); renderWatchList(); });
    del.addEventListener('click',()=>{ watchList.splice(idx,1); store.set('watch_list',watchList); renderWatchList(); });
    watchListEl.appendChild(card);
  });
}
wlAdd.addEventListener('click',()=>{
  const title=wlTitle.value.trim(); if(!title) return;
  watchList.push({ title, type:wlType.value, platform:wlPlatform.value.trim(), status:wlStatus.value, notes:wlNotes.value.trim() });
  store.set('watch_list',watchList); wlTitle.value=''; wlPlatform.value=''; wlNotes.value=''; wlType.value='Movie'; wlStatus.value='To Watch'; renderWatchList();
});
filterPlatform.addEventListener('change',renderWatchList);
filterStatus.addEventListener('change',renderWatchList);
wlExport.addEventListener('click',()=>{ const blob=new Blob([JSON.stringify(watchList)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='watchlist.json'; a.click(); });
wlImport.addEventListener('change', async e => { const f=e.target.files[0]; if(!f) return; try{ const data=JSON.parse(await f.text()); if(Array.isArray(data)){ watchList=data; store.set('watch_list',watchList); renderWatchList(); }}catch{ alert('Invalid JSON'); }});
renderWatchList();

/* ===== To-Do ===== */
const tdAdd=$('#tdAdd'), tdText=$('#tdText'), tdPriority=$('#tdPriority'), tdDue=$('#tdDue'), tdFilter=$('#tdFilter');
const todoListEl=$('#todoList');
let todos = store.get('todos', []);
function renderTodos(){
  const f=tdFilter.value; todoListEl.innerHTML='';
  todos.filter(t=>{ if(!f) return true; if(f==='open') return !t.done; if(f==='done') return t.done; return t.priority===f; })
  .forEach((t,i)=>{
    const li=document.createElement('li'); li.className='glass rounded-2xl p-4';
    li.innerHTML=`<div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <input type="checkbox" ${t.done?'checked':''} class="h-5 w-5 accent-emerald">
        <div>
          <div class="font-medium ${t.done?'line-through text-slate-500':''}">${t.text}</div>
          <div class="text-xs text-slate-500">Priority: ${t.priority}${t.due?` • Due: ${fmtDate(t.due)}`:''}</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="px-2 py-1 rounded-lg border bg-white text-xs">↑</button>
        <button class="px-2 py-1 rounded-lg border bg-white text-xs">↓</button>
        <button class="px-2 py-1 rounded-lg border bg-white text-xs">Delete</button>
      </div></div>`;
    const [cb]=li.querySelectorAll('input'); const [up,down,del]=li.querySelectorAll('button');
    cb.addEventListener('change',()=>{ t.done=cb.checked; store.set('todos',todos); renderTodos(); });
    up.addEventListener('click',()=>{ if(i>0){ const x=todos[i]; todos[i]=todos[i-1]; todos[i-1]=x; store.set('todos',todos); renderTodos(); }});
    down.addEventListener('click',()=>{ if(i<todos.length-1){ const x=todos[i]; todos[i]=todos[i+1]; todos[i+1]=x; store.set('todos',todos); renderTodos(); }});
    del.addEventListener('click',()=>{ todos.splice(i,1); store.set('todos',todos); renderTodos(); });
    todoListEl.appendChild(li);
  });
}
tdAdd.addEventListener('click',()=>{ const text=tdText.value.trim(); if(!text) return; todos.push({text, priority:tdPriority.value, due:tdDue.value||null, done:false}); store.set('todos',todos); tdText.value=''; tdDue.value=''; tdPriority.value='Med'; renderTodos(); });
tdFilter.addEventListener('change',renderTodos);
renderTodos();

/* ===== Memories ===== */
const memTitle=$('#memTitle'), memTags=$('#memTags'), memFile=$('#memFile'), memAdd=$('#memAdd');
const memExport=$('#memExport'), memImport=$('#memImport');
const memGrid=$('#memGrid'), memModal=$('#memModal'), memModalContent=$('#memModalContent'), memClose=$('#memClose');
const memTagFilter=$('#memTagFilter'), memDateFilter=$('#memDateFilter');
let memories = store.get('memories', []);
function thumbFor(m){ if(m.type?.startsWith('image')) return `<img src="${m.da
