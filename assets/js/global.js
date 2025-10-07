// global.js — shared helpers (storage, modal, export/import, utils, confetti)
(function(){
  const usTwo = window.usTwo ||= {};
  const storagePrefix = 'us.two::';

  // Basic storage wrapper
  const storage = {
    ok: (function(){ try{ localStorage.setItem('__t','1'); localStorage.removeItem('__t'); return true; } catch { return false } })(),
    get(key, fallback){ if(!this.ok) return fallback; const raw = localStorage.getItem(storagePrefix+key); return raw ? JSON.parse(raw) : fallback; },
    set(key, val){ if(!this.ok) return; localStorage.setItem(storagePrefix+key, JSON.stringify(val)); },
    remove(key){ if(!this.ok) return; localStorage.removeItem(storagePrefix+key); },
    exportAll(){ const out = {}; for (let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if(k && k.startsWith(storagePrefix)){ out[k.replace(storagePrefix,'')] = JSON.parse(localStorage.getItem(k)); } } return out; },
    importAll(obj){ for(const [k,v] of Object.entries(obj||{})) localStorage.setItem(storagePrefix+k, JSON.stringify(v)); },
  };

  // Utils
  const utils = {
    uid: () => Math.random().toString(36).slice(2,10),
    qs: (s, r=document)=>r.querySelector(s),
    qsa: (s,r=document)=>Array.from(r.querySelectorAll(s)),
    download: (blob, filename) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); },
    fmtDate: (d=new Date()) => new Date(d).toISOString().slice(0,10),
  };

  // Simple modal manager (trap focus)
  const modal = {
    get(id){
      const el = document.getElementById(id);
      if(!el) return null;
      if(el._wired) return el._api;
      const panel = el.querySelector('.modal-panel');
      const focusable = () => panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const api = {
        open(){ el.classList.remove('hidden'); const first = focusable()[0]; first?.focus(); document.body.style.overflow='hidden'; },
        close(){ el.classList.add('hidden'); document.body.style.overflow=''; }
      };
      el.addEventListener('click', (e)=>{ if(e.target===el || e.target.matches('[data-close]')) api.close(); });
      el.addEventListener('keydown', (e)=>{ if(e.key==='Escape') api.close(); if(e.key==='Tab'){ const f=Array.from(focusable()); if(!f.length) return; const i=f.indexOf(document.activeElement); if(e.shiftKey){ if(i<=0){ f.at(-1).focus(); e.preventDefault(); } } else { if(i===f.length-1){ f[0].focus(); e.preventDefault(); } } }});
      el._wired = true; el._api = api; return api;
    }
  };

  // Tiny confetti (canvas-less)
  function confettiBurst(where=document.body, count=80){
    const root = document.createElement('div');
    root.style.position='fixed'; root.style.inset='0'; root.style.pointerEvents='none';
    for(let i=0;i<count;i++){
      const p=document.createElement('div'); p.style.position='absolute'; p.style.width='6px'; p.style.height='10px';
      p.style.left=Math.random()*100+'%'; p.style.top='-10px';
      p.style.background=['#FFD8E5','#CFFAEA','#19A974','#F7F9FB'][i%4];
      p.style.transform=`rotate(${Math.random()*360}deg)`;
      p.style.borderRadius='2px';
      p.animate([
        { transform:`translateY(-10px) rotate(0deg)` , opacity:1},
        { transform:`translateY(${window.innerHeight+20}px) rotate(360deg)`, opacity:0.9}
      ], { duration: 1200 + Math.random()*900, easing:'cubic-bezier(.2,.6,.2,1)', delay: Math.random()*200});
      root.appendChild(p);
    }
    document.body.appendChild(root);
    setTimeout(()=>root.remove(), 2300);
  }

  // Settings (initials, density, sparkles)
  const settings = storage.get('settings', { initialsLeft:'R', initialsRight:'A', density:'cozy', sparkles:true });
  function applySettings(){ document.documentElement.dataset.density=settings.density; }
  applySettings();

  // Expose
  usTwo.storage = storage;
  usTwo.utils = utils;
  usTwo.modal = modal;
  usTwo.confetti = confettiBurst;
  usTwo.settings = settings;

  // Wire settings modal fields if present
  window.addEventListener('DOMContentLoaded', () => {
    const modalApi = modal.get('settingsModal');
    const L = utils.qs('#initialsLeft');
    const R = utils.qs('#initialsRight');
    const D = utils.qs('#density');
    const S = utils.qs('#sparkles');
    if(L&&R&&D&&S){ L.value=settings.initialsLeft; R.value=settings.initialsRight; D.value=settings.density; S.checked=!!settings.sparkles; }
    const save = utils.qs('#saveSettings');
    save?.addEventListener('click', () => {
      settings.initialsLeft = L.value||'R';
      settings.initialsRight = R.value||'A';
      settings.density = D.value;
      settings.sparkles = S.checked;
      storage.set('settings', settings); applySettings(); modalApi?.close(); location.reload();
    });
    // Replace initials chip if exists
    const chip = document.querySelector('header span.text-blush');
    if(chip) chip.textContent = `${settings.initialsLeft} ♥ ${settings.initialsRight}`;
  });
})();