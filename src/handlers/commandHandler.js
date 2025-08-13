import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function loadCommands(client) {
  const base = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(base, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const cat of categories) {
    const catPath = path.join(base, cat);
    const files = fs.readdirSync(catPath).filter(f => f.endsWith('.js'));
    client.categories.set(cat, []);
    for (const file of files) {
  const cmdModule = await import(pathToFileURL(path.join(catPath, file)).href);
      const cmd = cmdModule.default || cmdModule;
      if (!cmd?.name || !cmd?.execute) continue;
      client.commands.set(cmd.name, cmd);
      client.categories.get(cat).push({ name: cmd.name, description: cmd.description || '', usage: cmd.usage || '' });
    }
  }
}
