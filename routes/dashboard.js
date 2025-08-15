import { Router } from 'express';
import { ensureAuth, ensureApiAuth } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';

const router = Router();

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

export default router;
