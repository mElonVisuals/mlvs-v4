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

  function applyMetrics(d){
    for (const [k,v] of Object.entries(d)){
      const el = document.querySelector(`[data-metric="${k}"]`); if (el && v!=null) el.textContent = typeof v==='number'? v.toLocaleString(): v;
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
        if (data?.system) {
          const latencyEl = document.querySelector('[data-metric="latency"]');
          if (latencyEl && data.status?.latencyMs) latencyEl.textContent = data.status.latencyMs;
        }
      });
    };
    document.head.appendChild(s);
  } catch {}
})();
