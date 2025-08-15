import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import os from 'os';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import { logger } from './utils/logger.js';

// Activity feed integration: POST command events to dashboard (fire-and-forget)
async function emitCommandActivity({ command, user, guild, timestamp }){
  try {
    const urlBase = process.env.DASHBOARD_URL || `http://localhost:${process.env.PORT || 3001}`;
    const secret = process.env.METRICS_SECRET || process.env.API_TOKEN || '';
    const headers = { 'Content-Type': 'application/json' };
    if (secret) headers['Authorization'] = `Bearer ${secret}`;
    const payload = { type:'command', command, user, guild, timestamp: timestamp || Date.now() };
    await fetch(`${urlBase}/api/activity/ingest`, { method:'POST', headers, body: JSON.stringify(payload) });
  } catch (e) {
    // Silently ignore to avoid impacting bot command flow
  }
}
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

logger.start('core', `Booting bot process (PID ${process.pid})`);
logger.info('core', `Env: PORT=${process.env.PORT || 3005}, PREFIX=${process.env.PREFIX || '!'}, LOG_LEVEL=${process.env.LOG_LEVEL || 'info'}`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();
client.categories = new Collection();

// Handlers
const handlersPath = path.join(__dirname, 'handlers');
const loadHandler = async (file) => (await import(pathToFileURL(path.join(handlersPath, file)).href)).default(client);
await loadHandler('commandHandler.js');
await loadHandler('eventHandler.js');

// Expose helper for message event to call after successful command
client._emitCommandActivity = emitCommandActivity;

// Shared status file for dashboard
const statusFile = path.join(process.cwd(), 'data', 'status.json');
function writeStatus(extra = {}) {
  const payload = {
    online: !!client?.user,
    bot: client?.user ? { id: client.user.id, tag: client.user.tag } : null,
    guilds: client?.guilds?.cache?.size || 0,
    users: client?.users?.cache?.size || 0,
    updatedAt: new Date().toISOString(),
    ...extra
  };
  try {
    fs.writeFileSync(statusFile, JSON.stringify(payload, null, 2));
  } catch {}
}

client.on('ready', () => {
  writeStatus();
  logger.banner('Discord Bot Started', [
    `User: ${client.user.tag}`,
    `Prefix: ${process.env.PREFIX || '!'}`,
    `Guilds: ${client.guilds.cache.size}`
  ]);
  // Start metrics heartbeat
  startMetricsLoop();
  // Start GitHub update notifier if configured
  try { startGithubNotifier(); } catch (e) { logger.error('github', `Notifier init failed: ${e?.message||e}`); }
});
client.on('guildCreate', () => writeStatus());
client.on('guildDelete', () => writeStatus());
client.on('guildMemberAdd', () => writeStatus());
client.on('guildMemberRemove', () => writeStatus());

logger.start('core', 'Logging in to Discord...');
client.login(process.env.DISCORD_TOKEN).then(() => {
  logger.success('core', 'Logged in.');
}).catch(err => {
  logger.error('core', `Login failed: ${err?.message || err}`);
});

// Metrics heartbeat
function startMetricsLoop(){
  const urlBase = process.env.DASHBOARD_URL || `http://localhost:${process.env.PORT || 3001}`;
  const token = process.env.API_TOKEN || '';
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const post = async (payload) => {
    try{
      await fetch(`${urlBase}/api/metrics`, { method:'POST', headers, body: JSON.stringify(payload) });
    }catch{}
  };
  setInterval(async () => {
    try{
      const latency = Math.round(client.ws.ping || 0);
      const memoryMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      const cpu = Math.min(100, Math.round((osLoad() || 0) * 100));
      await post({ latencyMs: latency, memoryMB, cpu });
      writeStatus();
    }catch{}
  }, Number(process.env.METRICS_INTERVAL_MS || 15000));
}

// GitHub update notifier
async function startGithubNotifier(){
  const repo = process.env.GITHUB_REPO; // e.g. owner/name
  const channelId = process.env.GITHUB_UPDATES_CHANNEL_ID; // target channel
  if (!repo || !channelId) return;
  const intervalMs = Number(process.env.GITHUB_POLL_INTERVAL_MS || 300000); // 5m default
  let lastSha = null;
  const headers = { 'Accept':'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  async function poll(){
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      // newest first
      const newest = data[0];
      if (!newest?.sha) return;
      if (!lastSha) { lastSha = newest.sha; return; } // seed without sending
      // find new commits since lastSha (reverse chronological)
      const idx = data.findIndex(c => c.sha === lastSha);
      const fresh = idx === -1 ? data : data.slice(0, idx);
      if (fresh.length){
        const channel = await client.channels.fetch(channelId).catch(()=>null);
        if (channel){
          for (const commit of fresh.reverse()){ // oldest first when sending
            const msg = `📦 New commit in ${repo}: **${commit.commit.message.split('\n')[0].slice(0,120)}**\n${commit.html_url}`;
            channel.send({ content: msg }).catch(()=>{});
          }
        }
        lastSha = newest.sha;
      }
    } catch (e) {
      logger.warn('github', `Poll failed: ${e?.message||e}`);
    }
  }
  setInterval(poll, intervalMs);
  // initial after slight delay to allow ready state
  setTimeout(poll, 10000);
  logger.info('github', `GitHub notifier active for ${repo} -> channel ${channelId} every ${intervalMs}ms`);
}

function osLoad(){
  try {
    const loads = os.loadavg?.();
    if (loads && loads.length) return loads[0] / (os.cpus?.().length || 1);
  } catch {}
  return 0.2; // safe default
}

// Polyfill fetch if needed (older Node versions)
if (typeof fetch === 'undefined') {
  const { default: nf } = await import('node-fetch');
  // @ts-ignore
  global.fetch = nf;
}
