import { Router } from 'express';
import { ensureAuth, ensureApiAuth } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import url from 'url';
import { verifyMetricsSecret, validateHeartbeatPayload } from '../middleware/metrics.js';

const router = Router();

// Ensure the /views directory is included in Express' view lookup paths (without editing app.js)
router.use((req, res, next) => {
  const rootViews = req.app.get('views');
  const additional = path.join(process.cwd(), 'views');
  if (Array.isArray(rootViews)) {
    if (!rootViews.includes(additional)) req.app.set('views', [...rootViews, additional]);
  } else {
    // rootViews is a string (current single directory). Preserve it while adding our new one.
    if (rootViews !== additional) req.app.set('views', [rootViews, additional]);
  }
  if (typeof res.locals.title === 'undefined') res.locals.title = 'Dashboard';
  if (req.user && !res.locals.user) res.locals.user = req.user;
  next();
});

function readStatus(){
  try {
    const p = path.join(process.cwd(), 'data', 'status.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p,'utf8'));
  } catch {}
  return { online:false, guilds:0, users:0 };
}

router.get('/dashboard', ensureAuth, (req, res) => {
  res.render('dashboard-overview', { layout: 'layout', status: readStatus(), title: 'Overview' });
});
router.get('/dashboard/activity', ensureAuth, (req, res) => {
  res.render('dashboard-activity', { layout: 'layout', title: 'Live Activity' });
});
router.get('/dashboard/system', ensureAuth, (req, res) => {
  res.render('dashboard-system', { layout: 'layout', title: 'System Stats' });
});
router.get('/dashboard/commands', ensureAuth, (req, res) => {
  res.render('dashboard-commands', { layout: 'layout', title: 'Commands' });
});

// API endpoints (sample)
router.get('/api/status', (req, res) => {
  res.json(readStatus());
});

router.post('/api/metrics', verifyMetricsSecret, validateHeartbeatPayload, (req, res) => {
  try {
    const body = req.body || {};
    const statusPath = path.join(process.cwd(), 'data', 'status.json');
    const current = readStatus();
  const merged = { ...current, ...body, ...req.metricsSanitized, updatedAt: new Date().toISOString() };
    fs.writeFileSync(statusPath, JSON.stringify(merged, null, 2));
    // Emit via socket if available
    try { req.app.get('io')?.emit('metrics', { type:'metrics', ts:Date.now(), status: merged }); } catch {}
    return res.json({ ok:true });
  } catch (e) {
    return res.status(500).json({ error: 'metrics_update_failed' });
  }
});

router.get('/api/commands', (req, res) => {
  try {
    const cmdsRoot = path.join(process.cwd(), 'src', 'commands');
    if (!fs.existsSync(cmdsRoot)) return res.json([]);
    const results = [];
    function walk(dir){
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full);
        else if (/\.m?js$/.test(entry)) {
          try {
            const modUrl = url.pathToFileURL(full).href;
            // Dynamic import metadata (cached by Node). NOTE: executes module; safe since bot already does.
            // We only read exported fields (name, description, usage, category).
            // eslint-disable-next-line no-await-in-loop
            const mod = requireLike(modUrl);
            const name = mod.name || path.basename(entry, path.extname(entry));
            results.push({
              name,
              description: mod.description || '',
              usage: mod.usage || name,
              category: deriveCategory(full, cmdsRoot)
            });
          } catch {}
        }
      }
    }
    function deriveCategory(file, root){
      const rel = path.relative(root, file).split(path.sep);
      return rel.length > 1 ? rel[0] : 'root';
    }
    function requireLike(href){
      // Using dynamic import sync wrapper is complex; for simplicity we use cached Node module via eval import sync barrier.
      // We'll use dynamic import (async) with deasync-like pattern by accumulating promises then respond.
      // Here we just return an empty object; replaced below.
      return {};
    }
    // Async dynamic collects
    const promises = [];
    function walkAsync(dir){
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walkAsync(full);
        else if (/\.m?js$/.test(entry)) {
          const modUrl = url.pathToFileURL(full).href;
          promises.push(import(modUrl).then(mod => {
            const name = mod.name || path.basename(entry, path.extname(entry));
            results.push({
              name,
              description: mod.description || '',
              usage: mod.usage || name,
              category: deriveCategory(full, cmdsRoot)
            });
          }).catch(()=>{}));
        }
      }
    }
    walkAsync(cmdsRoot);
    Promise.all(promises).then(()=>{
      res.json(results.sort((a,b)=> a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
    });
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_commands' });
  }
});

router.get('/api/system', (req, res) => {
  const load = os.loadavg?.() || [];
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  res.json({
    uptime: os.uptime(),
    processUptime: process.uptime(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    load1: load[0] || 0,
    load5: load[1] || 0,
    load15: load[2] || 0,
    memory: {
      total: memTotal,
      free: memFree,
      used: memTotal - memFree,
      usedPercent: +( ( (memTotal - memFree) / memTotal ) * 100 ).toFixed(2)
    },
    cpus: os.cpus().slice(0,4).map(c=>({ model: c.model, speed: c.speed })),
    timestamp: Date.now()
  });
});

export default router;
