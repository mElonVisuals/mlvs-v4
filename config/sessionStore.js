import session from 'express-session';
import connectRedis from 'connect-redis';
import { createClient } from 'redis';

const RedisStore = connectRedis(session);

let store;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const useRedis = process.env.NODE_ENV === 'production' || process.env.REDIS_URL;

if (useRedis) {
  const client = createClient({ url: REDIS_URL });
  client.on('error', (err) => console.error('[redis] error', err));
  client.on('connect', () => console.log('[redis] connected'));
  client.on('reconnecting', () => console.log('[redis] reconnecting'));
  client.connect().catch(err => console.error('[redis] connect fail', err));
  store = new RedisStore({ client, prefix: 'sess:' });
} else {
  store = new session.MemoryStore();
}

export const sessionStore = store;
