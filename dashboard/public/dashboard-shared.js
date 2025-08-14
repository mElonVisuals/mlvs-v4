// Shared helpers for Activity / System / Commands pages
;(function(global){
  const ICONS = global.ICONS || {};
  function injectIcons(root=document){
    root.querySelectorAll('.ui-icon[data-icon]').forEach(el=>{ const k=el.dataset.icon; if(ICONS[k]) el.innerHTML = ICONS[k]; });
  }
  function formatDuration(ms){
    const s=Math.floor(ms/1000), m=Math.floor(s/60), h=Math.floor(m/60), d=Math.floor(h/24);
    if(d) return d+'d '+(h%24)+'h'; if(h) return h+'h '+(m%60)+'m'; if(m) return m+'m '+(s%60)+'s'; return s+'s';
  }
  function relativeTime(ts){
    const diff=Date.now() - (ts instanceof Date?ts.getTime():ts);
    const s=Math.floor(diff/1000); if(s<60) return 'Just now'; const m=Math.floor(s/60); if(m<60) return m+'m'; const h=Math.floor(m/60); if(h<24) return h+'h'; const d=Math.floor(h/24); return d+'d';
  }
  function createBadge(text,type=''){ const span=document.createElement('span'); span.className='badge'+(type?` ${type}`:''); span.textContent=text; return span; }
  global.DBoardShared = { injectIcons, formatDuration, relativeTime, createBadge };
  document.addEventListener('DOMContentLoaded', ()=> injectIcons());
})(window);
