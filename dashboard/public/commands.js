// Commands page module (refactored to match current template DOM)
import { DBoardShared } from './dashboard-shared.js';

const API_COMMANDS = '/api/commands';
let commands = [];
let filtered = [];
let view = 'grid';

function qs(id){ return document.getElementById(id); }

const els = {
  grid: qs('commandsGrid'),
  list: qs('commandsList'),
  empty: qs('commandsEmpty'),
  loading: qs('commandsLoading'),
  search: qs('commandSearch'),
  clearSearch: qs('clearSearch'),
  category: qs('categoryFilter'),
  status: qs('statusFilter'),
  sort: qs('sortBy'),
  gridBtn: qs('gridView'),
  listBtn: qs('listView'),
  total: qs('totalCommands'),
  enabled: qs('enabledCommands'),
  today: qs('usageToday'),
  refresh: qs('refreshCommands')
};

// Expected API: { commands:[ { name, category, description, usageCount, enabled, premium, cooldown, lastUsed, responseTime } ] }
async function fetchCommands(){
  try {
    els.loading && (els.loading.style.display='flex');
    const res = await fetch(API_COMMANDS, { cache:'no-store' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    if(Array.isArray(json.commands)) {
      commands = json.commands.map(c => ({
        ...c,
        lastUsed: c.lastUsed ? new Date(c.lastUsed) : null,
        usageCount: c.usageCount ?? c.usage ?? Math.floor(Math.random()*500)
      }));
      applyFilters();
    }
  } catch(e){
    console.warn('Commands fetch failed; seeding mock if empty', e);
    if(commands.length===0) mockSeed(30);
  } finally {
    els.loading && (els.loading.style.display='none');
  }
}

function mockSeed(n){
  const cats = ['moderation','music','utility','fun','admin'];
  for(let i=0;i<n;i++){
    commands.push({
      name: (i%5===0?'/':'/') + 'cmd'+i,
      category: cats[i%cats.length],
      description: 'Mock command '+i,
      usageCount: Math.floor(Math.random()*4000),
      enabled: Math.random()>0.1,
      premium: Math.random()>0.85,
      cooldown: Math.floor(Math.random()*15),
      lastUsed: new Date(Date.now() - Math.random()*86400000*5),
      responseTime: +(50+Math.random()*150).toFixed(0)
    });
  }
  applyFilters();
}

function applyFilters(){
  const q = (els.search?.value||'').toLowerCase();
  const cat = els.category?.value || '';
  const status = els.status?.value || '';
  filtered = commands.filter(c => {
    if(q && !(c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))) return false;
    if(cat && c.category !== cat) return false;
    if(status){
      if(status==='enabled' && !c.enabled) return false;
      if(status==='disabled' && c.enabled) return false;
      if(status==='premium' && !c.premium) return false;
    }
    return true;
  });
  sort();
  render();
  updateStats();
}

function sort(){
  const val = els.sort?.value || 'name';
  filtered.sort((a,b)=>{
    switch(val){
      case 'usage': return (b.usageCount||0) - (a.usageCount||0);
      case 'category': return (a.category||'').localeCompare(b.category||'');
      case 'recent': return (b.lastUsed?.getTime()||0) - (a.lastUsed?.getTime()||0);
      default: return a.name.localeCompare(b.name);
    }
  });
}

function badge(text, cls){ return `<span class="badge ${cls||''}">${text}</span>`; }

function card(c){
  return `<div class="command-card ${c.enabled?'':'is-disabled'}">
    <div class="command-card-head">
      <h4 class="command-name">${c.name}</h4>
      <div class="command-flags">
        ${c.enabled?badge('Enabled','success'):badge('Disabled','danger')}
        ${c.premium?badge('Premium','warning'):''}
      </div>
    </div>
    <p class="command-desc">${c.description||''}</p>
    <div class="command-meta">
      <span>${c.category||'-'}</span>
      <span>${c.cooldown||0}s cd</span>
      <span>${c.usageCount||0} uses</span>
      <span>${c.responseTime||0}ms</span>
      <span>${c.lastUsed?DBoardShared.relativeTime(c.lastUsed):'—'}</span>
    </div>
  </div>`;
}

function listRow(c){
  return `<div class="command-row ${c.enabled?'':'is-disabled'}">
    <span class="cr-name">${c.name}</span>
    <span class="cr-cat">${c.category||'-'}</span>
    <span class="cr-uses">${c.usageCount||0}</span>
    <span class="cr-last">${c.lastUsed?DBoardShared.relativeTime(c.lastUsed):'—'}</span>
    <span class="cr-status">${c.enabled?badge('On','success'):badge('Off','danger')}${c.premium?badge('P','warning'):''}</span>
  </div>`;
}

function render(){
  if(!els.grid || !els.list) return;
  if(filtered.length===0){
    els.grid.innerHTML='';
    els.list.innerHTML='';
    els.empty && (els.empty.style.display='block');
    return;
  }
  els.empty && (els.empty.style.display='none');
  if(view==='grid'){
    els.grid.style.display='grid';
    els.list.style.display='none';
    els.grid.innerHTML = filtered.slice(0,400).map(card).join('');
  } else {
    els.grid.style.display='none';
    els.list.style.display='block';
    els.list.innerHTML = `<div class="command-row head"><span>Name</span><span>Category</span><span>Uses</span><span>Last</span><span>Status</span></div>` + filtered.slice(0,600).map(listRow).join('');
  }
  DBoardShared.injectIcons();
}

function updateStats(){
  els.total && (els.total.textContent = commands.length);
  els.enabled && (els.enabled.textContent = commands.filter(c=>c.enabled).length);
  // rough "today" metric: lastUsed within 24h
  const dayAgo = Date.now()-86400000;
  els.today && (els.today.textContent = commands.filter(c=>c.lastUsed && c.lastUsed.getTime()>dayAgo).length);
}

function toggleView(next){
  view = next;
  els.gridBtn?.classList.toggle('active', view==='grid');
  els.listBtn?.classList.toggle('active', view==='list');
  render();
}

function bind(){
  els.search?.addEventListener('input', ()=>{ els.clearSearch && (els.clearSearch.style.display = els.search.value ? 'inline-flex':'none'); applyFilters(); });
  els.clearSearch?.addEventListener('click', ()=> { els.search.value=''; els.clearSearch.style.display='none'; applyFilters(); });
  els.category?.addEventListener('change', applyFilters);
  els.status?.addEventListener('change', applyFilters);
  els.sort?.addEventListener('change', ()=>{ sort(); render(); });
  els.gridBtn?.addEventListener('click', ()=> toggleView('grid'));
  els.listBtn?.addEventListener('click', ()=> toggleView('list'));
  els.refresh?.addEventListener('click', fetchCommands);
}

export function initCommands(){
  if(!qs('secCommands')) return; // ensure on page
  bind();
  fetchCommands();
  // periodic refresh
  setInterval(fetchCommands, 120000);
}

document.addEventListener('DOMContentLoaded', initCommands);
