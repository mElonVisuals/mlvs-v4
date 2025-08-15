// Basic homepage interactions + public stats fetch
(function(){
  const nav = document.querySelector('.site-nav');
  const toggle = document.querySelector('.nav-toggle');
  toggle?.addEventListener('click', () => nav?.classList.toggle('open'));

  async function fetchPublic(){
    try {
      const res = await fetch('/api/status');
      if (!res.ok) return;
      const data = await res.json();
      updateStats(data);
    } catch {}
  }
  function updateStats(d){
    const map = { guilds:'guilds', users:'users' };
    Object.entries(map).forEach(([k, attr]) => {
      const el = document.querySelector(`[data-stat="${attr}"]`);
      if (el && d[k] != null) el.textContent = d[k].toLocaleString();
    });
  }
  fetchPublic();
  setInterval(fetchPublic, 20000);
})();
