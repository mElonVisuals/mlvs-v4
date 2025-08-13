import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// global fetch exists in Node 18+. If missing, dynamically import node-fetch.
if (typeof fetch === 'undefined') {
  const { default: nf } = await import('node-fetch');
  global.fetch = nf;
}
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3001;
const computedInvite = (() => {
  const direct = process.env.INVITE_URL;
  if (direct) return direct;
  const cid = process.env.CLIENT_ID;
  if (!cid) return null;
  const perms = process.env.INVITE_PERMS || '8';
  const scopes = encodeURIComponent('bot applications.commands');
  return `https://discord.com/api/oauth2/authorize?client_id=${cid}&permissions=${perms}&scope=${scopes}`;
})();
const BRAND = {
  title: process.env.DASHBOARD_TITLE || 'Discord Bot',
  subtitle: process.env.DASHBOARD_SUBTITLE || 'A clean, modern Discord bot with a live dashboard.',
  logoUrl: process.env.LOGO_URL || 'https://cdn.discordapp.com/attachments/1335734480253747297/1402442222816989346/logoglow.png?ex=689d281a&is=689bd69a&hm=1acf86e244991b170fcbd1a9b0e68e1a0f25423845fc36e6e7381df4ec36b8eb&',
  bannerUrl: process.env.BANNER_URL || 'https://cdn.discordapp.com/attachments/1335734480253747297/1402473578254962808/banner3.png?ex=689d454d&is=689bf3cd&hm=ead97252818d9c11ceea7650d0fffe8a783afe8c2d33abd1bdaff51f5c584207&',
  homeBannerUrl: process.env.HOMEPAGE_BANNER_URL || 'https://cdn.discordapp.com/attachments/1335734480253747297/1405178445079646400/web-banner3.png?ex=689de1e8&is=689c9068&hm=4df7140240de653274a6add71ad3457e18405d04c8a70a53388ac725bf6ce6d9&',
  supportUrl: process.env.SUPPORT_SERVER_URL || null,
  githubUrl: process.env.GITHUB_URL || 'https://github.com/mElonVisuals/mlvs-v4',
  inviteUrl: computedInvite,
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

function readStatus() {
  const statusPath = path.join(process.cwd(), 'data', 'status.json');
  try {
    if (fs.existsSync(statusPath)) {
      const raw = fs.readFileSync(statusPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch {}
  return { online: false, guilds: 0, users: 0 };
}

// Homepage
app.get('/', (req, res) => {
  const status = readStatus();
  res.render('home', {
    brand: BRAND,
    botName: status?.bot?.tag || BRAND.title,
    status: status?.online ? 'Online' : 'Offline',
  dashboardUrl: process.env.DASHBOARD_URL || `http://localhost:${PORT}`,
  guilds: status?.guilds || 0,
  users: status?.users || 0,
  });
});

// Dashboard (stats)
app.get('/dashboard', (req, res) => {
  const status = readStatus();
  res.render('index', {
    brand: BRAND,
    botName: status?.bot?.tag || BRAND.title,
    status: status?.online ? 'Online' : 'Offline',
    guilds: status?.guilds || 0,
    users: status?.users || 0,
    updatedAt: status?.updatedAt || null
  });
});

app.get('/api/status', (req, res) => {
  res.json(readStatus());
});

// Invite redirect if available
app.get('/invite', (req, res) => {
  if (BRAND.inviteUrl) return res.redirect(BRAND.inviteUrl);
  res.status(404).send('Invite not configured');
});

// simple passthrough for logo from CDN to avoid mixed content/CORS surprises in some setups
app.get('/logo.png', async (req, res) => {
  try {
    const logoUrl = 'https://cdn.discordapp.com/attachments/1335734480253747297/1402442222816989346/logoglow.png?ex=689d281a&is=689bd69a&hm=1acf86e244991b170fcbd1a9b0e68e1a0f25423845fc36e6e7381df4ec36b8eb&';
    const r = await fetch(logoUrl);
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'image/png');
    res.send(buf);
  } catch {
    res.status(404).end();
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[dash] Listening on 0.0.0.0:${PORT} (health: /api/status)`);
});
