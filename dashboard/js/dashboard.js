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

  async function fetchStatus(){
    try { const r = await fetch('/api/status'); if (!r.ok) return; const d = await r.json(); applyMetrics(d);} catch {}
  }
  function applyMetrics(d){
    for (const [k,v] of Object.entries(d)){
      const el = document.querySelector(`[data-metric="${k}"]`); if (el && v!=null) el.textContent = typeof v==='number'? v.toLocaleString(): v;
    }
  }
  fetchStatus();
  setInterval(fetchStatus, 15000);
})();
