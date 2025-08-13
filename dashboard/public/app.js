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
