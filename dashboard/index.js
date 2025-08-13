import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
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
app.use(express.json());
// Sessions for OAuth2
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_session_secret_change_me';
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 3001;
const DASH_URL = process.env.DASHBOARD_URL || `http://localhost:${PORT}`;
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

// Passport Discord OAuth2
const DISCORD_CLIENT_ID = process.env.CLIENT_ID || process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_CALLBACK_URL = process.env.CALLBACK_URL || `${DASH_URL}/auth/callback`;

if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET) {
  passport.use(new DiscordStrategy({
    clientID: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    callbackURL: DISCORD_CALLBACK_URL,
    scope: ['identify', 'guilds'],
  }, (accessToken, refreshToken, profile, done) => {
    // Minimal user object in session
    const user = {
      id: profile.id,
      username: profile.username,
      discriminator: profile.discriminator,
      avatar: profile.avatar,
      guilds: (profile.guilds || []).map(g => ({ id: g.id, name: g.name, permissions: g.permissions, icon: g.icon }))
    };
    return done(null, user);
  }));
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
}

function ensureAuth(req, res, next) {
  if (!DISCORD_CLIENT_ID) return next(); // if OAuth not configured, don't block during dev
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.redirect('/auth/discord');
}

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

// In-memory extras for demo; replace with real data sources as needed
let ACTIVITY = [];
let METRICS = { latencyMs: [], memoryMB: [], cpu: [] };
let ACTIONS = [];
let PRESENCE = { status: 'online', activity: '' };

// optional bearer token auth for mutating endpoints
const API_TOKEN = process.env.API_TOKEN || null;
function requireToken(req, res, next) {
  if (!API_TOKEN) return next();
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (token && token === API_TOKEN) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

function loadCommands() {
  const root = path.join(process.cwd(), 'src', 'commands');
  const out = {};
  try {
    if (!fs.existsSync(root)) return out;
    const walk = (dir, categoryHint) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const it of items) {
        const full = path.join(dir, it.name);
        if (it.isDirectory()) {
          walk(full, it.name);
        } else if (it.isFile() && it.name.endsWith('.js')) {
          if (/help\.js$/i.test(it.name)) continue; // skip help
          const rel = path.relative(root, full).replace(/\\/g, '/');
          const cat = categoryHint || rel.split('/')[0] || 'misc';
          const src = fs.readFileSync(full, 'utf8');
          const mName = src.match(/export\s+const\s+name\s*=\s*['"`]([^'"`]+)['"`]/);
          const mDesc = src.match(/export\s+const\s+description\s*=\s*['"`]([^'"`]+)['"`]/);
          const mUsage = src.match(/export\s+const\s+usage\s*=\s*['"`]([^'"`]+)['"`]/);
          const name = mName?.[1] || it.name.replace(/\.js$/, '');
          const description = mDesc?.[1] || '';
          const usage = mUsage?.[1] || name;
          if (!out[cat]) out[cat] = [];
          out[cat].push({ name, description, usage, path: rel });
        }
      }
    };
    walk(root);
    // sort
    for (const k of Object.keys(out)) out[k].sort((a,b)=>a.name.localeCompare(b.name));
  } catch {}
  return out;
}

// Homepage
app.get('/', (req, res) => {
  const status = readStatus();
  const commands = loadCommands();
  res.render('home', {
    brand: BRAND,
    botName: status?.bot?.tag || BRAND.title,
    status: status?.online ? 'Online' : 'Offline',
  dashboardUrl: process.env.DASHBOARD_URL || `http://localhost:${PORT}`,
  guilds: status?.guilds || 0,
  users: status?.users || 0,
    commands,
  });
});

// Dashboard (stats)
app.get('/dashboard', ensureAuth, (req, res) => {
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

// Bot metrics (time-series, capped)
app.get('/api/metrics', (req, res) => {
  res.json({
    latencyMs: METRICS.latencyMs.slice(-120),
    memoryMB: METRICS.memoryMB.slice(-120),
    cpu: METRICS.cpu.slice(-120),
    updatedAt: new Date().toISOString(),
  });
});

app.post('/api/metrics', requireToken, (req, res) => {
  const { latencyMs, memoryMB, cpu } = req.body || {};
  const push = (arr, v) => { if (typeof v === 'number' && !Number.isNaN(v)) { arr.push(v); if (arr.length > 300) arr.splice(0, arr.length - 300); } };
  push(METRICS.latencyMs, Number(latencyMs));
  push(METRICS.memoryMB, Number(memoryMB));
  push(METRICS.cpu, Number(cpu));
  res.json({ ok: true, sizes: { latency: METRICS.latencyMs.length, memory: METRICS.memoryMB.length, cpu: METRICS.cpu.length } });
});

// Recent activity feed
app.get('/api/activity', (req, res) => {
  res.json({ items: ACTIVITY.slice(-50) });
});

// Push activity (example; secure with token)
app.post('/api/activity', requireToken, (req, res) => {
  const { type, message, meta } = req.body || {};
  const item = { id: Date.now().toString(36), type: type || 'info', message: message || '', meta: meta || null, ts: new Date().toISOString() };
  ACTIVITY.push(item);
  if (ACTIVITY.length > 200) ACTIVITY = ACTIVITY.slice(-200);
  res.json({ ok: true, item });
});

// Commands list (re-uses loadCommands)
app.get('/api/commands', (req, res) => {
  res.json({ commands: loadCommands() });
});

// Me (authenticated user + guilds)
app.get('/api/me', (req, res) => {
  if (!(req.isAuthenticated && req.isAuthenticated())) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: req.user || null });
});

// Presence endpoints
app.get('/api/presence', (req, res) => {
  res.json({ presence: PRESENCE });
});
app.post('/api/presence', requireToken, (req, res) => {
  const { status, activity } = req.body || {};
  if (status) PRESENCE.status = String(status);
  if (typeof activity === 'string') PRESENCE.activity = activity;
  ACTIVITY.push({ id: Date.now().toString(36), type: 'presence', message: `Presence set: ${PRESENCE.status} ${PRESENCE.activity||''}`.trim(), ts: new Date().toISOString() });
  if (ACTIVITY.length > 200) ACTIVITY = ACTIVITY.slice(-200);
  res.json({ ok: true, presence: PRESENCE });
});

// Actions queue (announce example)
app.post('/api/actions/announce', requireToken, (req, res) => {
  const { guildId, channelId, message } = req.body || {};
  if (!guildId || !channelId || !message) return res.status(400).json({ error: 'Missing guildId/channelId/message' });
  const action = { id: Date.now().toString(36), type: 'announce', payload: { guildId, channelId, message }, ts: new Date().toISOString(), status: 'queued' };
  ACTIONS.push(action);
  ACTIVITY.push({ id: action.id, type: 'action', message: `Queued announce to ${guildId}/${channelId}`, ts: action.ts });
  if (ACTIVITY.length > 200) ACTIVITY = ACTIVITY.slice(-200);
  res.json({ ok: true, action });
});
app.get('/api/actions', (req, res) => {
  res.json({ items: ACTIONS });
});

app.patch('/api/actions/:id', requireToken, (req, res) => {
  const { id } = req.params;
  const { status, result } = req.body || {};
  const item = ACTIONS.find(a => a.id === id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (!['queued','processing','done','failed'].includes(status)) return res.status(400).json({ error: 'Bad status' });
  item.status = status;
  if (result !== undefined) item.result = result;
  item.updatedAt = new Date().toISOString();
  ACTIVITY.push({ id: `${id}-ack`, type: 'action', message: `Action ${id} -> ${status}`, ts: item.updatedAt });
  if (ACTIVITY.length > 200) ACTIVITY = ACTIVITY.slice(-200);
  res.json({ ok: true, item });
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

// OAuth routes
if (DISCORD_CLIENT_ID) {
  app.get('/auth/discord', passport.authenticate('discord'));
  app.get('/auth/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/dashboard');
  });
  app.get('/logout', (req, res, next) => {
    if (req.logout) {
      req.logout(err => {
        if (err) return next(err);
        res.redirect('/');
      });
    } else {
      res.redirect('/');
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[dash] Listening on 0.0.0.0:${PORT} (health: /api/status)`);
});
