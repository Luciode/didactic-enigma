/* ==========
   us.two() — App State & Utilities
   ========== */

// Colors / a11y helpers
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const fmtDate = (d) => new Date(d).toLocaleDateString();

// LocalStorage wrapper
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }
};

// Smooth reveal
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); });
}, { threshold: 0.1 });
$$('.reveal').forEach(el => io.observe(el));

// Year
$('#yr').textContent = new Date().getFullYear();

/* ==========
   Testimonials carousel (auto, pause on hover)
   ========== */
(() => {
  const track = $('#testiTrack');
  if (!track) return;
  let idx = 0, count = track.children.length;
  let paused = false;

  const update = () => {
    track.style.transform = `translateX(${-idx * 100}%)`;
  };

  const next = () => { if (!paused) { idx = (idx + 1) % count; update(); } };
  let t = setInterval(next, 4000);

  track.addEventListener('mouseenter', () => { paused = true; });
  track.addEventListener('mouseleave', () => { paused = false; });
})();

/* ==========
   Confetti (simple canvas)
   ========== */
const confetti = (() => {
  const canvas = $('#confettiCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, pieces = [], running = false;

  const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; };
  addEventListener('resize', resize, { passive: true });
  resize();

  const spawn = (n = 120) => {
    for (let i = 0; i < n; i++) {
      pieces.push({
        x: Math.random() * W,
        y: -20 - Math.random() * 100,
        s: 4 + Math.random() * 6,
        a: Math.random() * Math.PI * 2,
        v: 2 + Math.random() * 3,
        c: Math.random() < .5 ? '#19A974' : '#CFFAEA'
      });
    }
  };

  const step = () => {
    ctx.clearRect(0,0,W,H);
    pieces.forEach(p => {
      p.y += p.v;
      p.x += Math.sin(p.a += 0.05);
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.s, p.s);
    });
    pieces = pieces.filter(p => p.y < H + 10);
    if (pieces.length || running) requestAnimationFrame(step);
  };

  return {
    burst() {
      spawn();
      if (!running) { running = true; requestAnimationFrame(step); setTimeout(() => running = false, 1500); }
    }
  };
})();

/* ==========
   Sticky Nav — smooth anchor already via CSS; ensure focus for a11y
   ========== */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = $(id);
    if (!target) return;
    // defer focus after scroll
    setTimeout(() => target.setAttribute('tabindex','-1'), 0);
    setTimeout(() => target.focus?.(), 500);
  });
});

/* ==========
   Spin Wheels
   ========== */
const wheelEl = $('#wheel');
const resultEl = $('#wheelResult');
const entryInput = $('#entryInput');
const addEntryBtn = $('#addEntry');
const entriesList = $('#entriesList');
const spinBtn = $('#spinBtn');
const pickAgainBtn = $('#pickAgain');
const shuffleBtn = $('#shuffleEntries');
const wheelSelect = $('#wheelSelect');
const addWheelBtn = $('#addWheel');
const savePresetBtn = $('#saveWheelPreset');
const loadPresetBtn = $('#loadWheelPreset');

const defaultWheels = store.get('wheels', {
  Games: ['Mario Kart', 'Stardew', 'Overcooked', 'Apex', 'Minecraft'],
  Movies: ['Rom-Com', 'Action', 'Sci-Fi', 'Animated', 'Mystery']
});
let currentWheel = 'Games';
let spinning = false;

function renderEntries() {
  const arr = defaultWheels[currentWheel] ?? [];
  entriesList.innerHTML = '';
  arr.forEach((name, i) => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between gap-2 bg-white rounded-xl border px-3 py-2';
    li.innerHTML = `
      <span class="truncate">${name}</span>
      <div class="flex gap-2">
        <button class="px-2 py-1 rounded-lg border bg-white text-xs" aria-label="Edit">Edit</button>
        <button class="px-2 py-1 rounded-lg border bg-white text-xs" aria-label="Remove">Remove</button>
      </div>
    `;
    const [editBtn, delBtn] = li.querySelectorAll('button');
    editBtn.addEventListener('click', () => {
      const v = prompt('Edit entry:', name);
      if (v && v.trim()) { arr[i] = v.trim(); store.set('wheels', defaultWheels); renderEntries(); }
    });
    delBtn.addEventListener('click', () => {
      arr.splice(i,1); store.set('wheels', defaultWheels); renderEntries();
    });
    entriesList.appendChild(li);
  });
}

function spinWheel() {
  if (spinning) return;
  const arr = defaultWheels[currentWheel] ?? [];
  if (!arr.length) { alert('Add entries first!'); return; }
  spinning = true;
  const choice = arr[Math.floor(Math.random() * arr.length)];
  const turns = 360 * (4 + Math.floor(Math.random()*2)); // 4–5 turns
  const offset = Math.floor(Math.random() * 360);
  wheelEl.style.transform = `rotate(${turns + offset}deg)`;
  setTimeout(() => {
    resultEl.textContent = `Result: ${choice}`;
    confetti.burst();
    spinning = false;
  }, 4200);
}

addEntryBtn.addEventListener('click', () => {
  const v = entryInput.value.trim();
  if (!v) return;
  defaultWheels[currentWheel] = defaultWheels[currentWheel] || [];
  defaultWheels[currentWheel].push(v);
  store.set('wheels', defaultWheels);
  entryInput.value = '';
  renderEntries();
});
entryInput.addEventListener('keydown', e => { if (e.key === 'Enter') addEntryBtn.click(); });

spinBtn.addEventListener('click', spinWheel);
pickAgainBtn.addEventListener('click', () => { resultEl.textContent = ''; spinWheel(); });
shuffleBtn.addEventListener('click', () => {
  const arr = defaultWheels[currentWheel] ?? [];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  store.set('wheels', defaultWheels);
  renderEntries();
});

wheelSelect.addEventListener('change', () => { currentWheel = wheelSelect.value; renderEntries(); });
addWheelBtn.addEventListener('click', () => {
  const name = prompt('New wheel name:');
  if (!name) return;
  if (!defaultWheels[name]) defaultWheels[name] = [];
  const opt = document.createElement('option'); opt.textContent = name; wheelSelect.appendChild(opt);
  wheelSelect.value = name; currentWheel = name; store.set('wheels', defaultWheels); renderEntries();
});

savePresetBtn.addEventListener('click', () => {
  const label = prompt('Save preset as:');
  if (!label) return;
  const presets = store.get('wheel_presets', {});
  presets[label] = defaultWheels;
  store.set('wheel_presets', presets);
  alert('Saved!');
});

loadPresetBtn.addEventListener('click', () => {
  const presets = store.get('wheel_presets', {});
  const keys = Object.keys(presets);
  if (!keys.length) { alert('No presets saved.'); return; }
  const name = prompt(`Load which preset?\n${keys.join(', ')}`);
  if (!name || !presets[name]) return;
  const loaded = JSON.parse(JSON.stringify(presets[name]));
  Object.keys(loaded).forEach(k => { if (!wheelSelect.querySelector(`option[value="${k}"]`)) {
    const opt = document.createElement('option'); opt.value = opt.textContent = k; wheelSelect.appendChild(opt);
  }});
  Object.assign(defaultWheels, loaded);
  currentWheel = Object.keys(defaultWheels)[0];
  wheelSelect.value = currentWheel;
  store.set('wheels', defaultWheels);
  renderEntries();
});

renderEntries();

/* ==========
   Watch List
   ========== */
const wlAdd = $('#wlAdd'), wlExport = $('#wlExport'), wlImport = $('#wlImport');
const wlTitle = $('#wlTitle'), wlType = $('#wlType'), wlPlatform = $('#wlPlatform'), wlStatus = $('#wlStatus'), wlNotes = $('#wlNotes');
const watchListEl = $('#watchList');
const filterPlatform = $('#filterPlatform'), filterStatus = $('#filterStatus');

let watchList = store.get('watch_list', []);

function renderWatchList() {
  const fp = filterPlatform.value, fs = filterStatus.value;
  watchListEl.innerHTML = '';
  watchList
    .filter(i => (!fp || i.platform === fp) && (!fs || i.status === fs))
    .forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'glass rounded-2xl p-4 hover:shadow-soft hover:scale-[1.02] transition';
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <h4 class="font-semibold">${item.title} <span class="text-xs text-slate-500">(${item.type})</span></h4>
          <span class="text-xs px-2 py-1 rounded-full border bg-white">${item.status}</span>
        </div>
        <p class="text-sm text-slate-700 mt-1"><span class="text-slate-500">Platform:</span> ${item.platform || '-'}</p>
        ${item.notes ? `<p class="text-sm text-slate-700 mt-1">${item.notes}</p>` : ''}
        <div class="mt-3 flex gap-2">
          <button class="px-3 py-1.5 rounded-xl border bg-white text-xs">Toggle Finished</button>
          <button class="px-3 py-1.5 rounded-xl border bg-white text-xs">Delete</button>
        </div>
      `;
      const [toggleBtn, delBtn] = card.querySelectorAll('button');
      toggleBtn.addEventListener('click', () => {
        item.status = (item.status === 'Finished') ? 'To Watch' : 'Finished';
        store.set('watch_list', watchList); renderWatchList();
      });
      delBtn.addEventListener('click', () => {
        watchList.splice(idx,1); store.set('watch_list', watchList); renderWatchList();
      });
      watchListEl.appendChild(card);
    });
}
wlAdd.addEventListener('click', () => {
  const title = wlTitle.value.trim(); if (!title) return;
  watchList.push({
    title,
    type: wlType.value,
    platform: wlPlatform.value.trim(),
    status: wlStatus.value,
    notes: wlNotes.value.trim()
  });
  store.set('watch_list', watchList);
  wlTitle.value = wlPlatform.value = wlNotes.value = '';
  wlType.value = 'Movie'; wlStatus.value = 'To Watch';
  renderWatchList();
});
filterPlatform.addEventListener('change', renderWatchList);
filterStatus.addEventListener('change', renderWatchList);
wlExport.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(watchList)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'watchlist.json'; a.click();
});
wlImport.addEventListener('change', async (e) => {
  const file = e.target.files[0]; if (!file) return;
  const text = await file.text();
  try { const data = JSON.parse(text); if (Array.isArray(data)) { watchList = data; store.set('watch_list', watchList); renderWatchList(); } }
  catch { alert('Invalid JSON'); }
});
renderWatchList();

/* ==========
   To-Do
   ========== */
const tdAdd = $('#tdAdd'), tdText = $('#tdText'), tdPriority = $('#tdPriority'), tdDue = $('#tdDue'), tdFilter = $('#tdFilter');
const todoListEl = $('#todoList');
let todos = store.get('todos', []);

function renderTodos() {
  const f = tdFilter.value;
  todoListEl.innerHTML = '';
  todos
    .filter(t => {
      if (!f) return true;
      if (f === 'open') return !t.done;
      if (f === 'done') return t.done;
      return t.priority === f;
    })
    .forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'glass rounded-2xl p-4';
      li.innerHTML = `
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <input type="checkbox" ${t.done?'checked':''} class="h-5 w-5 accent-emerald">
            <div>
              <div class="font-medium ${t.done?'line-through text-slate-500':''}">${t.text}</div>
              <div class="text-xs text-slate-500">Priority: ${t.priority}${t.due?` • Due: ${fmtDate(t.due)}`:''}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="px-2 py-1 rounded-lg border bg-white text-xs" aria-label="Up">↑</button>
            <button class="px-2 py-1 rounded-lg border bg-white text-xs" aria-label="Down">↓</button>
            <button class="px-2 py-1 rounded-lg border bg-white text-xs" aria-label="Delete">Delete</button>
          </div>
        </div>
      `;
      const [cb] = li.querySelectorAll('input');
      const [upBtn, downBtn, delBtn] = li.querySelectorAll('button');
      cb.addEventListener('change', () => { t.done = cb.checked; store.set('todos', todos); renderTodos(); });
      upBtn.addEventListener('click', () => { if (i>0) { const x = todos[i]; todos[i]=todos[i-1]; todos[i-1]=x; store.set('todos', todos); renderTodos(); }});
      downBtn.addEventListener('click', () => { if (i<todos.length-1) { const x = todos[i]; todos[i]=todos[i+1]; todos[i+1]=x; store.set('todos', todos); renderTodos(); }});
      delBtn.addEventListener('click', () => { todos.splice(i,1); store.set('todos', todos); renderTodos(); });
      todoListEl.appendChild(li);
    });
}
tdAdd.addEventListener('click', () => {
  const text = tdText.value.trim(); if (!text) return;
  todos.push({ text, priority: tdPriority.value, due: tdDue.value || null, done: false });
  store.set('todos', todos);
  tdText.value=''; tdDue.value=''; tdPriority.value='Med';
  renderTodos();
});
tdFilter.addEventListener('change', renderTodos);
renderTodos();

/* ==========
   Memories
   ========== */
const memTitle = $('#memTitle'), memTags = $('#memTags'), memFile = $('#memFile'), memAdd = $('#memAdd');
const memExport = $('#memExport'), memImport = $('#memImport');
const memGrid = $('#memGrid'), memModal = $('#memModal'), memModalContent = $('#memModalContent'), memClose = $('#memClose');
const memTagFilter = $('#memTagFilter'), memDateFilter = $('#memDateFilter');

let memories = store.get('memories', []); // { id, title, tags[], date, type, dataURL? (optional), name }
function thumbFor(m) {
  if (m.type.startsWith('image')) return `<img src="${m.dataURL || ''}" alt="${m.title}" class="w-full h-44 object-cover rounded-xl">`;
  return `<div class="w-full h-44 rounded-xl bg-navy/80 text-white grid place-content-center">Video</div>`;
}
function renderMemories() {
  const tag = memTagFilter.value.trim().toLowerCase();
  const d = memDateFilter.value;
  memGrid.innerHTML = '';
  memories
    .filter(m => (!tag || m.tags.some(t => t.toLowerCase().includes(tag))) && (!d || m.date?.slice(0,10) === d))
    .forEach(m => {
      const card = document.createElement('div');
      card.className = 'glass rounded-2xl p-3 hover:shadow-soft hover:scale-[1.02] transition cursor-pointer';
      card.innerHTML = `
        ${thumbFor(m)}
        <div class="mt-2">
          <div class="font-medium">${m.title}</div>
          <div class="text-xs text-slate-600">${m.tags.join(', ') || '—'} • ${m.date ? fmtDate(m.date) : ''}</div>
        </div>
      `;
      card.addEventListener('click', () => openMem(m));
      memGrid.appendChild(card);
    });
}
function openMem(m) {
  memModalContent.innerHTML = `
    <div class="p-4">
      <h4 class="font-semibold mb-2">${m.title}</h4>
      <div class="mb-3 text-sm text-slate-600">${m.tags.join(', ') || '—'} • ${m.date ? fmtDate(m.date) : ''}</div>
      ${m.type.startsWith('image')
        ? `<img src="${m.dataURL || ''}" alt="${m.title}" class="w-full rounded-xl">`
        : `<video src="${m.dataURL || ''}" controls class="w-full rounded-xl"></video>`
      }
    </div>
  `;
  memModal.showModal();
}
memClose.addEventListener('click', () => memModal.close());

memAdd.addEventListener('click', async () => {
  const title = memTitle.value.trim(); if (!title) return;
  const tags = memTags.value.split(',').map(s => s.trim()).filter(Boolean);
  const file = memFile.files[0];
  let dataURL = '';
  let type = 'image/*';
  if (file) {
    type = file.type;
    // Optional: accept pasted data URLs if no file
    dataURL = await new Promise(res => {
      const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file);
    });
  } else {
    // allow metadata-only
  }
  const m = { id: crypto.randomUUID(), title, tags, date: new Date().toISOString(), type, dataURL, name: file?.name || '' };
  memories.unshift(m); store.set('memories', memories); memTitle.value=''; memTags.value=''; memFile.value=''; renderMemories();
});

memTagFilter.addEventListener('input', renderMemories);
memDateFilter.addEventListener('change', renderMemories);

memExport.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(memories)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'memories.json'; a.click();
});
memImport.addEventListener('change', async (e) => {
  const file = e.target.files[0]; if (!file) return;
  const text = await file.text();
  try { const data = JSON.parse(text); if (Array.isArray(data)) { memories = data; store.set('memories', memories); renderMemories(); } }
  catch { alert('Invalid JSON'); }
});
renderMemories();

/* ==========
   Study — Practice
   ========== */
const notesInput = $('#notesInput'), modeSelect = $('#modeSelect'), genPractice = $('#genPractice');
const setName = $('#setName'), saveSet = $('#saveSet'), exportSet = $('#exportSet'), importSet = $('#importSet');
const practiceRunner = $('#practiceRunner'), qaCard = $('#qaCard'), nextBtn = $('#nextBtn'), progress = $('#progress');
const summaryPanel = $('#summaryPanel'), summaryList = $('#summaryList'), retryIncorrect = $('#retryIncorrect');
const switchModeFlash = $('#switchModeFlash'), switchModeMcq = $('#switchModeMcq'), switchModeWritten = $('#switchModeWritten');
const feedback = $('#feedback');

let currentSet = [];  // [{q,a,ex}]
let order = [];       // indices
let currentIdx = 0;
let mode = 'flash';
let incorrect = new Set();

function parseNotes(raw) {
  // Basic parsing:
  // - lines with ":" => Q: before, A: after
  // - bullet-like lines => turn into facts Q/A
  const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const qa = [];
  for (const line of lines) {
    if (line.includes(':')) {
      const [left, right] = line.split(':');
      const q = left.trim(); const a = right.trim();
      if (q && a) { qa.push({ q, a, ex: `From notes: ${line}` }); continue; }
    }
    // otherwise treat as fact "Term - detail" or single fact
    const m = line.match(/(.+?)\s*[-–]\s*(.+)/);
    if (m) {
      qa.push({ q: `What is ${m[1].trim()}?`, a: m[2].trim(), ex: `From notes: ${line}` });
    } else {
      // single fact: make definition-style
      qa.push({ q: `Recall: ${line}`, a: line, ex: `From notes: ${line}` });
    }
  }
  // de-dup
  const dedup = [];
  const seen = new Set();
  for (const item of qa) {
    const key = item.q + '|' + item.a;
    if (!seen.has(key)) { seen.add(key); dedup.push(item); }
  }
  return dedup;
}

function buildDistractors(answer, pool, k=3) {
  const candidates = pool.map(x => x.a).filter(a => a !== answer);
  // naive distractors: choose different answers, or split words
  const outs = [];
  while (outs.length < k && candidates.length) {
    const idx = Math.floor(Math.random() * candidates.length);
    outs.push(candidates.splice(idx,1)[0]);
  }
  while (outs.length < k) {
    const words = answer.split(/\s+/);
    outs.push(words.reverse().join(' '));
  }
  return outs;
}

function startPractice(set, m = modeSelect.value) {
  currentSet = set.length ? set : parseNotes(notesInput.value || '');
  if (!currentSet.length) { alert('Paste some notes first!'); return; }
  order = Array.from(currentSet.keys());
  // shuffle
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [order[i], order[j]] = [order[j], order[i]]; }
  currentIdx = 0;
  incorrect = new Set();
  mode = m;
  practiceRunner.classList.remove('hidden');
  summaryPanel.classList.add('hidden');
  renderQuestion();
}

function renderQuestion() {
  const i = order[currentIdx];
  const item = currentSet[i];
  progress.textContent = `${currentIdx + 1} of ${order.length}`;

  if (mode === 'flash') {
    qaCard.innerHTML = `
      <div class="space-y-3">
        <div class="font-semibold text-lg">${item.q}</div>
        <details class="rounded-xl border bg-off p-3">
          <summary class="cursor-pointer">Show answer</summary>
          <div class="mt-2">
            <div class="font-medium">${item.a}</div>
            <p class="text-sm text-slate-600 mt-1">${item.ex}</p>
          </div>
        </details>
      </div>
    `;
  } else if (mode === 'mcq') {
    const ds = buildDistractors(item.a, currentSet);
    const options = [...ds, item.a].sort(() => Math.random() - .5);
    qaCard.innerHTML = `
      <form id="mcqForm" class="space-y-3">
        <div class="font-semibold text-lg">${item.q}</div>
        ${options.map((o, idx) => `
          <label class="flex items-center gap-2 border rounded-xl p-2">
            <input type="radio" name="mcq" value="${o.replaceAll('"','&quot;')}">
            <span>${o}</span>
          </label>
        `).join('')}
        <button class="px-4 py-2 rounded-xl bg-emerald text-white">Submit</button>
      </form>
      <div id="mcqFeedback" class="mt-2 text-sm" aria-live="polite"></div>
    `;
    $('#mcqForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const sel = $('input[name="mcq"]:checked', e.target);
      if (!sel) return;
      const correct = sel.value === item.a;
      $('#mcqFeedback').innerHTML = correct
        ? `<span class="text-emerald font-semibold">Correct!</span> ${item.ex}`
        : `<span class="text-red-600 font-semibold">The right answer is:</span> ${item.a}<br><span class="text-slate-600">${item.ex}</span>`;
      feedback.textContent = correct ? 'Correct!' : 'Incorrect.';
      if (!correct) incorrect.add(i); else incorrect.delete(i);
    });
  } else if (mode === 'written') {
    qaCard.innerHTML = `
      <form id="wrForm" class="space-y-3">
        <div class="font-semibold text-lg">${item.q}</div>
        <input id="wrInput" class="border rounded-xl px-3 py-2 w-full" placeholder="Type your answer" />
        <button class="px-4 py-2 rounded-xl bg-emerald text-white">Check</button>
      </form>
      <div id="wrFeedback" class="mt-2 text-sm" aria-live="polite"></div>
    `;
    $('#wrForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const val = $('#wrInput').value.trim().toLowerCase();
      const ans = item.a.toLowerCase();
      // fuzzy: all keywords in answer must appear somewhere
      const keywords = ans.split(/\W+/).filter(w => w.length > 3);
      const ok = keywords.length ? keywords.every(k => val.includes(k)) : val === ans;
      $('#wrFeedback').innerHTML = ok
        ? `<span class="text-emerald font-semibold">Correct!</span> ${item.ex}`
        : `<span class="text-red-600 font-semibold">The right answer is:</span> ${item.a}<br><span class="text-slate-600">${item.ex}</span>`;
      feedback.textContent = ok ? 'Correct!' : 'Incorrect.';
      if (!ok) incorrect.add(i); else incorrect.delete(i);
    });
  }
}

nextBtn.addEventListener('click', () => {
  if (currentIdx < order.length - 1) {
    currentIdx++;
    renderQuestion();
  } else {
    // Summary
    practiceRunner.classList.add('hidden');
    summaryPanel.classList.remove('hidden');
    if (!incorrect.size) {
      summaryList.innerHTML = `<p class="text-emerald font-semibold">Perfect! All correct 🎉</p>`;
    } else {
      summaryList.innerHTML = `<p class="mb-2">Incorrect items:</p>` +
        Array.from(incorrect).map(i => `<div class="mb-2 p-3 rounded-xl border bg-white"><div class="font-medium">${currentSet[i].q}</div><div class="text-sm text-slate-600">Answer: ${currentSet[i].a}</div></div>`).join('');
    }
  }
});

$('#restartPractice').addEventListener('click', () => startPractice(currentSet, mode));
switchModeFlash.addEventListener('click', () => { mode='flash'; renderQuestion(); });
switchModeMcq.addEventListener('click', () => { mode='mcq'; renderQuestion(); });
switchModeWritten.addEventListener('click', () => { mode='written'; renderQuestion(); });

genPractice.addEventListener('click', () => startPractice(parseNotes(notesInput.value)));
saveSet.addEventListener('click', () => {
  const name = setName.value.trim() || `Set ${new Date().toLocaleString()}`;
  const data = parseNotes(notesInput.value);
  if (!data.length) { alert('Nothing to save—paste notes first.'); return; }
  const all = store.get('study_sets', {});
  all[name] = data; store.set('study_sets', all);
  alert('Saved!');
});
exportSet.addEventListener('click', () => {
  const data = parseNotes(notesInput.value);
  if (!data.length) { alert('Paste notes first!'); return; }
  const blob = new Blob([JSON.stringify(data)], { type:'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'study_set.json'; a.click();
});
importSet.addEventListener('change', async (e) => {
  const file = e.target.files[0]; if (!file) return;
  const text = await file.text();
  try { const data = JSON.parse(text); if (Array.isArray(data)) { startPractice(data); } else { alert('Invalid set.'); } }
  catch { alert('Invalid JSON'); }
});

/* ==========
   Email notes (local only)
   ========== */
$('#emailNoteForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#emailField').value.trim();
  const note = $('#emailNote').value.trim();
  const notes = store.get('email_notes', []);
  notes.push({ email, note, date: new Date().toISOString() });
  store.set('email_notes', notes);
  $('#emailNote').value = '';
  alert('Saved locally.');
});

