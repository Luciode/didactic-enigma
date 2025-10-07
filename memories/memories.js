import '../assets/js/global.js';
const { storage, utils, modal } = window.usTwo;
const KEY = 'memories.items';
let items = storage.get(KEY, []);

const el = { add: document.getElementById('add'), grid: document.getElementById('grid'), filter: document.getElementById('filter'), exp: document.getElementById('export'), imp: document.getElementById('import') };
const view = modal.get('viewer');
const viewerBody = document.getElementById('viewerBody');

el.add.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(el.add);
  const file = fd.get('file');
  let dataUrl = null;
  if(file && file.size){ dataUrl = await fileToDataURL(file); }
  const item = { id: utils.uid(), title: fd.get('title'), tags: (fd.get('tags')||'').split(',').map(t=>t.trim()).filter(Boolean), dataUrl, type: file?.type||null, date: Date.now() };
  items.unshift(item); storage.set(KEY, items); el.add.reset(); render();
});

function fileToDataURL(file){ return new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(file); }); }

function render(){
  const tag = el.filter.value?.trim().toLowerCase();
  let list = tag? items.filter(i=>i.tags.some(t=>t.toLowerCase().includes(tag))) : items;
  el.grid.innerHTML = list.map(i=>`
    <li class="p-3 rounded-3xl bg-white/5 border border-white/10">
      <div class="flex items-center justify-between">
        <div>
          <div class="font-semibold">${i.title}</div>
          <div class="text-xs text-off/60">${new Date(i.date).toLocaleString()} · ${i.tags.join(', ')||'no tags'}</div>
        </div>
        <div class="flex gap-2">
          <button class="pill" data-open="${i.id}">Open</button>
          <button class="pill" data-del="${i.id}">Delete</button>
        </div>
      </div>
      <div class="mt-2 rounded-2xl overflow-hidden bg-black/20 aspect-video grid place-items-center">
        ${i.dataUrl? (i.type?.startsWith('video')? `<video src="${i.dataUrl}" class="w-full h-full object-cover"></video>` : `<img src="${i.dataUrl}" alt="${i.title}" class="w-full h-full object-cover"/>`) : '<span class="text-off/50">No preview</span>'}
      </div>
    </li>`).join('');
  el.grid.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ items = items.filter(x=>x.id!==b.dataset.del); storage.set(KEY, items); render(); });
  el.grid.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openItem(b.dataset.open));
}

function openItem(id){
  const i = items.find(x=>x.id===id); if(!i) return;
  viewerBody.innerHTML = i.type?.startsWith('video')? `<video controls src="${i.dataUrl}" class="w-full rounded-2xl"></video>` : `<img src="${i.dataUrl}" alt="${i.title}" class="w-full rounded-2xl"/>`;
  view.open();
}

el.filter.addEventListener('input', render);

el.exp.addEventListener('click', ()=>{ const meta = items.map(({dataUrl, ...m})=>m); const blob = new Blob([JSON.stringify({meta}, null, 2)], {type:'application/json'}); utils.download(blob, 'memories-meta.json'); });

el.imp.addEventListener('change', async (e)=>{ const f=e.target.files?.[0]; if(!f) return; try{ const {meta} = JSON.parse(await f.text()); if(Array.isArray(meta)){ // keep existing dataUrls
    const map = new Map(items.map(i=>[i.id,i]));
    const merged = meta.map(m=> ({...map.get(m.id), ...m})); items = merged; storage.set(KEY, items); render(); }
  }catch{ alert('Invalid JSON'); }});

render();
console.log('[memories] ready');