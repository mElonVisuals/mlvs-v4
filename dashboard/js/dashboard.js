(function(){
  // Correlation ID for this page lifetime (propagates via fetch headers)
  if(!window.__corrId) window.__corrId = (crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36)+Math.random().toString(36).slice(2,10)));

  // Activate current nav
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(a=>{ if (path === a.getAttribute('data-active-path')) a.classList.add('active'); });
  document.querySelector('.sidebar-toggle')?.addEventListener('click',()=>{ document.querySelector('.sidebar')?.classList.toggle('open'); });

  // Number animation helpers
  const activeTweens = new Map();
  function animateNumber(el, from, to, opts={}){
    if (from === to || typeof to !== 'number' || isNaN(to)) { el.textContent = to; return; }
    const duration = opts.duration || 650; const start = performance.now(); const formatter = opts.formatter || (n=> n.toLocaleString());
    if (activeTweens.has(el)) cancelAnimationFrame(activeTweens.get(el));
    function frame(now){ const t = Math.min(1, (now - start)/duration); const eased = (--t)*t*t + 1; const val = from + (to-from)*eased; el.textContent = formatter(Math.round(val)); if (now - start < duration) { const raf = requestAnimationFrame(frame); activeTweens.set(el, raf); } else { el.textContent = formatter(to); activeTweens.delete(el); } }
    const raf = requestAnimationFrame(frame); activeTweens.set(el, raf);
  }
  function pulse(el, cls){ if(!el) return; el.classList.remove('metric-change-up','metric-change-down','metric-pulse'); void el.offsetWidth; el.classList.add(cls); setTimeout(()=> el.classList.remove(cls), 1200); }
  const lastValues = {};
  function applyMetrics(d){ for (const [k,vRaw] of Object.entries(d)){ if (vRaw==null) continue; const el = document.querySelector(`[data-metric="${k}"]`); if(!el) continue; const isNumber = typeof vRaw === 'number'; if(isNumber){ const prev=lastValues[k]; const v=vRaw; if(typeof prev==='number'){ if(v!==prev){ animateNumber(el, prev, v); pulse(el, v>prev?'metric-change-up':'metric-change-down'); } } else { el.textContent = v.toLocaleString(); } lastValues[k]=v; } else { el.textContent=vRaw; lastValues[k]=vRaw; } } }
  function syncMetricsState(){ if(window.__appState){ Object.assign(window.__appState.metrics, lastValues); document.dispatchEvent(new Event('metrics:update')); } }

  async function loadInitial(){ try { const r = await fetch('/api/status', { headers:{ 'X-Correlation-Id': window.__corrId }}); if(r.ok){ applyMetrics(await r.json()); syncMetricsState(); } } catch {}
    try { const r2 = await fetch('/api/activity', { headers:{ 'X-Correlation-Id': window.__corrId }}); if(r2.ok){ renderActivity(await r2.json()); } } catch {}
  }
  loadInitial(); document.addEventListener('spa:navigated', loadInitial);

  // Socket.IO live metrics & activity
  try { const s=document.createElement('script'); s.src='/socket.io/socket.io.js'; s.onload=()=>{ const socket=io(); socket.on('metrics', data=>{ if(data?.status) applyMetrics(data.status); if(data?.system){ applyMetrics(data.system); updateSystemVisuals(data.system); } syncMetricsState(); }); socket.on('activity', payload=>{ if(Array.isArray(payload)&&payload.length) mergeActivity(payload); }); }; document.head.appendChild(s); } catch{}

  function ensureRings(){ if(document.querySelector('.sys-rings')) return; const panel=document.querySelector('.system-panel'); if(!panel) return; const wrap=document.createElement('div'); wrap.className='sys-rings'; wrap.innerHTML=['cpu','memory'].map(kind=>`<div class="ring" data-ring="${kind}"><svg viewBox="0 0 120 120" class="ring-svg"><circle cx="60" cy="60" r="54" class="ring-bg" /><circle cx="60" cy="60" r="54" class="ring-fg" stroke-dasharray="339.292" stroke-dashoffset="339.292" /></svg><div class="ring-label">${kind.toUpperCase()}</div><div class="ring-value" data-ring-value="${kind}">--</div></div>`).join(''); panel.appendChild(wrap); wrap.querySelectorAll('.ring').forEach(r=>{ const name=r.getAttribute('data-ring'); r.setAttribute('role','img'); r.setAttribute('aria-label', name==='cpu'?'CPU load ring':'Memory usage ring'); }); }
  ensureRings();
  function updateSystemVisuals(sys){ ensureRings(); const cpu = typeof sys.load1==='number'? Math.min(1, sys.load1 / (navigator.hardwareConcurrency||4)) : 0; const memUsed = sys.memUsed || ((sys.memTotal||0) - (sys.memFree||0)); const memTotal = sys.memTotal || (memUsed||1); const mem = memTotal ? memUsed / memTotal : 0; const fmtBytes=b=>{ if(!b||isNaN(b)) return '--'; const units=['B','KB','MB','GB','TB']; let u=0,val=b; while(val>=1024&&u<units.length-1){val/=1024;u++;} return `${val.toFixed(val>=100||u===0?0:1)} ${units[u]}`; }; const memUsedEl=document.querySelector('[data-metric="memUsed"]'); if(memUsedEl) memUsedEl.textContent=fmtBytes(memUsed); const memTotalEl=document.querySelector('[data-metric="memTotal"]'); if(memTotalEl) memTotalEl.textContent=fmtBytes(memTotal); setRing('cpu', cpu, (cpu*100).toFixed(0)+'%'); setRing('memory', mem, (mem*100).toFixed(0)+'%'); }
  function setRing(name, frac, label){ const el=document.querySelector(`[data-ring="${name}"] .ring-fg`); const valEl=document.querySelector(`[data-ring-value="${name}"]`); if(!el) return; const CIRC=2*Math.PI*54; const target=CIRC*(1-Math.max(0,Math.min(1,frac))); el.style.transition='stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)'; requestAnimationFrame(()=>{ el.style.strokeDashoffset=target; }); if(valEl) valEl.textContent=label; }

  // Reveal animations
  const revealObserver=('IntersectionObserver' in window)? new IntersectionObserver(entries=>{ entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('revealed'); revealObserver.unobserve(e.target); } }); }, { threshold:0.15 }) : null;
  document.querySelectorAll('.panel, .stat, .ring').forEach(el=>{ if(revealObserver) revealObserver.observe(el); });

  function addTilt(el){ const rect=()=>el.getBoundingClientRect(); el.addEventListener('mousemove', ev=>{ const r=rect(); const x=(ev.clientX-r.left)/r.width - 0.5; const y=(ev.clientY-r.top)/r.height - 0.5; el.style.transform=`perspective(800px) rotateX(${(-y*6).toFixed(2)}deg) rotateY(${(x*6).toFixed(2)}deg) translateY(-2px)`; }); el.addEventListener('mouseleave', ()=>{ el.style.transform='perspective(800px) translateY(0)'; }); }
  document.querySelectorAll('.stat, .panel').forEach(addTilt);
  document.querySelectorAll('.stat, .panel').forEach(el=>{ el.tabIndex=0; el.addEventListener('focus', ()=> el.classList.add('focus-visible')); el.addEventListener('blur', ()=>{ el.classList.remove('focus-visible'); el.style.transform='perspective(800px) translateY(0)'; }); });

  // Activity feed with virtualization
  const activityEl=document.getElementById('recent-activity');
  const activityCache = window.__appState ? window.__appState.activity : [];
  function renderActivity(list){ if(!activityEl) return; activityEl.innerHTML=''; list.forEach(ev=> activityCache.push(ev)); const slice=activityCache.slice(-120); slice.forEach(ev=> appendActivity(ev,true)); document.dispatchEvent(new Event('activity:update')); }
  function appendActivity(ev, appendEnd){ const div=document.createElement('div'); const isError= ev.meta?.status==='error' || /❌/.test(ev.message||''); const durationRaw = (typeof ev.meta?.duration==='number')? ev.meta.duration : (typeof ev.duration==='number'? ev.duration : null); const durClass= durationRaw!=null ? durationClassFor(durationRaw):''; div.className='activity-item'+(isError?' activity-error':'')+(durClass?' '+durClass:''); const ts=new Date(ev.ts||Date.now()).toLocaleTimeString(); const icon = ev.type==='command' ? (isError?'⚠️':'💬') : (ev.type==='heartbeat' ? '💓':'🛈'); const durationLabel = durationRaw != null ? `${durationRaw}ms` : ''; const tooltip=buildTooltip(ev, durationRaw, isError); div.setAttribute('data-tooltip', tooltip); div.innerHTML=`<span class="activity-time">[${ts}]</span> <span class="activity-icon">${icon}</span> <span class="activity-text">${escapeHtml(ev.message || ev.type)}</span>${durationLabel?` <span class="activity-duration">${durationLabel}</span>`:''}`; div.dataset.type=ev.type||'unknown'; if(appendEnd) activityEl.appendChild(div); else activityEl.prepend(div); while(activityEl.children.length>150) activityEl.removeChild(activityEl.lastChild); }
  function durationClassFor(ms){ if(ms<50) return 'dur-fast'; if(ms<150) return 'dur-ok'; if(ms<400) return 'dur-warn'; return 'dur-slow'; }
  function buildTooltip(ev,duration,isError){ try { const parts=[]; parts.push(`Type: ${ev.type}`); if(ev.meta?.command) parts.push(`Command: ${ev.meta.command}`); if(ev.meta?.user) parts.push(`User: ${ev.meta.user}`); if(ev.meta?.guild) parts.push(`Guild: ${ev.meta.guild}`); if(duration!=null) parts.push(`Duration: ${duration}ms`); if(ev.meta?.status) parts.push(`Status: ${ev.meta.status}`); return parts.join('\n'); } catch { return ''; } }
  function escapeHtml(str){ return String(str).replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
  function mergeActivity(arr){ if(!activityEl) return; let pruned=false; arr.forEach(ev=> activityCache.push(ev)); arr.slice(-50).forEach(ev=> appendActivity(ev,false)); if(activityCache.length>1000){ activityCache.splice(0, activityCache.length-1000); pruned=true; } applyActivityFilter(currentFilter); document.dispatchEvent(new Event('activity:update')); if(pruned) pruneDOM(); }
  function pruneDOM(){ if(!activityEl) return; while(activityEl.children.length>200) activityEl.removeChild(activityEl.lastChild); }

  // Filtering
  let currentFilter='all'; const filterBar=document.querySelector('.activity-filters');
  function applyActivityFilter(filter){ currentFilter=filter; document.querySelectorAll('.activity-filters .chip').forEach(ch=> ch.classList.toggle('chip-active', ch.dataset.activityFilter===filter)); if(!activityEl) return; Array.from(activityEl.children).forEach(child=>{ const t=child.dataset.type||'unknown'; child.style.display = (filter==='all'||filter===t)?'':'none'; }); }
  filterBar?.addEventListener('click',e=>{ const btn=e.target.closest('[data-activity-filter]'); if(!btn) return; applyActivityFilter(btn.dataset.activityFilter); });
  applyActivityFilter('all');

  document.addEventListener('state:rehydrated', e=>{ if(e.detail==='activity' && activityCache.length && activityEl && !activityEl.children.length){ renderActivity(activityCache.slice(-150)); } else if (e.detail==='metrics') { applyMetrics(window.__appState.metrics||{}); syncMetricsState(); } });
})();
