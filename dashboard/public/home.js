(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dot = document.getElementById('liveDot');
  if (dot){ const st = dot.getAttribute('data-state'); dot.style.background = st === 'Online' ? '#10b981' : '#ef4444'; }
  const heroStatus = document.getElementById('heroStatus');
  const heroGuilds = document.getElementById('heroGuilds');
  const heroUsers = document.getElementById('heroUsers');
  const heroLatency = document.getElementById('heroLatency');
  const heroMem = document.getElementById('heroMem');
  const heroCpu = document.getElementById('heroCpu');
  const heroMemBox = document.getElementById('heroMemBox');
  const heroCpuBox = document.getElementById('heroCpuBox');
  const spark = document.getElementById('heroLatencySpark');
  const refreshBtn = document.getElementById('heroRefresh');
  const errBox = document.getElementById('heroRefreshError');
  const latPoints = [];
  function drawSpark(){ if(!spark) return; const w=300,h=54; const max=Math.max(10,...latPoints,50); const step = latPoints.length>1? w/(latPoints.length-1):w; const d = latPoints.map((v,i)=>`${i?'L':'M'}${(i*step).toFixed(2)},${(h-(v/max)*h).toFixed(2)}`).join(' '); spark.innerHTML=`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" opacity="0.75"/>`; }
  async function pull(){
    try{
      errBox && (errBox.style.display='none');
      const [statusRes, metricsRes] = await Promise.all([
        fetch('/api/status',{cache:'no-store'}),
        fetch('/api/metrics',{cache:'no-store'})
      ]);
      const status = await statusRes.json();
      const metrics = await metricsRes.json();
      heroStatus && (heroStatus.textContent = status.online ? 'Online':'Offline');
      heroGuilds && (heroGuilds.textContent = status.guilds||0);
      heroUsers && (heroUsers.textContent = status.users||0);
      const lat = metrics.latencyMs||[]; const mem=metrics.memoryMB||[]; const cpu=metrics.cpu||[];
      if(lat.length){ const v=lat[lat.length-1]; latPoints.push(v); while(latPoints.length>80) latPoints.shift(); heroLatency && (heroLatency.textContent = v+' ms'); }
      if(mem.length){ const m = mem[mem.length-1]; heroMem && (heroMem.textContent=m+' MB'); heroMemBox && (heroMemBox.textContent=m+' MB'); }
      if(cpu.length){ const c = cpu[cpu.length-1]; heroCpu && (heroCpu.textContent=c+' %'); heroCpuBox && (heroCpuBox.textContent=c+' %'); }
      drawSpark();
    }catch(e){ if(errBox){ errBox.textContent='Refresh failed'; errBox.style.display='block'; } }
  }
  refreshBtn && refreshBtn.addEventListener('click', pull);
  pull(); if(!prefersReduced) setInterval(pull, 15000);

  // Horizontal drag scroll for module scroller
  const scroller = document.querySelector('.mod-scroller');
  if (scroller){
    let isDown=false,startX,scrollLeft; let lastVel=0, momentumId; const friction=0.95;
    function momentum(){ if(Math.abs(lastVel) < 0.5) return; scroller.scrollLeft -= lastVel; lastVel*=friction; momentumId=requestAnimationFrame(momentum); }
    scroller.addEventListener('mousedown', e=>{ isDown=true; scroller.classList.add('dragging'); startX=e.pageX - scroller.offsetLeft; scrollLeft=scroller.scrollLeft; cancelAnimationFrame(momentumId); });
    scroller.addEventListener('mouseleave', ()=>{ if(isDown){ isDown=false; scroller.classList.remove('dragging'); momentum(); }});
    scroller.addEventListener('mouseup', ()=>{ if(isDown){ isDown=false; scroller.classList.remove('dragging'); momentum(); }});
    scroller.addEventListener('mousemove', e=>{ if(!isDown) return; e.preventDefault(); const x=e.pageX - scroller.offsetLeft; const walk=(x-startX); scroller.scrollLeft = scrollLeft - walk; lastVel = walk; });
    scroller.addEventListener('wheel', e=>{ if(Math.abs(e.deltaY) > Math.abs(e.deltaX)) { scroller.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive:false });
    // Keyboard accessibility
    scroller.addEventListener('keydown', e=>{ if(e.key==='ArrowRight'){ scroller.scrollLeft += 60; e.preventDefault(); } else if(e.key==='ArrowLeft'){ scroller.scrollLeft -= 60; e.preventDefault(); } });
  }
})();
