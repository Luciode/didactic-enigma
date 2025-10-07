import '../assets/js/global.js';
const { storage, utils } = window.usTwo;
const KEY = 'watch.items';
let items = storage.get(KEY, []);

const el = {
  add: document.getElementById('add'),
  list: document.getElementById('list'),
  filter: document.getElementById('filter'),
  platform: document.getElementById('platform'),
  sort: document.getElementById('sort'),
};

el.add.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(el.add));
  const item = { id: utils.uid(), title:data.title, type:data.type, platform:data.platform||'', notes:data.notes||'', status:'To Watch', added: Date.now(), watchedTogether: null };
  items.unshift(item); storage.set(KEY, items); el.add.reset(); render();
});

function render(){
  // platforms
  const plats = Array.from(new Set(['all', ...items.map(i=>i.platform).filter(Boolean)]));
  el.platform.innerHTML = plats.map(p=>`<option value="${p}">${p==='all'?'All Platforms':p}</option>`).join('');

  let list = [...items];
  if(el.filter.value!=='all') list = list.filter(i=>i.status===el.filter.value);
  if(el.platform.value!=='all') list = list.filter(i=>i.platform===el.platform.value);
  if(el.sort.value==='title') list.sort((a,b)=>a.title.localeCompare(b.title)); else list.sort((a,b)=>b.added-a.added);

  el.list.innerHTML = list.map(i=>`
    <li class="p-3 rounded-3xl bg-white/5 border border-white/10">
      <div class="flex flex-wrap gap-2 items-center justify-between">
        <div>
          <div class="font-semibold">${i.title} <span class="text-xs text-off/60">(${i.type})</span></div>
          <div class="text-xs text-off/60">${i.platform || '—'} · ${i.status}${i.watchedTogether? ` · Watched together on ${i.watchedTogether}`:''}</div>
          ${i.notes? `<div class="text-sm mt-1">${i.notes}</div>`:''}
        </div>
        <div class="flex flex-wrap gap-2">
          <select data-status="${i.id}" class="input w-auto"><option${i.status==='To Watch'?' selected':''}>To Watch</option><option${i.status==='Watching'?' selected':''}>Watching</option><option${i.status==='Finished'?' selected':''}>Finished</option></select>
          <button class="pill" data-together="${i.id}">Watched Together</button>
          <button class="pill" data-del="${i.id}">Delete</button>
        </div>
      </div>
    </li>`).join('');

  el.list.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ items = items.filter(x=>x.id!==b.dataset.del); storage.set(KEY, items); render(); });
  el.list.querySelectorAll('[data-together]').forEach(b=>b.onclick=()=>{ const it=items.find(x=>x.id===b.dataset.together); it.watchedTogether = utils.fmtDate(); storage.set(KEY, items); render(); });
  el.list.querySelectorAll('[data-status]').forEach(s=>s.onchange=()=>{ const it=items.find(x=>x.id===s.dataset.status); it.status = s.value; storage.set(KEY, items); render(); });
}

['change'].forEach(ev=>{ el.filter.addEventListener(ev, render); el.platform.addEventListener(ev, render); el.sort.addEventListener(ev, render); });

render();
console.log('[watchlist] ready');