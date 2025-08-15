import express from 'express';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';
import passport from 'passport';
import helmet from 'helmet';
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // behind Dokploy / reverse proxy

// Validate required env vars
const REQUIRED = ['DISCORD_TOKEN','DISCORD_CLIENT_ID','DISCORD_CLIENT_SECRET','SESSION_SECRET','DISCORD_CALLBACK_URL'];
if (!validateEnv(REQUIRED)) {
  console.error('[startup] Aborting due to missing env');
  process.exit(1);
}
printEnvSummary(REQUIRED);

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd()));
app.use(expressLayouts); // we'll specify layout per-render for dashboard pages only

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));

// Sessions (MemoryStore not for production)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(attachUserLocals);

// Rate limiter
app.use('/api/', rateLimit({ windowMs: 60_000, max: 60 }));

// Static assets
app.use('/home/css', express.static(path.join(process.cwd(), 'home', 'css')));
app.use('/home/js', express.static(path.join(process.cwd(), 'home', 'js')));
app.use('/dashboard/css', express.static(path.join(process.cwd(), 'dashboard', 'css')));
app.use('/dashboard/js', express.static(path.join(process.cwd(), 'dashboard', 'js')));

// Root redirect
app.get('/', (req, res) => res.redirect('/home'));

// Routes
app.use(homeRoutes);
app.use(authRoutes);
app.use(dashboardRoutes);

// Health (public, lightweight)
app.get('/healthz', (req,res)=>res.json({ ok:true, uptime:process.uptime(), ts:Date.now() }));

// 404
app.use((req, res) => {
  res.status(404).send('Not Found');
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`[web] listening on ${PORT}`));
