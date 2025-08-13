import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

client.on('ready', () => writeStatus());
client.on('guildCreate', () => writeStatus());
client.on('guildDelete', () => writeStatus());
client.on('guildMemberAdd', () => writeStatus());
client.on('guildMemberRemove', () => writeStatus());

client.login(process.env.DISCORD_TOKEN);
