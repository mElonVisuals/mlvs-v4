(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const tokenInput = $('#apiToken');
  const saveTokenBtn = $('#saveToken');
  const store = {
    get token(){ try{ return localStorage.getItem('apiToken')||'' }catch{ return '' } },
    set token(v){ try{ localStorage.setItem('apiToken', v||'') }catch{} }
  };
  if (tokenInput) tokenInput.value = store.token;
  if (saveTokenBtn) saveTokenBtn.addEventListener('click', ()=>{ store.token = tokenInput.value; saveTokenBtn.textContent='Saved'; setTimeout(()=>saveTokenBtn.textContent='Save', 900); });

  async function jget(url){ const h={ 'cache':'no-store' }; return fetch(url,h).then(r=>r.json()); }
  async function jpost(url, body){
    const headers = { 'Content-Type':'application/json' };
    if (store.token) headers['Authorization'] = 'Bearer '+store.token;
    const r = await fetch(url, { method:'POST', headers, body: JSON.stringify(body||{}) });
    if (!r.ok) throw new Error('HTTP '+r.status); return r.json();
  }

  // Status + stats
  async function refreshStatus(){
    try{
      const s = await jget('/api/status');
      const online = !!s?.online; $('#d2Status')?.classList.toggle('green', online); $('#d2Status')?.classList.toggle('red', !online); $('#d2Status').textContent = online ? 'Online' : 'Offline';
      $('#d2Guilds').textContent = String(s?.guilds ?? 0);
      $('#d2Users').textContent = String(s?.users ?? 0);
      $('#d2Updated').textContent = s?.updatedAt || '—';
      $('#d2Bot').textContent = s?.bot?.tag || '—';
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
  $('#d2Refresh')?.addEventListener('click', ()=>{ refreshStatus(); refreshMetrics(); refreshCommands(); refreshActivity(); });
  if ($('#d2Auto')){ setInterval(()=>{ if ($('#d2Auto').checked){ refreshStatus(); refreshMetrics(); refreshActivity(); } }, 15000); }

  // initial
  refreshStatus(); refreshMetrics(); refreshCommands(); refreshActivity();
})();
