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

// basic request logger (very light) — must be after app is initialized
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[dash] ${req.method} ${req.url} -> ${res.statusCode} ${ms}ms`);
  });
  next();
});
const PORT = process.env.PORT || 3001;
const BRAND = {
  title: process.env.DASHBOARD_TITLE || 'Discord Bot',
  logoUrl: process.env.LOGO_URL || 'https://cdn.discordapp.com/attachments/1335734480253747297/1402442222816989346/logoglow.png?ex=689d281a&is=689bd69a&hm=1acf86e244991b170fcbd1a9b0e68e1a0f25423845fc36e6e7381df4ec36b8eb&',
  bannerUrl: process.env.BANNER_URL || 'https://cdn.discordapp.com/attachments/1335734480253747297/1402473578254962808/banner3.png?ex=689d454d&is=689bf3cd&hm=ead97252818d9c11ceea7650d0fffe8a783afe8c2d33abd1bdaff51f5c584207&'
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
    dashboardUrl: process.env.DASHBOARD_URL || `http://localhost:${PORT}`
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
