import '../assets/js/global.js';
const { storage, utils } = window.usTwo;
const KEY = 'todo.items';
let items = storage.get(KEY, []);

const el = { add: document.getElementById('add'), list: document.getElementById('list'), view: document.getElementById('view'), empty: document.getElementById('empty') };

el.add.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(el.add));
  items.unshift({ id: utils.uid(), title:data.title, prio:data.prio, due:data.due||null, done:false, created: Date.now() });
  storage.set(KEY, items); el.add.reset(); render();
});

function move(id, dir){
  const i = items.findIndex(x=>x.id===id); if(i<0) return;
  const j = i + (dir==='up'?-1:1);
  if(j<0 || j>=items.length) return; [items[i],items[j]]=[items[j],items[i]]; storage.set(KEY, items); render();
}

function render(){
  let list = [...items];
  const v = el.view.value; if(v==='Active') list=list.filter(i=>!i.done); if(v==='Done') list=list.filter(i=>i.done);
  el.list.innerHTML = list.map(i=>`
    <li class="p-3 rounded-3xl bg-white/5 border border-white/10">
      <div class="flex items-center justify-between gap-2">
        <label class="flex items-center gap-2">
          <input type="checkbox" ${i.done?'checked':''} data-toggle="${i.id}" />
          <span class="${i.done?'line-through opacity-60':''}">${i.title}</span>
        </label>
        <div class="flex items-center gap-2 text-xs text-off/70">
          <span class="px-2 py-1 rounded-full border border-white/20">${i.prio}</span>
          <span>${i.due || 'no due'}</span>
          <button class="pill" data-up="${i.id}">↑</button>
          <button class="pill" data-down="${i.id}">↓</button>
          <button class="pill" data-del="${i.id}">Delete</button>
        </div>
      </div>
    </li>`).join('');
  el.empty.classList.toggle('hidden', list.length>0);

  el.list.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ items = items.filter(x=>x.id!==b.dataset.del); storage.set(KEY, items); render(); });
  el.list.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>move(b.dataset.up,'up'));
  el.list.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>move(b.dataset.down,'down'));
  el.list.querySelectorAll('[data-toggle]').forEach(c=>c.onchange=()=>{ const it=items.find(x=>x.id===c.dataset.toggle); it.done=c.checked; storage.set(KEY, items); render(); });
}

el.view.addEventListener('change', render);
render();
console.log('[todo] ready');