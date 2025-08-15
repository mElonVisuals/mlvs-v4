// Minimal client-side router progressively enhancing dashboard links
(function(){
  const supportsPush = 'history' in window && !!history.pushState;
  if (!supportsPush) return;
  const rootPaths = ['/dashboard','/dashboard/activity','/dashboard/system','/dashboard/commands'];
  function sameOrigin(href){ try { const u=new URL(href,location.href); return u.origin===location.origin; } catch { return false; } }
  async function navigate(url, replace){
    if (!rootPaths.some(p=> url===p)) { window.location.href = url; return; }
    try {
      document.body.classList.add('route-loading');
      const r = await fetch(url, { headers: { 'X-Requested-With':'SPA', 'X-Correlation-Id': window.__corrId || '' } });
      if(!r.ok){ window.location.href = url; return; }
      const html = await r.text();
      // Extract main content only
      const temp = document.createElement('div'); temp.innerHTML = html;
      const mainNew = temp.querySelector('main.dash-content');
      const main = document.querySelector('main.dash-content');
      if(mainNew && main){ main.innerHTML = mainNew.innerHTML; window.scrollTo({ top:0 }); }
      if (replace) history.replaceState({ url }, '', url); else history.pushState({ url }, '', url);
      document.dispatchEvent(new CustomEvent('spa:navigated', { detail:{ url } }));
    } catch { window.location.href = url; }
    finally { document.body.classList.remove('route-loading'); }
  }
  document.addEventListener('click', e=>{
    const a = e.target.closest('a.nav-link');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!sameOrigin(href)) return;
    if(!rootPaths.includes(href)) return;
    e.preventDefault();
    navigate(href);
  });
  window.addEventListener('popstate', e=>{ const url = (e.state && e.state.url) || location.pathname; navigate(url, true); });
})();
