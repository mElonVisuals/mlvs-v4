import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const shouldUse = process.env.NODE_ENV === 'production' || !!process.env.REDIS_URL;

export let redisReady = false;
export const redisClient = shouldUse ? createClient({ url: REDIS_URL }) : null;

if (redisClient) {
  redisClient.on('error', err => { console.error('[redis-activity] error', err?.message || err); });
  redisClient.on('connect', () => { console.log('[redis-activity] connected'); });
  redisClient.on('ready', () => { redisReady = true; console.log('[redis-activity] ready'); });
  redisClient.connect().catch(e => console.error('[redis-activity] connect failed', e?.message || e));
}

export function isRedisReady(){ return redisReady && redisClient; }
