import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function loadCommands(client) {
  const base = path.join(__dirname, '..', 'commands');
  const categories = [];

  // 1) Load root-level commands (backward compatible)
  if (fs.existsSync(base)) {
    const rootFiles = fs.readdirSync(base).filter(f => f.endsWith('.js'));
    if (rootFiles.length) client.categories.set('general', client.categories.get('general') || []);
    for (const file of rootFiles) {
      try {
        const mod = await import(pathToFileURL(path.join(base, file)).href);
        const cmd = mod.default || mod;
        if (!cmd?.name || !cmd?.execute) continue;
        client.commands.set(cmd.name, cmd);
        client.categories.get('general').push({ name: cmd.name, description: cmd.description || '', usage: cmd.usage || '' });
      } catch (e) {
  logger.error('commands', `Failed to load ${file}: ${e.message}`);
      }
    }
  }

  // 2) Load category folders
  const entries = fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const d of entries) {
    const cat = d.name;
    categories.push(cat);
    const catPath = path.join(base, cat);
    const files = fs.readdirSync(catPath).filter(f => f.endsWith('.js'));
    client.categories.set(cat, []);
    for (const file of files) {
      try {
        const mod = await import(pathToFileURL(path.join(catPath, file)).href);
        const cmd = mod.default || mod;
        if (!cmd?.name || !cmd?.execute) continue;
        client.commands.set(cmd.name, cmd);
        client.categories.get(cat).push({ name: cmd.name, description: cmd.description || '', usage: cmd.usage || '' });
      } catch (e) {
    logger.error('commands', `Failed to load ${cat}/${file}: ${e.message}`);
      }
    }
  }

  const total = client.commands.size;
  logger.success('commands', `Loaded ${total} commands across ${client.categories.size} categories.`);
}
