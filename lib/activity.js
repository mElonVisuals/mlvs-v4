// Activity log with Redis persistence fallback to memory.
import { redisClient, isRedisReady } from '../config/redisClient.js';

const MAX_EVENTS = 500;
const MEM_EVENTS = [];
const REDIS_KEY = 'activity:events';

function serialize(ev){ return JSON.stringify(ev); }
function deserialize(str){ try { return JSON.parse(str); } catch { return null; } }

export async function addEvent(ev) {
  ev.id = ev.id || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  ev.ts = ev.ts || Date.now();
  if (isRedisReady()) {
    try {
      await redisClient.rPush(REDIS_KEY, serialize(ev));
      await redisClient.lTrim(REDIS_KEY, -MAX_EVENTS, -1);
    } catch (e) {
      MEM_EVENTS.push(ev); if (MEM_EVENTS.length > MAX_EVENTS) MEM_EVENTS.splice(0, MEM_EVENTS.length - MAX_EVENTS);
    }
  } else {
    MEM_EVENTS.push(ev); if (MEM_EVENTS.length > MAX_EVENTS) MEM_EVENTS.splice(0, MEM_EVENTS.length - MAX_EVENTS);
  }
  return ev;
}

export async function getRecent(limit = 50) {
  if (isRedisReady()) {
    try {
      const len = await redisClient.lLen(REDIS_KEY);
      if (len === 0) return [];
      const start = Math.max(0, len - limit);
      const data = await redisClient.lRange(REDIS_KEY, start, len);
      return data.map(deserialize).filter(Boolean).reverse();
    } catch { /* fall through */ }
  }
  return MEM_EVENTS.slice(-limit).reverse();
}

export async function prune(predicate) {
  if (isRedisReady()) {
    try {
      const all = await redisClient.lRange(REDIS_KEY, 0, -1);
      const kept = all.map(deserialize).filter(e=>e && !predicate(e));
      if (kept.length) {
        const pipeline = redisClient.multi();
        pipeline.del(REDIS_KEY);
        pipeline.rPush(REDIS_KEY, kept.map(serialize));
        await pipeline.exec();
      } else await redisClient.del(REDIS_KEY);
      return;
    } catch {/* ignore */}
  }
  let i = MEM_EVENTS.length; while (i--) { if (predicate(MEM_EVENTS[i])) MEM_EVENTS.splice(i,1); }
}

// Immediately add startup event
addEvent({ type: 'system', message: 'Dashboard started' });
