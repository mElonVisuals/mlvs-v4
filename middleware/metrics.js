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
