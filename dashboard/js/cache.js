// IndexedDB + in-memory state cache for metrics & activity
(function(){
  const DB_NAME='mlvs-cache'; const DB_VERSION=1; let db; const state={ metrics:{}, activity:[] };
  window.__appState = state;
  function openDB(){ return new Promise((res,rej)=>{ const req=indexedDB.open(DB_NAME, DB_VERSION); req.onerror=()=>rej(req.error); req.onupgradeneeded=()=>{ const d=req.result; if(!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); }; req.onsuccess=()=>{ db=req.result; res(db); }; }); }
  function put(key,val){ if(!db) return; const tx=db.transaction('kv','readwrite'); tx.objectStore('kv').put(val,key); }
  function get(key){ return new Promise(r=>{ if(!db) return r(undefined); const tx=db.transaction('kv'); const req=tx.objectStore('kv').get(key); req.onsuccess=()=>r(req.result); req.onerror=()=>r(undefined); }); }
  openDB().then(async ()=>{
    const m = await get('metrics'); if(m) { state.metrics = m; document.dispatchEvent(new CustomEvent('state:rehydrated',{ detail:'metrics'})); }
    const a = await get('activity'); if(a) { state.activity = a; document.dispatchEvent(new CustomEvent('state:rehydrated',{ detail:'activity'})); }
  });
  document.addEventListener('metrics:update', ()=>{ put('metrics', state.metrics); });
  document.addEventListener('activity:update', ()=>{ put('activity', state.activity.slice(-500)); });
})();
