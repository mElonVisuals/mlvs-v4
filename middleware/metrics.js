import rateLimit from 'express-rate-limit';

const METRICS_SECRET = process.env.METRICS_SECRET || null;
const METRICS_TOKEN = process.env.METRICS_TOKEN || null;

export function verifyMetricsSecret(req, res, next){
  if (!METRICS_SECRET) {
    if (!verifyMetricsSecret._warned){
      console.warn('[metrics] METRICS_SECRET not set; /api/metrics not authenticated');
      verifyMetricsSecret._warned = true;
    }
    return next();
  }
  const header = req.get('x-metrics-secret') || req.get('authorization');
  let token = header || '';
  if (token.toLowerCase().startsWith('bearer ')) token = token.slice(7).trim();
  if (token === METRICS_SECRET) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

export function validateHeartbeatPayload(req, res, next){
  const b = req.body || {};
  const sanitized = {};
  const errors = [];
  function num(name, min, max){
    if (b[name] == null) return;
    const v = Number(b[name]);
    if (!Number.isFinite(v)) return errors.push(`${name}_nan`);
    if (v < min || v > max) return errors.push(`${name}_range`);
    sanitized[name] = v;
  }
  num('latencyMs', 0, 60000);
  num('memoryMB', 0, 1_000_000);
  num('cpu', 0, 100);
  num('guilds', 0, 10_000_000);
  num('users', 0, 1_000_000_000);
  if (errors.length) return res.status(400).json({ error: 'invalid_payload', details: errors });
  req.metricsSanitized = sanitized;
  next();
}

export function protectMetricsScrape(req, res, next){
  if (!METRICS_TOKEN) {
    if (!protectMetricsScrape._warned){
      console.warn('[metrics] METRICS_TOKEN not set; /metrics endpoint is public');
      protectMetricsScrape._warned = true;
    }
    return next();
  }
  const header = req.get('x-metrics-token') || req.get('authorization');
  let token = header || '';
  if (token.toLowerCase().startsWith('bearer ')) token = token.slice(7).trim();
  if (token === METRICS_TOKEN) return next();
  return res.status(401).send('unauthorized');
}

export const metricsRateLimit = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });

// Higher ceiling for activity ingest (command events). Configurable via ACTIVITY_INGEST_MAX_PER_MIN
export const activityIngestRateLimit = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.ACTIVITY_INGEST_MAX_PER_MIN || 120),
  standardHeaders: true,
  legacyHeaders: false
});

// Basic validator for activity events (currently command-focused)
export function validateActivityEvent(req, res, next){
  const p = req.body || {};
  const errors = [];
  if (!p.type) errors.push('missing_type');
  const type = String(p.type || '').toLowerCase();
  if (type !== 'command') {
    // Allow only command events for now (extend later as needed)
    errors.push('unsupported_type');
  }
  if (type === 'command') {
    if (!p.command) errors.push('missing_command');
    if (!p.user) errors.push('missing_user');
  }
  if (errors.length) return res.status(400).json({ error:'invalid_event', details: errors });
  // Normalize + sanitize
  const ev = {
    type,
    command: p.command ? String(p.command).slice(0,100) : undefined,
    user: p.user ? String(p.user).slice(0,100) : undefined,
    guild: p.guild ? String(p.guild).slice(0,150) : undefined,
    timestamp: (Number(p.timestamp) && Number(p.timestamp) > 0) ? Number(p.timestamp) : Date.now()
  };
  req.activityEventNormalized = ev;
  next();
}
