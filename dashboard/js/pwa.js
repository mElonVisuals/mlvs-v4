// PWA registration & update flow
(function(){
  if (!('serviceWorker' in navigator)) return;
  const REG_PATH = '/public/sw.js';
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(REG_PATH, { scope: '/' });
      // Listen for updated workers
      if (reg.waiting) promptUpdate(reg.waiting);
      reg.addEventListener('updatefound', ()=>{
        const nw = reg.installing; if(!nw) return;
        nw.addEventListener('statechange', ()=>{
          if (nw.state==='installed' && navigator.serviceWorker.controller) {
            promptUpdate(nw);
          }
        });
      });
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', ()=>{ if(refreshing) return; refreshing=true; window.location.reload(); });
    } catch {}
  });
  function promptUpdate(sw){
    const bar = document.createElement('div');
    bar.className='update-bar';
    bar.innerHTML='<span>Update available</span> <button>Reload</button>';
    bar.querySelector('button').addEventListener('click', ()=> sw.postMessage({ type:'SKIP_WAITING' }));
    document.body.appendChild(bar);
  }
})();
