export function validateEnv(required = []) {
  const missing = [];
  for (const key of required) {
    if (!process.env[key] || !String(process.env[key]).trim()) missing.push(key);
  }
  if (missing.length) {
    console.error('[env] Missing required environment variables:', missing.join(', '));
    return false;
  }
  return true;
}

export function printEnvSummary(keys){
  console.log('[env] Summary');
  for (const k of keys){
    const val = process.env[k];
    if (val) console.log(` - ${k}=${mask(val)}`);
  }
  if (process.env.REDIS_URL) {
    const v = process.env.REDIS_URL;
    const masked = v.length <= 10 ? '***' : v.slice(0,5)+'***'+v.slice(-3);
    console.log(`- REDIS_URL=${masked}`);
  }
}
function mask(v){
  if (!v) return 'unset';
  if (v.length <= 6) return '*'.repeat(v.length);
  return v.slice(0,3) + '***' + v.slice(-3);
}
