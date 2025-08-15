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

  // Live metrics via Socket.IO
  try {
    const s = document.createElement('script');
    s.src = '/socket.io/socket.io.js';
    s.onload = () => {
      const socket = io();
      socket.on('metrics', (data)=>{
        if (data?.status) applyMetrics(data.status);
        if (data?.system) applyMetrics(data.system);
      });
    };
    document.head.appendChild(s);
  } catch {}
})();
