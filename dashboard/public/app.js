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
  async function fetchStatus() {
    try {
      const r = await fetch('/api/status', { cache: 'no-store' });
      const json = await r.json();
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
