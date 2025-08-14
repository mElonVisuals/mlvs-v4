// Activity page module
import { DBoardShared } from './dashboard-shared.js';

const API_ACTIVITY = '/api/activity';
let ws;
let activityData = [];
let filteredData = [];
let activityInterval;

function qs(id){ return document.getElementById(id); }
const elements = {
  list: qs('d2Activity'),
  empty: qs('activityEmpty'),
  loading: qs('activityLoading'),
  count: qs('activityCount'),
  rate: qs('activityRate')
};

const activityTypes = {
  command: { icon: '<span class="ui-icon" data-icon="commands"></span>', title:'Command Executed' },
  join: { icon: '<span class="ui-icon" data-icon="hand-wave"></span>', title:'User Joined' },
  leave: { icon: '<span class="ui-icon" data-icon="hand-wave"></span>', title:'User Left' },
  message: { icon: '<span class="ui-icon" data-icon="stats"></span>', title:'Message Sent' },
  error: { icon: '<span class="ui-icon" data-icon="warning"></span>', title:'Error Occurred' },
  warning: { icon: '<span class="ui-icon" data-icon="warning"></span>', title:'Warning' }
};

// Expected API contract:
// GET /api/activity returns { activities: [ { id, type, message, server, user, timestamp } ] }
async function fetchActivity(){
  try {
    const res = await fetch(API_ACTIVITY);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    if(Array.isArray(json.activities)) {
      activityData = json.activities.map(a => ({ ...a, timestamp:new Date(a.timestamp)}));
      applyFilters();
      updateStats();
      DBoardShared.injectIcons();
    }
  } catch(e){ console.warn('Activity fetch failed, fallback to mock once', e); if(activityData.length===0) mockSeed(10); }
}

function mockSeed(n){
  for(let i=0;i<n;i++){ activityData.push({ id:Date.now()+Math.random(), type:'command', message:'Mock event', server:'Server', user:'User', timestamp:new Date(Date.now()-Math.random()*3600000) }); }
  applyFilters(); updateStats();
}

function createItem(a){
  const li = document.createElement('li');
  li.className='activity-item';
  li.dataset.id=a.id; li.dataset.type=a.type;
  const cfg = activityTypes[a.type]||{};
  li.innerHTML = `<div class="activity-icon">${cfg.icon||''}</div><div class="activity-content"><div class="activity-header"><span class="activity-title">${cfg.title||a.type}</span><span class="activity-time" title="${a.timestamp.toLocaleString()}">${DBoardShared.relativeTime(a.timestamp)}</span></div><div class="activity-description">${a.message||''}</div><div class="activity-meta"><span>Server: ${a.server||'-'}</span><span>User: ${a.user||'-'}</span></div></div>`;
  return li;
}

function render(){
  elements.loading.style.display='none';
  if(filteredData.length===0){ elements.list.style.display='none'; elements.empty.style.display='block'; return; }
  elements.empty.style.display='none'; elements.list.style.display='block';
  elements.list.innerHTML='';
  filteredData.slice(0,100).forEach(a=> elements.list.appendChild(createItem(a)));
}

function updateStats(){
  elements.count.textContent = filteredData.length;
  const hourAgo = Date.now()-3600000; const recent = activityData.filter(a=>a.timestamp.getTime()>hourAgo); elements.rate.textContent = (recent.length/60).toFixed(1)+"/min";
}

function applyFilters(){
  const typeVal = qs('activityFilter')?.value || '';
  const srvVal = qs('serverFilter')?.value || '';
  const range = qs('timeRange')?.value || '24h';
  const ranges = { '1h':3600000, '6h':21600000, '24h':86400000, '7d':604800000 };
  const cutoff = Date.now() - (ranges[range]||86400000);
  filteredData = activityData.filter(a => (!typeVal || a.type===typeVal) && (!srvVal || a.server===srvVal) && a.timestamp.getTime()>=cutoff);
  render();
}

function bindEvents(){
  ['activityFilter','serverFilter','timeRange'].forEach(id=> qs(id)?.addEventListener('change', ()=>{ applyFilters(); updateStats(); }));
  qs('actRefresh')?.addEventListener('click', ()=> fetchActivity());
  qs('clearActivity')?.addEventListener('click', ()=> { activityData=[]; filteredData=[]; render(); updateStats(); });
}

function connectWS(){
  try {
    ws = new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws/activity');
    ws.onmessage = ev => {
      try { const msg = JSON.parse(ev.data); if(msg.type==='activity'){ const a=msg.data; a.timestamp=new Date(a.timestamp); activityData.unshift(a); if(activityData.length>500) activityData.pop(); applyFilters(); updateStats(); DBoardShared.injectIcons(); } } catch(e){ console.warn('Bad WS payload', e); }
    };
    ws.onclose = ()=> setTimeout(connectWS, 5000);
  } catch(e){ console.warn('WS connect failed', e); }
}

export function initActivity(){
  bindEvents();
  fetchActivity();
  connectWS();
  activityInterval = setInterval(fetchActivity, 60000); // periodic fallback
}

document.addEventListener('DOMContentLoaded', ()=>{ if(document.getElementById('secActivity')) initActivity(); });
