(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  // Sidebar interactivity
  const sidebar = $('#dashSidebar');
  const shell = $('#dashShell');
  const toggleBtn = $('#sidebarToggle');
  // Persist sidebar collapsed state
  const sideStateKey = 'dashSidebarCollapsed';
  function applySidebarState(){
    try { const collapsed = localStorage.getItem(sideStateKey)==='1'; sidebar?.classList.toggle('collapsed', collapsed); toggleBtn?.setAttribute('aria-expanded', collapsed? 'false':'true'); }catch{}
  }
  applySidebarState();
  toggleBtn?.addEventListener('click', ()=>{
    const will = !sidebar?.classList.contains('collapsed');
    sidebar?.classList.toggle('collapsed');
    try { localStorage.setItem(sideStateKey, will? '1':'0'); }catch{}
    toggleBtn?.setAttribute('aria-expanded', will? 'false':'true');
  });
  // Multipage layout now; anchor highlight logic removed.
  const tokenInput = $('#apiToken');
  const saveTokenBtn = $('#saveToken');
  const guildSelect = $('#guildSelect');
  const announceGuildInput = $('#announceForm')?.querySelector('[name="guildId"]');
  const store = {
    get token(){ try{ return localStorage.getItem('apiToken')||'' }catch{ return '' } },
    set token(v){ try{ localStorage.setItem('apiToken', v||'') }catch{} }
  };
  // persist selected guild
  Object.defineProperty(store, 'selectedGuild', {
    get(){ try{ return localStorage.getItem('selectedGuild')||'' }catch{ return '' } },
    set(v){ try{ localStorage.setItem('selectedGuild', v||'') }catch{} }
  });
  if (tokenInput) tokenInput.value = store.token;
  if (saveTokenBtn) saveTokenBtn.addEventListener('click', ()=>{ store.token = tokenInput.value; saveTokenBtn.textContent='Saved'; setTimeout(()=>saveTokenBtn.textContent='Save', 900); });

  async function jget(url){ const h={ 'cache':'no-store' }; return fetch(url,h).then(r=>r.json()); }
  async function jpost(url, body){
    const headers = { 'Content-Type':'application/json' };
    if (store.token) headers['Authorization'] = 'Bearer '+store.token;
    const r = await fetch(url, { method:'POST', headers, body: JSON.stringify(body||{}) });
    if (!r.ok) throw new Error('HTTP '+r.status); return r.json();
  }
  async function jpatch(url, body){
    const headers = { 'Content-Type':'application/json' };
    if (store.token) headers['Authorization'] = 'Bearer '+store.token;
    const r = await fetch(url, { method:'PATCH', headers, body: JSON.stringify(body||{}) });
    if (!r.ok) throw new Error('HTTP '+r.status); return r.json();
  }

  // Me + guilds
  let currentGuild = '';
  async function loadMeAndGuilds(){
    try{
      const r = await fetch('/api/me', { cache:'no-store' });
      if (!r.ok) return; const data = await r.json();
      const guilds = data?.user?.guilds || [];
      if (guildSelect && guilds.length){
        // clear existing except first "All guilds"
        [...guildSelect.querySelectorAll('option')].slice(1).forEach(o=>o.remove());
        for(const g of guilds){
          const opt = document.createElement('option'); opt.value = g.id; opt.textContent = g.name || g.id; guildSelect.appendChild(opt);
        }
        // restore persisted selection if applicable
        const persisted = store.selectedGuild;
        if (persisted && guilds.some(g=>g.id===persisted)){
          guildSelect.value = persisted;
          currentGuild = persisted;
        }
      }
    }catch{}
    // sync announce form with selection
    syncAnnounceGuild();
    // refresh lists with filtering
    refreshActions();
  }

  function syncAnnounceGuild(){
    if (!announceGuildInput) return;
    if (currentGuild){ announceGuildInput.value = currentGuild; }
    else if (!announceGuildInput.value){ announceGuildInput.placeholder = 'Guild ID'; }
  }

  guildSelect?.addEventListener('change', ()=>{
    currentGuild = guildSelect.value || '';
    store.selectedGuild = currentGuild;
    syncAnnounceGuild();
    refreshActions();
  });

  // Status + stats
  async function refreshStatus(){
    try{
      const s = await jget('/api/status');
      const online = !!s?.online; $('#d2Status')?.classList.toggle('green', online); $('#d2Status')?.classList.toggle('red', !online); $('#d2Status').textContent = online ? 'Online' : 'Offline';
      $('#d2Guilds').textContent = String(s?.guilds ?? 0);
      $('#d2Users').textContent = String(s?.users ?? 0);
      $('#d2Updated').textContent = s?.updatedAt || '—';
      $('#d2Bot').textContent = s?.bot?.tag || '—';
  ['d2Guilds','d2Users','d2Updated'].forEach(id=>{ const el = $('#'+id); if(el){ el.classList.add('flash-update'); setTimeout(()=>el.classList.remove('flash-update'),900); }});
    }catch{}
  }

  // Metrics
  const sLatency = $('#spLatency'), sMemory = $('#spMemory'), sCpu = $('#spCpu');
  function renderSpark(svg, arr){ if (!svg) return; const w=160,h=44; const max=Math.max(1, ...arr, 10); const step = arr.length>1 ? w/(arr.length-1) : w; const d = arr.map((v,i)=>`${i?'L':'M'}${(i*step).toFixed(2)},${(h-(v/max)*h).toFixed(2)}`).join(' '); svg.innerHTML = `<path d="${d}" fill="none" stroke="currentColor" opacity="0.7" stroke-width="2"/>`; }
  async function refreshMetrics(){
    try{
      const m = await jget('/api/metrics');
      const lat = m?.latencyMs || [], mem = m?.memoryMB || [], cpu = m?.cpu || [];
      $('#mLatency').textContent = lat.length? `${lat[lat.length-1]} ms` : '— ms';
      $('#mMemory').textContent = mem.length? `${mem[mem.length-1]} MB` : '— MB';
      $('#mCpu').textContent = cpu.length? `${cpu[cpu.length-1]} %` : '— %';
      renderSpark(sLatency, lat.slice(-80));
      renderSpark(sMemory, mem.slice(-80));
      renderSpark(sCpu, cpu.slice(-80));
  ['mLatency','mMemory','mCpu'].forEach(id=>{ const el = $('#'+id); if(el){ el.classList.add('flash-update'); setTimeout(()=>el.classList.remove('flash-update'),900); }});
    }catch{}
  }

  // Commands
  async function refreshCommands(){
    try{
      const data = await jget('/api/commands');
      const list = $('#cmdList'); if (!list) return; list.innerHTML='';
      const filter = ($('#cmdFilter')?.value || '').toLowerCase();
      const cmds = data?.commands || {}; const cats = Object.keys(cmds).sort();
      for(const c of cats){
        const group = document.createElement('div'); group.className='cmd-group';
        group.innerHTML = `<div class="cmd-cat">${c}</div>`;
        for(const item of cmds[c]){
          const name = item.name || ''; const desc = item.description || ''; if (filter && !(name.toLowerCase().includes(filter)||desc.toLowerCase().includes(filter))) continue;
          const row = document.createElement('div'); row.className='cmd-row';
          row.innerHTML = `<code>${name}</code><span class="muted">${desc}</span><button class="btn small copy">Copy usage</button>`;
          row.querySelector('.copy').addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(item.usage||name); }catch{} });
          group.appendChild(row);
        }
        list.appendChild(group);
      }
    }catch{}
  }
  $('#cmdFilter')?.addEventListener('input', refreshCommands);

  // Actions: presence + announcement (queued)
  $('#presenceForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault(); const fd = new FormData(e.target); const body = { status: fd.get('status'), activity: fd.get('activity') };
    try{ await jpost('/api/presence', body); e.target.reset(); }catch{}
  });
  $('#announceForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault(); const fd = new FormData(e.target); const body = { guildId: fd.get('guildId'), channelId: fd.get('channelId'), message: fd.get('message') };
  // fallback to selected guild if input empty
  if ((!body.guildId || String(body.guildId).trim()==='') && currentGuild){ body.guildId = currentGuild; }
    try{ await jpost('/api/actions/announce', body); e.target.reset(); }catch{}
  });

  // Activity
  async function refreshActivity(){
    try{
      const r = await jget('/api/activity'); const items = r?.items || []; const ul = $('#d2Activity'); ul.innerHTML='';
      for(const it of items.slice(-30).reverse()){
        const li = document.createElement('li'); li.className='act-item';
        li.innerHTML = `<span class="badge">${(it.type||'info').toUpperCase()}</span><span>${(it.message||'').toString().slice(0,200)}</span><time class="muted">${new Date(it.ts||Date.now()).toLocaleString()}</time>`;
        ul.appendChild(li);
      }
    }catch{}
  }

  // Controls
  $('#d2Refresh')?.addEventListener('click', ()=>{ refreshStatus(); refreshMetrics(); refreshCommands(); refreshActivity(); refreshActions(); });
  if ($('#d2Auto')){ setInterval(()=>{ if ($('#d2Auto').checked){ refreshStatus(); refreshMetrics(); refreshActivity(); } }, 15000); }

  // initial
  refreshStatus(); refreshMetrics(); refreshCommands(); refreshActivity();
  // derive command stats after first load
  (async()=>{ try { const data = await jget('/api/commands'); const cmds=data?.commands||{}; const groups=Object.keys(cmds); const total=groups.reduce((a,g)=>a+cmds[g].length,0); $('#cmdGroupCount')?.textContent=groups.length; $('#cmdTotalCount')?.textContent=total; }catch{} })();

  // Telemetry page logic
  async function refreshTelemetry(){
    const latSvg = $('#telLatency'), memSvg = $('#telMemory'), cpuSvg = $('#telCpu');
    try {
      const t = await jget('/api/telemetry');
      if (t.latency) {
        $('#telLatAvg')?.textContent = t.latency.avg ?? '—';
        $('#telLatP50')?.textContent = t.latency.p50 ?? '—';
        $('#telLatP95')?.textContent = t.latency.p95 ?? '—';
        $('#telLatP99')?.textContent = t.latency.p99 ?? '—';
        drawLine(latSvg, collectSeries(METRICS?.latencyMsCache||[],160,80));
      }
      if (t.memory) { $('#telMemAvg')?.textContent = t.memory.avg ?? '—'; }
      if (t.cpu) { $('#telCpuAvg')?.textContent = t.cpu.avg ?? '—'; }
      // build simple series from metrics endpoint for visuals
      try { const m = await jget('/api/metrics'); METRICS.latencyMsCache = m.latencyMs||[]; METRICS.memoryCache=m.memoryMB||[]; METRICS.cpuCache=m.cpu||[]; drawLine(latSvg, METRICS.latencyMsCache); drawLine(memSvg, METRICS.memoryCache); drawLine(cpuSvg, METRICS.cpuCache); }catch{}
    }catch{}
  }
  function drawLine(svg, arr){ if(!svg||!arr||!arr.length) return; const w=300,h=80; const max=Math.max(...arr,1); const step=arr.length>1?w/(arr.length-1):w; const d=arr.map((v,i)=>`${i?'L':'M'}${(i*step).toFixed(2)},${(h-(v/max)*h).toFixed(2)}`).join(' '); svg.innerHTML=`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" opacity="0.8"/>`; }
  function collectSeries(a){ return a.slice(-80); }
  $('#telRefresh')?.addEventListener('click', refreshTelemetry);
  if (document.getElementById('secTelemetry')) { refreshTelemetry(); setInterval(()=>{ if($('#d2Auto')?.checked) refreshTelemetry(); }, 20000); }

  // System page logic
  async function refreshSystem(){
    try { const s = await jget('/api/system'); if(!s) return; const upMin = Math.floor((s.uptimeMs||0)/60000); $('#sysUptime')?.textContent = upMin + 'm'; $('#sysDone')?.textContent = s.actionsProcessed; $('#sysQueued')?.textContent = s.queue?.queued ?? 0; $('#sysStore')?.textContent = s.sessionStore || ''; $('#sysPresence')?.textContent = `${s.presence?.status||''} ${s.presence?.activity||''}`.trim(); $('#sysQueueDetails')?.textContent = Object.entries(s.queue||{}).map(([k,v])=>`${k}:${v}`).join(' • '); }catch{}
  }
  $('#sysRefresh')?.addEventListener('click', refreshSystem);
  if (document.getElementById('secSystem')) { refreshSystem(); setInterval(()=>{ if($('#d2Auto')?.checked) refreshSystem(); }, 25000); }

  // Actions list + ack
  const actionsList = document.getElementById('d2Actions');
  async function refreshActions(){
    try{
      const data = await jget('/api/actions');
      if (!actionsList) return; actionsList.innerHTML='';
  // filter by selected guild if set
  const src = (data?.items||[]);
  const filtered = currentGuild ? src.filter(a=>a?.payload?.guildId===currentGuild) : src;
  for(const a of filtered.slice(-30).reverse()){
        const li = document.createElement('li'); li.className='act-item';
    const gtag = a?.payload?.guildId ? ` <span class="muted">(${a.payload.guildId})</span>` : '';
    li.innerHTML = `<span class="badge">${a.type}</span><span>${a.payload?.message||''}${gtag}</span><span class="muted">${a.status}</span>`;
  const btn = document.createElement('button'); btn.className='btn small'; btn.textContent='Ack done';
  btn.addEventListener('click', async ()=>{ try{ await jpatch(`/api/actions/${a.id}`, { status:'done' }); refreshActions(); }catch{} });
        li.appendChild(btn);
        actionsList.appendChild(li);
      }
    }catch{}
  }
  // initial wiring
  loadMeAndGuilds();
  refreshActions(); setInterval(refreshActions, 20000);
})();
