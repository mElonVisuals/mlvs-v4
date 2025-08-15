(function(){
  // Activate current nav
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(a=>{
    if (path === a.getAttribute('data-active-path')) a.classList.add('active');
  });
  // Sidebar toggle
  document.querySelector('.sidebar-toggle')?.addEventListener('click',()=>{
    document.querySelector('.sidebar')?.classList.toggle('open');
  });

  // Number animation helpers
  const activeTweens = new Map();
  function animateNumber(el, from, to, opts={}){
    if (from === to || typeof to !== 'number' || isNaN(to)) { el.textContent = to; return; }
    const duration = opts.duration || 650;
    const start = performance.now();
    const formatter = opts.formatter || (n=> n.toLocaleString());
    if (activeTweens.has(el)) cancelAnimationFrame(activeTweens.get(el));
    function frame(now){
      const t = Math.min(1, (now - start)/duration);
      // Ease (cubic out)
      const eased = (--t)*t*t + 1;
      const val = from + (to-from)*eased;
      el.textContent = formatter(Math.round(val));
      if (now - start < duration) {
        const raf = requestAnimationFrame(frame);
        activeTweens.set(el, raf);
      } else {
        el.textContent = formatter(to);
        activeTweens.delete(el);
      }
    }
    const raf = requestAnimationFrame(frame);
    activeTweens.set(el, raf);
  }
  function pulse(el, cls){
    if (!el) return;
    el.classList.remove('metric-change-up','metric-change-down','metric-pulse');
    void el.offsetWidth; // reflow to restart animation
    el.classList.add(cls);
    setTimeout(()=> el.classList.remove(cls), 1200);
  }
  const lastValues = {};
  function applyMetrics(d){
    for (const [k,vRaw] of Object.entries(d)){
      if (vRaw==null) continue;
      const el = document.querySelector(`[data-metric="${k}"]`);
      if (!el) continue;
      const isNumber = typeof vRaw === 'number';
      if (isNumber) {
        const prev = lastValues[k];
        const v = vRaw;
        if (typeof prev === 'number') {
          if (v !== prev) {
            animateNumber(el, prev, v);
            pulse(el, v > prev ? 'metric-change-up' : 'metric-change-down');
          }
        } else {
          el.textContent = v.toLocaleString();
        }
        lastValues[k] = v;
      } else {
        el.textContent = vRaw;
        lastValues[k] = vRaw;
      }
    }
  }
  // Initial fetch once for fast paint
  (async ()=>{ try { const r = await fetch('/api/status'); if(r.ok){ applyMetrics(await r.json()); } } catch {} })();
  // Initial activity fetch
  (async ()=>{ try { const r = await fetch('/api/activity'); if(r.ok){ renderActivity(await r.json()); } } catch {} })();

  // Live metrics via Socket.IO
  try {
    const s = document.createElement('script');
    s.src = '/socket.io/socket.io.js';
    s.onload = () => {
      const socket = io();
      socket.on('metrics', (data)=>{
        if (data?.status) applyMetrics(data.status);
        if (data?.system) {
          applyMetrics(data.system);
          updateSystemVisuals(data.system);
        }
      });
      socket.on('activity', (payload)=>{
        if (Array.isArray(payload) && payload.length) mergeActivity(payload);
      });
    };
    document.head.appendChild(s);
  } catch {}
  // System visuals (progress rings)
  function ensureRings(){
    if (document.querySelector('.sys-rings')) return;
    const panel = document.querySelector('.system-panel');
    if (!panel) return;
    const wrap = document.createElement('div');
    wrap.className = 'sys-rings';
    wrap.innerHTML = ['cpu','memory'].map(kind=>`
      <div class="ring" data-ring="${kind}">
        <svg viewBox="0 0 120 120" class="ring-svg">
          <circle cx="60" cy="60" r="54" class="ring-bg" />
          <circle cx="60" cy="60" r="54" class="ring-fg" stroke-dasharray="339.292" stroke-dashoffset="339.292" />
        </svg>
        <div class="ring-label">${kind.toUpperCase()}</div>
        <div class="ring-value" data-ring-value="${kind}">--</div>
      </div>`).join('');
    panel.appendChild(wrap);
    // ARIA for accessibility
    wrap.querySelectorAll('.ring').forEach(r=>{
      const name = r.getAttribute('data-ring');
      r.setAttribute('role','img');
      r.setAttribute('aria-label', name === 'cpu' ? 'CPU load ring' : 'Memory usage ring');
    });
  }
  ensureRings();
  function updateSystemVisuals(sys){
    ensureRings();
    const cpu = typeof sys.load1 === 'number' ? Math.min(1, sys.load1 / (navigator.hardwareConcurrency||4)) : 0;
    const memUsed = sys.memUsed || ( (sys.memTotal||0) - (sys.memFree||0) );
    const memTotal = sys.memTotal || (memUsed||1);
    const mem = memTotal ? memUsed / memTotal : 0;
    const fmtBytes = b => { if (!b || isNaN(b)) return '--'; const units=['B','KB','MB','GB','TB']; let u=0,val=b; while(val>=1024&&u<units.length-1){val/=1024;u++;} return `${val.toFixed(val>=100||u===0?0:1)} ${units[u]}`; };
    const memUsedEl = document.querySelector('[data-metric="memUsed"]'); if (memUsedEl) memUsedEl.textContent = fmtBytes(memUsed);
    const memTotalEl = document.querySelector('[data-metric="memTotal"]'); if (memTotalEl) memTotalEl.textContent = fmtBytes(memTotal);
    setRing('cpu', cpu, (cpu*100).toFixed(0)+'%');
    setRing('memory', mem, (mem*100).toFixed(0)+'%');
  }
  function setRing(name, frac, label){
    const el = document.querySelector(`[data-ring="${name}"] .ring-fg`);
    const valEl = document.querySelector(`[data-ring-value="${name}"]`);
    if (!el) return; const CIRC = 2*Math.PI*54; const target = CIRC * (1 - Math.max(0,Math.min(1,frac)));
    el.style.transition = 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)';
    requestAnimationFrame(()=>{ el.style.strokeDashoffset = target; });
    if (valEl) valEl.textContent = label;
  }

  // Reveal animations using IntersectionObserver
  const revealObserver = ('IntersectionObserver' in window) ? new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('revealed'); revealObserver.unobserve(e.target);} });
  }, { threshold:0.15 }) : null;
  document.querySelectorAll('.panel, .stat, .ring').forEach(el=>{ if(revealObserver) revealObserver.observe(el); });

  // Parallax tilt for cards
  function addTilt(el){
    const rect = ()=> el.getBoundingClientRect();
    el.addEventListener('mousemove', (ev)=>{
      const r = rect();
      const x = (ev.clientX - r.left)/r.width - 0.5;
      const y = (ev.clientY - r.top)/r.height - 0.5;
      el.style.transform = `perspective(800px) rotateX(${(-y*6).toFixed(2)}deg) rotateY(${(x*6).toFixed(2)}deg) translateY(-2px)`;
    });
    el.addEventListener('mouseleave', ()=>{ el.style.transform='perspective(800px) translateY(0)'; });
  }
  document.querySelectorAll('.stat, .panel').forEach(addTilt);
  // Accessibility focus support
  document.querySelectorAll('.stat, .panel').forEach(el=>{ el.tabIndex=0; el.addEventListener('focus', ()=> el.classList.add('focus-visible')); el.addEventListener('blur', ()=>{ el.classList.remove('focus-visible'); el.style.transform='perspective(800px) translateY(0)'; }); });

  // Activity feed handling
  const activityEl = document.getElementById('recent-activity');
  const activityCache = [];
  function renderActivity(list){
    if (!activityEl) return;
    activityEl.innerHTML='';
    list.forEach(ev=> { activityCache.push(ev); appendActivity(ev,true); });
  }
  function appendActivity(ev, appendEnd){
    const div = document.createElement('div');
    div.className='activity-item';
    const ts = new Date(ev.ts||Date.now()).toLocaleTimeString();
    div.textContent = `[${ts}] ${ev.message || ev.type}`;
    div.dataset.type = ev.type || 'unknown';
    if (appendEnd) activityEl.appendChild(div); else activityEl.prepend(div);
    while(activityEl.children.length > 150) activityEl.removeChild(activityEl.lastChild);
  }
  function mergeActivity(arr){
    if (!activityEl) return;
    arr.forEach(ev=> { activityCache.push(ev); appendActivity(ev,false); });
    applyActivityFilter(currentFilter);
  }

  // Activity filter chips
  let currentFilter = 'all';
  const filterBar = document.querySelector('.activity-filters');
  function applyActivityFilter(filter){
    currentFilter = filter;
    document.querySelectorAll('.activity-filters .chip').forEach(ch=> ch.classList.toggle('chip-active', ch.dataset.activityFilter === filter));
    if (!activityEl) return;
    const children = Array.from(activityEl.children);
    children.forEach(child => {
      const t = child.dataset.type || 'unknown';
      child.style.display = (filter==='all' || filter===t) ? '' : 'none';
    });
  }
  filterBar?.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-activity-filter]');
    if (!btn) return;
    applyActivityFilter(btn.dataset.activityFilter);
  });
  applyActivityFilter('all');
})();
