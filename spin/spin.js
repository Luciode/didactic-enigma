import '../assets/js/global.js';
const { storage, utils, confetti } = window.usTwo;

const KEY = 'spin.wheels';
let wheels = storage.get(KEY, {
  Games: ['Mario Kart','Stardew Valley','It Takes Two','Overcooked','Fortnite','Apex'],
  Movies: ['La La Land','Inception','Spirited Away','Up','Coco','Interstellar']
});

const el = {
  pick: document.getElementById('wheelPick'),
  entries: document.getElementById('entries'),
  wheel: document.getElementById('wheel'),
  slices: document.getElementById('slices'),
  spin: document.getElementById('spin'),
  res: document.getElementById('result'),
  add: document.getElementById('addItem'),
  shuffle: document.getElementById('shuffle'),
  save: document.getElementById('saveWheel'),
  export: document.getElementById('exportWheel'),
  import: document.getElementById('importWheel'),
  dateNight: document.getElementById('dateNight')
};

function currentName(){ return el.pick.value; }
function items(){ return wheels[currentName()] ||= []; }

function renderList(){
  const arr = items();
  el.entries.innerHTML = arr.map((t,i)=>`
    <li class="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-2">
      <input data-i="${i}" class="input" value="${t}">
      <button class="pill" data-up="${i}">↑</button>
      <button class="pill" data-down="${i}">↓</button>
      <button class="pill" data-del="${i}">Delete</button>
    </li>`).join('');
  el.entries.querySelectorAll('input').forEach(inp=>inp.oninput=()=>{ arr[inp.dataset.i]=inp.value; save(); drawWheel(); });
  el.entries.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ arr.splice(+b.dataset.del,1); save(); renderList(); drawWheel(); });
  el.entries.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.up; if(i>0){ [arr[i-1],arr[i]]=[arr[i],arr[i-1]]; save(); renderList(); drawWheel(); }});
  el.entries.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.down; if(i<arr.length-1){ [arr[i+1],arr[i]]=[arr[i],arr[i+1]]; save(); renderList(); drawWheel(); }});
}

function drawWheel(){
  const arr = items();
  const n = Math.max(1, arr.length);
  el.slices.innerHTML = '';
  for(let i=0;i<n;i++){
    const seg = document.createElement('div');
    seg.className='absolute inset-0 origin-center';
    const angle = 360/n; const rot = i*angle;
    seg.style.transform = `rotate(${rot}deg)`;
    seg.innerHTML = `<div style="position:absolute; left:50%; top:0; width:50%; height:50%; transform-origin:left top; transform:skewY(${90-angle}deg); background: ${i%2? '#CFFAEA66':'#19A97466'}; border-right:1px solid #ffffff30;"></div>
    <div style="position:absolute; inset:0; display:grid; place-items:center; transform: rotate(${angle/2}deg);"><span style="transform: rotate(-${rot+angle/2}deg); font-size:12px;">${arr[i]||'—'}</span></div>`;
    el.slices.appendChild(seg);
  }
  el.wheel.style.transition=''; el.wheel.style.transform='rotate(0deg)';
}

function spin(){
  const arr = items(); if(!arr.length) return alert('Add some entries first!');
  const n = arr.length; const angle = 360/n;
  const pick = Math.floor(Math.random()*n);
  const turns = 6; // full rotations
  const target = turns*360 + (360 - (pick*angle + angle/2));
  el.wheel.style.transition='transform 2.2s cubic-bezier(.2,.8,.2,1)';
  requestAnimationFrame(()=>{ el.wheel.style.transform = `rotate(${target}deg)`; });
  setTimeout(()=>{
    const choice = arr[pick];
    el.res.innerHTML = `<div class="font-display text-2xl">${choice} ${el.dateNight.checked? '— date night? 💕':''}</div>`;
    confetti();
  }, 2300);
}

function save(){ storage.set(KEY, wheels); }

// Events
el.pick.onchange = ()=>{ renderList(); drawWheel(); };
el.add.onclick = ()=>{ items().push('New'); save(); renderList(); drawWheel(); };
el.shuffle.onclick = ()=>{ wheels[currentName()] = items().sort(()=>Math.random()-0.5); save(); renderList(); drawWheel(); };
el.spin.onclick = spin;
el.save.onclick = ()=>{ save(); alert('Preset saved'); };
el.export.onclick = ()=>{ const blob = new Blob([JSON.stringify(wheels,null,2)],{type:'application/json'}); utils.download(blob,'wheels.json'); };
el.import.onchange = async (e)=>{ const f=e.target.files?.[0]; if(!f) return; try{ wheels = JSON.parse(await f.text()); save(); renderList(); drawWheel(); }catch{ alert('Invalid JSON'); }};

drawWheel();
renderList();
console.log('[spin] ready');