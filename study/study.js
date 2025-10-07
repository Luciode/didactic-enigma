import '../assets/js/global.js';
const { storage, utils } = window.usTwo;

const KEY = 'study.sets';
let sets = storage.get(KEY, []);
let current = { items: [], idx: 0, wrong: [], mode: 'flash', name: '' };

const el = {
  setName: document.getElementById('setName'),
  notes: document.getElementById('notes'),
  mode: document.getElementById('mode'),
  gen: document.getElementById('generate'),
  card: document.getElementById('card'),
  progress: document.getElementById('progress'),
  restart: document.getElementById('restart'),
  retryWrong: document.getElementById('retryWrong'),
  saved: document.getElementById('saved'),
  exportSet: document.getElementById('exportSet'),
  importSet: document.getElementById('importSet'),
};

function parseNotes(text){
  // Lines like "Term — Definition" or "Term - Definition" → [{q,a,exp}]
  const lines = text.split(/\n+/).map(l=>l.trim()).filter(Boolean);
  const pairs = lines.map(l=>{
    const m = l.split(/\s[-–—]\s|\s-\s|—|–/);
    const q = (m[0]||l).trim();
    const a = (m[1]||'');
    return { q, a: a.trim(), exp: a ? `${q}: ${a}` : q };
  });
  return pairs.length? pairs : [{q:'Add lines like "Osmosis — water diffusion"', a:'', exp:'Example format'}];
}

function renderCard(){
  const { items, idx, mode } = current;
  if(!items.length){ el.card.innerHTML = '<p class="text-off/70">No items. Generate a set above.</p>'; el.progress.textContent=''; return; }
  if(idx>=items.length){ el.card.innerHTML = '<div class="text-center"><p class="text-xl">All done! 💫</p></div>'; el.progress.textContent = `${items.length} of ${items.length}`; return; }
  const it = items[idx];
  el.progress.textContent = `${idx+1} of ${items.length}`;

  if(mode==='flash'){
    el.card.innerHTML = `
      <div class="grid gap-3">
        <div class="font-display text-xl">${it.q}</div>
        <button class="btn" id="reveal">Reveal</button>
        <div id="ans" class="hidden p-3 rounded-2xl bg-white/5 border border-white/10"></div>
        <div class="flex gap-2">
          <button class="btn" id="wrong">Wrong</button>
          <button class="btn" id="right">Correct</button>
        </div>
      </div>`;
    document.getElementById('reveal').onclick=()=>{
      const ans = document.getElementById('ans'); ans.textContent = it.a||'(no answer)'; ans.classList.remove('hidden');
    };
  } else if(mode==='mcq'){
    const opts = makeOptions(it.a);
    el.card.innerHTML = `
      <form class="grid gap-3" id="form">
        <div class="font-display text-xl">${it.q}</div>
        ${opts.map((o,i)=>`<label class="flex gap-2 items-center"><input required type="radio" name="opt" value="${o}"> <span>${o}</span></label>`).join('')}
        <button class="btn">Submit</button>
        <div id="fb" class="text-sm" aria-live="polite"></div>
      </form>`;
    document.getElementById('form').onsubmit=(e)=>{
      e.preventDefault();
      const val = new FormData(e.target).get('opt');
      if(val===it.a){ next(true, `${it.a} — Correct!`); }
      else { next(false, `Correct: ${it.a}. ${it.exp||''}`); }
    };
  } else { // written
    el.card.innerHTML = `
      <form class="grid gap-3" id="form">
        <div class="font-display text-xl">${it.q}</div>
        <input class="input" name="w" autocomplete="off" placeholder="Type your answer" />
        <button class="btn">Check</button>
        <div id="fb" class="text-sm" aria-live="polite"></div>
      </form>`;
    document.getElementById('form').onsubmit=(e)=>{
      e.preventDefault();
      const got = new FormData(e.target).get('w')+'';
      const ok = fuzzyMatch(got, it.a);
      next(ok, ok? 'Correct!':'Correct: '+it.a+ (it.exp?` — ${it.exp}`:''));
    };
  }
  // buttons for flash
  const wrong = document.getElementById('wrong');
  const right = document.getElementById('right');
  wrong && (wrong.onclick=()=>next(false, `Correct: ${it.a}. ${it.exp||''}`));
  right && (right.onclick=()=>next(true, 'Correct!'));
}

function next(correct, msg){
  const fb = document.getElementById('fb') || document.createElement('div');
  if(fb){ fb.textContent = msg; fb.className = 'text-sm text-mint/90'; }
  if(!correct) current.wrong.push(current.items[current.idx]);
  current.idx++;
  setTimeout(renderCard, 350);
}

function fuzzyMatch(input, answer){
  const a = (answer||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').trim();
  const b = (input||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').trim();
  if(!a) return false;
  if(a===b) return true;
  // partial credit: at least half of keywords
  const ak = a.split(/\s+/).filter(w=>w.length>2);
  const hits = ak.filter(w=>b.includes(w)).length;
  return hits >= Math.max(1, Math.ceil(ak.length/2));
}

function makeOptions(correct){
  // Build 4 options: correct + 3 distractors from other answers
  const pool = current.items.map(x=>x.a).filter(x=>x && x!==correct);
  const shuffled = pool.sort(()=>Math.random()-0.5).slice(0,3);
  const opts = [correct, ...shuffled].sort(()=>Math.random()-0.5);
  return opts;
}

function generate(){
  const name = el.setName.value.trim() || `Set-${utils.uid()}`;
  const items = parseNotes(el.notes.value);
  const mode = el.mode.value;
  current = { items, idx:0, wrong:[], mode, name };
  saveSet({ name, items, created: Date.now() });
  renderSaved();
  renderCard();
}

function saveSet(s){
  const idx = sets.findIndex(x=>x.name===s.name);
  if(idx>-1) sets[idx]=s; else sets.unshift(s);
  storage.set(KEY, sets);
}

function renderSaved(){
  el.saved.innerHTML = sets.map(s=>`
    <li class="flex items-center justify-between gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
      <div>
        <div class="font-semibold">${s.name}</div>
        <div class="text-xs text-off/60">${new Date(s.created).toLocaleString()}</div>
      </div>
      <div class="flex gap-2">
        <button class="pill" data-play="${s.name}">Play</button>
        <button class="pill" data-del="${s.name}">Delete</button>
      </div>
    </li>`).join('');
  el.saved.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{
    const s = sets.find(x=>x.name===b.dataset.play); if(!s) return;
    current = { items: s.items, idx:0, wrong:[], mode: el.mode.value, name: s.name };
    renderCard();
  });
  el.saved.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    sets = sets.filter(x=>x.name!==b.dataset.del); storage.set(KEY, sets); renderSaved();
  });
}

el.gen.addEventListener('click', generate);

el.restart.addEventListener('click', ()=>{ current.idx=0; current.wrong=[]; renderCard(); });

el.retryWrong.addEventListener('click', ()=>{ if(!current.wrong.length) return alert('No incorrect items to retry.'); current.items = current.wrong; current.idx=0; current.wrong=[]; renderCard(); });

el.exportSet.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify({name: current.name || 'set', items: current.items}, null, 2)], {type:'application/json'});
  window.usTwo.utils.download(blob, `${(current.name||'set')}.json`);
});

el.importSet.addEventListener('change', async (e)=>{
  const f = e.target.files?.[0]; if(!f) return;
  try { const text = await f.text(); const data = JSON.parse(text); if(Array.isArray(data.items)){ saveSet({ name: data.name||'Imported', items: data.items, created: Date.now() }); renderSaved(); }
  } catch { alert('Invalid JSON'); }
});

renderSaved();
renderCard();
console.log('[study] ready');