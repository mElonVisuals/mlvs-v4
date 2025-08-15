import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

let store;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const useRedis = process.env.NODE_ENV === 'production' || !!process.env.REDIS_URL;

if (useRedis) {
  const client = createClient({ url: REDIS_URL });
  client.on('error', (err) => console.error('[redis] error', err));
  client.on('connect', () => console.log('[redis] connected'));
  client.on('reconnecting', () => console.log('[redis] reconnecting'));
  // Fire and forget connect (Node 20 allows top-level await, but we keep non-blocking)
  client.connect().catch(err => {
    console.error('[redis] connect fail, falling back to MemoryStore', err);
  });
  try {
    store = new RedisStore({ client, prefix: 'sess:' });
  } catch (e) {
    console.error('[redis] store init failed, using MemoryStore', e);
    store = new session.MemoryStore();
  }
} else {
  store = new session.MemoryStore();
}

export const sessionStore = store;
