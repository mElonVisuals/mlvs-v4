// System page module (refactored for new template IDs)
import { DBoardShared } from './dashboard-shared.js';

const API_SYSTEM = '/api/system';
let systemData = {};
let interval;

function qs(id){ return document.getElementById(id); }

// API contract: uptime (epoch ms or duration), memory, cpu, presence, queue, store, processes, logs
async function fetchSystem(){
  try {
    const res = await fetch(API_SYSTEM, { cache:'no-store' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    systemData = json || {};
  } catch(e){
    console.warn('System fetch failed; using mock if empty', e);
    if(!systemData.uptime) mockSeed();
  } finally {
    render();
  }
}

function mockSeed(){
  const now = Date.now();
  systemData = {
    uptime: now - (Math.random()*5+1)*86400000,
    memory:{ rss: 180*1024*1024, heapUsed:120*1024*1024, heapTotal:256*1024*1024 },
    cpu:{ load:(Math.random()*50).toFixed(1), cores:8 },
    presence:{ status:'online', guilds: 150+Math.floor(Math.random()*50), users: 5000+Math.floor(Math.random()*3000), channels: 800+Math.floor(Math.random()*200) },
    queue:{ pending: Math.floor(Math.random()*60), rate: (5+Math.random()*20).toFixed(1), wait: Math.floor(Math.random()*30)+5 },
    store:{ sessions: Math.floor(Math.random()*300), size: (5+Math.random()*30).toFixed(1)+'MB' },
    processes: Array.from({length:8},(_,i)=>({ pid:2200+i, name:'proc-'+i, cmd:'worker '+i, cpu:(Math.random()*20).toFixed(1), mem:(40+Math.random()*120).toFixed(1), status: Math.random()>0.1?'Running':'Stopped', uptime: Math.floor(Math.random()*240) })),
    services: ['Gateway','Database','Cache','Scheduler','Websocket'].map(n=>({ name:n, status: Math.random()>0.15?'running':'stopped', description:n+' service', port:3000+Math.floor(Math.random()*100), memory: Math.floor(Math.random()*120)+20, uptime: Math.floor(Math.random()*240) })),
    logs: Array.from({length:40},()=>({ ts:new Date(Date.now()-Math.random()*3600000), level:['info','warn','error','debug'][Math.floor(Math.random()*4)], source:['bot','dashboard','api','database'][Math.floor(Math.random()*4)], message:'Sample log entry'}))
  };
}

function fmtBytes(b){ if(!b) return '0'; const u=['B','KB','MB','GB']; let i=0; while(b>1024 && i<u.length-1){ b/=1024; i++; } return b.toFixed(1)+u[i]; }

function setText(id,val){ const el=qs(id); if(el) el.textContent = val; }

function render(){
  if(!qs('secSystem')) return;
  // Uptime
  if(systemData.uptime){ setText('sysUptime', DBoardShared.formatDuration(Date.now()-systemData.uptime)); }
  // Actions / queue / store (if present - mapping older IDs)
  if(systemData.queue){ setText('sysQueued', systemData.queue.pending); setText('queuePending', systemData.queue.pending); setText('queueRate', systemData.queue.rate+' /min'); setText('queueWaitTime', systemData.queue.wait? systemData.queue.wait+'s':'—'); }
  if(systemData.store){ setText('sysActiveSessions', systemData.store.sessions); setText('sysStoreSize', systemData.store.size); }
  if(systemData.presence){
    setText('botGuilds', systemData.presence.guilds); setText('botUsers', systemData.presence.users); setText('botChannels', systemData.presence.channels);
    setText('botStatus', systemData.presence.status);
  }
  // Processes table
  const pBody = qs('processesTableBody');
  if(pBody && Array.isArray(systemData.processes)){
    pBody.innerHTML = systemData.processes.map(p=>`<tr><td><input type="checkbox" value="${p.pid}" class="process-checkbox"/></td><td>${p.name||p.cmd}</td><td><code>${p.pid}</code></td><td>${p.cpu}%</td><td>${p.mem}MB</td><td><span class="service-status ${p.status?.toLowerCase()}">${p.status}</span></td><td>${p.uptime}h</td><td><button class="btn mini secondary" data-act="restart" data-pid="${p.pid}">R</button><button class="btn mini danger" data-act="kill" data-pid="${p.pid}">K</button></td></tr>`).join('');
  }
  // Services grid
  const sGrid = qs('servicesGrid');
  if(sGrid && Array.isArray(systemData.services)){
    sGrid.innerHTML = systemData.services.map(s=>`<div class="service-card"><div class="service-header"><div class="service-name">${s.name}</div><div class="service-status ${s.status}">${s.status}</div></div><p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-3);">${s.description}</p><div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--text-muted);"><span>Port: ${s.port}</span><span>Mem: ${s.memory}MB</span><span>Up: ${s.uptime}h</span></div></div>`).join('');
  }
  // Logs
  const logsEl = qs('logsContent');
  if(logsEl && Array.isArray(systemData.logs)){
    logsEl.innerHTML = systemData.logs.slice(0,300).map(l=>`<div class="log-entry"><div class="log-timestamp">${l.ts.toLocaleTimeString()}</div><div class="log-level ${l.level}">${l.level}</div><div class="log-message">[${l.source}] ${l.message}</div></div>`).join('');
  }
  DBoardShared.injectIcons();
}

function bind(){
  qs('sysRefresh')?.addEventListener('click', fetchSystem);
  qs('clearLogs')?.addEventListener('click', ()=>{ systemData.logs=[]; render(); });
  qs('downloadLogs')?.addEventListener('click', ()=>{
    const blob = new Blob([ (systemData.logs||[]).map(l=>`[${l.ts.toISOString()}] ${l.level.toUpperCase()} ${l.source}: ${l.message}`).join('\n') ], { type:'text/plain'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='system-logs.txt'; a.click();
  });
}

export function initSystem(){
  if(!qs('secSystem')) return;
  bind();
  fetchSystem();
  interval = setInterval(fetchSystem, 60000);
}

document.addEventListener('DOMContentLoaded', initSystem);
