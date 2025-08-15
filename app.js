import express from 'express';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import os from 'os';
import dotenv from 'dotenv';
import passport from 'passport';
import helmet from 'helmet';
import csrf from 'csurf';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import homeRoutes from './routes/home.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import { attachUserLocals } from './middleware/auth.js';
import { validateEnv, printEnvSummary } from './config/envCheck.js';
import expressLayouts from 'express-ejs-layouts';
import { createLogger } from './config/logger.js';
import { sessionStore } from './config/sessionStore.js';
import client from 'prom-client';
import { protectMetricsScrape, metricsRateLimit } from './middleware/metrics.js';
import { getRecent, addEvent } from './lib/activity.js';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const logger = createLogger();
app.set('trust proxy', 1); // behind Dokploy / reverse proxy

// Validate required env vars
const REQUIRED = ['DISCORD_TOKEN','DISCORD_CLIENT_ID','DISCORD_CLIENT_SECRET','SESSION_SECRET','DISCORD_CALLBACK_URL'];
if (!validateEnv(REQUIRED)) {
  console.error('[startup] Aborting due to missing env');
  process.exit(1);
}
printEnvSummary(REQUIRED);

app.set('view engine', 'ejs');
// Primary views directory now centralized under /views
app.set('views', [path.join(process.cwd(), 'views'), path.join(process.cwd())]);
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Prometheus metrics setup (must be before logging middleware uses them)
client.collectDefaultMetrics();
const httpRequestsTotal = new client.Counter({ name:'http_requests_total', help:'Total HTTP requests', labelNames:['method','status'] });
const httpRequestDuration = new client.Histogram({ name:'http_request_duration_seconds', help:'Request duration', buckets:[0.01,0.05,0.1,0.3,0.5,1,2,5] });

// Request logging + metrics recording
app.use((req,res,next)=>{
  const start = process.hrtime.bigint();
  res.on('finish', ()=>{
    const durMs = Number(process.hrtime.bigint() - start)/1_000_000;
    logger.info({ method:req.method, url:req.originalUrl, status:res.statusCode, ms:durMs.toFixed(1) }, 'req');
    httpRequestsTotal.inc({ method: req.method, status: String(res.statusCode) });
    httpRequestDuration.observe(durMs/1000);
  });
  next();
});
app.use(compression());
// Dynamic CSP nonce per response for future inline removal
app.use((req,res,next)=>{ res.locals.cspNonce = Buffer.from(crypto.randomBytes(16)).toString('base64'); next(); });
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", 'cdn.jsdelivr.net'],
      'style-src': ["'self'", 'fonts.googleapis.com', 'cdn.jsdelivr.net'],
      'font-src': ["'self'", 'fonts.gstatic.com', 'fonts.googleapis.com', 'data:'],
      'img-src': ["'self'", 'cdn.discordapp.com', 'data:'],
      'connect-src': ["'self'", 'ws:', 'wss:'],
      'frame-ancestors': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'upgrade-insecure-requests': []
    }
  }
}));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));

// Sessions (Redis in production, fallback MemoryStore in dev)
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  rolling: true,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 30, // 30m idle
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Absolute session lifetime (24h)
app.use((req,res,next)=>{
  if (req.session) {
    const now = Date.now();
    if (!req.session.__issuedAt) req.session.__issuedAt = now;
    else if (now - req.session.__issuedAt > 1000*60*60*24) { // >24h
      req.session.destroy(()=>{});
      return res.redirect('/login');
    }
  }
  next();
});

app.use(passport.initialize());
app.use(passport.session());
app.use(attachUserLocals);
// CSRF protection (skip safe methods & OAuth callback path)
const csrfProtection = csrf();
app.use((req,res,next)=>{
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  if (req.path === '/callback') return next();
  return csrfProtection(req,res,next);
});
app.use((req,res,next)=>{ if (req.csrfToken) { try { res.locals.csrfToken = req.csrfToken(); } catch {} } next(); });

// Rate limiters
app.use('/api/', rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }));
app.use('/login', rateLimit({ windowMs: 60_000, max: 10 }));
app.use('/callback', rateLimit({ windowMs: 60_000, max: 20 }));

// Static assets
app.use('/home/css', express.static(path.join(process.cwd(), 'home', 'css')));
app.use('/home/js', express.static(path.join(process.cwd(), 'home', 'js')));
app.use('/dashboard/css', express.static(path.join(process.cwd(), 'dashboard', 'css')));
app.use('/dashboard/js', express.static(path.join(process.cwd(), 'dashboard', 'js')));
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Root redirect
app.get('/', (req, res) => res.redirect('/home'));

// Routes
app.use(homeRoutes);
app.use(authRoutes);
app.use(dashboardRoutes);

// Health (public, lightweight)
app.get('/healthz', (req,res)=>res.json({ ok:true, uptime:process.uptime(), ts:Date.now() }));

// 404 handler
app.use((req, res) => {
  res.status(404);
  if (req.accepts('html')) return res.render('error-404', { layout: 'layout', title: 'Not Found' });
  if (req.accepts('json')) return res.json({ error: 'Not Found' });
  res.type('txt').send('Not Found');
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error({ err }, 'unhandled');
  const status = err.status || 500;
  res.status(status);
  const view = status === 401 ? 'error-401' : status === 403 ? 'error-403' : status === 404 ? 'error-404' : 'error-500';
  if (req.accepts('html')) return res.render(view, { layout: 'layout', title: 'Error', error: err });
  if (req.accepts('json')) return res.json({ error: err.message || 'Server Error' });
  res.type('txt').send(err.message || 'Server Error');
});

const PORT = process.env.PORT || 3005;
// Wrap server to attach Socket.IO
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
const httpServer = createServer(app);
const io = new IOServer(httpServer, { cors: { origin: process.env.CORS_ORIGIN?.split(',') || '*'} });
app.set('io', io);
io.on('connection', (socket)=>{
  socket.emit('hello', { ts: Date.now() });
  // Send initial recent activity snapshot
  try { socket.emit('activity', getRecent(25)); } catch {}
});
httpServer.listen(PORT, () => console.log(`[web] listening on ${PORT}`));

// Periodic metrics emission (status + system) leveraging existing status.json + os module
const statusPath = path.join(process.cwd(), 'data', 'status.json');
setInterval(()=>{
  try {
    let status = {};
    if (fs.existsSync(statusPath)) status = JSON.parse(fs.readFileSync(statusPath,'utf8'));
    const payload = {
      type: 'metrics',
      ts: Date.now(),
      status,
      system: {
        load: os.loadavg?.()[0] || 0,
        memUsed: os.totalmem() - os.freemem(),
        memTotal: os.totalmem(),
        uptime: os.uptime()
      }
    };
    io.emit('metrics', payload);
  } catch {}
}, Number(process.env.LIVE_METRICS_INTERVAL_MS || 10000));

// Expose Prometheus metrics endpoint
app.get('/metrics', metricsRateLimit, protectMetricsScrape, async (req,res)=>{
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (e) {
    res.status(500).end();
  }
});
