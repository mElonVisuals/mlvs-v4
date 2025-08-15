// Simple light/dark theme toggle applying data-theme attribute
(function(){
  const btn = document.getElementById('theme-toggle');
  if(!btn) return;
  const KEY='mlvs-theme';
  const apply = (mode)=>{ document.documentElement.setAttribute('data-theme', mode); localStorage.setItem(KEY, mode); btn.textContent = mode==='dark' ? '🌗 Light' : '🌘 Dark'; };
  const saved = localStorage.getItem(KEY) || 'dark';
  apply(saved);
  btn.addEventListener('click', ()=> apply(document.documentElement.getAttribute('data-theme')==='dark' ? 'light' : 'dark'));
})();
