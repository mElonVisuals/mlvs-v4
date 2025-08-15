import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

function readPublicStatus(){
  try {
    const p = path.join(process.cwd(), 'data', 'status.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p,'utf8'));
  } catch {}
  return { guilds: 0, users: 0, updatedAt: null };
}

router.get(['/','/home'], (req, res) => {
  const stats = readPublicStatus();
  res.render('home/index', { stats });
});

router.get('/home/features', (req, res) => {
  res.render('home/features');
});

router.get('/home/invite', (req, res) => {
  res.render('home/invite');
});

export default router;
