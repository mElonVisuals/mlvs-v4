// Lightweight client script: theme toggle, mobile menu, and command explorer filtering
(function(){
  // Single dark theme – no toggles

  // Mobile nav toggle
  const burger = document.getElementById('navBurger');
  const menu = document.getElementById('mobileMenu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.style.display === 'block';
      menu.style.display = open ? 'none' : 'block';
      menu.setAttribute('aria-hidden', String(open));
    });
    menu.addEventListener('click', (e) => { if (e.target === menu) menu.style.display = 'none'; });
  }

  // Navbar dropdown (kebab menu)
  const moreBtn = document.getElementById('navMore');
  const dd = document.getElementById('navDropdown');
  if (moreBtn && dd) {
    const close = () => { dd.style.display = 'none'; moreBtn.setAttribute('aria-expanded', 'false'); dd.setAttribute('aria-hidden','true'); };
    const open = () => { dd.style.display = 'block'; moreBtn.setAttribute('aria-expanded', 'true'); dd.setAttribute('aria-hidden','false'); };
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dd.style.display === 'block';
      if (isOpen) close(); else open();
    });
    document.addEventListener('click', (e) => {
      if (!dd.contains(e.target) && e.target !== moreBtn) close();
    });
  }

  // Collapsible left sidebar (homepage + dashboard)
  const shell = document.getElementById('homeShell') || document.querySelector('main.shell');
  const sideToggle = document.getElementById('sideToggle'); // legacy optional
  const sideOverlay = document.getElementById('sideOverlay') || (shell ? shell.querySelector('.side-overlay') : null);
  const sidebar = shell ? shell.querySelector('.sidebar') : null;
  function setSidebar(open){
    if (!shell || !sidebar) return;
    if (open) {
      shell.classList.add('sidebar-open');
      sidebar.setAttribute('aria-hidden','false');
      sideToggle?.setAttribute('aria-expanded','true');
      if (sideOverlay) sideOverlay.style.display = 'block';
    } else {
      shell.classList.remove('sidebar-open');
      sidebar.setAttribute('aria-hidden','true');
      sideToggle?.setAttribute('aria-expanded','false');
      if (sideOverlay) sideOverlay.style.display = 'none';
    }
  }
  if (sideToggle && shell && sidebar) {
    // Mobile: toggle off-canvas; Desktop: toggle hidden state
    sideToggle.addEventListener('click', () => {
      const isDesktop = window.matchMedia('(min-width: 860px)').matches;
      if (isDesktop) {
        // toggle sidebar hidden on desktop
        const hidden = shell.classList.contains('sidebar-hidden');
        if (hidden) {
          shell.classList.remove('sidebar-hidden');
        } else {
          shell.classList.add('sidebar-hidden');
        }
      } else {
        const isOpen = shell.classList.contains('sidebar-open');
        setSidebar(!isOpen);
      }
    });
  }
  if (sideOverlay) sideOverlay.addEventListener('click', () => setSidebar(false));
  // Close sidebar on ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shell?.classList.contains('sidebar-open')) setSidebar(false);
  });

  // Dashboard desktop sidebar toggle
  const dashToggle = document.getElementById('dashSideToggle');
  if (dashToggle && shell) {
    dashToggle.addEventListener('click', () => {
      const hidden = shell.classList.contains('sidebar-hidden');
      if (hidden) shell.classList.remove('sidebar-hidden');
      else shell.classList.add('sidebar-hidden');
    });
  }

  // Homepage sidebar toggle
  const homeToggle = document.getElementById('homeSideToggle');
  if (homeToggle && shell) {
    homeToggle.addEventListener('click', () => {
      const isDesktop = window.matchMedia('(min-width: 860px)').matches;
      if (isDesktop) {
        const hidden = shell.classList.contains('sidebar-hidden');
        if (hidden) shell.classList.remove('sidebar-hidden');
        else shell.classList.add('sidebar-hidden');
      } else {
        const isOpen = shell.classList.contains('sidebar-open');
        setSidebar(!isOpen);
      }
    });
  }

  // Dashboard live refresh (stats)
  const statusEl = document.getElementById('liveStatus');
  const kpiGuilds = document.getElementById('kpiGuilds');
  const kpiUsers = document.getElementById('kpiUsers');
  const statGuilds = document.getElementById('statGuilds');
  const statUsers = document.getElementById('statUsers');
  const statUpdated = document.getElementById('statUpdated');
  const refreshBtn = document.getElementById('refreshNow');
  const autoToggle = document.getElementById('autoRefreshToggle');
  const copyJsonBtn = document.getElementById('copyJson');
  const downloadJsonBtn = document.getElementById('downloadJson');
  const statLatency = document.getElementById('statLatency');
  const latencyPath = document.getElementById('latencyPath');
  const latencySpark = document.getElementById('latencySpark');
  const latencyPoints = [];
  async function fetchStatus() {
    try {
      const t0 = performance.now();
      const r = await fetch('/api/status', { cache: 'no-store' });
      const json = await r.json();
      const t1 = performance.now();
      const latency = Math.max(0, Math.round(t1 - t0));
      const online = !!json?.online;
      const guilds = json?.guilds ?? 0;
      const users = json?.users ?? 0;
      const updated = json?.updatedAt || new Date().toISOString();
      if (statusEl) {
        statusEl.textContent = online ? 'Online' : 'Offline';
        statusEl.classList.toggle('green', online);
        statusEl.classList.toggle('red', !online);
      }
      if (kpiGuilds) kpiGuilds.textContent = String(guilds);
      if (kpiUsers) kpiUsers.textContent = String(users);
      if (statGuilds) statGuilds.textContent = String(guilds);
      if (statUsers) statUsers.textContent = String(users);
      if (statUpdated) statUpdated.textContent = updated;
      if (statLatency) statLatency.textContent = `${latency} ms`;
      if (latencyPath && latencySpark) {
        // maintain last 30 points
        latencyPoints.push(latency);
        while (latencyPoints.length > 30) latencyPoints.shift();
        // normalize to 0..max
        const max = Math.max(60, ...latencyPoints);
        const w = 120, h = 36;
        const step = w / Math.max(1, latencyPoints.length - 1);
        const d = latencyPoints.map((v, i) => {
          const x = i * step;
          const y = h - (v / max) * h;
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ');
        latencyPath.setAttribute('d', d);
      }
      // stash last JSON for copy/download
      fetchStatus.last = json;
    } catch {}
  }
  if (refreshBtn) refreshBtn.addEventListener('click', fetchStatus);
  let rafInterval = null;
  function startAuto() { if (rafInterval) clearInterval(rafInterval); rafInterval = setInterval(fetchStatus, 15000); }
  function stopAuto() { if (rafInterval) { clearInterval(rafInterval); rafInterval = null; } }
  if (autoToggle) {
    autoToggle.addEventListener('change', () => { autoToggle.checked ? startAuto() : stopAuto(); });
    startAuto();
  }
  if (copyJsonBtn) {
    copyJsonBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(fetchStatus.last || {}, null, 2)); } catch {}
    });
  }
  if (downloadJsonBtn) {
    downloadJsonBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(fetchStatus.last || {}, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'status.json'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    });
  }

  // Command explorer search and chips
  const input = document.getElementById('cmdSearch');
  const chips = document.getElementById('cmdChips');
  const grid = document.getElementById('cmdGrid');
  if (grid) {
    let activeCat = null;
    const applyFilter = () => {
      const q = (input?.value || '').toLowerCase().trim();
      [...grid.children].forEach(card => {
        const name = card.dataset.name?.toLowerCase() || '';
        const desc = card.dataset.desc?.toLowerCase() || '';
        const cat = card.dataset.cat;
        const matchesText = !q || name.includes(q) || desc.includes(q);
        const matchesCat = !activeCat || cat === activeCat;
        card.style.display = matchesText && matchesCat ? '' : 'none';
      });
    };
    input?.addEventListener('input', applyFilter);
    chips?.addEventListener('click', (e) => {
      const el = e.target.closest('.chip');
      if (!el) return;
      if (activeCat === el.dataset.cat) { activeCat = null; el.classList.remove('active'); }
      else {
        activeCat = el.dataset.cat;
        [...chips.children].forEach(c => c.classList.remove('active'));
        el.classList.add('active');
      }
      applyFilter();
    });
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input?.focus(); }
    });
  }
})();
